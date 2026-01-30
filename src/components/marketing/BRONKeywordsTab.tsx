import { useState, useMemo, useEffect, useRef, useCallback, memo, startTransition, lazy, Suspense } from "react";
import { Key, RefreshCw, Plus, Search, Save, X, ChevronUp, Loader2, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BronKeyword, BronSerpReport, BronLink, BronSerpListItem } from "@/hooks/use-bron-api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Lazy-load the WYSIWYG editor - only loads when article editor opens
const WysiwygEditor = lazy(() => import("@/components/marketing/WysiwygEditor"));
import {
  loadKeywordMetricsCache,
  mergeAndSaveKeywordMetricsCache,
} from "@/lib/bronKeywordMetricsCache";

// Import modular components
import {
  BronKeywordCard,
  BronKeywordExpanded,
  getKeywordDisplayText,
  getPosition,
  KeywordMetrics,
  PageSpeedScore,
  loadCachedPageSpeedScores,
  saveCachedPageSpeedScores,
  findSerpForKeyword,
  groupKeywords,
  mergeKeywordsWithSerp,
  decodeHtmlContent,
  filterLinksForKeyword,
  BronKeywordSkeletonList,
  BronKeywordTableHeader,
  BronHistoryDateSelector,
  BronQuickFilters,
  QuickFilterType,
  BronClusterCard,
  BronClusterVisualization,
  BronKeywordAnalysisDialog,
} from "./bron";

interface BRONKeywordsTabProps {
  keywords: BronKeyword[];
  serpReports?: BronSerpReport[];
  serpHistory?: BronSerpListItem[];
  linksIn?: BronLink[];
  linksOut?: BronLink[];
  selectedDomain?: string;
  isLoading: boolean;
  onRefresh: () => void;
  onAdd: (data: Record<string, unknown>) => Promise<boolean>;
  onUpdate: (keywordId: string, data: Record<string, unknown>) => Promise<boolean>;
  onDelete: (keywordId: string) => Promise<boolean>;
  onRestore: (keywordId: string) => Promise<boolean>;
  onFetchSerpDetail?: (domain: string, reportId: string) => Promise<BronSerpReport[]>;
  onToggleLink?: (linkId: string | number, currentDisabled: string, domain: string) => Promise<boolean>;
}

// Initial positions type
interface InitialPositions {
  google: number | null;
  bing: number | null;
  yahoo: number | null;
}

// Baseline report ID - used to detect when viewing the baseline itself (no movement)
interface BaselineInfo {
  reportId: string | null;
  positions: Record<string, InitialPositions>;
}

function buildKeywordKeyVariants(text: string): string[] {
  const base = (text || '').toLowerCase().trim();
  if (!base) return [];

  const beforeColon = base.includes(':') ? base.split(':')[0].trim() : base;

  // Keep spaces, but normalize punctuation/whitespace.
  const normalized = base
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedNoSpace = normalized.replace(/\s+/g, '');

  const beforeColonNormalized = beforeColon
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const beforeColonNormalizedNoSpace = beforeColonNormalized.replace(/\s+/g, '');

  // Unique, stable order.
  const out: string[] = [];
  const push = (v: string) => {
    if (!v) return;
    if (!out.includes(v)) out.push(v);
  };

  push(base);
  push(beforeColon);
  push(normalized);
  push(normalizedNoSpace);
  push(beforeColonNormalized);
  push(beforeColonNormalizedNoSpace);

  return out;
}

function lookupInitialPositions(
  map: Record<string, InitialPositions>,
  keywordText: string
): InitialPositions | undefined {
  for (const key of buildKeywordKeyVariants(keywordText)) {
    const hit = map[key];
    if (hit) return hit;
  }
  return undefined;
}

// Main component
export const BRONKeywordsTab = memo(({
  keywords,
  serpReports = [],
  serpHistory = [],
  linksIn = [],
  linksOut = [],
  selectedDomain,
  isLoading,
  onRefresh,
  onAdd,
  onUpdate,
  onDelete,
  onRestore,
  onFetchSerpDetail,
  onToggleLink,
}: BRONKeywordsTabProps) => {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [inlineEditForms, setInlineEditForms] = useState<Record<string | number, Record<string, string>>>({});
  const [savingIds, setSavingIds] = useState<Set<number | string>>(new Set());
  const [articleEditorId, setArticleEditorId] = useState<number | string | null>(null);
  const [showClusterMap, setShowClusterMap] = useState(false);
  const [analysisKeyword, setAnalysisKeyword] = useState<BronKeyword | null>(null);
  
  // Quick filter state
  const [activeFilter, setActiveFilter] = useState<"all" | "top10" | "top50" | "hasContent" | "noContent" | "improved" | "dropped">("all");
  const [compactMode, setCompactMode] = useState(() => {
    try {
      return localStorage.getItem('bron_compact_mode') === 'true';
    } catch {
      return false;
    }
  });
  
  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Persist compact mode
  useEffect(() => {
    try {
      localStorage.setItem('bron_compact_mode', String(compactMode));
    } catch {}
  }, [compactMode]);
  
  // Historical date selector state
  const [selectedHistoryReportId, setSelectedHistoryReportId] = useState<string | number | null>(null);
  const [historicalSerpReports, setHistoricalSerpReports] = useState<BronSerpReport[]>([]);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
  
  // Initialize metricsLoading as a Set of keyword keys that are ACTUALLY being fetched
  // This allows us to show "loading" only on keywords without cached metrics
  const [keywordMetrics, setKeywordMetrics] = useState<Record<string, KeywordMetrics>>({});
  const [metricsLoadingKeys, setMetricsLoadingKeys] = useState<Set<string>>(new Set());
  // Legacy boolean for backward compatibility - only true if we have ANY keys loading
  const metricsLoading = metricsLoadingKeys.size > 0;
  const [pageSpeedScores, setPageSpeedScores] = useState<Record<string, PageSpeedScore>>(() => loadCachedPageSpeedScores());
  const pageSpeedScoresRef = useRef(pageSpeedScores);
  const pageSpeedCacheSaveTimerRef = useRef<number | null>(null);
  const [initialPositions, setInitialPositions] = useState<Record<string, InitialPositions>>({});
  const [baselineReportId, setBaselineReportId] = useState<string | null>(null);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  
  // Track if we've received data for the current domain to avoid "no keywords" flash
  // Use a ref to persist the last valid cluster count during domain transitions
  const prevDomainRef = useRef<string | undefined>(selectedDomain);
  const lastValidClusterCountRef = useRef<number>(0);
  
  // Synchronously check domain change to prevent render flash
  const isDomainChanging = selectedDomain !== prevDomainRef.current;
  
  // Update last valid count when we have actual data for the CURRENT domain
  useEffect(() => {
    if (keywords.length > 0 && !isDomainChanging) {
      lastValidClusterCountRef.current = keywords.length;
    }
  }, [keywords.length, isDomainChanging]);
  
  // Reset refs when domain changes - do this synchronously in a layout effect
  // to prevent intermediate renders with stale data
  useEffect(() => {
    if (isDomainChanging) {
      lastValidClusterCountRef.current = 0;
      prevDomainRef.current = selectedDomain;
    }
  }, [selectedDomain, isDomainChanging]);
  
  // Derive "has data" - only show skeleton if we truly have no data for current domain
  const hasReceivedData = keywords.length > 0;
  
  const fetchedUrlsRef = useRef<Set<string>>(new Set());

  // Keep latest Set/object state in refs so callbacks can stay stable (prevents
  // stale-closure bugs that can cause a one-frame "glitch" during expand).
  const expandedIdsRef = useRef(expandedIds);
  const inlineEditFormsRef = useRef(inlineEditForms);
  useEffect(() => {
    expandedIdsRef.current = expandedIds;
  }, [expandedIds]);
  useEffect(() => {
    inlineEditFormsRef.current = inlineEditForms;
  }, [inlineEditForms]);

  // Keep latest scores available to async effects without adding it as a dependency (prevents loops).
  useEffect(() => {
    pageSpeedScoresRef.current = pageSpeedScores;
  }, [pageSpeedScores]);

  const buildInitialInlineForm = useCallback((kw: BronKeyword) => {
    return {
      keywordtitle: kw.keywordtitle || kw.keyword || "",
      metatitle: kw.metatitle || "",
      metadescription: kw.metadescription || "",
      // NOTE: decoding can be expensive; keep it here for now to preserve current behavior.
      resfeedtext: decodeHtmlContent(kw.resfeedtext || ""),
      linkouturl: kw.linkouturl || "",
      resaddress: kw.resaddress || "",
      resfb: kw.resfb || "",
    } as unknown as Record<string, string>;
  }, []);

  // Debounce PageSpeed cache writes to avoid main-thread jank (large JSON stringify) that can look like flicker.
  const schedulePageSpeedCacheSave = useCallback((scores: Record<string, PageSpeedScore>) => {
    if (pageSpeedCacheSaveTimerRef.current) {
      window.clearTimeout(pageSpeedCacheSaveTimerRef.current);
    }
    pageSpeedCacheSaveTimerRef.current = window.setTimeout(() => {
      try {
        saveCachedPageSpeedScores(scores);
      } catch {
        // no-op: localStorage can fail in private mode / quota
      }
    }, 900);
  }, []);

  useEffect(() => {
    return () => {
      if (pageSpeedCacheSaveTimerRef.current) {
        window.clearTimeout(pageSpeedCacheSaveTimerRef.current);
      }
    };
  }, []);

  // Use historical SERP reports if a historical date is selected, otherwise use current
  const activeSerpReports = selectedHistoryReportId && historicalSerpReports.length > 0
    ? historicalSerpReports
    : serpReports;

  // Merge keywords with SERP data
  const mergedKeywords = useMemo(() => 
    mergeKeywordsWithSerp(keywords, activeSerpReports), 
    [keywords, activeSerpReports]
  );
  
  // Handler for selecting historical report
  const handleSelectHistoricalReport = useCallback(async (reportId: string | number | null) => {
    setSelectedHistoryReportId(reportId);
    
    if (!reportId) {
      // Clear historical data - revert to current
      setHistoricalSerpReports([]);
      return;
    }
    
    if (!selectedDomain || !onFetchSerpDetail) return;
    
    setIsLoadingHistorical(true);
    try {
      const data = await onFetchSerpDetail(selectedDomain, String(reportId));
      setHistoricalSerpReports(data || []);
    } catch (err) {
      console.error('Failed to fetch historical SERP data:', err);
      toast.error('Failed to load historical rankings');
      setHistoricalSerpReports([]);
    } finally {
      setIsLoadingHistorical(false);
    }
  }, [selectedDomain, onFetchSerpDetail]);
  
  // Reset historical selection when domain changes
  useEffect(() => {
    if (isDomainChanging) {
      setSelectedHistoryReportId(null);
      setHistoricalSerpReports([]);
    }
  }, [isDomainChanging]);

  // Filter keywords - with debounced search and quick filters
  const filteredKeywords = useMemo(() => {
    let filtered = mergedKeywords;
    
    // Apply quick filter
    if (activeFilter !== "all") {
      filtered = filtered.filter(k => {
        const keywordText = getKeywordDisplayText(k);
        const serpData = findSerpForKeyword(keywordText, activeSerpReports);
        const googlePos = getPosition(serpData?.google);
        const hasContent = k.resfeedtext && k.resfeedtext.length > 50;
        const isTrackingOnly = k.status === 'tracking_only' || String(k.id).startsWith('serp_');
        
        // Calculate movement
        const initial = lookupInitialPositions(initialPositions, keywordText);
        const movement = initial?.google && googlePos ? initial.google - googlePos : 0;
        
        switch (activeFilter) {
          case "top10":
            return googlePos !== null && googlePos <= 10;
          case "top50":
            return googlePos !== null && googlePos <= 50;
          case "hasContent":
            return hasContent && !isTrackingOnly;
          case "noContent":
            return !hasContent && !isTrackingOnly;
          case "improved":
            return movement > 0;
          case "dropped":
            return movement < 0;
          default:
            return true;
        }
      });
    }
    
    // Apply search filter (debounced)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(k => 
        getKeywordDisplayText(k).toLowerCase().includes(q) ||
        (k.metadescription || '').toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [mergedKeywords, debouncedSearch, activeFilter, activeSerpReports, initialPositions]);
  
  // Calculate filter counts for badge display
  const filterCounts = useMemo(() => {
    let top10 = 0, top50 = 0, hasContent = 0, noContent = 0, improved = 0, dropped = 0;
    
    for (const k of mergedKeywords) {
      const keywordText = getKeywordDisplayText(k);
      const serpData = findSerpForKeyword(keywordText, activeSerpReports);
      const googlePos = getPosition(serpData?.google);
      const hasContentFlag = k.resfeedtext && k.resfeedtext.length > 50;
      const isTrackingOnly = k.status === 'tracking_only' || String(k.id).startsWith('serp_');
      
      const initial = lookupInitialPositions(initialPositions, keywordText);
      const movement = initial?.google && googlePos ? initial.google - googlePos : 0;
      
      if (googlePos !== null && googlePos <= 10) top10++;
      if (googlePos !== null && googlePos <= 50) top50++;
      if (hasContentFlag && !isTrackingOnly) hasContent++;
      if (!hasContentFlag && !isTrackingOnly) noContent++;
      if (movement > 0) improved++;
      if (movement < 0) dropped++;
    }
    
    return {
      total: mergedKeywords.length,
      top10,
      top50,
      hasContent,
      noContent,
      improved,
      dropped,
    };
  }, [mergedKeywords, activeSerpReports, initialPositions]);

  // ─── Stable Cluster Memoization ───
  // Use a ref to cache clusters and only recompute when domain or keyword IDs actually change.
  // This prevents expensive re-clustering when array references change but content is identical.
  const clusterCacheRef = useRef<{
    domain: string | undefined;
    keywordIds: string;
    clusters: ReturnType<typeof groupKeywords>;
  } | null>(null);

  const groupedKeywords = useMemo(() => {
    // Generate a signature from keyword IDs (fast string comparison)
    const idSignature = filteredKeywords.map(k => k.id).join(',');
    
    // Check if cache is still valid
    const cached = clusterCacheRef.current;
    if (cached && cached.domain === selectedDomain && cached.keywordIds === idSignature) {
      return cached.clusters;
    }
    
    // Recompute clusters
    const clusters = groupKeywords(filteredKeywords, selectedDomain);
    clusterCacheRef.current = { domain: selectedDomain, keywordIds: idSignature, clusters };
    return clusters;
  }, [filteredKeywords, selectedDomain]);

  // Remove “grey” tracking-only rows from the UI (still counted in stats)
  const displayClusters = useMemo(
    () => groupedKeywords.filter((c) => !(c.parent.status === 'tracking_only' || String(c.parent.id).startsWith('serp_'))),
    [groupedKeywords]
  );

  // Stats
  const contentKeywords = mergedKeywords.filter(k => k.status !== 'tracking_only' && !String(k.id).startsWith('serp_'));
  const trackingKeywords = mergedKeywords.filter(k => k.status === 'tracking_only' || String(k.id).startsWith('serp_'));

  // Reset fetched URLs and cluster cache when domain changes
  useEffect(() => {
    if (isDomainChanging) {
      fetchedUrlsRef.current = new Set();
      // Clear cluster cache on domain change to force fresh computation
      clusterCacheRef.current = null;
    }
  }, [isDomainChanging]);

  // Fetch initial positions from SERP history (baseline = oldest report)
  useEffect(() => {
    const fetchInitialPositions = async () => {
      if (!selectedDomain || !onFetchSerpDetail || serpHistory.length === 0) return;
      
      try {
        const sortedHistory = [...serpHistory].sort((a, b) => {
          const dateA = new Date(a.started || a.created_at || 0).getTime();
          const dateB = new Date(b.started || b.created_at || 0).getTime();
          return dateA - dateB;
        });
        
        const oldestReport = sortedHistory[0];
        if (!oldestReport) return;
        
        console.log('[BRON] Fetching baseline positions from oldest report:', oldestReport.started || oldestReport.created_at);
        
        const reportId = String(oldestReport.report_id || oldestReport.id);
        setBaselineReportId(reportId); // Store baseline report ID
        const oldestReportData = await onFetchSerpDetail(selectedDomain, reportId);
        
        if (oldestReportData?.length > 0) {
          const firstPositions: Record<string, InitialPositions> = {};
          for (const item of oldestReportData) {
            if (item.keyword) {
              const positions = {
                google: getPosition(item.google),
                bing: getPosition(item.bing),
                yahoo: getPosition(item.yahoo),
              };

                // Store multiple key variants so latest/current report keywords can always match
                // (colon prefixes, punctuation differences, etc.)
                for (const key of buildKeywordKeyVariants(String(item.keyword))) {
                  firstPositions[key] = positions;
                }
            }
          }
          console.log('[BRON] Loaded baseline positions for', Object.keys(firstPositions).length, 'keywords');
          console.log('[BRON] Sample baseline keywords:', Object.keys(firstPositions).slice(0, 10));
          console.log('[BRON] Baseline report ID:', reportId);
          setInitialPositions(firstPositions);
        }
      } catch (err) {
        console.error('Failed to fetch initial positions:', err);
      }
    };
    
    fetchInitialPositions();
  }, [selectedDomain, serpHistory, onFetchSerpDetail]);

  // Fetch keyword metrics
  // Extract core keyword without location suffixes for national volume lookup
  const extractCoreKeyword = useCallback((fullKeyword: string): string => {
    let core = fullKeyword.toLowerCase().trim();
    
    // Common location prepositions and patterns to split on
    const locationPatterns = [
      / in /i, / near /i, / at /i, / for /i,
      / port /i, / vancouver /i, / burnaby /i, / surrey /i, / richmond /i,
      / coquitlam/i, / langley /i, / abbotsford /i, / delta /i, / maple ridge/i,
      / bc$/i, / british columbia$/i, / canada$/i,
      / ca$/i, / california$/i, / ny$/i, / new york$/i, / tx$/i, / texas$/i,
      / fl$/i, / florida$/i, / il$/i, / illinois$/i, / pa$/i, / ohio$/i,
      / los angeles/i, / san francisco/i, / seattle/i, / portland/i,
      / chicago/i, / houston/i, / dallas/i, / miami/i, / atlanta/i,
      / boston/i, / denver/i, / phoenix/i, / san diego/i,
    ];
    
    for (const pattern of locationPatterns) {
      const match = core.match(pattern);
      if (match && match.index !== undefined) {
        core = core.substring(0, match.index).trim();
      }
    }
    
    // Remove trailing "near me" variations
    core = core.replace(/\s+near\s*me\s*$/i, '').trim();
    
    return core;
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!selectedDomain || keywords.length === 0) return;
      
      // Extract unique core keywords (national terms without location)
      const coreKeywordMap = new Map<string, string>(); // core -> first full keyword
      
      for (const kw of keywords) {
        const fullText = getKeywordDisplayText(kw);
        const coreText = extractCoreKeyword(fullText);
        if (coreText && coreText.length > 2 && !coreText.startsWith('keyword #')) {
          if (!coreKeywordMap.has(coreText)) {
            coreKeywordMap.set(coreText, fullText);
          }
        }
      }
      
      const uniqueCoreKeywords = Array.from(coreKeywordMap.keys()).slice(0, 50);
      
      if (uniqueCoreKeywords.length === 0) return;
      
      const buildEnrichedMetrics = (metricsByCore: Record<string, KeywordMetrics>) => {
        const enriched: Record<string, KeywordMetrics> = {};
        for (const kw of keywords) {
          const full = getKeywordDisplayText(kw);
          const fullKey = full.toLowerCase();
          const core = extractCoreKeyword(full);
          const m = metricsByCore[core];
          if (m) enriched[fullKey] = m;
        }
        return enriched;
      };

      // Serve cached metrics immediately (no API call on cache hit)
      const cachedByCore = loadKeywordMetricsCache(selectedDomain);
      setKeywordMetrics(buildEnrichedMetrics(cachedByCore));

      const missing = uniqueCoreKeywords.filter((k) => !cachedByCore[k]);
      if (missing.length === 0) return;

      // Track which keys are being loaded so we can show per-keyword loading state
      const loadingKeySet = new Set<string>();
      for (const kw of keywords) {
        const full = getKeywordDisplayText(kw);
        const core = extractCoreKeyword(full);
        if (missing.includes(core)) {
          loadingKeySet.add(full.toLowerCase());
        }
      }
      setMetricsLoadingKeys(loadingKeySet);
      
      try {
        const { data, error } = await supabase.functions.invoke("keyword-metrics", {
          body: { keywords: missing },
        });

        if (!error && data?.metrics) {
          const incomingByCore = data.metrics as Record<string, KeywordMetrics>;
          mergeAndSaveKeywordMetricsCache(selectedDomain, incomingByCore);
          const mergedByCore = { ...cachedByCore, ...incomingByCore };
          setKeywordMetrics(buildEnrichedMetrics(mergedByCore));
        }
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
      } finally {
        setMetricsLoadingKeys(new Set());
      }
    };
    
    fetchMetrics();
  }, [keywords, extractCoreKeyword, selectedDomain]);

  // Fetch PageSpeed scores
  useEffect(() => {
    if (mergedKeywords.length === 0 || !selectedDomain) return;
    
    const urlsToFetch: { url: string }[] = [];
    
    // Collect URLs from all keywords including supporting keywords nested in parents
    const collectUrls = (kw: BronKeyword) => {
      if (kw.status === 'tracking_only' || String(kw.id).startsWith('serp_')) return;
      
      let url = kw.linkouturl;
      if (!url) {
        const slug = getKeywordDisplayText(kw).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        url = `https://${selectedDomain}/${slug}`;
      }
      
      if (!url || fetchedUrlsRef.current.has(url)) return;
      
      const cached = pageSpeedScoresRef.current[url];
      if (cached && cached.mobileScore > 0 && !cached.error) {
        fetchedUrlsRef.current.add(url);
        return;
      }
      
      urlsToFetch.push({ url });
    };
    
    for (const kw of mergedKeywords) {
      collectUrls(kw);
      
      // Also collect URLs from supporting_keywords arrays (nested children)
      if (kw.supporting_keywords && Array.isArray(kw.supporting_keywords)) {
        for (const supportingKw of kw.supporting_keywords) {
          if (supportingKw && supportingKw.id) {
            collectUrls(supportingKw as BronKeyword);
          }
        }
      }
    }
    
    if (urlsToFetch.length === 0) return;
    
    const processBatch = async (batch: typeof urlsToFetch) => {
      for (const { url } of batch) {
        fetchedUrlsRef.current.add(url);
      }
      
       startTransition(() => {
         setPageSpeedScores(prev => {
           const next = { ...prev };
           for (const { url } of batch) {
             if (!next[url] || next[url].mobileScore === 0) {
               next[url] = { mobileScore: 0, desktopScore: 0, loading: true };
             } else {
               next[url] = { ...next[url], updating: true };
             }
           }
           return next;
         });
       });

      // Batch updates to avoid re-rendering the whole keyword list once per URL.
      const results = await Promise.all(
        batch.map(async ({ url }) => {
          try {
            const { data, error } = await supabase.functions.invoke('pagespeed-insights', { body: { url } });
            if (!error && data?.metrics) {
              return {
                url,
                ok: true as const,
                mobileScore: data.metrics.mobile?.score || 0,
                desktopScore: data.metrics.desktop?.score || 0,
              };
            }
            return { url, ok: false as const };
          } catch {
            return { url, ok: false as const };
          }
        })
      );

        startTransition(() => {
         setPageSpeedScores(prev => {
           const updated = { ...prev };
           const now = Date.now();

           for (const r of results) {
             if (r.ok) {
               updated[r.url] = {
                 mobileScore: r.mobileScore,
                 desktopScore: r.desktopScore,
                 loading: false,
                 updating: false,
                 error: false,
                 cachedAt: now,
               };
             } else {
               updated[r.url] = { mobileScore: 0, desktopScore: 0, loading: false, updating: false, error: true };
             }
           }

            schedulePageSpeedCacheSave(updated);
           return updated;
         });
       });
    };
    
    const batchSize = 3;
    const firstBatch = urlsToFetch.slice(0, batchSize);
    const remainingBatches: typeof urlsToFetch[] = [];
    for (let i = batchSize; i < urlsToFetch.length; i += batchSize) {
      remainingBatches.push(urlsToFetch.slice(i, i + batchSize));
    }
    
    const timer = setTimeout(async () => {
      await processBatch(firstBatch);
      for (const batch of remainingBatches) {
        await new Promise(r => setTimeout(r, 2000));
        await processBatch(batch);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [mergedKeywords.length, selectedDomain]);

  // Callbacks
  const handleToggleExpand = useCallback((kw: BronKeyword) => {
    const id = kw.id;
    const isCurrentlyExpanded = expandedIdsRef.current.has(id);

    // Batch both state updates together using React's automatic batching.
    // We use flushSync-free approach: update form state first, then expanded state
    // in a single synchronous block so React batches them automatically.
    if (!isCurrentlyExpanded) {
      // Expanding: set form data and expansion in one go
      const hasForm = !!(inlineEditFormsRef.current as any)[id];
      if (!hasForm) {
        const newForm = buildInitialInlineForm(kw);
        setInlineEditForms((p) => ({ ...p, [id]: newForm }));
      }
      setExpandedIds((prev) => new Set(prev).add(id));
    } else {
      // Collapsing: just remove from expanded set
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [buildInitialInlineForm]);

  const handleUpdateForm = useCallback((id: number | string, field: string, value: string) => {
    setInlineEditForms(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  }, []);

  const handleSave = useCallback(async (kw: BronKeyword) => {
    const form = inlineEditForms[kw.id];
    if (!form) return;
    
    setSavingIds(prev => new Set(prev).add(kw.id));
    try {
      const success = await onUpdate(String(kw.id), {
        keywordtitle: form.keywordtitle || undefined,
        metatitle: form.metatitle || undefined,
        metadescription: form.metadescription || undefined,
        resfeedtext: form.resfeedtext || undefined,
        linkouturl: form.linkouturl || undefined,
        resaddress: form.resaddress || undefined,
        resfb: form.resfb || undefined,
      });
      if (success) onRefresh();
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(kw.id);
        return next;
      });
    }
  }, [inlineEditForms, onUpdate, onRefresh]);

  const handleOpenArticleEditor = useCallback((kw: BronKeyword) => {
    const id = kw.id;
    if (!(inlineEditFormsRef.current as any)[id]) {
      setInlineEditForms((prev) => ({
        ...prev,
        [id]: buildInitialInlineForm(kw),
      }));
    }
    setArticleEditorId(String(id));
  }, [buildInitialInlineForm]);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    const success = await onAdd({ keywordtitle: newKeyword.trim(), domain: selectedDomain });
    if (success) {
      setShowAddModal(false);
      setNewKeyword("");
      onRefresh();
    }
  };


  const saveRankingSnapshot = async () => {
    if (!selectedDomain || keywords.length === 0) return;
    
    setSavingSnapshot(true);
    try {
      const snapshotData = keywords.map(kw => {
        const keywordText = getKeywordDisplayText(kw);
        const serpData = findSerpForKeyword(keywordText, serpReports);
        const metrics = keywordMetrics[keywordText.toLowerCase()];
        
        return {
          keyword: keywordText,
          google_position: getPosition(serpData?.google),
          bing_position: getPosition(serpData?.bing),
          yahoo_position: getPosition(serpData?.yahoo),
          search_volume: metrics?.search_volume || null,
          cpc: metrics?.cpc || null,
          competition_level: metrics?.competition_level || null,
        };
      });

      const { data, error } = await supabase.functions.invoke('keyword-history-snapshot', {
        body: { action: 'saveSnapshot', domain: selectedDomain, keywords: snapshotData }
      });

      if (error) throw error;
      if (data?.success) toast.success(`Saved ${data.count} keyword rankings snapshot`);
      else if (data?.message) toast.info(data.message);
    } catch (err) {
      console.error('Failed to save snapshot:', err);
      toast.error('Failed to save ranking snapshot');
    } finally {
      setSavingSnapshot(false);
    }
  };

  // Get keyword for article editor
  const editorKeyword = articleEditorId
    ? mergedKeywords.find((k) => String(k.id) === String(articleEditorId))
    : null;

  return (
    <div style={{ contain: 'layout' }}>
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
        {/* Hide header while loading animation is shown */}
        {!(displayClusters.length === 0 && !hasReceivedData) && (
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="w-5 h-5 text-primary" />
                Keywords & Rankings
                {selectedDomain && (
                  <Badge variant="secondary" className="text-xs ml-2">{selectedDomain}</Badge>
                )}
                {selectedHistoryReportId && (
                  <Badge className="text-xs ml-2 bg-violet-500/20 text-violet-300 border-violet-500/30">
                    Historical View
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>Total: <strong className="text-foreground">{mergedKeywords.length}</strong></span>
                <span>•</span>
                <span>With Content: <strong className="text-emerald-400">{contentKeywords.length}</strong></span>
                <span>•</span>
                <span>Tracking Only: <strong className="text-amber-400">{trackingKeywords.length}</strong></span>
                {selectedHistoryReportId && historicalSerpReports.length > 0 && (
                  <>
                    <span>•</span>
                    <span>Rankings from: <strong className="text-violet-400">{historicalSerpReports.length} keywords</strong></span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Historical Date Selector */}
              {serpHistory.length > 0 && selectedDomain && (
                <BronHistoryDateSelector
                  serpHistory={serpHistory}
                  selectedReportId={selectedHistoryReportId}
                  onSelectReport={handleSelectHistoricalReport}
                  isLoading={isLoadingHistorical}
                  disabled={isLoading}
                />
              )}
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48 h-9 bg-secondary/50"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={isLoading || !selectedDomain}
                className="border-primary/30 hover:bg-primary/10"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={saveRankingSnapshot}
                disabled={savingSnapshot || keywords.length === 0}
                className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
                title="Save current rankings as historical snapshot"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClusterMap(true)}
                disabled={!selectedDomain || displayClusters.length === 0}
                className="border-violet-500/30 hover:bg-violet-500/10 text-violet-400"
                title="View keyword clusters as visual map"
              >
                <GitBranch className="w-4 h-4 mr-1" />
                Cluster Map
              </Button>
              <Button 
                size="sm" 
                onClick={() => setShowAddModal(true)}
                disabled={!selectedDomain}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
        )}
        
        {/* Quick Filters Bar */}
        {selectedDomain && displayClusters.length > 0 && (
          <div className="px-6 pb-3">
            <BronQuickFilters
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              compactMode={compactMode}
              onCompactModeChange={setCompactMode}
              counts={filterCounts}
            />
          </div>
        )}
        
        <CardContent className={`relative ${compactMode ? "px-4 py-2" : ""}`}>
          {/* Loading Historical Data Overlay */}
          {isLoadingHistorical && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
              <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card/90 border border-violet-500/30 shadow-lg">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-3 border-violet-500/20 border-t-violet-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-violet-400 animate-spin" style={{ animationDirection: 'reverse' }} />
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground">Loading Historical Rankings</p>
                <p className="text-xs text-muted-foreground">Fetching report data...</p>
              </div>
            </div>
          )}
          
          {!selectedDomain ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Select a domain to view keywords</p>
            </div>
          ) : displayClusters.length === 0 && !hasReceivedData ? (
            // Show static skeleton rows while loading - no animate-pulse to prevent flickering
            <BronKeywordSkeletonList count={8} />
          ) : displayClusters.length === 0 && hasReceivedData ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No keywords found</p>
            </div>
          ) : displayClusters.length === 0 ? (
            // Fallback static skeleton
            <BronKeywordSkeletonList count={5} />
          ) : (
            <div className="no-theme-transition" data-no-theme-transition style={{ contain: 'layout style' }}>
              {/* Column Headers Row - extracted to shared component */}
              <BronKeywordTableHeader />
              {/* Keyword list with no spacing between cards */}
              <div className="divide-y divide-border/20" style={{ contain: 'layout style' }}>
                {displayClusters.map((cluster) => (
                  <BronClusterCard
                    key={cluster.parentId}
                    cluster={cluster}
                    serpReports={activeSerpReports}
                    keywordMetrics={keywordMetrics}
                    pageSpeedScores={pageSpeedScores}
                    linksIn={linksIn}
                    linksOut={linksOut}
                    selectedDomain={selectedDomain}
                    expandedIds={expandedIds}
                    initialPositions={initialPositions}
                    metricsLoadingKeys={metricsLoadingKeys}
                    inlineEditForms={inlineEditForms}
                    savingIds={savingIds}
                    compactMode={compactMode}
                    isBaselineReport={selectedHistoryReportId ? String(selectedHistoryReportId) === baselineReportId : false}
                    onToggleExpand={handleToggleExpand}
                    onUpdateForm={handleUpdateForm}
                    onSave={handleSave}
                    onOpenArticleEditor={handleOpenArticleEditor}
                    onToggleLink={onToggleLink}
                    onOpenAnalysis={setAnalysisKeyword}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Keyword Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Keyword</DialogTitle>
            <DialogDescription>
              Add a keyword to track for {selectedDomain}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Enter keyword..."
            className="mt-4"
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddKeyword} disabled={!newKeyword.trim()}>Add Keyword</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Article Editor Modal */}
      <Dialog open={!!articleEditorId} onOpenChange={(open) => { if (!open) setArticleEditorId(null); }}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden p-0 [&>button]:hidden">
          <div className="h-[85vh] flex flex-col">
            {/* Header with Keyword Metadata */}
            <div className="border-b border-border/50 bg-background">
              {/* Metadata Bar */}
              {editorKeyword && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 border-b border-border/30">
                  <Badge variant="outline" className="text-xs font-mono bg-muted/50">
                    ID: {editorKeyword.id}
                  </Badge>
                  <Badge 
                    className={`text-xs ${
                      editorKeyword.active === 1 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-muted/50 text-muted-foreground border-border'
                    }`}
                  >
                    {editorKeyword.active === 1 ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {editorKeyword.createdDate 
                      ? new Date(editorKeyword.createdDate).toLocaleDateString('en-CA')
                      : 'No date'}
                  </span>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    className="h-7 bg-cyan-600 hover:bg-cyan-700 text-white"
                    onClick={() => {
                      if (editorKeyword) {
                        handleSave(editorKeyword);
                      }
                    }}
                    disabled={savingIds.has(editorKeyword?.id || '')}
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setArticleEditorId(null)}
                    className="h-7 w-7"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {/* SEO Form Fields */}
              {editorKeyword && inlineEditForms[editorKeyword.id] && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Keyword Title */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Keyword Title</Label>
                      <Input
                        value={inlineEditForms[editorKeyword.id].keywordtitle}
                        onChange={(e) => handleUpdateForm(editorKeyword.id, 'keywordtitle', e.target.value)}
                        placeholder="Primary keyword..."
                        className="h-9 bg-muted/50 border-border/50"
                      />
                    </div>
                    
                    {/* Target URL */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Target URL</Label>
                      <Input
                        value={inlineEditForms[editorKeyword.id].linkouturl}
                        onChange={(e) => handleUpdateForm(editorKeyword.id, 'linkouturl', e.target.value)}
                        placeholder="https://example.com/page"
                        className="h-9 bg-muted/50 border-border/50"
                      />
                    </div>
                    
                    {/* Meta Title */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Meta Title</Label>
                        <span className="text-[10px] text-cyan-400">
                          {(inlineEditForms[editorKeyword.id].metatitle || '').length}/60
                        </span>
                      </div>
                      <Input
                        value={inlineEditForms[editorKeyword.id].metatitle}
                        onChange={(e) => handleUpdateForm(editorKeyword.id, 'metatitle', e.target.value)}
                        placeholder="SEO-optimized title..."
                        className="h-9 bg-muted/50 border-border/50"
                      />
                    </div>
                    
                    {/* Address */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Address</Label>
                      <Input
                        value={inlineEditForms[editorKeyword.id].resaddress}
                        onChange={(e) => handleUpdateForm(editorKeyword.id, 'resaddress', e.target.value)}
                        placeholder="Physical address..."
                        className="h-9 bg-muted/50 border-border/50"
                      />
                    </div>
                    
                    {/* Meta Description - Full Width */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Meta Description</Label>
                        <span className="text-[10px] text-cyan-400">
                          {(inlineEditForms[editorKeyword.id].metadescription || '').length}/160
                        </span>
                      </div>
                      <Textarea
                        value={inlineEditForms[editorKeyword.id].metadescription}
                        onChange={(e) => handleUpdateForm(editorKeyword.id, 'metadescription', e.target.value)}
                        placeholder="Compelling meta description..."
                        className="min-h-[80px] bg-muted/50 border-border/50 text-sm resize-none"
                      />
                    </div>
                    
                    {/* Facebook URL */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Facebook URL</Label>
                      <Input
                        value={inlineEditForms[editorKeyword.id].resfb}
                        onChange={(e) => handleUpdateForm(editorKeyword.id, 'resfb', e.target.value)}
                        placeholder="https://facebook.com/..."
                        className="h-9 bg-muted/50 border-border/50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Editor - Lazy loaded */}
            <div className="flex-1 min-h-[300px] overflow-y-auto p-4">
              {editorKeyword && inlineEditForms[editorKeyword.id] && (
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full min-h-[300px]">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading editor...</span>
                  </div>
                }>
                  <WysiwygEditor
                    html={inlineEditForms[editorKeyword.id].resfeedtext || ''}
                    onChange={(content) => handleUpdateForm(editorKeyword.id, 'resfeedtext', content)}
                  />
                </Suspense>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-border/50 bg-background flex justify-end gap-2">
              <Button variant="outline" onClick={() => setArticleEditorId(null)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (editorKeyword) {
                    handleSave(editorKeyword);
                    setArticleEditorId(null);
                  }
                }}
                disabled={!editorKeyword || savingIds.has(editorKeyword?.id || '')}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Article
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Cluster Visualization Modal */}
      <BronClusterVisualization
        isOpen={showClusterMap}
        onClose={() => setShowClusterMap(false)}
        clusters={displayClusters}
        serpReports={activeSerpReports}
        keywordMetrics={keywordMetrics}
        pageSpeedScores={pageSpeedScores}
        linksIn={linksIn}
        linksOut={linksOut}
        selectedDomain={selectedDomain}
        initialPositions={initialPositions}
      />
      
      {/* Keyword Analysis Dialog */}
      {analysisKeyword && (
        <BronKeywordAnalysisDialog
          isOpen={!!analysisKeyword}
          onClose={() => setAnalysisKeyword(null)}
          keyword={analysisKeyword}
          relatedKeywords={displayClusters.find(c => c.parent.id === analysisKeyword.id)?.children || []}
          serpHistory={serpHistory}
          selectedDomain={selectedDomain}
          onFetchSerpDetail={onFetchSerpDetail}
        />
      )}
    </div>
  );
});

BRONKeywordsTab.displayName = 'BRONKeywordsTab';
