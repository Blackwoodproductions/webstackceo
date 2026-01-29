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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useBronApi, BronSubscription } from "@/hooks/use-bron-api";
import { useCadeEventTasks } from "@/hooks/use-cade-event-tasks";
import { AIMetricsAnimation } from "@/components/ui/ai-metrics-animation";
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

      {/* Hero Banner - Enhanced futuristic design */}
      <div className="relative rounded-2xl overflow-hidden border border-violet-500/30 bg-gradient-to-br from-violet-600/90 via-purple-600/90 to-violet-500/90 p-6 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
          {/* Radial glow */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 90% 50%, rgba(255,255,255,0.15) 0%, transparent 40%), radial-gradient(circle at 10% 80%, rgba(168,85,247,0.2) 0%, transparent 30%)`,
            }}
          />
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
        
        <div className="relative flex items-center justify-between gap-6">
          {/* Left: Title & Description */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              Welcome to CADE Content Writer
              <Badge className="bg-white/10 border-white/20 text-white/90 text-[10px] px-2 py-0.5">
                Pro
              </Badge>
            </h1>
            <p className="text-white/70 text-sm">AI-Powered content generation and SEO Optimization</p>
          </div>
          
          {/* Center: Website Connections - Full Width */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-6 px-8 py-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.05)] min-w-[500px]">
              <span className="text-sm text-white/70 uppercase tracking-widest font-medium">Connections</span>
              <div className="w-px h-10 bg-white/20" />
              <div className="flex items-center gap-4">
                {/* Facebook */}
                <a 
                  href={domainContext?.social_links?.find((l: string) => l.includes('facebook')) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    domainContext?.social_links?.some((l: string) => l.includes('facebook'))
                      ? 'bg-[#1877F2]/20 hover:bg-[#1877F2]/40 shadow-[0_0_20px_rgba(24,119,242,0.3)]'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <svg className="w-6 h-6" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a 
                  href={domainContext?.social_links?.find((l: string) => l.includes('instagram')) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    domainContext?.social_links?.some((l: string) => l.includes('instagram'))
                      ? 'bg-gradient-to-br from-[#F58529]/20 via-[#DD2A7B]/20 to-[#8134AF]/20 hover:from-[#F58529]/40 hover:via-[#DD2A7B]/40 hover:to-[#8134AF]/40 shadow-[0_0_20px_rgba(221,42,123,0.3)]'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F58529"/>
                        <stop offset="50%" stopColor="#DD2A7B"/>
                        <stop offset="100%" stopColor="#8134AF"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                {/* LinkedIn */}
                <a 
                  href={domainContext?.social_links?.find((l: string) => l.includes('linkedin')) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    domainContext?.social_links?.some((l: string) => l.includes('linkedin'))
                      ? 'bg-[#0A66C2]/20 hover:bg-[#0A66C2]/40 shadow-[0_0_20px_rgba(10,102,194,0.3)]'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <svg className="w-6 h-6" fill="#0A66C2" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                {/* Twitter/X */}
                <a 
                  href={domainContext?.social_links?.find((l: string) => l.includes('twitter') || l.includes('x.com')) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    domainContext?.social_links?.some((l: string) => l.includes('twitter') || l.includes('x.com'))
                      ? 'bg-white/20 hover:bg-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                {/* YouTube */}
                <a 
                  href={domainContext?.social_links?.find((l: string) => l.includes('youtube')) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    domainContext?.social_links?.some((l: string) => l.includes('youtube'))
                      ? 'bg-[#FF0000]/20 hover:bg-[#FF0000]/40 shadow-[0_0_20px_rgba(255,0,0,0.3)]'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <svg className="w-6 h-6" fill="#FF0000" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                {/* TikTok */}
                <a 
                  href={domainContext?.social_links?.find((l: string) => l.includes('tiktok')) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    domainContext?.social_links?.some((l: string) => l.includes('tiktok'))
                      ? 'bg-white/20 hover:bg-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="tiktok-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#69C9D0"/>
                        <stop offset="50%" stopColor="#EE1D52"/>
                        <stop offset="100%" stopColor="#EE1D52"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#tiktok-gradient)" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          {/* Right: Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/15 rounded-xl h-11 w-11 border border-white/15 flex-shrink-0"
            onClick={() => setDomainContextOpen(true)}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* AI Search Metrics - Only show while loading */}
      {isLoading && (
        <AIMetricsAnimation title="Analyzing Content Data" />
      )}


      {/* Row 1: Website Crawl + Live Activity Side by Side */}
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

        {/* Live Activity Mini Dashboard - 3 columns */}
        <div className="md:col-span-3">
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
              
              {/* Enhanced Filter & Action Row */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-card/50 to-transparent border border-border/30">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground font-medium">Filter:</span>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-background/80 border-border/50 h-9 text-sm">
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
                <Button size="default" className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all">
                  View All CADE Posts
                </Button>
              </div>
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
