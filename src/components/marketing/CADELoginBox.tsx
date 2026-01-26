import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key, LogIn, LogOut, Loader2, CheckCircle2, AlertTriangle,
  Eye, EyeOff, Shield, Sparkles, Database, Activity, Server,
  Cpu, BarChart3, Globe, RefreshCw, ChevronDown, ChevronRight,
  HelpCircle, Zap, Users, FileText, Play, Pause, Clock,
  Search, Link2, TrendingUp, Target, Layers, Bot, Newspaper,
  Wand2, Network, ListChecks, Settings2, ArrowRight, ExternalLink,
  CheckCircle, XCircle, Timer, Rocket, PenTool, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CADEMetricsBoxes } from "./CADEMetricsBoxes";

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

interface TaskItem {
  id?: string;
  type?: string;
  domain?: string;
  status?: string;
  created_at?: string;
  progress?: number;
}

interface QueueInfo {
  name?: string;
  size?: number;
  processing?: number;
  completed?: number;
  failed?: number;
  status?: string;
}

interface CADELoginBoxProps {
  domain?: string;
}

const CONTENT_TYPES = [
  { id: "blog", name: "Blog Article", icon: FileText, desc: "Long-form SEO-optimized content" },
  { id: "pillar", name: "Pillar Page", icon: Layers, desc: "Comprehensive topic hub pages" },
  { id: "comparison", name: "Comparison", icon: Target, desc: "Product/service comparisons" },
  { id: "listicle", name: "Listicle", icon: ListChecks, desc: "Numbered list articles" },
  { id: "how-to", name: "How-To Guide", icon: BookOpen, desc: "Step-by-step tutorials" },
  { id: "case-study", name: "Case Study", icon: TrendingUp, desc: "Success story narratives" },
  { id: "news", name: "News Article", icon: Newspaper, desc: "Timely industry updates" },
];

export const CADELoginBox = ({ domain }: CADELoginBoxProps) => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [hasAutoCrawled, setHasAutoCrawled] = useState(false);

  // Use ref to always have current API key value in callbacks
  const apiKeyRef = useRef(apiKey);
  useEffect(() => {
    apiKeyRef.current = apiKey;
  }, [apiKey]);

  // API Data States
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [domainProfile, setDomainProfile] = useState<DomainProfile | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [crawlTasks, setCrawlTasks] = useState<TaskItem[]>([]);
  const [categorizationTasks, setCategorizationTasks] = useState<TaskItem[]>([]);
  const [queues, setQueues] = useState<QueueInfo[]>([]);

  // UI States
  const [activeTab, setActiveTab] = useState("overview");
  const [generatingContent, setGeneratingContent] = useState<string | null>(null);
  const [crawling, setCrawling] = useState(false);
  const [generatingFaq, setGeneratingFaq] = useState(false);
  const [previousDomain, setPreviousDomain] = useState<string | undefined>(undefined);

  // Get current user and load API key from database
  useEffect(() => {
    const loadApiKey = async () => {
      setIsLoadingKey(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          
          // Try to load from database first
          const { data: keyData } = await supabase
            .from("user_api_keys")
            .select("api_key_encrypted")
            .eq("user_id", user.id)
            .eq("service_name", "cade")
            .maybeSingle();
          
          if (keyData?.api_key_encrypted) {
            setApiKey(keyData.api_key_encrypted);
            setIsConnected(true);
            // Also update localStorage for quick access
            localStorage.setItem("cade_api_key", keyData.api_key_encrypted);
          } else {
            // Fallback to localStorage for backwards compatibility
            const storedKey = localStorage.getItem("cade_api_key");
            if (storedKey) {
              setApiKey(storedKey);
              setIsConnected(true);
            }
          }
        } else {
          // Not logged in, use localStorage only
          const storedKey = localStorage.getItem("cade_api_key");
          if (storedKey) {
            setApiKey(storedKey);
            setIsConnected(true);
          }
        }
      } catch (err) {
        console.error("[CADE] Failed to load API key:", err);
        // Fallback to localStorage
        const storedKey = localStorage.getItem("cade_api_key");
        if (storedKey) {
          setApiKey(storedKey);
          setIsConnected(true);
        }
      } finally {
        setIsLoadingKey(false);
      }
    };
    
    loadApiKey();
  }, []);

  // Clear domain-specific data and refetch when domain changes
  useEffect(() => {
    if (domain !== previousDomain) {
      // Clear domain-specific data when domain changes
      setDomainProfile(null);
      setFaqs([]);
      setPreviousDomain(domain);
      
      // Notify user of domain change
      if (isConnected && previousDomain && domain) {
        toast.info(`Switched to domain: ${domain}`);
      }
    }
  }, [domain, previousDomain, isConnected]);

  // Helper function to call CADE API with current API key
  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>, currentDomain?: string) => {
    const key = apiKeyRef.current;
    const targetDomain = currentDomain || domain;
    
    console.log(`[CADE] Calling ${action} with key: ${key ? key.substring(0, 8) + '...' : 'none'}, domain: ${targetDomain}`);
    
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain: targetDomain, params, apiKey: key },
    });

    if (error) {
      console.error(`[CADE] ${action} error:`, error);
      throw new Error(error.message || `Failed to fetch ${action}`);
    }

    return data;
  }, [domain]);

  // Fetch all data from CADE API
  const fetchAllData = useCallback(async () => {
    if (!apiKeyRef.current) {
      console.log("[CADE] No API key available, skipping fetch");
      return;
    }
    
    setError(null);
    console.log("[CADE] Fetching all data...");

    try {
      // Fetch all system data in parallel
      const [healthRes, workersRes, queuesRes, subRes, subDetailRes] = await Promise.allSettled([
        callCadeApi("health"),
        callCadeApi("workers"),
        callCadeApi("queues"),
        callCadeApi("subscription"),
        callCadeApi("subscription-detail"),
      ]);

      // Process health data
      if (healthRes.status === "fulfilled") {
        const data = healthRes.value?.data || healthRes.value;
        console.log("[CADE] Health data:", data);
        setHealth(prev => ({ ...prev, ...data }));
      }

      // Process workers data
      if (workersRes.status === "fulfilled") {
        const data = workersRes.value?.data || workersRes.value;
        if (data?.workers !== undefined) {
          setHealth(prev => ({ ...prev, workers: data.workers }));
        }
      }

      // Process queue data
      if (queuesRes.status === "fulfilled") {
        const data = queuesRes.value?.data || queuesRes.value;
        if (Array.isArray(data)) {
          setQueues(data);
        } else if (data?.queues) {
          setQueues(data.queues);
        }
      }

      // Process subscription data
      if (subRes.status === "fulfilled") {
        const data = subRes.value?.data || subRes.value;
        setSubscription(prev => ({ ...prev, ...data }));
      }

      if (subDetailRes.status === "fulfilled") {
        const data = subDetailRes.value?.data || subDetailRes.value;
        setSubscription(prev => ({ ...prev, ...data }));
      }

      // Fetch task data
      const [crawlRes, catRes] = await Promise.allSettled([
        callCadeApi("crawl-tasks"),
        callCadeApi("categorization-tasks"),
      ]);

      if (crawlRes.status === "fulfilled") {
        const data = crawlRes.value?.data || crawlRes.value;
        setCrawlTasks(Array.isArray(data) ? data : data?.tasks || []);
      }

      if (catRes.status === "fulfilled") {
        const data = catRes.value?.data || catRes.value;
        setCategorizationTasks(Array.isArray(data) ? data : data?.tasks || []);
      }

      // Fetch domain-specific data
      if (domain) {
        const [profileRes, faqsRes] = await Promise.allSettled([
          callCadeApi("domain-profile"),
          callCadeApi("get-faqs"),
        ]);

        console.log("[CADE] Domain profile response:", profileRes);
        console.log("[CADE] FAQs response:", faqsRes);

        if (profileRes.status === "fulfilled" && !profileRes.value?.error) {
          const profile = profileRes.value?.data || profileRes.value;
          // Only set profile if it's a valid object (not HTML/error response)
          if (profile && typeof profile === "object" && !profile.raw) {
            setDomainProfile(profile);
            
            // Check if domain needs crawling - only if we got a valid profile response
            if (!profile?.last_crawl && !hasAutoCrawled) {
              console.log("[CADE] Domain not crawled yet, triggering auto-crawl");
              triggerAutoCrawl();
            }
          }
        }
        // Don't auto-crawl on errors - the API might not be set up yet
        
        if (faqsRes.status === "fulfilled" && !faqsRes.value?.error) {
          const faqData = faqsRes.value?.data || faqsRes.value;
          setFaqs(Array.isArray(faqData) ? faqData : faqData?.faqs || []);
        }
      }
    } catch (err) {
      console.error("[CADE] Fetch error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [domain, callCadeApi, hasAutoCrawled]);

  // Auto-crawl function - only runs once per domain
  const triggerAutoCrawl = useCallback(async () => {
    if (!domain || !apiKeyRef.current || hasAutoCrawled) return;
    
    // Set flag FIRST to prevent any re-triggers
    setHasAutoCrawled(true);
    setCrawling(true);
    toast.info(`Starting automatic crawl for ${domain}...`);
    
    try {
      const crawlRes = await callCadeApi("crawl-domain", { force: true });
      console.log("[CADE] Auto-crawl response:", crawlRes);
      
      if (crawlRes && !crawlRes.error) {
        toast.success(`Domain crawl initiated for ${domain}`);
        // Do NOT auto-refresh - user can manually refresh when ready
      } else if (crawlRes?.error) {
        console.log("[CADE] Crawl error:", crawlRes.error);
        // Don't show error toast for expected API issues during setup
      }
    } catch (crawlErr) {
      console.error("[CADE] Auto-crawl error:", crawlErr);
      // Silent fail - API may not be configured yet
    } finally {
      setCrawling(false);
    }
  }, [domain, callCadeApi, hasAutoCrawled]);

  // Fetch data when connected or domain changes
  useEffect(() => {
    if (isConnected && apiKey) {
      fetchAllData();
    }
  }, [isConnected, apiKey, domain, fetchAllData]);

  // Reset auto-crawl flag when domain changes
  useEffect(() => {
    if (domain !== previousDomain) {
      setHasAutoCrawled(false);
      setDomainProfile(null);
      setFaqs([]);
      setPreviousDomain(domain);
      
      if (isConnected && previousDomain && domain) {
        toast.info(`Switched to domain: ${domain}`);
      }
    }
  }, [domain, previousDomain, isConnected]);

  const handleLogin = async () => {
    if (!apiKey.trim()) {
      setError("Please enter your CADE API key");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const healthRes = await callCadeApi("health");

      if (healthRes?.success || healthRes?.data?.status === "healthy" || healthRes?.status === "healthy" || healthRes?.status === "ok") {
        // Save to localStorage for quick access
        localStorage.setItem("cade_api_key", apiKey);
        
        // Save to database for long-term storage if user is logged in
        if (userId) {
          const { error: upsertError } = await supabase
            .from("user_api_keys")
            .upsert({
              user_id: userId,
              service_name: "cade",
              api_key_encrypted: apiKey,
              updated_at: new Date().toISOString()
            }, {
              onConflict: "user_id,service_name"
            });
          
          if (upsertError) {
            console.error("[CADE] Failed to save API key to database:", upsertError);
          } else {
            console.log("[CADE] API key saved to database successfully");
          }
        }
        
        setIsConnected(true);
        setHealth(healthRes.data || healthRes);
        toast.success("Successfully connected to CADE API!");
        
        // Auto-initiate domain crawl after successful login
        if (domain) {
          setTimeout(async () => {
            toast.info(`Starting automatic crawl for ${domain}...`);
            setCrawling(true);
            try {
              const crawlRes = await callCadeApi("crawl-domain", { force: true });
              console.log("[CADE] Auto-crawl response:", crawlRes);
              // Accept any non-error response as success
              if (crawlRes && !crawlRes.error) {
                toast.success(`Domain crawl initiated for ${domain}`);
              } else if (crawlRes?.error) {
                console.log("[CADE] Crawl response error:", crawlRes.error);
              }
            } catch (crawlErr) {
              console.log("[CADE] Auto-crawl error:", crawlErr);
            } finally {
              setCrawling(false);
              // Refetch data after crawl starts
              fetchAllData();
            }
          }, 1000);
        }
      } else {
        setError("Unable to verify API connection. Please check your API key.");
      }
    } catch (err) {
      console.error("[CADE Login] Error:", err);
      setError("Failed to connect. Please verify your API key is correct.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    // Remove from localStorage
    localStorage.removeItem("cade_api_key");
    
    // Remove from database if user is logged in
    if (userId) {
      await supabase
        .from("user_api_keys")
        .delete()
        .eq("user_id", userId)
        .eq("service_name", "cade");
    }
    
    setIsConnected(false);
    setApiKey("");
    setHealth(null);
    setSubscription(null);
    setDomainProfile(null);
    setFaqs([]);
    setCrawlTasks([]);
    setCategorizationTasks([]);
    setQueues([]);
    toast.success("Disconnected from CADE API");
  };

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
      console.log("[CADE] Crawl response:", res);
      
      // Accept any non-error response as success (the API returns 200 for successful crawl starts)
      if (res && !res.error) {
        toast.success(`Crawl started for ${domain}`);
        // Wait a bit then refetch data
        setTimeout(() => fetchAllData(), 2000);
      } else {
        toast.error(res?.error?.message || res?.error || "Failed to start crawl");
      }
    } catch (err) {
      console.error("[CADE] Crawl error:", err);
      toast.error("Failed to start domain crawl");
    } finally {
      setCrawling(false);
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

  const handleGenerateFaq = async () => {
    if (!domain) {
      toast.error("Please select a domain first");
      return;
    }

    setGeneratingFaq(true);
    try {
      const res = await callCadeApi("generate-faq", { count: 5 });
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

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-muted text-muted-foreground";
    const s = status.toLowerCase();
    if (s === "healthy" || s === "active" || s === "running" || s === "ok" || s === "completed") {
      return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
    }
    if (s === "warning" || s === "busy" || s === "pending" || s === "processing") {
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
    if (s === "healthy" || s === "active" || s === "completed") return <CheckCircle className="w-3.5 h-3.5" />;
    if (s === "pending" || s === "processing") return <Timer className="w-3.5 h-3.5" />;
    if (s === "error" || s === "failed") return <XCircle className="w-3.5 h-3.5" />;
    return <Activity className="w-3.5 h-3.5" />;
  };

  // Loading state while checking for saved API key
  if (isLoadingKey) {
    return (
      <div className="flex items-center justify-center p-12 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 border border-violet-500/30">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          <span className="text-muted-foreground">Loading CADE connection...</span>
        </div>
      </div>
    );
  }

  // Login Form View
  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="relative p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 border border-violet-500/30 overflow-hidden">
          {/* Background effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/15 to-transparent rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-violet-500/5 via-purple-500/10 to-fuchsia-500/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center gap-5 mb-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  CADE Platform
                  <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/30">
                    AI Content Engine
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect to unlock automated content generation & SEO optimization
                </p>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
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

            {/* Login Form */}
            <div className="space-y-4">
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="Enter your CADE API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="pl-12 pr-12 h-14 text-base bg-background/50 border-violet-500/30 focus:border-violet-500 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-xl"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={handleLogin}
                disabled={isLoading || !apiKey.trim()}
                className="w-full h-14 text-base bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-xl shadow-violet-500/30 gap-3 rounded-xl"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    Connect to CADE
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                <Shield className="w-4 h-4 text-violet-400" />
                <span>Your API key is stored locally and securely encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Connected Dashboard View
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Active Domain Banner */}
      {domain ? (
        <motion.div
          key={domain}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-green-500/10 to-teal-500/15 border border-emerald-500/30 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.1),transparent_70%)]" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Active Domain</p>
                <p className="text-lg font-bold text-foreground">{domain}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {domainProfile?.last_crawl && (
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground">Last Crawl</p>
                  <p className="text-sm font-medium">{new Date(domainProfile.last_crawl).toLocaleDateString()}</p>
                </div>
              )}
              {domainProfile?.crawled_pages !== undefined && (
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground">Pages Crawled</p>
                  <p className="text-sm font-medium">{domainProfile.crawled_pages.toLocaleString()}</p>
                </div>
              )}
              <Button
                size="sm"
                onClick={handleCrawlDomain}
                disabled={crawling}
                className="gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
              >
                {crawling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {crawling ? "Crawling..." : "Crawl Now"}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <p className="font-medium text-amber-400">No Domain Selected</p>
              <p className="text-sm text-muted-foreground">Use the domain selector above to choose a domain to manage with CADE</p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 border border-violet-500/30 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                {isConnected ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                    <CheckCircle className="w-3 h-3 mr-1.5" />
                    Connected
                  </Badge>
                ) : (
                  <Badge className={getStatusColor(health?.status)}>
                    {getStatusIcon(health?.status)}
                    <span className="ml-1.5 capitalize">{health?.status || "Connecting..."}</span>
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                AI-Powered Content Automation Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 border-violet-500/30 hover:bg-violet-500/10"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </Button>
          </div>
        </div>
      </div>

      {/* CADE Metrics Dashboard */}
      <CADEMetricsBoxes
        metrics={{
          status: health?.status,
          version: health?.version,
          workers: health?.workers,
          uptime: health?.uptime,
          plan: subscription?.plan,
          planStatus: subscription?.status,
          articlesGenerated: subscription?.articles_generated,
          faqsGenerated: subscription?.faqs_generated ?? faqs.length,
          quotaUsed: subscription?.quota_used,
          quotaLimit: subscription?.quota_limit,
          domainsUsed: subscription?.domains_used,
          domainsLimit: subscription?.domains_limit,
          creditsRemaining: subscription?.credits_remaining,
          crawledPages: domainProfile?.crawled_pages,
          contentCount: domainProfile?.content_count,
          keywordsTracked: domainProfile?.keywords_tracked,
          cssAnalyzed: domainProfile?.css_analyzed,
          lastCrawl: domainProfile?.last_crawl,
          category: domainProfile?.category,
          language: domainProfile?.language,
        }}
        domain={domain}
        isConnected={isConnected}
      />

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="gap-2 rounded-lg">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2 rounded-lg">
            <PenTool className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="faqs" className="gap-2 rounded-lg">
            <HelpCircle className="w-4 h-4" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2 rounded-lg">
            <ListChecks className="w-4 h-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2 rounded-lg">
            <Server className="w-4 h-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Domain Profile */}
          {domain && (
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
                  <Badge className={getStatusColor(domainProfile?.status)}>
                    {domainProfile?.status || "Not crawled"}
                  </Badge>
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
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Globe className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">Domain hasn't been crawled yet</p>
                    <Button
                      onClick={handleCrawlDomain}
                      disabled={crawling}
                      className="gap-2 bg-violet-500 hover:bg-violet-600"
                    >
                      {crawling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      Start Domain Crawl
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="border-violet-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-violet-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  onClick={handleCrawlDomain}
                  disabled={crawling || !domain}
                  className="h-auto py-4 flex-col gap-2 border-violet-500/30 hover:bg-violet-500/10"
                >
                  {crawling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 text-violet-400" />}
                  <span className="text-xs">Crawl Domain</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleGenerateContent("blog")}
                  disabled={generatingContent !== null || !domain}
                  className="h-auto py-4 flex-col gap-2 border-violet-500/30 hover:bg-violet-500/10"
                >
                  {generatingContent === "blog" ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 text-violet-400" />}
                  <span className="text-xs">Generate Article</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGenerateFaq}
                  disabled={generatingFaq || !domain}
                  className="h-auto py-4 flex-col gap-2 border-violet-500/30 hover:bg-violet-500/10"
                >
                  {generatingFaq ? <Loader2 className="w-5 h-5 animate-spin" /> : <HelpCircle className="w-5 h-5 text-violet-400" />}
                  <span className="text-xs">Generate FAQs</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-auto py-4 flex-col gap-2 border-violet-500/30 hover:bg-violet-500/10"
                >
                  <RefreshCw className={`w-5 h-5 text-violet-400 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="text-xs">Sync Data</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Generation Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card className="border-violet-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-violet-400" />
                AI Content Generation
              </CardTitle>
              <CardDescription>
                Select a content type to generate SEO-optimized articles for {domain || "your domain"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {CONTENT_TYPES.map((type) => (
                  <motion.div
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateContent(type.id)}
                      disabled={generatingContent !== null || !domain}
                      className="w-full h-auto p-4 flex flex-col items-start gap-3 border-violet-500/20 hover:border-violet-500/50 hover:bg-violet-500/5"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                          {generatingContent === type.id ? (
                            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                          ) : (
                            <type.icon className="w-5 h-5 text-violet-400" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-sm">{type.name}</p>
                          <p className="text-xs text-muted-foreground">{type.desc}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Button>
                  </motion.div>
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
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-violet-400" />
                    Generated FAQs
                  </CardTitle>
                  <CardDescription>
                    {faqs.length} FAQs generated for {domain || "your domain"}
                  </CardDescription>
                </div>
                <Button
                  onClick={handleGenerateFaq}
                  disabled={generatingFaq || !domain}
                  className="gap-2 bg-violet-500 hover:bg-violet-600"
                >
                  {generatingFaq ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generate More
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {faqs.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {faqs.map((faq, i) => (
                      <motion.div
                        key={faq.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-violet-500/5 to-purple-500/10 border border-violet-500/20"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <HelpCircle className="w-4 h-4 text-violet-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-2">{faq.question}</p>
                            <p className="text-sm text-muted-foreground">{faq.answer}</p>
                            {faq.created_at && (
                              <p className="text-xs text-muted-foreground/60 mt-2">
                                Created: {new Date(faq.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <HelpCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No FAQs generated yet</p>
                  <Button
                    onClick={handleGenerateFaq}
                    disabled={generatingFaq || !domain}
                    className="gap-2 bg-violet-500 hover:bg-violet-600"
                  >
                    {generatingFaq ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Generate FAQs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Crawl Tasks */}
            <Card className="border-violet-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="w-4 h-4 text-violet-400" />
                  Crawl Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {crawlTasks.length > 0 ? (
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                      {crawlTasks.map((task, i) => (
                        <div key={task.id || i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              task.status === "completed" ? "bg-emerald-500" :
                              task.status === "processing" ? "bg-amber-500 animate-pulse" :
                              "bg-muted-foreground"
                            }`} />
                            <div>
                              <p className="text-sm font-medium">{task.domain || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{task.type || "Crawl"}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status || "Pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No crawl tasks
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categorization Tasks */}
            <Card className="border-violet-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="w-4 h-4 text-violet-400" />
                  Categorization Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categorizationTasks.length > 0 ? (
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                      {categorizationTasks.map((task, i) => (
                        <div key={task.id || i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              task.status === "completed" ? "bg-emerald-500" :
                              task.status === "processing" ? "bg-amber-500 animate-pulse" :
                              "bg-muted-foreground"
                            }`} />
                            <div>
                              <p className="text-sm font-medium">{task.domain || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{task.type || "Categorization"}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status || "Pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No categorization tasks
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* System Health */}
            <Card className="border-violet-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-violet-400" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Overall Status</span>
                    <Badge className={getStatusColor(health?.status)}>
                      {getStatusIcon(health?.status)}
                      <span className="ml-1.5 capitalize">{health?.status || "Unknown"}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Active Workers</span>
                    <span className="font-medium">{health?.workers ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Pending Tasks</span>
                    <span className="font-medium">{health?.tasks ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">API Version</span>
                    <span className="font-medium">{health?.version || "v1.0"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Queue Status */}
            <Card className="border-violet-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-violet-400" />
                  Queue Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {queues.length > 0 ? (
                  <div className="space-y-3">
                    {queues.map((queue, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{queue.name || `Queue ${i + 1}`}</span>
                          <Badge className={getStatusColor(queue.status)}>
                            {queue.status || "Active"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Size:</span>
                            <span className="ml-1 font-medium">{queue.size ?? 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Processing:</span>
                            <span className="ml-1 font-medium">{queue.processing ?? 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Done:</span>
                            <span className="ml-1 font-medium">{queue.completed ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No queue data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default CADELoginBox;
