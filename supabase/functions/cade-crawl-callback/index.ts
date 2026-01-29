import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CrawlCallbackPayload {
  domain: string;
  request_id?: string;
  user_id?: string;
  status?: string;
  progress?: number;
  pages_crawled?: number;
  total_pages?: number;
  current_url?: string;
  error?: string;
  completed_at?: string;
  started_at?: string;
  message?: string;
  [key: string]: unknown;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[CADE Callback] Received request:", req.method);

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: CrawlCallbackPayload = await req.json();
    console.log("[CADE Callback] Payload received:", JSON.stringify(payload, null, 2));

    const {
      domain,
      request_id,
      user_id,
      status,
      progress,
      pages_crawled,
      total_pages,
      current_url,
      error,
      message,
    } = payload;

    if (!domain) {
      console.error("[CADE Callback] Missing domain in payload");
      return new Response(
        JSON.stringify({ error: "Missing domain in payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the crawl status update
    const { data, error: dbError } = await supabase
      .from("cade_crawl_events")
      .insert({
        domain,
        request_id,
        user_id,
        status: status || "update",
        progress,
        pages_crawled,
        total_pages,
        current_url,
        error_message: error,
        message,
        raw_payload: payload,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[CADE Callback] Database error:", dbError);
      // Still return success to CADE - we don't want to block their process
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: "Callback received but storage failed",
          received: { domain, request_id, status }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[CADE Callback] Successfully stored event:", data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: data?.id,
        received: { domain, request_id, status, progress }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[CADE Callback] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
