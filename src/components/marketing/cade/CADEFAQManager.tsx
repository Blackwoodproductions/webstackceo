import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle, Search, RefreshCw, Edit3, Trash2, Save, X,
  Loader2, Plus, Wand2, Check, ChevronDown, ChevronRight
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

interface FAQItem {
  id?: string;
  faq_id?: string;
  question?: string;
  answer?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  category?: string;
}

interface CADEFAQManagerProps {
  domain?: string;
  initialFaqs?: FAQItem[];
  onRefresh?: () => void;
}

export const CADEFAQManager = ({ domain, initialFaqs = [], onRefresh }: CADEFAQManagerProps) => {
  const [faqs, setFaqs] = useState<FAQItem[]>(initialFaqs);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ question: "", answer: "" });
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete state
  const [deleteItem, setDeleteItem] = useState<FAQItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Add new FAQ state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [isAdding, setIsAdding] = useState(false);
  
  // Generate FAQs state
  const [isGenerating, setIsGenerating] = useState(false);

  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain, params },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  }, [domain]);

  const fetchFaqs = useCallback(async () => {
    if (!domain) return;
    setIsLoading(true);
    try {
      const result = await callCadeApi("get-faqs");
      const items = result?.data || result?.faqs || result || [];
      setFaqs(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("[CADE FAQ] Fetch error:", err);
      toast.error("Failed to load FAQs");
    } finally {
      setIsLoading(false);
    }
  }, [callCadeApi, domain]);

  // Sync initial FAQs
  useEffect(() => {
    if (initialFaqs.length > 0) {
      setFaqs(initialFaqs);
    } else if (domain) {
      fetchFaqs();
    }
  }, [domain, initialFaqs, fetchFaqs]);

  const handleRefresh = () => {
    fetchFaqs();
    onRefresh?.();
  };

  const filteredFaqs = useMemo(() => {
    return faqs.filter(item =>
      (item.question || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.answer || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [faqs, searchQuery]);

  const startEdit = (item: FAQItem) => {
    const id = item.faq_id || item.id || "";
    setEditingId(id);
    setEditForm({
      question: item.question || "",
      answer: item.answer || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ question: "", answer: "" });
  };

  const handleSaveEdit = async (item: FAQItem) => {
    setIsSaving(true);
    try {
      const faqId = item.faq_id || item.id;
      await callCadeApi("update-faq", {
        faq_id: faqId,
        question: editForm.question,
        answer: editForm.answer,
      });
      toast.success("FAQ updated successfully");
      setEditingId(null);
      fetchFaqs();
    } catch (err) {
      console.error("[CADE FAQ] Update error:", err);
      toast.error("Failed to update FAQ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const faqId = deleteItem.faq_id || deleteItem.id;
      await callCadeApi("delete-faq", { faq_id: faqId });
      toast.success("FAQ deleted");
      setDeleteItem(null);
      fetchFaqs();
    } catch (err) {
      console.error("[CADE FAQ] Delete error:", err);
      toast.error("Failed to delete FAQ");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast.error("Please fill in both question and answer");
      return;
    }
    setIsAdding(true);
    try {
      // Note: The CADE API may not have a direct "add single FAQ" endpoint
      // This uses generate-faq with a specific question
      await callCadeApi("generate-faq", {
        questions: [newFaq.question],
        custom_answer: newFaq.answer,
      });
      toast.success("FAQ added successfully");
      setShowAddDialog(false);
      setNewFaq({ question: "", answer: "" });
      fetchFaqs();
    } catch (err) {
      console.error("[CADE FAQ] Add error:", err);
      toast.error("Failed to add FAQ");
    } finally {
      setIsAdding(false);
    }
  };

  const handleGenerateFaqs = async () => {
    setIsGenerating(true);
    try {
      await callCadeApi("generate-faq", {
        count: 5, // Generate 5 FAQs
      });
      toast.success("FAQ generation started! New FAQs will appear shortly.");
      setTimeout(fetchFaqs, 3000);
    } catch (err) {
      console.error("[CADE FAQ] Generate error:", err);
      toast.error("Failed to generate FAQs");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!domain) {
    return (
      <Card className="border-violet-500/20">
        <CardContent className="py-12 text-center text-muted-foreground">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Select a domain to manage FAQs</p>
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
              <HelpCircle className="w-5 h-5 text-violet-400" />
              FAQ Manager
              <Badge variant="secondary" className="text-xs ml-2">
                {faqs.length} FAQs
              </Badge>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48 h-9 bg-secondary/50"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="gap-2 border-violet-500/30 hover:bg-violet-500/10"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateFaqs}
              disabled={isGenerating}
              className="gap-2 border-violet-500/30 hover:bg-violet-500/10"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
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
          {isLoading && faqs.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No FAQs found</p>
              <p className="text-sm mt-1">Generate FAQs automatically or add them manually</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddDialog(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Manually
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateFaqs}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  Auto-Generate
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredFaqs.map((item, index) => {
                  const itemId = item.faq_id || item.id || `faq-${index}`;
                  const isEditing = editingId === itemId;
                  
                  return (
                    <motion.div
                      key={itemId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="rounded-xl bg-gradient-to-br from-violet-500/5 to-purple-500/10 border border-violet-500/20 p-4"
                    >
                      {isEditing ? (
                        // Inline Edit Mode
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Question</Label>
                            <Input
                              value={editForm.question}
                              onChange={(e) => setEditForm(f => ({ ...f, question: e.target.value }))}
                              className="bg-background"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Answer</Label>
                            <Textarea
                              value={editForm.answer}
                              onChange={(e) => setEditForm(f => ({ ...f, answer: e.target.value }))}
                              className="bg-background min-h-[100px]"
                            />
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(item)}
                              disabled={isSaving}
                              className="bg-violet-500 hover:bg-violet-600"
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4 mr-1" />
                              )}
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-medium text-sm flex items-start gap-2">
                                <HelpCircle className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                                {item.question}
                              </p>
                              <p className="text-sm text-muted-foreground mt-2 pl-6">
                                {item.answer}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(item)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteItem(item)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {item.category && (
                            <Badge variant="outline" className="mt-2 ml-6 text-xs">
                              {item.category}
                            </Badge>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add FAQ Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-violet-500" />
              Add New FAQ
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-question">Question</Label>
              <Input
                id="new-question"
                value={newFaq.question}
                onChange={(e) => setNewFaq(f => ({ ...f, question: e.target.value }))}
                placeholder="What is your question?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-answer">Answer</Label>
              <Textarea
                id="new-answer"
                value={newFaq.answer}
                onChange={(e) => setNewFaq(f => ({ ...f, answer: e.target.value }))}
                placeholder="Provide a helpful answer..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddFaq}
              disabled={isAdding || !newFaq.question.trim() || !newFaq.answer.trim()}
              className="bg-violet-500 hover:bg-violet-600"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add FAQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
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
    </>
  );
};

export default CADEFAQManager;
