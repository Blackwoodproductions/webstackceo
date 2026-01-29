import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Clock, CheckCircle2, XCircle, Loader2, RefreshCw,
  ChevronDown, ChevronUp, Globe, Target, FileText, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ───
interface CrawlTask {
  task_id: string;
  request_id?: string;  // Tracking ID for correlating callbacks
  user_id?: string;     // User tracking ID
  domain: string;
  status: string;
  progress?: number;
  pages_crawled?: number;
  total_pages?: number;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

interface CategorizationTask {
  task_id: string;
  request_id?: string;
  user_id?: string;
  domain: string;
  status: string;
  category?: string;
  confidence?: number;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

interface ContentTask {
  task_id: string;
  request_id?: string;
  user_id?: string;
  domain?: string;
  status: string;
  content_type?: string;
  keyword?: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

interface CADETaskMonitorProps {
  domain?: string;
  userId?: string;
  requestId?: string;  // Optional request_id to filter specific task
  onRefresh?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// ─── Component ───
export const CADETaskMonitor = ({ 
  domain, 
  userId,
  requestId,
  onRefresh,
  isCollapsed = false,
  onToggleCollapse
}: CADETaskMonitorProps) => {
  const [crawlTasks, setCrawlTasks] = useState<CrawlTask[]>([]);
  const [categorizationTasks, setCategorizationTasks] = useState<CategorizationTask[]>([]);
  const [contentTasks, setContentTasks] = useState<ContentTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollIntervalRef = useRef<number | null>(null);

  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain, params },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  }, [domain]);

  const fetchAllTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Pass user_id and request_id for task correlation
      const taskParams: Record<string, unknown> = {};
      if (userId) taskParams.user_id = userId;
      if (requestId) taskParams.request_id = requestId;
      
      // Fetch all task types in parallel
      const [crawlResult, categorizationResult, contentResult] = await Promise.allSettled([
        callCadeApi("crawl-tasks", taskParams),
        callCadeApi("categorization-tasks", taskParams),
        callCadeApi("content-tasks", taskParams),
      ]);

      // Process crawl tasks
      if (crawlResult.status === "fulfilled") {
        const data = crawlResult.value?.data || crawlResult.value || [];
        const tasks = Array.isArray(data) ? data : [];
        // Filter by request_id if provided
        setCrawlTasks(requestId 
          ? tasks.filter((t: CrawlTask) => t.request_id === requestId || t.task_id?.includes(requestId))
          : tasks
        );
      } else {
        console.error("[CADE Tasks] Crawl tasks error:", crawlResult.reason);
      }

      // Process categorization tasks
      if (categorizationResult.status === "fulfilled") {
        const data = categorizationResult.value?.data || categorizationResult.value || [];
        const tasks = Array.isArray(data) ? data : [];
        setCategorizationTasks(requestId 
          ? tasks.filter((t: CategorizationTask) => t.request_id === requestId)
          : tasks
        );
      } else {
        console.error("[CADE Tasks] Categorization tasks error:", categorizationResult.reason);
      }

      // Process content tasks
      if (contentResult.status === "fulfilled") {
        const data = contentResult.value?.data || contentResult.value || [];
        const tasks = Array.isArray(data) ? data : [];
        setContentTasks(requestId 
          ? tasks.filter((t: ContentTask) => t.request_id === requestId)
          : tasks
        );
      } else {
        console.error("[CADE Tasks] Content tasks error:", contentResult.reason);
      }

    } catch (err) {
      console.error("[CADE Tasks] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  }, [callCadeApi, userId, requestId]);

  // Initial fetch and polling
  useEffect(() => {
    fetchAllTasks();

    // Poll for updates every 10 seconds when there are active tasks
    const startPolling = () => {
      if (pollIntervalRef.current) return;
      pollIntervalRef.current = window.setInterval(() => {
        const hasActiveTasks = 
          crawlTasks.some(t => t.status === "processing" || t.status === "pending") ||
          categorizationTasks.some(t => t.status === "processing" || t.status === "pending");
        
        if (hasActiveTasks) {
          fetchAllTasks();
        }
      }, 10000);
    };

    startPolling();

    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [fetchAllTasks, crawlTasks, categorizationTasks]);

  // Subscribe to realtime events for this domain
  useEffect(() => {
    if (!domain) return;

    const channel = supabase
      .channel(`cade-tasks-${domain}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cade_crawl_events',
          filter: `domain=eq.${domain}`,
        },
        (payload) => {
          console.log("[CADE Tasks] Realtime event:", payload.new);
          // Refresh tasks when we get updates
          fetchAllTasks();
          onRefresh?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [domain, fetchAllTasks, onRefresh]);

  const handleRefresh = () => {
    fetchAllTasks();
    onRefresh?.();
  };

  const handleTerminateTask = async (taskId: string, taskType: string) => {
    try {
      await callCadeApi("terminate-content-task", { task_id: taskId, task_type: taskType });
      toast.success("Task termination requested");
      fetchAllTasks();
    } catch (err) {
      console.error("[CADE Tasks] Terminate error:", err);
      toast.error("Failed to terminate task");
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "done":
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "processing":
      case "running":
      case "in_progress":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "pending":
      case "queued":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "failed":
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "done":
      case "success":
        return "bg-green-500/15 text-green-600 border-green-500/30";
      case "processing":
      case "running":
      case "in_progress":
        return "bg-blue-500/15 text-blue-600 border-blue-500/30";
      case "pending":
      case "queued":
        return "bg-amber-500/15 text-amber-600 border-amber-500/30";
      case "failed":
      case "error":
        return "bg-red-500/15 text-red-600 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleString();
  };

  const totalActiveTasks = 
    crawlTasks.filter(t => t.status === "processing" || t.status === "pending").length +
    categorizationTasks.filter(t => t.status === "processing" || t.status === "pending").length;

  const totalTasks = crawlTasks.length + categorizationTasks.length + contentTasks.length;

  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-background to-blue-500/5">
      <Collapsible open={!isCollapsed} onOpenChange={() => onToggleCollapse?.()}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-blue-400" />
                Task Monitor
                {totalActiveTasks > 0 && (
                  <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {totalActiveTasks} active
                  </Badge>
                )}
              </CardTitle>
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {totalTasks} total
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-blue-500/30 hover:bg-blue-500/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {error}
              </div>
            )}

            {isLoading && totalTasks === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : totalTasks === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No tasks found</p>
                <p className="text-xs mt-1">Start a crawl to see tasks here</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {/* Crawl Tasks */}
                  {crawlTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2 text-muted-foreground">
                        <Globe className="w-4 h-4" />
                        Crawl Tasks ({crawlTasks.length})
                      </h4>
                      <div className="space-y-2">
                        {crawlTasks.map((task, idx) => (
                          <TaskRow
                            key={task.task_id || idx}
                            task={task}
                            type="crawl"
                            getStatusIcon={getStatusIcon}
                            getStatusBadgeClass={getStatusBadgeClass}
                            formatDate={formatDate}
                            onTerminate={handleTerminateTask}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categorization Tasks */}
                  {categorizationTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2 text-muted-foreground">
                        <Target className="w-4 h-4" />
                        Categorization Tasks ({categorizationTasks.length})
                      </h4>
                      <div className="space-y-2">
                        {categorizationTasks.map((task, idx) => (
                          <TaskRow
                            key={task.task_id || idx}
                            task={task}
                            type="categorization"
                            getStatusIcon={getStatusIcon}
                            getStatusBadgeClass={getStatusBadgeClass}
                            formatDate={formatDate}
                            onTerminate={handleTerminateTask}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Tasks */}
                  {contentTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        Content Tasks ({contentTasks.length})
                      </h4>
                      <div className="space-y-2">
                        {contentTasks.map((task, idx) => (
                          <TaskRow
                            key={task.task_id || idx}
                            task={task}
                            type="content"
                            getStatusIcon={getStatusIcon}
                            getStatusBadgeClass={getStatusBadgeClass}
                            formatDate={formatDate}
                            onTerminate={handleTerminateTask}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// ─── Task Row Component ───
interface TaskRowProps {
  task: CrawlTask | CategorizationTask | ContentTask;
  type: "crawl" | "categorization" | "content";
  getStatusIcon: (status?: string) => React.ReactNode;
  getStatusBadgeClass: (status?: string) => string;
  formatDate: (date?: string) => string;
  onTerminate: (taskId: string, taskType: string) => void;
}

const TaskRow = ({ task, type, getStatusIcon, getStatusBadgeClass, formatDate, onTerminate }: TaskRowProps) => {
  const isActive = task.status === "processing" || task.status === "pending" || task.status === "running";
  const crawlTask = task as CrawlTask;
  const categorizationTask = task as CategorizationTask;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-3 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getStatusIcon(task.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {crawlTask.domain || categorizationTask.domain || "Unknown"}
              </span>
              <Badge className={`text-xs ${getStatusBadgeClass(task.status)}`}>
                {task.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              {type === "crawl" && crawlTask.pages_crawled !== undefined && (
                <span>{crawlTask.pages_crawled} / {crawlTask.total_pages || "?"} pages</span>
              )}
              {type === "categorization" && categorizationTask.category && (
                <span>Category: {categorizationTask.category}</span>
              )}
              <span>{formatDate(task.started_at)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Progress for crawl tasks */}
          {type === "crawl" && crawlTask.progress !== undefined && isActive && (
            <div className="w-20">
              <Progress value={crawlTask.progress} className="h-1.5" />
            </div>
          )}
          
          {/* Terminate button for active tasks */}
          {isActive && type === "content" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onTerminate(task.task_id, type)}
              className="h-7 w-7 p-0 text-red-400 hover:text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Error message */}
      {task.error && (
        <div className="mt-2 p-2 rounded bg-red-500/10 text-xs text-red-400">
          {task.error}
        </div>
      )}
    </motion.div>
  );
};

export default CADETaskMonitor;
