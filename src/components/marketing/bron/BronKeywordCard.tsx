import { memo, useMemo } from "react";
import { 
  ChevronUp, ChevronDown, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown, Minus, DollarSign, Gauge, MousePointerClick,
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
  if (kw.keywordtitle && kw.keywordtitle.trim()) return kw.keywordtitle;
  if (kw.keyword && kw.keyword.trim()) return kw.keyword;
  if (kw.metatitle && kw.metatitle.trim()) return kw.metatitle;
  if (kw.resfeedtext) {
    const decoded = kw.resfeedtext
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    const h1Match = decoded.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match && h1Match[1]) return h1Match[1].trim();
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

// PageSpeed Gauge Component - static rendering (no animations to prevent flicker)
const PageSpeedGauge = memo(({ score, loading, updating, error }: { 
  score: number; 
  loading?: boolean; 
  updating?: boolean; 
  error?: boolean;
}) => {
  const isPending = score === 0 && !error && !loading && !updating;
  
  const getGaugeColor = () => {
    if (loading || isPending) return { stroke: '#22d3ee', text: 'text-cyan-400' }; // cyan-400
    if (error) return { stroke: '#6b7280', text: 'text-muted-foreground' }; // gray-500
    if (score >= 90) return { stroke: '#10b981', text: 'text-emerald-400' }; // emerald-500
    if (score >= 50) return { stroke: '#f59e0b', text: 'text-amber-400' }; // amber-500
    return { stroke: '#ef4444', text: 'text-red-400' }; // red-500
  };
  
  const colors = getGaugeColor();
  const circumference = 2 * Math.PI * 18;
  const progress = error || loading || isPending ? 0 : (score / 100);
  const strokeDashoffset = circumference * (1 - progress);
  
  return (
    <div 
      className="relative w-12 h-12 flex items-center justify-center"
      title={updating ? 'Updating...' : isPending ? 'Pending...' : `Score: ${score}/100`}
    >
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        {/* Background circle */}
        <circle 
          cx="22" cy="22" r="18" 
          fill="none" 
          stroke="hsl(var(--muted) / 0.3)" 
          strokeWidth="3" 
        />
        {/* Progress circle - no animation */}
        <circle
          cx="22" cy="22" r="18" 
          fill="none" 
          strokeWidth="3" 
          strokeLinecap="round"
          stroke={loading || isPending ? 'hsl(var(--muted) / 0.5)' : colors.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={loading || isPending ? circumference * 0.75 : strokeDashoffset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {(loading || isPending) ? (
          <span className="text-xs text-muted-foreground">...</span>
        ) : (
          <span className={`text-sm font-bold ${colors.text}`}>{error ? '—' : score}</span>
        )}
      </div>
      {updating && (
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-cyan-500 border border-background" />
      )}
    </div>
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
      {renderRanking(googlePos, getMovementFromDelta(googleMovement))}
      {renderRanking(bingPos, getMovementFromDelta(bingMovement))}
      {renderRanking(yahooPos, getMovementFromDelta(yahooMovement))}
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
  const getCompetitionColor = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'LOW': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'MEDIUM': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'HIGH': return 'text-red-400 border-red-500/30 bg-red-500/10';
      default: return 'text-muted-foreground border-border bg-muted/30';
    }
  };

  const getEstimatedCTR = (pos: number | null) => {
    if (pos === null) return null;
    if (pos <= 1) return '32%';
    if (pos <= 2) return '17%';
    if (pos <= 3) return '11%';
    if (pos <= 5) return '6%';
    if (pos <= 10) return '2%';
    return '<1%';
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
      
      <div className={`flex flex-col items-center px-1 py-1 rounded-lg border ${getCompetitionColor(metrics?.competition_level)}`}>
        <div className="flex items-center gap-0.5">
          <Gauge className="w-2.5 h-2.5" />
          <span className="text-[10px] font-bold capitalize">
            {loading ? '...' : metrics?.competition_level?.slice(0, 3).toLowerCase() || '—'}
          </span>
        </div>
        <span className="text-[7px] opacity-70">Diff</span>
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
      style={{ contain: 'layout style paint', willChange: 'auto' }}
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
        style={{ contain: 'content' }}
      >
        {/* Header - Clickable */}
        <div className="p-4 cursor-pointer overflow-x-auto" onClick={onToggleExpand}>
          <div className="flex items-center w-full justify-between" style={{ minWidth: '1050px' }}>
            {/* Column 1: Page Speed Gauge */}
            <div className="w-[70px] flex-shrink-0 flex justify-center">
              <PageSpeedGauge 
                score={pageSpeedScore?.mobileScore || 0}
                loading={pageSpeedScore?.loading}
                updating={pageSpeedScore?.updating}
                error={pageSpeedScore?.error}
              />
            </div>

            {/* Column 2: Keyword Text */}
            <div className="w-[320px] flex-shrink-0 pr-4">
              <div className="flex items-center gap-2">
                <h3 
                  className={`font-medium truncate max-w-[180px] ${isNested ? 'text-foreground/80' : 'text-foreground'}`}
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
                
                {/* Badges container - fixed width to ensure alignment */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isTrackingOnly ? (
                    <Badge className="text-[9px] h-5 px-2 bg-hover-accent/20 text-hover-accent border-hover-accent/30 whitespace-nowrap">
                      Tracking
                    </Badge>
                  ) : isNested ? (
                    <Badge className="text-[9px] h-5 px-2 bg-hover-accent/20 text-hover-accent border-hover-accent/30 whitespace-nowrap">
                      Supporting
                    </Badge>
                  ) : (
                    <>
                      <Badge className="text-[9px] h-5 px-2 bg-primary/20 text-primary border-primary/30 whitespace-nowrap">
                        Main
                      </Badge>
                      {clusterChildCount !== undefined && clusterChildCount > 0 && (
                        <Badge className="text-[9px] h-5 px-2 bg-violet-500/20 text-violet-400 border-violet-500/30 whitespace-nowrap">
                          +{clusterChildCount}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Column 3: Intent Badge */}
            <div className="w-[140px] flex-shrink-0 flex justify-center">
              <div className="bg-card border border-border/60 rounded-md px-3 py-1.5 flex items-center gap-2 justify-center">
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
            <div className="w-[180px] flex-shrink-0">
              <MetricsDisplay 
                metrics={metrics} 
                googlePos={googlePos} 
                loading={metricsLoading}
              />
            </div>

            {/* Column 6: Links Display */}
            <div className="w-[90px] flex-shrink-0 flex justify-center">
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
