import { useState, useCallback, memo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle, Edit3, Trash2, Save, X, Check, Loader2, 
  ChevronDown, ChevronUp, MoreHorizontal, Copy, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface FAQItem {
  id?: string;
  faq_id?: string;
  question?: string;
  answer?: string;
  status?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

interface CADEInlineFAQEditorProps {
  item: FAQItem;
  domain?: string;
  onUpdate?: (item: FAQItem) => void;
  onDelete?: (id: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const statusColors: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  draft: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  processing: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
};

export const CADEInlineFAQEditor = memo(({
  item,
  domain,
  onUpdate,
  onDelete,
  isExpanded = false,
  onToggleExpand,
}: CADEInlineFAQEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit form state
  const [editQuestion, setEditQuestion] = useState(item.question || "");
  const [editAnswer, setEditAnswer] = useState(item.answer || "");
  
  // Refs for auto-focus
  const questionInputRef = useRef<HTMLInputElement>(null);

  // Update form when item changes
  useEffect(() => {
    if (!isEditing) {
      setEditQuestion(item.question || "");
      setEditAnswer(item.answer || "");
    }
  }, [item, isEditing]);

  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain, params },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(typeof data.error === 'object' ? data.error.message : data.error);
    return data;
  }, [domain]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setTimeout(() => questionInputRef.current?.focus(), 100);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditQuestion(item.question || "");
    setEditAnswer(item.answer || "");
  };

  const handleSave = async () => {
    if (!editQuestion.trim()) {
      toast.error("Question is required");
      return;
    }
    if (!editAnswer.trim()) {
      toast.error("Answer is required");
      return;
    }
    
    setIsSaving(true);
    try {
      const faqId = item.faq_id || item.id;
      await callCadeApi("update-faq", {
        faq_id: faqId,
        question: editQuestion.trim(),
        answer: editAnswer.trim(),
      });
      
      // Update local state
      const updatedItem = { ...item, question: editQuestion.trim(), answer: editAnswer.trim() };
      onUpdate?.(updatedItem);
      
      setIsEditing(false);
      toast.success("FAQ saved!");
    } catch (err) {
      console.error("[CADE] FAQ save error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save FAQ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const faqId = item.faq_id || item.id;
      await callCadeApi("delete-faq", { faq_id: faqId });
      
      onDelete?.(faqId || "");
      setShowDeleteConfirm(false);
      toast.success("FAQ deleted");
    } catch (err) {
      console.error("[CADE] FAQ delete error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete FAQ");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyQA = () => {
    const text = `Q: ${item.question}\n\nA: ${item.answer}`;
    navigator.clipboard.writeText(text);
    toast.success("Q&A copied to clipboard");
  };

  const itemId = item.faq_id || item.id || "unknown";
  const statusClass = statusColors[item.status?.toLowerCase() || "active"] || statusColors.active;

  return (
    <>
      <motion.div
        layout
        className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${
          isEditing 
            ? "border-violet-500/50 bg-gradient-to-br from-violet-500/5 to-cyan-500/5 shadow-[0_0_20px_rgba(139,92,246,0.15)]" 
            : "border-border/50 bg-card/30 hover:border-border hover:bg-card/50"
        }`}
      >
        {/* Header Row - Always Visible */}
        <div 
          className={`flex items-start gap-3 p-3 ${!isEditing && onToggleExpand ? "cursor-pointer" : ""}`}
          onClick={!isEditing ? onToggleExpand : undefined}
        >
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <HelpCircle className="w-4 h-4 text-violet-400" />
          </div>
          
          {/* Question */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                ref={questionInputRef}
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                placeholder="Enter the question..."
                className="h-8 text-sm font-medium bg-background/50 border-border/50"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="font-medium text-sm line-clamp-2">{item.question || "No question"}</p>
            )}
          </div>
          
          {/* Meta badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`${statusClass} text-[10px] px-1.5 py-0`}>
              {item.status || "active"}
            </Badge>
            {item.category && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {item.category}
              </Badge>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  disabled={isSaving}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleSave(); }}
                  className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-violet-400"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={handleCopyQA}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Q&A
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-400 focus:text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {onToggleExpand && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Expanded Answer Area */}
        <AnimatePresence>
          {(isExpanded || isEditing) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-0 pl-10">
                {/* Answer */}
                {isEditing ? (
                  <Textarea
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    placeholder="Write the answer here..."
                    className="min-h-[120px] text-sm bg-background/50 border-border/50 resize-y"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {item.answer || <span className="italic opacity-50">No answer yet</span>}
                  </div>
                )}
                
                {/* Footer meta */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30 text-[10px] text-muted-foreground">
                  <span>ID: {itemId.substring(0, 8)}...</span>
                  {item.created_at && (
                    <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

CADEInlineFAQEditor.displayName = "CADEInlineFAQEditor";

export default CADEInlineFAQEditor;
