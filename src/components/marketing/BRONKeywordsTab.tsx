import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Key, RefreshCw, Plus, Edit2, Trash2, RotateCcw, Check, X, 
  Search, MoreVertical, ExternalLink, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
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
  const [editingKeyword, setEditingKeyword] = useState<BronKeyword | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Form state
  const [formKeyword, setFormKeyword] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formAnchor, setFormAnchor] = useState("");

  const filteredKeywords = keywords.filter(k => 
    k.keyword?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddKeyword = async () => {
    if (!formKeyword.trim()) return;
    
    const success = await onAdd({
      keyword: formKeyword.trim(),
      url: formUrl.trim() || undefined,
      anchor_text: formAnchor.trim() || undefined,
      domain: selectedDomain,
    });
    
    if (success) {
      setShowAddModal(false);
      resetForm();
      onRefresh();
    }
  };

  const handleUpdateKeyword = async () => {
    if (!editingKeyword || !formKeyword.trim()) return;
    
    const success = await onUpdate(editingKeyword.id, {
      keyword: formKeyword.trim(),
      url: formUrl.trim() || undefined,
      anchor_text: formAnchor.trim() || undefined,
    });
    
    if (success) {
      setEditingKeyword(null);
      resetForm();
      onRefresh();
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    await onDelete(id);
    setDeleteConfirm(null);
    onRefresh();
  };

  const openEditModal = (keyword: BronKeyword) => {
    setEditingKeyword(keyword);
    setFormKeyword(keyword.keyword || "");
    setFormUrl(keyword.url || "");
    setFormAnchor(keyword.anchor_text || "");
  };

  const resetForm = () => {
    setFormKeyword("");
    setFormUrl("");
    setFormAnchor("");
  };

  const closeModals = () => {
    setShowAddModal(false);
    setEditingKeyword(null);
    resetForm();
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
              Add Keyword
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
          ) : filteredKeywords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No keywords found</p>
              <p className="text-sm mt-1">Add keywords to start tracking rankings</p>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Keyword</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">URL</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Anchor</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeywords.map((keyword, index) => (
                    <motion.tr
                      key={keyword.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`group border-b border-border/50 hover:bg-violet-500/5 transition-colors
                        ${keyword.is_deleted ? 'opacity-50' : ''}`}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-violet-400" />
                          </div>
                          <span className="font-medium">{keyword.keyword}</span>
                          {keyword.is_deleted && (
                            <Badge variant="destructive" className="text-xs">Deleted</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        {keyword.url ? (
                          <a 
                            href={keyword.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-violet-400 flex items-center gap-1"
                          >
                            {keyword.url.length > 40 ? `${keyword.url.substring(0, 40)}...` : keyword.url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="text-sm text-muted-foreground">
                          {keyword.anchor_text || "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            keyword.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                            keyword.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-secondary'
                          }`}
                        >
                          {keyword.status || 'active'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!keyword.is_deleted ? (
                              <>
                                <DropdownMenuItem onClick={() => openEditModal(keyword)}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit Keyword
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeleteConfirm(keyword.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Keyword
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem onClick={() => onRestore(keyword.id)}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Restore Keyword
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Keyword Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Keyword</DialogTitle>
            <DialogDescription>
              Add a keyword to track rankings and link placements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Keyword *</Label>
              <Input
                id="keyword"
                placeholder="e.g., best seo tools"
                value={formKeyword}
                onChange={(e) => setFormKeyword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Target URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/page"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anchor">Anchor Text</Label>
              <Input
                id="anchor"
                placeholder="Preferred anchor text"
                value={formAnchor}
                onChange={(e) => setFormAnchor(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModals}>Cancel</Button>
            <Button 
              onClick={handleAddKeyword}
              disabled={!formKeyword.trim()}
              className="bg-gradient-to-r from-violet-500 to-purple-500"
            >
              Add Keyword
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Keyword Modal */}
      <Dialog open={!!editingKeyword} onOpenChange={() => setEditingKeyword(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Keyword</DialogTitle>
            <DialogDescription>
              Update the keyword details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-keyword">Keyword *</Label>
              <Input
                id="edit-keyword"
                value={formKeyword}
                onChange={(e) => setFormKeyword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-url">Target URL</Label>
              <Input
                id="edit-url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-anchor">Anchor Text</Label>
              <Input
                id="edit-anchor"
                value={formAnchor}
                onChange={(e) => setFormAnchor(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModals}>Cancel</Button>
            <Button 
              onClick={handleUpdateKeyword}
              disabled={!formKeyword.trim()}
              className="bg-gradient-to-r from-violet-500 to-purple-500"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
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
              onClick={() => deleteConfirm && handleDeleteKeyword(deleteConfirm)}
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
