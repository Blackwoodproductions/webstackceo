import { motion } from "framer-motion";
import { Gauge, Clock, LayoutGrid, Smartphone, Monitor, AlertTriangle, CheckCircle2, XCircle, Activity, Radio } from "lucide-react";

interface CoreWebVitalsMetrics {
  lcp: { value: number; rating: "good" | "needs-improvement" | "poor"; element?: string };
  fid: { value: number; rating: "good" | "needs-improvement" | "poor" };
  cls: { value: number; rating: "good" | "needs-improvement" | "poor"; element?: string };
  inp: { value: number; rating: "good" | "needs-improvement" | "poor" };
  ttfb: { value: number; rating: "good" | "needs-improvement" | "poor" };
  fcp: { value: number; rating: "good" | "needs-improvement" | "poor" };
  mobile: {
    score: number;
    lcp: number;
    cls: number;
    fid: number;
  };
  desktop: {
    score: number;
    lcp: number;
    cls: number;
    fid: number;
  };
  recommendations: string[];
}

interface CoreWebVitalsSectionProps {
  metrics: CoreWebVitalsMetrics | null;
  isLoading?: boolean;
}

const getRatingColor = (rating: "good" | "needs-improvement" | "poor") => {
  switch (rating) {
    case "good": return "text-green-500";
    case "needs-improvement": return "text-amber-500";
    case "poor": return "text-red-500";
  }
};

const getRatingGlow = (rating: "good" | "needs-improvement" | "poor") => {
  switch (rating) {
    case "good": return "from-emerald-500/20 to-green-500/10";
    case "needs-improvement": return "from-amber-500/20 to-orange-500/10";
    case "poor": return "from-red-500/20 to-rose-500/10";
  }
};

const getRatingIcon = (rating: "good" | "needs-improvement" | "poor") => {
  switch (rating) {
    case "good": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "needs-improvement": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case "poor": return <XCircle className="w-4 h-4 text-red-500" />;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-green-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
};

const getScoreGlow = (score: number) => {
  if (score >= 90) return "from-emerald-500/30 to-green-500/20";
  if (score >= 50) return "from-amber-500/30 to-orange-500/20";
  return "from-red-500/30 to-rose-500/20";
};

export const CoreWebVitalsSection = ({ metrics, isLoading }: CoreWebVitalsSectionProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="relative p-6 rounded-2xl bg-card border border-border/50 overflow-hidden">
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
          
          {/* Scanning line animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Gauge className="w-5 h-5 text-primary" />
            </motion.div>
            Core Web Vitals Deep Dive
            <motion.span
              className="ml-2 text-xs font-normal text-primary"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Analyzing...
            </motion.span>
          </h2>
          
          {/* Futuristic grid loader */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
            {["LCP", "FID", "CLS", "INP", "TTFB", "FCP"].map((label, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="h-28 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/30 relative overflow-hidden"
              >
                {/* Glowing border effect */}
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: `linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)`,
                    backgroundSize: "200% 100%",
                  }}
                  animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
                />
                
                {/* Content */}
                <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground/80">{label}</span>
                    <motion.div
                      className="w-4 h-4 rounded-full bg-primary/30"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    />
                  </div>
                  
                  {/* Animated bars */}
                  <div className="space-y-2">
                    <motion.div
                      className="h-2 bg-primary/20 rounded-full overflow-hidden"
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                        style={{ width: "50%" }}
                      />
                    </motion.div>
                    <motion.div
                      className="h-1.5 bg-muted rounded-full"
                      style={{ width: `${60 + i * 8}%` }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                    />
                  </div>
                </div>
                
                {/* Corner accent */}
                <motion.div
                  className="absolute top-0 right-0 w-8 h-8"
                  style={{
                    background: "linear-gradient(135deg, transparent 50%, hsl(var(--primary) / 0.2) 50%)",
                  }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              </motion.div>
            ))}
          </div>
          
          {/* Bottom progress indicator */}
          <div className="mt-6 relative z-10">
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <motion.div
                className="flex gap-1"
              >
                {[0, 1, 2].map((dot) => (
                  <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: dot * 0.15 }}
                  />
                ))}
              </motion.div>
              <span>Fetching real-time performance metrics from Google</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!metrics) return null;

  const vitals = [
    { 
      name: "LCP", 
      fullName: "Largest Contentful Paint",
      value: `${metrics.lcp.value.toFixed(2)}s`, 
      rating: metrics.lcp.rating,
      threshold: "≤2.5s good",
      element: metrics.lcp.element,
      icon: Clock
    },
    { 
      name: "FID", 
      fullName: "First Input Delay",
      value: `${metrics.fid.value}ms`, 
      rating: metrics.fid.rating,
      threshold: "≤100ms good",
      icon: Gauge
    },
    { 
      name: "CLS", 
      fullName: "Cumulative Layout Shift",
      value: metrics.cls.value.toFixed(3), 
      rating: metrics.cls.rating,
      threshold: "≤0.1 good",
      element: metrics.cls.element,
      icon: LayoutGrid
    },
    { 
      name: "INP", 
      fullName: "Interaction to Next Paint",
      value: `${metrics.inp.value}ms`, 
      rating: metrics.inp.rating,
      threshold: "≤200ms good",
      icon: Gauge
    },
    { 
      name: "TTFB", 
      fullName: "Time to First Byte",
      value: `${metrics.ttfb.value}ms`, 
      rating: metrics.ttfb.rating,
      threshold: "≤800ms good",
      icon: Clock
    },
    { 
      name: "FCP", 
      fullName: "First Contentful Paint",
      value: `${metrics.fcp.value.toFixed(2)}s`, 
      rating: metrics.fcp.rating,
      threshold: "≤1.8s good",
      icon: Clock
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="relative group">
        {/* Animated gradient glow background */}
        <motion.div
          className="absolute -inset-[1px] rounded-[18px] opacity-40 group-hover:opacity-60 blur-sm transition-opacity duration-500"
          animate={{
            background: [
              "linear-gradient(0deg, rgba(34,211,238,0.3), rgba(139,92,246,0.2), rgba(34,211,238,0.3))",
              "linear-gradient(120deg, rgba(139,92,246,0.3), rgba(34,211,238,0.2), rgba(139,92,246,0.3))",
              "linear-gradient(240deg, rgba(34,211,238,0.3), rgba(139,92,246,0.2), rgba(34,211,238,0.3))",
              "linear-gradient(360deg, rgba(139,92,246,0.3), rgba(34,211,238,0.2), rgba(34,211,238,0.3))",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-card via-card/98 to-cyan-500/5 border border-border/50 overflow-hidden">
          {/* Background grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: '28px 28px'
            }}
          />
          
          {/* Floating particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-cyan-500/40"
              style={{
                left: `${15 + i * 18}%`,
                top: `${25 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [-8, 8, -8],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 2.5 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
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
                <Activity className="w-5 h-5 text-cyan-400" />
              </motion.div>
              Core Web Vitals Deep Dive
              <motion.span
                className="ml-2 flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Radio className="w-2.5 h-2.5" />
                REAL DATA
              </motion.span>
            </h2>
          </div>

          {/* Mobile vs Desktop Comparison */}
          <div className="grid md:grid-cols-2 gap-4 mb-6 relative z-10">
            {[
              { type: "Mobile", icon: Smartphone, color: "violet", data: metrics.mobile },
              { type: "Desktop", icon: Monitor, color: "cyan", data: metrics.desktop },
            ].map((device, idx) => (
              <motion.div
                key={device.type}
                initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.01, y: -2 }}
                className={`relative p-4 rounded-xl bg-gradient-to-br ${
                  device.color === "violet" ? "from-violet-500/15 to-purple-500/5" : "from-cyan-500/15 to-blue-500/5"
                } border border-border/40 overflow-hidden group/device`}
              >
                {/* Shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover/device:opacity-100"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className={`p-2 rounded-lg ${device.color === "violet" ? "bg-violet-500/20" : "bg-cyan-500/20"}`}>
                    <device.icon className={`w-5 h-5 ${device.color === "violet" ? "text-violet-400" : "text-cyan-400"}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{device.type}</h3>
                    <p className="text-xs text-muted-foreground">Performance score</p>
                  </div>
                  <motion.div 
                    className={`ml-auto text-2xl font-bold ${getScoreColor(device.data.score)} px-3 py-1 rounded-lg bg-gradient-to-r ${getScoreGlow(device.data.score)}`}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 + idx * 0.1 }}
                  >
                    {device.data.score}
                  </motion.div>
                </div>
                <div className="h-2 bg-muted/50 rounded-full overflow-hidden relative z-10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${device.data.score}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                    className={`h-full ${device.data.score >= 90 ? "bg-gradient-to-r from-emerald-500 to-green-400" : device.data.score >= 50 ? "bg-gradient-to-r from-amber-500 to-orange-400" : "bg-gradient-to-r from-red-500 to-rose-400"} rounded-full relative`}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground relative z-10">
                  <span>LCP: {device.data.lcp.toFixed(1)}s</span>
                  <span>CLS: {device.data.cls.toFixed(2)}</span>
                  <span>FID: {device.data.fid}ms</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Individual Vitals */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 relative z-10">
            {vitals.map((vital, i) => (
              <motion.div
                key={vital.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`relative p-4 rounded-xl bg-gradient-to-br ${getRatingGlow(vital.rating)} border border-border/40 overflow-hidden group/vital`}
              >
                {/* Shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover/vital:opacity-100"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
                
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{vital.name}</span>
                    {getRatingIcon(vital.rating)}
                  </div>
                  <motion.span 
                    className={`text-lg font-bold ${getRatingColor(vital.rating)}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                  >
                    {vital.value}
                  </motion.span>
                </div>
                <p className="text-xs text-muted-foreground mb-1 relative z-10">{vital.fullName}</p>
                <p className="text-xs text-muted-foreground/70 relative z-10">{vital.threshold}</p>
                {vital.element && (
                  <p className="text-xs text-muted-foreground mt-2 truncate relative z-10">
                    Element: <code className="bg-muted/50 px-1 rounded">{vital.element}</code>
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Recommendations */}
          {metrics.recommendations.length > 0 && (
            <div className="pt-4 border-t border-border/50 relative z-10">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Fix Recommendations
              </h3>
              <ul className="space-y-2">
                {metrics.recommendations.slice(0, 5).map((rec, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-2 text-sm text-muted-foreground p-2 rounded-lg bg-amber-500/5 border border-amber-500/20"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    {rec}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CoreWebVitalsSection;
