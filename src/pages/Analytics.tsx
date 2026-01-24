import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, TrendingUp, TrendingDown, MousePointer, Eye, Target,
  BarChart3, Globe, FileText, Link2, AlertTriangle, CheckCircle,
  RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, Loader2,
  LogOut, Settings, ExternalLink, Key, Download, Filter,
  Smartphone, Monitor, Tablet, Image, Video, Newspaper, Sparkles,
  ChevronDown, ChevronUp, ArrowRight, Zap, TrendingUpIcon
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import InteractiveGrid from "@/components/ui/interactive-grid";
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
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  ComposedChart,
} from "recharts";

// Google OAuth Config
const getGoogleClientId = () => localStorage.getItem("gsc_client_id") || import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/webmasters",
].join(" ");

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes.buffer);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

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

type SearchType = 'web' | 'image' | 'video' | 'news' | 'discover';
type DateRangeType = "7" | "28" | "90" | "180" | "365" | "all";

const SEARCH_TYPE_CONFIG: Record<SearchType, { label: string; icon: React.ReactNode; color: string }> = {
  web: { label: "Web Search", icon: <Search className="w-4 h-4" />, color: "hsl(var(--primary))" },
  image: { label: "Image Search", icon: <Image className="w-4 h-4" />, color: "#10b981" },
  video: { label: "Video Search", icon: <Video className="w-4 h-4" />, color: "#ef4444" },
  news: { label: "News", icon: <Newspaper className="w-4 h-4" />, color: "#f59e0b" },
  discover: { label: "Discover", icon: <Sparkles className="w-4 h-4" />, color: "#8b5cf6" },
};

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
  const [dateRange, setDateRange] = useState<DateRangeType>("28");
  const [searchType, setSearchType] = useState<SearchType>("web");
  const [searchFilter, setSearchFilter] = useState("");
  
  // Performance data - all dimensions
  const [queryData, setQueryData] = useState<PerformanceRow[]>([]);
  const [pageData, setPageData] = useState<PerformanceRow[]>([]);
  const [countryData, setCountryData] = useState<PerformanceRow[]>([]);
  const [deviceData, setDeviceData] = useState<PerformanceRow[]>([]);
  const [dateData, setDateData] = useState<PerformanceRow[]>([]);
  const [searchAppearanceData, setSearchAppearanceData] = useState<PerformanceRow[]>([]);
  const [sitemaps, setSitemaps] = useState<SitemapInfo[]>([]);
  
  // Multi-type data for comparison
  const [webData, setWebData] = useState<PerformanceRow[]>([]);
  const [imageData, setImageData] = useState<PerformanceRow[]>([]);
  const [videoData, setVideoData] = useState<PerformanceRow[]>([]);
  const [discoverData, setDiscoverData] = useState<PerformanceRow[]>([]);
  
  const [isFetching, setIsFetching] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  // Client ID configuration
  const [showClientIdDialog, setShowClientIdDialog] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");

  // Check for stored token on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem("gsc_access_token");
    const tokenExpiry = sessionStorage.getItem("gsc_token_expiry");
    
    if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
      setAccessToken(storedToken);
      setIsAuthenticated(true);
    }
    
    // OAuth callback handling
    const url = new URL(window.location.href);
    const oauthError = url.searchParams.get("error");
    const code = url.searchParams.get("code");

    if (oauthError) {
      toast({
        title: "Google connection failed",
        description: oauthError,
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code) {
      const redirectUri = window.location.origin + "/analytics";
      const verifier = sessionStorage.getItem("gsc_code_verifier") || "";

      (async () => {
        try {
          if (!verifier) {
            toast({
              title: "Google connection failed",
              description: "Missing PKCE verifier. Please try connecting again.",
              variant: "destructive",
            });
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }

          const tokenRes = await supabase.functions.invoke("google-oauth-token", {
            body: { code, codeVerifier: verifier, redirectUri },
          });

          if (tokenRes.error) throw new Error(tokenRes.error.message || "Token exchange failed");

          const tokenJson = tokenRes.data;
          if (!tokenJson?.access_token) {
            throw new Error(tokenJson?.error || "Token exchange failed.");
          }

          const expiresIn = Number(tokenJson.expires_in ?? 3600);
          const expiry = Date.now() + expiresIn * 1000;
          sessionStorage.setItem("gsc_access_token", tokenJson.access_token);
          sessionStorage.setItem("gsc_token_expiry", expiry.toString());
          sessionStorage.removeItem("gsc_code_verifier");
          setAccessToken(tokenJson.access_token);
          setIsAuthenticated(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e: unknown) {
          console.error("OAuth token exchange error:", e);
          const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
          toast({ title: "Google connection failed", description: errorMessage, variant: "destructive" });
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      })();
    } else {
      // Legacy fallback (implicit flow)
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
          window.history.replaceState({}, document.title, window.location.pathname);
        }
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
  }, [selectedSite, dateRange, searchType, accessToken]);

  const handleGoogleLogin = async () => {
    const clientId = getGoogleClientId();
    if (!clientId) {
      setShowClientIdDialog(true);
      return;
    }

    const redirectUri = window.location.origin + "/analytics";
    const verifier = generateCodeVerifier();
    sessionStorage.setItem("gsc_code_verifier", verifier);
    const challenge = await generateCodeChallenge(verifier);

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", GOOGLE_SCOPES);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("include_granted_scopes", "true");
    authUrl.searchParams.set("access_type", "online");

    window.location.href = authUrl.toString();
  };

  const handleSaveClientId = () => {
    if (!clientIdInput.trim()) {
      toast({ title: "Client ID Required", description: "Please enter your Google OAuth Client ID.", variant: "destructive" });
      return;
    }
    
    localStorage.setItem("gsc_client_id", clientIdInput.trim());
    setShowClientIdDialog(false);
    toast({ title: "Client ID Saved", description: "Now connecting to Google Search Console..." });
    setTimeout(() => { void handleGoogleLogin(); }, 500);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("gsc_access_token");
    sessionStorage.removeItem("gsc_token_expiry");
    setAccessToken(null);
    setIsAuthenticated(false);
    setSites([]);
    setSelectedSite("");
    resetData();
  };

  const resetData = () => {
    setQueryData([]);
    setPageData([]);
    setCountryData([]);
    setDeviceData([]);
    setDateData([]);
    setSearchAppearanceData([]);
    setSitemaps([]);
    setWebData([]);
    setImageData([]);
    setVideoData([]);
    setDiscoverData([]);
  };

  const handleClearClientId = () => {
    localStorage.removeItem("gsc_client_id");
    setClientIdInput("");
    toast({ title: "Credentials Cleared", description: "You can now enter a new Google OAuth Client ID." });
    setShowClientIdDialog(true);
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
      toast({ title: "Error", description: "Failed to fetch your sites. Please try again.", variant: "destructive" });
    }
  };

  const getDaysFromRange = (range: string): number => {
    if (range === "all") return 480;
    return parseInt(range);
  };

  const fetchPerformance = useCallback(async (
    dimensions: string[], 
    rowLimit: number, 
    type: SearchType = 'web',
    startRow: number = 0
  ) => {
    const days = getDaysFromRange(dateRange);
    const response = await supabase.functions.invoke("search-console", {
      body: {
        action: "performance",
        accessToken,
        siteUrl: selectedSite,
        startDate: getDateNDaysAgo(days),
        endDate: getDateNDaysAgo(0),
        dimensions,
        rowLimit,
        startRow,
        searchType: type,
      },
    });
    return response.data;
  }, [accessToken, selectedSite, dateRange]);

  const fetchSitemaps = async () => {
    const response = await supabase.functions.invoke("search-console", {
      body: { action: "sitemaps", accessToken, siteUrl: selectedSite },
    });
    return response.data;
  };

  const fetchAllData = async () => {
    if (!selectedSite || !accessToken) return;
    
    setIsFetching(true);
    const days = getDaysFromRange(dateRange);
    
    try {
      // Fetch all data for current search type with increased limits
      const [queries, pages, countries, devices, dates, searchAppearance, sitemapsRes] = await Promise.all([
        fetchPerformance(["query"], 100, searchType),
        fetchPerformance(["page"], 100, searchType),
        fetchPerformance(["country"], 50, searchType),
        fetchPerformance(["device"], 5, searchType),
        fetchPerformance(["date"], days, searchType),
        fetchPerformance(["searchAppearance"], 25, searchType),
        fetchSitemaps(),
      ]);

      setQueryData(queries?.rows || []);
      setPageData(pages?.rows || []);
      setCountryData(countries?.rows || []);
      setDeviceData(devices?.rows || []);
      setDateData(dates?.rows || []);
      setSearchAppearanceData(searchAppearance?.rows || []);
      setSitemaps(sitemapsRes?.sitemap || []);

      // Fetch comparison data for overview (web, image, discover)
      if (searchType === 'web') {
        const [webDates, imageDates, discoverDates] = await Promise.all([
          fetchPerformance(["date"], Math.min(days, 28), 'web'),
          fetchPerformance(["date"], Math.min(days, 28), 'image').catch(() => ({ rows: [] })),
          fetchPerformance(["date"], Math.min(days, 28), 'discover').catch(() => ({ rows: [] })),
        ]);
        setWebData(webDates?.rows || []);
        setImageData(imageDates?.rows || []);
        setDiscoverData(discoverDates?.rows || []);
      }
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "Some data failed to load. Please try again.", variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
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
    
    return { ...totals, ctr: avgCtr, position: avgPosition };
  }, [dateData]);

  // Calculate week-over-week changes
  const weeklyChange = useMemo(() => {
    if (dateData.length < 14) return { clicks: 0, impressions: 0 };
    
    const sortedData = [...dateData].sort((a, b) => a.keys[0].localeCompare(b.keys[0]));
    const lastWeek = sortedData.slice(-7);
    const prevWeek = sortedData.slice(-14, -7);
    
    const lastWeekClicks = lastWeek.reduce((sum, row) => sum + row.clicks, 0);
    const prevWeekClicks = prevWeek.reduce((sum, row) => sum + row.clicks, 0);
    const lastWeekImpressions = lastWeek.reduce((sum, row) => sum + row.impressions, 0);
    const prevWeekImpressions = prevWeek.reduce((sum, row) => sum + row.impressions, 0);
    
    return {
      clicks: prevWeekClicks > 0 ? ((lastWeekClicks - prevWeekClicks) / prevWeekClicks) * 100 : 0,
      impressions: prevWeekImpressions > 0 ? ((lastWeekImpressions - prevWeekImpressions) / prevWeekImpressions) * 100 : 0,
    };
  }, [dateData]);

  // Chart data
  const chartData = useMemo(() => {
    return dateData
      .map((row) => ({
        date: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: (row.ctr * 100),
        position: row.position,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [dateData]);

  const deviceChartData = useMemo(() => {
    const colors: Record<string, string> = {
      DESKTOP: "hsl(var(--primary))",
      MOBILE: "#10b981",
      TABLET: "#f59e0b",
    };
    return deviceData.map((row) => ({
      name: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      color: colors[row.keys[0]] || "hsl(var(--secondary))",
    }));
  }, [deviceData]);

  // Comparison chart for multi-type overview
  const comparisonChartData = useMemo(() => {
    const webMap = new Map(webData.map(r => [r.keys[0], r.clicks]));
    const imageMap = new Map(imageData.map(r => [r.keys[0], r.clicks]));
    const discoverMap = new Map(discoverData.map(r => [r.keys[0], r.clicks]));
    
    const allDates = [...new Set([...webData, ...imageData, ...discoverData].map(r => r.keys[0]))].sort();
    
    return allDates.map(date => ({
      date,
      web: webMap.get(date) || 0,
      image: imageMap.get(date) || 0,
      discover: discoverMap.get(date) || 0,
    }));
  }, [webData, imageData, discoverData]);

  // Filter data based on search
  const filteredQueryData = useMemo(() => {
    if (!searchFilter) return queryData;
    return queryData.filter(row => row.keys[0].toLowerCase().includes(searchFilter.toLowerCase()));
  }, [queryData, searchFilter]);

  const filteredPageData = useMemo(() => {
    if (!searchFilter) return pageData;
    return pageData.filter(row => row.keys[0].toLowerCase().includes(searchFilter.toLowerCase()));
  }, [pageData, searchFilter]);

  // Export to CSV
  const exportToCSV = (data: PerformanceRow[], filename: string, dimension: string) => {
    const headers = [dimension, "Clicks", "Impressions", "CTR", "Position"];
    const rows = data.map(row => [
      row.keys[0],
      row.clicks.toString(),
      row.impressions.toString(),
      (row.ctr * 100).toFixed(2) + "%",
      row.position.toFixed(1),
    ]);
    
    const csv = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${selectedSite.replace(/[^a-z0-9]/gi, "-")}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

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
                    {[
                      { icon: MousePointer, title: "Performance Metrics", desc: "Clicks, impressions, CTR, position" },
                      { icon: Search, title: "Query Analysis", desc: "Top search queries driving traffic" },
                      { icon: Image, title: "Multi-Source Data", desc: "Web, Image, Video, Discover & News" },
                      { icon: FileText, title: "Indexing Status", desc: "Sitemaps and crawl status" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button size="lg" className="w-full mt-6" onClick={handleGoogleLogin}>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Connect Google Search Console
                  </Button>
                  
                  {localStorage.getItem("gsc_client_id") && (
                    <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground" onClick={handleClearClientId}>
                      <Settings className="w-4 h-4 mr-2" />
                      Reconfigure OAuth Client ID
                    </Button>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-4">
                    We only request read-only access to your Search Console data. 
                    Your credentials are never stored on our servers.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>

        <Dialog open={showClientIdDialog} onOpenChange={setShowClientIdDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                Configure Google OAuth
              </DialogTitle>
              <DialogDescription>
                To connect Google Search Console, you need to set up a Google Cloud OAuth Client ID.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Google OAuth Client ID</Label>
                <Input
                  id="clientId"
                  placeholder="123456789-abcdefg.apps.googleusercontent.com"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                />
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium">Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a></li>
                  <li>Create a new OAuth 2.0 Client ID (Web application)</li>
                  <li>Add <code className="bg-background px-1 rounded">{window.location.origin}</code> to Authorized JavaScript origins</li>
                  <li>Add <code className="bg-background px-1 rounded">{window.location.origin}/analytics</code> to Authorized redirect URIs</li>
                  <li>Enable the Search Console API in your project</li>
                  <li>Copy the Client ID and paste it above</li>
                </ol>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClientIdDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveClientId}>Save & Connect</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
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
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
              </div>
            </a>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold">Search Console Analytics</h1>
              <p className="text-sm text-muted-foreground">Performance & Indexing</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="hidden sm:flex">
              <ExternalLink className="w-4 h-4 mr-2" />
              Back to Site
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Disconnect</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl relative z-10">
        {/* Controls Bar */}
        <div className="flex flex-wrap gap-3 mb-6 items-center justify-between bg-card/50 backdrop-blur rounded-xl p-4 border border-border">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Site Selector */}
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-[200px] sm:w-[280px]">
                <Globe className="w-4 h-4 mr-2 shrink-0" />
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.siteUrl} value={site.siteUrl}>
                    {site.siteUrl.replace('sc-domain:', '').replace('https://', '').replace('http://', '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeType)}>
              <SelectTrigger className="w-[150px] sm:w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="28">Last 28 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last 12 months</SelectItem>
                <SelectItem value="all">All available</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Type */}
            <Select value={searchType} onValueChange={(v) => setSearchType(v as SearchType)}>
              <SelectTrigger className="w-[150px] sm:w-[160px]">
                {SEARCH_TYPE_CONFIG[searchType].icon}
                <span className="ml-2">{SEARCH_TYPE_CONFIG[searchType].label}</span>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEARCH_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {config.icon}
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={fetchAllData} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { 
              label: "Total Clicks", 
              value: formatNumber(totalMetrics.clicks),
              change: weeklyChange.clicks,
              icon: MousePointer,
              color: "primary"
            },
            { 
              label: "Impressions", 
              value: formatNumber(totalMetrics.impressions),
              change: weeklyChange.impressions,
              icon: Eye,
              color: "cyan-500"
            },
            { 
              label: "Avg. CTR", 
              value: (totalMetrics.ctr * 100).toFixed(2) + "%",
              icon: Target,
              color: "violet-500"
            },
            { 
              label: "Avg. Position", 
              value: totalMetrics.position.toFixed(1),
              icon: TrendingUp,
              color: "amber-500"
            },
          ].map((metric, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold">{metric.value}</p>
                    {metric.change !== undefined && metric.change !== 0 && (
                      <div className={`flex items-center gap-1 mt-1 text-sm ${metric.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {metric.change > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(metric.change).toFixed(1)}% vs last week
                      </div>
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-${metric.color}/10 flex items-center justify-center`}>
                    <metric.icon className={`w-6 h-6 text-${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Chart */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>Clicks and impressions trend for {SEARCH_TYPE_CONFIG[searchType].label}</CardDescription>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span>Clicks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span>Impressions</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    interval="preserveStartEnd"
                    minTickGap={50}
                  />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    width={50}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="impressions"
                    stroke="#06b6d4"
                    fill="url(#impressionsGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="clicks"
                    stroke="hsl(var(--primary))"
                    fill="url(#clicksGradient)"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Search Type Comparison (only for web) */}
        {searchType === 'web' && comparisonChartData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Traffic Sources Comparison</CardTitle>
              <CardDescription>Compare clicks across Web, Image, and Discover</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={comparisonChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={40} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Area type="monotone" dataKey="web" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="image" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="discover" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {[
                  { label: "Web", color: "hsl(var(--primary))" },
                  { label: "Image", color: "#10b981" },
                  { label: "Discover", color: "#8b5cf6" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="queries" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="queries" className="gap-2">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Queries</span>
              </TabsTrigger>
              <TabsTrigger value="pages" className="gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Pages</span>
              </TabsTrigger>
              <TabsTrigger value="countries" className="gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Countries</span>
              </TabsTrigger>
              <TabsTrigger value="devices" className="gap-2">
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">Devices</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="indexing" className="gap-2">
                <Link2 className="w-4 h-4" />
                <span className="hidden sm:inline">Indexing</span>
              </TabsTrigger>
            </TabsList>

            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filter results..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
          </div>

          {/* Queries Tab */}
          <TabsContent value="queries">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top Search Queries</CardTitle>
                  <CardDescription>Keywords driving traffic to your site ({filteredQueryData.length} queries)</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredQueryData, "queries", "Query")}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50%]">Query</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Impressions</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead className="text-right">Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQueryData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{row.keys[0]}</TableCell>
                          <TableCell className="text-right font-semibold">{row.clicks.toLocaleString()}</TableCell>
                          <TableCell className="text-right hidden sm:table-cell">{row.impressions.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{(row.ctr * 100).toFixed(2)}%</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={row.position <= 3 ? "default" : row.position <= 10 ? "secondary" : "outline"}>
                              {row.position.toFixed(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredQueryData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {isFetching ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "No query data available"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pages Tab */}
          <TabsContent value="pages">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top Pages</CardTitle>
                  <CardDescription>Best performing pages on your site ({filteredPageData.length} pages)</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredPageData, "pages", "Page")}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50%]">Page</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Impressions</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead className="text-right">Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPageData.map((row, i) => {
                        let pagePath = row.keys[0];
                        try {
                          pagePath = new URL(row.keys[0]).pathname || "/";
                        } catch {
                          pagePath = row.keys[0];
                        }
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">
                              <a
                                href={row.keys[0]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary flex items-center gap-1 truncate max-w-[300px]"
                                title={row.keys[0]}
                              >
                                {pagePath}
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{row.clicks.toLocaleString()}</TableCell>
                            <TableCell className="text-right hidden sm:table-cell">{row.impressions.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{(row.ctr * 100).toFixed(2)}%</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={row.position <= 3 ? "default" : row.position <= 10 ? "secondary" : "outline"}>
                                {row.position.toFixed(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredPageData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {isFetching ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "No page data available"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Countries Tab */}
          <TabsContent value="countries">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top Countries</CardTitle>
                  <CardDescription>Geographic distribution of traffic</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportToCSV(countryData, "countries", "Country")}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-6">
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Country</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead className="text-right">Impressions</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {countryData.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{row.keys[0]}</TableCell>
                            <TableCell className="text-right font-semibold">{row.clicks.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{row.impressions.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{(row.ctr * 100).toFixed(2)}%</TableCell>
                          </TableRow>
                        ))}
                        {countryData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              No country data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  
                  {/* Country Distribution Chart */}
                  <div className="h-[400px] flex flex-col">
                    <h3 className="font-medium mb-4">Click Distribution</h3>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={countryData.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                          <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          <YAxis dataKey="keys[0]" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={55} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                          />
                          <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Device Breakdown</CardTitle>
                  <CardDescription>Traffic by device type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="clicks"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {deviceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Device Metrics</CardTitle>
                  <CardDescription>Detailed performance by device</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {deviceData.map((device, i) => {
                      const icon = device.keys[0] === 'DESKTOP' ? Monitor : device.keys[0] === 'MOBILE' ? Smartphone : Tablet;
                      const Icon = icon;
                      const totalClicks = deviceData.reduce((sum, d) => sum + d.clicks, 0);
                      const percentage = totalClicks > 0 ? (device.clicks / totalClicks) * 100 : 0;
                      
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="w-5 h-5 text-muted-foreground" />
                              <span className="font-medium capitalize">{device.keys[0].toLowerCase()}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{device.clicks.toLocaleString()} clicks</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{device.impressions.toLocaleString()} impressions</span>
                            <span>CTR: {(device.ctr * 100).toFixed(2)}%</span>
                            <span>Pos: {device.position.toFixed(1)}</span>
                          </div>
                        </div>
                      );
                    })}
                    {deviceData.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No device data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Search Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Search Appearance</CardTitle>
                <CardDescription>How your content appears in search results (rich results, AMP, etc.)</CardDescription>
              </CardHeader>
              <CardContent>
                {searchAppearanceData.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchAppearanceData.map((item, i) => (
                      <Card key={i} className="bg-muted/30">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">{item.keys[0].replace(/_/g, ' ')}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-2xl font-bold">{item.clicks.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">Clicks</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{item.impressions.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">Impressions</p>
                            </div>
                          </div>
                          <div className="flex justify-between mt-3 text-sm text-muted-foreground">
                            <span>CTR: {(item.ctr * 100).toFixed(2)}%</span>
                            <span>Pos: {item.position.toFixed(1)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No search appearance data available</p>
                    <p className="text-sm mt-1">This shows special search result types like rich results, AMP, etc.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Indexing Tab */}
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
                      <TableHead>Type</TableHead>
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
                            {sitemap.path.length > 50 ? sitemap.path.substring(0, 50) + '...' : sitemap.path}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </TableCell>
                        <TableCell>
                          {sitemap.lastSubmitted ? new Date(sitemap.lastSubmitted).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {sitemap.isSitemapsIndex ? "Index" : "Sitemap"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sitemap.isPending ? (
                            <Badge variant="secondary">Pending</Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
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
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
