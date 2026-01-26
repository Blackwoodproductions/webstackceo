import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Types based on actual FRL/BRON API responses
export interface BronArticle {
  id: string;
  title: string;
  url: string;
  domain: string;
  publishedAt: string;
  status: string;
  anchorText?: string;
  targetUrl?: string;
}

export interface BronBacklink {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  targetUrl: string;
  anchorText: string;
  createdAt: string;
  status: string;
  dofollow?: boolean;
}

export interface BronRanking {
  id: string;
  keyword: string;
  position: number;
  previousPosition?: number;
  url: string;
  searchVolume?: number;
  updatedAt: string;
}

export interface BronKeyword {
  id: string;
  keyword: string;
  cluster?: string;
  volume?: number;
  articles: number;
}

export interface BronCluster {
  id: string;
  name: string;
  keywords: string[];
  articles: number;
  avgPosition?: number;
}

export interface BronDeepLink {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  createdAt: string;
  clicks?: number;
}

export interface BronProfile {
  domain: string;
  category?: string;
  language?: string;
  country?: string;
  description?: string;
  lastCrawled?: string;
  pagesIndexed?: number;
}

export interface BronStats {
  totalArticles: number;
  publishedArticles: number;
  pendingArticles: number;
  totalBacklinks: number;
  activeBacklinks: number;
  totalKeywords: number;
}

export interface BronCampaign {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate?: string;
  articlesCreated: number;
  backlinksBuilt: number;
}

export interface BronReport {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  url?: string;
}

export interface BronDashboardData {
  articles: BronArticle[];
  backlinks: BronBacklink[];
  rankings: BronRanking[];
  keywords: BronKeyword[];
  clusters: BronCluster[];
  deepLinks: BronDeepLink[];
  profile: BronProfile | null;
  stats: BronStats | null;
  campaigns: BronCampaign[];
  reports: BronReport[];
  rawData: Record<string, any>;
}

interface UseBronApiResult {
  data: BronDashboardData;
  isLoading: boolean;
  loadingStates: Record<string, boolean>;
  errors: Record<string, string | null>;
  refetch: (endpoint?: string) => Promise<void>;
  refetchAll: () => Promise<void>;
  lastUpdated: Date | null;
  hasAnyData: boolean;
}

const initialData: BronDashboardData = {
  articles: [],
  backlinks: [],
  rankings: [],
  keywords: [],
  clusters: [],
  deepLinks: [],
  profile: null,
  stats: null,
  campaigns: [],
  reports: [],
  rawData: {},
};

export function useBronApi(domain: string | undefined): UseBronApiResult {
  const [data, setData] = useState<BronDashboardData>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const callApi = useCallback(async (endpoint: string) => {
    if (!domain) return null;

    try {
      const { data: response, error } = await supabase.functions.invoke("bron-api", {
        body: { domain, endpoint },
      });

      if (error) throw new Error(error.message);
      if (!response?.success) throw new Error(response?.error || "API error");

      return response.data;
    } catch (err) {
      console.error(`[BRON API] ${endpoint} error:`, err);
      throw err;
    }
  }, [domain]);

  const fetchEndpoint = useCallback(async (endpoint: string) => {
    if (!domain) return;

    setLoadingStates(prev => ({ ...prev, [endpoint]: true }));
    setErrors(prev => ({ ...prev, [endpoint]: null }));

    try {
      const result = await callApi(endpoint);
      
      // Store raw data for debugging
      setData(prev => {
        const newData = { ...prev };
        newData.rawData = { ...prev.rawData, [endpoint]: result };
        
        switch (endpoint) {
          case "articles":
            newData.articles = processArticles(result, domain);
            break;
          case "backlinks":
            newData.backlinks = processBacklinks(result);
            break;
          case "rankings":
            newData.rankings = processRankings(result);
            break;
          case "keywords":
            newData.keywords = processKeywords(result);
            break;
          case "clusters":
            newData.clusters = processClusters(result);
            break;
          case "deeplinks":
            newData.deepLinks = processDeepLinks(result);
            break;
          case "profile":
            newData.profile = processProfile(result, domain);
            break;
          case "stats":
            newData.stats = processStats(result);
            break;
          case "campaigns":
            newData.campaigns = processCampaigns(result);
            break;
          case "reports":
            newData.reports = processReports(result);
            break;
        }

        return newData;
      });

      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch";
      setErrors(prev => ({ ...prev, [endpoint]: errorMessage }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [endpoint]: false }));
    }
  }, [domain, callApi]);

  const refetchAll = useCallback(async () => {
    if (!domain) return;

    setIsLoading(true);
    
    // Fetch all BRON endpoints in parallel
    const endpoints = [
      "articles", "backlinks", "rankings", "keywords", 
      "clusters", "deeplinks", "profile", "stats", 
      "campaigns", "reports"
    ];

    await Promise.allSettled(endpoints.map(ep => fetchEndpoint(ep)));
    
    setIsLoading(false);
  }, [domain, fetchEndpoint]);

  // Initial fetch
  useEffect(() => {
    if (domain) {
      refetchAll();
    } else {
      setData(initialData);
      setIsLoading(false);
    }
  }, [domain, refetchAll]);

  // Check if we have any real data
  const hasAnyData = 
    data.articles.length > 0 ||
    data.backlinks.length > 0 ||
    data.rankings.length > 0 ||
    data.keywords.length > 0 ||
    data.clusters.length > 0 ||
    data.deepLinks.length > 0 ||
    data.campaigns.length > 0 ||
    data.reports.length > 0 ||
    data.stats !== null;

  return {
    data,
    isLoading,
    loadingStates,
    errors,
    refetch: fetchEndpoint,
    refetchAll,
    lastUpdated,
    hasAnyData,
  };
}

// Data processors - map API responses to our interfaces
function processArticles(data: any, domain: string): BronArticle[] {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : (data.articles || data.data || []);
  if (!Array.isArray(arr)) return [];
  
  return arr.map((item: any, i: number) => ({
    id: item.id || item.article_id || `article-${i}`,
    title: item.title || item.name || `Article ${i + 1}`,
    url: item.url || item.link || item.article_url || "",
    domain: item.domain || item.site_domain || domain,
    publishedAt: item.published_at || item.created_at || item.date || new Date().toISOString(),
    status: item.status || "pending",
    anchorText: item.anchor_text || item.anchor,
    targetUrl: item.target_url || item.target,
  }));
}

function processBacklinks(data: any): BronBacklink[] {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : (data.backlinks || data.links || data.data || []);
  if (!Array.isArray(arr)) return [];
  
  return arr.map((item: any, i: number) => ({
    id: item.id || item.backlink_id || `bl-${i}`,
    sourceUrl: item.source_url || item.source || item.from_url || item.url || "",
    sourceDomain: item.source_domain || extractDomain(item.source_url || item.source || item.url),
    targetUrl: item.target_url || item.target || item.to_url || "",
    anchorText: item.anchor_text || item.anchor || "Link",
    createdAt: item.created_at || item.date || item.discovered_at || new Date().toISOString(),
    status: item.status || "active",
    dofollow: item.dofollow !== false && item.nofollow !== true,
  }));
}

function processRankings(data: any): BronRanking[] {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : (data.rankings || data.positions || data.data || []);
  if (!Array.isArray(arr)) return [];
  
  return arr.map((item: any, i: number) => ({
    id: item.id || item.ranking_id || `rank-${i}`,
    keyword: item.keyword || item.query || item.term || "",
    position: parseNumber(item.position || item.rank) || 0,
    previousPosition: parseNumber(item.previous_position || item.prev_rank || item.last_position),
    url: item.url || item.page || item.landing_page || "",
    searchVolume: parseNumber(item.search_volume || item.volume),
    updatedAt: item.updated_at || item.date || item.checked_at || new Date().toISOString(),
  }));
}

function processKeywords(data: any): BronKeyword[] {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : (data.keywords || data.terms || data.data || []);
  if (!Array.isArray(arr)) return [];
  
  return arr.map((item: any, i: number) => ({
    id: item.id || item.keyword_id || `kw-${i}`,
    keyword: item.keyword || item.term || item.query || "",
    cluster: item.cluster || item.group || item.category,
    volume: parseNumber(item.volume || item.search_volume),
    articles: parseNumber(item.articles || item.article_count) || 0,
  }));
}

function processClusters(data: any): BronCluster[] {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : (data.clusters || data.groups || data.data || []);
  if (!Array.isArray(arr)) return [];
  
  return arr.map((item: any, i: number) => ({
    id: item.id || item.cluster_id || `cluster-${i}`,
    name: item.name || item.cluster_name || item.title || `Cluster ${i + 1}`,
    keywords: parseKeywords(item.keywords),
    articles: parseNumber(item.articles || item.article_count) || 0,
    avgPosition: parseNumber(item.avg_position || item.average_position),
  }));
}

function processDeepLinks(data: any): BronDeepLink[] {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : (data.deeplinks || data.internal_links || data.data || []);
  if (!Array.isArray(arr)) return [];
  
  return arr.map((item: any, i: number) => ({
    id: item.id || item.link_id || `dl-${i}`,
    sourceUrl: item.source_url || item.from || item.source || "",
    targetUrl: item.target_url || item.to || item.target || "",
    anchorText: item.anchor_text || item.anchor || "Link",
    createdAt: item.created_at || item.date || new Date().toISOString(),
    clicks: parseNumber(item.clicks),
  }));
}

function processProfile(data: any, domain: string): BronProfile | null {
  if (!data || typeof data !== "object") return null;
  const profile = data.profile || data.domain || data;
  
  return {
    domain: profile.domain || domain,
    category: profile.category || profile.niche || profile.industry,
    language: profile.language || profile.lang,
    country: profile.country || profile.geo,
    description: profile.description || profile.about,
    lastCrawled: profile.last_crawled || profile.crawled_at,
    pagesIndexed: parseNumber(profile.pages_indexed || profile.indexed_pages),
  };
}

function processStats(data: any): BronStats | null {
  if (!data || typeof data !== "object") return null;
  const stats = data.stats || data.summary || data;
  
  return {
    totalArticles: parseNumber(stats.total_articles || stats.articles) || 0,
    publishedArticles: parseNumber(stats.published_articles || stats.published) || 0,
    pendingArticles: parseNumber(stats.pending_articles || stats.pending) || 0,
    totalBacklinks: parseNumber(stats.total_backlinks || stats.backlinks) || 0,
    activeBacklinks: parseNumber(stats.active_backlinks || stats.active) || 0,
    totalKeywords: parseNumber(stats.total_keywords || stats.keywords) || 0,
  };
}

function processCampaigns(data: any): BronCampaign[] {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : (data.campaigns || data.data || []);
  if (!Array.isArray(arr)) return [];
  
  return arr.map((item: any, i: number) => ({
    id: item.id || item.campaign_id || `campaign-${i}`,
    name: item.name || item.campaign_name || `Campaign ${i + 1}`,
    status: item.status || "active",
    startDate: item.start_date || item.started_at || item.created_at || new Date().toISOString(),
    endDate: item.end_date || item.ended_at,
    articlesCreated: parseNumber(item.articles_created || item.articles) || 0,
    backlinksBuilt: parseNumber(item.backlinks_built || item.backlinks) || 0,
  }));
}

function processReports(data: any): BronReport[] {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : (data.reports || data.data || []);
  if (!Array.isArray(arr)) return [];
  
  return arr.map((item: any, i: number) => ({
    id: item.id || item.report_id || `report-${i}`,
    name: item.name || item.title || `Report ${i + 1}`,
    type: item.type || item.report_type || "general",
    createdAt: item.created_at || item.date || new Date().toISOString(),
    url: item.url || item.link,
  }));
}

// Helper functions
function extractDomain(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return url.split("/")[2] || url;
  }
}

function parseNumber(val: any): number | undefined {
  if (val === undefined || val === null) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}

function parseKeywords(keywords: any): string[] {
  if (!keywords) return [];
  if (Array.isArray(keywords)) return keywords.map(String);
  if (typeof keywords === "string") return keywords.split(",").map(k => k.trim()).filter(Boolean);
  return [];
}
