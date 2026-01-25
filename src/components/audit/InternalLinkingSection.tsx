import { motion } from "framer-motion";
import { Link2, ArrowRight, ExternalLink, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface InternalLinkingMetrics {
  totalInternalLinks: number;
  totalExternalLinks: number;
  uniqueInternalLinks: number;
  uniqueExternalLinks: number;
  brokenLinks: number;
  orphanPages: number;
  avgLinkDepth: number;
  anchorTextDistribution: { text: string; count: number }[];
  linkEquityScore: number;
}

interface InternalLinkingSectionProps {
  metrics: InternalLinkingMetrics | null;
  isLoading?: boolean;
}

const getLinkScoreColor = (score: number) => {
  if (score >= 70) return "text-green-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
};

const getLinkScoreBg = (score: number) => {
  if (score >= 70) return "bg-green-500/20";
  if (score >= 40) return "bg-amber-500/20";
  return "bg-red-500/20";
};

export const InternalLinkingSection = ({ metrics, isLoading }: InternalLinkingSectionProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="p-6 rounded-2xl bg-card border border-border/50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Internal Linking Analysis
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!metrics) return null;

  const linkRatio = metrics.totalInternalLinks > 0 
    ? (metrics.totalInternalLinks / (metrics.totalInternalLinks + metrics.totalExternalLinks) * 100).toFixed(0)
    : 0;

  const stats = [
    { 
      label: "Internal Links", 
      value: metrics.totalInternalLinks, 
      unique: metrics.uniqueInternalLinks,
      icon: Link2, 
      color: "text-cyan-400",
      bg: "bg-cyan-500/20"
    },
    { 
      label: "External Links", 
      value: metrics.totalExternalLinks, 
      unique: metrics.uniqueExternalLinks,
      icon: ExternalLink, 
      color: "text-violet-400",
      bg: "bg-violet-500/20"
    },
    { 
      label: "Avg Link Depth", 
      value: metrics.avgLinkDepth.toFixed(1), 
      icon: ArrowRight, 
      color: "text-amber-400",
      bg: "bg-amber-500/20",
      status: metrics.avgLinkDepth <= 3 ? "pass" : "warning"
    },
    { 
      label: "Link Equity", 
      value: `${metrics.linkEquityScore}/100`, 
      icon: CheckCircle2, 
      color: getLinkScoreColor(metrics.linkEquityScore),
      bg: getLinkScoreBg(metrics.linkEquityScore)
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="p-6 rounded-2xl bg-card border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Internal Linking Analysis
          </h2>
          <div className="text-sm text-muted-foreground">
            Internal/External Ratio: <span className="font-semibold text-foreground">{linkRatio}%</span>
          </div>
        </div>

        {/* Broken Links Warning */}
        {metrics.brokenLinks > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3"
          >
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">{metrics.brokenLinks} Broken Link{metrics.brokenLinks > 1 ? 's' : ''} Detected</p>
              <p className="text-xs text-muted-foreground">Broken links hurt user experience and SEO. Fix or remove these links.</p>
            </div>
          </motion.div>
        )}

        {/* Orphan Pages Warning */}
        {metrics.orphanPages > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-400">{metrics.orphanPages} Orphan Page{metrics.orphanPages > 1 ? 's' : ''} Found</p>
              <p className="text-xs text-muted-foreground">Pages without internal links pointing to them are hard for search engines to discover.</p>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-muted/30 border border-border/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold">{stat.value}</span>
                {'unique' in stat && stat.unique !== undefined && (
                  <span className="text-xs text-muted-foreground">({stat.unique} unique)</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Anchor Text Distribution */}
        {metrics.anchorTextDistribution.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary" />
              Anchor Text Distribution
            </h3>
            <div className="flex flex-wrap gap-2">
              {metrics.anchorTextDistribution.slice(0, 8).map((anchor, i) => (
                <motion.span
                  key={anchor.text}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="px-3 py-1.5 rounded-lg bg-muted/50 text-sm flex items-center gap-2"
                >
                  <span className="font-medium truncate max-w-[150px]">{anchor.text || "(empty)"}</span>
                  <span className="text-xs text-muted-foreground">{anchor.count}x</span>
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Link Health Tips */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <h3 className="text-sm font-semibold mb-2">Link Health Tips</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              {metrics.avgLinkDepth <= 3 ? (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-500" />
              )}
              Link depth: {metrics.avgLinkDepth <= 3 ? "Good - pages are reachable within 3 clicks" : "Consider flattening site structure"}
            </li>
            <li className="flex items-center gap-2">
              {metrics.totalInternalLinks >= 3 ? (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-500" />
              )}
              Internal linking: {metrics.totalInternalLinks >= 3 ? "Good internal link count" : "Add more internal links for better crawlability"}
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default InternalLinkingSection;
