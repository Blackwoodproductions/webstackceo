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
  ahrefs: SEOMetrics | null;
  ahrefsError: string | null;
  history: HistoryDataPoint[] | null;
  dataSource: string;
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

    const ahrefsApiKey = Deno.env.get("AHREFS_API_KEY");
    
    if (!ahrefsApiKey) {
      console.error("[Domain Audit] Ahrefs API key not configured");
      return new Response(
        JSON.stringify({ 
          ahrefs: null, 
          ahrefsError: "Ahrefs API key not configured",
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

    console.log(`[Domain Audit] Fetching Ahrefs data for domain: ${cleanDomain}`);

    const result: AuditResult = {
      ahrefs: null,
      ahrefsError: null,
      history: null,
      dataSource: "ahrefs",
    };

    try {
      // ===== 1. Get Domain Rating =====
      const drUrl = `https://apiv2.ahrefs.com?token=${ahrefsApiKey}&from=domain_rating&target=${cleanDomain}&mode=domain&output=json`;
      console.log("[Domain Audit] Fetching domain rating...");
      
      const drResponse = await fetch(drUrl);
      const drData = await drResponse.json();
      
      if (drData.error) {
        throw new Error(drData.error);
      }

      // ===== 2. Get Backlinks Stats =====
      const backlinksUrl = `https://apiv2.ahrefs.com?token=${ahrefsApiKey}&from=backlinks_stats&target=${cleanDomain}&mode=domain&output=json`;
      console.log("[Domain Audit] Fetching backlinks stats...");
      
      const backlinksResponse = await fetch(backlinksUrl);
      const backlinksData = await backlinksResponse.json();

      // ===== 3. Get Organic Keywords & Traffic =====
      const organicUrl = `https://apiv2.ahrefs.com?token=${ahrefsApiKey}&from=positions_metrics&target=${cleanDomain}&mode=domain&output=json`;
      console.log("[Domain Audit] Fetching organic metrics...");
      
      const organicResponse = await fetch(organicUrl);
      const organicData = await organicResponse.json();

      // ===== 4. Get Ahrefs Rank =====
      const rankUrl = `https://apiv2.ahrefs.com?token=${ahrefsApiKey}&from=ahrefs_rank&target=${cleanDomain}&mode=domain&output=json`;
      console.log("[Domain Audit] Fetching Ahrefs rank...");
      
      const rankResponse = await fetch(rankUrl);
      const rankData = await rankResponse.json();

      // ===== 5. Get History Data (past 2 years) =====
      const historyData: HistoryDataPoint[] = [];
      try {
        // Calculate date range
        const today = new Date();
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        
        const dateFrom = twoYearsAgo.toISOString().split('T')[0];
        const dateTo = today.toISOString().split('T')[0];
        
        const historyUrl = `https://apiv2.ahrefs.com?token=${ahrefsApiKey}&from=positions_metrics&target=${cleanDomain}&mode=domain&output=json&date_from=${dateFrom}&date_to=${dateTo}&history_grouping=monthly`;
        console.log("[Domain Audit] Fetching history data...");
        
        const historyResponse = await fetch(historyUrl);
        const historyJson = await historyResponse.json();
        
        if (historyJson.metrics && Array.isArray(historyJson.metrics)) {
          for (const item of historyJson.metrics) {
            historyData.push({
              date: item.date || new Date().toISOString().split('T')[0],
              organicTraffic: item.traffic || 0,
              organicKeywords: item.positions || 0,
              domainRating: drData.domain?.domain_rating || 0,
              trafficValue: item.traffic_cost || 0,
            });
          }
        }
        console.log(`[Domain Audit] History data received: ${historyData.length} data points`);
      } catch (histErr) {
        console.warn("[Domain Audit] History fetch error (non-fatal):", histErr);
      }

      // ===== Compile Final Metrics =====
      result.ahrefs = {
        domainRating: drData.domain?.domain_rating || 0,
        rankScore: rankData.domain?.ahrefs_rank || 0,
        backlinks: backlinksData.stats?.live || 0,
        backlinksAllTime: backlinksData.stats?.all_time || 0,
        referringDomains: backlinksData.stats?.refdomains || 0,
        referringDomainsAllTime: backlinksData.stats?.refdomains_all_time || 0,
        organicTraffic: organicData.metrics?.traffic || 0,
        organicKeywords: organicData.metrics?.positions || 0,
        trafficValue: organicData.metrics?.traffic_cost || 0,
      };
      
      result.history = historyData.length > 0 ? historyData : null;

      console.log("[Domain Audit] Final Ahrefs metrics:", JSON.stringify(result.ahrefs));

    } catch (err) {
      console.error("[Domain Audit] Error fetching Ahrefs data:", err);
      result.ahrefsError = err instanceof Error ? err.message : "Failed to fetch Ahrefs data";
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
