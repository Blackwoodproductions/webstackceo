import { motion } from "framer-motion";
import { 
  Link2, TrendingUp, Zap, FileText, ExternalLink, 
  RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight,
  Target, Globe, Sparkles, Search, Layers, 
  FileBarChart, Activity, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBronApi, BronBacklink, BronRanking, BronKeyword, BronArticle, BronDeepLink, BronCluster, BronCampaign, BronReport } from "@/hooks/use-bron-api";
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
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3 text-rose-400 backdrop-blur-sm"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Some data failed to load</p>
            <p className="text-sm mt-1 opacity-80">{firstError[0]}: {firstError[1]}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={refetchAll} className="text-rose-400 hover:text-rose-300">
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </motion.div>
      )}

      {/* Stats Overview - Only show if we have stats data */}
      {(data.stats || isLoading) && (
        <StatsSection stats={data.stats} isLoading={isLoading} />
      )}

      {/* Profile Card */}
      {(data.profile || isLoading) && (
        <ProfileSection profile={data.profile} isLoading={isLoading} />
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="backlinks" className="space-y-4">
        <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full bg-secondary/30 backdrop-blur-sm border border-border/50 p-1 rounded-xl">
          <TabsTrigger value="backlinks" className="gap-1.5 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg">
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">Backlinks</span>
          </TabsTrigger>
          <TabsTrigger value="articles" className="gap-1.5 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 rounded-lg">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Articles</span>
          </TabsTrigger>
          <TabsTrigger value="rankings" className="gap-1.5 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-lg">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Rankings</span>
          </TabsTrigger>
          <TabsTrigger value="keywords" className="gap-1.5 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 rounded-lg">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Keywords</span>
          </TabsTrigger>
          <TabsTrigger value="clusters" className="gap-1.5 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400 rounded-lg">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Clusters</span>
          </TabsTrigger>
          <TabsTrigger value="deeplinks" className="gap-1.5 data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400 rounded-lg">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Deep Links</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 rounded-lg">
            <FileBarChart className="w-4 h-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backlinks">
          <BacklinksPanel 
            backlinks={data.backlinks} 
            isLoading={loadingStates.backlinks}
            onRefresh={() => refetch("backlinks")}
          />
        </TabsContent>

        <TabsContent value="articles">
          <ArticlesPanel 
            articles={data.articles} 
            isLoading={loadingStates.articles}
            onRefresh={() => refetch("articles")}
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

        <TabsContent value="deeplinks">
          <DeepLinksPanel 
            deepLinks={data.deepLinks} 
            isLoading={loadingStates.deeplinks}
            onRefresh={() => refetch("deeplinks")}
          />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsPanel 
            reports={data.reports} 
            isLoading={loadingStates.reports}
            onRefresh={() => refetch("reports")}
          />
        </TabsContent>
      </Tabs>

      {/* Campaigns Section */}
      {data.campaigns.length > 0 && (
        <CampaignsSection campaigns={data.campaigns} isLoading={isLoading} />
      )}

      {/* No Data State */}
      {!isLoading && !hasAnyData && !hasAnyError && (
        <Card className="border-dashed border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-green-500/20 flex items-center justify-center mx-auto mb-4 relative">
              <Sparkles className="w-8 h-8 text-emerald-500" />
              <motion.div
                className="absolute inset-0 rounded-2xl border border-emerald-500/50"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <h3 className="text-lg font-semibold mb-2">No BRON Data Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              BRON is connected but no data is available for <span className="text-emerald-400 font-medium">{domain}</span> yet. 
              Data will appear here once campaigns are active.
            </p>
            <Button onClick={refetchAll} className="mt-4 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30" variant="outline">
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
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
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
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs">
              Connected
            </Badge>
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-3.5 h-3.5" />
            <span className="text-emerald-400 font-medium">{domain}</span>
            {lastUpdated && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <Clock className="w-3 h-3" />
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
          className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
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

// Stats Overview Section - Only real data from API
function StatsSection({ stats, isLoading }: { stats: any; isLoading: boolean }) {
  const metrics = [
    { label: "Total Articles", value: stats?.totalArticles || 0, icon: FileText, color: "from-indigo-400 to-violet-500" },
    { label: "Published", value: stats?.publishedArticles || 0, icon: Activity, color: "from-emerald-400 to-green-500" },
    { label: "Pending", value: stats?.pendingArticles || 0, icon: Clock, color: "from-amber-400 to-orange-500" },
    { label: "Total Backlinks", value: stats?.totalBacklinks || 0, icon: Link2, color: "from-cyan-400 to-blue-500" },
    { label: "Active Backlinks", value: stats?.activeBacklinks || 0, icon: Zap, color: "from-emerald-400 to-teal-500" },
    { label: "Keywords", value: stats?.totalKeywords || 0, icon: Search, color: "from-violet-400 to-purple-500" },
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
          <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-secondary/20 backdrop-blur-sm group hover:border-primary/30 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 relative">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${metric.color} flex items-center justify-center shadow-lg`}>
                      <metric.icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium truncate">{metric.label}</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {metric.value.toLocaleString()}
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

// Profile Section
function ProfileSection({ profile, isLoading }: { profile: any; isLoading: boolean }) {
  if (!profile && !isLoading) return null;

  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-500" />
          Domain Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        ) : profile ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Domain</p>
              <p className="font-medium text-emerald-400">{profile.domain}</p>
            </div>
            {profile.category && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Category</p>
                <Badge variant="secondary" className="bg-secondary/50">{profile.category}</Badge>
              </div>
            )}
            {profile.language && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Language</p>
                <p className="font-medium">{profile.language}</p>
              </div>
            )}
            {profile.country && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Country</p>
                <p className="font-medium">{profile.country}</p>
              </div>
            )}
            {profile.pagesIndexed !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pages Indexed</p>
                <p className="font-medium">{profile.pagesIndexed.toLocaleString()}</p>
              </div>
            )}
            {profile.lastCrawled && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Crawled</p>
                <p className="font-medium">{formatDistanceToNow(new Date(profile.lastCrawled), { addSuffix: true })}</p>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
        <Sparkles className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

// Backlinks Panel
function BacklinksPanel({ backlinks, isLoading, onRefresh }: { backlinks: BronBacklink[]; isLoading?: boolean; onRefresh: () => void }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-emerald-500/5 backdrop-blur-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-500" />
            Backlinks
          </CardTitle>
          <CardDescription>{backlinks.length} total backlinks</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading} className="text-emerald-400 hover:text-emerald-300">
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
                <tr className="border-b border-emerald-500/20 text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Source</th>
                  <th className="pb-3 font-medium text-muted-foreground">Anchor</th>
                  <th className="pb-3 font-medium text-muted-foreground">Type</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="py-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  backlinks.slice(0, 20).map((link, index) => (
                    <motion.tr
                      key={link.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-border/30 hover:bg-emerald-500/5 transition-colors"
                    >
                      <td className="py-3">
                        <a 
                          href={link.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-foreground hover:text-emerald-400 transition-colors"
                        >
                          <span className="truncate max-w-[180px]">{link.sourceDomain}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                        </a>
                      </td>
                      <td className="py-3 max-w-[120px] truncate text-muted-foreground">{link.anchorText}</td>
                      <td className="py-3">
                        <Badge variant={link.dofollow ? "default" : "secondary"} className={`text-xs ${link.dofollow ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ''}`}>
                          {link.dofollow ? "Dofollow" : "Nofollow"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-xs capitalize">{link.status}</Badge>
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

// Articles Panel
function ArticlesPanel({ articles, isLoading, onRefresh }: { articles: BronArticle[]; isLoading?: boolean; onRefresh: () => void }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-indigo-500/5 backdrop-blur-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            Articles
          </CardTitle>
          <CardDescription>{articles.length} articles created</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading} className="text-indigo-400 hover:text-indigo-300">
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
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-indigo-500/10 transition-colors border border-transparent hover:border-indigo-500/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium hover:text-indigo-400 transition-colors flex items-center gap-1"
                      >
                        <span className="truncate">{article.title}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                      </a>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="text-indigo-400">{article.domain}</span>
                        <span>•</span>
                        <span>{format(new Date(article.publishedAt), "MMM d, yyyy")}</span>
                        {article.anchorText && (
                          <>
                            <span>•</span>
                            <span>"{article.anchorText}"</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      className={`text-xs flex-shrink-0 capitalize ${
                        article.status === "published" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}
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

// Rankings Panel
function RankingsPanel({ rankings, isLoading, onRefresh }: { rankings: BronRanking[]; isLoading?: boolean; onRefresh: () => void }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-blue-500/5 backdrop-blur-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Keyword Rankings
          </CardTitle>
          <CardDescription>{rankings.length} tracked keywords</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading} className="text-blue-400 hover:text-blue-300">
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
                    className="p-3 rounded-lg bg-secondary/30 hover:bg-blue-500/10 transition-colors border border-transparent hover:border-blue-500/20 flex items-center justify-between"
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
                        <span className="text-lg font-bold text-blue-400">#{rank.position}</span>
                        {change !== 0 && (
                          <span className={`flex items-center text-xs ${change > 0 ? "text-emerald-400" : "text-rose-400"}`}>
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
    <Card className="border-border/50 bg-gradient-to-br from-background to-amber-500/5 backdrop-blur-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-500" />
            Keywords
          </CardTitle>
          <CardDescription>{keywords.length} keywords tracked</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading} className="text-amber-400 hover:text-amber-300">
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
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-amber-500/10 transition-colors border border-transparent hover:border-amber-500/20"
                >
                  <p className="font-medium truncate">{kw.keyword}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {kw.volume && <span className="text-amber-400">{kw.volume.toLocaleString()} vol</span>}
                    {kw.cluster && <Badge variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/20">{kw.cluster}</Badge>}
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
    <Card className="border-border/50 bg-gradient-to-br from-background to-violet-500/5 backdrop-blur-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-500" />
            Keyword Clusters
          </CardTitle>
          <CardDescription>{clusters.length} clusters</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading} className="text-violet-400 hover:text-violet-300">
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
                  className="p-4 rounded-lg bg-secondary/30 hover:bg-violet-500/10 transition-colors border border-transparent hover:border-violet-500/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-violet-400">{cluster.name}</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{cluster.articles} articles</span>
                      {cluster.avgPosition && (
                        <Badge variant="outline" className="bg-violet-500/10 border-violet-500/20">Avg #{cluster.avgPosition}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cluster.keywords.slice(0, 8).map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-xs bg-secondary/50">
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

// Deep Links Panel
function DeepLinksPanel({ deepLinks, isLoading, onRefresh }: { deepLinks: BronDeepLink[]; isLoading?: boolean; onRefresh: () => void }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-teal-500/5 backdrop-blur-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-500" />
            Deep Links
          </CardTitle>
          <CardDescription>{deepLinks.length} internal links created</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading} className="text-teal-400 hover:text-teal-300">
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
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-teal-500/10 transition-colors border border-transparent hover:border-teal-500/20"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate text-muted-foreground max-w-[200px]">{link.sourceUrl}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                    <span className="truncate font-medium text-teal-400 max-w-[200px]">{link.targetUrl}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>Anchor: "{link.anchorText}"</span>
                    {link.clicks !== undefined && <span className="text-teal-400">{link.clicks} clicks</span>}
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

// Reports Panel
function ReportsPanel({ reports, isLoading, onRefresh }: { reports: BronReport[]; isLoading?: boolean; onRefresh: () => void }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-cyan-500/5 backdrop-blur-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-cyan-500" />
            Reports
          </CardTitle>
          <CardDescription>{reports.length} reports available</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading} className="text-cyan-400 hover:text-cyan-300">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {reports.length === 0 && !isLoading ? (
          <EmptyState message="No reports available yet" />
        ) : (
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))
            ) : (
              reports.slice(0, 10).map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-cyan-500/10 transition-colors border border-transparent hover:border-cyan-500/20 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{report.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] bg-cyan-500/10 border-cyan-500/20 capitalize">{report.type}</Badge>
                      <span>{format(new Date(report.createdAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  {report.url && (
                    <Button variant="ghost" size="sm" asChild className="text-cyan-400 hover:text-cyan-300">
                      <a href={report.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
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
function CampaignsSection({ campaigns, isLoading }: { campaigns: BronCampaign[]; isLoading: boolean }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-amber-500/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          Active Campaigns
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-lg bg-secondary/30 hover:bg-amber-500/10 transition-colors border border-transparent hover:border-amber-500/20"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold truncate">{campaign.name}</h4>
                <Badge 
                  variant="outline"
                  className={`text-xs capitalize ${
                    campaign.status === "active" 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                      : campaign.status === "completed"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {campaign.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Articles</p>
                  <p className="font-semibold text-amber-400">{campaign.articlesCreated}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Backlinks</p>
                  <p className="font-semibold text-emerald-400">{campaign.backlinksBuilt}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                Started {format(new Date(campaign.startDate), "MMM d, yyyy")}
                {campaign.endDate && ` • Ended ${format(new Date(campaign.endDate), "MMM d, yyyy")}`}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default BronDashboard;
