import { memo, useState, useMemo, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, Sparkles, Activity, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BronKeyword, BronSerpReport, BronSerpListItem } from "@/hooks/use-bron-api";
import { getKeywordDisplayText, getPosition } from "./BronKeywordCard";
import { findSerpForKeyword } from "./utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { format } from "date-fns";

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
      // Heuristic: treat 10-digit values as seconds.
      const ms = c < 2_000_000_000 ? c * 1000 : c;
      if (Number.isFinite(ms) && ms > 0) return ms;
      continue;
    }
    const s = String(c).trim();
    if (!s) continue;
    // Numeric string timestamp
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
  relatedKeywords?: BronKeyword[]; // Supporting keywords in the cluster
  serpHistory: BronSerpListItem[];
  selectedDomain?: string;
  onFetchSerpDetail?: (domain: string, reportId: string) => Promise<BronSerpReport[]>;
}

// Date range filter options
type DateRange = "all" | "30d" | "60d" | "90d";

// Chart data point
interface ChartDataPoint {
  date: string;
  timestamp: number;
  [key: string]: number | string;
}

// Keyword summary with movement
interface KeywordSummary {
  keyword: string;
  best: number | null;
  current: number | null;
  baseline: number | null; // First recorded position (oldest report)
  change: number; // Change from baseline to current (positive = improved)
  color: string;
  gradient: string;
}

const KEYWORD_COLORS = [
  { stroke: "hsl(217, 91%, 60%)", gradient: "from-blue-500/20 to-blue-500/5" },
  { stroke: "hsl(280, 87%, 65%)", gradient: "from-violet-500/20 to-violet-500/5" },
  { stroke: "hsl(172, 66%, 50%)", gradient: "from-cyan-500/20 to-cyan-500/5" },
  { stroke: "hsl(142, 71%, 45%)", gradient: "from-emerald-500/20 to-emerald-500/5" },
  { stroke: "hsl(38, 92%, 50%)", gradient: "from-amber-500/20 to-amber-500/5" },
];

// Custom gradient tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  
  return (
    <div className="rounded-xl border border-primary/30 bg-background/95 backdrop-blur-xl p-3 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.stroke || entry.color }}
          />
          <span className="text-foreground font-semibold">#{entry.value}</span>
          <span className="text-muted-foreground text-xs truncate max-w-[150px]">
            {entry.dataKey.length > 20 ? `${entry.dataKey.slice(0, 20)}...` : entry.dataKey}
          </span>
        </div>
      ))}
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
  
  // Get all keywords to track (main + related, max 5)
  const trackedKeywords = useMemo(() => {
    const all = [keyword, ...relatedKeywords.slice(0, 4)];
    return all.map(kw => ({
      keyword: kw,
      text: getKeywordDisplayText(kw),
    }));
  }, [keyword, relatedKeywords]);
  
  // Sort history by date
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
  
  // Fetch historical data for all reports
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !selectedDomain || !onFetchSerpDetail || filteredHistory.length === 0) return;
      
      setIsLoading(true);
      const dataMap = new Map<string, BronSerpReport[]>();
      
      try {
        // Fetch all historical reports (limit to avoid too many requests)
        const reportsToFetch = filteredHistory.slice(0, 20);
        
        for (const item of reportsToFetch) {
          const reportId = String(item.report_id || item.id);
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
      } catch (err) {
        console.error('Failed to fetch historical data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [isOpen, selectedDomain, filteredHistory, onFetchSerpDetail]);
  
  // Build chart data
  const { chartData, keywordSummaries } = useMemo(() => {
    const data: ChartDataPoint[] = [];
    const summaries: KeywordSummary[] = [];
    
    // Track best/current/baseline for each keyword
    const keywordStats: Record<string, { best: number | null; current: number | null; baseline: number | null; all: number[] }> = {};
    trackedKeywords.forEach(tk => {
      keywordStats[tk.text] = { best: null, current: null, baseline: null, all: [] };
    });
    
    // Build chart data points
    filteredHistory.forEach(item => {
      const reportId = String(item.report_id || item.id);
      const reportData = historicalData.get(reportId);
      if (!reportData) return;

      const timestamp = getSerpListItemTimestamp(item);
      if (timestamp === null) return;
      
      const point: ChartDataPoint = {
        date: format(new Date(timestamp), 'MMM d'),
        timestamp,
      };
      
      trackedKeywords.forEach(tk => {
        // Use fuzzy matching like the main dashboard does
        const serpItem = findSerpForKeyword(tk.text, reportData);
        const pos = getPosition(serpItem?.google);
        if (pos !== null) {
          point[tk.text] = pos;
          keywordStats[tk.text].all.push(pos);
        }
      });
      
      // Only add point if it has at least one keyword position
      const hasData = trackedKeywords.some(tk => point[tk.text] !== undefined);
      if (hasData) {
        data.push(point);
      }
    });
    
    // Calculate best/current/baseline for each keyword
    // Baseline = first ever recorded position (from oldest report in "All Time" view)
    trackedKeywords.forEach((tk, idx) => {
      const stats = keywordStats[tk.text];
      if (stats.all.length > 0) {
        stats.best = Math.min(...stats.all);
        stats.current = stats.all[stats.all.length - 1];
        stats.baseline = stats.all[0]; // First recorded position is the baseline
      }
      
      // Change is calculated using position 1000 as baseline for unranked keywords
      // Positive = improved (e.g., baseline #10 to current #5 = +5)
      // Negative = dropped (e.g., baseline #5 to current #10 = -5)
      // New keyword at #1 = 1000 - 1 = +999 improvement
      const UNRANKED_POSITION = 1000;
      const baseline = stats.baseline;
      const current = stats.current;
      let change = 0;
      
      // Both null = no data, no change
      if (baseline === null && current === null) {
        change = 0;
      } else {
        const effectiveBaseline = baseline === null ? UNRANKED_POSITION : baseline;
        const effectiveCurrent = current === null ? UNRANKED_POSITION : current;
        change = effectiveBaseline - effectiveCurrent;
      }
      
      const colorObj = KEYWORD_COLORS[idx % KEYWORD_COLORS.length];
      summaries.push({
        keyword: tk.text,
        best: stats.best,
        current: stats.current,
        baseline: stats.baseline,
        change,
        color: colorObj.stroke,
        gradient: colorObj.gradient,
      });
    });
    
    return { chartData: data, keywordSummaries: summaries };
  }, [filteredHistory, historicalData, trackedKeywords]);
  
  // Render date range buttons
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
                <p className="text-sm text-muted-foreground mt-1">Historical ranking performance over time</p>
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

          {/* Date Range Selector - Futuristic tabs */}
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

          {/* Chart Section - Glassmorphism container */}
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] flex-1 min-h-0">
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
              {keywordSummaries.map((summary, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-border/30">
                  <div 
                    className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" 
                    style={{ backgroundColor: summary.color, color: summary.color }}
                  />
                  <span className="text-sm text-foreground truncate max-w-[200px]">
                    {summary.keyword.length > 30 
                      ? `${summary.keyword.slice(0, 30)}...` 
                      : summary.keyword
                    }
                  </span>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="h-full w-full">
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
                    {keywordSummaries.map((summary, idx) => (
                      <linearGradient key={idx} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={summary.color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={summary.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
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
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tickFormatter={(val) => `#${val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {keywordSummaries.map((summary, idx) => (
                    <Area
                      key={summary.keyword}
                      type="monotone"
                      dataKey={summary.keyword}
                      stroke={summary.color}
                      strokeWidth={2.5}
                      fill={`url(#gradient-${idx})`}
                      dot={{ fill: summary.color, strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: summary.color, stroke: 'white', strokeWidth: 2 }}
                      connectNulls
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
			</div>

          {/* Keyword Summary Cards - equal width grid */}
          <div className="mt-4 grid grid-cols-3 gap-4 shrink-0">
            {keywordSummaries.slice(0, 3).map((summary, idx) => (
              <div 
                key={idx}
                className={`relative rounded-2xl border border-border/50 bg-gradient-to-br ${summary.gradient} backdrop-blur-sm p-4 overflow-hidden flex-1`}
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
                    <span className="text-sm font-medium text-foreground truncate">
                      {summary.keyword.length > 25 
                        ? `${summary.keyword.slice(0, 25)}...` 
                        : summary.keyword
                      }
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Best</p>
                      <p className="text-lg font-bold text-cyan-400">
                        {summary.best !== null ? `#${summary.best}` : '—'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Current</p>
                      <p className="text-lg font-bold text-violet-400">
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
