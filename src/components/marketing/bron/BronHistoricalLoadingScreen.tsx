import { memo } from "react";
import { BarChart3 } from "lucide-react";

interface BronHistoricalLoadingScreenProps {
  title?: string;
  done?: number;
  total?: number;
}

export const BronHistoricalLoadingScreen = memo(({
  title = "Loading historical data…",
  done = 0,
  total = 0,
}: BronHistoricalLoadingScreenProps) => {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return (
    <div className="relative flex min-h-[420px] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/40 bg-card/20">
      {/* Ambient animated background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 motion-reduce:opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(900px 420px at 30% 20%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(700px 420px at 70% 80%, hsl(var(--primary) / 0.10), transparent 55%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-pulse opacity-30 motion-reduce:animate-none"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.10), transparent)",
          transform: "translateX(-40%)",
        }}
      />

      {/* Foreground */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-4 px-6 py-10 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-primary/30 bg-primary/10 shadow-[0_0_60px_hsl(var(--primary)/0.22)]">
          <BarChart3 className="h-7 w-7 text-primary animate-pulse motion-reduce:animate-none" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">
            {total > 0 ? (
              <span className="tabular-nums">{done}/{total} ({pct}%)</span>
            ) : (
              "Preparing reports…"
            )}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-bounce motion-reduce:animate-none" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:120ms] motion-reduce:animate-none" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:240ms] motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    </div>
  );
});

BronHistoricalLoadingScreen.displayName = "BronHistoricalLoadingScreen";
