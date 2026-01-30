import { memo, useState, useMemo, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, Sparkles, Activity, Target, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BronKeyword, BronSerpReport, BronSerpListItem } from "@/hooks/use-bron-api";
import { getTargetKeyword, getPosition } from "./BronKeywordCard";
import { findSerpForKeyword } from "./utils";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
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

// Multi-keyword chart data point
interface ChartDataPoint {
  date: string;
  timestamp: number;
  [keywordId: string]: number | string | null;
}

// Keyword summary for display
interface KeywordSummary {
  id: string;
  keyword: string;
  color: string;
  best: number | null;
  current: number | null;
  change: number;
}

// Distinct colors for multiple keywords - vibrant, distinguishable
const KEYWORD_COLORS = [
  "hsl(217, 91%, 60%)",   // Blue
  "hsl(142, 71%, 45%)",   // Green
  "hsl(280, 87%, 65%)",   // Purple
  "hsl(172, 66%, 50%)",   // Cyan
  "hsl(38, 92%, 50%)",    // Orange
  "hsl(0, 84%, 60%)",     // Red/Coral
  "hsl(330, 85%, 60%)",   // Pink
  "hsl(45, 93%, 47%)",    // Yellow
];

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
  
  const mainKeywordText = useMemo(() => getTargetKeyword(keyword), [keyword]);
  
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
  
  // All keywords to analyze (main + related)
  const allKeywords = useMemo(() => {
    const kws = [keyword, ...relatedKeywords].slice(0, 8); // Max 8 keywords
    return kws.map((kw, idx) => ({
      keyword: kw,
      id: String(kw.id),
      text: getTargetKeyword(kw),
      color: KEYWORD_COLORS[idx % KEYWORD_COLORS.length],
    }));
  }, [keyword, relatedKeywords]);

  // Build chart data with all cluster keywords (Google only)
  const { chartData, keywordSummaries } = useMemo(() => {
    const data: ChartDataPoint[] = [];
    const positionsPerKeyword: Record<string, number[]> = {};
    
    // Initialize positions tracker for each keyword
    allKeywords.forEach(kw => {
      positionsPerKeyword[kw.id] = [];
    });
    
    filteredHistory.forEach(item => {
      const reportId = getReportId(item);
      const reportData = historicalData.get(reportId);
      if (!reportData || reportData.length === 0) return;

      const timestamp = getSerpListItemTimestamp(item);
      if (timestamp === null) return;
      
      const point: ChartDataPoint = { date: format(new Date(timestamp), 'MMM d'), timestamp };
      let hasAnyPosition = false;
      
      allKeywords.forEach(kw => {
        const serpItem = findSerpForKeyword(kw.text, reportData);
        const googlePos = getPosition(serpItem?.google);
        
        if (googlePos !== null) {
          positionsPerKeyword[kw.id].push(googlePos);
          hasAnyPosition = true;
        }
        
        // Use UNRANKED_POSITION for nulls so they appear at bottom
        point[kw.id] = googlePos ?? UNRANKED_POSITION;
      });
      
      if (hasAnyPosition) {
        data.push(point);
      }
    });
    
    // Calculate summaries for each keyword
    const summaries: KeywordSummary[] = allKeywords.map(kw => {
      const positions = positionsPerKeyword[kw.id];
      const best = positions.length > 0 ? Math.min(...positions) : null;
      const current = positions.length > 0 ? positions[positions.length - 1] : null;
      const baseline = positions.length > 0 ? positions[0] : null;
      
      // Change from baseline to current (positive = improved)
      const BASELINE_UNRANKED = 1000;
      let change = 0;
      if (baseline !== null || current !== null) {
        const effectiveBaseline = baseline ?? BASELINE_UNRANKED;
        const effectiveCurrent = current ?? BASELINE_UNRANKED;
        change = effectiveBaseline - effectiveCurrent;
      }
      
      return {
        id: kw.id,
        keyword: kw.text,
        color: kw.color,
        best,
        current,
        change,
      };
    });
    
    return { chartData: data, keywordSummaries: summaries };
  }, [filteredHistory, historicalData, allKeywords]);
  
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
                  Keyword Cluster Trend Analysis
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Historical Google ranking for cluster keywords</p>
              </div>
            </div>
          </DialogHeader>

          {/* Cluster Keywords Display */}
          <div className="flex flex-col items-center py-3 shrink-0 gap-2">
            {/* Main Keyword */}
            <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-primary/10 via-violet-500/10 to-cyan-500/10 border border-primary/30">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">{mainKeywordText}</h2>
              </div>
            </div>
            
            {/* Related Keywords in Cluster */}
            {relatedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center items-center mt-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>Cluster ({relatedKeywords.length + 1} keywords):</span>
                </div>
                {relatedKeywords.map((rk) => (
                  <Badge 
                    key={String(rk.id)} 
                    variant="outline" 
                    className="text-xs bg-violet-500/10 border-violet-500/30 text-violet-300"
                  >
                    {getTargetKeyword(rk)}
                  </Badge>
                ))}
              </div>
            )}
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
              {allKeywords.map((kw) => (
                <div key={kw.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-border/30">
                  <div 
                    className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" 
                    style={{ backgroundColor: kw.color, color: kw.color }}
                  />
                  <span className="text-sm text-foreground truncate max-w-[180px]" title={kw.text}>
                    {kw.text.length > 30 ? kw.text.slice(0, 30) + '...' : kw.text}
                  </span>
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
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
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
                    
                    {allKeywords.map((kw) => (
                      <Line
                        key={kw.id}
                        type="monotone"
                        dataKey={kw.id}
                        name={kw.text}
                        stroke={kw.color}
                        strokeWidth={2.5}
                        dot={{ fill: kw.color, strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: kw.color, stroke: 'white', strokeWidth: 2 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Keyword Summary Cards */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 shrink-0 max-h-40 overflow-y-auto">
            {keywordSummaries.map((summary) => (
              <div 
                key={summary.id}
                className="relative rounded-xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-3 overflow-hidden"
              >
                {/* Accent glow */}
                <div 
                  className="absolute top-0 left-0 w-24 h-24 rounded-full blur-3xl opacity-15"
                  style={{ backgroundColor: summary.color }}
                />
                
                <div className="relative z-10">
                  {/* Keyword name with color indicator */}
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor]" 
                      style={{ backgroundColor: summary.color, color: summary.color }}
                    />
                    <span className="text-xs font-medium text-foreground truncate" title={summary.keyword}>
                      {summary.keyword.length > 30 ? summary.keyword.slice(0, 30) + '...' : summary.keyword}
                    </span>
                  </div>
                  
                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Best</p>
                      <p className="text-base font-bold" style={{ color: summary.color }}>
                        {summary.best !== null ? `#${summary.best}` : '—'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Current</p>
                      <p className="text-base font-bold text-foreground">
                        {summary.current !== null ? `#${summary.current}` : '—'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Change</p>
                      <div className={`flex items-center justify-center gap-0.5 ${
                        summary.change > 0 
                          ? 'text-emerald-400' 
                          : summary.change < 0 
                            ? 'text-red-400' 
                            : 'text-muted-foreground'
                      }`}>
                        {summary.change > 0 && <TrendingUp className="w-2.5 h-2.5" />}
                        {summary.change < 0 && <TrendingDown className="w-2.5 h-2.5" />}
                        {summary.change === 0 && <Minus className="w-2.5 h-2.5" />}
                        <span className="text-base font-bold">
                          {summary.change >= 999 ? 'NEW' : 
                           summary.change <= -999 ? 'LOST' :
                           summary.change > 0 ? `${summary.change}` : 
                           summary.change < 0 ? `${Math.abs(summary.change)}` : '0'}
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
