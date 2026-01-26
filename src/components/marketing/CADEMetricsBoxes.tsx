import { motion } from "framer-motion";
import {
  Activity, Cpu, Sparkles, FileText, HelpCircle,
  Globe, TrendingUp, Layers, Target,
  Clock, Zap, Link2, ArrowUpRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CADEMetrics {
  status?: string;
  version?: string;
  workers?: number;
  uptime?: string;
  plan?: string;
  planStatus?: string;
  articlesGenerated?: number;
  faqsGenerated?: number;
  quotaUsed?: number;
  quotaLimit?: number;
  domainsUsed?: number;
  domainsLimit?: number;
  creditsRemaining?: number;
  crawledPages?: number;
  contentCount?: number;
  keywordsTracked?: number;
  cssAnalyzed?: boolean;
  lastCrawl?: string;
  category?: string;
  language?: string;
}

interface CADEMetricsBoxesProps {
  metrics: CADEMetrics;
  domain?: string;
  isConnected: boolean;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const CADEMetricsBoxes = ({ metrics, domain, isConnected }: CADEMetricsBoxesProps) => {
  const getStatusColor = (status?: string) => {
    if (!status) return "bg-muted text-muted-foreground";
    const s = status.toLowerCase();
    if (s === "healthy" || s === "active" || s === "running" || s === "ok" || s === "completed") {
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
    if (s === "warning" || s === "busy" || s === "pending" || s === "processing") {
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    }
    if (s === "error" || s === "failed" || s === "offline") {
      return "bg-red-500/20 text-red-400 border-red-500/40";
    }
    return "bg-violet-500/20 text-violet-400 border-violet-500/40";
  };

  const metricCards = [
    {
      label: "System Status",
      value: metrics.status || "—",
      subValue: metrics.version ? `v${metrics.version}` : undefined,
      icon: Activity,
      gradient: "from-emerald-500/15 to-green-500/8",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      glowColor: "from-emerald-500/20",
      isStatus: true,
    },
    {
      label: "Active Workers",
      value: metrics.workers?.toString() ?? "—",
      subValue: metrics.uptime ? `Up: ${metrics.uptime}` : "Processing",
      icon: Cpu,
      gradient: "from-cyan-500/15 to-blue-500/8",
      iconColor: "text-cyan-400",
      borderColor: "border-cyan-500/30",
      glowColor: "from-cyan-500/20",
    },
    {
      label: "Subscription",
      value: metrics.plan || "Pro",
      badge: metrics.planStatus || "Active",
      icon: Sparkles,
      gradient: "from-violet-500/15 to-purple-500/8",
      iconColor: "text-violet-400",
      borderColor: "border-violet-500/30",
      glowColor: "from-violet-500/20",
    },
    {
      label: "Articles Generated",
      value: formatNumber(metrics.articlesGenerated ?? 0),
      subValue: metrics.contentCount ? `${metrics.contentCount} total` : undefined,
      icon: FileText,
      gradient: "from-amber-500/15 to-orange-500/8",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/30",
      glowColor: "from-amber-500/20",
    },
    {
      label: "FAQs Created",
      value: formatNumber(metrics.faqsGenerated ?? 0),
      icon: HelpCircle,
      gradient: "from-pink-500/15 to-rose-500/8",
      iconColor: "text-pink-400",
      borderColor: "border-pink-500/30",
      glowColor: "from-pink-500/20",
    },
  ];

  const domainMetrics = domain ? [
    {
      label: "Pages Crawled",
      value: formatNumber(metrics.crawledPages ?? 0),
      icon: Globe,
      gradient: "from-teal-500/15 to-cyan-500/8",
      iconColor: "text-teal-400",
      borderColor: "border-teal-500/30",
      glowColor: "from-teal-500/20",
    },
    {
      label: "Keywords Tracked",
      value: formatNumber(metrics.keywordsTracked ?? 0),
      icon: Target,
      gradient: "from-indigo-500/15 to-violet-500/8",
      iconColor: "text-indigo-400",
      borderColor: "border-indigo-500/30",
      glowColor: "from-indigo-500/20",
    },
    {
      label: "Category",
      value: metrics.category || "—",
      icon: Layers,
      gradient: "from-fuchsia-500/15 to-pink-500/8",
      iconColor: "text-fuchsia-400",
      borderColor: "border-fuchsia-500/30",
      glowColor: "from-fuchsia-500/20",
    },
  ] : [];

  return (
    <div className="space-y-4">
      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {metricCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className={`relative overflow-hidden p-4 bg-gradient-to-br ${card.gradient} ${card.borderColor} group h-full`}>
              {/* Corner glow */}
              <div className={`absolute top-0 right-0 w-14 h-14 bg-gradient-to-bl ${card.glowColor} to-transparent rounded-bl-[35px] pointer-events-none`} />
              
              {/* Grid pattern */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
                  backgroundSize: '16px 16px'
                }}
              />
              
              {/* Shimmer effect on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-background/30 flex items-center justify-center`}>
                    <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                  {card.badge && (
                    <Badge className={`text-[9px] px-1.5 py-0 ${getStatusColor(card.badge)}`}>
                      {card.badge}
                    </Badge>
                  )}
                </div>
                <motion.p 
                  className={`text-2xl font-bold ${card.isStatus ? 'capitalize' : ''}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                >
                  {card.value}
                </motion.p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {card.label}
                </p>
                {card.subValue && (
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{card.subValue}</p>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Domain-Specific Metrics */}
      {domain && domainMetrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-muted-foreground">Domain: {domain}</span>
            {metrics.lastCrawl && (
              <Badge variant="secondary" className="text-[9px] bg-violet-500/10 text-violet-400 border-violet-500/30">
                <Clock className="w-2.5 h-2.5 mr-1" />
                Last crawl: {new Date(metrics.lastCrawl).toLocaleDateString()}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {domainMetrics.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className={`relative overflow-hidden p-3 bg-gradient-to-br ${card.gradient} ${card.borderColor} group`}>
                  <div className={`absolute top-0 right-0 w-10 h-10 bg-gradient-to-bl ${card.glowColor} to-transparent rounded-bl-[25px] pointer-events-none`} />
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background/30 flex items-center justify-center">
                      <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{card.value}</p>
                      <p className="text-[10px] text-muted-foreground">{card.label}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Feature Highlights Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-2"
      >
        {[
          { icon: Zap, label: "AI Generation", desc: "7 content types", color: "text-yellow-400" },
          { icon: Link2, label: "Smart Linking", desc: "Auto internal links", color: "text-cyan-400" },
          { icon: Target, label: "Competitor Intel", desc: "Reverse engineer", color: "text-rose-400" },
          { icon: TrendingUp, label: "Topical Authority", desc: "Keyword mapping", color: "text-emerald-400" },
        ].map((feature, i) => (
          <motion.div
            key={feature.label}
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/50 group cursor-default"
          >
            <feature.icon className={`w-4 h-4 ${feature.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{feature.label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{feature.desc}</p>
            </div>
            <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default CADEMetricsBoxes;
