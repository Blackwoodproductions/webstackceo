import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateDataStreamRequest {
  propertyId: string;
  domain: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("[GA DataStream] Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's OAuth tokens
    const { data: oauthToken, error: tokenError } = await supabase
      .from("oauth_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .maybeSingle();

    if (tokenError || !oauthToken) {
      console.error("[GA DataStream] No OAuth token found:", tokenError);
      return new Response(
        JSON.stringify({ error: "Google OAuth token not found. Please reconnect your Google account." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accessToken = oauthToken.access_token;

    // Check if token is expired and refresh if needed
    const expiresAt = new Date(oauthToken.expires_at);
    if (expiresAt < new Date() && oauthToken.refresh_token) {
      console.log("[GA DataStream] Token expired, refreshing...");
      
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
      
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: oauthToken.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const refreshData = await refreshResponse.json();
      
      if (!refreshResponse.ok) {
        console.error("[GA DataStream] Token refresh failed:", refreshData);
        return new Response(
          JSON.stringify({ error: "Failed to refresh Google token. Please reconnect your Google account." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      accessToken = refreshData.access_token;

      // Update token in database
      await supabase
        .from("oauth_tokens")
        .update({
          access_token: refreshData.access_token,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq("user_id", user.id)
        .eq("provider", "google");
    }

    // Parse request body
    const body = await req.json() as CreateDataStreamRequest;
    const { propertyId, domain } = body;

    if (!propertyId || !domain) {
      return new Response(
        JSON.stringify({ error: "Missing propertyId or domain" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize domain
    const normalizedDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");

    console.log(`[GA DataStream] Creating data stream for property ${propertyId}, domain: ${normalizedDomain}`);

    // First, check if a data stream already exists for this domain
    const listStreamsUrl = `https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}/dataStreams`;
    
    const listResponse = await fetch(listStreamsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (listResponse.ok) {
      const listData = await listResponse.json();
      const existingStream = listData.dataStreams?.find((stream: any) => {
        if (stream.webStreamData?.defaultUri) {
          const streamDomain = stream.webStreamData.defaultUri
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .replace(/\/$/, "");
          return streamDomain.toLowerCase() === normalizedDomain.toLowerCase();
        }
        return false;
      });

      if (existingStream) {
        console.log("[GA DataStream] Data stream already exists:", existingStream.name);
        return new Response(
          JSON.stringify({
            success: true,
            existing: true,
            dataStream: {
              name: existingStream.name,
              displayName: existingStream.displayName,
              measurementId: existingStream.webStreamData?.measurementId,
              defaultUri: existingStream.webStreamData?.defaultUri,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create new data stream
    const createUrl = `https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}/dataStreams`;
    
    const createResponse = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "WEB_DATA_STREAM",
        displayName: normalizedDomain,
        webStreamData: {
          defaultUri: `https://${normalizedDomain}`,
        },
      }),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      console.error("[GA DataStream] Create failed:", createData);
      return new Response(
        JSON.stringify({ 
          error: createData.error?.message || "Failed to create data stream",
          details: createData.error,
        }),
        { status: createResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[GA DataStream] Created successfully:", createData);

    return new Response(
      JSON.stringify({
        success: true,
        existing: false,
        dataStream: {
          name: createData.name,
          displayName: createData.displayName,
          measurementId: createData.webStreamData?.measurementId,
          defaultUri: createData.webStreamData?.defaultUri,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[GA DataStream] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
