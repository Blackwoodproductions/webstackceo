import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cade-secret",
};

// CADE API Base URL
const CADE_API_BASE = "https://logfire-us.pydantic.dev/rasenguy/cade-service-staging";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, domain, params } = body;

    // Get the secret from header or environment
    const headerSecret = req.headers.get("x-cade-secret");
    const envSecret = Deno.env.get("CADE_API_SECRET");
    const cadeSecret = headerSecret || envSecret;

    if (!cadeSecret) {
      console.error("[cade-api] No CADE_API_SECRET configured");
      return new Response(
        JSON.stringify({ error: "CADE API secret not configured" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[cade-api] Action: ${action}, Domain: ${domain || "N/A"}`);

    // Build headers for CADE API requests
    const cadeHeaders: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cadeSecret}`,
      "X-CADE-Secret": cadeSecret,
    };

    let endpoint: string;
    let method = "GET";
    let requestBody: string | undefined;

    // Map actions to CADE API endpoints
    switch (action) {
      case "health":
        endpoint = "/health";
        break;

      case "subscription":
        endpoint = "/api/subscription";
        break;

      case "workers":
        endpoint = "/api/workers";
        break;

      case "queues":
        endpoint = "/api/queues";
        break;

      case "domain-profile":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for domain-profile" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/api/domains/${encodeURIComponent(domain)}/profile`;
        break;

      case "get-faqs":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for get-faqs" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/api/domains/${encodeURIComponent(domain)}/faqs`;
        break;

      case "get-articles":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for get-articles" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/api/domains/${encodeURIComponent(domain)}/articles`;
        break;

      case "get-content":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for get-content" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/api/domains/${encodeURIComponent(domain)}/content`;
        break;

      case "get-tasks":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for get-tasks" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/api/domains/${encodeURIComponent(domain)}/tasks`;
        break;

      case "start-crawl":
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required for start-crawl" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/api/domains/${encodeURIComponent(domain)}/crawl`;
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
        endpoint = `/api/domains/${encodeURIComponent(domain)}/generate`;
        method = "POST";
        requestBody = JSON.stringify({ domain, ...params });
        break;

      case "login":
        // OAuth-style redirect login
        endpoint = `/auth/login`;
        method = "POST";
        requestBody = JSON.stringify({
          redirect_uri: params?.redirect_uri,
          domain,
        });
        break;

      case "verify-session":
        endpoint = `/auth/verify`;
        method = "POST";
        requestBody = JSON.stringify({ token: params?.token });
        break;

      default:
        // Try the action as a direct endpoint path
        endpoint = `/api/${action}`;
        if (domain) {
          endpoint = `/api/domains/${encodeURIComponent(domain)}/${action}`;
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
    }

    const response = await fetch(apiUrl, fetchOptions);
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

    console.log(`[cade-api] Success for ${action}, data type: ${typeof data}, isArray: ${Array.isArray(data)}`);

    return new Response(
      JSON.stringify({ success: true, data, action }),
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
