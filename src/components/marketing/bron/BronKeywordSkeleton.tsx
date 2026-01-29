import { memo } from "react";
import { Brain, Sparkles, Search } from "lucide-react";

/**
 * AI-themed loading animation for keyword analysis
 * Uses CSS animations only (no JS timers) for performance
 */
export const BronAILoadingAnimation = memo(() => (
  <div 
    className="flex flex-col items-center justify-center py-16 px-8"
    style={{ contain: 'layout style paint' }}
  >
    {/* Central brain icon with orbiting particles */}
    <div className="relative w-32 h-32 mb-6">
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
            transform: `rotate(${i * 90}deg) translateX(48px) translateY(-50%)`,
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
            transform: `rotate(${i * 120}deg) translateX(32px) translateY(-50%)`,
            animation: `orbit-reverse 2.5s linear infinite`,
            animationDelay: `${i * 0.833}s`,
          }}
        />
      ))}
      
      {/* Center icon container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 flex items-center justify-center"
          style={{ animation: 'float 3s ease-in-out infinite' }}
        >
          <Brain className="w-8 h-8 text-primary" />
        </div>
      </div>
      
      {/* Sparkle accents */}
      <Sparkles 
        className="absolute top-2 right-2 w-4 h-4 text-amber-400" 
        style={{ animation: 'twinkle 1.5s ease-in-out infinite' }}
      />
      <Sparkles 
        className="absolute bottom-4 left-0 w-3 h-3 text-cyan-400" 
        style={{ animation: 'twinkle 1.5s ease-in-out infinite 0.5s' }}
      />
    </div>
    
    {/* Loading text */}
    <div className="text-center space-y-2">
      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2 justify-center">
        <Search className="w-4 h-4 text-primary" />
        Analyzing Keywords
      </h4>
      <p className="text-sm text-muted-foreground max-w-xs">
        Fetching SERP rankings, metrics, and citation data...
      </p>
      
      {/* Scanning line effect */}
      <div 
        className="mt-4 h-0.5 w-48 mx-auto rounded-full overflow-hidden bg-muted/30"
      >
        <div 
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
          style={{ animation: 'scan 1.5s ease-in-out infinite' }}
        />
      </div>
    </div>
    
    {/* CSS Keyframes - injected via style tag for performance */}
    <style>{`
      @keyframes orbit {
        from { transform: rotate(0deg) translateX(48px) translateY(-50%); }
        to { transform: rotate(360deg) translateX(48px) translateY(-50%); }
      }
      @keyframes orbit-reverse {
        from { transform: rotate(360deg) translateX(32px) translateY(-50%); }
        to { transform: rotate(0deg) translateX(32px) translateY(-50%); }
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
    `}</style>
  </div>
));

BronAILoadingAnimation.displayName = 'BronAILoadingAnimation';

/**
 * Static skeleton row for Keywords table - NO animate-pulse to prevent flickering.
 * Uses a subtle opacity gradient instead of animations for better performance.
 */
export const BronKeywordSkeleton = memo(({ index }: { index: number }) => {
  // Stagger opacity slightly for visual interest without animation
  const opacity = 0.6 - (index * 0.04);
  
  return (
    <div 
      className="flex items-center w-full justify-between px-4 py-3 rounded-lg bg-card/50 border border-border/30"
      style={{ 
        minWidth: '1050px',
        opacity: Math.max(0.3, opacity),
        contain: 'layout style paint',
      }}
    >
      {/* Speed gauge placeholder */}
      <div className="w-[70px] flex-shrink-0 flex justify-center">
        <div className="w-10 h-10 rounded-full bg-muted/40" />
      </div>
      
      {/* Keyword text placeholder */}
      <div className="w-[380px] flex-shrink-0 pr-4 space-y-1.5">
        <div className="h-4 bg-muted/50 rounded" style={{ width: `${60 + (index % 3) * 10}%` }} />
        <div className="h-3 bg-muted/30 rounded" style={{ width: `${40 + (index % 4) * 5}%` }} />
      </div>
      
      {/* Intent badge placeholder */}
      <div className="w-[140px] flex-shrink-0 flex justify-center">
        <div className="h-5 w-16 rounded-full bg-muted/40" />
      </div>
      
      {/* Rankings placeholders */}
      <div className="w-[220px] flex-shrink-0 flex items-center justify-center gap-1">
        <div className="w-[60px] h-6 rounded bg-muted/40" />
        <div className="w-[60px] h-6 rounded bg-muted/35" />
        <div className="w-[60px] h-6 rounded bg-muted/30" />
      </div>
      
      {/* Metrics placeholders */}
      <div className="w-[140px] flex-shrink-0 flex justify-center gap-2">
        <div className="w-8 h-4 rounded bg-muted/40" />
        <div className="w-8 h-4 rounded bg-muted/35" />
        <div className="w-8 h-4 rounded bg-muted/30" />
      </div>
      
      {/* Links placeholders */}
      <div className="w-[80px] flex-shrink-0 flex justify-center gap-1">
        <div className="w-6 h-4 rounded bg-muted/40" />
        <div className="w-6 h-4 rounded bg-muted/35" />
      </div>
      
      {/* Expand button placeholder */}
      <div className="w-[40px] flex-shrink-0" />
    </div>
  );
});

BronKeywordSkeleton.displayName = 'BronKeywordSkeleton';

/**
 * Column headers for the keyword table - extracted for reuse
 */
export const BronKeywordTableHeader = memo(() => (
  <div 
    className="flex items-center w-full justify-between px-4 py-2 mb-2 rounded-lg bg-card/80 border border-border/50" 
    style={{ minWidth: '1050px', contain: 'layout style' }}
  >
    <div className="w-[70px] flex-shrink-0 flex justify-center">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Speed</span>
    </div>
    <div className="w-[380px] flex-shrink-0 pr-4">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Keyword</span>
    </div>
    <div className="w-[140px] flex-shrink-0 flex justify-center">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Intent</span>
    </div>
    <div className="w-[220px] flex-shrink-0 flex items-center justify-center gap-1">
      <div className="w-[70px] flex justify-center">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Google</span>
      </div>
      <div className="w-[70px] flex justify-center">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Bing</span>
      </div>
      <div className="w-[70px] flex justify-center">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Yahoo</span>
      </div>
    </div>
    <div className="w-[140px] flex-shrink-0 flex justify-center">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Metrics</span>
    </div>
    <div className="w-[80px] flex-shrink-0 flex justify-center">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Links</span>
    </div>
    <div className="w-[40px] flex-shrink-0" />
  </div>
));

BronKeywordTableHeader.displayName = 'BronKeywordTableHeader';

/**
 * Loading skeleton grid with AI animation hero
 */
export const BronKeywordSkeletonList = memo(({ count = 8 }: { count?: number }) => (
  <div style={{ contain: 'layout style paint' }}>
    {/* AI Animation hero */}
    <BronAILoadingAnimation />
    
    {/* Faded skeleton rows below for context */}
    <div className="space-y-2 opacity-40">
      <BronKeywordTableHeader />
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
        <BronKeywordSkeleton key={i} index={i} />
      ))}
    </div>
  </div>
));

BronKeywordSkeletonList.displayName = 'BronKeywordSkeletonList';