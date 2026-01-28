import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, FileText,
  Globe, HelpCircle, Loader2, RefreshCw, Server, Sparkles,
  Target, TrendingUp, Users, Zap, ChevronDown, ChevronRight,
  Database, Cpu, BarChart3, Rocket, Bot, Brain, Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useBronApi, BronSubscription } from "@/hooks/use-bron-api";
import { toast } from "sonner";

// Use BRON subscription cache (authoritative source, shared across components)
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
    console.log(`[CADE] Using cached BRON subscription for ${targetDomain}`);
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

interface SystemHealth {
  status?: string;
  version?: string;
  uptime?: number;
  timestamp?: string;
}

interface WorkerData {
  name?: string;
  status?: string;
  tasks_completed?: number;
  current_task?: string;
}

interface QueueData {
  name?: string;
  pending?: number;
  processing?: number;
  completed?: number;
  failed?: number;
}

interface DomainProfile {
  domain?: string;
  category?: string;
  status?: string;
  crawled_pages?: number;
  last_crawl?: string;
  css_analyzed?: boolean;
  content_count?: number;
}

interface SubscriptionInfo {
  plan?: string;
  status?: string;
  quota_used?: number;
  quota_limit?: number;
  renewal_date?: string;
}

interface FAQItem {
  id?: string;
  question?: string;
  answer?: string;
  created_at?: string;
}

interface CADEApiDashboardProps {
  domain?: string;
}

export const CADEApiDashboard = ({ domain }: CADEApiDashboardProps) => {
  const { fetchSubscription } = useBronApi();
  
  // Check cache synchronously for instant loading
  const [cachedSub] = useState(() => domain ? getCachedSubscription(domain) : null);
  const hasCachedSubscription = cachedSub?.has_cade === true;
  
  // If cache shows subscription, skip loading screen entirely
  const [isLoading, setIsLoading] = useState(!hasCachedSubscription);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(!hasCachedSubscription);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Subscription state - primary gate (pre-populated from cache if available)
  const [hasCadeSubscription, setHasCadeSubscription] = useState(hasCachedSubscription);
  const [bronSubscription, setBronSubscription] = useState<BronSubscription | null>(cachedSub);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    hasCachedSubscription ? {
      plan: cachedSub?.plan || cachedSub?.servicetype || "CADE",
      status: cachedSub?.status || "active",
      quota_used: undefined,
      quota_limit: undefined,
    } : null
  );
  
  // Background sync indicator
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(hasCachedSubscription);
  
  // API Data States
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [queues, setQueues] = useState<QueueData[]>([]);
  const [domainProfile, setDomainProfile] = useState<DomainProfile | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  
  // Collapsible states
  const [systemOpen, setSystemOpen] = useState(true);
  const [domainOpen, setDomainOpen] = useState(true);
  const [faqsOpen, setFaqsOpen] = useState(false);

  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>, retries = 2) => {
    const cacheKey = `cade_${action}_${domain || "global"}`;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke("cade-api", {
          body: { action, domain, params },
        });
        
        if (error) {
          if (attempt < retries && (error.message?.includes("timeout") || error.message?.includes("504"))) {
            console.warn(`[CADE] ${action} attempt ${attempt + 1} failed, retrying...`);
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          throw new Error(error.message || `Failed to fetch ${action}`);
        }
        
        if (data && !data.error) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
          } catch { /* ignore storage errors */ }
        }
        
        return data;
      } catch (err) {
        if (attempt < retries) {
          console.warn(`[CADE] ${action} attempt ${attempt + 1} failed, retrying...`);
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        
        // On final failure, try to return cached data if recent (< 5 min)
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { data: cachedData, ts } = JSON.parse(cached);
            if (Date.now() - ts < 5 * 60 * 1000) {
              console.log(`[CADE] Using cached ${action} data`);
              return cachedData;
            }
          }
        } catch { /* ignore */ }
        
        throw err;
      }
    }
  }, [domain]);

  // Check subscription via BRON API - optimized with cache-first
  const checkSubscription = useCallback(async (isBackground = false): Promise<boolean> => {
    if (!domain) {
      setIsCheckingSubscription(false);
      setIsLoading(false);
      return false;
    }
    
    if (!isBackground) {
      setIsCheckingSubscription(true);
    }
    
    try {
      console.log("[CADE] Checking subscription for domain:", domain, isBackground ? "(background)" : "");
      const subData = await fetchSubscription(domain);
      console.log("[CADE] Subscription response:", subData);
      
      const hasValidSubscription = subData && 
        subData.has_cade === true && 
        (subData.status === 'active' || !subData.status);
      
      if (hasValidSubscription) {
        console.log("[CADE] Valid subscription detected, caching");
        setCachedSubscription(domain, subData);
        setHasCadeSubscription(true);
        setBronSubscription(subData);
        setSubscription({
          plan: subData.plan || subData.servicetype || "CADE",
          status: subData.status || "active",
          quota_used: undefined,
          quota_limit: undefined,
        });
        return true;
      } else {
        console.log("[CADE] No valid subscription found");
        clearCachedSubscription(domain);
        setHasCadeSubscription(false);
        setBronSubscription(subData);
        setSubscription(null);
        return false;
      }
    } catch (err) {
      console.error("[CADE] Subscription check error:", err);
      // If we have cached subscription, keep showing the dashboard
      if (!hasCachedSubscription) {
        setHasCadeSubscription(false);
        setBronSubscription(null);
      }
      return hasCachedSubscription;
    } finally {
      setIsCheckingSubscription(false);
      setIsBackgroundSyncing(false);
    }
  }, [domain, fetchSubscription, hasCachedSubscription]);

  // Fetch CADE system data - deferred and non-blocking
  const fetchAllData = useCallback(async () => {
    if (!hasCadeSubscription) {
      setIsLoading(false);
      return;
    }
    
    setError(null);
    
    try {
      const healthRes = await Promise.race([
        callCadeApi("health", {}, 1),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))
      ]);

      if (healthRes && !healthRes.error) {
        const healthData = healthRes?.data || healthRes;
        setHealth(healthData);
        if (healthData?.workers !== undefined) {
          setWorkers(Array(healthData.workers || 0).fill({ name: "Worker", status: "running" }));
        }
        if (healthData?.queues) {
          const qData = healthData.queues;
          setQueues(Array.isArray(qData) ? qData : []);
        }
      }

      // Fetch domain-specific data in background
      if (domain) {
        Promise.allSettled([
          callCadeApi("domain-profile", {}, 1),
          callCadeApi("get-faqs", {}, 1),
        ]).then(([profileRes, faqsRes]) => {
          if (profileRes.status === "fulfilled" && !profileRes.value?.error) {
            setDomainProfile(profileRes.value?.data || profileRes.value);
          }
          if (faqsRes.status === "fulfilled" && !faqsRes.value?.error) {
            const faqData = faqsRes.value?.data || faqsRes.value;
            setFaqs(Array.isArray(faqData) ? faqData : faqData?.faqs || []);
          }
        }).catch(err => {
          console.warn("[CADE] Background data fetch failed:", err);
        });
      }
    } catch (err) {
      console.warn("[CADE] Fetch error (non-blocking):", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [callCadeApi, domain, hasCadeSubscription]);

  // Check subscription on mount - cache-first approach
  useEffect(() => {
    let cancelled = false;
    
    const initDashboard = async () => {
      // If we have cached subscription, render immediately and check in background
      if (hasCachedSubscription) {
        console.log("[CADE] Using cached subscription, starting data fetch");
        fetchAllData();
        
        // Background refresh subscription
        setIsBackgroundSyncing(true);
        checkSubscription(true);
      } else {
        // No cache, do full subscription check first
        const hasSubscription = await checkSubscription(false);
        
        if (cancelled) return;
        
        if (hasSubscription) {
          fetchAllData();
        } else {
          setIsLoading(false);
        }
      }
    };
    
    initDashboard();
    
    return () => {
      cancelled = true;
    };
  }, [domain]); // Only re-run when domain changes

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const hasSubscription = await checkSubscription();
    if (hasSubscription) {
      await fetchAllData();
    }
    setIsRefreshing(false);
    toast.success("CADE data refreshed");
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-muted text-muted-foreground";
    const s = status.toLowerCase();
    if (s === "healthy" || s === "active" || s === "running" || s === "ok") {
      return "bg-green-500/15 text-green-600 border-green-500/30";
    }
    if (s === "warning" || s === "busy" || s === "pending") {
      return "bg-amber-500/15 text-amber-600 border-amber-500/30";
    }
    if (s === "error" || s === "failed" || s === "offline") {
      return "bg-red-500/15 text-red-600 border-red-500/30";
    }
    return "bg-violet-500/15 text-violet-600 border-violet-500/30";
  };

  // Futuristic AI-agentic loading animation - only show when NO cache available
  // If we have cached subscription, render the dashboard immediately with background sync
  if (isCheckingSubscription && !hasCachedSubscription) {
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
              Initializing AI Agent
            </motion.p>
            <p className="text-xs text-muted-foreground mt-1">CADE Content Automation Engine</p>
          </div>
          
          {/* Progress steps */}
          <div className="flex items-center gap-2 text-xs">
            <motion.span 
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.span 
                className="w-1.5 h-1.5 rounded-full bg-green-500"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              Connecting
            </motion.span>
            <motion.span 
              className="text-muted-foreground/40"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              →
            </motion.span>
            <motion.span 
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/30 text-muted-foreground/50"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 0.5, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              Ready
            </motion.span>
          </div>
        </div>
      </motion.div>
    );
  }

  // No CADE subscription - show sales pitch
  if (!hasCadeSubscription) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
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
                    Unlock CADE Content Automation
                    <Badge className="bg-violet-500/20 text-violet-500 border-violet-500/30">
                      AI-Powered
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                    CADE automates your entire content workflow—from keyword research to publishing. 
                    Generate SEO-optimized articles, FAQs, and social posts automatically.
                  </p>
                </div>
              </div>
              
              <Button 
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg"
                onClick={() => window.open('https://seosara.ai/pricing', '_blank')}
              >
                <Rocket className="w-4 h-4 mr-2" />
                Subscribe to CADE
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 space-y-6">
            {/* 5-Step Workflow */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { step: "1", title: "Analyze", desc: "AI scans top competitors", icon: Target },
                { step: "2", title: "Generate", desc: "Create superior content", icon: FileText },
                { step: "3", title: "Match CSS", desc: "Native site styling", icon: Zap },
                { step: "4", title: "Inner Links", desc: "Automatic linking", icon: Globe },
                { step: "5", title: "Publish", desc: "One-click deploy", icon: Rocket },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative p-4 rounded-xl bg-background/50 border border-violet-500/20 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-sm text-violet-500">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </motion.div>
              ))}
            </div>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: "7", label: "Content Types", desc: "Articles, FAQs, Guides..." },
                { value: "30+", label: "Articles/Month", desc: "Automated publishing" },
                { value: "120+", label: "Hours Saved", desc: "Per month" },
                { value: "$8.5K", label: "Cost Savings", desc: "vs. agency rates" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 text-center"
                >
                  <p className="text-2xl font-bold text-violet-500">{stat.value}</p>
                  <p className="text-xs font-medium">{stat.label}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.desc}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (error && !health && !subscription) {
    const isTimeoutError = error.includes("timeout") || error.includes("504") || error.includes("slow");
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-red-500/10 border border-red-500/30"
      >
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-600">Connection Error</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {isTimeoutError 
                ? "The CADE API is responding slowly. This can happen during high-traffic periods. Please try again."
                : `Failed to connect to CADE API`}
            </p>
            {!isTimeoutError && error && (
              <p className="text-xs text-muted-foreground/70 mt-1 font-mono">{error}</p>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 gap-2"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Retry Connection
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Background sync indicator - subtle, non-blocking */}
      {isBackgroundSyncing && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 backdrop-blur-sm">
          <RefreshCw className="w-3 h-3 text-violet-400 animate-spin" />
          <span className="text-xs text-violet-400">Syncing...</span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              CADE API Status
              {health?.status && (
                <Badge className={getStatusColor(health.status)}>
                  {health.status}
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time content automation system data
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Subscription & System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Subscription Card */}
        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-medium text-muted-foreground">Plan</span>
            </div>
            <p className="text-lg font-bold">{subscription?.plan || "N/A"}</p>
            {subscription?.status && (
              <Badge className={`mt-1 ${getStatusColor(subscription.status)}`}>
                {subscription.status}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Quota Card */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">Quota Used</span>
            </div>
            <p className="text-lg font-bold">
              {subscription?.quota_used ?? "—"} / {subscription?.quota_limit ?? "—"}
            </p>
            {subscription?.quota_limit && subscription?.quota_used !== undefined && (
              <div className="mt-2 h-2 bg-blue-500/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (subscription.quota_used / subscription.quota_limit) * 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workers Card */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground">Workers</span>
            </div>
            <p className="text-lg font-bold">{workers.length || "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {workers.filter(w => w.status?.toLowerCase() === "running").length} active
            </p>
          </CardContent>
        </Card>

        {/* Queues Card */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground">Queues</span>
            </div>
            <p className="text-lg font-bold">{queues.length || "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {queues.reduce((acc, q) => acc + (q.pending || 0), 0)} pending tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Details Collapsible */}
      <Collapsible open={systemOpen} onOpenChange={setSystemOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-muted/30 hover:bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-violet-500" />
              <span className="font-semibold">System Status</span>
            </div>
            {systemOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Workers List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Workers ({workers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  {workers.length > 0 ? (
                    <div className="space-y-2">
                      {workers.map((worker, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <span className="text-sm font-medium">{worker.name || `Worker ${i + 1}`}</span>
                          <Badge className={getStatusColor(worker.status)}>
                            {worker.status || "unknown"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No worker data</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Queues List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Queues ({queues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  {queues.length > 0 ? (
                    <div className="space-y-2">
                      {queues.map((queue, i) => (
                        <div key={i} className="p-2 rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{queue.name || `Queue ${i + 1}`}</span>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <span className="text-amber-500">{queue.pending || 0} pending</span>
                            <span className="text-blue-500">{queue.processing || 0} processing</span>
                            <span className="text-green-500">{queue.completed || 0} done</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No queue data</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Domain Profile */}
      {domain && (
        <Collapsible open={domainOpen} onOpenChange={setDomainOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-muted/30 hover:bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-violet-500" />
                <span className="font-semibold">Domain: {domain}</span>
                {domainProfile?.status && (
                  <Badge className={getStatusColor(domainProfile.status)}>
                    {domainProfile.status}
                  </Badge>
                )}
              </div>
              {domainOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 p-4 rounded-xl bg-muted/20 border border-border">
              {domainProfile ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="font-medium">{domainProfile.category || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Crawled Pages</p>
                    <p className="font-medium">{domainProfile.crawled_pages ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Content Count</p>
                    <p className="font-medium">{domainProfile.content_count ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CSS Analyzed</p>
                    <p className="font-medium">{domainProfile.css_analyzed ? "Yes" : "No"}</p>
                  </div>
                  {domainProfile.last_crawl && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Last Crawl</p>
                      <p className="font-medium">{new Date(domainProfile.last_crawl).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No profile data for this domain. The domain may need to be crawled first.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Target className="w-4 h-4 mr-2" />
                    Initiate Crawl
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* FAQs Section */}
      {domain && faqs.length > 0 && (
        <Collapsible open={faqsOpen} onOpenChange={setFaqsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-muted/30 hover:bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-violet-500" />
                <span className="font-semibold">Generated FAQs ({faqs.length})</span>
              </div>
              {faqsOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="mt-3 h-64">
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <motion.div
                    key={faq.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-violet-500/5 to-purple-500/10 border border-violet-500/20"
                  >
                    <p className="font-medium text-sm mb-2 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                      {faq.question}
                    </p>
                    <p className="text-sm text-muted-foreground pl-6">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      )}
    </motion.div>
  );
};

export default CADEApiDashboard;
