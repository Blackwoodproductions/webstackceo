import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key, LogIn, LogOut, Loader2, CheckCircle2, AlertTriangle,
  Eye, EyeOff, Shield, Sparkles, Database, Activity, Server,
  Cpu, BarChart3, Globe, RefreshCw, ChevronDown, ChevronRight,
  HelpCircle, Zap, FileText, Play, Clock,
  Search, Link2, TrendingUp, Target, Layers, Bot, Newspaper,
  Wand2, ListChecks, ArrowRight, ExternalLink,
  CheckCircle, XCircle, Timer, Rocket, PenTool, BookOpen,
  Upload, Trash2, Settings, Copy, Download, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

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

export const CADELoginBox = ({ domain }: CADELoginBoxProps) => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);

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
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);

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

  // Load API key
  useEffect(() => {
    const loadApiKey = async () => {
      setIsLoadingKey(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data: keyData } = await supabase
            .from("user_api_keys")
            .select("api_key_encrypted")
            .eq("user_id", user.id)
            .eq("service_name", "cade")
            .maybeSingle();
          
          if (keyData?.api_key_encrypted) {
            setApiKey(keyData.api_key_encrypted);
            setIsConnected(true);
            localStorage.setItem("cade_api_key", keyData.api_key_encrypted);
          } else {
            const storedKey = localStorage.getItem("cade_api_key");
            if (storedKey) {
              setApiKey(storedKey);
              setIsConnected(true);
            }
          }
        } else {
          const storedKey = localStorage.getItem("cade_api_key");
          if (storedKey) {
            setApiKey(storedKey);
            setIsConnected(true);
          }
        }
      } catch (err) {
        console.error("[CADE] Failed to load API key:", err);
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

  // API call helper
  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>, currentDomain?: string) => {
    const key = apiKeyRef.current;
    const targetDomain = currentDomain || domain;
    
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain: targetDomain, params, apiKey: key },
    });

    if (error) {
      console.error(`[CADE] ${action} error:`, error);
      throw new Error(error.message || `Failed to fetch ${action}`);
    }

    return data;
  }, [domain]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    if (!apiKeyRef.current) return;
    
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
        ]);

        if (domainResults[0].status === "fulfilled" && !domainResults[0].value?.error) {
          setDomainProfile(domainResults[0].value?.data || domainResults[0].value);
        }
        if (domainResults[1].status === "fulfilled" && !domainResults[1].value?.error) {
          const faqData = domainResults[1].value?.data || domainResults[1].value;
          setFaqs(Array.isArray(faqData) ? faqData : faqData?.faqs || []);
        }
      }
    } catch (err) {
      console.error("[CADE] Fetch error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [domain, callCadeApi]);

  useEffect(() => {
    if (isConnected && apiKey) {
      fetchAllData();
    }
  }, [isConnected, apiKey, domain, fetchAllData]);

  // === ACTION HANDLERS ===
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
        localStorage.setItem("cade_api_key", apiKey);
        
        if (userId) {
          await supabase.from("user_api_keys").upsert({
            user_id: userId,
            service_name: "cade",
            api_key_encrypted: apiKey,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id,service_name" });
        }
        
        setIsConnected(true);
        setHealth(healthRes.data || healthRes);
        toast.success("Successfully connected to CADE API!");
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
    localStorage.removeItem("cade_api_key");
    if (userId) {
      await supabase.from("user_api_keys").delete().eq("user_id", userId).eq("service_name", "cade");
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
    setWorkers([]);
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

  // Loading state
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

  // Login Form
  if (!isConnected) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
        <div className="relative p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 border border-violet-500/30 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-full blur-3xl" />
          
          <div className="relative z-10">
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
                  <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/30">AI Content Engine</Badge>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Connect to unlock automated content generation & SEO optimization</p>
              </div>
            </div>

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
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Rocket className="w-5 h-5" />Connect to CADE</>}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                <Shield className="w-4 h-4 text-violet-400" />
                <span>Your API key is stored securely</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Connected Dashboard
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Active Domain Banner */}
      {domain ? (
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
      ) : (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <p className="font-medium text-amber-400">No Domain Selected</p>
              <p className="text-sm text-muted-foreground">Use the domain selector above to choose a domain</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 border border-violet-500/30 overflow-hidden">
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
                <Badge className={getStatusColor(health?.status)}>
                  {getStatusIcon(health?.status)}
                  <span className="ml-1.5 capitalize">{health?.status || "Connecting..."}</span>
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">AI-Powered Content Automation Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2 border-violet-500/30 hover:bg-violet-500/10">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10">
              <LogOut className="w-4 h-4" />
              Disconnect
            </Button>
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
          )}

          <Card className="border-violet-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Rocket className="w-5 h-5 text-violet-400" />Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Button variant="outline" onClick={handleCrawlDomain} disabled={crawling || !domain} className="h-auto py-4 flex-col gap-2 border-violet-500/30 hover:bg-violet-500/10">
                  {crawling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 text-violet-400" />}
                  <span className="text-xs">Crawl Domain</span>
                </Button>
                <Button variant="outline" onClick={() => handleGenerateContent("blog")} disabled={generatingContent !== null || !domain} className="h-auto py-4 flex-col gap-2 border-violet-500/30 hover:bg-violet-500/10">
                  {generatingContent === "blog" ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 text-violet-400" />}
                  <span className="text-xs">Generate Article</span>
                </Button>
                <Button variant="outline" onClick={handleGenerateFaq} disabled={generatingFaq || !domain} className="h-auto py-4 flex-col gap-2 border-violet-500/30 hover:bg-violet-500/10">
                  {generatingFaq ? <Loader2 className="w-5 h-5 animate-spin" /> : <HelpCircle className="w-5 h-5 text-violet-400" />}
                  <span className="text-xs">Generate FAQs</span>
                </Button>
                <Button variant="outline" onClick={handleGenerateKnowledgeBase} disabled={generatingKb || !domain} className="h-auto py-4 flex-col gap-2 border-violet-500/30 hover:bg-violet-500/10">
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
          <Card className="border-violet-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-violet-400" />AI Content Generation</CardTitle>
              <CardDescription>Select a content type to generate SEO-optimized articles for {domain || "your domain"}</CardDescription>
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
                    disabled={generatingContent !== null || !domain}
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
                  <CardDescription>Generate and manage FAQs for {domain || "your domain"}</CardDescription>
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
                  <Button onClick={handleGenerateFaq} disabled={generatingFaq || !domain} className="gap-2 bg-violet-500 hover:bg-violet-600">
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
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium flex items-start gap-2">
                              <HelpCircle className="w-4 h-4 text-violet-400 shrink-0 mt-1" />
                              {faq.question}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2 pl-6">{faq.answer}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyToClipboard(`Q: ${faq.question}\nA: ${faq.answer}`)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        {faq.created_at && <p className="text-xs text-muted-foreground mt-2 pl-6">{new Date(faq.created_at).toLocaleDateString()}</p>}
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
