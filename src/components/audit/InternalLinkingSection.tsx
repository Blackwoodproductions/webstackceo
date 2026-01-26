import { motion } from "framer-motion";
import { Link2, ArrowRight, ExternalLink, AlertTriangle, CheckCircle2, XCircle, Activity } from "lucide-react";

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

const getLinkScoreGlow = (score: number) => {
  if (score >= 70) return "from-emerald-500/30 to-green-500/20";
  if (score >= 40) return "from-amber-500/30 to-orange-500/20";
  return "from-red-500/30 to-rose-500/20";
};

export const InternalLinkingSection = ({ metrics, isLoading }: InternalLinkingSectionProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <div className="relative p-6 rounded-2xl bg-card border border-border/50 h-full overflow-hidden">
          {/* Animated gradient glow */}
          <motion.div
            className="absolute -inset-[1px] rounded-[18px] opacity-40 blur-sm"
            animate={{
              background: [
                "linear-gradient(0deg, rgba(34,211,238,0.3), rgba(139,92,246,0.2), rgba(34,211,238,0.3))",
                "linear-gradient(180deg, rgba(139,92,246,0.3), rgba(34,211,238,0.2), rgba(139,92,246,0.3))",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Scanning line */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10">
            <Link2 className="w-5 h-5 text-primary" />
            Internal Linking Analysis
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
            {[1, 2, 3, 4].map((i) => (
              <motion.div 
                key={i} 
                className="h-20 bg-muted/50 rounded-xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              />
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
      bg: "bg-cyan-500/20",
      glow: "from-cyan-500/20 to-blue-500/10"
    },
    { 
      label: "External Links", 
      value: metrics.totalExternalLinks, 
      unique: metrics.uniqueExternalLinks,
      icon: ExternalLink, 
      color: "text-violet-400",
      bg: "bg-violet-500/20",
      glow: "from-violet-500/20 to-purple-500/10"
    },
    { 
      label: "Avg Link Depth", 
      value: metrics.avgLinkDepth.toFixed(1), 
      icon: ArrowRight, 
      color: "text-amber-400",
      bg: "bg-amber-500/20",
      glow: "from-amber-500/20 to-orange-500/10",
      status: metrics.avgLinkDepth <= 3 ? "pass" : "warning"
    },
    { 
      label: "Link Equity", 
      value: `${metrics.linkEquityScore}/100`, 
      icon: Activity, 
      color: getLinkScoreColor(metrics.linkEquityScore),
      bg: "bg-primary/20",
      glow: getLinkScoreGlow(metrics.linkEquityScore)
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <div className="relative group h-full">
        {/* Animated gradient glow background */}
        <motion.div
          className="absolute -inset-[1px] rounded-[18px] opacity-40 group-hover:opacity-60 blur-sm transition-opacity duration-500"
          animate={{
            background: [
              "linear-gradient(0deg, rgba(34,211,238,0.3), rgba(139,92,246,0.2), rgba(34,211,238,0.3))",
              "linear-gradient(120deg, rgba(139,92,246,0.3), rgba(34,211,238,0.2), rgba(139,92,246,0.3))",
              "linear-gradient(240deg, rgba(34,211,238,0.3), rgba(139,92,246,0.2), rgba(34,211,238,0.3))",
              "linear-gradient(360deg, rgba(139,92,246,0.3), rgba(34,211,238,0.2), rgba(139,92,246,0.3))",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-card via-card/98 to-cyan-500/5 border border-border/50 h-full overflow-hidden">
          {/* Background grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />
          
          {/* Floating link connections */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-16 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"
              style={{
                left: `${10 + i * 30}%`,
                top: `${20 + i * 25}%`,
                rotate: `${-20 + i * 20}deg`,
              }}
              animate={{
                opacity: [0.2, 0.6, 0.2],
                scaleX: [1, 1.2, 1],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
          
          {/* Scanning line */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/3 to-transparent pointer-events-none"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />

          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <motion.div
                className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/10"
                whileHover={{ scale: 1.05 }}
              >
                <Link2 className="w-5 h-5 text-cyan-400" />
              </motion.div>
              Internal Linking Analysis
            </h2>
            <motion.div 
              className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/30"
              animate={{ boxShadow: ["0 0 10px rgba(34,211,238,0.1)", "0 0 20px rgba(34,211,238,0.25)", "0 0 10px rgba(34,211,238,0.1)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-muted-foreground">Ratio:</span> <span className="text-cyan-400">{linkRatio}%</span>
            </motion.div>
          </div>

          {/* Broken Links Warning */}
          {metrics.brokenLinks > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 rounded-xl bg-gradient-to-r from-red-500/15 to-rose-500/10 border border-red-500/30 flex items-center gap-3 relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <XCircle className="w-5 h-5 text-red-500 shrink-0 relative z-10" />
              <div className="relative z-10">
                <p className="text-sm font-medium text-red-400">{metrics.brokenLinks} Broken Link{metrics.brokenLinks > 1 ? 's' : ''} Detected</p>
                <p className="text-xs text-muted-foreground">Broken links hurt user experience and SEO.</p>
              </div>
            </motion.div>
          )}

          {/* Orphan Pages Warning */}
          {metrics.orphanPages > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 flex items-center gap-3 relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 relative z-10" />
              <div className="relative z-10">
                <p className="text-sm font-medium text-amber-400">{metrics.orphanPages} Orphan Page{metrics.orphanPages > 1 ? 's' : ''} Found</p>
                <p className="text-xs text-muted-foreground">Pages without internal links are hard for search engines to discover.</p>
              </div>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative z-10">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`relative group/stat p-4 rounded-xl bg-gradient-to-br ${stat.glow} border border-border/40 overflow-hidden`}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                />
                
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <div className="flex items-baseline gap-2 relative z-10">
                  <motion.span 
                    className="text-xl font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    {stat.value}
                  </motion.span>
                  {'unique' in stat && stat.unique !== undefined && (
                    <span className="text-xs text-muted-foreground">({stat.unique} unique)</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Anchor Text Distribution */}
          {metrics.anchorTextDistribution.length > 0 && (
            <div className="relative z-10">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-cyan-400" />
                Anchor Text Distribution
              </h3>
              <div className="flex flex-wrap gap-2">
                {metrics.anchorTextDistribution.slice(0, 8).map((anchor, i) => (
                  <motion.span
                    key={anchor.text}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ scale: 1.05, y: -1 }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/15 to-blue-500/10 border border-cyan-500/20 text-sm flex items-center gap-2 cursor-default"
                  >
                    <span className="font-medium truncate max-w-[150px]">{anchor.text || "(empty)"}</span>
                    <span className="text-xs text-muted-foreground">{anchor.count}x</span>
                  </motion.span>
                ))}
              </div>
            </div>
          )}

          {/* Link Health Tips */}
          <div className="mt-6 pt-4 border-t border-border/50 relative z-10">
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
      </div>
    </motion.div>
  );
};

export default InternalLinkingSection;
