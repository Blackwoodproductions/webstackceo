import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRON_API_BASE = "https://public.imagehosting.space/feed";
const API_ID = "53084";
const API_KEY = "347819526879185";
const API_SECRET = "AKhpU6QAbMtUDTphRPCezo96CztR9EXR";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();

    if (!domain) {
      console.error("[bron-feed] Missing domain parameter");
      return new Response(
        JSON.stringify({ error: "Domain is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[bron-feed] Fetching data for domain: ${domain}`);

    // Construct the API URL
    const apiUrl = `${BRON_API_BASE}/Article.php?feedit=1&domain=${encodeURIComponent(domain)}&apiid=${API_ID}&apikey=${API_KEY}&kkyy=${API_SECRET}`;
    
    console.log(`[bron-feed] Calling BRON API...`);
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "WebStack-SEO-Dashboard/1.0",
      },
    });

    console.log(`[bron-feed] BRON API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[bron-feed] BRON API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `BRON API returned ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log(`[bron-feed] Successfully fetched data, items: ${Array.isArray(data) ? data.length : 'not an array'}`);

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[bron-feed] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
