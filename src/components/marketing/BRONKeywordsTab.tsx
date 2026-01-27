import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Key, RefreshCw, Plus, Edit2, Trash2, RotateCcw, Check, X, 
  Search, ChevronDown, ChevronRight, ExternalLink, TrendingUp, Save,
  Link2, FileText, Hash, Calendar, Globe, Layers, CornerDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

// Helper to detect nested/related keywords by similar prefixes
function groupKeywords(keywords: BronKeyword[]): { parent: BronKeyword; children: BronKeyword[] }[] {
  const sorted = [...keywords].sort((a, b) => {
    const aKey = (a.keywordtitle || a.keyword || '').toLowerCase();
    const bKey = (b.keywordtitle || b.keyword || '').toLowerCase();
    return aKey.localeCompare(bKey);
  });

  const groups: { parent: BronKeyword; children: BronKeyword[] }[] = [];
  const used = new Set<number | string>();

  for (const kw of sorted) {
    if (used.has(kw.id)) continue;

    const kwText = (kw.keywordtitle || kw.keyword || '').toLowerCase();
    const children: BronKeyword[] = [];

    // Find variations (e.g., "local seo" matches "local seo services", "local seo agency")
    for (const other of sorted) {
      if (other.id === kw.id || used.has(other.id)) continue;
      const otherText = (other.keywordtitle || other.keyword || '').toLowerCase();
      
      // Check if other is a variation of kw (starts with kw + space)
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | string | null>(null);
  
  // Form state for editing
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  
  // Form state for new keyword
  const [newKeyword, setNewKeyword] = useState("");

  // Filter and group keywords
  const filteredKeywords = useMemo(() => {
    if (!searchQuery.trim()) return keywords;
    const q = searchQuery.toLowerCase();
    return keywords.filter(k => 
      (k.keywordtitle || k.keyword || '').toLowerCase().includes(q) ||
      (k.linkouturl || '').toLowerCase().includes(q) ||
      (k.metatitle || '').toLowerCase().includes(q)
    );
  }, [keywords, searchQuery]);

  const groupedKeywords = useMemo(() => groupKeywords(filteredKeywords), [filteredKeywords]);

  const toggleExpand = (id: number | string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (editingId === id) {
          setEditingId(null);
          setEditForm({});
        }
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const startEditing = (kw: BronKeyword) => {
    setEditingId(kw.id);
    setEditForm({
      keywordtitle: kw.keywordtitle || kw.keyword || '',
      linkouturl: kw.linkouturl || '',
      metatitle: kw.metatitle || '',
      metadescription: kw.metadescription || '',
      resaddress: kw.resaddress || '',
      resfb: kw.resfb || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveChanges = async (id: number | string) => {
    setSavingId(id);
    try {
      const success = await onUpdate(String(id), {
        keywordtitle: editForm.keywordtitle || undefined,
        linkouturl: editForm.linkouturl || undefined,
        metatitle: editForm.metatitle || undefined,
        metadescription: editForm.metadescription || undefined,
        resaddress: editForm.resaddress || undefined,
        resfb: editForm.resfb || undefined,
      });
      if (success) {
        setEditingId(null);
        setEditForm({});
        onRefresh();
      }
    } finally {
      setSavingId(null);
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

  // Extract keyword text - try keywordtitle, keyword, or parse from resfeedtext HTML
  const getKeywordText = (kw: BronKeyword) => {
    if (kw.keywordtitle) return kw.keywordtitle;
    if (kw.keyword) return kw.keyword;
    // Try to extract from resfeedtext HTML (first h3 text)
    if (kw.resfeedtext) {
      const match = kw.resfeedtext.match(/<h3[^>]*>([^<]+)<\/h3>/i);
      if (match && match[1]) return match[1].replace(/&#39;/g, "'").replace(/&amp;/g, "&");
    }
    return `Keyword #${kw.id}`;
  };
  const isDeleted = (kw: BronKeyword) => kw.deleted === 1 || kw.is_deleted === true;
  const isActive = (kw: BronKeyword) => kw.active === 1 && !isDeleted(kw);

  const renderKeywordRow = (kw: BronKeyword, isChild = false, parentExpanded = false) => {
    const expanded = expandedIds.has(kw.id);
    const isEditing = editingId === kw.id;
    const isSaving = savingId === kw.id;
    const deleted = isDeleted(kw);
    const active = isActive(kw);

    return (
      <motion.div
        key={kw.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`
          ${isChild ? 'ml-8 border-l-2 border-violet-500/30 pl-4' : ''}
          ${deleted ? 'opacity-50' : ''}
        `}
      >
        <Collapsible open={expanded} onOpenChange={() => toggleExpand(kw.id)}>
          <div className={`
            group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
            ${expanded ? 'bg-violet-500/10 border-violet-500/40' : 'bg-secondary/30 border-border hover:border-violet-500/30 hover:bg-violet-500/5'}
          `}>
            {/* Expand/Collapse */}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                {expanded ? (
                  <ChevronDown className="w-4 h-4 text-violet-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>

            {/* Icon */}
            <div className={`
              w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
              ${isChild 
                ? 'bg-gradient-to-br from-violet-500/10 to-purple-500/10' 
                : 'bg-gradient-to-br from-violet-500/20 to-purple-500/20'
              }
            `}>
              {isChild ? (
                <CornerDownRight className="w-4 h-4 text-violet-400/70" />
              ) : (
                <TrendingUp className="w-4 h-4 text-violet-400" />
              )}
            </div>

            {/* Keyword title */}
            <div className="flex-1 min-w-0" onClick={() => toggleExpand(kw.id)}>
              <div className="flex items-center gap-2">
                <span className={`font-medium truncate ${isChild ? 'text-sm' : ''}`}>
                  {getKeywordText(kw)}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-400 border-violet-500/30">
                  ID: {kw.id}
                </Badge>
                {deleted && (
                  <Badge variant="destructive" className="text-[10px]">Deleted</Badge>
                )}
                {!deleted && (
                  <Badge className={`text-[10px] ${active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {active ? 'Active' : 'Inactive'}
                  </Badge>
                )}
              </div>
              {kw.linkouturl && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {kw.linkouturl}
                </p>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!deleted ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-violet-500/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!expanded) toggleExpand(kw.id);
                      startEditing(kw);
                    }}
                  >
                    <Edit2 className="w-3.5 h-3.5 text-violet-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-destructive/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(String(kw.id));
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 hover:bg-emerald-500/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(String(kw.id));
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                  <span className="text-xs text-emerald-400">Restore</span>
                </Button>
              )}
            </div>
          </div>

          {/* Expanded content - All fields */}
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 p-4 rounded-lg bg-card border border-violet-500/20 space-y-4"
            >
              {/* Field Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Keyword Title */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Key className="w-3 h-3" /> Keyword Title
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editForm.keywordtitle || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, keywordtitle: e.target.value }))}
                      className="h-8 text-sm bg-secondary/50"
                    />
                  ) : (
                    <p className="text-sm font-medium px-3 py-1.5 rounded bg-secondary/50">
                      {getKeywordText(kw)}
                    </p>
                  )}
                </div>

                {/* Link Out URL */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Link2 className="w-3 h-3" /> Link Out URL
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editForm.linkouturl || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, linkouturl: e.target.value }))}
                      placeholder="https://..."
                      className="h-8 text-sm bg-secondary/50"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm px-3 py-1.5 rounded bg-secondary/50 truncate flex-1">
                        {kw.linkouturl || <span className="text-muted-foreground italic">Not set</span>}
                      </p>
                      {kw.linkouturl && (
                        <a href={kw.linkouturl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Meta Title */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> Meta Title
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editForm.metatitle || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, metatitle: e.target.value }))}
                      placeholder="SEO meta title..."
                      className="h-8 text-sm bg-secondary/50"
                    />
                  ) : (
                    <p className="text-sm px-3 py-1.5 rounded bg-secondary/50 truncate">
                      {kw.metatitle || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>

                {/* Res Address */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Globe className="w-3 h-3" /> Resource Address
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editForm.resaddress || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, resaddress: e.target.value }))}
                      placeholder="Resource address..."
                      className="h-8 text-sm bg-secondary/50"
                    />
                  ) : (
                    <p className="text-sm px-3 py-1.5 rounded bg-secondary/50 truncate">
                      {kw.resaddress || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>

                {/* Res FB */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Hash className="w-3 h-3" /> Resource FB
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editForm.resfb || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, resfb: e.target.value }))}
                      placeholder="FB resource..."
                      className="h-8 text-sm bg-secondary/50"
                    />
                  ) : (
                    <p className="text-sm px-3 py-1.5 rounded bg-secondary/50 truncate">
                      {kw.resfb || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>

                {/* Created Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Created Date
                  </Label>
                  <p className="text-sm px-3 py-1.5 rounded bg-secondary/50">
                    {kw.createdDate ? new Date(kw.createdDate).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Meta Description - Full width */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Meta Description
                </Label>
                {isEditing ? (
                  <Textarea
                    value={editForm.metadescription || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, metadescription: e.target.value }))}
                    placeholder="SEO meta description..."
                    className="text-sm bg-secondary/50 min-h-[80px]"
                  />
                ) : (
                  <p className="text-sm px-3 py-2 rounded bg-secondary/50 min-h-[60px]">
                    {kw.metadescription || <span className="text-muted-foreground italic">Not set</span>}
                  </p>
                )}
              </div>

              {/* Content Preview (resfeedtext) - Collapsible */}
              {kw.resfeedtext && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> Generated Content Preview
                  </Label>
                  <div 
                    className="text-sm px-3 py-2 rounded bg-secondary/50 max-h-[200px] overflow-y-auto prose prose-sm prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: kw.resfeedtext
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&#39;/g, "'")
                        .replace(/&amp;/g, '&')
                    }}
                  />
                </div>
              )}

              {/* Read-only metadata */}
              <Separator className="bg-border/50" />
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Domain ID: {kw.domainid || 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Active: {kw.active === 1 ? 'Yes' : 'No'}
                </span>
                <span className="flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Deleted: {kw.deleted === 1 ? 'Yes' : 'No'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveChanges(kw.id)}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-violet-500 to-purple-500"
                    >
                      {isSaving ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditing(kw)}
                    className="border-violet-500/30 hover:bg-violet-500/10"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit All Fields
                  </Button>
                )}
              </div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-violet-500/20 bg-gradient-to-br from-background to-violet-500/5">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="w-5 h-5 text-violet-400" />
              Keywords
              {selectedDomain && (
                <Badge variant="secondary" className="text-xs ml-2">{selectedDomain}</Badge>
              )}
              <Badge variant="outline" className="text-xs ml-1 bg-violet-500/10 text-violet-400">
                {keywords.length} total
              </Badge>
            </CardTitle>
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
              onClick={() => setShowAddModal(true)}
              className="border-violet-500/30 hover:bg-violet-500/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isLoading}
              className="border-violet-500/30 hover:bg-violet-500/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && keywords.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : groupedKeywords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No keywords found</p>
              <p className="text-sm mt-1">Add keywords to start tracking</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAddModal(true)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Keyword
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {groupedKeywords.map(({ parent, children }) => (
                  <div key={parent.id} className="space-y-1">
                    {/* Parent keyword */}
                    {renderKeywordRow(parent, false)}
                    
                    {/* Child/nested keywords */}
                    {children.length > 0 && (
                      <div className="space-y-1">
                        {children.map(child => renderKeywordRow(child, true, expandedIds.has(parent.id)))}
                      </div>
                    )}
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Keyword Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add New Keyword</DialogTitle>
            <DialogDescription>
              Add a keyword to track rankings and link placements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-keyword">Keyword *</Label>
              <Input
                id="new-keyword"
                placeholder="e.g., best local seo services"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button 
              onClick={handleAddKeyword}
              disabled={!newKeyword.trim()}
              className="bg-gradient-to-r from-violet-500 to-purple-500"
            >
              Add Keyword
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Keyword?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this keyword? 
              This is a soft delete and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};
