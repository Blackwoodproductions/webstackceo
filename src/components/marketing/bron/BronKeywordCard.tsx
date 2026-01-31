import { memo, useMemo } from "react";
import { 
  ChevronUp, ChevronDown, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown, Minus, DollarSign, Search, MousePointerClick,
  ShoppingCart, Info, Compass, Target, RefreshCw, BarChart3, Link
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BronKeyword, BronSerpReport } from "@/hooks/use-bron-api";

// Types
export interface KeywordMetrics {
  search_volume: number;
  cpc: number;
  competition: number;
  competition_level: string;
}

export interface PageSpeedScore {
  mobileScore: number;
  desktopScore: number;
  loading?: boolean;
  updating?: boolean;
  error?: boolean;
  cachedAt?: number;
}

interface BronKeywordCardProps {
  keyword: BronKeyword;
  serpData: BronSerpReport | null;
  keywordMetrics?: KeywordMetrics;
  pageSpeedScore?: PageSpeedScore;
  linksInCount: number;
  linksOutCount: number;
  isExpanded: boolean;
  isNested?: boolean;
  isTrackingOnly?: boolean;
  isMainKeyword?: boolean; // Parent keyword with children
  clusterChildCount?: number;
  selectedDomain?: string;
  googleMovement: number;
  bingMovement: number;
  yahooMovement: number;
  metricsLoading?: boolean;
  isBaselineReport?: boolean; // True when viewing the baseline (oldest) report
  onToggleExpand: () => void;
  onOpenAnalysis?: (keyword: BronKeyword) => void; // NEW: Open analysis dialog
}

// Utility functions
// Extract the actual TARGET KEYWORD (not page title) for SERP matching
// This should be the keyword we're ranking for, e.g. "Best Dentist in Port Coquitlam"
// STRICT: Never include page titles with ":" or subtitles
export function getTargetKeyword(kw: BronKeyword): string {
  // Priority 1: Explicit keyword field (most reliable)
  if (kw.keyword && kw.keyword.trim()) {
    const kwText = kw.keyword.trim();
    // If keyword contains ":", only take the part before it (remove page title suffix)
    if (kwText.includes(':')) {
      const beforeColon = kwText.split(':')[0].trim();
      if (beforeColon.length > 3) return beforeColon;
    }
    return kwText;
  }
  
  // Priority 2: Extract from URL slug (this IS the target keyword)
  if (kw.linkouturl) {
    const pathStart = kw.linkouturl.indexOf('/', kw.linkouturl.indexOf('//') + 2);
    if (pathStart > 0) {
      const path = kw.linkouturl.slice(pathStart).replace(/\/$/, '');
      const lastSlash = path.lastIndexOf('/');
      const segment = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
      if (segment.length > 2) {
        // Remove trailing ID pattern like "-15134" or "-568071bc"
        const cleaned = segment.replace(/-\d+bc$/i, '').replace(/-\d+$/, '');
        if (cleaned.length > 2) {
          // Convert slug to readable text
          const words = cleaned.split(/[-_]+/).filter(w => w.length > 0);
          const readable = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          if (readable.length > 3) return readable;
        }
      }
    }
  }
  
  // Priority 3: keywordtitle only if it doesn't contain ":" (indicates page title format)
  if (kw.keywordtitle && kw.keywordtitle.trim() && !kw.keywordtitle.includes(':')) {
    return kw.keywordtitle.trim();
  }
  
  // Priority 4: If keywordtitle has ":", extract just the keyword part
  if (kw.keywordtitle && kw.keywordtitle.includes(':')) {
    const beforeColon = kw.keywordtitle.split(':')[0].trim();
    if (beforeColon.length > 3) return beforeColon;
  }
  
  // Fallback: Return the display text but strip page title suffix
  const display = getKeywordDisplayText(kw);
  if (display.includes(':')) {
    const beforeColon = display.split(':')[0].trim();
    if (beforeColon.length > 3) return beforeColon;
  }
  return display;
}

export function getKeywordDisplayText(kw: BronKeyword): string {
  // FAST PATH: Check primary string fields first (no parsing needed)
  if (kw.keywordtitle && kw.keywordtitle.trim()) return kw.keywordtitle.trim();
  if (kw.keyword && kw.keyword.trim()) return kw.keyword.trim();
  if (kw.metatitle && kw.metatitle.trim()) return kw.metatitle.trim();
  
  // Check extended fields via any-cast (still fast)
  const kwAny = kw as unknown as Record<string, unknown>;
  if (typeof kwAny.restitle === 'string' && kwAny.restitle.trim()) return kwAny.restitle.trim();
  if (typeof kwAny.title === 'string' && kwAny.title.trim()) return kwAny.title.trim();
  if (typeof kwAny.name === 'string' && kwAny.name.trim()) return kwAny.name.trim();
  if (typeof kwAny.keyword_text === 'string' && kwAny.keyword_text.trim()) return kwAny.keyword_text.trim();
  if (typeof kwAny.text === 'string' && kwAny.text.trim()) return kwAny.text.trim();
  if (typeof kwAny.phrase === 'string' && kwAny.phrase.trim()) return kwAny.phrase.trim();
  
  // MEDIUM PATH: Extract from linkouturl slug (faster than HTML parsing)
  if (kw.linkouturl) {
    // Remove protocol and domain
    const pathStart = kw.linkouturl.indexOf('/', kw.linkouturl.indexOf('//') + 2);
    if (pathStart > 0) {
      const path = kw.linkouturl.slice(pathStart).replace(/\/$/, '');
      const lastSlash = path.lastIndexOf('/');
      const segment = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
      if (segment.length > 2) {
        // Remove trailing ID pattern like "-15134" or "-568071bc"
        const cleaned = segment.replace(/-\d+bc$/i, '').replace(/-\d+$/, '');
        if (cleaned.length > 2) {
          // Convert slug to readable text
          const words = cleaned.split(/[-_]+/).filter(w => w.length > 0);
          const readable = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          if (readable.length > 3) return readable;
        }
      }
    }
  }
  
  // SLOW PATH: Parse resfeedtext HTML (only as last resort)
  // Limit parsing to first 2000 chars to avoid processing huge articles
  if (kw.resfeedtext && kw.resfeedtext.length > 0) {
    const snippet = kw.resfeedtext.length > 2000 ? kw.resfeedtext.slice(0, 2000) : kw.resfeedtext;
    
    // Decode HTML entities in one pass
    const decoded = snippet
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
      .replace(/&#39;|&#x27;/g, "'")
      .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—');
    
    // Try h1 first, then h3, h2, title (combined into one pass for efficiency)
    const headingMatch = decoded.match(/<h[123][^>]*>([^<]{4,})<\/h[123]>/i)
                      || decoded.match(/<title[^>]*>([^<]{4,})<\/title>/i);
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].trim();
    }
  }
  
  return `Keyword #${kw.id}`;
}

export function getPosition(val?: string | number): number | null {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  const match = str.match(/^(\d+)\s*([+-]\d+)?$/);
  if (match) {
    const position = parseInt(match[1], 10);
    return isNaN(position) || position === 0 ? null : position;
  }
  const num = parseInt(str, 10);
  return isNaN(num) || num === 0 ? null : num;
}

// Extract the "change vs previous report" delta when the API returns values like "12+3" or "12 -2".
// Convention: +N means improved (moved up), -N means dropped (moved down).
export function getPositionDelta(val?: string | number): number {
  if (val === undefined || val === null) return 0;
  const raw = String(val).trim();
  const str = raw.replace(/[()]/g, '').trim();
  const match = str.match(/^(\d+)\s*([+-]\d+)\s*$/);
  if (!match?.[2]) return 0;
  const delta = parseInt(match[2], 10);
  return Number.isFinite(delta) ? delta : 0;
}

function getKeywordIntent(keyword: string) {
  const kw = keyword.toLowerCase();
  
  // High-end glassmorphism palette for intent badges - refined and modern
  const transactionalPatterns = ['buy', 'purchase', 'order', 'book', 'hire', 'get', 'download', 'subscribe', 'sign up', 'register', 'schedule', 'appointment', 'quote', 'pricing', 'cost', 'price', 'deal', 'discount', 'coupon', 'free trial'];
  if (transactionalPatterns.some(p => kw.includes(p))) {
    return { type: 'transactional' as const, icon: ShoppingCart, color: 'text-emerald-400', bgColor: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30' };
  }
  
  const commercialPatterns = ['best', 'top', 'review', 'vs', 'versus', 'compare', 'comparison', 'alternative', 'affordable', 'cheap', 'premium', 'professional', 'rated', 'recommended', 'trusted'];
  if (commercialPatterns.some(p => kw.includes(p))) {
    return { type: 'commercial' as const, icon: Target, color: 'text-amber-400', bgColor: 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30' };
  }
  
  const navigationalPatterns = ['login', 'sign in', 'website', 'official', 'contact', 'near me', 'location', 'address', 'hours', 'directions'];
  if (navigationalPatterns.some(p => kw.includes(p))) {
    return { type: 'navigational' as const, icon: Compass, color: 'text-sky-400', bgColor: 'bg-gradient-to-br from-sky-500/20 to-sky-600/10 border-sky-500/30' };
  }
  
  return { type: 'informational' as const, icon: Info, color: 'text-violet-400', bgColor: 'bg-gradient-to-br from-violet-500/20 to-violet-600/10 border-violet-500/30' };
}

function getMovementFromDelta(movement: number) {
  // Positive movement means ranking improved (e.g., from #10 to #5 = +5 improvement)
  if (movement > 0) {
    return { type: 'up' as const, color: 'text-emerald-500', bgColor: 'bg-emerald-500/20', delta: movement };
  } else if (movement < 0) {
    // Negative movement means ranking dropped (e.g., from #5 to #10 = -5 decline)
    return { type: 'down' as const, color: 'text-red-500', bgColor: 'bg-red-500/20', delta: movement };
  }
  return { type: 'same' as const, color: 'text-muted-foreground', bgColor: 'bg-muted/20', delta: 0 };
}

// PageSpeed Gauge Component - fully static (no CSS transforms/animations)
const PageSpeedGauge = memo(({ score, loading, updating, error }: { 
  score: number; 
  loading?: boolean; 
  updating?: boolean; 
  error?: boolean;
}) => {
  // Once we have a valid cached score, display it immediately without any loading states
  const hasValidScore = score > 0 && !error;
  const showLoading = loading && !hasValidScore;
  const showPending = !hasValidScore && !loading && !error;
  
  const getGaugeColor = () => {
    // Use design tokens only (HSL). No hard-coded colors.
    if (showLoading || showPending || error) {
      return { stroke: 'hsl(var(--muted))', textClass: 'text-muted-foreground' };
    }
    if (score >= 90) return { stroke: 'hsl(var(--primary))', textClass: 'text-foreground' };
    if (score >= 50) return { stroke: 'hsl(var(--accent))', textClass: 'text-foreground' };
    return { stroke: 'hsl(var(--destructive))', textClass: 'text-foreground' };
  };
  
  const colors = getGaugeColor();
  const circumference = 2 * Math.PI * 18;
  const progress = hasValidScore ? score / 100 : 0;
  const strokeDashoffset = circumference * (1 - progress);
  
  return (
    <div 
      className="relative w-12 h-12 flex items-center justify-center shrink-0"
      style={{ contain: 'layout paint' }}
      title={updating ? 'Updating...' : showPending ? 'Pending...' : `Score: ${score}/100`}
    >
      <svg width="48" height="48" viewBox="0 0 44 44" aria-hidden="true">
        {/* Rotate via SVG attribute (not CSS transform) to avoid transform-driven repaints */}
        <g transform="rotate(-90 22 22)">
          {/* Background circle */}
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="hsl(var(--muted) / 0.3)"
            strokeWidth="3"
          />
          {/* Progress circle - static, no transitions */}
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            stroke={colors.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {showLoading ? (
          <span className="text-[10px] text-muted-foreground/70">...</span>
        ) : showPending ? (
          <span className="text-[10px] text-muted-foreground/50">—</span>
        ) : (
          <span className={`text-sm font-bold ${colors.textClass}`}>{error ? '—' : score}</span>
        )}
      </div>
      {/* Intentionally no animated "updating" indicator to avoid flicker/jank */}
    </div>
  );
}, (prev, next) => {
  // Custom comparison: only re-render when these specific props change
  return (
    prev.score === next.score &&
    prev.loading === next.loading &&
    prev.updating === next.updating &&
    prev.error === next.error
  );
});
PageSpeedGauge.displayName = 'PageSpeedGauge';

// Rankings Display Component - compact pills with color-coded movement
const RankingsDisplay = memo(({ 
  googlePos, bingPos, yahooPos, 
  googleMovement, bingMovement, yahooMovement,
  googlePrevDelta, bingPrevDelta, yahooPrevDelta,
  isBaselineReport,
}: { 
  googlePos: number | null;
  bingPos: number | null;
  yahooPos: number | null;
  googleMovement: number;
  bingMovement: number;
  yahooMovement: number;
  googlePrevDelta: number;
  bingPrevDelta: number;
  yahooPrevDelta: number;
  isBaselineReport?: boolean; // When true, show no movement (this IS the baseline)
}) => {
  // Color coding: Green = UP (improved), Amber/Yellow = DOWN (dropped), Blue = NO MOVEMENT
  const getMovementStyles = (movement: number, hasPosition: boolean) => {
    if (movement > 0) {
      // Improved ranking (lower position number means higher rank)
      return {
        textColor: 'text-emerald-400',
        bgColor: 'bg-gradient-to-r from-emerald-500/25 to-emerald-500/15 border border-emerald-500/40',
        icon: <TrendingUp className="w-3 h-3" strokeWidth={2.5} />,
        glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
      };
    }
    if (movement < 0) {
      // Dropped ranking
      return {
        textColor: 'text-amber-400',
        bgColor: 'bg-gradient-to-r from-amber-500/25 to-amber-500/15 border border-amber-500/40',
        icon: <TrendingDown className="w-3 h-3" strokeWidth={2.5} />,
        glow: 'shadow-[0_0_8px_rgba(245,158,11,0.2)]',
      };
    }
    // No movement - show 0 with blue background when we have a position
    return {
      textColor: 'text-sky-400',
      bgColor: hasPosition ? 'bg-gradient-to-r from-sky-500/20 to-sky-500/10 border border-sky-500/30' : '',
      icon: null, // No icon for zero movement
      glow: '',
    };
  };

  const renderRanking = (
    pos: number | null, 
    movement: number, 
    prevDelta: number,
    engineName: 'Google' | 'Bing' | 'Yahoo'
  ) => {
    // If this is the baseline report, force movement to 0 (no movement on baseline)
    const effectiveMovement = isBaselineReport ? 0 : movement;
    const styles = getMovementStyles(effectiveMovement, pos !== null);
    
    // Show "API Issue" badge for Bing/Yahoo when position is null (API not returning data)
    if (pos === null && (engineName === 'Bing' || engineName === 'Yahoo')) {
      return (
        <div className="flex items-center justify-center h-6">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap">
            API Issue
          </span>
        </div>
      );
    }
    
    if (pos === null) {
      return (
        <div className="flex items-center justify-center h-6">
          <span className="text-xs text-muted-foreground/40">—</span>
        </div>
      );
    }
    
    // Format movement display
    // Movement is calculated from position 1000 as baseline for new keywords
    // So #1 position = +999 movement, #10 = +990, etc.
    const formatMovement = (mv: number) => {
      if (mv === 0) return ''; // No movement indicator
      if (mv >= 999) return '+'; // Just show "+" for new entries, not "NEW"
      if (mv <= -999) return '−'; // Just show "−" for lost entries
      return mv > 0 ? `+${mv}` : String(mv);
    };
    
    return (
      <div className={`flex items-center justify-center gap-0.5 h-7 px-2 rounded-lg ${styles.bgColor} ${styles.glow} transition-all duration-200`}>
        {styles.icon && (
          <div className={`flex items-center ${styles.textColor}`}>
            {styles.icon}
          </div>
        )}
        <span className={`text-[10px] font-semibold ${styles.textColor}`}>
          {formatMovement(effectiveMovement)}
        </span>
        <span className={`text-xs font-bold ${styles.textColor}`}>
          #{pos}
        </span>
        {prevDelta !== 0 && !isBaselineReport && (
          <span
            className="text-[8px] text-muted-foreground/70 ml-0.5"
            title="Change vs previous report"
          >
            p{prevDelta > 0 ? `+${prevDelta}` : prevDelta}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      {renderRanking(googlePos, googleMovement, googlePrevDelta, 'Google')}
      {renderRanking(bingPos, bingMovement, bingPrevDelta, 'Bing')}
      {renderRanking(yahooPos, yahooMovement, yahooPrevDelta, 'Yahoo')}
    </>
  );
});
RankingsDisplay.displayName = 'RankingsDisplay';

// Keyword Metrics Display - memoized
const MetricsDisplay = memo(({ metrics, googlePos, loading }: { 
  metrics?: KeywordMetrics; 
  googlePos: number | null;
  loading?: boolean;
}) => {
  const getEstimatedCTR = (pos: number | null) => {
    if (pos === null) return null;
    if (pos <= 1) return '32%';
    if (pos <= 2) return '17%';
    if (pos <= 3) return '11%';
    if (pos <= 5) return '6%';
    if (pos <= 10) return '2%';
    return '<1%';
  };

  const formatVolume = (vol?: number) => {
    if (vol === undefined || vol === null) return null;
    if (vol >= 10000) return `${(vol / 1000).toFixed(0)}K`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return String(vol);
  };

  const ctrValue = getEstimatedCTR(googlePos);
  
  // Check if we have ANY cached metrics - if so, show them immediately
  const hasCachedCpc = metrics?.cpc !== undefined && metrics.cpc !== null;
  const hasCachedVolume = metrics?.search_volume !== undefined && metrics.search_volume !== null;
  
  // Only show loading indicator if: loading is true AND we don't have cached data
  const showCpcLoading = loading && !hasCachedCpc;
  const showVolLoading = loading && !hasCachedVolume;
  
  return (
    <div className="flex items-center gap-1.5 flex-nowrap" style={{ contain: 'layout style' }}>
      {/* CPC Badge */}
      <div className="flex flex-col items-center px-1.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <div className="flex items-center gap-0.5">
          <DollarSign className="w-2.5 h-2.5 text-amber-400" />
          <span className="text-[10px] font-bold text-amber-400">
            {showCpcLoading ? (
              <span className="opacity-50">...</span>
            ) : hasCachedCpc ? (
              `$${metrics!.cpc.toFixed(0)}`
            ) : (
              '—'
            )}
          </span>
        </div>
        <span className="text-[7px] text-amber-400/70">CPC</span>
      </div>
      
      {/* CTR Badge - Volume badge removed */}
      <div className="flex flex-col items-center px-1.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30">
        <div className="flex items-center gap-0.5">
          <MousePointerClick className="w-2.5 h-2.5 text-violet-400" />
          <span className="text-[10px] font-bold text-violet-400">{ctrValue || '—'}</span>
        </div>
        <span className="text-[7px] text-violet-400/70">CTR</span>
      </div>
    </div>
  );
});
MetricsDisplay.displayName = 'MetricsDisplay';

// Main Card Component
function areBronKeywordCardPropsEqual(prev: BronKeywordCardProps, next: BronKeywordCardProps) {
  const sameKeyword =
    prev.keyword.id === next.keyword.id &&
    prev.keyword.keywordtitle === next.keyword.keywordtitle &&
    prev.keyword.keyword === next.keyword.keyword &&
    prev.keyword.metatitle === next.keyword.metatitle &&
    prev.keyword.resfeedtext === next.keyword.resfeedtext &&
    prev.keyword.deleted === next.keyword.deleted &&
    (prev.keyword as any).is_deleted === (next.keyword as any).is_deleted &&
    prev.keyword.active === next.keyword.active &&
    prev.keyword.linkouturl === next.keyword.linkouturl;

  const sameSerp =
    (prev.serpData?.google ?? null) === (next.serpData?.google ?? null) &&
    (prev.serpData?.bing ?? null) === (next.serpData?.bing ?? null) &&
    (prev.serpData?.yahoo ?? null) === (next.serpData?.yahoo ?? null);

  const sameMetrics =
    (prev.keywordMetrics?.cpc ?? null) === (next.keywordMetrics?.cpc ?? null) &&
    (prev.keywordMetrics?.competition ?? null) === (next.keywordMetrics?.competition ?? null) &&
    (prev.keywordMetrics?.competition_level ?? null) ===
      (next.keywordMetrics?.competition_level ?? null) &&
    (prev.keywordMetrics?.search_volume ?? null) === (next.keywordMetrics?.search_volume ?? null);

  const samePageSpeed =
    (prev.pageSpeedScore?.mobileScore ?? 0) === (next.pageSpeedScore?.mobileScore ?? 0) &&
    (prev.pageSpeedScore?.desktopScore ?? 0) === (next.pageSpeedScore?.desktopScore ?? 0) &&
    (prev.pageSpeedScore?.loading ?? false) === (next.pageSpeedScore?.loading ?? false) &&
    (prev.pageSpeedScore?.updating ?? false) === (next.pageSpeedScore?.updating ?? false) &&
    (prev.pageSpeedScore?.error ?? false) === (next.pageSpeedScore?.error ?? false);

  return (
    sameKeyword &&
    sameSerp &&
    sameMetrics &&
    samePageSpeed &&
    prev.linksInCount === next.linksInCount &&
    prev.linksOutCount === next.linksOutCount &&
    prev.isExpanded === next.isExpanded &&
    prev.isNested === next.isNested &&
    prev.isTrackingOnly === next.isTrackingOnly &&
    prev.isMainKeyword === next.isMainKeyword &&
    prev.clusterChildCount === next.clusterChildCount &&
    prev.selectedDomain === next.selectedDomain &&
    prev.googleMovement === next.googleMovement &&
    prev.bingMovement === next.bingMovement &&
    prev.yahooMovement === next.yahooMovement &&
    prev.metricsLoading === next.metricsLoading &&
    prev.isBaselineReport === next.isBaselineReport
  );
}

export const BronKeywordCard = memo(({
  keyword: kw,
  serpData,
  keywordMetrics: metrics,
  pageSpeedScore,
  linksInCount,
  linksOutCount,
  isExpanded,
  isNested = false,
  isTrackingOnly = false,
  isMainKeyword = false,
  clusterChildCount,
  selectedDomain,
  googleMovement,
  bingMovement,
  yahooMovement,
  metricsLoading,
  isBaselineReport = false,
  onToggleExpand,
  onOpenAnalysis,
}: BronKeywordCardProps) => {
  const keywordText = getKeywordDisplayText(kw);
  const deleted = kw.deleted === 1 || kw.is_deleted === true;
  const active = kw.active === 1 && !deleted;
  const intent = useMemo(() => getKeywordIntent(keywordText), [keywordText]);
  const IntentIcon = intent.icon;

  // Keep action icon sizing consistent across all keyword cards
  const actionIconSize = 'w-4 h-4';
  
  // SERP positions
  const googlePos = getPosition(serpData?.google);
  const bingPos = getPosition(serpData?.bing);
  const yahooPos = getPosition(serpData?.yahoo);

  // Per-report movement (vs previous report) when present in the API value (e.g. "12+3")
  const googlePrevDelta = getPositionDelta(serpData?.google);
  const bingPrevDelta = getPositionDelta(serpData?.bing);
  const yahooPrevDelta = getPositionDelta(serpData?.yahoo);

  // Build URL for this keyword
  const keywordUrl = useMemo(() => {
    if (kw.linkouturl) return kw.linkouturl;
    if (selectedDomain && !isTrackingOnly) {
      const keywordSlug = keywordText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `https://${selectedDomain}/${keywordSlug}`;
    }
    return null;
  }, [kw.linkouturl, selectedDomain, keywordText, isTrackingOnly]);

  // Nested/supporting keywords are smaller - tighter padding
  // IMPORTANT: keep LEFT padding aligned with non-nested rows so PageSpeed + Intent columns
  // stay perfectly vertically aligned across main + supporting cards.
  const isCompact = isNested;
  const rowPadding = isCompact ? 'pl-4 pr-3 py-1.5' : 'px-4 py-2';
  const gaugeSize = isCompact ? 'w-9 h-9' : 'w-10 h-10';
  const textSize = isCompact ? 'text-sm' : 'text-sm';
  const badgeSize = isCompact ? 'text-[8px] h-4 px-1.5' : 'text-[9px] h-4 px-1.5';

  // NOTE: This list is high-density; avoid expensive box-shadow/blur animations and `transition-all`
  // which can cause scroll/hover jank that looks like "glitching".
  const cardVariant: 'nested' | 'tracking' | 'main' | 'standard' = isNested
    ? 'nested'
    : isTrackingOnly
      ? 'tracking'
      : isMainKeyword
        ? 'main'
        : 'standard';

  const cardClassName = (() => {
    const base =
      'rounded-xl border overflow-hidden no-theme-transition backdrop-blur-sm ' +
      'transition-[background-color,border-color,box-shadow] duration-200 ease-out';

    if (cardVariant === 'nested') {
      return `${base} bg-card/40 border-primary/20 hover:border-primary/30`;
    }
    if (cardVariant === 'tracking') {
      return `${base} bg-muted/20 border-border/30 hover:bg-muted/30`;
    }
    if (cardVariant === 'main') {
      return `${base} bg-card/50 border-primary/25 hover:border-primary/35`;
    }
    return `${base} bg-card/30 border-border/30 hover:border-primary/25`;
  })();

  const cardShadow = cardVariant === 'main'
    ? '0 0 22px hsl(var(--primary) / 0.10), inset 0 1px 0 hsl(var(--foreground) / 0.04)'
    : cardVariant === 'nested'
      ? '0 0 14px hsl(var(--primary) / 0.06)'
      : undefined;
  
  return (
    <div
      className={`${deleted ? 'opacity-50' : ''} no-theme-transition group/card`}
      style={{ contain: 'layout style paint' }}
      data-no-theme-transition
    >
      <div 
        className={cardClassName}
        style={{ contain: 'layout style', boxShadow: cardShadow }}
      >
        {/* Header - Clickable */}
        <div className={`${rowPadding} cursor-pointer overflow-x-auto`} onClick={onToggleExpand}>
          {/* Grid-based layout - nested cards skip first column since they're already offset by tree connector */}
          <div 
            className="grid items-center gap-2 w-full" 
            style={{ 
              // Rebalanced: smaller keyword(minmax), larger metrics(140px) and links(110px) to prevent overlap
              gridTemplateColumns: isNested 
                ? '52px 44px minmax(100px, 1fr) 90px 90px 90px 140px 110px'  // 8 columns
                : '44px 52px 44px minmax(100px, 1fr) 90px 90px 90px 140px 110px',  // 9 columns with chart
            }}
          >
            {/* Column 1: Chart/Analysis Button - only for non-nested cards */}
            {!isNested && (
              <div className="flex items-center justify-start">
                {onOpenAnalysis ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAnalysis(kw);
                    }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 hover:border-primary/30 transition-[background-color,border-color,transform] duration-200 hover:scale-105"
                    title="View Keyword Analysis"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="w-10 h-10" /> 
                )}
              </div>
            )}

            {/* Column 2 (or 1 for nested): Page Speed Gauge - fixed width and height for consistent alignment */}
            <div className="flex items-center justify-center w-[52px] h-12">
              <PageSpeedGauge 
                score={pageSpeedScore?.mobileScore || 0}
                loading={pageSpeedScore?.loading}
                updating={pageSpeedScore?.updating}
                error={pageSpeedScore?.error}
              />
            </div>

            {/* Column 3: Intent Badge - fixed height container for consistent alignment */}
            <div className="flex flex-col items-center justify-center h-12">
              <div className={`w-7 h-7 rounded-lg ${intent.bgColor} border flex items-center justify-center`}>
                <IntentIcon className={`w-3.5 h-3.5 ${intent.color}`} />
              </div>
              <span className={`text-[7px] font-medium capitalize ${intent.color} whitespace-nowrap leading-none mt-0.5`}>
                {intent.type.slice(0, 4)}
              </span>
            </div>

            {/* Column 4: Keyword Text - removed right padding for tighter spacing */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {/* Simple dot indicator - no TARGET pill */}
                <span 
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isMainKeyword && !isNested
                      ? 'bg-cyan-500'
                      : isNested 
                        ? 'bg-cyan-400' 
                        : 'bg-primary/60'
                  }`} 
                />
                
                <h3 
                  className={`font-medium truncate ${textSize} ${
                    isNested 
                      ? 'text-cyan-600 dark:text-cyan-400' 
                      : isMainKeyword 
                        ? 'text-cyan-500' 
                        : 'text-foreground'
                  }`}
                  title={keywordText}
                >
                  {keywordText.includes(':') ? keywordText.split(':')[0].trim() : keywordText}
                </h3>
                
                {keywordUrl && (
                  <a
                    href={keywordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 p-1 rounded-md hover:bg-primary/20"
                    title={`Open ${keywordUrl}`}
                  >
                    <ArrowUpRight className={`${actionIconSize} text-muted-foreground hover:text-primary`} />
                  </a>
                )}
                
                {isNested && (
                  <Badge className={`${badgeSize} bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 whitespace-nowrap`}>
                    Supporting
                  </Badge>
                )}
                {isTrackingOnly && (
                  <Badge className={`${badgeSize} bg-muted text-muted-foreground border-muted-foreground/30 whitespace-nowrap`}>
                    Tracking
                  </Badge>
                )}
              </div>
            </div>

            {/* Columns 5-7: SERP Rankings (Google, Bing, Yahoo) */}
            <RankingsDisplay
              googlePos={googlePos}
              bingPos={bingPos}
              yahooPos={yahooPos}
              googleMovement={googleMovement}
              bingMovement={bingMovement}
              yahooMovement={yahooMovement}
              googlePrevDelta={googlePrevDelta}
              bingPrevDelta={bingPrevDelta}
              yahooPrevDelta={yahooPrevDelta}
              isBaselineReport={isBaselineReport}
            />

            {/* Column 8: Keyword Metrics - no extra margin, grid handles spacing */}
            <div className="flex items-center justify-center">
              <MetricsDisplay 
                metrics={metrics} 
                googlePos={googlePos} 
                loading={metricsLoading}
              />
            </div>

            {/* Column 9: Links Pill - entire pill is clickable for collapse */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card/80 border border-border/40 hover:bg-card transition-colors ${
                  isExpanded ? 'ring-1 ring-primary/40' : ''
                }`}
                title={isExpanded ? 'Collapse' : 'Expand to view links'}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {/* Collapse/Expand chevron */}
                <div className={`shrink-0 w-6 h-6 rounded flex items-center justify-center ${
                  isExpanded 
                    ? 'bg-primary/20 text-primary' 
                    : 'text-muted-foreground'
                }`}>
                  {isExpanded 
                    ? <ChevronUp className="w-4 h-4" /> 
                    : <ChevronDown className="w-4 h-4" />
                  }
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-cyan-400">{linksInCount}</span>
                  <ArrowDownLeft className={`${actionIconSize} text-cyan-400`} />
                </div>

                {/* Center link icon */}
                <div className="shrink-0 w-5 h-5 rounded-full bg-background/40 border border-border/50 flex items-center justify-center">
                  <Link className="w-3 h-3 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-1">
                  <ArrowUpRight className={`${actionIconSize} text-violet-400`} />
                  <span className="text-xs font-semibold text-violet-400">{linksOutCount}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, areBronKeywordCardPropsEqual);

BronKeywordCard.displayName = 'BronKeywordCard';
