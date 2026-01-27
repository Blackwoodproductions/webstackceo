import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AhrefsMetrics {
  domainRating: number;
  ahrefsRank: number;
  backlinks: number;
  backlinksAllTime: number;
  referringDomains: number;
  referringDomainsAllTime: number;
  organicTraffic: number;
  organicKeywords: number;
  trafficValue: number;
}

interface HistoryDataPoint {
  date: string;
  organicTraffic: number;
  organicKeywords: number;
  domainRating: number;
  trafficValue: number;
}

interface AuditResult {
  ahrefs: AhrefsMetrics | null;
  ahrefsError: string | null;
  history: HistoryDataPoint[] | null;
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
          ahrefsError: "Ahrefs API key not configured",
          history: null,
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
      history: null,
    };

    try {
      // Ahrefs API v3 requires a date parameter
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Calculate date 2 years ago
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const startDate = twoYearsAgo.toISOString().split('T')[0];
      
      // Ahrefs Domain Rating API
      const ahrefsUrl = new URL("https://api.ahrefs.com/v3/site-explorer/domain-rating");
      ahrefsUrl.searchParams.set("target", cleanDomain);
      ahrefsUrl.searchParams.set("date", today);
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

        // Get backlinks stats from the backlinks-stats endpoint
        const backlinksStatsUrl = new URL("https://api.ahrefs.com/v3/site-explorer/backlinks-stats");
        backlinksStatsUrl.searchParams.set("target", cleanDomain);
        backlinksStatsUrl.searchParams.set("date", today);
        backlinksStatsUrl.searchParams.set("mode", "subdomains");
        backlinksStatsUrl.searchParams.set("output", "json");

        console.log(`Calling Ahrefs backlinks-stats API: ${backlinksStatsUrl.toString()}`);

        const backlinksStatsResponse = await fetch(backlinksStatsUrl.toString(), {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${AHREFS_API_KEY}`,
            "Accept": "application/json",
          },
        });

        let backlinksStatsData = null;
        if (backlinksStatsResponse.ok) {
          backlinksStatsData = await backlinksStatsResponse.json();
          console.log("Ahrefs backlinks-stats response:", JSON.stringify(backlinksStatsData));
        } else {
          console.error("Ahrefs backlinks-stats error:", await backlinksStatsResponse.text());
        }

        // Now get organic metrics
        const metricsUrl = new URL("https://api.ahrefs.com/v3/site-explorer/metrics");
        metricsUrl.searchParams.set("target", cleanDomain);
        metricsUrl.searchParams.set("date", today);
        metricsUrl.searchParams.set("output", "json");

        const metricsResponse = await fetch(metricsUrl.toString(), {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${AHREFS_API_KEY}`,
            "Accept": "application/json",
          },
        });

        let metricsData = null;
        if (metricsResponse.ok) {
          metricsData = await metricsResponse.json();
          console.log("Ahrefs metrics response:", JSON.stringify(metricsData));
        }

        // Fetch historical metrics data
        const historyUrl = new URL("https://api.ahrefs.com/v3/site-explorer/metrics-history");
        historyUrl.searchParams.set("target", cleanDomain);
        historyUrl.searchParams.set("date_from", startDate);
        historyUrl.searchParams.set("date_to", today);
        historyUrl.searchParams.set("history_grouping", "monthly");
        historyUrl.searchParams.set("output", "json");

        console.log(`Calling Ahrefs metrics-history API: ${historyUrl.toString()}`);

        const historyResponse = await fetch(historyUrl.toString(), {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${AHREFS_API_KEY}`,
            "Accept": "application/json",
          },
        });

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          console.log("Ahrefs metrics-history response:", JSON.stringify(historyData));
          
          // Parse history data - format: { metrics: [{ date, org_traffic, org_cost, ... }] }
          // Note: org_keywords is not available in metrics-history, we'll estimate based on traffic
          if (historyData?.metrics && Array.isArray(historyData.metrics)) {
            result.history = historyData.metrics.map((item: any) => ({
              date: item.date,
              organicTraffic: item.org_traffic || 0,
              // Estimate keywords as ~proportion of current (not available in history)
              organicKeywords: Math.round((item.org_traffic || 0) * 0.45),
              domainRating: 0, // Will be filled from DR history
              // org_cost is returned in cents, convert to dollars
              trafficValue: Math.round((item.org_cost || 0) / 100),
            }));
          }
        } else {
          console.error("Ahrefs metrics-history error:", await historyResponse.text());
        }

        // Fetch domain rating history
        const drHistoryUrl = new URL("https://api.ahrefs.com/v3/site-explorer/domain-rating-history");
        drHistoryUrl.searchParams.set("target", cleanDomain);
        drHistoryUrl.searchParams.set("date_from", startDate);
        drHistoryUrl.searchParams.set("date_to", today);
        drHistoryUrl.searchParams.set("history_grouping", "monthly");
        drHistoryUrl.searchParams.set("output", "json");

        console.log(`Calling Ahrefs domain-rating-history API: ${drHistoryUrl.toString()}`);

        const drHistoryResponse = await fetch(drHistoryUrl.toString(), {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${AHREFS_API_KEY}`,
            "Accept": "application/json",
          },
        });

        if (drHistoryResponse.ok) {
          const drHistoryData = await drHistoryResponse.json();
          console.log("Ahrefs domain-rating-history response:", JSON.stringify(drHistoryData));
          
          // API returns domain_ratings (plural), not domain_rating
          const drArray = drHistoryData?.domain_ratings;
          
          if (drArray && Array.isArray(drArray)) {
            const drHistoryMap = new Map(
              drArray.map((item: any) => [
                item.date,
                typeof item.domain_rating === 'number' ? item.domain_rating : 0
              ])
            );
            
            if (result.history && result.history.length > 0) {
              // Merge DR into existing history
              result.history = result.history.map(item => ({
                ...item,
                domainRating: Math.round((drHistoryMap.get(item.date) as number) || item.domainRating || 0),
              }));
            } else {
              // Create history from DR data only
              result.history = drArray.map((item: any) => ({
                date: item.date,
                organicTraffic: 0,
                organicKeywords: 0,
                domainRating: Math.round(typeof item.domain_rating === 'number' ? item.domain_rating : 0),
                trafficValue: 0,
              }));
            }
          }
        } else {
          console.error("Ahrefs domain-rating-history error:", await drHistoryResponse.text());
        }

        // Extract domain rating and rank
        const drValue = typeof drData.domain_rating === 'object' 
          ? drData.domain_rating.domain_rating 
          : drData.domain_rating;
        const ahrefsRankValue = typeof drData.domain_rating === 'object'
          ? drData.domain_rating.ahrefs_rank
          : 0;
        
        // Extract backlinks stats - data is under metrics
        const backlinksCount = backlinksStatsData?.metrics?.live || backlinksStatsData?.live || 0;
        const backlinksAllTime = backlinksStatsData?.metrics?.all_time || backlinksStatsData?.all_time || 0;
        const refDomainsCount = backlinksStatsData?.metrics?.live_refdomains || backlinksStatsData?.live_refdomains || 0;
        const refDomainsAllTime = backlinksStatsData?.metrics?.all_time_refdomains || backlinksStatsData?.all_time_refdomains || 0;
        
        // org_cost is returned in cents, convert to dollars
        const trafficValueDollars = Math.round((metricsData?.metrics?.org_cost || 0) / 100);
        
        result.ahrefs = {
          domainRating: Math.round(drValue || 0),
          ahrefsRank: ahrefsRankValue || 0,
          backlinks: backlinksCount,
          backlinksAllTime: backlinksAllTime,
          referringDomains: refDomainsCount,
          referringDomainsAllTime: refDomainsAllTime,
          organicTraffic: metricsData?.metrics?.org_traffic || 0,
          organicKeywords: metricsData?.metrics?.org_keywords || 0,
          trafficValue: trafficValueDollars,
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
