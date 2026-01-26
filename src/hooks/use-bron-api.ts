import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Types for BRON API data
export interface BronArticle {
  id: string;
  title: string;
  url: string;
  domain: string;
  publishedAt: string;
  status: "pending" | "published" | "scheduled";
  keywords: string[];
  anchorText?: string;
  targetUrl?: string;
  daScore?: number;
  drScore?: number;
}

export interface BronBacklink {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  targetUrl: string;
  anchorText: string;
  daScore: number;
  drScore: number;
  createdAt: string;
  status: "active" | "pending" | "lost";
  dofollow?: boolean;
}

export interface BronRanking {
  id: string;
  keyword: string;
  position: number;
  previousPosition?: number;
  url: string;
  searchVolume?: number;
  difficulty?: number;
  updatedAt: string;
}

export interface BronKeyword {
  id: string;
  keyword: string;
  cluster?: string;
  volume?: number;
  difficulty?: number;
  intent?: "informational" | "transactional" | "navigational" | "commercial";
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

export interface BronAuthority {
  domainAuthority: number;
  domainRating: number;
  trustFlow?: number;
  citationFlow?: number;
  referringDomains: number;
  totalBacklinks: number;
  organicKeywords?: number;
  organicTraffic?: number;
  updatedAt: string;
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
  avgDa: number;
  avgDr: number;
}

export interface BronCampaign {
  id: string;
  name: string;
  status: "active" | "paused" | "completed";
  startDate: string;
  endDate?: string;
  articlesCreated: number;
  backlinksBuilt: number;
}

export interface BronDashboardData {
  articles: BronArticle[];
  backlinks: BronBacklink[];
  rankings: BronRanking[];
  keywords: BronKeyword[];
  clusters: BronCluster[];
  deepLinks: BronDeepLink[];
  authority: BronAuthority | null;
  profile: BronProfile | null;
  stats: BronStats | null;
  campaigns: BronCampaign[];
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
  authority: null,
  profile: null,
  stats: null,
  campaigns: [],
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
      
      // Process and store data based on endpoint
      setData(prev => {
        const newData = { ...prev };
        
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
          case "authority":
            newData.authority = processAuthority(result);
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
      "clusters", "deeplinks", "authority", "profile", 
      "stats", "campaigns"
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
    data.authority !== null ||
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
    status: mapStatus(item.status),
    keywords: parseKeywords(item.keywords),
    anchorText: item.anchor_text || item.anchor,
    targetUrl: item.target_url || item.target,
    daScore: parseNumber(item.da || item.da_score || item.domain_authority),
    drScore: parseNumber(item.dr || item.dr_score || item.domain_rating),
  }));
}

function processBacklinks(data: any): BronBacklink[] {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : (data.backlinks || data.links || data.data || []);
  if (!Array.isArray(arr)) return [];
  
  return arr.map((item: any, i: number) => ({
    id: item.id || item.backlink_id || `bl-${i}`,
    sourceUrl: item.source_url || item.source || item.from_url || "",
    sourceDomain: item.source_domain || extractDomain(item.source_url || item.source),
    targetUrl: item.target_url || item.target || item.to_url || "",
    anchorText: item.anchor_text || item.anchor || "Link",
    daScore: parseNumber(item.da || item.da_score || item.domain_authority) || 0,
    drScore: parseNumber(item.dr || item.dr_score || item.domain_rating) || 0,
    createdAt: item.created_at || item.date || item.discovered_at || new Date().toISOString(),
    status: mapBacklinkStatus(item.status),
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
    difficulty: parseNumber(item.difficulty || item.kd || item.keyword_difficulty),
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
    difficulty: parseNumber(item.difficulty || item.kd),
    intent: mapIntent(item.intent),
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

function processAuthority(data: any): BronAuthority | null {
  if (!data || typeof data !== "object") return null;
  // Handle both direct object and wrapped response
  const auth = data.authority || data.metrics || data;
  
  return {
    domainAuthority: parseNumber(auth.da || auth.domain_authority) || 0,
    domainRating: parseNumber(auth.dr || auth.domain_rating) || 0,
    trustFlow: parseNumber(auth.tf || auth.trust_flow),
    citationFlow: parseNumber(auth.cf || auth.citation_flow),
    referringDomains: parseNumber(auth.referring_domains || auth.rd || auth.ref_domains) || 0,
    totalBacklinks: parseNumber(auth.total_backlinks || auth.backlinks || auth.total_links) || 0,
    organicKeywords: parseNumber(auth.organic_keywords || auth.keywords),
    organicTraffic: parseNumber(auth.organic_traffic || auth.traffic),
    updatedAt: auth.updated_at || auth.last_update || new Date().toISOString(),
  };
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
    avgDa: parseNumber(stats.avg_da || stats.average_da) || 0,
    avgDr: parseNumber(stats.avg_dr || stats.average_dr) || 0,
  };
}

function processCampaigns(data: any): BronCampaign[] {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : (data.campaigns || data.data || []);
  if (!Array.isArray(arr)) return [];
  
  return arr.map((item: any, i: number) => ({
    id: item.id || item.campaign_id || `campaign-${i}`,
    name: item.name || item.campaign_name || `Campaign ${i + 1}`,
    status: mapCampaignStatus(item.status),
    startDate: item.start_date || item.started_at || item.created_at || new Date().toISOString(),
    endDate: item.end_date || item.ended_at,
    articlesCreated: parseNumber(item.articles_created || item.articles) || 0,
    backlinksBuilt: parseNumber(item.backlinks_built || item.backlinks) || 0,
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

function mapStatus(status: any): "pending" | "published" | "scheduled" {
  const s = String(status).toLowerCase();
  if (s.includes("publish")) return "published";
  if (s.includes("schedul")) return "scheduled";
  return "pending";
}

function mapBacklinkStatus(status: any): "active" | "pending" | "lost" {
  const s = String(status).toLowerCase();
  if (s.includes("lost") || s.includes("dead") || s.includes("removed")) return "lost";
  if (s.includes("pending") || s.includes("wait")) return "pending";
  return "active";
}

function mapCampaignStatus(status: any): "active" | "paused" | "completed" {
  const s = String(status).toLowerCase();
  if (s.includes("complete") || s.includes("done") || s.includes("finish")) return "completed";
  if (s.includes("pause") || s.includes("stop")) return "paused";
  return "active";
}

function mapIntent(intent: any): "informational" | "transactional" | "navigational" | "commercial" | undefined {
  if (!intent) return undefined;
  const i = String(intent).toLowerCase();
  if (i.includes("info")) return "informational";
  if (i.includes("trans") || i.includes("buy")) return "transactional";
  if (i.includes("nav")) return "navigational";
  if (i.includes("comm")) return "commercial";
  return undefined;
}
