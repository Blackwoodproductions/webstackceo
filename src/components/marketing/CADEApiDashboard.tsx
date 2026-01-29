import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, FileText,
  Globe, HelpCircle, Loader2, RefreshCw, Server, Sparkles,
  Target, TrendingUp, Zap, ChevronDown, ChevronRight,
  Database, Cpu, BarChart3, Brain, Wand2, Play, PlusCircle,
  LayoutGrid, Lightbulb, BookOpen, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useBronApi, BronSubscription } from "@/hooks/use-bron-api";
import { toast } from "sonner";
import {
  loadCachedCadeData,
  saveCachedCadeData,
} from "@/lib/persistentCache";
import { CADEContentManager, CADEFAQManager, CADECrawlControl, CADETaskMonitor, CADEWorkerStatus } from "./cade";

// Cache helpers
const BRON_SUBSCRIPTION_CACHE_KEY = 'bron_subscription_cache';
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

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

interface SystemHealth {
  status?: string;
  version?: string;
  uptime?: number;
}

interface WorkerData {
  name?: string;
  status?: string;
  tasks_completed?: number;
}

interface QueueData {
  name?: string;
  pending?: number;
  processing?: number;
  completed?: number;
}

interface DomainProfile {
  domain?: string;
  category?: string;
  status?: string;
  crawled_pages?: number;
  last_crawl?: string;
  content_count?: number;
}

interface SubscriptionInfo {
  plan?: string;
  status?: string;
  quota_used?: number;
  quota_limit?: number;
}

interface FAQItem {
  id?: string;
  question?: string;
  answer?: string;
}

interface CADEApiDashboardProps {
  domain?: string;
  onSubscriptionChange?: (hasSubscription: boolean) => void;
}

export const CADEApiDashboard = ({ domain, onSubscriptionChange }: CADEApiDashboardProps) => {
  const { fetchSubscription } = useBronApi();
  
  const [cachedData] = useState(() => domain ? loadCachedCadeData(domain) : null);
  
  const [isLoading, setIsLoading] = useState(!cachedData?.isConnected);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(!cachedData?.isConnected);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [hasCadeSubscription, setHasCadeSubscription] = useState(cachedData?.isConnected || false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(cachedData?.subscription || null);

  // Keep parent gating state in sync (used to show/hide platform connect blocks)
  useEffect(() => {
    onSubscriptionChange?.(hasCadeSubscription);
  }, [hasCadeSubscription, onSubscriptionChange]);
  
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [workers, setWorkers] = useState<WorkerData[]>(cachedData?.workers as WorkerData[] || []);
  const [queues, setQueues] = useState<QueueData[]>(cachedData?.queues as QueueData[] || []);
  const [domainProfile, setDomainProfile] = useState<DomainProfile | null>(cachedData?.domainProfile || null);
  const [faqs, setFaqs] = useState<FAQItem[]>(cachedData?.faqs as FAQItem[] || []);
  
  // Section collapse states
  const [contentOpen, setContentOpen] = useState(true);
  const [faqsOpen, setFaqsOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(false);

  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>) => {
    try {
      const { data, error } = await supabase.functions.invoke("cade-api", {
        body: { action, domain, params },
      });
      if (error) throw new Error(error.message);
      return data;
    } catch (err) {
      console.warn(`[CADE] ${action} failed:`, err);
      return null;
    }
  }, [domain]);

  const checkSubscription = useCallback(async (): Promise<boolean> => {
    if (!domain) {
      setIsCheckingSubscription(false);
      setIsLoading(false);
      onSubscriptionChange?.(false);
      return false;
    }
    
    setIsCheckingSubscription(true);
    
    const cachedSub = getCachedSubscription(domain);
    if (cachedSub && cachedSub.has_cade === true) {
      setHasCadeSubscription(true);
      onSubscriptionChange?.(true);
      setSubscription({
        plan: cachedSub.plan || cachedSub.servicetype || "CADE",
        status: cachedSub.status || "active",
      });
      setIsCheckingSubscription(false);
      
      fetchSubscription(domain).then((freshData) => {
        if (freshData?.has_cade === true) {
          setCachedSubscription(domain, freshData);
        }
      }).catch(() => {});
      
      return true;
    }
    
    try {
      const subData = await fetchSubscription(domain);
      const hasValidSubscription = subData?.has_cade === true;
      
      if (hasValidSubscription) {
        setCachedSubscription(domain, subData);
        setHasCadeSubscription(true);
        onSubscriptionChange?.(true);
        setSubscription({
          plan: subData.plan || subData.servicetype || "CADE",
          status: subData.status || "active",
        });
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

  const fetchAllData = useCallback(async () => {
    if (!hasCadeSubscription) {
      setIsLoading(false);
      return;
    }
    
    try {
      const [healthRes, profileRes, faqsRes] = await Promise.allSettled([
        callCadeApi("health"),
        domain ? callCadeApi("domain-profile") : Promise.resolve(null),
        domain ? callCadeApi("get-faqs") : Promise.resolve(null),
      ]);

      if (healthRes.status === "fulfilled" && healthRes.value) {
        const h = healthRes.value?.data || healthRes.value;
        setHealth(h);
        if (h?.workers !== undefined) {
          setWorkers(Array(h.workers || 0).fill({ name: "Worker", status: "running" }));
        }
        if (h?.queues) {
          setQueues(Array.isArray(h.queues) ? h.queues : []);
        }
      }

      if (profileRes.status === "fulfilled" && profileRes.value) {
        setDomainProfile(profileRes.value?.data || profileRes.value);
      }

      if (faqsRes.status === "fulfilled" && faqsRes.value) {
        const f = faqsRes.value?.data || faqsRes.value;
        setFaqs(Array.isArray(f) ? f : f?.faqs || []);
      }

      if (domain) {
        saveCachedCadeData(domain, {
          subscription: subscription || undefined,
          domainProfile: domainProfile || undefined,
          faqs: faqs,
          workers: workers,
          queues: queues,
          isConnected: hasCadeSubscription,
        });
      }
    } catch (err) {
      console.warn("[CADE] Fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [callCadeApi, domain, hasCadeSubscription, subscription, domainProfile, faqs, workers, queues]);

  useEffect(() => {
    let cancelled = false;
    
    const init = async () => {
      const hasSubscription = await checkSubscription();
      if (cancelled) return;
      if (hasSubscription) fetchAllData();
      else setIsLoading(false);
    };
    
    init();
    return () => { cancelled = true; };
  }, [domain]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const hasSubscription = await checkSubscription();
    if (hasSubscription) await fetchAllData();
    setIsRefreshing(false);
    toast.success("CADE data refreshed");
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-muted text-muted-foreground";
    const s = status.toLowerCase();
    if (["healthy", "active", "running", "ok"].includes(s)) {
      return "bg-green-500/15 text-green-500 border-green-500/30";
    }
    if (["warning", "busy", "pending"].includes(s)) {
      return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    }
    if (["error", "failed", "offline"].includes(s)) {
      return "bg-red-500/15 text-red-500 border-red-500/30";
    }
    return "bg-violet-500/15 text-violet-500 border-violet-500/30";
  };

  // Loading state
  if (isCheckingSubscription) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-cyan-500/10 border border-violet-500/30"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-xl">
            <Brain className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold">Initializing CADE</h3>
            <p className="text-sm text-muted-foreground">Connecting to AI engine...</p>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
            <span className="text-sm text-muted-foreground">Verifying subscription</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // No subscription
  if (!hasCadeSubscription) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 rounded-2xl bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-violet-500/20 text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-4">
          <Wand2 className="w-8 h-8 text-violet-500" />
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
    );
  }

  // Main Dashboard - No Tabs, Single View
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-transparent border border-violet-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold">CADE Dashboard</h3>
              {health?.status && (
                <Badge className={`text-xs ${getStatusColor(health.status)}`}>
                  {health.status}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">AI Content Automation Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
            {subscription?.plan || "CADE Pro"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs text-muted-foreground">Status</span>
            </div>
            <p className="text-lg font-bold">{health?.status || "—"}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs text-muted-foreground">Workers</span>
            </div>
            <p className="text-lg font-bold">{workers.length || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-violet-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-xs text-muted-foreground">Pages</span>
            </div>
            <p className="text-lg font-bold">{domainProfile?.crawled_pages ?? "—"}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground">Articles</span>
            </div>
            <p className="text-lg font-bold">{domainProfile?.content_count ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-teal-500/5 border-cyan-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-xs text-muted-foreground">FAQs</span>
            </div>
            <p className="text-lg font-bold">{faqs.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Crawl Control & Live Tasks - Primary Action Area */}
      {domain && (
        <CADECrawlControl
          domain={domain}
          domainProfile={domainProfile}
          onRefresh={handleRefresh}
        />
      )}

      {/* Live Task Monitor - Collapsed by default for compact view */}
      {domain && (
        <CADETaskMonitor
          domain={domain}
          onRefresh={handleRefresh}
          isCollapsed={true}
        />
      )}

      {/* Content Library Section */}
      {domain && (
        <Collapsible open={contentOpen} onOpenChange={setContentOpen}>
          <Card className="border-violet-500/20">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-violet-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Content Library</CardTitle>
                      <CardDescription className="text-xs">
                        {domainProfile?.content_count ?? 0} articles generated
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info("Generate article feature coming soon");
                      }}
                    >
                      <PlusCircle className="w-3 h-3" />
                      New
                    </Button>
                    {contentOpen ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <CADEContentManager 
                  domain={domain} 
                  onRefresh={handleRefresh}
                  isCompact={true}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* FAQ Library Section */}
      {domain && (
        <Collapsible open={faqsOpen} onOpenChange={setFaqsOpen}>
          <Card className="border-cyan-500/20">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">FAQ Library</CardTitle>
                      <CardDescription className="text-xs">
                        {faqs.length} FAQs created
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info("Generate FAQ feature coming soon");
                      }}
                    >
                      <PlusCircle className="w-3 h-3" />
                      New
                    </Button>
                    {faqsOpen ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <CADEFAQManager 
                  domain={domain}
                  initialFaqs={faqs}
                  onRefresh={handleRefresh}
                  isCompact={true}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Quick Actions Bar */}
      {domain && (
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => toast.info("Generate Article coming soon")}
              >
                <FileText className="w-4 h-4 text-violet-500" />
                <span className="text-xs">Generate Article</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => toast.info("Generate FAQ coming soon")}
              >
                <HelpCircle className="w-4 h-4 text-cyan-500" />
                <span className="text-xs">Generate FAQ</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => toast.info("Knowledge Base coming soon")}
              >
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span className="text-xs">Knowledge Base</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-auto py-3 flex-col gap-1"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 text-green-500 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="text-xs">Sync Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status - Collapsed by Default */}
      <Collapsible open={systemOpen} onOpenChange={setSystemOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-3 h-auto bg-muted/20 hover:bg-muted/40 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">System Status & Workers</span>
            </div>
            {systemOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Workers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-green-500" />
                  Workers ({workers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  {workers.length > 0 ? (
                    <div className="space-y-1.5">
                      {workers.map((worker, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                          <span>{worker.name || `Worker ${i + 1}`}</span>
                          <Badge className={`text-xs ${getStatusColor(worker.status)}`}>
                            {worker.status || "running"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No workers active</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Queues */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-500" />
                  Queues ({queues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  {queues.length > 0 ? (
                    <div className="space-y-1.5">
                      {queues.map((queue, i) => (
                        <div key={i} className="p-2 rounded bg-muted/30">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>{queue.name || `Queue ${i + 1}`}</span>
                          </div>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span className="text-amber-500">{queue.pending || 0} pending</span>
                            <span className="text-blue-500">{queue.processing || 0} processing</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No queue data</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Full Worker Status Component */}
          <div className="mt-3">
            <CADEWorkerStatus isCollapsed={false} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};

export default CADEApiDashboard;
