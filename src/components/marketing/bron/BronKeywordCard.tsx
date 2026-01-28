import { memo, useMemo } from "react";
import { 
  ChevronUp, ChevronDown, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown, Minus, DollarSign, Gauge, MousePointerClick,
  ShoppingCart, Info, Compass, Target, RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BronKeyword, BronSerpReport } from "@/hooks/use-bron-api";
import { getKeywordDisplayText, getPosition, PageSpeedScore } from "./utils";

// Re-export for backwards compatibility
export { getKeywordDisplayText, getPosition } from "./utils";
export type { PageSpeedScore } from "./utils";

// Types
export interface KeywordMetrics {
  search_volume: number;
  cpc: number;
  competition: number;
  competition_level: string;
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
  if (movement > 0) {
    return { type: 'up' as const, color: 'text-orange-400', bgColor: 'bg-orange-500/20', glow: true, delta: movement };
  } else if (movement < 0) {
    return { type: 'down' as const, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', glow: false, delta: movement };
  }
  return { type: 'same' as const, color: 'text-blue-400', bgColor: 'bg-blue-500/10', glow: false, delta: 0 };
}

// PageSpeed Gauge Component - memoized
const PageSpeedGauge = memo(({ score, loading, updating, error }: { 
  score: number; 
  loading?: boolean; 
  updating?: boolean; 
  error?: boolean;
}) => {
  const isPending = score === 0 && !error && !loading && !updating;
  
  const getGaugeColor = () => {
    if (loading || isPending) return { stroke: 'stroke-cyan-500/40', text: 'text-cyan-400', glow: '' };
    if (error) return { stroke: 'stroke-muted-foreground/30', text: 'text-muted-foreground', glow: '' };
    if (score >= 90) return { stroke: 'stroke-emerald-500', text: 'text-emerald-400', glow: 'drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]' };
    if (score >= 50) return { stroke: 'stroke-amber-500', text: 'text-amber-400', glow: 'drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]' };
    return { stroke: 'stroke-red-500', text: 'text-red-400', glow: 'drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]' };
  };
  
  const colors = getGaugeColor();
  const circumference = 2 * Math.PI * 18;
  const progress = error || loading || isPending ? 0 : (score / 100);
  const strokeDashoffset = circumference * (1 - progress);
  
  return (
    <div 
      className="relative w-12 h-12 flex items-center justify-center"
      title={updating ? 'Updating...' : isPending ? 'Loading...' : `Score: ${score}/100`}
    >
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
        {(loading || isPending) ? (
          <circle
            cx="22" cy="22" r="18" fill="none" strokeWidth="3" strokeLinecap="round"
            className="stroke-cyan-500/50"
            style={{ animation: 'spin 2s linear infinite', transformOrigin: '22px 22px' }}
            strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
          />
        ) : (
          <circle
            cx="22" cy="22" r="18" fill="none" strokeWidth="3" strokeLinecap="round"
            className={`${colors.stroke} ${colors.glow}`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {(loading || isPending) ? (
          <Gauge className="w-4 h-4 text-cyan-400/70" />
        ) : (
          <span className={`text-sm font-bold ${colors.text}`}>{error ? '—' : score}</span>
        )}
      </div>
      {updating && (
        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-cyan-500/90 flex items-center justify-center">
          <RefreshCw className="w-2.5 h-2.5 text-white animate-spin" />
        </div>
      )}
    </div>
  );
});
PageSpeedGauge.displayName = 'PageSpeedGauge';

// Rankings Display Component - memoized
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
  const renderRanking = (label: string, pos: number | null, movement: ReturnType<typeof getMovementFromDelta>) => (
    <div className="flex flex-col items-center">
      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</span>
      <div className="flex items-center justify-center gap-1">
        <span className={`text-xl font-bold ${pos !== null ? 'text-foreground' : 'text-muted-foreground'}`}>
          {pos !== null ? `#${pos}` : '—'}
        </span>
        {pos !== null && movement.delta !== 0 && (
          <div className={`flex items-center gap-0.5 ${movement.color}`}>
            {movement.type === 'up' && <TrendingUp className={`w-3.5 h-3.5 ${movement.glow ? 'drop-shadow-[0_0_4px_rgba(251,146,60,0.6)]' : ''}`} />}
            {movement.type === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            <span className="text-xs font-semibold">{movement.delta > 0 ? `+${movement.delta}` : movement.delta}</span>
          </div>
        )}
        {pos !== null && movement.delta === 0 && <Minus className="w-3 h-3 text-blue-400/50" />}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-3 text-center">
      {renderRanking('Google', googlePos, getMovementFromDelta(googleMovement))}
      {renderRanking('Bing', bingPos, getMovementFromDelta(bingMovement))}
      {renderRanking('Yahoo', yahooPos, getMovementFromDelta(yahooMovement))}
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
      style={{ contain: 'layout style paint' }}
    >
      <div 
        className={`
          rounded-xl border overflow-hidden
          ${isNested 
            ? 'border-l-2 border-l-orange-500/50 ml-2 bg-orange-500/5 border-orange-500/20' + (isExpanded ? ' ring-1 ring-orange-500/40' : '')
            : isTrackingOnly 
              ? 'bg-amber-500/5 border-amber-500/20' + (isExpanded ? ' ring-1 ring-amber-500/40' : '')
              : 'bg-blue-500/5 border-blue-500/20' + (isExpanded ? ' ring-1 ring-blue-500/40' : ' border-blue-500/30')
          }
        `}
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
              <div className={`flex items-center gap-2 ${isNested ? 'pl-3' : ''}`}>
                <h3 
                  className={`font-medium truncate ${isNested ? 'text-foreground/80' : 'text-foreground'}`}
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
                
                {isTrackingOnly ? (
                  <Badge className="text-[9px] h-5 px-2 bg-amber-500/20 text-amber-400 border-amber-500/30 whitespace-nowrap flex-shrink-0">
                    Tracking
                  </Badge>
                ) : isNested ? (
                  <Badge className="text-[9px] h-5 px-2 bg-orange-500/20 text-orange-400 border-orange-500/30 whitespace-nowrap flex-shrink-0">
                    Supporting
                  </Badge>
                ) : (
                  <>
                    {active && (
                      <Badge className="text-[9px] h-5 px-2 bg-blue-500/20 text-blue-400 border-blue-500/30 whitespace-nowrap flex-shrink-0">
                        Main
                      </Badge>
                    )}
                    {clusterChildCount && clusterChildCount > 0 && (
                      <Badge className="text-[9px] h-5 px-2 bg-violet-500/20 text-violet-400 border-violet-500/30 whitespace-nowrap flex-shrink-0">
                        +{clusterChildCount}
                      </Badge>
                    )}
                  </>
                )}
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
                  <ArrowDownLeft className="w-3.5 h-3.5 text-cyan-400 rotate-90" />
                  <span className="text-xs font-semibold text-cyan-400">{linksInCount}</span>
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isExpanded 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}>
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

BronKeywordCard.displayName = 'BronKeywordCard';
