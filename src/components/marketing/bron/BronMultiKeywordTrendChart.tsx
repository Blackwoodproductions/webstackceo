import { memo, useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BronKeyword, BronSerpReport } from "@/hooks/use-bron-api";
import { getTargetKeyword, getPosition } from "./BronKeywordCard";
import { findSerpForKeyword } from "./utils";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

// Position value for unranked (displayed at bottom of chart)
const UNRANKED_POSITION = 100;

// Distinct colors for multiple keywords - vibrant, distinguishable
const KEYWORD_COLORS = [
  "hsl(217, 91%, 60%)",   // Blue
  "hsl(280, 87%, 65%)",   // Purple
  "hsl(0, 84%, 60%)",     // Red/Coral
  "hsl(172, 66%, 50%)",   // Cyan
  "hsl(38, 92%, 50%)",    // Orange
  "hsl(142, 71%, 45%)",   // Green
  "hsl(330, 85%, 60%)",   // Pink
  "hsl(45, 93%, 47%)",    // Yellow
];

interface ChartDataPoint {
  date: string;
  timestamp: number;
  [keywordId: string]: number | string | null;
}

interface KeywordSummary {
  id: string;
  keyword: string;
  color: string;
  best: number | null;
  current: number | null;
  change: number;
}

interface BronMultiKeywordTrendChartProps {
  keywords: BronKeyword[];
  serpReportsMap: Map<string, BronSerpReport[]>;
  reportDates: { reportId: string; date: string; timestamp: number }[];
  title?: string;
  maxKeywords?: number;
}

// Custom tooltip for multi-keyword chart
const MultiKeywordTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  
  // Sort by position (lower = better)
  const sorted = [...payload].sort((a, b) => {
    const posA = a.value === UNRANKED_POSITION ? 999 : (a.value ?? 999);
    const posB = b.value === UNRANKED_POSITION ? 999 : (b.value ?? 999);
    return posA - posB;
  });
  
  return (
    <div className="rounded-xl border border-primary/30 bg-background/95 backdrop-blur-xl p-3 shadow-[0_0_30px_rgba(139,92,246,0.2)] max-w-xs">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {sorted.slice(0, 5).map((entry: any, idx: number) => {
        const val = entry.value;
        const displayVal = val === UNRANKED_POSITION ? 'Unranked' : `#${val}`;
        const keywordName = entry.name.length > 30 ? entry.name.slice(0, 30) + '...' : entry.name;
        return (
          <div key={idx} className="flex items-center gap-2 text-sm py-0.5">
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0" 
              style={{ backgroundColor: entry.stroke || entry.color }}
            />
            <span className="text-foreground font-semibold">{displayVal}</span>
            <span className="text-muted-foreground text-xs truncate">{keywordName}</span>
          </div>
        );
      })}
      {sorted.length > 5 && (
        <p className="text-xs text-muted-foreground mt-1">+{sorted.length - 5} more</p>
      )}
    </div>
  );
};

export const BronMultiKeywordTrendChart = memo(({
  keywords,
  serpReportsMap,
  reportDates,
  title = "ALL-TIME TREND",
  maxKeywords = 8,
}: BronMultiKeywordTrendChartProps) => {
  
  // Limit to maxKeywords and assign colors
  const keywordsWithColors = useMemo(() => {
    return keywords.slice(0, maxKeywords).map((kw, idx) => ({
      keyword: kw,
      id: String(kw.id),
      text: getTargetKeyword(kw),
      color: KEYWORD_COLORS[idx % KEYWORD_COLORS.length],
    }));
  }, [keywords, maxKeywords]);
  
  // Build chart data with all keywords
  const { chartData, summaries } = useMemo(() => {
    const data: ChartDataPoint[] = [];
    const positionsPerKeyword: Record<string, number[]> = {};
    
    // Initialize positions tracker for each keyword
    keywordsWithColors.forEach(kw => {
      positionsPerKeyword[kw.id] = [];
    });
    
    // Sort report dates chronologically
    const sortedDates = [...reportDates].sort((a, b) => a.timestamp - b.timestamp);
    
    sortedDates.forEach(({ reportId, date, timestamp }) => {
      const reportData = serpReportsMap.get(reportId);
      if (!reportData || reportData.length === 0) return;
      
      const point: ChartDataPoint = { date, timestamp };
      let hasAnyPosition = false;
      
      keywordsWithColors.forEach(kw => {
        const serpItem = findSerpForKeyword(kw.text, reportData);
        const googlePos = getPosition(serpItem?.google);
        
        // Track actual positions for stats
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
    const keywordSummaries: KeywordSummary[] = keywordsWithColors.map(kw => {
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
    
    return { chartData: data, summaries: keywordSummaries };
  }, [keywordsWithColors, serpReportsMap, reportDates]);
  
  // Calculate Y-axis domain based on actual data
  const yAxisDomain = useMemo(() => {
    let minPos = 100;
    let maxPos = 1;
    
    chartData.forEach(point => {
      keywordsWithColors.forEach(kw => {
        const val = point[kw.id];
        if (typeof val === 'number' && val !== UNRANKED_POSITION) {
          minPos = Math.min(minPos, val);
          maxPos = Math.max(maxPos, val);
        }
      });
    });
    
    // Add padding and ensure reasonable range
    const paddedMin = Math.max(1, minPos - 2);
    const paddedMax = Math.min(UNRANKED_POSITION, maxPos + 5);
    
    return [paddedMin, paddedMax];
  }, [chartData, keywordsWithColors]);
  
  // Generate Y-axis ticks
  const yTicks = useMemo(() => {
    const [min, max] = yAxisDomain;
    const ticks: number[] = [];
    
    // Add sensible tick values
    const candidates = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
    candidates.forEach(t => {
      if (t >= min && t <= max) ticks.push(t);
    });
    
    // Ensure we have at least 4 ticks
    if (ticks.length < 4 && max > min) {
      const step = Math.ceil((max - min) / 4);
      for (let t = Math.ceil(min); t <= max; t += step) {
        if (!ticks.includes(t)) ticks.push(t);
      }
    }
    
    return ticks.sort((a, b) => a - b);
  }, [yAxisDomain]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No historical ranking data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border/30">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</h3>
      </div>
      
      {/* Legend */}
      <div className="px-5 py-3 flex flex-wrap gap-3 border-b border-border/30 bg-background/30">
        {keywordsWithColors.map((kw) => (
          <div key={kw.id} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: kw.color }}
            />
            <span className="text-sm text-foreground truncate max-w-[180px]" title={kw.text}>
              {kw.text.length > 25 ? kw.text.slice(0, 25) + '...' : kw.text}
            </span>
          </div>
        ))}
      </div>
      
      {/* Chart */}
      <div className="px-5 py-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 40, left: 10, bottom: 10 }}>
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
                domain={yAxisDomain}
                ticks={yTicks}
                tickFormatter={(val) => `#${val}`}
                width={40}
              />
              <Tooltip content={<MultiKeywordTooltip />} />
              
              {keywordsWithColors.map((kw) => (
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
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="px-5 pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {summaries.map((summary) => (
            <div 
              key={summary.id}
              className="rounded-xl border border-border/40 bg-card/60 p-4"
            >
              {/* Keyword name with color indicator */}
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: summary.color }}
                />
                <span className="text-sm font-medium text-foreground truncate" title={summary.keyword}>
                  {summary.keyword.length > 25 ? summary.keyword.slice(0, 25) + '...' : summary.keyword}
                </span>
              </div>
              
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Best</p>
                  <p className="text-lg font-bold" style={{ color: summary.color }}>
                    {summary.best !== null ? `#${summary.best}` : '—'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Current</p>
                  <p className="text-lg font-bold" style={{ color: summary.color }}>
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
                    {summary.change === 0 && <Minus className="w-3 h-3" />}
                    <span className="text-lg font-bold">
                      {summary.change >= 999 ? 'NEW' : 
                       summary.change <= -999 ? 'LOST' :
                       summary.change > 0 ? `${summary.change}` : 
                       summary.change < 0 ? `${Math.abs(summary.change)}` : '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

BronMultiKeywordTrendChart.displayName = 'BronMultiKeywordTrendChart';
