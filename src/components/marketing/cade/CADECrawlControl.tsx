import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe, RefreshCw, Play, Loader2, CheckCircle2, AlertTriangle,
  Clock, FileText, Palette, Target, Activity, MapPin, Languages, 
  Users, Info, ChevronDown, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

  // Get latest data from events
  const { latestCategorization, byType, refresh: refreshEvents } = useCadeEventTasks(domain);

  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain, params },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  }, [domain]);

  // Check for active crawl from events
  useEffect(() => {
    if (!domain) return;
    
    // Check if there's an active crawl task from the events
    const activeCrawl = byType.crawl.find(t => 
      t.statusValue === "running" || 
      t.statusValue === "processing" || 
      t.statusValue === "pending" || 
      t.statusValue === "queued"
    );
    
    if (activeCrawl) {
      setIsCrawling(true);
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
  }, [domain, byType.crawl, isCrawling, onRefresh]);

  // Check for active categorization
  useEffect(() => {
    if (!domain) return;
    
    const activeCat = byType.categorization.find(t => 
      t.statusValue === "running" || 
      t.statusValue === "processing" || 
      t.statusValue === "pending" || 
      t.statusValue === "queued"
    );
    
    if (activeCat) {
      setIsCategorizing(true);
    } else if (isCategorizing) {
      const latestCat = byType.categorization[0];
      if (latestCat) {
        if (latestCat.statusValue === "completed" || latestCat.statusValue === "done") {
          setIsCategorizing(false);
          toast.success("Categorization completed!");
          onRefresh?.();
        } else if (latestCat.statusValue === "failed" || latestCat.statusValue === "error") {
          setIsCategorizing(false);
          toast.error("Categorization failed");
        }
      }
    }
  }, [domain, byType.categorization, isCategorizing, onRefresh]);

  // Check for active CSS analysis
  useEffect(() => {
    if (!domain) return;
    
    const activeCss = byType.css.find(t => 
      t.statusValue === "running" || 
      t.statusValue === "processing" || 
      t.statusValue === "pending" || 
      t.statusValue === "queued"
    );
    
    if (activeCss) {
      setIsAnalyzingCss(true);
    } else if (isAnalyzingCss) {
      const latestCss = byType.css[0];
      if (latestCss) {
        if (latestCss.statusValue === "completed" || latestCss.statusValue === "done") {
          setIsAnalyzingCss(false);
          toast.success("CSS analysis completed!");
          onRefresh?.();
        } else if (latestCss.statusValue === "failed" || latestCss.statusValue === "error") {
          setIsAnalyzingCss(false);
          toast.error("CSS analysis failed");
        }
      }
    }
  }, [domain, byType.css, isAnalyzingCss, onRefresh]);

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
      
      toast.success("Crawl started! Check the Task Monitor for progress.");
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
              <Progress value={crawlTask.progress} className="h-2 mb-2" />
            )}
            
            {crawlTask.current_url && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                {crawlTask.current_url}
              </div>
            )}
            
            {crawlTask.message && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Info className="w-3 h-3 flex-shrink-0" />
                {crawlTask.message}
              </div>
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