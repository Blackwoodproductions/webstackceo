import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search, TrendingUp, MousePointer, Eye, Target,
  BarChart3, Globe, FileText, Link2, AlertTriangle, CheckCircle,
  RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, Loader2,
  ExternalLink, Key, Download, Smartphone, Monitor, Tablet,
  Image, Video, Newspaper, Sparkles, Code, Copy, Check, ChevronDown, ChevronUp
} from "lucide-react";
import { GSCAdvancedReporting } from "./GSCAdvancedReporting";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  warnings?: number;
  errors?: number;
}

type SearchType = 'web' | 'image' | 'video' | 'news' | 'discover';
type DateRangeType = "7" | "28" | "90" | "180" | "365";

interface GSCDashboardPanelProps {
  onSiteChange?: (site: string) => void;
  onDataLoaded?: (data: { clicks: number; impressions: number; position: number }) => void;
  onTrackingStatus?: (hasTracking: boolean, domain: string) => void;
}

const SEARCH_TYPE_CONFIG: Record<SearchType, { label: string; icon: React.ReactNode; color: string }> = {
  web: { label: "Web", icon: <Search className="w-4 h-4" />, color: "hsl(var(--primary))" },
  image: { label: "Image", icon: <Image className="w-4 h-4" />, color: "#10b981" },
  video: { label: "Video", icon: <Video className="w-4 h-4" />, color: "#ef4444" },
  news: { label: "News", icon: <Newspaper className="w-4 h-4" />, color: "#f59e0b" },
  discover: { label: "Discover", icon: <Sparkles className="w-4 h-4" />, color: "#8b5cf6" },
};

export const GSCDashboardPanel = ({ onSiteChange, onDataLoaded, onTrackingStatus }: GSCDashboardPanelProps) => {
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
  
  // Performance data
  const [queryData, setQueryData] = useState<PerformanceRow[]>([]);
  const [pageData, setPageData] = useState<PerformanceRow[]>([]);
  const [countryData, setCountryData] = useState<PerformanceRow[]>([]);
  const [deviceData, setDeviceData] = useState<PerformanceRow[]>([]);
  const [dateData, setDateData] = useState<PerformanceRow[]>([]);
  const [sitemaps, setSitemaps] = useState<SitemapInfo[]>([]);
  
  // Multi-type aggregated data
  const [allTypesData, setAllTypesData] = useState<Record<SearchType, { clicks: number; impressions: number; position: number }>>({
    web: { clicks: 0, impressions: 0, position: 0 },
    image: { clicks: 0, impressions: 0, position: 0 },
    video: { clicks: 0, impressions: 0, position: 0 },
    news: { clicks: 0, impressions: 0, position: 0 },
    discover: { clicks: 0, impressions: 0, position: 0 },
  });
  const [isLoadingAllTypes, setIsLoadingAllTypes] = useState(false);
  
  const [isFetching, setIsFetching] = useState(false);
  
  // Tracking status per domain
  const [domainTrackingStatus, setDomainTrackingStatus] = useState<Map<string, boolean>>(new Map());
  
  // Cache
  const dataCache = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  const fetchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Client ID configuration
  const [showClientIdDialog, setShowClientIdDialog] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");
  
  // Tracking code generator
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  
  // Advanced reporting toggle
  const [showAdvancedReporting, setShowAdvancedReporting] = useState(false);
  
  // Data dropdown states
  const [activeDropdown, setActiveDropdown] = useState<'queries' | 'pages' | 'countries' | 'devices' | null>(null);

  // Check for stored token on mount and handle OAuth callback
  useEffect(() => {
    const storedToken = sessionStorage.getItem("gsc_access_token");
    const tokenExpiry = sessionStorage.getItem("gsc_token_expiry");
    
    // Check for valid stored token first
    if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
      console.log("[GSC] Found valid stored token, expiry:", new Date(parseInt(tokenExpiry)));
      setAccessToken(storedToken);
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }
    
    // OAuth callback handling
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    
    console.log("[GSC] OAuth callback check:", { 
      hasCode: !!code, 
      hasError: !!error,
      pathname: window.location.pathname,
      hasVerifier: !!sessionStorage.getItem("gsc_code_verifier")
    });

    // Handle OAuth error response
    if (error) {
      console.error("[GSC] OAuth error:", error, errorDescription);
      toast({
        title: "Google Authentication Error",
        description: errorDescription || error || "Failed to authenticate with Google",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsLoading(false);
      return;
    }

    // Process OAuth code if present
    if (code) {
      const verifier = sessionStorage.getItem("gsc_code_verifier");
      const redirectUri = window.location.origin + window.location.pathname;
      
      console.log("[GSC] Processing OAuth code:", { 
        redirectUri, 
        hasVerifier: !!verifier,
        verifierLength: verifier?.length 
      });

      if (!verifier) {
        console.error("[GSC] No code verifier found - session may have expired or page was reloaded");
        toast({
          title: "Authentication Session Expired",
          description: "Please try connecting to Google Search Console again.",
          variant: "destructive",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      (async () => {
        try {
          console.log("[GSC] Exchanging OAuth code for token...");
          
          const tokenRes = await supabase.functions.invoke("google-oauth-token", {
            body: { code, codeVerifier: verifier, redirectUri },
          });

          console.log("[GSC] Token exchange response:", { 
            hasError: !!tokenRes.error, 
            hasData: !!tokenRes.data,
            dataKeys: tokenRes.data ? Object.keys(tokenRes.data) : []
          });

          if (tokenRes.error) {
            throw new Error(tokenRes.error.message || "Token exchange failed");
          }

          const tokenJson = tokenRes.data;
          
          if (tokenJson?.error) {
            throw new Error(tokenJson.error_description || tokenJson.error || "Token exchange failed");
          }
          
          if (tokenJson?.access_token) {
            const expiresIn = Number(tokenJson.expires_in ?? 3600);
            const expiry = Date.now() + expiresIn * 1000;
            
            console.log("[GSC] Token received, storing...", { expiresIn, expiry: new Date(expiry) });
            
            sessionStorage.setItem("gsc_access_token", tokenJson.access_token);
            sessionStorage.setItem("gsc_token_expiry", expiry.toString());
            sessionStorage.removeItem("gsc_code_verifier");
            
            setAccessToken(tokenJson.access_token);
            setIsAuthenticated(true);
            
            toast({
              title: "Connected to Google Search Console",
              description: "Successfully authenticated with Google",
            });
            
            // Clean URL after successful auth
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            throw new Error("No access token received from Google");
          }
        } catch (e) {
          console.error("[GSC] OAuth token exchange error:", e);
          toast({
            title: "Authentication Failed",
            description: e instanceof Error ? e.message : "Failed to complete Google authentication",
            variant: "destructive",
          });
          sessionStorage.removeItem("gsc_code_verifier");
          window.history.replaceState({}, document.title, window.location.pathname);
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch sites when authenticated
  useEffect(() => {
    if (accessToken) {
      fetchSites();
    }
  }, [accessToken]);

  // Notify parent of site change and check tracking status
  useEffect(() => {
    if (selectedSite) {
      onSiteChange?.(selectedSite);
      
      // Check if this domain has tracking code installed
      checkTrackingStatus(selectedSite);
    }
  }, [selectedSite, onSiteChange]);

  // Check if domain has tracking code installed (by checking for visitor sessions from that domain)
  const checkTrackingStatus = async (siteUrl: string) => {
    const cleanDomain = siteUrl.replace('sc-domain:', '').replace('https://', '').replace('http://', '').replace(/\/$/, '');
    
    // Check cache first
    if (domainTrackingStatus.has(cleanDomain)) {
      const hasTracking = domainTrackingStatus.get(cleanDomain) || false;
      onTrackingStatus?.(hasTracking, cleanDomain);
      return;
    }
    
    try {
      // Check if we have any visitor sessions with referrer or first_page containing this domain
      const { count, error } = await supabase
        .from('visitor_sessions')
        .select('id', { count: 'exact', head: true })
        .or(`referrer.ilike.%${cleanDomain}%,first_page.ilike.%${cleanDomain}%`)
        .limit(1);
      
      if (error) {
        console.error('Error checking tracking status:', error);
        // Default to false if we can't check
        setDomainTrackingStatus(prev => new Map(prev).set(cleanDomain, false));
        onTrackingStatus?.(false, cleanDomain);
        return;
      }
      
      const hasTracking = (count || 0) > 0;
      setDomainTrackingStatus(prev => new Map(prev).set(cleanDomain, hasTracking));
      onTrackingStatus?.(hasTracking, cleanDomain);
    } catch (err) {
      console.error('Error checking tracking status:', err);
      setDomainTrackingStatus(prev => new Map(prev).set(cleanDomain, false));
      onTrackingStatus?.(false, cleanDomain);
    }
  };

  // Fetch data when site selected - with debouncing
  useEffect(() => {
    if (!selectedSite || !accessToken) return;
    
    if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
    
    fetchDebounceRef.current = setTimeout(() => {
      fetchAllData();
    }, 150);
    
    return () => {
      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
    };
  }, [selectedSite, dateRange, searchType, accessToken]);

  // Notify parent of data loaded
  useEffect(() => {
    if (dateData.length > 0 && onDataLoaded) {
      const totals = dateData.reduce(
        (acc, row) => ({ clicks: acc.clicks + row.clicks, impressions: acc.impressions + row.impressions }),
        { clicks: 0, impressions: 0 }
      );
      const avgPosition = dateData.reduce((sum, row) => sum + row.position, 0) / dateData.length;
      onDataLoaded({ ...totals, position: avgPosition });
    }
  }, [dateData, onDataLoaded]);

  const handleGoogleLogin = async () => {
    const clientId = getGoogleClientId();
    console.log("[GSC] Attempting login, client ID present:", !!clientId, "ID prefix:", clientId?.substring(0, 20));
    
    if (!clientId) {
      console.log("[GSC] No client ID found, showing dialog");
      setShowClientIdDialog(true);
      return;
    }

    try {
      const redirectUri = window.location.origin + window.location.pathname;
      console.log("[GSC] Redirect URI:", redirectUri);
      
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
      authUrl.searchParams.set("access_type", "online");

      console.log("[GSC] Redirecting to Google OAuth...");
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error("[GSC] Error initiating OAuth:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to start Google authentication. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveClientId = () => {
    if (!clientIdInput.trim()) {
      toast({ title: "Client ID Required", variant: "destructive" });
      return;
    }
    localStorage.setItem("gsc_client_id", clientIdInput.trim());
    setShowClientIdDialog(false);
    setTimeout(() => { void handleGoogleLogin(); }, 500);
  };

  const handleDisconnect = () => {
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
      const siteEntries = response.data?.siteEntry || [];
      setSites(siteEntries);
      if (siteEntries.length > 0 && !selectedSite) {
        setSelectedSite(siteEntries[0].siteUrl);
      }
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  const getDaysFromRange = (range: string): number => parseInt(range);

  const fetchPerformance = useCallback(async (dimensions: string[], rowLimit: number, type: SearchType = 'web') => {
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

  // Fetch aggregated data for all search types
  const fetchAllTypesData = async () => {
    if (!selectedSite || !accessToken) return;
    
    setIsLoadingAllTypes(true);
    const days = getDaysFromRange(dateRange);
    const searchTypes: SearchType[] = ['web', 'image', 'video', 'news', 'discover'];
    
    try {
      const results = await Promise.all(
        searchTypes.map(async (type) => {
          try {
            const response = await supabase.functions.invoke("search-console", {
              body: {
                action: "performance",
                accessToken,
                siteUrl: selectedSite,
                startDate: getDateNDaysAgo(days),
                endDate: getDateNDaysAgo(0),
                dimensions: ["date"],
                rowLimit: days,
                searchType: type,
              },
            });
            
            const rows = response.data?.rows || [];
            const totals = rows.reduce(
              (acc: { clicks: number; impressions: number; position: number; count: number }, row: PerformanceRow) => ({
                clicks: acc.clicks + row.clicks,
                impressions: acc.impressions + row.impressions,
                position: acc.position + row.position,
                count: acc.count + 1,
              }),
              { clicks: 0, impressions: 0, position: 0, count: 0 }
            );
            
            return {
              type,
              clicks: totals.clicks,
              impressions: totals.impressions,
              position: totals.count > 0 ? totals.position / totals.count : 0,
            };
          } catch (err) {
            console.log(`No data for ${type} search type`);
            return { type, clicks: 0, impressions: 0, position: 0 };
          }
        })
      );
      
      const newAllTypesData = results.reduce((acc, result) => ({
        ...acc,
        [result.type]: { clicks: result.clicks, impressions: result.impressions, position: result.position },
      }), {} as Record<SearchType, { clicks: number; impressions: number; position: number }>);
      
      setAllTypesData(newAllTypesData);
    } catch (error) {
      console.error("Error fetching all types data:", error);
    } finally {
      setIsLoadingAllTypes(false);
    }
  };

  const fetchAllData = async (forceRefresh = false) => {
    if (!selectedSite || !accessToken) return;
    
    const cacheKey = `${selectedSite}-${dateRange}-${searchType}`;
    const cached = dataCache.current.get(cacheKey);
    const CACHE_TTL = 5 * 60 * 1000;
    
    if (!forceRefresh && cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      setQueryData(cached.data.queryData);
      setPageData(cached.data.pageData);
      setCountryData(cached.data.countryData);
      setDeviceData(cached.data.deviceData);
      setDateData(cached.data.dateData);
      setSitemaps(cached.data.sitemaps);
      return;
    }
    
    setIsFetching(true);
    const days = getDaysFromRange(dateRange);
    
    try {
      // Fetch current search type data and all types summary in parallel
      const [dates, devices] = await Promise.all([
        fetchPerformance(["date"], days, searchType),
        fetchPerformance(["device"], 5, searchType),
      ]);
      
      setDateData(dates?.rows || []);
      setDeviceData(devices?.rows || []);
      
      const [queries, pages, countries, sitemapsRes] = await Promise.all([
        fetchPerformance(["query"], 50, searchType),
        fetchPerformance(["page"], 50, searchType),
        fetchPerformance(["country"], 25, searchType),
        fetchSitemaps(),
      ]);

      setQueryData(queries?.rows || []);
      setPageData(pages?.rows || []);
      setCountryData(countries?.rows || []);
      setSitemaps(sitemapsRes?.sitemap || []);
      
      dataCache.current.set(cacheKey, {
        data: {
          queryData: queries?.rows || [],
          pageData: pages?.rows || [],
          countryData: countries?.rows || [],
          deviceData: devices?.rows || [],
          dateData: dates?.rows || [],
          sitemaps: sitemapsRes?.sitemap || [],
        },
        timestamp: Date.now(),
      });
      
      // Also fetch all types data in background
      fetchAllTypesData();
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsFetching(false);
    }
  };

  // Aggregate metrics for current search type
  const totalMetrics = useMemo(() => {
    const totals = dateData.reduce(
      (acc, row) => ({ clicks: acc.clicks + row.clicks, impressions: acc.impressions + row.impressions }),
      { clicks: 0, impressions: 0 }
    );
    const avgCtr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
    const avgPosition = dateData.length > 0 ? dateData.reduce((sum, row) => sum + row.position, 0) / dateData.length : 0;
    return { ...totals, ctr: avgCtr, position: avgPosition };
  }, [dateData]);

  // Combined metrics across all search types
  const combinedMetrics = useMemo(() => {
    const types = Object.values(allTypesData);
    const totalClicks = types.reduce((sum, t) => sum + t.clicks, 0);
    const totalImpressions = types.reduce((sum, t) => sum + t.impressions, 0);
    const avgPosition = types.filter(t => t.position > 0).reduce((sum, t, _, arr) => sum + t.position / arr.length, 0);
    const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    return { clicks: totalClicks, impressions: totalImpressions, ctr: avgCtr, position: avgPosition };
  }, [allTypesData]);

  // Search types with data for the breakdown display
  const searchTypeBreakdown = useMemo(() => {
    return (Object.entries(allTypesData) as [SearchType, { clicks: number; impressions: number; position: number }][])
      .filter(([_, data]) => data.clicks > 0 || data.impressions > 0)
      .sort((a, b) => b[1].clicks - a[1].clicks);
  }, [allTypesData]);

  // Chart data
  const chartData = useMemo(() => {
    return dateData
      .map((row) => ({ date: row.keys[0], clicks: row.clicks, impressions: row.impressions }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [dateData]);

  const deviceChartData = useMemo(() => {
    const colors: Record<string, string> = { DESKTOP: "hsl(var(--primary))", MOBILE: "#10b981", TABLET: "#f59e0b" };
    return deviceData.map((row) => ({ name: row.keys[0], clicks: row.clicks, color: colors[row.keys[0]] || "hsl(var(--secondary))" }));
  }, [deviceData]);

  const filteredQueryData = useMemo(() => {
    if (!searchFilter) return queryData.slice(0, 25);
    return queryData.filter(row => row.keys[0].toLowerCase().includes(searchFilter.toLowerCase())).slice(0, 25);
  }, [queryData, searchFilter]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  // Tracking code
  const trackingCode = useMemo(() => {
    const cleanDomain = selectedSite?.replace('sc-domain:', '').replace('https://', '').replace('http://', '') || 'your-domain.com';
    return `<!-- Webstack.ceo Visitor Intelligence -->
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://webstack.ceo/track.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','wscLayer','${cleanDomain}');
</script>
<!-- End Webstack.ceo Visitor Intelligence -->`;
  }, [selectedSite]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(trackingCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Not connected - show connect prompt
  if (!isAuthenticated) {
    return (
      <>
        <Card className="bg-gradient-to-br from-cyan-500/5 to-violet-500/5 border-cyan-500/20">
          <CardContent className="py-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Connect Google Search Console</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Link your Search Console to see clicks, impressions, rankings, and sync with your visitor data.
              </p>
              <Button onClick={handleGoogleLogin} className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Connect Search Console
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showClientIdDialog} onOpenChange={setShowClientIdDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                Configure Google OAuth
              </DialogTitle>
              <DialogDescription>Enter your Google Cloud OAuth Client ID.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Google OAuth Client ID</Label>
                <Input placeholder="123456789-abc.apps.googleusercontent.com" value={clientIdInput} onChange={(e) => setClientIdInput(e.target.value)} />
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Setup:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                  <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-primary hover:underline">Google Cloud Console</a></li>
                  <li>Create OAuth 2.0 Client ID</li>
                  <li>Add redirect URI: <code className="bg-background px-1 rounded">{window.location.origin}/visitor-intelligence-dashboard</code></li>
                  <li>Enable Search Console API</li>
                </ol>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClientIdDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveClientId}>Save & Connect</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Connected - show dashboard
  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Search Console Analytics</CardTitle>
                <CardDescription className="text-xs">Performance data from Google</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCodeGenerator(true)}>
                <Code className="w-4 h-4 mr-1" />
                Get Code
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDisconnect}>Disconnect</Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-2 items-center justify-between bg-secondary/30 rounded-lg p-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger className="w-[220px] h-8 text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {sites.map((site) => (
                    <SelectItem key={site.siteUrl} value={site.siteUrl} className="text-xs">
                      {site.siteUrl.replace('sc-domain:', '').replace('https://', '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeType)}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="28">28 days</SelectItem>
                  <SelectItem value="90">3 months</SelectItem>
                  <SelectItem value="180">6 months</SelectItem>
                  <SelectItem value="365">12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              {/* Data Dropdown Buttons */}
              <Button 
                variant={activeDropdown === 'queries' ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setActiveDropdown(activeDropdown === 'queries' ? null : 'queries')}
                className="h-8 text-xs"
              >
                <Search className="w-3 h-3 mr-1" />
                Queries
                {activeDropdown === 'queries' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </Button>
              <Button 
                variant={activeDropdown === 'pages' ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setActiveDropdown(activeDropdown === 'pages' ? null : 'pages')}
                className="h-8 text-xs"
              >
                <FileText className="w-3 h-3 mr-1" />
                Pages
                {activeDropdown === 'pages' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </Button>
              <Button 
                variant={activeDropdown === 'countries' ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setActiveDropdown(activeDropdown === 'countries' ? null : 'countries')}
                className="h-8 text-xs"
              >
                <Globe className="w-3 h-3 mr-1" />
                Countries
                {activeDropdown === 'countries' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </Button>
              <Button 
                variant={activeDropdown === 'devices' ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setActiveDropdown(activeDropdown === 'devices' ? null : 'devices')}
                className="h-8 text-xs"
              >
                <Monitor className="w-3 h-3 mr-1" />
                Devices
                {activeDropdown === 'devices' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              <Button variant="ghost" size="sm" onClick={() => { fetchAllData(true); fetchAllTypesData(); }} disabled={isFetching || isLoadingAllTypes} className="h-8">
                <RefreshCw className={`w-3 h-3 mr-1 ${isFetching || isLoadingAllTypes ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Dropdown Content Panels */}
          {activeDropdown === 'queries' && (
            <div className="bg-background border border-border rounded-lg p-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" />
                  Top Queries
                </h4>
                <Badge variant="secondary" className="text-[10px]">{queryData.length} total</Badge>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input placeholder="Filter queries..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="pl-7 h-7 text-xs" />
              </div>
              <ScrollArea className="h-[280px]">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead className="text-xs">Query</TableHead><TableHead className="text-right text-xs">Clicks</TableHead><TableHead className="text-right text-xs">Impressions</TableHead><TableHead className="text-right text-xs">CTR</TableHead><TableHead className="text-right text-xs">Position</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQueryData.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs py-1.5 max-w-[180px] truncate" title={row.keys[0]}>{row.keys[0]}</TableCell>
                        <TableCell className="text-right text-xs py-1.5 font-medium">{row.clicks}</TableCell>
                        <TableCell className="text-right text-xs py-1.5 text-muted-foreground">{row.impressions}</TableCell>
                        <TableCell className="text-right text-xs py-1.5">{(row.ctr * 100).toFixed(2)}%</TableCell>
                        <TableCell className="text-right py-1.5"><Badge variant={row.position <= 10 ? "default" : "secondary"} className="text-[10px]">{row.position.toFixed(1)}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {filteredQueryData.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-4">{isFetching ? "Loading..." : "No data"}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {activeDropdown === 'pages' && (
            <div className="bg-background border border-border rounded-lg p-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-500" />
                  Top Pages
                </h4>
                <Badge variant="secondary" className="text-[10px]">{pageData.length} total</Badge>
              </div>
              <ScrollArea className="h-[280px]">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead className="text-xs">Page</TableHead><TableHead className="text-right text-xs">Clicks</TableHead><TableHead className="text-right text-xs">Impressions</TableHead><TableHead className="text-right text-xs">CTR</TableHead><TableHead className="text-right text-xs">Position</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.slice(0, 25).map((row, i) => {
                      let path = row.keys[0];
                      try { path = new URL(row.keys[0]).pathname || "/"; } catch {}
                      return (
                        <TableRow key={i}>
                          <TableCell className="text-xs py-1.5 truncate max-w-[180px]" title={row.keys[0]}>{path}</TableCell>
                          <TableCell className="text-right text-xs py-1.5 font-medium">{row.clicks}</TableCell>
                          <TableCell className="text-right text-xs py-1.5 text-muted-foreground">{row.impressions}</TableCell>
                          <TableCell className="text-right text-xs py-1.5">{(row.ctr * 100).toFixed(2)}%</TableCell>
                          <TableCell className="text-right py-1.5"><Badge variant={row.position <= 10 ? "default" : "secondary"} className="text-[10px]">{row.position.toFixed(1)}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                    {pageData.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-4">{isFetching ? "Loading..." : "No data"}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {activeDropdown === 'countries' && (
            <div className="bg-background border border-border rounded-lg p-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4 text-violet-500" />
                  Top Countries
                </h4>
                <Badge variant="secondary" className="text-[10px]">{countryData.length} total</Badge>
              </div>
              <ScrollArea className="h-[280px]">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead className="text-xs">Country</TableHead><TableHead className="text-right text-xs">Clicks</TableHead><TableHead className="text-right text-xs">Impressions</TableHead><TableHead className="text-right text-xs">CTR</TableHead><TableHead className="text-right text-xs">Position</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {countryData.slice(0, 25).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs py-1.5">{row.keys[0]}</TableCell>
                        <TableCell className="text-right text-xs py-1.5 font-medium">{row.clicks}</TableCell>
                        <TableCell className="text-right text-xs py-1.5 text-muted-foreground">{row.impressions}</TableCell>
                        <TableCell className="text-right text-xs py-1.5">{(row.ctr * 100).toFixed(2)}%</TableCell>
                        <TableCell className="text-right py-1.5"><Badge variant={row.position <= 10 ? "default" : "secondary"} className="text-[10px]">{row.position.toFixed(1)}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {countryData.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-4">{isFetching ? "Loading..." : "No data"}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {activeDropdown === 'devices' && (
            <div className="bg-background border border-border rounded-lg p-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-amber-500" />
                  Device Breakdown
                </h4>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {deviceData.map((device, i) => {
                  const Icon = device.keys[0] === 'DESKTOP' ? Monitor : device.keys[0] === 'MOBILE' ? Smartphone : Tablet;
                  const totalClicks = deviceData.reduce((sum, d) => sum + d.clicks, 0);
                  const pct = totalClicks > 0 ? (device.clicks / totalClicks) * 100 : 0;
                  return (
                    <div key={i} className="bg-secondary/30 rounded-lg p-4 text-center">
                      <Icon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground capitalize mb-1">{device.keys[0].toLowerCase()}</p>
                      <p className="text-2xl font-bold">{pct.toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">{device.clicks} clicks</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{device.impressions} impressions</p>
                    </div>
                  );
                })}
                {deviceData.length === 0 && <div className="col-span-3 text-center text-muted-foreground text-xs py-8">{isFetching ? "Loading..." : "No data"}</div>}
              </div>
            </div>
          )}

          {/* Combined KPI Row - All Search Types */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Clicks", value: formatNumber(combinedMetrics.clicks), icon: MousePointer, color: "text-primary", subtitle: "All sources" },
              { label: "Total Impressions", value: formatNumber(combinedMetrics.impressions), icon: Eye, color: "text-cyan-500", subtitle: "All sources" },
              { label: "Avg CTR", value: (combinedMetrics.ctr * 100).toFixed(2) + "%", icon: Target, color: "text-violet-500", subtitle: "Combined" },
              { label: "Avg Position", value: combinedMetrics.position > 0 ? combinedMetrics.position.toFixed(1) : "—", icon: TrendingUp, color: "text-amber-500", subtitle: "Web only" },
            ].map((metric, i) => (
              <div key={i} className="bg-secondary/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <metric.icon className={`w-4 h-4 ${metric.color}`} />
                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                </div>
                <p className="text-xl font-bold mt-1">{isLoadingAllTypes ? <Skeleton className="h-6 w-16" /> : metric.value}</p>
                <p className="text-[10px] text-muted-foreground">{metric.subtitle}</p>
              </div>
            ))}
          </div>

          {/* Search Type Breakdown */}
          {searchTypeBreakdown.length > 0 && (
            <div className="bg-secondary/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Performance by Source</span>
                {isLoadingAllTypes && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {(['web', 'image', 'video', 'news', 'discover'] as SearchType[]).map((type) => {
                  const data = allTypesData[type];
                  const config = SEARCH_TYPE_CONFIG[type];
                  const hasData = data.clicks > 0 || data.impressions > 0;
                  const isActive = searchType === type;
                  
                  return (
                    <button
                      key={type}
                      onClick={() => setSearchType(type)}
                      className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-primary/20 border border-primary/50' 
                          : hasData 
                            ? 'bg-secondary/50 hover:bg-secondary/80 cursor-pointer' 
                            : 'bg-secondary/20 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1" style={{ color: config.color }}>
                        {config.icon}
                        <span className="text-[10px] font-medium">{config.label}</span>
                      </div>
                      {hasData ? (
                        <>
                          <span className="text-sm font-bold">{formatNumber(data.clicks)}</span>
                          <span className="text-[9px] text-muted-foreground">{formatNumber(data.impressions)} imp</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">No data</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Type KPI Row */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1" style={{ color: SEARCH_TYPE_CONFIG[searchType].color }}>
              {SEARCH_TYPE_CONFIG[searchType].icon}
              <span className="text-xs font-medium">{SEARCH_TYPE_CONFIG[searchType].label} Search</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">{dateRange} days</Badge>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: "Clicks", value: formatNumber(totalMetrics.clicks) },
              { label: "Impressions", value: formatNumber(totalMetrics.impressions) },
              { label: "CTR", value: (totalMetrics.ctr * 100).toFixed(2) + "%" },
              { label: "Position", value: totalMetrics.position.toFixed(1) },
            ].map((metric, i) => (
              <div key={i} className="bg-secondary/20 rounded-md p-2 text-center">
                <p className="text-sm font-bold">{isFetching ? <Skeleton className="h-4 w-10 mx-auto" /> : metric.value}</p>
                <p className="text-[10px] text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>

          {/* Performance Chart */}
          <div className="h-[150px] w-full">
            {isFetching && chartData.length === 0 ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gscClicksGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SEARCH_TYPE_CONFIG[searchType].color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={SEARCH_TYPE_CONFIG[searchType].color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} interval="preserveStartEnd" />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={35} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="clicks" stroke={SEARCH_TYPE_CONFIG[searchType].color} fill="url(#gscClicksGradient)" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Advanced Reporting Toggle */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedReporting(!showAdvancedReporting)}
              className="w-full justify-between h-10 text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-500" />
                Advanced Reporting
                <Badge variant="secondary" className="text-[10px]">
                  Keywords • Countries • Indexation
                </Badge>
              </span>
              {showAdvancedReporting ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Reporting Panel */}
      {showAdvancedReporting && (
        <GSCAdvancedReporting
          accessToken={accessToken}
          selectedSite={selectedSite}
          dateRange={dateRange}
          queryData={queryData}
          countryData={countryData}
          pageData={pageData}
          isFetching={isFetching}
        />
      )}

      {/* Code Generator Dialog */}
      <Dialog open={showCodeGenerator} onOpenChange={setShowCodeGenerator}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              Tracking Code Generator
            </DialogTitle>
            <DialogDescription>
              Add this code to your website to enable visitor intelligence tracking for {selectedSite?.replace('sc-domain:', '').replace('https://', '') || 'your domain'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-zinc-900 rounded-lg p-4 relative">
              <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap font-mono">{trackingCode}</pre>
              <Button size="sm" variant="secondary" className="absolute top-2 right-2" onClick={handleCopyCode}>
                {codeCopied ? <><Check className="w-3 h-3 mr-1" />Copied!</> : <><Copy className="w-3 h-3 mr-1" />Copy</>}
              </Button>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium">Installation Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                <li>Copy the code above</li>
                <li>Paste it into the <code className="bg-background px-1 rounded">&lt;head&gt;</code> section of your website</li>
                <li>The code will automatically track visitor behavior, page views, and engagement</li>
                <li>Data will sync with this dashboard in real-time</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodeGenerator(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

function getDateNDaysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split("T")[0];
}

export default GSCDashboardPanel;
