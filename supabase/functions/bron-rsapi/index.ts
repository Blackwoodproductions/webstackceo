import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // Must include all headers the web client may send (preflight)
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BRON_API_BASE = "https://public4.imagehosting.space/api/rsapi";

// Timeout for API calls (increased for reliability - BRON API can be slow)
const DEFAULT_TIMEOUT_MS = 25000; // 25 seconds for most operations
const AUTH_TIMEOUT_MS = 30000; // 30 seconds for auth which can be slow

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
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Endpoints that require form-urlencoded data
const FORM_ENCODED_ENDPOINTS = [
  "/pages",
  "/footer",
  "/serp-report",
  "/serp-list",
  "/serp-detail",
  "/links-in",
  "/links-out",
  "/keywords",
  "/domains",
];

// Helper to make authenticated requests to BRON API with timeout
async function bronApiRequest(
  endpoint: string,
  method: string = "GET",
  body?: Record<string, unknown>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const apiId = Deno.env.get("BRON_API_ID");
  const apiKey = Deno.env.get("BRON_API_KEY");

  if (!apiId || !apiKey) {
    throw new Error("BRON API credentials not configured");
  }

  const credentials = btoa(`${apiId}:${apiKey}`);
  const useFormData = FORM_ENCODED_ENDPOINTS.includes(endpoint);
  
  const headers: Record<string, string> = {
    "Authorization": `Basic ${credentials}`,
    "Content-Type": useFormData ? "application/x-www-form-urlencoded" : "application/json",
    "Accept": "application/json",
  };

  const url = `${BRON_API_BASE}${endpoint}`;
  console.log(`BRON API Request: ${method} ${url} (format: ${useFormData ? 'form' : 'json'}, timeout: ${timeoutMs}ms)`);
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const options: RequestInit = {
    method,
    headers,
    signal: controller.signal,
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")) {
    if (useFormData) {
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }
      options.body = formData.toString();
    } else {
      options.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`BRON API request timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: BronRequest = await req.json();
    const { action, domain, domain_id, keyword_id, data, page, limit, include_deleted } = body;

    console.log(`BRON RSAPI - Action: ${action}, Domain: ${domain || "N/A"}`);

    let response: Response;
    let result: unknown;

    switch (action) {
      // ========== AUTHENTICATION ==========
      case "ping": {
        response = await bronApiRequest("/ping", "GET", undefined, AUTH_TIMEOUT_MS);
        result = await readResponseBody(response);
        break;
      }

      case "verifyAuth": {
        // Use longer timeout for auth verification since it can be slow
        try {
          response = await bronApiRequest("/auth/verify", "GET", undefined, AUTH_TIMEOUT_MS);
          result = await readResponseBody(response);
          
          // If auth/verify doesn't exist or fails, try a simple domains call as fallback
          if (!response.ok) {
            console.log("Auth verify failed, trying fallback domains call");
            const fallbackResponse = await bronApiRequest("/domains", "POST", { page: 1, limit: 1 }, AUTH_TIMEOUT_MS);
            if (fallbackResponse.ok) {
              // If we can list domains, auth is working
              return new Response(
                JSON.stringify({ success: true, data: { authenticated: true } }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            result = await readResponseBody(fallbackResponse);
            response = fallbackResponse;
          }
        } catch (err) {
          // If auth verify times out, try fallback
          console.log("Auth verify timed out, trying fallback");
          try {
            const fallbackResponse = await bronApiRequest("/domains", "POST", { page: 1, limit: 1 }, AUTH_TIMEOUT_MS);
            if (fallbackResponse.ok) {
              return new Response(
                JSON.stringify({ success: true, data: { authenticated: true } }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            response = fallbackResponse;
            result = await readResponseBody(fallbackResponse);
          } catch (fallbackErr) {
            throw err; // Throw original error if fallback also fails
          }
        }
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
        response = await bronApiRequest("/serp-detail", "POST", { domain, serpid: data.report_id });
        result = await readResponseBody(response);
        
        // Log SERP detail structure to understand API response format
        if (result && typeof result === 'object') {
          const resAny = result as any;
          if (Array.isArray(result) && result.length > 0) {
            console.log("BRON API - getSerpDetail: Direct array with", result.length, "items. First item keys:", Object.keys(result[0]));
          } else if (resAny.data && Array.isArray(resAny.data) && resAny.data.length > 0) {
            console.log("BRON API - getSerpDetail: data array with", resAny.data.length, "items. First item keys:", Object.keys(resAny.data[0]));
          } else if (resAny.rankings && Array.isArray(resAny.rankings)) {
            console.log("BRON API - getSerpDetail: rankings array with", resAny.rankings.length, "items");
          } else if (resAny.keywords && Array.isArray(resAny.keywords)) {
            console.log("BRON API - getSerpDetail: keywords array with", resAny.keywords.length, "items");
          } else {
            console.log("BRON API - getSerpDetail: Unknown structure, keys:", Object.keys(result));
          }
        }
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
        const linksInPayload: Record<string, unknown> = {};
        if (domain) linksInPayload.domain = domain;
        if (domain_id) linksInPayload.domain_id = domain_id;
        response = await bronApiRequest("/links-in", "POST", linksInPayload);
        result = await readResponseBody(response);
        
        // Log first link structure to understand API response
        if (Array.isArray(result) && result.length > 0) {
          console.log("BRON API - First link-in structure (keys):", Object.keys(result[0]));
        } else if (result && typeof result === 'object' && 'data' in result && Array.isArray((result as any).data) && (result as any).data.length > 0) {
          console.log("BRON API - First link-in structure (keys):", Object.keys((result as any).data[0]));
        }
        break;
      }

      case "getLinksOut": {
        if (!domain && !domain_id) {
          return new Response(
            JSON.stringify({ error: "Domain or domain_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const linksOutPayload: Record<string, unknown> = {};
        if (domain) linksOutPayload.domain = domain;
        if (domain_id) linksOutPayload.domain_id = domain_id;
        response = await bronApiRequest("/links-out", "POST", linksOutPayload);
        result = await readResponseBody(response);
        
        // Log first link structure to understand API response
        if (Array.isArray(result) && result.length > 0) {
          console.log("BRON API - First link-out structure (keys):", Object.keys(result[0]));
        } else if (result && typeof result === 'object' && 'data' in result && Array.isArray((result as any).data) && (result as any).data.length > 0) {
          console.log("BRON API - First link-out structure (keys):", Object.keys((result as any).data[0]));
        }
        break;
      }

      // ========== LINK MANAGEMENT ==========
      case "updateLink": {
        // Update a link's properties (e.g., disabled status)
        // BRON API uses /links/{link_id} with PATCH
        if (!data?.link_id) {
          return new Response(
            JSON.stringify({ error: "link_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const linkId = data.link_id;
        const updateData = { ...data };
        delete updateData.link_id; // Remove from body, it goes in URL
        
        console.log(`BRON API - Updating link ${linkId} with data:`, updateData);
        response = await bronApiRequest(`/links/${linkId}`, "PATCH", updateData);
        result = await readResponseBody(response);
        break;
      }

      case "toggleLink": {
        // Toggle link enabled/disabled status
        // BRON API expects: disabled = "yes" | "no"
        if (!data?.link_id) {
          return new Response(
            JSON.stringify({ error: "link_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const toggleLinkId = data.link_id;
        const currentDisabled = data.current_disabled === "yes";
        const newDisabled = currentDisabled ? "no" : "yes";
        
        console.log(`BRON API - Toggling link ${toggleLinkId}: disabled ${currentDisabled ? '"yes"' : '"no"'} -> "${newDisabled}"`);
        response = await bronApiRequest(`/links/${toggleLinkId}`, "PATCH", { disabled: newDisabled });
        result = await readResponseBody(response);
        
        // Return the new state in the response
        if (response.ok) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: { 
                ...(typeof result === 'object' && result !== null ? result : {}),
                link_id: toggleLinkId,
                disabled: newDisabled 
              }
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        break;
      }

      case "deleteLink": {
        // Delete a link
        if (!data?.link_id) {
          return new Response(
            JSON.stringify({ error: "link_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        response = await bronApiRequest(`/links/${data.link_id}`, "DELETE");
        result = await readResponseBody(response);
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
        response = await bronApiRequest(`/domains/${encodeURIComponent(domain)}`, "GET");
        result = await readResponseBody(response);
        
        const domainData = result as Record<string, unknown>;
        const serviceType = String(domainData?.servicetype || domainData?.service_type || "");
        const numericServiceType = parseInt(serviceType, 10);
        const hasCade = !isNaN(numericServiceType) && numericServiceType > 0;
        
        const planNames: Record<string, string> = {
          "383": "CADE Pro",
          "385": "CADE Enterprise", 
          "380": "CADE Starter",
          "381": "CADE Basic",
          "382": "CADE Standard",
          "384": "CADE Premium",
        };
        const planName = planNames[serviceType] || (hasCade ? `Plan ${serviceType}` : "Free");
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: {
              domain,
              servicetype: serviceType,
              plan: planName,
              status: domainData?.deleted === 1 ? "inactive" : "active",
              has_cade: hasCade,
              userid: domainData?.userid,
            }
          }),
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

    // Handle rate limiting (429) gracefully
    if (response.status === 429) {
      console.warn("BRON API rate limited - returning soft error");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Rate limited - please wait a moment",
          rateLimited: true,
          retryAfter: 5
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    
    // Check for timeout errors
    const isTimeout = errorMessage.includes('timed out');
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timeout: isTimeout,
      }),
      { status: isTimeout ? 504 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
