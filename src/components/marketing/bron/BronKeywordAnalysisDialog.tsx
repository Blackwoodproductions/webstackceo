import { memo, useState, useMemo, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, Sparkles, Activity, Target, Users, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BronKeyword, BronSerpReport, BronSerpListItem } from "@/hooks/use-bron-api";
import { getTargetKeyword, getPosition } from "./BronKeywordCard";
import { findSerpForKeyword, findSerpByKeywordId } from "./utils";
import { BronMultiKeywordTrendChart } from "./BronMultiKeywordTrendChart";
import { BronHistoricalLoadingScreen } from "./BronHistoricalLoadingScreen";
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
    // Some BRON history payloads only include completion timestamps
    (item as any).complete,
    (item as any).completed,
    (item as any).completed_at,
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
type SearchEngine = "google" | "bing" | "yahoo";

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

// Search engine config
const SEARCH_ENGINES: { id: SearchEngine; label: string; color: string; icon: string }[] = [
  { id: "google", label: "Google", color: "hsl(217, 91%, 60%)", icon: "🔵" },
  { id: "bing", label: "Bing", color: "hsl(172, 66%, 50%)", icon: "🟢" },
  { id: "yahoo", label: "Yahoo", color: "hsl(280, 87%, 65%)", icon: "🟣" },
];

// Custom tooltip showing keyword positions
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  
  // Sort by position (lower is better)
  const sorted = [...payload].sort((a: any, b: any) => {
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

// Reusable chart component for a specific search engine
const EngineChart = memo(({ 
  engine,
  chartData, 
  keywordsWithColors, 
  isLoading 
}: { 
  engine: SearchEngine;
  chartData: ChartDataPoint[];
  keywordsWithColors: { id: string; text: string; color: string }[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/30 flex items-center justify-center animate-pulse">
          <BarChart3 className="w-6 h-6 text-primary" />
        </div>
        <div className="text-muted-foreground">Loading historical data...</div>
      </div>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-12 h-12 rounded-2xl bg-muted/20 border border-border/30 flex items-center justify-center">
          <Activity className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="text-muted-foreground">No historical data available for {engine}</div>
      </div>
    );
  }
  
  return (
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
  );
});
EngineChart.displayName = 'EngineChart';

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
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine>("google");
  const [isLoading, setIsLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<Map<string, BronSerpReport[]>>(new Map());
  const [fetchProgress, setFetchProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  
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
  
  // All keywords to analyze (main + related) - limit to 3 for cluster view
  // NOTE: Moved before useEffect since it's referenced in logging
  const allKeywords = useMemo(() => {
    const kws = [keyword, ...relatedKeywords].slice(0, 3); // Max 3 keywords for cluster
    return kws.map((kw, idx) => ({
      keyword: kw,
      id: String(kw.id),
      text: getTargetKeyword(kw),
      color: KEYWORD_COLORS[idx % KEYWORD_COLORS.length],
    }));
  }, [keyword, relatedKeywords]);

  // Extract just the BronKeyword objects for the chart component
  const chartKeywords = useMemo(() => 
    allKeywords.map(k => k.keyword), 
    [allKeywords]
  );
  
  // Report dates for the chart (format expected by BronMultiKeywordTrendChart)
  const reportDates = useMemo(() => {
    return filteredHistory.map(item => {
      const timestamp = getSerpListItemTimestamp(item) ?? 0;
      return {
        reportId: getReportId(item),
        date: timestamp ? format(new Date(timestamp), 'MMM d') : '',
        timestamp,
      };
    }).filter(r => r.reportId && r.timestamp > 0);
  }, [filteredHistory]);

  // Only switch from the full-screen loader to the chart once we have at least
  // one report that can actually render (prevents "No historical data" while still counting).
  const hasRenderableHistory = useMemo(() => {
    if (historicalData.size === 0) return false;
    for (const r of reportDates) {
      const arr = historicalData.get(r.reportId);
      if (Array.isArray(arr) && arr.length > 0) return true;
    }
    return false;
  }, [historicalData, reportDates]);

  // Fetch historical data for all reports
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      console.log('[BronKeywordAnalysisDialog] Effect triggered:', {
        isOpen,
        selectedDomain,
        hasOnFetchSerpDetail: !!onFetchSerpDetail,
        filteredHistoryLength: filteredHistory.length,
        serpHistoryLength: serpHistory.length,
      });
      
      if (!isOpen || !selectedDomain || !onFetchSerpDetail) {
        console.log('[BronKeywordAnalysisDialog] Early exit - missing deps');
        return;
      }
      
      if (filteredHistory.length === 0) {
        console.log('[BronKeywordAnalysisDialog] No historical reports available to fetch');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setFetchProgress({ done: 0, total: 0 });
      // Reset per-open so we don't show stale previous domain data.
      setHistoricalData(new Map());
      const dataMap = new Map<string, BronSerpReport[]>();
      
      try {
        // IMPORTANT:
        // Keywords can be added after older reports were generated.
        // If we only fetch the oldest reports, the chart will appear empty even though
        // the ranking pills (latest report) show data. We always include the newest
        // reports + the oldest baseline report.
        const MAX_REPORTS = 30;
        const oldest = filteredHistory[0];
        const recent = filteredHistory.slice(-MAX_REPORTS);
        const uniqueByReportId = new Map<string, BronSerpListItem>();
        [oldest, ...recent].forEach((item) => {
          if (!item) return;
          const rid = getReportId(item);
          if (!rid) return;
          uniqueByReportId.set(rid, item);
        });

        const reportsToFetch = [...uniqueByReportId.values()].sort((a, b) => {
          const tsA = getSerpListItemTimestamp(a) ?? 0;
          const tsB = getSerpListItemTimestamp(b) ?? 0;
          return tsA - tsB;
        });
        
        console.log('[BronKeywordAnalysisDialog] Fetching', reportsToFetch.length, 'reports for cluster:', allKeywords.map(k => k.text));

        // IMPORTANT: The BRON SERP detail endpoint rate-limits aggressively.
        // Fetching in parallel often returns empty responses; throttle + retry.
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const withTimeout = async <T,>(p: Promise<T>, ms: number): Promise<T> => {
          return await Promise.race([
            p,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
          ]);
        };

        const fetchOne = async (apiReportId: string, attempt = 0): Promise<BronSerpReport[]> => {
          try {
            const data = await withTimeout(onFetchSerpDetail(selectedDomain, apiReportId), 12000);
            const arr = Array.isArray(data) ? data : [];
            // If we got an empty array, it can be a soft rate-limit response.
            if (arr.length === 0 && attempt < 2) {
              await sleep(500 * (attempt + 1));
              return fetchOne(apiReportId, attempt + 1);
            }
            return arr;
          } catch (e) {
            if (attempt < 2) {
              await sleep(500 * (attempt + 1));
              return fetchOne(apiReportId, attempt + 1);
            }
            console.warn(`[BronKeywordAnalysisDialog] Failed to fetch report ${apiReportId}:`, e);
            return [];
          }
        };

        // Throttled sequential fetch to avoid rate limit
        setFetchProgress({ done: 0, total: reportsToFetch.length });
        for (let i = 0; i < reportsToFetch.length; i++) {
          const item = reportsToFetch[i];
          const displayReportId = getReportId(item);
          if (!displayReportId) continue;

          // The BRON detail endpoint is inconsistent about which ID it accepts.
          // Empirically it tends to work with `report_id` or `id` (like our baseline fetch),
          // while the UI/report list often prefers `serpid`.
          // Fetch with a tolerant ID, but store under the UI key so the chart can map it.
          // IMPORTANT: The BRON /serp-detail endpoint expects `serpid`.
          // Our backend wrapper maps `data.report_id` -> `serpid`, so we must pass the SERP id here.
          const apiReportId = String((item as any).serpid || (item as any).report_id || (item as any).id || displayReportId);

          // Small delay between calls keeps the endpoint happy.
          if (i > 0) await sleep(220);
          const data = await fetchOne(apiReportId);

          if (cancelled) return;
          if (data.length > 0) {
            dataMap.set(displayReportId, data);
            // Stream partial results so the chart can render ASAP.
            setHistoricalData(new Map(dataMap));
          }

          setFetchProgress({ done: i + 1, total: reportsToFetch.length });
        }

        if (cancelled) return;
        setHistoricalData(new Map(dataMap));
        console.log('[BronKeywordAnalysisDialog] Loaded', dataMap.size, 'historical reports');
        
        // Log detailed matching info for debugging
        if (dataMap.size > 0) {
          const firstReportId = [...dataMap.keys()][0];
          const firstReportData = dataMap.get(firstReportId) || [];
          console.log('[BronKeywordAnalysisDialog] Cluster keywords:', allKeywords.map(k => ({ id: k.id, text: k.text })));
          console.log('[BronKeywordAnalysisDialog] Available SERP keywords:', 
            firstReportData.map(r => r.keyword)
          );
          
          // Test matching for each cluster keyword
          allKeywords.forEach(kw => {
            const match = findSerpForKeyword(kw.text, firstReportData);
            const idMatch = findSerpByKeywordId(kw.keyword.id, firstReportData);
            console.log(`[BronKeywordAnalysisDialog] Match test: "${kw.text}" -> text: ${match?.keyword || 'NONE'}, id: ${idMatch?.keyword || 'NONE'}`);
          });
        }
      } catch (err) {
        console.error('Failed to fetch historical data:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      // Prevent state updates after close/reopen, especially during long fetch sequences.
      cancelled = true;
    };
  }, [isOpen, selectedDomain, filteredHistory, onFetchSerpDetail, allKeywords]);

  // Build chart data for a specific engine
  const buildChartDataForEngine = (engine: SearchEngine): { data: ChartDataPoint[], summaries: KeywordSummary[] } => {
    const data: ChartDataPoint[] = [];
    const positionsPerKeyword: Record<string, number[]> = {};
    
    // Initialize positions tracker for each keyword
    allKeywords.forEach(kw => {
      positionsPerKeyword[kw.id] = [];
    });
    
    // Sort history chronologically (oldest first)
    const sortedHistoryByTime = [...filteredHistory].sort((a, b) => {
      const tsA = getSerpListItemTimestamp(a) ?? 0;
      const tsB = getSerpListItemTimestamp(b) ?? 0;
      return tsA - tsB;
    });
    
    let debugLogged = false;
    
    sortedHistoryByTime.forEach(item => {
      const reportId = getReportId(item);
      const reportData = historicalData.get(reportId);
      if (!reportData || reportData.length === 0) return;

      const timestamp = getSerpListItemTimestamp(item);
      if (timestamp === null) return;
      
      const point: ChartDataPoint = { date: format(new Date(timestamp), 'MMM d'), timestamp };
      
      allKeywords.forEach(kw => {
        // Try multiple matching strategies with increasing fuzziness
        let serpItem: BronSerpReport | null = null;
        
        // Strategy 1: Match by extracted target keyword text
        serpItem = findSerpForKeyword(kw.text, reportData);
        
        // Strategy 2: Match by keyword ID
        if (!serpItem) {
          serpItem = findSerpByKeywordId(kw.keyword.id, reportData);
        }
        
        // Strategy 3: Try original keyword field from BronKeyword
        if (!serpItem && kw.keyword.keyword) {
          serpItem = findSerpForKeyword(kw.keyword.keyword, reportData);
        }
        
        // Strategy 4: Try keywordtitle field
        if (!serpItem && kw.keyword.keywordtitle) {
          serpItem = findSerpForKeyword(kw.keyword.keywordtitle, reportData);
        }
        
        // Debug log for first report only
        if (!debugLogged && !serpItem && reportData.length > 0) {
          console.log('[BronKeywordAnalysisDialog] No match for:', {
            targetText: kw.text,
            originalKeyword: kw.keyword.keyword,
            keywordtitle: kw.keyword.keywordtitle,
            id: kw.keyword.id
          }, 'vs SERP:', reportData.slice(0, 3).map(r => r.keyword));
        }
        
        let pos: number | null = null;
        
        if (serpItem) {
          if (engine === "google") {
            pos = getPosition(serpItem.google);
          } else if (engine === "bing") {
            pos = getPosition(serpItem.bing);
          } else if (engine === "yahoo") {
            pos = getPosition(serpItem.yahoo);
          }
        }
        
        if (pos !== null) {
          positionsPerKeyword[kw.id].push(pos);
        }
        
        // Use UNRANKED_POSITION for nulls so they appear at bottom
        point[kw.id] = pos ?? UNRANKED_POSITION;
      });
      
      debugLogged = true;
      
      // Always include the data point when we have report data so the timeline
      // can show "unranked" periods leading up to first rankings.
      data.push(point);
    });
    
    // Log chart data summary
    console.log(`[BronKeywordAnalysisDialog] ${engine} chart built:`, {
      totalDataPoints: data.length,
      historicalDataSize: historicalData.size,
      filteredHistoryLength: filteredHistory.length
    });
    
    // Log summary
    console.log(`[BronKeywordAnalysisDialog] ${engine} chart data:`, {
      dataPoints: data.length,
      keywords: allKeywords.map(kw => ({ id: kw.id, text: kw.text, positions: positionsPerKeyword[kw.id]?.length || 0 }))
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
    
    return { data, summaries };
  };

  // Memoize chart data for each engine
  const googleData = useMemo(() => {
    console.log('[BronKeywordAnalysisDialog] Building Google chart:', {
      filteredHistoryLength: filteredHistory.length,
      historicalDataSize: historicalData.size,
      historicalDataKeys: [...historicalData.keys()].slice(0, 5),
      filteredHistoryReportIds: filteredHistory.slice(0, 5).map(item => getReportId(item)),
    });
    return buildChartDataForEngine("google");
  }, [filteredHistory, historicalData, allKeywords]);
  
  const bingData = useMemo(() => buildChartDataForEngine("bing"), [filteredHistory, historicalData, allKeywords]);
  const yahooData = useMemo(() => buildChartDataForEngine("yahoo"), [filteredHistory, historicalData, allKeywords]);

  const getCurrentData = () => {
    switch (selectedEngine) {
      case "google": return googleData;
      case "bing": return bingData;
      case "yahoo": return yahooData;
      default: return googleData;
    }
  };

  const currentData = getCurrentData();
  
  const dateRangeButtons: { value: DateRange; label: string }[] = [
    { value: "all", label: "All Time" },
    { value: "30d", label: "30 Days" },
    { value: "60d", label: "60 Days" },
    { value: "90d", label: "90 Days" },
  ];
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden bg-background/98 backdrop-blur-2xl border-primary/20 shadow-[0_0_60px_rgba(139,92,246,0.15)] p-0 flex flex-col">
        <div className="flex flex-1 flex-col overflow-hidden p-4 min-h-0">
          {/* Compact Header Row */}
          <DialogHeader className="shrink-0 pb-2">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Icon + Title */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-violet-500/20 border border-primary/40 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-amber-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                    Cluster Trend Analysis
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">{mainKeywordText}</p>
                </div>
              </div>
              
              {/* Right: Date Range Buttons */}
              <div className="flex gap-1">
                {dateRangeButtons.map(btn => (
                  <Button
                    key={btn.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange(btn.value)}
                    className={`px-3 py-1 h-8 text-xs rounded-lg transition-all ${
                      dateRange === btn.value 
                        ? "bg-primary/20 text-primary border border-primary/40" 
                        : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
            </div>
          </DialogHeader>

          {/* Chart Section - Only renders once data exists */}
          <div className="flex-1 min-h-0 flex flex-col">
            {historicalData.size > 0 ? (
              <div className="flex-1 min-h-0 flex flex-col">
                <BronMultiKeywordTrendChart
                  keywords={chartKeywords}
                  serpReportsMap={historicalData}
                  reportDates={reportDates}
                  title="CLUSTER RANKING TREND"
                  maxKeywords={3}
                />
              </div>
            ) : isLoading ? (
              /* Show nothing while loading - chart will appear as soon as first data arrives */
              null
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-4">
                <div className="w-12 h-12 rounded-2xl bg-muted/20 border border-border/30 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-muted-foreground text-center">
                  <p>No historical ranking data available</p>
                  <p className="text-xs mt-1">Historical reports: {filteredHistory.length}</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
});

BronKeywordAnalysisDialog.displayName = 'BronKeywordAnalysisDialog';
