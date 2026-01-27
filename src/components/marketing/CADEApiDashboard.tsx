import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, FileText,
  Globe, HelpCircle, Loader2, RefreshCw, Server, Sparkles,
  Target, TrendingUp, Users, Zap, ChevronDown, ChevronRight,
  Database, Cpu, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // API Data States
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [queues, setQueues] = useState<QueueData[]>([]);
  const [domainProfile, setDomainProfile] = useState<DomainProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  
  // Collapsible states
  const [systemOpen, setSystemOpen] = useState(true);
  const [domainOpen, setDomainOpen] = useState(true);
  const [faqsOpen, setFaqsOpen] = useState(false);

  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain, params },
    });
    
    if (error) {
      console.error(`[CADE] ${action} error:`, error);
      throw new Error(error.message || `Failed to fetch ${action}`);
    }
    
    return data;
  }, [domain]);

  const fetchAllData = useCallback(async () => {
    setError(null);
    
    try {
      // Parallelize ALL initial calls for maximum speed
      const [healthRes, subscriptionRes, workersRes, queuesRes] = await Promise.allSettled([
        callCadeApi("health"),
        callCadeApi("subscription"),
        callCadeApi("workers"),
        callCadeApi("queues"),
      ]);

      // Process health
      if (healthRes.status === "fulfilled" && healthRes.value) {
        const healthData = healthRes.value?.data || healthRes.value;
        setHealth(healthData);
        if (healthData?.workers !== undefined) {
          setWorkers(Array(healthData.workers || 0).fill({ name: "Worker", status: "running" }));
        }
        if (healthData?.queues) {
          const qData = healthData.queues;
          setQueues(Array.isArray(qData) ? qData : []);
        }
      }

      // Process subscription
      if (subscriptionRes.status === "fulfilled" && !subscriptionRes.value?.error) {
        setSubscription(subscriptionRes.value?.data || subscriptionRes.value);
      }
      
      // Process workers
      if (workersRes.status === "fulfilled" && !workersRes.value?.error) {
        const workersData = workersRes.value?.data || workersRes.value;
        if (Array.isArray(workersData)) setWorkers(workersData);
      }
      
      // Process queues
      if (queuesRes.status === "fulfilled" && !queuesRes.value?.error) {
        const queuesData = queuesRes.value?.data || queuesRes.value;
        if (Array.isArray(queuesData)) setQueues(queuesData);
      }

      // Fetch domain-specific data in parallel if domain is provided
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
      setError(err instanceof Error ? err.message : "Failed to load CADE data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [callCadeApi, domain]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-red-500/10 border border-red-500/30"
      >
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-600">Failed to Connect to CADE API</h4>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
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
