import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, RefreshCw, Loader2, CheckCircle2, Clock, Play, Pause,
  Settings, Globe, Target, FileText, HelpCircle, Calendar, Zap,
  Mail, User, ExternalLink, ChevronDown, ChevronRight, LayoutGrid,
  AlertTriangle, Sparkles, Pencil, Cpu, Network, CircuitBoard,
  Workflow, Activity, Layers, Wand2, Plus, Search, Edit3, Save, X
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DomainContextDialog } from "./DomainContextDialog";
import { useDomainContext } from "@/hooks/use-domain-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

interface ContentItem {
  id?: string;
  content_id?: string;
  title?: string;
  content?: string;
  status?: string;
  type?: string;
  keyword?: string;
  created_at?: string;
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

// ─── Agentic AI Background Pattern ──────────────────────────────────────────
const AgenticBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Grid pattern */}
    <div
      className="absolute inset-0 opacity-[0.015]"
      style={{
        backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }}
    />
    
    {/* Floating AI symbols */}
    <div className="absolute top-[8%] left-[5%] text-primary/[0.06]">
      <Brain className="w-16 h-16" />
    </div>
    <div className="absolute top-[15%] right-[8%] text-violet-500/[0.05]">
      <Network className="w-20 h-20" />
    </div>
    <div className="absolute bottom-[25%] left-[12%] text-cyan-500/[0.04]">
      <CircuitBoard className="w-14 h-14" />
    </div>
    <div className="absolute bottom-[10%] right-[15%] text-purple-500/[0.05]">
      <Cpu className="w-12 h-12" />
    </div>
    <div className="absolute top-[45%] left-[3%] text-primary/[0.04]">
      <Workflow className="w-10 h-10" />
    </div>
    <div className="absolute top-[30%] right-[5%] text-emerald-500/[0.04]">
      <Layers className="w-12 h-12" />
    </div>
    
    {/* Gradient orbs */}
    <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-tr from-cyan-500/10 via-primary/5 to-transparent rounded-full blur-3xl" />
    
    {/* Scan line effect */}
    <div 
      className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent"
      style={{
        animation: 'scanline 8s linear infinite',
        backgroundSize: '100% 200%',
      }}
    />
  </div>
);

// ─── High-End Card Wrapper ──────────────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
  icon?: React.ReactNode;
  title?: string;
  badge?: React.ReactNode;
  onSettings?: () => void;
}

const GlassCard = ({ children, className = "", accentColor = "cyan", icon, title, badge, onSettings }: GlassCardProps) => {
  const gradientMap: Record<string, string> = {
    cyan: "from-cyan-500/8 to-cyan-600/4",
    violet: "from-violet-500/8 to-purple-600/4",
    emerald: "from-emerald-500/8 to-teal-600/4",
    orange: "from-orange-500/8 to-red-500/4",
    blue: "from-blue-500/8 to-indigo-600/4",
    purple: "from-purple-500/8 to-pink-600/4",
  };
  
  const borderMap: Record<string, string> = {
    cyan: "border-cyan-500/20",
    violet: "border-violet-500/20",
    emerald: "border-emerald-500/20",
    orange: "border-orange-500/20",
    blue: "border-blue-500/20",
    purple: "border-purple-500/20",
  };
  
  const accentMap: Record<string, string> = {
    cyan: "from-cyan-400 to-cyan-600",
    violet: "from-violet-400 to-purple-600",
    emerald: "from-emerald-400 to-teal-600",
    orange: "from-orange-400 to-red-500",
    blue: "from-blue-400 to-indigo-500",
    purple: "from-purple-400 to-pink-600",
  };

  const iconBgMap: Record<string, string> = {
    cyan: "bg-cyan-500/15",
    violet: "bg-violet-500/15",
    emerald: "bg-emerald-500/15",
    orange: "bg-orange-500/15",
    blue: "bg-blue-500/15",
    purple: "bg-purple-500/15",
  };

  const iconColorMap: Record<string, string> = {
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    orange: "text-orange-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
  };

  return (
    <div className={`relative rounded-xl border ${borderMap[accentColor]} bg-gradient-to-br ${gradientMap[accentColor]} backdrop-blur-sm overflow-hidden ${className}`}>
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${accentMap[accentColor]}`} />
      
      {/* Subtle corner glow */}
      <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${gradientMap[accentColor]} rounded-full blur-2xl opacity-50`} />
      
      {/* Header */}
      {(title || icon) && (
        <div className="flex items-center justify-between p-4 pb-0">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className={`w-9 h-9 rounded-lg ${iconBgMap[accentColor]} flex items-center justify-center relative`}>
                <div className={`absolute inset-0 rounded-lg ${iconBgMap[accentColor]} animate-pulse opacity-50`} />
                <span className={iconColorMap[accentColor]}>{icon}</span>
              </div>
            )}
            {title && <span className="font-semibold text-sm">{title}</span>}
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {onSettings && (
              <button onClick={onSettings} className="text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

// ─── Pulsing Status Dot ─────────────────────────────────────────────────────
const PulsingDot = ({ color = "emerald" }: { color?: string }) => {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-400",
    cyan: "bg-cyan-400",
    amber: "bg-amber-400",
    red: "bg-red-400",
    blue: "bg-blue-400",
    violet: "bg-violet-400",
  };
  
  return (
    <span className="relative flex h-2 w-2">
      <span className={`absolute inline-flex h-full w-full rounded-full ${colorMap[color]} opacity-75 animate-ping`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colorMap[color]}`} />
    </span>
  );
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
    nextGeneration: "11 hrs, 26 mins, 5 sec",
    frequency: "12hrs",
    articlesPerBatch: 1,
  });
  const [account, setAccount] = useState<AccountInfo>({
    serviceType: "SEOM 60",
    userName: "",
    email: "",
    authenticated: true,
  });
  const [contentStats, setContentStats] = useState<ContentStats>({ total: 0, published: 0, drafts: 0 });
  const [faqStats, setFaqStats] = useState<FAQStats>({ total: 0, status: "up_to_date" });
  const [contentTab, setContentTab] = useState("articles");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scheduleCount, setScheduleCount] = useState("1");
  const [isScheduling, setIsScheduling] = useState(false);
  const [domainContextOpen, setDomainContextOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  
  // Content inline editing
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [editingArticle, setEditingArticle] = useState<ContentItem | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [articleEditForm, setArticleEditForm] = useState({ title: "", content: "" });
  const [faqEditForm, setFaqEditForm] = useState({ question: "", answer: "" });
  const [isSaving, setIsSaving] = useState(false);
  
  // Generate dialog
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateKeyword, setGenerateKeyword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Domain context hook for progress
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
      const [profileRes, faqsRes] = await Promise.allSettled([
        callCadeApi("domain-profile"),
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

      if (faqsRes.status === "fulfilled" && faqsRes.value) {
        const f = faqsRes.value?.data || faqsRes.value;
        const faqList = Array.isArray(f) ? f : f?.faqs || [];
        setFaqs(faqList);
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

  const handleGenerateContent = async () => {
    if (!generateKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }
    setIsGenerating(true);
    try {
      await callCadeApi("generate-content", {
        keyword: generateKeyword.trim(),
        content_type: "blog",
        platform: "wordpress",
        auto_publish: false,
      });
      toast.success("Content generation started!");
      setShowGenerateDialog(false);
      setGenerateKeyword("");
      refreshTasks();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to generate";
      toast.error(errMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveArticle = async () => {
    if (!editingArticle) return;
    setIsSaving(true);
    try {
      await callCadeApi("update-content", {
        content_id: editingArticle.content_id || editingArticle.id,
        title: articleEditForm.title,
        content: articleEditForm.content,
      });
      toast.success("Article updated");
      setEditingArticle(null);
      fetchData();
    } catch {
      toast.error("Failed to update article");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFaq = async () => {
    if (!editingFaq) return;
    setIsSaving(true);
    try {
      await callCadeApi("update-faq", {
        faq_id: editingFaq.faq_id || editingFaq.id,
        question: faqEditForm.question,
        answer: faqEditForm.answer,
      });
      toast.success("FAQ updated");
      setEditingFaq(null);
      fetchData();
    } catch {
      toast.error("Failed to update FAQ");
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isCheckingSubscription) {
    return (
      <div className="relative min-h-[400px] rounded-2xl overflow-hidden">
        <AgenticBackground />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 flex flex-col items-center justify-center h-full py-20"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <Brain className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          <div className="text-center mt-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Initializing CADE
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Connecting to AI engine...</p>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
            <span className="text-sm text-muted-foreground">Verifying subscription</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // No subscription
  if (!hasCadeSubscription) {
    return (
      <div className="relative min-h-[300px] rounded-2xl overflow-hidden">
        <AgenticBackground />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 flex flex-col items-center justify-center h-full py-16 text-center px-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-4">
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
      </div>
    );
  }

  // ─── Main Dashboard ────────────────────────────────────────────────────────
  return (
    <div className="relative" style={{ contain: 'layout style' }}>
      <AgenticBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 space-y-5"
      >
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-violet-500 to-purple-600 p-5 shadow-lg">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          {/* Floating circuit symbols */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20">
            <CircuitBoard className="w-24 h-24 text-white" />
          </div>
          <div className="absolute right-28 top-2 opacity-10">
            <Cpu className="w-10 h-10 text-white" />
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Welcome to CADE Content Writer</h1>
                <p className="text-white/70 text-sm">Manage your AI-Powered content generation and SEO Optimization</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full h-10 w-10"
              onClick={() => setDomainContextOpen(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Row 1: Scheduler, Quick Actions, Account Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Scheduler Card */}
          <GlassCard
            accentColor="cyan"
            icon={<Calendar className="w-4 h-4" />}
            title="Scheduler"
            badge={
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs px-2 py-0.5 flex items-center gap-1.5">
                <PulsingDot color="emerald" />
                Enabled
              </Badge>
            }
          >
            <div className="space-y-3 mt-2">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Next Generation</p>
                <p className="text-lg font-bold text-cyan-400">{scheduler.nextGeneration || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Generation Frequency</p>
                <p className="text-sm font-semibold">{scheduler.frequency || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Articles Per Batch</p>
                <p className="text-sm font-semibold">{scheduler.articlesPerBatch || 1} article(s)</p>
              </div>
            </div>
          </GlassCard>

          {/* Quick Actions Card */}
          <GlassCard
            accentColor="violet"
            icon={<Zap className="w-4 h-4" />}
            title="Quick Actions"
          >
            <div className="space-y-3 mt-2">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1.5">Schedule Content Now</p>
                <Select value={scheduleCount} onValueChange={setScheduleCount}>
                  <SelectTrigger className="h-10 bg-background/60 border-border/50">
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
                className="w-full h-10 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-medium"
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
                Remaining this week: <span className="text-cyan-400 font-semibold">2 of 2 articles</span>
              </p>
            </div>
          </GlassCard>

          {/* Account Status Card */}
          <GlassCard
            accentColor="emerald"
            icon={<User className="w-4 h-4" />}
            title="Account Status"
          >
            <div className="space-y-3 mt-2">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Service Type</p>
                <p className="text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  {account.serviceType || "CADE Pro"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">User</p>
                <p className="text-sm font-semibold truncate">{account.userName || domain || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Email</p>
                <p className="text-sm text-muted-foreground truncate">{account.email || "—"}</p>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs px-3 py-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Authenticated
              </Badge>
            </div>
          </GlassCard>
        </div>

        {/* Row 2: Website Crawl + Domain Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Website Crawl Card */}
          <GlassCard
            accentColor="orange"
            icon={<Globe className="w-4 h-4" />}
            title="Website Crawl"
            badge={
              isCrawling ? (
                <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-xs">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Crawling
                </Badge>
              ) : latestCrawl?.statusValue === "completed" || latestCrawl?.statusValue === "done" ? (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              ) : null
            }
          >
            <div className="space-y-3 mt-2">
              {/* Status Message */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-400">
                      {isCrawling ? "Crawling in progress..." : "Complete"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isCrawling ? "Scanning website pages" : "Crawl finished successfully."}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Last Crawl</p>
                <p className="text-sm font-semibold">
                  {domainProfile?.last_crawl
                    ? new Date(domainProfile.last_crawl).toLocaleString()
                    : latestCrawl?.created_at
                    ? new Date(latestCrawl.created_at).toLocaleString()
                    : "Never"}
                </p>
              </div>

              <Button
                onClick={handleTriggerCrawl}
                disabled={isCrawling}
                className="w-full h-10 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium"
              >
                {isCrawling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Trigger Manual Crawl
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Update content analysis (takes several minutes)
              </p>
            </div>
          </GlassCard>

          {/* Domain Information Card */}
          <GlassCard
            accentColor="purple"
            icon={<Target className="w-4 h-4" />}
            title="Domain Information"
            onSettings={() => setDomainContextOpen(true)}
          >
            <div className="space-y-4 mt-2">
              {/* Competitors */}
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1.5">Competitors:</p>
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
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1.5">Business Description:</p>
                <div className="text-sm">
                  {domainProfile?.description ? (
                    <>
                      <p className={descriptionExpanded ? "" : "line-clamp-3"}>
                        {domainProfile.description}
                      </p>
                      {domainProfile.description.length > 150 && (
                        <button
                          onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                          className="text-cyan-400 hover:underline text-xs mt-1"
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
              {domainProfile?.categories && domainProfile.categories.length > 0 && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1.5">Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {domainProfile.categories.map((cat, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 text-xs"
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Row 3: FAQ Generation */}
        <GlassCard
          accentColor="blue"
          icon={<HelpCircle className="w-4 h-4" />}
          title="FAQ Generation"
          badge={
            <Badge
              className={`text-xs px-2 py-0.5 ${
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
              {faqStats.status === "up_to_date" ? "Up to date" : faqStats.status === "paused" ? "Paused" : "Generating"}
            </Badge>
          }
        >
          <div className="flex items-center gap-4 mt-2">
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Up to date
                </div>
              </div>
            </div>
            <Button
              onClick={handleToggleFaqGeneration}
              variant="outline"
              className={`h-10 px-6 ${
                faqStats.status === "paused"
                  ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400"
                  : "bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/20 text-violet-400"
              }`}
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
        </GlassCard>

        {/* Row 4: Content Management */}
        <div className="relative rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Content Management</h3>
                  <p className="text-sm text-muted-foreground">Manage your CADE-generated content and view scheduling information.</p>
                </div>
              </div>
            </div>
            
            <Tabs value={contentTab} onValueChange={setContentTab}>
              <TabsList className="bg-transparent h-auto p-0 gap-0 border-b border-border/50 rounded-none">
                <TabsTrigger 
                  value="articles" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 px-4 py-2.5"
                >
                  Blog Article
                </TabsTrigger>
                <TabsTrigger 
                  value="faq" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 px-4 py-2.5"
                >
                  FAQ
                </TabsTrigger>
                <TabsTrigger 
                  value="scheduled" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 px-4 py-2.5"
                >
                  Scheduled
                </TabsTrigger>
              </TabsList>

              <TabsContent value="articles" className="mt-5 space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">Blog Articles</h4>
                  <p className="text-sm text-muted-foreground">Manage your CADE-generated blog articles. Filter by status to see published or draft content.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 text-center">
                    <p className="text-3xl font-bold text-cyan-400">{contentStats.total}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Articles</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-center">
                    <p className="text-3xl font-bold text-emerald-400">{contentStats.published}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Published</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 text-center">
                    <p className="text-3xl font-bold text-orange-400">{contentStats.drafts}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Drafts</p>
                  </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                  <span className="text-sm text-muted-foreground">Filter by status :</span>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 h-9 bg-background/60 border-border/50">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Articles List */}
                {articles.length > 0 ? (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {articles.map((article, i) => (
                        <div key={article.id || i} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{article.title || "Untitled"}</p>
                            <Badge className="text-xs mt-1" variant="secondary">{article.status || "draft"}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingArticle(article);
                              setArticleEditForm({ title: article.title || "", content: article.content || "" });
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No articles yet</p>
                  </div>
                )}

                <Button 
                  onClick={() => setShowGenerateDialog(true)}
                  className="w-full h-11 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-medium"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  View All CADE Posts
                </Button>
              </TabsContent>

              <TabsContent value="faq" className="mt-5 space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">FAQs</h4>
                  <p className="text-sm text-muted-foreground">Manage FAQ entries generated from your content.</p>
                </div>

                {faqs.length > 0 ? (
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                      {faqs.map((faq, i) => (
                        <div key={faq.id || i} className="p-3 rounded-lg bg-background/50 border border-border/30">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{faq.question || "No question"}</p>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{faq.answer || "No answer"}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingFaq(faq);
                                setFaqEditForm({ question: faq.question || "", answer: faq.answer || "" });
                              }}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{faqStats.total} FAQs generated</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="scheduled" className="mt-5">
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No scheduled content</p>
                  <p className="text-sm mt-1">Use Quick Actions to schedule new content</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>

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
        progressPercent={domainContextProgress}
        filledCount={domainContextFilledCount}
      />

      {/* Generate Content Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-violet-500" />
              Generate Content
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Keyword</Label>
              <Input
                placeholder="e.g., best dental implants 2024"
                value={generateKeyword}
                onChange={(e) => setGenerateKeyword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateContent}
              disabled={isGenerating || !generateKeyword.trim()}
              className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog open={!!editingArticle} onOpenChange={(open) => !open && setEditingArticle(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={articleEditForm.title}
                onChange={(e) => setArticleEditForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={articleEditForm.content}
                onChange={(e) => setArticleEditForm(prev => ({ ...prev, content: e.target.value }))}
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingArticle(null)}>Cancel</Button>
            <Button onClick={handleSaveArticle} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit FAQ Dialog */}
      <Dialog open={!!editingFaq} onOpenChange={(open) => !open && setEditingFaq(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question</Label>
              <Input
                value={faqEditForm.question}
                onChange={(e) => setFaqEditForm(prev => ({ ...prev, question: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <Textarea
                value={faqEditForm.answer}
                onChange={(e) => setFaqEditForm(prev => ({ ...prev, answer: e.target.value }))}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFaq(null)}>Cancel</Button>
            <Button onClick={handleSaveFaq} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes scanline {
          0% { background-position: 0% 0%; }
          100% { background-position: 0% 100%; }
        }
      `}</style>
    </div>
  );
};

export default CADEDashboardNew;
