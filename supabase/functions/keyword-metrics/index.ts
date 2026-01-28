import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KeywordMetricsRequest {
  keywords: string[];
  location_code?: number; // Default: 2840 (USA)
  language_code?: string; // Default: "en"
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const login = Deno.env.get('DATAFORSEO_LOGIN');
    const password = Deno.env.get('DATAFORSEO_PASSWORD');

    if (!login || !password) {
      console.error('DataForSEO credentials not configured');
      return new Response(
        JSON.stringify({ error: 'DataForSEO credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { keywords, location_code = 2840, language_code = "en" }: KeywordMetricsRequest = await req.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Keywords array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching metrics for ${keywords.length} keywords`);

    // Create Basic Auth header
    const auth = btoa(`${login}:${password}`);

    // Prepare task for DataForSEO Keywords Data API
    const taskData = [{
      keywords: keywords.slice(0, 100), // API limit
      location_code,
      language_code,
    }];

    // Call DataForSEO Keywords Data API
    const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DataForSEO API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `DataForSEO API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('DataForSEO response received');

    // Extract keyword metrics from response
    const keywordMetrics: Record<string, {
      search_volume: number;
      cpc: number;
      competition: number;
      competition_level: string;
    }> = {};

    if (data.tasks?.[0]?.result) {
      for (const item of data.tasks[0].result) {
        if (item.keyword) {
          keywordMetrics[item.keyword.toLowerCase()] = {
            search_volume: item.search_volume || 0,
            cpc: item.cpc || 0,
            competition: item.competition || 0,
            competition_level: item.competition_level || 'UNKNOWN',
          };
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, metrics: keywordMetrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error fetching keyword metrics:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
