import { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Users, Clock, MousePointer, Eye,
  BarChart3, RefreshCw, Loader2, ExternalLink, Key, 
  Activity, Smartphone, Monitor, Tablet, Globe, X,
  ArrowUpRight, ArrowDownRight, Zap, Target, PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from "recharts";

// Google OAuth Config for Analytics
const getGoogleClientId = () => localStorage.getItem("ga_client_id") || localStorage.getItem("gsc_client_id") || import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_GA_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/analytics.readonly",
].join(" ");

function getOAuthRedirectUri(): string {
  const path = window.location.pathname;
  try {
    if (document.referrer) {
      const ref = new URL(document.referrer);
      if (ref.hostname.endsWith("lovable.app")) {
        return `${ref.origin}${path}`;
      }
    }
  } catch {
    // ignore
  }
  return `${window.location.origin}${path}`;
}

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

interface GAMetrics {
  sessions: number;
  users: number;
  newUsers: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  engagementRate: number;
  pagesPerSession: number;
  sessionsChange: number;
  usersChange: number;
}

interface GAProperty {
  name: string;
  displayName: string;
  propertyType: string;
}

interface TrafficSource {
  source: string;
  sessions: number;
  percentage: number;
  color: string;
}

interface DeviceData {
  device: string;
  sessions: number;
  percentage: number;
  icon: typeof Monitor;
}

interface TopPage {
  path: string;
  views: number;
  avgTime: number;
}

export interface GADashboardPanelProps {
  externalSelectedSite?: string;
  onAuthStatusChange?: (isAuthenticated: boolean) => void;
  fullWidth?: boolean;
}

export const GADashboardPanel = ({
  externalSelectedSite,
  onAuthStatusChange,
  fullWidth = false,
}: GADashboardPanelProps) => {
  const { toast } = useToast();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  
  // Data state
  const [properties, setProperties] = useState<GAProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [metrics, setMetrics] = useState<GAMetrics | null>(null);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [chartData, setChartData] = useState<{ date: string; sessions: number; users: number }[]>([]);
  
  // Client ID configuration
  const [showClientIdDialog, setShowClientIdDialog] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");
  
  // Check for stored token on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem("ga_access_token");
    const tokenExpiry = sessionStorage.getItem("ga_token_expiry");
    
    if (storedToken && tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry);
      const timeRemaining = expiryTime - Date.now();
      
      if (timeRemaining > 0) {
        setAccessToken(storedToken);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      } else {
        sessionStorage.removeItem("ga_access_token");
        sessionStorage.removeItem("ga_token_expiry");
      }
    }
    
    // Check for GA OAuth callback
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    
    if (code && state === "ga") {
      const verifier = sessionStorage.getItem("ga_code_verifier");
      
      if (verifier) {
        setIsLoading(true);
        (async () => {
          try {
            const redirectUri = getOAuthRedirectUri();
            const tokenRes = await supabase.functions.invoke("google-oauth-token", {
              body: { code, codeVerifier: verifier, redirectUri },
            });

            if (tokenRes.error || tokenRes.data?.error) {
              throw new Error(tokenRes.data?.error_description || tokenRes.error?.message || "Token exchange failed");
            }

            const { access_token, expires_in } = tokenRes.data;
            const expiryTime = Date.now() + (expires_in || 3600) * 1000;
            
            sessionStorage.setItem("ga_access_token", access_token);
            sessionStorage.setItem("ga_token_expiry", expiryTime.toString());
            sessionStorage.removeItem("ga_code_verifier");
            
            setAccessToken(access_token);
            setIsAuthenticated(true);
            
            window.history.replaceState({}, document.title, window.location.pathname);
            
            toast({
              title: "Google Analytics Connected",
              description: "Successfully linked your Analytics account.",
            });
          } catch (error: any) {
            console.error("[GA] Token exchange error:", error);
            toast({
              title: "Connection Failed",
              description: error.message || "Failed to connect to Google Analytics.",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
          }
        })();
        return;
      }
    }
    
    setIsLoading(false);
  }, [toast]);

  // Fetch GA4 properties when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchProperties();
    }
  }, [isAuthenticated, accessToken]);

  // Fetch data when property is selected
  useEffect(() => {
    if (selectedProperty && accessToken) {
      fetchAnalyticsData();
    }
  }, [selectedProperty, accessToken]);

  const fetchProperties = async () => {
    if (!accessToken) return;
    
    try {
      const response = await fetch(
        "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      if (!response.ok) throw new Error("Failed to fetch properties");
      
      const data = await response.json();
      const allProperties: GAProperty[] = [];
      
      data.accountSummaries?.forEach((account: any) => {
        account.propertySummaries?.forEach((prop: any) => {
          allProperties.push({
            name: prop.property,
            displayName: prop.displayName,
            propertyType: prop.propertyType || "GA4",
          });
        });
      });
      
      setProperties(allProperties);
      if (allProperties.length > 0 && !selectedProperty) {
        setSelectedProperty(allProperties[0].name);
      }
    } catch (error) {
      console.error("[GA] Error fetching properties:", error);
    }
  };

  const fetchAnalyticsData = async () => {
    if (!accessToken || !selectedProperty) return;
    
    setIsFetching(true);
    try {
      const propertyId = selectedProperty.replace("properties/", "");
      
      // Fetch main metrics
      const metricsResponse = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateRanges: [
              { startDate: "28daysAgo", endDate: "yesterday" },
              { startDate: "56daysAgo", endDate: "29daysAgo" },
            ],
            metrics: [
              { name: "sessions" },
              { name: "totalUsers" },
              { name: "newUsers" },
              { name: "screenPageViews" },
              { name: "averageSessionDuration" },
              { name: "bounceRate" },
              { name: "engagementRate" },
              { name: "screenPageViewsPerSession" },
            ],
          }),
        }
      );

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        const currentRow = metricsData.rows?.[0]?.metricValues || [];
        const previousRow = metricsData.rows?.[1]?.metricValues || [];
        
        const currentSessions = parseFloat(currentRow[0]?.value || "0");
        const previousSessions = parseFloat(previousRow[0]?.value || "0");
        const currentUsers = parseFloat(currentRow[1]?.value || "0");
        const previousUsers = parseFloat(previousRow[1]?.value || "0");
        
        setMetrics({
          sessions: currentSessions,
          users: currentUsers,
          newUsers: parseFloat(currentRow[2]?.value || "0"),
          pageViews: parseFloat(currentRow[3]?.value || "0"),
          avgSessionDuration: parseFloat(currentRow[4]?.value || "0"),
          bounceRate: parseFloat(currentRow[5]?.value || "0") * 100,
          engagementRate: parseFloat(currentRow[6]?.value || "0") * 100,
          pagesPerSession: parseFloat(currentRow[7]?.value || "0"),
          sessionsChange: previousSessions > 0 ? ((currentSessions - previousSessions) / previousSessions) * 100 : 0,
          usersChange: previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0,
        });
      }

      // Fetch traffic sources
      const sourcesResponse = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
            dimensions: [{ name: "sessionDefaultChannelGroup" }],
            metrics: [{ name: "sessions" }],
            limit: 6,
          }),
        }
      );

      if (sourcesResponse.ok) {
        const sourcesData = await sourcesResponse.json();
        const totalSessions = sourcesData.rows?.reduce((sum: number, row: any) => 
          sum + parseFloat(row.metricValues[0]?.value || "0"), 0) || 1;
        
        const colors = ["#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#06b6d4"];
        const sources: TrafficSource[] = (sourcesData.rows || []).map((row: any, i: number) => ({
          source: row.dimensionValues[0]?.value || "Unknown",
          sessions: parseFloat(row.metricValues[0]?.value || "0"),
          percentage: (parseFloat(row.metricValues[0]?.value || "0") / totalSessions) * 100,
          color: colors[i % colors.length],
        }));
        
        setTrafficSources(sources);
      }

      // Fetch device breakdown
      const deviceResponse = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
            dimensions: [{ name: "deviceCategory" }],
            metrics: [{ name: "sessions" }],
          }),
        }
      );

      if (deviceResponse.ok) {
        const deviceDataRes = await deviceResponse.json();
        const totalDeviceSessions = deviceDataRes.rows?.reduce((sum: number, row: any) => 
          sum + parseFloat(row.metricValues[0]?.value || "0"), 0) || 1;
        
        const deviceIcons: Record<string, typeof Monitor> = {
          desktop: Monitor,
          mobile: Smartphone,
          tablet: Tablet,
        };
        
        const devices: DeviceData[] = (deviceDataRes.rows || []).map((row: any) => {
          const device = row.dimensionValues[0]?.value?.toLowerCase() || "unknown";
          return {
            device: device.charAt(0).toUpperCase() + device.slice(1),
            sessions: parseFloat(row.metricValues[0]?.value || "0"),
            percentage: (parseFloat(row.metricValues[0]?.value || "0") / totalDeviceSessions) * 100,
            icon: deviceIcons[device] || Monitor,
          };
        });
        
        setDeviceData(devices);
      }

      // Fetch top pages
      const pagesResponse = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
            dimensions: [{ name: "pagePath" }],
            metrics: [{ name: "screenPageViews" }, { name: "averageSessionDuration" }],
            limit: 5,
            orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          }),
        }
      );

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        const pages: TopPage[] = (pagesData.rows || []).map((row: any) => ({
          path: row.dimensionValues[0]?.value || "/",
          views: parseFloat(row.metricValues[0]?.value || "0"),
          avgTime: parseFloat(row.metricValues[1]?.value || "0"),
        }));
        
        setTopPages(pages);
      }

      // Fetch chart data (daily sessions/users)
      const chartResponse = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
            dimensions: [{ name: "date" }],
            metrics: [{ name: "sessions" }, { name: "totalUsers" }],
            orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
          }),
        }
      );

      if (chartResponse.ok) {
        const chartDataRes = await chartResponse.json();
        const chart = (chartDataRes.rows || []).map((row: any) => {
          const dateStr = row.dimensionValues[0]?.value || "";
          const formattedDate = dateStr.length === 8 
            ? `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`
            : dateStr;
          return {
            date: formattedDate,
            sessions: parseFloat(row.metricValues[0]?.value || "0"),
            users: parseFloat(row.metricValues[1]?.value || "0"),
          };
        });
        
        setChartData(chart);
      }

    } catch (error) {
      console.error("[GA] Error fetching analytics:", error);
      toast({
        title: "Data Fetch Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  // Notify parent of auth status changes
  useEffect(() => {
    onAuthStatusChange?.(isAuthenticated);
  }, [isAuthenticated, onAuthStatusChange]);

  const handleGoogleLogin = async () => {
    const clientId = getGoogleClientId();
    
    if (!clientId) {
      setShowClientIdDialog(true);
      return;
    }

    try {
      const redirectUri = getOAuthRedirectUri();
      const verifier = generateCodeVerifier();
      sessionStorage.setItem("ga_code_verifier", verifier);
      const challenge = await generateCodeChallenge(verifier);

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", GOOGLE_GA_SCOPES);
      authUrl.searchParams.set("code_challenge", challenge);
      authUrl.searchParams.set("code_challenge_method", "S256");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("access_type", "online");
      authUrl.searchParams.set("state", "ga");

      window.location.href = authUrl.toString();
    } catch (error) {
      console.error("[GA] Error initiating OAuth:", error);
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
    localStorage.setItem("ga_client_id", clientIdInput.trim());
    setShowClientIdDialog(false);
    setTimeout(() => { void handleGoogleLogin(); }, 500);
  };

  const handleDisconnect = () => {
    sessionStorage.removeItem("ga_access_token");
    sessionStorage.removeItem("ga_token_expiry");
    setAccessToken(null);
    setIsAuthenticated(false);
    setMetrics(null);
    setProperties([]);
    setSelectedProperty("");
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
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
    if (fullWidth) {
      return (
        <>
          <Card className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-yellow-500/10 border-orange-500/20">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Connect Google Analytics</h3>
                    <p className="text-muted-foreground text-sm">
                      Link your Analytics to see sessions, users, page views, and engagement metrics alongside your Search Console data.
                    </p>
                  </div>
                </div>
                <Button onClick={handleGoogleLogin} size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex-shrink-0">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Connect Analytics
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
                <DialogDescription>Enter your Google Cloud OAuth Client ID for Analytics access.</DialogDescription>
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
                    <li>Enable Google Analytics Data API</li>
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
    
    return (
      <>
        <Card className="bg-gradient-to-br from-orange-500/5 to-amber-500/5 border-orange-500/20 h-full flex flex-col">
          <CardContent className="py-8 flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Connect Google Analytics</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Link your Analytics to see sessions, users, page views, and engagement metrics.
              </p>
              <Button onClick={handleGoogleLogin} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Connect Analytics
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
              <DialogDescription>Enter your Google Cloud OAuth Client ID for Analytics access.</DialogDescription>
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
                  <li>Enable Google Analytics Data API</li>
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

  // Connected - show comprehensive dashboard
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Google Analytics</CardTitle>
              <CardDescription className="text-xs">
                {properties.find(p => p.name === selectedProperty)?.displayName || "Traffic and engagement data"}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {properties.length > 1 && (
              <select 
                value={selectedProperty} 
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="h-8 text-xs bg-secondary border border-border rounded-md px-2"
              >
                {properties.map(prop => (
                  <option key={prop.name} value={prop.name}>{prop.displayName}</option>
                ))}
              </select>
            )}
            <Button variant="ghost" size="sm" onClick={fetchAnalyticsData} disabled={isFetching} className="h-8">
              <RefreshCw className={`w-3 h-3 mr-1 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleDisconnect} className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive h-8">
              <X className="w-3 h-3 mr-1" />
              Disconnect
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Sessions */}
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl p-4 border border-orange-500/20">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-orange-500" />
              {metrics && metrics.sessionsChange !== 0 && (
                <Badge variant="secondary" className={`text-[10px] ${metrics.sessionsChange > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {metrics.sessionsChange > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {Math.abs(metrics.sessionsChange).toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold">{metrics ? formatNumber(metrics.sessions) : "—"}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>

          {/* Users */}
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-amber-500" />
              {metrics && metrics.usersChange !== 0 && (
                <Badge variant="secondary" className={`text-[10px] ${metrics.usersChange > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {metrics.usersChange > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {Math.abs(metrics.usersChange).toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold">{metrics ? formatNumber(metrics.users) : "—"}</p>
            <p className="text-xs text-muted-foreground">Users ({metrics ? formatNumber(metrics.newUsers) : "—"} new)</p>
          </div>

          {/* Page Views */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-yellow-500" />
              {metrics && (
                <Badge variant="secondary" className="text-[10px] bg-secondary">
                  {metrics.pagesPerSession.toFixed(1)}/session
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold">{metrics ? formatNumber(metrics.pageViews) : "—"}</p>
            <p className="text-xs text-muted-foreground">Page Views</p>
          </div>

          {/* Avg Duration */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-green-500" />
              {metrics && (
                <Badge variant="secondary" className="text-[10px] bg-secondary">
                  {metrics.engagementRate.toFixed(0)}% engaged
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold">{metrics ? formatDuration(metrics.avgSessionDuration) : "—"}</p>
            <p className="text-xs text-muted-foreground">Avg. Duration</p>
          </div>
        </div>

        {/* Engagement Metrics Bar */}
        <div className="bg-secondary/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Engagement Overview
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Engagement Rate</span>
                <span className="font-medium text-green-500">{metrics ? `${metrics.engagementRate.toFixed(1)}%` : "—"}</span>
              </div>
              <Progress value={metrics?.engagementRate || 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Bounce Rate</span>
                <span className="font-medium text-amber-500">{metrics ? `${metrics.bounceRate.toFixed(1)}%` : "—"}</span>
              </div>
              <Progress value={metrics?.bounceRate || 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Pages/Session</span>
                <span className="font-medium">{metrics ? metrics.pagesPerSession.toFixed(2) : "—"}</span>
              </div>
              <Progress value={Math.min((metrics?.pagesPerSession || 0) * 20, 100)} className="h-2" />
            </div>
          </div>
        </div>

        {/* Sessions Chart */}
        {chartData.length > 0 && (
          <div className="bg-secondary/20 rounded-xl p-4">
            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Sessions & Users (Last 28 Days)
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                  <Area type="monotone" dataKey="sessions" stroke="#f97316" fill="url(#sessionsGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="users" stroke="#eab308" fill="url(#usersGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-muted-foreground">Sessions</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">Users</span>
              </div>
            </div>
          </div>
        )}

        {/* Traffic Sources & Devices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Traffic Sources */}
          <div className="bg-secondary/20 rounded-xl p-4">
            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Traffic Sources
            </h4>
            {trafficSources.length > 0 ? (
              <div className="space-y-3">
                {trafficSources.slice(0, 5).map((source, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="truncate max-w-[150px]">{source.source}</span>
                      <span className="text-muted-foreground">{formatNumber(source.sessions)} ({source.percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={source.percentage} className="h-1.5" style={{ '--progress-color': source.color } as any} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">No data available</div>
            )}
          </div>

          {/* Device Breakdown */}
          <div className="bg-secondary/20 rounded-xl p-4">
            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary" />
              Device Breakdown
            </h4>
            {deviceData.length > 0 ? (
              <div className="space-y-3">
                {deviceData.map((device, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <device.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{device.device}</span>
                        <span className="text-muted-foreground">{device.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={device.percentage} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">No data available</div>
            )}
          </div>
        </div>

        {/* Top Pages */}
        {topPages.length > 0 && (
          <div className="bg-secondary/20 rounded-xl p-4">
            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Top Pages
            </h4>
            <div className="space-y-2">
              {topPages.map((page, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                    <span className="text-sm truncate max-w-[300px]">{page.path}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(page.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(page.avgTime)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading state overlay */}
        {isFetching && !metrics && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GADashboardPanel;