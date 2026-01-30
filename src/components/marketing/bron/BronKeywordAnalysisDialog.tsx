import { memo, useState, useMemo, useEffect } from "react";
import { X, TrendingUp, TrendingDown, Minus, BarChart3, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BronKeyword, BronSerpReport, BronSerpListItem } from "@/hooks/use-bron-api";
import { getKeywordDisplayText, getPosition } from "./BronKeywordCard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

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
type DateRange = "all" | "30d" | "60d" | "90d" | "custom";

// Chart data point
interface ChartDataPoint {
  date: string;
  timestamp: number;
  [key: string]: number | string; // Dynamic keyword positions
}

// Keyword summary with movement
interface KeywordSummary {
  keyword: string;
  best: number | null;
  current: number | null;
  change: number;
  color: string;
}

const KEYWORD_COLORS = [
  "hsl(217, 91%, 60%)", // Blue
  "hsl(280, 87%, 65%)", // Purple  
  "hsl(0, 84%, 60%)",   // Red/Coral
  "hsl(142, 71%, 45%)", // Green
  "hsl(38, 92%, 50%)",  // Orange
];

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
      const dateA = new Date(a.started || a.created_at || 0).getTime();
      const dateB = new Date(b.started || b.created_at || 0).getTime();
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
      const date = new Date(item.started || item.created_at || 0).getTime();
      return date >= cutoff;
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
    
    // Track best/current for each keyword
    const keywordStats: Record<string, { best: number | null; current: number | null; all: number[] }> = {};
    trackedKeywords.forEach(tk => {
      keywordStats[tk.text] = { best: null, current: null, all: [] };
    });
    
    // Build chart data points
    filteredHistory.forEach(item => {
      const reportId = String(item.report_id || item.id);
      const reportData = historicalData.get(reportId);
      if (!reportData) return;
      
      const dateStr = item.started || item.created_at || '';
      const timestamp = new Date(dateStr).getTime();
      
      const point: ChartDataPoint = {
        date: format(new Date(dateStr), 'MMM d'),
        timestamp,
      };
      
      trackedKeywords.forEach(tk => {
        const serpItem = reportData.find(r => 
          r.keyword?.toLowerCase() === tk.text.toLowerCase()
        );
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
    
    // Calculate best/current for each keyword
    trackedKeywords.forEach((tk, idx) => {
      const stats = keywordStats[tk.text];
      if (stats.all.length > 0) {
        stats.best = Math.min(...stats.all);
        stats.current = stats.all[stats.all.length - 1];
      }
      
      const first = stats.all[0] ?? null;
      const current = stats.current;
      const change = first && current ? first - current : 0;
      
      summaries.push({
        keyword: tk.text,
        best: stats.best,
        current: stats.current,
        change,
        color: KEYWORD_COLORS[idx % KEYWORD_COLORS.length],
      });
    });
    
    return { chartData: data, keywordSummaries: summaries };
  }, [filteredHistory, historicalData, trackedKeywords]);
  
  // Render date range buttons
  const dateRangeButtons: { value: DateRange; label: string }[] = [
    { value: "all", label: "All" },
    { value: "30d", label: "30d" },
    { value: "60d", label: "60d" },
    { value: "90d", label: "90d" },
  ];
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Keyword Analysis
            </DialogTitle>
          </div>
        </DialogHeader>
        
        {/* Main Keyword Title */}
        <div className="text-center py-4">
          <h2 className="text-2xl font-bold text-foreground">{mainKeywordText}</h2>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex justify-center gap-2 py-4">
          {dateRangeButtons.map(btn => (
            <Button
              key={btn.value}
              variant={dateRange === btn.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(btn.value)}
              className={dateRange === btn.value 
                ? "bg-primary text-primary-foreground" 
                : "bg-background/50 hover:bg-muted"
              }
            >
              {btn.label}
            </Button>
          ))}
        </div>
        
        {/* Chart Section */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            All-Time Trend
          </h3>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4">
            {keywordSummaries.map((summary, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: summary.color }}
                />
                <span className="text-sm text-foreground truncate max-w-[180px]">
                  {summary.keyword.length > 25 
                    ? `${summary.keyword.slice(0, 25)}...` 
                    : summary.keyword
                  }
                </span>
              </div>
            ))}
          </div>
          
          {/* Chart */}
          <div className="h-[300px] w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading historical data...</div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
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
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tickFormatter={(val) => `#${val}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => [`#${value}`, name]}
                  />
                  {keywordSummaries.map((summary) => (
                    <Line
                      key={summary.keyword}
                      type="monotone"
                      dataKey={summary.keyword}
                      stroke={summary.color}
                      strokeWidth={2.5}
                      dot={{ fill: summary.color, strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: summary.color }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        {/* Keyword Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {keywordSummaries.map((summary, idx) => (
            <div 
              key={idx}
              className="rounded-xl border border-border/50 bg-card/50 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-sm shrink-0" 
                  style={{ backgroundColor: summary.color }}
                />
                <span className="text-sm font-medium text-foreground truncate">
                  {summary.keyword.length > 20 
                    ? `${summary.keyword.slice(0, 20)}...` 
                    : summary.keyword
                  }
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Best</p>
                  <p className="text-lg font-bold text-cyan-400">
                    {summary.best !== null ? `#${summary.best}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current</p>
                  <p className="text-lg font-bold text-violet-400">
                    {summary.current !== null ? `#${summary.current}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Change</p>
                  <p className={`text-lg font-bold flex items-center gap-0.5 ${
                    summary.change > 0 
                      ? 'text-emerald-400' 
                      : summary.change < 0 
                        ? 'text-red-400' 
                        : 'text-muted-foreground'
                  }`}>
                    {summary.change > 0 && <TrendingUp className="w-4 h-4" />}
                    {summary.change < 0 && <TrendingDown className="w-4 h-4" />}
                    {summary.change === 0 && <Minus className="w-4 h-4" />}
                    {summary.change !== 0 ? (
                      summary.change > 0 ? `↑ ${summary.change}` : `↓ ${Math.abs(summary.change)}`
                    ) : '—'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
});

BronKeywordAnalysisDialog.displayName = 'BronKeywordAnalysisDialog';