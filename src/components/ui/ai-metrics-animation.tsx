import { memo } from "react";
import {
  Brain, TrendingUp, Zap, BarChart3, Link2, Target, Globe, Activity, Database,
  CheckCircle2, Sparkles, Search
} from "lucide-react";

// ─── Color Map ─────────────────────────────────────────────────────────────────
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

type ColorType = keyof typeof colorMap;

// ─── AI Metrics Loading Card ─────────────────────────────────────────────────
interface MetricLoadingCardProps {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  color: ColorType;
  delay: number;
}

const MetricLoadingCard = memo(({ icon: Icon, label, sublabel, color, delay }: MetricLoadingCardProps) => {
  const colors = colorMap[color];
  
  return (
    <div 
      className={`relative rounded-xl border ${colors.border} bg-gradient-to-br ${colors.bg} backdrop-blur-sm p-4 ${colors.glow} h-full`}
      style={{ 
        contain: 'layout style paint',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center flex-shrink-0">
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{label}</p>
          <p className="text-xs text-muted-foreground truncate">{sublabel}</p>
        </div>
        <div className="w-5 h-5 flex items-center justify-center">
          <CheckCircle2 className={`w-4 h-4 ${colors.icon} opacity-60`} />
        </div>
      </div>
      
      <div className="mt-3 h-1 rounded-full bg-background/30 overflow-hidden">
        <div 
          className="h-full rounded-full"
          style={{
            width: '100%',
            background: `linear-gradient(to right, transparent, ${colors.icon.includes('cyan') ? 'rgba(6,182,212,0.6)' : colors.icon.includes('emerald') ? 'rgba(16,185,129,0.6)' : 'rgba(139,92,246,0.6)'}, transparent)`,
            animation: 'ai-metrics-scan 2s ease-in-out infinite',
            animationDelay: `${delay}s`,
          }}
        />
      </div>
    </div>
  );
});
MetricLoadingCard.displayName = 'MetricLoadingCard';

// ─── AI Metrics Animation Component ───────────────────────────────────────────
interface AIMetricsAnimationProps {
  title?: string;
  variant?: 'default' | 'compact';
}

export const AIMetricsAnimation = memo(({ title = "Analyzing Keywords", variant = 'default' }: AIMetricsAnimationProps) => (
  <div 
    className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 mt-2"
    style={{ contain: 'layout style paint' }}
    data-no-theme-transition
  >
    {/* Header with title and heartbeat */}
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
        <Search className="w-4 h-4 text-primary" />
      </div>
      <h4 className="text-lg font-semibold">{title}</h4>
      {/* Heartbeat rhythm line effect */}
      <div className="flex items-center gap-1 ml-2 flex-1 max-w-[280px]">
        {/* Heartbeat SVG rhythm bars */}
        <svg viewBox="0 0 120 24" className="w-full h-6 overflow-visible" preserveAspectRatio="none">
          <path 
            d="M0 12 L15 12 L18 12 L22 4 L26 20 L30 8 L34 14 L38 12 L50 12 L53 12 L57 2 L61 22 L65 6 L69 16 L73 12 L85 12 L88 12 L92 3 L96 21 L100 7 L104 15 L108 12 L120 12"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-40"
          />
          <path 
            d="M0 12 L15 12 L18 12 L22 4 L26 20 L30 8 L34 14 L38 12 L50 12 L53 12 L57 2 L61 22 L65 6 L69 16 L73 12 L85 12 L88 12 L92 3 L96 21 L100 7 L104 15 L108 12 L120 12"
            fill="none"
            stroke="url(#heartbeat-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="240"
            style={{ animation: 'heartbeat-trace 2s ease-in-out infinite' }}
          />
          <defs>
            <linearGradient id="heartbeat-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="40%" stopColor="hsl(var(--primary))" />
              <stop offset="60%" stopColor="hsl(186 100% 50%)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
    
    <div 
      className="flex items-stretch gap-4 h-full"
      style={{ contain: 'layout style paint' }}
    >
      {/* Left: Brain Icon with orbiting particles */}
      <div className="relative w-32 flex-shrink-0 flex items-center justify-center">
        {/* Outer glow ring */}
        <div 
          className="absolute inset-0 rounded-full m-auto w-24 h-24"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
          }}
        />
        
        {/* Orbiting particles - static positions, no animation for stability */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/60"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 90}deg) translateX(40px) translateY(-50%)`,
            }}
          />
        ))}
        
        {/* Secondary orbit - static */}
        {[0, 1, 2].map((i) => (
          <div
            key={`inner-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/40"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 120}deg) translateX(24px) translateY(-50%)`,
            }}
          />
        ))}
        
        {/* Center icon container */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 flex items-center justify-center">
            <Brain className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        {/* Sparkle accents - static */}
        <Sparkles className="absolute top-2 right-2 w-3 h-3 text-amber-400 opacity-60" />
        <Sparkles className="absolute bottom-4 left-2 w-2.5 h-2.5 text-cyan-400 opacity-60" />
      </div>
      
      {/* Right: Metrics Grid */}
      <div className="flex-1 grid grid-cols-4 gap-3">
        <MetricLoadingCard icon={TrendingUp} label="SERP Rankings" sublabel="Google, Bing, Yahoo" color="cyan" delay={0} />
        <MetricLoadingCard icon={Zap} label="Page Speed" sublabel="Core Web Vitals" color="emerald" delay={0.2} />
        <MetricLoadingCard icon={BarChart3} label="Keyword Metrics" sublabel="CPC, Difficulty, Vol" color="violet" delay={0.4} />
        <MetricLoadingCard icon={Link2} label="Citation Links" sublabel="Inbound / Outbound" color="amber" delay={0.6} />
        <MetricLoadingCard icon={Target} label="Search Intent" sublabel="Commercial, Informational" color="rose" delay={0.8} />
        <MetricLoadingCard icon={Globe} label="Competitor Data" sublabel="Domain comparison" color="blue" delay={1.0} />
        <MetricLoadingCard icon={Activity} label="Historical Trends" sublabel="Position changes" color="orange" delay={1.2} />
        <MetricLoadingCard icon={Database} label="Cluster Analysis" sublabel="Main + Supporting" color="purple" delay={1.4} />
      </div>
    </div>
    
    {/* CSS Keyframes - simplified for stability */}
    <style>{`
      @keyframes ai-metrics-scan {
        0% { transform: translateX(-150%); }
        100% { transform: translateX(450%); }
      }
      @keyframes heartbeat-trace {
        0% { stroke-dashoffset: 240; }
        50% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: -240; }
      }
    `}</style>
  </div>
));
AIMetricsAnimation.displayName = 'AIMetricsAnimation';
