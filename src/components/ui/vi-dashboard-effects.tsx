// Static dashboard effects - no animations to prevent flickering

/**
 * Exact replica of the Visitor Intelligence Dashboard background effects
 * Use this on all main pages for consistent high-tech aesthetic
 */
export const VIDashboardEffects = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ contain: 'layout paint' }}>
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Static corner gradient accents - no animations to prevent flickering */}
      <div 
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/12 via-violet-500/8 to-transparent rounded-bl-[250px]"
      />
      <div 
        className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/12 via-primary/6 to-transparent rounded-tr-[200px]"
      />
      
      {/* Static corner blobs for richness - no animations */}
      <div 
        className="absolute -top-20 -left-20 w-[350px] h-[350px] bg-gradient-to-br from-violet-500/8 via-purple-500/4 to-transparent rounded-full blur-xl"
      />
      <div 
        className="absolute -bottom-20 -right-20 w-[300px] h-[300px] bg-gradient-to-tl from-amber-500/8 via-orange-500/4 to-transparent rounded-full blur-xl"
      />
      
      {/* Static scanning line pattern - no animations to prevent flickering */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent opacity-30"
        style={{ transform: 'translateY(30%)' }}
      />
      
      {/* Static horizontal accent - no animations */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/2 to-transparent opacity-20"
        style={{ transform: 'translateX(20%)' }}
      />
      
      {/* Static floating particles - no animations to prevent flickering */}
      <div className="absolute top-[10%] right-[8%] w-2 h-2 rounded-full bg-cyan-400/50" />
      <div className="absolute top-[20%] right-[15%] w-1.5 h-1.5 rounded-full bg-violet-400/40" />
      <div className="absolute top-[15%] right-[25%] w-1 h-1 rounded-full bg-amber-400/40" />
      <div className="absolute top-[25%] left-[10%] w-1.5 h-1.5 rounded-full bg-primary/50" />
      <div className="absolute bottom-[20%] left-[15%] w-2 h-2 rounded-full bg-emerald-400/40" />
      <div className="absolute bottom-[30%] right-[12%] w-1.5 h-1.5 rounded-full bg-rose-400/40" />
      <div className="absolute top-[40%] left-[5%] w-1 h-1 rounded-full bg-cyan-300/30" />
      <div className="absolute top-[60%] right-[5%] w-1.5 h-1.5 rounded-full bg-violet-300/30" />
      <div className="absolute top-[5%] left-[40%] w-1 h-1 rounded-full bg-primary/40" />
      <div className="absolute bottom-[10%] right-[30%] w-2 h-2 rounded-full bg-cyan-400/30" />
      <div className="absolute top-[70%] left-[25%] w-1.5 h-1.5 rounded-full bg-amber-300/30" />
      <div className="absolute top-[35%] right-[35%] w-1 h-1 rounded-full bg-emerald-300/25" />
      
      {/* Radial glow from top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-radial from-primary/8 via-violet-500/3 to-transparent" />
      
      {/* Bottom radial glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-cyan-500/5 via-primary/2 to-transparent" />
      
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
