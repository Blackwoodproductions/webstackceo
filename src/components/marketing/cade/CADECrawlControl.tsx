import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, RefreshCw, Play, Loader2, CheckCircle2, AlertTriangle,
  Clock, FileText, Palette, Target, Activity, MapPin, Languages, 
  Users, Info, ChevronDown, ExternalLink, XCircle, StopCircle,
  Link2, Layers, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  progress?: number;
  pages_crawled?: number;
  total_pages?: number;
  started_at?: string;
  completed_at?: string;
  error?: string;
  current_url?: string;
  message?: string;
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

  // Get latest data from events with stats
  const { 
    latestCategorization, 
    byType, 
    stats, 
    hasActiveTasks, 
    activeTasksByType,
    refresh: refreshEvents 
  } = useCadeEventTasks(domain);

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

  const handleStartCrawl = async () => {
    if (!domain) return;
    setIsCrawling(true);
    
    const requestId = `crawl-${domain}-${Date.now()}`;
    
    try {
      const result = await callCadeApi("crawl-domain", {
        full_crawl: true,
        request_id: requestId,
      });
      const task = result?.data || result;
      setCrawlTask({ ...task, request_id: requestId });
      
      if (task?.task_id || requestId) {
        onTaskStarted?.(task?.task_id || requestId);
      }
      
      toast.success("Crawl started! Watch the progress below.");
      refreshEvents();
    } catch (err) {
      console.error("[CADE Crawl] Start error:", err);
      toast.error("Failed to start crawl");
      setIsCrawling(false);
    }
  };

  const handleCategorizeDomain = async () => {
    if (!domain) return;
    setIsCategorizing(true);
    
    const requestId = `categorize-${domain}-${Date.now()}`;
    
    try {
      await callCadeApi("categorize-domain", { request_id: requestId });
      toast.success("Domain categorization started!");
      refreshEvents();
    } catch (err) {
      console.error("[CADE Crawl] Categorize error:", err);
      toast.error("Failed to categorize domain");
      setIsCategorizing(false);
    }
  };

  const handleAnalyzeCss = async () => {
    if (!domain) return;
    setIsAnalyzingCss(true);
    
    const requestId = `css-${domain}-${Date.now()}`;
    
    try {
      await callCadeApi("analyze-css", { request_id: requestId });
      toast.success("CSS analysis started!");
      refreshEvents();
    } catch (err) {
      console.error("[CADE Crawl] CSS analyze error:", err);
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
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-green-400" />
            Crawl & Analysis
            {domainProfile?.status && (
              <Badge className="ml-2 text-xs" variant="secondary">
                {getStatusIcon(domainProfile.status)}
                <span className="ml-1">{domainProfile.status}</span>
              </Badge>
            )}
          </CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { onRefresh?.(); refreshEvents(); }}
          disabled={isLoading}
          className="border-green-500/30 hover:bg-green-500/10"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
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
                      <p className="text-xs text-muted-foreground">Real-time updates via callbacks</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">
                    <Zap className="w-3 h-3 mr-1" />
                    {stats.active > 0 ? `${stats.active} Active` : "Processing..."}
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
                          {activeTasksByType.crawl?.statusValue || "starting"}
                        </Badge>
                        {activeTasksByType.crawl && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTerminateTask("crawl", activeTasksByType.crawl!.id)}
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

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-blue-400">
                          {activeTasksByType.crawl?.progress ?? crawlTask?.progress ?? 0}%
                        </span>
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
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-background/50 border border-border">
                        <p className="text-xl font-bold text-blue-400">
                          {activeTasksByType.crawl?.pages_crawled ?? crawlTask?.pages_crawled ?? 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Pages Crawled</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50 border border-border">
                        <p className="text-xl font-bold text-violet-400">
                          {activeTasksByType.crawl?.total_pages ?? crawlTask?.total_pages ?? "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Total Pages</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background/50 border border-border">
                        <p className="text-xl font-bold text-green-400">
                          {(activeTasksByType.crawl?.created_at || crawlTask?.started_at)
                            ? Math.round((Date.now() - new Date(activeTasksByType.crawl?.created_at || crawlTask?.started_at || Date.now()).getTime()) / 1000) + "s"
                            : "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Duration</p>
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

                {/* Recent Activity Feed - Show latest events */}
                {byType.crawl.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      Recent Activity
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {byType.crawl.slice(0, 5).map((task) => (
                        <div key={task.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-secondary/30">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.statusValue)}
                            <span className="text-muted-foreground">Crawl</span>
                            <Badge variant="outline" className="text-[10px] py-0">{task.statusValue}</Badge>
                          </div>
                          <span className="text-muted-foreground">
                            {task.created_at ? new Date(task.created_at).toLocaleTimeString() : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not Crawled State - Show when no crawl and no active tasks and not currently processing */}
        {!hasCrawled && !hasActiveTasks && !isCrawling && !isCategorizing && !isAnalyzingCss && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center"
          >
            <Globe className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium mb-2">Domain hasn't been crawled yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start a crawl to analyze your website structure and prepare for content generation.
            </p>
            <Button
              onClick={handleStartCrawl}
              disabled={isCrawling}
              size="lg"
              className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isCrawling ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              Start Domain Crawl
            </Button>
          </motion.div>
        )}

        {/* Domain Stats - Show when crawled */}
        {hasCrawled && !hasActiveTasks && domainProfile && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <FileText className="w-3 h-3" />
                Pages Crawled
              </div>
              <p className="text-lg font-bold">{domainProfile.crawled_pages ?? "—"}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Target className="w-3 h-3" />
                Category
              </div>
              <p className="text-lg font-bold truncate">{domainProfile.category || "Unknown"}</p>
            </div>
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <FileText className="w-3 h-3" />
                Content Count
              </div>
              <p className="text-lg font-bold">{domainProfile.content_count ?? "—"}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Palette className="w-3 h-3" />
                CSS Analyzed
              </div>
              <p className="text-lg font-bold">{domainProfile.css_analyzed ? "Yes" : "No"}</p>
            </div>
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

        {/* Last Crawl Info */}
        {domainProfile?.last_crawl && (
          <div className="text-sm text-muted-foreground">
            <Clock className="w-4 h-4 inline mr-1" />
            Last crawl: {new Date(domainProfile.last_crawl).toLocaleString()}
          </div>
        )}

        {/* Active Tasks Panel - Shows all running/queued tasks */}
        {(byType.crawl.length > 0 || byType.categorization.length > 0 || byType.css.length > 0) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Recent Tasks
              </h4>
              <Badge variant="outline" className="text-xs">
                {byType.crawl.length + byType.categorization.length + byType.css.length} total
              </Badge>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* Active Crawl Tasks */}
              {byType.crawl.slice(0, 5).map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border ${
                    task.statusValue === "running" || task.statusValue === "queued" || task.statusValue === "processing"
                      ? "bg-blue-500/10 border-blue-500/30"
                      : task.statusValue === "completed" || task.statusValue === "done"
                      ? "bg-green-500/10 border-green-500/30"
                      : task.statusValue === "failed" || task.statusValue === "error"
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-secondary/30 border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.statusValue)}
                      <span className="font-medium text-sm">Crawl</span>
                      <Badge variant="secondary" className="text-xs">
                        {task.statusValue}
                      </Badge>
                    </div>
                    {task.created_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(task.created_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  
                  {task.progress !== undefined && task.progress > 0 && (
                    <Progress value={task.progress} className="h-1.5 mb-2" />
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.pages_crawled !== undefined && (
                      <span>{task.pages_crawled} / {task.total_pages || "?"} pages</span>
                    )}
                    {task.current_url && (
                      <span className="truncate flex-1" title={task.current_url}>
                        <ExternalLink className="w-3 h-3 inline mr-1" />
                        {task.current_url}
                      </span>
                    )}
                    {task.message && !task.current_url && (
                      <span className="truncate flex-1">{task.message}</span>
                    )}
                  </div>
                  
                  {task.error && (
                    <div className="text-xs text-red-400 mt-1 truncate">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      {task.error}
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Active Categorization Tasks */}
              {byType.categorization.slice(0, 3).map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border ${
                    task.statusValue === "running" || task.statusValue === "queued" || task.statusValue === "processing"
                      ? "bg-violet-500/10 border-violet-500/30"
                      : task.statusValue === "completed" || task.statusValue === "done"
                      ? "bg-green-500/10 border-green-500/30"
                      : task.statusValue === "failed" || task.statusValue === "error"
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-secondary/30 border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.statusValue)}
                      <span className="font-medium text-sm">Categorization</span>
                      <Badge variant="secondary" className="text-xs">
                        {task.statusValue}
                      </Badge>
                    </div>
                    {task.created_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(task.created_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  
                  {task.message && (
                    <div className="text-xs text-muted-foreground truncate">
                      {task.message}
                    </div>
                  )}
                  
                  {task.categories && task.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.categories.slice(0, 3).map((cat, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Active CSS Tasks */}
              {byType.css.slice(0, 2).map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border ${
                    task.statusValue === "running" || task.statusValue === "queued" || task.statusValue === "processing"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : task.statusValue === "completed" || task.statusValue === "done"
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-secondary/30 border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.statusValue)}
                      <span className="font-medium text-sm">CSS Analysis</span>
                      <Badge variant="secondary" className="text-xs">
                        {task.statusValue}
                      </Badge>
                    </div>
                    {task.created_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(task.created_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  {task.message && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {task.message}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={handleStartCrawl}
            disabled={isCrawling}
            className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {isCrawling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isCrawling ? "Crawling..." : "Start Crawl"}
          </Button>
          
          <Button
            onClick={handleCategorizeDomain}
            disabled={isCategorizing}
            variant="outline"
            className="gap-2 border-blue-500/30 hover:bg-blue-500/10"
          >
            {isCategorizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Target className="w-4 h-4" />
            )}
            {isCategorizing ? "Categorizing..." : "Categorize Domain"}
          </Button>
          
          <Button
            onClick={handleAnalyzeCss}
            disabled={isAnalyzingCss}
            variant="outline"
            className="gap-2 border-violet-500/30 hover:bg-violet-500/10"
          >
            {isAnalyzingCss ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Palette className="w-4 h-4" />
            )}
            {isAnalyzingCss ? "Analyzing..." : "Analyze CSS"}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Crawl:</strong> Scans your website to understand its structure and content.</p>
          <p><strong>Categorize:</strong> Determines your business category for better content targeting.</p>
          <p><strong>CSS Analysis:</strong> Matches generated content styling to your website.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CADECrawlControl;