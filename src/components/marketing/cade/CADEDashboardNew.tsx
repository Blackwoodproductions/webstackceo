import { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  Brain, RefreshCw, Loader2, CheckCircle2, Clock, Play, Pause,
  Settings, Globe, Target, FileText, HelpCircle, Calendar, Zap,
  AlertTriangle, Sparkles, Search, Save, X, Plus, ChevronDown,
  Activity, ExternalLink, User
} from "lucide-react";
import { DomainContextDialog } from "./DomainContextDialog";
import { useDomainContext } from "@/hooks/use-domain-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
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

interface ContentItem {
  id?: string;
  content_id?: string;
  title?: string;
  content?: string;
  status?: string;
  type?: string;
  keyword?: string;
  created_at?: string;
  word_count?: number;
}

interface FAQItem {
  id?: string;
  faq_id?: string;
  question?: string;
  answer?: string;
  status?: string;
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

// ─── Section Card with Left Border ─────────────────────────────────────────
interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  accentColor?: string;
  className?: string;
}

const SectionCard = memo(({ title, children, accentColor = "cyan", className = "" }: SectionCardProps) => {
  const borderColors: Record<string, string> = {
    cyan: "border-l-cyan-500",
    orange: "border-l-orange-500",
    violet: "border-l-violet-500",
    emerald: "border-l-emerald-500",
    blue: "border-l-blue-500",
  };
  
  return (
    <Card className={`bg-card/50 border border-border/50 border-l-4 ${borderColors[accentColor]} ${className}`}>
      <CardContent className="p-5">
        <h3 className="font-semibold text-base mb-4">{title}</h3>
        {children}
      </CardContent>
    </Card>
  );
});
SectionCard.displayName = 'SectionCard';

// ─── Stat Box ───────────────────────────────────────────────────────────────
interface StatBoxProps {
  value: number;
  label: string;
  color?: string;
}

const StatBox = memo(({ value, label, color = "cyan" }: StatBoxProps) => {
  const textColors: Record<string, string> = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    orange: "text-orange-400",
  };
  
  return (
    <div className="flex-1 rounded-xl border border-border/50 bg-card/30 p-6 text-center">
      <div className={`text-4xl font-bold ${textColors[color]}`}>{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
});
StatBox.displayName = 'StatBox';

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
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [contentTab, setContentTab] = useState("articles");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scheduleCount, setScheduleCount] = useState("1");
  const [isScheduling, setIsScheduling] = useState(false);
  const [domainContextOpen, setDomainContextOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [faqPaused, setFaqPaused] = useState(false);
  
  // Account info
  const [account, setAccount] = useState({
    serviceType: "SEOM 60",
    userName: "",
    email: "",
    authenticated: true,
  });

  // Domain context hook
  const {
    context: domainContext,
    loading: domainContextLoading,
    saving: domainContextSaving,
    autoFilling: domainContextAutoFilling,
    fetchContext: fetchDomainContext,
    updateContext: updateDomainContext,
    autoFillContext: autoFillDomainContext,
    filledCount: domainContextFilledCount,
    progressPercent: domainContextProgress,
  } = useDomainContext(domain);

  // Crawl state
  const crawlTask = activeTasksByType.crawl;
  const latestCrawl = byType.crawl[0];
  const isCrawling = !!crawlTask;

  // API helper
  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain, params },
    });
    if (error) throw new Error(error.message);
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
      const [profileRes, contentRes, faqsRes] = await Promise.allSettled([
        callCadeApi("domain-profile"),
        callCadeApi("list-content"),
        callCadeApi("get-faqs"),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value) {
        const p = profileRes.value?.data || profileRes.value;
        setDomainProfile(p);
      }

      if (latestCategorization) {
        setDomainProfile(prev => ({
          ...prev,
          description: latestCategorization.description,
          categories: latestCategorization.categories,
        }));
      }

      if (contentRes.status === "fulfilled" && contentRes.value) {
        const c = contentRes.value?.data || contentRes.value;
        const contentList = Array.isArray(c) ? c : c?.content || c?.articles || [];
        setArticles(contentList);
      }

      if (faqsRes.status === "fulfilled" && faqsRes.value) {
        const f = faqsRes.value?.data || faqsRes.value;
        const faqList = Array.isArray(f) ? f : f?.faqs || [];
        setFaqs(faqList);
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
    } catch (err: any) {
      toast.error(err.message || "Failed to start crawl");
    }
  };

  const handleScheduleNow = async () => {
    if (!domain) return;
    setIsScheduling(true);
    try {
      await callCadeApi("generate-content", { count: parseInt(scheduleCount) });
      toast.success(`Scheduled ${scheduleCount} article(s) for generation!`);
      setTimeout(() => fetchData(), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule content");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleToggleFaq = () => {
    setFaqPaused(!faqPaused);
    toast.success(faqPaused ? "FAQ generation resumed" : "FAQ generation paused");
  };

  // Stats
  const contentStats = useMemo(() => ({
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    drafts: articles.filter(a => a.status === 'draft').length,
  }), [articles]);

  // Loading state
  if (isCheckingSubscription) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-violet-400" />
          <p className="text-muted-foreground">Checking CADE subscription...</p>
        </div>
      </div>
    );
  }

  // No subscription
  if (!hasCadeSubscription) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <h3 className="text-lg font-semibold mb-2">CADE Not Activated</h3>
          <p className="text-sm text-muted-foreground">
            CADE (Content Automation & Distribution Engine) is not activated for {domain || 'this domain'}.
            Contact support to enable automated content generation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ contain: 'layout style' }}>
      
      {/* Domain Context Dialog */}
      <DomainContextDialog
        open={domainContextOpen}
        onOpenChange={setDomainContextOpen}
        domain={domain || ""}
        context={domainContext}
        loading={domainContextLoading}
        saving={domainContextSaving}
        autoFilling={domainContextAutoFilling}
        onUpdateContext={updateDomainContext}
        onAutoFillContext={autoFillDomainContext}
        filledCount={domainContextFilledCount}
        progressPercent={domainContextProgress}
      />

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-violet-500 p-8">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 80% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
            }}
          />
        </div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to CADE Content Writer</h1>
            <p className="text-white/80 text-sm">Manage your AI-Powered content generation and SEO Optimization</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full h-12 w-12"
            onClick={() => setDomainContextOpen(true)}
          >
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Row 1: Scheduler, Quick Actions, Account Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Scheduler Card */}
        <SectionCard title="Scheduler" accentColor="cyan">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Scheduler Status</p>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Enabled</span>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Next Generation</p>
              <p className="text-lg font-bold mt-0.5">11 hrs, 26 mins, 5 sec</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Generation Frequency</p>
              <p className="font-semibold mt-0.5">12hrs</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Articles Per Batch</p>
              <p className="font-semibold mt-0.5">1 article(s)</p>
            </div>
          </div>
        </SectionCard>

        {/* Quick Actions Card */}
        <SectionCard title="Quick Actions" accentColor="cyan">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Schedule Content Now</p>
              <Select value={scheduleCount} onValueChange={setScheduleCount}>
                <SelectTrigger className="bg-background/60 border-border/50">
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
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white"
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
              Remaining this week: <span className="text-foreground font-semibold">2 of 2 articles</span>
            </p>
          </div>
        </SectionCard>

        {/* Account Status Card */}
        <SectionCard title="Account Status" accentColor="cyan">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Service Type</p>
              <p className="text-lg font-bold mt-0.5">{account.serviceType}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">User</p>
              <p className="font-semibold mt-0.5">{domainContext?.business_name || domain || "—"}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
              <p className="text-muted-foreground mt-0.5">{domainContext?.email || account.email || "—"}</p>
            </div>
            
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
              Authenticated
              <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
            </Badge>
          </div>
        </SectionCard>
      </div>

      {/* Row 2: Website Crawl + Domain Information */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* Website Crawl Card - 2 columns */}
        <div className="md:col-span-2">
          <SectionCard title="Website Crawl" accentColor="orange">
            <div className="space-y-4">
              {/* Status Box */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-400 font-semibold">Complete</p>
                    <p className="text-xs text-muted-foreground">Crawl finished successfully.</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Crawl:</p>
                <p className="font-semibold mt-0.5">
                  {domainProfile?.last_crawl
                    ? new Date(domainProfile.last_crawl).toLocaleString()
                    : latestCrawl?.created_at
                    ? new Date(latestCrawl.created_at).toLocaleString()
                    : "11/13/2025, 02:44:14 PM"}
                </p>
              </div>

              <Button
                onClick={handleTriggerCrawl}
                disabled={isCrawling}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                {isCrawling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  "Trigger Manual Crawl"
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Update content analysis (takes several minutes)
              </p>
            </div>
          </SectionCard>
        </div>

        {/* Domain Information Card - 3 columns */}
        <div className="md:col-span-3">
          <SectionCard title="Domain Information" accentColor="cyan">
            <div className="space-y-5">
              {/* Competitors */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Competitors:</p>
                <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                  {domainProfile?.competitors ? (
                    <p className="text-sm">{domainProfile.competitors}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No competitors added yet.{" "}
                      <button 
                        onClick={() => setDomainContextOpen(true)}
                        className="text-cyan-400 hover:underline"
                      >
                        Add competitors in Settings
                      </button>
                    </p>
                  )}
                </div>
              </div>

              {/* Business Description */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Business Description:</p>
                <div className="text-sm">
                  {domainProfile?.description ? (
                    <>
                      <p className={descriptionExpanded ? "" : "line-clamp-3"}>
                        {domainProfile.description}
                      </p>
                      {domainProfile.description.length > 200 && (
                        <button
                          onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                          className="text-cyan-400 hover:underline text-sm mt-1"
                        >
                          {descriptionExpanded ? "Show less" : "Read more"}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">No description available.</p>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Categories:</p>
                <div className="flex flex-wrap gap-2">
                  {domainProfile?.categories && domainProfile.categories.length > 0 ? (
                    domainProfile.categories.map((cat, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 text-xs px-3 py-1"
                      >
                        {cat}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No categories assigned.</p>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Row 3: FAQ Generation */}
      <SectionCard title="FAQ Generation" accentColor="cyan">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Status</p>
            <Badge className={`${faqPaused 
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            } px-4 py-1.5`}>
              {faqPaused ? "Paused" : "Up to date"}
              {!faqPaused && <CheckCircle2 className="w-4 h-4 ml-2" />}
            </Badge>
          </div>
          
          <Button
            onClick={handleToggleFaq}
            className={`${faqPaused 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700' 
              : 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600'
            } text-white min-w-[200px]`}
          >
            {faqPaused ? (
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
      </SectionCard>

      {/* Row 4: Content Management */}
      <SectionCard title="Content Management" accentColor="cyan">
        <div className="space-y-6">
          <p className="text-muted-foreground text-sm -mt-2">
            Manage your CADE-generated content and view scheduling information.
          </p>
          
          {/* Tabs */}
          <Tabs value={contentTab} onValueChange={setContentTab}>
            <TabsList className="bg-transparent border-b border-border/50 rounded-none p-0 h-auto">
              <TabsTrigger 
                value="articles" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-3 px-4"
              >
                Blog Article
              </TabsTrigger>
              <TabsTrigger 
                value="faqs" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-3 px-4"
              >
                FAQ
              </TabsTrigger>
              <TabsTrigger 
                value="scheduled" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-3 px-4"
              >
                Scheduled
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="articles" className="mt-6 space-y-6">
              <div>
                <h4 className="font-semibold text-base mb-2">Blog Articles</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your CADE-generated blog articles. Filter by status to see published or draft content.
                </p>
              </div>
              
              {/* Stats Boxes */}
              <div className="flex gap-4">
                <StatBox value={contentStats.total} label="Total Articles" color="cyan" />
                <StatBox value={contentStats.published} label="Published" color="emerald" />
                <StatBox value={contentStats.drafts} label="Drafts" color="orange" />
              </div>
              
              {/* Filter */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-background/50 border border-border/30">
                <span className="text-sm text-muted-foreground">Filter by status :</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 bg-background/60 border-border/50">
                    <SelectValue placeholder="All Statuses" />
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
              <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white">
                View All CADE Posts
              </Button>
            </TabsContent>
            
            <TabsContent value="faqs" className="mt-6 space-y-6">
              <div>
                <h4 className="font-semibold text-base mb-2">FAQ Items</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your CADE-generated FAQ content.
                </p>
              </div>
              
              <div className="flex gap-4">
                <StatBox value={faqs.length} label="Total FAQs" color="cyan" />
              </div>
            </TabsContent>
            
            <TabsContent value="scheduled" className="mt-6 space-y-6">
              <div>
                <h4 className="font-semibold text-base mb-2">Scheduled Content</h4>
                <p className="text-sm text-muted-foreground">
                  View upcoming scheduled content generation.
                </p>
              </div>
              
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No scheduled content at this time.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SectionCard>
    </div>
  );
};

export default CADEDashboardNew;
