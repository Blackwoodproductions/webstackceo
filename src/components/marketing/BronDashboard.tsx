import { motion } from "framer-motion";
import { 
  Link2, TrendingUp, Award, Zap, FileText, ExternalLink, 
  RefreshCw, Clock, CheckCircle2, AlertCircle, ArrowUpRight,
  ArrowDownRight, Minus, Target, BarChart3, Globe, Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useBronApi, BronArticle, BronKeywordCluster, BronBacklink } from "@/hooks/use-bron-api";
import { format, formatDistanceToNow } from "date-fns";

interface BronDashboardProps {
  domain: string;
  onLogout: () => void;
}

export function BronDashboard({ domain, onLogout }: BronDashboardProps) {
  const { articles, stats, keywordClusters, backlinks, isLoading, error, refetch, lastUpdated } = useBronApi(domain);

  const statCards = [
    { 
      label: "Total Articles", 
      value: stats.totalArticles, 
      icon: FileText, 
      color: "from-cyan-400 to-blue-500",
      bgColor: "from-cyan-500/20 to-blue-500/10"
    },
    { 
      label: "Published", 
      value: stats.publishedArticles, 
      icon: CheckCircle2, 
      color: "from-emerald-400 to-green-500",
      bgColor: "from-emerald-500/20 to-green-500/10"
    },
    { 
      label: "Total Backlinks", 
      value: stats.totalBacklinks, 
      icon: Link2, 
      color: "from-violet-400 to-purple-500",
      bgColor: "from-violet-500/20 to-purple-500/10"
    },
    { 
      label: "Avg. DA", 
      value: stats.averageDA, 
      icon: Award, 
      color: "from-amber-400 to-orange-500",
      bgColor: "from-amber-500/20 to-orange-500/10"
    },
    { 
      label: "Avg. DR", 
      value: stats.averageDR, 
      icon: TrendingUp, 
      color: "from-rose-400 to-pink-500",
      bgColor: "from-rose-500/20 to-pink-500/10"
    },
    { 
      label: "Deep Links", 
      value: stats.deepLinks, 
      icon: Target, 
      color: "from-teal-400 to-cyan-500",
      bgColor: "from-teal-500/20 to-cyan-500/10"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
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
            onClick={refetch}
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

      {/* Error Banner */}
      {error && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Using demo data. Live API returned: {error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${stat.bgColor}`}>
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
                      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Articles */}
        <ArticlesPanel articles={articles} isLoading={isLoading} />
        
        {/* Keyword Clusters */}
        <KeywordClustersPanel clusters={keywordClusters} isLoading={isLoading} />
      </div>

      {/* Backlinks Table */}
      <BacklinksPanel backlinks={backlinks} isLoading={isLoading} />
    </motion.div>
  );
}

// Articles Panel Component
function ArticlesPanel({ articles, isLoading }: { articles: BronArticle[]; isLoading: boolean }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-500" />
          Recent Articles
          <Badge variant="secondary" className="ml-auto text-xs">{articles.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px]">
          <div className="px-6 pb-6 space-y-3">
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
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm truncate">{article.title}</h4>
                      <StatusBadge status={article.status} />
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
                    {article.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {article.keywords.slice(0, 3).map((kw, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    )}
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
      </CardContent>
    </Card>
  );
}

// Keyword Clusters Panel Component
function KeywordClustersPanel({ clusters, isLoading }: { clusters: BronKeywordCluster[]; isLoading: boolean }) {
  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up": return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
      case "down": return <ArrowDownRight className="w-4 h-4 text-rose-500" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-500" />
          Keyword Clusters
          <Badge variant="secondary" className="ml-auto text-xs">{clusters.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px]">
          <div className="px-6 pb-6 space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))
            ) : (
              clusters.map((cluster, index) => (
                <motion.div
                  key={cluster.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{cluster.name}</h4>
                      {getTrendIcon(cluster.trend)}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {cluster.keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-500/10 border-violet-500/30">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{cluster.articleCount}</div>
                    <div className="text-xs text-muted-foreground">articles</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">#{Math.round(cluster.avgPosition)}</div>
                    <div className="text-xs text-muted-foreground">avg pos</div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Backlinks Panel Component
function BacklinksPanel({ backlinks, isLoading }: { backlinks: BronBacklink[]; isLoading: boolean }) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="w-4 h-4 text-emerald-500" />
          Backlinks
          <Badge variant="secondary" className="ml-auto text-xs">{backlinks.length} total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left">
                <th className="pb-3 font-medium text-muted-foreground">Source</th>
                <th className="pb-3 font-medium text-muted-foreground">Anchor</th>
                <th className="pb-3 font-medium text-muted-foreground text-center">DA</th>
                <th className="pb-3 font-medium text-muted-foreground text-center">DR</th>
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
                    <td className="py-3"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="py-3"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                backlinks.map((link, index) => (
                  <motion.tr
                    key={link.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center">
                          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <a
                          href={link.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary truncate max-w-[200px]"
                        >
                          {link.sourceDomain}
                        </a>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">{link.anchorText}</td>
                    <td className="py-3 text-center">
                      <span className={`font-semibold ${link.daScore >= 70 ? "text-emerald-500" : link.daScore >= 40 ? "text-amber-500" : "text-muted-foreground"}`}>
                        {link.daScore}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-semibold ${link.drScore >= 70 ? "text-emerald-500" : link.drScore >= 40 ? "text-amber-500" : "text-muted-foreground"}`}>
                        {link.drScore}
                      </span>
                    </td>
                    <td className="py-3">
                      <BacklinkStatusBadge status={link.status} />
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
      </CardContent>
    </Card>
  );
}

// Status Badge Components
function StatusBadge({ status }: { status: "pending" | "published" | "scheduled" }) {
  const config = {
    published: { label: "Live", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
    pending: { label: "Pending", className: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
    scheduled: { label: "Scheduled", className: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  };
  const { label, className } = config[status] || config.pending;
  return <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${className}`}>{label}</Badge>;
}

function BacklinkStatusBadge({ status }: { status: "active" | "pending" | "lost" }) {
  const config = {
    active: { label: "Active", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
    pending: { label: "Pending", className: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
    lost: { label: "Lost", className: "bg-rose-500/10 text-rose-500 border-rose-500/30" },
  };
  const { label, className } = config[status] || config.pending;
  return <Badge variant="outline" className={`text-xs ${className}`}>{label}</Badge>;
}

export default BronDashboard;
