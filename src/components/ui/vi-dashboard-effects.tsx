/**
 * Simplified dashboard background effects
 * Uses CSS-only animations for better performance during scroll/interaction
 * Light mode: boosted opacity for visibility
 */
export const VIDashboardEffects = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Grid pattern overlay - static */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Corner gradient accents - boosted for light mode */}
      <div 
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/25 via-violet-500/20 to-transparent dark:from-primary/15 dark:via-violet-500/10 rounded-bl-[250px]"
      />
      <div 
        className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/25 via-primary/15 to-transparent dark:from-cyan-500/15 dark:via-primary/8 rounded-tr-[200px]"
      />
      
      {/* Additional corner blobs - boosted for light mode */}
      <div 
        className="absolute -top-20 -left-20 w-[350px] h-[350px] bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-transparent dark:from-violet-500/10 dark:via-purple-500/5 rounded-full blur-xl"
      />
      <div 
        className="absolute -bottom-20 -right-20 w-[300px] h-[300px] bg-gradient-to-tl from-amber-500/20 via-orange-500/10 to-transparent dark:from-amber-500/10 dark:via-orange-500/5 rounded-full blur-xl"
      />
      
      {/* Static floating particles - boosted for light mode */}
      <div className="absolute top-[10%] right-[8%] w-2 h-2 rounded-full bg-cyan-500/70 dark:bg-cyan-400/50" />
      <div className="absolute top-[20%] right-[15%] w-1.5 h-1.5 rounded-full bg-violet-500/70 dark:bg-violet-400/50" />
      <div className="absolute top-[15%] right-[25%] w-1 h-1 rounded-full bg-amber-500/70 dark:bg-amber-400/50" />
      <div className="absolute top-[25%] left-[10%] w-1.5 h-1.5 rounded-full bg-primary/70 dark:bg-primary/50" />
      <div className="absolute bottom-[20%] left-[15%] w-2 h-2 rounded-full bg-emerald-500/60 dark:bg-emerald-400/40" />
      <div className="absolute bottom-[30%] right-[12%] w-1.5 h-1.5 rounded-full bg-rose-500/60 dark:bg-rose-400/40" />
      <div className="absolute top-[40%] left-[5%] w-1 h-1 rounded-full bg-cyan-400/60 dark:bg-cyan-300/40" />
      <div className="absolute top-[60%] right-[5%] w-1.5 h-1.5 rounded-full bg-violet-400/60 dark:bg-violet-300/40" />
      <div className="absolute top-[5%] left-[40%] w-1 h-1 rounded-full bg-primary/60 dark:bg-primary/40" />
      <div className="absolute bottom-[10%] right-[30%] w-2 h-2 rounded-full bg-cyan-500/60 dark:bg-cyan-400/40" />
      <div className="absolute top-[70%] left-[25%] w-1.5 h-1.5 rounded-full bg-amber-400/60 dark:bg-amber-300/40" />
      <div className="absolute top-[35%] right-[35%] w-1 h-1 rounded-full bg-emerald-400/50 dark:bg-emerald-300/30" />
      
      {/* Radial glow from top center - boosted for light mode */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-radial from-primary/15 via-violet-500/8 to-transparent dark:from-primary/8 dark:via-violet-500/3" />
      
      {/* Bottom radial glow - boosted for light mode */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-cyan-500/12 via-primary/6 to-transparent dark:from-cyan-500/5 dark:via-primary/2" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60" />
      
      {/* Side vignettes */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background/50 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background/50 to-transparent" />
      
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default VIDashboardEffects;
