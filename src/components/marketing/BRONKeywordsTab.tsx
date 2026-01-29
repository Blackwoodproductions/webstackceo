import { useState, useMemo, useEffect, useRef, useCallback, memo, startTransition, lazy, Suspense } from "react";
import { Key, RefreshCw, Plus, Search, Save, X, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

import {
  loadKeywordClustersIndexCache,
  saveKeywordClustersIndexCache,
  type KeywordClusterIndex,
} from "@/lib/bronKeywordClustersCache";

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
} from "./bron";

interface BRONKeywordsTabProps {
  keywords: BronKeyword[];
  serpReports?: BronSerpReport[];
  serpHistory?: BronSerpListItem[];
  linksIn?: BronLink[];
  linksOut?: BronLink[];
  selectedDomain?: string;
  isLoading: boolean;
  /** True when hydrating keywords - prevents "No keywords" flash during domain switch */
  isKeywordHydrating?: boolean;
  onRefresh: () => void;
  onAdd: (data: Record<string, unknown>) => Promise<boolean>;
  onUpdate: (keywordId: string, data: Record<string, unknown>) => Promise<boolean>;
  onDelete: (keywordId: string) => Promise<boolean>;
  onRestore: (keywordId: string) => Promise<boolean>;
  onFetchSerpDetail?: (domain: string, reportId: string) => Promise<BronSerpReport[]>;
}

// Initial positions type
interface InitialPositions {
  google: number | null;
  bing: number | null;
  yahoo: number | null;
}

// Memoized keyword list item wrapper
// IMPORTANT: Expansion should only re-render the affected cluster, not the entire list.
const KeywordListItem = memo(({
  cluster,
  serpReports,
  keywordMetrics,
  pageSpeedScores,
  linksIn,
  linksOut,
  selectedDomain,
  expandedIds,
  initialPositions,
  metricsLoading,
  inlineEditForms,
  savingIds,
  onToggleExpand,
  onUpdateForm,
  onSave,
  onOpenArticleEditor,
}: {
  cluster: { parent: BronKeyword; children: BronKeyword[]; parentId: number | string };
  serpReports: BronSerpReport[];
  keywordMetrics: Record<string, KeywordMetrics>;
  pageSpeedScores: Record<string, PageSpeedScore>;
  linksIn: BronLink[];
  linksOut: BronLink[];
  selectedDomain?: string;
  expandedIds: Set<number | string>;
  initialPositions: Record<string, InitialPositions>;
  metricsLoading: boolean;
  inlineEditForms: Record<string | number, Record<string, string>>;
  savingIds: Set<number | string>;
  onToggleExpand: (kw: BronKeyword) => void;
  onUpdateForm: (id: number | string, field: string, value: string) => void;
  onSave: (kw: BronKeyword) => void;
  onOpenArticleEditor: (kw: BronKeyword) => void;
}) => {
  const renderKeyword = (kw: BronKeyword, isNested = false, isMainKeyword = false, clusterChildCount?: number) => {
    const keywordText = getKeywordDisplayText(kw);
    const isTrackingOnly = kw.status === 'tracking_only' || String(kw.id).startsWith('serp_');
    const serpData = findSerpForKeyword(keywordText, serpReports);
    const isExpanded = expandedIds.has(kw.id);
    
    // Filter links for this specific keyword
    const { keywordLinksIn, keywordLinksOut } = filterLinksForKeyword(kw, linksIn, linksOut, selectedDomain);
    
    // Calculate movements
    const initial = initialPositions[keywordText.toLowerCase()] || { google: null, bing: null, yahoo: null };
    const currentGoogle = getPosition(serpData?.google);
    const currentBing = getPosition(serpData?.bing);
    const currentYahoo = getPosition(serpData?.yahoo);
    
    const googleMovement = initial.google && currentGoogle ? initial.google - currentGoogle : 0;
    const bingMovement = initial.bing && currentBing ? initial.bing - currentBing : 0;
    const yahooMovement = initial.yahoo && currentYahoo ? initial.yahoo - currentYahoo : 0;
    
    // Get PageSpeed URL
    let keywordUrl = kw.linkouturl;
    if (!keywordUrl && selectedDomain && !isTrackingOnly) {
      const slug = keywordText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      keywordUrl = `https://${selectedDomain}/${slug}`;
    }
    const pageSpeed = keywordUrl ? pageSpeedScores[keywordUrl] : undefined;
    
    return (
      <div 
        key={kw.id} 
        className="no-theme-transition"
        style={{ contain: 'layout style' }}
        data-no-theme-transition
      >
        <BronKeywordCard
          keyword={kw}
          serpData={serpData}
          keywordMetrics={keywordMetrics[keywordText.toLowerCase()]}
          pageSpeedScore={pageSpeed}
          linksInCount={keywordLinksIn.length}
          linksOutCount={keywordLinksOut.length}
          isExpanded={isExpanded}
          isNested={isNested}
          isTrackingOnly={isTrackingOnly}
          isMainKeyword={isMainKeyword}
          clusterChildCount={clusterChildCount}
          selectedDomain={selectedDomain}
          googleMovement={googleMovement}
          bingMovement={bingMovement}
          yahooMovement={yahooMovement}
          metricsLoading={metricsLoading}
          onToggleExpand={() => onToggleExpand(kw)}
        />
        
        {/* Expanded content - only render when expanded AND form is ready */}
        {isExpanded && inlineEditForms[kw.id] && (
          <div style={{ contain: 'layout style paint' }}>
            <BronKeywordExpanded
              keyword={kw}
              isTrackingOnly={isTrackingOnly}
              selectedDomain={selectedDomain}
              linksIn={keywordLinksIn}
              linksOut={keywordLinksOut}
              formData={inlineEditForms[kw.id] as any}
              isSaving={savingIds.has(kw.id)}
              onUpdateForm={(field, value) => onUpdateForm(kw.id, field, value)}
              onSave={() => onSave(kw)}
              onOpenArticleEditor={() => onOpenArticleEditor(kw)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ contain: 'layout style paint' }}>
      {/* Parent keyword: isNested=false, isMainKeyword=true if has children */}
      {renderKeyword(cluster.parent, false, cluster.children.length > 0, cluster.children.length)}
      {cluster.children.length > 0 && (
        <div style={{ contain: 'layout style' }}>
          {/* Child keywords: isNested=true, isMainKeyword=false */}
          {cluster.children.map(child => renderKeyword(child, true, false))}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  // Custom compare: ignore Set/object identity changes and only re-render when
  // the expansion/saving/form state for IDs in THIS cluster changes.
  // Cluster identity: compare by parent + child IDs, not object reference
  if (prev.cluster.parentId !== next.cluster.parentId) return false;
  if (prev.cluster.parent.id !== next.cluster.parent.id) return false;
  if (prev.cluster.children.length !== next.cluster.children.length) return false;
  for (let i = 0; i < prev.cluster.children.length; i++) {
    if (prev.cluster.children[i].id !== next.cluster.children[i].id) return false;
  }
  if (prev.selectedDomain !== next.selectedDomain) return false;
  if (prev.metricsLoading !== next.metricsLoading) return false;

  // Data references: if these change, re-render (they affect counts/metrics/UI)
  if (prev.serpReports !== next.serpReports) return false;
  if (prev.linksIn !== next.linksIn) return false;
  if (prev.linksOut !== next.linksOut) return false;
  if (prev.initialPositions !== next.initialPositions) return false;

  const ids: Array<string | number> = [
    prev.cluster.parent.id,
    ...prev.cluster.children.map((c) => c.id),
  ];

  // Only re-render a cluster when metrics/pagespeed for keywords IN THIS CLUSTER change.
  // This prevents full-list repaint “glitching” as background fetches update unrelated rows.
  const getUrlForKeyword = (kw: BronKeyword, domain?: string) => {
    const isTrackingOnly = kw.status === 'tracking_only' || String(kw.id).startsWith('serp_');
    if (kw.linkouturl) return kw.linkouturl;
    if (!domain || isTrackingOnly) return null;
    const text = getKeywordDisplayText(kw);
    const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `https://${domain}/${slug}`;
  };

  const compareMetricsForKw = (kw: BronKeyword) => {
    const key = getKeywordDisplayText(kw).toLowerCase();
    const a = prev.keywordMetrics[key];
    const b = next.keywordMetrics[key];
    return (
      (a?.cpc ?? null) === (b?.cpc ?? null) &&
      (a?.competition ?? null) === (b?.competition ?? null) &&
      (a?.competition_level ?? null) === (b?.competition_level ?? null) &&
      (a?.search_volume ?? null) === (b?.search_volume ?? null)
    );
  };

  const comparePageSpeedForKw = (kw: BronKeyword) => {
    const url = getUrlForKeyword(kw, prev.selectedDomain);
    const url2 = getUrlForKeyword(kw, next.selectedDomain);
    // If URL changes, we must re-render (different score source)
    if (url !== url2) return false;
    if (!url) return true;
    const a = prev.pageSpeedScores[url];
    const b = next.pageSpeedScores[url];
    return (
      (a?.mobileScore ?? 0) === (b?.mobileScore ?? 0) &&
      (a?.desktopScore ?? 0) === (b?.desktopScore ?? 0) &&
      (a?.loading ?? false) === (b?.loading ?? false) &&
      (a?.updating ?? false) === (b?.updating ?? false) &&
      (a?.error ?? false) === (b?.error ?? false)
    );
  };

  // Compare per-keyword subset values
  const kws: BronKeyword[] = [prev.cluster.parent, ...prev.cluster.children];
  for (const kw of kws) {
    if (!compareMetricsForKw(kw)) return false;
    if (!comparePageSpeedForKw(kw)) return false;
  }

  for (const id of ids) {
    if (prev.expandedIds.has(id) !== next.expandedIds.has(id)) return false;
    if ((prev.inlineEditForms as any)[id] !== (next.inlineEditForms as any)[id]) return false;
    if (prev.savingIds.has(id) !== next.savingIds.has(id)) return false;
  }

  return true;
});
KeywordListItem.displayName = 'KeywordListItem';

// Main component
export const BRONKeywordsTab = memo(({
  keywords,
  serpReports = [],
  serpHistory = [],
  linksIn = [],
  linksOut = [],
  selectedDomain,
  isLoading,
  isKeywordHydrating = false,
  onRefresh,
  onAdd,
  onUpdate,
  onDelete,
  onRestore,
  onFetchSerpDetail,
}: BRONKeywordsTabProps) => {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [inlineEditForms, setInlineEditForms] = useState<Record<string | number, Record<string, string>>>({});
  const [savingIds, setSavingIds] = useState<Set<number | string>>(new Set());
  const [articleEditorId, setArticleEditorId] = useState<number | string | null>(null);
  const [keywordMetrics, setKeywordMetrics] = useState<Record<string, KeywordMetrics>>({});
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [pageSpeedScores, setPageSpeedScores] = useState<Record<string, PageSpeedScore>>(() => loadCachedPageSpeedScores());
  const pageSpeedScoresRef = useRef(pageSpeedScores);
  const pageSpeedCacheSaveTimerRef = useRef<number | null>(null);
  const [initialPositions, setInitialPositions] = useState<Record<string, InitialPositions>>({});
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  
  // Track if we've received data for the current domain to avoid "no keywords" flash
  // Use a ref to persist the last valid cluster count during domain transitions
  const prevDomainRef = useRef<string | undefined>(selectedDomain);
  const lastValidClusterCountRef = useRef<number>(0);
  
  // Update last valid count when we have actual data
  useEffect(() => {
    if (keywords.length > 0) {
      lastValidClusterCountRef.current = keywords.length;
    }
  }, [keywords.length]);
  
  // Derive "has data" - consider we have data if either:
  // 1. Current keywords array has items, OR
  // 2. We're still hydrating (prevents "No keywords" flash), OR
  // 3. We had data before and are just transitioning (prevents flash)
  const hasReceivedData = keywords.length > 0 || isKeywordHydrating || (prevDomainRef.current === selectedDomain && lastValidClusterCountRef.current > 0);
  
  // Reset the last valid count when domain actually changes
  useEffect(() => {
    if (selectedDomain !== prevDomainRef.current) {
      // Only reset if we're switching to a truly different domain
      lastValidClusterCountRef.current = 0;
    }
  }, [selectedDomain]);
  
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

  // Merge keywords with SERP data
  const mergedKeywords = useMemo(() => 
    mergeKeywordsWithSerp(keywords, serpReports), 
    [keywords, serpReports]
  );

  // Filter keywords
  const filteredKeywords = useMemo(() => {
    if (!searchQuery.trim()) return mergedKeywords;
    const q = searchQuery.toLowerCase();
    return mergedKeywords.filter(k => 
      getKeywordDisplayText(k).toLowerCase().includes(q) ||
      (k.metadescription || '').toLowerCase().includes(q)
    );
  }, [mergedKeywords, searchQuery]);

  // ─── Stable Cluster Memoization ───
  // Use a ref to cache clusters and only recompute when domain or keyword IDs actually change.
  // This prevents expensive re-clustering when array references change but content is identical.
  const clusterCacheRef = useRef<{
    domain: string | undefined;
    keywordIds: string;
    clusters: ReturnType<typeof groupKeywords>;
  } | null>(null);

  // Avoid building massive strings like `ids.join(',')` for large domains.
  // A compact hash signature is enough to detect changes.
  const computeIdsSignature = useCallback((items: BronKeyword[]) => {
    // FNV-1a 32-bit
    let hash = 2166136261;
    for (const it of items) {
      const s = String(it.id);
      for (let i = 0; i < s.length; i++) {
        hash ^= s.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      // delimiter
      hash ^= 44;
      hash = Math.imul(hash, 16777619);
    }
    return `${items.length}:${(hash >>> 0).toString(16)}`;
  }, []);

  const groupedKeywords = useMemo(() => {
    // Generate a stable signature from keyword IDs (no huge allocations)
    const idSignature = computeIdsSignature(filteredKeywords);
    
    // Check if cache is still valid
    const cached = clusterCacheRef.current;
    if (cached && cached.domain === selectedDomain && cached.keywordIds === idSignature) {
      return cached.clusters;
    }

    // Persistent cache: avoid the expensive groupKeywords() pass on hard refresh
    // by reusing the previously computed cluster structure (IDs only).
    if (selectedDomain && idSignature) {
      const cachedIndex = loadKeywordClustersIndexCache(selectedDomain, idSignature);
      if (cachedIndex && cachedIndex.length > 0) {
        const byId = new Map<string | number, BronKeyword>();
        for (const kw of filteredKeywords) byId.set(kw.id, kw);

        const reconstructed = cachedIndex
          .map((c) => {
            const parent = byId.get(c.parentId);
            if (!parent) return null;
            const children = c.childIds
              .map((id) => byId.get(id))
              .filter(Boolean) as BronKeyword[];
            return { parent, children, parentId: c.parentId };
          })
          .filter(Boolean) as ReturnType<typeof groupKeywords>;

        clusterCacheRef.current = { domain: selectedDomain, keywordIds: idSignature, clusters: reconstructed };
        return reconstructed;
      }
    }

    // Backwards-compatibility path: if signature changed between builds,
    // reuse any cached clusters for this domain (best-effort) to avoid a full re-cluster.
    if (selectedDomain) {
      const looseIndex = loadKeywordClustersIndexCache(selectedDomain);
      if (looseIndex && looseIndex.length > 0) {
        const byId = new Map<string | number, BronKeyword>();
        for (const kw of filteredKeywords) byId.set(kw.id, kw);

        const reconstructed = looseIndex
          .map((c) => {
            const parent = byId.get(c.parentId);
            if (!parent) return null;
            const children = c.childIds
              .map((id) => byId.get(id))
              .filter(Boolean) as BronKeyword[];
            return { parent, children, parentId: c.parentId };
          })
          .filter(Boolean) as ReturnType<typeof groupKeywords>;

        if (reconstructed.length > 0) {
          clusterCacheRef.current = { domain: selectedDomain, keywordIds: idSignature, clusters: reconstructed };
          // Persist updated signature immediately.
          const index: KeywordClusterIndex = reconstructed.map((c) => ({
            parentId: c.parentId,
            childIds: c.children.map((ch) => ch.id),
          }));
          saveKeywordClustersIndexCache(selectedDomain, idSignature, index);
          return reconstructed;
        }
      }
    }
    
    // Recompute clusters
    const clusters = groupKeywords(filteredKeywords, selectedDomain);
    clusterCacheRef.current = { domain: selectedDomain, keywordIds: idSignature, clusters };

    // Save a minimal cluster index for next hard refresh (IDs only, not full keyword objects)
    if (selectedDomain && idSignature) {
      const index: KeywordClusterIndex = clusters.map((c) => ({
        parentId: c.parentId,
        childIds: c.children.map((ch) => ch.id),
      }));
      saveKeywordClustersIndexCache(selectedDomain, idSignature, index);
    }
    return clusters;
  }, [filteredKeywords, selectedDomain, computeIdsSignature]);

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
    if (selectedDomain !== prevDomainRef.current) {
      fetchedUrlsRef.current = new Set();
      // Clear cluster cache on domain change to force fresh computation
      clusterCacheRef.current = null;
      prevDomainRef.current = selectedDomain;
    }
  }, [selectedDomain]);

  // Fetch initial positions from SERP history
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
        
        const reportId = String(oldestReport.report_id || oldestReport.id);
        const oldestReportData = await onFetchSerpDetail(selectedDomain, reportId);
        
        if (oldestReportData?.length > 0) {
          const firstPositions: Record<string, InitialPositions> = {};
          for (const item of oldestReportData) {
            if (item.keyword) {
              firstPositions[item.keyword.toLowerCase()] = {
                google: getPosition(item.google),
                bing: getPosition(item.bing),
                yahoo: getPosition(item.yahoo),
              };
            }
          }
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

      setMetricsLoading(true);
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
        setMetricsLoading(false);
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
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="w-5 h-5 text-primary" />
              Keywords & Rankings
              {selectedDomain && (
                <Badge variant="secondary" className="text-xs ml-2">{selectedDomain}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>Total: <strong className="text-foreground">{mergedKeywords.length}</strong></span>
              <span>•</span>
              <span>With Content: <strong className="text-emerald-400">{contentKeywords.length}</strong></span>
              <span>•</span>
              <span>Tracking Only: <strong className="text-amber-400">{trackingKeywords.length}</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        
        <CardContent>
          {!selectedDomain ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Select a domain to view keywords</p>
            </div>
          ) : mergedKeywords.length === 0 && !hasReceivedData ? (
            // Subtle loading indicator instead of heavy skeletons - feels faster
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <RefreshCw className="w-5 h-5 mr-2 animate-spin opacity-50" />
              <span className="text-sm">Loading keywords...</span>
            </div>
          ) : displayClusters.length === 0 && hasReceivedData ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No keywords found</p>
            </div>
          ) : displayClusters.length === 0 ? (
            // Fallback loading
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <RefreshCw className="w-5 h-5 mr-2 animate-spin opacity-50" />
              <span className="text-sm">Loading keywords...</span>
            </div>
          ) : (
            <div className="no-theme-transition" data-no-theme-transition style={{ contain: 'layout style' }}>
              {/* Column Headers Row - must match BronKeywordCard column widths exactly */}
              <div className="flex items-center w-full justify-between px-4 py-2 mb-2 rounded-lg bg-card/80 border border-border/50" style={{ minWidth: '1050px' }}>
                {/* Speed - matches w-[70px] in card */}
                <div className="w-[70px] flex-shrink-0 flex justify-center">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Speed</span>
                </div>
                {/* Keyword - matches w-[380px] in card */}
                <div className="w-[380px] flex-shrink-0 pr-4">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Keyword</span>
                </div>
                {/* Intent - matches w-[140px] in card */}
                <div className="w-[140px] flex-shrink-0 flex justify-center">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Intent</span>
                </div>
                {/* Rankings: Google, Bing, Yahoo - matches w-[220px] in card with w-[70px] each */}
                <div className="w-[220px] flex-shrink-0 flex items-center justify-center gap-1">
                  <div className="w-[70px] flex justify-center">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Google</span>
                  </div>
                  <div className="w-[70px] flex justify-center">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Bing</span>
                  </div>
                  <div className="w-[70px] flex justify-center">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Yahoo</span>
                  </div>
                </div>
                {/* Metrics - matches w-[140px] in card */}
                <div className="w-[140px] flex-shrink-0 flex justify-center">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Metrics</span>
                </div>
                {/* Links - matches w-[80px] in card */}
                <div className="w-[80px] flex-shrink-0 flex justify-center">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Links</span>
                </div>
                {/* Expand - matches w-[40px] in card */}
                <div className="w-[40px] flex-shrink-0" />
              </div>
              {/* Keyword list with containment for scroll performance */}
              <div style={{ contain: 'layout style', contentVisibility: 'auto' }}>
                {displayClusters.map((cluster) => (
                  <KeywordListItem
                    key={cluster.parentId}
                    cluster={cluster}
                    serpReports={serpReports}
                    keywordMetrics={keywordMetrics}
                    pageSpeedScores={pageSpeedScores}
                    linksIn={linksIn}
                    linksOut={linksOut}
                    selectedDomain={selectedDomain}
                    expandedIds={expandedIds}
                    initialPositions={initialPositions}
                    metricsLoading={metricsLoading}
                    inlineEditForms={inlineEditForms}
                    savingIds={savingIds}
                    onToggleExpand={handleToggleExpand}
                    onUpdateForm={handleUpdateForm}
                    onSave={handleSave}
                    onOpenArticleEditor={handleOpenArticleEditor}
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
    </div>
  );
});

BRONKeywordsTab.displayName = 'BRONKeywordsTab';
