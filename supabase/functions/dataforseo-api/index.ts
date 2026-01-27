import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const login = Deno.env.get('DATAFORSEO_LOGIN');
    const password = Deno.env.get('DATAFORSEO_PASSWORD');

    if (!login || !password) {
      console.error('[DataForSEO] Missing credentials');
      return new Response(
        JSON.stringify({ error: 'DataForSEO credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, endpoint, data } = await req.json();
    console.log(`[DataForSEO] Action: ${action}, Endpoint: ${endpoint}`);

    // Base64 encode credentials for Basic Auth
    const credentials = btoa(`${login}:${password}`);
    const baseUrl = 'https://api.dataforseo.com/v3';

    let url = baseUrl;
    let method = 'GET';
    let body: string | undefined;

    switch (action) {
      // ========== ACCOUNT ==========
      case 'user_data':
        url = `${baseUrl}/appendix/user_data`;
        break;

      // ========== SERP API ==========
      case 'serp_google_organic':
        url = `${baseUrl}/serp/google/organic/live/advanced`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'serp_google_maps':
        url = `${baseUrl}/serp/google/maps/live/advanced`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      // ========== KEYWORDS DATA API ==========
      case 'keywords_search_volume':
        url = `${baseUrl}/keywords_data/google_ads/search_volume/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'keywords_for_site':
        url = `${baseUrl}/keywords_data/google_ads/keywords_for_site/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'keywords_for_keywords':
        url = `${baseUrl}/keywords_data/google_ads/keywords_for_keywords/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'google_trends':
        url = `${baseUrl}/keywords_data/google_trends/explore/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      // ========== BACKLINKS API ==========
      case 'backlinks_summary':
        url = `${baseUrl}/backlinks/summary/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'backlinks_backlinks':
        url = `${baseUrl}/backlinks/backlinks/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'backlinks_anchors':
        url = `${baseUrl}/backlinks/anchors/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'backlinks_referring_domains':
        url = `${baseUrl}/backlinks/referring_domains/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'backlinks_history':
        url = `${baseUrl}/backlinks/history/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'backlinks_competitors':
        url = `${baseUrl}/backlinks/competitors/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'backlinks_bulk_ranks':
        url = `${baseUrl}/backlinks/bulk_ranks/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      // ========== DATAFORSEO LABS API ==========
      case 'labs_ranked_keywords':
        url = `${baseUrl}/dataforseo_labs/google/ranked_keywords/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'labs_competitors_domain':
        url = `${baseUrl}/dataforseo_labs/google/competitors_domain/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'labs_domain_intersection':
        url = `${baseUrl}/dataforseo_labs/google/domain_intersection/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'labs_keyword_ideas':
        url = `${baseUrl}/dataforseo_labs/google/keyword_ideas/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'labs_related_keywords':
        url = `${baseUrl}/dataforseo_labs/google/related_keywords/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'labs_domain_rank_overview':
        url = `${baseUrl}/dataforseo_labs/google/domain_rank_overview/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      // ========== ONPAGE API ==========
      case 'onpage_task_post':
        url = `${baseUrl}/on_page/task_post`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'onpage_summary':
        url = `${baseUrl}/on_page/summary/${data.task_id}`;
        break;

      case 'onpage_pages':
        url = `${baseUrl}/on_page/pages`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'onpage_instant_pages':
        url = `${baseUrl}/on_page/instant_pages`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'onpage_lighthouse':
        url = `${baseUrl}/on_page/lighthouse/live/json`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      // ========== DOMAIN ANALYTICS ==========
      case 'domain_technologies':
        url = `${baseUrl}/domain_analytics/technologies/domain_technologies/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'domain_whois':
        url = `${baseUrl}/domain_analytics/whois/overview/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      // ========== CONTENT ANALYSIS ==========
      case 'content_search':
        url = `${baseUrl}/content_analysis/search/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      case 'content_sentiment':
        url = `${baseUrl}/content_analysis/sentiment_analysis/live`;
        method = 'POST';
        body = JSON.stringify(data);
        break;

      // ========== CUSTOM ENDPOINT ==========
      case 'custom':
        if (!endpoint) {
          throw new Error('Custom endpoint requires "endpoint" parameter');
        }
        url = `${baseUrl}${endpoint}`;
        method = data ? 'POST' : 'GET';
        body = data ? JSON.stringify(data) : undefined;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`[DataForSEO] Calling: ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    const responseData = await response.json();
    console.log(`[DataForSEO] Response status: ${response.status}`);

    return new Response(
      JSON.stringify(responseData),
      { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DataForSEO] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
