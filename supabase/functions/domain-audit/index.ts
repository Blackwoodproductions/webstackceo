import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AhrefsMetrics {
  domainRating: number;
  backlinks: number;
  referringDomains: number;
  organicTraffic: number;
  organicKeywords: number;
}

interface AuditResult {
  ahrefs: AhrefsMetrics | null;
  ahrefsError: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();
    
    if (!domain) {
      return new Response(
        JSON.stringify({ error: "Domain is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const AHREFS_API_KEY = Deno.env.get("AHREFS_API_KEY");
    
    if (!AHREFS_API_KEY) {
      console.error("AHREFS_API_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          ahrefs: null, 
          ahrefsError: "Ahrefs API key not configured" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean the domain
    let cleanDomain = domain.toLowerCase().trim();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, "");
    cleanDomain = cleanDomain.split("/")[0];

    console.log(`Fetching Ahrefs data for domain: ${cleanDomain}`);

    const result: AuditResult = {
      ahrefs: null,
      ahrefsError: null,
    };

    try {
      // Ahrefs Domain Rating API
      // Using the Ahrefs API v3
      const ahrefsUrl = new URL("https://api.ahrefs.com/v3/site-explorer/domain-rating");
      ahrefsUrl.searchParams.set("target", cleanDomain);
      ahrefsUrl.searchParams.set("output", "json");

      console.log(`Calling Ahrefs API: ${ahrefsUrl.toString()}`);

      const ahrefsResponse = await fetch(ahrefsUrl.toString(), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${AHREFS_API_KEY}`,
          "Accept": "application/json",
        },
      });

      if (!ahrefsResponse.ok) {
        const errorText = await ahrefsResponse.text();
        console.error(`Ahrefs API error: ${ahrefsResponse.status} - ${errorText}`);
        
        if (ahrefsResponse.status === 401) {
          result.ahrefsError = "Invalid Ahrefs API key";
        } else if (ahrefsResponse.status === 403) {
          result.ahrefsError = "Ahrefs API access denied - check your subscription";
        } else if (ahrefsResponse.status === 429) {
          result.ahrefsError = "Ahrefs API rate limit exceeded";
        } else {
          result.ahrefsError = `Ahrefs API error: ${ahrefsResponse.status}`;
        }
      } else {
        const drData = await ahrefsResponse.json();
        console.log("Ahrefs DR response:", JSON.stringify(drData));

        // Now get backlinks metrics
        const backlinksUrl = new URL("https://api.ahrefs.com/v3/site-explorer/metrics");
        backlinksUrl.searchParams.set("target", cleanDomain);
        backlinksUrl.searchParams.set("output", "json");

        const backlinksResponse = await fetch(backlinksUrl.toString(), {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${AHREFS_API_KEY}`,
            "Accept": "application/json",
          },
        });

        let metricsData = null;
        if (backlinksResponse.ok) {
          metricsData = await backlinksResponse.json();
          console.log("Ahrefs metrics response:", JSON.stringify(metricsData));
        }

        result.ahrefs = {
          domainRating: drData.domain_rating || drData.domainRating || 0,
          backlinks: metricsData?.metrics?.backlinks || metricsData?.backlinks || 0,
          referringDomains: metricsData?.metrics?.refdomains || metricsData?.refdomains || 0,
          organicTraffic: metricsData?.metrics?.org_traffic || metricsData?.organic?.traffic || 0,
          organicKeywords: metricsData?.metrics?.org_keywords || metricsData?.organic?.keywords || 0,
        };
      }
    } catch (ahrefsErr) {
      console.error("Ahrefs fetch error:", ahrefsErr);
      result.ahrefsError = ahrefsErr instanceof Error ? ahrefsErr.message : "Failed to fetch Ahrefs data";
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Domain audit error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
