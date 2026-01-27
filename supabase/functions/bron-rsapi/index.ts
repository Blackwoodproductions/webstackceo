import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRON_API_BASE = "https://public4.imagehosting.space/api/rsapi";

interface BronRequest {
  action: string;
  domain?: string;
  keyword_id?: string;
  data?: Record<string, unknown>;
  page?: number;
  limit?: number;
  include_deleted?: boolean;
}

// Helper to make authenticated requests to BRON API
async function bronApiRequest(
  endpoint: string,
  method: string = "GET",
  body?: Record<string, unknown>
): Promise<Response> {
  const apiId = Deno.env.get("BRON_API_ID");
  const apiKey = Deno.env.get("BRON_API_KEY");

  if (!apiId || !apiKey) {
    throw new Error("BRON API credentials not configured");
  }

  // Create Basic Auth header
  const credentials = btoa(`${apiId}:${apiKey}`);
  
  const headers: Record<string, string> = {
    "Authorization": `Basic ${credentials}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  const url = `${BRON_API_BASE}${endpoint}`;
  console.log(`BRON API Request: ${method} ${url}`);
  
  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: BronRequest = await req.json();
    const { action, domain, keyword_id, data, page, limit, include_deleted } = body;

    console.log(`BRON RSAPI - Action: ${action}, Domain: ${domain || "N/A"}`);

    let response: Response;
    let result: unknown;

    switch (action) {
      // ========== AUTHENTICATION ==========
      case "ping": {
        response = await bronApiRequest("/ping", "GET");
        result = await response.json();
        break;
      }

      case "verifyAuth": {
        response = await bronApiRequest("/auth/verify", "GET");
        result = await response.json();
        break;
      }

      // ========== DOMAINS ==========
      case "listDomains": {
        response = await bronApiRequest("/domains", "POST", {
          page: page || 1,
          limit: limit || 50,
          include_deleted: include_deleted || false,
        });
        result = await response.json();
        break;
      }

      case "getDomain": {
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain name is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest(`/domains/${encodeURIComponent(domain)}`, "GET");
        result = await response.json();
        break;
      }

      case "updateDomain": {
        if (!domain || !data) {
          return new Response(
            JSON.stringify({ error: "Domain name and update data are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest(`/domains/${encodeURIComponent(domain)}`, "PATCH", data);
        result = await response.json();
        break;
      }

      case "deleteDomain": {
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain name is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest(`/domains/${encodeURIComponent(domain)}`, "DELETE", data || {});
        result = await response.json();
        break;
      }

      case "restoreDomain": {
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain name is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest(`/domains/${encodeURIComponent(domain)}/restore`, "POST", {});
        result = await response.json();
        break;
      }

      // ========== KEYWORDS ==========
      case "listKeywords": {
        response = await bronApiRequest("/keywords", "POST", {
          domain,
          page: page || 1,
          limit: limit || 100,
          include_deleted: include_deleted || false,
        });
        result = await response.json();
        break;
      }

      case "getKeyword": {
        if (!keyword_id) {
          return new Response(
            JSON.stringify({ error: "Keyword ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest(`/keywords/${keyword_id}`, "GET");
        result = await response.json();
        break;
      }

      case "addKeyword": {
        if (!data) {
          return new Response(
            JSON.stringify({ error: "Keyword data is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest("/keywords", "PUT", data);
        result = await response.json();
        break;
      }

      case "updateKeyword": {
        if (!keyword_id || !data) {
          return new Response(
            JSON.stringify({ error: "Keyword ID and update data are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest(`/keywords/${keyword_id}`, "PATCH", data);
        result = await response.json();
        break;
      }

      case "deleteKeyword": {
        if (!keyword_id) {
          return new Response(
            JSON.stringify({ error: "Keyword ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest(`/keywords/${keyword_id}`, "DELETE", data || {});
        result = await response.json();
        break;
      }

      case "restoreKeyword": {
        if (!keyword_id) {
          return new Response(
            JSON.stringify({ error: "Keyword ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest(`/keywords/${keyword_id}/restore`, "POST", {});
        result = await response.json();
        break;
      }

      // ========== PAGES & CONTENT ==========
      case "getPages": {
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest("/pages", "POST", { domain });
        result = await response.json();
        break;
      }

      case "getFooter": {
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest("/footer", "POST", { domain });
        result = await response.json();
        break;
      }

      // ========== SERP REPORTS ==========
      case "getSerpReport": {
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest("/serp-report", "POST", { domain });
        result = await response.json();
        break;
      }

      case "getSerpList": {
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest("/serp-list", "POST", { domain });
        result = await response.json();
        break;
      }

      case "getSerpDetail": {
        if (!domain || !data?.report_id) {
          return new Response(
            JSON.stringify({ error: "Domain and report_id are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest("/serp-detail", "POST", { domain, report_id: data.report_id });
        result = await response.json();
        break;
      }

      // ========== LINK REPORTS ==========
      case "getLinksIn": {
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest("/links-in", "POST", { domain });
        result = await response.json();
        break;
      }

      case "getLinksOut": {
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest("/links-out", "POST", { domain });
        result = await response.json();
        break;
      }

      // ========== USERS ==========
      case "listUsers": {
        response = await bronApiRequest("/users", "POST", {
          page: page || 1,
          limit: limit || 50,
        });
        result = await response.json();
        break;
      }

      case "getUser": {
        if (!data?.user_id) {
          return new Response(
            JSON.stringify({ error: "User ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest(`/users/${data.user_id}`, "GET");
        result = await response.json();
        break;
      }

      case "createUser": {
        if (!data) {
          return new Response(
            JSON.stringify({ error: "User data is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest("/users", "PUT", data);
        result = await response.json();
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Check for API errors
    if (!response.ok) {
      console.error(`BRON API error: ${response.status}`, result);
      return new Response(
        JSON.stringify({ 
          error: "BRON API request failed", 
          status: response.status,
          details: result 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("BRON RSAPI error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
