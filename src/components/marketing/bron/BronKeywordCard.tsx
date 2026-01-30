import { memo, useMemo } from "react";
import { 
  ChevronUp, ChevronDown, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown, Minus, DollarSign, Search, MousePointerClick,
  ShoppingCart, Info, Compass, Target, RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  onToggleExpand: () => void;
}

// Utility functions
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

function getKeywordIntent(keyword: string) {
  const kw = keyword.toLowerCase();
  
  const transactionalPatterns = ['buy', 'purchase', 'order', 'book', 'hire', 'get', 'download', 'subscribe', 'sign up', 'register', 'schedule', 'appointment', 'quote', 'pricing', 'cost', 'price', 'deal', 'discount', 'coupon', 'free trial'];
  if (transactionalPatterns.some(p => kw.includes(p))) {
    return { type: 'transactional' as const, icon: ShoppingCart, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30' };
  }
  
  const commercialPatterns = ['best', 'top', 'review', 'vs', 'versus', 'compare', 'comparison', 'alternative', 'affordable', 'cheap', 'premium', 'professional', 'rated', 'recommended', 'trusted'];
  if (commercialPatterns.some(p => kw.includes(p))) {
    return { type: 'commercial' as const, icon: Target, color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/30' };
  }
  
  const navigationalPatterns = ['login', 'sign in', 'website', 'official', 'contact', 'near me', 'location', 'address', 'hours', 'directions'];
  if (navigationalPatterns.some(p => kw.includes(p))) {
    return { type: 'navigational' as const, icon: Compass, color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' };
  }
  
  return { type: 'informational' as const, icon: Info, color: 'text-violet-400', bgColor: 'bg-violet-500/20 border-violet-500/30' };
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

// Rankings Display Component - memoized (labels are shown in header row, not here)
const RankingsDisplay = memo(({ 
  googlePos, bingPos, yahooPos, 
  googleMovement, bingMovement, yahooMovement 
}: { 
  googlePos: number | null;
  bingPos: number | null;
  yahooPos: number | null;
  googleMovement: number;
  bingMovement: number;
  yahooMovement: number;
}) => {
  const getPositionColor = (movement: ReturnType<typeof getMovementFromDelta>) => {
    if (movement.type === 'up') return 'text-emerald-400';
    if (movement.type === 'down') return 'text-red-400';
    return 'text-muted-foreground';
  };

  const renderRanking = (pos: number | null, movement: ReturnType<typeof getMovementFromDelta>) => (
    <div className="flex items-center justify-center gap-1 w-[80px] h-7">
      <span className={`text-lg font-normal ${pos !== null ? getPositionColor(movement) : 'text-muted-foreground/50'}`}>
        {pos !== null ? `#${pos}` : '—'}
      </span>
      {pos !== null && movement.delta !== 0 && (
        <div className={`flex items-center gap-0.5 ${movement.color}`}>
          {movement.type === 'up' && <TrendingUp className="w-3 h-3" />}
          {movement.type === 'down' && <TrendingDown className="w-3 h-3" />}
        </div>
      )}
      {pos !== null && movement.delta === 0 && <Minus className="w-2.5 h-2.5 text-muted-foreground/50" />}
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-[80px] flex justify-center">
        {renderRanking(googlePos, getMovementFromDelta(googleMovement))}
      </div>
      <div className="w-[80px] flex justify-center">
        {renderRanking(bingPos, getMovementFromDelta(bingMovement))}
      </div>
      <div className="w-[80px] flex justify-center">
        {renderRanking(yahooPos, getMovementFromDelta(yahooMovement))}
      </div>
    </div>
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
    <div className="grid grid-cols-3 gap-1.5" style={{ contain: 'layout style' }}>
      <div className="flex flex-col items-center px-1 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center gap-0.5">
          <DollarSign className="w-2.5 h-2.5 text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400">
            {showCpcLoading ? (
              <span className="opacity-50">...</span>
            ) : hasCachedCpc ? (
              `$${metrics!.cpc.toFixed(0)}`
            ) : (
              '—'
            )}
          </span>
        </div>
        <span className="text-[7px] text-emerald-400/70">CPC</span>
      </div>
      
      <div className="flex flex-col items-center px-1 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
        <div className="flex items-center gap-0.5">
          <Search className="w-2.5 h-2.5 text-cyan-400" />
          <span className="text-[10px] font-bold text-cyan-400">
            {showVolLoading ? (
              <span className="opacity-50">...</span>
            ) : hasCachedVolume ? (
              formatVolume(metrics!.search_volume)
            ) : (
              '—'
            )}
          </span>
        </div>
        <span className="text-[7px] text-cyan-400/70">Vol</span>
      </div>
      
      <div className="flex flex-col items-center px-1 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30">
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
    prev.metricsLoading === next.metricsLoading
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
  onToggleExpand,
}: BronKeywordCardProps) => {
  const keywordText = getKeywordDisplayText(kw);
  const deleted = kw.deleted === 1 || kw.is_deleted === true;
  const active = kw.active === 1 && !deleted;
  const intent = useMemo(() => getKeywordIntent(keywordText), [keywordText]);
  const IntentIcon = intent.icon;
  
  // SERP positions
  const googlePos = getPosition(serpData?.google);
  const bingPos = getPosition(serpData?.bing);
  const yahooPos = getPosition(serpData?.yahoo);

  // Build URL for this keyword
  const keywordUrl = useMemo(() => {
    if (kw.linkouturl) return kw.linkouturl;
    if (selectedDomain && !isTrackingOnly) {
      const keywordSlug = keywordText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `https://${selectedDomain}/${keywordSlug}`;
    }
    return null;
  }, [kw.linkouturl, selectedDomain, keywordText, isTrackingOnly]);

  // Nested/supporting keywords are smaller
  const isCompact = isNested;
  const rowPadding = isCompact ? 'p-2.5' : 'p-4';
  const gaugeSize = isCompact ? 'w-10 h-10' : 'w-12 h-12';
  const textSize = isCompact ? 'text-sm' : 'text-base';
  const badgeSize = isCompact ? 'text-[8px] h-4 px-1.5' : 'text-[9px] h-5 px-2';
  
  return (
    <div
      className={`${deleted ? 'opacity-50' : ''} no-theme-transition`}
      style={{ contain: 'layout style paint' }}
      data-no-theme-transition
    >
      <div 
        className={`
          rounded-lg border overflow-hidden no-theme-transition
          ${isNested 
            ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
            : isTrackingOnly 
              ? 'bg-muted/30 border-muted-foreground/20'
              : isMainKeyword
                ? 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10'
                : 'bg-card/80 border-border/40 hover:bg-card'
          }
          transition-colors duration-150
        `}
        style={{ contain: 'layout style' }}
      >
        {/* Header - Clickable */}
        <div className={`${rowPadding} cursor-pointer overflow-x-auto`} onClick={onToggleExpand}>
          {/* Grid-based layout for consistent columns */}
          <div 
            className="grid items-center gap-4" 
            style={{ 
              gridTemplateColumns: '80px 1fr 160px 260px 160px 100px 48px',
              minWidth: '1000px'
            }}
          >
            {/* Column 1: Page Speed Gauge */}
            <div className="flex items-center justify-center">
              <div className={gaugeSize}>
                <PageSpeedGauge 
                  score={pageSpeedScore?.mobileScore || 0}
                  loading={pageSpeedScore?.loading}
                  updating={pageSpeedScore?.updating}
                  error={pageSpeedScore?.error}
                />
              </div>
            </div>

            {/* Column 2: Keyword Text */}
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <span 
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isNested 
                      ? 'bg-amber-500' 
                      : isMainKeyword 
                        ? 'bg-blue-500'
                        : 'bg-primary/60'
                  }`} 
                />
                
                <h3 
                  className={`font-medium truncate ${textSize} ${
                    isNested 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : isMainKeyword 
                        ? 'text-blue-600 dark:text-blue-400' 
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
                    <ArrowUpRight className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-muted-foreground hover:text-primary`} />
                  </a>
                )}
                
                {isNested && (
                  <Badge className={`${badgeSize} bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 whitespace-nowrap`}>
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

            {/* Column 3: Intent Badge */}
            <div className="flex items-center justify-center">
              <div className={`${isCompact ? 'w-[110px] px-2 py-1' : 'w-[130px] px-3 py-1.5'} bg-card border border-border/60 rounded-md flex items-center gap-2 justify-center`}>
                <div className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} rounded ${intent.bgColor} border flex items-center justify-center flex-shrink-0`}>
                  <IntentIcon className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${intent.color}`} />
                </div>
                <span className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} font-medium capitalize ${intent.color} whitespace-nowrap`}>
                  {intent.type}
                </span>
              </div>
            </div>

            {/* Column 4: SERP Rankings */}
            <div className="flex items-center justify-center">
              <RankingsDisplay
                googlePos={googlePos}
                bingPos={bingPos}
                yahooPos={yahooPos}
                googleMovement={googleMovement}
                bingMovement={bingMovement}
                yahooMovement={yahooMovement}
              />
            </div>

            {/* Column 5: Keyword Metrics */}
            <div className="flex items-center justify-center">
              <MetricsDisplay 
                metrics={metrics} 
                googlePos={googlePos} 
                loading={metricsLoading}
              />
            </div>

            {/* Column 6: Links Display */}
            <div className="flex items-center justify-center">
              <div className={`flex items-center gap-2 ${isCompact ? 'px-2 py-1' : 'px-2.5 py-1.5'} rounded-lg bg-card/80 border border-border/40`}>
                <div className="flex items-center gap-1">
                  <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-semibold text-cyan-400`}>{linksInCount}</span>
                  <ArrowDownLeft className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-cyan-400`} />
                </div>
                <div className={`w-px ${isCompact ? 'h-3' : 'h-4'} bg-border/40`} />
                <div className="flex items-center gap-1">
                  <ArrowUpRight className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-violet-400`} />
                  <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-semibold text-violet-400`}>{linksOutCount}</span>
                </div>
              </div>
            </div>

            {/* Column 7: Expand/Collapse */}
            <div className="flex items-center justify-center">
              <div className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full flex items-center justify-center ${
                isExpanded 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted/50 text-muted-foreground'
              }`}>
                {isExpanded 
                  ? <ChevronUp className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} /> 
                  : <ChevronDown className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, areBronKeywordCardPropsEqual);

BronKeywordCard.displayName = 'BronKeywordCard';
