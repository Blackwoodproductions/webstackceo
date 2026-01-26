import { motion } from "framer-motion";
import { 
  Link2, TrendingUp, Award, Zap, FileText, ExternalLink, 
  RefreshCw, Clock, CheckCircle2, AlertCircle, ArrowUpRight,
  ArrowDownRight, Minus, Target, BarChart3, Globe, Sparkles,
  Play, Settings, Database, Activity, Users, Search, Layers,
  PieChart, BookOpen, Server, Cpu, HardDrive, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBronApi } from "@/hooks/use-bron-api";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface BronDashboardProps {
  domain: string;
  onLogout: () => void;
}

export function BronDashboard({ domain, onLogout }: BronDashboardProps) {
  const { 
    data, 
    isLoading, 
    loadingStates, 
    errors, 
    refetch, 
    refetchAll, 
    lastUpdated,
    triggerCrawl,
    triggerCategorization,
    generateContent,
    generateFaq,
  } = useBronApi(domain);

  const handleAction = async (action: () => Promise<boolean>, name: string) => {
    const success = await action();
    if (success) {
      toast({ title: `${name} Started`, description: `${name} has been triggered for ${domain}` });
    } else {
      toast({ title: `${name} Failed`, description: `Failed to start ${name}`, variant: "destructive" });
    }
  };

  // Check if any endpoint has an error
  const hasAnyError = Object.values(errors).some(e => e !== null);
  const firstError = Object.entries(errors).find(([_, v]) => v !== null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <DashboardHeader 
        domain={domain} 
        lastUpdated={lastUpdated} 
        isLoading={isLoading} 
        onRefresh={refetchAll}
        onLogout={onLogout}
      />

      {/* Error Banner */}
      {hasAnyError && firstError && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 flex items-start gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Some data failed to load</p>
            <p className="text-sm mt-1 opacity-80">{firstError[0]}: {firstError[1]}</p>
          </div>
        </div>
      )}

      {/* Authority & Stats Overview */}
      <AuthoritySection authority={data.authority} isLoading={isLoading} />

      {/* Quick Action Cards */}
      <QuickActionsSection 
        loadingStates={loadingStates}
        onCrawl={() => handleAction(triggerCrawl, "Domain Crawl")}
        onCategorize={() => handleAction(triggerCategorization, "Domain Categorization")}
        onGenerateContent={() => handleAction(generateContent, "Content Generation")}
        onGenerateFaq={() => handleAction(generateFaq, "FAQ Generation")}
        subscription={data.subscription}
        systemHealth={data.systemHealth}
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="backlinks" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="backlinks" className="gap-1.5">
            <Link2 className="w-4 h-4" />
            Backlinks
          </TabsTrigger>
          <TabsTrigger value="rankings" className="gap-1.5">
            <TrendingUp className="w-4 h-4" />
            Rankings
          </TabsTrigger>
          <TabsTrigger value="keywords" className="gap-1.5">
            <Search className="w-4 h-4" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="articles" className="gap-1.5">
            <FileText className="w-4 h-4" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="deeplinks" className="gap-1.5">
            <Layers className="w-4 h-4" />
            Deep Links
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backlinks">
          <BacklinksPanel 
            backlinks={data.backlinks} 
            isLoading={loadingStates.backlinks}
            onRefresh={() => refetch("backlinks")}
          />
        </TabsContent>

        <TabsContent value="rankings">
          <RankingsPanel 
            rankings={data.rankings} 
            isLoading={loadingStates.rankings}
            onRefresh={() => refetch("rankings")}
          />
        </TabsContent>

        <TabsContent value="keywords">
          <KeywordsPanel 
            keywords={data.keywords} 
            isLoading={loadingStates.keywords}
            onRefresh={() => refetch("keywords")}
          />
        </TabsContent>

        <TabsContent value="articles">
          <ArticlesPanel 
            articles={data.articles} 
            isLoading={loadingStates.articles}
            onRefresh={() => refetch("articles")}
          />
        </TabsContent>

        <TabsContent value="deeplinks">
          <DeepLinksPanel 
            deepLinks={data.deepLinks} 
            isLoading={loadingStates.deeplinks}
            onRefresh={() => refetch("deeplinks")}
          />
        </TabsContent>
      </Tabs>

      {/* Domain Profile & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DomainProfileCard profile={data.domainProfile} isLoading={isLoading} />
        <TasksCard tasks={data.tasks} isLoading={isLoading} />
      </div>
    </motion.div>
  );
}

// Dashboard Header Component
function DashboardHeader({ 
  domain, 
  lastUpdated, 
  isLoading, 
  onRefresh, 
  onLogout 
}: { 
  domain: string; 
  lastUpdated: Date | null; 
  isLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <motion.div
            className="absolute -inset-1 rounded-xl border border-emerald-400/50"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            BRON Dashboard
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-xs">
              Connected
            </Badge>
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-3.5 h-3.5" />
            <span>{domain}</span>
            {lastUpdated && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span>Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-muted-foreground hover:text-destructive"
        >
          Disconnect
        </Button>
      </div>
    </div>
  );
}

// Authority Section with key metrics
function AuthoritySection({ authority, isLoading }: { authority: any; isLoading: boolean }) {
  const metrics = [
    { label: "Domain Authority", value: authority?.domainAuthority || 0, icon: Award, color: "from-amber-400 to-orange-500", bgColor: "from-amber-500/20 to-orange-500/10" },
    { label: "Domain Rating", value: authority?.domainRating || 0, icon: TrendingUp, color: "from-violet-400 to-purple-500", bgColor: "from-violet-500/20 to-purple-500/10" },
    { label: "Referring Domains", value: authority?.referringDomains || 0, icon: Users, color: "from-cyan-400 to-blue-500", bgColor: "from-cyan-500/20 to-blue-500/10" },
    { label: "Total Backlinks", value: authority?.totalBacklinks || 0, icon: Link2, color: "from-emerald-400 to-green-500", bgColor: "from-emerald-500/20 to-green-500/10" },
    { label: "Trust Flow", value: authority?.trustFlow || 0, icon: CheckCircle2, color: "from-teal-400 to-cyan-500", bgColor: "from-teal-500/20 to-cyan-500/10" },
    { label: "Organic Keywords", value: authority?.organicKeywords || 0, icon: Search, color: "from-rose-400 to-pink-500", bgColor: "from-rose-500/20 to-pink-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${metric.bgColor}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <CardContent className="p-4 relative">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                      <metric.icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium truncate">{metric.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Quick Actions Section
function QuickActionsSection({ 
  loadingStates, 
  onCrawl, 
  onCategorize, 
  onGenerateContent, 
  onGenerateFaq,
  subscription,
  systemHealth,
}: { 
  loadingStates: Record<string, boolean>;
  onCrawl: () => void;
  onCategorize: () => void;
  onGenerateContent: () => void;
  onGenerateFaq: () => void;
  subscription: any;
  systemHealth: any;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Crawl Domain */}
      <Card className="border-border/50 bg-gradient-to-br from-background to-cyan-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-cyan-500" />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onCrawl}
              disabled={loadingStates.crawl}
              className="gap-1.5"
            >
              {loadingStates.crawl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Crawl
            </Button>
          </div>
          <h3 className="font-semibold text-sm">Crawl Domain</h3>
          <p className="text-xs text-muted-foreground mt-1">Scan and index all pages</p>
        </CardContent>
      </Card>

      {/* Categorize Domain */}
      <Card className="border-border/50 bg-gradient-to-br from-background to-violet-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400/20 to-purple-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-violet-500" />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onCategorize}
              disabled={loadingStates.categorization}
              className="gap-1.5"
            >
              {loadingStates.categorization ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Analyze
            </Button>
          </div>
          <h3 className="font-semibold text-sm">Categorize Domain</h3>
          <p className="text-xs text-muted-foreground mt-1">Analyze niche and category</p>
        </CardContent>
      </Card>

      {/* Generate Content */}
      <Card className="border-border/50 bg-gradient-to-br from-background to-emerald-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400/20 to-green-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onGenerateContent}
              disabled={loadingStates.content}
              className="gap-1.5"
            >
              {loadingStates.content ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Generate
            </Button>
          </div>
          <h3 className="font-semibold text-sm">Generate Content</h3>
          <p className="text-xs text-muted-foreground mt-1">AI-powered article creation</p>
        </CardContent>
      </Card>

      {/* Generate FAQ */}
      <Card className="border-border/50 bg-gradient-to-br from-background to-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-500" />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onGenerateFaq}
              disabled={loadingStates.faq}
              className="gap-1.5"
            >
              {loadingStates.faq ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Generate
            </Button>
          </div>
          <h3 className="font-semibold text-sm">Generate FAQ</h3>
          <p className="text-xs text-muted-foreground mt-1">Create FAQ sections</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Backlinks Panel
function BacklinksPanel({ backlinks, isLoading, onRefresh }: { backlinks: any[]; isLoading?: boolean; onRefresh: () => void }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-500" />
            Backlinks
          </CardTitle>
          <CardDescription>{backlinks.length} total backlinks</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {backlinks.length === 0 && !isLoading ? (
          <EmptyState message="No backlinks data available yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Source</th>
                  <th className="pb-3 font-medium text-muted-foreground">Anchor</th>
                  <th className="pb-3 font-medium text-muted-foreground text-center">DA</th>
                  <th className="pb-3 font-medium text-muted-foreground text-center">DR</th>
                  <th className="pb-3 font-medium text-muted-foreground">Type</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-3"><Skeleton className="h-4 w-8 mx-auto" /></td>
                      <td className="py-3"><Skeleton className="h-4 w-8 mx-auto" /></td>
                      <td className="py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  backlinks.slice(0, 10).map((link, index) => (
                    <motion.tr
                      key={link.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3">
                        <a href={link.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate max-w-[200px] block">
                          {link.sourceDomain}
                        </a>
                      </td>
                      <td className="py-3 text-muted-foreground">{link.anchorText}</td>
                      <td className="py-3 text-center">
                        <MetricBadge value={link.daScore} />
                      </td>
                      <td className="py-3 text-center">
                        <MetricBadge value={link.drScore} />
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className={link.dofollow ? "text-emerald-500 border-emerald-500/30" : "text-muted-foreground"}>
                          {link.dofollow ? "Dofollow" : "Nofollow"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {format(new Date(link.createdAt), "MMM d")}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Rankings Panel
function RankingsPanel({ rankings, isLoading, onRefresh }: { rankings: any[]; isLoading?: boolean; onRefresh: () => void }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            Keyword Rankings
          </CardTitle>
          <CardDescription>{rankings.length} tracked keywords</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {rankings.length === 0 && !isLoading ? (
          <EmptyState message="No ranking data available yet" />
        ) : (
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))
            ) : (
              rankings.slice(0, 10).map((rank, index) => {
                const change = rank.previousPosition ? rank.previousPosition - rank.position : 0;
                return (
                  <motion.div
                    key={rank.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center font-bold text-violet-500">
                      #{rank.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{rank.keyword}</div>
                      <div className="text-xs text-muted-foreground truncate">{rank.url}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {change !== 0 && (
                        <div className={`flex items-center gap-0.5 text-xs ${change > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {Math.abs(change)}
                        </div>
                      )}
                      {rank.searchVolume && (
                        <Badge variant="secondary" className="text-xs">{rank.searchVolume.toLocaleString()} vol</Badge>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Keywords Panel
function KeywordsPanel({ keywords, isLoading, onRefresh }: { keywords: any[]; isLoading?: boolean; onRefresh: () => void }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-500" />
            Keyword Clusters
          </CardTitle>
          <CardDescription>{keywords.length} keywords tracked</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {keywords.length === 0 && !isLoading ? (
          <EmptyState message="No keyword data available yet" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : (
              keywords.slice(0, 10).map((kw, index) => (
                <motion.div
                  key={kw.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{kw.keyword}</span>
                    {kw.intent && (
                      <Badge variant="outline" className="text-[10px]">{kw.intent}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {kw.volume && <span>{kw.volume.toLocaleString()} vol</span>}
                    {kw.difficulty && <span>KD: {kw.difficulty}</span>}
                    <span>{kw.articles} articles</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Articles Panel
function ArticlesPanel({ articles, isLoading, onRefresh }: { articles: any[]; isLoading?: boolean; onRefresh: () => void }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            Published Articles
          </CardTitle>
          <CardDescription>{articles.length} total articles</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {articles.length === 0 && !isLoading ? (
          <EmptyState message="No articles published yet. Use 'Generate Content' to create articles." />
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : (
                articles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm line-clamp-2">{article.title}</h4>
                        <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${
                          article.status === "published" ? "text-emerald-500 border-emerald-500/30" :
                          article.status === "pending" ? "text-amber-500 border-amber-500/30" :
                          "text-blue-500 border-blue-500/30"
                        }`}>
                          {article.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(article.publishedAt), "MMM d, yyyy")}</span>
                        {article.daScore && (
                          <>
                            <span className="text-muted-foreground/50">•</span>
                            <span>DA: {article.daScore}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {article.url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => window.open(article.url, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// Deep Links Panel
function DeepLinksPanel({ deepLinks, isLoading, onRefresh }: { deepLinks: any[]; isLoading?: boolean; onRefresh: () => void }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-500" />
            Deep Links
          </CardTitle>
          <CardDescription>{deepLinks.length} internal links created</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {deepLinks.length === 0 && !isLoading ? (
          <EmptyState message="No deep links created yet" />
        ) : (
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))
            ) : (
              deepLinks.slice(0, 10).map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate text-muted-foreground">{link.sourceUrl}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                    <span className="truncate font-medium">{link.targetUrl}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>Anchor: "{link.anchorText}"</span>
                    {link.clicks !== undefined && <span>{link.clicks} clicks</span>}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Domain Profile Card
function DomainProfileCard({ profile, isLoading }: { profile: any; isLoading: boolean }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-500" />
          Domain Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : profile ? (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Domain</span>
              <span className="font-medium">{profile.domain}</span>
            </div>
            {profile.category && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="secondary">{profile.category}</Badge>
              </div>
            )}
            {profile.language && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language</span>
                <span>{profile.language}</span>
              </div>
            )}
            {profile.pagesIndexed !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pages Indexed</span>
                <span>{profile.pagesIndexed.toLocaleString()}</span>
              </div>
            )}
            {profile.lastCrawled && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Crawled</span>
                <span>{formatDistanceToNow(new Date(profile.lastCrawled), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        ) : (
          <EmptyState message="No domain profile available. Run a crawl to analyze." />
        )}
      </CardContent>
    </Card>
  );
}

// Tasks Card
function TasksCard({ tasks, isLoading }: { tasks: any[]; isLoading: boolean }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-500" />
          Active Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg bg-secondary/30">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState message="No active tasks. Start a crawl or content generation." />
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm capitalize">{task.type}</span>
                  <Badge variant="outline" className={`text-xs ${
                    task.status === "completed" ? "text-emerald-500 border-emerald-500/30" :
                    task.status === "running" ? "text-blue-500 border-blue-500/30" :
                    task.status === "failed" ? "text-rose-500 border-rose-500/30" :
                    "text-muted-foreground"
                  }`}>
                    {task.status}
                  </Badge>
                </div>
                {task.progress !== undefined && (
                  <Progress value={task.progress} className="h-1.5" />
                )}
                {task.error && (
                  <p className="text-xs text-rose-500 mt-1">{task.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Metric Badge
function MetricBadge({ value }: { value: number }) {
  const color = value >= 70 ? "text-emerald-500" : value >= 40 ? "text-amber-500" : "text-muted-foreground";
  return <span className={`font-semibold ${color}`}>{value}</span>;
}

// Empty State
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default BronDashboard;
