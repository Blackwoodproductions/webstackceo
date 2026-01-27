import { useState, useMemo, useRef } from "react";
import { 
  Key, RefreshCw, Plus, Edit2, Trash2, RotateCcw, 
  Search, ChevronRight, Save,
  Eye, ChevronUp, FileText, Link2, Hash, 
  Sparkles, Maximize2, Minimize2, X, PanelLeftClose, PanelLeft, BarChart3
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
import { BronKeyword, BronSerpReport } from "@/hooks/use-bron-api";

interface BRONKeywordsTabProps {
  keywords: BronKeyword[];
  serpReports?: BronSerpReport[];
  selectedDomain?: string;
  isLoading: boolean;
  onRefresh: () => void;
  onAdd: (data: Record<string, unknown>) => Promise<boolean>;
  onUpdate: (keywordId: string, data: Record<string, unknown>) => Promise<boolean>;
  onDelete: (keywordId: string) => Promise<boolean>;
  onRestore: (keywordId: string) => Promise<boolean>;
}

// Find matching SERP report for a keyword
function findSerpForKeyword(keywordText: string, serpReports: BronSerpReport[]): BronSerpReport | null {
  if (!keywordText || !serpReports.length) return null;
  const normalizedKeyword = keywordText.toLowerCase().trim();
  return serpReports.find(r => 
    r.keyword?.toLowerCase().trim() === normalizedKeyword
  ) || null;
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

export const BRONKeywordsTab = ({
  keywords,
  serpReports = [],
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
  const [focusModeId, setFocusModeId] = useState<number | string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

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
          {/* Clickable header */}
          <div 
            className="p-4 cursor-pointer hover:bg-muted/30 transition-colors duration-100"
            onClick={() => expandKeyword(kw)}
          >
            {/* Header row */}
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>

              {/* Title & Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-medium text-foreground truncate">
                    {getKeywordDisplayText(kw)}
                  </h3>
                  {active && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  )}
                </div>
                
                {/* Meta description preview */}
                {kw.metadescription && !expanded && (
                  <p className="text-xs text-muted-foreground line-clamp-1 max-w-lg">
                    {kw.metadescription}
                  </p>
                )}
              </div>

              {/* Status & Expand */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge 
                  className={`
                    text-[10px] px-2.5 py-0.5 rounded-full font-medium
                    ${active 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                      : deleted 
                        ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                        : 'bg-muted/50 text-muted-foreground border border-border/50'
                    }
                  `}
                >
                  {deleted ? 'Deleted' : active ? 'Active' : 'Draft'}
                </Badge>
                <ChevronRight 
                  className={`w-5 h-5 transition-transform duration-150 ${expanded ? 'rotate-90 text-primary' : 'text-muted-foreground'}`} 
                />
              </div>
            </div>

            {/* Stats preview row - only when collapsed */}
            {!expanded && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/30">
                {/* Word count */}
                <div className="flex items-center gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className={wordCount > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                    {wordCount > 0 ? `${wordCount} words` : 'No content'}
                  </span>
                </div>

                <div className="w-px h-3 bg-border/50" />

                {/* Meta title */}
                <div className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${scoreBg(metaTitleQuality.score)}`}>
                  <Hash className={`w-3 h-3 ${scoreColor(metaTitleQuality.score)}`} />
                  <span className={scoreColor(metaTitleQuality.score)}>Title: {metaTitleQuality.label}</span>
                </div>

                {/* Meta desc */}
                <div className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${scoreBg(metaDescQuality.score)}`}>
                  <Sparkles className={`w-3 h-3 ${scoreColor(metaDescQuality.score)}`} />
                  <span className={scoreColor(metaDescQuality.score)}>Desc: {metaDescQuality.label}</span>
                </div>

                {/* Links indicator */}
                {hasLinks && (
                  <>
                    <div className="w-px h-3 bg-border/50" />
                    <div className="flex items-center gap-1 text-xs text-cyan-400">
                      <Link2 className="w-3 h-3" />
                      <span>Links</span>
                    </div>
                  </>
                )}

                {/* SERP Rankings Section */}
                {hasRankings && (
                  <>
                    <div className="w-px h-3 bg-border/50" />
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
                      <div className="flex items-center gap-1">
                        {googlePos !== null && (
                          <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border ${getPositionStyle(googlePos).bg} ${getPositionStyle(googlePos).text}`}>
                            🟢 {googlePos}
                          </span>
                        )}
                        {bingPos !== null && (
                          <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border ${getPositionStyle(bingPos).bg} ${getPositionStyle(bingPos).text}`}>
                            🔵 {bingPos}
                          </span>
                        )}
                        {yahooPos !== null && (
                          <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border ${getPositionStyle(yahooPos).bg} ${getPositionStyle(yahooPos).text}`}>
                            🟣 {yahooPos}
                          </span>
                        )}
                        {duckPos !== null && (
                          <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border ${getPositionStyle(duckPos).bg} ${getPositionStyle(duckPos).text}`}>
                            🟠 {duckPos}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Last edited - pushed right */}
                <div className="ml-auto text-[11px] text-muted-foreground">
                  {formatDate(kw.createdDate)}
                </div>
              </div>
            )}

            {/* Deleted restore button */}
            {deleted && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(String(kw.id));
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Restore Keyword
                </Button>
              </div>
            )}
          </div>

          {/* Expanded Content - simple show/hide, no animation */}
          {expanded && (
            <div 
              className="border-t border-border/30 bg-muted/20"
              style={{ contain: 'layout paint' }}
            >
              <div className="p-6">
                {/* Header with mode toggle */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    {focusModeId === kw.id ? (
                      <>
                        <Eye className="w-4 h-4 text-primary" />
                        Article Editor
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-4 h-4 text-primary" />
                        Edit Keyword Content
                      </>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {focusModeId === kw.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFocusModeId(null);
                        }}
                      >
                        <PanelLeft className="w-3.5 h-3.5 mr-1" />
                        Show Settings
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocusModeId(null);
                        expandKeyword(kw);
                      }}
                    >
                      <ChevronUp className="w-3.5 h-3.5 mr-1" />
                      Collapse
                    </Button>
                  </div>
                </div>

                {/* Content area - conditionally show left panel */}
                <div 
                  className={`grid gap-6 ${focusModeId === kw.id ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}
                  style={{ contain: 'layout' }}
                >
                  {/* Left: Form Fields - hidden in focus mode */}
                  {focusModeId !== kw.id && (
                    <div className="space-y-4">
                      {/* Keyword Info Section */}
                      <div className="p-3 rounded-lg bg-card border border-border/50">
                        <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Keyword Information</h4>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Keyword Title</Label>
                            <Input
                              value={inlineEditForms[kw.id]?.keywordtitle || ''}
                              onChange={(e) => updateInlineForm(kw.id, 'keywordtitle', e.target.value)}
                              placeholder="Primary keyword..."
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground">ID:</span>{' '}
                              <span className="font-mono">{kw.id}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Domain ID:</span>{' '}
                              <span className="font-mono">{kw.domainid}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Status:</span>{' '}
                              <Badge variant={active ? 'default' : 'secondary'} className="text-[10px] ml-1">
                                {active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Created:</span>{' '}
                              <span>{formatDate(kw.createdDate)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SEO Meta Section */}
                      <div className="p-3 rounded-lg bg-card border border-border/50">
                        <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">SEO Meta Tags</h4>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Meta Title</Label>
                            <Input
                              value={inlineEditForms[kw.id]?.metatitle || ''}
                              onChange={(e) => updateInlineForm(kw.id, 'metatitle', e.target.value)}
                              placeholder="Page title for search engines..."
                              onClick={(e) => e.stopPropagation()}
                            />
                            <p className="text-[10px] text-muted-foreground">{(inlineEditForms[kw.id]?.metatitle || '').length}/60 characters</p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Meta Description</Label>
                            <Textarea
                              value={inlineEditForms[kw.id]?.metadescription || ''}
                              onChange={(e) => updateInlineForm(kw.id, 'metadescription', e.target.value)}
                              placeholder="Page description for search results..."
                              rows={3}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <p className="text-[10px] text-muted-foreground">{(inlineEditForms[kw.id]?.metadescription || '').length}/160 characters</p>
                          </div>
                        </div>
                      </div>

                      {/* Links & Resources Section */}
                      <div className="p-3 rounded-lg bg-card border border-border/50">
                        <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Links & Resources</h4>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Target URL (Link Out)</Label>
                            <Input
                              value={inlineEditForms[kw.id]?.linkouturl || ''}
                              onChange={(e) => updateInlineForm(kw.id, 'linkouturl', e.target.value)}
                              placeholder="https://example.com/page"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Resource Address</Label>
                            <Input
                              value={inlineEditForms[kw.id]?.resaddress || ''}
                              onChange={(e) => updateInlineForm(kw.id, 'resaddress', e.target.value)}
                              placeholder="Physical address or location..."
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Facebook Page URL</Label>
                            <Input
                              value={inlineEditForms[kw.id]?.resfb || ''}
                              onChange={(e) => updateInlineForm(kw.id, 'resfb', e.target.value)}
                              placeholder="https://facebook.com/..."
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Content HTML Section */}
                      <div className="p-3 rounded-lg bg-card border border-border/50">
                        <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Content HTML</h4>
                        <Textarea
                          value={inlineEditForms[kw.id]?.resfeedtext || ''}
                          onChange={(e) => updateInlineForm(kw.id, 'resfeedtext', e.target.value)}
                          placeholder="HTML content for this keyword page..."
                          rows={8}
                          className="font-mono text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  )}

                  {/* Right: Article Editor / Live Preview */}
                  <div className="space-y-2" style={{ contain: 'layout' }}>
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        {focusModeId === kw.id ? 'Full Article Editor' : 'Live Preview'}
                      </Label>
                      {focusModeId !== kw.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocusModeId(kw.id);
                          }}
                        >
                          <Maximize2 className="w-3 h-3 mr-1" />
                          Focus Mode
                        </Button>
                      )}
                    </div>

                    {/* Editable article view when in focus mode, read-only preview otherwise */}
                    {focusModeId === kw.id ? (
                      <div className="space-y-4" style={{ contain: 'layout' }}>
                        {/* Editable Title */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Article Title (Meta Title)</Label>
                          <Input
                            value={inlineEditForms[kw.id]?.metatitle || ''}
                            onChange={(e) => updateInlineForm(kw.id, 'metatitle', e.target.value)}
                            className="text-xl font-bold h-auto py-3 bg-white text-black border-primary/30"
                            placeholder="Enter article title..."
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Editable Description */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Article Summary (Meta Description)</Label>
                          <Textarea
                            value={inlineEditForms[kw.id]?.metadescription || ''}
                            onChange={(e) => updateInlineForm(kw.id, 'metadescription', e.target.value)}
                            className="bg-white text-gray-600 italic border-primary/30"
                            rows={2}
                            placeholder="Enter article summary..."
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Full Content Editor */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Article Content (HTML)</Label>
                          <Textarea
                            value={inlineEditForms[kw.id]?.resfeedtext || ''}
                            onChange={(e) => updateInlineForm(kw.id, 'resfeedtext', e.target.value)}
                            className="min-h-[400px] font-mono text-sm bg-white text-black border-primary/30"
                            placeholder="Enter your article HTML content here..."
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Live Preview in focus mode */}
                        <div className="space-y-2 pt-4 border-t border-border/30">
                          <Label className="text-xs text-muted-foreground">Rendered Preview</Label>
                          <div 
                            className="p-6 rounded-lg border border-border bg-white text-black"
                            style={{ fontFamily: 'Georgia, serif' }}
                          >
                            <div className="mb-4 pb-4 border-b border-gray-200">
                              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                {inlineEditForms[kw.id]?.metatitle || 'Page Title'}
                              </h1>
                              <p className="text-sm text-gray-600 italic">
                                {inlineEditForms[kw.id]?.metadescription || 'Meta description will appear here...'}
                              </p>
                            </div>
                            <div 
                              className="prose prose-lg max-w-none"
                              dangerouslySetInnerHTML={{ 
                                __html: inlineEditForms[kw.id]?.resfeedtext || '<p class="text-gray-400">Content preview will appear here...</p>' 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="p-4 rounded-lg border border-border bg-white text-black cursor-pointer hover:border-primary/50"
                        style={{ fontFamily: 'Georgia, serif', contain: 'layout paint' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFocusModeId(kw.id);
                        }}
                        title="Click to expand into full article editor"
                      >
                        {/* Expand hint overlay */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded">
                            Click to expand
                          </span>
                        </div>
                        
                        {/* Preview Header */}
                        <div className="mb-4 pb-4 border-b border-gray-200">
                          <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            {inlineEditForms[kw.id]?.metatitle || 'Page Title'}
                          </h1>
                          <p className="text-sm text-gray-600 italic">
                            {inlineEditForms[kw.id]?.metadescription || 'Meta description will appear here...'}
                          </p>
                        </div>
                        
                        {/* Preview Content */}
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ 
                            __html: inlineEditForms[kw.id]?.resfeedtext || '<p class="text-gray-400">Content preview will appear here...</p>' 
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFocusModeId(null);
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

    </div>
  );
};

export default BRONKeywordsTab;
