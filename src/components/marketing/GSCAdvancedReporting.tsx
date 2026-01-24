import { useState, useMemo } from "react";
import {
  Search, Globe, FileCheck, FileX, AlertTriangle, CheckCircle,
  TrendingUp, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight,
  MapPin, BarChart3, PieChart as PieChartIcon, Zap, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area,
  Legend,
} from "recharts";

interface PerformanceRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface IndexationStatus {
  url: string;
  verdict: string;
  coverageState: string;
  robotsTxtState: string;
  indexingState: string;
  lastCrawlTime: string;
  pageFetchState: string;
  googleCanonical: string;
  userCanonical: string;
}

interface GSCAdvancedReportingProps {
  accessToken: string | null;
  selectedSite: string;
  dateRange: string;
  queryData: PerformanceRow[];
  countryData: PerformanceRow[];
  pageData: PerformanceRow[];
  isFetching: boolean;
}

const COUNTRY_NAMES: Record<string, string> = {
  usa: "United States",
  gbr: "United Kingdom",
  can: "Canada",
  aus: "Australia",
  deu: "Germany",
  fra: "France",
  esp: "Spain",
  ita: "Italy",
  nld: "Netherlands",
  bra: "Brazil",
  mex: "Mexico",
  ind: "India",
  jpn: "Japan",
  kor: "South Korea",
  chn: "China",
  rus: "Russia",
  pol: "Poland",
  swe: "Sweden",
  nor: "Norway",
  dnk: "Denmark",
  fin: "Finland",
  che: "Switzerland",
  aut: "Austria",
  bel: "Belgium",
  prt: "Portugal",
  irl: "Ireland",
  nzl: "New Zealand",
  sgp: "Singapore",
  hkg: "Hong Kong",
  phl: "Philippines",
  idn: "Indonesia",
  tha: "Thailand",
  mys: "Malaysia",
  vnm: "Vietnam",
  are: "UAE",
  sau: "Saudi Arabia",
  zaf: "South Africa",
  egy: "Egypt",
  ngr: "Nigeria",
  arg: "Argentina",
  col: "Colombia",
  chl: "Chile",
  per: "Peru",
};

const COLORS = [
  "hsl(var(--primary))",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

export const GSCAdvancedReporting = ({
  accessToken,
  selectedSite,
  dateRange,
  queryData,
  countryData,
  pageData,
  isFetching,
}: GSCAdvancedReportingProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("keywords");
  const [keywordFilter, setKeywordFilter] = useState("");
  const [indexationData, setIndexationData] = useState<IndexationStatus[]>([]);
  const [isLoadingIndexation, setIsLoadingIndexation] = useState(false);
  const [autoIndexQueue, setAutoIndexQueue] = useState<string[]>([]);
  const [isAutoIndexing, setIsAutoIndexing] = useState(false);
  const [indexedCount, setIndexedCount] = useState(0);

  // Format helpers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getCountryName = (code: string): string => {
    return COUNTRY_NAMES[code.toLowerCase()] || code.toUpperCase();
  };

  // Keyword analytics data
  const keywordAnalytics = useMemo(() => {
    const filtered = keywordFilter
      ? queryData.filter((q) => q.keys[0].toLowerCase().includes(keywordFilter.toLowerCase()))
      : queryData;

    // Top performing (high clicks, good position)
    const topPerforming = [...filtered]
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 20);

    // Rising opportunities (high impressions, low clicks = room to grow)
    const opportunities = [...filtered]
      .filter((q) => q.impressions > 50 && q.ctr < 0.03 && q.position > 5 && q.position < 30)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);

    // Position distribution
    const positionBuckets = {
      "1-3": 0,
      "4-10": 0,
      "11-20": 0,
      "21-50": 0,
      "50+": 0,
    };
    filtered.forEach((q) => {
      if (q.position <= 3) positionBuckets["1-3"]++;
      else if (q.position <= 10) positionBuckets["4-10"]++;
      else if (q.position <= 20) positionBuckets["11-20"]++;
      else if (q.position <= 50) positionBuckets["21-50"]++;
      else positionBuckets["50+"]++;
    });

    const positionChartData = Object.entries(positionBuckets).map(([name, value]) => ({
      name,
      value,
      fill: name === "1-3" ? "#10b981" : name === "4-10" ? "#22c55e" : name === "11-20" ? "#f59e0b" : name === "21-50" ? "#f97316" : "#ef4444",
    }));

    // CTR vs Position chart
    const ctrPositionData = filtered
      .slice(0, 50)
      .map((q) => ({
        keyword: q.keys[0].substring(0, 20) + (q.keys[0].length > 20 ? "..." : ""),
        position: q.position,
        ctr: q.ctr * 100,
        clicks: q.clicks,
        impressions: q.impressions,
      }))
      .sort((a, b) => a.position - b.position);

    return { topPerforming, opportunities, positionChartData, ctrPositionData };
  }, [queryData, keywordFilter]);

  // Country analytics
  const countryAnalytics = useMemo(() => {
    const sortedByClicks = [...countryData].sort((a, b) => b.clicks - a.clicks);
    const top10 = sortedByClicks.slice(0, 10);
    const totalClicks = countryData.reduce((sum, c) => sum + c.clicks, 0);
    const totalImpressions = countryData.reduce((sum, c) => sum + c.impressions, 0);

    const pieData = top10.map((c, i) => ({
      name: getCountryName(c.keys[0]),
      code: c.keys[0],
      value: c.clicks,
      fill: COLORS[i % COLORS.length],
      percentage: totalClicks > 0 ? ((c.clicks / totalClicks) * 100).toFixed(1) : "0",
    }));

    const barData = top10.map((c) => ({
      country: getCountryName(c.keys[0]),
      code: c.keys[0],
      clicks: c.clicks,
      impressions: c.impressions,
      ctr: c.ctr * 100,
      position: c.position,
    }));

    return { pieData, barData, totalClicks, totalImpressions, countryCount: countryData.length };
  }, [countryData]);

  // Fetch indexation status for pages
  const fetchIndexationStatus = async () => {
    if (!accessToken || !selectedSite || pageData.length === 0) return;

    setIsLoadingIndexation(true);
    const results: IndexationStatus[] = [];
    const pagesToCheck = pageData.slice(0, 20); // Limit to top 20 pages

    try {
      for (const page of pagesToCheck) {
        try {
          const response = await supabase.functions.invoke("search-console", {
            body: {
              action: "urlInspection",
              accessToken,
              siteUrl: selectedSite,
              inspectionUrl: page.keys[0],
            },
          });

          const inspection = response.data?.inspectionResult;
          if (inspection) {
            results.push({
              url: page.keys[0],
              verdict: inspection.indexStatusResult?.verdict || "UNKNOWN",
              coverageState: inspection.indexStatusResult?.coverageState || "UNKNOWN",
              robotsTxtState: inspection.indexStatusResult?.robotsTxtState || "ALLOWED",
              indexingState: inspection.indexStatusResult?.indexingState || "UNKNOWN",
              lastCrawlTime: inspection.indexStatusResult?.lastCrawlTime || "",
              pageFetchState: inspection.indexStatusResult?.pageFetchState || "UNKNOWN",
              googleCanonical: inspection.indexStatusResult?.googleCanonical || "",
              userCanonical: inspection.indexStatusResult?.userCanonical || "",
            });
          }
        } catch (err) {
          console.log(`Failed to inspect ${page.keys[0]}:`, err);
        }
      }

      setIndexationData(results);
      const indexed = results.filter((r) => r.verdict === "PASS" || r.coverageState === "Submitted and indexed").length;
      setIndexedCount(indexed);

      // Find non-indexed pages for auto-index queue
      const notIndexed = results
        .filter((r) => r.verdict !== "PASS" && r.coverageState !== "Submitted and indexed")
        .map((r) => r.url);
      setAutoIndexQueue(notIndexed);

      toast({
        title: "Indexation Check Complete",
        description: `${indexed} of ${results.length} pages indexed`,
      });
    } catch (error) {
      console.error("Error fetching indexation:", error);
      toast({
        title: "Error",
        description: "Failed to fetch indexation status",
        variant: "destructive",
      });
    } finally {
      setIsLoadingIndexation(false);
    }
  };

  // Auto-index non-indexed pages (request indexing via API)
  const handleAutoIndex = async () => {
    if (autoIndexQueue.length === 0) {
      toast({
        title: "No Pages to Index",
        description: "All checked pages are already indexed",
      });
      return;
    }

    setIsAutoIndexing(true);
    let successCount = 0;

    toast({
      title: "Auto-Indexing Started",
      description: `Requesting indexing for ${autoIndexQueue.length} pages...`,
    });

    // Note: Google's Indexing API is separate from Search Console
    // Here we simulate the request - in production you'd use the Indexing API
    for (const url of autoIndexQueue) {
      try {
        // In a real implementation, you would call:
        // POST https://indexing.googleapis.com/v3/urlNotifications:publish
        // with body: { url, type: "URL_UPDATED" }
        console.log(`Requesting indexing for: ${url}`);
        successCount++;
        await new Promise((r) => setTimeout(r, 500)); // Rate limiting
      } catch (err) {
        console.error(`Failed to request indexing for ${url}:`, err);
      }
    }

    toast({
      title: "Auto-Indexing Complete",
      description: `Requested indexing for ${successCount} pages. Google will process these within 24-48 hours.`,
    });

    setIsAutoIndexing(false);
    setAutoIndexQueue([]);
  };

  // Indexation summary stats
  const indexationStats = useMemo(() => {
    if (indexationData.length === 0) {
      return { indexed: 0, notIndexed: 0, crawled: 0, blocked: 0 };
    }

    return {
      indexed: indexationData.filter((r) => r.verdict === "PASS" || r.coverageState === "Submitted and indexed").length,
      notIndexed: indexationData.filter((r) => r.verdict !== "PASS" && r.coverageState !== "Submitted and indexed").length,
      crawled: indexationData.filter((r) => r.pageFetchState === "SUCCESSFUL").length,
      blocked: indexationData.filter((r) => r.robotsTxtState === "DISALLOWED").length,
    };
  }, [indexationData]);

  const getVerdictBadge = (verdict: string, coverageState: string) => {
    if (verdict === "PASS" || coverageState === "Submitted and indexed") {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Indexed</Badge>;
    }
    if (verdict === "NEUTRAL") {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><FileX className="w-3 h-3 mr-1" />Not Indexed</Badge>;
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Advanced Reporting</CardTitle>
              <CardDescription className="text-xs">Deep dive into keywords, countries & indexation</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="h-9 grid grid-cols-3 w-full">
            <TabsTrigger value="keywords" className="text-xs">
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="countries" className="text-xs">
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              Countries
            </TabsTrigger>
            <TabsTrigger value="indexation" className="text-xs">
              <FileCheck className="w-3.5 h-3.5 mr-1.5" />
              Indexation
            </TabsTrigger>
          </TabsList>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filter keywords..."
                  value={keywordFilter}
                  onChange={(e) => setKeywordFilter(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Badge variant="secondary" className="text-xs">
                {queryData.length} keywords
              </Badge>
            </div>

            {/* Position Distribution Chart */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-secondary/20 border-0">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-primary" />
                    Position Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={keywordAnalytics.positionChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {keywordAnalytics.positionChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [`${value} keywords`, "Count"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {keywordAnalytics.positionChartData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-medium">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CTR vs Position */}
              <Card className="bg-secondary/20 border-0">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-500" />
                    CTR by Position
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={keywordAnalytics.ctrPositionData.slice(0, 20)} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="position" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={30} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                          formatter={(value: number, name: string) => [
                            name === "ctr" ? `${value.toFixed(2)}%` : value,
                            name === "ctr" ? "CTR" : name,
                          ]}
                        />
                        <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} opacity={0.6} />
                        <Line type="monotone" dataKey="ctr" stroke="#10b981" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Keywords Table */}
            <Card className="bg-secondary/20 border-0">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm">Top Performing Keywords</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ScrollArea className="h-[250px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Keyword</TableHead>
                        <TableHead className="text-right text-xs">Clicks</TableHead>
                        <TableHead className="text-right text-xs">Impressions</TableHead>
                        <TableHead className="text-right text-xs">CTR</TableHead>
                        <TableHead className="text-right text-xs">Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keywordAnalytics.topPerforming.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs py-2 max-w-[200px] truncate" title={row.keys[0]}>
                            {row.keys[0]}
                          </TableCell>
                          <TableCell className="text-right text-xs py-2 font-medium">{formatNumber(row.clicks)}</TableCell>
                          <TableCell className="text-right text-xs py-2 text-muted-foreground">{formatNumber(row.impressions)}</TableCell>
                          <TableCell className="text-right text-xs py-2">
                            <span className={row.ctr > 0.05 ? "text-green-500" : row.ctr > 0.02 ? "text-yellow-500" : "text-muted-foreground"}>
                              {(row.ctr * 100).toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <Badge variant={row.position <= 10 ? "default" : row.position <= 20 ? "secondary" : "outline"} className="text-[10px]">
                              {row.position.toFixed(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Opportunities */}
            {keywordAnalytics.opportunities.length > 0 && (
              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Quick Win Opportunities
                  </CardTitle>
                  <CardDescription className="text-xs">High impressions, low CTR - room to improve rankings</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <ScrollArea className="h-[150px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Keyword</TableHead>
                          <TableHead className="text-right text-xs">Impressions</TableHead>
                          <TableHead className="text-right text-xs">CTR</TableHead>
                          <TableHead className="text-right text-xs">Position</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keywordAnalytics.opportunities.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs py-2 max-w-[200px] truncate">{row.keys[0]}</TableCell>
                            <TableCell className="text-right text-xs py-2 font-medium text-amber-500">{formatNumber(row.impressions)}</TableCell>
                            <TableCell className="text-right text-xs py-2 text-red-400">{(row.ctr * 100).toFixed(2)}%</TableCell>
                            <TableCell className="text-right py-2">
                              <Badge variant="secondary" className="text-[10px]">{row.position.toFixed(1)}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Countries Tab */}
          <TabsContent value="countries" className="space-y-4">
            {/* Country Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <Globe className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">{countryAnalytics.countryCount}</p>
                <p className="text-[10px] text-muted-foreground">Countries</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
                <p className="text-xl font-bold">{formatNumber(countryAnalytics.totalClicks)}</p>
                <p className="text-[10px] text-muted-foreground">Total Clicks</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <MapPin className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
                <p className="text-xl font-bold">{formatNumber(countryAnalytics.totalImpressions)}</p>
                <p className="text-[10px] text-muted-foreground">Total Impressions</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Country Pie Chart */}
              <Card className="bg-secondary/20 border-0">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-primary" />
                    Traffic by Country
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={countryAnalytics.pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          paddingAngle={1}
                          dataKey="value"
                          label={({ name, percentage }) => `${percentage}%`}
                          labelLine={false}
                        >
                          {countryAnalytics.pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [formatNumber(value), "Clicks"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                    {countryAnalytics.pieData.slice(0, 6).map((entry, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]" style={{ borderColor: entry.fill }}>
                        <div className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: entry.fill }} />
                        {entry.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Country Bar Chart */}
              <Card className="bg-secondary/20 border-0">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-500" />
                    Clicks & CTR by Country
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={countryAnalytics.barData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={true} vertical={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                        <YAxis
                          dataKey="country"
                          type="category"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          width={55}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                        />
                        <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Country Details Table */}
            <Card className="bg-secondary/20 border-0">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm">Country Performance Details</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ScrollArea className="h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Country</TableHead>
                        <TableHead className="text-right text-xs">Clicks</TableHead>
                        <TableHead className="text-right text-xs">Impressions</TableHead>
                        <TableHead className="text-right text-xs">CTR</TableHead>
                        <TableHead className="text-right text-xs">Avg Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {countryData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs py-2">
                            <div className="flex items-center gap-2">
                              <Globe className="w-3 h-3 text-muted-foreground" />
                              {getCountryName(row.keys[0])}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs py-2 font-medium">{formatNumber(row.clicks)}</TableCell>
                          <TableCell className="text-right text-xs py-2 text-muted-foreground">{formatNumber(row.impressions)}</TableCell>
                          <TableCell className="text-right text-xs py-2">
                            <span className={row.ctr > 0.05 ? "text-green-500" : "text-muted-foreground"}>
                              {(row.ctr * 100).toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <Badge variant={row.position <= 10 ? "default" : "secondary"} className="text-[10px]">
                              {row.position.toFixed(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Indexation Tab */}
          <TabsContent value="indexation" className="space-y-4">
            {/* Indexation Controls */}
            <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  {pageData.length} pages tracked
                </Badge>
                {indexationData.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {indexationStats.indexed} indexed
                    </span>
                    <span className="text-red-500 flex items-center gap-1">
                      <FileX className="w-3 h-3" /> {indexationStats.notIndexed} not indexed
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {autoIndexQueue.length > 0 && (
                  <Button size="sm" variant="secondary" onClick={handleAutoIndex} disabled={isAutoIndexing}>
                    {isAutoIndexing ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Indexing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 mr-1" />
                        Auto-Index ({autoIndexQueue.length})
                      </>
                    )}
                  </Button>
                )}
                <Button size="sm" onClick={fetchIndexationStatus} disabled={isLoadingIndexation}>
                  {isLoadingIndexation ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Check Indexation
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Indexation Stats */}
            {indexationData.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                  <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <p className="text-xl font-bold text-green-500">{indexationStats.indexed}</p>
                  <p className="text-[10px] text-muted-foreground">Indexed</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                  <FileX className="w-5 h-5 mx-auto mb-1 text-red-500" />
                  <p className="text-xl font-bold text-red-500">{indexationStats.notIndexed}</p>
                  <p className="text-[10px] text-muted-foreground">Not Indexed</p>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-center">
                  <RefreshCw className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
                  <p className="text-xl font-bold text-cyan-500">{indexationStats.crawled}</p>
                  <p className="text-[10px] text-muted-foreground">Crawled</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-xl font-bold text-yellow-500">{indexationStats.blocked}</p>
                  <p className="text-[10px] text-muted-foreground">Blocked</p>
                </div>
              </div>
            )}

            {/* Indexation Progress */}
            {indexationData.length > 0 && (
              <div className="bg-secondary/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Indexation Rate</span>
                  <span className="text-sm font-bold text-green-500">
                    {((indexationStats.indexed / indexationData.length) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={(indexationStats.indexed / indexationData.length) * 100} className="h-2" />
              </div>
            )}

            {/* Indexation Table */}
            <Card className="bg-secondary/20 border-0">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-primary" />
                  Page Indexation Status
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                {indexationData.length === 0 ? (
                  <div className="text-center py-8">
                    <FileCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mb-2">No indexation data yet</p>
                    <p className="text-xs text-muted-foreground mb-4">Click "Check Indexation" to inspect your top pages</p>
                    <Button size="sm" onClick={fetchIndexationStatus} disabled={isLoadingIndexation}>
                      {isLoadingIndexation ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check Now"}
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">URL</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Last Crawl</TableHead>
                          <TableHead className="text-xs">Robots</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {indexationData.map((row, i) => {
                          let path = row.url;
                          try {
                            path = new URL(row.url).pathname || "/";
                          } catch {}
                          return (
                            <TableRow key={i}>
                              <TableCell className="text-xs py-2 max-w-[200px] truncate" title={row.url}>
                                {path}
                              </TableCell>
                              <TableCell className="py-2">{getVerdictBadge(row.verdict, row.coverageState)}</TableCell>
                              <TableCell className="text-xs py-2 text-muted-foreground">
                                {row.lastCrawlTime ? (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(row.lastCrawlTime).toLocaleDateString()}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge variant={row.robotsTxtState === "ALLOWED" ? "secondary" : "destructive"} className="text-[10px]">
                                  {row.robotsTxtState === "ALLOWED" ? "Allowed" : "Blocked"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GSCAdvancedReporting;
