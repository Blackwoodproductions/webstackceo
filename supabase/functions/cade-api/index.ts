import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CADE_API_BASE = "https://seo-acg-api.prod.seosara.ai/api/v1";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { action, domain, params, apiKey: userApiKey } = requestBody;
    
    console.log(`[CADE API] Action: ${action}, Domain: ${domain || "N/A"}`);
    
    // Use user-provided API key first, fall back to environment variable
    const apiKey = userApiKey || Deno.env.get("CADE_API_KEY");
    
    if (!apiKey) {
      console.error("[CADE API] No API key provided");
      return new Response(
        JSON.stringify({ error: "CADE API key not provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      case "crawl-domain":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for crawl-domain" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "POST";
        endpoint = "/crawler/crawl-domain";
        postBody = JSON.stringify({ domain, ...params });
        break;

      // === DOMAIN ENDPOINTS ===
      case "domain-profile":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for domain-profile" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/domain/profile?domain=${encodeURIComponent(domain)}`;
        break;

      case "categorize-domain":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for categorize-domain" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "POST";
        endpoint = "/domain/categorize-domain";
        postBody = JSON.stringify({ domain, ...params });
        break;

      case "analyze-css":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for analyze-css" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "POST";
        endpoint = "/domain/analyze-css";
        postBody = JSON.stringify({ domain, ...params });
        break;

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

      case "generate-faq-bulk":
        method = "POST";
        endpoint = "/content/faq/bulk";
        postBody = JSON.stringify({ ...params });
        break;

      // === CONTENT PUBLISHING ENDPOINTS ===
      case "publish-content":
        method = "POST";
        endpoint = "/publication/";
        postBody = JSON.stringify({ ...params });
        break;

      // === TASK ENDPOINTS ===
      case "crawl-tasks":
        endpoint = "/tasks/crawl/crawl-all";
        break;

      case "crawl-task-status":
        if (!params?.task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required for crawl-task-status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/tasks/crawl/crawl?task_id=${encodeURIComponent(params.task_id)}`;
        break;

      case "categorization-tasks":
        endpoint = "/tasks/categorization/categorization-all";
        break;

      case "categorization-task-status":
        if (!params?.task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required for categorization-task-status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/tasks/categorization/categorization?task_id=${encodeURIComponent(params.task_id)}`;
        break;

      case "terminate-content-task":
        method = "POST";
        endpoint = "/tasks/content/termination";
        postBody = JSON.stringify({ ...params });
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const url = `${CADE_API_BASE}${endpoint}`;
    console.log(`[CADE API] Fetching: ${method} ${url}`);

    const headers: Record<string, string> = {
      "X-API-Key": apiKey,
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

    const response = await fetch(url, fetchOptions);
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
