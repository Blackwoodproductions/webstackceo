import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// BRON API Configuration
const BRON_FEED_BASE = "https://public.imagehosting.space/feed";
const API_ID = "53084";
const API_KEY = "347819526879185";
const API_SECRET = "AKhpU6QAbMtUDTphRPCezo96CztR9EXR";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, endpoint } = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ error: "Domain is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[bron-api] Endpoint: ${endpoint}, Domain: ${domain}`);

    // Build base params for all BRON endpoints
    const baseParams = `domain=${encodeURIComponent(domain)}&apiid=${API_ID}&apikey=${API_KEY}&kkyy=${API_SECRET}`;
    let apiUrl: string;

    // All BRON Feed Endpoints from public.imagehosting.space
    switch (endpoint) {
      case "articles":
        apiUrl = `${BRON_FEED_BASE}/Article.php?feedit=1&${baseParams}`;
        break;

      case "backlinks":
        apiUrl = `${BRON_FEED_BASE}/Backlink.php?${baseParams}`;
        break;

      case "rankings":
        apiUrl = `${BRON_FEED_BASE}/Ranking.php?${baseParams}`;
        break;

      case "keywords":
        apiUrl = `${BRON_FEED_BASE}/Keyword.php?${baseParams}`;
        break;

      case "clusters":
        apiUrl = `${BRON_FEED_BASE}/Cluster.php?${baseParams}`;
        break;

      case "deeplinks":
        apiUrl = `${BRON_FEED_BASE}/DeepLink.php?${baseParams}`;
        break;

      case "authority":
        apiUrl = `${BRON_FEED_BASE}/Authority.php?${baseParams}`;
        break;

      case "profile":
        apiUrl = `${BRON_FEED_BASE}/Profile.php?${baseParams}`;
        break;

      case "stats":
        apiUrl = `${BRON_FEED_BASE}/Stats.php?${baseParams}`;
        break;

      case "campaigns":
        apiUrl = `${BRON_FEED_BASE}/Campaign.php?${baseParams}`;
        break;

      case "reports":
        apiUrl = `${BRON_FEED_BASE}/Report.php?${baseParams}`;
        break;

      case "links":
        apiUrl = `${BRON_FEED_BASE}/Link.php?${baseParams}`;
        break;

      case "all":
        // Fetch all available data in one call if supported
        apiUrl = `${BRON_FEED_BASE}/All.php?${baseParams}`;
        break;

      default:
        // Try the endpoint as a direct PHP file name
        apiUrl = `${BRON_FEED_BASE}/${endpoint}.php?${baseParams}`;
        break;
    }

    console.log(`[bron-api] Calling: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "WebStack-SEO-Dashboard/1.0",
      },
    });
    
    console.log(`[bron-api] Response status: ${response.status}`);

    // Get response text first to handle potential non-JSON responses
    const responseText = await response.text();
    console.log(`[bron-api] Response preview: ${responseText.substring(0, 200)}`);

    if (!response.ok) {
      console.error(`[bron-api] Error: ${response.status} - ${responseText}`);
      return new Response(
        JSON.stringify({ 
          error: `API returned ${response.status}`, 
          details: responseText,
          endpoint 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // If not JSON, return the text as-is wrapped in an object
      console.log(`[bron-api] Response is not JSON, wrapping text`);
      data = { raw: responseText, parsed: false };
    }

    console.log(`[bron-api] Success for ${endpoint}, data type: ${typeof data}, isArray: ${Array.isArray(data)}`);

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
