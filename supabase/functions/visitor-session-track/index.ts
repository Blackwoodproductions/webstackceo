import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-tracking-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type Action = "init" | "touch" | "page_view";

type Payload = {
  action: Action;
  session_id: string;
  // Domain tracking - either tracking_token OR domain can be provided
  tracking_token?: string;
  domain?: string;
  first_page?: string | null;
  referrer?: string | null;
  user_agent?: string | null;
  page_path?: string | null;
  page_title?: string | null;
  time_on_page?: number | null;
  scroll_depth?: number | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      console.error("Missing backend env vars for visitor-session-track");
      return jsonResponse({ success: false, error: "Server misconfigured" }, 500);
    }

    const authHeader = req.headers.get("authorization") || "";
    
    // Check for tracking token in header as fallback
    const headerTrackingToken = req.headers.get("x-tracking-token") || "";

    // Auth-aware client (uses caller JWT if present)
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
      auth: { persistSession: false },
    });

    // Privileged client for writes (bypasses RLS)
    const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const payload = (await req.json()) as Partial<Payload>;
    const action = payload.action;
    const sessionId = (payload.session_id || "").trim();
    if (!action || !sessionId) {
      return jsonResponse({ success: false, error: "Missing action/session_id" }, 400);
    }

    // Resolve domain from tracking_token or direct domain parameter
    let domain: string | null = null;
    const trackingToken = payload.tracking_token || headerTrackingToken;
    
    if (trackingToken) {
      // Look up domain by tracking token
      const { data: domainData } = await serviceClient
        .from("user_domains")
        .select("domain")
        .eq("tracking_token", trackingToken)
        .eq("is_active", true)
        .maybeSingle();
      
      if (domainData?.domain) {
        domain = domainData.domain;
        console.log(`[visitor-session-track] Resolved domain ${domain} from token`);
      } else {
        console.warn(`[visitor-session-track] Invalid tracking token: ${trackingToken.substring(0, 8)}...`);
      }
    } else if (payload.domain) {
      // Direct domain parameter (for internal/legacy use)
      domain = payload.domain;
    }
    
    // If no domain resolved and no token provided, this is likely webstack.ceo internal tracking
    // We'll mark it as 'webstack.ceo' domain for internal analytics
    if (!domain && !trackingToken) {
      domain = "webstack.ceo";
    }

    // Determine authenticated user (if any); never trust user_id from the client.
    let userId: string | null = null;
    try {
      const { data } = await userClient.auth.getUser();
      userId = data?.user?.id || null;
    } catch {
      userId = null;
    }

    if (action === "init") {
      const firstPage = payload.first_page ?? null;
      const referrer = payload.referrer ?? null;
      const userAgent = payload.user_agent ?? null;

      const { error } = await serviceClient
        .from("visitor_sessions")
        .upsert(
          {
            session_id: sessionId,
            first_page: firstPage,
            referrer,
            user_agent: userAgent,
            user_id: userId,
            domain,
            last_activity_at: new Date().toISOString(),
          },
          { onConflict: "session_id", ignoreDuplicates: true },
        );

      if (error) {
        console.error("visitor-session-track:init error", error);
        return jsonResponse({ success: false, error: "Failed to init session" }, 500);
      }

      // If user logged in later, attach them without changing first_page/referrer.
      if (userId) {
        await serviceClient
          .from("visitor_sessions")
          .update({ user_id: userId })
          .eq("session_id", sessionId);
      }

      return jsonResponse({ success: true, domain });
    }

    if (action === "touch") {
      const now = new Date().toISOString();

      const { data, error } = await serviceClient
        .from("visitor_sessions")
        .update({ last_activity_at: now, ...(userId ? { user_id: userId } : {}) })
        .eq("session_id", sessionId)
        .select("id")
        .maybeSingle();

      // If the session doesn't exist yet, create it (helps recover from earlier failures)
      if (!data && !error) {
        const { error: upsertError } = await serviceClient
          .from("visitor_sessions")
          .upsert(
            {
              session_id: sessionId,
              first_page: payload.first_page ?? null,
              referrer: payload.referrer ?? null,
              user_agent: payload.user_agent ?? null,
              user_id: userId,
              domain,
              last_activity_at: now,
            },
            { onConflict: "session_id", ignoreDuplicates: true },
          );
        if (upsertError) {
          console.error("visitor-session-track:touch upsert error", upsertError);
          return jsonResponse({ success: false, error: "Failed to touch session" }, 500);
        }
      }

      if (error) {
        console.error("visitor-session-track:touch error", error);
        return jsonResponse({ success: false, error: "Failed to touch session" }, 500);
      }

      return jsonResponse({ success: true });
    }

    // page_view
    const pagePath = payload.page_path ?? null;
    if (!pagePath) {
      return jsonResponse({ success: false, error: "Missing page_path" }, 400);
    }

    const { error } = await serviceClient.from("page_views").insert({
      session_id: sessionId,
      page_path: pagePath,
      page_title: payload.page_title ?? null,
      time_on_page: payload.time_on_page ?? 0,
      scroll_depth: payload.scroll_depth ?? 0,
      domain,
    });

    if (error) {
      console.error("visitor-session-track:page_view error", error);
      return jsonResponse({ success: false, error: "Failed to track page view" }, 500);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("visitor-session-track unhandled error", err);
    return jsonResponse({ success: false, error: "Unexpected error" }, 500);
  }
});