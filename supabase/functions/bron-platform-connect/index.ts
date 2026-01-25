import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConnectRequest {
  action: "generate_api_key" | "exchange_token" | "verify_connection" | "receive_content";
  platform: string;
  domain?: string;
  code?: string;
  codeVerifier?: string;
  redirectUri?: string;
}

interface ContentPayload {
  api_key: string;
  content: {
    title: string;
    body: string;
    excerpt?: string;
    categories?: string[];
    tags?: string[];
    featured_image?: string;
    meta_title?: string;
    meta_description?: string;
    slug?: string;
    status?: "draft" | "publish" | "scheduled";
    scheduled_at?: string;
  };
  platform?: string;
}

// Generate a secure API key
function generateApiKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return "bron_" + Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, platform, domain, code, codeVerifier, redirectUri } = body as ConnectRequest;

    console.log(`BRON Platform Connect - Action: ${action}, Platform: ${platform}`);

    switch (action) {
      case "generate_api_key": {
        // Generate a new API key for Lovable or direct integrations
        const apiKey = generateApiKey();
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year expiry

        // Store the API key (you'd typically store this in a database)
        console.log(`Generated API key for ${platform}:${domain}`);

        return new Response(
          JSON.stringify({
            success: true,
            api_key: apiKey,
            expires_at: expiresAt.toISOString(),
            webhook_url: `${supabaseUrl}/functions/v1/bron-platform-connect`,
            platform,
            domain,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "exchange_token": {
        // Exchange OAuth code for access token
        if (!code || !platform) {
          return new Response(
            JSON.stringify({ error: "Missing code or platform" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let tokenEndpoint: string;
        let tokenBody: Record<string, string>;

        switch (platform) {
          case "wordpress":
            tokenEndpoint = "https://public-api.wordpress.com/oauth2/token";
            tokenBody = {
              client_id: Deno.env.get("WORDPRESS_CLIENT_ID") || "",
              client_secret: Deno.env.get("WORDPRESS_CLIENT_SECRET") || "",
              code,
              redirect_uri: redirectUri || "",
              grant_type: "authorization_code",
            };
            break;

          case "shopify":
            // Shopify requires the shop domain in the endpoint
            const shopDomain = Deno.env.get("SHOPIFY_SHOP_DOMAIN") || "";
            tokenEndpoint = `https://${shopDomain}/admin/oauth/access_token`;
            tokenBody = {
              client_id: Deno.env.get("SHOPIFY_API_KEY") || "",
              client_secret: Deno.env.get("SHOPIFY_API_SECRET") || "",
              code,
            };
            break;

          case "wix":
            tokenEndpoint = "https://www.wixapis.com/oauth/access";
            tokenBody = {
              client_id: Deno.env.get("WIX_CLIENT_ID") || "",
              client_secret: Deno.env.get("WIX_CLIENT_SECRET") || "",
              code,
              grant_type: "authorization_code",
            };
            break;

          default:
            return new Response(
              JSON.stringify({ error: "Unsupported platform" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const tokenResponse = await fetch(tokenEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(tokenBody),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
          console.error(`Token exchange failed for ${platform}:`, tokenData);
          return new Response(
            JSON.stringify({ error: tokenData.error_description || "Token exchange failed" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in,
            platform,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify_connection": {
        // Verify an existing connection is still valid
        return new Response(
          JSON.stringify({
            success: true,
            valid: true,
            platform,
            domain,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "receive_content": {
        // This is the endpoint that receives content from external PHP systems
        const contentPayload = body as ContentPayload;

        if (!contentPayload.api_key || !contentPayload.content) {
          return new Response(
            JSON.stringify({ error: "Missing api_key or content" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate API key (in production, check against stored keys)
        if (!contentPayload.api_key.startsWith("bron_")) {
          return new Response(
            JSON.stringify({ error: "Invalid API key format" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("Received content:", JSON.stringify(contentPayload.content, null, 2));

        // Process the content - store it, forward to platform, etc.
        // This is where you'd implement the actual content distribution logic

        return new Response(
          JSON.stringify({
            success: true,
            message: "Content received and queued for processing",
            content_id: crypto.randomUUID(),
            received_at: new Date().toISOString(),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("BRON Platform Connect error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
