import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Key, RefreshCw, Plus, Edit2, Trash2, RotateCcw, X, 
  Search, ChevronDown, ChevronRight, Save,
  Eye, Minimize2, ChevronUp
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
import { BronKeyword } from "@/hooks/use-bron-api";

interface BRONKeywordsTabProps {
  keywords: BronKeyword[];
  selectedDomain?: string;
  isLoading: boolean;
  onRefresh: () => void;
  onAdd: (data: Record<string, unknown>) => Promise<boolean>;
  onUpdate: (keywordId: string, data: Record<string, unknown>) => Promise<boolean>;
  onDelete: (keywordId: string) => Promise<boolean>;
  onRestore: (keywordId: string) => Promise<boolean>;
}

// Extract core topic from keyword (e.g., "Best Dentist in Port Coquitlam" -> "dentist")
function extractCoreTopic(text: string): string {
  const lower = text.toLowerCase();
  // Remove common location patterns
  const withoutLocation = lower
    .replace(/\s+(in|port|coquitlam|vancouver|bc|british columbia)\b/gi, '')
    .replace(/\s+:\s+.*/g, '') // Remove everything after colon
    .trim();
  
  // Extract core topic keywords
  const coreTopics = [
    'dentist', 'dental', 'cosmetic dentistry', 'emergency dental', 
    'dental implants', 'dental bridges', 'teeth whitening', 'invisalign',
    'family dentist', 'cdcp insurance', 'molar extraction'
  ];
  
  for (const topic of coreTopics) {
    if (withoutLocation.includes(topic)) {
      return topic;
    }
  }
  
  // Fallback: extract first significant words
  const words = withoutLocation.split(/\s+/).filter(w => 
    !['best', 'top', 'rated', 'affordable', 'trusted', 'local', 'expert', 'professional', '&', 'and', 'the', 'a'].includes(w)
  );
  return words.slice(0, 2).join(' ') || withoutLocation;
}

// Group keywords by topic similarity
function groupKeywords(keywords: BronKeyword[]): { parent: BronKeyword; children: BronKeyword[] }[] {
  if (keywords.length === 0) return [];
  
  // Create topic groups
  const topicGroups: Map<string, BronKeyword[]> = new Map();
  
  for (const kw of keywords) {
    const text = getKeywordDisplayText(kw);
    const topic = extractCoreTopic(text);
    
    if (!topicGroups.has(topic)) {
      topicGroups.set(topic, []);
    }
    topicGroups.get(topic)!.push(kw);
  }
  
  const groups: { parent: BronKeyword; children: BronKeyword[] }[] = [];
  
  for (const [, kwList] of topicGroups) {
    // Sort by keyword length (shortest first - likely the main keyword)
    const sorted = [...kwList].sort((a, b) => {
      const aLen = getKeywordDisplayText(a).length;
      const bLen = getKeywordDisplayText(b).length;
      return aLen - bLen;
    });
    
    const [parent, ...children] = sorted;
    groups.push({ parent, children });
  }
  
  // Sort groups alphabetically by parent keyword
  groups.sort((a, b) => 
    getKeywordDisplayText(a.parent).localeCompare(getKeywordDisplayText(b.parent))
  );
  
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

export const BRONKeywordsTab = ({
  keywords,
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

  // Render a keyword row
  const renderKeywordRow = (kw: BronKeyword, isChild = false) => {
    const expanded = expandedIds.has(kw.id);
    const deleted = isDeleted(kw);
    const active = isActive(kw);

    return (
      <motion.div
        key={kw.id}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className={deleted ? 'opacity-50' : ''}
      >
        {/* Main Row */}
        <div 
          className={`
            flex items-center py-4 px-6 transition-colors cursor-pointer group
            ${isChild 
              ? 'pl-16 bg-card/30 border-l-2 border-l-border/30 hover:border-l-primary/30' 
              : 'bg-card/60 hover:bg-card/80'
            }
            ${expanded ? 'bg-primary/5 border-l-primary' : ''}
            border-b border-border/30
          `}
          onClick={() => expandKeyword(kw)}
        >
          {/* Expand icon */}
          <div className="w-8 flex-shrink-0">
            <ChevronRight 
              className={`w-5 h-5 transition-transform duration-200 ${
                expanded ? 'rotate-90 text-primary' : 'text-muted-foreground group-hover:text-foreground'
              }`}
            />
          </div>

          {/* Keyword Name */}
          <div className="flex-1 min-w-0">
            <span className={`
              ${isChild 
                ? 'text-[15px] text-muted-foreground group-hover:text-foreground transition-colors' 
                : 'text-base font-medium text-foreground'
              }
            `}>
              {getKeywordDisplayText(kw)}
            </span>
          </div>

          {/* Status - only show for parent rows or on hover for children */}
          <div className={`w-24 flex-shrink-0 ${isChild ? 'opacity-0 group-hover:opacity-100 transition-opacity' : ''}`}>
            {!isChild && (
              <Badge 
                className={`
                  text-xs px-3 py-1 rounded-full
                  ${active 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-muted/50 text-muted-foreground border border-border/50'
                  }
                `}
              >
                {deleted ? 'Deleted' : active ? 'Good' : 'Inactive'}
              </Badge>
            )}
          </div>

          {/* Last Edited - only show for parent rows */}
          <div className={`w-28 flex-shrink-0 text-sm text-muted-foreground ${isChild ? 'hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity' : ''}`}>
            {!isChild && formatDate(kw.createdDate)}
          </div>

          {/* Action */}
          <div className="w-16 flex-shrink-0 flex justify-end">
            {!deleted && (
              <span className={`
                text-sm flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors
                ${isChild ? 'opacity-0 group-hover:opacity-100' : ''}
              `}>
                <Edit2 className="w-4 h-4" />
                {!isChild && 'Edit'}
              </span>
            )}
            {deleted && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-emerald-400 hover:text-emerald-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore(String(kw.id));
                }}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Restore
              </Button>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={`py-6 px-4 bg-card/50 border-b border-border/50 ${isChild ? 'pl-12' : ''}`}>
                {/* Minimize Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-foreground">Edit Keyword Content</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      expandKeyword(kw);
                    }}
                  >
                    <ChevronUp className="w-3.5 h-3.5 mr-1" />
                    Minimize
                  </Button>
                </div>

                {/* Two Column Layout: Editor + Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Form Fields */}
                  <div className="space-y-4">
                    {/* Keyword Info Section */}
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
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
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
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
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
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
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
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

                  {/* Right: Live Preview */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Live Preview
                    </Label>
                    <div 
                      className="p-4 rounded-lg border border-border bg-white text-black"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
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
                      expandKeyword(kw);
                    }}
                  >
                    <Minimize2 className="w-4 h-4 mr-1" />
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (isLoading && keywords.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
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

      {/* Keywords Table */}
      <Card className="border-border/50 bg-card/30 overflow-hidden rounded-xl">
        {/* Table Header */}
        <div className="flex items-center py-4 px-6 bg-muted/50 border-b border-border/50 font-medium text-sm text-muted-foreground sticky top-0 z-10">
          <div className="w-8 flex-shrink-0" />
          <div className="flex-1">Keyword</div>
          <div className="w-24 flex-shrink-0 hidden sm:block">Status</div>
          <div className="w-28 flex-shrink-0 hidden lg:block">Last Edited</div>
          <div className="w-16 flex-shrink-0 text-right">Action</div>
        </div>

        {/* Keywords List */}
        <div>
          {groupedKeywords.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">
                {searchQuery ? 'No keywords match your search.' : 'No keywords found for this domain.'}
              </p>
            </div>
          ) : (
            groupedKeywords.map(({ parent, children }) => (
              <div key={parent.id} className="group/parent">
                {renderKeywordRow(parent, false)}
                {children.length > 0 && (
                  <div className="bg-card/20">
                    {children.map(child => renderKeywordRow(child, true))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

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

    </motion.div>
  );
};

export default BRONKeywordsTab;
