import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchConsoleRequest {
  action: 'sites' | 'performance' | 'indexing' | 'sitemaps';
  accessToken: string;
  siteUrl?: string;
  startDate?: string;
  endDate?: string;
  dimensions?: string[];
  rowLimit?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accessToken, siteUrl, startDate, endDate, dimensions, rowLimit } = await req.json() as SearchConsoleRequest;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Access token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    let result: unknown;

    switch (action) {
      case 'sites': {
        // Get list of sites the user has access to
        const response = await fetch(
          "https://www.googleapis.com/webmasters/v3/sites",
          { headers }
        );
        result = await response.json();
        break;
      }

      case 'performance': {
        if (!siteUrl) {
          return new Response(
            JSON.stringify({ error: "Site URL is required for performance data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get performance data (clicks, impressions, CTR, position)
        const encodedSiteUrl = encodeURIComponent(siteUrl);
        const response = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              startDate: startDate || getDateNDaysAgo(28),
              endDate: endDate || getDateNDaysAgo(0),
              dimensions: dimensions || ["query"],
              rowLimit: rowLimit || 25,
              aggregationType: "auto",
            }),
          }
        );
        result = await response.json();
        break;
      }

      case 'indexing': {
        if (!siteUrl) {
          return new Response(
            JSON.stringify({ error: "Site URL is required for indexing data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get URL inspection / indexing status
        const encodedSiteUrl = encodeURIComponent(siteUrl);
        
        // Get crawl stats using Search Console API
        const [inspectionResponse, coverageResponse] = await Promise.all([
          // Index coverage summary
          fetch(
            `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`,
            {
              method: "POST",
              headers,
              body: JSON.stringify({
                inspectionUrl: siteUrl.replace('sc-domain:', 'https://'),
                siteUrl: siteUrl,
              }),
            }
          ).catch(() => null),
          // Get sitemaps for coverage info
          fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps`,
            { headers }
          ),
        ]);

        const sitemapsData = await coverageResponse.json();
        
        result = {
          sitemaps: sitemapsData,
          // Note: Full index coverage requires Search Console API v1 with specific permissions
        };
        break;
      }

      case 'sitemaps': {
        if (!siteUrl) {
          return new Response(
            JSON.stringify({ error: "Site URL is required for sitemaps data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const encodedSiteUrl = encodeURIComponent(siteUrl);
        const response = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps`,
          { headers }
        );
        result = await response.json();
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Search Console API error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getDateNDaysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split('T')[0];
}
