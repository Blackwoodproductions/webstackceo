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
  // Check all possible text fields from BRON API
  // Different BRON packages may use different field names
  if (kw.keywordtitle && kw.keywordtitle.trim()) return kw.keywordtitle;
  if (kw.keyword && kw.keyword.trim()) return kw.keyword;
  if (kw.metatitle && kw.metatitle.trim()) return kw.metatitle;
  
  // Some BRON packages use 'title' or 'name' fields
  const kwAny = kw as unknown as Record<string, unknown>;
  if (typeof kwAny.title === 'string' && kwAny.title.trim()) return kwAny.title;
  if (typeof kwAny.name === 'string' && kwAny.name.trim()) return kwAny.name;
  if (typeof kwAny.keyword_text === 'string' && kwAny.keyword_text.trim()) return kwAny.keyword_text;
  if (typeof kwAny.text === 'string' && kwAny.text.trim()) return kwAny.text;
  if (typeof kwAny.phrase === 'string' && kwAny.phrase.trim()) return kwAny.phrase;
  
  // Try to extract from resfeedtext HTML content FIRST (before URL fallback)
  // This is the primary source for domains like seolocal.it.com
  if (kw.resfeedtext) {
    const decoded = kw.resfeedtext
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
      .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—');
    
    // Try h3 first (common in BRON content), then h1, then h2, then title
    const h3Match = decoded.match(/<h3[^>]*>([^<]+)<\/h3>/i);
    if (h3Match && h3Match[1] && h3Match[1].trim().length > 3) {
      const title = h3Match[1].trim();
      // Clean up common prefixes like "Benefits of", "Guide to", etc.
      return title;
    }
    
    const h1Match = decoded.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match && h1Match[1] && h1Match[1].trim().length > 3) return h1Match[1].trim();
    
    const h2Match = decoded.match(/<h2[^>]*>([^<]+)<\/h2>/i);
    if (h2Match && h2Match[1] && h2Match[1].trim().length > 3) return h2Match[1].trim();
    
    const titleMatch = decoded.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1] && titleMatch[1].trim().length > 3) return titleMatch[1].trim();
  }
  
  // Check linkouturl for keyword slug
  if (kw.linkouturl) {
    // Extract last path segment as keyword hint
    const urlPath = kw.linkouturl.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '');
    const lastSegment = urlPath.split('/').pop();
    if (lastSegment && lastSegment.length > 2) {
      // Remove trailing ID pattern like "-568071bc"
      const cleanedSegment = lastSegment.replace(/-\d+bc$/, '');
      // Convert slug to readable text: "best-dentist-port-coquitlam" -> "Best Dentist Port Coquitlam"
      const readable = cleanedSegment
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .split(' ')
        .filter(w => w.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      if (readable.length > 3) return readable;
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
        {showLoading || showPending ? (
          <span className="text-xs text-muted-foreground">—</span>
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
    <div className="flex items-center justify-center gap-1 w-[70px] h-7">
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
    <div className="flex items-center justify-center gap-1">
      <div className="w-[70px] flex justify-center">
        {renderRanking(googlePos, getMovementFromDelta(googleMovement))}
      </div>
      <div className="w-[70px] flex justify-center">
        {renderRanking(bingPos, getMovementFromDelta(bingMovement))}
      </div>
      <div className="w-[70px] flex justify-center">
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
    if (vol === undefined || vol === null) return '—';
    if (vol >= 10000) return `${(vol / 1000).toFixed(0)}K`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return String(vol);
  };

  const ctrValue = getEstimatedCTR(googlePos);
  
  return (
    <div className="grid grid-cols-3 gap-1.5">
      <div className="flex flex-col items-center px-1 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center gap-0.5">
          <DollarSign className="w-2.5 h-2.5 text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400">
            {loading ? '...' : metrics?.cpc !== undefined ? `$${metrics.cpc.toFixed(0)}` : '—'}
          </span>
        </div>
        <span className="text-[7px] text-emerald-400/70">CPC</span>
      </div>
      
      <div className="flex flex-col items-center px-1 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
        <div className="flex items-center gap-0.5">
          <Search className="w-2.5 h-2.5 text-cyan-400" />
          <span className="text-[10px] font-bold text-cyan-400">
            {loading ? '...' : formatVolume(metrics?.search_volume)}
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

  return (
    <div
      className={deleted ? 'opacity-50' : ''}
      style={{ contain: 'layout style', willChange: 'auto' }}
    >
      <div 
        className={`
          rounded-xl border overflow-hidden
          ${isNested 
            ? 'border-l-2 border-l-hover-accent/60 bg-hover-accent/10 border-hover-accent/25'
            : isTrackingOnly 
              ? 'bg-hover-accent/5 border-hover-accent/20'
              : 'bg-primary/10 border-primary/25'
          }
        `}
        style={{ contain: 'layout style' }}
      >
        {/* Header - Clickable */}
        <div className="p-4 cursor-pointer overflow-x-auto" onClick={onToggleExpand}>
          <div className="flex items-center w-full justify-between" style={{ minWidth: '1050px' }}>
            {/* Column 1: Page Speed Gauge */}
            <div className="w-[70px] flex-shrink-0 flex items-center justify-center">
              <PageSpeedGauge 
                score={pageSpeedScore?.mobileScore || 0}
                loading={pageSpeedScore?.loading}
                updating={pageSpeedScore?.updating}
                error={pageSpeedScore?.error}
              />
            </div>

            {/* Column 2: Keyword Text */}
            <div className="w-[380px] flex-shrink-0 pr-4">
              <div className="flex items-center gap-2">
                <h3 
                  className={`font-medium truncate max-w-[320px] ${isNested ? 'text-foreground/80' : 'text-foreground'}`}
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
                    className="flex-shrink-0 p-1 rounded-md hover:bg-primary/20 transition-colors"
                    title={`Open ${keywordUrl}`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                  </a>
                )}
                
                {/* Only show tracking badge for tracking-only keywords */}
                {isTrackingOnly && (
                  <Badge className="text-[9px] h-5 px-2 bg-hover-accent/20 text-hover-accent border-hover-accent/30 whitespace-nowrap">
                    Tracking
                  </Badge>
                )}
              </div>
            </div>

            {/* Column 3: Intent Badge */}
            <div className="w-[140px] flex-shrink-0 flex items-center justify-center">
              <div className="w-[130px] bg-card border border-border/60 rounded-md px-3 py-1.5 flex items-center gap-2 justify-center">
                <div className={`w-5 h-5 rounded ${intent.bgColor} border flex items-center justify-center flex-shrink-0`}>
                  <IntentIcon className={`w-3 h-3 ${intent.color}`} />
                </div>
                <span className={`text-[10px] font-medium capitalize ${intent.color} whitespace-nowrap`}>
                  {intent.type}
                </span>
              </div>
            </div>

            {/* Column 4: SERP Rankings */}
            <div className="w-[220px] flex-shrink-0">
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
            <div className="w-[140px] flex-shrink-0">
              <MetricsDisplay 
                metrics={metrics} 
                googlePos={googlePos} 
                loading={metricsLoading}
              />
            </div>

            {/* Column 6: Links Display */}
            <div className="w-[80px] flex-shrink-0 flex justify-center">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card/80 border border-border/40">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-cyan-400">{linksInCount}</span>
                  <ArrowDownLeft className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="w-px h-4 bg-border/40" />
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-semibold text-violet-400">{linksOutCount}</span>
                </div>
              </div>
            </div>

            {/* Column 7: Expand/Collapse */}
            <div className="w-[40px] flex-shrink-0 flex justify-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isExpanded 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted/50 text-muted-foreground'
              }`}>
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, areBronKeywordCardPropsEqual);

BronKeywordCard.displayName = 'BronKeywordCard';
