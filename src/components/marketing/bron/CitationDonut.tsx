import { memo } from "react";

export const DonutChart = memo(({
  segments,
  total,
  centerTop,
  centerBottom,
  centerTopClassName = "text-primary",
  centerBottomClassName = "text-muted-foreground",
  size = "lg",
}: {
  segments: { value: number; color: string }[];
  total: number;
  centerTop: string;
  centerBottom: string;
  centerTopClassName?: string;
  centerBottomClassName?: string;
  size?: "sm" | "md" | "lg";
}) => {
  const circumference = 2 * Math.PI * 40;
  let offset = 0;

  // Size configurations
  const sizeConfig = {
    sm: { container: "w-24 h-24", text: "text-base", subtext: "text-[10px]", stroke: 10 },
    md: { container: "w-32 h-32", text: "text-xl", subtext: "text-xs", stroke: 12 },
    lg: { container: "w-44 h-44", text: "text-3xl", subtext: "text-sm", stroke: 14 },
  };

  const config = sizeConfig[size];

  return (
    <div 
      className={`relative ${config.container}`}
      style={{ 
        contain: 'layout style paint',
        willChange: 'auto',
      }}
    >
      {/* Outer glow ring */}
      <div 
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: `conic-gradient(from 0deg, ${segments.map((s, i) => `${s.color} ${i * (100 / segments.length)}%`).join(', ')}, ${segments[0]?.color || '#3B82F6'} 100%)`,
          filter: 'blur(12px)',
        }}
      />
      
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 relative z-10">
        {/* Background track */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={config.stroke}
          opacity={0.3}
        />
        
        {segments.map((seg, i) => {
          const percent = total > 0 ? seg.value / total : 0;
          const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
          const strokeDashoffset = -offset * circumference;
          offset += percent;
          if (seg.value === 0) return null;

          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={seg.color}
              strokeWidth={config.stroke}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 6px ${seg.color}50)`,
              }}
            />
          );
        })}
        
        {/* Inner circle with gradient */}
        <circle cx="50" cy="50" r="30" fill="url(#innerGradient)" />
        <defs>
          <radialGradient id="innerGradient" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="hsl(var(--card))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0.9" />
          </radialGradient>
        </defs>
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className={`font-bold ${config.text} ${centerTopClassName}`} style={{ textShadow: '0 0 20px currentColor' }}>
          {centerTop}
        </span>
        <span className={`${config.subtext} ${centerBottomClassName}`}>{centerBottom}</span>
      </div>
    </div>
  );
});
DonutChart.displayName = "DonutChart";

export const Legend = memo(
  ({ items, compact = false }: { items: { colorClassName: string; label: string; value: number }[]; compact?: boolean }) => (
    <div className={`${compact ? 'flex flex-wrap gap-x-4 gap-y-1' : 'space-y-1.5'} text-xs`}>
      {items.map((item, i) => (
        <div key={i} className={`flex items-center ${compact ? 'gap-1.5' : 'justify-between gap-2'}`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span 
              className={`w-2.5 h-2.5 rounded-full ${item.colorClassName}`}
              style={{ boxShadow: '0 0 6px currentColor' }}
            />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
          <span className="font-semibold">{item.value}</span>
        </div>
      ))}
    </div>
  )
);
Legend.displayName = "Legend";