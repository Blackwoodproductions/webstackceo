import { useState, useMemo, useEffect, useRef, useCallback, memo } from "react";
import { Key, RefreshCw, Plus, Search, Save, X, ChevronUp } from "lucide-react";
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
import WysiwygEditor from "@/components/marketing/WysiwygEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

// Initial positions type
interface InitialPositions {
  google: number | null;
  bing: number | null;
  yahoo: number | null;
}

// Memoized keyword list item wrapper
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
  const renderKeyword = (kw: BronKeyword, isNested = false, clusterChildCount?: number) => {
    const keywordText = getKeywordDisplayText(kw);
    const isTrackingOnly = kw.status === 'tracking_only' || String(kw.id).startsWith('serp_');
    const serpData = findSerpForKeyword(keywordText, serpReports);
    const isExpanded = expandedIds.has(kw.id);
    
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
      <div key={kw.id} style={{ contain: 'layout style paint' }}>
        <BronKeywordCard
          keyword={kw}
          serpData={serpData}
          keywordMetrics={keywordMetrics[keywordText.toLowerCase()]}
          pageSpeedScore={pageSpeed}
          linksInCount={linksIn.length}
          linksOutCount={linksOut.length}
          isExpanded={isExpanded}
          isNested={isNested}
          isTrackingOnly={isTrackingOnly}
          clusterChildCount={clusterChildCount}
          selectedDomain={selectedDomain}
          googleMovement={googleMovement}
          bingMovement={bingMovement}
          yahooMovement={yahooMovement}
          metricsLoading={metricsLoading}
          onToggleExpand={() => onToggleExpand(kw)}
        />
        
        {/* Expanded content */}
        {isExpanded && inlineEditForms[kw.id] && (
          <BronKeywordExpanded
            keyword={kw}
            isTrackingOnly={isTrackingOnly}
            selectedDomain={selectedDomain}
            linksIn={linksIn}
            linksOut={linksOut}
            formData={inlineEditForms[kw.id] as any}
            isSaving={savingIds.has(kw.id)}
            onUpdateForm={(field, value) => onUpdateForm(kw.id, field, value)}
            onSave={() => onSave(kw)}
            onOpenArticleEditor={() => onOpenArticleEditor(kw)}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ contain: 'layout style paint' }}>
      {renderKeyword(cluster.parent, false, cluster.children.length)}
      {cluster.children.length > 0 && (
        <div className="border-l-2 border-hover-accent/20 ml-2">
          {cluster.children.map(child => renderKeyword(child, true))}
        </div>
      )}
    </div>
  );
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
  const [initialPositions, setInitialPositions] = useState<Record<string, InitialPositions>>({});
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  
  const fetchedUrlsRef = useRef<Set<string>>(new Set());

  // Merge keywords with SERP data
  const mergedKeywords = useMemo(() => 
    mergeKeywordsWithSerp(keywords, serpReports), 
    [keywords, serpReports]
  );

  // Log SERP data for debugging
  useEffect(() => {
    if (serpReports.length > 0) {
      console.log('[BRON Keywords Tab] SERP Reports received:', {
        count: serpReports.length,
        sample: serpReports.slice(0, 3).map(r => ({
          keyword: r.keyword,
          google: r.google,
          bing: r.bing,
          yahoo: r.yahoo,
        })),
      });
    }
    if (keywords.length > 0) {
      console.log('[BRON Keywords Tab] Keywords received:', {
        count: keywords.length,
        sample: keywords.slice(0, 3).map(k => ({
          id: k.id,
          keywordtitle: k.keywordtitle,
          keyword: k.keyword,
          metatitle: k.metatitle,
          displayText: getKeywordDisplayText(k),
        })),
      });
    }
  }, [serpReports, keywords]);

  // Filter keywords
  const filteredKeywords = useMemo(() => {
    if (!searchQuery.trim()) return mergedKeywords;
    const q = searchQuery.toLowerCase();
    return mergedKeywords.filter(k => 
      getKeywordDisplayText(k).toLowerCase().includes(q) ||
      (k.metadescription || '').toLowerCase().includes(q)
    );
  }, [mergedKeywords, searchQuery]);

  // Group keywords
  const groupedKeywords = useMemo(() => groupKeywords(filteredKeywords), [filteredKeywords]);

  // Stats
  const contentKeywords = mergedKeywords.filter(k => k.status !== 'tracking_only' && !String(k.id).startsWith('serp_'));
  const trackingKeywords = mergedKeywords.filter(k => k.status === 'tracking_only' || String(k.id).startsWith('serp_'));

  // Reset fetched URLs when domain changes
  useEffect(() => {
    fetchedUrlsRef.current = new Set();
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
  useEffect(() => {
    const fetchMetrics = async () => {
      if (keywords.length === 0) return;
      
      const keywordTexts = keywords
        .map(k => getKeywordDisplayText(k).split(' in ')[0].split(' Port ')[0].split(' Vancouver')[0].trim())
        .filter(k => k && !k.startsWith('Keyword #') && k.length > 2)
        .slice(0, 50);
      
      if (keywordTexts.length === 0) return;
      
      setMetricsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('keyword-metrics', {
          body: { keywords: keywordTexts }
        });
        
        if (!error && data?.metrics) {
          const enrichedMetrics = { ...data.metrics };
          for (const kw of keywords) {
            const fullText = getKeywordDisplayText(kw).toLowerCase();
            const coreText = fullText.split(' in ')[0].split(' port ')[0].split(' vancouver')[0].trim();
            if (data.metrics[coreText] && !enrichedMetrics[fullText]) {
              enrichedMetrics[fullText] = data.metrics[coreText];
            }
          }
          setKeywordMetrics(enrichedMetrics);
        }
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setMetricsLoading(false);
      }
    };
    
    fetchMetrics();
  }, [keywords]);

  // Fetch PageSpeed scores
  useEffect(() => {
    if (mergedKeywords.length === 0 || !selectedDomain) return;
    
    const urlsToFetch: { url: string }[] = [];
    
    for (const kw of mergedKeywords) {
      if (kw.status === 'tracking_only' || String(kw.id).startsWith('serp_')) continue;
      
      let url = kw.linkouturl;
      if (!url) {
        const slug = getKeywordDisplayText(kw).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        url = `https://${selectedDomain}/${slug}`;
      }
      
      if (!url || fetchedUrlsRef.current.has(url)) continue;
      
      const cached = pageSpeedScores[url];
      if (cached && cached.mobileScore > 0 && !cached.error) {
        fetchedUrlsRef.current.add(url);
        continue;
      }
      
      urlsToFetch.push({ url });
    }
    
    if (urlsToFetch.length === 0) return;
    
    const processBatch = async (batch: typeof urlsToFetch) => {
      for (const { url } of batch) {
        fetchedUrlsRef.current.add(url);
      }
      
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

        saveCachedPageSpeedScores(updated);
        return updated;
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
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!inlineEditForms[id]) {
          setInlineEditForms(p => ({
            ...p,
            [id]: {
              keywordtitle: kw.keywordtitle || kw.keyword || '',
              metatitle: kw.metatitle || '',
              metadescription: kw.metadescription || '',
              resfeedtext: decodeHtmlContent(kw.resfeedtext || ''),
              linkouturl: kw.linkouturl || '',
              resaddress: kw.resaddress || '',
              resfb: kw.resfb || '',
            }
          }));
        }
      }
      return next;
    });
  }, [inlineEditForms]);

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
    if (!inlineEditForms[kw.id]) {
      setInlineEditForms(prev => ({
        ...prev,
        [kw.id]: {
          keywordtitle: kw.keywordtitle || kw.keyword || '',
          metatitle: kw.metatitle || '',
          metadescription: kw.metadescription || '',
          resfeedtext: decodeHtmlContent(kw.resfeedtext || ''),
          linkouturl: kw.linkouturl || '',
          resaddress: kw.resaddress || '',
          resfb: kw.resfb || '',
        }
      }));
    }
    setArticleEditorId(kw.id);
  }, [inlineEditForms]);

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
  const editorKeyword = articleEditorId ? mergedKeywords.find(k => k.id === articleEditorId) : null;

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
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={saveRankingSnapshot}
              disabled={savingSnapshot || keywords.length === 0}
              className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
              title="Save current rankings as historical snapshot"
            >
              <Save className={`w-4 h-4 ${savingSnapshot ? 'animate-spin' : ''}`} />
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
          ) : isLoading && keywords.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : groupedKeywords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No keywords found</p>
            </div>
          ) : (
            <div>
              {/* Column Headers Row */}
              <div className="flex items-center w-full justify-between px-4 py-2 mb-2 rounded-lg bg-card/80 border border-border/50" style={{ minWidth: '1050px' }}>
                {/* Speed */}
                <div className="w-[70px] flex-shrink-0 flex justify-center">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Speed</span>
                </div>
                {/* Keyword */}
                <div className="w-[320px] flex-shrink-0 pr-4">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Keyword</span>
                </div>
                {/* Intent */}
                <div className="w-[80px] flex-shrink-0 flex justify-center">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Intent</span>
                </div>
                {/* Rankings: Google, Bing, Yahoo */}
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
                {/* Metrics */}
                <div className="w-[140px] flex-shrink-0 flex justify-center">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Metrics</span>
                </div>
                {/* Links */}
                <div className="w-[80px] flex-shrink-0 flex justify-center">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Links</span>
                </div>
                {/* Expand */}
                <div className="w-[40px] flex-shrink-0" />
              </div>
              
              {groupedKeywords.map((cluster) => (
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
      <Dialog open={!!articleEditorId} onOpenChange={() => setArticleEditorId(null)}>
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
            
            {/* Editor */}
            <div className="flex-1 min-h-[300px] overflow-y-auto p-4">
              {editorKeyword && inlineEditForms[editorKeyword.id] && (
                <WysiwygEditor
                  html={inlineEditForms[editorKeyword.id].resfeedtext || ''}
                  onChange={(content) => handleUpdateForm(editorKeyword.id, 'resfeedtext', content)}
                />
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
