import { memo } from "react";
import { Brain, Sparkles, Search, TrendingUp, Globe, Link2, Target, BarChart3, Zap, Activity, Database, CheckCircle2 } from "lucide-react";
import { AIMetricsAnimation } from "@/components/ui/ai-metrics-animation";

/**
 * AI-themed loading animation for keyword analysis with detailed metrics display
 * Uses CSS animations only (no JS timers) for performance
 * @deprecated Use AIMetricsAnimation from ui/ai-metrics-animation instead
 */
export const BronAILoadingAnimation = memo(() => (
  <div 
    className="flex flex-col items-center justify-center py-12 px-8"
    style={{ contain: 'layout style paint' }}
  >
    {/* Central brain icon with orbiting particles */}
    <div className="relative w-28 h-28 mb-6">
      {/* Outer glow ring */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}
      />
      
      {/* Orbiting particles */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/80"
          style={{
            top: '50%',
            left: '50%',
            transform: `rotate(${i * 90}deg) translateX(44px) translateY(-50%)`,
            animation: `orbit 3s linear infinite`,
            animationDelay: `${i * 0.75}s`,
          }}
        />
      ))}
      
      {/* Secondary orbit */}
      {[0, 1, 2].map((i) => (
        <div
          key={`inner-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/60"
          style={{
            top: '50%',
            left: '50%',
            transform: `rotate(${i * 120}deg) translateX(28px) translateY(-50%)`,
            animation: `orbit-reverse 2.5s linear infinite`,
            animationDelay: `${i * 0.833}s`,
          }}
        />
      ))}
      
      {/* Center icon container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 flex items-center justify-center"
          style={{ animation: 'float 3s ease-in-out infinite' }}
        >
          <Brain className="w-7 h-7 text-primary" />
        </div>
      </div>
      
      {/* Sparkle accents */}
      <Sparkles 
        className="absolute top-1 right-1 w-3 h-3 text-amber-400" 
        style={{ animation: 'twinkle 1.5s ease-in-out infinite' }}
      />
      <Sparkles 
        className="absolute bottom-3 left-0 w-2.5 h-2.5 text-cyan-400" 
        style={{ animation: 'twinkle 1.5s ease-in-out infinite 0.5s' }}
      />
    </div>
    
    {/* Loading text */}
    <div className="text-center space-y-2 mb-6">
      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2 justify-center">
        <Search className="w-4 h-4 text-primary" />
        Analyzing Keywords
      </h4>
      
      {/* Scanning line effect */}
      <div 
        className="h-0.5 w-40 mx-auto rounded-full overflow-hidden bg-muted/30"
      >
        <div 
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
          style={{ animation: 'scan 1.5s ease-in-out infinite' }}
        />
      </div>
    </div>
    
    {/* Metrics being fetched - Grid Display */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl">
      {/* SERP Rankings */}
      <MetricLoadingCard 
        icon={TrendingUp}
        label="SERP Rankings"
        sublabel="Google, Bing, Yahoo"
        color="cyan"
        delay={0}
      />
      
      {/* Page Speed */}
      <MetricLoadingCard 
        icon={Zap}
        label="Page Speed"
        sublabel="Core Web Vitals"
        color="emerald"
        delay={0.2}
      />
      
      {/* Keyword Metrics */}
      <MetricLoadingCard 
        icon={BarChart3}
        label="Keyword Metrics"
        sublabel="CPC, Difficulty, Vol"
        color="violet"
        delay={0.4}
      />
      
      {/* Citation Links */}
      <MetricLoadingCard 
        icon={Link2}
        label="Citation Links"
        sublabel="Inbound / Outbound"
        color="amber"
        delay={0.6}
      />
      
      {/* Search Intent */}
      <MetricLoadingCard 
        icon={Target}
        label="Search Intent"
        sublabel="Commercial, Informational"
        color="rose"
        delay={0.8}
      />
      
      {/* Competitor Data */}
      <MetricLoadingCard 
        icon={Globe}
        label="Competitor Data"
        sublabel="Domain comparison"
        color="blue"
        delay={1.0}
      />
      
      {/* Historical Trends */}
      <MetricLoadingCard 
        icon={Activity}
        label="Historical Trends"
        sublabel="Position changes"
        color="orange"
        delay={1.2}
      />
      
      {/* Cluster Analysis */}
      <MetricLoadingCard 
        icon={Database}
        label="Cluster Analysis"
        sublabel="Main + Supporting"
        color="purple"
        delay={1.4}
      />
    </div>
    
    {/* CSS Keyframes - injected via style tag for performance */}
    <style>{`
      @keyframes orbit {
        from { transform: rotate(0deg) translateX(44px) translateY(-50%); }
        to { transform: rotate(360deg) translateX(44px) translateY(-50%); }
      }
      @keyframes orbit-reverse {
        from { transform: rotate(360deg) translateX(28px) translateY(-50%); }
        to { transform: rotate(0deg) translateX(28px) translateY(-50%); }
      }
      @keyframes pulse-glow {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.1); }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
      @keyframes twinkle {
        0%, 100% { opacity: 0.4; transform: scale(0.9); }
        50% { opacity: 1; transform: scale(1.1); }
      }
      @keyframes scan {
        0% { transform: translateX(-150%); }
        100% { transform: translateX(450%); }
      }
      @keyframes metric-fade {
        0%, 20% { opacity: 0.4; }
        50% { opacity: 1; }
        80%, 100% { opacity: 0.4; }
      }
      @keyframes check-appear {
        0%, 70% { opacity: 0; transform: scale(0); }
        100% { opacity: 1; transform: scale(1); }
      }
    `}</style>
  </div>
));

BronAILoadingAnimation.displayName = 'BronAILoadingAnimation';

/**
 * Individual metric loading card with animation
 */
interface MetricLoadingCardProps {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  color: 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose' | 'blue' | 'orange' | 'purple';
  delay: number;
}

const colorMap = {
  cyan: { bg: 'from-cyan-500/10 to-cyan-500/5', border: 'border-cyan-500/30', icon: 'text-cyan-400', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]' },
  emerald: { bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/30', icon: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
  violet: { bg: 'from-violet-500/10 to-violet-500/5', border: 'border-violet-500/30', icon: 'text-violet-400', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)]' },
  amber: { bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/30', icon: 'text-amber-400', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
  rose: { bg: 'from-rose-500/10 to-rose-500/5', border: 'border-rose-500/30', icon: 'text-rose-400', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.2)]' },
  blue: { bg: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/30', icon: 'text-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]' },
  orange: { bg: 'from-orange-500/10 to-orange-500/5', border: 'border-orange-500/30', icon: 'text-orange-400', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]' },
  purple: { bg: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/30', icon: 'text-purple-400', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]' },
};

const MetricLoadingCard = memo(({ icon: Icon, label, sublabel, color, delay }: MetricLoadingCardProps) => {
  const colors = colorMap[color];
  
  return (
    <div 
      className={`relative rounded-xl border ${colors.border} bg-gradient-to-br ${colors.bg} backdrop-blur-sm p-3 ${colors.glow}`}
      style={{ 
        animation: `metric-fade 3s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        contain: 'layout style paint',
      }}
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r ${colors.bg.replace('/10', '/40').replace('/5', '/20')}`} />
      
      <div className="flex items-start gap-2.5">
        <div className={`w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{label}</p>
          <p className="text-[10px] text-muted-foreground truncate">{sublabel}</p>
        </div>
        {/* Loading indicator that turns to check */}
        <div 
          className="w-4 h-4 flex items-center justify-center"
          style={{ animation: `check-appear 4s ease-out infinite`, animationDelay: `${delay + 2}s` }}
        >
          <CheckCircle2 className={`w-3.5 h-3.5 ${colors.icon}`} />
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-2 h-1 rounded-full bg-background/30 overflow-hidden">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${colors.bg.replace('/10', '/60').replace('/5', '/40')}`}
          style={{
            width: '100%',
            animation: 'scan 2s ease-in-out infinite',
            animationDelay: `${delay}s`,
          }}
        />
      </div>
    </div>
  );
});

MetricLoadingCard.displayName = 'MetricLoadingCard';

/**
 * Static skeleton row for Keywords table - NO animate-pulse to prevent flickering.
 * Uses a subtle opacity gradient instead of animations for better performance.
 */
export const BronKeywordSkeleton = memo(({ index }: { index: number }) => {
  // Stagger opacity slightly for visual interest without animation
  const opacity = 0.6 - (index * 0.04);
  
  return (
    <div 
      className="grid items-center gap-3 px-4 py-2 rounded-lg bg-card/50 border border-border/30 w-full"
      style={{ 
        gridTemplateColumns: '48px 1fr 120px 80px 80px 80px 150px 100px 36px',
        opacity: Math.max(0.3, opacity),
        contain: 'layout style paint',
      }}
    >
      {/* Speed gauge placeholder - centered for alignment */}
      <div className="flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-muted/40" />
      </div>
      
      {/* Keyword text placeholder */}
      <div className="pr-2 space-y-1.5">
        <div className="h-4 bg-muted/50 rounded" style={{ width: `${60 + (index % 3) * 10}%` }} />
        <div className="h-3 bg-muted/30 rounded" style={{ width: `${40 + (index % 4) * 5}%` }} />
      </div>
      
      {/* Intent badge placeholder */}
      <div className="flex justify-center">
        <div className="h-7 w-20 rounded-md bg-muted/40" />
      </div>
      
      {/* Google ranking placeholder */}
      <div className="flex justify-center">
        <div className="h-6 w-14 rounded bg-muted/40" />
      </div>
      
      {/* Bing ranking placeholder */}
      <div className="flex justify-center">
        <div className="h-6 w-14 rounded bg-muted/35" />
      </div>
      
      {/* Yahoo ranking placeholder */}
      <div className="flex justify-center">
        <div className="h-6 w-14 rounded bg-muted/30" />
      </div>
      
      {/* Metrics placeholders */}
      <div className="flex justify-center gap-1">
        <div className="w-10 h-8 rounded-md bg-muted/40" />
        <div className="w-10 h-8 rounded-md bg-muted/35" />
        <div className="w-10 h-8 rounded-md bg-muted/30" />
      </div>
      
      {/* Links placeholders */}
      <div className="flex justify-center">
        <div className="w-16 h-7 rounded-lg bg-muted/40" />
      </div>
      
      {/* Expand button placeholder */}
      <div />
    </div>
  );
});

BronKeywordSkeleton.displayName = 'BronKeywordSkeleton';

/**
 * Column headers for the keyword table - extracted for reuse
 */
export const BronKeywordTableHeader = memo(() => (
  <div 
    className="grid items-center gap-3 px-4 py-1.5 mb-1 rounded-lg bg-card/80 border border-border/50 w-full" 
    style={{ 
      gridTemplateColumns: '48px 1fr 120px 80px 80px 80px 150px 100px 36px',
      contain: 'layout style' 
    }}
  >
    <div className="flex items-center justify-center">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Speed</span>
    </div>
    <div className="pr-2">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Keyword</span>
    </div>
    <div className="flex justify-center">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Intent</span>
    </div>
    <div className="flex justify-center">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Google</span>
    </div>
    <div className="flex justify-center">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Bing</span>
    </div>
    <div className="flex justify-center">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Yahoo</span>
    </div>
    <div className="flex justify-center">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Metrics</span>
    </div>
    <div className="flex justify-center">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Links</span>
    </div>
    <div />
  </div>
));

BronKeywordTableHeader.displayName = 'BronKeywordTableHeader';

/**
 * Loading skeleton grid with AI animation hero
 */
export const BronKeywordSkeletonList = memo(({ count = 8 }: { count?: number }) => (
  <div style={{ contain: 'layout style paint' }}>
    {/* AI Animation hero only - no skeleton rows below */}
    <AIMetricsAnimation title="Analyzing Keywords" />
  </div>
));

BronKeywordSkeletonList.displayName = 'BronKeywordSkeletonList';