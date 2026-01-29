import { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  Brain, RefreshCw, Loader2, CheckCircle2, Clock, Play, Pause,
  Settings, Globe, Target, FileText, HelpCircle, Calendar, Zap,
  AlertTriangle, Sparkles, Search, Save, X, Plus, ChevronDown,
  Activity, ExternalLink, User, TrendingUp, Link2, BarChart3, Database
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

// ─── AI Metrics Loading Card ─────────────────────────────────────────────────
interface MetricLoadingCardProps {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  color: 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose' | 'blue' | 'orange' | 'purple';
  delay: number;
}

const colorMap = {
  cyan: { bg: 'from-cyan-500/10 to-cyan-500/5', border: 'border-cyan-500/30', icon: 'text-cyan-400', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]' },
  emerald: { bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/30', icon: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
  violet: { bg: 'from-violet-500/10 to-violet-500/5', border: 'border-violet-500/30', icon: 'text-violet-400', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)]' },
  amber: { bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/30', icon: 'text-amber-400', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
  rose: { bg: 'from-rose-500/10 to-rose-500/5', border: 'border-rose-500/30', icon: 'text-rose-400', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.2)]' },
  blue: { bg: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/30', icon: 'text-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]' },
  orange: { bg: 'from-orange-500/10 to-orange-500/5', border: 'border-orange-500/30', icon: 'text-orange-400', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]' },
  purple: { bg: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/30', icon: 'text-purple-400', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]' },
};

const MetricLoadingCard = memo(({ icon: Icon, label, sublabel, color, delay }: MetricLoadingCardProps) => {
  const colors = colorMap[color];
  
  return (
    <div 
      className={`relative rounded-xl border ${colors.border} bg-gradient-to-br ${colors.bg} backdrop-blur-sm p-4 ${colors.glow} h-full`}
      style={{ 
        animation: `cade-metric-fade 3s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        contain: 'layout style paint',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r opacity-40" 
        style={{ background: `linear-gradient(to right, ${colors.icon.includes('cyan') ? 'rgb(6,182,212)' : colors.icon.includes('emerald') ? 'rgb(16,185,129)' : 'rgb(139,92,246)'}, transparent)` }}
      />
      
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{label}</p>
          <p className="text-xs text-muted-foreground truncate">{sublabel}</p>
        </div>
        <div 
          className="w-5 h-5 flex items-center justify-center"
          style={{ animation: `cade-check-appear 4s ease-out infinite`, animationDelay: `${delay + 2}s` }}
        >
          <CheckCircle2 className={`w-4 h-4 ${colors.icon}`} />
        </div>
      </div>
      
      <div className="mt-3 h-1 rounded-full bg-background/30 overflow-hidden">
        <div 
          className={`h-full rounded-full`}
          style={{
            width: '100%',
            background: `linear-gradient(to right, transparent, ${colors.icon.includes('cyan') ? 'rgba(6,182,212,0.6)' : colors.icon.includes('emerald') ? 'rgba(16,185,129,0.6)' : 'rgba(139,92,246,0.6)'}, transparent)`,
            animation: 'cade-scan 2s ease-in-out infinite',
            animationDelay: `${delay}s`,
          }}
        />
      </div>
    </div>
  );
});
MetricLoadingCard.displayName = 'MetricLoadingCard';

// ─── AI Metrics Animation Component ───────────────────────────────────────────
const CADEAIMetricsAnimation = memo(() => (
  <div 
    className="flex items-stretch gap-4 h-full"
    style={{ contain: 'layout style paint' }}
  >
    {/* Left: Brain Icon with orbiting particles */}
    <div className="relative w-32 flex-shrink-0 flex items-center justify-center">
      {/* Outer glow ring */}
      <div 
        className="absolute inset-0 rounded-full m-auto w-24 h-24"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
          animation: 'cade-pulse-glow 2s ease-in-out infinite',
        }}
      />
      
      {/* Orbiting particles */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/80"
          style={{
            top: '50%',
            left: '50%',
            transform: `rotate(${i * 90}deg) translateX(40px) translateY(-50%)`,
            animation: `cade-orbit 3s linear infinite`,
            animationDelay: `${i * 0.75}s`,
          }}
        />
      ))}
      
      {/* Secondary orbit */}
      {[0, 1, 2].map((i) => (
        <div
          key={`inner-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/60"
          style={{
            top: '50%',
            left: '50%',
            transform: `rotate(${i * 120}deg) translateX(24px) translateY(-50%)`,
            animation: `cade-orbit-reverse 2.5s linear infinite`,
            animationDelay: `${i * 0.833}s`,
          }}
        />
      ))}
      
      {/* Center icon container */}
      <div className="relative flex items-center justify-center">
        <div 
          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 flex items-center justify-center"
          style={{ animation: 'cade-float 3s ease-in-out infinite' }}
        >
          <Brain className="w-8 h-8 text-primary" />
        </div>
      </div>
      
      {/* Sparkle accents */}
      <Sparkles 
        className="absolute top-2 right-2 w-3 h-3 text-amber-400" 
        style={{ animation: 'cade-twinkle 1.5s ease-in-out infinite' }}
      />
      <Sparkles 
        className="absolute bottom-4 left-2 w-2.5 h-2.5 text-cyan-400" 
        style={{ animation: 'cade-twinkle 1.5s ease-in-out infinite 0.5s' }}
      />
    </div>
    
    {/* Right: Metrics Grid */}
    <div className="flex-1 grid grid-cols-4 gap-3">
      <MetricLoadingCard icon={TrendingUp} label="SERP Rankings" sublabel="Google, Bing, Yahoo" color="cyan" delay={0} />
      <MetricLoadingCard icon={Zap} label="Page Speed" sublabel="Core Web Vitals" color="emerald" delay={0.2} />
      <MetricLoadingCard icon={BarChart3} label="Keyword Metrics" sublabel="CPC, Difficulty, Vol" color="violet" delay={0.4} />
      <MetricLoadingCard icon={Link2} label="Citation Links" sublabel="Inbound / Outbound" color="amber" delay={0.6} />
      <MetricLoadingCard icon={Target} label="Search Intent" sublabel="Commercial, Informational" color="rose" delay={0.8} />
      <MetricLoadingCard icon={Globe} label="Competitor Data" sublabel="Domain comparison" color="blue" delay={1.0} />
      <MetricLoadingCard icon={Activity} label="Historical Trends" sublabel="Position changes" color="orange" delay={1.2} />
      <MetricLoadingCard icon={Database} label="Cluster Analysis" sublabel="Main + Supporting" color="purple" delay={1.4} />
    </div>
    
    {/* CSS Keyframes */}
    <style>{`
      @keyframes cade-orbit {
        from { transform: rotate(0deg) translateX(40px) translateY(-50%); }
        to { transform: rotate(360deg) translateX(40px) translateY(-50%); }
      }
      @keyframes cade-orbit-reverse {
        from { transform: rotate(360deg) translateX(24px) translateY(-50%); }
        to { transform: rotate(0deg) translateX(24px) translateY(-50%); }
      }
      @keyframes cade-pulse-glow {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.1); }
      }
      @keyframes cade-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
      @keyframes cade-twinkle {
        0%, 100% { opacity: 0.4; transform: scale(0.9); }
        50% { opacity: 1; transform: scale(1.1); }
      }
      @keyframes cade-scan {
        0% { transform: translateX(-150%); }
        100% { transform: translateX(450%); }
      }
      @keyframes cade-metric-fade {
        0%, 20% { opacity: 0.6; }
        50% { opacity: 1; }
        80%, 100% { opacity: 0.6; }
      }
      @keyframes cade-check-appear {
        0%, 70% { opacity: 0; transform: scale(0); }
        100% { opacity: 1; transform: scale(1); }
      }
    `}</style>
  </div>
));
CADEAIMetricsAnimation.displayName = 'CADEAIMetricsAnimation';

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
export const CADEDashboardNew = ({ domain, onSubscriptionChange }: CADEDashboardNewProps) => {
  const { fetchSubscription } = useBronApi();
  const { tasks, stats, byType, latestCategorization, activeTasksByType, refresh: refreshTasks } = useCadeEventTasks(domain);
  
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
  const [metricsOpen, setMetricsOpen] = useState(false);
  
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

      {/* View AI Search Metrics - Centered Button + Inline Animation */}
      <Collapsible open={metricsOpen} onOpenChange={setMetricsOpen}>
        <div className="flex justify-center">
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500 gap-2 px-6"
            >
              <Brain className="w-4 h-4" />
              View AI Search Metrics
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${metricsOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
          <div className="mt-4 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6" style={{ minHeight: '220px' }}>
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-primary" />
              <h4 className="text-lg font-semibold">Analyzing Keywords</h4>
              {/* Scanning line effect */}
              <div className="h-0.5 flex-1 max-w-[200px] rounded-full overflow-hidden bg-muted/30 ml-4">
                <div 
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
                  style={{ animation: 'cade-scan 1.5s ease-in-out infinite' }}
                />
              </div>
            </div>
            <CADEAIMetricsAnimation />
          </div>
        </CollapsibleContent>
      </Collapsible>

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

        {/* Live Activity Card - 3 columns */}
        <div className="md:col-span-3">
          <SectionCard title="Live Activity" accentColor="violet" className="h-full">
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                tasks.slice(0, 10).map((task) => {
                  const isActive = ["running", "processing", "pending", "queued", "in_progress"].includes(task.statusValue);
                  const isCompleted = ["completed", "done", "success"].includes(task.statusValue);
                  const isFailed = ["failed", "error"].includes(task.statusValue);
                  
                  const typeColors: Record<string, string> = {
                    CRAWL: "text-orange-400 bg-orange-500/10 border-orange-500/30",
                    CATEGORIZATION: "text-violet-400 bg-violet-500/10 border-violet-500/30",
                    CSS: "text-blue-400 bg-blue-500/10 border-blue-500/30",
                    CONTENT: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
                    UNKNOWN: "text-muted-foreground bg-muted/10 border-border/30",
                  };
                  
                  return (
                    <div 
                      key={task.id} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-background/30 border border-border/30"
                    >
                      {/* Status indicator */}
                      <div className="flex-shrink-0">
                        {isActive && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {isFailed && <AlertTriangle className="w-4 h-4 text-red-400" />}
                        {!isActive && !isCompleted && !isFailed && <Clock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      
                      {/* Type badge */}
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${typeColors[task.type]}`}>
                        {task.type}
                      </Badge>
                      
                      {/* Message */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          {task.message || task.current_url || `${task.type} ${task.statusValue}`}
                        </p>
                        {task.progress !== undefined && task.progress > 0 && task.progress < 100 && (
                          <div className="mt-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                            <div 
                              className="h-full bg-primary/60 rounded-full transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Time */}
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {task.created_at ? new Date(task.created_at).toLocaleTimeString() : "—"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            
            {tasks.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Active: <span className="text-amber-400 font-medium">{stats.active}</span></span>
                  <span>Completed: <span className="text-emerald-400 font-medium">{stats.completed}</span></span>
                  <span>Failed: <span className="text-red-400 font-medium">{stats.failed}</span></span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={refreshTasks}
                  className="text-xs h-7"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Row 3: Content Management */}
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
              <TabsTrigger 
                value="domain-info" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-transparent pb-3 px-4"
              >
                Domain Info
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
          </Tabs>
        </div>
      </SectionCard>
    </div>
  );
};

export default CADEDashboardNew;
