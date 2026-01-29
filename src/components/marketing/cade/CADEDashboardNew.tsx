import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Brain, RefreshCw, Loader2, CheckCircle2, Clock, Play, Pause,
  Settings, Globe, Target, FileText, HelpCircle, Calendar, Zap,
  Mail, User, ExternalLink, ChevronDown, ChevronRight, LayoutGrid,
  AlertTriangle, Sparkles, Pencil
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DomainContextDialog } from "./DomainContextDialog";
import { useDomainContext } from "@/hooks/use-domain-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useBronApi, BronSubscription } from "@/hooks/use-bron-api";
import { useCadeEventTasks } from "@/hooks/use-cade-event-tasks";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
interface DomainProfile {
  domain?: string;
  category?: string;
  status?: string;
  crawled_pages?: number;
  last_crawl?: string;
  description?: string;
  categories?: string[];
  competitors?: string;
}

interface SchedulerInfo {
  status: "enabled" | "disabled" | "paused";
  nextGeneration?: string;
  frequency?: string;
  articlesPerBatch?: number;
}

interface AccountInfo {
  serviceType?: string;
  userName?: string;
  email?: string;
  authenticated: boolean;
}

interface ContentStats {
  total: number;
  published: number;
  drafts: number;
}

interface FAQStats {
  total: number;
  status: "up_to_date" | "generating" | "paused";
}

interface CADEDashboardNewProps {
  domain?: string;
  onSubscriptionChange?: (hasSubscription: boolean) => void;
}

// ─── Cache Helpers ───────────────────────────────────────────────────────────
const CACHE_KEY = "bron_subscription_cache";
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

interface CacheEntry {
  subscription: BronSubscription;
  cachedAt: number;
}

const getCachedSubscription = (targetDomain: string): BronSubscription | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as Record<string, CacheEntry>;
    const entry = parsed[targetDomain];
    if (!entry || Date.now() - entry.cachedAt > CACHE_MAX_AGE) return null;
    return entry.subscription;
  } catch {
    return null;
  }
};

const setCachedSubscription = (targetDomain: string, data: BronSubscription) => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const parsed = cached ? (JSON.parse(cached) as Record<string, CacheEntry>) : {};
    parsed[targetDomain] = { subscription: data, cachedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
  } catch { /* ignore */ }
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const CADEDashboardNew = ({ domain, onSubscriptionChange }: CADEDashboardNewProps) => {
  const { fetchSubscription } = useBronApi();
  const { stats, byType, latestCategorization, activeTasksByType, refresh: refreshTasks } = useCadeEventTasks(domain);
  
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasCadeSubscription, setHasCadeSubscription] = useState(false);
  
  // Data states
  const [domainProfile, setDomainProfile] = useState<DomainProfile | null>(null);
  const [scheduler, setScheduler] = useState<SchedulerInfo>({
    status: "enabled",
    nextGeneration: "11 hrs, 26 mins",
    frequency: "12hrs",
    articlesPerBatch: 1,
  });
  const [account, setAccount] = useState<AccountInfo>({
    serviceType: "SEOM 60",
    authenticated: true,
  });
  const [contentStats, setContentStats] = useState<ContentStats>({ total: 0, published: 0, drafts: 0 });
  const [faqStats, setFaqStats] = useState<FAQStats>({ total: 0, status: "up_to_date" });
  const [contentTab, setContentTab] = useState("articles");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scheduleCount, setScheduleCount] = useState("1");
  const [isScheduling, setIsScheduling] = useState(false);
  const [domainContextOpen, setDomainContextOpen] = useState(false);

  // Domain context hook for progress - shared with dialog
  const {
    context: domainContext,
    loading: domainContextLoading,
    saving: domainContextSaving,
    autoFilling: domainContextAutoFilling,
    fetchContext: fetchDomainContext,
    updateContext: updateDomainContext,
    autoFillContext: autoFillDomainContext,
    filledCount: domainContextFilledCount,
    totalFields: domainContextTotalFields,
    progressPercent: domainContextProgress,
  } = useDomainContext(domain);

  // Crawl state from tasks
  const crawlTask = activeTasksByType.crawl;
  const latestCrawl = byType.crawl[0];
  const isCrawling = !!crawlTask;

  // API helper
  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain, params },
    });
    if (error) throw new Error(error.message);
    // Handle nested error structure from CADE API
    if (data?.error) {
      const errMsg = typeof data.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : data.error;
      throw new Error(errMsg);
    }
    return data;
  }, [domain]);

  // Check subscription
  const checkSubscription = useCallback(async (): Promise<boolean> => {
    if (!domain) {
      setIsCheckingSubscription(false);
      setIsLoading(false);
      onSubscriptionChange?.(false);
      return false;
    }

    setIsCheckingSubscription(true);

    const cachedSub = getCachedSubscription(domain);
    if (cachedSub?.has_cade === true) {
      setHasCadeSubscription(true);
      onSubscriptionChange?.(true);
      setAccount(prev => ({
        ...prev,
        serviceType: cachedSub.plan || cachedSub.servicetype || "CADE",
      }));
      setIsCheckingSubscription(false);
      
      // Background refresh
      fetchSubscription(domain).then(fresh => {
        if (fresh?.has_cade === true) setCachedSubscription(domain, fresh);
      }).catch(() => {});
      
      return true;
    }

    try {
      const subData = await fetchSubscription(domain);
      if (subData?.has_cade === true) {
        setCachedSubscription(domain, subData);
        setHasCadeSubscription(true);
        onSubscriptionChange?.(true);
        setAccount(prev => ({
          ...prev,
          serviceType: subData.plan || subData.servicetype || "CADE",
        }));
        setIsCheckingSubscription(false);
        return true;
      }

      setHasCadeSubscription(false);
      onSubscriptionChange?.(false);
      setIsCheckingSubscription(false);
      return false;
    } catch {
      setHasCadeSubscription(false);
      onSubscriptionChange?.(false);
      setIsCheckingSubscription(false);
      return false;
    }
  }, [domain, fetchSubscription, onSubscriptionChange]);

  // Fetch domain data
  const fetchData = useCallback(async () => {
    if (!hasCadeSubscription || !domain) {
      setIsLoading(false);
      return;
    }

    try {
      const [profileRes, faqsRes] = await Promise.allSettled([
        callCadeApi("domain-profile"),
        callCadeApi("get-faqs"),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value) {
        const p = profileRes.value?.data || profileRes.value;
        setDomainProfile(p);
      }

      // Use categorization data if available
      if (latestCategorization) {
        setDomainProfile(prev => ({
          ...prev,
          description: latestCategorization.description,
          categories: latestCategorization.categories,
        }));
      }

      if (faqsRes.status === "fulfilled" && faqsRes.value) {
        const f = faqsRes.value?.data || faqsRes.value;
        const faqList = Array.isArray(f) ? f : f?.faqs || [];
        setFaqStats({ total: faqList.length, status: "up_to_date" });
      }
    } catch (err) {
      console.warn("[CADE Dashboard] Fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [callCadeApi, domain, hasCadeSubscription, latestCategorization]);

  // Init
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const hasSub = await checkSubscription();
      if (cancelled) return;
      if (hasSub) {
        fetchData();
        fetchDomainContext();
      } else {
        setIsLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [domain]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const hasSub = await checkSubscription();
    if (hasSub) await fetchData();
    refreshTasks();
    setIsRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  const handleTriggerCrawl = async () => {
    if (!domain) return;
    try {
      await callCadeApi("crawl-domain", { full_crawl: true });
      toast.success("Crawl started!");
      refreshTasks();
    } catch (err) {
      toast.error("Failed to start crawl");
    }
  };

  const handleToggleFaqGeneration = () => {
    setFaqStats(prev => ({
      ...prev,
      status: prev.status === "paused" ? "up_to_date" : "paused",
    }));
    toast.success(faqStats.status === "paused" ? "FAQ generation resumed" : "FAQ generation paused");
  };

  const handleScheduleNow = async () => {
    if (!domain) {
      toast.error("Please select a domain first");
      return;
    }
    setIsScheduling(true);
    try {
      const count = parseInt(scheduleCount);
      // Call CADE API to generate content
      await callCadeApi("generate-content", {
        keyword: "auto",
        content_type: "blog",
        platform: "wordpress",
        count: count,
        auto_publish: false,
      });
      toast.success(`Scheduled ${count} article(s) for generation!`);
      refreshTasks();
    } catch (err) {
      console.error("[CADE] Schedule error:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to schedule content";
      // Better error detection for WordPress connection issues
      if (errMsg.toLowerCase().includes("wordpress") && (errMsg.toLowerCase().includes("username") || errMsg.toLowerCase().includes("password") || errMsg.toLowerCase().includes("required"))) {
        toast.error("Please connect your WordPress platform first. Go to the CADE tab settings to add your WordPress credentials.", { duration: 6000 });
      } else if (errMsg.toLowerCase().includes("platform")) {
        toast.error("Please connect a publishing platform first");
      } else if (errMsg.toLowerCase().includes("crawl")) {
        toast.error("Please crawl the domain first");
      } else {
        toast.error(errMsg);
      }
    } finally {
      setIsScheduling(false);
    }
  };
  if (isCheckingSubscription) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-cyan-500/10 border border-violet-500/30"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-xl">
            <Brain className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold">Initializing CADE</h3>
            <p className="text-sm text-muted-foreground">Connecting to AI engine...</p>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
            <span className="text-sm text-muted-foreground">Verifying subscription</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // No subscription
  if (!hasCadeSubscription) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 rounded-2xl bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-violet-500/20 text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-violet-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">CADE Not Activated</h3>
        <p className="text-muted-foreground mb-4">
          {domain ? `No CADE subscription found for ${domain}` : "Select a domain to view CADE dashboard"}
        </p>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Check Again
        </Button>
      </motion.div>
    );
  }

  // ─── Main Dashboard ────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
      style={{ contain: 'layout style' }}
    >
      {/* Compact Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-violet-500 to-purple-600 p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">CADE Content Writer</h1>
              <p className="text-white/70 text-xs">AI-Powered content generation & SEO</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full h-8 w-8"
            onClick={handleRefresh}
          >
            <Settings className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Main Grid - 4 Columns for dense layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Scheduler Card - Compact */}
        <div className="relative rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-cyan-500/10 backdrop-blur-sm overflow-hidden p-4">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600" />
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-semibold text-sm">Scheduler</span>
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0.5">
              <span className="relative flex h-1.5 w-1.5 mr-1">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Active
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-background/50 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase">Next Gen</p>
              <p className="text-sm font-bold text-cyan-400">{scheduler.nextGeneration || "—"}</p>
            </div>
            <div className="p-2 rounded-lg bg-background/50 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase">Frequency</p>
              <p className="text-sm font-bold">{scheduler.frequency || "—"}</p>
            </div>
            <div className="p-2 rounded-lg bg-background/50 border border-border/30 col-span-2">
              <p className="text-[10px] text-muted-foreground uppercase">Batch Size</p>
              <p className="text-sm font-bold">{scheduler.articlesPerBatch || 1} article(s)</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Card - Compact */}
        <div className="relative rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-violet-500/10 backdrop-blur-sm overflow-hidden p-4">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-violet-400 to-purple-600" />
          
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <span className="font-semibold text-sm">Quick Actions</span>
          </div>

          <div className="space-y-2">
            <Select value={scheduleCount} onValueChange={setScheduleCount}>
              <SelectTrigger className="h-9 bg-background/50 border-border/50 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Article</SelectItem>
                <SelectItem value="2">2 Articles</SelectItem>
                <SelectItem value="3">3 Articles</SelectItem>
                <SelectItem value="5">5 Articles</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleScheduleNow}
              disabled={isScheduling}
              size="sm"
              className="w-full h-9 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white text-sm"
            >
              {isScheduling ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Generate Now
                </>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              <span className="text-cyan-400 font-medium">2/2</span> articles remaining
            </p>
          </div>
        </div>

        {/* Account Status Card - Compact */}
        <div className="relative rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 backdrop-blur-sm overflow-hidden p-4">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400 to-teal-600" />
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-semibold text-sm">Account</span>
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0.5">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="p-2 rounded-lg bg-background/50 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase">Plan</p>
              <p className="text-sm font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                {account.serviceType || "CADE Pro"}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-background/50 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase">Domain</p>
              <p className="text-xs font-medium truncate">{domain || "—"}</p>
            </div>
          </div>
        </div>

        {/* Domain Info Card - Compact */}
        <div className="relative rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10 backdrop-blur-sm overflow-hidden p-4">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-600" />
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-400" />
              </div>
              <span className="font-semibold text-sm">Domain Info</span>
            </div>
            <button
              onClick={() => setDomainContextOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Progress</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{domainContextFilledCount}/{domainContextTotalFields}</span>
                <Badge 
                  className={`text-[10px] px-1.5 py-0.5 ${
                    domainContextProgress >= 80
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : domainContextProgress >= 50
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      : "bg-red-500/15 text-red-400 border-red-500/30"
                  }`}
                >
                  {domainContextProgress}%
                </Badge>
              </div>
            </div>
            <Progress value={domainContextProgress} className="h-1.5" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDomainContextOpen(true)}
              className="w-full h-8 text-xs justify-start hover:bg-purple-500/10 border border-border/30"
            >
              <Globe className="w-3 h-3 mr-1.5 text-purple-400" />
              Complete Profile
              <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {/* Second Row - Crawl + FAQ in 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Website Crawl Card - Enhanced */}
        <div className="relative rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-red-500/5 backdrop-blur-sm overflow-hidden p-4">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-400 to-red-500" />
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Globe className="w-4 h-4 text-orange-400" />
              </div>
              <span className="font-semibold text-sm">Website Crawl</span>
            </div>
            
            {/* Status Badge */}
            {isCrawling ? (
              <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] px-2 py-0.5">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Crawling
              </Badge>
            ) : latestCrawl?.statusValue === "completed" || latestCrawl?.statusValue === "done" ? (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-2 py-0.5">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            ) : latestCrawl?.statusValue === "failed" ? (
              <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px] px-2 py-0.5">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Failed
              </Badge>
            ) : (
              <Badge className="bg-secondary/50 text-muted-foreground border-border/50 text-[10px] px-2 py-0.5">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 rounded-lg bg-background/50 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase">Last Crawl</p>
              <p className="text-xs font-medium truncate">
                {domainProfile?.last_crawl
                  ? new Date(domainProfile.last_crawl).toLocaleDateString()
                  : latestCrawl?.created_at
                  ? new Date(latestCrawl.created_at).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-background/50 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase">Pages</p>
              <p className="text-xs font-medium">{domainProfile?.crawled_pages || latestCrawl?.pages_crawled || "—"}</p>
            </div>
          </div>

          <Button
            onClick={handleTriggerCrawl}
            disabled={isCrawling}
            size="sm"
            className="w-full h-9 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm"
          >
            {isCrawling ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Crawling...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1.5" />
                Start Crawl
              </>
            )}
          </Button>
        </div>

        {/* FAQ Generation Card - Enhanced */}
        <div className="relative rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 backdrop-blur-sm overflow-hidden p-4">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-indigo-500" />
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-blue-400" />
              </div>
              <span className="font-semibold text-sm">FAQ Generation</span>
            </div>
            
            <Badge
              className={`text-[10px] px-2 py-0.5 ${
                faqStats.status === "up_to_date"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : faqStats.status === "paused"
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : "bg-blue-500/15 text-blue-400 border-blue-500/30"
              }`}
            >
              {faqStats.status === "up_to_date" && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {faqStats.status === "paused" && <Pause className="w-3 h-3 mr-1" />}
              {faqStats.status === "generating" && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {faqStats.status === "up_to_date" ? "Synced" : faqStats.status === "paused" ? "Paused" : "Generating"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 rounded-lg bg-background/50 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase">Total FAQs</p>
              <p className="text-lg font-bold text-blue-400">{faqStats.total}</p>
            </div>
            <div className="p-2 rounded-lg bg-background/50 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase">Status</p>
              <p className="text-xs font-medium capitalize">{faqStats.status.replace("_", " ")}</p>
            </div>
          </div>

          <Button
            onClick={handleToggleFaqGeneration}
            variant="outline"
            size="sm"
            className={`w-full h-9 text-sm ${
              faqStats.status === "paused"
                ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400"
                : "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-400"
            }`}
          >
            {faqStats.status === "paused" ? (
              <>
                <Play className="w-3 h-3 mr-1.5" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 mr-1.5" />
                Pause
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content Management - Compact Tabs */}
      <div className="relative rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-semibold text-sm">Content Management</span>
            </div>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              {contentStats.total} items
            </Badge>
          </div>
          
          <Tabs value={contentTab} onValueChange={setContentTab}>
            <TabsList className="bg-secondary/30 h-8 p-0.5">
              <TabsTrigger value="articles" className="text-xs h-7 px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-violet-500/20 data-[state=active]:text-cyan-400">
                Articles
              </TabsTrigger>
              <TabsTrigger value="faq" className="text-xs h-7 px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-violet-500/20 data-[state=active]:text-cyan-400">
                FAQs
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="text-xs h-7 px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-violet-500/20 data-[state=active]:text-cyan-400">
                Scheduled
              </TabsTrigger>
            </TabsList>

            <TabsContent value="articles" className="mt-4 space-y-3">
              {/* Compact Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 text-center">
                  <p className="text-2xl font-bold text-cyan-400">{contentStats.total}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{contentStats.published}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Published</p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 text-center">
                  <p className="text-2xl font-bold text-orange-400">{contentStats.drafts}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Drafts</p>
                </div>
              </div>

              {/* Filter + Action Row */}
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs bg-background/50 border-border/50 flex-1">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white text-xs">
                  <ExternalLink className="w-3 h-3 mr-1.5" />
                  View All
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="faq" className="mt-4">
              <div className="text-center py-6">
                <div className="w-10 h-10 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                  <HelpCircle className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-sm font-medium">{faqStats.total} FAQs</p>
                <p className="text-xs text-muted-foreground mb-3">Generated from your content</p>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Manage FAQs
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="mt-4">
              <div className="text-center py-6">
                <div className="w-10 h-10 mx-auto rounded-lg bg-violet-500/10 flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 text-violet-400" />
                </div>
                <p className="text-sm font-medium">No scheduled content</p>
                <p className="text-xs text-muted-foreground mb-3">Schedule articles for auto-publish</p>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Schedule Content
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Domain Context Dialog */}
      {domain && (
        <DomainContextDialog
          open={domainContextOpen}
          onOpenChange={(open) => {
            setDomainContextOpen(open);
            if (!open) {
              // Refresh context when dialog closes
              fetchDomainContext();
            }
          }}
          domain={domain}
          context={domainContext}
          loading={domainContextLoading}
          saving={domainContextSaving}
          autoFilling={domainContextAutoFilling}
          onUpdateContext={updateDomainContext}
          onAutoFillContext={autoFillDomainContext}
          filledCount={domainContextFilledCount}
          progressPercent={domainContextProgress}
        />
      )}
    </motion.div>
  );
};

export default CADEDashboardNew;
