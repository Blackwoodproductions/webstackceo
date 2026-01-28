import { useState, useMemo } from "react";
import { 
  Key, RefreshCw, Plus, Edit2, Trash2, RotateCcw, 
  Search, ChevronRight, Save, Eye,
  ChevronUp, FileText, Link2, Hash, 
  Sparkles, X, BarChart3, TrendingUp, TrendingDown, Minus,
  ShoppingCart, Info, Compass, Target, ArrowDownLeft, ArrowUpRight
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
import { BronKeyword, BronSerpReport, BronLink } from "@/hooks/use-bron-api";
import WysiwygEditor from "@/components/marketing/WysiwygEditor";

interface BRONKeywordsTabProps {
  keywords: BronKeyword[];
  serpReports?: BronSerpReport[];
  linksIn?: BronLink[];
  linksOut?: BronLink[];
  selectedDomain?: string;
  isLoading: boolean;
  onRefresh: () => void;
  onAdd: (data: Record<string, unknown>) => Promise<boolean>;
  onUpdate: (keywordId: string, data: Record<string, unknown>) => Promise<boolean>;
  onDelete: (keywordId: string) => Promise<boolean>;
  onRestore: (keywordId: string) => Promise<boolean>;
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

// Parse position value from string/number
function getPosition(val?: string | number): number | null {
  if (val === undefined || val === null) return null;
  const num = typeof val === 'string' ? parseInt(val, 10) : val;
  return isNaN(num) || num === 0 ? null : num;
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
  // Check various possible fields that might indicate supporting page status
  if (kw.is_supporting === true || kw.is_supporting === 1) return true;
  if (kw.bubblefeed === true || kw.bubblefeed === 1) return true;
  if (kw.parent_keyword_id) return true;
  return false;
}

// Group keywords by parent-child relationship
function groupKeywords(keywords: BronKeyword[]): { parent: BronKeyword; children: BronKeyword[] }[] {
  if (keywords.length === 0) return [];
  
  // Separate main keywords from supporting keywords
  const mainKeywords: BronKeyword[] = [];
  const supportingKeywords: BronKeyword[] = [];
  
  for (const kw of keywords) {
    if (isSupporting(kw)) {
      supportingKeywords.push(kw);
    } else {
      mainKeywords.push(kw);
    }
  }
  
  // If we have explicit parent-child relationships via parent_keyword_id
  const parentIdMap = new Map<string | number, BronKeyword[]>();
  for (const child of supportingKeywords) {
    if (child.parent_keyword_id) {
      const key = child.parent_keyword_id;
      if (!parentIdMap.has(key)) {
        parentIdMap.set(key, []);
      }
      parentIdMap.get(key)!.push(child);
    }
  }
  
  // Build groups
  const groups: { parent: BronKeyword; children: BronKeyword[] }[] = [];
  const usedChildren = new Set<number | string>();
  
  // Sort main keywords alphabetically
  mainKeywords.sort((a, b) => 
    getKeywordDisplayText(a).localeCompare(getKeywordDisplayText(b))
  );
  
  for (const parent of mainKeywords) {
    // Get children linked to this parent
    const linkedChildren = parentIdMap.get(parent.id) || [];
    linkedChildren.forEach(c => usedChildren.add(c.id));
    
    groups.push({ parent, children: linkedChildren });
  }
  
  // Add any orphaned supporting keywords as their own groups
  for (const child of supportingKeywords) {
    if (!usedChildren.has(child.id)) {
      groups.push({ parent: child, children: [] });
    }
  }
  
  return groups;
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
  linksIn = [],
  linksOut = [],
  selectedDomain,
  isLoading,
  onRefresh,
  onAdd,
  onUpdate,
  onDelete,
  onRestore,
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

  // Filter keywords
  const filteredKeywords = useMemo(() => {
    if (!searchQuery.trim()) return keywords;
    const q = searchQuery.toLowerCase();
    return keywords.filter(k => 
      getKeywordDisplayText(k).toLowerCase().includes(q) ||
      (k.metadescription || '').toLowerCase().includes(q)
    );
  }, [keywords, searchQuery]);

  const groupedKeywords = useMemo(() => groupKeywords(filteredKeywords), [filteredKeywords]);


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

  // Render a keyword card - simplified, GPU-optimized
  const renderKeywordCard = (kw: BronKeyword) => {
    const expanded = expandedIds.has(kw.id);
    const deleted = isDeleted(kw);
    const active = isActive(kw);
    
    // Content preview stats
    const wordCount = getWordCount(kw.resfeedtext || '');
    const metaTitleQuality = getMetaTitleQuality(kw.metatitle || '');
    const metaDescQuality = getMetaDescQuality(kw.metadescription || '');
    const hasLinks = !!(kw.linkouturl);

    // SERP ranking data for this keyword
    const keywordText = getKeywordDisplayText(kw);
    const serpData = findSerpForKeyword(keywordText, serpReports);
    const googlePos = getPosition(serpData?.google);
    const bingPos = getPosition(serpData?.bing);
    const yahooPos = getPosition(serpData?.yahoo);
    const duckPos = getPosition(serpData?.duck);
    const hasRankings = googlePos !== null || bingPos !== null || yahooPos !== null || duckPos !== null;

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

    return (
      <div
        key={kw.id}
        className={`${deleted ? 'opacity-50' : ''}`}
        style={{ contain: 'layout' }}
      >
        {/* Card container */}
        <div 
          className={`
            rounded-xl border bg-card/80 overflow-hidden transition-colors duration-150
            ${expanded ? 'ring-1 ring-primary/40 border-primary/50' : 'border-border/50 hover:border-primary/30'}
          `}
          style={{ contain: 'layout paint' }}
        >
          {/* Clickable header - keyword + rankings + intent icon */}
          <div 
            className="p-4 cursor-pointer hover:bg-muted/30 transition-colors duration-100"
            onClick={() => expandKeyword(kw)}
          >
            <div className="flex items-center gap-3">
              {/* Intent Type Icon + Label */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg ${intent.bgColor} border flex items-center justify-center`}>
                  <IntentIcon className={`w-5 h-5 ${intent.color}`} />
                </div>
                <span className={`text-[10px] font-medium capitalize w-20 ${intent.color}`}>
                  {intent.type}
                </span>
              </div>

              {/* Keyword Text - only show keyword portion (before colon if present) */}
              <div className="min-w-0 max-w-md">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground truncate">
                    {keywordText.includes(':') ? keywordText.split(':')[0].trim() : keywordText}
                  </h3>
                  {active && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  )}
                </div>
              </div>

              {/* SERP Rankings - Right after keyword */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {googlePos !== null && (
                  <div className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg ${getPositionStyle(googlePos).bg} ${getPositionStyle(googlePos).text} border`}>
                    <span className="font-semibold">Google</span>
                    <span className="text-sm font-bold">#{googlePos}</span>
                    {googlePos <= 10 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : googlePos <= 20 ? (
                      <Minus className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                )}
                {bingPos !== null && (
                  <div className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg ${getPositionStyle(bingPos).bg} ${getPositionStyle(bingPos).text} border`}>
                    <span className="font-semibold">Bing</span>
                    <span className="text-sm font-bold">#{bingPos}</span>
                  </div>
                )}
                {yahooPos !== null && (
                  <div className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg ${getPositionStyle(yahooPos).bg} ${getPositionStyle(yahooPos).text} border`}>
                    <span className="font-semibold">Yahoo</span>
                    <span className="text-sm font-bold">#{yahooPos}</span>
                  </div>
                )}
              </div>

              {/* Inbound/Outbound Links */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span className="font-semibold">In</span>
                  <span className="text-sm font-bold">{linksIn.length}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span className="font-semibold">Out</span>
                  <span className="text-sm font-bold">{linksOut.length}</span>
                </div>
              </div>

              {/* Spacer + Expand Arrow */}
              <div className="flex-1" />
              <ChevronRight 
                className={`w-5 h-5 flex-shrink-0 transition-transform duration-150 ${expanded ? 'rotate-90 text-primary' : 'text-muted-foreground'}`} 
              />
            </div>
          </div>

          {/* Expanded Content - simple show/hide, no animation */}
          {expanded && (
            <div 
              className="border-t border-border/30 bg-muted/20"
              style={{ contain: 'layout paint' }}
            >
              <div className="p-4">
                {/* Header with metadata inline */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5 text-primary" />
                      <span className="font-medium text-foreground">Edit Keyword</span>
                    </span>
                    <span className="text-muted-foreground">ID: <span className="font-mono">{kw.id}</span></span>
                    <Badge variant={active ? 'default' : 'secondary'} className="text-[10px]">
                      {active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-muted-foreground">{formatDate(kw.createdDate)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      expandKeyword(kw);
                    }}
                  >
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Collapse
                  </Button>
                </div>

                {/* Two-column layout for compact form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                  {/* Left Column: Keyword & SEO */}
                  <div className="space-y-3">
                    {/* Keyword Title */}
                    <div className="space-y-1">
                      <Label className="text-xs">Keyword Title</Label>
                      <Input
                        value={inlineEditForms[kw.id]?.keywordtitle || ''}
                        onChange={(e) => updateInlineForm(kw.id, 'keywordtitle', e.target.value)}
                        placeholder="Primary keyword..."
                        onClick={(e) => e.stopPropagation()}
                        className="h-9"
                      />
                    </div>

                    {/* Meta Title */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Meta Title</Label>
                        <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${scoreBg(metaTitleQuality.score)}`}>
                          <Hash className={`w-2.5 h-2.5 ${scoreColor(metaTitleQuality.score)}`} />
                          <span className={scoreColor(metaTitleQuality.score)}>{(inlineEditForms[kw.id]?.metatitle || '').length}/60</span>
                        </div>
                      </div>
                      <Input
                        value={inlineEditForms[kw.id]?.metatitle || ''}
                        onChange={(e) => updateInlineForm(kw.id, 'metatitle', e.target.value)}
                        placeholder="Page title for search engines..."
                        onClick={(e) => e.stopPropagation()}
                        className="h-9"
                      />
                    </div>

                    {/* Meta Description */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Meta Description</Label>
                        <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${scoreBg(metaDescQuality.score)}`}>
                          <Sparkles className={`w-2.5 h-2.5 ${scoreColor(metaDescQuality.score)}`} />
                          <span className={scoreColor(metaDescQuality.score)}>{(inlineEditForms[kw.id]?.metadescription || '').length}/160</span>
                        </div>
                      </div>
                      <Textarea
                        value={inlineEditForms[kw.id]?.metadescription || ''}
                        onChange={(e) => updateInlineForm(kw.id, 'metadescription', e.target.value)}
                        placeholder="Page description for search results..."
                        rows={5}
                        onClick={(e) => e.stopPropagation()}
                        className="resize-y min-h-[100px]"
                      />
                    </div>
                  </div>

                  {/* Right Column: Links */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Target URL (Link Out)</Label>
                      <Input
                        value={inlineEditForms[kw.id]?.linkouturl || ''}
                        onChange={(e) => updateInlineForm(kw.id, 'linkouturl', e.target.value)}
                        placeholder="https://example.com/page"
                        onClick={(e) => e.stopPropagation()}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Resource Address</Label>
                      <Input
                        value={inlineEditForms[kw.id]?.resaddress || ''}
                        onChange={(e) => updateInlineForm(kw.id, 'resaddress', e.target.value)}
                        placeholder="Physical address or location..."
                        onClick={(e) => e.stopPropagation()}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Facebook Page URL</Label>
                      <Input
                        value={inlineEditForms[kw.id]?.resfb || ''}
                        onChange={(e) => updateInlineForm(kw.id, 'resfb', e.target.value)}
                        placeholder="https://facebook.com/..."
                        onClick={(e) => e.stopPropagation()}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Article Section - compact row */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-primary/10 to-violet-500/10 border border-primary/20 mb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Article Content</h4>
                      <p className="text-xs text-muted-foreground">
                        {getWordCount(kw.resfeedtext || '')} words
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
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
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>

                {/* Article Preview - collapsible, starts collapsed */}
                <details className="mb-3 rounded-lg border border-border/50 overflow-hidden">
                  <summary className="flex items-center gap-2 p-2 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/30">
                    <Eye className="w-3 h-3" />
                    Article Preview
                  </summary>
                  <div className="border-t border-border">
                    <div className="bg-muted/60 px-3 py-1 flex items-center gap-2 border-b border-border">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-destructive/50" />
                        <div className="w-2 h-2 rounded-full bg-secondary" />
                        <div className="w-2 h-2 rounded-full bg-primary/50" />
                      </div>
                      <div className="flex-1 mx-2">
                        <div className="bg-background/60 rounded px-2 py-0.5 text-[10px] text-muted-foreground truncate">
                          {selectedDomain || "example.com"}/article
                        </div>
                      </div>
                    </div>
                    <div className="bg-background text-foreground max-h-[300px] overflow-y-auto">
                      <article className="p-4">
                        <div
                          className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground prose-li:text-foreground"
                          dangerouslySetInnerHTML={{
                            __html:
                              inlineEditForms[kw.id]?.resfeedtext ||
                              decodeHtmlContent(kw.resfeedtext || "") ||
                              "<p><em>No article content yet…</em></p>",
                          }}
                        />
                      </article>
                    </div>
                  </div>
                </details>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      expandKeyword(kw);
                    }}
                  >
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Collapse
                  </Button>
                  <div className="flex items-center gap-2">
                    {!deleted && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/50 hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(String(kw.id));
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        saveInlineChanges(kw);
                      }}
                      disabled={savingIds.has(kw.id)}
                    >
                      {savingIds.has(kw.id) ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
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

  if (isLoading && keywords.length === 0) {
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
                <CardTitle className="text-lg flex items-center gap-2">
                  Keywords
                  {selectedDomain && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {selectedDomain}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {keywords.length} total
                  </Badge>
                  {serpReports.length > 0 && (
                    <Badge className="text-xs bg-violet-500/20 text-violet-400 border-violet-500/30">
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
          groupedKeywords.map(({ parent, children }) => (
            <div key={parent.id} className="space-y-2">
              {renderKeywordCard(parent)}
              {children.length > 0 && (
                <div className="space-y-2 pl-6 border-l-2 border-primary/20 ml-5">
                  {children.map(child => renderKeywordCard(child))}
                </div>
              )}
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

      {/* Article Editor Dialog */}
      <Dialog open={!!articleEditorId} onOpenChange={(open) => !open && setArticleEditorId(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-card border-border p-0">
          <div className="flex flex-col h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
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

            {/* Editor Content */}
            {articleEditorId && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Article</Label>
                  <WysiwygEditor
                    html={inlineEditForms[articleEditorId]?.resfeedtext || ""}
                    onChange={(html) => updateInlineForm(articleEditorId, "resfeedtext", html)}
                    placeholder="Paste or write your article here…"
                  />
                  <p className="text-xs text-muted-foreground">
                    {((inlineEditForms[articleEditorId]?.resfeedtext || "").length || 0).toLocaleString()} characters
                  </p>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/30">
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
