import { useState, useEffect, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { 
  MessageSquare, Bug, Lightbulb, AlertTriangle, 
  Eye, Check, Clock, XCircle, RefreshCw, Filter,
  ChevronDown, ChevronUp, ExternalLink, Mail, Wand2, Sparkles, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BetaFeedback {
  id: string;
  user_id: string | null;
  user_email: string | null;
  feedback_type: string;
  title: string | null;
  message: string;
  page_url: string | null;
  page_errors: any;
  console_errors: any;
  browser_info: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const typeIcons: Record<string, { icon: any; color: string; bg: string }> = {
  feedback: { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/20" },
  feature_request: { icon: Lightbulb, color: "text-amber-400", bg: "bg-amber-500/20" },
  bug_report: { icon: Bug, color: "text-red-400", bg: "bg-red-500/20" },
  error_report: { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/20" },
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  reviewed: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  resolved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  dismissed: "bg-muted text-muted-foreground border-muted",
};

const AdminFeedbackTab = memo(() => {
  const [feedback, setFeedback] = useState<BetaFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedFeedback, setSelectedFeedback] = useState<BetaFeedback | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    bugs: 0,
    features: 0,
    errors: 0,
  });

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("beta_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterType !== "all") {
        query = query.eq("feedback_type", filterType);
      }
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setFeedback(data || []);

      // Calculate stats
      const allData = await supabase.from("beta_feedback").select("feedback_type, status");
      if (allData.data) {
        setStats({
          total: allData.data.length,
          new: allData.data.filter(f => f.status === "new").length,
          bugs: allData.data.filter(f => f.feedback_type === "bug_report").length,
          features: allData.data.filter(f => f.feedback_type === "feature_request").length,
          errors: allData.data.filter(f => f.feedback_type === "error_report").length,
        });
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const openDetails = (item: BetaFeedback) => {
    setSelectedFeedback(item);
    setAdminNotes(item.admin_notes || "");
    setDetailsOpen(true);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("beta_feedback")
        .update({ status: newStatus, admin_notes: adminNotes })
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Status updated");
      fetchFeedback();
      
      if (selectedFeedback?.id === id) {
        setSelectedFeedback({ ...selectedFeedback, status: newStatus, admin_notes: adminNotes });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  // Generate a Lovable-compatible fix prompt from the feedback
  const generateFixPrompt = (item: BetaFeedback): string => {
    const parts: string[] = [];
    
    // Add context based on type
    if (item.feedback_type === 'bug_report' || item.feedback_type === 'error_report') {
      parts.push(`🐛 **Bug/Error Report**: ${item.title || 'Reported Issue'}`);
    } else if (item.feedback_type === 'feature_request') {
      parts.push(`✨ **Feature Request**: ${item.title || 'New Feature'}`);
    } else {
      parts.push(`📝 **Feedback**: ${item.title || 'User Feedback'}`);
    }
    
    // Add user message
    parts.push(`\n**User Report:**\n${item.message}`);
    
    // Add page context
    if (item.page_url) {
      parts.push(`\n**Page:** ${item.page_url}`);
    }
    
    // Add error context
    if (item.page_errors && Array.isArray(item.page_errors) && item.page_errors.length > 0) {
      const errors = item.page_errors.map((err: any) => 
        typeof err === 'object' ? err.message : String(err)
      ).join('\n- ');
      parts.push(`\n**Page Errors:**\n- ${errors}`);
    }
    
    if (item.console_errors && Array.isArray(item.console_errors) && item.console_errors.length > 0) {
      const consoleErrs = item.console_errors.slice(-5).join('\n- ');
      parts.push(`\n**Console Errors:**\n- ${consoleErrs}`);
    }
    
    // Add fix instruction
    parts.push(`\n\n**Please fix this issue automatically.** Analyze the error context and implement the necessary changes.`);
    
    return parts.join('\n');
  };

  // Copy fix prompt to clipboard for Lovable
  const copyFixPrompt = async (item: BetaFeedback) => {
    const prompt = generateFixPrompt(item);
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Fix prompt copied! Paste it in Lovable chat to auto-fix.");
    } catch (err) {
      toast.error("Failed to copy prompt");
    }
  };

  // Open Lovable editor with the fix prompt
  const initiateAutoFix = async (item: BetaFeedback) => {
    const prompt = generateFixPrompt(item);
    
    // Copy to clipboard first
    try {
      await navigator.clipboard.writeText(prompt);
    } catch (err) {
      // Silent fail - user can still manually paste
    }
    
    // Mark as in progress
    await updateStatus(item.id, "in_progress");
    
    // Open Lovable editor in a new tab
    // The project ID is in the URL - we construct the Lovable chat URL
    const lovableProjectUrl = `https://lovable.dev/projects/13c35a32-15ad-4fba-abcf-febaaa2e3347`;
    
    toast.success(
      "Fix prompt copied! Opening Lovable editor...",
      { 
        description: "Paste the prompt in the chat to start auto-fix.",
        duration: 5000 
      }
    );
    
    // Open Lovable in new tab
    window.open(lovableProjectUrl, '_blank');
  };

  const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) => (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Feedback" value={stats.total} icon={MessageSquare} color="bg-primary" />
        <StatCard label="New" value={stats.new} icon={Clock} color="bg-blue-500" />
        <StatCard label="Bug Reports" value={stats.bugs} icon={Bug} color="bg-red-500" />
        <StatCard label="Feature Ideas" value={stats.features} icon={Lightbulb} color="bg-amber-500" />
        <StatCard label="Error Reports" value={stats.errors} icon={AlertTriangle} color="bg-orange-500" />
      </div>

      {/* Filters */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Beta Feedback
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="feature_request">Features</SelectItem>
                  <SelectItem value="bug_report">Bugs</SelectItem>
                  <SelectItem value="error_report">Errors</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" variant="outline" onClick={fetchFeedback}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No feedback found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[120px]">Email</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map((item) => {
                    const typeInfo = typeIcons[item.feedback_type] || typeIcons.feedback;
                    const TypeIcon = typeInfo.icon;
                    
                    return (
                      <TableRow 
                        key={item.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openDetails(item)}
                      >
                        <TableCell>
                          <div className={`w-8 h-8 rounded-lg ${typeInfo.bg} flex items-center justify-center`}>
                            <TypeIcon className={`w-4 h-4 ${typeInfo.color}`} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px]">
                            {item.title && (
                              <p className="font-medium truncate">{item.title}</p>
                            )}
                            <p className="text-sm text-muted-foreground truncate">
                              {item.message}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm truncate block max-w-[120px]">
                            {item.user_email || "Anonymous"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[item.status]}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(item.created_at), "MMM d")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetails(item);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const typeInfo = typeIcons[selectedFeedback.feedback_type] || typeIcons.feedback;
                    const TypeIcon = typeInfo.icon;
                    return (
                      <>
                        <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                        {selectedFeedback.title || selectedFeedback.feedback_type.replace('_', ' ')}
                      </>
                    );
                  })()}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Meta info */}
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline" className={statusColors[selectedFeedback.status]}>
                    {selectedFeedback.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-muted-foreground">
                    {format(new Date(selectedFeedback.created_at), "PPpp")}
                  </span>
                </div>

                {/* Email */}
                {selectedFeedback.user_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${selectedFeedback.user_email}`}
                      className="text-primary hover:underline"
                    >
                      {selectedFeedback.user_email}
                    </a>
                  </div>
                )}

                {/* Message */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>

                {/* Page URL */}
                {selectedFeedback.page_url && (
                  <div className="text-sm">
                    <Label className="text-muted-foreground">Page URL</Label>
                    <a 
                      href={selectedFeedback.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline mt-1"
                    >
                      {selectedFeedback.page_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Page Errors */}
                {selectedFeedback.page_errors && Array.isArray(selectedFeedback.page_errors) && selectedFeedback.page_errors.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Page Errors</Label>
                    <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 max-h-32 overflow-y-auto">
                      <ul className="text-xs space-y-1 font-mono">
                        {selectedFeedback.page_errors.map((err: any, i: number) => (
                          <li key={i} className="text-red-400">
                            {typeof err === 'object' ? err.message : String(err)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Console Errors */}
                {selectedFeedback.console_errors && Array.isArray(selectedFeedback.console_errors) && selectedFeedback.console_errors.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Console Errors</Label>
                    <div className="mt-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 max-h-32 overflow-y-auto">
                      <ul className="text-xs space-y-1 font-mono">
                        {selectedFeedback.console_errors.slice(-5).map((err: string, i: number) => (
                          <li key={i} className="text-orange-400 truncate">{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Browser Info */}
                {selectedFeedback.browser_info && (
                  <div className="text-xs text-muted-foreground">
                    <Label className="text-muted-foreground">Browser</Label>
                    <p className="mt-1 font-mono">{selectedFeedback.browser_info}</p>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <Label>Admin Notes</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes..."
                    rows={3}
                    className="mt-2"
                  />
                </div>

                {/* Auto Fix with Lovable - Special Section */}
                {(selectedFeedback.feedback_type === 'bug_report' || selectedFeedback.feedback_type === 'error_report') && (
                  <TooltipProvider>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-violet-500/10 border border-violet-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-violet-400" />
                        <span className="font-semibold text-violet-300">Auto Fix with Lovable AI</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Generate a fix prompt with all error context and open Lovable to automatically resolve this issue.
                      </p>
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyFixPrompt(selectedFeedback)}
                              className="border-violet-500/30 hover:bg-violet-500/10"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy Prompt
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy fix prompt to clipboard</TooltipContent>
                        </Tooltip>
                        <Button
                          size="sm"
                          onClick={() => initiateAutoFix(selectedFeedback)}
                          className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:opacity-90 text-white"
                        >
                          <Wand2 className="w-4 h-4 mr-1" />
                          Auto Fix with Lovable
                        </Button>
                      </div>
                    </div>
                  </TooltipProvider>
                )}

                {/* Status Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant={selectedFeedback.status === "reviewed" ? "default" : "outline"}
                    onClick={() => updateStatus(selectedFeedback.id, "reviewed")}
                    disabled={updating}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Reviewed
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedFeedback.status === "in_progress" ? "default" : "outline"}
                    onClick={() => updateStatus(selectedFeedback.id, "in_progress")}
                    disabled={updating}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedFeedback.status === "resolved" ? "default" : "outline"}
                    onClick={() => updateStatus(selectedFeedback.id, "resolved")}
                    disabled={updating}
                    className={selectedFeedback.status === "resolved" ? "bg-emerald-600" : ""}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Resolved
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedFeedback.status === "dismissed" ? "default" : "outline"}
                    onClick={() => updateStatus(selectedFeedback.id, "dismissed")}
                    disabled={updating}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Dismiss
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

AdminFeedbackTab.displayName = "AdminFeedbackTab";

export default AdminFeedbackTab;
