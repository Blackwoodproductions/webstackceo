import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Users, Clock, Eye,
  BarChart3, RefreshCw, Loader2, ExternalLink, Key, 
  Activity, X, ArrowUpRight, ArrowDownRight, Zap, Target
} from "lucide-react";
import { usePopupOAuth } from "@/hooks/use-popup-oauth";
import { GAOnboardingWizard } from "./GAOnboardingWizard";
import { GAInlineOnboardingWizard } from "./GAInlineOnboardingWizard";
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
  loadCachedGaData,
  saveCachedGaData,
  type GaCacheData
} from "@/lib/persistentCache";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Combined Google OAuth Config - includes both GA and GSC scopes for unified auth
const getGoogleClientId = () => localStorage.getItem("google_client_id") || localStorage.getItem("ga_client_id") || localStorage.getItem("gsc_client_id") || import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_GA_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/webmasters",
  "https://www.googleapis.com/auth/siteverification",
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

export interface GAMetrics {
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
  websiteUrl?: string;
}

interface GADataStream {
  name: string;
  type?: string;
  displayName?: string;
  webStreamData?: {
    defaultUri?: string;
    measurementId?: string;
  };
}

interface TopPage {
  path: string;
  views: number;
  avgTime: number;
}

export interface GADashboardPanelProps {
  externalSelectedSite?: string;
  onAuthStatusChange?: (isAuthenticated: boolean) => void;
  onMetricsUpdate?: (metrics: GAMetrics | null, isConnected: boolean, domainMatches: boolean) => void;
  fullWidth?: boolean;
  hidePropertySelector?: boolean;
}

export const GADashboardPanel = ({
  externalSelectedSite,
  onAuthStatusChange,
  onMetricsUpdate,
  fullWidth = false,
  hidePropertySelector = false,
}: GADashboardPanelProps) => {
  const { toast } = useToast();
  const { openOAuthPopup } = usePopupOAuth();

  // Avoid effect loops when parent passes inline callbacks.
  // Store the latest callbacks in refs so our effects don't depend on function identity.
  const onAuthStatusChangeRef = useRef<GADashboardPanelProps["onAuthStatusChange"]>(onAuthStatusChange);
  const onMetricsUpdateRef = useRef<GADashboardPanelProps["onMetricsUpdate"]>(onMetricsUpdate);

  useEffect(() => {
    onAuthStatusChangeRef.current = onAuthStatusChange;
  }, [onAuthStatusChange]);

  useEffect(() => {
    onMetricsUpdateRef.current = onMetricsUpdate;
  }, [onMetricsUpdate]);
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [propertiesLoaded, setPropertiesLoaded] = useState(false);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [isFetchingProperties, setIsFetchingProperties] = useState(false);
  
  // Data state
  const [properties, setProperties] = useState<GAProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [metrics, setMetrics] = useState<GAMetrics | null>(null);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [chartData, setChartData] = useState<{ date: string; sessions: number; users: number }[]>([]);

  // Domain verification via GA4 Web Data Streams (more reliable than property displayName)
  const [webDomainsByProperty, setWebDomainsByProperty] = useState<Record<string, string[]>>({});
  const [streamsLoaded, setStreamsLoaded] = useState(false);
  const [streamsError, setStreamsError] = useState<string | null>(null);
  const [isFetchingStreams, setIsFetchingStreams] = useState(false);
  
  // Client ID configuration
  const [showClientIdDialog, setShowClientIdDialog] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");
  
  // Wizard refresh state (must be at top level, before any conditional returns)
  const [isWizardRefreshing, setIsWizardRefreshing] = useState(false);

  // Normalize domain for comparison
  const normalizeDomain = (domain: string): string => {
    return domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .toLowerCase();
  };

  // Check if external site matches any GA property
  const isExternalSiteInGA = useMemo(() => {
    // If no external site selected, we can't check - but don't show metrics without a domain
    if (!externalSelectedSite) return false;

    // Prefer web stream defaultUri matching when available.
    // Don't assume "not found" until streams have loaded.
    if (!streamsLoaded) return false;
    
    const normalizedExternal = normalizeDomain(externalSelectedSite);

    const domains = Object.values(webDomainsByProperty).flat();
    if (domains.length > 0) {
      const match = domains.some((d) => {
        const nd = normalizeDomain(d);
        return nd.includes(normalizedExternal) || normalizedExternal.includes(nd);
      });
      console.log("[GA] Domain match (streams) result:", { normalizedExternal, match, domains });
      return match;
    }

    // Fallback: legacy heuristic against property displayName (kept for backwards compatibility)
    if (properties.length === 0) return false;
    console.log('[GA] Checking domain match (fallback displayName):', { externalSelectedSite, normalizedExternal, properties: properties.map(p => ({ name: p.displayName, normalized: normalizeDomain(p.displayName) })) });
    
    const match = properties.some(prop => {
      const propDomain = normalizeDomain(prop.displayName);
      return propDomain.includes(normalizedExternal) || normalizedExternal.includes(propDomain);
    });
    
    console.log('[GA] Domain match result:', match);
    return match;
  }, [externalSelectedSite, properties, streamsLoaded, webDomainsByProperty]);

  // Find matching property for external site
  const matchingProperty = useMemo(() => {
    if (!externalSelectedSite || properties.length === 0) return null;
    if (!streamsLoaded) return null;
    const normalizedExternal = normalizeDomain(externalSelectedSite);

    // Prefer matching by web data stream defaultUri
    for (const prop of properties) {
      const domains = webDomainsByProperty[prop.name] || [];
      for (const d of domains) {
        const nd = normalizeDomain(d);
        if (nd.includes(normalizedExternal) || normalizedExternal.includes(nd)) {
          return prop;
        }
      }
    }

    // Fallback to displayName matching
    return properties.find(prop => {
      const propDomain = normalizeDomain(prop.displayName);
      return propDomain.includes(normalizedExternal) || normalizedExternal.includes(propDomain);
    });
  }, [externalSelectedSite, properties, streamsLoaded, webDomainsByProperty]);
  
  // Check for stored token on mount - use localStorage for persistence
  useEffect(() => {
    const checkStoredToken = () => {
      // Check for GA-specific token first
      let storedToken = localStorage.getItem("ga_access_token");
      let tokenExpiry = localStorage.getItem("ga_token_expiry");
      
      // Fall back to unified Google token from auth callback
      if (!storedToken || !tokenExpiry) {
        storedToken = localStorage.getItem("unified_google_token");
        tokenExpiry = localStorage.getItem("unified_google_expiry");
        
        // If unified token found, sync to GA keys
        if (storedToken && tokenExpiry) {
          console.log("[GA] Found unified token, syncing to GA keys");
          localStorage.setItem("ga_access_token", storedToken);
          localStorage.setItem("ga_token_expiry", tokenExpiry);
        }
      }
      
      if (storedToken && tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry);
        const timeRemaining = expiryTime - Date.now();
        
        if (timeRemaining > 0) {
          console.log("[GA] Found valid stored token, expires in:", Math.round(timeRemaining / 1000 / 60), "minutes");
          setAccessToken(storedToken);
          setIsAuthenticated(true);
          setIsLoading(false);
          
          // Dispatch sync event so other panels get notified
          window.dispatchEvent(new CustomEvent("google-auth-synced", {
            detail: { access_token: storedToken, expiry: expiryTime }
          }));
          
          return true;
        } else {
          console.log("[GA] Stored token has expired, clearing...");
          localStorage.removeItem("ga_access_token");
          localStorage.removeItem("ga_token_expiry");
          localStorage.removeItem("unified_google_token");
          localStorage.removeItem("unified_google_expiry");
        }
      }
      return false;
    };
    
    // Listen for cross-panel auth sync
    const handleAuthSync = (e: CustomEvent) => {
      console.log("[GA] Received auth sync from GSC panel");
      setAccessToken(e.detail.access_token);
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    
    window.addEventListener("google-auth-synced", handleAuthSync as EventListener);
    
    if (checkStoredToken()) {
      return () => {
        window.removeEventListener("google-auth-synced", handleAuthSync as EventListener);
      };
    }
    
    // Check for GA OAuth callback
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    
    if (code && state === "ga") {
      const verifier = localStorage.getItem("ga_code_verifier");
      
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

            const { access_token, expires_in, scope } = tokenRes.data;

            // If Google returns scopes, ensure we actually received Analytics access.
            // (Prevents "connected" UI with a token that can only access GSC/userinfo.)
            if (typeof scope === "string" && !scope.includes("analytics.readonly")) {
              throw new Error(
                "Google granted no Analytics permissions. Please reconnect and approve the Analytics access request."
              );
            }
            const expiryTime = Date.now() + (expires_in || 3600) * 1000;
            
            console.log("[GA] Token received, storing in localStorage (syncing to GSC)...");
            // Store for GA
            localStorage.setItem("ga_access_token", access_token);
            localStorage.setItem("ga_token_expiry", expiryTime.toString());
            localStorage.removeItem("ga_code_verifier");
            
            // Sync to GSC for unified auth
            localStorage.setItem("gsc_access_token", access_token);
            localStorage.setItem("gsc_token_expiry", expiryTime.toString());
            localStorage.removeItem("gsc_code_verifier");
            
            // Dispatch event to notify GSC panel
            window.dispatchEvent(new CustomEvent("google-auth-synced", { 
              detail: { access_token, expiry: expiryTime } 
            }));
            
            setAccessToken(access_token);
            setIsAuthenticated(true);
            
            window.history.replaceState({}, document.title, window.location.pathname);
            
            toast({
              title: "Google Connected",
              description: "Successfully connected Analytics and Search Console.",
            });
          } catch (error: any) {
            console.error("[GA] Token exchange error:", error);
            toast({
              title: "Connection Failed",
              description: error.message || "Failed to connect to Google Analytics.",
              variant: "destructive",
            });

            // Ensure we don't get stuck in a "connected" loading state after a failed callback.
            setAccessToken(null);
            setIsAuthenticated(false);
          } finally {
            setIsLoading(false);
          }
        })();
        return () => {
          window.removeEventListener("google-auth-synced", handleAuthSync as EventListener);
        };
      }
    }
    
    setIsLoading(false);
    
    return () => {
      window.removeEventListener("google-auth-synced", handleAuthSync as EventListener);
    };
  }, [toast]);

  // Fetch GA4 properties when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchProperties();
    }
  }, [isAuthenticated, accessToken]);

  // Once properties are loaded, fetch Web Data Streams to reliably determine which domains exist.
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    if (!externalSelectedSite) return;
    if (!propertiesLoaded) return;
    if (properties.length === 0) {
      setStreamsLoaded(true);
      return;
    }

    void fetchWebDataStreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken, externalSelectedSite, propertiesLoaded, properties.map((p) => p.name).join(",")]);

  // Auto-select the matching property when streams are loaded and a match is found
  useEffect(() => {
    if (matchingProperty && matchingProperty.name !== selectedProperty) {
      setSelectedProperty(matchingProperty.name);
    }
  }, [matchingProperty, selectedProperty]);

  // Fetch data when property is selected
  useEffect(() => {
    if (selectedProperty && accessToken) {
      fetchAnalyticsData();
    }
  }, [selectedProperty, accessToken]);

  const fetchProperties = async () => {
    if (!accessToken) {
      // If we somehow got into an authenticated state without a token, don't spin forever.
      setPropertiesError("Google session is missing/expired. Please reconnect.");
      setPropertiesLoaded(true);
      return;
    }

    if (isFetchingProperties) return;
    setIsFetchingProperties(true);
    setPropertiesLoaded(false);
    setPropertiesError(null);
    setStreamsLoaded(false);
    setStreamsError(null);
    setWebDomainsByProperty({});

    try {
      console.log("[GA] Fetching properties...");

      const response = await fetch(
        "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        let details = "";
        try {
          const errJson = await response.json();
          const msg = errJson?.error?.message;
          const status = errJson?.error?.status;
          details = [status, msg].filter(Boolean).join(": ");
        } catch {
          // ignore
        }

        // Make 403 actionable (most common: API not enabled or insufficient permissions/scopes)
        if (response.status === 403) {
          throw new Error(
            `Failed to fetch properties (403). ${details || "Your Google OAuth app likely needs the Google Analytics Admin API enabled, or your account doesn't have permission."}`
          );
        }

        throw new Error(`Failed to fetch properties (${response.status}). ${details}`.trim());
      }

      const data = await response.json();
      console.log("[GA] Properties response:", data);

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

      console.log("[GA] Parsed properties:", allProperties);
      setProperties(allProperties);

      if (allProperties.length > 0 && !selectedProperty) {
        setSelectedProperty(allProperties[0].name);
      }
    } catch (error: any) {
      console.error("[GA] Error fetching properties:", error);
      setPropertiesError(error?.message || "Failed to load properties");
    } finally {
      setPropertiesLoaded(true);
      setIsFetchingProperties(false);
    }
  };

  const fetchWebDataStreams = async () => {
    if (!accessToken) return;
    if (isFetchingStreams) return;

    setIsFetchingStreams(true);
    setStreamsLoaded(false);
    setStreamsError(null);

    try {
      const entries = await Promise.all(
        properties.map(async (prop) => {
          const url = `https://analyticsadmin.googleapis.com/v1beta/${prop.name}/dataStreams`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!res.ok) {
            // If this fails, we can't reliably check domain membership.
            // Keep error non-blocking; user can still pick a property manually.
            let details = "";
            try {
              const errJson = await res.json();
              details = errJson?.error?.message || errJson?.error?.status || "";
            } catch {
              // ignore
            }
            throw new Error(
              `Failed to fetch data streams (${res.status}) for ${prop.displayName}. ${details}`.trim()
            );
          }

          const data = await res.json();
          const streams: GADataStream[] = data?.dataStreams || [];
          const uris = streams
            .map((s) => s.webStreamData?.defaultUri)
            .filter((v): v is string => typeof v === "string" && v.trim().length > 0);

          return [prop.name, uris] as const;
        })
      );

      const next: Record<string, string[]> = {};
      for (const [propName, uris] of entries) next[propName] = uris;
      setWebDomainsByProperty(next);
    } catch (e: any) {
      console.error("[GA] Error fetching web data streams:", e);
      setStreamsError(e?.message || "Failed to load data streams");
    } finally {
      setStreamsLoaded(true);
      setIsFetchingStreams(false);
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
    onAuthStatusChangeRef.current?.(isAuthenticated);
  }, [isAuthenticated]);

  // Notify parent of metrics updates
  useEffect(() => {
    // While streams are still loading, don't flip the parent state back and forth.
    // Keep this optimistic until we can verify via web data streams.
    const domainMatches = externalSelectedSite
      ? (streamsLoaded ? isExternalSiteInGA : true)
      : true;

    onMetricsUpdateRef.current?.(metrics, isAuthenticated, domainMatches);
  }, [metrics, isAuthenticated, isExternalSiteInGA, externalSelectedSite, streamsLoaded]);

  // Handle OAuth code exchange (called from popup callback)
  const handleOAuthCodeExchange = useCallback(async (code: string) => {
    const verifier = localStorage.getItem("ga_code_verifier");
    if (!verifier) {
      toast({
        title: "Authentication Error",
        description: "OAuth session expired. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const redirectUri = getOAuthRedirectUri();
      const tokenRes = await supabase.functions.invoke("google-oauth-token", {
        body: { code, codeVerifier: verifier, redirectUri },
      });

      if (tokenRes.error || tokenRes.data?.error) {
        throw new Error(tokenRes.data?.error_description || tokenRes.error?.message || "Token exchange failed");
      }

      const { access_token, expires_in, scope } = tokenRes.data;

      if (typeof scope === "string" && !scope.includes("analytics.readonly")) {
        throw new Error("Google granted no Analytics permissions. Please reconnect and approve the Analytics access request.");
      }

      const expiryTime = Date.now() + (expires_in || 3600) * 1000;
      
      console.log("[GA] Token received via popup, storing in localStorage (syncing to GSC)...");
      // Store for GA
      localStorage.setItem("ga_access_token", access_token);
      localStorage.setItem("ga_token_expiry", expiryTime.toString());
      localStorage.removeItem("ga_code_verifier");
      
      // Sync to GSC for unified auth
      localStorage.setItem("gsc_access_token", access_token);
      localStorage.setItem("gsc_token_expiry", expiryTime.toString());
      localStorage.removeItem("gsc_code_verifier");
      
      // Dispatch event to notify GSC panel
      window.dispatchEvent(new CustomEvent("google-auth-synced", { 
        detail: { access_token, expiry: expiryTime } 
      }));
      
      setAccessToken(access_token);
      setIsAuthenticated(true);
      
      toast({
        title: "Google Connected",
        description: "Successfully connected Analytics and Search Console.",
      });
    } catch (error: any) {
      console.error("[GA] Token exchange error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Google Analytics.",
        variant: "destructive",
      });
      setAccessToken(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleGoogleLogin = async () => {
    const clientId = getGoogleClientId();
    
    if (!clientId) {
      setShowClientIdDialog(true);
      return;
    }

    try {
      const redirectUri = getOAuthRedirectUri();
      const verifier = generateCodeVerifier();
      localStorage.setItem("ga_code_verifier", verifier);
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

      // Use popup instead of redirect
      const opened = openOAuthPopup({
        authUrl: authUrl.toString(),
        popupName: "ga_oauth",
        onSuccess: (code) => {
          void handleOAuthCodeExchange(code);
        },
        onError: (error) => {
          console.error("[GA] OAuth popup error:", error);
          toast({
            title: "Authentication Error",
            description: error === "access_denied" 
              ? "You denied access to Google Analytics." 
              : "Failed to authenticate with Google. Please try again.",
            variant: "destructive",
          });
        },
      });

      if (!opened) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive",
        });
      }
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
    localStorage.removeItem("ga_access_token");
    localStorage.removeItem("ga_token_expiry");
    localStorage.removeItem("ga_code_verifier");
    setAccessToken(null);
    setIsAuthenticated(false);
    setMetrics(null);
    setProperties([]);
    setSelectedProperty("");
    setPropertiesLoaded(false);
    setPropertiesError(null);
    setIsFetchingProperties(false);
    setWebDomainsByProperty({});
    setStreamsLoaded(false);
    setStreamsError(null);
    setIsFetchingStreams(false);
  };

  // Wizard refresh handler - reloads properties and streams
  const handleWizardRefresh = async () => {
    setIsWizardRefreshing(true);
    toast({ title: "Checking for data streams...", description: "Refreshing your GA account data." });
    setStreamsLoaded(false);
    setWebDomainsByProperty({});
    await fetchProperties();
    setTimeout(() => {
      void fetchWebDataStreams();
      setIsWizardRefreshing(false);
    }, 500);
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
      <Card className="relative overflow-hidden bg-card border-border/60">
        {/* Background grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        {/* Corner glows */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/15 via-amber-500/10 to-transparent rounded-bl-[60px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-tr-[50px] pointer-events-none" />
        {/* Scanning animation */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent animate-pulse" />
        </div>
        <CardContent className="relative z-10 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 blur-lg opacity-40 animate-pulse" />
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Connecting to Google...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not connected - show unified connect prompt with Cyber-UI aesthetic
  if (!isAuthenticated) {
    if (fullWidth) {
      return (
        <>
          <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-orange-500/5 group">
            {/* Background effects */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.02]"
              style={{
                backgroundImage: `linear-gradient(hsl(24 95% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 95% 53%) 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />
            {/* Corner glows */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-orange-500/15 via-amber-500/10 to-transparent rounded-bl-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-500/15 via-primary/5 to-transparent rounded-tr-[60px] pointer-events-none" />
            {/* Scanning line */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent pointer-events-none animate-pulse" style={{ animationDuration: '3s' }} />
            {/* Floating particles */}
            <div className="absolute top-[15%] left-[5%] w-1.5 h-1.5 rounded-full bg-orange-400/40 animate-pulse" />
            <div className="absolute top-[40%] right-[8%] w-1 h-1 rounded-full bg-amber-400/50 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-[25%] left-[15%] w-1 h-1 rounded-full bg-orange-300/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
            
            <CardContent className="relative z-10 py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  {/* Glowing icon */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform duration-300">
                      <Activity className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Connect Google Analytics</h3>
                    <p className="text-muted-foreground text-sm max-w-md">
                      Link your Analytics to see sessions, users, page views, and engagement metrics alongside your Search Console data.
                    </p>
                  </div>
                </div>
                <Button onClick={handleGoogleLogin} size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 flex-shrink-0">
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
                    <li>Enable Google Analytics Data API + Analytics Admin API</li>
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
        <Card className="relative overflow-hidden bg-card border-border/60 h-full flex flex-col group">
          {/* Background grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(hsl(24 95% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 95% 53%) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
          
          {/* Corner accent glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/15 via-amber-500/10 to-transparent rounded-bl-[60px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-tr-[60px] pointer-events-none" />
          
          {/* Floating particles */}
          <div className="absolute top-[20%] left-[10%] w-1 h-1 rounded-full bg-orange-400/60 animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="absolute top-[40%] right-[15%] w-1.5 h-1.5 rounded-full bg-amber-400/50 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-[30%] left-[20%] w-1 h-1 rounded-full bg-orange-300/40 animate-pulse" style={{ animationDelay: '2s' }} />
          
          <CardContent className="relative z-10 py-10 flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              {/* Glowing icon container */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform duration-300">
                  <Activity className="w-9 h-9 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Connect Google Analytics</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Link your Analytics to see sessions, users, page views, and engagement metrics.
              </p>
              <Button onClick={handleGoogleLogin} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-shadow">
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
                  <li>Enable Google Analytics Data API + Analytics Admin API</li>
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

  // Connected but still loading properties (and no error)
  if (isAuthenticated && !propertiesLoaded && !propertiesError) {
    return (
      <Card className="relative overflow-hidden bg-card border-border/60">
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `linear-gradient(hsl(24 95% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 95% 53%) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
        {/* Corner glows */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/15 via-amber-500/10 to-transparent rounded-bl-[60px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-tr-[50px] pointer-events-none" />
        {/* Scanning animation */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent animate-pulse" />
        <CardContent className="relative z-10 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="relative w-10 h-10 mx-auto mb-3">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 blur-md opacity-40 animate-pulse" />
              <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Loading Google Analytics properties...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connected but error loading properties - show as setup prompt for 403, else show error
  if (isAuthenticated && propertiesError) {
    // Extract enable-API URL from error message if present
    const apiUrlMatch = propertiesError.match(/https:\/\/console\.developers\.google\.com\/apis\/api\/analyticsadmin\.googleapis\.com\/overview\?project=\d+/);
    const enableApiUrl = apiUrlMatch?.[0];
    const is403 = propertiesError.includes("403");

    if (is403) {
      // Show as friendly setup card, not an error
      return (
        <Card className="relative overflow-hidden border-border bg-card group">
          {/* High-tech background grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `linear-gradient(hsl(24 95% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 95% 53%) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/3 to-transparent pointer-events-none animate-pulse" style={{ animationDuration: '5s' }} />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-bl-[60px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-tr-[60px] pointer-events-none" />
          <div className="absolute top-[20%] left-[8%] w-1 h-1 rounded-full bg-orange-400/50 animate-pulse" />
          <div className="absolute bottom-[30%] right-[10%] w-1.5 h-1.5 rounded-full bg-amber-400/40 animate-pulse" style={{ animationDelay: '1s' }} />
          <CardHeader className="relative z-10 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Google Analytics</span>
                    <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500">Setup Required</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">One more step to complete your connection</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Key className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-amber-600 dark:text-amber-400 mb-2">
                    Enable the Google Analytics Admin API
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your Google account is authenticated, but your Google Cloud project needs the <span className="font-medium">Analytics Admin API</span> enabled to list your GA4 properties.
                  </p>

                  <div className="flex flex-wrap gap-3 mb-4">
                    {enableApiUrl ? (
                      <Button
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        onClick={() => window.open(enableApiUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Enable API in Google Cloud
                      </Button>
                    ) : (
                      <Button
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        onClick={() => window.open('https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Enable API in Google Cloud
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="border-amber-500/30"
                      onClick={() => {
                        setPropertiesError(null);
                        setPropertiesLoaded(false);
                        fetchProperties();
                        toast({ title: "Checking again...", description: "Verifying API access." });
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>

                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Quick Steps:</span> 1. Click "Enable API in Google Cloud" → 2. Click "Enable" on the Google page → 3. Wait 2-5 minutes → 4. Click "Retry" above
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Non-403 errors: show as actual error
    return (
      <Card className="relative overflow-hidden border-border group">
        {/* High-tech background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `linear-gradient(hsl(24 95% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 95% 53%) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-bl-[60px] pointer-events-none" />
        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Google Analytics</CardTitle>
                <CardDescription className="text-xs text-destructive">Error loading properties</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
            <p className="text-sm text-destructive mb-3">{propertiesError}</p>
            <Button
              variant="outline"
              onClick={() => {
                setPropertiesError(null);
                setPropertiesLoaded(false);
                fetchProperties();
              }}
              className="border-primary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <div className="mt-3">
              <Button
                variant="ghost"
                onClick={() => {
                  handleDisconnect();
                  setTimeout(() => {
                    void handleGoogleLogin();
                  }, 50);
                }}
                className="text-muted-foreground"
              >
                Disconnect & Reconnect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connected but no properties found in account - show full onboarding wizard (same as domain not in GA)
  // This ensures new users with new domains see the complete 4-step setup flow
  if (isAuthenticated && propertiesLoaded && properties.length === 0) {
    return (
      <Card className="relative overflow-hidden border-border bg-card group">
        {/* High-tech background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `linear-gradient(hsl(24 95% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 95% 53%) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/3 to-transparent pointer-events-none animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-bl-[60px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-tr-[60px] pointer-events-none" />
        <div className="absolute top-[15%] left-[5%] w-1 h-1 rounded-full bg-orange-400/50 animate-pulse" />
        <div className="absolute bottom-[25%] right-[7%] w-1.5 h-1.5 rounded-full bg-amber-400/40 animate-pulse" style={{ animationDelay: '1s' }} />
        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Google Analytics Setup</span>
                  <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-500">Account Connected</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Complete setup to track <span className="font-medium text-foreground">{externalSelectedSite ? normalizeDomain(externalSelectedSite) : 'your domain'}</span>
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <GAOnboardingWizard
            domain={externalSelectedSite || 'your-domain.com'}
            properties={properties}
            onRefresh={handleWizardRefresh}
            isRefreshing={isWizardRefreshing}
          />
        </CardContent>
      </Card>
    );
  }

  // Properties are loaded but we're still verifying Web Data Streams for the selected domain
  if (isAuthenticated && externalSelectedSite && propertiesLoaded && !streamsLoaded && !streamsError) {
    return (
      <Card className="relative overflow-hidden bg-card border-border">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `linear-gradient(hsl(24 95% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 95% 53%) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/3 to-transparent pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-bl-[60px] pointer-events-none" />
        <CardContent className="relative z-10 flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Checking GA4 web data streams…</p>
          </div>
        </CardContent>
      </Card>
    );
  }


  // Connected but domain not in GA - show full onboarding wizard
  // Only show once streams have loaded, otherwise we might falsely prompt while still fetching streams.
  if (isAuthenticated && externalSelectedSite && propertiesLoaded && streamsLoaded && !streamsError && !isExternalSiteInGA) {
    return (
      <Card className="relative overflow-hidden border-border bg-card group">
        {/* High-tech background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `linear-gradient(hsl(24 95% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 95% 53%) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/3 to-transparent pointer-events-none animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-bl-[60px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-tr-[60px] pointer-events-none" />
        <div className="absolute top-[15%] left-[5%] w-1 h-1 rounded-full bg-orange-400/50 animate-pulse" />
        <div className="absolute bottom-[25%] right-[7%] w-1.5 h-1.5 rounded-full bg-amber-400/40 animate-pulse" style={{ animationDelay: '1s' }} />
        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Google Analytics Setup</span>
                  <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-500">Account Connected</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Complete setup to track <span className="font-medium text-foreground">{normalizeDomain(externalSelectedSite)}</span>
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <GAOnboardingWizard
            domain={externalSelectedSite}
            properties={properties}
            onRefresh={handleWizardRefresh}
            isRefreshing={isWizardRefreshing}
          />
        </CardContent>
      </Card>
    );
  }

  // Connected and domain matches - show comprehensive dashboard
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-orange-500/5 border-orange-500/20 group">
      {/* High-tech background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.03,
          backgroundImage: `linear-gradient(hsl(24 95% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 95% 53%) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
      
      {/* Animated vertical scanning line */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/8 to-transparent pointer-events-none"
        animate={{ y: ['-100%', '200%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Animated horizontal scanning line */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent pointer-events-none"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear', delay: 3 }}
      />
      
      {/* Corner accent glows - larger and more prominent */}
      <motion.div 
        className="absolute -top-10 -right-10 w-64 h-64 bg-gradient-to-bl from-orange-500/20 via-amber-500/10 to-transparent rounded-full blur-2xl pointer-events-none"
        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-tr from-amber-500/15 via-orange-500/8 to-transparent rounded-full blur-2xl pointer-events-none"
        animate={{ scale: [1.05, 1, 1.05], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      
      {/* Additional corner blob */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-orange-400/10 to-transparent rounded-br-[60px] pointer-events-none" />
      
      {/* Edge glow lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      <div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-transparent via-orange-500/20 to-transparent" />
      <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-transparent via-amber-500/20 to-transparent" />
      
      {/* Floating particles - animated */}
      <motion.div 
        className="absolute top-[12%] right-[8%] w-1.5 h-1.5 rounded-full bg-orange-400/70"
        animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div 
        className="absolute top-[28%] left-[6%] w-2 h-2 rounded-full bg-amber-400/60"
        animate={{ y: [0, -8, 0], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div 
        className="absolute bottom-[22%] right-[15%] w-1 h-1 rounded-full bg-orange-300/50"
        animate={{ y: [0, -12, 0], x: [0, 5, 0], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />
      <motion.div 
        className="absolute top-[55%] left-[12%] w-1 h-1 rounded-full bg-amber-300/40"
        animate={{ y: [0, -6, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 1.5 }}
      />
      <motion.div 
        className="absolute bottom-[35%] left-[25%] w-1.5 h-1.5 rounded-full bg-orange-500/50"
        animate={{ y: [0, -15, 0], opacity: [0.4, 0.9, 0.4], scale: [1, 1.3, 1] }}
        transition={{ duration: 3.8, repeat: Infinity, delay: 0.8 }}
      />
      
      <CardHeader className="relative z-10 py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Enhanced icon container with glow */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 blur-md opacity-50" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base bg-gradient-to-r from-orange-300 via-amber-300 to-orange-400 bg-clip-text text-transparent font-bold">
                  Google Analytics
                </CardTitle>
                <motion.span
                  className="flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-green-400" />
                  </span>
                  Connected
                </motion.span>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                {externalSelectedSite ? normalizeDomain(externalSelectedSite) : (properties.find(p => p.name === selectedProperty)?.displayName || "Traffic and engagement data")}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hidePropertySelector && properties.length > 1 && (
              <select 
                value={selectedProperty} 
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="h-8 text-xs bg-secondary/50 border border-orange-500/20 rounded-lg px-2 backdrop-blur-sm"
              >
                {properties.map(prop => (
                  <option key={prop.name} value={prop.name}>{prop.displayName}</option>
                ))}
              </select>
            )}
            <Button variant="ghost" size="sm" onClick={fetchAnalyticsData} disabled={isFetching} className="h-8 hover:bg-orange-500/10">
              <RefreshCw className={`w-3 h-3 mr-1 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDisconnect} className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-4 pt-0 px-4 pb-4">

        {/* Show inline onboarding wizard when metrics are null/empty but domain should be tracked */}
        {externalSelectedSite && (isExternalSiteInGA || !streamsLoaded) && !metrics && !isFetching && (
          <GAInlineOnboardingWizard
            domain={externalSelectedSite}
            properties={properties}
            onRefresh={handleWizardRefresh}
            isRefreshing={isWizardRefreshing}
            accessToken={accessToken}
          />
        )}

        {/* Key Metrics Grid - Enhanced with glassmorphism */}
        {(isExternalSiteInGA || !externalSelectedSite) && metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Sessions */}
          <motion.div 
            className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 via-card to-card rounded-xl p-4 border border-orange-500/20 group/card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-500/15 to-transparent rounded-bl-[40px] pointer-events-none" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent opacity-0 group-hover/card:opacity-100 pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-orange-400" />
                {metrics && metrics.sessionsChange !== 0 && (
                  <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${metrics.sessionsChange > 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                    {metrics.sessionsChange > 0 ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
                    {Math.abs(metrics.sessionsChange).toFixed(0)}%
                  </Badge>
                )}
              </div>
              <motion.p 
                className="text-2xl font-bold"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
              >
                {metrics ? formatNumber(metrics.sessions) : "—"}
              </motion.p>
              <p className="text-[10px] text-muted-foreground">Sessions</p>
            </div>
          </motion.div>

          {/* Users */}
          <motion.div 
            className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-card to-card rounded-xl p-4 border border-amber-500/20 group/card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/15 to-transparent rounded-bl-[40px] pointer-events-none" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent opacity-0 group-hover/card:opacity-100 pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-amber-400" />
                {metrics && metrics.usersChange !== 0 && (
                  <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${metrics.usersChange > 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                    {metrics.usersChange > 0 ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
                    {Math.abs(metrics.usersChange).toFixed(0)}%
                  </Badge>
                )}
              </div>
              <motion.p 
                className="text-2xl font-bold"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, type: 'spring' }}
              >
                {metrics ? formatNumber(metrics.users) : "—"}
              </motion.p>
              <p className="text-[10px] text-muted-foreground">Users ({metrics ? formatNumber(metrics.newUsers) : "—"} new)</p>
            </div>
          </motion.div>

          {/* Page Views */}
          <motion.div 
            className="relative overflow-hidden bg-gradient-to-br from-yellow-500/10 via-card to-card rounded-xl p-4 border border-yellow-500/20 group/card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-500/15 to-transparent rounded-bl-[40px] pointer-events-none" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent opacity-0 group-hover/card:opacity-100 pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Eye className="w-5 h-5 text-yellow-400" />
                {metrics && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-secondary/50 border-border/50">
                    {metrics.pagesPerSession.toFixed(1)}/sess
                  </Badge>
                )}
              </div>
              <motion.p 
                className="text-2xl font-bold"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                {metrics ? formatNumber(metrics.pageViews) : "—"}
              </motion.p>
              <p className="text-[10px] text-muted-foreground">Page Views</p>
            </div>
          </motion.div>

          {/* Avg Duration */}
          <motion.div 
            className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-card to-card rounded-xl p-4 border border-green-500/20 group/card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-green-500/15 to-transparent rounded-bl-[40px] pointer-events-none" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent opacity-0 group-hover/card:opacity-100 pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-green-400" />
                {metrics && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-secondary/50 border-border/50">
                    {metrics.engagementRate.toFixed(0)}% engaged
                  </Badge>
                )}
              </div>
              <motion.p 
                className="text-2xl font-bold"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, type: 'spring' }}
              >
                {metrics ? formatDuration(metrics.avgSessionDuration) : "—"}
              </motion.p>
              <p className="text-[10px] text-muted-foreground">Avg. Duration</p>
            </div>
          </motion.div>
        </div>
        )}

        {/* Engagement Metrics Bar - Static for performance */}
        {(isExternalSiteInGA || !externalSelectedSite) && metrics && (
        <div 
          className="relative overflow-hidden bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-yellow-500/5 rounded-xl p-4 border border-orange-500/10"
          style={{ contain: "layout" }}
        >
          {/* Subtle grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(hsl(24 95% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 95% 53%) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400/20 to-amber-400/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <span className="bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent font-semibold">
                  Engagement Overview
                </span>
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Engagement Rate</span>
                  <span className="font-semibold text-green-400">{metrics ? `${metrics.engagementRate.toFixed(1)}%` : "—"}</span>
                </div>
                <div className="relative h-2 bg-secondary/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${metrics?.engagementRate || 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Bounce Rate</span>
                  <span className="font-semibold text-amber-400">{metrics ? `${metrics.bounceRate.toFixed(1)}%` : "—"}</span>
                </div>
                <div className="relative h-2 bg-secondary/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${metrics?.bounceRate || 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Pages/Session</span>
                  <span className="font-semibold">{metrics ? metrics.pagesPerSession.toFixed(2) : "—"}</span>
                </div>
                <div className="relative h-2 bg-secondary/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-violet-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((metrics?.pagesPerSession || 0) * 20, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Sessions Chart - Enhanced */}
        {(isExternalSiteInGA || !externalSelectedSite) && chartData.length > 0 && (
          <motion.div 
            className="relative overflow-hidden bg-gradient-to-br from-orange-500/5 via-card to-amber-500/5 rounded-xl p-4 border border-orange-500/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Subtle grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.015] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(hsl(24 95% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 95% 53%) 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative z-10">
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400/20 to-amber-400/20 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <span className="bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent font-semibold">
                  Sessions & Users
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">(Last 28 Days)</span>
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={40} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(24 95% 53% / 0.3)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        boxShadow: '0 4px 20px hsl(24 95% 53% / 0.15)'
                      }} 
                    />
                    <Area type="monotone" dataKey="sessions" stroke="#f97316" fill="url(#sessionsGradient)" strokeWidth={2} />
                    <Area type="monotone" dataKey="users" stroke="#eab308" fill="url(#usersGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-3">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 shadow-sm shadow-orange-500/50" />
                  <span className="text-muted-foreground">Sessions</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 shadow-sm shadow-yellow-500/50" />
                  <span className="text-muted-foreground">Users</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}


        {/* Top Pages - Enhanced */}
        {(isExternalSiteInGA || !externalSelectedSite) && topPages.length > 0 && (
          <motion.div 
            className="relative overflow-hidden bg-gradient-to-br from-amber-500/5 via-card to-orange-500/5 rounded-xl p-4 border border-amber-500/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {/* Subtle grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.015] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(hsl(24 95% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(24 95% 53%) 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative z-10">
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-400/20 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent font-semibold">
                  Top Pages
                </span>
              </h4>
              <div className="space-y-1">
                {topPages.map((page, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg border-b border-border/30 last:border-0 hover:bg-orange-500/5 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-orange-400 font-medium w-5">{i + 1}.</span>
                      <span className="text-sm truncate max-w-[300px]">{page.path}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 bg-orange-500/10 px-2 py-1 rounded-md">
                        <Eye className="w-3 h-3 text-orange-400" />
                        <span className="text-orange-300 font-medium">{formatNumber(page.views)}</span>
                      </span>
                      <span className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-300 font-medium">{formatDuration(page.avgTime)}</span>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
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