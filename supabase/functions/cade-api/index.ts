import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Use production environment
const CADE_API_BASE = "https://seo-acg-api.prod.seosara.ai/api/v1";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const normalizeCadeUserId = (value: unknown): number => {
      // CADE task endpoints validate user_id as an integer.
      // We default to 1 for dashboard-wide task visibility.
      if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
      if (typeof value === "string") {
        const n = Number.parseInt(value, 10);
        if (Number.isFinite(n)) return n;
      }
      return 1;
    };

    const cadeUserId = normalizeCadeUserId(params?.cade_user_id ?? params?.user_id);

    // Used to seed task rows in our database so the dashboard shows tasks immediately.
    const seedTaskEvent = async (task: string, status: string, payload: Record<string, unknown>) => {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase.from("cade_crawl_events").insert({
          domain: String(payload.domain ?? domain ?? `task:${task}`),
          request_id: (payload.request_id as string | undefined) ?? null,
          user_id: (payload.user_id as string | undefined) ?? null,
          status: `${task}:${status}`,
          progress: (payload.progress as number | undefined) ?? null,
          pages_crawled: (payload.pages_crawled as number | undefined) ?? null,
          total_pages: (payload.total_pages as number | undefined) ?? null,
          current_url: (payload.current_url as string | undefined) ?? null,
          error_message: (payload.error_message as string | undefined) ?? null,
          message: (payload.message as string | undefined) ?? null,
          raw_payload: {
            source: "dashboard",
            task,
            status,
            ...payload,
          },
        });
      } catch (e) {
        // Non-blocking: task seeding is best-effort
        console.warn("[CADE API] Failed to seed task event:", e);
      }
    };

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
        
        // request_id correlates tasks and callbacks in the dashboard.
        // user_id must be an integer for CADE task listing endpoints.
        const requestId = params?.request_id || `crawl-${domain}-${Date.now()}`;
        const targetRequestId = params?.target_request_id;

        // Seed a local task event so the dashboard shows a task instantly.
        // Track dashboard-level user_id (string) separately from CADE's integer user_id.
        seedTaskEvent("CRAWL", "queued", {
          domain,
          request_id: requestId,
          target_request_id: targetRequestId,
          user_id: typeof params?.user_id === "string" ? params.user_id : undefined,
          progress: 0,
          message: "Crawl requested",
        }).catch(() => undefined);
        
        postBody = JSON.stringify({ 
          domain, 
          callback_url: callbackUrl,
          request_id: requestId,
          user_id: cadeUserId,
          ...(targetRequestId ? { target_request_id: targetRequestId } : {}),
          max_pages: params?.max_pages || 50,
          ...params 
        });
        console.log(`[CADE API] Crawl request: user_id=${cadeUserId}, request_id=${requestId}, callback=${callbackUrl}`);
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
        
        const catRequestId = params?.request_id || `categorize-${domain}-${Date.now()}`;
        const catTargetRequestId = params?.target_request_id;

        seedTaskEvent("CATEGORIZATION", "queued", {
          domain,
          request_id: catRequestId,
          target_request_id: catTargetRequestId,
          user_id: typeof params?.user_id === "string" ? params.user_id : undefined,
          message: "Categorization requested",
        }).catch(() => undefined);
        
        postBody = JSON.stringify({ 
          domain, 
          callback_url: catCallbackUrl,
          request_id: catRequestId,
          user_id: cadeUserId,
          ...(catTargetRequestId ? { target_request_id: catTargetRequestId } : {}),
          ...params 
        });
        console.log(`[CADE API] Categorize request: user_id=${cadeUserId}, request_id=${catRequestId}`);
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
        
        const cssRequestId = params?.request_id || `css-${domain}-${Date.now()}`;
        const cssTargetRequestId = params?.target_request_id;

        seedTaskEvent("CSS", "queued", {
          domain,
          request_id: cssRequestId,
          target_request_id: cssTargetRequestId,
          user_id: typeof params?.user_id === "string" ? params.user_id : undefined,
          message: "CSS analysis requested",
        }).catch(() => undefined);
        
        postBody = JSON.stringify({ 
          domain, 
          request_id: cssRequestId,
          user_id: cadeUserId,
          ...(cssTargetRequestId ? { target_request_id: cssTargetRequestId } : {}),
          ...params 
        });
        console.log(`[CADE API] CSS analyze request: user_id=${cadeUserId}, request_id=${cssRequestId}`);
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
        // API requires user_id and validates integer
        endpoint += `?user_id=${encodeURIComponent(String(cadeUserId))}`;
        break;
      }

      case "crawl-task-status": {
        if (!params?.task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required for crawl-task-status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // CADE returns status_url like: /tasks/crawl?task_id=...
        endpoint = `/tasks/crawl?task_id=${encodeURIComponent(String(params.task_id))}`;
        break;
      }

      case "categorization-tasks": {
        endpoint = "/tasks/categorization/categorization-all";
        endpoint += `?user_id=${encodeURIComponent(String(cadeUserId))}`;
        break;
      }

      case "categorization-task-status": {
        if (!params?.task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required for categorization-task-status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/tasks/categorization?task_id=${encodeURIComponent(String(params.task_id))}`;
        break;
      }

      case "terminate-content-task":
        method = "POST";
        endpoint = "/tasks/content/termination";
        postBody = JSON.stringify({ ...params });
        break;

      case "terminate-crawl-task": {
        if (!params?.task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required for terminate-crawl-task" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "POST";
        endpoint = "/tasks/crawl/termination";
        
        // Seed a termination event for UI feedback
        seedTaskEvent("CRAWL", "terminating", {
          domain: domain || "unknown",
          request_id: params?.request_id || params?.task_id,
          message: "Task termination requested",
        }).catch(() => undefined);
        
        postBody = JSON.stringify({ task_id: params.task_id, user_id: cadeUserId, ...params });
        console.log(`[CADE API] Terminate crawl task: ${params.task_id}`);
        break;
      }

      case "terminate-categorization-task": {
        if (!params?.task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required for terminate-categorization-task" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        method = "POST";
        endpoint = "/tasks/categorization/termination";
        
        seedTaskEvent("CATEGORIZATION", "terminating", {
          domain: domain || "unknown",
          request_id: params?.request_id || params?.task_id,
          message: "Task termination requested",
        }).catch(() => undefined);
        
        postBody = JSON.stringify({ task_id: params.task_id, user_id: cadeUserId, ...params });
        console.log(`[CADE API] Terminate categorization task: ${params.task_id}`);
        break;
      }

      case "terminate-all-tasks": {
        method = "POST";
        endpoint = "/tasks/terminate-all";
        
        seedTaskEvent("SYSTEM", "terminating", {
          domain: domain || "system",
          message: "All tasks termination requested",
        }).catch(() => undefined);
        
        postBody = JSON.stringify({ user_id: cadeUserId, ...params });
        console.log(`[CADE API] Terminate all tasks for user: ${cadeUserId}`);
        break;
      }

      // === CONTENT TASKS - Additional endpoints ===
      case "content-tasks": {
        // Some deployments may not expose content task listing; keep best-effort.
        endpoint = "/tasks/content-all";
        endpoint += `?user_id=${encodeURIComponent(String(cadeUserId))}`;
        break;
      }

      case "content-task-status": {
        if (!params?.task_id) {
          return new Response(
            JSON.stringify({ error: "task_id is required for content-task-status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = `/tasks/content?task_id=${encodeURIComponent(String(params.task_id))}&user_id=${encodeURIComponent(String(cadeUserId))}`;
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
