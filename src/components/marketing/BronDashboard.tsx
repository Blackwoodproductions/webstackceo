import { motion } from "framer-motion";
import { 
  Link2, TrendingUp, Award, Zap, FileText, ExternalLink, 
  RefreshCw, Clock, CheckCircle2, AlertCircle, ArrowUpRight,
  ArrowDownRight, Minus, Target, BarChart3, Globe, Sparkles,
  Activity, Users, Search, Layers, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBronApi, BronBacklink, BronRanking, BronKeyword, BronArticle, BronDeepLink, BronCluster, BronStats } from "@/hooks/use-bron-api";
import { format, formatDistanceToNow } from "date-fns";

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
    hasAnyData,
  } = useBronApi(domain);

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
          <Button variant="ghost" size="sm" onClick={refetchAll} className="text-rose-500">
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Stats Overview */}
      <StatsSection stats={data.stats} authority={data.authority} isLoading={isLoading} />

      {/* Authority & Profile Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AuthoritySection authority={data.authority} isLoading={isLoading} />
        <ProfileSection profile={data.profile} isLoading={isLoading} />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="backlinks" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full max-w-3xl">
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
          <TabsTrigger value="clusters" className="gap-1.5">
            <Target className="w-4 h-4" />
            Clusters
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

        <TabsContent value="clusters">
          <ClustersPanel 
            clusters={data.clusters} 
            isLoading={loadingStates.clusters}
            onRefresh={() => refetch("clusters")}
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

      {/* Campaigns */}
      {data.campaigns.length > 0 && (
        <CampaignsSection campaigns={data.campaigns} isLoading={isLoading} />
      )}

      {/* No Data State */}
      {!isLoading && !hasAnyData && !hasAnyError && (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No BRON Data Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              BRON is connected but no data is available for {domain} yet. 
              Data will appear here once campaigns are active.
            </p>
            <Button onClick={refetchAll} className="mt-4" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      )}
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
          onClick={() => window.open("https://dashdev.imagehosting.space/", "_blank")}
          className="gap-1.5"
        >
          <ExternalLink className="w-4 h-4" />
          Open BRON
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
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

// Stats Overview Section
function StatsSection({ stats, authority, isLoading }: { stats: BronStats | null; authority: any; isLoading: boolean }) {
  const metrics = [
    { label: "Total Articles", value: stats?.totalArticles || 0, icon: FileText, color: "from-blue-400 to-indigo-500" },
    { label: "Published", value: stats?.publishedArticles || 0, icon: CheckCircle2, color: "from-emerald-400 to-green-500" },
    { label: "Total Backlinks", value: stats?.totalBacklinks || authority?.totalBacklinks || 0, icon: Link2, color: "from-violet-400 to-purple-500" },
    { label: "Active Backlinks", value: stats?.activeBacklinks || 0, icon: Activity, color: "from-cyan-400 to-blue-500" },
    { label: "Keywords", value: stats?.totalKeywords || 0, icon: Search, color: "from-amber-400 to-orange-500" },
    { label: "Avg DA/DR", value: `${stats?.avgDa || authority?.domainAuthority || 0}/${stats?.avgDr || authority?.domainRating || 0}`, icon: Award, color: "from-rose-400 to-pink-500" },
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
          <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-secondary/20">
            <CardContent className="p-4">
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
                  <div className="text-2xl font-bold">
                    {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Authority Section
function AuthoritySection({ authority, isLoading }: { authority: any; isLoading: boolean }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          Authority Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : authority ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Domain Authority</p>
              <p className="text-2xl font-bold text-amber-500">{authority.domainAuthority}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Domain Rating</p>
              <p className="text-2xl font-bold text-violet-500">{authority.domainRating}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Referring Domains</p>
              <p className="text-xl font-semibold">{authority.referringDomains?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Backlinks</p>
              <p className="text-xl font-semibold">{authority.totalBacklinks?.toLocaleString() || 0}</p>
            </div>
            {authority.trustFlow !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Trust Flow</p>
                <p className="text-xl font-semibold">{authority.trustFlow}</p>
              </div>
            )}
            {authority.organicKeywords !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Organic Keywords</p>
                <p className="text-xl font-semibold">{authority.organicKeywords?.toLocaleString()}</p>
              </div>
            )}
          </div>
        ) : (
          <EmptyState message="No authority data available" />
        )}
      </CardContent>
    </Card>
  );
}

// Profile Section
function ProfileSection({ profile, isLoading }: { profile: any; isLoading: boolean }) {
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
            {profile.country && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Country</span>
                <span>{profile.country}</span>
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
          <EmptyState message="No domain profile available" />
        )}
      </CardContent>
    </Card>
  );
}

// Backlinks Panel
function BacklinksPanel({ backlinks, isLoading, onRefresh }: { backlinks: BronBacklink[]; isLoading?: boolean; onRefresh: () => void }) {
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
                  backlinks.slice(0, 15).map((link, index) => (
                    <motion.tr
                      key={link.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3">
                        <a 
                          href={link.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-foreground hover:text-emerald-500 transition-colors"
                        >
                          <span className="truncate max-w-[180px]">{link.sourceDomain}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                        </a>
                      </td>
                      <td className="py-3 max-w-[120px] truncate text-muted-foreground">{link.anchorText}</td>
                      <td className="py-3 text-center"><MetricBadge value={link.daScore} /></td>
                      <td className="py-3 text-center"><MetricBadge value={link.drScore} /></td>
                      <td className="py-3">
                        <Badge variant={link.dofollow ? "default" : "secondary"} className="text-xs">
                          {link.dofollow ? "Dofollow" : "Nofollow"}
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-muted-foreground text-xs">
                        {format(new Date(link.createdAt), "MMM d, yyyy")}
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
function RankingsPanel({ rankings, isLoading, onRefresh }: { rankings: BronRanking[]; isLoading?: boolean; onRefresh: () => void }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
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
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))
            ) : (
              rankings.slice(0, 15).map((rank, index) => {
                const change = rank.previousPosition ? rank.previousPosition - rank.position : 0;
                return (
                  <motion.div
                    key={rank.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{rank.keyword}</p>
                      <p className="text-xs text-muted-foreground truncate">{rank.url}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {rank.searchVolume && (
                        <span className="text-xs text-muted-foreground">{rank.searchVolume.toLocaleString()} vol</span>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold">#{rank.position}</span>
                        {change !== 0 && (
                          <span className={`flex items-center text-xs ${change > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(change)}
                          </span>
                        )}
                      </div>
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
function KeywordsPanel({ keywords, isLoading, onRefresh }: { keywords: BronKeyword[]; isLoading?: boolean; onRefresh: () => void }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-500" />
            Keywords
          </CardTitle>
          <CardDescription>{keywords.length} keywords tracked</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {keywords.length === 0 && !isLoading ? (
          <EmptyState message="No keywords data available yet" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))
            ) : (
              keywords.slice(0, 20).map((kw, index) => (
                <motion.div
                  key={kw.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <p className="font-medium truncate">{kw.keyword}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {kw.volume && <span>{kw.volume.toLocaleString()} vol</span>}
                    {kw.difficulty && <span>KD: {kw.difficulty}</span>}
                    {kw.cluster && <Badge variant="outline" className="text-[10px]">{kw.cluster}</Badge>}
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

// Clusters Panel
function ClustersPanel({ clusters, isLoading, onRefresh }: { clusters: BronCluster[]; isLoading?: boolean; onRefresh: () => void }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-500" />
            Keyword Clusters
          </CardTitle>
          <CardDescription>{clusters.length} clusters</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {clusters.length === 0 && !isLoading ? (
          <EmptyState message="No keyword clusters available yet" />
        ) : (
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg bg-secondary/30">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            ) : (
              clusters.slice(0, 10).map((cluster, index) => (
                <motion.div
                  key={cluster.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{cluster.name}</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{cluster.articles} articles</span>
                      {cluster.avgPosition && (
                        <Badge variant="outline">Avg #{cluster.avgPosition}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cluster.keywords.slice(0, 8).map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                    {cluster.keywords.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{cluster.keywords.length - 8} more
                      </Badge>
                    )}
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
function ArticlesPanel({ articles, isLoading, onRefresh }: { articles: BronArticle[]; isLoading?: boolean; onRefresh: () => void }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            Articles
          </CardTitle>
          <CardDescription>{articles.length} articles created</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {articles.length === 0 && !isLoading ? (
          <EmptyState message="No articles created yet" />
        ) : (
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : (
              articles.slice(0, 15).map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium hover:text-emerald-500 transition-colors flex items-center gap-1"
                      >
                        <span className="truncate">{article.title}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                      </a>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{article.domain}</span>
                        <span>•</span>
                        <span>{format(new Date(article.publishedAt), "MMM d, yyyy")}</span>
                        {article.daScore && <span>DA: {article.daScore}</span>}
                      </div>
                    </div>
                    <Badge 
                      variant={article.status === "published" ? "default" : "secondary"}
                      className="text-xs flex-shrink-0"
                    >
                      {article.status}
                    </Badge>
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

// Deep Links Panel
function DeepLinksPanel({ deepLinks, isLoading, onRefresh }: { deepLinks: BronDeepLink[]; isLoading?: boolean; onRefresh: () => void }) {
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
              deepLinks.slice(0, 15).map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate text-muted-foreground max-w-[200px]">{link.sourceUrl}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                    <span className="truncate font-medium max-w-[200px]">{link.targetUrl}</span>
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

// Campaigns Section
function CampaignsSection({ campaigns, isLoading }: { campaigns: any[]; isLoading: boolean }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Active Campaigns
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {campaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-lg bg-secondary/30"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{campaign.name}</h4>
                <Badge 
                  variant={campaign.status === "active" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {campaign.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{campaign.articlesCreated} articles</span>
                <span>{campaign.backlinksBuilt} backlinks</span>
                <span>Started {format(new Date(campaign.startDate), "MMM d, yyyy")}</span>
              </div>
            </motion.div>
          ))}
        </div>
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
