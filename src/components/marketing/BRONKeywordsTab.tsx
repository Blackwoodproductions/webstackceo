import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Key, RefreshCw, Plus, Edit2, Trash2, RotateCcw, Check, X, 
  Search, ChevronDown, ChevronRight, ExternalLink, Save,
  FileText, Hash, Calendar, Eye, Minimize2, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

// Group keywords by similar prefixes for nesting (supporting pages)
function groupKeywords(keywords: BronKeyword[]): { parent: BronKeyword; children: BronKeyword[] }[] {
  const sorted = [...keywords].sort((a, b) => {
    const aKey = getKeywordDisplayText(a).toLowerCase();
    const bKey = getKeywordDisplayText(b).toLowerCase();
    return aKey.localeCompare(bKey);
  });

  const groups: { parent: BronKeyword; children: BronKeyword[] }[] = [];
  const used = new Set<number | string>();

  for (const kw of sorted) {
    if (used.has(kw.id)) continue;

    const kwText = getKeywordDisplayText(kw).toLowerCase();
    const children: BronKeyword[] = [];

    // Find variations (e.g., "Cosmetic Dentistry" matches "Best Cosmetic Dentistry", "Cosmetic Dentist")
    for (const other of sorted) {
      if (other.id === kw.id || used.has(other.id)) continue;
      const otherText = getKeywordDisplayText(other).toLowerCase();
      
      // Check if other starts with kw + space (is a variation)
      if (otherText.startsWith(kwText + ' ') && otherText.length > kwText.length) {
        children.push(other);
        used.add(other.id);
      }
    }

    used.add(kw.id);
    groups.push({ parent: kw, children });
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
  const [wysiwygKeyword, setWysiwygKeyword] = useState<BronKeyword | null>(null);
  const [newKeyword, setNewKeyword] = useState("");

  // WYSIWYG editor state
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
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

  const toggleExpand = (id: number | string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  const openWysiwyg = (kw: BronKeyword) => {
    setWysiwygKeyword(kw);
    setEditForm({
      keywordtitle: kw.keywordtitle || kw.keyword || '',
      metatitle: kw.metatitle || '',
      metadescription: kw.metadescription || '',
      resfeedtext: decodeHtmlContent(kw.resfeedtext || ''),
      linkouturl: kw.linkouturl || '',
      resaddress: kw.resaddress || '',
      resfb: kw.resfb || '',
    });
  };

  const saveWysiwygChanges = async () => {
    if (!wysiwygKeyword) return;
    setIsSaving(true);
    try {
      const success = await onUpdate(String(wysiwygKeyword.id), {
        keywordtitle: editForm.keywordtitle || undefined,
        metatitle: editForm.metatitle || undefined,
        metadescription: editForm.metadescription || undefined,
        resfeedtext: editForm.resfeedtext || undefined,
        linkouturl: editForm.linkouturl || undefined,
        resaddress: editForm.resaddress || undefined,
        resfb: editForm.resfb || undefined,
      });
      if (success) {
        setWysiwygKeyword(null);
        setEditForm({});
        onRefresh();
      }
    } finally {
      setIsSaving(false);
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={deleted ? 'opacity-50' : ''}
      >
        {/* Main Row - Click opens editor directly */}
        <div 
          className={`
            flex items-center gap-4 py-3 px-4 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer
            ${isChild ? 'pl-12' : ''}
          `}
          onClick={() => openWysiwyg(kw)}
        >
          {/* Expand icon */}
          <div className="w-6 flex-shrink-0">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-primary" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          {/* Keyword Name */}
          <div className="flex-1 min-w-0">
            <span className={`font-medium ${isChild ? 'text-sm text-muted-foreground' : ''}`}>
              {getKeywordDisplayText(kw)}
            </span>
          </div>

          {/* Status */}
          <div className="w-32 flex-shrink-0">
            <Badge 
              className={`
                text-xs px-3 py-1
                ${active ? 'bg-blue-500/80 hover:bg-blue-500/80 text-white' : 'bg-muted text-muted-foreground'}
              `}
            >
              {deleted ? 'Deleted' : active ? 'Good' : 'Inactive'}
            </Badge>
          </div>

          {/* Last Edited */}
          <div className="w-28 flex-shrink-0 text-sm text-muted-foreground">
            {formatDate(kw.createdDate)}
          </div>

          {/* Action */}
          <div className="w-20 flex-shrink-0 flex justify-end">
            {!deleted ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  openWysiwyg(kw);
                }}
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>
            ) : (
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
              <div className={`py-4 px-4 bg-card/50 border-b border-border/50 space-y-4 ${isChild ? 'pl-12' : ''}`}>
                {/* Minimize Header */}
                <div className="flex items-center justify-between -mt-2 mb-2">
                  <span className="text-xs text-muted-foreground">Keyword Details</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(kw.id);
                    }}
                  >
                    <ChevronUp className="w-3.5 h-3.5 mr-1" />
                    Minimize
                  </Button>
                </div>
                {kw.metadescription && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <FileText className="w-3.5 h-3.5" />
                      Meta Description
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed">
                      {kw.metadescription}
                    </div>
                  </div>
                )}

                {/* Generated Content Preview */}
                {kw.resfeedtext && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Eye className="w-3.5 h-3.5" />
                      Generated Content Preview
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed max-h-48 overflow-y-auto">
                      {stripHtmlTags(kw.resfeedtext).slice(0, 800)}
                      {stripHtmlTags(kw.resfeedtext).length > 800 && '...'}
                    </div>
                  </div>
                )}

                {/* Meta info row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    Domain ID: {kw.domainid}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Active: {active ? 'Yes' : 'No'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Trash2 className="w-3 h-3" />
                    Deleted: {deleted ? 'Yes' : 'No'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(kw.id);
                    }}
                  >
                    <Minimize2 className="w-4 h-4 mr-1" />
                    Collapse
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary/50 hover:border-primary hover:bg-primary/10"
                    onClick={() => openWysiwyg(kw)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit All Fields
                  </Button>
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
      <Card className="border-border/50 bg-card/50 overflow-hidden">
        {/* Table Header - Sticky */}
        <div className="flex items-center gap-4 py-3 px-4 bg-muted/80 backdrop-blur-sm border-b border-border font-medium text-sm text-muted-foreground sticky top-0 z-10">
          <div className="w-6 flex-shrink-0" />
          <div className="flex-1">Keyword</div>
          <div className="w-32 flex-shrink-0">Keywords Status</div>
          <div className="w-28 flex-shrink-0">Last Edited</div>
          <div className="w-20 flex-shrink-0 text-right">Action</div>
        </div>

        {/* Keywords List */}
        <div className="max-h-[600px] overflow-y-auto">
          {groupedKeywords.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? 'No keywords match your search.' : 'No keywords found for this domain.'}
            </div>
          ) : (
            groupedKeywords.map(({ parent, children }) => (
              <div key={parent.id}>
                {renderKeywordRow(parent, false)}
                {children.map(child => renderKeywordRow(child, true))}
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

      {/* WYSIWYG Editor Modal */}
      <Dialog open={!!wysiwygKeyword} onOpenChange={() => setWysiwygKeyword(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Edit Keyword Content
            </DialogTitle>
            <DialogDescription>
              Edit all fields for: {wysiwygKeyword && getKeywordDisplayText(wysiwygKeyword)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4 max-h-[60vh] overflow-y-auto">
            {/* Left: Form Fields */}
            <div className="space-y-4">
              {/* Keyword Info Section */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Keyword Information</h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Keyword Title</Label>
                    <Input
                      value={editForm.keywordtitle || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, keywordtitle: e.target.value }))}
                      placeholder="Primary keyword..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">ID:</span>{' '}
                      <span className="font-mono">{wysiwygKeyword?.id}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Domain ID:</span>{' '}
                      <span className="font-mono">{wysiwygKeyword?.domainid}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{' '}
                      <Badge variant={wysiwygKeyword?.active === 1 ? 'default' : 'secondary'} className="text-[10px] ml-1">
                        {wysiwygKeyword?.active === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>{' '}
                      <span>{formatDate(wysiwygKeyword?.createdDate)}</span>
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
                      value={editForm.metatitle || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, metatitle: e.target.value }))}
                      placeholder="Page title for search engines..."
                    />
                    <p className="text-[10px] text-muted-foreground">{(editForm.metatitle || '').length}/60 characters</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Meta Description</Label>
                    <Textarea
                      value={editForm.metadescription || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, metadescription: e.target.value }))}
                      placeholder="Page description for search results..."
                      rows={3}
                    />
                    <p className="text-[10px] text-muted-foreground">{(editForm.metadescription || '').length}/160 characters</p>
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
                      value={editForm.linkouturl || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, linkouturl: e.target.value }))}
                      placeholder="https://example.com/page"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Resource Address</Label>
                    <Input
                      value={editForm.resaddress || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, resaddress: e.target.value }))}
                      placeholder="Physical address or location..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Facebook Page URL</Label>
                    <Input
                      value={editForm.resfb || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, resfb: e.target.value }))}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Content HTML Section */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Content HTML</h4>
                <Textarea
                  value={editForm.resfeedtext || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, resfeedtext: e.target.value }))}
                  placeholder="HTML content for this keyword page..."
                  rows={8}
                  className="font-mono text-xs"
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
                ref={editorRef}
                className="h-full min-h-[400px] max-h-[500px] overflow-y-auto p-4 rounded-lg border border-border bg-white text-black"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {/* Preview Header */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    {editForm.metatitle || 'Page Title'}
                  </h1>
                  <p className="text-sm text-gray-600 italic">
                    {editForm.metadescription || 'Meta description will appear here...'}
                  </p>
                </div>
                
                {/* Preview Content */}
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: editForm.resfeedtext || '<p class="text-gray-400">Content preview will appear here...</p>' 
                  }}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4">
            <Button variant="outline" onClick={() => setWysiwygKeyword(null)}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={saveWysiwygChanges} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default BRONKeywordsTab;
