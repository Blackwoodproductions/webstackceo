import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProgressIndicatorProps {
  current: number;
  baseline: number;
  label?: string;
  format?: "number" | "percent" | "currency";
  showPercent?: boolean;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export const ProgressIndicator = ({
  current,
  baseline,
  label,
  format = "number",
  showPercent = true,
  size = "sm",
  animate = true,
}: ProgressIndicatorProps) => {
  const diff = current - baseline;
  const percentChange = baseline > 0 ? ((diff / baseline) * 100) : (diff > 0 ? 100 : 0);
  
  const isPositive = diff > 0;
  const isNeutral = diff === 0;
  
  const formatValue = (val: number) => {
    if (format === "currency") return `$${Math.abs(val).toLocaleString()}`;
    if (format === "percent") return `${Math.abs(val).toFixed(1)}%`;
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return Math.abs(val).toLocaleString();
  };

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-0.5",
    md: "text-xs px-2 py-1 gap-1",
    lg: "text-sm px-2.5 py-1.5 gap-1.5",
  };

  const iconSizes = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  if (isNeutral) {
    return (
      <div className={`inline-flex items-center ${sizeClasses[size]} rounded-full bg-muted/50 text-muted-foreground`}>
        <Minus className={iconSizes[size]} />
        <span>No change</span>
      </div>
    );
  }

  const Wrapper = animate ? motion.div : "div";
  const wrapperProps = animate ? {
    initial: { opacity: 0, y: -5 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium ${
        isPositive
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/15 text-red-600 dark:text-red-400"
      }`}
    >
      {isPositive ? (
        <TrendingUp className={iconSizes[size]} />
      ) : (
        <TrendingDown className={iconSizes[size]} />
      )}
      <span>
        {isPositive ? "+" : "-"}{formatValue(Math.abs(diff))}
        {showPercent && percentChange !== 0 && (
          <span className="opacity-70 ml-0.5">
            ({isPositive ? "+" : ""}{percentChange.toFixed(0)}%)
          </span>
        )}
      </span>
      {label && <span className="opacity-70">{label}</span>}
    </Wrapper>
  );
};

interface ProgressSummaryBannerProps {
  metrics: {
    domainRating: { current: number; baseline: number };
    organicTraffic: { current: number; baseline: number };
    organicKeywords: { current: number; baseline: number };
    backlinks: { current: number; baseline: number };
    referringDomains: { current: number; baseline: number };
    trafficValue: { current: number; baseline: number };
  };
  baselineDate: string;
}

export const ProgressSummaryBanner = ({ metrics, baselineDate }: ProgressSummaryBannerProps) => {
  // Calculate if there's any improvement
  const improvements = Object.values(metrics).filter(m => m.current > m.baseline).length;
  const totalMetrics = Object.keys(metrics).length;
  
  if (improvements === 0) return null;
  
  // Find the biggest improvement percentage-wise
  let biggestImprovement = { key: "", percent: 0, diff: 0 };
  Object.entries(metrics).forEach(([key, val]) => {
    if (val.baseline > 0) {
      const percent = ((val.current - val.baseline) / val.baseline) * 100;
      if (percent > biggestImprovement.percent) {
        biggestImprovement = { key, percent, diff: val.current - val.baseline };
      }
    }
  });

  const formatKey = (key: string) => {
    const labels: Record<string, string> = {
      domainRating: "Domain Rating",
      organicTraffic: "Organic Traffic",
      organicKeywords: "Organic Keywords",
      backlinks: "Backlinks",
      referringDomains: "Referring Domains",
      trafficValue: "Traffic Value",
    };
    return labels[key] || key;
  };

  const formattedDate = new Date(baselineDate).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {improvements} of {totalMetrics} metrics improved since {formattedDate}
            </p>
            <p className="text-xs text-muted-foreground">
              Biggest gain: <span className="text-emerald-500 font-medium">
                {formatKey(biggestImprovement.key)} +{biggestImprovement.percent.toFixed(0)}%
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {metrics.domainRating.current > metrics.domainRating.baseline && (
            <ProgressIndicator
              current={metrics.domainRating.current}
              baseline={metrics.domainRating.baseline}
              size="md"
            />
          )}
          {metrics.organicTraffic.current > metrics.organicTraffic.baseline && (
            <ProgressIndicator
              current={metrics.organicTraffic.current}
              baseline={metrics.organicTraffic.baseline}
              size="md"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProgressIndicator;
