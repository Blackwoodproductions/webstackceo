import { memo } from "react";

export const DonutChart = memo(({
  segments,
  total,
  centerTop,
  centerBottom,
  centerTopClassName = "text-primary",
  centerBottomClassName = "text-muted-foreground",
}: {
  segments: { value: number; color: string }[];
  total: number;
  centerTop: string;
  centerBottom: string;
  centerTopClassName?: string;
  centerBottomClassName?: string;
}) => {
  const circumference = 2 * Math.PI * 35;
  let offset = 0;

  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {segments.map((seg, i) => {
          const percent = seg.value / total;
          const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
          const strokeDashoffset = -offset * circumference;
          offset += percent;
          if (seg.value === 0) return null;

          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r="35"
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
            />
          );
        })}
        <circle cx="50" cy="50" r="28" fill="hsl(var(--card))" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold ${centerTopClassName}`}>{centerTop}</span>
        <span className={`text-xs ${centerBottomClassName}`}>{centerBottom}</span>
      </div>
    </div>
  );
});
DonutChart.displayName = "DonutChart";

export const Legend = memo(
  ({ items }: { items: { colorClassName: string; label: string; value: number }[] }) => (
    <div className="space-y-1.5 text-xs">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full ${item.colorClassName}`} />
            <span className="text-muted-foreground truncate max-w-[160px]">{item.label}</span>
          </div>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  )
);
Legend.displayName = "Legend";
