import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Search, RefreshCw, Edit3, Trash2, Eye, Save, X,
  ChevronDown, ChevronRight, Loader2, ExternalLink, Plus, Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ContentItem {
  id?: string;
  content_id?: string;
  title?: string;
  content?: string;
  status?: string;
  type?: string;
  keyword?: string;
  created_at?: string;
  updated_at?: string;
  word_count?: number;
  url?: string;
}

interface CADEContentManagerProps {
  domain?: string;
  onRefresh?: () => void;
}

export const CADEContentManager = ({ domain, onRefresh }: CADEContentManagerProps) => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Edit state
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete state
  const [deleteItem, setDeleteItem] = useState<ContentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Generate state
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateKeyword, setGenerateKeyword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain, params },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  }, [domain]);

  const fetchContent = useCallback(async () => {
    if (!domain) return;
    setIsLoading(true);
    try {
      // Note: CADE API doesn't have a list-content endpoint
      // Content is generated and published directly to platforms
      // For now, show placeholder - in future could fetch from crawl status
      const result = await callCadeApi("domain-context");
      if (result?.data) {
        // Use domain context to show some info
        setContent([]);
      }
    } catch (err: unknown) {
      console.error("[CADE Content] Fetch error:", err);
      // Silently handle - domain may not be crawled yet
      setContent([]);
    } finally {
      setIsLoading(false);
    }
  }, [callCadeApi, domain]);

  // Initial load
  useEffect(() => {
    if (domain) fetchContent();
  }, [domain, fetchContent]);

  const handleRefresh = () => {
    fetchContent();
    onRefresh?.();
  };

  const filteredContent = useMemo(() => {
    return content.filter(item =>
      (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.keyword || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [content, searchQuery]);

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item);
    setEditForm({
      title: item.title || "",
      content: item.content || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const contentId = editingItem.content_id || editingItem.id;
      await callCadeApi("update-content", {
        content_id: contentId,
        title: editForm.title,
        content: editForm.content,
      });
      toast.success("Content updated successfully");
      setEditingItem(null);
      fetchContent();
    } catch (err) {
      console.error("[CADE Content] Update error:", err);
      toast.error("Failed to update content");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const contentId = deleteItem.content_id || deleteItem.id;
      await callCadeApi("delete-content", { content_id: contentId });
      toast.success("Content deleted");
      setDeleteItem(null);
      fetchContent();
    } catch (err) {
      console.error("[CADE Content] Delete error:", err);
      toast.error("Failed to delete content");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerate = async () => {
    if (!generateKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }
    setIsGenerating(true);
    try {
      await callCadeApi("generate-content", {
        keyword: generateKeyword.trim(),
        content_type: "blog",
        platform: "wordpress", // Required by CADE API
        model_tier: "standard",
        auto_publish: false,
      });
      toast.success("Content generation started! It may take a few minutes.");
      setShowGenerate(false);
      setGenerateKeyword("");
      // Refresh after a delay to show new content
      setTimeout(fetchContent, 5000);
    } catch (err: unknown) {
      console.error("[CADE Content] Generate error:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to start content generation";
      if (errMsg.includes("not found") || errMsg.includes("crawl")) {
        toast.error("Please crawl the domain first before generating content");
      } else {
        toast.error(errMsg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "published":
      case "complete":
        return "bg-green-500/15 text-green-600 border-green-500/30";
      case "draft":
      case "pending":
        return "bg-amber-500/15 text-amber-600 border-amber-500/30";
      case "processing":
      case "generating":
        return "bg-blue-500/15 text-blue-600 border-blue-500/30";
      case "failed":
      case "error":
        return "bg-red-500/15 text-red-600 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (!domain) {
    return (
      <Card className="border-violet-500/20">
        <CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Select a domain to manage content</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-violet-500/20 bg-gradient-to-br from-background to-violet-500/5">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-violet-400" />
              Content Manager
              <Badge variant="secondary" className="text-xs ml-2">
                {content.length} items
              </Badge>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48 h-9 bg-secondary/50"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGenerate(true)}
              className="gap-2 border-violet-500/30 hover:bg-violet-500/10"
            >
              <Wand2 className="w-4 h-4" />
              Generate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-violet-500/30 hover:bg-violet-500/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && content.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No content found</p>
              <p className="text-sm mt-1">Generate new content or wait for content to be created</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGenerate(true)}
                className="mt-4 gap-2"
              >
                <Plus className="w-4 h-4" />
                Generate New Content
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredContent.map((item, index) => {
                  const itemId = item.content_id || item.id || `item-${index}`;
                  const isExpanded = expandedId === itemId;
                  
                  return (
                    <motion.div
                      key={itemId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="rounded-lg border bg-secondary/30 border-border overflow-hidden"
                    >
                      {/* Row Header */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : itemId)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{item.title || "Untitled"}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {item.keyword && (
                                <Badge variant="outline" className="text-xs">
                                  {item.keyword}
                                </Badge>
                              )}
                              {item.status && (
                                <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                                  {item.status}
                                </Badge>
                              )}
                              {item.word_count && (
                                <span className="text-xs text-muted-foreground">
                                  {item.word_count} words
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteItem(item);
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border"
                          >
                            <div className="p-4 bg-background/50">
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <div
                                  className="text-sm text-muted-foreground max-h-48 overflow-y-auto"
                                  dangerouslySetInnerHTML={{
                                    __html: item.content?.substring(0, 1000) || "No content preview available"
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                                {item.url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(item.url, "_blank")}
                                    className="gap-2"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    View Live
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(item)}
                                  className="gap-2"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Edit Content
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Content title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editForm.content}
                onChange={(e) => setEditForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Content body..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-violet-500" />
              Generate New Content
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
              <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">Requirements:</p>
              <ul className="text-muted-foreground text-xs space-y-1 list-disc list-inside">
                <li>Domain must be crawled first (use Crawl tab)</li>
                <li>Platform must be connected for publishing</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gen-keyword">Target Keyword</Label>
              <Input
                id="gen-keyword"
                value={generateKeyword}
                onChange={(e) => setGenerateKeyword(e.target.value)}
                placeholder="e.g., best seo tools 2024"
              />
              <p className="text-xs text-muted-foreground">
                CADE will analyze top-ranking content and generate an optimized article for this keyword.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !generateKeyword.trim()}
              className="bg-gradient-to-r from-violet-500 to-purple-600"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Generate Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CADEContentManager;
