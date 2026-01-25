import { motion } from "framer-motion";
import { Gauge, Clock, LayoutGrid, Smartphone, Monitor, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

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

const getRatingBg = (rating: "good" | "needs-improvement" | "poor") => {
  switch (rating) {
    case "good": return "bg-green-500/20";
    case "needs-improvement": return "bg-amber-500/20";
    case "poor": return "bg-red-500/20";
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

const getScoreBg = (score: number) => {
  if (score >= 90) return "bg-green-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
};

export const CoreWebVitalsSection = ({ metrics, isLoading }: CoreWebVitalsSectionProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="p-6 rounded-2xl bg-card border border-border/50 overflow-hidden relative">
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
      <div className="p-6 rounded-2xl bg-card border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            Core Web Vitals Deep Dive
          </h2>
        </div>

        {/* Mobile vs Desktop Comparison */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 rounded-xl bg-muted/30 border border-border/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Smartphone className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold">Mobile</h3>
                <p className="text-xs text-muted-foreground">Performance score</p>
              </div>
              <div className={`ml-auto text-2xl font-bold ${getScoreColor(metrics.mobile.score)}`}>
                {metrics.mobile.score}
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metrics.mobile.score}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full ${getScoreBg(metrics.mobile.score)} rounded-full`}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>LCP: {metrics.mobile.lcp.toFixed(1)}s</span>
              <span>CLS: {metrics.mobile.cls.toFixed(2)}</span>
              <span>FID: {metrics.mobile.fid}ms</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 rounded-xl bg-muted/30 border border-border/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Monitor className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold">Desktop</h3>
                <p className="text-xs text-muted-foreground">Performance score</p>
              </div>
              <div className={`ml-auto text-2xl font-bold ${getScoreColor(metrics.desktop.score)}`}>
                {metrics.desktop.score}
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metrics.desktop.score}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full ${getScoreBg(metrics.desktop.score)} rounded-full`}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>LCP: {metrics.desktop.lcp.toFixed(1)}s</span>
              <span>CLS: {metrics.desktop.cls.toFixed(2)}</span>
              <span>FID: {metrics.desktop.fid}ms</span>
            </div>
          </motion.div>
        </div>

        {/* Individual Vitals */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {vitals.map((vital, i) => (
            <motion.div
              key={vital.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-xl border ${getRatingBg(vital.rating)} border-border/30`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{vital.name}</span>
                  {getRatingIcon(vital.rating)}
                </div>
                <span className={`text-lg font-bold ${getRatingColor(vital.rating)}`}>
                  {vital.value}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{vital.fullName}</p>
              <p className="text-xs text-muted-foreground/70">{vital.threshold}</p>
              {vital.element && (
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  Element: <code className="bg-muted px-1 rounded">{vital.element}</code>
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Recommendations */}
        {metrics.recommendations.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold mb-3">Fix Recommendations</h3>
            <ul className="space-y-2">
              {metrics.recommendations.slice(0, 5).map((rec, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  {rec}
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CoreWebVitalsSection;
