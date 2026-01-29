import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Use production environment
const CADE_API_BASE = "https://seo-acg-api.prod.seosara.ai/api/v1";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { action, domain, params } = requestBody;
    
    console.log(`[CADE API] Action: ${action}, Domain: ${domain || "N/A"}`);
    
    // Always use the system API key - no user key needed
    const apiKey = Deno.env.get("CADE_API_KEY");
    
    if (!apiKey) {
      console.error("[CADE API] System API key not configured");
      return new Response(
        JSON.stringify({ error: "CADE API key not configured in system" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let endpoint = "";
    let method = "GET";
    let postBody: string | null = null;

    switch (action) {
      // === SYSTEM ENDPOINTS ===
      case "health":
        endpoint = "/system/health";
        break;

      case "workers":
        endpoint = "/system/workers";
        break;

      case "queues":
        endpoint = "/system/queues";
        break;

      // === CRAWLER ENDPOINTS ===
      case "crawl-domain": {
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for crawl-domain" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "POST";
        endpoint = "/crawler/crawl-domain";
        
        // Build callback URL for CADE to POST crawl updates
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://qwnzenimkwtuaqnrcygb.supabase.co";
        const callbackUrl = `${supabaseUrl}/functions/v1/cade-crawl-callback`;
        
        // user_id and request_id are tracking parameters passed from the dashboard
        // These are used to correlate tasks and callbacks for monitoring
        const userId = params?.user_id;
        const requestId = params?.request_id || `crawl-${domain}-${Date.now()}`;
        
        postBody = JSON.stringify({ 
          domain, 
          callback_url: callbackUrl,
          request_id: requestId,
          ...(userId && { user_id: userId }),
          max_pages: params?.max_pages || 50,
          ...params 
        });
        console.log(`[CADE API] Crawl request: user_id=${userId}, request_id=${requestId}, callback=${callbackUrl}`);
        break;
      }

      // === DOMAIN ENDPOINTS ===
      case "domain-profile":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for domain-profile" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Use /domain/profile endpoint per API docs
        endpoint = `/domain/profile?domain=${encodeURIComponent(domain)}`;
        break;

      case "domain-context":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for domain-context" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Separate endpoint for intake data
        endpoint = `/domain/context?domain=${encodeURIComponent(domain)}`;
        break;

      case "categorize-domain": {
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for categorize-domain" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "POST";
        endpoint = "/domain/categorize-domain";
        
        // Build callback URL for progress updates
        const catSupabaseUrl = Deno.env.get("SUPABASE_URL") || "https://qwnzenimkwtuaqnrcygb.supabase.co";
        const catCallbackUrl = `${catSupabaseUrl}/functions/v1/cade-crawl-callback`;
        
        const catUserId = params?.user_id;
        const catRequestId = params?.request_id || `categorize-${domain}-${Date.now()}`;
        
        postBody = JSON.stringify({ 
          domain, 
          callback_url: catCallbackUrl,
          request_id: catRequestId,
          ...(catUserId && { user_id: catUserId }),
          ...params 
        });
        console.log(`[CADE API] Categorize request: user_id=${catUserId}, request_id=${catRequestId}`);
        break;
      }

      case "analyze-css": {
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for analyze-css" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "POST";
        endpoint = "/domain/analyze-css";
        
        const cssUserId = params?.user_id;
        const cssRequestId = params?.request_id || `css-${domain}-${Date.now()}`;
        
        postBody = JSON.stringify({ 
          domain, 
          request_id: cssRequestId,
          ...(cssUserId && { user_id: cssUserId }),
          ...params 
        });
        console.log(`[CADE API] CSS analyze request: user_id=${cssUserId}, request_id=${cssRequestId}`);
        break;
      }

      // === SUBSCRIPTION ENDPOINTS ===
      case "subscription":
        endpoint = "/subscription/";
        break;

      case "subscription-detail":
        endpoint = "/subscription/detail";
        break;

      case "subscription-active":
        endpoint = "/subscription/active";
        break;

      case "use-quota":
        method = "POST";
        endpoint = "/subscription/quota";
        postBody = JSON.stringify({ ...params });
        break;

      // === CONTENT GENERATION ENDPOINTS ===
      case "generate-content":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for generate-content" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "POST";
        endpoint = "/content/";
        postBody = JSON.stringify({ domain, ...params });
        break;

      case "list-content":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for list-content" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Remove trailing slash - API may reject it
        endpoint = `/content?domain=${encodeURIComponent(domain)}`;
        if (params?.page) endpoint += `&page=${params.page}`;
        if (params?.limit) endpoint += `&limit=${params.limit}`;
        if (params?.status) endpoint += `&status=${params.status}`;
        break;

      case "get-content":
        if (!params?.content_id) {
          return new Response(
            JSON.stringify({ error: "content_id is required for get-content" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/content/${encodeURIComponent(params.content_id)}`;
        break;

      case "update-content":
        if (!params?.content_id) {
          return new Response(
            JSON.stringify({ error: "content_id is required for update-content" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "PATCH";
        endpoint = `/content/${encodeURIComponent(params.content_id)}`;
        postBody = JSON.stringify({ ...params, content_id: undefined });
        break;

      case "delete-content":
        if (!params?.content_id) {
          return new Response(
            JSON.stringify({ error: "content_id is required for delete-content" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "DELETE";
        endpoint = `/content/${encodeURIComponent(params.content_id)}`;
        break;

      case "generate-content-bulk":
        method = "POST";
        endpoint = "/content/bulk";
        postBody = JSON.stringify({ ...params });
        break;

      case "generate-knowledge-base":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for generate-knowledge-base" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "POST";
        endpoint = "/content/knowledge-base";
        postBody = JSON.stringify({ domain, ...params });
        break;

      case "generate-faq":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for generate-faq" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "POST";
        endpoint = "/content/faq";
        postBody = JSON.stringify({ domain, ...params });
        break;

      case "get-faqs":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for get-faqs" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/content/faq?domain=${encodeURIComponent(domain)}`;
        break;

      case "update-faq":
        if (!params?.faq_id) {
          return new Response(
            JSON.stringify({ error: "faq_id is required for update-faq" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "PATCH";
        endpoint = `/content/faq/${encodeURIComponent(params.faq_id)}`;
        postBody = JSON.stringify({ ...params, faq_id: undefined });
        break;

      case "delete-faq":
        if (!params?.faq_id) {
          return new Response(
            JSON.stringify({ error: "faq_id is required for delete-faq" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "DELETE";
        endpoint = `/content/faq/${encodeURIComponent(params.faq_id)}`;
        break;

      case "generate-faq-bulk":
        method = "POST";
        endpoint = "/content/faq/bulk";
        postBody = JSON.stringify({ ...params });
        break;

      // === PLATFORM CONNECTION ENDPOINTS ===
      case "list-platforms":
        endpoint = "/publication/platforms";
        break;

      case "connect-platform":
        method = "POST";
        endpoint = "/publication/connect";
        postBody = JSON.stringify({ domain, ...params });
        break;

      case "disconnect-platform":
        method = "DELETE";
        endpoint = `/publication/disconnect/${encodeURIComponent(params?.platform_id || "")}`;
        break;

      // === CONTENT PUBLISHING ENDPOINTS ===
      case "publish-content":
        method = "POST";
        endpoint = "/publication/";
        postBody = JSON.stringify({ ...params });
        break;

      // === TASK ENDPOINTS ===
      // Note: Task endpoints require user_id as a query parameter (integer)
      case "crawl-tasks": {
        endpoint = "/tasks/crawl/crawl-all";
        // Add user_id if provided (required by API)
        if (params?.user_id) {
          endpoint += `?user_id=${encodeURIComponent(params.user_id)}`;
        }
        break;
      }

      case "crawl-task-status": {
        if (!params?.task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required for crawl-task-status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/tasks/crawl/crawl?task_id=${encodeURIComponent(params.task_id)}`;
        if (params?.user_id) {
          endpoint += `&user_id=${encodeURIComponent(params.user_id)}`;
        }
        break;
      }

      case "categorization-tasks": {
        endpoint = "/tasks/categorization/categorization-all";
        if (params?.user_id) {
          endpoint += `?user_id=${encodeURIComponent(params.user_id)}`;
        }
        break;
      }

      case "categorization-task-status": {
        if (!params?.task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required for categorization-task-status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/tasks/categorization/categorization?task_id=${encodeURIComponent(params.task_id)}`;
        if (params?.user_id) {
          endpoint += `&user_id=${encodeURIComponent(params.user_id)}`;
        }
        break;
      }

      case "terminate-content-task":
        method = "POST";
        endpoint = "/tasks/content/termination";
        postBody = JSON.stringify({ ...params });
        break;

      // === CONTENT TASKS - Additional endpoints ===
      case "content-tasks": {
        endpoint = "/tasks/content/content-all";
        if (params?.user_id) {
          endpoint += `?user_id=${encodeURIComponent(params.user_id)}`;
        }
        break;
      }

      case "content-task-status": {
        if (!params?.task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required for content-task-status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/tasks/content/content?task_id=${encodeURIComponent(params.task_id)}`;
        if (params?.user_id) {
          endpoint += `&user_id=${encodeURIComponent(params.user_id)}`;
        }
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const url = `${CADE_API_BASE}${endpoint}`;
    console.log(`[CADE API] Fetching: ${method} ${url}`);
    
    // Debug: Log key format (first 8 chars) to verify it's being picked up
    console.log(`[CADE API] Using API key starting with: ${apiKey.substring(0, 8)}...`);

    // Try both header formats - some APIs prefer lowercase
    const headers: Record<string, string> = {
      "X-API-Key": apiKey,
      "x-api-key": apiKey,
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (postBody && method !== "GET") {
      fetchOptions.body = postBody;
      console.log(`[CADE API] Request body: ${postBody.substring(0, 200)}`);
    }

    // Increased timeout to 25 seconds for slow CADE API responses
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    fetchOptions.signal = controller.signal;

    let response: Response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("[CADE API] Request timed out");
        return new Response(
          JSON.stringify({ error: "Request timed out - CADE API is slow or unreachable" }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);
    
    const responseText = await response.text();

    console.log(`[CADE API] Response status: ${response.status}`);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.log(`[CADE API] Non-JSON response: ${responseText.substring(0, 200)}`);
      data = { raw: responseText };
    }

    if (!response.ok) {
      console.error(`[CADE API] Error response:`, data);
      return new Response(
        JSON.stringify({ 
          error: data?.detail || data?.message || `API returned ${response.status}`,
          status: response.status,
          details: data 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[CADE API] Error:", error);
    const errMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
