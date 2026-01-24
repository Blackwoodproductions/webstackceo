import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchConsoleRequest {
  action: 'sites' | 'performance' | 'indexing' | 'sitemaps' | 'urlInspection';
  accessToken: string;
  siteUrl?: string;
  startDate?: string;
  endDate?: string;
  dimensions?: string[];
  rowLimit?: number;
  startRow?: number;
  searchType?: 'web' | 'image' | 'video' | 'news' | 'discover' | 'googleNews';
  dataState?: 'all' | 'final';
  inspectionUrl?: string;
  dimensionFilterGroups?: Array<{
    groupType?: string;
    filters: Array<{
      dimension: string;
      operator: string;
      expression: string;
    }>;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      action, 
      accessToken, 
      siteUrl, 
      startDate, 
      endDate, 
      dimensions, 
      rowLimit,
      startRow,
      searchType,
      dataState,
      inspectionUrl,
      dimensionFilterGroups
    } = await req.json() as SearchConsoleRequest;

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
        console.log("Fetching sites from Google Search Console API...");
        const response = await fetch(
          "https://www.googleapis.com/webmasters/v3/sites",
          { headers }
        );
        result = await response.json();
        console.log("Sites API response:", JSON.stringify(result));
        break;
      }

      case 'performance': {
        if (!siteUrl) {
          return new Response(
            JSON.stringify({ error: "Site URL is required for performance data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Build request body with all available options
        const requestBody: Record<string, unknown> = {
          startDate: startDate || getDateNDaysAgo(28),
          endDate: endDate || getDateNDaysAgo(0),
          dimensions: dimensions || ["query"],
          rowLimit: rowLimit || 25,
          startRow: startRow || 0,
          aggregationType: "auto",
        };

        // Add search type if specified (web, image, video, news, discover, googleNews)
        if (searchType) {
          requestBody.type = searchType;
        }

        // Add data state if specified (all or final)
        if (dataState) {
          requestBody.dataState = dataState;
        }

        // Add dimension filters if specified
        if (dimensionFilterGroups && dimensionFilterGroups.length > 0) {
          requestBody.dimensionFilterGroups = dimensionFilterGroups;
        }

        // Get performance data (clicks, impressions, CTR, position)
        const encodedSiteUrl = encodeURIComponent(siteUrl);
        console.log(`Fetching performance data for ${siteUrl}, type: ${searchType || 'web'}, dimensions: ${dimensions?.join(',')}`);
        
        const response = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody),
          }
        );
        result = await response.json();
        break;
      }

      case 'urlInspection': {
        if (!siteUrl || !inspectionUrl) {
          return new Response(
            JSON.stringify({ error: "Site URL and inspection URL are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Inspecting URL: ${inspectionUrl} for site: ${siteUrl}`);
        
        const response = await fetch(
          "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              inspectionUrl: inspectionUrl,
              siteUrl: siteUrl,
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

        const encodedSiteUrl = encodeURIComponent(siteUrl);
        
        // Get sitemaps for coverage info
        const coverageResponse = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps`,
          { headers }
        );

        const sitemapsData = await coverageResponse.json();
        
        result = {
          sitemaps: sitemapsData,
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
