import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key, LogIn, LogOut, Loader2, CheckCircle2, AlertTriangle,
  Eye, EyeOff, Shield, Sparkles, Database, Activity, Server,
  Cpu, BarChart3, Globe, RefreshCw, ChevronDown, ChevronRight,
  HelpCircle, Zap, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SystemHealth {
  status?: string;
  workers?: number;
  tasks?: number;
  queues?: unknown[];
}

interface SubscriptionInfo {
  plan?: string;
  status?: string;
  quota_used?: number;
  quota_limit?: number;
  credits_remaining?: number;
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

interface FAQItem {
  id?: string;
  question?: string;
  answer?: string;
}

interface CADELoginBoxProps {
  domain?: string;
}

export const CADELoginBox = ({ domain }: CADELoginBoxProps) => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API Data States
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [domainProfile, setDomainProfile] = useState<DomainProfile | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  // Collapsible states
  const [systemOpen, setSystemOpen] = useState(true);
  const [domainOpen, setDomainOpen] = useState(true);
  const [faqsOpen, setFaqsOpen] = useState(false);

  // Check for stored connection on mount
  useEffect(() => {
    const storedKey = localStorage.getItem("cade_api_key");
    if (storedKey) {
      setApiKey(storedKey);
      setIsConnected(true);
    }
  }, []);

  // Fetch data when connected
  useEffect(() => {
    if (isConnected && apiKey) {
      fetchAllData();
    }
  }, [isConnected, apiKey, domain]);

  const callCadeApi = async (action: string, params?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain, params },
    });

    if (error) {
      console.error(`[CADE] ${action} error:`, error);
      throw new Error(error.message || `Failed to fetch ${action}`);
    }

    return data;
  };

  const fetchAllData = useCallback(async () => {
    setError(null);

    try {
      // Fetch health first (public endpoint)
      const healthRes = await callCadeApi("health");
      if (healthRes?.success || healthRes?.data) {
        setHealth(healthRes.data || healthRes);
      }

      // Fetch authenticated endpoints
      const [subRes] = await Promise.allSettled([
        callCadeApi("subscription"),
      ]);

      if (subRes.status === "fulfilled" && subRes.value?.success) {
        setSubscription(subRes.value.data);
      }

      // Fetch domain-specific data
      if (domain) {
        const [profileRes, faqsRes] = await Promise.allSettled([
          callCadeApi("domain-profile"),
          callCadeApi("get-faqs"),
        ]);

        if (profileRes.status === "fulfilled" && !profileRes.value?.error) {
          setDomainProfile(profileRes.value?.data || profileRes.value);
        }
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
  }, [domain]);

  const handleLogin = async () => {
    if (!apiKey.trim()) {
      setError("Please enter your CADE API key");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Test the connection by calling health endpoint
      const healthRes = await callCadeApi("health");

      if (healthRes?.success || healthRes?.data?.status === "healthy") {
        // Store the key and mark as connected
        localStorage.setItem("cade_api_key", apiKey);
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

  const handleLogout = () => {
    localStorage.removeItem("cade_api_key");
    setIsConnected(false);
    setApiKey("");
    setHealth(null);
    setSubscription(null);
    setDomainProfile(null);
    setFaqs([]);
    toast.success("Disconnected from CADE API");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAllData();
    toast.success("Refreshing CADE data...");
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

  // Login Form View
  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="relative p-6 rounded-xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 border border-violet-500/30 overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/15 to-transparent rounded-full blur-2xl" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  CADE API Login
                  <Badge className="bg-violet-500/15 text-violet-500 border-violet-500/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Content Automation
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Connect to your CADE account to access content generation
                </p>
              </div>
            </div>

            {/* Login Form */}
            <div className="space-y-4">
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="Enter your CADE API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="pl-10 pr-10 h-12 bg-background/50 border-violet-500/30 focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-red-500"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <Button
                onClick={handleLogin}
                disabled={isLoading || !apiKey.trim()}
                className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30 gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Connect to CADE
                  </>
                )}
              </Button>

              {/* Info */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                <Shield className="w-3.5 h-3.5 text-violet-500" />
                <span>Your API key is stored locally and securely</span>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              CADE Dashboard
              {health?.status && (
                <Badge className={getStatusColor(health.status)}>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {health.status}
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              Content Automation & Domain Enhancement
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-muted-foreground hover:text-red-500"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* System Status */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground">Status</span>
            </div>
            <p className="text-lg font-bold capitalize">{health?.status || "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {health?.tasks ?? 0} active tasks
            </p>
          </CardContent>
        </Card>

        {/* Workers */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">Workers</span>
            </div>
            <p className="text-lg font-bold">{health?.workers ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Processing nodes</p>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-medium text-muted-foreground">Plan</span>
            </div>
            <p className="text-lg font-bold">{subscription?.plan || "Active"}</p>
            {subscription?.status && (
              <Badge className={`mt-1 ${getStatusColor(subscription.status)}`}>
                {subscription.status}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Quota */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground">Quota</span>
            </div>
            <p className="text-lg font-bold">
              {subscription?.quota_used ?? "—"} / {subscription?.quota_limit ?? "∞"}
            </p>
            {subscription?.quota_limit && subscription?.quota_used !== undefined && (
              <div className="mt-2 h-1.5 bg-amber-500/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (subscription.quota_used / subscription.quota_limit) * 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Details */}
      <Collapsible open={systemOpen} onOpenChange={setSystemOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-muted/30 hover:bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-violet-500" />
              <span className="font-semibold">System Overview</span>
            </div>
            {systemOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 p-4 rounded-xl bg-muted/20 border border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Health Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${health?.status === "healthy" ? "bg-green-500" : "bg-amber-500"}`} />
                  <span className="font-medium capitalize">{health?.status || "Unknown"}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Active Workers</p>
                <p className="font-medium">{health?.workers ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pending Tasks</p>
                <p className="font-medium">{health?.tasks ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Queue Status</p>
                <p className="font-medium">{Array.isArray(health?.queues) ? health.queues.length : 0} queues</p>
              </div>
            </div>
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
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <p>No profile data available. Domain may need to be crawled first.</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-2">
                    <Zap className="w-4 h-4" />
                    Start Crawl
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* FAQs */}
      {faqs.length > 0 && (
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
              <div className="space-y-3 pr-4">
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

export default CADELoginBox;
