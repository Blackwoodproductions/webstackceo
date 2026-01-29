import { memo } from "react";

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
 * Loading skeleton grid - static, no animations
 */
export const BronKeywordSkeletonList = memo(({ count = 8 }: { count?: number }) => (
  <div className="space-y-2" style={{ contain: 'layout style paint' }}>
    <BronKeywordTableHeader />
    {Array.from({ length: count }).map((_, i) => (
      <BronKeywordSkeleton key={i} index={i} />
    ))}
  </div>
));

BronKeywordSkeletonList.displayName = 'BronKeywordSkeletonList';
