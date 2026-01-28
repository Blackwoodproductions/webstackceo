import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRON_API_BASE = "https://public4.imagehosting.space/api/rsapi";

interface BronRequest {
  action: string;
  domain?: string;
  domain_id?: number | string;
  keyword_id?: string;
  data?: Record<string, unknown>;
  page?: number;
  limit?: number;
  include_deleted?: boolean;
}

async function readResponseBody(res: Response): Promise<unknown> {
  // Some BRON endpoints return plain-text (e.g. rate limit: "slow down"),
  // so we must not assume JSON.
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Helper to make authenticated requests to BRON API
// Endpoints that require form-urlencoded data
const FORM_ENCODED_ENDPOINTS = [
  "/pages",
  "/footer",
  "/serp-report",
  "/serp-list",
  "/serp-detail",
  "/links-in",
  "/links-out",
  "/keywords",  // List keywords endpoint also uses form data
  "/domains",   // List domains endpoint also uses form data
];

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
  
  // Check if this endpoint needs form-urlencoded data
  const useFormData = FORM_ENCODED_ENDPOINTS.includes(endpoint);
  
  const headers: Record<string, string> = {
    "Authorization": `Basic ${credentials}`,
    "Content-Type": useFormData ? "application/x-www-form-urlencoded" : "application/json",
    "Accept": "application/json",
  };

  const url = `${BRON_API_BASE}${endpoint}`;
  console.log(`BRON API Request: ${method} ${url} (format: ${useFormData ? 'form' : 'json'})`);
  
  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")) {
    if (useFormData) {
      // Convert to URL-encoded form data
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }
      const formBody = formData.toString();
      console.log(`BRON API Request Body (form): ${formBody}`);
      options.body = formBody;
    } else {
      const bodyStr = JSON.stringify(body);
      console.log(`BRON API Request Body (json): ${bodyStr}`);
      options.body = bodyStr;
    }
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
    const { action, domain, domain_id, keyword_id, data, page, limit, include_deleted } = body;

    console.log(`BRON RSAPI - Action: ${action}, Domain: ${domain || "N/A"}, DomainID: ${domain_id || "N/A"}`);

    let response: Response;
    let result: unknown;

    switch (action) {
      // ========== AUTHENTICATION ==========
      case "ping": {
        response = await bronApiRequest("/ping", "GET");
        result = await readResponseBody(response);
        break;
      }

      case "verifyAuth": {
        response = await bronApiRequest("/auth/verify", "GET");
        result = await readResponseBody(response);
        break;
      }

      // ========== DOMAINS ==========
      case "listDomains": {
        response = await bronApiRequest("/domains", "POST", {
          page: page || 1,
          limit: limit || 50,
          include_deleted: include_deleted || false,
        });
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
        break;
      }

      case "getSerpDetail": {
        if (!domain || !data?.report_id) {
          return new Response(
            JSON.stringify({ error: "Domain and report_id are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // The BRON API uses 'serpid' not 'report_id'
        response = await bronApiRequest("/serp-detail", "POST", { domain, serpid: data.report_id });
        result = await readResponseBody(response);
        break;
      }

      // ========== LINK REPORTS ==========
      case "getLinksIn": {
        if (!domain && !domain_id) {
          return new Response(
            JSON.stringify({ error: "Domain or domain_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // The API requires 'domain' field - domain_id is not supported
        // Include domain_id in the payload if provided, but domain is mandatory
        const linksInPayload: Record<string, unknown> = {};
        if (domain) {
          linksInPayload.domain = domain;
        }
        if (domain_id) {
          linksInPayload.domain_id = domain_id;
        }
        console.log(`BRON Links-In request payload:`, JSON.stringify(linksInPayload));
        response = await bronApiRequest("/links-in", "POST", linksInPayload);
        result = await readResponseBody(response);
        console.log(`BRON Links-In response status: ${response.status}, result:`, JSON.stringify(result).substring(0, 500));
        break;
      }

      case "getLinksOut": {
        if (!domain && !domain_id) {
          return new Response(
            JSON.stringify({ error: "Domain or domain_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // The API requires 'domain' field - domain_id is not supported
        // Include domain_id in the payload if provided, but domain is mandatory
        const linksOutPayload: Record<string, unknown> = {};
        if (domain) {
          linksOutPayload.domain = domain;
        }
        if (domain_id) {
          linksOutPayload.domain_id = domain_id;
        }
        console.log(`BRON Links-Out request payload:`, JSON.stringify(linksOutPayload));
        response = await bronApiRequest("/links-out", "POST", linksOutPayload);
        result = await readResponseBody(response);
        console.log(`BRON Links-Out response status: ${response.status}, result:`, JSON.stringify(result).substring(0, 500));
        break;
      }

      // ========== SUBSCRIPTION ==========
      case "getSubscription": {
        if (!domain) {
          return new Response(
            JSON.stringify({ error: "Domain is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // The BRON API returns domain details including service type/subscription level
        response = await bronApiRequest(`/domains/${encodeURIComponent(domain)}`, "GET");
        result = await readResponseBody(response);
        
        // Extract subscription info from domain data
        const domainData = result as Record<string, unknown>;
        const serviceType = String(domainData?.servicetype || domainData?.service_type || "");
        
        // Known CADE subscription service type IDs (numeric)
        // These IDs represent paid CADE subscriptions:
        // 383 = CADE Pro, 385 = CADE Enterprise, etc.
        // Any non-empty servicetype that is a number > 0 indicates a paid subscription
        const numericServiceType = parseInt(serviceType, 10);
        const hasCade = !isNaN(numericServiceType) && numericServiceType > 0;
        
        // Map service type IDs to plan names
        const planNames: Record<string, string> = {
          "383": "CADE Pro",
          "385": "CADE Enterprise", 
          "380": "CADE Starter",
          "381": "CADE Basic",
          "382": "CADE Standard",
          "384": "CADE Premium",
        };
        const planName = planNames[serviceType] || (hasCade ? `Plan ${serviceType}` : "Free");
        
        const subscriptionInfo = {
          domain: domain,
          servicetype: serviceType,
          plan: planName,
          status: domainData?.deleted === 1 ? "inactive" : "active",
          has_cade: hasCade,
          userid: domainData?.userid,
        };
        
        return new Response(
          JSON.stringify({ success: true, data: subscriptionInfo }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ========== USERS ==========
      case "listUsers": {
        response = await bronApiRequest("/users", "POST", {
          page: page || 1,
          limit: limit || 50,
        });
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
        result = await readResponseBody(response);
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
