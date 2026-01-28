import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Cache Configuration ───
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHED_DOMAINS = 10; // Limit cache entries per type

// ─── Domains Cache ───
const DOMAINS_CACHE_KEY = 'bron_domains_cache';

interface DomainsCacheEntry {
  domains: BronDomain[];
  cachedAt: number;
}

function loadCachedDomains(): BronDomain[] | null {
  try {
    const cached = localStorage.getItem(DOMAINS_CACHE_KEY);
    if (!cached) return null;
    const entry = JSON.parse(cached) as DomainsCacheEntry;
    if ((Date.now() - entry.cachedAt) > CACHE_MAX_AGE) return null;
    console.log(`[BRON] Using cached domains (${entry.domains.length} domains)`);
    return entry.domains;
  } catch (e) {
    console.warn('[BRON] Failed to load domains cache:', e);
    return null;
  }
}

function saveCachedDomains(domains: BronDomain[]) {
  try {
    localStorage.setItem(DOMAINS_CACHE_KEY, JSON.stringify({ domains, cachedAt: Date.now() }));
    console.log(`[BRON] Cached ${domains.length} domains`);
  } catch (e) {
    console.warn('[BRON] Failed to save domains cache:', e);
  }
}

function invalidateDomainsCache() {
  try {
    localStorage.removeItem(DOMAINS_CACHE_KEY);
    console.log('[BRON] Invalidated domains cache');
  } catch (e) {
    console.warn('[BRON] Failed to invalidate domains cache:', e);
  }
}

// ─── Domain Details Cache ───
const DOMAIN_DETAILS_CACHE_KEY = 'bron_domain_details_cache';

interface DomainDetailsCacheEntry {
  domain: BronDomain;
  cachedAt: number;
}

function loadCachedDomainDetails(domainName: string): BronDomain | null {
  try {
    const cached = localStorage.getItem(DOMAIN_DETAILS_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as Record<string, DomainDetailsCacheEntry>;
    const entry = parsed[domainName];
    if (!entry || (Date.now() - entry.cachedAt) > CACHE_MAX_AGE) return null;
    console.log(`[BRON] Using cached domain details for ${domainName}`);
    return entry.domain;
  } catch (e) {
    console.warn('[BRON] Failed to load domain details cache:', e);
    return null;
  }
}

function saveCachedDomainDetails(domainName: string, domain: BronDomain) {
  try {
    const cached = localStorage.getItem(DOMAIN_DETAILS_CACHE_KEY);
    const parsed = cached ? JSON.parse(cached) as Record<string, DomainDetailsCacheEntry> : {};
    
    const domains = Object.keys(parsed);
    if (domains.length >= MAX_CACHED_DOMAINS && !parsed[domainName]) {
      const oldest = domains.sort((a, b) => parsed[a].cachedAt - parsed[b].cachedAt)[0];
      delete parsed[oldest];
    }
    
    parsed[domainName] = { domain, cachedAt: Date.now() };
    localStorage.setItem(DOMAIN_DETAILS_CACHE_KEY, JSON.stringify(parsed));
    console.log(`[BRON] Cached domain details for ${domainName}`);
  } catch (e) {
    console.warn('[BRON] Failed to save domain details cache:', e);
  }
}

function invalidateDomainDetailsCache(domainName: string) {
  try {
    const cached = localStorage.getItem(DOMAIN_DETAILS_CACHE_KEY);
    if (!cached) return;
    const parsed = JSON.parse(cached) as Record<string, DomainDetailsCacheEntry>;
    if (parsed[domainName]) {
      delete parsed[domainName];
      localStorage.setItem(DOMAIN_DETAILS_CACHE_KEY, JSON.stringify(parsed));
      console.log(`[BRON] Invalidated domain details cache for ${domainName}`);
    }
  } catch (e) {
    console.warn('[BRON] Failed to invalidate domain details cache:', e);
  }
}

// ─── Subscription Cache ───
const SUBSCRIPTION_CACHE_KEY = 'bron_subscription_cache';

interface SubscriptionCacheEntry {
  subscription: BronSubscription;
  cachedAt: number;
}

function loadCachedSubscription(domain: string): BronSubscription | null {
  try {
    const cached = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as Record<string, SubscriptionCacheEntry>;
    const entry = parsed[domain];
    if (!entry || (Date.now() - entry.cachedAt) > CACHE_MAX_AGE) return null;
    console.log(`[BRON] Using cached subscription for ${domain}`);
    return entry.subscription;
  } catch (e) {
    console.warn('[BRON] Failed to load subscription cache:', e);
    return null;
  }
}

function saveCachedSubscription(domain: string, subscription: BronSubscription) {
  try {
    const cached = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    const parsed = cached ? JSON.parse(cached) as Record<string, SubscriptionCacheEntry> : {};
    
    const domains = Object.keys(parsed);
    if (domains.length >= MAX_CACHED_DOMAINS && !parsed[domain]) {
      const oldest = domains.sort((a, b) => parsed[a].cachedAt - parsed[b].cachedAt)[0];
      delete parsed[oldest];
    }
    
    parsed[domain] = { subscription, cachedAt: Date.now() };
    localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(parsed));
    console.log(`[BRON] Cached subscription for ${domain}`);
  } catch (e) {
    console.warn('[BRON] Failed to save subscription cache:', e);
  }
}

// ─── Pages Cache ───
const PAGES_CACHE_KEY = 'bron_pages_cache';

interface PagesCacheEntry {
  pages: BronPage[];
  cachedAt: number;
}

function loadCachedPages(domain: string): BronPage[] | null {
  try {
    const cached = localStorage.getItem(PAGES_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as Record<string, PagesCacheEntry>;
    const entry = parsed[domain];
    if (!entry || (Date.now() - entry.cachedAt) > CACHE_MAX_AGE) return null;
    console.log(`[BRON] Using cached pages for ${domain} (${entry.pages.length} pages)`);
    return entry.pages;
  } catch (e) {
    console.warn('[BRON] Failed to load pages cache:', e);
    return null;
  }
}

function saveCachedPages(domain: string, pages: BronPage[]) {
  try {
    const cached = localStorage.getItem(PAGES_CACHE_KEY);
    const parsed = cached ? JSON.parse(cached) as Record<string, PagesCacheEntry> : {};
    
    const domains = Object.keys(parsed);
    if (domains.length >= MAX_CACHED_DOMAINS && !parsed[domain]) {
      const oldest = domains.sort((a, b) => parsed[a].cachedAt - parsed[b].cachedAt)[0];
      delete parsed[oldest];
    }
    
    parsed[domain] = { pages, cachedAt: Date.now() };
    localStorage.setItem(PAGES_CACHE_KEY, JSON.stringify(parsed));
    console.log(`[BRON] Cached ${pages.length} pages for ${domain}`);
  } catch (e) {
    console.warn('[BRON] Failed to save pages cache:', e);
  }
}

// ─── Keyword Data Cache ───
// NOTE: V1 stored ALL domains under one key which could exceed localStorage quota and
// prevent newer domains from being cached (leading to slow domain switching).
// V2 stores each domain in its own key and keeps a small index for eviction.
const KEYWORD_CACHE_KEY = 'bron_keywords_cache'; // legacy (v1)
const KEYWORD_CACHE_V2_PREFIX = 'bron_keywords_cache_v2_';
const KEYWORD_CACHE_V2_INDEX_KEY = 'bron_keywords_cache_v2_index';

interface KeywordCacheEntry {
  keywords: BronKeyword[];
  cachedAt: number;
}

interface KeywordCacheIndexEntry {
  cachedAt: number;
  count: number;
}

function getKeywordV2Key(domain: string) {
  return `${KEYWORD_CACHE_V2_PREFIX}${domain}`;
}

function loadKeywordV2Index(): Record<string, KeywordCacheIndexEntry> {
  try {
    const raw = localStorage.getItem(KEYWORD_CACHE_V2_INDEX_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, KeywordCacheIndexEntry>;
  } catch {
    return {};
  }
}

function saveKeywordV2Index(index: Record<string, KeywordCacheIndexEntry>) {
  try {
    localStorage.setItem(KEYWORD_CACHE_V2_INDEX_KEY, JSON.stringify(index));
  } catch {
    // Best-effort; index not strictly required for cache reads
  }
}

function evictOldestKeywordV2Entries(index: Record<string, KeywordCacheIndexEntry>, keepDomain?: string) {
  const domains = Object.keys(index);
  if (domains.length <= MAX_CACHED_DOMAINS) return;

  const sorted = domains
    .filter((d) => d !== keepDomain)
    .sort((a, b) => (index[a]?.cachedAt ?? 0) - (index[b]?.cachedAt ?? 0));

  while (Object.keys(index).length > MAX_CACHED_DOMAINS && sorted.length > 0) {
    const oldest = sorted.shift();
    if (!oldest) break;
    try {
      localStorage.removeItem(getKeywordV2Key(oldest));
    } catch {
      // ignore
    }
    delete index[oldest];
  }
}

function loadCachedKeywords(domain: string): BronKeyword[] | null {
  try {
    // Prefer V2 per-domain cache
    const v2Raw = localStorage.getItem(getKeywordV2Key(domain));
    if (v2Raw) {
      const entry = JSON.parse(v2Raw) as KeywordCacheEntry;
      if (entry && (Date.now() - entry.cachedAt) <= CACHE_MAX_AGE) {
        console.log(`[BRON] Using cached keywords for ${domain} (${entry.keywords.length} keywords)`);
        return entry.keywords;
      }
    }

    // Fallback to legacy V1 map (migration happens on save)
    const cached = localStorage.getItem(KEYWORD_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as Record<string, KeywordCacheEntry>;
    const entry = parsed[domain];
    if (!entry || (Date.now() - entry.cachedAt) > CACHE_MAX_AGE) return null;
    console.log(`[BRON] Using cached keywords for ${domain} (${entry.keywords.length} keywords)`);
    return entry.keywords;
  } catch (e) {
    console.warn('[BRON] Failed to load keyword cache:', e);
    return null;
  }
}

function saveCachedKeywords(domain: string, keywords: BronKeyword[]) {
  const entry: KeywordCacheEntry = { keywords, cachedAt: Date.now() };
  const index = loadKeywordV2Index();
  index[domain] = { cachedAt: entry.cachedAt, count: keywords.length };

  // Ensure we keep at most N domains
  evictOldestKeywordV2Entries(index, domain);

  // Try to write; if quota is exceeded, evict more and retry.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      localStorage.setItem(getKeywordV2Key(domain), JSON.stringify(entry));
      saveKeywordV2Index(index);
      console.log(`[BRON] Cached ${keywords.length} keywords for ${domain}`);
      return;
    } catch (e) {
      // Evict one more oldest entry and retry
      const candidates = Object.keys(index)
        .filter((d) => d !== domain)
        .sort((a, b) => (index[a]?.cachedAt ?? 0) - (index[b]?.cachedAt ?? 0));

      const victim = candidates[0];
      if (!victim) {
        console.warn('[BRON] Failed to save keyword cache (no eviction candidates):', e);
        return;
      }

      try {
        localStorage.removeItem(getKeywordV2Key(victim));
      } catch {
        // ignore
      }
      delete index[victim];
    }
  }

  console.warn('[BRON] Failed to save keyword cache after retries');
}

export function invalidateKeywordCache(domain: string) {
  try {
    // V2
    try {
      localStorage.removeItem(getKeywordV2Key(domain));
    } catch {
      // ignore
    }
    const index = loadKeywordV2Index();
    if (index[domain]) {
      delete index[domain];
      saveKeywordV2Index(index);
    }

    // Legacy V1 best-effort cleanup
    const cached = localStorage.getItem(KEYWORD_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as Record<string, KeywordCacheEntry>;
      if (parsed[domain]) {
        delete parsed[domain];
        try {
          localStorage.setItem(KEYWORD_CACHE_KEY, JSON.stringify(parsed));
        } catch {
          // ignore
        }
      }
    }

    console.log(`[BRON] Invalidated keyword cache for ${domain}`);
  } catch (e) {
    console.warn('[BRON] Failed to invalidate keyword cache:', e);
  }
}

// ─── SERP Data Cache ───
const SERP_CACHE_KEY = 'bron_serp_cache';

interface SerpCacheEntry {
  serpReports: BronSerpReport[];
  serpHistory: BronSerpListItem[];
  latestReportId: string | number | null;
  cachedAt: number;
}

function loadCachedSerp(domain: string): { serpReports: BronSerpReport[]; serpHistory: BronSerpListItem[]; latestReportId: string | number | null } | null {
  try {
    const cached = localStorage.getItem(SERP_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as Record<string, SerpCacheEntry>;
    const entry = parsed[domain];
    if (!entry || (Date.now() - entry.cachedAt) > CACHE_MAX_AGE) return null;
    console.log(`[BRON] Using cached SERP data for ${domain} (${entry.serpReports.length} rankings, ${entry.serpHistory.length} reports)`);
    return { serpReports: entry.serpReports, serpHistory: entry.serpHistory, latestReportId: entry.latestReportId };
  } catch (e) {
    console.warn('[BRON] Failed to load SERP cache:', e);
    return null;
  }
}

function saveCachedSerp(domain: string, serpReports: BronSerpReport[], serpHistory: BronSerpListItem[]) {
  try {
    const cached = localStorage.getItem(SERP_CACHE_KEY);
    const parsed = cached ? JSON.parse(cached) as Record<string, SerpCacheEntry> : {};
    
    const domains = Object.keys(parsed);
    if (domains.length >= MAX_CACHED_DOMAINS && !parsed[domain]) {
      const oldest = domains.sort((a, b) => parsed[a].cachedAt - parsed[b].cachedAt)[0];
      delete parsed[oldest];
    }
    
    const latestReportId = serpHistory.length > 0 
      ? (serpHistory.sort((a, b) => {
          const dateA = new Date(a.started || a.created_at || 0).getTime();
          const dateB = new Date(b.started || b.created_at || 0).getTime();
          return dateB - dateA;
        })[0]?.report_id || serpHistory[0]?.id || null)
      : null;
    
    parsed[domain] = { serpReports, serpHistory, latestReportId, cachedAt: Date.now() };
    localStorage.setItem(SERP_CACHE_KEY, JSON.stringify(parsed));
    console.log(`[BRON] Cached SERP data for ${domain}`);
  } catch (e) {
    console.warn('[BRON] Failed to save SERP cache:', e);
  }
}

// ─── Links Data Cache ───
const LINKS_CACHE_KEY = 'bron_links_cache';

interface LinksCacheEntry {
  linksIn: BronLink[];
  linksOut: BronLink[];
  linksInCount: number;
  linksOutCount: number;
  cachedAt: number;
}

function loadCachedLinks(domain: string): { linksIn: BronLink[]; linksOut: BronLink[] } | null {
  try {
    const cached = localStorage.getItem(LINKS_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as Record<string, LinksCacheEntry>;
    const entry = parsed[domain];
    if (!entry || (Date.now() - entry.cachedAt) > CACHE_MAX_AGE) return null;
    console.log(`[BRON] Using cached links for ${domain} (${entry.linksIn.length} in, ${entry.linksOut.length} out)`);
    return { linksIn: entry.linksIn, linksOut: entry.linksOut };
  } catch (e) {
    console.warn('[BRON] Failed to load links cache:', e);
    return null;
  }
}

function saveCachedLinks(domain: string, linksIn: BronLink[], linksOut: BronLink[]) {
  try {
    const cached = localStorage.getItem(LINKS_CACHE_KEY);
    const parsed = cached ? JSON.parse(cached) as Record<string, LinksCacheEntry> : {};
    
    const domains = Object.keys(parsed);
    if (domains.length >= MAX_CACHED_DOMAINS && !parsed[domain]) {
      const oldest = domains.sort((a, b) => parsed[a].cachedAt - parsed[b].cachedAt)[0];
      delete parsed[oldest];
    }
    
    parsed[domain] = { 
      linksIn, 
      linksOut, 
      linksInCount: linksIn.length,
      linksOutCount: linksOut.length,
      cachedAt: Date.now() 
    };
    localStorage.setItem(LINKS_CACHE_KEY, JSON.stringify(parsed));
    console.log(`[BRON] Cached links for ${domain} (${linksIn.length} in, ${linksOut.length} out)`);
  } catch (e) {
    console.warn('[BRON] Failed to save links cache:', e);
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
  /**
   * Set the currently selected domain for BRON.
   * Hydrates cached domain data immediately (or clears state) so UI does not
   * show results from a previously selected domain.
   */
  selectDomain: (domain: string | null) => void;
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
  fetchSerpReport: (domain: string, forceRefresh?: boolean) => Promise<void>;
  fetchSerpList: (domain: string, forceRefresh?: boolean) => Promise<void>;
  fetchSerpDetail: (domain: string, reportId: string) => Promise<BronSerpReport[]>;
  fetchLinksIn: (domain: string, domainId?: number | string) => Promise<void>;
  fetchLinksOut: (domain: string, domainId?: number | string) => Promise<void>;
  resetDomainData: () => void;
  prefetchKeywordsForDomains: (domainList: BronDomain[]) => Promise<void>;
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

  // Active domain chosen in the header domain selector.
  // This allows optional-domain methods (like fetchKeywords/addKeyword, etc.)
  // to reliably route requests to the selected domain.
  const activeDomainRef = useRef<string | null>(null);

  // Prevent concurrent background prefetch runs from saturating the API/network.
  const keywordPrefetchInFlightRef = useRef(false);

  const normalizeDomainKey = useCallback((input: string) => {
    return (input || '')
      .toLowerCase()
      .trim()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0];
  }, []);

  // Prevent stale async responses (domain switching / rapid tab changes)
  const keywordsReqIdRef = useRef(0);
  const pagesReqIdRef = useRef(0);
  const serpReportReqIdRef = useRef(0);
  const serpListReqIdRef = useRef(0);
  const linksInReqIdRef = useRef(0);
  const linksOutReqIdRef = useRef(0);

  // Track latest link payloads per domain so we can save a complete cache entry
  // when either direction returns (prevents re-hitting API on every domain switch).
  const linksBufferRef = useRef<Record<string, { in: BronLink[] | null; out: BronLink[] | null }>>({});

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
          throw new Error(`[BRON:${action}] ${message}`);
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
        const errMsg = lastError.message.toLowerCase();
        console.error(`BRON API call error (attempt ${attempt + 1}/${retries + 1}):`, err);
        
        // Retry on network/timeout/transient errors
        const isRetryable = errMsg.includes('timed out') || 
                           errMsg.includes('timeout') ||
                           errMsg.includes('network') ||
                           errMsg.includes('fetch') ||
                           errMsg.includes('failed to send') ||
                           errMsg.includes('aborted') ||
                           errMsg.includes('connection');
        
        if (!isRetryable || attempt >= retries) {
          // Ensure the action is always present in surfaced errors
          if (!lastError.message.includes('[BRON:')) {
            throw new Error(`[BRON:${action}] ${lastError.message}`);
          }
          throw lastError;
        }
        
        // Exponential backoff: 1s, 2s
        console.log(`[BRON] Retrying ${action} in ${(attempt + 1)}s...`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    
    throw lastError || new Error("BRON API call failed");
  }, [formatInvokeError]);

  // When the header domain selector changes, hydrate this domain's cached data
  // immediately (or clear) to prevent mismatched UI/data.
  const selectDomain = useCallback((domain: string | null) => {
    // Invalidate any in-flight responses so they can't clobber the new domain.
    keywordsReqIdRef.current += 1;
    pagesReqIdRef.current += 1;
    serpReportReqIdRef.current += 1;
    serpListReqIdRef.current += 1;
    linksInReqIdRef.current += 1;
    linksOutReqIdRef.current += 1;

    const key = domain ? normalizeDomainKey(domain) : null;
    activeDomainRef.current = key;

    setLinksInError(null);
    setLinksOutError(null);

    if (!key) {
      setKeywords([]);
      setPages([]);
      setSerpReports([]);
      setSerpHistory([]);
      setLinksIn([]);
      setLinksOut([]);
      return;
    }

    // Hydrate caches synchronously.
    setKeywords(loadCachedKeywords(key) || []);
    setPages(loadCachedPages(key) || []);

    const cachedSerp = loadCachedSerp(key);
    setSerpReports(cachedSerp?.serpReports || []);
    setSerpHistory(cachedSerp?.serpHistory || []);

    const cachedLinks = loadCachedLinks(key);
    setLinksIn(cachedLinks?.linksIn || []);
    setLinksOut(cachedLinks?.linksOut || []);

    if (cachedLinks) {
      linksBufferRef.current[key] = { in: cachedLinks.linksIn, out: cachedLinks.linksOut };
    } else {
      linksBufferRef.current[key] = { in: null, out: null };
    }
  }, [normalizeDomainKey]);

  const verifyAuth = useCallback(async (): Promise<boolean> => {
    return withPending(async () => {
      try {
        console.log("[BRON] Starting auth verification...");
        // Auth check with 2 retries (total 3 attempts) for better reliability
        const result = await callApi("verifyAuth", {}, 2);
        console.log("[BRON] Auth result:", JSON.stringify(result, null, 2));
        
        // Check for success - the API returns success: true with data containing status
        // Also accept top-level status for backwards compatibility
        const dataStatus = result?.data?.status;
        const dataAuthenticated = result?.data?.authenticated;
        const topLevelStatus = result?.status;
        
        const authenticated = result?.success === true && 
          (dataStatus === "authenticated" || dataAuthenticated === true || topLevelStatus === "authenticated");
        
        console.log("[BRON] Auth check breakdown:", {
          success: result?.success,
          dataStatus,
          dataAuthenticated,
          topLevelStatus,
          authenticated,
        });
        
        setIsAuthenticated(authenticated);
        return authenticated;
      } catch (err) {
        console.error("[BRON] Auth verification failed:", err);
        setIsAuthenticated(false);
        // Re-throw so the dashboard can show a meaningful error
        throw err;
      }
    });
  }, [callApi, withPending]);

  // Fetch domains with caching
  const fetchDomains = useCallback(async (forceRefresh = false) => {
    // Try cache first
    if (!forceRefresh) {
      const cached = loadCachedDomains();
      if (cached) {
        setDomains(cached);
        
        // Background refresh to check for changes
        callApi("listDomains", { limit: 100 }).then(result => {
          if (result?.success && result.data) {
            const rawList = result.data.domains || result.data.items || [];
            const freshDomains: BronDomain[] = (Array.isArray(rawList) ? rawList : []).map((d: any) => ({
              id: d.id,
              domain: String(d.domain_name || d.domain || ""),
              domain_name: d.domain_name,
              is_deleted: d.deleted === 1 || d.is_deleted === true,
            }));
            
            // Only update if count changed
            if (freshDomains.length !== cached.length) {
              console.log(`[BRON] Domains changed (${cached.length} -> ${freshDomains.length})`);
              setDomains(freshDomains);
              saveCachedDomains(freshDomains);
            }
          }
        }).catch(err => console.warn('[BRON] Background domains check failed:', err));
        
        return; // Served from cache
      }
    }
    
    return withPending(async () => {
      try {
        const result = await callApi("listDomains", { limit: 100 });
        if (result?.success && result.data) {
          const rawList = result.data.domains || result.data.items || [];
          const domainList: BronDomain[] = (Array.isArray(rawList) ? rawList : []).map((d: any) => ({
            id: d.id,
            domain: String(d.domain_name || d.domain || ""),
            domain_name: d.domain_name,
            is_deleted: d.deleted === 1 || d.is_deleted === true,
          }));
          setDomains(domainList);
          saveCachedDomains(domainList);
        }
      } catch (err) {
        toast.error("Failed to fetch domains");
        console.error(err);
      }
    });
  }, [callApi, withPending]);

  // Fetch single domain details with caching
  const fetchDomain = useCallback(async (domain: string, forceRefresh = false): Promise<BronDomain | null> => {
    // Try cache first
    if (!forceRefresh) {
      const cached = loadCachedDomainDetails(domain);
      if (cached) {
        // Background refresh
        callApi("getDomain", { domain }).then(result => {
          if (result?.success && result.data) {
            saveCachedDomainDetails(domain, result.data as BronDomain);
          }
        }).catch(err => console.warn('[BRON] Background domain details check failed:', err));
        
        return cached;
      }
    }
    
    try {
      const result = await callApi("getDomain", { domain });
      if (result?.success && result.data) {
        const domainData = result.data as BronDomain;
        saveCachedDomainDetails(domain, domainData);
        return domainData;
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [callApi]);

  // Fetch subscription with caching
  const fetchSubscription = useCallback(async (domain: string, forceRefresh = false): Promise<BronSubscription | null> => {
    // Try cache first
    if (!forceRefresh) {
      const cached = loadCachedSubscription(domain);
      if (cached) {
        // Background refresh
        callApi("getSubscription", { domain }).then(result => {
          if (result?.success && result.data) {
            saveCachedSubscription(domain, result.data as BronSubscription);
          }
        }).catch(err => console.warn('[BRON] Background subscription check failed:', err));
        
        return cached;
      }
    }
    
    try {
      const result = await callApi("getSubscription", { domain });
      if (result?.success && result.data) {
        const subData = result.data as BronSubscription;
        saveCachedSubscription(domain, subData);
        return subData;
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
          // Invalidate caches
          invalidateDomainDetailsCache(domain);
          invalidateDomainsCache();
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
          // Invalidate caches
          invalidateDomainDetailsCache(domain);
          invalidateDomainsCache();
          toast.success("Domain deleted");
          await fetchDomains(true); // Force refresh
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
          // Invalidate caches
          invalidateDomainDetailsCache(domain);
          invalidateDomainsCache();
          toast.success("Domain restored");
          await fetchDomains(true); // Force refresh
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
  // Uses 24-hour localStorage cache per domain with background refresh
  const fetchKeywords = useCallback(async (domain?: string, forceRefresh = false) => {
    const domainKey = domain ? normalizeDomainKey(domain) : activeDomainRef.current;
    if (!domainKey) {
      console.warn('[BRON] fetchKeywords called without a selected domain');
      toast.error('Please select a domain first');
      return;
    }

    const reqId = ++keywordsReqIdRef.current;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = loadCachedKeywords(domainKey);
      if (cached) {
        setKeywords(cached);
        
        // Background refresh to check for changes (count-based)
        const localReqId = reqId;
        callApi("listKeywords", { domain: domainKey, page: 1, limit: 100, include_deleted: false })
          .then(async (result) => {
            if (localReqId !== keywordsReqIdRef.current) return;
            if (result?.success && result.data) {
              const firstPageKeywords = result.data.keywords || result.data.items || [];
              const firstPageCount = Array.isArray(firstPageKeywords) ? firstPageKeywords.length : 0;
              
              // If first page is full (100), there might be more - check total
              // Simple heuristic: if cached count differs significantly, refresh
              const cachedCount = cached.length;
              const needsRefresh = firstPageCount === 100 
                ? cachedCount < 100 // If we had less than 100, but now first page is full
                : firstPageCount !== cachedCount; // If counts differ
              
              if (needsRefresh) {
                console.log(`[BRON] Keywords changed for ${domainKey}, refreshing...`);
                // Full refresh in background
                const allKeywords: BronKeyword[] = [];
                let page = 1;
                let hasMore = true;
                
                while (hasMore && page <= 10) {
                  const pageResult = await callApi("listKeywords", { domain: domainKey, page, limit: 100, include_deleted: false });
                  if (localReqId !== keywordsReqIdRef.current) return;
                  if (pageResult?.success && pageResult.data) {
                    const keywords = pageResult.data.keywords || pageResult.data.items || [];
                    if (Array.isArray(keywords) && keywords.length > 0) {
                      allKeywords.push(...keywords);
                      hasMore = keywords.length >= 100;
                      page++;
                    } else {
                      hasMore = false;
                    }
                  } else {
                    hasMore = false;
                  }
                }
                
                if (localReqId === keywordsReqIdRef.current && allKeywords.length > 0) {
                  setKeywords(allKeywords);
                  saveCachedKeywords(domainKey, allKeywords);
                }
              }
            }
          })
          .catch(err => console.warn('[BRON] Background keywords check failed:', err));
        
        return; // Served from cache immediately
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
            domain: domainKey,
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
        if (allKeywords.length > 0) {
          saveCachedKeywords(domainKey, allKeywords);
        }
      } catch (err) {
        if (reqId !== keywordsReqIdRef.current) return;
        toast.error("Failed to fetch keywords");
        console.error(err);
      }
    });
  }, [callApi, normalizeDomainKey, withPending]);

  const addKeyword = useCallback(async (data: Record<string, unknown>, domain?: string): Promise<boolean> => {
    return withPending(async () => {
      try {
        const result = await callApi("addKeyword", { data });
        if (result?.success) {
          // Invalidate cache so next fetch gets fresh data
          const domainKey = domain ? normalizeDomainKey(domain) : activeDomainRef.current;
          if (domainKey) invalidateKeywordCache(domainKey);
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
  }, [callApi, normalizeDomainKey, withPending]);

  const updateKeyword = useCallback(async (keywordId: string, data: Record<string, unknown>, domain?: string): Promise<boolean> => {
    return withPending(async () => {
      try {
        const result = await callApi("updateKeyword", { keyword_id: keywordId, data });
        if (result?.success) {
          // Invalidate cache so next fetch gets fresh data
          const domainKey = domain ? normalizeDomainKey(domain) : activeDomainRef.current;
          if (domainKey) invalidateKeywordCache(domainKey);
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
  }, [callApi, normalizeDomainKey, withPending]);

  const deleteKeyword = useCallback(async (keywordId: string, domain?: string): Promise<boolean> => {
    return withPending(async () => {
      try {
        const result = await callApi("deleteKeyword", { keyword_id: keywordId });
        if (result?.success) {
          // Invalidate cache so next fetch gets fresh data
          const domainKey = domain ? normalizeDomainKey(domain) : activeDomainRef.current;
          if (domainKey) invalidateKeywordCache(domainKey);
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
  }, [callApi, normalizeDomainKey, withPending]);

  const restoreKeyword = useCallback(async (keywordId: string, domain?: string): Promise<boolean> => {
    return withPending(async () => {
      try {
        const result = await callApi("restoreKeyword", { keyword_id: keywordId });
        if (result?.success) {
          // Invalidate cache so next fetch gets fresh data
          const domainKey = domain ? normalizeDomainKey(domain) : activeDomainRef.current;
          if (domainKey) invalidateKeywordCache(domainKey);
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
  }, [callApi, normalizeDomainKey, withPending]);

  // Fetch pages with caching
  const fetchPages = useCallback(async (domain: string, forceRefresh = false) => {
    const reqId = ++pagesReqIdRef.current;
    
    // Try cache first
    if (!forceRefresh) {
      const cached = loadCachedPages(domain);
      if (cached) {
        setPages(cached);
        
        // Background refresh
        callApi("getPages", { domain }).then(result => {
          if (reqId !== pagesReqIdRef.current) return;
          if (result?.success && result.data) {
            const pageList = Array.isArray(result.data)
              ? result.data
              : (result.data.pages || result.data.articles || result.data.items || []);
            const freshPages = Array.isArray(pageList) ? pageList : [];
            
            // Only update if count changed
            if (freshPages.length !== cached.length) {
              console.log(`[BRON] Pages changed for ${domain} (${cached.length} -> ${freshPages.length})`);
              setPages(freshPages);
              saveCachedPages(domain, freshPages);
            }
          }
        }).catch(err => console.warn('[BRON] Background pages check failed:', err));
        
        return; // Served from cache
      }
    }
    
    return withPending(async () => {
      try {
        const result = await callApi("getPages", { domain });
        if (reqId !== pagesReqIdRef.current) return;
        if (result?.success && result.data) {
          const pageList = Array.isArray(result.data)
            ? result.data
            : (result.data.pages || result.data.articles || result.data.items || []);
          const freshPages = Array.isArray(pageList) ? pageList : [];
          setPages(freshPages);
          saveCachedPages(domain, freshPages);
        }
      } catch (err) {
        if (reqId !== pagesReqIdRef.current) return;
        toast.error("Failed to fetch pages");
        console.error(err);
      }
    });
  }, [callApi, withPending]);

  // Fetch SERP report with caching
  // Uses cached data if available and not expired
  const fetchSerpReport = useCallback(async (domain: string, forceRefresh = false) => {
    const reqId = ++serpReportReqIdRef.current;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = loadCachedSerp(domain);
      if (cached && cached.serpReports.length > 0) {
        setSerpReports(cached.serpReports);
        setSerpHistory(cached.serpHistory);
        return; // Use cached data
      }
    }
    
    return withPending(async () => {
      try {
        const result = await callApi("getSerpReport", { domain });
        if (reqId !== serpReportReqIdRef.current) return;
        if (result?.success && result.data) {
          // API returns array directly or nested
          const reports = Array.isArray(result.data)
            ? result.data
            : (result.data.rankings || result.data.keywords || result.data.items || []);
          const serpReports = Array.isArray(reports) ? reports : [];
          setSerpReports(serpReports);
          
          // Note: Don't save to cache here - let fetchSerpList handle it with the history
        }
      } catch (err) {
        if (reqId !== serpReportReqIdRef.current) return;
        toast.error("Failed to fetch SERP report");
        console.error(err);
      }
    });
  }, [callApi, withPending]);

  // Fetch list of historical SERP reports with smart caching
  // Checks if a new report has been run since last cache, only fetches fresh if needed
  const fetchSerpList = useCallback(async (domain: string, forceRefresh = false) => {
    const reqId = ++serpListReqIdRef.current;
    
    // Check cache first
    const cached = loadCachedSerp(domain);
    if (cached && !forceRefresh) {
      // Serve from cache immediately
      setSerpHistory(cached.serpHistory);
      setSerpReports(cached.serpReports);
      
      // Background check for new reports (lightweight check)
      // We still fetch the list to see if there's a newer report
      callApi("getSerpList", { domain }).then(result => {
        if (reqId !== serpListReqIdRef.current) return;
        if (result?.success && result.data) {
          const reports = Array.isArray(result.data)
            ? result.data
            : (result.data.reports || result.data.items || []);
          const freshHistory = Array.isArray(reports) ? reports : [];
          
          if (freshHistory.length > 0) {
            // Check if there's a new report by comparing latest report ID
            const freshLatestId = freshHistory.sort((a, b) => {
              const dateA = new Date(a.started || a.created_at || 0).getTime();
              const dateB = new Date(b.started || b.created_at || 0).getTime();
              return dateB - dateA;
            })[0]?.report_id || freshHistory[0]?.id;
            
            if (freshLatestId && String(freshLatestId) !== String(cached.latestReportId)) {
              console.log(`[BRON] New SERP report detected for ${domain}, refreshing data...`);
              // New report found - fetch fresh SERP data
              callApi("getSerpReport", { domain }).then(serpResult => {
                if (reqId !== serpListReqIdRef.current) return;
                if (serpResult?.success && serpResult.data) {
                  const serpData = Array.isArray(serpResult.data)
                    ? serpResult.data
                    : (serpResult.data.rankings || serpResult.data.keywords || serpResult.data.items || []);
                  const freshSerpReports = Array.isArray(serpData) ? serpData : [];
                  
                  setSerpReports(freshSerpReports);
                  setSerpHistory(freshHistory);
                  saveCachedSerp(domain, freshSerpReports, freshHistory);
                }
              });
            }
          }
        }
      }).catch(err => {
        console.warn('[BRON] Background SERP check failed:', err);
      });
      
      return; // Already served from cache
    }
    
    // No cache - fetch fresh
    return withPending(async () => {
      try {
        const result = await callApi("getSerpList", { domain });
        if (reqId !== serpListReqIdRef.current) return;
        if (result?.success && result.data) {
          // API returns array directly or nested
          const reports = Array.isArray(result.data)
            ? result.data
            : (result.data.reports || result.data.items || []);
          const freshHistory = Array.isArray(reports) ? reports : [];
          setSerpHistory(freshHistory);
          
          // Also fetch the SERP report data and cache together
          const serpResult = await callApi("getSerpReport", { domain });
          if (reqId !== serpListReqIdRef.current) return;
          if (serpResult?.success && serpResult.data) {
            const serpData = Array.isArray(serpResult.data)
              ? serpResult.data
              : (serpResult.data.rankings || serpResult.data.keywords || serpResult.data.items || []);
            const freshSerpReports = Array.isArray(serpData) ? serpData : [];
            setSerpReports(freshSerpReports);
            
            // Save both to cache
            saveCachedSerp(domain, freshSerpReports, freshHistory);
          }
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

  // Combined fetch for both links - uses cache and background refresh
  const fetchLinksIn = useCallback(async (domain: string, domainId?: number | string, forceRefresh = false) => {
    const reqId = ++linksInReqIdRef.current;
    setLinksInError(null);
    
    // Try cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = loadCachedLinks(domain);
      if (cached) {
        setLinksIn(cached.linksIn);

        // Keep both directions in sync when cached entry exists (even if empty)
        setLinksOut(cached.linksOut);

        // Prime buffer so subsequent single-direction updates can re-cache cleanly
        linksBufferRef.current[domain] = { in: cached.linksIn, out: cached.linksOut };
        
        return; // Served from cache
      }
    }
    
    return withPending(async () => {
      try {
        console.log(`[BRON] Fetching links-in for domain: ${domain}, domainId: ${domainId || 'N/A'}`);
        const result = await callApi("getLinksIn", { domain, domain_id: domainId });
        if (reqId !== linksInReqIdRef.current) return;
        if (result?.success && result.data) {
          const links = Array.isArray(result.data)
            ? result.data
            : (result.data.links || result.data.items || []);
          const freshLinks = Array.isArray(links) ? links : [];
          console.log(`[BRON] Links-in result: ${freshLinks.length} links`);
          setLinksIn(freshLinks);

          const prev = linksBufferRef.current[domain] || { in: null, out: null };
          const next = { ...prev, in: freshLinks };
          linksBufferRef.current[domain] = next;
          if (next.in !== null && next.out !== null) {
            saveCachedLinks(domain, next.in, next.out);
          }
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

  const fetchLinksOut = useCallback(async (domain: string, domainId?: number | string, forceRefresh = false) => {
    const reqId = ++linksOutReqIdRef.current;
    setLinksOutError(null);
    
    // Try cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = loadCachedLinks(domain);

      if (cached) {
        setLinksOut(cached.linksOut);
        setLinksIn(cached.linksIn);

        linksBufferRef.current[domain] = { in: cached.linksIn, out: cached.linksOut };
        
        return; // Served from cache
      }
    }
    
    return withPending(async () => {
      try {
        console.log(`[BRON] Fetching links-out for domain: ${domain}, domainId: ${domainId || 'N/A'}`);
        const result = await callApi("getLinksOut", { domain, domain_id: domainId });
        if (reqId !== linksOutReqIdRef.current) return;
        if (result?.success && result.data) {
          const links = Array.isArray(result.data)
            ? result.data
            : (result.data.links || result.data.items || []);
          const freshLinks = Array.isArray(links) ? links : [];
          console.log(`[BRON] Links-out result: ${freshLinks.length} links`);
          setLinksOut(freshLinks);

          const prev = linksBufferRef.current[domain] || { in: null, out: null };
          const next = { ...prev, out: freshLinks };
          linksBufferRef.current[domain] = next;
          if (next.in !== null && next.out !== null) {
            saveCachedLinks(domain, next.in, next.out);
          }
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
  
  // Helper to save both links to cache (called after both are fetched)
  const saveLinksCacheIfReady = useCallback((domain: string, currentLinksIn: BronLink[], currentLinksOut: BronLink[]) => {
    if (currentLinksIn.length > 0 || currentLinksOut.length > 0) {
      saveCachedLinks(domain, currentLinksIn, currentLinksOut);
    }
  }, []);

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

  // Prefetch keywords for all domains in background to enable instant domain switching.
  // This runs after initial auth without blocking the UI - it populates cache silently.
  const prefetchKeywordsForDomains = useCallback(async (domainList: BronDomain[]) => {
    if (keywordPrefetchInFlightRef.current) return;
    keywordPrefetchInFlightRef.current = true;

    try {
    const domainsToFetch = domainList
      .filter(d => !d.is_deleted && d.domain)
      .map(d => normalizeDomainKey(d.domain));

    // Check which domains already have cached keywords (skip those)
    const uncached = domainsToFetch.filter(domain => {
      const cached = loadCachedKeywords(domain);
      return !cached || cached.length === 0;
    });

    if (uncached.length === 0) {
      console.log('[BRON] All domains already have cached keywords');
      return;
    }

    console.log(`[BRON] Prefetching keywords for ${uncached.length} domains in background...`);

    // Fetch in sequence with small delays to avoid overwhelming API
    for (const domain of uncached) {
      try {
        const allKeywords: BronKeyword[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 10) {
          const result = await callApi("listKeywords", { domain, page, limit: 100, include_deleted: false });
          if (result?.success && result.data) {
            const keywords = result.data.keywords || result.data.items || [];
            if (Array.isArray(keywords) && keywords.length > 0) {
              allKeywords.push(...keywords);
              hasMore = keywords.length >= 100;
              page++;
            } else {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }

        if (allKeywords.length > 0) {
          saveCachedKeywords(domain, allKeywords);
          console.log(`[BRON] Prefetched ${allKeywords.length} keywords for ${domain}`);
        }

        // Small delay between domains to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.warn(`[BRON] Failed to prefetch keywords for ${domain}:`, err);
      }
    }

    console.log('[BRON] Background keyword prefetch complete');
    } finally {
      keywordPrefetchInFlightRef.current = false;
    }
  }, [callApi, normalizeDomainKey]);

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
    selectDomain,
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
    prefetchKeywordsForDomains,
  };
}
