import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// CADE sends different payload formats for different tasks
interface CrawlCallbackPayload {
  task?: string;  // "CRAWL", "CATEGORIZATION", etc.
  status?: string;  // "running", "completed", "failed"
  data?: {
    domain?: string;
    message?: string;
    progress?: number;
    pages_crawled?: number;
    total_pages?: number;
    current_url?: string;
    error?: string;
    [key: string]: unknown;
  };
  // Also support flat structure for backwards compatibility
  domain?: string;
  request_id?: string;
  user_id?: string;
  progress?: number;
  pages_crawled?: number;
  total_pages?: number;
  current_url?: string;
  error?: string;
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
    console.log("[CADE Callback] Raw payload received:", JSON.stringify(payload, null, 2));

    // Extract domain from either nested data object or top-level
    const data = payload.data || {};
    const task = payload.task || "CRAWL";
    const status = payload.status || "update";
    
    // Extract request_id first - we may need it to look up the domain
    const request_id = payload.request_id ?? (data as Record<string, unknown>).request_id as string | undefined;
    const user_id = payload.user_id ?? (data as Record<string, unknown>).user_id as string | undefined;
    const target_request_id = (payload as Record<string, unknown>).target_request_id ?? 
                               (data as Record<string, unknown>).target_request_id as string | undefined;
    
    // Extract domain - try multiple sources
    let domain = payload.domain || data.domain;
    
    // If no domain but we have target_request_id, extract domain from it (format: crawl-domain-timestamp)
    if (!domain && target_request_id && typeof target_request_id === "string") {
      const match = target_request_id.match(/^(?:crawl|categorize|css)-(.+)-\d+$/);
      if (match) {
        domain = match[1];
        console.log(`[CADE Callback] Extracted domain from target_request_id: ${domain}`);
      }
    }
    
    // If still no domain but we have request_id, try to extract from it
    if (!domain && request_id && typeof request_id === "string") {
      const match = request_id.match(/^(?:crawl|categorize|css)-(.+)-\d+$/);
      if (match) {
        domain = match[1];
        console.log(`[CADE Callback] Extracted domain from request_id: ${domain}`);
      }
    }
    
    // Extract other fields from nested data or top-level
    const progress = payload.progress ?? data.progress;
    const pages_crawled = payload.pages_crawled ?? data.pages_crawled;
    const total_pages = payload.total_pages ?? data.total_pages;
    const current_url = payload.current_url ?? data.current_url;
    const error = payload.error ?? data.error;
    const message = payload.message ?? data.message;

    // Final domain fallback - only use task:TYPE if we really have no domain info
    const domainOrTask = domain || `task:${task}`;
    
    console.log(`[CADE Callback] Task: ${task}, Status: ${status}, Domain: ${domainOrTask}, RequestId: ${request_id || "N/A"}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the crawl status update - use domainOrTask to always have a value
    const { data: insertedData, error: dbError } = await supabase
      .from("cade_crawl_events")
      .insert({
        domain: domainOrTask,
        request_id,
        user_id,
        status: `${task}:${status}`,  // Include task type in status
        progress,
        pages_crawled,
        total_pages,
        current_url,
        error_message: error,
        message,
        raw_payload: {
          ...payload,
          target_request_id,
        },
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
          received: { domain: domainOrTask, task, status }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[CADE Callback] Successfully stored event:", insertedData?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: insertedData?.id,
        received: { domain: domainOrTask, task, status, progress }
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
