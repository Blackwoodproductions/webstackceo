import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, TrendingUp, TrendingDown, MousePointer, Eye, Target,
  BarChart3, Globe, FileText, Link2, AlertTriangle, CheckCircle,
  RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, Loader2,
  LogOut, Settings, ChevronDown, ExternalLink
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import InteractiveGrid from "@/components/ui/interactive-grid";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Google OAuth Config
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/webmasters",
].join(" ");

interface PerformanceRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SiteInfo {
  siteUrl: string;
  permissionLevel: string;
}

interface SitemapInfo {
  path: string;
  lastSubmitted: string;
  isPending: boolean;
  isSitemapsIndex: boolean;
  lastDownloaded?: string;
  warnings?: number;
  errors?: number;
}

const Analytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data state
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [dateRange, setDateRange] = useState<"7" | "28" | "90">("28");
  
  // Performance data
  const [queryData, setQueryData] = useState<PerformanceRow[]>([]);
  const [pageData, setPageData] = useState<PerformanceRow[]>([]);
  const [countryData, setCountryData] = useState<PerformanceRow[]>([]);
  const [deviceData, setDeviceData] = useState<PerformanceRow[]>([]);
  const [dateData, setDateData] = useState<PerformanceRow[]>([]);
  const [sitemaps, setSitemaps] = useState<SitemapInfo[]>([]);
  
  const [isFetching, setIsFetching] = useState(false);

  // Check for stored token on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem("gsc_access_token");
    const tokenExpiry = sessionStorage.getItem("gsc_token_expiry");
    
    if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
      setAccessToken(storedToken);
      setIsAuthenticated(true);
    }
    
    // Check URL for OAuth callback
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("access_token");
      const expiresIn = params.get("expires_in");
      
      if (token) {
        const expiry = Date.now() + (parseInt(expiresIn || "3600") * 1000);
        sessionStorage.setItem("gsc_access_token", token);
        sessionStorage.setItem("gsc_token_expiry", expiry.toString());
        setAccessToken(token);
        setIsAuthenticated(true);
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    
    setIsLoading(false);
  }, []);

  // Fetch sites when authenticated
  useEffect(() => {
    if (accessToken) {
      fetchSites();
    }
  }, [accessToken]);

  // Fetch data when site selected
  useEffect(() => {
    if (selectedSite && accessToken) {
      fetchAllData();
    }
  }, [selectedSite, dateRange, accessToken]);

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast({
        title: "Configuration Required",
        description: "Google OAuth is not configured. Please add your Google Client ID.",
        variant: "destructive",
      });
      return;
    }

    const redirectUri = window.location.origin + "/analytics";
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "token");
    authUrl.searchParams.set("scope", GOOGLE_SCOPES);
    authUrl.searchParams.set("prompt", "consent");
    
    window.location.href = authUrl.toString();
  };

  const handleLogout = () => {
    sessionStorage.removeItem("gsc_access_token");
    sessionStorage.removeItem("gsc_token_expiry");
    setAccessToken(null);
    setIsAuthenticated(false);
    setSites([]);
    setSelectedSite("");
    setQueryData([]);
    setPageData([]);
    setCountryData([]);
    setDeviceData([]);
    setDateData([]);
    setSitemaps([]);
  };

  const fetchSites = async () => {
    try {
      const response = await supabase.functions.invoke("search-console", {
        body: { action: "sites", accessToken },
      });

      if (response.error) throw response.error;
      
      const siteEntries = response.data?.siteEntry || [];
      setSites(siteEntries);
      
      if (siteEntries.length > 0 && !selectedSite) {
        setSelectedSite(siteEntries[0].siteUrl);
      }
    } catch (error: any) {
      console.error("Error fetching sites:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your sites. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchAllData = async () => {
    if (!selectedSite || !accessToken) return;
    
    setIsFetching(true);
    const startDate = getDateNDaysAgo(parseInt(dateRange));
    const endDate = getDateNDaysAgo(0);
    
    try {
      const [queries, pages, countries, devices, dates, sitemapsRes] = await Promise.all([
        fetchPerformance(["query"], 25),
        fetchPerformance(["page"], 25),
        fetchPerformance(["country"], 10),
        fetchPerformance(["device"], 5),
        fetchPerformance(["date"], 90),
        fetchSitemaps(),
      ]);

      setQueryData(queries?.rows || []);
      setPageData(pages?.rows || []);
      setCountryData(countries?.rows || []);
      setDeviceData(devices?.rows || []);
      setDateData(dates?.rows || []);
      setSitemaps(sitemapsRes?.sitemap || []);
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchPerformance = async (dimensions: string[], rowLimit: number) => {
    const response = await supabase.functions.invoke("search-console", {
      body: {
        action: "performance",
        accessToken,
        siteUrl: selectedSite,
        startDate: getDateNDaysAgo(parseInt(dateRange)),
        endDate: getDateNDaysAgo(0),
        dimensions,
        rowLimit,
      },
    });
    return response.data;
  };

  const fetchSitemaps = async () => {
    const response = await supabase.functions.invoke("search-console", {
      body: {
        action: "sitemaps",
        accessToken,
        siteUrl: selectedSite,
      },
    });
    return response.data;
  };

  // Aggregate metrics
  const totalMetrics = useMemo(() => {
    const totals = dateData.reduce(
      (acc, row) => ({
        clicks: acc.clicks + row.clicks,
        impressions: acc.impressions + row.impressions,
      }),
      { clicks: 0, impressions: 0 }
    );
    
    const avgCtr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
    const avgPosition = dateData.length > 0
      ? dateData.reduce((sum, row) => sum + row.position, 0) / dateData.length
      : 0;
    
    return {
      ...totals,
      ctr: avgCtr,
      position: avgPosition,
    };
  }, [dateData]);

  // Chart data
  const chartData = useMemo(() => {
    return dateData
      .map((row) => ({
        date: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: (row.ctr * 100).toFixed(2),
        position: row.position.toFixed(1),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [dateData]);

  const deviceChartData = useMemo(() => {
    const colors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))"];
    return deviceData.map((row, i) => ({
      name: row.keys[0],
      value: row.clicks,
      color: colors[i % colors.length],
    }));
  }, [deviceData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - show connect screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title="Search Console Analytics | Webstack.ceo"
          description="Connect your Google Search Console to view performance metrics, indexing status, and SEO insights."
        />
        <Navbar />
        
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Search Console Analytics</h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Connect your Google Search Console to view clicks, impressions, rankings, 
                indexing status, and more—all in one beautiful dashboard.
              </p>

              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MousePointer className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Performance Metrics</p>
                        <p className="text-sm text-muted-foreground">Clicks, impressions, CTR, position</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Search className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Query Analysis</p>
                        <p className="text-sm text-muted-foreground">Top search queries driving traffic</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Indexing Status</p>
                        <p className="text-sm text-muted-foreground">Sitemaps and crawl status</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full mt-6"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Connect Google Search Console
                  </Button>
                  
                  <p className="text-xs text-muted-foreground mt-4">
                    We only request read-only access to your Search Console data. 
                    Your credentials are never stored on our servers.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  // Authenticated - show dashboard
  return (
    <div className="min-h-screen bg-background relative">
      <SEO
        title="Search Console Analytics | Webstack.ceo"
        description="View your Google Search Console performance metrics, queries, and indexing status."
      />
      <InteractiveGrid className="fixed inset-0 opacity-30 pointer-events-none z-0" glowRadius={100} glowIntensity={0.3} />
      
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
              </div>
            </a>
            <div>
              <h1 className="text-xl font-bold">Search Console Analytics</h1>
              <p className="text-sm text-muted-foreground">Performance & Indexing</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Back to Site
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl relative z-10">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
          <div className="flex gap-3 items-center">
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.siteUrl} value={site.siteUrl}>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {site.siteUrl.replace('sc-domain:', '').replace('https://', '').replace('http://', '')}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={(v) => setDateRange(v as "7" | "28" | "90")}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="28">Last 28 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={fetchAllData} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                  <p className="text-3xl font-bold">{totalMetrics.clicks.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MousePointer className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Impressions</p>
                  <p className="text-3xl font-bold">{totalMetrics.impressions.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-cyan-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. CTR</p>
                  <p className="text-3xl font-bold">{(totalMetrics.ctr * 100).toFixed(2)}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-violet-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Position</p>
                  <p className="text-3xl font-bold">{totalMetrics.position.toFixed(1)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>Clicks and impressions trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  clicks: { label: "Clicks", color: "hsl(var(--primary))" },
                  impressions: { label: "Impressions", color: "hsl(var(--muted-foreground))" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="hsl(var(--primary))"
                      fill="url(#clicksGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="queries" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="queries">
              <Search className="w-4 h-4 mr-2" />
              Queries
            </TabsTrigger>
            <TabsTrigger value="pages">
              <FileText className="w-4 h-4 mr-2" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="countries">
              <Globe className="w-4 h-4 mr-2" />
              Countries
            </TabsTrigger>
            <TabsTrigger value="indexing">
              <Link2 className="w-4 h-4 mr-2" />
              Indexing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queries">
            <Card>
              <CardHeader>
                <CardTitle>Top Search Queries</CardTitle>
                <CardDescription>Keywords driving traffic to your site</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queryData.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.keys[0]}</TableCell>
                        <TableCell className="text-right">{row.clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{row.impressions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{(row.ctr * 100).toFixed(2)}%</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={row.position <= 10 ? "default" : "secondary"}>
                            {row.position.toFixed(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {queryData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No query data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Best performing pages on your site</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium max-w-xs truncate">
                          <a
                            href={row.keys[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary flex items-center gap-1"
                          >
                            {new URL(row.keys[0]).pathname || "/"}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </TableCell>
                        <TableCell className="text-right">{row.clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{row.impressions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{(row.ctr * 100).toFixed(2)}%</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={row.position <= 10 ? "default" : "secondary"}>
                            {row.position.toFixed(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {pageData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No page data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="countries">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Countries</CardTitle>
                  <CardDescription>Geographic distribution of traffic</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">Impressions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {countryData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{row.keys[0]}</TableCell>
                          <TableCell className="text-right">{row.clicks.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{row.impressions.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {countryData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No country data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Device Breakdown</CardTitle>
                  <CardDescription>Traffic by device type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {deviceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    {deviceChartData.map((device) => (
                      <div key={device.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: device.color }} />
                        <span className="text-sm capitalize">{device.name}: {device.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="indexing">
            <Card>
              <CardHeader>
                <CardTitle>Sitemaps</CardTitle>
                <CardDescription>Submitted sitemaps and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sitemap URL</TableHead>
                      <TableHead>Last Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sitemaps.map((sitemap, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          <a
                            href={sitemap.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary flex items-center gap-1"
                          >
                            {sitemap.path}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </TableCell>
                        <TableCell>
                          {sitemap.lastSubmitted
                            ? new Date(sitemap.lastSubmitted).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {sitemap.isPending ? (
                            <Badge variant="secondary">Pending</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Processed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {(sitemap.errors || 0) + (sitemap.warnings || 0) > 0 ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {(sitemap.errors || 0) + (sitemap.warnings || 0)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {sitemaps.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No sitemaps found. Submit a sitemap in Google Search Console.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

function getDateNDaysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split("T")[0];
}

export default Analytics;
