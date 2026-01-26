import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Public routing identifiers (not secrets)
const BRON_STATUS_API = "https://public.imagehosting.space/feed/Article.php";
const BRON_API_ID = "53084";
const BRON_API_KEY = "347819526879185";
const BRON_KKYY = "AKhpU6QAbMtUDTphRPCezo96CztR9EXR";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const domain = typeof body?.domain === "string" ? body.domain.trim() : "";
    const feedit = typeof body?.feedit === "string" ? body.feedit.trim() : "add";

    if (!domain) {
      return new Response(
        JSON.stringify({ loggedIn: false, error: "domain is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // This API is public; apiid/apikey/kkyy are routing identifiers.
    const url = `${BRON_STATUS_API}?feedit=${encodeURIComponent(feedit)}&domain=${encodeURIComponent(domain)}&apiid=${encodeURIComponent(BRON_API_ID)}&apikey=${encodeURIComponent(BRON_API_KEY)}&kkyy=${encodeURIComponent(BRON_KKYY)}`;
    console.log(`[BRON LOGIN STATUS] Fetching: ${url}`);

    const resp = await fetch(url, { method: "GET" });
    const text = await resp.text();
    console.log(`[BRON LOGIN STATUS] Status: ${resp.status}, body preview: ${text.slice(0, 120)}`);

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ loggedIn: false, status: resp.status, raw: text }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    const first = Array.isArray(data) && data.length > 0 ? (data as any[])[0] : null;
    const loggedIn = !!(first && typeof first === "object" && (first as any).domainid);

    return new Response(
      JSON.stringify({ loggedIn, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[BRON LOGIN STATUS] Error:", error);
    const errMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ loggedIn: false, error: errMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
