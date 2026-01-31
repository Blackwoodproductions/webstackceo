import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import {
  Brain, RefreshCw, Loader2, CheckCircle2, Clock, Play, Pause,
  Settings, Globe, Target, FileText, HelpCircle, Calendar, Zap,
  AlertTriangle, Sparkles, Search, Save, X, Plus, ChevronDown,
  Activity, ExternalLink, User, TrendingUp, Link2, BarChart3, Database,
  Wand2, Archive
} from "lucide-react";
import { DomainContextDialog } from "./DomainContextDialog";
import { CADEActivationPitch } from "./CADEActivationPitch";
import { CADEPlatformCards } from "./CADEPlatformCards";
import { CADEInlineContentEditor, ContentItem } from "./CADEInlineContentEditor";
import { CADEInlineFAQEditor, FAQItem } from "./CADEInlineFAQEditor";
import { CADEVaultIntegration } from "./CADEVaultIntegration";
import { useDomainContext } from "@/hooks/use-domain-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useAuth } from "@/contexts/AuthContext";

import { toast } from "sonner";

// Types imported from CADEInlineContentEditor and CADEInlineFAQEditor

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

interface CADEDashboardNewProps {
  domain?: string;
  onSubscriptionChange?: (hasSubscription: boolean) => void;
  /** When true, the CADE tab is currently active/visible - triggers subscription recheck */
  isActive?: boolean;
}

// ─── Cache Helpers ───────────────────────────────────────────────────────────
// V4: Force fresh check on load, cache confirmed subscriptions for session
const CACHE_KEY = "cade_subscription_cache_v4";
const CACHE_MAX_AGE_CONFIRMED = 24 * 60 * 60 * 1000; // 24 hours for confirmed subscriptions
const CACHE_MAX_AGE_FREE = 2 * 60 * 1000; // 2 minutes for non-subscribers (faster refresh)

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
    if (!entry) return null;
    
    // Use different cache durations based on subscription level
    // cade_level > 0 means subscribed, use 24hr cache; level 0 means no subscription, use 2min cache
    const hasCade = (entry.subscription.cade_level ?? 0) > 0;
    const maxAge = hasCade ? CACHE_MAX_AGE_CONFIRMED : CACHE_MAX_AGE_FREE;
    if (Date.now() - entry.cachedAt > maxAge) return null;
    
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

// Clear subscription cache for a domain (useful on domain switch)
const clearCachedSubscription = (targetDomain: string) => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return;
    const parsed = JSON.parse(cached) as Record<string, CacheEntry>;
    delete parsed[targetDomain];
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
  
  const glowStyles: Record<string, React.CSSProperties> = {
    cyan: { boxShadow: '-8px 0 30px -5px rgba(6, 182, 212, 0.25), 0 0 15px -5px rgba(6, 182, 212, 0.1)' },
    orange: { boxShadow: '-8px 0 30px -5px rgba(249, 115, 22, 0.25), 0 0 15px -5px rgba(249, 115, 22, 0.1)' },
    violet: { boxShadow: '-8px 0 30px -5px rgba(139, 92, 246, 0.25), 0 0 15px -5px rgba(139, 92, 246, 0.1)' },
    emerald: { boxShadow: '-8px 0 30px -5px rgba(16, 185, 129, 0.25), 0 0 15px -5px rgba(16, 185, 129, 0.1)' },
    blue: { boxShadow: '-8px 0 30px -5px rgba(59, 130, 246, 0.25), 0 0 15px -5px rgba(59, 130, 246, 0.1)' },
  };
  
  return (
    <Card 
      className={`bg-card/50 border border-border/50 border-l-4 ${borderColors[accentColor]} ${className}`}
      style={glowStyles[accentColor]}
    >
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
export const CADEDashboardNew = ({ domain, onSubscriptionChange, isActive = true }: CADEDashboardNewProps) => {
  const { fetchSubscription } = useBronApi();
  const { isAdmin } = useAuth();
  const { tasks, stats, byType, latestCategorization, activeTasksByType, refresh: refreshTasks } = useCadeEventTasks(domain);
  
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Admins bypass subscription check
  const [hasCadeSubscription, setHasCadeSubscription] = useState(false);
  const [subscriptionCheckedOnce, setSubscriptionCheckedOnce] = useState(false);
  const prevIsActiveRef = useRef(false);
  
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
  
  // Account info with CADE level
  const [account, setAccount] = useState({
    serviceType: "SEOM 60",
    userName: "",
    email: "",
    authenticated: true,
    cadeLevel: 0, // 0=none, 1=Starter, 2=Basic, 3=Standard, 4=Pro, 5=Premium, 6=Enterprise, 7=Agency, 8=White Label
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

  // Check subscription - only force refresh when tab becomes active or domain changes
  // Admins always get access (bypass subscription check)
  const checkSubscription = useCallback(async (forceRefresh = false): Promise<boolean> => {
    if (!domain) {
      setIsCheckingSubscription(false);
      setIsLoading(false);
      onSubscriptionChange?.(false);
      return false;
    }

    // Admin bypass - admins can access CADE for any domain with full access
    if (isAdmin) {
      console.log("[CADE] Admin bypass - granting full access for", domain);
      setHasCadeSubscription(true);
      setSubscriptionCheckedOnce(true);
      onSubscriptionChange?.(true);
      setAccount(prev => ({
        ...prev,
        serviceType: "Admin Access (Level 8)",
        cadeLevel: 8,
      }));
      setIsCheckingSubscription(false);
      setIsLoading(false);
      return true;
    }

    // If we already confirmed subscription for this domain, skip API check
    // Only recheck when forceRefresh is true (tab click or domain change)
    if (!forceRefresh && subscriptionCheckedOnce && hasCadeSubscription) {
      setIsCheckingSubscription(false);
      return true;
    }

    setIsCheckingSubscription(true);

    // Check cache first (no API call needed if cached)
    const cachedSub = getCachedSubscription(domain);
    const cachedCadeLevel = cachedSub?.cade_level ?? 0;
    
    if (cachedCadeLevel > 0 && !forceRefresh) {
      console.log(`[CADE] Using cached subscription for ${domain}: cade_level=${cachedCadeLevel}`);
      setHasCadeSubscription(true);
      setSubscriptionCheckedOnce(true);
      onSubscriptionChange?.(true);
      setAccount(prev => ({
        ...prev,
        serviceType: cachedSub?.plan || cachedSub?.servicetype || `CADE Level ${cachedCadeLevel}`,
        cadeLevel: cachedCadeLevel,
      }));
      setIsCheckingSubscription(false);
      setIsLoading(false);
      // No background refresh for confirmed subscriptions - reduces API calls
      return true;
    }

    // For non-subscribers or forced refresh, check the API
    try {
      const subData = await fetchSubscription(domain);
      const cadeLevel = subData?.cade_level ?? 0;
      const hasCade = cadeLevel > 0;
      
      console.log(`[CADE] Subscription check for ${domain}: cade_level=${cadeLevel}, has_cade=${hasCade}`);
      
      if (hasCade) {
        setCachedSubscription(domain, subData!);
        setHasCadeSubscription(true);
        setSubscriptionCheckedOnce(true);
        onSubscriptionChange?.(true);
        setAccount(prev => ({
          ...prev,
          serviceType: subData?.plan || subData?.servicetype || `CADE Level ${cadeLevel}`,
          cadeLevel,
        }));
        setIsCheckingSubscription(false);
        setIsLoading(false);
        return true;
      }

      // No CADE subscription (level 0) - cache it briefly
      if (subData) {
        setCachedSubscription(domain, subData);
      }
      setHasCadeSubscription(false);
      setSubscriptionCheckedOnce(true);
      onSubscriptionChange?.(false);
      setAccount(prev => ({ ...prev, cadeLevel: 0 }));
      setIsCheckingSubscription(false);
      setIsLoading(false);
      return false;
    } catch (err) {
      console.error("[CADE] Subscription check error:", err);
      setHasCadeSubscription(false);
      onSubscriptionChange?.(false);
      setIsCheckingSubscription(false);
      setIsLoading(false);
      return false;
    }
  }, [domain, fetchSubscription, onSubscriptionChange, subscriptionCheckedOnce, hasCadeSubscription, isAdmin]);

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

  // Track previous domain to detect changes
  const prevDomainRef = useRef<string | null | undefined>(null);

  // Init - check subscription on initial load or domain change
  useEffect(() => {
    let cancelled = false;
    
    // Reset state when domain changes
    const domainChanged = prevDomainRef.current !== domain;
    if (domainChanged && prevDomainRef.current !== null) {
      // Clear previous domain's state, but admins keep subscription status
      if (!isAdmin) {
        setHasCadeSubscription(false);
      }
      setSubscriptionCheckedOnce(false);
      setDomainProfile(null);
      setArticles([]);
      setFaqs([]);
      setIsLoading(true);
      setIsCheckingSubscription(true);
    }
    prevDomainRef.current = domain;
    
    const init = async () => {
      // Force refresh only when domain changes, otherwise use cache
      const hasSub = await checkSubscription(domainChanged);
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
  }, [domain, checkSubscription, fetchData, fetchDomainContext, isAdmin]);

  // Re-check subscription when tab becomes active (user clicks CADE tab)
  useEffect(() => {
    // Only trigger when isActive changes from false to true
    if (isActive && !prevIsActiveRef.current && domain) {
      // Force a fresh check when the user clicks on the CADE tab
      checkSubscription(true).then(hasSub => {
        if (hasSub && !hasCadeSubscription) {
          // Subscription was just confirmed, load data
          fetchData();
          fetchDomainContext();
        }
      });
    }
    prevIsActiveRef.current = isActive;
  }, [isActive, domain, checkSubscription, hasCadeSubscription, fetchData, fetchDomainContext]);

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

  // No subscription - show activation pitch
  if (!hasCadeSubscription) {
    return <CADEActivationPitch domain={domain} />;
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

      {/* Hero Banner - Premium dark theme */}
      <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-card via-card/95 to-background shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
          {/* Radial glows */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 90% 50%, rgba(6,182,212,0.1) 0%, transparent 40%), radial-gradient(circle at 10% 80%, rgba(139,92,246,0.08) 0%, transparent 30%)`,
            }}
          />
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
          {/* Left accent border glow */}
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500/60 via-cyan-500/40 to-cyan-500/60" />
        </div>
        
        <div className="relative flex items-stretch">
          {/* Left: Enhanced Visual Section */}
          <div className="flex-shrink-0 p-6 pr-4 flex items-center gap-5">
            {/* AI Brain Icon with glow */}
            <div className="relative flex-shrink-0">
              {/* Outer glow ring */}
              <div 
                className="absolute inset-0 w-16 h-16 rounded-full m-auto"
                style={{
                  background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)',
                }}
              />
              {/* Icon container */}
              <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <Brain className="w-7 h-7 text-cyan-400" />
              </div>
              {/* Sparkle accent */}
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 opacity-80" />
            </div>
            
            {/* Title & Description */}
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                CADE Content Writer
                <Badge className="bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-500/40 text-cyan-400 text-[10px] px-2 py-0.5 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                  Pro
                </Badge>
              </h1>
              <p className="text-muted-foreground text-sm">AI-Powered content generation & SEO optimization</p>
              
              {/* Feature pills */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Auto-Publish
                </span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400">
                  SEO Optimized
                </span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  FAQ Generation
                </span>
              </div>
            </div>
          </div>
          
          {/* Vertical divider */}
          <div className="w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent my-4" />
          
          {/* Right: Platform Cards with Settings */}
          <div className="flex-1 p-4 flex items-center">
            <CADEPlatformCards 
              onSettingsClick={() => setDomainContextOpen(true)}
              connectedPlatforms={[]} // TODO: Connect to actual connection state
              onPlatformClick={(platformId) => {
                // Handle platform click - could open connection dialog
                console.log("Platform clicked:", platformId);
              }}
            />
          </div>
        </div>
      </div>



      {/* Row 1: Website Crawl + SEO Vault (larger) + Live Activity */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        
        {/* Website Crawl Card - 2 columns */}
        <div className="md:col-span-2">
          <SectionCard title="Website Crawl" accentColor="orange" className="h-full">
            <div className="space-y-4 flex flex-col h-full">
              {/* AI Animation Section - Top */}
              <div className="relative p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-violet-500/10 border border-orange-500/20">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 flex-shrink-0">
                    {/* Orbiting dots */}
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-orange-400/80"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `rotate(${i * 90}deg) translateX(24px) translateY(-50%)`,
                          animation: `cade-orbit 3s linear infinite`,
                          animationDelay: `${i * 0.75}s`,
                        }}
                      />
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/30 to-violet-500/30 border border-orange-500/40 flex items-center justify-center">
                        <Search className="w-4 h-4 text-orange-400" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Content Analysis</p>
                    <p className="text-xs text-muted-foreground">
                      {isCrawling ? "Processing pages..." : "Ready to analyze your website content"}
                    </p>
                  </div>
                  {isCrawling && (
                    <div className="w-10 h-10 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
                  )}
                </div>
                
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-2.5 rounded-lg bg-background/40 border border-border/30 text-center">
                    <p className="text-xl font-bold text-orange-400">{domainProfile?.crawled_pages || stats.byType.crawl || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Pages Crawled</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background/40 border border-border/30 text-center">
                    <p className="text-xl font-bold text-violet-400">{stats.byType.categorization || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Categorized</p>
                  </div>
                </div>
              </div>

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

        {/* SEO Vault Card - 3 columns (larger) */}
        <div className="md:col-span-3">
          <SectionCard title="SEO Vault" accentColor="emerald" className="h-full">
            <CADEVaultIntegration 
              domain={domain}
              height="h-[500px]"
              onGenerateFromPlan={async (item) => {
                // Refresh content after generation starts
                setTimeout(() => fetchData(), 2000);
              }}
            />
          </SectionCard>
        </div>

        {/* Live Activity Mini Dashboard - 2 columns */}
        <div className="md:col-span-2">
          <SectionCard title="Live Activity" accentColor="violet" className="h-full">
            <div className="space-y-4">
              {/* Dials Row */}
              <div className="grid grid-cols-3 gap-3">
                {/* Active Dial */}
                <div className="relative flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-amber-500/5 to-amber-500/10 border border-amber-500/20">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500/10" />
                      <circle 
                        cx="18" cy="18" r="15" fill="none" stroke="url(#amber-gradient)" strokeWidth="2.5" 
                        strokeDasharray={`${Math.min((stats.active / Math.max(stats.active + stats.completed + stats.failed, 1)) * 94, 94)} 94`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      <defs>
                        <linearGradient id="amber-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-amber-400">{stats.active}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">Active</p>
                  {stats.active > 0 && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>

                {/* Completed Dial */}
                <div className="relative flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/20">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500/10" />
                      <circle 
                        cx="18" cy="18" r="15" fill="none" stroke="url(#emerald-gradient)" strokeWidth="2.5" 
                        strokeDasharray={`${Math.min((stats.completed / Math.max(stats.active + stats.completed + stats.failed, 1)) * 94, 94)} 94`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      <defs>
                        <linearGradient id="emerald-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-emerald-400">{stats.completed}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">Completed</p>
                </div>

                {/* Failed Dial */}
                <div className="relative flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-red-500/5 to-red-500/10 border border-red-500/20">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500/10" />
                      <circle 
                        cx="18" cy="18" r="15" fill="none" stroke="url(#red-gradient)" strokeWidth="2.5" 
                        strokeDasharray={`${Math.min((stats.failed / Math.max(stats.active + stats.completed + stats.failed, 1)) * 94, 94)} 94`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      <defs>
                        <linearGradient id="red-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f87171" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-red-400">{stats.failed}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">Failed</p>
                </div>
              </div>

              {/* Activity by Type - Mini Bar Chart */}
              <div className="p-3 rounded-xl bg-background/30 border border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Activity by Type</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={refreshTasks}
                    className="text-[10px] h-6 px-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>
                <div className="space-y-2">
                  {[
                    { type: "CRAWL", color: "orange", count: stats.byType.crawl || 0 },
                    { type: "CATEGORIZATION", color: "violet", count: stats.byType.categorization || 0 },
                    { type: "CONTENT", color: "cyan", count: byType.content?.length || 0 },
                    { type: "CSS", color: "blue", count: byType.css?.length || 0 },
                  ].map((item) => {
                    const maxCount = Math.max(stats.byType.crawl || 0, stats.byType.categorization || 0, byType.content?.length || 0, byType.css?.length || 0, 1);
                    const percentage = (item.count / maxCount) * 100;
                    const colorMap: Record<string, string> = {
                      orange: "from-orange-500 to-orange-400",
                      violet: "from-violet-500 to-purple-400",
                      cyan: "from-cyan-500 to-cyan-400",
                      blue: "from-blue-500 to-blue-400",
                    };
                    return (
                      <div key={item.type} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-24 truncate">{item.type}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${colorMap[item.color]} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium text-${item.color}-400 w-6 text-right`}>{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity Feed - Compact */}
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {tasks.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Activity className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
                    <p className="text-xs">No recent activity</p>
                  </div>
                ) : (
                  tasks.slice(0, 5).map((task) => {
                    const isActive = ["running", "processing", "pending", "queued", "in_progress"].includes(task.statusValue);
                    const isCompleted = ["completed", "done", "success"].includes(task.statusValue);
                    const isFailed = ["failed", "error"].includes(task.statusValue);
                    
                    return (
                      <div 
                        key={task.id} 
                        className="flex items-center gap-2 p-2 rounded-lg bg-background/20 border border-border/20"
                      >
                        <div className="flex-shrink-0">
                          {isActive && <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                          {isCompleted && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                          {isFailed && <div className="w-2 h-2 rounded-full bg-red-400" />}
                          {!isActive && !isCompleted && !isFailed && <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase w-16 truncate">{task.type}</span>
                        <span className="flex-1 text-xs truncate">
                          {task.message || task.current_url || `${task.type} ${task.statusValue}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">
                          {task.created_at ? new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Unified Content Hub - Command Center + Content Management merged */}
      <SectionCard title="Content Hub" accentColor="cyan">
        <div className="space-y-5">
          
          {/* Enhanced Command Strip with futuristic design */}
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 via-card/50 to-violet-500/10 border border-cyan-500/20 overflow-hidden">
            {/* Background glow effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl" />
            </div>
            
            {/* Scheduler with enhanced ring */}
            <div className="relative lg:col-span-3 flex items-center gap-4 p-3 rounded-xl bg-gradient-to-br from-cyan-500/5 to-transparent border border-cyan-500/10">
              <div className="relative w-16 h-16 flex-shrink-0">
                {/* Outer glow */}
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-lg" />
                <svg className="relative w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-500/20" />
                  <circle 
                    cx="18" cy="18" r="14" fill="none" stroke="url(#timer-gradient-hub)" strokeWidth="3" 
                    strokeDasharray="73 88"
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.5))' }}
                  />
                  <defs>
                    <linearGradient id="timer-gradient-hub" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-cyan-400">11h</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Next Gen</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  <span className="text-sm text-emerald-400 font-semibold">Active</span>
                  <span className="text-xs text-muted-foreground">• 12hr cycle</span>
                </div>
              </div>
            </div>
            
            {/* Quick Generate with enhanced styling */}
            <div className="relative lg:col-span-5 flex items-center gap-4 p-3 rounded-xl bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <Zap className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Quota</p>
                  <p className="text-lg font-bold text-amber-400">2/2</p>
                </div>
              </div>
              <Select value={scheduleCount} onValueChange={setScheduleCount}>
                <SelectTrigger className="w-28 bg-background/80 border-border/50 h-10 text-sm font-medium">
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
                size="default"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-10 px-5 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all"
              >
                {isScheduling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1.5" />
                    Generate
                  </>
                )}
              </Button>
            </div>
            
            {/* Account Status with enhanced ring */}
            <div className="relative lg:col-span-4 flex items-center gap-4 p-3 rounded-xl bg-gradient-to-br from-violet-500/5 to-transparent border border-violet-500/10">
              <div className="relative w-12 h-12 flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md" />
                <svg className="relative w-full h-full" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="url(#auth-gradient-hub)" strokeWidth="2.5" 
                    style={{ filter: 'drop-shadow(0 0 4px rgba(52, 211, 153, 0.5))' }}
                  />
                  <defs>
                    <linearGradient id="auth-gradient-hub" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-violet-400">{account.serviceType}</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] px-2 py-0.5 shadow-[0_0_8px_rgba(52,211,153,0.2)]">
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{domainContext?.business_name || domain || "—"}</p>
              </div>
            </div>
          </div>
          
          {/* Content Tabs with enhanced styling */}
          <Tabs value={contentTab} onValueChange={setContentTab}>
            <TabsList className="bg-transparent border-b border-border/50 rounded-none p-0 h-auto">
              <TabsTrigger 
                value="articles" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-3 px-5 font-medium"
              >
                Blog Article
              </TabsTrigger>
              <TabsTrigger 
                value="faqs" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-3 px-5 font-medium"
              >
                FAQ
              </TabsTrigger>
              <TabsTrigger 
                value="scheduled" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-3 px-5 font-medium"
              >
                Scheduled
              </TabsTrigger>
              <TabsTrigger 
                value="domain-info" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-transparent pb-3 px-5 font-medium"
              >
                Domain Info
              </TabsTrigger>
              <TabsTrigger 
                value="vault" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-400 data-[state=active]:bg-transparent pb-3 px-5 font-medium"
              >
                <Archive className="w-4 h-4 mr-1.5" />
                SEO Vault
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="articles" className="mt-5 space-y-5">
              {/* Enhanced Stats Row with gradients and glows */}
              <div className="grid grid-cols-3 gap-4">
                <div className="relative p-5 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent text-center overflow-hidden group hover:border-cyan-500/50 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                  <div className="text-3xl font-bold text-cyan-400 mb-1" style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.3)' }}>{contentStats.total}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Total</div>
                </div>
                <div className="relative p-5 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent text-center overflow-hidden group hover:border-emerald-500/50 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                  <div className="text-3xl font-bold text-emerald-400 mb-1" style={{ textShadow: '0 0 20px rgba(52, 211, 153, 0.3)' }}>{contentStats.published}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Published</div>
                </div>
                <div className="relative p-5 rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent text-center overflow-hidden group hover:border-orange-500/50 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                  <div className="text-3xl font-bold text-orange-400 mb-1" style={{ textShadow: '0 0 20px rgba(249, 115, 22, 0.3)' }}>{contentStats.drafts}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Drafts</div>
                </div>
              </div>
              
              {/* Inline Content Editors */}
              <ScrollArea className="h-[350px]">
                <div className="space-y-2 pr-2">
                  {articles.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No articles yet</p>
                      <p className="text-sm mt-1">Generate content using the controls above</p>
                    </div>
                  ) : (
                    articles
                      .filter(a => statusFilter === "all" || a.status === statusFilter)
                      .map((article, idx) => (
                        <CADEInlineContentEditor
                          key={article.content_id || article.id || idx}
                          item={article}
                          domain={domain}
                          onUpdate={(updated) => {
                            setArticles(prev => prev.map(a => 
                              (a.content_id || a.id) === (updated.content_id || updated.id) ? updated : a
                            ));
                          }}
                          onDelete={(id) => {
                            setArticles(prev => prev.filter(a => (a.content_id || a.id) !== id));
                          }}
                        />
                      ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="faqs" className="mt-6 space-y-6">
              {/* FAQ Status & Toggle */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-background/30 border border-border/30">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Generation Status</p>
                    <Badge className={`${faqPaused 
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    } px-4 py-1.5`}>
                      {faqPaused ? "Paused" : "Up to date"}
                      {!faqPaused && <CheckCircle2 className="w-4 h-4 ml-2" />}
                    </Badge>
                  </div>
                  <StatBox value={faqs.length} label="Total FAQs" color="cyan" />
                </div>
                
                <Button
                  onClick={handleToggleFaq}
                  size="sm"
                  className={`${faqPaused 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700' 
                    : 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600'
                  } text-white`}
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
              
              {/* Inline FAQ Editors */}
              <ScrollArea className="h-[350px]">
                <div className="space-y-2 pr-2">
                  {faqs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No FAQs yet</p>
                      <p className="text-sm mt-1">FAQs will be generated automatically</p>
                    </div>
                  ) : (
                    faqs.map((faq, idx) => (
                      <CADEInlineFAQEditor
                        key={faq.faq_id || faq.id || idx}
                        item={faq}
                        domain={domain}
                        onUpdate={(updated) => {
                          setFaqs(prev => prev.map(f => 
                            (f.faq_id || f.id) === (updated.faq_id || updated.id) ? updated : f
                          ));
                        }}
                        onDelete={(id) => {
                          setFaqs(prev => prev.filter(f => (f.faq_id || f.id) !== id));
                        }}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
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
            
            <TabsContent value="domain-info" className="mt-6 space-y-6">
              <div>
                <h4 className="font-semibold text-base mb-2">Domain Information</h4>
                <p className="text-sm text-muted-foreground">
                  View and manage your domain profile, competitors, and business categories.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Competitors */}
                <div className="p-4 rounded-xl bg-background/30 border border-border/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Competitors</p>
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

                {/* Categories */}
                <div className="p-4 rounded-xl bg-background/30 border border-border/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {domainProfile?.categories && domainProfile.categories.length > 0 ? (
                      domainProfile.categories.map((cat, i) => (
                        <Badge 
                          key={i} 
                          variant="outline" 
                          className="bg-violet-500/10 border-violet-500/30 text-violet-400 text-xs px-3 py-1"
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

              {/* Business Description */}
              <div className="p-4 rounded-xl bg-background/30 border border-border/30">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Business Description</p>
                <div className="text-sm">
                  {domainProfile?.description ? (
                    <>
                      <p className={descriptionExpanded ? "" : "line-clamp-3"}>
                        {domainProfile.description}
                      </p>
                      {domainProfile.description.length > 200 && (
                        <button
                          onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                          className="text-cyan-400 hover:underline text-sm mt-2"
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
              
              <Button 
                onClick={() => setDomainContextOpen(true)}
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Domain Context
              </Button>
            </TabsContent>
            
            {/* SEO Vault Tab */}
            <TabsContent value="vault" className="mt-6">
              <CADEVaultIntegration 
                domain={domain}
                onGenerateFromPlan={async () => {
                  // Refresh articles list after generation starts
                  setTimeout(() => fetchData(), 3000);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SectionCard>
    </div>
  );
};

export default CADEDashboardNew;
