import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe, RefreshCw, Play, Loader2, CheckCircle2, AlertTriangle,
  Clock, FileText, Palette, Target, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  status?: string;
  progress?: number;
  pages_crawled?: number;
  total_pages?: number;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

interface CADECrawlControlProps {
  domain?: string;
  domainProfile?: DomainProfile | null;
  onRefresh?: () => void;
}

export const CADECrawlControl = ({ domain, domainProfile, onRefresh }: CADECrawlControlProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isAnalyzingCss, setIsAnalyzingCss] = useState(false);
  const [crawlTask, setCrawlTask] = useState<CrawlTask | null>(null);
  const [activeTasks, setActiveTasks] = useState<CrawlTask[]>([]);

  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain, params },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  }, [domain]);

  // Check for active crawl tasks
  const checkActiveTasks = useCallback(async () => {
    if (!domain) return;
    try {
      const result = await callCadeApi("crawl-tasks");
      const tasks = result?.data || result?.tasks || result || [];
      setActiveTasks(Array.isArray(tasks) ? tasks : []);
      
      // Find active task for this domain
      const activeTask = tasks.find((t: CrawlTask) => 
        t.status === "processing" || t.status === "pending"
      );
      if (activeTask) {
        setCrawlTask(activeTask);
        setIsCrawling(true);
      }
    } catch (err) {
      console.error("[CADE Crawl] Tasks check error:", err);
    }
  }, [callCadeApi, domain]);

  useEffect(() => {
    if (domain) {
      checkActiveTasks();
    }
  }, [domain, checkActiveTasks]);

  // Poll for task status while crawling
  useEffect(() => {
    if (!isCrawling || !crawlTask?.task_id) return;
    
    const interval = setInterval(async () => {
      try {
        const result = await callCadeApi("crawl-task-status", { task_id: crawlTask.task_id });
        const status = result?.data || result;
        
        if (status?.status === "completed" || status?.status === "failed") {
          setIsCrawling(false);
          setCrawlTask(status);
          if (status.status === "completed") {
            toast.success("Crawl completed successfully!");
          } else {
            toast.error("Crawl failed: " + (status.error || "Unknown error"));
          }
          onRefresh?.();
        } else {
          setCrawlTask(status);
        }
      } catch (err) {
        console.error("[CADE Crawl] Status check error:", err);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isCrawling, crawlTask?.task_id, callCadeApi, onRefresh]);

  const handleStartCrawl = async () => {
    if (!domain) return;
    setIsCrawling(true);
    try {
      const result = await callCadeApi("crawl-domain", {
        full_crawl: true,
      });
      const task = result?.data || result;
      setCrawlTask(task);
      toast.success("Crawl started! This may take a few minutes.");
    } catch (err) {
      console.error("[CADE Crawl] Start error:", err);
      toast.error("Failed to start crawl");
      setIsCrawling(false);
    }
  };

  const handleCategorizeDomain = async () => {
    if (!domain) return;
    setIsCategorizing(true);
    try {
      await callCadeApi("categorize-domain");
      toast.success("Domain categorization started!");
      setTimeout(() => {
        onRefresh?.();
        setIsCategorizing(false);
      }, 3000);
    } catch (err) {
      console.error("[CADE Crawl] Categorize error:", err);
      toast.error("Failed to categorize domain");
      setIsCategorizing(false);
    }
  };

  const handleAnalyzeCss = async () => {
    if (!domain) return;
    setIsAnalyzingCss(true);
    try {
      await callCadeApi("analyze-css");
      toast.success("CSS analysis started! Content will match your site's styling.");
      setTimeout(() => {
        onRefresh?.();
        setIsAnalyzingCss(false);
      }, 5000);
    } catch (err) {
      console.error("[CADE Crawl] CSS analyze error:", err);
      toast.error("Failed to analyze CSS");
      setIsAnalyzingCss(false);
    }
  };

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
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "pending":
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
          onClick={onRefresh}
          disabled={isLoading}
          className="border-green-500/30 hover:bg-green-500/10"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Domain Stats */}
        {domainProfile && (
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

        {/* Last Crawl Info */}
        {domainProfile?.last_crawl && (
          <div className="text-sm text-muted-foreground">
            <Clock className="w-4 h-4 inline mr-1" />
            Last crawl: {new Date(domainProfile.last_crawl).toLocaleString()}
          </div>
        )}

        {/* Active Crawl Progress */}
        {isCrawling && crawlTask && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="font-medium text-sm">Crawl in Progress</span>
              </div>
              {crawlTask.pages_crawled !== undefined && (
                <span className="text-sm text-muted-foreground">
                  {crawlTask.pages_crawled} / {crawlTask.total_pages || "?"} pages
                </span>
              )}
            </div>
            {crawlTask.progress !== undefined && (
              <Progress value={crawlTask.progress} className="h-2" />
            )}
          </motion.div>
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
