import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory cache with 10-minute TTL for performance data
const cache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

interface DailyMetricTimeSeries {
  dailyMetric: string;
  timeSeries?: {
    datedValues?: Array<{
      date?: { year: number; month: number; day: number };
      value?: string;
    }>;
  };
}

interface PerformanceMetrics {
  searchViews: number;
  mapViews: number;
  websiteClicks: number;
  phoneClicks: number;
  directionRequests: number;
  messagingClicks: number;
  bookings: number;
  foodOrders: number;
  dailyBreakdown: Array<{
    date: string;
    searchViews: number;
    mapViews: number;
    websiteClicks: number;
    phoneClicks: number;
    directionRequests: number;
  }>;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken, locationName } = await req.json();

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Missing accessToken" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!locationName) {
      return new Response(
        JSON.stringify({ error: "Missing locationName (e.g., locations/123456)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create cache key from token hash and location
    const cacheKey = `gmb_perf_${accessToken.slice(0, 8)}_${locationName}`;
    
    // Check cache first
    const cached = getCached(cacheKey);
    if (cached) {
      console.log("[gmb-performance] Returning cached data");
      return new Response(
        JSON.stringify({ ...cached, fromCache: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[gmb-performance] Fetching fresh data from Google APIs for", locationName);

    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const formatDate = (d: Date) => ({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    });

    // Request all available daily metrics
    const dailyMetrics = [
      "DAILY_METRIC_UNKNOWN",
      "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
      "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
      "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
      "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
      "BUSINESS_CONVERSATIONS",
      "BUSINESS_DIRECTION_REQUESTS",
      "CALL_CLICKS",
      "WEBSITE_CLICKS",
      "BUSINESS_BOOKINGS",
      "BUSINESS_FOOD_ORDERS",
      "BUSINESS_FOOD_MENU_CLICKS",
    ];

    // Use the new fetchMultiDailyMetricsTimeSeries endpoint
    const performanceRes = await fetch(
      `https://businessprofileperformance.googleapis.com/v1/${locationName}:fetchMultiDailyMetricsTimeSeries`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dailyMetrics,
          dailyRange: {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
          },
        }),
      }
    );

    if (!performanceRes.ok) {
      const body = await performanceRes.text().catch(() => "");
      const status = performanceRes.status;
      
      console.error(`[gmb-performance] API failed (${status}):`, body.slice(0, 500));
      
      return new Response(
        JSON.stringify({ 
          error: `Google Business Performance API request failed (${status})`,
          status,
          details: body.slice(0, 300),
          isQuotaError: status === 429,
          isNotEnabled: status === 403 && body.includes("API has not been used")
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const perfData = await performanceRes.json();
    console.log("[gmb-performance] Raw API response:", JSON.stringify(perfData).slice(0, 500));

    // Parse the metrics
    const metrics: PerformanceMetrics = {
      searchViews: 0,
      mapViews: 0,
      websiteClicks: 0,
      phoneClicks: 0,
      directionRequests: 0,
      messagingClicks: 0,
      bookings: 0,
      foodOrders: 0,
      dailyBreakdown: [],
    };

    // Map to aggregate daily values
    const dailyMap = new Map<string, {
      searchViews: number;
      mapViews: number;
      websiteClicks: number;
      phoneClicks: number;
      directionRequests: number;
    }>();

    if (perfData.multiDailyMetricTimeSeries && Array.isArray(perfData.multiDailyMetricTimeSeries)) {
      for (const series of perfData.multiDailyMetricTimeSeries as DailyMetricTimeSeries[]) {
        const metric = series.dailyMetric;
        const values = series.timeSeries?.datedValues || [];

        for (const dv of values) {
          const val = parseInt(dv.value || "0", 10);
          const dateStr = dv.date ? `${dv.date.year}-${String(dv.date.month).padStart(2, "0")}-${String(dv.date.day).padStart(2, "0")}` : "";

          // Aggregate totals
          if (metric.includes("SEARCH")) {
            metrics.searchViews += val;
          } else if (metric.includes("MAPS")) {
            metrics.mapViews += val;
          } else if (metric === "WEBSITE_CLICKS") {
            metrics.websiteClicks += val;
          } else if (metric === "CALL_CLICKS") {
            metrics.phoneClicks += val;
          } else if (metric === "BUSINESS_DIRECTION_REQUESTS") {
            metrics.directionRequests += val;
          } else if (metric === "BUSINESS_CONVERSATIONS") {
            metrics.messagingClicks += val;
          } else if (metric === "BUSINESS_BOOKINGS") {
            metrics.bookings += val;
          } else if (metric === "BUSINESS_FOOD_ORDERS") {
            metrics.foodOrders += val;
          }

          // Track daily breakdown
          if (dateStr) {
            if (!dailyMap.has(dateStr)) {
              dailyMap.set(dateStr, { searchViews: 0, mapViews: 0, websiteClicks: 0, phoneClicks: 0, directionRequests: 0 });
            }
            const day = dailyMap.get(dateStr)!;
            if (metric.includes("SEARCH")) day.searchViews += val;
            else if (metric.includes("MAPS")) day.mapViews += val;
            else if (metric === "WEBSITE_CLICKS") day.websiteClicks += val;
            else if (metric === "CALL_CLICKS") day.phoneClicks += val;
            else if (metric === "BUSINESS_DIRECTION_REQUESTS") day.directionRequests += val;
          }
        }
      }
    }

    // Convert daily map to sorted array
    metrics.dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const result = {
      metrics,
      locationName,
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      syncedAt: new Date().toISOString(),
      fromCache: false,
    };

    // Cache the result
    setCache(cacheKey, result);

    console.log("[gmb-performance] Processed metrics:", JSON.stringify(metrics));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[gmb-performance] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
