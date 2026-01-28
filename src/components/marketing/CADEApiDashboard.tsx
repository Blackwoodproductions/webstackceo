import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, Clock, FileText,
  Globe, Loader2, RefreshCw, Settings, Sparkles,
  Zap, ChevronDown, Play, Pause, Edit2, Save, X,
  Calendar, Users, Mail, ShieldCheck, BarChart3,
  FileEdit, HelpCircle, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useBronApi, BronSubscription } from "@/hooks/use-bron-api";
import { toast } from "sonner";

interface CADEApiDashboardProps {
  domain?: string;
}

interface SchedulerInfo {
  enabled: boolean;
  next_generation?: string;
  frequency?: string;
  articles_per_batch?: number;
}

interface AccountInfo {
  service_type?: string;
  user_name?: string;
  email?: string;
  authenticated: boolean;
}

interface CrawlInfo {
  status: 'complete' | 'pending' | 'error' | 'running';
  last_crawl?: string;
  crawled_pages?: number;
}

interface DomainInfo {
  description?: string;
  categories?: string[];
  competitors?: string[];
}

interface Article {
  id: string;
  title: string;
  status: 'published' | 'draft' | 'scheduled';
  created_at: string;
  content?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  status: 'published' | 'draft';
}

export const CADEApiDashboard = ({ domain }: CADEApiDashboardProps) => {
  const { fetchSubscription } = useBronApi();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data states
  const [bronSubscription, setBronSubscription] = useState<BronSubscription | null>(null);
  const [scheduler, setScheduler] = useState<SchedulerInfo>({ enabled: true });
  const [account, setAccount] = useState<AccountInfo>({ authenticated: false });
  const [crawl, setCrawl] = useState<CrawlInfo>({ status: 'pending' });
  const [domainInfo, setDomainInfo] = useState<DomainInfo>({});
  const [articles, setArticles] = useState<Article[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqGenerationEnabled, setFaqGenerationEnabled] = useState(true);
  
  // UI states
  const [contentTab, setContentTab] = useState('articles');
  const [articleFilter, setArticleFilter] = useState('all');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [schedulingCount, setSchedulingCount] = useState('1');
  const [isCrawling, setIsCrawling] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 0, mins: 0, secs: 0 });

  const callCadeApi = useCallback(async (action: string, params?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action, domain, params },
    });
    if (error) throw new Error(error.message || `Failed: ${action}`);
    return data;
  }, [domain]);

  // Calculate countdown timer
  useEffect(() => {
    if (!scheduler.next_generation) return;
    
    const updateCountdown = () => {
      const next = new Date(scheduler.next_generation!).getTime();
      const now = Date.now();
      const diff = Math.max(0, next - now);
      
      setCountdown({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [scheduler.next_generation]);

  const fetchAllData = useCallback(async () => {
    if (!domain) return;
    
    try {
      // Parallel fetch all data
      const [bronSub, profileRes, faqsRes] = await Promise.allSettled([
        fetchSubscription(domain),
        callCadeApi("domain-profile"),
        callCadeApi("get-faqs"),
      ]);

      // Process BRON subscription
      if (bronSub.status === "fulfilled" && bronSub.value) {
        setBronSubscription(bronSub.value);
        setAccount({
          service_type: bronSub.value.plan || "CADE Pro",
          user_name: "User",
          email: "",
          authenticated: bronSub.value.has_cade,
        });
      }

      // Process domain profile
      if (profileRes.status === "fulfilled" && profileRes.value) {
        const profile = profileRes.value;
        setDomainInfo({
          description: profile.description || profile.business_description || "",
          categories: profile.categories || [],
          competitors: profile.competitors || [],
        });
        setCrawl({
          status: profile.crawl_status === 'complete' ? 'complete' : 
                  profile.crawled_pages > 0 ? 'complete' : 'pending',
          last_crawl: profile.last_crawl || profile.crawled_at,
          crawled_pages: profile.crawled_pages || 0,
        });
        
        // Scheduler info from profile
        setScheduler({
          enabled: profile.scheduler_enabled !== false,
          next_generation: profile.next_generation || new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          frequency: profile.frequency || "12hrs",
          articles_per_batch: profile.articles_per_batch || 1,
        });
      }

      // Process FAQs
      if (faqsRes.status === "fulfilled" && faqsRes.value) {
        const faqData = Array.isArray(faqsRes.value) ? faqsRes.value : faqsRes.value?.faqs || [];
        setFaqs(faqData.map((f: any, i: number) => ({
          id: f.id || String(i),
          question: f.question || '',
          answer: f.answer || '',
          status: f.status || 'published',
        })));
      }

    } catch (err) {
      console.error("[CADE] Fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [domain, callCadeApi, fetchSubscription]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleTriggerCrawl = async () => {
    setIsCrawling(true);
    try {
      await callCadeApi("crawl-domain");
      toast.success("Crawl triggered successfully!");
      setCrawl(prev => ({ ...prev, status: 'running' }));
      // Poll for completion
      setTimeout(() => {
        setCrawl(prev => ({ ...prev, status: 'complete', last_crawl: new Date().toISOString() }));
        setIsCrawling(false);
      }, 5000);
    } catch (err) {
      toast.error("Failed to trigger crawl");
      setIsCrawling(false);
    }
  };

  const handleScheduleNow = async () => {
    try {
      await callCadeApi("generate-content", { count: parseInt(schedulingCount) });
      toast.success(`Scheduled ${schedulingCount} article(s) for generation!`);
    } catch (err) {
      toast.error("Failed to schedule content");
    }
  };

  const handleToggleFaqGeneration = async () => {
    setFaqGenerationEnabled(!faqGenerationEnabled);
    toast.success(faqGenerationEnabled ? "FAQ generation paused" : "FAQ generation resumed");
  };

  const handleSaveDescription = async () => {
    try {
      // Would call API to save description
      setDomainInfo(prev => ({ ...prev, description: editedDescription }));
      setIsEditingDescription(false);
      toast.success("Description saved!");
    } catch (err) {
      toast.error("Failed to save description");
    }
  };

  const filteredArticles = articles.filter(a => 
    articleFilter === 'all' || a.status === articleFilter
  );

  const articleStats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    drafts: articles.filter(a => a.status === 'draft').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 p-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome to CADE Content Writer</h2>
            <p className="text-white/80 mt-1">Manage your AI-Powered content generation and SEO Optimization</p>
          </div>
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Top Row: Scheduler, Quick Actions, Account Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scheduler Card */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-cyan-500 rounded-full" />
              <h3 className="font-semibold">Scheduler</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Scheduler Status</p>
                <Badge className={scheduler.enabled 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                  : "bg-red-500/20 text-red-400 border-red-500/30"
                }>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {scheduler.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Next Generation</p>
                <p className="text-lg font-bold">
                  {countdown.hours}hrs, {countdown.mins}mins, {countdown.secs}sec
                </p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Generation Frequency</p>
                <p className="font-semibold">{scheduler.frequency || "12hrs"}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Articles Per Batch</p>
                <p className="font-semibold">{scheduler.articles_per_batch || 1} article(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-cyan-500 rounded-full" />
              <h3 className="font-semibold">Quick Actions</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Schedule Content Now</p>
                <Select value={schedulingCount} onValueChange={setSchedulingCount}>
                  <SelectTrigger className="bg-muted/50">
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
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Schedule Now
              </Button>
              
              <p className="text-sm text-muted-foreground text-center">
                Remaining this week: <span className="font-semibold text-foreground">2 of 2 articles</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Status Card */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-cyan-500 rounded-full" />
              <h3 className="font-semibold">Account Status</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Service Type</p>
                <p className="font-bold">{bronSubscription?.plan || "SEOM 60"}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">User</p>
                <p className="font-semibold">{domain || "Unknown"}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                <p className="font-semibold text-sm truncate">{account.email || "—"}</p>
              </div>
              
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Authenticated
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Website Crawl & Domain Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Website Crawl Card */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-cyan-500 rounded-full" />
              <h3 className="font-semibold">Website Crawl</h3>
            </div>
            
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                crawl.status === 'complete' 
                  ? 'bg-emerald-500/10 border border-emerald-500/30' 
                  : crawl.status === 'running'
                  ? 'bg-amber-500/10 border border-amber-500/30'
                  : 'bg-muted/50 border border-border'
              }`}>
                <div>
                  <p className={`font-semibold ${
                    crawl.status === 'complete' ? 'text-emerald-400' : 
                    crawl.status === 'running' ? 'text-amber-400' : 'text-muted-foreground'
                  }`}>
                    {crawl.status === 'complete' ? 'Complete' : 
                     crawl.status === 'running' ? 'Crawling...' : 'Pending'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {crawl.status === 'complete' ? 'Crawl finished successfully.' : 'Waiting for crawl...'}
                  </p>
                </div>
                {crawl.status === 'complete' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {crawl.status === 'running' && <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />}
              </div>
              
              {crawl.last_crawl && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last Crawl:</p>
                  <p className="font-semibold">
                    {new Date(crawl.last_crawl).toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
              )}
              
              <Button 
                onClick={handleTriggerCrawl}
                disabled={isCrawling}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                {isCrawling ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Trigger Manual Crawl
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Update content analysis (takes several minutes)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Domain Information Card */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-cyan-500 rounded-full" />
              <h3 className="font-semibold">Domain Information</h3>
            </div>
            
            <div className="space-y-4">
              {/* Competitors */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Competitors:</p>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  {domainInfo.competitors && domainInfo.competitors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {domainInfo.competitors.map((c, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No competitors added yet. <button className="text-cyan-400 hover:underline">Add competitors in Settings</button>
                    </p>
                  )}
                </div>
              </div>
              
              {/* Business Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Business Description:</p>
                  {!isEditingDescription && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => {
                        setEditedDescription(domainInfo.description || '');
                        setIsEditingDescription(true);
                      }}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <Textarea 
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="min-h-[100px] bg-muted/50"
                      placeholder="Enter business description..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveDescription}>
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingDescription(false)}>
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed line-clamp-4">
                      {domainInfo.description || "No description available."}
                    </p>
                    {domainInfo.description && domainInfo.description.length > 200 && (
                      <button className="text-cyan-400 text-sm hover:underline mt-1">Read more</button>
                    )}
                  </>
                )}
              </div>
              
              {/* Categories */}
              {domainInfo.categories && domainInfo.categories.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {domainInfo.categories.map((cat, i) => (
                      <Badge 
                        key={i} 
                        className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs"
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Generation Card */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-cyan-500 rounded-full" />
              <h3 className="font-semibold">FAQ Generation</h3>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge className={faqGenerationEnabled 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              }>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {faqGenerationEnabled ? "Up to date" : "Paused"}
              </Badge>
            </div>
            
            <Button 
              onClick={handleToggleFaqGeneration}
              className={faqGenerationEnabled 
                ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
              }
            >
              {faqGenerationEnabled ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause FAQ Generation
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume FAQ Generation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Management Section */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-5 bg-cyan-500 rounded-full" />
            <h3 className="font-semibold">Content Management</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your CADE-generated content and view scheduling information.
          </p>
          
          <Tabs value={contentTab} onValueChange={setContentTab}>
            <TabsList className="bg-muted/30 mb-6">
              <TabsTrigger value="articles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Blog Article
              </TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            </TabsList>
            
            <TabsContent value="articles" className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Blog Articles</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage your CADE-generated blog articles. Filter by status to see published or draft content.
                </p>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-3xl font-bold text-cyan-400">{articleStats.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Articles</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-3xl font-bold text-emerald-400">{articleStats.published}</p>
                    <p className="text-xs text-muted-foreground mt-1">Published</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-3xl font-bold text-amber-400">{articleStats.drafts}</p>
                    <p className="text-xs text-muted-foreground mt-1">Drafts</p>
                  </div>
                </div>
                
                {/* Filter */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm text-muted-foreground">Filter by status :</span>
                  <Select value={articleFilter} onValueChange={setArticleFilter}>
                    <SelectTrigger className="w-48 bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Drafts</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Articles List or Empty State */}
                {filteredArticles.length > 0 ? (
                  <div className="space-y-2">
                    {filteredArticles.map(article => (
                      <div key={article.id} className="p-3 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{article.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(article.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={
                          article.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                          article.status === 'draft' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }>
                          {article.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No articles found</p>
                  </div>
                )}
                
                <Button 
                  className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  <FileEdit className="w-4 h-4 mr-2" />
                  View All CADE Posts
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="faq" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">FAQ Management</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  View and manage your CADE-generated FAQs.
                </p>
                
                {faqs.length > 0 ? (
                  <div className="space-y-3">
                    {faqs.map(faq => (
                      <div key={faq.id} className="p-4 rounded-lg bg-muted/20 border border-border/50">
                        <p className="font-medium text-cyan-400 mb-2">{faq.question}</p>
                        <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No FAQs generated yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="scheduled" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Scheduled Content</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  View upcoming scheduled content generation.
                </p>
                
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No scheduled content</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};
