import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, AlertTriangle,
  Shield, Sparkles, Database, Activity, Server,
  Cpu, BarChart3, Globe, RefreshCw, 
  HelpCircle, Zap, FileText, Clock,
  Search, Link2, TrendingUp, Target, Layers, Bot, Newspaper,
  Wand2, ListChecks, Brain,
  CheckCircle, XCircle, Timer, Rocket, PenTool, BookOpen,
  Upload, Trash2, Settings, Copy, Send, Lock, ChevronRight, Edit, X, Save, Eye, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBronApi, type BronSubscription } from "@/hooks/use-bron-api";
import {
  loadCachedCadeData,
  saveCachedCadeData,
  type CadeCacheData
} from "@/lib/persistentCache";

interface SystemHealth {
  status?: string;
  workers?: number;
  tasks?: number;
  queues?: { name?: string; size?: number; status?: string }[];
  uptime?: string;
  version?: string;
}

interface SubscriptionInfo {
  plan?: string;
  status?: string;
  quota_used?: number;
  quota_limit?: number;
  credits_remaining?: number;
  domains_limit?: number;
  domains_used?: number;
  articles_generated?: number;
  faqs_generated?: number;
  renewal_date?: string;
  domains?: string[];
}

interface DomainProfile {
  domain?: string;
  category?: string;
  status?: string;
  crawled_pages?: number;
  last_crawl?: string;
  css_analyzed?: boolean;
  content_count?: number;
  keywords_tracked?: number;
  competitors?: string[];
  language?: string;
  niche?: string;
}

interface FAQItem {
  id?: string;
  question?: string;
  answer?: string;
  created_at?: string;
  status?: string;
}

interface ContentItem {
  id?: string;
  content_id?: string;
  title?: string;
  type?: string;
  status?: string;
  keyword?: string;
  word_count?: number;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  body?: string;
  meta_title?: string;
  meta_description?: string;
  slug?: string;
  published_url?: string;
}

interface TaskItem {
  id?: string;
  task_id?: string;
  type?: string;
  domain?: string;
  status?: string;
  created_at?: string;
  progress?: number;
  message?: string;
}

interface QueueInfo {
  name?: string;
  size?: number;
  processing?: number;
  completed?: number;
  failed?: number;
  status?: string;
}

interface WorkerInfo {
  id?: string;
  name?: string;
  status?: string;
  current_task?: string;
  tasks_completed?: number;
}

interface CADELoginBoxProps {
  domain?: string;
  onSubscriptionChange?: (hasSubscription: boolean) => void;
}

// Use BRON subscription cache (authoritative source, shared across components)
// This matches the cache key used in use-bron-api.ts for consistency
const BRON_SUBSCRIPTION_CACHE_KEY = 'bron_subscription_cache';
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

interface SubscriptionCacheEntry {
  subscription: BronSubscription;
  cachedAt: number;
}

const getCachedSubscription = (targetDomain: string): BronSubscription | null => {
  try {
    const cached = localStorage.getItem(BRON_SUBSCRIPTION_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as Record<string, SubscriptionCacheEntry>;
    const entry = parsed[targetDomain];
    if (!entry || (Date.now() - entry.cachedAt) > CACHE_MAX_AGE) return null;
    console.log(`[CADELoginBox] Using cached BRON subscription for ${targetDomain}`);
    return entry.subscription;
  } catch {
    return null;
  }
};

const setCachedSubscription = (targetDomain: string, data: BronSubscription) => {
  try {
    const cached = localStorage.getItem(BRON_SUBSCRIPTION_CACHE_KEY);
    const parsed = cached ? JSON.parse(cached) as Record<string, SubscriptionCacheEntry> : {};
    parsed[targetDomain] = { subscription: data, cachedAt: Date.now() };
    localStorage.setItem(BRON_SUBSCRIPTION_CACHE_KEY, JSON.stringify(parsed));
    console.log(`[CADELoginBox] Cached subscription for ${targetDomain}`);
  } catch { /* ignore */ }
};

const clearCachedSubscription = (targetDomain: string) => {
  try {
    const cached = localStorage.getItem(BRON_SUBSCRIPTION_CACHE_KEY);
    if (!cached) return;
    const parsed = JSON.parse(cached) as Record<string, SubscriptionCacheEntry>;
    if (parsed[targetDomain]) {
      delete parsed[targetDomain];
      localStorage.setItem(BRON_SUBSCRIPTION_CACHE_KEY, JSON.stringify(parsed));
    }
  } catch { /* ignore */ }
};

const CONTENT_TYPES = [
  { id: "blog", name: "Blog Article", icon: FileText, desc: "Long-form SEO-optimized content", color: "from-blue-500 to-cyan-500" },
  { id: "pillar", name: "Pillar Page", icon: Layers, desc: "Comprehensive topic hub pages", color: "from-violet-500 to-purple-500" },
  { id: "comparison", name: "Comparison", icon: Target, desc: "Product/service comparisons", color: "from-amber-500 to-orange-500" },
  { id: "listicle", name: "Listicle", icon: ListChecks, desc: "Numbered list articles", color: "from-emerald-500 to-green-500" },
  { id: "how-to", name: "How-To Guide", icon: BookOpen, desc: "Step-by-step tutorials", color: "from-pink-500 to-rose-500" },
  { id: "case-study", name: "Case Study", icon: TrendingUp, desc: "Success story narratives", color: "from-indigo-500 to-blue-500" },
  { id: "news", name: "News Article", icon: Newspaper, desc: "Timely industry updates", color: "from-red-500 to-orange-500" },
];

const MODEL_TIERS = [
  { id: "standard", name: "Standard", desc: "Good quality, faster" },
  { id: "premium", name: "Premium", desc: "Best quality, slower" },
];

// Check if we have cached subscription data to show instantly
const hasCachedSubscription = (targetDomain: string): boolean => {
  const cached = getCachedSubscription(targetDomain);
  return cached !== null && cached.has_cade === true;
};

export const CADELoginBox = ({ domain, onSubscriptionChange }: CADELoginBoxProps) => {
  const { fetchSubscription } = useBronApi();
  
  // Check persistent cache synchronously for instant load
  const [cachedData] = useState(() => domain ? loadCachedCadeData(domain) : null);
  const [hasCached] = useState(() => domain ? (cachedData?.isConnected || hasCachedSubscription(domain)) : false);
  const [isLoading, setIsLoading] = useState(!hasCached);
  const [isConnected, setIsConnected] = useState(hasCached);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domainHasSubscription, setDomainHasSubscription] = useState<boolean | null>(hasCached ? true : null);
  const [loadingPhase, setLoadingPhase] = useState<'connecting' | 'subscription' | null>(hasCached ? null : 'connecting');
  const [bronSubscription, setBronSubscription] = useState<BronSubscription | null>(() => domain ? getCachedSubscription(domain) : null);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(hasCached);

  // API Data States (hydrate from persistent cache)
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(cachedData?.subscription || null);
  const [domainProfile, setDomainProfile] = useState<DomainProfile | null>(cachedData?.domainProfile || null);
  const [faqs, setFaqs] = useState<FAQItem[]>(cachedData?.faqs as FAQItem[] || []);
  const [contentList, setContentList] = useState<ContentItem[]>(cachedData?.contentList as ContentItem[] || []);
  const [crawlTasks, setCrawlTasks] = useState<TaskItem[]>([]);
  const [categorizationTasks, setCategorizationTasks] = useState<TaskItem[]>([]);
  const [queues, setQueues] = useState<QueueInfo[]>(cachedData?.queues as QueueInfo[] || []);
  const [workers, setWorkers] = useState<WorkerInfo[]>(cachedData?.workers as WorkerInfo[] || []);

  // UI States
  const [activeTab, setActiveTab] = useState("overview");
  const [generatingContent, setGeneratingContent] = useState<string | null>(null);
  const [crawling, setCrawling] = useState(false);
  const [generatingFaq, setGeneratingFaq] = useState(false);
  const [analyzingCss, setAnalyzingCss] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [generatingKb, setGeneratingKb] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedModelTier, setSelectedModelTier] = useState("standard");
  const [contentKeyword, setContentKeyword] = useState("");
  const [faqCount, setFaqCount] = useState("5");
  const [publishPlatform, setPublishPlatform] = useState("wordpress");
  const [publishContentId, setPublishContentId] = useState("");
  
  // Inline editing states
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [savingContent, setSavingContent] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [savingFaq, setSavingFaq] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  // API call helper - uses system API key (no user key needed)
  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>, currentDomain?: string) => {
    const targetDomain = currentDomain || domain;
    
    // Don't pass apiKey - edge function will use CADE_API_KEY secret
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain: targetDomain, params },
    });

    if (error) {
      console.error(`[CADE] ${action} error:`, error);
      throw new Error(error.message || `Failed to fetch ${action}`);
    }

    return data;
  }, [domain]);

  // Optimized: Parallel connection + subscription check with persistent cache
  useEffect(() => {
    const initializeConnection = async () => {
      if (!domain) {
        setDomainHasSubscription(null);
        setSubscription(null);
        setBronSubscription(null);
        setIsLoading(false);
        setLoadingPhase(null);
        return;
      }

      // FAST PATH: Check persistent cache first (instant)
      const cachedSub = getCachedSubscription(domain);
      if (cachedSub && cachedSub.has_cade === true) {
        console.log("[CADELoginBox] Using cached subscription (instant load)");
        setDomainHasSubscription(true);
        setBronSubscription(cachedSub);
        setSubscription({
          plan: cachedSub.plan || cachedSub.servicetype,
          status: cachedSub.status || "active",
        });
        setIsConnected(true);
        setIsLoading(false);
        setLoadingPhase(null);
        setIsBackgroundSyncing(true);
        
        // Background refresh for subscription changes (non-blocking)
        Promise.allSettled([
          callCadeApi("health"),
          fetchSubscription(domain),
        ]).then(([healthRes, subRes]) => {
          if (healthRes.status === 'fulfilled') {
            const hData = healthRes.value;
            const isHealthy = hData?.success === true || hData?.data?.status === "healthy" || hData?.status === "healthy";
            if (isHealthy) {
              setHealth(hData.data || hData);
            }
          }
          if (subRes.status === 'fulfilled') {
            const freshSub = subRes.value;
            if (freshSub) {
              if (freshSub.has_cade === true) {
                setCachedSubscription(domain, freshSub);
                setBronSubscription(freshSub);
              } else {
                // Subscription canceled
                clearCachedSubscription(domain);
                setDomainHasSubscription(false);
                setBronSubscription(freshSub);
              }
            }
          }
        }).finally(() => {
          setIsBackgroundSyncing(false);
        });
        
        return;
      }

      // SLOW PATH: No cache, do full check
      setIsLoading(true);
      setLoadingPhase('connecting');
      setError(null);
      setBronSubscription(null);

      try {
        const [healthResult, bronSubResult] = await Promise.allSettled([
          callCadeApi("health"),
          fetchSubscription(domain),
        ]);

        // Process health check
        if (healthResult.status === 'fulfilled') {
          const healthRes = healthResult.value;
          const isHealthy = 
            healthRes?.success === true || 
            healthRes?.message === "success" ||
            healthRes?.data?.status === "healthy" || 
            healthRes?.status === "healthy" || 
            healthRes?.status === "ok" ||
            healthRes?.status_code === 200 ||
            (healthRes?.data && !healthRes?.error);
          
          if (isHealthy) {
            setIsConnected(true);
            setHealth(healthRes.data || healthRes);
          } else {
            console.error("[CADE] Health check returned unhealthy:", healthRes);
            setError("CADE API is not responding properly");
            setIsLoading(false);
            setLoadingPhase(null);
            return;
          }
        } else {
          console.error("[CADE] Connection check failed:", healthResult.reason);
          setError("Failed to connect to CADE API");
          setIsLoading(false);
          setLoadingPhase(null);
          return;
        }

        // Process BRON entitlement check
        setLoadingPhase('subscription');

        if (bronSubResult.status === 'fulfilled') {
          const bronSub = bronSubResult.value;
          setBronSubscription(bronSub);

          const hasEntitlement = Boolean(bronSub && bronSub.has_cade && bronSub.status === 'active');
          setDomainHasSubscription(hasEntitlement);

          if (hasEntitlement && bronSub) {
            setCachedSubscription(domain, bronSub);
            setSubscription({
              plan: bronSub.plan || bronSub.servicetype,
              status: bronSub.status || "active",
            });
          } else {
            clearCachedSubscription(domain);
            setSubscription(null);
          }
        } else {
          console.error('[CADE] BRON subscription check failed:', bronSubResult.reason);
          setBronSubscription(null);
          setDomainHasSubscription(false);
          setSubscription(null);
        }
      } catch (err) {
        console.error("[CADE] Initialization error:", err);
        setError("Failed to connect to CADE API");
      } finally {
        setIsLoading(false);
        setLoadingPhase(null);
      }
    };

    initializeConnection();
  }, [domain, callCadeApi, fetchSubscription]);

  // Fetch all data when connected and domain has subscription
  const fetchAllData = useCallback(async () => {
    if (!isConnected || !domainHasSubscription) return;
    
    setError(null);

    try {
      const results = await Promise.allSettled([
        callCadeApi("health"),
        callCadeApi("workers"),
        callCadeApi("queues"),
        callCadeApi("subscription"),
        callCadeApi("subscription-detail"),
        callCadeApi("crawl-tasks"),
        callCadeApi("categorization-tasks"),
      ]);

      // Process results
      if (results[0].status === "fulfilled") {
        const data = results[0].value?.data || results[0].value;
        setHealth(data);
      }
      if (results[1].status === "fulfilled") {
        const data = results[1].value?.data || results[1].value;
        if (Array.isArray(data)) setWorkers(data);
        else if (data?.workers) setWorkers(Array.isArray(data.workers) ? data.workers : []);
      }
      if (results[2].status === "fulfilled") {
        const data = results[2].value?.data || results[2].value;
        if (Array.isArray(data)) setQueues(data);
        else if (data?.queues) setQueues(data.queues);
      }
      if (results[3].status === "fulfilled") {
        const data = results[3].value?.data || results[3].value;
        setSubscription(prev => ({ ...prev, ...data }));
      }
      if (results[4].status === "fulfilled") {
        const data = results[4].value?.data || results[4].value;
        setSubscription(prev => ({ ...prev, ...data }));
      }
      if (results[5].status === "fulfilled") {
        const data = results[5].value?.data || results[5].value;
        setCrawlTasks(Array.isArray(data) ? data : data?.tasks || []);
      }
      if (results[6].status === "fulfilled") {
        const data = results[6].value?.data || results[6].value;
        setCategorizationTasks(Array.isArray(data) ? data : data?.tasks || []);
      }

      // Fetch domain-specific data
      if (domain) {
        const domainResults = await Promise.allSettled([
          callCadeApi("domain-profile"),
          callCadeApi("get-faqs"),
          callCadeApi("list-content", { limit: 50 }),
        ]);

        if (domainResults[0].status === "fulfilled" && !domainResults[0].value?.error) {
          setDomainProfile(domainResults[0].value?.data || domainResults[0].value);
        }
        if (domainResults[1].status === "fulfilled" && !domainResults[1].value?.error) {
          const faqData = domainResults[1].value?.data || domainResults[1].value;
          setFaqs(Array.isArray(faqData) ? faqData : faqData?.faqs || []);
        }
        if (domainResults[2].status === "fulfilled" && !domainResults[2].value?.error) {
          const contentData = domainResults[2].value?.data || domainResults[2].value;
          setContentList(Array.isArray(contentData) ? contentData : contentData?.items || contentData?.content || []);
        }
      }
    } catch (err) {
      console.error("[CADE] Fetch error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [domain, isConnected, domainHasSubscription, callCadeApi]);

  useEffect(() => {
    if (isConnected && domainHasSubscription) {
      fetchAllData();
    }
  }, [isConnected, domainHasSubscription, domain, fetchAllData]);

  // Notify parent about subscription status changes
  useEffect(() => {
    if (domainHasSubscription !== null) {
      onSubscriptionChange?.(domainHasSubscription);
    }
  }, [domainHasSubscription, onSubscriptionChange]);

  // === ACTION HANDLERS ===
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAllData();
    toast.success("Refreshing CADE data...");
  };

  const handleCrawlDomain = async () => {
    if (!domain) {
      toast.error("Please select a domain first");
      return;
    }
    setCrawling(true);
    try {
      const res = await callCadeApi("crawl-domain", { force: true });
      if (res && !res.error) {
        toast.success(`Crawl started for ${domain}`);
        setTimeout(() => fetchAllData(), 3000);
      } else {
        toast.error(res?.error?.message || res?.error || "Failed to start crawl");
      }
    } catch (err) {
      toast.error("Failed to start domain crawl");
    } finally {
      setCrawling(false);
    }
  };

  const handleCategorizeDomain = async () => {
    if (!domain) {
      toast.error("Please select a domain first");
      return;
    }
    setCategorizing(true);
    try {
      const res = await callCadeApi("categorize-domain");
      if (res && !res.error) {
        toast.success(`Categorization started for ${domain}`);
        setTimeout(() => fetchAllData(), 3000);
      } else {
        toast.error(res?.error || "Failed to categorize domain");
      }
    } catch (err) {
      toast.error("Failed to categorize domain");
    } finally {
      setCategorizing(false);
    }
  };

  const handleAnalyzeCss = async () => {
    if (!domain) {
      toast.error("Please select a domain first");
      return;
    }
    setAnalyzingCss(true);
    try {
      const res = await callCadeApi("analyze-css");
      if (res && !res.error) {
        toast.success(`CSS analysis started for ${domain}`);
        setTimeout(() => fetchAllData(), 3000);
      } else {
        toast.error(res?.error || "Failed to analyze CSS");
      }
    } catch (err) {
      toast.error("Failed to analyze CSS");
    } finally {
      setAnalyzingCss(false);
    }
  };

  const handleGenerateContent = async (contentType: string) => {
    if (!domain) {
      toast.error("Please select a domain first");
      return;
    }
    setGeneratingContent(contentType);
    try {
      const res = await callCadeApi("generate-content", { 
        content_type: contentType,
        model_tier: selectedModelTier,
        keyword: contentKeyword || undefined,
        platform: "wordpress", // Required by CADE API
        auto_publish: false 
      });
      if (res?.success || res?.task_id || res?.content_id) {
        toast.success(`${contentType} generation started!`);
        fetchAllData();
      } else {
        toast.error(res?.error || "Failed to start content generation");
      }
    } catch (err) {
      toast.error("Failed to generate content");
    } finally {
      setGeneratingContent(null);
    }
  };

  const handleGenerateKnowledgeBase = async () => {
    if (!domain) {
      toast.error("Please select a domain first");
      return;
    }
    setGeneratingKb(true);
    try {
      const res = await callCadeApi("generate-knowledge-base");
      if (res && !res.error) {
        toast.success("Knowledge base generation started!");
        setTimeout(() => fetchAllData(), 3000);
      } else {
        toast.error(res?.error || "Failed to generate knowledge base");
      }
    } catch (err) {
      toast.error("Failed to generate knowledge base");
    } finally {
      setGeneratingKb(false);
    }
  };

  const handleGenerateFaq = async () => {
    if (!domain) {
      toast.error("Please select a domain first");
      return;
    }
    setGeneratingFaq(true);
    try {
      const res = await callCadeApi("generate-faq", { count: parseInt(faqCount) });
      if (res?.success || res?.faqs) {
        toast.success("FAQs generated successfully!");
        fetchAllData();
      } else {
        toast.error(res?.error || "Failed to generate FAQs");
      }
    } catch (err) {
      toast.error("Failed to generate FAQs");
    } finally {
      setGeneratingFaq(false);
    }
  };

  const handlePublishContent = async () => {
    if (!publishContentId.trim()) {
      toast.error("Please enter a content ID to publish");
      return;
    }
    setPublishing(true);
    try {
      const res = await callCadeApi("publish-content", {
        content_id: publishContentId,
        platform: publishPlatform,
      });
      if (res && !res.error) {
        toast.success("Content published successfully!");
        setPublishContentId("");
      } else {
        toast.error(res?.error || "Failed to publish content");
      }
    } catch (err) {
      toast.error("Failed to publish content");
    } finally {
      setPublishing(false);
    }
  };

  const handleTerminateTask = async (taskId: string) => {
    try {
      const res = await callCadeApi("terminate-content-task", { task_id: taskId });
      if (res && !res.error) {
        toast.success("Task terminated");
        fetchAllData();
      } else {
        toast.error(res?.error || "Failed to terminate task");
      }
    } catch (err) {
      toast.error("Failed to terminate task");
    }
  };

  // === CONTENT CRUD HANDLERS ===
  const handleEditContent = async (contentId: string) => {
    setLoadingContent(true);
    setEditingContentId(contentId);
    try {
      const res = await callCadeApi("get-content", { content_id: contentId });
      if (res && !res.error) {
        setEditingContent(res?.data || res);
      } else {
        toast.error("Failed to load content for editing");
        setEditingContentId(null);
      }
    } catch (err) {
      toast.error("Failed to load content");
      setEditingContentId(null);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleSaveContent = async () => {
    if (!editingContent || !editingContentId) return;
    setSavingContent(true);
    try {
      const res = await callCadeApi("update-content", {
        content_id: editingContentId,
        title: editingContent.title,
        body: editingContent.body,
        meta_title: editingContent.meta_title,
        meta_description: editingContent.meta_description,
        slug: editingContent.slug,
      });
      if (res && !res.error) {
        toast.success("Content updated successfully!");
        setEditingContentId(null);
        setEditingContent(null);
        fetchAllData();
      } else {
        toast.error(res?.error || "Failed to update content");
      }
    } catch (err) {
      toast.error("Failed to save content");
    } finally {
      setSavingContent(false);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    try {
      const res = await callCadeApi("delete-content", { content_id: contentId });
      if (res && !res.error) {
        toast.success("Content deleted");
        fetchAllData();
      } else {
        toast.error(res?.error || "Failed to delete content");
      }
    } catch (err) {
      toast.error("Failed to delete content");
    }
  };

  const handleCancelEditContent = () => {
    setEditingContentId(null);
    setEditingContent(null);
  };

  // === FAQ CRUD HANDLERS ===
  const handleEditFaq = (faq: FAQItem) => {
    setEditingFaqId(faq.id || null);
    setEditingFaq({ ...faq });
  };

  const handleSaveFaq = async () => {
    if (!editingFaq || !editingFaqId) return;
    setSavingFaq(true);
    try {
      const res = await callCadeApi("update-faq", {
        faq_id: editingFaqId,
        question: editingFaq.question,
        answer: editingFaq.answer,
      });
      if (res && !res.error) {
        toast.success("FAQ updated successfully!");
        setEditingFaqId(null);
        setEditingFaq(null);
        fetchAllData();
      } else {
        toast.error(res?.error || "Failed to update FAQ");
      }
    } catch (err) {
      toast.error("Failed to save FAQ");
    } finally {
      setSavingFaq(false);
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await callCadeApi("delete-faq", { faq_id: faqId });
      if (res && !res.error) {
        toast.success("FAQ deleted");
        fetchAllData();
      } else {
        toast.error(res?.error || "Failed to delete FAQ");
      }
    } catch (err) {
      toast.error("Failed to delete FAQ");
    }
  };

  const handleCancelEditFaq = () => {
    setEditingFaqId(null);
    setEditingFaq(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-muted text-muted-foreground";
    const s = status.toLowerCase();
    if (s === "healthy" || s === "active" || s === "running" || s === "ok" || s === "completed" || s === "success") {
      return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
    }
    if (s === "warning" || s === "busy" || s === "pending" || s === "processing" || s === "queued") {
      return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    }
    if (s === "error" || s === "failed" || s === "offline") {
      return "bg-red-500/15 text-red-500 border-red-500/30";
    }
    return "bg-violet-500/15 text-violet-500 border-violet-500/30";
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return <Clock className="w-3.5 h-3.5" />;
    const s = status.toLowerCase();
    if (s === "healthy" || s === "active" || s === "completed" || s === "success") return <CheckCircle className="w-3.5 h-3.5" />;
    if (s === "pending" || s === "processing" || s === "queued") return <Timer className="w-3.5 h-3.5" />;
    if (s === "error" || s === "failed") return <XCircle className="w-3.5 h-3.5" />;
    return <Activity className="w-3.5 h-3.5" />;
  };

  // Futuristic AI-agentic loading animation - only show if not cached
  if (isLoading && !hasCached) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-cyan-500/10 border border-violet-500/30 overflow-hidden"
      >
        {/* Animated background grid */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          />
          <motion.div
            className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent"
            animate={{ y: [0, 200, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-bl from-violet-500/30 via-purple-500/20 to-transparent rounded-full blur-3xl"
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl"
            animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
        </div>
        
        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* AI Brain icon with orbiting particles */}
          <div className="relative">
            <motion.div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-violet-500/40"
              animate={{ 
                boxShadow: [
                  "0 10px 40px -10px rgba(139, 92, 246, 0.4)",
                  "0 10px 40px -10px rgba(139, 92, 246, 0.7)",
                  "0 10px 40px -10px rgba(139, 92, 246, 0.4)"
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
            
            {/* Orbiting particles */}
            <motion.div
              className="absolute top-1/2 left-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 -translate-x-1/2" />
              <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 rounded-full bg-violet-400 shadow-lg shadow-violet-400/50 -translate-x-1/2" />
            </motion.div>
            <motion.div
              className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2"
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
            </motion.div>
          </div>
          
          <div className="text-center">
            <motion.p 
              className="text-base font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              {loadingPhase === 'subscription' ? 'Verifying Access' : 'Initializing AI Agent'}
            </motion.p>
            <p className="text-xs text-muted-foreground mt-1">
              {loadingPhase === 'subscription' 
                ? `Checking subscription for ${domain}` 
                : 'CADE Content Automation Engine'}
            </p>
          </div>
          
          {/* Progress steps */}
          <div className="flex items-center gap-2 text-xs">
            <motion.span 
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${
                loadingPhase === 'connecting' 
                  ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' 
                  : 'bg-green-500/10 text-green-500 border-green-500/20'
              }`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.span 
                className={`w-1.5 h-1.5 rounded-full ${loadingPhase === 'connecting' ? 'bg-violet-400' : 'bg-green-500'}`}
                animate={loadingPhase === 'connecting' ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              {loadingPhase === 'connecting' ? 'Connecting' : '✓ Connected'}
            </motion.span>
            <motion.span 
              className="text-muted-foreground/40"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              →
            </motion.span>
            <motion.span 
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${
                loadingPhase === 'subscription' 
                  ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' 
                  : 'bg-muted/30 text-muted-foreground/50 border-border'
              }`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: loadingPhase === 'subscription' ? 1 : 0.5, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.span 
                className={`w-1.5 h-1.5 rounded-full ${loadingPhase === 'subscription' ? 'bg-violet-400' : 'bg-muted-foreground/30'}`}
                animate={loadingPhase === 'subscription' ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              {loadingPhase === 'subscription' ? 'Verifying' : 'Access'}
            </motion.span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Connection error state
  if (error && !isConnected) {
    return (
      <div className="p-8 rounded-2xl bg-gradient-to-br from-red-500/10 via-rose-500/5 to-pink-500/10 border border-red-500/30">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-400">Connection Error</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" className="gap-2 border-red-500/30 hover:bg-red-500/10">
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </Button>
      </div>
    );
  }

  // No domain selected state
  if (!domain) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
        <div className="relative p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 border border-violet-500/30 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-5 mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  CADE Platform
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Connected</Badge>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Select a domain to start generating content</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="font-medium text-amber-400">No Domain Selected</p>
                  <p className="text-sm text-muted-foreground">Use the domain selector above to choose a domain for CADE automation</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {[
                { icon: FileText, label: "7 Article Types", color: "text-violet-400" },
                { icon: HelpCircle, label: "FAQ Generation", color: "text-purple-400" },
                { icon: Link2, label: "Smart Linking", color: "text-fuchsia-400" },
                { icon: Target, label: "Competitor Intel", color: "text-pink-400" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-background/50 border border-border/50">
                  <f.icon className={`w-4 h-4 ${f.color}`} />
                  <span className="text-xs font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Domain doesn't have subscription - Show CADE Sales Pitch
  if (domainHasSubscription === false) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-2 border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </div>
          
          <CardHeader className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30"
                >
                  <Sparkles className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Automate Your Content with CADE
                    <Badge className="bg-violet-500/20 text-violet-500 border-violet-500/30">
                      AI-Powered
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1 max-w-xl">
                    CADE automatically generates SEO-optimized articles, FAQs, and landing pages that match your website's native CSS and inner-link to your money pages.
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-col items-center p-4 rounded-xl bg-background/50 border border-violet-500/20 min-w-[200px]">
                <p className="text-sm text-muted-foreground">Starting at</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-violet-500">$99</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <Badge variant="outline" className="mt-2 text-violet-500 border-violet-500/30">
                  Includes Social Signals
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 space-y-6">
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-500" />
                How CADE Automates Content Creation
              </h4>
              
              <div className="grid md:grid-cols-5 gap-3">
                {[
                  { step: '1', title: 'Analyze Competitors', desc: 'Reverse-engineer top 5 rankings', icon: Target },
                  { step: '2', title: 'Generate Content', desc: '7 article types available', icon: FileText },
                  { step: '3', title: 'Match Your CSS', desc: 'Native website styling', icon: Settings },
                  { step: '4', title: 'Add Inner Links', desc: 'Connect to money pages', icon: Link2 },
                  { step: '5', title: 'Publish', desc: 'Auto-deploy to your CMS', icon: Rocket },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative p-4 rounded-xl bg-background/30 border border-violet-500/10"
                  >
                    <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      {item.step}
                    </div>
                    <item.icon className="w-5 h-5 text-violet-500 mb-2" />
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                    
                    {i < 4 && (
                      <motion.div
                        className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ChevronRight className="w-4 h-4 text-violet-400" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: FileText, title: '7 Article Types', desc: 'Blog, pillar, how-to & more' },
                { icon: HelpCircle, title: 'FAQ Generation', desc: 'Automated Q&A content' },
                { icon: Link2, title: 'Smart Inner Linking', desc: 'Connect to core pages' },
                { icon: Target, title: 'Competitor Intel', desc: 'Outrank competitors' },
              ].map((benefit, i) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="p-4 rounded-xl bg-background/30 border border-violet-500/10 text-center"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-2">
                    <benefit.icon className="w-5 h-5 text-violet-500" />
                  </div>
                  <h4 className="font-semibold text-sm">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Domain info box */}
            <div className="p-4 rounded-xl bg-background/50 border border-violet-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-violet-400" />
                <span className="font-semibold">{domain}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                This domain doesn't have an active CADE subscription. Contact your account manager to add this domain to your plan.
              </p>
            </div>

            {subscription && (
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
                <p className="text-sm font-medium text-violet-400 mb-2">Current Plan: {subscription.plan || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">
                  Domains: {subscription.domains_used || 0} / {subscription.domains_limit || "∞"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Connected Dashboard - domain has subscription
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Background sync indicator - subtle, non-blocking */}
      {isBackgroundSyncing && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 backdrop-blur-sm">
          <RefreshCw className="w-3 h-3 text-violet-400 animate-spin" />
          <span className="text-xs text-violet-400">Syncing...</span>
        </div>
      )}
      {/* Active Domain Banner */}
      <div className="relative p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-green-500/10 to-teal-500/15 border border-emerald-500/30 overflow-hidden">
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Active Domain</p>
              <p className="text-lg font-bold text-foreground">{domain}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={handleCrawlDomain} disabled={crawling} className="gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30">
              {crawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Crawl
            </Button>
            <Button size="sm" onClick={handleCategorizeDomain} disabled={categorizing} variant="outline" className="gap-2">
              {categorizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              Categorize
            </Button>
            <Button size="sm" onClick={handleAnalyzeCss} disabled={analyzingCss} variant="outline" className="gap-2">
              {analyzingCss ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              Analyze CSS
            </Button>
          </div>
        </div>
      </div>

      {/* Header with Subscription Level */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 border border-violet-500/30 overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                {(health?.status === "healthy" || health?.status === "ok") && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-3">
                  CADE Dashboard
                  <Badge className={getStatusColor(health?.status)}>
                    {getStatusIcon(health?.status)}
                    <span className="ml-1.5 capitalize">{health?.status || "Connecting..."}</span>
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground">AI-Powered Content Automation Engine</p>
              </div>
            </div>
            
            {/* Right side: Subscription badge + Refresh button */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Subscription Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30">
                <Shield className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
                  {subscription?.plan || bronSubscription?.plan || "CADE PRO"}
                </span>
                {(subscription?.status || bronSubscription?.status) && (
                  <Badge className="h-5 text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    {subscription?.status || bronSubscription?.status}
                  </Badge>
                )}
              </div>
              
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2 border-violet-500/30 hover:bg-violet-500/10">
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Status</span>
            </div>
            <p className="text-xl font-bold capitalize">{health?.status || "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">{health?.version || "Latest"}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Workers</span>
            </div>
            <p className="text-xl font-bold">{health?.workers ?? workers.length ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Active</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Plan</span>
            </div>
            <p className="text-xl font-bold">{subscription?.plan || "Pro"}</p>
            <Badge className={`mt-1 ${getStatusColor(subscription?.status || "active")}`}>{subscription?.status || "Active"}</Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Articles</span>
            </div>
            <p className="text-xl font-bold">{subscription?.articles_generated ?? domainProfile?.content_count ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Generated</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/5 border-pink-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-pink-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">FAQs</span>
            </div>
            <p className="text-xl font-bold">{subscription?.faqs_generated ?? faqs.length ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Created</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Progress */}
      {(subscription?.quota_limit || subscription?.domains_limit) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscription?.quota_limit && (
            <Card className="border-violet-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Content Quota</span>
                  <span className="text-sm text-muted-foreground">{subscription.quota_used ?? 0} / {subscription.quota_limit}</span>
                </div>
                <Progress value={((subscription.quota_used ?? 0) / subscription.quota_limit) * 100} className="h-2" />
              </CardContent>
            </Card>
          )}
          {subscription?.domains_limit && (
            <Card className="border-violet-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Domain Slots</span>
                  <span className="text-sm text-muted-foreground">{subscription.domains_used ?? 0} / {subscription.domains_limit}</span>
                </div>
                <Progress value={((subscription.domains_used ?? 0) / subscription.domains_limit) * 100} className="h-2" />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-xl flex-wrap h-auto">
          <TabsTrigger value="overview" className="gap-2 rounded-lg"><BarChart3 className="w-4 h-4" />Overview</TabsTrigger>
          <TabsTrigger value="content" className="gap-2 rounded-lg"><PenTool className="w-4 h-4" />Content</TabsTrigger>
          <TabsTrigger value="faqs" className="gap-2 rounded-lg"><HelpCircle className="w-4 h-4" />FAQs</TabsTrigger>
          <TabsTrigger value="publish" className="gap-2 rounded-lg"><Upload className="w-4 h-4" />Publish</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2 rounded-lg"><ListChecks className="w-4 h-4" />Tasks</TabsTrigger>
          <TabsTrigger value="system" className="gap-2 rounded-lg"><Server className="w-4 h-4" />System</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="border-violet-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{domain}</CardTitle>
                    <CardDescription>Domain Profile</CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(domainProfile?.status)}>{domainProfile?.status || "Not crawled"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {domainProfile ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Category</p>
                    <p className="font-medium">{domainProfile.category || "Unknown"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Pages Crawled</p>
                    <p className="font-medium">{domainProfile.crawled_pages ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Content Generated</p>
                    <p className="font-medium">{domainProfile.content_count ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">CSS Analyzed</p>
                    <p className="font-medium">{domainProfile.css_analyzed ? "Yes" : "No"}</p>
                  </div>
                  {domainProfile.language && (
                    <div className="p-3 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Language</p>
                      <p className="font-medium">{domainProfile.language}</p>
                    </div>
                  )}
                  {domainProfile.niche && (
                    <div className="p-3 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Niche</p>
                      <p className="font-medium">{domainProfile.niche}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Domain hasn't been crawled yet</p>
                  <Button onClick={handleCrawlDomain} disabled={crawling} className="gap-2 bg-violet-500 hover:bg-violet-600">
                    {crawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Start Domain Crawl
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-violet-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Rocket className="w-5 h-5 text-violet-400" />Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Button variant="outline" onClick={handleCrawlDomain} disabled={crawling} className="h-auto py-4 flex-col gap-2 border-violet-500/30 hover:bg-violet-500/10">
                  {crawling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 text-violet-400" />}
                  <span className="text-xs">Crawl Domain</span>
                </Button>
                <Button variant="outline" onClick={() => handleGenerateContent("blog")} disabled={generatingContent !== null} className="h-auto py-4 flex-col gap-2 border-violet-500/30 hover:bg-violet-500/10">
                  {generatingContent === "blog" ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 text-violet-400" />}
                  <span className="text-xs">Generate Article</span>
                </Button>
                <Button variant="outline" onClick={handleGenerateFaq} disabled={generatingFaq} className="h-auto py-4 flex-col gap-2 border-violet-500/30 hover:bg-violet-500/10">
                  {generatingFaq ? <Loader2 className="w-5 h-5 animate-spin" /> : <HelpCircle className="w-5 h-5 text-violet-400" />}
                  <span className="text-xs">Generate FAQs</span>
                </Button>
                <Button variant="outline" onClick={handleGenerateKnowledgeBase} disabled={generatingKb} className="h-auto py-4 flex-col gap-2 border-violet-500/30 hover:bg-violet-500/10">
                  {generatingKb ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5 text-violet-400" />}
                  <span className="text-xs">Knowledge Base</span>
                </Button>
                <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="h-auto py-4 flex-col gap-2 border-violet-500/30 hover:bg-violet-500/10">
                  <RefreshCw className={`w-5 h-5 text-violet-400 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="text-xs">Sync Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Generation Tab */}
        <TabsContent value="content" className="space-y-4">
          {/* Content Editor Modal */}
          {editingContentId && (
            <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5 text-violet-400" />
                    Edit Content
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCancelEditContent} disabled={savingContent}>
                      <X className="w-4 h-4 mr-1" />Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveContent} disabled={savingContent} className="bg-violet-500 hover:bg-violet-600">
                      {savingContent ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingContent ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                  </div>
                ) : editingContent ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          value={editingContent.title || ""}
                          onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Slug</label>
                        <Input
                          value={editingContent.slug || ""}
                          onChange={(e) => setEditingContent({ ...editingContent, slug: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Meta Title</label>
                        <Input
                          value={editingContent.meta_title || ""}
                          onChange={(e) => setEditingContent({ ...editingContent, meta_title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Meta Description</label>
                        <Input
                          value={editingContent.meta_description || ""}
                          onChange={(e) => setEditingContent({ ...editingContent, meta_description: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Content Body</label>
                      <Textarea
                        value={editingContent.body || ""}
                        onChange={(e) => setEditingContent({ ...editingContent, body: e.target.value })}
                        rows={12}
                        className="font-mono text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Content not found</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Content List */}
          {contentList.length > 0 && !editingContentId && (
            <Card className="border-violet-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-violet-400" />
                    Generated Content ({contentList.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {contentList.map((content, i) => (
                      <div key={content.id || content.content_id || i} className="p-4 rounded-xl bg-muted/50 border border-border flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{content.title || "Untitled"}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">{content.type || "article"}</Badge>
                            <Badge className={getStatusColor(content.status)}>{content.status || "draft"}</Badge>
                            {content.word_count && <span className="text-xs text-muted-foreground">{content.word_count} words</span>}
                            {content.created_at && <span className="text-xs text-muted-foreground">{new Date(content.created_at).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {content.published_url && (
                            <Button variant="ghost" size="icon" onClick={() => window.open(content.published_url, "_blank")}>
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleEditContent(content.id || content.content_id || "")}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => {
                            setPublishContentId(content.id || content.content_id || "");
                            setActiveTab("publish");
                          }}>
                            <Upload className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-500" onClick={() => handleDeleteContent(content.id || content.content_id || "")}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Content Generator */}
          <Card className="border-violet-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-violet-400" />AI Content Generation</CardTitle>
              <CardDescription>Select a content type to generate SEO-optimized articles for {domain}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Model Tier</label>
                  <Select value={selectedModelTier} onValueChange={setSelectedModelTier}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODEL_TIERS.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id}>
                          <div className="flex flex-col">
                            <span>{tier.name}</span>
                            <span className="text-xs text-muted-foreground">{tier.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Keyword (optional)</label>
                  <Input
                    placeholder="e.g. SEO optimization tips"
                    value={contentKeyword}
                    onChange={(e) => setContentKeyword(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {CONTENT_TYPES.map((type) => (
                  <Button
                    key={type.id}
                    variant="outline"
                    onClick={() => handleGenerateContent(type.id)}
                    disabled={generatingContent !== null}
                    className="h-auto py-6 flex-col gap-3 border-violet-500/30 hover:bg-violet-500/10 hover:border-violet-500/50"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center`}>
                      {generatingContent === type.id ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <type.icon className="w-6 h-6 text-white" />}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{type.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{type.desc}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-4">
          <Card className="border-violet-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><HelpCircle className="w-5 h-5 text-violet-400" />FAQ Generation</CardTitle>
                  <CardDescription>Generate and manage FAQs for {domain}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={faqCount} onValueChange={setFaqCount}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["3", "5", "10", "15", "20"].map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleGenerateFaq} disabled={generatingFaq} className="gap-2 bg-violet-500 hover:bg-violet-600">
                    {generatingFaq ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate FAQs
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {faqs.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {faqs.map((faq, i) => (
                      <div key={faq.id || i} className="p-4 rounded-xl bg-muted/50 border border-border">
                        {editingFaqId === faq.id ? (
                          // Inline editing mode
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">Question</label>
                              <Input
                                value={editingFaq?.question || ""}
                                onChange={(e) => setEditingFaq(prev => prev ? { ...prev, question: e.target.value } : prev)}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">Answer</label>
                              <Textarea
                                value={editingFaq?.answer || ""}
                                onChange={(e) => setEditingFaq(prev => prev ? { ...prev, answer: e.target.value } : prev)}
                                rows={4}
                              />
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <Button variant="ghost" size="sm" onClick={handleCancelEditFaq} disabled={savingFaq}>
                                <X className="w-4 h-4 mr-1" />Cancel
                              </Button>
                              <Button size="sm" onClick={handleSaveFaq} disabled={savingFaq} className="bg-violet-500 hover:bg-violet-600">
                                {savingFaq ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Display mode
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium flex items-start gap-2">
                                <HelpCircle className="w-4 h-4 text-violet-400 shrink-0 mt-1" />
                                {faq.question}
                              </p>
                              <p className="text-sm text-muted-foreground mt-2 pl-6">{faq.answer}</p>
                              {faq.created_at && <p className="text-xs text-muted-foreground mt-2 pl-6">{new Date(faq.created_at).toLocaleDateString()}</p>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(`Q: ${faq.question}\nA: ${faq.answer}`)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEditFaq(faq)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              {faq.id && (
                                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-500" onClick={() => handleDeleteFaq(faq.id!)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <HelpCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No FAQs generated yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Click "Generate FAQs" to create SEO-optimized FAQs for your domain</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Publish Tab */}
        <TabsContent value="publish" className="space-y-4">
          <Card className="border-violet-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-violet-400" />Content Publishing</CardTitle>
              <CardDescription>Publish generated content to your connected platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content ID</label>
                  <Input
                    placeholder="Enter content ID to publish"
                    value={publishContentId}
                    onChange={(e) => setPublishContentId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform</label>
                  <Select value={publishPlatform} onValueChange={setPublishPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wordpress">WordPress</SelectItem>
                      <SelectItem value="shopify">Shopify</SelectItem>
                      <SelectItem value="wix">Wix</SelectItem>
                      <SelectItem value="webflow">Webflow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handlePublishContent} disabled={publishing || !publishContentId.trim()} className="gap-2 bg-violet-500 hover:bg-violet-600">
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publish Content
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-violet-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-blue-400" />Crawl Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {crawlTasks.length > 0 ? (
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {crawlTasks.map((task, i) => (
                        <div key={task.task_id || task.id || i} className="p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{task.domain || "Unknown"}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getStatusColor(task.status)}>{task.status || "pending"}</Badge>
                              {task.progress !== undefined && <span className="text-xs text-muted-foreground">{task.progress}%</span>}
                            </div>
                          </div>
                          {task.status?.toLowerCase() === "processing" && (
                            <Button variant="ghost" size="icon" className="shrink-0 text-red-400 hover:text-red-500" onClick={() => handleTerminateTask(task.task_id || task.id || "")}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No crawl tasks</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-violet-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5 text-purple-400" />Categorization Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {categorizationTasks.length > 0 ? (
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {categorizationTasks.map((task, i) => (
                        <div key={task.task_id || task.id || i} className="p-3 rounded-lg bg-muted/50 border border-border">
                          <p className="text-sm font-medium">{task.domain || "Unknown"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(task.status)}>{task.status || "pending"}</Badge>
                            {task.message && <span className="text-xs text-muted-foreground truncate">{task.message}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No categorization tasks</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-violet-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Cpu className="w-5 h-5 text-blue-400" />Workers ({workers.length || health?.workers || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {workers.length > 0 ? (
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {workers.map((worker, i) => (
                        <div key={worker.id || i} className="p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
                          <span className="text-sm font-medium">{worker.name || `Worker ${i + 1}`}</span>
                          <Badge className={getStatusColor(worker.status)}>{worker.status || "running"}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">{health?.workers ? `${health.workers} workers active` : "No worker data"}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-violet-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Server className="w-5 h-5 text-amber-400" />Queues ({queues.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {queues.length > 0 ? (
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {queues.map((queue, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{queue.name || `Queue ${i + 1}`}</span>
                            <Badge className={getStatusColor(queue.status)}>{queue.status || "active"}</Badge>
                          </div>
                          <div className="flex gap-3 text-xs">
                            <span className="text-amber-400">{queue.size || 0} pending</span>
                            <span className="text-blue-400">{queue.processing || 0} processing</span>
                            <span className="text-emerald-400">{queue.completed || 0} done</span>
                            {(queue.failed || 0) > 0 && <span className="text-red-400">{queue.failed} failed</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No queue data</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-violet-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-400" />System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge className={getStatusColor(health?.status)}>{health?.status || "unknown"}</Badge>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Version</p>
                  <p className="font-medium">{health?.version || "—"}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                  <p className="font-medium">{health?.uptime || "—"}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Active Tasks</p>
                  <p className="font-medium">{health?.tasks || crawlTasks.length + categorizationTasks.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default CADELoginBox;
