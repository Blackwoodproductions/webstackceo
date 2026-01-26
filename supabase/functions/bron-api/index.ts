import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// BRON API Configuration - New FRL API
const BRON_API_BASE = "https://public6.freerelevantlinks.com/api";

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

    let apiUrl: string;
    const baseParams = `domain=${encodeURIComponent(domain)}`;

    // Map endpoints to FRL API request types
    switch (endpoint) {
      case "articles":
        apiUrl = `${BRON_API_BASE}/samplecall.php?request=articles&${baseParams}`;
        break;

      case "backlinks":
      case "links":
        apiUrl = `${BRON_API_BASE}/samplecall.php?request=reportlinksout&${baseParams}`;
        break;

      case "rankings":
        apiUrl = `${BRON_API_BASE}/samplecall.php?request=rankings&${baseParams}`;
        break;

      case "keywords":
        apiUrl = `${BRON_API_BASE}/samplecall.php?request=keywords&${baseParams}`;
        break;

      case "authority":
        apiUrl = `${BRON_API_BASE}/samplecall.php?request=authority&${baseParams}`;
        break;

      case "profile":
        apiUrl = `${BRON_API_BASE}/samplecall.php?request=profile&${baseParams}`;
        break;

      case "stats":
        apiUrl = `${BRON_API_BASE}/samplecall.php?request=stats&${baseParams}`;
        break;

      case "campaigns":
        apiUrl = `${BRON_API_BASE}/samplecall.php?request=campaigns&${baseParams}`;
        break;

      case "reports":
        apiUrl = `${BRON_API_BASE}/samplecall.php?request=reports&${baseParams}`;
        break;

      case "clusters":
        apiUrl = `${BRON_API_BASE}/samplecall.php?request=clusters&${baseParams}`;
        break;

      case "deeplinks":
        apiUrl = `${BRON_API_BASE}/samplecall.php?request=deeplinks&${baseParams}`;
        break;

      case "all":
        apiUrl = `${BRON_API_BASE}/samplecall.php?request=all&${baseParams}`;
        break;

      default:
        // Try the endpoint as a direct request type
        apiUrl = `${BRON_API_BASE}/samplecall.php?request=${encodeURIComponent(endpoint)}&${baseParams}`;
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
      // The API might return PHP warnings before JSON, try to extract JSON
      const jsonMatch = responseText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[1]);
      } else {
        data = JSON.parse(responseText);
      }
    } catch {
      // If not JSON, check for PHP errors and return meaningful error
      if (responseText.includes("Warning:") || responseText.includes("Error:") || responseText.includes("SQL syntax")) {
        console.log(`[bron-api] API returned PHP errors`);
        return new Response(
          JSON.stringify({ 
            error: "API is experiencing issues", 
            details: "The BRON API returned server-side errors. The domain may not be configured yet.",
            endpoint,
            raw: responseText.substring(0, 500)
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Otherwise wrap as raw response
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
