import { motion } from "framer-motion";
import { 
  BarChart3, RefreshCw, Search, Target, CalendarIcon, TrendingUp
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BronSerpReport, BronSerpListItem, BronKeyword } from "@/hooks/use-bron-api";
import { BronMultiKeywordTrendChart } from "@/components/marketing/bron/BronMultiKeywordTrendChart";
import { cn } from "@/lib/utils";

// Helper to get timestamp from SERP list item
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

// Helper to get report ID from BronSerpListItem
function getReportId(item: BronSerpListItem): string {
  return String(item.serpid || item.report_id || item.id || '');
}

interface BRONSerpTabProps {
  serpReports: BronSerpReport[];
  serpHistory?: BronSerpListItem[];
  keywords?: BronKeyword[];
  selectedDomain?: string;
  isLoading: boolean;
  onRefresh: () => void;
  onFetchSerpDetail?: (domain: string, reportId: string) => Promise<BronSerpReport[]>;
}

export const BRONSerpTab = ({
  serpReports,
  serpHistory = [],
  keywords = [],
  selectedDomain,
  isLoading,
  onRefresh,
  onFetchSerpDetail,
}: BRONSerpTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showTrendChart, setShowTrendChart] = useState(true);
  const [historicalData, setHistoricalData] = useState<Map<string, BronSerpReport[]>>(new Map());
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Filter keywords to non-tracking-only for trend chart
  const chartKeywords = useMemo(() => {
    return keywords.filter(kw => 
      kw.status !== 'tracking_only' && !String(kw.id).startsWith('serp_')
    ).slice(0, 8); // Limit to 8 keywords for readability
  }, [keywords]);

  // Sorted history by date
  const sortedHistory = useMemo(() => {
    return [...serpHistory].sort((a, b) => {
      const dateA = getSerpListItemTimestamp(a) ?? 0;
      const dateB = getSerpListItemTimestamp(b) ?? 0;
      return dateA - dateB;
    });
  }, [serpHistory]);

  // Filter history by date range
  const filteredHistory = useMemo(() => {
    if (!startDate && !endDate) return sortedHistory;
    
    return sortedHistory.filter(item => {
      const ts = getSerpListItemTimestamp(item);
      if (ts === null) return true;
      const itemDate = new Date(ts);
      
      if (startDate && itemDate < startDate) return false;
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (itemDate > endOfDay) return false;
      }
      return true;
    });
  }, [sortedHistory, startDate, endDate]);

  // Report dates for the chart
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

  // Fetch historical SERP details for trend chart
  const fetchHistoricalData = useCallback(async () => {
    if (!selectedDomain || !onFetchSerpDetail || filteredHistory.length === 0) return;
    
    setIsLoadingHistory(true);
    const dataMap = new Map<string, BronSerpReport[]>();
    
    try {
      // Limit to 15 most recent reports for performance
      const reportsToFetch = filteredHistory.slice(-15);
      
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
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [selectedDomain, onFetchSerpDetail, filteredHistory]);

  // Fetch data when chart is shown and we have history
  useEffect(() => {
    if (showTrendChart && chartKeywords.length > 0 && filteredHistory.length > 0 && historicalData.size === 0) {
      fetchHistoricalData();
    }
  }, [showTrendChart, chartKeywords.length, filteredHistory.length, historicalData.size, fetchHistoricalData]);

  const filteredReports = useMemo(() => {
    return serpReports.filter(r => {
      // Search filter
      const matchesSearch = r.keyword?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Date filter
      let matchesDate = true;
      if (r.complete && (startDate || endDate)) {
        const reportDate = new Date(r.complete);
        if (startDate && reportDate < startDate) matchesDate = false;
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (reportDate > endOfDay) matchesDate = false;
        }
      }
      
      return matchesSearch && matchesDate;
    });
  }, [serpReports, searchQuery, startDate, endDate]);

  const clearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // Parse position value from string/number
  const getPosition = (val?: string | number): number | null => {
    if (val === undefined || val === null) return null;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) || num === 0 ? null : num;
  };

  const getPositionBadge = (val?: string | number) => {
    const position = getPosition(val);
    if (position === null) return <Badge variant="secondary" className="text-xs">—</Badge>;
    
    if (position <= 3) {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">{position}</Badge>;
    } else if (position <= 10) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">{position}</Badge>;
    } else if (position <= 20) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">{position}</Badge>;
    } else {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">{position}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Multi-Keyword Trend Chart */}
      {selectedDomain && chartKeywords.length > 0 && showTrendChart && (
        <div className="relative">
          {isLoadingHistory && historicalData.size === 0 ? (
            <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/30 flex items-center justify-center animate-pulse">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-muted-foreground text-sm">Loading trend data...</div>
                </div>
              </CardContent>
            </Card>
          ) : historicalData.size > 0 ? (
            <BronMultiKeywordTrendChart
              keywords={chartKeywords}
              serpReportsMap={historicalData}
              reportDates={reportDates}
              title="ALL-TIME TREND"
              maxKeywords={8}
            />
          ) : null}
          
          {/* Toggle button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTrendChart(!showTrendChart)}
            className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {showTrendChart ? 'Hide Chart' : 'Show Chart'}
          </Button>
        </div>
      )}

      <Card className="border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                SERP Rankings
                {selectedDomain && (
                  <Badge variant="secondary" className="text-xs ml-2">{selectedDomain}</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rankings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48 h-9 bg-secondary/50"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefresh}
                  disabled={isLoading || !selectedDomain}
                  className="border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            
            {/* Date Range Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Date Range:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 justify-start text-left font-normal border-emerald-500/30",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-xs text-muted-foreground">to</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 justify-start text-left font-normal border-emerald-500/30",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateFilter}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
              
              {(startDate || endDate) && (
                <Badge variant="secondary" className="text-xs">
                  {filteredReports.length} results
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedDomain ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Select a domain to view SERP rankings</p>
              <p className="text-sm mt-1">Use the domain selector above</p>
            </div>
          ) : isLoading && serpReports.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No SERP data available</p>
              <p className="text-sm mt-1">Ranking reports will appear here when available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Keyword</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                      <span className="inline-flex items-center gap-1">🟢 Google</span>
                    </th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                      <span className="inline-flex items-center gap-1">🔵 Bing</span>
                    </th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                      <span className="inline-flex items-center gap-1">🟣 Yahoo</span>
                    </th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                      <span className="inline-flex items-center gap-1">🟠 Duck</span>
                    </th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Last Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report, index) => (
                    <motion.tr
                      key={`${report.keyword}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-border/50 hover:bg-emerald-500/5 transition-colors"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Target className="w-4 h-4 text-emerald-400" />
                          </div>
                          <span className="font-medium text-sm">{report.keyword}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        {getPositionBadge(report.google)}
                      </td>
                      <td className="py-3 text-center">
                        {getPositionBadge(report.bing)}
                      </td>
                      <td className="py-3 text-center">
                        {getPositionBadge(report.yahoo)}
                      </td>
                      <td className="py-3 text-center">
                        {getPositionBadge(report.duck)}
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-xs text-muted-foreground">
                          {report.complete ? new Date(report.complete).toLocaleDateString() : '—'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
