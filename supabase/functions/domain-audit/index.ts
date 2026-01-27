import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SEOMetrics {
  domainRating: number;
  rankScore: number;
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
  ahrefs: SEOMetrics | null;  // Keep the key name for backward compatibility
  ahrefsError: string | null;
  history: HistoryDataPoint[] | null;
  dataSource: string;
}

// Helper to call DataForSEO API
async function callDataForSEO(
  login: string,
  password: string,
  endpoint: string,
  data: any
): Promise<any> {
  const credentials = btoa(`${login}:${password}`);
  const url = `https://api.dataforseo.com/v3${endpoint}`;
  
  console.log(`[DataForSEO] Calling: POST ${url}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();
  
  if (response.status !== 200 || responseData.status_code !== 20000) {
    console.error(`[DataForSEO] API error: ${response.status}`, responseData);
    throw new Error(responseData.status_message || `API error: ${response.status}`);
  }
  
  return responseData;
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

    const login = Deno.env.get("DATAFORSEO_LOGIN");
    const password = Deno.env.get("DATAFORSEO_PASSWORD");
    
    if (!login || !password) {
      console.error("[Domain Audit] DataForSEO credentials not configured");
      return new Response(
        JSON.stringify({ 
          ahrefs: null, 
          ahrefsError: "SEO data API credentials not configured",
          history: null,
          dataSource: "none",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean the domain
    let cleanDomain = domain.toLowerCase().trim();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, "");
    cleanDomain = cleanDomain.split("/")[0];

    console.log(`[Domain Audit] Fetching DataForSEO data for domain: ${cleanDomain}`);

    const result: AuditResult = {
      ahrefs: null,
      ahrefsError: null,
      history: null,
      dataSource: "dataforseo",
    };

    try {
      // ===== 1. Get Domain Rank Overview from Labs API =====
      // This provides organic traffic, keywords, and traffic value
      let labsData: any = null;
      try {
        const labsResponse = await callDataForSEO(login, password, '/dataforseo_labs/google/domain_rank_overview/live', [{
          target: cleanDomain,
          location_code: 2840, // US
          language_code: "en"
        }]);
        
        if (labsResponse?.tasks?.[0]?.result?.[0]) {
          labsData = labsResponse.tasks[0].result[0];
          console.log("[Domain Audit] Labs data received:", JSON.stringify(labsData).slice(0, 500));
        }
      } catch (labsErr) {
        console.warn("[Domain Audit] Labs API error (non-fatal):", labsErr);
      }

      // ===== 2. Get Backlinks Summary =====
      let backlinksData: any = null;
      try {
        const backlinksResponse = await callDataForSEO(login, password, '/backlinks/summary/live', [{
          target: cleanDomain,
          include_subdomains: true
        }]);
        
        if (backlinksResponse?.tasks?.[0]?.result?.[0]) {
          backlinksData = backlinksResponse.tasks[0].result[0];
          console.log("[Domain Audit] Backlinks data received:", JSON.stringify(backlinksData).slice(0, 500));
        }
      } catch (backlinksErr) {
        console.warn("[Domain Audit] Backlinks API error (non-fatal):", backlinksErr);
      }

      // ===== 3. Get Backlinks History for trend data =====
      let historyData: HistoryDataPoint[] = [];
      try {
        // Calculate date range (2 years)
        const today = new Date();
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        
        const historyResponse = await callDataForSEO(login, password, '/backlinks/history/live', [{
          target: cleanDomain,
          date_from: twoYearsAgo.toISOString().split('T')[0],
          date_to: today.toISOString().split('T')[0]
        }]);
        
        if (historyResponse?.tasks?.[0]?.result?.[0]?.items) {
          const items = historyResponse.tasks[0].result[0].items;
          console.log(`[Domain Audit] History data received: ${items.length} data points`);
          
          // Map history items - DataForSEO provides rank and backlinks history
          historyData = items.map((item: any) => ({
            date: item.date,
            organicTraffic: item.etv || 0, // Estimated Traffic Value
            organicKeywords: Math.round((item.etv || 0) * 0.1), // Estimate
            domainRating: Math.round(item.rank || 0), // Domain rank at that time
            trafficValue: Math.round(item.etv || 0),
          }));
        }
      } catch (historyErr) {
        console.warn("[Domain Audit] History API error (non-fatal):", historyErr);
      }

      // ===== 4. Get Bulk Ranks for overall domain score =====
      let bulkRanksData: any = null;
      try {
        const ranksResponse = await callDataForSEO(login, password, '/backlinks/bulk_ranks/live', [{
          targets: [cleanDomain]
        }]);
        
        if (ranksResponse?.tasks?.[0]?.result?.[0]) {
          bulkRanksData = ranksResponse.tasks[0].result[0];
          console.log("[Domain Audit] Bulk ranks data received:", JSON.stringify(bulkRanksData).slice(0, 500));
        }
      } catch (ranksErr) {
        console.warn("[Domain Audit] Bulk Ranks API error (non-fatal):", ranksErr);
      }

      // ===== Compile Final Metrics =====
      
      // Domain Rating calculation:
      // DataForSEO uses "rank" (0-1000 scale) - we normalize to 0-100
      // Also can use backlinks rank which is more comparable to Ahrefs DR
      const rawRank = bulkRanksData?.rank || backlinksData?.rank || 0;
      // Convert from 1000 scale to 100 scale, higher is better
      // DataForSEO rank is inverse (lower = better), so we need to flip it
      const domainRating = rawRank > 0 
        ? Math.min(100, Math.round(Math.log10(1000000 / Math.max(1, rawRank)) * 20))
        : (backlinksData?.referring_domains ? Math.min(100, Math.round(Math.log10(backlinksData.referring_domains + 1) * 15)) : 0);
      
      // Traffic and keywords from Labs API
      const organicTraffic = labsData?.etv || labsData?.metrics?.organic?.etv || 0;
      const organicKeywords = labsData?.metrics?.organic?.count || labsData?.keywords_count || 0;
      const trafficValue = labsData?.metrics?.organic?.estimated_paid_traffic_cost || Math.round(organicTraffic * 0.5);

      // Backlinks data
      const backlinks = backlinksData?.backlinks || 0;
      const backlinksAllTime = backlinksData?.backlinks || 0; // DataForSEO doesn't differentiate
      const referringDomains = backlinksData?.referring_domains || 0;
      const referringDomainsAllTime = backlinksData?.referring_domains || 0;
      
      // Rank score (global rank position)
      const rankScore = bulkRanksData?.rank || backlinksData?.rank || 0;

      result.ahrefs = {
        domainRating,
        rankScore,
        backlinks,
        backlinksAllTime,
        referringDomains,
        referringDomainsAllTime,
        organicTraffic: Math.round(organicTraffic),
        organicKeywords: Math.round(organicKeywords),
        trafficValue: Math.round(trafficValue),
      };
      
      result.history = historyData.length > 0 ? historyData : null;

      console.log("[Domain Audit] Final metrics:", JSON.stringify(result.ahrefs));

    } catch (err) {
      console.error("[Domain Audit] Error fetching data:", err);
      result.ahrefsError = err instanceof Error ? err.message : "Failed to fetch SEO data";
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Domain Audit] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
