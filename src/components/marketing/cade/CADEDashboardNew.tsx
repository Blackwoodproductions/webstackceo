import { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  Brain, RefreshCw, Loader2, CheckCircle2, Clock, Play, Pause,
  Settings, Globe, Target, FileText, HelpCircle, Calendar, Zap,
  AlertTriangle, Sparkles, Pencil, Search, Save, X, Plus,
  Activity, Database, BarChart3, TrendingUp, Link2, Eye, EyeOff,
  ChevronDown, ChevronRight, ExternalLink, Cpu, Network, CircuitBoard
} from "lucide-react";
import { DomainContextDialog } from "./DomainContextDialog";
import { useDomainContext } from "@/hooks/use-domain-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

// ─── AI Loading Animation (matches BRON style) ─────────────────────────────
const CADEAILoadingAnimation = memo(() => (
  <div 
    className="flex flex-col items-center justify-center py-12 px-8"
    style={{ contain: 'layout style paint' }}
  >
    {/* Central brain icon with orbiting particles */}
    <div className="relative w-28 h-28 mb-6">
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}
      />
      
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-violet-500/80"
          style={{
            top: '50%',
            left: '50%',
            transform: `rotate(${i * 90}deg) translateX(44px) translateY(-50%)`,
            animation: `orbit 3s linear infinite`,
            animationDelay: `${i * 0.75}s`,
          }}
        />
      ))}
      
      {[0, 1, 2].map((i) => (
        <div
          key={`inner-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/60"
          style={{
            top: '50%',
            left: '50%',
            transform: `rotate(${i * 120}deg) translateX(28px) translateY(-50%)`,
            animation: `orbit-reverse 2.5s linear infinite`,
            animationDelay: `${i * 0.833}s`,
          }}
        />
      ))}
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center"
          style={{ animation: 'float 3s ease-in-out infinite' }}
        >
          <Brain className="w-7 h-7 text-violet-400" />
        </div>
      </div>
      
      <Sparkles 
        className="absolute top-1 right-1 w-3 h-3 text-amber-400" 
        style={{ animation: 'twinkle 1.5s ease-in-out infinite' }}
      />
      <Sparkles 
        className="absolute bottom-3 left-0 w-2.5 h-2.5 text-cyan-400" 
        style={{ animation: 'twinkle 1.5s ease-in-out infinite 0.5s' }}
      />
    </div>
    
    <div className="text-center space-y-2 mb-6">
      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2 justify-center">
        <Activity className="w-4 h-4 text-violet-400" />
        Analyzing Content
      </h4>
      
      <div className="h-0.5 w-40 mx-auto rounded-full overflow-hidden bg-muted/30">
        <div 
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-violet-500 to-transparent"
          style={{ animation: 'scan 1.5s ease-in-out infinite' }}
        />
      </div>
    </div>
    
    {/* Metrics Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl">
      <MetricLoadingCard icon={Globe} label="Domain Crawl" sublabel="Page structure" color="orange" delay={0} />
      <MetricLoadingCard icon={FileText} label="Content Analysis" sublabel="Articles & FAQs" color="violet" delay={0.2} />
      <MetricLoadingCard icon={Target} label="Categorization" sublabel="Industry & niche" color="cyan" delay={0.4} />
      <MetricLoadingCard icon={BarChart3} label="SEO Metrics" sublabel="Optimization score" color="emerald" delay={0.6} />
      <MetricLoadingCard icon={TrendingUp} label="Content Quality" sublabel="Readability score" color="blue" delay={0.8} />
      <MetricLoadingCard icon={Link2} label="Internal Links" sublabel="Structure analysis" color="amber" delay={1.0} />
      <MetricLoadingCard icon={Database} label="Knowledge Base" sublabel="Topic clusters" color="purple" delay={1.2} />
      <MetricLoadingCard icon={Zap} label="Generation Queue" sublabel="Scheduled content" color="rose" delay={1.4} />
    </div>
    
    <style>{`
      @keyframes orbit {
        from { transform: rotate(0deg) translateX(44px) translateY(-50%); }
        to { transform: rotate(360deg) translateX(44px) translateY(-50%); }
      }
      @keyframes orbit-reverse {
        from { transform: rotate(360deg) translateX(28px) translateY(-50%); }
        to { transform: rotate(0deg) translateX(28px) translateY(-50%); }
      }
      @keyframes pulse-glow {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.1); }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
      @keyframes twinkle {
        0%, 100% { opacity: 0.4; transform: scale(0.9); }
        50% { opacity: 1; transform: scale(1.1); }
      }
      @keyframes scan {
        0% { transform: translateX(-150%); }
        100% { transform: translateX(450%); }
      }
      @keyframes metric-fade {
        0%, 20% { opacity: 0.4; }
        50% { opacity: 1; }
        80%, 100% { opacity: 0.4; }
      }
      @keyframes check-appear {
        0%, 70% { opacity: 0; transform: scale(0); }
        100% { opacity: 1; transform: scale(1); }
      }
    `}</style>
  </div>
));
CADEAILoadingAnimation.displayName = 'CADEAILoadingAnimation';

// ─── Metric Loading Card ────────────────────────────────────────────────────
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
      className={`relative rounded-xl border ${colors.border} bg-gradient-to-br ${colors.bg} backdrop-blur-sm p-3 ${colors.glow}`}
      style={{ 
        animation: `metric-fade 3s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        contain: 'layout style paint',
      }}
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r ${colors.bg.replace('/10', '/40').replace('/5', '/20')}`} />
      
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center flex-shrink-0">
          <Icon className={`w-4 h-4 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{label}</p>
          <p className="text-[10px] text-muted-foreground truncate">{sublabel}</p>
        </div>
        <div 
          className="w-4 h-4 flex items-center justify-center"
          style={{ animation: `check-appear 4s ease-out infinite`, animationDelay: `${delay + 2}s` }}
        >
          <CheckCircle2 className={`w-3.5 h-3.5 ${colors.icon}`} />
        </div>
      </div>
      
      <div className="mt-2 h-1 rounded-full bg-background/30 overflow-hidden">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${colors.bg.replace('/10', '/60').replace('/5', '/40')}`}
          style={{
            width: '100%',
            animation: 'scan 2s ease-in-out infinite',
            animationDelay: `${delay}s`,
          }}
        />
      </div>
    </div>
  );
});
MetricLoadingCard.displayName = 'MetricLoadingCard';

// ─── Feature Info Card (matches BRON style) ─────────────────────────────────
interface FeatureCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}

const FeatureCard = memo(({ icon, iconBg, title, description }: FeatureCardProps) => (
  <div className="relative rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-4 overflow-hidden">
    <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-radial from-primary/5 to-transparent rounded-full blur-xl" />
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
));
FeatureCard.displayName = 'FeatureCard';

// ─── Content Row Component ──────────────────────────────────────────────────
interface ContentRowProps {
  item: ContentItem;
  onEdit: () => void;
  onDelete: () => void;
}

const ContentRow = memo(({ item, onEdit, onDelete }: ContentRowProps) => {
  const statusColor = item.status === 'published' 
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : item.status === 'draft'
    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    : 'bg-muted/30 text-muted-foreground border-border/50';

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-card/50 border border-border/30 hover:border-border/60 transition-colors">
      <div className="w-[60px] flex-shrink-0 flex justify-center">
        <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center">
          <FileText className="w-5 h-5 text-violet-400" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{item.title || 'Untitled'}</p>
        <p className="text-xs text-muted-foreground truncate">
          {item.keyword ? `Keyword: ${item.keyword}` : 'No keyword assigned'}
        </p>
      </div>
      <div className="w-[100px] flex-shrink-0 flex justify-center">
        <Badge variant="outline" className={`text-xs ${statusColor}`}>
          {item.status || 'pending'}
        </Badge>
      </div>
      <div className="w-[80px] flex-shrink-0 text-center">
        <span className="text-xs text-muted-foreground">{item.word_count || '—'}</span>
      </div>
      <div className="w-[100px] flex-shrink-0 text-center">
        <span className="text-xs text-muted-foreground">
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
        </span>
      </div>
      <div className="w-[80px] flex-shrink-0 flex justify-end gap-2">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
});
ContentRow.displayName = 'ContentRow';

// ─── FAQ Row Component ──────────────────────────────────────────────────────
interface FAQRowProps {
  item: FAQItem;
  onEdit: () => void;
  onDelete: () => void;
}

const FAQRow = memo(({ item, onEdit, onDelete }: FAQRowProps) => (
  <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-card/50 border border-border/30 hover:border-border/60 transition-colors">
    <div className="w-[60px] flex-shrink-0 flex justify-center">
      <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
        <HelpCircle className="w-5 h-5 text-blue-400" />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm text-foreground truncate">{item.question || 'No question'}</p>
      <p className="text-xs text-muted-foreground truncate line-clamp-1">
        {item.answer ? item.answer.substring(0, 100) + '...' : 'No answer'}
      </p>
    </div>
    <div className="w-[100px] flex-shrink-0 flex justify-center">
      <Badge variant="outline" className="text-xs bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
        {item.status || 'active'}
      </Badge>
    </div>
    <div className="w-[80px] flex-shrink-0 flex justify-end gap-2">
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}>
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  </div>
));
FAQRow.displayName = 'FAQRow';

// ─── Content Skeleton ───────────────────────────────────────────────────────
const ContentSkeleton = memo(({ count = 5 }: { count?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div 
        key={i}
        className="flex items-center gap-4 px-4 py-3 rounded-lg bg-card/30 border border-border/20"
        style={{ opacity: 0.6 - i * 0.08 }}
      >
        <div className="w-[60px] flex-shrink-0 flex justify-center">
          <div className="w-10 h-10 rounded-lg bg-muted/40" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="h-4 bg-muted/50 rounded" style={{ width: `${60 + (i % 3) * 10}%` }} />
          <div className="h-3 bg-muted/30 rounded" style={{ width: `${40 + (i % 4) * 5}%` }} />
        </div>
        <div className="w-[100px] flex-shrink-0 flex justify-center">
          <div className="h-5 w-16 rounded-full bg-muted/40" />
        </div>
        <div className="w-[80px] flex-shrink-0 flex justify-center">
          <div className="w-10 h-4 rounded bg-muted/30" />
        </div>
        <div className="w-[100px] flex-shrink-0 flex justify-center">
          <div className="w-16 h-4 rounded bg-muted/30" />
        </div>
        <div className="w-[80px] flex-shrink-0" />
      </div>
    ))}
  </div>
));
ContentSkeleton.displayName = 'ContentSkeleton';

// ─── Table Header ───────────────────────────────────────────────────────────
const ContentTableHeader = memo(({ type }: { type: 'articles' | 'faqs' }) => (
  <div className="flex items-center gap-4 px-4 py-2 mb-2 rounded-lg bg-card/80 border border-border/50">
    <div className="w-[60px] flex-shrink-0 flex justify-center">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Type</span>
    </div>
    <div className="flex-1">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {type === 'articles' ? 'Title / Keyword' : 'Question / Answer'}
      </span>
    </div>
    <div className="w-[100px] flex-shrink-0 flex justify-center">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</span>
    </div>
    {type === 'articles' && (
      <>
        <div className="w-[80px] flex-shrink-0 flex justify-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Words</span>
        </div>
        <div className="w-[100px] flex-shrink-0 flex justify-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Created</span>
        </div>
      </>
    )}
    <div className="w-[80px] flex-shrink-0 flex justify-end">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Actions</span>
    </div>
  </div>
));
ContentTableHeader.displayName = 'ContentTableHeader';

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
  const [searchQuery, setSearchQuery] = useState("");
  const [contentTab, setContentTab] = useState<'articles' | 'faqs'>('articles');
  const [showAIMetrics, setShowAIMetrics] = useState(false);
  const [domainContextOpen, setDomainContextOpen] = useState(false);
  
  // Edit states
  const [editingArticle, setEditingArticle] = useState<ContentItem | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [articleEditForm, setArticleEditForm] = useState({ title: "", content: "" });
  const [faqEditForm, setFaqEditForm] = useState({ question: "", answer: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateKeyword, setGenerateKeyword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleGenerateContent = async () => {
    if (!domain || !generateKeyword.trim()) return;
    setIsGenerating(true);
    try {
      await callCadeApi("generate-content", { keyword: generateKeyword.trim() });
      toast.success("Content generation started!");
      setShowGenerateDialog(false);
      setGenerateKeyword("");
      setTimeout(() => fetchData(), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate content");
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
      toast.success("Article updated!");
      setEditingArticle(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update article");
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
      toast.success("FAQ updated!");
      setEditingFaq(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update FAQ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteArticle = async (item: ContentItem) => {
    try {
      await callCadeApi("delete-content", { content_id: item.content_id || item.id });
      toast.success("Article deleted");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete article");
    }
  };

  const handleDeleteFaq = async (item: FAQItem) => {
    try {
      await callCadeApi("delete-faq", { faq_id: item.faq_id || item.id });
      toast.success("FAQ deleted");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete FAQ");
    }
  };

  // Filter content
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter(a => 
      (a.title || '').toLowerCase().includes(q) ||
      (a.keyword || '').toLowerCase().includes(q)
    );
  }, [articles, searchQuery]);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const q = searchQuery.toLowerCase();
    return faqs.filter(f => 
      (f.question || '').toLowerCase().includes(q) ||
      (f.answer || '').toLowerCase().includes(q)
    );
  }, [faqs, searchQuery]);

  // Stats
  const contentStats = useMemo(() => ({
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    drafts: articles.filter(a => a.status === 'draft').length,
  }), [articles]);

  const faqStats = useMemo(() => ({
    total: faqs.length,
  }), [faqs]);

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

      {/* Top Feature Cards (BRON style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeatureCard
          icon={<FileText className="w-5 h-5 text-violet-400" />}
          iconBg="bg-violet-500/15"
          title="Content Automation"
          description="Generate SEO-optimized articles and blog posts automatically based on your target keywords."
        />
        <FeatureCard
          icon={<HelpCircle className="w-5 h-5 text-cyan-400" />}
          iconBg="bg-cyan-500/15"
          title="FAQ Generation"
          description="Create comprehensive FAQ sections that improve user experience and search visibility."
        />
        <FeatureCard
          icon={<Target className="w-5 h-5 text-emerald-400" />}
          iconBg="bg-emerald-500/15"
          title="Domain Intelligence"
          description="Analyze your domain structure, categories, and content opportunities for optimization."
        />
      </div>

      {/* Main Content Card (BRON Keywords style) */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
                <Brain className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Content & FAQs
                  {domain && (
                    <Badge variant="outline" className="text-xs font-mono bg-muted/50">
                      {domain}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                  <span>Total: <span className="text-foreground font-medium">{contentStats.total + faqStats.total}</span></span>
                  <span>•</span>
                  <span>Articles: <span className="text-violet-400 font-medium">{contentStats.total}</span></span>
                  <span>•</span>
                  <span>FAQs: <span className="text-cyan-400 font-medium">{faqStats.total}</span></span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48 h-9 bg-background/60"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9"
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setShowGenerateDialog(true)}
                className="h-9 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Generate
              </Button>
              <Button
                size="sm"
                variant={showAIMetrics ? "default" : "outline"}
                onClick={() => setShowAIMetrics(!showAIMetrics)}
                className={showAIMetrics 
                  ? "h-9 bg-gradient-to-r from-violet-500/80 to-cyan-500/80 text-white border-0 hover:from-violet-500 hover:to-cyan-500" 
                  : "h-9 border-violet-500/40 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/60"
                }
              >
                {showAIMetrics ? <EyeOff className="w-4 h-4 mr-1.5" /> : <Brain className="w-4 h-4 mr-1.5" />}
                {showAIMetrics ? "Hide AI Metrics" : "View AI Metrics"}
              </Button>
            </div>
          </div>
          
          {/* Tab selector */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              variant={contentTab === 'articles' ? 'default' : 'outline'}
              onClick={() => setContentTab('articles')}
              className={contentTab === 'articles' ? 'bg-violet-500/80 hover:bg-violet-500' : ''}
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Articles ({contentStats.total})
            </Button>
            <Button
              size="sm"
              variant={contentTab === 'faqs' ? 'default' : 'outline'}
              onClick={() => setContentTab('faqs')}
              className={contentTab === 'faqs' ? 'bg-cyan-500/80 hover:bg-cyan-500' : ''}
            >
              <HelpCircle className="w-4 h-4 mr-1.5" />
              FAQs ({faqStats.total})
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              onClick={handleTriggerCrawl}
              disabled={isCrawling}
              className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
            >
              {isCrawling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Crawling...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-1.5" />
                  Crawl Domain
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDomainContextOpen(true)}
            >
              <Settings className="w-4 h-4 mr-1.5" />
              Domain Settings
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* AI Metrics Display */}
          {showAIMetrics && (
            <div className="mb-6 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 overflow-hidden">
              <div className="p-4 border-b border-violet-500/20 flex items-center justify-between bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center border border-violet-500/30">
                    <Brain className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">AI Content Metrics Analysis</h3>
                    <p className="text-xs text-muted-foreground">Real-time content generation and optimization data</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAIMetrics(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CADEAILoadingAnimation />
            </div>
          )}
          
          {/* Content Table */}
          {isLoading ? (
            <ContentSkeleton count={6} />
          ) : contentTab === 'articles' ? (
            <>
              <ContentTableHeader type="articles" />
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No articles found</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGenerateDialog(true)}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Generate Content
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredArticles.map((item, i) => (
                    <ContentRow
                      key={item.id || item.content_id || i}
                      item={item}
                      onEdit={() => {
                        setEditingArticle(item);
                        setArticleEditForm({
                          title: item.title || '',
                          content: item.content || '',
                        });
                      }}
                      onDelete={() => handleDeleteArticle(item)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <ContentTableHeader type="faqs" />
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No FAQs found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFaqs.map((item, i) => (
                    <FAQRow
                      key={item.id || item.faq_id || i}
                      item={item}
                      onEdit={() => {
                        setEditingFaq(item);
                        setFaqEditForm({
                          question: item.question || '',
                          answer: item.answer || '',
                        });
                      }}
                      onDelete={() => handleDeleteFaq(item)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Target Keyword</label>
              <Input
                value={generateKeyword}
                onChange={(e) => setGenerateKeyword(e.target.value)}
                placeholder="e.g., best SEO practices 2024"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
            <Button onClick={handleGenerateContent} disabled={isGenerating || !generateKeyword.trim()}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog open={!!editingArticle} onOpenChange={(open) => !open && setEditingArticle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <Input
                value={articleEditForm.title}
                onChange={(e) => setArticleEditForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Content</label>
              <Textarea
                value={articleEditForm.content}
                onChange={(e) => setArticleEditForm(prev => ({ ...prev, content: e.target.value }))}
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingArticle(null)}>Cancel</Button>
            <Button onClick={handleSaveArticle} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit FAQ Dialog */}
      <Dialog open={!!editingFaq} onOpenChange={(open) => !open && setEditingFaq(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Question</label>
              <Input
                value={faqEditForm.question}
                onChange={(e) => setFaqEditForm(prev => ({ ...prev, question: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Answer</label>
              <Textarea
                value={faqEditForm.answer}
                onChange={(e) => setFaqEditForm(prev => ({ ...prev, answer: e.target.value }))}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFaq(null)}>Cancel</Button>
            <Button onClick={handleSaveFaq} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CADEDashboardNew;
