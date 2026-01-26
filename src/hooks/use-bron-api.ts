import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Types for all BRON API data
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

export interface BronDomainProfile {
  domain: string;
  category?: string;
  language?: string;
  country?: string;
  description?: string;
  lastCrawled?: string;
  pagesIndexed?: number;
  cssAnalyzed?: boolean;
}

export interface BronSubscription {
  active: boolean;
  plan?: string;
  articlesUsed: number;
  articlesLimit: number;
  backlinksUsed: number;
  backlinksLimit: number;
  expiresAt?: string;
}

export interface BronTaskStatus {
  id: string;
  type: "crawl" | "categorization" | "content" | "faq";
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface BronSystemHealth {
  status: "healthy" | "degraded" | "down";
  workers: number;
  activeWorkers: number;
  queuedJobs: number;
}

export interface BronDashboardData {
  articles: BronArticle[];
  backlinks: BronBacklink[];
  rankings: BronRanking[];
  keywords: BronKeyword[];
  deepLinks: BronDeepLink[];
  authority: BronAuthority | null;
  domainProfile: BronDomainProfile | null;
  subscription: BronSubscription | null;
  tasks: BronTaskStatus[];
  systemHealth: BronSystemHealth | null;
}

interface UseBronApiResult {
  data: BronDashboardData;
  isLoading: boolean;
  loadingStates: Record<string, boolean>;
  errors: Record<string, string | null>;
  refetch: (endpoint?: string) => Promise<void>;
  refetchAll: () => Promise<void>;
  lastUpdated: Date | null;
  // Action methods
  triggerCrawl: () => Promise<boolean>;
  triggerCategorization: () => Promise<boolean>;
  generateContent: (options?: any) => Promise<boolean>;
  generateFaq: (options?: any) => Promise<boolean>;
}

const initialData: BronDashboardData = {
  articles: [],
  backlinks: [],
  rankings: [],
  keywords: [],
  deepLinks: [],
  authority: null,
  domainProfile: null,
  subscription: null,
  tasks: [],
  systemHealth: null,
};

export function useBronApi(domain: string | undefined): UseBronApiResult {
  const [data, setData] = useState<BronDashboardData>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const callApi = useCallback(async (endpoint: string, method = "GET", body?: any) => {
    if (!domain) return null;

    try {
      const { data: response, error } = await supabase.functions.invoke("bron-api", {
        body: { domain, endpoint, method, body },
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
          case "deeplinks":
            newData.deepLinks = processDeepLinks(result);
            break;
          case "authority":
            newData.authority = processAuthority(result);
            break;
          case "domain-profile":
            newData.domainProfile = processDomainProfile(result, domain);
            break;
          case "subscription":
          case "subscription-detail":
            newData.subscription = processSubscription(result);
            break;
          case "crawl-status":
          case "categorization-status":
            // Update or add task
            const task = processTaskStatus(result, endpoint);
            if (task) {
              const existingIdx = newData.tasks.findIndex(t => t.type === task.type);
              if (existingIdx >= 0) {
                newData.tasks[existingIdx] = task;
              } else {
                newData.tasks.push(task);
              }
            }
            break;
          case "system-health":
            newData.systemHealth = processSystemHealth(result);
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
    
    // Fetch all endpoints in parallel
    const endpoints = [
      "articles", "backlinks", "rankings", "keywords", 
      "deeplinks", "authority", "domain-profile", 
      "subscription-detail", "system-health"
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

  // Action methods
  const triggerCrawl = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, crawl: true }));
      await callApi("crawl-domain", "POST");
      await fetchEndpoint("crawl-status");
      return true;
    } catch (err) {
      setErrors(prev => ({ ...prev, crawl: err instanceof Error ? err.message : "Crawl failed" }));
      return false;
    } finally {
      setLoadingStates(prev => ({ ...prev, crawl: false }));
    }
  }, [callApi, fetchEndpoint]);

  const triggerCategorization = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, categorization: true }));
      await callApi("categorize-domain", "POST");
      await fetchEndpoint("categorization-status");
      return true;
    } catch (err) {
      setErrors(prev => ({ ...prev, categorization: err instanceof Error ? err.message : "Categorization failed" }));
      return false;
    } finally {
      setLoadingStates(prev => ({ ...prev, categorization: false }));
    }
  }, [callApi, fetchEndpoint]);

  const generateContent = useCallback(async (options?: any) => {
    try {
      setLoadingStates(prev => ({ ...prev, content: true }));
      await callApi("generate-content", "POST", options);
      await fetchEndpoint("articles");
      return true;
    } catch (err) {
      setErrors(prev => ({ ...prev, content: err instanceof Error ? err.message : "Content generation failed" }));
      return false;
    } finally {
      setLoadingStates(prev => ({ ...prev, content: false }));
    }
  }, [callApi, fetchEndpoint]);

  const generateFaq = useCallback(async (options?: any) => {
    try {
      setLoadingStates(prev => ({ ...prev, faq: true }));
      await callApi("generate-faq", "POST", options);
      return true;
    } catch (err) {
      setErrors(prev => ({ ...prev, faq: err instanceof Error ? err.message : "FAQ generation failed" }));
      return false;
    } finally {
      setLoadingStates(prev => ({ ...prev, faq: false }));
    }
  }, [callApi]);

  return {
    data,
    isLoading,
    loadingStates,
    errors,
    refetch: fetchEndpoint,
    refetchAll,
    lastUpdated,
    triggerCrawl,
    triggerCategorization,
    generateContent,
    generateFaq,
  };
}

// Data processors
function processArticles(data: any, domain: string): BronArticle[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: any, i: number) => ({
    id: item.id || `article-${i}`,
    title: item.title || item.name || `Article ${i + 1}`,
    url: item.url || item.link || "",
    domain: item.domain || domain,
    publishedAt: item.published_at || item.created_at || new Date().toISOString(),
    status: item.status || "published",
    keywords: item.keywords || [],
    anchorText: item.anchor_text || item.anchor,
    targetUrl: item.target_url || item.target,
    daScore: item.da || item.da_score,
    drScore: item.dr || item.dr_score,
  }));
}

function processBacklinks(data: any): BronBacklink[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: any, i: number) => ({
    id: item.id || `bl-${i}`,
    sourceUrl: item.source_url || item.source || "",
    sourceDomain: item.source_domain || extractDomain(item.source_url || item.source),
    targetUrl: item.target_url || item.target || "",
    anchorText: item.anchor_text || item.anchor || "Link",
    daScore: item.da || item.da_score || 0,
    drScore: item.dr || item.dr_score || 0,
    createdAt: item.created_at || item.date || new Date().toISOString(),
    status: item.status || "active",
    dofollow: item.dofollow !== false,
  }));
}

function processRankings(data: any): BronRanking[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: any, i: number) => ({
    id: item.id || `rank-${i}`,
    keyword: item.keyword || item.query || "",
    position: item.position || item.rank || 0,
    previousPosition: item.previous_position || item.prev_rank,
    url: item.url || item.page || "",
    searchVolume: item.search_volume || item.volume,
    difficulty: item.difficulty || item.kd,
    updatedAt: item.updated_at || item.date || new Date().toISOString(),
  }));
}

function processKeywords(data: any): BronKeyword[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: any, i: number) => ({
    id: item.id || `kw-${i}`,
    keyword: item.keyword || item.term || "",
    cluster: item.cluster || item.group,
    volume: item.volume || item.search_volume,
    difficulty: item.difficulty || item.kd,
    intent: item.intent,
    articles: item.articles || item.article_count || 0,
  }));
}

function processDeepLinks(data: any): BronDeepLink[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: any, i: number) => ({
    id: item.id || `dl-${i}`,
    sourceUrl: item.source_url || item.from || "",
    targetUrl: item.target_url || item.to || "",
    anchorText: item.anchor_text || item.anchor || "Link",
    createdAt: item.created_at || new Date().toISOString(),
    clicks: item.clicks,
  }));
}

function processAuthority(data: any): BronAuthority | null {
  if (!data || typeof data !== "object") return null;
  return {
    domainAuthority: data.da || data.domain_authority || 0,
    domainRating: data.dr || data.domain_rating || 0,
    trustFlow: data.tf || data.trust_flow,
    citationFlow: data.cf || data.citation_flow,
    referringDomains: data.referring_domains || data.rd || 0,
    totalBacklinks: data.total_backlinks || data.backlinks || 0,
    organicKeywords: data.organic_keywords,
    organicTraffic: data.organic_traffic,
    updatedAt: data.updated_at || new Date().toISOString(),
  };
}

function processDomainProfile(data: any, domain: string): BronDomainProfile | null {
  if (!data || typeof data !== "object") return null;
  return {
    domain: data.domain || domain,
    category: data.category,
    language: data.language,
    country: data.country,
    description: data.description,
    lastCrawled: data.last_crawled,
    pagesIndexed: data.pages_indexed,
    cssAnalyzed: data.css_analyzed,
  };
}

function processSubscription(data: any): BronSubscription | null {
  if (!data || typeof data !== "object") return null;
  return {
    active: data.active !== false,
    plan: data.plan || data.tier,
    articlesUsed: data.articles_used || 0,
    articlesLimit: data.articles_limit || 0,
    backlinksUsed: data.backlinks_used || 0,
    backlinksLimit: data.backlinks_limit || 0,
    expiresAt: data.expires_at,
  };
}

function processTaskStatus(data: any, endpoint: string): BronTaskStatus | null {
  if (!data || typeof data !== "object") return null;
  const type = endpoint.includes("crawl") ? "crawl" : "categorization";
  return {
    id: data.id || data.task_id || `task-${type}`,
    type,
    status: data.status || "pending",
    progress: data.progress,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    error: data.error,
  };
}

function processSystemHealth(data: any): BronSystemHealth | null {
  if (!data || typeof data !== "object") return null;
  return {
    status: data.status || "healthy",
    workers: data.workers || data.total_workers || 0,
    activeWorkers: data.active_workers || 0,
    queuedJobs: data.queued_jobs || data.queue_size || 0,
  };
}

function extractDomain(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return url.split("/")[2] || url;
  }
}
