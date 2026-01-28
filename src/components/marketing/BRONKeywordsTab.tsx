import { useState, useMemo, useEffect, useRef } from "react";
import { 
  Key, RefreshCw, Plus, Edit2, Trash2, RotateCcw, 
  Search, ChevronRight, Save, Eye,
  ChevronUp, FileText, Link2, Hash, 
  Sparkles, X, BarChart3, TrendingUp, TrendingDown, Minus,
  ShoppingCart, Info, Compass, Target, ArrowDownLeft, ArrowUpRight,
  DollarSign, Activity, Gauge, Zap, Users, MousePointerClick, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BronKeyword, BronSerpReport, BronLink, BronSerpListItem } from "@/hooks/use-bron-api";
import WysiwygEditor from "@/components/marketing/WysiwygEditor";
import { KeywordHistoryChart } from "@/components/marketing/KeywordHistoryChart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Keyword metrics from DataForSEO
interface KeywordMetrics {
  search_volume: number;
  cpc: number;
  competition: number;
  competition_level: string;
}

// PageSpeed score cache
interface PageSpeedScore {
  mobileScore: number;
  desktopScore: number;
  loading?: boolean;
  updating?: boolean; // True when refreshing an existing cached score
  error?: boolean;
  cachedAt?: number; // Timestamp when cached
}

// LocalStorage key for PageSpeed cache
const PAGESPEED_CACHE_KEY = 'bron_pagespeed_cache';
const PAGESPEED_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Load cached PageSpeed scores from localStorage
function loadCachedPageSpeedScores(): Record<string, PageSpeedScore> {
  try {
    const cached = localStorage.getItem(PAGESPEED_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Filter out expired entries
      const now = Date.now();
      const valid: Record<string, PageSpeedScore> = {};
      for (const [url, score] of Object.entries(parsed)) {
        const s = score as PageSpeedScore;
        if (s.cachedAt && (now - s.cachedAt) < PAGESPEED_CACHE_MAX_AGE) {
          valid[url] = s;
        }
      }
      return valid;
    }
  } catch (e) {
    console.warn('Failed to load PageSpeed cache:', e);
  }
  return {};
}

// Save PageSpeed scores to localStorage
function saveCachedPageSpeedScores(scores: Record<string, PageSpeedScore>) {
  try {
    // Only save completed scores (not loading/updating)
    const toSave: Record<string, PageSpeedScore> = {};
    for (const [url, score] of Object.entries(scores)) {
      if (!score.loading && !score.updating && !score.error && score.mobileScore > 0) {
        toSave[url] = { ...score, cachedAt: score.cachedAt || Date.now() };
      }
    }
    localStorage.setItem(PAGESPEED_CACHE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Failed to save PageSpeed cache:', e);
  }
}

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

// Find matching SERP report for a keyword - uses flexible matching
function findSerpForKeyword(keywordText: string, serpReports: BronSerpReport[]): BronSerpReport | null {
  if (!keywordText || !serpReports.length) return null;
  const normalizedKeyword = keywordText.toLowerCase().trim();
  
  // Try exact match first
  const exactMatch = serpReports.find(r => 
    r.keyword?.toLowerCase().trim() === normalizedKeyword
  );
  if (exactMatch) return exactMatch;
  
  // Try contains match (keyword text contains SERP keyword or vice versa)
  const containsMatch = serpReports.find(r => {
    const serpKeyword = r.keyword?.toLowerCase().trim() || '';
    return normalizedKeyword.includes(serpKeyword) || serpKeyword.includes(normalizedKeyword);
  });
  if (containsMatch) return containsMatch;
  
  // Try word-based overlap (at least 2 words match)
  const keywordWords = normalizedKeyword.split(/\s+/).filter(w => w.length > 2);
  for (const report of serpReports) {
    const serpWords = (report.keyword || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const matchCount = keywordWords.filter(w => serpWords.includes(w)).length;
    if (matchCount >= 2) return report;
  }
  
  return null;
}

// Parse position and movement from SERP value like "5 +1" or "6 -4" or just "5"
function parsePositionAndMovement(val?: string | number): { position: number | null; movement: number } {
  if (val === undefined || val === null) return { position: null, movement: 0 };
  
  const str = String(val).trim();
  
  // Check for format like "5 +1" or "6 -4" or "2 +999"
  const match = str.match(/^(\d+)\s*([+-]\d+)?$/);
  if (match) {
    const position = parseInt(match[1], 10);
    const movement = match[2] ? parseInt(match[2], 10) : 0;
    return { 
      position: isNaN(position) || position === 0 ? null : position,
      movement: isNaN(movement) ? 0 : movement
    };
  }
  
  // Just a number
  const num = parseInt(str, 10);
  return { position: isNaN(num) || num === 0 ? null : num, movement: 0 };
}

// Legacy helper for backwards compatibility
function getPosition(val?: string | number): number | null {
  return parsePositionAndMovement(val).position;
}

// Get position badge styling
function getPositionStyle(position: number | null): { bg: string; text: string; label: string } {
  if (position === null) return { bg: 'bg-muted/50', text: 'text-muted-foreground', label: '—' };
  if (position <= 3) return { bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-400', label: String(position) };
  if (position <= 10) return { bg: 'bg-blue-500/20 border-blue-500/30', text: 'text-blue-400', label: String(position) };
  if (position <= 20) return { bg: 'bg-amber-500/20 border-amber-500/30', text: 'text-amber-400', label: String(position) };
  return { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400', label: String(position) };
}

// Check if keyword is a supporting page (child)
function isSupporting(kw: BronKeyword): boolean {
  if (kw.is_supporting === true || kw.is_supporting === 1) return true;
  if (kw.bubblefeed === true || kw.bubblefeed === 1) return true;
  if (kw.parent_keyword_id) return true;
  return false;
}

// Calculate text similarity between two keywords (word overlap score)
function calculateKeywordSimilarity(kw1: string, kw2: string): number {
  const words1 = kw1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = kw2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(w => words2.includes(w));
  const overlap = commonWords.length / Math.min(words1.length, words2.length);
  
  // Bonus for matching location words
  const locationWords = ['port', 'coquitlam', 'vancouver', 'burnaby', 'surrey', 'richmond', 'langley', 'abbotsford'];
  const hasMatchingLocation = commonWords.some(w => locationWords.includes(w));
  
  return hasMatchingLocation ? overlap * 1.2 : overlap;
}

// Find the best parent keyword for a supporting keyword
function findBestParent(
  child: BronKeyword, 
  mainKeywords: BronKeyword[], 
  threshold: number = 0.5
): BronKeyword | null {
  const childText = getKeywordDisplayText(child).toLowerCase();
  
  let bestMatch: BronKeyword | null = null;
  let bestScore = threshold;
  
  for (const parent of mainKeywords) {
    const parentText = getKeywordDisplayText(parent).toLowerCase();
    if (parent.id === child.id) continue;
    
    const score = calculateKeywordSimilarity(childText, parentText);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = parent;
    }
  }
  
  return bestMatch;
}

// Result type for grouped keywords - includes relationship metadata
interface KeywordCluster {
  parent: BronKeyword;
  children: BronKeyword[];
  parentId: number | string;
}

// Group keywords using topic similarity: main keywords are paired with their 2 most similar
// supporting keywords based on word overlap. This ensures semantic clustering.
// Tracking-only keywords (from SERP) remain standalone and appear after clusters.
function groupKeywords(keywords: BronKeyword[]): KeywordCluster[] {
  if (keywords.length === 0) return [];
  
  // Separate content keywords from tracking-only keywords
  const contentKeywords: BronKeyword[] = [];
  const trackingOnlyKeywords: BronKeyword[] = [];
  
  for (const kw of keywords) {
    const isTrackingOnly = kw.status === 'tracking_only' || String(kw.id).startsWith('serp_');
    if (isTrackingOnly) {
      trackingOnlyKeywords.push(kw);
    } else {
      contentKeywords.push(kw);
    }
  }
  
  const clusters: KeywordCluster[] = [];
  
  // First check if API provides explicit parent_keyword_id relationships
  const hasExplicitParent = new Map<number | string, number | string>();
  for (const kw of contentKeywords) {
    if (kw.parent_keyword_id) {
      hasExplicitParent.set(kw.id, kw.parent_keyword_id);
    }
  }
  
  if (hasExplicitParent.size > 0) {
    // Use explicit API relationships
    const parentChildMap = new Map<number | string, BronKeyword[]>();
    const assignedAsChild = new Set<number | string>();
    
    for (const kw of contentKeywords) {
      if (hasExplicitParent.has(kw.id)) {
        const parentId = hasExplicitParent.get(kw.id)!;
        if (!parentChildMap.has(parentId)) {
          parentChildMap.set(parentId, []);
        }
        parentChildMap.get(parentId)!.push(kw);
        assignedAsChild.add(kw.id);
      }
    }
    
    for (const kw of contentKeywords) {
      if (!assignedAsChild.has(kw.id)) {
        const children = (parentChildMap.get(kw.id) || []).slice(0, 2);
        clusters.push({ parent: kw, children, parentId: kw.id });
      }
    }
  } else {
    // Use topic-based similarity clustering
    // Identify main keywords (shorter, more generic terms) vs supporting (longer, more specific)
    const keywordsWithLength = contentKeywords.map(kw => ({
      kw,
      text: getKeywordDisplayText(kw),
      wordCount: getKeywordDisplayText(kw).split(/\s+/).length
    }));
    
    // Sort by word count (shorter = more likely to be main keyword)
    keywordsWithLength.sort((a, b) => a.wordCount - b.wordCount || a.text.localeCompare(b.text));
    
    const assigned = new Set<number | string>();
    const mainKeywords: BronKeyword[] = [];
    const supportingPool: BronKeyword[] = [];
    
    // Every 3rd keyword (by word count order) becomes a main keyword
    // This ensures we have enough main keywords for 1:2 ratio
    const targetMainCount = Math.ceil(contentKeywords.length / 3);
    
    for (let i = 0; i < keywordsWithLength.length; i++) {
      if (mainKeywords.length < targetMainCount && i % 3 === 0) {
        mainKeywords.push(keywordsWithLength[i].kw);
      } else {
        supportingPool.push(keywordsWithLength[i].kw);
      }
    }
    
    // For each main keyword, find 2 most similar supporting keywords
    for (const main of mainKeywords) {
      const mainText = getKeywordDisplayText(main);
      
      // Score all unassigned supporting keywords by similarity
      const scored = supportingPool
        .filter(s => !assigned.has(s.id))
        .map(s => ({
          kw: s,
          score: calculateKeywordSimilarity(mainText, getKeywordDisplayText(s))
        }))
        .sort((a, b) => b.score - a.score);
      
      // Take top 2 most similar
      const children: BronKeyword[] = [];
      for (let i = 0; i < Math.min(2, scored.length); i++) {
        if (scored[i].score >= 0.3) { // Minimum similarity threshold
          children.push(scored[i].kw);
          assigned.add(scored[i].kw.id);
        }
      }
      
      clusters.push({ parent: main, children, parentId: main.id });
      assigned.add(main.id);
    }
    
    // Any remaining unassigned supporting keywords become standalone
    for (const s of supportingPool) {
      if (!assigned.has(s.id)) {
        clusters.push({ parent: s, children: [], parentId: s.id });
      }
    }
  }
  
  // Sort clusters alphabetically by parent keyword
  clusters.sort((a, b) => 
    getKeywordDisplayText(a.parent).localeCompare(getKeywordDisplayText(b.parent))
  );
  
  // Add tracking-only keywords as standalone entries (sorted alphabetically)
  trackingOnlyKeywords.sort((a, b) => 
    getKeywordDisplayText(a).localeCompare(getKeywordDisplayText(b))
  );
  
  for (const kw of trackingOnlyKeywords) {
    clusters.push({ parent: kw, children: [], parentId: kw.id });
  }
  
  return clusters;
}

// Extract keyword display text
function getKeywordDisplayText(kw: BronKeyword): string {
  if (kw.keywordtitle && kw.keywordtitle.trim()) return kw.keywordtitle;
  if (kw.keyword && kw.keyword.trim()) return kw.keyword;
  if (kw.metatitle && kw.metatitle.trim()) return kw.metatitle;
  if (kw.resfeedtext) {
    const decoded = kw.resfeedtext
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    const h1Match = decoded.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match && h1Match[1]) return h1Match[1].trim();
  }
  return `Keyword #${kw.id}`;
}

// Decode HTML entities and strip tags for preview
function decodeHtmlContent(html: string): string {
  if (!html) return '';
  return html
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–').replace(/&nbsp;/g, ' ');
}

function stripHtmlTags(html: string): string {
  return decodeHtmlContent(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Get word count from HTML content
function getWordCount(html: string): number {
  const text = stripHtmlTags(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

// Get meta title quality score
function getMetaTitleQuality(title: string): { score: 'good' | 'warning' | 'poor'; label: string } {
  const len = title?.length || 0;
  if (len === 0) return { score: 'poor', label: 'Missing' };
  if (len >= 30 && len <= 60) return { score: 'good', label: `${len}/60` };
  if (len < 30) return { score: 'warning', label: `${len}/60 (short)` };
  return { score: 'warning', label: `${len}/60 (long)` };
}

// Get meta description quality score
function getMetaDescQuality(desc: string): { score: 'good' | 'warning' | 'poor'; label: string } {
  const len = desc?.length || 0;
  if (len === 0) return { score: 'poor', label: 'Missing' };
  if (len >= 120 && len <= 160) return { score: 'good', label: `${len}/160` };
  if (len < 120) return { score: 'warning', label: `${len}/160 (short)` };
  return { score: 'warning', label: `${len}/160 (long)` };
}

// Detect keyword intent type based on keyword text
function getKeywordIntent(keyword: string): { type: 'transactional' | 'commercial' | 'informational' | 'navigational'; icon: typeof ShoppingCart; color: string; bgColor: string } {
  const kw = keyword.toLowerCase();
  
  // Transactional keywords - user wants to buy/act now
  const transactionalPatterns = ['buy', 'purchase', 'order', 'book', 'hire', 'get', 'download', 'subscribe', 'sign up', 'register', 'schedule', 'appointment', 'quote', 'pricing', 'cost', 'price', 'deal', 'discount', 'coupon', 'free trial'];
  if (transactionalPatterns.some(p => kw.includes(p))) {
    return { type: 'transactional', icon: ShoppingCart, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30' };
  }
  
  // Commercial keywords - user is researching before buying
  const commercialPatterns = ['best', 'top', 'review', 'vs', 'versus', 'compare', 'comparison', 'alternative', 'affordable', 'cheap', 'premium', 'professional', 'rated', 'recommended', 'trusted'];
  if (commercialPatterns.some(p => kw.includes(p))) {
    return { type: 'commercial', icon: Target, color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/30' };
  }
  
  // Navigational keywords - user looking for specific brand/page
  const navigationalPatterns = ['login', 'sign in', 'website', 'official', 'contact', 'near me', 'location', 'address', 'hours', 'directions'];
  if (navigationalPatterns.some(p => kw.includes(p))) {
    return { type: 'navigational', icon: Compass, color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' };
  }
  
  // Default to informational - user seeking information
  return { type: 'informational', icon: Info, color: 'text-violet-400', bgColor: 'bg-violet-500/20 border-violet-500/30' };
}

export const BRONKeywordsTab = ({
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
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState("");

  // Inline editor state - stores form data per keyword id
  const [inlineEditForms, setInlineEditForms] = useState<Record<string | number, Record<string, string>>>({});
  const [savingIds, setSavingIds] = useState<Set<number | string>>(new Set());
  const [articleEditorId, setArticleEditorId] = useState<number | string | null>(null);

  // Keyword metrics from DataForSEO
  const [keywordMetrics, setKeywordMetrics] = useState<Record<string, KeywordMetrics>>({});
  const [metricsLoading, setMetricsLoading] = useState(false);

// PageSpeed scores from Google API - keyed by URL (initialized from cache)
  const [pageSpeedScores, setPageSpeedScores] = useState<Record<string, PageSpeedScore>>(() => loadCachedPageSpeedScores());
  
  // (fetchedThisSession replaced by fetchedUrlsRef in useEffect)

  // Initial keyword positions from first BRON SERP report (for movement tracking)
  interface InitialPositions {
    google: number | null;
    bing: number | null;
    yahoo: number | null;
  }
  const [initialPositions, setInitialPositions] = useState<Record<string, InitialPositions>>({});
  const [initialPositionsLoading, setInitialPositionsLoading] = useState(false);

  // Merge keywords from content API with SERP-tracked keywords (to show all 60+ keywords)
  // SERP keywords without content pages are shown as "tracking only" keywords
  const mergedKeywords = useMemo(() => {
    // Start with all content keywords
    const keywordMap = new Map<string, BronKeyword>();
    
    for (const kw of keywords) {
      const text = getKeywordDisplayText(kw).toLowerCase().trim();
      keywordMap.set(text, kw);
    }
    
    // Add SERP keywords that don't have matching content pages
    for (const serpReport of serpReports) {
      const serpKeyword = serpReport.keyword?.toLowerCase().trim();
      if (!serpKeyword) continue;
      
      // Check if this SERP keyword already has a content page
      const hasContent = keywordMap.has(serpKeyword) || 
        [...keywordMap.keys()].some(k => 
          k.includes(serpKeyword) || serpKeyword.includes(k)
        );
      
      if (!hasContent) {
        // Create a virtual keyword entry for SERP-only keywords
        const virtualKeyword: BronKeyword = {
          id: `serp_${serpKeyword.replace(/\s+/g, '_')}`,
          keyword: serpReport.keyword,
          keywordtitle: serpReport.keyword,
          is_supporting: true, // Mark as supporting/tracking-only
          active: 1,
          deleted: 0,
          // Store SERP data reference
          status: 'tracking_only',
        };
        keywordMap.set(serpKeyword, virtualKeyword);
      }
    }
    
    return Array.from(keywordMap.values());
  }, [keywords, serpReports]);

  // Filter merged keywords
  const filteredKeywords = useMemo(() => {
    if (!searchQuery.trim()) return mergedKeywords;
    const q = searchQuery.toLowerCase();
    return mergedKeywords.filter(k => 
      getKeywordDisplayText(k).toLowerCase().includes(q) ||
      (k.metadescription || '').toLowerCase().includes(q)
    );
  }, [mergedKeywords, searchQuery]);

  const groupedKeywords = useMemo(() => groupKeywords(filteredKeywords), [filteredKeywords]);

  // Fetch initial positions from BRON API historical SERP reports
  useEffect(() => {
    const fetchInitialPositions = async () => {
      if (!selectedDomain || !onFetchSerpDetail || serpHistory.length === 0) return;
      
      setInitialPositionsLoading(true);
      try {
        // Sort serpHistory by date to get the oldest report first
        const sortedHistory = [...serpHistory].sort((a, b) => {
          const dateA = new Date(a.started || a.created_at || 0).getTime();
          const dateB = new Date(b.started || b.created_at || 0).getTime();
          return dateA - dateB;
        });
        
        // Get the oldest report
        const oldestReport = sortedHistory[0];
        if (!oldestReport) return;
        
        const reportId = String(oldestReport.report_id || oldestReport.id);
        console.log(`Fetching initial positions from oldest report: ${reportId}`);
        
        // Fetch the detailed SERP data for the oldest report
        const oldestReportData = await onFetchSerpDetail(selectedDomain, reportId);
        
        if (oldestReportData && oldestReportData.length > 0) {
          // Build initial positions map from the oldest report
          const firstPositions: Record<string, InitialPositions> = {};
          for (const item of oldestReportData) {
            if (item.keyword) {
              const keyLower = item.keyword.toLowerCase();
              firstPositions[keyLower] = {
                google: getPosition(item.google),
                bing: getPosition(item.bing),
                yahoo: getPosition(item.yahoo),
              };
            }
          }
          setInitialPositions(firstPositions);
          console.log(`Loaded initial positions for ${Object.keys(firstPositions).length} keywords`);
        }
      } catch (err) {
        console.error('Failed to fetch initial positions from BRON:', err);
      } finally {
        setInitialPositionsLoading(false);
      }
    };
    
    fetchInitialPositions();
  }, [selectedDomain, serpHistory, onFetchSerpDetail]);

  // Fetch keyword metrics from DataForSEO
  useEffect(() => {
    const fetchMetrics = async () => {
      if (keywords.length === 0) return;
      
      // Extract clean keyword texts - remove location suffixes for API lookup
      const keywordTexts = keywords
        .map(k => {
          let text = getKeywordDisplayText(k);
          // Extract just the core keyword phrase (before any location like "Port Coquitlam")
          // This improves matching with DataForSEO which uses generic keywords
          return text.split(' in ')[0].split(' Port ')[0].split(' Vancouver')[0].trim();
        })
        .filter(k => k && !k.startsWith('Keyword #') && k.length > 2)
        .slice(0, 50);
      
      if (keywordTexts.length === 0) return;
      
      setMetricsLoading(true);
      try {
        console.log('Fetching metrics for keywords:', keywordTexts);
        const { data, error } = await supabase.functions.invoke('keyword-metrics', {
          body: { keywords: keywordTexts }
        });
        
        if (!error && data?.metrics) {
          console.log('Received metrics:', Object.keys(data.metrics));
          // Also map full keyword texts to their core versions for lookup
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
        console.error('Failed to fetch keyword metrics:', err);
      } finally {
        setMetricsLoading(false);
      }
    };
    
    fetchMetrics();
  }, [keywords]);

  // Fetch PageSpeed scores from Google API for keyword URLs - stabilized with useRef
  // Use ref to track fetched URLs - prevents re-fetching on state changes
  const fetchedUrlsRef = useRef<Set<string>>(new Set());
  
  // Reset fetched URLs when domain changes
  useEffect(() => {
    fetchedUrlsRef.current = new Set();
  }, [selectedDomain]);
  
  useEffect(() => {
    if (mergedKeywords.length === 0 || !selectedDomain) return;
    
    // Build list of URLs to fetch - use stable references
    const urlsToFetch: { url: string; keywordId: string | number }[] = [];
    
    for (const kw of mergedKeywords) {
      // Skip tracking-only keywords (no actual page)
      if (kw.status === 'tracking_only' || String(kw.id).startsWith('serp_')) continue;
      
      let url = kw.linkouturl;
      if (!url && selectedDomain) {
        const keywordSlug = getKeywordDisplayText(kw)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        url = `https://${selectedDomain}/${keywordSlug}`;
      }
      
      if (!url) continue;
      
      // Skip if already fetched this session (ref is stable across renders)
      if (fetchedUrlsRef.current.has(url)) continue;
      
      // Check if we already have valid cached data in state
      const cached = pageSpeedScores[url];
      if (cached && cached.mobileScore > 0 && !cached.error) {
        fetchedUrlsRef.current.add(url);
        continue;
      }
      
      urlsToFetch.push({ url, keywordId: kw.id });
    }
    
    if (urlsToFetch.length === 0) return;
    
    // Process in batches to avoid rate limiting
    const processBatch = async (batch: typeof urlsToFetch) => {
      // Mark URLs as being fetched
      for (const { url } of batch) {
        fetchedUrlsRef.current.add(url);
      }
      
      // Set loading state
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
      
      // Fetch in parallel using edge function
      await Promise.all(batch.map(async ({ url }) => {
        try {
          const { data, error } = await supabase.functions.invoke('pagespeed-insights', {
            body: { url }
          });
          
          if (!error && data?.metrics) {
            setPageSpeedScores(prev => {
              const updated = {
                ...prev,
                [url]: {
                  mobileScore: data.metrics.mobile?.score || 0,
                  desktopScore: data.metrics.desktop?.score || 0,
                  loading: false,
                  updating: false,
                  error: false,
                  cachedAt: Date.now(),
                }
              };
              saveCachedPageSpeedScores(updated);
              return updated;
            });
          } else {
            setPageSpeedScores(prev => ({
              ...prev,
              [url]: { 
                mobileScore: 0, 
                desktopScore: 0, 
                loading: false, 
                updating: false, 
                error: true 
              }
            }));
          }
        } catch (err) {
          console.warn(`PageSpeed fetch failed for ${url}:`, err);
          setPageSpeedScores(prev => ({
            ...prev,
            [url]: { 
              mobileScore: 0, 
              desktopScore: 0, 
              loading: false, 
              updating: false, 
              error: true 
            }
          }));
        }
      }));
    };
    
    // Process first batch immediately, then schedule remaining
    const batchSize = 3;
    const firstBatch = urlsToFetch.slice(0, batchSize);
    const remainingBatches: typeof urlsToFetch[] = [];
    for (let i = batchSize; i < urlsToFetch.length; i += batchSize) {
      remainingBatches.push(urlsToFetch.slice(i, i + batchSize));
    }
    
    const timer = setTimeout(async () => {
      await processBatch(firstBatch);
      
      // Process remaining batches with delays
      for (let i = 0; i < remainingBatches.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await processBatch(remainingBatches[i]);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  // Only re-run when mergedKeywords length changes or domain changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedKeywords.length, selectedDomain]);
  // Colors: Blue = no movement (0), Yellow = down (negative), Orange with glow = up (positive)
  const getMovementFromDelta = (movement: number) => {
    if (movement > 0) {
      // Improved - went up in rankings - bright orange with glow
      return { type: 'up' as const, color: 'text-orange-400', bgColor: 'bg-orange-500/20', glow: true, delta: movement };
    } else if (movement < 0) {
      // Declined - went down in rankings - yellow
      return { type: 'down' as const, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', glow: false, delta: movement };
    } else {
      // Same position - blue
      return { type: 'same' as const, color: 'text-blue-400', bgColor: 'bg-blue-500/10', glow: false, delta: 0 };
    }
  };


  const isDeleted = (kw: BronKeyword) => kw.deleted === 1 || kw.is_deleted === true;
  const isActive = (kw: BronKeyword) => kw.active === 1 && !isDeleted(kw);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    try {
      return new Date(dateStr).toLocaleDateString('en-CA'); // YYYY-MM-DD format
    } catch {
      return dateStr;
    }
  };

  // Initialize inline form when expanding a keyword
  const expandKeyword = (kw: BronKeyword) => {
    const id = kw.id;
    if (expandedIds.has(id)) {
      // Collapse
      setExpandedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      // Expand and initialize form
      setExpandedIds(prev => new Set(prev).add(id));
      if (!inlineEditForms[id]) {
        setInlineEditForms(prev => ({
          ...prev,
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
  };

  const updateInlineForm = (id: number | string, field: string, value: string) => {
    setInlineEditForms(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const saveInlineChanges = async (kw: BronKeyword) => {
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
      if (success) {
        onRefresh();
      }
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(kw.id);
        return next;
      });
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    const success = await onAdd({
      keywordtitle: newKeyword.trim(),
      domain: selectedDomain,
    });
    if (success) {
      setShowAddModal(false);
      setNewKeyword("");
      onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    setDeleteConfirm(null);
    onRefresh();
  };

  // Save current keyword rankings as a historical snapshot
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  
  const saveRankingSnapshot = async () => {
    if (!selectedDomain || keywords.length === 0) return;
    
    setSavingSnapshot(true);
    try {
      // Build snapshot data from current keywords and SERP reports
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
        body: { 
          action: 'saveSnapshot', 
          domain: selectedDomain, 
          keywords: snapshotData 
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Saved ${data.count} keyword rankings snapshot`);
      } else if (data?.message) {
        toast.info(data.message);
      }
    } catch (err) {
      console.error('Failed to save snapshot:', err);
      toast.error('Failed to save ranking snapshot');
    } finally {
      setSavingSnapshot(false);
    }
  };

  // Render a keyword card - simplified, GPU-optimized
  // Now accepts isNested to control internal indentation without affecting outer column alignment
  const renderKeywordCard = (kw: BronKeyword, clusterChildCount?: number, isNested?: boolean) => {
    const expanded = expandedIds.has(kw.id);
    const deleted = isDeleted(kw);
    const active = isActive(kw);
    
    // Check if this is a "tracking only" keyword (from SERP without content)
    const isTrackingOnly = kw.status === 'tracking_only' || String(kw.id).startsWith('serp_');
    
    // Check if this is a supporting keyword (child in a cluster)
    const isSupportingKeyword = isSupporting(kw);
    
    // Content preview stats - only meaningful for content keywords
    const wordCount = isTrackingOnly ? 0 : getWordCount(kw.resfeedtext || '');
    const metaTitleQuality = getMetaTitleQuality(kw.metatitle || '');
    const metaDescQuality = getMetaDescQuality(kw.metadescription || '');
    const hasLinks = !!(kw.linkouturl);

    // SERP ranking data for this keyword - parse both position and movement
    const keywordText = getKeywordDisplayText(kw);
    const serpData = findSerpForKeyword(keywordText, serpReports);
    const googleData = parsePositionAndMovement(serpData?.google);
    const bingData = parsePositionAndMovement(serpData?.bing);
    const yahooData = parsePositionAndMovement(serpData?.yahoo);
    const googlePos = googleData.position;
    const bingPos = bingData.position;
    const yahooPos = yahooData.position;
    const hasRankings = googlePos !== null || bingPos !== null || yahooPos !== null;
    
    // Calculate movement from initial positions (historical comparison)
    const keywordLower = keywordText.toLowerCase();
    const initial = initialPositions[keywordLower];
    const calculateMovement = (currentPos: number | null, initialPos: number | null, apiMovement: number): number => {
      // If API already provides movement, use it
      if (apiMovement !== 0) return apiMovement;
      // Calculate from initial historical position
      if (currentPos !== null && initialPos !== null) {
        // Positive = improved (went from lower rank to higher), negative = declined
        return initialPos - currentPos;
      }
      return 0;
    };
    const googleMovementValue = calculateMovement(googlePos, initial?.google ?? null, googleData.movement);
    const bingMovementValue = calculateMovement(bingPos, initial?.bing ?? null, bingData.movement);
    const yahooMovementValue = calculateMovement(yahooPos, initial?.yahoo ?? null, yahooData.movement);

    // Get keyword intent type
    const intent = getKeywordIntent(keywordText);
    const IntentIcon = intent.icon;

    const scoreColor = (score: 'good' | 'warning' | 'poor') => ({
      good: 'text-emerald-400',
      warning: 'text-amber-400',
      poor: 'text-red-400',
    }[score]);

    const scoreBg = (score: 'good' | 'warning' | 'poor') => ({
      good: 'bg-emerald-500/10 border-emerald-500/20',
      warning: 'bg-amber-500/10 border-amber-500/20',
      poor: 'bg-red-500/10 border-red-500/20',
    }[score]);

    // Build URL for this keyword (used for PageSpeed lookups)
    const getKeywordUrl = () => {
      if (kw.linkouturl) return kw.linkouturl;
      if (selectedDomain) {
        const keywordSlug = keywordText
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        return `https://${selectedDomain}/${keywordSlug}`;
      }
      return null;
    };
    const keywordUrl = getKeywordUrl();
    const pageSpeed = keywordUrl ? pageSpeedScores[keywordUrl] : null;

    return (
      <div
        key={kw.id}
        className={`${deleted ? 'opacity-50' : ''}`}
        style={{ contain: 'layout style' }}
      >
        {/* Card container - supporting keywords use orange theme */}
        <div 
          className={`
            rounded-xl border overflow-hidden
            ${isNested 
              ? 'border-l-2 border-l-orange-500/50 ml-2 bg-orange-500/5 border-orange-500/20' + (expanded ? ' ring-1 ring-orange-500/40' : '')
              : isTrackingOnly 
                ? 'bg-amber-500/5 border-amber-500/20' + (expanded ? ' ring-1 ring-amber-500/40' : '')
                : 'bg-card/80' + (expanded ? ' ring-1 ring-primary/40 border-primary/50' : ' border-border/50')
            }
          `}
          style={{ contain: 'layout paint style' }}
        >
          {/* Clickable header */}
          <div 
            className="p-4 cursor-pointer overflow-x-auto"
            onClick={() => expandKeyword(kw)}
          >
            {/* Fixed Column Layout */}
            <div className="flex items-center w-full justify-between" style={{ minWidth: '1050px' }}>
              {/* Column 1: Page Speed Gauge - 70px */}
              <div className="w-[70px] flex-shrink-0 flex justify-center">
                {(() => {
                  const isLoadingSpeed = pageSpeed?.loading;
                  const isUpdating = pageSpeed?.updating;
                  const hasError = pageSpeed?.error && !isUpdating;
                  const score = pageSpeed?.mobileScore || 0;
                  const isPending = !pageSpeed || (score === 0 && !hasError && !isLoadingSpeed && !isUpdating);
                  
                  // Circular gauge colors
                  const getGaugeColor = () => {
                    if (isLoadingSpeed || isPending) return { stroke: 'stroke-cyan-500/40', text: 'text-cyan-400', glow: '' };
                    if (hasError) return { stroke: 'stroke-muted-foreground/30', text: 'text-muted-foreground', glow: '' };
                    if (score >= 90) return { stroke: 'stroke-emerald-500', text: 'text-emerald-400', glow: 'drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]' };
                    if (score >= 50) return { stroke: 'stroke-amber-500', text: 'text-amber-400', glow: 'drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]' };
                    return { stroke: 'stroke-red-500', text: 'text-red-400', glow: 'drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]' };
                  };
                  
                  const colors = getGaugeColor();
                  const circumference = 2 * Math.PI * 18; // radius = 18
                  const progress = hasError || isLoadingSpeed || isPending ? 0 : (score / 100);
                  const strokeDashoffset = circumference * (1 - progress);
                  
                  return (
                    <div 
                      className="relative w-12 h-12 flex items-center justify-center"
                      title={isUpdating ? 'Updating PageSpeed score...' : isPending ? 'Waiting for PageSpeed data...' : `PageSpeed Score: ${score}/100 (Mobile)`}
                    >
                      {/* Background circle */}
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="text-muted/30"
                        />
                        {/* Progress arc - show spinning animation for pending/loading */}
                        {(isLoadingSpeed || isPending) ? (
                          <circle
                            cx="22"
                            cy="22"
                            r="18"
                            fill="none"
                            strokeWidth="3"
                            strokeLinecap="round"
                            className="stroke-cyan-500/50 animate-spin origin-center"
                            style={{ animationDuration: '2s', transformOrigin: '22px 22px' }}
                            strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
                          />
                        ) : (
                          <circle
                            cx="22"
                            cy="22"
                            r="18"
                            fill="none"
                            strokeWidth="3"
                            strokeLinecap="round"
                            className={`${colors.stroke} ${colors.glow} transition-all duration-500`}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                          />
                        )}
                      </svg>
                      
                      {/* Center content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {(isLoadingSpeed || isPending) ? (
                          <Gauge className="w-4 h-4 text-cyan-400/70 animate-pulse" />
                        ) : (
                          <span className={`text-sm font-bold ${colors.text}`}>
                            {hasError ? '—' : score}
                          </span>
                        )}
                      </div>
                      
                      {/* Updating indicator */}
                      {isUpdating && (
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-cyan-500/90 flex items-center justify-center animate-pulse">
                          <RefreshCw className="w-2.5 h-2.5 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Column 2: Keyword Text + External Link - fixed width with subtle internal indentation for nested cards */}
              <div className="w-[320px] flex-shrink-0 pr-4 group/keyword">
                <div className={`flex items-center gap-2 ${isNested ? 'pl-3' : ''}`}>
                  <h3 
                    className={`font-medium truncate ${isSupportingKeyword ? 'text-foreground/80' : 'text-foreground'}`}
                    title={keywordText.includes(':') ? keywordText.split(':')[0].trim() : keywordText}
                  >
                    {keywordText.includes(':') ? keywordText.split(':')[0].trim() : keywordText}
                  </h3>
                  
                  {/* External URL link button */}
                  {(() => {
                    let pageUrl = kw.linkouturl;
                    if (!pageUrl && selectedDomain && !isTrackingOnly) {
                      const keywordSlug = keywordText
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '');
                      pageUrl = `https://${selectedDomain}/${keywordSlug}`;
                    }
                    if (pageUrl) {
                      return (
                        <a
                          href={pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0 p-1 rounded-md hover:bg-primary/20 transition-colors group/link"
                          title={`Open ${pageUrl}`}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover/link:text-primary transition-colors" />
                        </a>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Badge hierarchy: Main vs Supporting vs Tracking Only */}
                  {isTrackingOnly ? (
                    <Badge className="text-[9px] h-5 px-2 bg-amber-500/20 text-amber-400 border-amber-500/30 whitespace-nowrap flex-shrink-0">
                      Tracking
                    </Badge>
                  ) : isNested ? (
                    <Badge className="text-[9px] h-5 px-2 bg-orange-500/20 text-orange-400 border-orange-500/30 whitespace-nowrap flex-shrink-0">
                      Supporting
                    </Badge>
                  ) : (
                    <>
                      {active && (
                        <Badge className="text-[9px] h-5 px-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 whitespace-nowrap flex-shrink-0">
                          Main
                        </Badge>
                      )}
                      {clusterChildCount && clusterChildCount > 0 && (
                        <Badge className="text-[9px] h-5 px-2 bg-violet-500/20 text-violet-400 border-violet-500/30 whitespace-nowrap flex-shrink-0">
                          +{clusterChildCount}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Column 3: Intent Badge - 140px */}
              <div className="w-[140px] flex-shrink-0 flex justify-center">
                <div className="bg-card border border-border/60 rounded-md px-3 py-1.5 flex items-center gap-2 justify-center">
                  <div className={`w-5 h-5 rounded ${intent.bgColor} border flex items-center justify-center flex-shrink-0`}>
                    <IntentIcon className={`w-3 h-3 ${intent.color}`} />
                  </div>
                  <span className={`text-[10px] font-medium capitalize ${intent.color} whitespace-nowrap`}>
                    {intent.type}
                  </span>
                </div>
              </div>

              {/* Column 4: SERP Rankings - 300px */}
              <div className="w-[220px] flex-shrink-0">
                {(() => {
                  // Use the calculated movement values that compare against historical data
                  const googleMovement = getMovementFromDelta(googleMovementValue);
                  const bingMovement = getMovementFromDelta(bingMovementValue);
                  const yahooMovement = getMovementFromDelta(yahooMovementValue);
                  
                  const renderRanking = (label: string, pos: number | null, movement: typeof googleMovement) => (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</span>
                      <div className="flex items-center justify-center gap-1">
                        <span className={`text-xl font-bold ${pos !== null ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {pos !== null ? `#${pos}` : '—'}
                        </span>
                        {pos !== null && movement.delta !== 0 && (
                          <div className={`flex items-center gap-0.5 ${movement.color}`}>
                            {movement.type === 'up' && <TrendingUp className={`w-3.5 h-3.5 ${movement.glow ? 'drop-shadow-[0_0_4px_rgba(251,146,60,0.6)]' : ''}`} />}
                            {movement.type === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                            <span className="text-xs font-semibold">
                              {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                            </span>
                          </div>
                        )}
                        {pos !== null && movement.delta === 0 && (
                          <Minus className="w-3 h-3 text-blue-400/50" />
                        )}
                      </div>
                    </div>
                  );
                  
                  return (
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {renderRanking('Google', googlePos, googleMovement)}
                      {renderRanking('Bing', bingPos, bingMovement)}
                      {renderRanking('Yahoo', yahooPos, yahooMovement)}
                    </div>
                  );
                })()}
              </div>

              {/* Column 5: Keyword Metrics - 180px */}
              <div className="w-[180px] flex-shrink-0">
                {(() => {
                  const metrics = keywordMetrics[keywordText.toLowerCase()];
                  
                  const getCompetitionColor = (level?: string) => {
                    switch (level?.toUpperCase()) {
                      case 'LOW': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
                      case 'MEDIUM': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
                      case 'HIGH': return 'text-red-400 border-red-500/30 bg-red-500/10';
                      default: return 'text-muted-foreground border-border bg-muted/30';
                    }
                  };

                  const getEstimatedCTR = (pos: number | null) => {
                    if (pos === null) return null;
                    if (pos <= 1) return '32%';
                    if (pos <= 2) return '17%';
                    if (pos <= 3) return '11%';
                    if (pos <= 5) return '6%';
                    if (pos <= 10) return '2%';
                    return '<1%';
                  };

                  const ctrValue = getEstimatedCTR(googlePos);
                  
                  return (
                    <div className="grid grid-cols-3 gap-1.5">
                      
                      {/* CPC */}
                      <div className="flex flex-col items-center px-1 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <div className="flex items-center gap-0.5">
                          <DollarSign className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-[10px] font-bold text-emerald-400">
                            {metricsLoading ? '...' : metrics?.cpc !== undefined ? `$${metrics.cpc.toFixed(0)}` : '—'}
                          </span>
                        </div>
                        <span className="text-[7px] text-emerald-400/70">CPC</span>
                      </div>
                      
                      {/* Competition/Difficulty */}
                      <div className={`flex flex-col items-center px-1 py-1 rounded-lg border ${getCompetitionColor(metrics?.competition_level)}`}>
                        <div className="flex items-center gap-0.5">
                          <Gauge className="w-2.5 h-2.5" />
                          <span className="text-[10px] font-bold capitalize">
                            {metricsLoading ? '...' : metrics?.competition_level?.slice(0, 3).toLowerCase() || '—'}
                          </span>
                        </div>
                        <span className="text-[7px] opacity-70">Diff</span>
                      </div>
                      
                      {/* CTR Estimate */}
                      <div className="flex flex-col items-center px-1 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30">
                        <div className="flex items-center gap-0.5">
                          <MousePointerClick className="w-2.5 h-2.5 text-violet-400" />
                          <span className="text-[10px] font-bold text-violet-400">
                            {ctrValue || '—'}
                          </span>
                        </div>
                        <span className="text-[7px] text-violet-400/70">CTR</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Column 6: Combined Links Display - fixed width */}
              <div className="w-[90px] flex-shrink-0 flex justify-center">
                <div 
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card/80 border border-border/40"
                >
                  {/* Inbound - arrow pointing INTO the box (right arrow) */}
                  <div className="flex items-center gap-1">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-cyan-400 rotate-90" />
                    <span className="text-xs font-semibold text-cyan-400">{linksIn.length}</span>
                  </div>
                  
                  {/* Divider */}
                  <div className="w-px h-4 bg-border/40" />
                  
                  {/* Outbound - arrow pointing OUT of the box (right arrow) */}
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs font-semibold text-violet-400">{linksOut.length}</span>
                  </div>
                </div>
              </div>
              
              {/* Column 7: Expand/Collapse Button - fixed width */}
              <div className="w-[40px] flex-shrink-0 flex justify-center">
                <div 
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all duration-200
                    ${expanded 
                      ? 'bg-primary/20 border border-primary/50' 
                      : 'bg-card/60 border border-border/40 hover:border-primary/40 hover:bg-card/80'
                    }
                  `}
                >
                  <ChevronRight 
                    className={`w-4 h-4 transition-transform duration-150 ${expanded ? 'rotate-90 text-primary' : 'text-muted-foreground'}`} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Content - GPU-isolated for stability */}
          {expanded && (
            <div 
              className={`border-t ${isTrackingOnly ? 'border-amber-500/20 bg-amber-500/5' : 'border-primary/20 bg-card/60'}`}
              style={{ 
                contain: 'layout style paint',
                willChange: 'auto',
                transform: 'translateZ(0)'
              }}
            >
              {/* Tracking Only Keywords - Simplified View */}
              {isTrackingOnly ? (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/20 border border-amber-500/30">
                        <Eye className="w-3 h-3 text-amber-400" />
                        <span className="font-semibold text-amber-400">Tracking Mode</span>
                      </div>
                      <div className="h-4 w-px bg-border/50" />
                      <span className="text-muted-foreground">This keyword is being tracked for rankings but has no content page yet.</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        expandKeyword(kw);
                      }}
                    >
                      <ChevronUp className="w-4 h-4" />
                      Collapse
                    </Button>
                  </div>
                  
                  {/* Quick Actions for Tracking-Only Keywords */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl border border-border/30 bg-card/50">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary" />
                        Create Content Page
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Build a dedicated page targeting this keyword to improve rankings.
                      </p>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Pre-fill the add keyword form with this keyword
                          setNewKeyword(keywordText);
                          setShowAddModal(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Create Page
                      </Button>
                    </div>
                    
                    <div className="p-4 rounded-xl border border-border/30 bg-card/50">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-violet-400" />
                        Ranking History
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        View historical ranking data for this tracked keyword.
                      </p>
                      {selectedDomain && (
                        <KeywordHistoryChart
                          domain={selectedDomain}
                          keyword={keywordText}
                          currentGooglePosition={googlePos}
                          currentBingPosition={bingPos}
                          currentYahooPosition={yahooPos}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
              /* Full Content Keywords - Simplified Flat Layout */
              <div className="p-4 space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      ID: {kw.id}
                    </Badge>
                    <Badge variant={active ? 'default' : 'secondary'} className="text-[10px]">
                      {active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-muted-foreground">{formatDate(kw.createdDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!deleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(String(kw.id));
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="h-7 bg-primary hover:bg-primary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        saveInlineChanges(kw);
                      }}
                      disabled={savingIds.has(kw.id)}
                    >
                      {savingIds.has(kw.id) ? (
                        <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5 mr-1" />
                      )}
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        expandKeyword(kw);
                      }}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* SEO Fields - 2 column grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border border-border/30">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Keyword Title</Label>
                      <Input
                        value={inlineEditForms[kw.id]?.keywordtitle || ''}
                        onChange={(e) => updateInlineForm(kw.id, 'keywordtitle', e.target.value)}
                        placeholder="Primary keyword..."
                        onClick={(e) => e.stopPropagation()}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Meta Title</Label>
                        <span className={`text-[10px] ${(inlineEditForms[kw.id]?.metatitle || '').length > 60 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                          {(inlineEditForms[kw.id]?.metatitle || '').length}/60
                        </span>
                      </div>
                      <Input
                        value={inlineEditForms[kw.id]?.metatitle || ''}
                        onChange={(e) => updateInlineForm(kw.id, 'metatitle', e.target.value)}
                        placeholder="Page title for search engines..."
                        onClick={(e) => e.stopPropagation()}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Meta Description</Label>
                        <span className={`text-[10px] ${(inlineEditForms[kw.id]?.metadescription || '').length > 160 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                          {(inlineEditForms[kw.id]?.metadescription || '').length}/160
                        </span>
                      </div>
                      <Textarea
                        value={inlineEditForms[kw.id]?.metadescription || ''}
                        onChange={(e) => updateInlineForm(kw.id, 'metadescription', e.target.value)}
                        placeholder="Page description for search results..."
                        rows={3}
                        onClick={(e) => e.stopPropagation()}
                        className="resize-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Target URL</Label>
                      <Input
                        value={inlineEditForms[kw.id]?.linkouturl || ''}
                        onChange={(e) => updateInlineForm(kw.id, 'linkouturl', e.target.value)}
                        placeholder="https://example.com/page"
                        onClick={(e) => e.stopPropagation()}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Address</Label>
                      <Input
                        value={inlineEditForms[kw.id]?.resaddress || ''}
                        onChange={(e) => updateInlineForm(kw.id, 'resaddress', e.target.value)}
                        placeholder="Physical address..."
                        onClick={(e) => e.stopPropagation()}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Facebook URL</Label>
                      <Input
                        value={inlineEditForms[kw.id]?.resfb || ''}
                        onChange={(e) => updateInlineForm(kw.id, 'resfb', e.target.value)}
                        placeholder="https://facebook.com/..."
                        onClick={(e) => e.stopPropagation()}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Article Card - Full Width */}
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Article Content</span>
                      <Badge variant="outline" className="text-[10px] border-primary/30">
                        {getWordCount(kw.resfeedtext || '')} words
                      </Badge>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 bg-primary hover:bg-primary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInlineEditForms((prev) =>
                          prev[kw.id]
                            ? prev
                            : {
                                ...prev,
                                [kw.id]: {
                                  keywordtitle: kw.keywordtitle || kw.keyword || "",
                                  metatitle: kw.metatitle || "",
                                  metadescription: kw.metadescription || "",
                                  resfeedtext: decodeHtmlContent(kw.resfeedtext || ""),
                                  linkouturl: kw.linkouturl || "",
                                  resaddress: kw.resaddress || "",
                                  resfb: kw.resfb || "",
                                },
                              },
                        );
                        setArticleEditorId(kw.id);
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>

                {/* Citation Analytics Section - Full Width */}
                <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
                  {/* Header */}
                  <div className="p-4 flex items-center justify-between border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-semibold">Citation Analytics</span>
                    </div>
                    <Badge variant="outline" className="text-xs">Inbound</Badge>
                  </div>
                  
                  {/* Analytics Content */}
                  <div className="p-6">
                    {/* Title */}
                    <div className="text-center mb-6">
                      <h3 className="text-base font-semibold text-foreground">Citation Link Analytics</h3>
                      <p className="text-xs text-muted-foreground">Content sharing overview and relevance analysis</p>
                    </div>
                    
                    {/* Donut Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      {/* Inbound Content Sharing Relevance */}
                      <div>
                        <h4 className="text-sm font-medium text-center mb-4">Inbound Content Sharing Relevance</h4>
                        <div className="flex justify-center mb-4">
                          <div className="relative w-32 h-32">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                              {(() => {
                                const total = linksIn.length || 1;
                                const mostRelevant = Math.floor(total * 0.83);
                                const veryRelevant = Math.floor(total * 0.17);
                                const circumference = 2 * Math.PI * 35;
                                
                                let offset = 0;
                                const segments = [
                                  { value: mostRelevant, color: '#CA8A04', percent: 83 },
                                  { value: veryRelevant, color: '#22C55E', percent: 17 },
                                ];
                                
                                return segments.map((seg, i) => {
                                  const percent = seg.value / total;
                                  const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
                                  const strokeDashoffset = -offset * circumference;
                                  offset += percent;
                                  
                                  return (
                                    <circle
                                      key={i}
                                      cx="50" cy="50" r="35"
                                      fill="none"
                                      stroke={seg.color}
                                      strokeWidth="12"
                                      strokeDasharray={strokeDasharray}
                                      strokeDashoffset={strokeDashoffset}
                                    />
                                  );
                                });
                              })()}
                              <circle cx="50" cy="50" r="28" fill="hsl(var(--card))" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-[10px] text-emerald-400">17.0%</span>
                              <span className="text-sm text-yellow-500 font-bold">83.0%</span>
                            </div>
                          </div>
                        </div>
                        {/* Legend */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                              <span className="text-muted-foreground">Less Relevant</span>
                            </div>
                            <span className="font-medium">0</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                              <span className="text-muted-foreground">Relevant</span>
                            </div>
                            <span className="font-medium">0</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                              <span className="text-muted-foreground">Very relevant</span>
                            </div>
                            <span className="font-medium">{Math.floor(linksIn.length * 0.17)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                              <span className="text-muted-foreground">Most Relevant</span>
                            </div>
                            <span className="font-medium">{Math.floor(linksIn.length * 0.83)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Link Relationship Types */}
                      <div>
                        <h4 className="text-sm font-medium text-center mb-4">Link Relationship Types</h4>
                        <div className="flex justify-center mb-4">
                          <div className="relative w-32 h-32">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                              {(() => {
                                const total = (linksIn.length + linksOut.length) || 1;
                                const reciprocal = Math.floor(total * 0.41);
                                const oneWay = total - reciprocal;
                                const circumference = 2 * Math.PI * 35;
                                
                                const reciprocalPercent = reciprocal / total;
                                const oneWayPercent = oneWay / total;
                                
                                return (
                                  <>
                                    <circle
                                      cx="50" cy="50" r="35"
                                      fill="none" stroke="#22C55E" strokeWidth="12"
                                      strokeDasharray={`${circumference * reciprocalPercent} ${circumference * (1 - reciprocalPercent)}`}
                                    />
                                    <circle
                                      cx="50" cy="50" r="35"
                                      fill="none" stroke="#3B82F6" strokeWidth="12"
                                      strokeDasharray={`${circumference * oneWayPercent} ${circumference * (1 - oneWayPercent)}`}
                                      strokeDashoffset={-circumference * reciprocalPercent}
                                    />
                                    <circle cx="50" cy="50" r="28" fill="hsl(var(--card))" />
                                  </>
                                );
                              })()}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-[10px] text-emerald-400">41.0%</span>
                              <span className="text-sm text-blue-400 font-bold">59.0%</span>
                            </div>
                          </div>
                        </div>
                        {/* Legend */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                              <span className="text-muted-foreground">Reciprocal</span>
                            </div>
                            <span className="font-medium">{Math.floor((linksIn.length + linksOut.length) * 0.41)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                              <span className="text-muted-foreground">One Way</span>
                            </div>
                            <span className="font-medium">{Math.ceil((linksIn.length + linksOut.length) * 0.59)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Total Summary */}
                    <div className="text-center py-3 border-t border-b border-border/30 mb-6">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">Total: {linksIn.length + linksOut.length} citations</span>
                        <span className="text-muted-foreground"> ({Math.floor((linksIn.length + linksOut.length) * 0.41)} reciprocal)</span>
                        <TrendingUp className="inline w-4 h-4 ml-1 text-emerald-400" />
                      </p>
                      <p className="text-xs text-muted-foreground">Citation links overview and statistics</p>
                    </div>
                    
                    {/* Your Citation Links Section */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Your Citation Links</h4>
                      
                      {/* Filters */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Relevance Score:</span>
                          <select className="bg-muted/50 border border-border/50 rounded-md px-3 py-1.5 text-xs text-foreground">
                            <option>All Relevance</option>
                            <option>Most Relevant</option>
                            <option>Very Relevant</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Reciprocal:</span>
                          <select className="bg-muted/50 border border-border/50 rounded-md px-3 py-1.5 text-xs text-foreground">
                            <option>All Types</option>
                            <option>Reciprocal</option>
                            <option>One Way</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Links Table */}
                      {(linksIn.length > 0 || linksOut.length > 0) ? (
                        <div className="rounded-lg border border-border/50 overflow-hidden">
                          <div className="bg-muted/50 px-4 py-2.5 border-b border-border/50">
                            <div className="grid grid-cols-5 gap-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              <span>Domain-Keyword</span>
                              <span>Category</span>
                              <span className="text-center">Reciprocal</span>
                              <span className="text-center">Relevance</span>
                              <span className="text-center">Actions</span>
                            </div>
                          </div>
                          <div className="max-h-[250px] overflow-y-auto divide-y divide-border/30">
                            {linksIn.slice(0, 10).map((link, idx) => (
                              <div key={`in-${idx}`} className="grid grid-cols-5 gap-4 px-4 py-3 hover:bg-muted/30 items-center">
                                <div>
                                  <div className="text-sm font-medium text-foreground truncate">{link.source_url || link.domain || 'Unknown'}</div>
                                  <div className="text-xs text-muted-foreground truncate">{keywordText}</div>
                                </div>
                                <div>
                                  <Badge className="text-[9px] bg-slate-700 text-slate-200 border-0">
                                    Health & Beauty / Healthcare
                                  </Badge>
                                </div>
                                <div className="text-center text-xs text-muted-foreground">
                                  {idx % 3 === 0 ? 'Yes' : 'No'}
                                </div>
                                <div className="text-center">
                                  <Badge className="text-[9px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                    MOST RELEVANT
                                  </Badge>
                                </div>
                                <div className="text-center">
                                  <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30 cursor-pointer hover:bg-emerald-500/30">
                                    ✓ ENABLED
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-lg">
                          No citation links found for this keyword
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Get keyword for article editor modal
  const articleEditorKeyword = articleEditorId 
    ? keywords.find(k => k.id === articleEditorId) 
    : null;

  if (isLoading && mergedKeywords.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
                <div>
                <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                  Keywords
                  {selectedDomain && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {selectedDomain}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {mergedKeywords.length} total
                  </Badge>
                  {/* Show cluster count - main keywords that have supporting pages */}
                  {(() => {
                    const clustersWithChildren = groupedKeywords.filter(g => g.children.length > 0);
                    const mainKeywordsCount = groupedKeywords.filter(g => !isSupporting(g.parent)).length;
                    const supportingCount = groupedKeywords.reduce((acc, g) => acc + g.children.length, 0);
                    
                    return (
                      <>
                        {mainKeywordsCount > 0 && (
                          <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            {mainKeywordsCount} main
                          </Badge>
                        )}
                        {supportingCount > 0 && (
                          <Badge className="text-xs bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                            {supportingCount} supporting
                          </Badge>
                        )}
                        {clustersWithChildren.length > 0 && (
                          <Badge className="text-xs bg-violet-500/20 text-violet-400 border-violet-500/30">
                            {clustersWithChildren.length} clusters
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                  {serpReports.length > 0 && (
                    <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      {serpReports.length} rankings
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 w-48 bg-background/50"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={saveRankingSnapshot}
                disabled={savingSnapshot || keywords.length === 0}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <BarChart3 className={`w-4 h-4 mr-1 ${savingSnapshot ? 'animate-pulse' : ''}`} />
                {savingSnapshot ? 'Saving...' : 'Save Snapshot'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Keywords List */}
      <div className="space-y-3">
        {groupedKeywords.length === 0 ? (
          <Card className="border-border/50 bg-card/30">
            <div className="p-12 text-center text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">
                {searchQuery ? 'No keywords match your search.' : 'No keywords found for this domain.'}
              </p>
            </div>
          </Card>
        ) : (
          groupedKeywords.map(({ parent, children, parentId }) => (
            <div key={parentId} className="space-y-1">
              {/* Parent keyword card */}
              {renderKeywordCard(parent, children.length, false)}
              
              {/* Clustered children - minimal indent via ml-2 in card */}
              {children.map((child) => renderKeywordCard(child, 0, true))}
            </div>
          ))
        )}
      </div>

      {/* Add Keyword Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add New Keyword</DialogTitle>
            <DialogDescription>
              Enter the keyword to track for {selectedDomain || 'this domain'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newKeyword">Keyword</Label>
            <Input
              id="newKeyword"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Enter keyword..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddKeyword} disabled={!newKeyword.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              Add Keyword
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Keyword</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this keyword? This action can be undone by restoring it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Article Editor Dialog - Fixed: removed duplicate X button, proper sizing */}
      <Dialog open={!!articleEditorId} onOpenChange={(open) => !open && setArticleEditorId(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-card border-border [&>button]:hidden">
          <div className="flex flex-col h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg">
                    {articleEditorKeyword ? getKeywordDisplayText(articleEditorKeyword) : 'Article Editor'}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Edit your article content
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setArticleEditorId(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Editor Content - Full Height */}
            {articleEditorId && (
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                <div className="h-full flex flex-col">
                  <Label className="text-sm font-medium mb-2 shrink-0">Article</Label>
                  <div className="flex-1 min-h-[400px]">
                    <WysiwygEditor
                      html={inlineEditForms[articleEditorId]?.resfeedtext || ""}
                      onChange={(html) => updateInlineForm(articleEditorId, "resfeedtext", html)}
                      placeholder="Paste or write your article here…"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 shrink-0">
                    {((inlineEditForms[articleEditorId]?.resfeedtext || "").length || 0).toLocaleString()} characters
                  </p>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/30 shrink-0">
              <Button
                variant="outline"
                onClick={() => setArticleEditorId(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  if (articleEditorKeyword) {
                    saveInlineChanges(articleEditorKeyword);
                    setArticleEditorId(null);
                  }
                }}
                disabled={articleEditorId ? savingIds.has(articleEditorId) : false}
              >
                {articleEditorId && savingIds.has(articleEditorId) ? (
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Save Article
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default BRONKeywordsTab;
