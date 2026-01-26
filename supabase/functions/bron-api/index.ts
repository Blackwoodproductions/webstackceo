import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CADE_API_BASE = "https://seo-acg-api.prod.seosara.ai/api/v1";
const BRON_FEED_BASE = "https://public.imagehosting.space/feed";
const API_ID = "53084";
const API_KEY = "347819526879185";
const API_SECRET = "AKhpU6QAbMtUDTphRPCezo96CztR9EXR";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, endpoint, method = "GET", body } = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ error: "Domain is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[bron-api] Endpoint: ${endpoint}, Domain: ${domain}, Method: ${method}`);

    let apiUrl: string;
    let fetchOptions: RequestInit = {
      method,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "WebStack-SEO-Dashboard/1.0",
      },
    };

    // Route to appropriate API based on endpoint
    switch (endpoint) {
      // BRON Feed Endpoints (public.imagehosting.space)
      case "articles":
        apiUrl = `${BRON_FEED_BASE}/Article.php?feedit=1&domain=${encodeURIComponent(domain)}&apiid=${API_ID}&apikey=${API_KEY}&kkyy=${API_SECRET}`;
        fetchOptions.method = "GET";
        break;

      case "backlinks":
        apiUrl = `${BRON_FEED_BASE}/Backlinks.php?domain=${encodeURIComponent(domain)}&apiid=${API_ID}&apikey=${API_KEY}&kkyy=${API_SECRET}`;
        fetchOptions.method = "GET";
        break;

      case "rankings":
        apiUrl = `${BRON_FEED_BASE}/Rankings.php?domain=${encodeURIComponent(domain)}&apiid=${API_ID}&apikey=${API_KEY}&kkyy=${API_SECRET}`;
        fetchOptions.method = "GET";
        break;

      case "keywords":
        apiUrl = `${BRON_FEED_BASE}/Keywords.php?domain=${encodeURIComponent(domain)}&apiid=${API_ID}&apikey=${API_KEY}&kkyy=${API_SECRET}`;
        fetchOptions.method = "GET";
        break;

      case "deeplinks":
        apiUrl = `${BRON_FEED_BASE}/DeepLinks.php?domain=${encodeURIComponent(domain)}&apiid=${API_ID}&apikey=${API_KEY}&kkyy=${API_SECRET}`;
        fetchOptions.method = "GET";
        break;

      case "authority":
        apiUrl = `${BRON_FEED_BASE}/Authority.php?domain=${encodeURIComponent(domain)}&apiid=${API_ID}&apikey=${API_KEY}&kkyy=${API_SECRET}`;
        fetchOptions.method = "GET";
        break;

      // CADE API Endpoints (seo-acg-api.prod.seosara.ai)
      case "domain-profile":
        apiUrl = `${CADE_API_BASE}/domain/profile?domain=${encodeURIComponent(domain)}`;
        break;

      case "crawl-domain":
        apiUrl = `${CADE_API_BASE}/crawler/crawl-domain`;
        fetchOptions.method = "POST";
        fetchOptions.body = JSON.stringify({ domain, ...body });
        break;

      case "categorize-domain":
        apiUrl = `${CADE_API_BASE}/domain/categorize-domain`;
        fetchOptions.method = "POST";
        fetchOptions.body = JSON.stringify({ domain, ...body });
        break;

      case "generate-content":
        apiUrl = `${CADE_API_BASE}/content/`;
        fetchOptions.method = "POST";
        fetchOptions.body = JSON.stringify({ domain, ...body });
        break;

      case "generate-faq":
        apiUrl = `${CADE_API_BASE}/content/faq`;
        fetchOptions.method = "POST";
        fetchOptions.body = JSON.stringify({ domain, ...body });
        break;

      case "get-faqs":
        apiUrl = `${CADE_API_BASE}/content/faq?domain=${encodeURIComponent(domain)}`;
        break;

      case "publish-content":
        apiUrl = `${CADE_API_BASE}/publication/`;
        fetchOptions.method = "POST";
        fetchOptions.body = JSON.stringify({ domain, ...body });
        break;

      case "subscription":
        apiUrl = `${CADE_API_BASE}/subscription/?domain=${encodeURIComponent(domain)}`;
        break;

      case "subscription-detail":
        apiUrl = `${CADE_API_BASE}/subscription/detail?domain=${encodeURIComponent(domain)}`;
        break;

      case "subscription-active":
        apiUrl = `${CADE_API_BASE}/subscription/active?domain=${encodeURIComponent(domain)}`;
        break;

      case "crawl-status":
        apiUrl = `${CADE_API_BASE}/tasks/crawl/crawl?domain=${encodeURIComponent(domain)}`;
        break;

      case "crawl-all-status":
        apiUrl = `${CADE_API_BASE}/tasks/crawl/crawl-all?domain=${encodeURIComponent(domain)}`;
        break;

      case "categorization-status":
        apiUrl = `${CADE_API_BASE}/tasks/categorization/categorization?domain=${encodeURIComponent(domain)}`;
        break;

      case "system-health":
        apiUrl = `${CADE_API_BASE}/system/health`;
        break;

      case "system-workers":
        apiUrl = `${CADE_API_BASE}/system/workers`;
        break;

      case "system-queues":
        apiUrl = `${CADE_API_BASE}/system/queues`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log(`[bron-api] Calling: ${apiUrl}`);
    const response = await fetch(apiUrl, fetchOptions);
    console.log(`[bron-api] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[bron-api] Error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `API returned ${response.status}`, 
          details: errorText,
          endpoint 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log(`[bron-api] Success for ${endpoint}`);

    return new Response(
      JSON.stringify({ success: true, data, endpoint }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[bron-api] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
