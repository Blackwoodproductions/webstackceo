import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BacklinksSummary {
  backlinks: number;
  backlinks_new: number;
  backlinks_lost: number;
  referring_domains: number;
  referring_domains_new: number;
  referring_domains_lost: number;
  referring_main_domains: number;
  rank: number;
  broken_backlinks: number;
  broken_pages: number;
  referring_ips: number;
  referring_subnets: number;
}

export interface DomainRankOverview {
  target: string;
  organic_traffic: number;
  organic_keywords: number;
  organic_cost: number;
  paid_traffic: number;
  paid_keywords: number;
  paid_cost: number;
  etv: number;
  impressions_etv: number;
  count: number;
  estimated_paid_traffic_cost: number;
  is_new: boolean;
  is_up: boolean;
  is_down: boolean;
  is_lost: boolean;
}

export interface RankedKeyword {
  keyword: string;
  position: number;
  previous_position: number | null;
  search_volume: number;
  cpc: number;
  url: string;
  traffic: number;
  traffic_cost: number;
  keyword_difficulty: number;
  intent: string[];
}

export interface Competitor {
  domain: string;
  rank: number;
  organic_keywords: number;
  organic_traffic: number;
  keywords_common: number;
  keywords_unique: number;
}

export interface BacklinkItem {
  url_from: string;
  url_to: string;
  domain_from: string;
  domain_to: string;
  anchor: string;
  first_seen: string;
  last_seen: string;
  rank: number;
  dofollow: boolean;
  page_from_rank: number;
  domain_from_rank: number;
}

export interface AnchorData {
  anchor: string;
  backlinks: number;
  referring_domains: number;
  dofollow: number;
  nofollow: number;
}

export interface DataForSEOResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useDataForSEO() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAPI = useCallback(async <T>(action: string, data?: any): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: response, error: fnError } = await supabase.functions.invoke('dataforseo-api', {
        body: { action, data }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (response?.status_code !== 20000) {
        throw new Error(response?.status_message || 'API request failed');
      }

      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[DataForSEO] Error:', message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get account info
  const getUserData = useCallback(async () => {
    return callAPI('user_data');
  }, [callAPI]);

  // Backlinks Summary
  const getBacklinksSummary = useCallback(async (target: string): Promise<BacklinksSummary | null> => {
    const response = await callAPI<any>('backlinks_summary', [{ target, include_subdomains: true }]);
    if (response?.tasks?.[0]?.result?.[0]) {
      return response.tasks[0].result[0];
    }
    return null;
  }, [callAPI]);

  // Get backlinks list
  const getBacklinks = useCallback(async (target: string, limit = 100): Promise<BacklinkItem[]> => {
    const response = await callAPI<any>('backlinks_backlinks', [{ 
      target, 
      include_subdomains: true,
      limit,
      order_by: ["rank,desc"]
    }]);
    return response?.tasks?.[0]?.result?.[0]?.items || [];
  }, [callAPI]);

  // Get anchor analysis
  const getAnchors = useCallback(async (target: string, limit = 50): Promise<AnchorData[]> => {
    const response = await callAPI<any>('backlinks_anchors', [{ 
      target, 
      include_subdomains: true,
      limit,
      order_by: ["backlinks,desc"]
    }]);
    return response?.tasks?.[0]?.result?.[0]?.items || [];
  }, [callAPI]);

  // Get referring domains
  const getReferringDomains = useCallback(async (target: string, limit = 100) => {
    const response = await callAPI<any>('backlinks_referring_domains', [{ 
      target, 
      include_subdomains: true,
      limit,
      order_by: ["rank,desc"]
    }]);
    return response?.tasks?.[0]?.result?.[0]?.items || [];
  }, [callAPI]);

  // Get domain rank overview (traffic, keywords)
  const getDomainRankOverview = useCallback(async (target: string, locationCode = 2840): Promise<DomainRankOverview | null> => {
    const response = await callAPI<any>('labs_domain_rank_overview', [{ 
      target,
      location_code: locationCode,
      language_code: "en"
    }]);
    if (response?.tasks?.[0]?.result?.[0]?.items?.[0]) {
      return response.tasks[0].result[0].items[0].metrics?.organic || null;
    }
    return null;
  }, [callAPI]);

  // Get ranked keywords
  const getRankedKeywords = useCallback(async (target: string, limit = 100, locationCode = 2840): Promise<RankedKeyword[]> => {
    const response = await callAPI<any>('labs_ranked_keywords', [{ 
      target,
      location_code: locationCode,
      language_code: "en",
      limit,
      order_by: ["keyword_data.keyword_info.search_volume,desc"]
    }]);
    
    const items = response?.tasks?.[0]?.result?.[0]?.items || [];
    return items.map((item: any) => ({
      keyword: item.keyword_data?.keyword || '',
      position: item.ranked_serp_element?.serp_item?.rank_absolute || 0,
      previous_position: null,
      search_volume: item.keyword_data?.keyword_info?.search_volume || 0,
      cpc: item.keyword_data?.keyword_info?.cpc || 0,
      url: item.ranked_serp_element?.serp_item?.url || '',
      traffic: item.keyword_data?.keyword_info?.search_volume * (item.ranked_serp_element?.serp_item?.rank_absolute <= 10 ? 0.1 : 0.02) || 0,
      traffic_cost: (item.keyword_data?.keyword_info?.search_volume || 0) * (item.keyword_data?.keyword_info?.cpc || 0) * 0.1,
      keyword_difficulty: item.keyword_data?.keyword_info?.competition_level === 'HIGH' ? 80 : item.keyword_data?.keyword_info?.competition_level === 'MEDIUM' ? 50 : 20,
      intent: item.keyword_data?.search_intent_info?.main_intent ? [item.keyword_data.search_intent_info.main_intent] : []
    }));
  }, [callAPI]);

  // Get competitors
  const getCompetitors = useCallback(async (target: string, limit = 20, locationCode = 2840): Promise<Competitor[]> => {
    const response = await callAPI<any>('labs_competitors_domain', [{ 
      target,
      location_code: locationCode,
      language_code: "en",
      limit
    }]);
    
    const items = response?.tasks?.[0]?.result?.[0]?.items || [];
    return items.map((item: any) => ({
      domain: item.domain || '',
      rank: item.avg_position || 0,
      organic_keywords: item.se_keywords || 0,
      organic_traffic: item.etv || 0,
      keywords_common: item.intersections || 0,
      keywords_unique: (item.se_keywords || 0) - (item.intersections || 0)
    }));
  }, [callAPI]);

  // Get keyword ideas
  const getKeywordIdeas = useCallback(async (keywords: string[], limit = 100, locationCode = 2840) => {
    const response = await callAPI<any>('labs_keyword_ideas', [{ 
      keywords,
      location_code: locationCode,
      language_code: "en",
      limit
    }]);
    return response?.tasks?.[0]?.result?.[0]?.items || [];
  }, [callAPI]);

  // Get search volume
  const getSearchVolume = useCallback(async (keywords: string[], locationCode = 2840) => {
    const response = await callAPI<any>('keywords_search_volume', [{ 
      keywords,
      location_code: locationCode,
      language_code: "en"
    }]);
    return response?.tasks?.[0]?.result || [];
  }, [callAPI]);

  // Get backlink history
  const getBacklinksHistory = useCallback(async (target: string) => {
    const response = await callAPI<any>('backlinks_history', [{ 
      target,
      date_from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0]
    }]);
    return response?.tasks?.[0]?.result?.[0]?.items || [];
  }, [callAPI]);

  return {
    loading,
    error,
    getUserData,
    getBacklinksSummary,
    getBacklinks,
    getAnchors,
    getReferringDomains,
    getDomainRankOverview,
    getRankedKeywords,
    getCompetitors,
    getKeywordIdeas,
    getSearchVolume,
    getBacklinksHistory,
  };
}
