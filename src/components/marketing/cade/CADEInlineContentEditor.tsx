import { useState, useCallback, memo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Edit3, Trash2, Save, X, Check, Loader2, Eye, 
  ChevronDown, ChevronUp, Wand2, Copy, ExternalLink, MoreHorizontal
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

export interface ContentItem {
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

interface CADEInlineContentEditorProps {
  item: ContentItem;
  domain?: string;
  onUpdate?: (item: ContentItem) => void;
  onDelete?: (id: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const statusColors: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  complete: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  draft: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  processing: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  generating: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
};

export const CADEInlineContentEditor = memo(({
  item,
  domain,
  onUpdate,
  onDelete,
  isExpanded = false,
  onToggleExpand,
}: CADEInlineContentEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState(item.title || "");
  const [editContent, setEditContent] = useState(item.content || "");
  
  // Refs for auto-focus
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Update form when item changes
  useEffect(() => {
    if (!isEditing) {
      setEditTitle(item.title || "");
      setEditContent(item.content || "");
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
    setTimeout(() => titleInputRef.current?.focus(), 100);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(item.title || "");
    setEditContent(item.content || "");
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    
    setIsSaving(true);
    try {
      const contentId = item.content_id || item.id;
      await callCadeApi("update-content", {
        content_id: contentId,
        title: editTitle.trim(),
        content: editContent,
      });
      
      // Update local state
      const updatedItem = { ...item, title: editTitle.trim(), content: editContent };
      onUpdate?.(updatedItem);
      
      setIsEditing(false);
      toast.success("Content saved!");
    } catch (err) {
      console.error("[CADE] Save error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const contentId = item.content_id || item.id;
      await callCadeApi("delete-content", { content_id: contentId });
      
      onDelete?.(contentId || "");
      setShowDeleteConfirm(false);
      toast.success("Content deleted");
    } catch (err) {
      console.error("[CADE] Delete error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(item.content || "");
    toast.success("Content copied to clipboard");
  };

  const itemId = item.content_id || item.id || "unknown";
  const statusClass = statusColors[item.status?.toLowerCase() || "draft"] || statusColors.draft;
  const wordCount = item.word_count || (item.content?.split(/\s+/).filter(Boolean).length || 0);

  return (
    <>
      <motion.div
        layout
        className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${
          isEditing 
            ? "border-cyan-500/50 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 shadow-[0_0_20px_rgba(6,182,212,0.15)]" 
            : "border-border/50 bg-card/30 hover:border-border hover:bg-card/50"
        }`}
      >
        {/* Header Row - Always Visible */}
        <div 
          className={`flex items-center gap-3 p-3 ${!isEditing && onToggleExpand ? "cursor-pointer" : ""}`}
          onClick={!isEditing ? onToggleExpand : undefined}
        >
          {/* Status indicator */}
          <div className="flex-shrink-0">
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          
          {/* Title */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                ref={titleInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Article title..."
                className="h-8 text-sm font-medium bg-background/50 border-border/50"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="font-medium text-sm truncate">{item.title || "Untitled"}</p>
            )}
          </div>
          
          {/* Meta badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`${statusClass} text-[10px] px-1.5 py-0`}>
              {item.status || "draft"}
            </Badge>
            {item.type && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {item.type}
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground">{wordCount} words</span>
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
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-cyan-400"
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
                    <DropdownMenuItem onClick={handleCopyContent}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Content
                    </DropdownMenuItem>
                    {item.url && (
                      <DropdownMenuItem onClick={() => window.open(item.url, "_blank")}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Live
                      </DropdownMenuItem>
                    )}
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
        
        {/* Expanded Content Area */}
        <AnimatePresence>
          {(isExpanded || isEditing) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-0">
                {/* Keyword info */}
                {item.keyword && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/30">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Keyword:</span>
                    <Badge variant="secondary" className="text-[10px]">{item.keyword}</Badge>
                  </div>
                )}
                
                {/* Content editor/viewer */}
                {isEditing ? (
                  <Textarea
                    ref={contentRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Write your content here..."
                    className="min-h-[200px] text-sm bg-background/50 border-border/50 resize-y"
                  />
                ) : (
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-[300px] overflow-y-auto pr-2">
                    {item.content ? (
                      item.content.length > 500 
                        ? `${item.content.substring(0, 500)}...` 
                        : item.content
                    ) : (
                      <span className="italic opacity-50">No content yet</span>
                    )}
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
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item.title || "this content"}"? This action cannot be undone.
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

CADEInlineContentEditor.displayName = "CADEInlineContentEditor";

export default CADEInlineContentEditor;
