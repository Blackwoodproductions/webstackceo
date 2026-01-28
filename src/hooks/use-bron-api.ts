import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Keyword Data Cache ───
const KEYWORD_CACHE_KEY = 'bron_keywords_cache';
const KEYWORD_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

interface KeywordCacheEntry {
  keywords: BronKeyword[];
  cachedAt: number;
}

function loadCachedKeywords(domain: string): BronKeyword[] | null {
  try {
    const cached = localStorage.getItem(KEYWORD_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as Record<string, KeywordCacheEntry>;
    const entry = parsed[domain];
    if (!entry) return null;
    const now = Date.now();
    if ((now - entry.cachedAt) > KEYWORD_CACHE_MAX_AGE) {
      return null; // Cache expired
    }
    console.log(`[BRON] Using cached keywords for ${domain} (${entry.keywords.length} keywords)`);
    return entry.keywords;
  } catch (e) {
    console.warn('[BRON] Failed to load keyword cache:', e);
    return null;
  }
}

function saveCachedKeywords(domain: string, keywords: BronKeyword[]) {
  try {
    const cached = localStorage.getItem(KEYWORD_CACHE_KEY);
    const parsed = cached ? JSON.parse(cached) as Record<string, KeywordCacheEntry> : {};
    
    // Keep only last 10 domains to avoid localStorage bloat
    const domains = Object.keys(parsed);
    if (domains.length >= 10 && !parsed[domain]) {
      const oldest = domains.sort((a, b) => parsed[a].cachedAt - parsed[b].cachedAt)[0];
      delete parsed[oldest];
    }
    
    parsed[domain] = { keywords, cachedAt: Date.now() };
    localStorage.setItem(KEYWORD_CACHE_KEY, JSON.stringify(parsed));
    console.log(`[BRON] Cached ${keywords.length} keywords for ${domain}`);
  } catch (e) {
    console.warn('[BRON] Failed to save keyword cache:', e);
  }
}

export function invalidateKeywordCache(domain: string) {
  try {
    const cached = localStorage.getItem(KEYWORD_CACHE_KEY);
    if (!cached) return;
    const parsed = JSON.parse(cached) as Record<string, KeywordCacheEntry>;
    if (parsed[domain]) {
      delete parsed[domain];
      localStorage.setItem(KEYWORD_CACHE_KEY, JSON.stringify(parsed));
      console.log(`[BRON] Invalidated keyword cache for ${domain}`);
    }
  } catch (e) {
    console.warn('[BRON] Failed to invalidate keyword cache:', e);
  }
}

// Types for BRON API responses
export interface BronDomain {
  id?: number;
  domain: string;
  domain_name?: string;
  status?: string | number;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
  deleted?: number;
  settings?: Record<string, unknown>;
  // Extended fields from API
  domain_country?: string;
  ishttps?: number;
  servicetype?: string;
  userid?: number;
  usewww?: number;
  wp_plugin?: number;
  // Business/GMB fields
  wr_name?: string;
  wr_address?: string;
  wr_phone?: string;
  wr_email?: string;
  wr_facebook?: string;
  wr_instagram?: string;
  wr_linkedin?: string;
  wr_twitter?: string;
  wr_video?: string;
}

export interface BronKeyword {
  id: number | string;
  keyword?: string;
  keywordtitle?: string;
  domainid?: number;
  active?: number;
  deleted?: number;
  linkouturl?: string;
  metadescription?: string;
  metatitle?: string;
  resaddress?: string;
  resfb?: string;
  resfeedtext?: string; // HTML content
  createdDate?: string;
  // Additional title fields from supporting keywords
  restitle?: string; // Title field used in supporting keywords
  resshorttext?: string; // Short description
  resfulltext?: string; // Full content
  // Cluster/hierarchy fields
  parent_keyword_id?: number | string;
  is_supporting?: boolean | number;
  bubblefeedid?: number | string; // ID of parent keyword (for supporting keywords)
  cluster_id?: number | string;
  // Supporting keywords array (populated on parent keywords)
  supporting_keywords?: BronKeyword[];
  // Legacy fields for compatibility
  domain?: string;
  url?: string;
  anchor_text?: string;
  status?: string;
  position?: number;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface BronPage {
  pageid?: number;
  post_title?: string;
  post_content?: string;
  post_date?: string;
  post_excerpt?: string;
  post_uri?: string;
  post_metatitle?: string;
  post_metakeywords?: string;
  // Legacy fields for compatibility
  url?: string;
  title?: string;
  type?: string;
  status?: string;
  word_count?: number;
  created_at?: string;
}

export interface BronSerpReport {
  keyword?: string;
  google?: string | number;
  bing?: string | number;
  yahoo?: string | number;
  duck?: string | number;
  started?: string;
  complete?: string;
  // Legacy fields
  id?: string;
  position?: number;
  url?: string;
  search_volume?: number;
  difficulty?: number;
  created_at?: string;
}

// SERP List item (historical report metadata)
export interface BronSerpListItem {
  id: string | number;
  report_id?: string | number;
  domain?: string;
  started?: string;
  complete?: string;
  created_at?: string;
  status?: string;
}


export interface BronLink {
  // Fields from BRON API
  link?: string;              // The URL (on our domain for linksOut, on referrer for linksIn)
  domain_name?: string;       // The OTHER domain (referrer for linksIn, target for linksOut)
  category?: string;          // Link category (e.g., "Search Engine Optimization")
  parent_category?: string;   // Parent category (e.g., "Internet")
  reciprocal?: string;        // "yes" or "no"
  disabled?: string;          // "yes" or "no"
  // Legacy/alternative field names (for compatibility)
  source_url?: string;        // Alternative field for source URL
  target_url?: string;        // Alternative field for target URL  
  anchor_text?: string;       // Anchor text if available
  domain?: string;            // Alternative field for domain
  status?: string;            // Link status
  type?: string;              // Link type
  created_at?: string;        // Creation timestamp
}

export interface BronSubscription {
  domain: string;
  servicetype: string;
  plan: string;
  status: string;
  has_cade: boolean;
  userid?: number;
}

export interface UseBronApiReturn {
  isLoading: boolean;
  isAuthenticated: boolean;
  domains: BronDomain[];
  keywords: BronKeyword[];
  pages: BronPage[];
  serpReports: BronSerpReport[];
  serpHistory: BronSerpListItem[];
  linksIn: BronLink[];
  linksOut: BronLink[];
  linksInError: string | null;
  linksOutError: string | null;
  verifyAuth: () => Promise<boolean>;
  fetchDomains: () => Promise<void>;
  fetchDomain: (domain: string) => Promise<BronDomain | null>;
  fetchSubscription: (domain: string) => Promise<BronSubscription | null>;
  updateDomain: (domain: string, data: Record<string, unknown>) => Promise<boolean>;
  deleteDomain: (domain: string) => Promise<boolean>;
  restoreDomain: (domain: string) => Promise<boolean>;
  fetchKeywords: (domain?: string, forceRefresh?: boolean) => Promise<void>;
  addKeyword: (data: Record<string, unknown>, domain?: string) => Promise<boolean>;
  updateKeyword: (keywordId: string, data: Record<string, unknown>, domain?: string) => Promise<boolean>;
  deleteKeyword: (keywordId: string, domain?: string) => Promise<boolean>;
  restoreKeyword: (keywordId: string, domain?: string) => Promise<boolean>;
  fetchPages: (domain: string) => Promise<void>;
  fetchSerpReport: (domain: string) => Promise<void>;
  fetchSerpList: (domain: string) => Promise<void>;
  fetchSerpDetail: (domain: string, reportId: string) => Promise<BronSerpReport[]>;
  fetchLinksIn: (domain: string, domainId?: number | string) => Promise<void>;
  fetchLinksOut: (domain: string, domainId?: number | string) => Promise<void>;
  resetDomainData: () => void;
}

export function useBronApi(): UseBronApiReturn {
  const [pendingCount, setPendingCount] = useState(0);
  const isLoading = pendingCount > 0;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [domains, setDomains] = useState<BronDomain[]>([]);
  const [keywords, setKeywords] = useState<BronKeyword[]>([]);
  const [pages, setPages] = useState<BronPage[]>([]);
  const [serpReports, setSerpReports] = useState<BronSerpReport[]>([]);
  const [serpHistory, setSerpHistory] = useState<BronSerpListItem[]>([]);
  const [linksIn, setLinksIn] = useState<BronLink[]>([]);
  const [linksOut, setLinksOut] = useState<BronLink[]>([]);
  const [linksInError, setLinksInError] = useState<string | null>(null);
  const [linksOutError, setLinksOutError] = useState<string | null>(null);

  // Prevent stale async responses (domain switching / rapid tab changes)
  const keywordsReqIdRef = useRef(0);
  const pagesReqIdRef = useRef(0);
  const serpReportReqIdRef = useRef(0);
  const serpListReqIdRef = useRef(0);
  const linksInReqIdRef = useRef(0);
  const linksOutReqIdRef = useRef(0);

  // Replace boolean "isLoading" toggles with a robust pending counter.
  const withPending = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setPendingCount((p) => p + 1);
    try {
      return await fn();
    } finally {
      setPendingCount((p) => Math.max(0, p - 1));
    }
  }, []);

  const formatInvokeError = useCallback(async (error: unknown): Promise<string> => {
    const fallback = error instanceof Error ? error.message : "Request failed";

    // supabase-js function errors often include a Response in `context`
    const context = (error as { context?: Response })?.context;
    if (!context) return fallback;

    try {
      const contentType = context.headers.get("content-type") || "";
      const status = context.status;

      if (contentType.includes("application/json")) {
        const body = (await context.json()) as any;
        const detail =
          body?.details?.detail ||
          body?.details?.message ||
          body?.detail ||
          body?.message ||
          body?.error;

        if (detail) return `BRON API error (${status}): ${String(detail)}`;
        return `BRON API error (${status})`;
      }

      const text = await context.text();
      if (text) return `BRON API error (${status}): ${text}`;
      return `BRON API error (${status})`;
    } catch {
      return fallback;
    }
  }, []);

  const callApi = useCallback(async (action: string, params: Record<string, unknown> = {}, retries = 2) => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke("bron-rsapi", {
          body: { action, ...params },
        });

        if (error) {
          const message = await formatInvokeError(error);
          console.error("BRON API error:", error);
          throw new Error(message);
        }

        // Handle rate limiting with retry
        if (data?.rateLimited && attempt < retries) {
          const waitTime = (data?.retryAfter || 3) * 1000;
          console.log(`[BRON] Rate limited, waiting ${waitTime}ms before retry...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }

        return data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`BRON API call error (attempt ${attempt + 1}/${retries + 1}):`, err);
        
        // Only retry on network/timeout errors, not on 4xx errors
        const isRetryable = lastError.message.includes('timed out') || 
                           lastError.message.includes('network') ||
                           lastError.message.includes('fetch');
        
        if (!isRetryable || attempt >= retries) {
          throw lastError;
        }
        
        // Exponential backoff: 1s, 2s
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    
    throw lastError || new Error("BRON API call failed");
  }, [formatInvokeError]);

  const verifyAuth = useCallback(async (): Promise<boolean> => {
    return withPending(async () => {
      try {
        // Quick auth check with 1 retry
        const result = await callApi("verifyAuth", {}, 1);
        const authenticated = result?.success === true;
        setIsAuthenticated(authenticated);
        return authenticated;
      } catch (err) {
        console.warn("[BRON] Auth verification failed:", err);
        setIsAuthenticated(false);
        return false;
      }
    });
  }, [callApi, withPending]);

  const fetchDomains = useCallback(async () => {
    return withPending(async () => {
      try {
        const result = await callApi("listDomains", { limit: 100 });
        if (result?.success && result.data) {
          const rawList = result.data.domains || result.data.items || [];
          // Normalize domain_name to domain for consistency
          const domainList: BronDomain[] = (Array.isArray(rawList) ? rawList : []).map((d: { id?: number; domain_name?: string; domain?: string; deleted?: number; is_deleted?: boolean }) => ({
            id: d.id,
            domain: String(d.domain_name || d.domain || ""),
            domain_name: d.domain_name,
            is_deleted: d.deleted === 1 || d.is_deleted === true,
          }));
          setDomains(domainList);
        }
      } catch (err) {
        toast.error("Failed to fetch domains");
        console.error(err);
      }
    });
  }, [callApi, withPending]);

  const fetchDomain = useCallback(async (domain: string): Promise<BronDomain | null> => {
    try {
      const result = await callApi("getDomain", { domain });
      if (result?.success && result.data) {
        return result.data as BronDomain;
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [callApi]);

  const fetchSubscription = useCallback(async (domain: string): Promise<BronSubscription | null> => {
    try {
      const result = await callApi("getSubscription", { domain });
      if (result?.success && result.data) {
        return result.data as BronSubscription;
      }
      return null;
    } catch (err) {
      console.error("[BRON] fetchSubscription error:", err);
      return null;
    }
  }, [callApi]);

  const updateDomain = useCallback(async (domain: string, data: Record<string, unknown>): Promise<boolean> => {
    return withPending(async () => {
      try {
        const result = await callApi("updateDomain", { domain, data });
        if (result?.success) {
          toast.success("Domain updated successfully");
          return true;
        }
        return false;
      } catch (err) {
        toast.error("Failed to update domain");
        console.error(err);
        return false;
      }
    });
  }, [callApi, withPending]);

  const deleteDomain = useCallback(async (domain: string): Promise<boolean> => {
    return withPending(async () => {
      try {
        const result = await callApi("deleteDomain", { domain });
        if (result?.success) {
          toast.success("Domain deleted");
          await fetchDomains();
          return true;
        }
        return false;
      } catch (err) {
        toast.error("Failed to delete domain");
        console.error(err);
        return false;
      }
    });
  }, [callApi, fetchDomains, withPending]);

  const restoreDomain = useCallback(async (domain: string): Promise<boolean> => {
    return withPending(async () => {
      try {
        const result = await callApi("restoreDomain", { domain });
        if (result?.success) {
          toast.success("Domain restored");
          await fetchDomains();
          return true;
        }
        return false;
      } catch (err) {
        toast.error("Failed to restore domain");
        console.error(err);
        return false;
      }
    });
  }, [callApi, fetchDomains, withPending]);

  // Fetch all keywords with automatic pagination to get complete list
  // Uses 24-hour localStorage cache per domain
  const fetchKeywords = useCallback(async (domain?: string, forceRefresh = false) => {
    const reqId = ++keywordsReqIdRef.current;
    
    // Check cache first (unless force refresh)
    if (domain && !forceRefresh) {
      const cached = loadCachedKeywords(domain);
      if (cached) {
        setKeywords(cached);
        // Return early - data is served from cache
        return;
      }
    }
    
    return withPending(async () => {
      try {
        const allKeywords: BronKeyword[] = [];
        let page = 1;
        const pageSize = 100;
        let hasMore = true;
        
        // Fetch all pages of keywords
        while (hasMore) {
          const result = await callApi("listKeywords", {
            domain,
            page,
            limit: pageSize,
            include_deleted: false,
          });

          // Domain switched / reset while we were in-flight
          if (reqId !== keywordsReqIdRef.current) return;

          if (result?.success && result.data) {
            const keywordList = result.data.keywords || result.data.items || [];
            const keywords = Array.isArray(keywordList) ? keywordList : [];

            if (keywords.length > 0) {
              allKeywords.push(...keywords);
              // Check if we got a full page (meaning there might be more)
              hasMore = keywords.length >= pageSize;
              page++;

              // Safety limit to prevent infinite loops
              if (page > 10) {
                console.warn('[BRON] Reached maximum page limit (10) for keywords');
                hasMore = false;
              }
            } else {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }

        if (reqId !== keywordsReqIdRef.current) return;
        console.log(`[BRON] Fetched ${allKeywords.length} total keywords across ${page - 1} page(s)`);
        setKeywords(allKeywords);
        
        // Save to cache
        if (domain && allKeywords.length > 0) {
          saveCachedKeywords(domain, allKeywords);
        }
      } catch (err) {
        if (reqId !== keywordsReqIdRef.current) return;
        toast.error("Failed to fetch keywords");
        console.error(err);
      }
    });
  }, [callApi, withPending]);

  const addKeyword = useCallback(async (data: Record<string, unknown>, domain?: string): Promise<boolean> => {
    return withPending(async () => {
      try {
        const result = await callApi("addKeyword", { data });
        if (result?.success) {
          // Invalidate cache so next fetch gets fresh data
          if (domain) invalidateKeywordCache(domain);
          toast.success("Keyword added successfully");
          return true;
        }
        return false;
      } catch (err) {
        toast.error("Failed to add keyword");
        console.error(err);
        return false;
      }
    });
  }, [callApi, withPending]);

  const updateKeyword = useCallback(async (keywordId: string, data: Record<string, unknown>, domain?: string): Promise<boolean> => {
    return withPending(async () => {
      try {
        const result = await callApi("updateKeyword", { keyword_id: keywordId, data });
        if (result?.success) {
          // Invalidate cache so next fetch gets fresh data
          if (domain) invalidateKeywordCache(domain);
          toast.success("Keyword updated successfully");
          return true;
        }
        return false;
      } catch (err) {
        toast.error("Failed to update keyword");
        console.error(err);
        return false;
      }
    });
  }, [callApi, withPending]);

  const deleteKeyword = useCallback(async (keywordId: string, domain?: string): Promise<boolean> => {
    return withPending(async () => {
      try {
        const result = await callApi("deleteKeyword", { keyword_id: keywordId });
        if (result?.success) {
          // Invalidate cache so next fetch gets fresh data
          if (domain) invalidateKeywordCache(domain);
          toast.success("Keyword deleted");
          return true;
        }
        return false;
      } catch (err) {
        toast.error("Failed to delete keyword");
        console.error(err);
        return false;
      }
    });
  }, [callApi, withPending]);

  const restoreKeyword = useCallback(async (keywordId: string, domain?: string): Promise<boolean> => {
    return withPending(async () => {
      try {
        const result = await callApi("restoreKeyword", { keyword_id: keywordId });
        if (result?.success) {
          // Invalidate cache so next fetch gets fresh data
          if (domain) invalidateKeywordCache(domain);
          toast.success("Keyword restored");
          return true;
        }
        return false;
      } catch (err) {
        toast.error("Failed to restore keyword");
        console.error(err);
        return false;
      }
    });
  }, [callApi, withPending]);

  const fetchPages = useCallback(async (domain: string) => {
    const reqId = ++pagesReqIdRef.current;
    return withPending(async () => {
      try {
        const result = await callApi("getPages", { domain });
        if (reqId !== pagesReqIdRef.current) return;
        if (result?.success && result.data) {
          // API returns array directly in data, or nested in pages/articles/items
          const pageList = Array.isArray(result.data)
            ? result.data
            : (result.data.pages || result.data.articles || result.data.items || []);
          setPages(Array.isArray(pageList) ? pageList : []);
        }
      } catch (err) {
        if (reqId !== pagesReqIdRef.current) return;
        toast.error("Failed to fetch pages");
        console.error(err);
      }
    });
  }, [callApi, withPending]);

  const fetchSerpReport = useCallback(async (domain: string) => {
    const reqId = ++serpReportReqIdRef.current;
    return withPending(async () => {
      try {
        const result = await callApi("getSerpReport", { domain });
        if (reqId !== serpReportReqIdRef.current) return;
        if (result?.success && result.data) {
          // API returns array directly or nested
          const reports = Array.isArray(result.data)
            ? result.data
            : (result.data.rankings || result.data.keywords || result.data.items || []);
          setSerpReports(Array.isArray(reports) ? reports : []);
        }
      } catch (err) {
        if (reqId !== serpReportReqIdRef.current) return;
        toast.error("Failed to fetch SERP report");
        console.error(err);
      }
    });
  }, [callApi, withPending]);

  // Fetch list of historical SERP reports
  const fetchSerpList = useCallback(async (domain: string) => {
    const reqId = ++serpListReqIdRef.current;
    return withPending(async () => {
      try {
        const result = await callApi("getSerpList", { domain });
        if (reqId !== serpListReqIdRef.current) return;
        if (result?.success && result.data) {
          // API returns array directly or nested
          const reports = Array.isArray(result.data)
            ? result.data
            : (result.data.reports || result.data.items || []);
          setSerpHistory(Array.isArray(reports) ? reports : []);
        }
      } catch (err) {
        if (reqId !== serpListReqIdRef.current) return;
        console.error("Failed to fetch SERP list:", err);
      }
    });
  }, [callApi, withPending]);

  // Fetch detailed SERP data for a specific historical report
  const fetchSerpDetail = useCallback(async (domain: string, reportId: string): Promise<BronSerpReport[]> => {
    try {
      const result = await callApi("getSerpDetail", { domain, data: { report_id: reportId } });
      if (result?.success && result.data) {
        // API returns array directly or nested
        const reports = Array.isArray(result.data)
          ? result.data
          : (result.data.rankings || result.data.keywords || result.data.items || []);
        return Array.isArray(reports) ? reports : [];
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch SERP detail:", err);
      return [];
    }
  }, [callApi]);

  const fetchLinksIn = useCallback(async (domain: string, domainId?: number | string) => {
    const reqId = ++linksInReqIdRef.current;
    setLinksInError(null);
    return withPending(async () => {
      try {
        console.log(`[BRON] Fetching links-in for domain: ${domain}, domainId: ${domainId || 'N/A'}`);
        const result = await callApi("getLinksIn", { domain, domain_id: domainId });
        if (reqId !== linksInReqIdRef.current) return;
        if (result?.success && result.data) {
          // API returns array directly or nested
          const links = Array.isArray(result.data)
            ? result.data
            : (result.data.links || result.data.items || []);
          console.log(`[BRON] Links-in result: ${Array.isArray(links) ? links.length : 0} links`);
          setLinksIn(Array.isArray(links) ? links : []);
        } else if (result?.error) {
          setLinksInError(result.error || "Failed to fetch inbound links");
        }
      } catch (err) {
        if (reqId !== linksInReqIdRef.current) return;
        const errorMsg = err instanceof Error ? err.message : "Failed to fetch inbound links";
        setLinksInError(errorMsg);
        console.error(err);
      }
    });
  }, [callApi, withPending]);

  const fetchLinksOut = useCallback(async (domain: string, domainId?: number | string) => {
    const reqId = ++linksOutReqIdRef.current;
    setLinksOutError(null);
    return withPending(async () => {
      try {
        console.log(`[BRON] Fetching links-out for domain: ${domain}, domainId: ${domainId || 'N/A'}`);
        const result = await callApi("getLinksOut", { domain, domain_id: domainId });
        if (reqId !== linksOutReqIdRef.current) return;
        if (result?.success && result.data) {
          // API returns array directly or nested
          const links = Array.isArray(result.data)
            ? result.data
            : (result.data.links || result.data.items || []);
          console.log(`[BRON] Links-out result: ${Array.isArray(links) ? links.length : 0} links`);
          setLinksOut(Array.isArray(links) ? links : []);
        } else if (result?.error) {
          setLinksOutError(result.error || "Failed to fetch outbound links");
        }
      } catch (err) {
        if (reqId !== linksOutReqIdRef.current) return;
        const errorMsg = err instanceof Error ? err.message : "Failed to fetch outbound links";
        setLinksOutError(errorMsg);
        console.error(err);
      }
    });
  }, [callApi, withPending]);

  // Reset domain-specific data (for faster domain switching)
  const resetDomainData = useCallback(() => {
    // Invalidate any in-flight responses so they can't clobber the new domain.
    keywordsReqIdRef.current += 1;
    pagesReqIdRef.current += 1;
    serpReportReqIdRef.current += 1;
    serpListReqIdRef.current += 1;
    linksInReqIdRef.current += 1;
    linksOutReqIdRef.current += 1;

    setKeywords([]);
    setPages([]);
    setSerpReports([]);
    setSerpHistory([]);
    setLinksIn([]);
    setLinksOut([]);
    setLinksInError(null);
    setLinksOutError(null);
  }, []);

  return {
    isLoading,
    isAuthenticated,
    domains,
    keywords,
    pages,
    serpReports,
    serpHistory,
    linksIn,
    linksOut,
    linksInError,
    linksOutError,
    verifyAuth,
    fetchDomains,
    fetchDomain,
    fetchSubscription,
    updateDomain,
    deleteDomain,
    restoreDomain,
    fetchKeywords,
    addKeyword,
    updateKeyword,
    deleteKeyword,
    restoreKeyword,
    fetchPages,
    fetchSerpReport,
    fetchSerpList,
    fetchSerpDetail,
    fetchLinksIn,
    fetchLinksOut,
    resetDomainData,
  };
}
