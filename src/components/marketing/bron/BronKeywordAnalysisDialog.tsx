import { memo, useState, useMemo, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, Sparkles, Activity, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BronKeyword, BronSerpReport, BronSerpListItem } from "@/hooks/use-bron-api";
import { getKeywordDisplayText, getPosition } from "./BronKeywordCard";
import { findSerpForKeyword } from "./utils";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { format } from "date-fns";

// Position value for unranked (displayed at bottom of chart)
const UNRANKED_POSITION = 100;

function getSerpListItemTimestamp(item: BronSerpListItem): number | null {
  const candidates: Array<string | number | undefined | null> = [
    item.started,
    item.start_date,
    item.startdate,
    item.date,
    item.created_at,
    item.created,
    item.timestamp,
  ];

  for (const c of candidates) {
    if (c === undefined || c === null) continue;
    if (typeof c === 'number') {
      const ms = c < 2_000_000_000 ? c * 1000 : c;
      if (Number.isFinite(ms) && ms > 0) return ms;
      continue;
    }
    const s = String(c).trim();
    if (!s) continue;
    if (/^\d{10,13}$/.test(s)) {
      const n = Number(s);
      if (!Number.isFinite(n)) continue;
      const ms = s.length === 10 ? n * 1000 : n;
      if (Number.isFinite(ms) && ms > 0) return ms;
      continue;
    }
    const ms = Date.parse(s);
    if (Number.isFinite(ms)) return ms;
  }

  return null;
}

interface BronKeywordAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  keyword: BronKeyword;
  relatedKeywords?: BronKeyword[];
  serpHistory: BronSerpListItem[];
  selectedDomain?: string;
  onFetchSerpDetail?: (domain: string, reportId: string) => Promise<BronSerpReport[]>;
}

type DateRange = "all" | "30d" | "60d" | "90d";

// Chart data point with Google/Bing/Yahoo positions
interface ChartDataPoint {
  date: string;
  timestamp: number;
  google: number | null;
  bing: number | null;
  yahoo: number | null;
}

// Search engine summary
interface EngineSummary {
  engine: string;
  label: string;
  best: number | null;
  current: number | null;
  baseline: number | null;
  change: number;
  color: string;
}

// Engine colors - Google blue, Bing cyan, Yahoo purple
const ENGINE_COLORS = {
  google: { stroke: "hsl(217, 91%, 60%)", fill: "hsl(217, 91%, 60%)" },
  bing: { stroke: "hsl(172, 66%, 50%)", fill: "hsl(172, 66%, 50%)" },
  yahoo: { stroke: "hsl(280, 87%, 65%)", fill: "hsl(280, 87%, 65%)" },
};

// Custom tooltip showing all 3 engines
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  
  return (
    <div className="rounded-xl border border-primary/30 bg-background/95 backdrop-blur-xl p-3 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => {
        const val = entry.value;
        const displayVal = val === UNRANKED_POSITION ? 'Unranked' : `#${val}`;
        return (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.stroke || entry.color }}
            />
            <span className="text-foreground font-semibold">{displayVal}</span>
            <span className="text-muted-foreground text-xs">{entry.name}</span>
          </div>
        );
      })}
    </div>
  );
};

export const BronKeywordAnalysisDialog = memo(({
  isOpen,
  onClose,
  keyword,
  relatedKeywords = [],
  serpHistory,
  selectedDomain,
  onFetchSerpDetail,
}: BronKeywordAnalysisDialogProps) => {
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<Map<string, BronSerpReport[]>>(new Map());
  
  const mainKeywordText = useMemo(() => getKeywordDisplayText(keyword), [keyword]);
  
  // Sort history by date (oldest first for chart)
  const sortedHistory = useMemo(() => {
    return [...serpHistory].sort((a, b) => {
      const dateA = getSerpListItemTimestamp(a) ?? 0;
      const dateB = getSerpListItemTimestamp(b) ?? 0;
      return dateA - dateB;
    });
  }, [serpHistory]);
  
  // Filter by date range
  const filteredHistory = useMemo(() => {
    if (dateRange === "all") return sortedHistory;
    
    const now = Date.now();
    const days = dateRange === "30d" ? 30 : dateRange === "60d" ? 60 : dateRange === "90d" ? 90 : 0;
    if (days === 0) return sortedHistory;
    
    const cutoff = now - (days * 24 * 60 * 60 * 1000);
    return sortedHistory.filter(item => {
      const ts = getSerpListItemTimestamp(item);
      return ts !== null && ts >= cutoff;
    });
  }, [sortedHistory, dateRange]);
  
  // Helper to get report ID from BronSerpListItem
  const getReportId = (item: BronSerpListItem): string => {
    return String(item.serpid || item.report_id || item.id || '');
  };

  // Fetch historical data for all reports
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !selectedDomain || !onFetchSerpDetail || filteredHistory.length === 0) return;
      
      setIsLoading(true);
      const dataMap = new Map<string, BronSerpReport[]>();
      
      try {
        const reportsToFetch = filteredHistory.slice(0, 20);
        
        console.log('[BronKeywordAnalysisDialog] Fetching', reportsToFetch.length, 'historical reports for keyword:', mainKeywordText);
        
        for (const item of reportsToFetch) {
          const reportId = getReportId(item);
          if (!reportId) continue;
          
          try {
            const data = await onFetchSerpDetail(selectedDomain, reportId);
            if (data?.length > 0) {
              dataMap.set(reportId, data);
            }
          } catch (e) {
            console.warn(`Failed to fetch report ${reportId}:`, e);
          }
        }
        
        setHistoricalData(dataMap);
        console.log('[BronKeywordAnalysisDialog] Fetched data for', dataMap.size, 'reports');
      } catch (err) {
        console.error('Failed to fetch historical data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [isOpen, selectedDomain, filteredHistory, onFetchSerpDetail, mainKeywordText]);
  
  // Build chart data with Google/Bing/Yahoo positions for the single keyword
  const { chartData, engineSummaries } = useMemo(() => {
    const data: ChartDataPoint[] = [];
    
    // Track positions per engine across all reports
    const googlePositions: number[] = [];
    const bingPositions: number[] = [];
    const yahooPositions: number[] = [];
    
    filteredHistory.forEach(item => {
      const reportId = getReportId(item);
      const reportData = historicalData.get(reportId);
      if (!reportData || reportData.length === 0) return;

      const timestamp = getSerpListItemTimestamp(item);
      if (timestamp === null) return;
      
      // Find this keyword in the report
      const serpItem = findSerpForKeyword(mainKeywordText, reportData);
      
      // Get positions for each engine (null if not ranked, UNRANKED_POSITION for chart)
      const googlePos = getPosition(serpItem?.google);
      const bingPos = getPosition(serpItem?.bing);
      const yahooPos = getPosition(serpItem?.yahoo);
      
      // Track actual positions (not UNRANKED_POSITION) for stats
      if (googlePos !== null) googlePositions.push(googlePos);
      if (bingPos !== null) bingPositions.push(bingPos);
      if (yahooPos !== null) yahooPositions.push(yahooPos);
      
      // Only add point if we have at least one position
      if (googlePos !== null || bingPos !== null || yahooPos !== null) {
        data.push({
          date: format(new Date(timestamp), 'MMM d'),
          timestamp,
          // Use UNRANKED_POSITION for null values so they appear at bottom of chart
          google: googlePos ?? UNRANKED_POSITION,
          bing: bingPos ?? UNRANKED_POSITION,
          yahoo: yahooPos ?? UNRANKED_POSITION,
        });
      }
    });
    
    // Calculate summaries for each engine
    const calculateSummary = (positions: number[], engine: string, label: string, color: string): EngineSummary => {
      const best = positions.length > 0 ? Math.min(...positions) : null;
      const current = positions.length > 0 ? positions[positions.length - 1] : null;
      const baseline = positions.length > 0 ? positions[0] : null;
      
      // Change from baseline to current
      const BASELINE_UNRANKED = 1000;
      let change = 0;
      if (baseline === null && current === null) {
        change = 0;
      } else {
        const effectiveBaseline = baseline === null ? BASELINE_UNRANKED : baseline;
        const effectiveCurrent = current === null ? BASELINE_UNRANKED : current;
        change = effectiveBaseline - effectiveCurrent;
      }
      
      return { engine, label, best, current, baseline, change, color };
    };
    
    const summaries: EngineSummary[] = [
      calculateSummary(googlePositions, 'google', 'Google', ENGINE_COLORS.google.stroke),
      calculateSummary(bingPositions, 'bing', 'Bing', ENGINE_COLORS.bing.stroke),
      calculateSummary(yahooPositions, 'yahoo', 'Yahoo', ENGINE_COLORS.yahoo.stroke),
    ];
    
    return { chartData: data, engineSummaries: summaries };
  }, [filteredHistory, historicalData, mainKeywordText]);
  
  const dateRangeButtons: { value: DateRange; label: string }[] = [
    { value: "all", label: "All Time" },
    { value: "30d", label: "30 Days" },
    { value: "60d", label: "60 Days" },
    { value: "90d", label: "90 Days" },
  ];
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl h-[85vh] overflow-hidden bg-background/98 backdrop-blur-2xl border-primary/20 shadow-[0_0_60px_rgba(139,92,246,0.15)] p-0">
        <div className="flex h-full flex-col overflow-hidden p-6">
          {/* Futuristic header */}
          <DialogHeader className="border-b border-border/50 pb-4 shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 via-violet-500/20 to-cyan-500/20 border border-primary/40 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                  <Activity className="w-7 h-7 text-primary" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Keyword Trend Analysis
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Historical ranking across Google, Bing & Yahoo</p>
              </div>
            </div>
          </DialogHeader>

          {/* Main Keyword Title */}
          <div className="flex items-center justify-center py-3 shrink-0">
            <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-primary/10 via-violet-500/10 to-cyan-500/10 border border-primary/30">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">{mainKeywordText}</h2>
              </div>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="flex justify-center gap-2 py-2 shrink-0">
            {dateRangeButtons.map(btn => (
              <Button
                key={btn.value}
                variant="ghost"
                size="sm"
                onClick={() => setDateRange(btn.value)}
                className={`relative px-4 py-2 rounded-xl transition-all duration-300 ${
                  dateRange === btn.value 
                    ? "bg-gradient-to-r from-primary/20 to-violet-500/20 text-primary border border-primary/40 shadow-[0_0_15px_rgba(139,92,246,0.2)]" 
                    : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-transparent"
                }`}
              >
                {btn.label}
              </Button>
            ))}
          </div>

          {/* Chart Section */}
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex-1 min-h-0">
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
              {engineSummaries.map((summary) => (
                <div key={summary.engine} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-border/30">
                  <div 
                    className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" 
                    style={{ backgroundColor: summary.color, color: summary.color }}
                  />
                  <span className="text-sm text-foreground">{summary.label}</span>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="h-[calc(100%-3rem)] w-full">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/30 flex items-center justify-center animate-pulse">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-muted-foreground">Loading historical data...</div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted/20 border border-border/30 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-muted-foreground">No historical data available</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="gradient-google" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ENGINE_COLORS.google.fill} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={ENGINE_COLORS.google.fill} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradient-bing" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ENGINE_COLORS.bing.fill} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={ENGINE_COLORS.bing.fill} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradient-yahoo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ENGINE_COLORS.yahoo.fill} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={ENGINE_COLORS.yahoo.fill} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      reversed
                      domain={[1, UNRANKED_POSITION]}
                      ticks={[1, 5, 10, 20, 50, UNRANKED_POSITION]}
                      tickFormatter={(val) => val === UNRANKED_POSITION ? '∞' : `#${val}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="google"
                      name="Google"
                      stroke={ENGINE_COLORS.google.stroke}
                      strokeWidth={2.5}
                      fill="url(#gradient-google)"
                      dot={{ fill: ENGINE_COLORS.google.fill, strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: ENGINE_COLORS.google.fill, stroke: 'white', strokeWidth: 2 }}
                      connectNulls
                    />
                    <Area
                      type="monotone"
                      dataKey="bing"
                      name="Bing"
                      stroke={ENGINE_COLORS.bing.stroke}
                      strokeWidth={2.5}
                      fill="url(#gradient-bing)"
                      dot={{ fill: ENGINE_COLORS.bing.fill, strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: ENGINE_COLORS.bing.fill, stroke: 'white', strokeWidth: 2 }}
                      connectNulls
                    />
                    <Area
                      type="monotone"
                      dataKey="yahoo"
                      name="Yahoo"
                      stroke={ENGINE_COLORS.yahoo.stroke}
                      strokeWidth={2.5}
                      fill="url(#gradient-yahoo)"
                      dot={{ fill: ENGINE_COLORS.yahoo.fill, strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: ENGINE_COLORS.yahoo.fill, stroke: 'white', strokeWidth: 2 }}
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Engine Summary Cards */}
          <div className="mt-4 grid grid-cols-3 gap-4 shrink-0">
            {engineSummaries.map((summary) => (
              <div 
                key={summary.engine}
                className="relative rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-4 overflow-hidden"
              >
                {/* Accent glow */}
                <div 
                  className="absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-20"
                  style={{ backgroundColor: summary.color }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" 
                      style={{ backgroundColor: summary.color, color: summary.color }}
                    />
                    <span className="text-sm font-medium text-foreground">{summary.label}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Best</p>
                      <p className="text-lg font-bold" style={{ color: summary.color }}>
                        {summary.best !== null ? `#${summary.best}` : '—'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Current</p>
                      <p className="text-lg font-bold text-foreground">
                        {summary.current !== null ? `#${summary.current}` : '—'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Change</p>
                      <div className={`flex items-center justify-center gap-0.5 ${
                        summary.change > 0 
                          ? 'text-emerald-400' 
                          : summary.change < 0 
                            ? 'text-red-400' 
                            : 'text-muted-foreground'
                      }`}>
                        {summary.change > 0 && <TrendingUp className="w-3 h-3" />}
                        {summary.change < 0 && <TrendingDown className="w-3 h-3" />}
                        <span className="text-lg font-bold">
                          {summary.change >= 999 ? '+NEW' : 
                           summary.change <= -999 ? 'LOST' :
                           summary.change > 0 ? `+${summary.change}` : 
                           summary.change < 0 ? summary.change : '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

BronKeywordAnalysisDialog.displayName = 'BronKeywordAnalysisDialog';
