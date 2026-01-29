import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Brain, RefreshCw, Loader2, CheckCircle2, Clock, Play, Pause,
  Settings, Globe, Target, FileText, HelpCircle, Calendar, Zap,
  Mail, User, ExternalLink, ChevronDown, ChevronRight, LayoutGrid,
  AlertTriangle, Sparkles
} from "lucide-react";
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
    if (data?.error) throw new Error(data.error);
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
      if (hasSub) fetchData();
      else setIsLoading(false);
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
      if (errMsg.toLowerCase().includes("wordpress") || errMsg.toLowerCase().includes("platform")) {
        toast.error("Please connect your WordPress platform first");
      } else if (errMsg.includes("crawl")) {
        toast.error("Please crawl the domain first");
      } else {
        toast.error(errMsg);
      }
    } finally {
      setIsScheduling(false);
    }
  };

  // Loading state
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
      className="space-y-6"
    >
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-violet-500 to-purple-600 p-6 md:p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Welcome to CADE Content Writer
            </h1>
            <p className="text-white/80 text-sm md:text-base">
              Manage your AI-Powered content generation and SEO Optimization
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            onClick={handleRefresh}
          >
            <Settings className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Three Column Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scheduler Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="w-1 h-5 bg-cyan-500 rounded-full" />
              Scheduler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Scheduler Status</span>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500 font-medium text-sm">Enabled</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Next Generation</span>
              <p className="font-semibold mt-0.5">{scheduler.nextGeneration || "—"}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Generation Frequency</span>
              <p className="font-semibold mt-0.5">{scheduler.frequency || "—"}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Articles Per Batch</span>
              <p className="font-semibold mt-0.5">{scheduler.articlesPerBatch || 1} article(s)</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="w-1 h-5 bg-violet-500 rounded-full" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Schedule Content Now</span>
              <Select value={scheduleCount} onValueChange={setScheduleCount}>
                <SelectTrigger className="mt-1.5 bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Article(s)</SelectItem>
                  <SelectItem value="2">2 Article(s)</SelectItem>
                  <SelectItem value="3">3 Article(s)</SelectItem>
                  <SelectItem value="5">5 Article(s)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleScheduleNow}
              disabled={isScheduling}
              className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white"
            >
              {isScheduling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                "Schedule Now"
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Remaining this week: <span className="text-foreground font-medium">2 of 2 articles</span>
            </p>
          </CardContent>
        </Card>

        {/* Account Status Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="w-1 h-5 bg-emerald-500 rounded-full" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Service Type</span>
              <p className="font-semibold mt-0.5">{account.serviceType || "CADE"}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">User</span>
              <p className="font-semibold mt-0.5">{account.userName || domain || "—"}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Email</span>
              <p className="font-semibold mt-0.5 truncate">{account.email || "—"}</p>
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Authenticated
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Crawl + Domain Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Website Crawl Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="w-1 h-5 bg-cyan-500 rounded-full" />
              Website Crawl
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Badge */}
            <div className="p-3 rounded-lg bg-secondary/50 border border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCrawling ? (
                  <>
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-blue-500 font-medium">Crawling...</span>
                  </>
                ) : latestCrawl?.statusValue === "completed" || latestCrawl?.statusValue === "done" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <div>
                      <span className="text-emerald-500 font-medium">Complete</span>
                      <p className="text-xs text-muted-foreground">Crawl finished successfully.</p>
                    </div>
                  </>
                ) : latestCrawl?.statusValue === "failed" || latestCrawl?.statusValue === "error" ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-red-500 font-medium">Failed</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Not crawled yet</span>
                  </>
                )}
              </div>
              {(latestCrawl?.statusValue === "completed" || latestCrawl?.statusValue === "done") && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
            </div>

            {/* Last Crawl */}
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Last Crawl:</span>
              <p className="font-medium mt-0.5">
                {domainProfile?.last_crawl
                  ? new Date(domainProfile.last_crawl).toLocaleString()
                  : latestCrawl?.created_at
                  ? new Date(latestCrawl.created_at).toLocaleString()
                  : "Never"}
              </p>
            </div>

            {/* Trigger Button */}
            <Button
              onClick={handleTriggerCrawl}
              disabled={isCrawling}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              {isCrawling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Crawling...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Trigger Manual Crawl
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Update content analysis (takes several minutes)
            </p>
          </CardContent>
        </Card>

        {/* Domain Information Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="w-1 h-5 bg-violet-500 rounded-full" />
              Domain Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Competitors */}
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Competitors:</span>
              <div className="mt-1.5 p-3 rounded-lg bg-secondary/50 border border-border">
                {domainProfile?.competitors ? (
                  <p className="text-sm">{domainProfile.competitors}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No competitors added yet.{" "}
                    <Button variant="link" className="h-auto p-0 text-cyan-500">
                      Add competitors in Settings
                    </Button>
                  </p>
                )}
              </div>
            </div>

            {/* Business Description */}
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Business Description:</span>
              <div className="mt-1.5">
                {domainProfile?.description ? (
                  <>
                    <p className="text-sm leading-relaxed line-clamp-4">
                      {domainProfile.description}
                    </p>
                    <Button variant="link" className="h-auto p-0 text-cyan-500 mt-1">
                      Read more
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No description available. Run categorization to generate.</p>
                )}
              </div>
            </div>

            {/* Categories */}
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Categories:</span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {domainProfile?.categories?.length ? (
                  domainProfile.categories.map((cat, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs"
                    >
                      {cat}
                    </Badge>
                  ))
                ) : latestCategorization?.categories?.length ? (
                  latestCategorization.categories.map((cat, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs"
                    >
                      {cat}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No categories yet</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Generation Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="w-1 h-5 bg-cyan-500 rounded-full" />
            FAQ Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Status</span>
              <Badge
                className={
                  faqStats.status === "up_to_date"
                    ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30 gap-1.5"
                    : faqStats.status === "paused"
                    ? "bg-amber-500/15 text-amber-500 border-amber-500/30 gap-1.5"
                    : "bg-blue-500/15 text-blue-500 border-blue-500/30 gap-1.5"
                }
              >
                {faqStats.status === "up_to_date" && <CheckCircle2 className="w-3 h-3" />}
                {faqStats.status === "paused" && <Pause className="w-3 h-3" />}
                {faqStats.status === "generating" && <Loader2 className="w-3 h-3 animate-spin" />}
                {faqStats.status === "up_to_date"
                  ? "Up to date"
                  : faqStats.status === "paused"
                  ? "Paused"
                  : "Generating"}
              </Badge>
            </div>
            <Button
              onClick={handleToggleFaqGeneration}
              variant="outline"
              className={
                faqStats.status === "paused"
                  ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-500"
                  : "bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/20 text-violet-400"
              }
            >
              {faqStats.status === "paused" ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume FAQ Generation
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause FAQ Generation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Management Section */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="w-1 h-5 bg-violet-500 rounded-full" />
            Content Management
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your CADE-generated content and view scheduling information.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs */}
          <Tabs value={contentTab} onValueChange={setContentTab}>
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="articles" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                Blog Article
              </TabsTrigger>
              <TabsTrigger value="faq" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                FAQ
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                Scheduled
              </TabsTrigger>
            </TabsList>

            <TabsContent value="articles" className="mt-4 space-y-4">
              <div>
                <h3 className="font-semibold">Blog Articles</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your CADE-generated blog articles. Filter by status to see published or draft content.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border bg-secondary/30 text-center">
                  <p className="text-3xl font-bold text-cyan-400">{contentStats.total}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Articles</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-secondary/30 text-center">
                  <p className="text-3xl font-bold text-emerald-400">{contentStats.published}</p>
                  <p className="text-sm text-muted-foreground mt-1">Published</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-secondary/30 text-center">
                  <p className="text-3xl font-bold text-orange-400">{contentStats.drafts}</p>
                  <p className="text-sm text-muted-foreground mt-1">Drafts</p>
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                <span className="text-sm text-muted-foreground">Filter by status :</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View All Button */}
              <Button className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white">
                <ExternalLink className="w-4 h-4 mr-2" />
                View All CADE Posts
              </Button>
            </TabsContent>

            <TabsContent value="faq" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>{faqStats.total} FAQs generated</p>
                <Button variant="outline" className="mt-3">
                  Manage FAQs
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No scheduled content</p>
                <Button variant="outline" className="mt-3">
                  Schedule Content
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CADEDashboardNew;
