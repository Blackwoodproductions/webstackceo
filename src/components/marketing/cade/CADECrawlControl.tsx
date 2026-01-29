import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, RefreshCw, Play, Loader2, CheckCircle2, AlertTriangle,
  Clock, FileText, Palette, Target, Activity, MapPin, Languages, 
  Users, Info, ChevronDown, ExternalLink, XCircle, StopCircle,
  Link2, Layers, Zap, Terminal, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCadeEventTasks } from "@/hooks/use-cade-event-tasks";

interface DomainProfile {
  domain?: string;
  category?: string;
  status?: string;
  crawled_pages?: number;
  last_crawl?: string;
  css_analyzed?: boolean;
  content_count?: number;
}

interface CrawlTask {
  task_id?: string;
  request_id?: string;
  status?: string;
  status_url?: string;
  progress?: number;
  pages_crawled?: number;
  total_pages?: number;
  started_at?: string;
  completed_at?: string;
  error?: string;
  current_url?: string;
  message?: string;
  time_remaining?: string;
}

interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error" | "progress" | "cache";
  data?: Record<string, unknown>;
}

interface CADECrawlControlProps {
  domain?: string;
  domainProfile?: DomainProfile | null;
  onRefresh?: () => void;
  onTaskStarted?: (taskId: string) => void;
}

export const CADECrawlControl = ({ domain, domainProfile, onRefresh, onTaskStarted }: CADECrawlControlProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isAnalyzingCss, setIsAnalyzingCss] = useState(false);
  const [crawlTask, setCrawlTask] = useState<CrawlTask | null>(null);
  const [showCategorizationDetails, setShowCategorizationDetails] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [showActivityLog, setShowActivityLog] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const activityScrollRef = useRef<HTMLDivElement>(null);

  // Get latest data from events with stats
  const { 
    tasks,
    latestCategorization, 
    byType, 
    stats, 
    hasActiveTasks, 
    activeTasksByType,
    refresh: refreshEvents 
  } = useCadeEventTasks(domain);

  // Helper to add activity log entry
  const addActivity = useCallback((message: string, type: ActivityLogEntry["type"] = "info", data?: Record<string, unknown>) => {
    const entry: ActivityLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      message,
      type,
      data,
    };
    setActivityLog(prev => [entry, ...prev].slice(0, 50)); // Keep last 50 entries
  }, []);

  // Convert task events to activity log entries
  useEffect(() => {
    if (!tasks.length) return;
    
    // Get recent tasks (last 10 minutes)
    const recentTasks = tasks.filter(t => {
      if (!t.created_at) return false;
      const taskTime = new Date(t.created_at).getTime();
      return Date.now() - taskTime < 10 * 60 * 1000;
    });

    // Build activity entries from tasks
    const newActivities: ActivityLogEntry[] = [];
    
    for (const task of recentTasks.slice(0, 20)) {
      const taskTime = new Date(task.created_at || Date.now());
      
      // Determine type and message based on status
      let type: ActivityLogEntry["type"] = "info";
      let message = "";
      
      if (task.statusValue === "completed" || task.statusValue === "done") {
        type = "success";
        message = `Task Success: ${task.type}`;
        if (task.pages_crawled) {
          message = `Crawl completed: ${task.pages_crawled} pages processed`;
        }
        if (task.description) {
          message = `Categorization completed: ${task.description.slice(0, 50)}...`;
        }
      } else if (task.statusValue === "failed" || task.statusValue === "error") {
        type = "error";
        message = `Task failed: ${task.type} - ${task.error || "Unknown error"}`;
      } else if (task.statusValue === "running" || task.statusValue === "processing") {
        type = "progress";
        message = task.message || `${task.type} in progress...`;
        if (task.current_url) {
          message = `Crawling: ${task.current_url}`;
        }
        if (task.progress) {
          message = `Processing progress: ${task.progress}%`;
        }
      } else if (task.statusValue === "queued" || task.statusValue === "pending") {
        type = "info";
        message = `Task starting: ${task.type}`;
      }

      // Check for cache hits in message
      if (task.message?.includes("cache hit")) {
        type = "cache";
        message = task.message;
      }

      if (message) {
        newActivities.push({
          id: task.id + "-" + task.statusValue,
          timestamp: taskTime,
          message,
          type,
          data: {
            task_id: task.id,
            pages_crawled: task.pages_crawled,
            total_pages: task.total_pages,
            progress: task.progress,
          },
        });
      }
    }

    if (newActivities.length > 0) {
      setActivityLog(prev => {
        // Merge and dedupe by id
        const existing = new Set(prev.map(a => a.id));
        const toAdd = newActivities.filter(a => !existing.has(a.id));
        return [...toAdd, ...prev].slice(0, 50);
      });
    }
  }, [tasks]);

  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain, params },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  }, [domain]);

  // Sync button states with active tasks from hook
  useEffect(() => {
    if (!domain) return;
    
    // Sync crawl state
    const activeCrawl = activeTasksByType.crawl;
    if (activeCrawl) {
      if (!isCrawling) setIsCrawling(true);
      setCrawlTask({
        task_id: activeCrawl.id,
        request_id: activeCrawl.request_id,
        status: activeCrawl.statusValue,
        progress: activeCrawl.progress,
        pages_crawled: activeCrawl.pages_crawled,
        total_pages: activeCrawl.total_pages,
        current_url: activeCrawl.current_url,
        message: activeCrawl.message,
        error: activeCrawl.error,
      });
    } else if (isCrawling) {
      // Check if we were crawling and now completed
      const latestCrawl = byType.crawl[0];
      if (latestCrawl) {
        if (latestCrawl.statusValue === "completed" || latestCrawl.statusValue === "done") {
          setIsCrawling(false);
          setCrawlTask(null);
          toast.success("Crawl completed!");
          onRefresh?.();
        } else if (latestCrawl.statusValue === "failed" || latestCrawl.statusValue === "error") {
          setIsCrawling(false);
          setCrawlTask(null);
          toast.error("Crawl failed: " + (latestCrawl.error || "Unknown error"));
          onRefresh?.();
        }
      }
    }
    
    // Sync categorization state
    if (activeTasksByType.categorization) {
      if (!isCategorizing) setIsCategorizing(true);
    } else if (isCategorizing) {
      const latestCat = byType.categorization[0];
      if (latestCat?.statusValue === "completed" || latestCat?.statusValue === "done") {
        setIsCategorizing(false);
        toast.success("Categorization completed!");
        onRefresh?.();
      } else if (latestCat?.statusValue === "failed" || latestCat?.statusValue === "error") {
        setIsCategorizing(false);
        toast.error("Categorization failed");
      }
    }
    
    // Sync CSS analysis state
    if (activeTasksByType.css) {
      if (!isAnalyzingCss) setIsAnalyzingCss(true);
    } else if (isAnalyzingCss) {
      const latestCss = byType.css[0];
      if (latestCss?.statusValue === "completed" || latestCss?.statusValue === "done") {
        setIsAnalyzingCss(false);
        toast.success("CSS analysis completed!");
        onRefresh?.();
      } else if (latestCss?.statusValue === "failed" || latestCss?.statusValue === "error") {
        setIsAnalyzingCss(false);
        toast.error("CSS analysis failed");
      }
    }
  }, [domain, activeTasksByType, byType, isCrawling, isCategorizing, isAnalyzingCss, onRefresh]);

  // NOTE: Categorization and CSS states are now synced in the unified effect above

  // Poll crawl status when we have a task_id
  useEffect(() => {
    if (!crawlTask?.task_id || !isCrawling) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const pollStatus = async () => {
      try {
        console.log("[CADE Poll] Fetching status for task:", crawlTask.task_id);
        const result = await callCadeApi("crawl-task-status", { 
          task_id: crawlTask.task_id 
        });
        
        const statusData = result?.data || result;
        console.log("[CADE Poll] Status response:", statusData);
        
        if (statusData) {
          // Update task state
          setCrawlTask(prev => ({
            ...prev,
            status: statusData.status,
            progress: statusData.progress ?? prev?.progress,
            pages_crawled: statusData.pages_crawled ?? statusData.crawled_pages ?? prev?.pages_crawled,
            total_pages: statusData.total_pages ?? prev?.total_pages,
            current_url: statusData.current_url ?? prev?.current_url,
            message: statusData.message ?? prev?.message,
            time_remaining: statusData.time_remaining ?? prev?.time_remaining,
          }));

          // Add to activity log with time_remaining
          if (statusData.message || statusData.time_remaining) {
            const logMessage = statusData.time_remaining 
              ? `Processing progress, time_remaining: ${statusData.time_remaining}`
              : statusData.message || `Status: ${statusData.status}`;
            addActivity(logMessage, "progress", {
              time_remaining: statusData.time_remaining,
              pages_crawled: statusData.pages_crawled,
              progress: statusData.progress,
            });
          }

          // Check if completed
          const status = (statusData.status || "").toUpperCase();
          if (status === "COMPLETED" || status === "DONE" || status === "SUCCESS") {
            setIsCrawling(false);
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            addActivity(
              `Crawl completed: ${statusData.total_pages || statusData.pages_crawled || 0} pages processed, ${statusData.successful ?? statusData.pages_crawled ?? 0} successful`, 
              "success",
              { total_pages: statusData.total_pages, successful: statusData.successful }
            );
            toast.success("Crawl completed!");
            onRefresh?.();
            refreshEvents();
          } else if (status === "FAILED" || status === "ERROR") {
            setIsCrawling(false);
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            addActivity(`Crawl failed: ${statusData.error || statusData.message || "Unknown error"}`, "error");
            toast.error("Crawl failed: " + (statusData.error || statusData.message || "Unknown error"));
            refreshEvents();
          }
        }
      } catch (err) {
        console.error("[CADE Poll] Status fetch error:", err);
        // Don't stop polling on error - might be temporary
      }
    };

    // Poll immediately and then every 3 seconds
    pollStatus();
    pollingRef.current = setInterval(pollStatus, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [crawlTask?.task_id, isCrawling, callCadeApi, onRefresh, refreshEvents]);

  const handleStartCrawl = async () => {
    if (!domain) return;
    setIsCrawling(true);
    addActivity(`Starting domain crawl for ${domain}`, "info");
    
    const requestId = `crawl-${domain}-${Date.now()}`;
    
    try {
      const result = await callCadeApi("crawl-domain", {
        full_crawl: true,
        request_id: requestId,
      });
      const task = result?.data || result;
      
      // Store task info including status_url and task_id for polling
      setCrawlTask({ 
        ...task, 
        request_id: requestId,
        started_at: new Date().toISOString(),
        status: task?.status || "PENDING",
      });
      
      console.log("[CADE Crawl] Task started:", task);
      addActivity(`Crawl task queued: ${task?.task_id || requestId}`, "info");
      
      if (task?.task_id || requestId) {
        onTaskStarted?.(task?.task_id || requestId);
      }
      
      toast.success("Crawl started! Polling for updates...");
      refreshEvents();
    } catch (err) {
      console.error("[CADE Crawl] Start error:", err);
      addActivity(`Failed to start crawl: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
      toast.error("Failed to start crawl");
      setIsCrawling(false);
    }
  };

  const handleCategorizeDomain = async () => {
    if (!domain) return;
    setIsCategorizing(true);
    addActivity(`Starting domain categorization`, "info");
    
    const requestId = `categorize-${domain}-${Date.now()}`;
    
    try {
      await callCadeApi("categorize-domain", { request_id: requestId });
      addActivity(`Queued Domain Categorization job`, "info");
      toast.success("Domain categorization started!");
      refreshEvents();
    } catch (err) {
      console.error("[CADE Crawl] Categorize error:", err);
      addActivity(`Failed to categorize domain`, "error");
      toast.error("Failed to categorize domain");
      setIsCategorizing(false);
    }
  };

  const handleAnalyzeCss = async () => {
    if (!domain) return;
    setIsAnalyzingCss(true);
    addActivity(`Starting CSS analysis`, "info");
    
    const requestId = `css-${domain}-${Date.now()}`;
    
    try {
      await callCadeApi("analyze-css", { request_id: requestId });
      addActivity(`Queued CSS Analysis job`, "info");
      toast.success("CSS analysis started!");
      refreshEvents();
    } catch (err) {
      console.error("[CADE Crawl] CSS analyze error:", err);
      addActivity(`Failed to analyze CSS`, "error");
      toast.error("Failed to analyze CSS");
      setIsAnalyzingCss(false);
    }
  };

  const handleTerminateTask = async (taskType: "crawl" | "categorization" | "css", taskId: string) => {
    setIsTerminating(true);
    try {
      let action = "terminate-content-task";
      if (taskType === "crawl") action = "terminate-crawl-task";
      else if (taskType === "categorization") action = "terminate-categorization-task";

      await callCadeApi(action, { task_id: taskId, request_id: taskId });
      toast.success(`${taskType.charAt(0).toUpperCase() + taskType.slice(1)} task terminated`);
      
      // Reset states
      if (taskType === "crawl") {
        setIsCrawling(false);
        setCrawlTask(null);
      } else if (taskType === "categorization") {
        setIsCategorizing(false);
      } else if (taskType === "css") {
        setIsAnalyzingCss(false);
      }
      
      refreshEvents();
    } catch (err) {
      console.error("[CADE Crawl] Terminate error:", err);
      toast.error("Failed to terminate task");
    } finally {
      setIsTerminating(false);
    }
  };

  // Check if domain has been crawled
  const hasCrawled = domainProfile?.crawled_pages && domainProfile.crawled_pages > 0;

  if (!domain) {
    return (
      <Card className="border-green-500/20">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Select a domain to manage crawling</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "active":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "processing":
      case "crawling":
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "pending":
      case "queued":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "failed":
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="border-green-500/20 bg-gradient-to-br from-background to-green-500/5">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Globe className="w-4 h-4 text-green-400" />
          Domain Intelligence
          {domainProfile?.status && (
            <Badge className="text-[10px] py-0" variant="secondary">
              {getStatusIcon(domainProfile.status)}
              <span className="ml-1">{domainProfile.status}</span>
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { onRefresh?.(); refreshEvents(); }}
          disabled={isLoading}
          className="h-7 w-7 p-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 pb-4 px-4">
        {/* Live Task Window - Primary focus when tasks are active OR button was just clicked */}
        <AnimatePresence>
          {(hasActiveTasks || isCrawling || isCategorizing || isAnalyzingCss) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/20 via-violet-500/15 to-cyan-500/10 border-2 border-blue-500/40 p-1"
            >
              {/* Animated border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-cyan-500/20 animate-pulse" />
              
              <div className="relative bg-background/95 backdrop-blur-sm rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Activity className="w-6 h-6 text-blue-400" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Live Task Monitor</h3>
                      <p className="text-xs text-muted-foreground">
                        {crawlTask?.task_id ? `Polling task ${crawlTask.task_id.slice(0, 8)}...` : "Real-time updates via callbacks"}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">
                    <Zap className="w-3 h-3 mr-1" />
                    {crawlTask?.status || (stats.active > 0 ? `${stats.active} Active` : "Processing...")}
                  </Badge>
                </div>

                {/* Active Crawl Task - Detailed View */}
                {(activeTasksByType.crawl || isCrawling) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🕷️</span>
                        <div>
                          <h4 className="font-medium">Website Crawl</h4>
                          <p className="text-xs text-muted-foreground">{domain}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/30 text-blue-300 border-blue-500/50">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          {crawlTask?.status || activeTasksByType.crawl?.statusValue || "starting"}
                        </Badge>
                        {(activeTasksByType.crawl || crawlTask?.task_id) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTerminateTask("crawl", activeTasksByType.crawl?.id || crawlTask?.task_id || "")}
                                  disabled={isTerminating}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  {isTerminating ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Stop crawl</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar with Time Remaining */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <div className="flex items-center gap-3">
                          {crawlTask?.time_remaining && (
                            <span className="flex items-center gap-1 text-cyan-400 font-medium">
                              <Timer className="w-3 h-3" />
                              {crawlTask.time_remaining} remaining
                            </span>
                          )}
                          <span className="font-medium text-blue-400">
                            {activeTasksByType.crawl?.progress ?? crawlTask?.progress ?? 0}%
                          </span>
                        </div>
                      </div>
                      <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${activeTasksByType.crawl?.progress ?? crawlTask?.progress ?? (isCrawling ? 5 : 0)}%` }}
                          transition={{ duration: 0.5 }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                          style={{ backgroundSize: "200% 100%" }} />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-background/50 border border-border">
                        <p className="text-xl font-bold text-blue-400">
                          {activeTasksByType.crawl?.pages_crawled ?? crawlTask?.pages_crawled ?? 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Crawled</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50 border border-border">
                        <p className="text-xl font-bold text-violet-400">
                          {activeTasksByType.crawl?.total_pages ?? crawlTask?.total_pages ?? "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Total</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50 border border-border">
                        <p className="text-xl font-bold text-cyan-400">
                          {crawlTask?.time_remaining || "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">ETA</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50 border border-border">
                        <p className="text-xl font-bold text-green-400">
                          {(activeTasksByType.crawl?.created_at || crawlTask?.started_at)
                            ? Math.round((Date.now() - new Date(activeTasksByType.crawl?.created_at || crawlTask?.started_at || Date.now()).getTime()) / 1000) + "s"
                            : "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Elapsed</p>
                      </div>
                    </div>

                    {/* Current URL */}
                    {(activeTasksByType.crawl?.current_url || crawlTask?.current_url) && (
                      <div className="p-2 rounded-lg bg-background/30 border border-border">
                        <div className="flex items-center gap-2 text-xs">
                          <Link2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Currently crawling:</span>
                          <span className="font-mono text-cyan-400 truncate flex-1">
                            {activeTasksByType.crawl?.current_url || crawlTask?.current_url}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Status Message */}
                    {(activeTasksByType.crawl?.message || crawlTask?.message || (!activeTasksByType.crawl && isCrawling)) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="w-4 h-4 flex-shrink-0" />
                        <span>{activeTasksByType.crawl?.message || crawlTask?.message || "Initiating crawl with CADE API..."}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Active Categorization Task */}
                {(activeTasksByType.categorization || isCategorizing) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🏷️</span>
                        <div>
                          <h4 className="font-medium">Domain Categorization</h4>
                          <p className="text-xs text-muted-foreground">Analyzing business context</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-violet-500/30 text-violet-300 border-violet-500/50">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          {activeTasksByType.categorization?.statusValue || "starting"}
                        </Badge>
                        {activeTasksByType.categorization && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTerminateTask("categorization", activeTasksByType.categorization!.id)}
                            disabled={isTerminating}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <StopCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Info className="w-4 h-4 flex-shrink-0" />
                      <span>{activeTasksByType.categorization?.message || "Analyzing domain categories and competitors..."}</span>
                    </div>
                  </motion.div>
                )}

                {/* Active CSS Analysis Task */}
                {(activeTasksByType.css || isAnalyzingCss) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎨</span>
                        <div>
                          <h4 className="font-medium">CSS Analysis</h4>
                          <p className="text-xs text-muted-foreground">Extracting design patterns</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500/30 text-amber-300 border-amber-500/50">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          {activeTasksByType.css?.statusValue || "starting"}
                        </Badge>
                        {activeTasksByType.css && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTerminateTask("css", activeTasksByType.css!.id)}
                            disabled={isTerminating}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <StopCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Live Activity Log - Real-time console output */}
                <Collapsible open={showActivityLog} onOpenChange={setShowActivityLog}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50 cursor-pointer hover:bg-muted/20 rounded p-1 -m-1">
                      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Terminal className="w-3 h-3" />
                        Live Activity Log
                        {activityLog.length > 0 && (
                          <Badge variant="outline" className="text-[10px] py-0 ml-1">
                            {activityLog.length}
                          </Badge>
                        )}
                      </h4>
                      <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${showActivityLog ? "" : "-rotate-90"}`} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ScrollArea className="h-28 mt-1">
                      <div ref={activityScrollRef} className="space-y-0.5 font-mono text-[11px]">
                        {activityLog.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            <Terminal className="w-6 h-6 mx-auto mb-2 opacity-30" />
                            <p>Activity logs will appear here...</p>
                          </div>
                        ) : (
                          activityLog.map((entry) => (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded text-[11px] ${
                                entry.type === "success" ? "bg-green-500/10 text-green-400" :
                                entry.type === "error" ? "bg-red-500/10 text-red-400" :
                                entry.type === "progress" ? "bg-blue-500/10 text-blue-400" :
                                entry.type === "cache" ? "bg-amber-500/10 text-amber-400" :
                                "bg-muted/30 text-muted-foreground"
                              }`}
                            >
                            <span className="text-muted-foreground flex-shrink-0 w-14 text-[10px]">
                                {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                              <span className="flex-shrink-0">
                                {entry.type === "success" ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                                 entry.type === "error" ? <AlertTriangle className="w-2.5 h-2.5" /> :
                                 entry.type === "progress" ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> :
                                 entry.type === "cache" ? <Zap className="w-2.5 h-2.5" /> :
                                 <Info className="w-2.5 h-2.5" />}
                              </span>
                              <span className="flex-1 break-words">{entry.message}</span>
                              {entry.data?.time_remaining && (
                                <span className="flex items-center gap-0.5 text-cyan-400 flex-shrink-0 text-[10px]">
                                  <Timer className="w-2.5 h-2.5" />
                                  {String(entry.data.time_remaining)}
                                </span>
                              )}
                            </motion.div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not Crawled State - Compact prompt */}
        {!hasCrawled && !hasActiveTasks && !isCrawling && !isCategorizing && !isAnalyzingCss && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30">
            <Globe className="w-8 h-8 text-muted-foreground/50 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">No crawl data yet</p>
              <p className="text-xs text-muted-foreground">Start a crawl to analyze your website</p>
            </div>
            <Button
              onClick={handleStartCrawl}
              disabled={isCrawling}
              size="sm"
              className="gap-1.5 h-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isCrawling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Crawl
            </Button>
          </div>
        )}

        {/* Domain Stats - Compact inline when crawled */}
        {hasCrawled && !hasActiveTasks && domainProfile && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="gap-1 py-1 px-2 bg-green-500/10 border-green-500/20">
              <FileText className="w-3 h-3" />
              {domainProfile.crawled_pages ?? 0} pages
            </Badge>
            <Badge variant="outline" className="gap-1 py-1 px-2 bg-blue-500/10 border-blue-500/20">
              <Target className="w-3 h-3" />
              {domainProfile.category || "Uncategorized"}
            </Badge>
            <Badge variant="outline" className="gap-1 py-1 px-2 bg-violet-500/10 border-violet-500/20">
              <FileText className="w-3 h-3" />
              {domainProfile.content_count ?? 0} articles
            </Badge>
            <Badge variant="outline" className="gap-1 py-1 px-2 bg-amber-500/10 border-amber-500/20">
              <Palette className="w-3 h-3" />
              CSS: {domainProfile.css_analyzed ? "✓" : "—"}
            </Badge>
          </div>
        )}

        {/* Latest Categorization Data */}
        {latestCategorization && (
          <Collapsible open={showCategorizationDetails} onOpenChange={setShowCategorizationDetails}>
            <CollapsibleTrigger asChild>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 cursor-pointer hover:bg-blue-500/15 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-sm">Domain Intelligence</span>
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Categorized
                    </Badge>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showCategorizationDetails ? "rotate-180" : ""}`} />
                </div>
                
                {/* Categories preview */}
                {latestCategorization.categories && latestCategorization.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {latestCategorization.categories.slice(0, 3).map((cat, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                    {latestCategorization.categories.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{latestCategorization.categories.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 mt-2 rounded-lg bg-secondary/30 border border-border space-y-3"
              >
                {/* Metadata row */}
                <div className="flex flex-wrap gap-3 text-xs">
                  {latestCategorization.country && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {latestCategorization.country.toUpperCase()}
                    </span>
                  )}
                  {latestCategorization.language && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Languages className="w-3 h-3" />
                      {latestCategorization.language.toUpperCase()}
                    </span>
                  )}
                  {latestCategorization.tier && (
                    <Badge variant="outline" className="text-xs">
                      {latestCategorization.tier} tier
                    </Badge>
                  )}
                </div>

                {/* All categories */}
                {latestCategorization.categories && latestCategorization.categories.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Categories:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {latestCategorization.categories.map((cat, i) => (
                        <Badge key={i} className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competitors */}
                {latestCategorization.competitors && (
                  <div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Competitors:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {latestCategorization.competitors.split(",").map((comp, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {comp.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {latestCategorization.description && (
                  <div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Business Description:
                    </span>
                    <p className="text-xs mt-1 text-foreground line-clamp-4">
                      {latestCategorization.description}
                    </p>
                  </div>
                )}
              </motion.div>
            </CollapsibleContent>
          </Collapsible>
        )}
        {/* Last Crawl Info - Compact inline */}
        {domainProfile?.last_crawl && (
          <p className="text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3 inline mr-1" />
            Last crawl: {new Date(domainProfile.last_crawl).toLocaleString()}
          </p>
        )}

        {/* Recent Tasks - Compact collapsible list */}
        {(byType.crawl.length > 0 || byType.categorization.length > 0 || byType.css.length > 0) && (
          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium py-1.5 px-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group w-full">
              <Activity className="w-3.5 h-3.5 text-primary" />
              Recent Tasks
              <Badge variant="outline" className="ml-auto text-[10px] py-0">
                {byType.crawl.length + byType.categorization.length + byType.css.length} total
              </Badge>
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <ScrollArea className="max-h-40">
                <div className="space-y-1.5">
              {/* Crawl Tasks - Compact rows */}
              {byType.crawl.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 p-2 rounded-md border text-xs ${
                    task.statusValue === "running" || task.statusValue === "queued" || task.statusValue === "processing"
                      ? "bg-blue-500/10 border-blue-500/20"
                      : task.statusValue === "completed" || task.statusValue === "done"
                      ? "bg-green-500/10 border-green-500/20"
                      : task.statusValue === "failed" || task.statusValue === "error"
                      ? "bg-red-500/10 border-red-500/20"
                      : "bg-secondary/30 border-border"
                  }`}
                >
                  {getStatusIcon(task.statusValue)}
                  <span className="font-medium">Crawl</span>
                  <Badge variant="secondary" className="text-[10px] py-0">{task.statusValue}</Badge>
                  {task.pages_crawled !== undefined && (
                    <span className="text-muted-foreground">{task.pages_crawled}/{task.total_pages || "?"}</span>
                  )}
                  <span className="ml-auto text-muted-foreground">
                    {task.created_at && new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              
              {/* Categorization Tasks - Compact */}
              {byType.categorization.slice(0, 2).map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 p-2 rounded-md border text-xs ${
                    task.statusValue === "running" || task.statusValue === "queued" || task.statusValue === "processing"
                      ? "bg-violet-500/10 border-violet-500/20"
                      : task.statusValue === "completed" || task.statusValue === "done"
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-secondary/30 border-border"
                  }`}
                >
                  {getStatusIcon(task.statusValue)}
                  <span className="font-medium">Category</span>
                  <Badge variant="secondary" className="text-[10px] py-0">{task.statusValue}</Badge>
                  {task.categories && task.categories.length > 0 && (
                    <span className="text-muted-foreground truncate">{task.categories[0]}</span>
                  )}
                  <span className="ml-auto text-muted-foreground">
                    {task.created_at && new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              
              {/* CSS Tasks - Compact */}
              {byType.css.slice(0, 2).map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 p-2 rounded-md border text-xs ${
                    task.statusValue === "running" || task.statusValue === "queued" || task.statusValue === "processing"
                      ? "bg-amber-500/10 border-amber-500/20"
                      : task.statusValue === "completed" || task.statusValue === "done"
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-secondary/30 border-border"
                  }`}
                >
                  {getStatusIcon(task.statusValue)}
                  <span className="font-medium">CSS</span>
                  <Badge variant="secondary" className="text-[10px] py-0">{task.statusValue}</Badge>
                  <span className="ml-auto text-muted-foreground">
                    {task.created_at && new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Action Buttons - Compact Row */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleStartCrawl}
            disabled={isCrawling}
            size="sm"
            className="gap-1.5 h-8 text-xs bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {isCrawling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {isCrawling ? "Crawling..." : "Crawl"}
          </Button>
          
          <Button
            onClick={handleCategorizeDomain}
            disabled={isCategorizing}
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs border-blue-500/30 hover:bg-blue-500/10"
          >
            {isCategorizing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Target className="w-3.5 h-3.5" />
            )}
            Categorize
          </Button>
          
          <Button
            onClick={handleAnalyzeCss}
            disabled={isAnalyzingCss}
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs border-violet-500/30 hover:bg-violet-500/10"
          >
            {isAnalyzingCss ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Palette className="w-3.5 h-3.5" />
            )}
            CSS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CADECrawlControl;