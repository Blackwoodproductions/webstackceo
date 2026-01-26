import { motion } from "framer-motion";
import { Users, Eye, Clock, ArrowUpRight, ArrowDownRight, Activity, Radio } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GAMetrics } from "./GADashboardPanel";

interface GAMetricsBoxesProps {
  metrics: GAMetrics;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const GAMetricsBoxes = ({ metrics }: GAMetricsBoxesProps) => {
  const metricCards = [
    {
      label: "Sessions",
      value: formatNumber(metrics.sessions),
      change: metrics.sessionsChange,
      icon: Users,
      gradient: "from-orange-500/15 to-amber-500/8",
      iconColor: "text-orange-500",
      borderColor: "border-orange-500/30",
      glowColor: "from-orange-500/20",
    },
    {
      label: "Users",
      value: formatNumber(metrics.users),
      subValue: `${formatNumber(metrics.newUsers)} new`,
      change: metrics.usersChange,
      icon: Users,
      gradient: "from-amber-500/15 to-yellow-500/8",
      iconColor: "text-amber-500",
      borderColor: "border-amber-500/30",
      glowColor: "from-amber-500/20",
    },
    {
      label: "Page Views",
      value: formatNumber(metrics.pageViews),
      badge: `${metrics.pagesPerSession.toFixed(1)}/sess`,
      icon: Eye,
      gradient: "from-yellow-500/15 to-lime-500/8",
      iconColor: "text-yellow-500",
      borderColor: "border-yellow-500/30",
      glowColor: "from-yellow-500/20",
    },
    {
      label: "Avg. Duration",
      value: formatDuration(metrics.avgSessionDuration),
      badge: `${metrics.engagementRate.toFixed(0)}% engaged`,
      icon: Clock,
      gradient: "from-green-500/15 to-emerald-500/8",
      iconColor: "text-green-500",
      borderColor: "border-green-500/30",
      glowColor: "from-green-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
      {/* GA Header Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 md:col-span-4 lg:col-span-1"
      >
        <Card className="relative overflow-hidden p-3 bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-primary/5 border-orange-500/30 group">
          {/* Corner glows */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-bl-[40px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-tr-[30px] pointer-events-none" />
          
          {/* Background grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(hsl(24 95% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 95% 53%) 1px, transparent 1px)`,
              backgroundSize: '16px 16px',
            }}
          />
          
          {/* Scanning line */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/8 to-transparent pointer-events-none"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          
          <div className="relative z-10 flex items-center gap-3">
            <motion.div 
              className="relative w-10 h-10 flex-shrink-0"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 blur-sm opacity-50" />
              <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground">Google Analytics</p>
                <motion.span
                  className="flex items-center gap-1 text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Radio className="w-2 h-2" />
                  LIVE
                </motion.span>
              </div>
              <p className="text-sm font-semibold">Last 28 Days</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Metric Cards */}
      {metricCards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className={`relative overflow-hidden p-3 bg-gradient-to-br ${card.gradient} ${card.borderColor} group`}>
            {/* Corner glow */}
            <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl ${card.glowColor} to-transparent rounded-bl-[30px] pointer-events-none`} />
            
            {/* Grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
                backgroundSize: '16px 16px'
              }}
            />
            
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                {card.change !== undefined && card.change !== 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                  >
                    <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${card.change > 0 ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-red-500/20 text-red-500 border-red-500/30'}`}>
                      {card.change > 0 ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
                      {Math.abs(card.change).toFixed(0)}%
                    </Badge>
                  </motion.div>
                )}
                {card.badge && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-secondary/50 border-border/50">
                    {card.badge}
                  </Badge>
                )}
              </div>
              <motion.p 
                className="text-xl font-bold"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
              >
                {card.value}
              </motion.p>
              <p className="text-[10px] text-muted-foreground">
                {card.label}
                {card.subValue && ` (${card.subValue})`}
              </p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default GAMetricsBoxes;
