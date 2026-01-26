import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cade-secret",
};

// CADE API Base URL - Production SEO ACG API
const CADE_API_BASE = "https://seo-acg-api.prod.seosara.ai";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, domain, params, apiKey: bodyApiKey } = body;
    const actionName = typeof action === "string" ? action.trim() : "";

    // Get the secret from body (user-provided), header, or environment
    const headerSecret = req.headers.get("x-cade-secret");
    const envSecret = Deno.env.get("CADE_API_SECRET") || Deno.env.get("CADE_API_KEY");
    const cadeSecretRaw: unknown = bodyApiKey ?? headerSecret ?? envSecret;
    const cadeSecret = (typeof cadeSecretRaw === "string" ? cadeSecretRaw : "").trim();

    // Users sometimes paste the full header line (e.g. "X-API-Key: abc123") instead of the raw key.
    // Normalize to raw key value.
    let cadeKey = cadeSecret;
    if (/^x-api-key\s*:/i.test(cadeKey)) {
      cadeKey = cadeKey.split(":").slice(1).join(":").trim();
    }

    if (!cadeKey) {
      console.error("[cade-api] No CADE_API_SECRET configured");
      return new Response(
        JSON.stringify({ error: "CADE API secret not configured" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(
      `[cade-api] Action: ${JSON.stringify(actionName)} (len=${actionName.length}), Domain: ${domain || "N/A"}`
    );
    // Safe diagnostics to confirm we're actually sending a non-empty key (never log the key)
    if (cadeKey) {
      const bytes = new TextEncoder().encode(cadeKey);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const hashHex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      console.log(
        `[cade-api] Auth key diagnostics: len=${cadeKey.length}, sha256_prefix=${hashHex.slice(0, 10)}`
      );
    }

    // Build headers for CADE API requests
    // Per OpenAPI spec: securitySchemes -> APIKeyHeader -> name: "X-API-Key", in: "header"
    // HTTP headers are case-insensitive per RFC 7230, but some servers are stricter
    // Try both cases to maximize compatibility
    const cadeHeaders = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
      // Some upstreams behave differently for non-browser clients; mimic Swagger UI.
      Origin: "https://seo-acg-api.prod.seosara.ai",
      Referer: "https://seo-acg-api.prod.seosara.ai/docs",
      "User-Agent": "Mozilla/5.0 (compatible; Lovable-CADE-Proxy/1.0)",
    });
    // HTTP header names are case-insensitive, but we keep the exact documented name.
    cadeHeaders.set("X-API-Key", cadeKey);

    console.log(`[cade-api] Upstream auth headers set, key len=${cadeKey.length}`);

    let endpoint: string;
    let method = "GET";
    let requestBody: string | undefined;

    // Map actions to CADE API v1 endpoints
    switch (actionName) {
      // System endpoints
      case "health":
        endpoint = "/api/v1/system/health";
        break;

      case "workers":
        endpoint = "/api/v1/system/workers";
        break;

      case "queues":
        endpoint = "/api/v1/system/queues";
        break;

      // Subscription endpoints
      case "subscription":
        endpoint = "/api/v1/subscription/";
        break;

      case "subscription-detail":
        endpoint = "/api/v1/subscription/detail";
        break;

      case "subscription-active":
        endpoint = "/api/v1/subscription/active";
        break;

      // Domain endpoints
      case "domain-profile":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for domain-profile" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/api/v1/domain/profile?domain=${encodeURIComponent(domain)}`;
        break;

      case "categorize-domain":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for categorize-domain" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = "/api/v1/domain/categorize-domain";
        method = "POST";
        requestBody = JSON.stringify({ domain, ...params });
        break;

      case "analyze-css":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for analyze-css" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = "/api/v1/domain/analyze-css";
        method = "POST";
        requestBody = JSON.stringify({ domain, ...params });
        break;

      // Crawler endpoints
      case "crawl-domain":
      case "start-crawl":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for crawl-domain" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = "/api/v1/crawler/crawl-domain";
        method = "POST";
        requestBody = JSON.stringify({ domain, ...params });
        break;

      // Content endpoints
      case "get-faqs":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for get-faqs" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/api/v1/content/faq?domain=${encodeURIComponent(domain)}`;
        break;

      case "generate-faq":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for generate-faq" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = "/api/v1/content/faq";
        method = "POST";
        requestBody = JSON.stringify({ domain, ...params });
        break;

      case "generate-content":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for generate-content" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = "/api/v1/content/";
        method = "POST";
        requestBody = JSON.stringify({ domain, ...params });
        break;

      case "generate-knowledge-base":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for generate-knowledge-base" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = "/api/v1/content/knowledge-base";
        method = "POST";
        requestBody = JSON.stringify({ domain, ...params });
        break;

      // Publication endpoints
      case "publish-content":
        endpoint = "/api/v1/publication/";
        method = "POST";
        requestBody = JSON.stringify({ domain, ...params });
        break;

      // Task endpoints
      case "crawl-tasks":
        endpoint = domain 
          ? `/api/v1/tasks/crawl/crawl?domain=${encodeURIComponent(domain)}`
          : "/api/v1/tasks/crawl/crawl-all";
        break;

      case "categorization-tasks":
        endpoint = domain
          ? `/api/v1/tasks/categorization/categorization?domain=${encodeURIComponent(domain)}`
          : "/api/v1/tasks/categorization/categorization-all";
        break;

      case "terminate-task":
        endpoint = "/api/v1/tasks/content/termination";
        method = "POST";
        requestBody = JSON.stringify({ ...params });
        break;

      default:
        // Try the action as a direct endpoint path under /api/v1/
        endpoint = `/api/v1/${action}`;
        if (params?.method === "POST") {
          method = "POST";
          requestBody = JSON.stringify({ domain, ...params });
        }
        break;
    }

    const apiUrl = `${CADE_API_BASE}${endpoint}`;
    console.log(`[cade-api] Calling: ${method} ${apiUrl}`);

    const fetchOptions: RequestInit = {
      method,
      headers: cadeHeaders,
    };

    if (requestBody && method !== "GET") {
      fetchOptions.body = requestBody;
      console.log(`[cade-api] Request body: ${requestBody.substring(0, 200)}`);
    }

    // Some upstreams respond with redirects (e.g., trailing-slash normalization).
    // Certain runtimes may drop custom headers on redirects. We handle redirects manually
    // to ensure the API key header is preserved.
    let response = await fetch(apiUrl, { ...fetchOptions, redirect: "manual" });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      console.log(`[cade-api] Redirect ${response.status} -> ${location ?? "(no location)"}`);
      if (location) {
        const redirectedUrl = new URL(location, apiUrl).toString();
        response = await fetch(redirectedUrl, fetchOptions);
      }
    }

    console.log(`[cade-api] Response status: ${response.status}`);

    const responseText = await response.text();

    console.log(`[cade-api] Response preview: ${responseText.substring(0, 300)}`);

    if (!response.ok) {
      console.error(`[cade-api] Error: ${response.status} - ${responseText}`);
      return new Response(
        JSON.stringify({
          error: `CADE API returned ${response.status}`,
          details: responseText,
          action,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.log(`[cade-api] Response is not JSON, wrapping text`);
      data = { raw: responseText, parsed: false };
    }

    console.log(`[cade-api] Success for ${actionName}, data type: ${typeof data}, isArray: ${Array.isArray(data)}`);

    return new Response(
      JSON.stringify({ success: true, data, action: actionName }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[cade-api] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
