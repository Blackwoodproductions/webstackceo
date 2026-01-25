import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CoreWebVitalsMetrics {
  lcp: { value: number; rating: "good" | "needs-improvement" | "poor"; element?: string };
  fid: { value: number; rating: "good" | "needs-improvement" | "poor" };
  cls: { value: number; rating: "good" | "needs-improvement" | "poor"; element?: string };
  inp: { value: number; rating: "good" | "needs-improvement" | "poor" };
  ttfb: { value: number; rating: "good" | "needs-improvement" | "poor" };
  fcp: { value: number; rating: "good" | "needs-improvement" | "poor" };
  mobile: {
    score: number;
    lcp: number;
    cls: number;
    fid: number;
  };
  desktop: {
    score: number;
    lcp: number;
    cls: number;
    fid: number;
  };
  recommendations: string[];
}

function getRating(value: number, thresholds: { good: number; poor: number }, lowerIsBetter = true): "good" | "needs-improvement" | "poor" {
  if (lowerIsBetter) {
    if (value <= thresholds.good) return "good";
    if (value <= thresholds.poor) return "poor";
    return "needs-improvement";
  } else {
    if (value >= thresholds.good) return "good";
    if (value >= thresholds.poor) return "poor";
    return "needs-improvement";
  }
}

async function fetchPageSpeedData(url: string, strategy: "mobile" | "desktop", apiKey: string) {
  const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  apiUrl.searchParams.set("url", url);
  apiUrl.searchParams.set("key", apiKey);
  apiUrl.searchParams.set("strategy", strategy);
  apiUrl.searchParams.set("category", "performance");

  console.log(`Fetching PageSpeed data for ${url} (${strategy})`);

  const response = await fetch(apiUrl.toString());
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`PageSpeed API error (${strategy}): ${response.status} - ${errorText}`);
    throw new Error(`PageSpeed API error: ${response.status}`);
  }

  return response.json();
}

function extractMetricsFromResponse(data: any): {
  score: number;
  lcp: number;
  cls: number;
  fid: number;
  fcp: number;
  ttfb: number;
  inp: number;
  lcpElement?: string;
  clsElement?: string;
  recommendations: string[];
} {
  const lighthouse = data.lighthouseResult;
  const audits = lighthouse?.audits || {};
  
  // Performance score (0-100)
  const score = Math.round((lighthouse?.categories?.performance?.score || 0) * 100);
  
  // Core Web Vitals from audits
  const lcpAudit = audits["largest-contentful-paint"] || {};
  const clsAudit = audits["cumulative-layout-shift"] || {};
  const fcpAudit = audits["first-contentful-paint"] || {};
  const ttfbAudit = audits["server-response-time"] || {};
  const inpAudit = audits["interaction-to-next-paint"] || audits["max-potential-fid"] || {};
  const fidAudit = audits["max-potential-fid"] || {};
  
  // Extract values (converting from ms to seconds for LCP/FCP)
  const lcp = (lcpAudit.numericValue || 0) / 1000; // Convert ms to seconds
  const cls = clsAudit.numericValue || 0;
  const fcp = (fcpAudit.numericValue || 0) / 1000; // Convert ms to seconds
  const ttfb = ttfbAudit.numericValue || 0; // Keep in ms
  const inp = inpAudit.numericValue || 0; // Keep in ms
  const fid = fidAudit.numericValue || 0; // Keep in ms
  
  // Try to extract LCP element
  let lcpElement: string | undefined;
  const lcpDetails = lcpAudit.details;
  if (lcpDetails?.items?.[0]?.element?.value) {
    lcpElement = lcpDetails.items[0].element.value;
  } else if (lcpDetails?.items?.[0]?.node?.snippet) {
    lcpElement = lcpDetails.items[0].node.snippet;
  }
  
  // Try to extract CLS element
  let clsElement: string | undefined;
  const clsDetails = clsAudit.details;
  if (clsDetails?.items?.[0]?.node?.snippet) {
    clsElement = clsDetails.items[0].node.snippet;
  }
  
  // Extract recommendations from failed audits
  const recommendations: string[] = [];
  const opportunityAudits = [
    "render-blocking-resources",
    "unminified-css",
    "unminified-javascript",
    "unused-css-rules",
    "unused-javascript",
    "modern-image-formats",
    "uses-optimized-images",
    "uses-responsive-images",
    "offscreen-images",
    "uses-text-compression",
    "uses-rel-preconnect",
    "server-response-time",
    "redirects",
    "uses-http2",
    "efficient-animated-content",
    "duplicated-javascript",
    "legacy-javascript",
  ];
  
  for (const auditId of opportunityAudits) {
    const audit = audits[auditId];
    if (audit && audit.score !== null && audit.score < 0.9 && audit.title) {
      let recommendation = audit.title;
      if (audit.displayValue) {
        recommendation += ` (${audit.displayValue})`;
      }
      recommendations.push(recommendation);
    }
  }
  
  return {
    score,
    lcp,
    cls,
    fid,
    fcp,
    ttfb,
    inp,
    lcpElement,
    clsElement,
    recommendations: recommendations.slice(0, 10), // Limit to 10 recommendations
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_PAGESPEED_API_KEY = Deno.env.get("GOOGLE_PAGESPEED_API_KEY");
    
    if (!GOOGLE_PAGESPEED_API_KEY) {
      console.error("GOOGLE_PAGESPEED_API_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          error: "PageSpeed API key not configured",
          metrics: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure URL has protocol
    let targetUrl = url;
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }

    console.log(`Analyzing PageSpeed for: ${targetUrl}`);

    // Fetch both mobile and desktop data in parallel
    const [mobileData, desktopData] = await Promise.all([
      fetchPageSpeedData(targetUrl, "mobile", GOOGLE_PAGESPEED_API_KEY),
      fetchPageSpeedData(targetUrl, "desktop", GOOGLE_PAGESPEED_API_KEY),
    ]);

    const mobileMetrics = extractMetricsFromResponse(mobileData);
    const desktopMetrics = extractMetricsFromResponse(desktopData);

    // Use mobile metrics as primary (Google uses mobile-first indexing)
    const primaryMetrics = mobileMetrics;
    
    // Combine recommendations from both
    const allRecommendations = [...new Set([...mobileMetrics.recommendations, ...desktopMetrics.recommendations])];

    const result: CoreWebVitalsMetrics = {
      lcp: {
        value: primaryMetrics.lcp,
        rating: getRating(primaryMetrics.lcp, { good: 2.5, poor: 4.0 }),
        element: primaryMetrics.lcpElement,
      },
      fid: {
        value: primaryMetrics.fid,
        rating: getRating(primaryMetrics.fid, { good: 100, poor: 300 }),
      },
      cls: {
        value: primaryMetrics.cls,
        rating: getRating(primaryMetrics.cls, { good: 0.1, poor: 0.25 }),
        element: primaryMetrics.clsElement,
      },
      inp: {
        value: primaryMetrics.inp,
        rating: getRating(primaryMetrics.inp, { good: 200, poor: 500 }),
      },
      ttfb: {
        value: primaryMetrics.ttfb,
        rating: getRating(primaryMetrics.ttfb, { good: 800, poor: 1800 }),
      },
      fcp: {
        value: primaryMetrics.fcp,
        rating: getRating(primaryMetrics.fcp, { good: 1.8, poor: 3.0 }),
      },
      mobile: {
        score: mobileMetrics.score,
        lcp: mobileMetrics.lcp,
        cls: mobileMetrics.cls,
        fid: mobileMetrics.fid,
      },
      desktop: {
        score: desktopMetrics.score,
        lcp: desktopMetrics.lcp,
        cls: desktopMetrics.cls,
        fid: desktopMetrics.fid,
      },
      recommendations: allRecommendations,
    };

    console.log(`PageSpeed analysis complete. Mobile score: ${mobileMetrics.score}, Desktop score: ${desktopMetrics.score}`);

    return new Response(
      JSON.stringify({ metrics: result, error: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("PageSpeed Insights error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to analyze page speed",
        metrics: null,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
