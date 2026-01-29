import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Search, TrendingUp, MousePointer, Eye, Target,
  BarChart3, Globe, FileText, Link2, AlertTriangle, CheckCircle,
  RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, Loader2,
  ExternalLink, Key, Download, Smartphone, Monitor, Tablet,
  Image, Video, Newspaper, Sparkles, Code, Copy, Check, ChevronDown, ChevronUp, X,
  Shield, ChevronRight, CheckSquare, AlertCircle
} from "lucide-react";
import { usePopupOAuth } from "@/hooks/use-popup-oauth";
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
  loadCachedGscData,
  saveCachedGscData,
  type GscCacheData
} from "@/lib/persistentCache";
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

// Combined Google OAuth Config - includes both GSC and GA scopes for unified auth
const getGoogleClientId = () => localStorage.getItem("google_client_id") || localStorage.getItem("gsc_client_id") || localStorage.getItem("ga_client_id") || import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/webmasters",
  "https://www.googleapis.com/auth/siteverification",
  "https://www.googleapis.com/auth/analytics.readonly",
].join(" ");

type GoogleUserProfile = {
  name?: string;
  email?: string;
  picture?: string;
};

function normalizeGscDomain(v: string): string {
  return v
    .replace("sc-domain:", "")
    .replace("https://", "")
    .replace("http://", "")
    .replace(/\/$/, "");
}

function getOAuthRedirectUri(): string {
  // In Lovable preview, the app may run inside an iframe on a different origin
  // (e.g. *.lovableproject.com). Google OAuth must redirect back to the actual
  // preview/published origin (usually *.lovable.app), otherwise the callback can 404.
  const path = window.location.pathname;

  try {
    if (document.referrer) {
      const ref = new URL(document.referrer);
      // Prefer the outer preview/published host when present.
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

export interface GSCDashboardPanelProps {
  onSiteChange?: (site: string) => void;
  onDataLoaded?: (data: { clicks: number; impressions: number; position: number }) => void;
  onTrackingStatus?: (hasTracking: boolean, domain: string) => void;
  onSitesLoaded?: (sites: { siteUrl: string; permissionLevel: string }[]) => void;
  onAuthStatusChange?: (isAuthenticated: boolean) => void;
  externalSelectedSite?: string; // Allow parent to control selected site
  externalDateRange?: DateRangeType; // Optional parent-controlled date range
  hideDateSelector?: boolean; // When true, hide internal date selector UI
}

const SEARCH_TYPE_CONFIG: Record<SearchType, { label: string; icon: React.ReactNode; color: string }> = {
  web: { label: "Web", icon: <Search className="w-4 h-4" />, color: "hsl(var(--primary))" },
  image: { label: "Image", icon: <Image className="w-4 h-4" />, color: "#10b981" },
  video: { label: "Video", icon: <Video className="w-4 h-4" />, color: "#ef4444" },
  news: { label: "News", icon: <Newspaper className="w-4 h-4" />, color: "#f59e0b" },
  discover: { label: "Discover", icon: <Sparkles className="w-4 h-4" />, color: "#8b5cf6" },
};

export const GSCDashboardPanel = ({
  onSiteChange,
  onDataLoaded,
  onTrackingStatus,
  onSitesLoaded,
  onAuthStatusChange,
  externalSelectedSite,
  externalDateRange,
  hideDateSelector,
}: GSCDashboardPanelProps) => {
  const { toast } = useToast();
  const { openOAuthPopup } = usePopupOAuth();
  
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

  // Parent can control the date range (used when VI + GSC are integrated)
  useEffect(() => {
    if (!externalDateRange) return;
    if (externalDateRange !== dateRange) {
      setDateRange(externalDateRange);
    }
  }, [externalDateRange, dateRange]);
  
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
  
  // GSC Inline Verification Wizard State
  type VerificationMethod = 'META' | 'DNS_TXT' | 'ANALYTICS';
  interface GSCSetupState {
    step: 'choose-method' | 'show-token' | 'verifying' | 'verified' | 'error';
    selectedMethod: VerificationMethod | null;
    token: string | null;
    error: string | null;
    isLoading: boolean;
  }
  const [gscSetupState, setGscSetupState] = useState<GSCSetupState>({
    step: 'choose-method',
    selectedMethod: null,
    token: null,
    error: null,
    isLoading: false,
  });
  const [copiedMeta, setCopiedMeta] = useState(false);
  const [copiedDNS, setCopiedDNS] = useState(false);
  
  // Advanced reporting toggle
  const [showAdvancedReporting, setShowAdvancedReporting] = useState(true);
  
  // Data dropdown states
  const [activeDropdown, setActiveDropdown] = useState<'queries' | 'pages' | 'countries' | null>(null);
  
  // Performance by Source expanded state - open by default with WEB selected
  const [showSourceDetails, setShowSourceDetails] = useState(true);
  
  // Helper functions for GSC verification
  const getMetaTag = (token?: string) => 
    `<meta name="google-site-verification" content="${token || gscSetupState.token || 'YOUR_TOKEN'}" />`;
  const getDNSRecord = (token?: string) => 
    `google-site-verification=${token || gscSetupState.token || 'YOUR_TOKEN'}`;
  
  const copyMetaTag = async () => {
    await navigator.clipboard.writeText(getMetaTag());
    setCopiedMeta(true);
    setTimeout(() => setCopiedMeta(false), 2000);
    toast({ title: "Copied!", description: "Meta tag copied to clipboard" });
  };
  
  const copyDNSRecord = async () => {
    await navigator.clipboard.writeText(getDNSRecord());
    setCopiedDNS(true);
    setTimeout(() => setCopiedDNS(false), 2000);
    toast({ title: "Copied!", description: "DNS record copied to clipboard" });
  };
  
  // GSC verification handlers
  const handleSelectVerificationMethod = async (method: VerificationMethod) => {
    if (!accessToken || !externalSelectedSite) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Google account first",
        variant: "destructive",
      });
      return;
    }

    const siteUrl = `https://${normalizeGscDomain(externalSelectedSite)}/`;
    setGscSetupState(prev => ({ ...prev, selectedMethod: method, isLoading: true, error: null }));

    try {
      // First, add the site to GSC
      console.log(`[GSC Panel] Adding site: ${siteUrl}`);
      const addResult = await supabase.functions.invoke("search-console", {
        body: { action: 'addSite', accessToken, siteUrl },
      });

      if (addResult.error) {
        throw new Error(addResult.error.message || "Failed to add site");
      }

      // Now get the verification token
      console.log(`[GSC Panel] Getting token for method: ${method}`);
      const tokenResult = await supabase.functions.invoke("search-console", {
        body: { action: 'getVerificationToken', accessToken, siteUrl, verificationType: method },
      });

      if (tokenResult.error || !tokenResult.data?.success) {
        throw new Error(tokenResult.data?.error || tokenResult.error?.message || "Failed to get verification token");
      }

      setGscSetupState(prev => ({
        ...prev,
        step: 'show-token',
        token: tokenResult.data.token,
        isLoading: false,
      }));

      toast({
        title: "Site Added to Search Console!",
        description: `Now add the verification code to your ${method === 'META' ? 'website' : method === 'DNS_TXT' ? 'DNS settings' : 'Google Analytics'}`,
      });
    } catch (err) {
      console.error("[GSC Panel] Error:", err);
      setGscSetupState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to setup verification",
        isLoading: false,
      }));
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to setup verification",
        variant: "destructive",
      });
    }
  };

  const handleVerifySite = async () => {
    if (!accessToken || !gscSetupState.selectedMethod || !externalSelectedSite) {
      return;
    }

    const siteUrl = `https://${normalizeGscDomain(externalSelectedSite)}/`;
    setGscSetupState(prev => ({ ...prev, step: 'verifying', isLoading: true, error: null }));

    try {
      console.log(`[GSC Panel] Verifying site: ${siteUrl} with method: ${gscSetupState.selectedMethod}`);
      const verifyResult = await supabase.functions.invoke("search-console", {
        body: { 
          action: 'verifySite', 
          accessToken, 
          siteUrl,
          verificationType: gscSetupState.selectedMethod,
        },
      });

      if (verifyResult.error || !verifyResult.data?.success) {
        throw new Error(verifyResult.data?.error || verifyResult.error?.message || "Verification failed");
      }

      if (verifyResult.data.verified) {
        setGscSetupState(prev => ({ ...prev, step: 'verified', isLoading: false }));
        toast({
          title: "✓ Domain Verified!",
          description: `${normalizeGscDomain(externalSelectedSite)} is now verified in Google Search Console`,
        });
        
        // Trigger refresh to reload sites
        setTimeout(() => {
          fetchSites();
        }, 1500);
      } else {
        throw new Error("Verification not confirmed. Please ensure you've added the verification code correctly.");
      }
    } catch (err) {
      console.error("[GSC Panel] Verify error:", err);
      setGscSetupState(prev => ({
        ...prev,
        step: 'show-token',
        error: err instanceof Error ? err.message : "Verification failed",
        isLoading: false,
      }));
      toast({
        title: "Verification Failed",
        description: err instanceof Error ? err.message : "Please ensure you've added the verification code correctly",
        variant: "destructive",
      });
    }
  };

  const handleResetVerification = () => {
    setGscSetupState({
      step: 'choose-method',
      selectedMethod: null,
      token: null,
      error: null,
      isLoading: false,
    });
  };
  
  // Reset GSC setup state when domain changes
  useEffect(() => {
    setGscSetupState({
      step: 'choose-method',
      selectedMethod: null,
      token: null,
      error: null,
      isLoading: false,
    });
  }, [externalSelectedSite]);
  
  // Check if the externally selected site is in GSC
  const isExternalSiteInGsc = useMemo(() => {
    if (!externalSelectedSite) return true; // No site selected
    if (!isAuthenticated) return true; // Not authenticated, can't check
    if (sites.length === 0) return true; // Sites not loaded yet
    const normalizedExternal = normalizeGscDomain(externalSelectedSite);
    return sites.some(site => normalizeGscDomain(site.siteUrl) === normalizedExternal);
  }, [externalSelectedSite, sites, isAuthenticated]);

  const storeGoogleProfile = useCallback((profile: GoogleUserProfile | null) => {
    if (!profile) return;

    try {
      const minimal: GoogleUserProfile = {
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      };
      localStorage.setItem("gsc_google_profile", JSON.stringify(minimal));
      window.dispatchEvent(new CustomEvent("gsc-profile-updated", { detail: { profile: minimal } }));
    } catch {
      // ignore
    }
  }, []);

  const fetchAndStoreGoogleProfile = useCallback(async (token: string) => {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const profile = (await res.json()) as GoogleUserProfile;
      storeGoogleProfile(profile);
    } catch {
      // ignore
    }
  }, [storeGoogleProfile]);

  // Check for stored token on mount and handle OAuth callback
  useEffect(() => {
    const checkStoredToken = () => {
      // Check for GSC-specific token first
      let storedToken = localStorage.getItem("gsc_access_token");
      let tokenExpiry = localStorage.getItem("gsc_token_expiry");
      
      // Fall back to unified Google token from auth callback
      if (!storedToken || !tokenExpiry) {
        storedToken = localStorage.getItem("unified_google_token");
        tokenExpiry = localStorage.getItem("unified_google_expiry");
        
        // If unified token found, sync to GSC keys
        if (storedToken && tokenExpiry) {
          localStorage.setItem("gsc_access_token", storedToken);
          localStorage.setItem("gsc_token_expiry", tokenExpiry);
        }
      }
      
      if (storedToken && tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry);
        const timeRemaining = expiryTime - Date.now();
        
        if (timeRemaining > 0) {
          setAccessToken(storedToken);
          setIsAuthenticated(true);
          setIsLoading(false);
          
          // Dispatch sync event so other panels get notified
          window.dispatchEvent(new CustomEvent("google-auth-synced", {
            detail: { access_token: storedToken, expiry: expiryTime }
          }));
          
          return true;
        } else {
          localStorage.removeItem("gsc_access_token");
          localStorage.removeItem("gsc_token_expiry");
          localStorage.removeItem("unified_google_token");
          localStorage.removeItem("unified_google_expiry");
          toast({
            title: "Session Expired",
            description: "Your Google Search Console session has expired. Please reconnect.",
            variant: "default",
          });
        }
      }
      return false;
    };
    
    // Listen for cross-panel auth sync
    const handleAuthSync = (e: CustomEvent) => {
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
    
    // OAuth callback handling
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    
    console.log("[GSC] OAuth callback check:", { 
      hasCode: !!code, 
      hasError: !!error,
      pathname: window.location.pathname,
      hasVerifier: !!localStorage.getItem("gsc_code_verifier")
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
      const verifier = localStorage.getItem("gsc_code_verifier");
      const redirectUri = getOAuthRedirectUri();
      
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
          const tokenRes = await supabase.functions.invoke("google-oauth-token", {
            body: { code, codeVerifier: verifier, redirectUri },
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
            
            // Store for GSC
            localStorage.setItem("gsc_access_token", tokenJson.access_token);
            localStorage.setItem("gsc_token_expiry", expiry.toString());
            localStorage.removeItem("gsc_code_verifier");
            
            // Also sync to GA storage for unified auth experience
            localStorage.setItem("ga_access_token", tokenJson.access_token);
            localStorage.setItem("ga_token_expiry", expiry.toString());
            localStorage.removeItem("ga_code_verifier");
            
            setAccessToken(tokenJson.access_token);
            setIsAuthenticated(true);

            // Non-blocking: store Google profile (avatar/email/name) for UI display.
            void fetchAndStoreGoogleProfile(tokenJson.access_token);
            
            toast({
              title: "Google Connected",
              description: "Successfully connected Analytics and Search Console",
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
          localStorage.removeItem("gsc_code_verifier");
          window.history.replaceState({}, document.title, window.location.pathname);
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      setIsLoading(false);
    }
    
    return () => {
      window.removeEventListener("google-auth-synced", handleAuthSync as EventListener);
    };
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
      // Only notify parent if this wasn't an external update (prevents loop)
      if (isExternalUpdateRef.current) {
        isExternalUpdateRef.current = false;
      } else {
        onSiteChange?.(selectedSite);
      }
      
      // Always check tracking status
      checkTrackingStatus(selectedSite);
    }
  }, [selectedSite, onSiteChange]);

  // Check if domain has tracking code installed (by checking for visitor sessions from that domain)
  const checkTrackingStatus = async (siteUrl: string) => {
    const cleanDomain = normalizeGscDomain(siteUrl);
    
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

  // Track previous site to detect changes and clear stale data
  const prevSelectedSiteRef = useRef<string>("");
  
  // Clear all data immediately when site changes to prevent showing stale data
  useEffect(() => {
    if (selectedSite && selectedSite !== prevSelectedSiteRef.current) {
      console.log('[GSC] Site changed from', prevSelectedSiteRef.current, 'to', selectedSite, '- clearing cached data');
      
      // Clear all performance data immediately
      setQueryData([]);
      setPageData([]);
      setCountryData([]);
      setDeviceData([]);
      setDateData([]);
      setSitemaps([]);
      
      // Reset all-types aggregated data
      setAllTypesData({
        web: { clicks: 0, impressions: 0, position: 0 },
        image: { clicks: 0, impressions: 0, position: 0 },
        video: { clicks: 0, impressions: 0, position: 0 },
        news: { clicks: 0, impressions: 0, position: 0 },
        discover: { clicks: 0, impressions: 0, position: 0 },
      });
      
      // Clear the data cache for the old site
      dataCache.current.clear();
      
      prevSelectedSiteRef.current = selectedSite;
    }
  }, [selectedSite]);

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

  // Handle OAuth code exchange (called from popup callback)
  const handleOAuthCodeExchange = useCallback(async (code: string) => {
    const verifier = localStorage.getItem("gsc_code_verifier");
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

      const { access_token, expires_in, scope, id_token } = tokenRes.data;

      if (typeof scope === "string" && !scope.includes("webmasters")) {
        throw new Error("Google granted no Search Console permissions. Please reconnect and approve the Search Console access request.");
      }

      const expiryTime = Date.now() + (expires_in || 3600) * 1000;
      
      // Store for GSC
      localStorage.setItem("gsc_access_token", access_token);
      localStorage.setItem("gsc_token_expiry", expiryTime.toString());
      localStorage.removeItem("gsc_code_verifier");
      
      // Sync to GA for unified auth
      localStorage.setItem("ga_access_token", access_token);
      localStorage.setItem("ga_token_expiry", expiryTime.toString());
      localStorage.removeItem("ga_code_verifier");
      
      // Dispatch event to notify GA panel
      window.dispatchEvent(new CustomEvent("google-auth-synced", { 
        detail: { access_token, expiry: expiryTime } 
      }));

      // Extract profile from id_token if available
      if (id_token) {
        try {
          const payloadBase64 = id_token.split(".")[1];
          const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
          const payload = JSON.parse(payloadJson);
          const profile: GoogleUserProfile = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
          };
          localStorage.setItem("gsc_google_profile", JSON.stringify(profile));
          window.dispatchEvent(new CustomEvent("gsc-profile-updated", { detail: { profile } }));
        } catch {
          // Could not decode id_token
        }
      }
      
      setAccessToken(access_token);
      setIsAuthenticated(true);
      
      toast({
        title: "Google Connected",
        description: "Successfully connected Analytics and Search Console.",
      });
    } catch (error: any) {
      console.error("[GSC] Token exchange error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Google Search Console.",
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
      localStorage.setItem("gsc_code_verifier", verifier);
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
      authUrl.searchParams.set("state", "gsc");
      
      // Use popup instead of redirect
      const opened = openOAuthPopup({
        authUrl: authUrl.toString(),
        popupName: "gsc_oauth",
        onSuccess: (code) => {
          void handleOAuthCodeExchange(code);
        },
        onError: (error) => {
          console.error("[GSC] OAuth popup error:", error);
          toast({
            title: "Authentication Error",
            description: error === "access_denied" 
              ? "You denied access to Google Search Console." 
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
    localStorage.removeItem("gsc_access_token");
    localStorage.removeItem("gsc_token_expiry");
    localStorage.removeItem("gsc_google_profile");
    localStorage.removeItem("gsc_code_verifier");
    window.dispatchEvent(new CustomEvent("gsc-profile-updated", { detail: { profile: null } }));
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
      
      // Check for authentication errors in response
      if (response.data?.error?.status === "UNAUTHENTICATED" || 
          response.data?.error?.code === 401) {
        localStorage.removeItem("gsc_access_token");
        localStorage.removeItem("gsc_token_expiry");
        setAccessToken(null);
        setIsAuthenticated(false);
        toast({
          title: "Session Expired",
          description: "Your Google Search Console session has expired. Please reconnect.",
          variant: "destructive",
        });
        return;
      }
      
      const siteEntries = response.data?.siteEntry || [];
      setSites(siteEntries);
      
      // Notify parent of loaded sites
      onSitesLoaded?.(siteEntries);
      
      if (siteEntries.length > 0 && !selectedSite) {
        // Use external selection if provided, otherwise default to first site
        const siteToSelect = externalSelectedSite && externalSelectedSite !== "" ? externalSelectedSite : siteEntries[0].siteUrl;
        setSelectedSite(siteToSelect);
      }
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  // Sync with external selected site - only update internal state, don't trigger onSiteChange
  const isExternalUpdateRef = useRef(false);
  
  useEffect(() => {
    // Parent can intentionally clear the selection (e.g. user selected a tracking-only domain).
    if (externalSelectedSite === "") {
      if (selectedSite !== "") {
        console.log("[GSC Panel] Clearing selection - parent set empty");
        isExternalUpdateRef.current = true;
        setSelectedSite("");
        // Clear cached UI so we don't show the last site's data.
        setQueryData([]);
        setPageData([]);
        setCountryData([]);
        setDeviceData([]);
        setDateData([]);
        setSitemaps([]);
        setAllTypesData({
          web: { clicks: 0, impressions: 0, position: 0 },
          image: { clicks: 0, impressions: 0, position: 0 },
          video: { clicks: 0, impressions: 0, position: 0 },
          news: { clicks: 0, impressions: 0, position: 0 },
          discover: { clicks: 0, impressions: 0, position: 0 },
        });
        dataCache.current.clear();
      }
      return;
    }

    // If parent provides an external site, ALWAYS use it (don't wait for sites to load)
    // This ensures immediate sync when user selects from header dropdown
    if (externalSelectedSite && externalSelectedSite !== selectedSite) {
      console.log("[GSC Panel] Syncing to external site:", externalSelectedSite, "from:", selectedSite);
      isExternalUpdateRef.current = true;
      setSelectedSite(externalSelectedSite);
      
      // Clear old data immediately to prevent showing stale data
      setQueryData([]);
      setPageData([]);
      setCountryData([]);
      setDeviceData([]);
      setDateData([]);
      setSitemaps([]);
      setAllTypesData({
        web: { clicks: 0, impressions: 0, position: 0 },
        image: { clicks: 0, impressions: 0, position: 0 },
        video: { clicks: 0, impressions: 0, position: 0 },
        news: { clicks: 0, impressions: 0, position: 0 },
        discover: { clicks: 0, impressions: 0, position: 0 },
      });
      dataCache.current.clear();
    }
  }, [externalSelectedSite, selectedSite]);

  // Notify parent of auth status changes
  useEffect(() => {
    onAuthStatusChange?.(isAuthenticated);
  }, [isAuthenticated, onAuthStatusChange]);

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
    
    // Check for authentication errors
    if (response.data?.error?.status === "UNAUTHENTICATED" || 
        response.data?.error?.code === 401) {
      console.log("[GSC] Token invalid during performance fetch");
      localStorage.removeItem("gsc_access_token");
      localStorage.removeItem("gsc_token_expiry");
      setAccessToken(null);
      setIsAuthenticated(false);
      toast({
        title: "Session Expired",
        description: "Your Google Search Console session has expired. Please reconnect.",
        variant: "destructive",
      });
      return null;
    }
    
    return response.data;
  }, [accessToken, selectedSite, dateRange, toast]);

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

  

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden bg-card border-border/60">
        {/* VI Dashboard Effects */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.03,
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-bl from-cyan-500/15 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-violet-500/15 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        <CardContent className="relative z-10 flex items-center justify-center py-8">
          <div className="text-center">
            <div className="relative w-10 h-10 mx-auto mb-3">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 blur-md opacity-40 animate-pulse" />
              <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Connecting...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not connected - show connect prompt
  if (!isAuthenticated) {
    return (
      <>
        <Card className="relative overflow-hidden bg-card border-border h-full flex flex-col group">
          {/* VI Dashboard Effects - Grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.03,
              backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
          
          {/* Corner gradient blobs - matching VI dashboard */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-bl from-cyan-500/15 via-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-gradient-to-tr from-violet-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          {/* Scanning lines */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
          
          {/* Floating particles */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/30 animate-pulse pointer-events-none"
              style={{ top: `${20 + i * 15}%`, left: `${10 + (i % 2) * 75}%`, animationDelay: `${i * 0.5}s` }}
            />
          ))}
          
          <CardContent className="relative z-10 py-8 flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm mx-auto">
              <div className="relative w-14 h-14 mx-auto mb-4">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 blur-lg opacity-40" />
                <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Connect Search Console</h3>
              <p className="text-muted-foreground text-xs mb-4">
                Link to see clicks, impressions, and rankings.
              </p>
              <Button onClick={handleGoogleLogin} size="sm" className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 shadow-lg shadow-cyan-500/20">
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Connect
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
      <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-cyan-500/5 border-cyan-500/20 group">
        {/* VI Dashboard Effects - Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.03,
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
        
        {/* Animated vertical scanning line */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/8 to-transparent pointer-events-none"
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Animated horizontal scanning line */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/5 to-transparent pointer-events-none"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'linear', delay: 3 }}
        />
        
        {/* Corner gradient blobs - larger and animated */}
        <motion.div 
          className="absolute -top-16 -right-16 w-72 h-72 bg-gradient-to-bl from-cyan-500/20 via-primary/10 to-transparent rounded-full blur-2xl pointer-events-none"
          animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute -bottom-12 -left-12 w-56 h-56 bg-gradient-to-tr from-violet-500/18 via-cyan-500/8 to-transparent rounded-full blur-2xl pointer-events-none"
          animate={{ scale: [1.05, 1, 1.05], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        
        {/* Additional corner blob */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-br-[60px] pointer-events-none" />
        
        {/* Edge glow lines */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
        <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-transparent via-violet-500/20 to-transparent" />
        
        {/* Floating particles - animated */}
        <motion.div 
          className="absolute top-[10%] right-[8%] w-1.5 h-1.5 rounded-full bg-cyan-400/70"
          animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-[22%] left-[6%] w-2 h-2 rounded-full bg-violet-400/60"
          animate={{ y: [0, -8, 0], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div 
          className="absolute bottom-[18%] right-[12%] w-1 h-1 rounded-full bg-cyan-300/50"
          animate={{ y: [0, -12, 0], x: [0, 5, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />
        <motion.div 
          className="absolute top-[45%] left-[10%] w-1 h-1 rounded-full bg-violet-300/40"
          animate={{ y: [0, -6, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 1.5 }}
        />
        <motion.div 
          className="absolute bottom-[30%] left-[22%] w-1.5 h-1.5 rounded-full bg-cyan-500/50"
          animate={{ y: [0, -15, 0], opacity: [0.4, 0.9, 0.4], scale: [1, 1.3, 1] }}
          transition={{ duration: 3.8, repeat: Infinity, delay: 0.8 }}
        />
        <motion.div 
          className="absolute top-[65%] right-[5%] w-1 h-1 rounded-full bg-primary/40"
          animate={{ y: [0, -8, 0], x: [0, -4, 0], opacity: [0.25, 0.6, 0.25] }}
          transition={{ duration: 4.2, repeat: Infinity, delay: 2 }}
        />
        
        {/* Compact Header */}
        <CardHeader className="relative z-10 py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Enhanced icon container with glow */}
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 blur-md opacity-50" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base bg-gradient-to-r from-cyan-300 via-primary to-violet-400 bg-clip-text text-transparent font-bold">
                    Search Console
                  </CardTitle>
                  <motion.span
                    className="flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-cyan-400" />
                    </span>
                    LIVE
                  </motion.span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDisconnect} className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10 space-y-3 pt-0 px-4 pb-4">
{/* Domain Not in GSC - Inline Verification Wizard */}
          {isAuthenticated && externalSelectedSite && !isExternalSiteInGsc && sites.length > 0 && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-secondary/30 border border-amber-500/30">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground mb-0.5">
                      {gscSetupState.step === 'verified' ? 'Domain Verified!' : 'Verify Domain in Google Search Console'}
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      <span className="text-amber-400 font-medium">{normalizeGscDomain(externalSelectedSite)}</span> must be verified in GSC to track search performance
                    </p>
                  </div>
                </div>

                {/* Step 1: Choose Verification Method */}
                {gscSetupState.step === 'choose-method' && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Choose your preferred verification method:
                    </p>

                    {/* Method Options */}
                    <div className="space-y-2">
                      {/* Meta Tag Option */}
                      <button
                        onClick={() => handleSelectVerificationMethod('META')}
                        disabled={gscSetupState.isLoading}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all text-left group disabled:opacity-50"
                      >
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                          <Code className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">HTML Meta Tag</span>
                            <Badge className="text-[8px] py-0 h-3.5 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Recommended</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Add a meta tag to your homepage</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                      </button>

                      {/* DNS TXT Option */}
                      <button
                        onClick={() => handleSelectVerificationMethod('DNS_TXT')}
                        disabled={gscSetupState.isLoading}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 transition-all text-left group disabled:opacity-50"
                      >
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-violet-400" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-medium text-foreground block">DNS TXT Record</span>
                          <p className="text-[10px] text-muted-foreground">Add a TXT record to your DNS settings</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                      </button>

                      {/* Google Analytics Option */}
                      <button
                        onClick={() => handleSelectVerificationMethod('ANALYTICS')}
                        disabled={gscSetupState.isLoading}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-left group disabled:opacity-50"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-medium text-foreground block">Google Analytics</span>
                          <p className="text-[10px] text-muted-foreground">Use existing GA tracking code</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition-colors" />
                      </button>
                    </div>

                    {gscSetupState.isLoading && (
                      <div className="flex items-center justify-center gap-2 p-3">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                        <span className="text-xs text-muted-foreground">Adding site to Search Console...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Show Token and Instructions */}
                {gscSetupState.step === 'show-token' && (
                  <div className="space-y-3">
                    {/* Back Button */}
                    <button
                      onClick={handleResetVerification}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronRight className="w-3 h-3 rotate-180" />
                      Change method
                    </button>

                    {/* Method-specific instructions */}
                    {gscSetupState.selectedMethod === 'META' && (
                      <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Code className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-medium text-cyan-400">Add this meta tag to your &lt;head&gt;</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-[9px] font-mono text-cyan-300 bg-zinc-900/80 p-2 rounded overflow-x-auto">
                            {getMetaTag()}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 hover:bg-cyan-500/10"
                            onClick={copyMetaTag}
                          >
                            {copiedMeta ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {gscSetupState.selectedMethod === 'DNS_TXT' && (
                      <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-violet-400" />
                          <span className="text-xs font-medium text-violet-400">Add this TXT record to your DNS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-[9px] font-mono text-violet-300 bg-zinc-900/80 p-2 rounded overflow-x-auto">
                            {getDNSRecord()}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 hover:bg-violet-500/10"
                            onClick={copyDNSRecord}
                          >
                            {copiedDNS ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-2">
                          DNS changes may take up to 72 hours to propagate
                        </p>
                      </div>
                    )}

                    {gscSetupState.selectedMethod === 'ANALYTICS' && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-medium text-amber-400">Google Analytics Verification</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Ensure Google Analytics tracking code is installed on your homepage. 
                          The verification will use your existing GA implementation.
                        </p>
                      </div>
                    )}

                    {/* Error Display */}
                    {gscSetupState.error && (
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <p className="text-[10px] text-red-400">{gscSetupState.error}</p>
                      </div>
                    )}

                    {/* Verify Button */}
                    <Button
                      size="sm"
                      className="h-9 text-xs bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white w-full"
                      onClick={handleVerifySite}
                      disabled={gscSetupState.isLoading}
                    >
                      {gscSetupState.isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Verify Ownership
                    </Button>
                  </div>
                )}

                {/* Step 3: Verifying */}
                {gscSetupState.step === 'verifying' && (
                  <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    <p className="text-xs text-muted-foreground">Verifying domain ownership...</p>
                  </div>
                )}

                {/* Step 4: Verified */}
                {gscSetupState.step === 'verified' && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-green-400">Domain Verified!</h4>
                        <p className="text-[10px] text-muted-foreground">
                          {normalizeGscDomain(externalSelectedSite)} is now verified. Loading data...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-green-500" />
                      <span className="text-[10px] text-muted-foreground">Refreshing Search Console data...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Only show dashboard content if domain is found in GSC */}
          {(isExternalSiteInGsc || !externalSelectedSite || sites.length === 0) && (
            <>
          {/* Controls - Enhanced with glassmorphism */}
          <motion.div 
            className="relative overflow-hidden flex flex-nowrap gap-3 items-center justify-end bg-gradient-to-r from-cyan-500/5 via-secondary/30 to-violet-500/5 rounded-xl p-3 min-h-[48px] border border-cyan-500/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Subtle shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            />
            <div className="relative z-10 flex flex-nowrap gap-3 items-center justify-end w-full">
              {/* Left side - Date selector only (domain controlled by header)
                  Hidden when parent integrates the date range (VI+GSC). */}
              {!hideDateSelector && (
                <div className="flex items-center gap-2 flex-shrink-0 mr-auto">
                  <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeType)}>
                    <SelectTrigger className="w-[110px] h-8 text-xs bg-background/50 border-cyan-500/20 backdrop-blur-sm">
                      <Calendar className="w-3 h-3 mr-1 text-cyan-400" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="28">28 days</SelectItem>
                      <SelectItem value="90">3 months</SelectItem>
                      <SelectItem value="180">6 months</SelectItem>
                      <SelectItem value="365">12 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Data dropdowns */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button 
                  variant={activeDropdown === 'queries' ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setActiveDropdown(activeDropdown === 'queries' ? null : 'queries')}
                  className={`h-8 text-xs hover:bg-cyan-500/10 ${activeDropdown === 'queries' ? 'bg-cyan-500/20 border-cyan-500/30' : ''}`}
                >
                  <Search className="w-3 h-3 mr-1 text-cyan-400" />
                  Queries
                  {activeDropdown === 'queries' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                </Button>
                <Button 
                  variant={activeDropdown === 'pages' ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setActiveDropdown(activeDropdown === 'pages' ? null : 'pages')}
                  className={`h-8 text-xs hover:bg-violet-500/10 ${activeDropdown === 'pages' ? 'bg-violet-500/20 border-violet-500/30' : ''}`}
                >
                  <FileText className="w-3 h-3 mr-1 text-violet-400" />
                  Pages
                  {activeDropdown === 'pages' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                </Button>
                <Button 
                  variant={activeDropdown === 'countries' ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setActiveDropdown(activeDropdown === 'countries' ? null : 'countries')}
                  className={`h-8 text-xs hover:bg-emerald-500/10 ${activeDropdown === 'countries' ? 'bg-emerald-500/20 border-emerald-500/30' : ''}`}
                >
                  <Globe className="w-3 h-3 mr-1 text-emerald-400" />
                  Countries
                  {activeDropdown === 'countries' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                </Button>
              </div>

              {/* Spacer to push refresh to right */}
              <div className="flex-1" />

              {/* Refresh button - right justified */}
              <Button variant="ghost" size="sm" onClick={() => { fetchAllData(true); fetchAllTypesData(); fetchSites(); }} disabled={isFetching || isLoadingAllTypes} className="h-8 flex-shrink-0 hover:bg-cyan-500/10">
                <RefreshCw className={`w-3 h-3 mr-1 ${isFetching || isLoadingAllTypes ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* Compact Dropdown Panels */}
          {activeDropdown === 'queries' && (
            <div className="bg-secondary/20 rounded-lg p-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium">Top Keywords</span>
                  <Badge variant="secondary" className="text-[9px] h-4">{queryData.length}</Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground" />
                  <Input placeholder="Filter..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="pl-6 h-6 text-[10px] w-24" />
                </div>
              </div>
              <div className="max-h-[180px] overflow-y-auto">
                <table className="w-full text-[10px]">
                  <thead className="sticky top-0 bg-secondary/80">
                    <tr className="text-muted-foreground">
                      <th className="text-left py-1 px-2">#</th>
                      <th className="text-left py-1 px-2">Keyword</th>
                      <th className="text-right py-1 px-1">Clicks</th>
                      <th className="text-right py-1 px-1">Imp</th>
                      <th className="text-right py-1 px-1">Pos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQueryData.slice(0, 15).map((row, i) => (
                      <tr key={i} className="border-t border-border/30 hover:bg-secondary/30">
                        <td className="py-1 px-2 text-muted-foreground">{i + 1}</td>
                        <td className="py-1 px-2 truncate max-w-[150px]" title={row.keys[0]}>{row.keys[0]}</td>
                        <td className="py-1 px-1 text-right font-medium text-primary">{formatNumber(row.clicks)}</td>
                        <td className="py-1 px-1 text-right text-muted-foreground">{formatNumber(row.impressions)}</td>
                        <td className={`py-1 px-1 text-right font-medium ${row.position <= 3 ? 'text-green-500' : row.position <= 10 ? 'text-amber-500' : ''}`}>{row.position.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredQueryData.length === 0 && <p className="text-center py-4 text-muted-foreground text-xs">{isFetching ? "Loading..." : "No data"}</p>}
              </div>
            </div>
          )}

          {activeDropdown === 'pages' && (
            <div className="bg-secondary/20 rounded-lg p-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="text-xs font-medium">Top Pages</span>
                  <Badge variant="secondary" className="text-[9px] h-4">{pageData.length}</Badge>
                </div>
              </div>
              <div className="max-h-[180px] overflow-y-auto">
                <table className="w-full text-[10px]">
                  <thead className="sticky top-0 bg-secondary/80">
                    <tr className="text-muted-foreground">
                      <th className="text-left py-1 px-2">#</th>
                      <th className="text-left py-1 px-2">Page</th>
                      <th className="text-right py-1 px-1">Clicks</th>
                      <th className="text-right py-1 px-1">Imp</th>
                      <th className="text-right py-1 px-1">Pos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.slice(0, 15).map((row, i) => {
                      let path = row.keys[0];
                      try { path = new URL(row.keys[0]).pathname || "/"; } catch {}
                      return (
                        <tr key={i} className="border-t border-border/30 hover:bg-secondary/30">
                          <td className="py-1 px-2 text-muted-foreground">{i + 1}</td>
                          <td className="py-1 px-2 truncate max-w-[150px]" title={path}>{path}</td>
                          <td className="py-1 px-1 text-right font-medium text-cyan-500">{formatNumber(row.clicks)}</td>
                          <td className="py-1 px-1 text-right text-muted-foreground">{formatNumber(row.impressions)}</td>
                          <td className={`py-1 px-1 text-right font-medium ${row.position <= 3 ? 'text-green-500' : row.position <= 10 ? 'text-amber-500' : ''}`}>{row.position.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {pageData.length === 0 && <p className="text-center py-4 text-muted-foreground text-xs">{isFetching ? "Loading..." : "No data"}</p>}
              </div>
            </div>
          )}

          {activeDropdown === 'countries' && (
            <div className="bg-secondary/20 rounded-lg p-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-xs font-medium">Top Countries</span>
                  <Badge variant="secondary" className="text-[9px] h-4">{countryData.length}</Badge>
                </div>
              </div>
              <div className="max-h-[180px] overflow-y-auto">
                <table className="w-full text-[10px]">
                  <thead className="sticky top-0 bg-secondary/80">
                    <tr className="text-muted-foreground">
                      <th className="text-left py-1 px-2">#</th>
                      <th className="text-left py-1 px-2">Country</th>
                      <th className="text-right py-1 px-1">Clicks</th>
                      <th className="text-right py-1 px-1">Imp</th>
                      <th className="text-right py-1 px-1">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countryData.slice(0, 15).map((row, i) => {
                      const code = row.keys[0].toLowerCase();
                      const totalClicks = countryData.reduce((sum, c) => sum + c.clicks, 0);
                      const pct = totalClicks > 0 ? (row.clicks / totalClicks) * 100 : 0;
                      const names: Record<string, string> = { usa: 'USA', gbr: 'UK', can: 'Canada', aus: 'Australia', deu: 'Germany', fra: 'France', esp: 'Spain', ita: 'Italy', ind: 'India', jpn: 'Japan', bra: 'Brazil', mex: 'Mexico' };
                      return (
                        <tr key={i} className="border-t border-border/30 hover:bg-secondary/30">
                          <td className="py-1 px-2 text-muted-foreground">{i + 1}</td>
                          <td className="py-1 px-2">{names[code] || code.toUpperCase()}</td>
                          <td className="py-1 px-1 text-right font-medium text-violet-500">{formatNumber(row.clicks)}</td>
                          <td className="py-1 px-1 text-right text-muted-foreground">{formatNumber(row.impressions)}</td>
                          <td className="py-1 px-1 text-right">{pct.toFixed(0)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {countryData.length === 0 && <p className="text-center py-4 text-muted-foreground text-xs">{isFetching ? "Loading..." : "No data"}</p>}
              </div>
            </div>
          )}

          {/* Compact Combined Section: Devices + Sources - Enhanced */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Device Breakdown - Enhanced with glassmorphism */}
            <motion.div 
              className="relative overflow-hidden bg-gradient-to-br from-amber-500/5 via-card to-orange-500/5 rounded-xl p-3 border border-amber-500/15"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Subtle grid pattern */}
              <div 
                className="absolute inset-0 opacity-[0.015] pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(hsl(38 92% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(38 92% 50%) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }}
              />
              {/* Corner glow */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-500/15 to-transparent rounded-bl-[40px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-400/20 flex items-center justify-center">
                    <Monitor className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="text-xs font-semibold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">Devices</span>
                </div>
                <div className="flex gap-2">
                  {(['DESKTOP', 'MOBILE', 'TABLET'] as const).map((deviceType, idx) => {
                    const device = deviceData.find(d => d.keys[0] === deviceType);
                    const clicks = device?.clicks || 0;
                    const totalClicks = deviceData.reduce((sum, d) => sum + d.clicks, 0);
                    const pct = totalClicks > 0 ? (clicks / totalClicks) * 100 : 0;
                    const Icon = deviceType === 'DESKTOP' ? Monitor : deviceType === 'MOBILE' ? Smartphone : Tablet;
                    const colors = ['amber', 'orange', 'yellow'];
                    
                    return (
                      <motion.div 
                        key={deviceType} 
                        className={`relative overflow-hidden flex-1 bg-gradient-to-br from-${colors[idx]}-500/10 to-card rounded-xl p-3 text-center border border-${colors[idx]}-500/20 group/device`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + idx * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent opacity-0 group-hover/device:opacity-100 pointer-events-none"
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2.5, repeat: Infinity }}
                        />
                        <Icon className="w-5 h-5 mx-auto mb-1.5 text-amber-400" />
                        <motion.p 
                          className="text-lg font-bold"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.25 + idx * 0.05, type: 'spring' }}
                        >
                          {isFetching ? "—" : `${pct.toFixed(0)}%`}
                        </motion.p>
                        <p className="text-[9px] text-muted-foreground capitalize">{deviceType.toLowerCase()}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Performance by Source - Enhanced with glassmorphism */}
            <motion.div 
              className="relative overflow-hidden bg-gradient-to-br from-violet-500/5 via-card to-cyan-500/5 rounded-xl p-3 border border-violet-500/15"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Subtle grid pattern */}
              <div 
                className="absolute inset-0 opacity-[0.015] pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }}
              />
              {/* Corner glow */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-violet-500/15 to-transparent rounded-bl-[40px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-400/20 to-cyan-400/20 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <span className="text-xs font-semibold bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">Sources</span>
                  {isLoadingAllTypes && <Loader2 className="w-3 h-3 animate-spin text-violet-400 ml-auto" />}
                </div>
                <div className="flex gap-1.5">
                  {(['web', 'image', 'video', 'news', 'discover'] as SearchType[]).map((type, idx) => {
                    const data = allTypesData[type];
                    const config = SEARCH_TYPE_CONFIG[type];
                    const hasData = data.clicks > 0 || data.impressions > 0;
                    const isActive = searchType === type;
                    
                    return (
                      <motion.button
                        key={type}
                        onClick={() => { setSearchType(type); setShowSourceDetails(true); }}
                        className={`relative overflow-hidden flex-1 flex flex-col items-center p-2 rounded-xl transition-all border ${
                          isActive 
                            ? 'bg-gradient-to-br from-cyan-500/20 to-violet-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10' 
                            : hasData 
                              ? 'bg-gradient-to-br from-secondary/50 to-card border-border/50 hover:border-violet-500/30' 
                              : 'opacity-40 border-border/30'
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + idx * 0.03 }}
                        whileHover={{ scale: isActive ? 1 : 1.03 }}
                      >
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent pointer-events-none"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                        <div className="relative z-10 w-6 h-6 rounded-lg flex items-center justify-center mb-0.5" style={{ color: config.color }}>
                          {config.icon}
                        </div>
                        <span className="text-xs font-bold">{hasData ? formatNumber(data.clicks) : '—'}</span>
                        <span className="text-[8px] text-muted-foreground">{config.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Compact Display Window - Chart and KPIs - Enhanced */}
          {showSourceDetails && (
            <motion.div 
              className="relative overflow-hidden bg-gradient-to-br from-cyan-500/5 via-card to-violet-500/5 rounded-xl p-4 border border-cyan-500/15"
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Subtle grid pattern */}
              <div 
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              />
              {/* Corner glows */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-[50px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-violet-500/10 to-transparent rounded-tr-[40px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${SEARCH_TYPE_CONFIG[searchType].color}20` }}>
                      <span style={{ color: SEARCH_TYPE_CONFIG[searchType].color }}>{SEARCH_TYPE_CONFIG[searchType].icon}</span>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: SEARCH_TYPE_CONFIG[searchType].color }}>
                      {SEARCH_TYPE_CONFIG[searchType].label}
                    </span>
                    <Badge variant="secondary" className="text-[9px] h-4 bg-cyan-500/10 border-cyan-500/20 text-cyan-400">{dateRange}d</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowSourceDetails(false)} className="h-6 px-2 text-[10px] hover:bg-cyan-500/10">
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                </div>

                {/* Compact Chart - Enhanced */}
                <div className="relative h-[100px] w-full mb-3 rounded-lg overflow-hidden bg-gradient-to-r from-secondary/20 to-secondary/10">
                  {isFetching && chartData.length === 0 ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gscClicksGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={SEARCH_TYPE_CONFIG[searchType].color} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={SEARCH_TYPE_CONFIG[searchType].color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} interval="preserveStartEnd" />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={30} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: `1px solid ${SEARCH_TYPE_CONFIG[searchType].color}40`, borderRadius: '10px', fontSize: '11px', boxShadow: `0 4px 20px ${SEARCH_TYPE_CONFIG[searchType].color}20` }} />
                        <Area type="monotone" dataKey="clicks" stroke={SEARCH_TYPE_CONFIG[searchType].color} fill="url(#gscClicksGradient)" strokeWidth={2} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Compact KPI Row - Enhanced */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Clicks", value: formatNumber(combinedMetrics.clicks), icon: MousePointer, color: "cyan", gradient: "from-cyan-500/15 to-cyan-500/5", border: "border-cyan-500/20" },
                    { label: "Impressions", value: formatNumber(combinedMetrics.impressions), icon: Eye, color: "violet", gradient: "from-violet-500/15 to-violet-500/5", border: "border-violet-500/20" },
                    { label: "CTR", value: (combinedMetrics.ctr * 100).toFixed(1) + "%", icon: Target, color: "emerald", gradient: "from-emerald-500/15 to-emerald-500/5", border: "border-emerald-500/20" },
                    { label: "Position", value: combinedMetrics.position > 0 ? combinedMetrics.position.toFixed(1) : "—", icon: TrendingUp, color: "amber", gradient: "from-amber-500/15 to-amber-500/5", border: "border-amber-500/20" },
                  ].map((metric, i) => (
                    <motion.div 
                      key={i} 
                      className={`relative overflow-hidden bg-gradient-to-br ${metric.gradient} rounded-xl p-2.5 text-center border ${metric.border} group/kpi`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover/kpi:opacity-100 pointer-events-none"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <metric.icon className={`w-3.5 h-3.5 mx-auto mb-1 text-${metric.color}-400`} />
                      <motion.p 
                        className="text-sm font-bold"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.05, type: 'spring' }}
                      >
                        {isLoadingAllTypes ? <Skeleton className="h-4 w-10 mx-auto" /> : metric.value}
                      </motion.p>
                      <p className="text-[8px] text-muted-foreground">{metric.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Advanced Reporting Toggle - Enhanced */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedReporting(!showAdvancedReporting)}
              className="relative overflow-hidden w-full justify-between h-10 text-xs mt-2 rounded-xl bg-gradient-to-r from-violet-500/5 via-secondary/20 to-cyan-500/5 border border-violet-500/10 hover:border-violet-500/30 hover:bg-violet-500/10 group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <span className="relative z-10 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-400/20 to-cyan-400/20 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent font-semibold">
                  Advanced Reporting
                </span>
              </span>
              {showAdvancedReporting ? <ChevronUp className="w-4 h-4 text-violet-400" /> : <ChevronDown className="w-4 h-4 text-violet-400" />}
            </Button>
          </motion.div>
          </>
          )}
        </CardContent>
      </Card>

      {/* Advanced Reporting Panel - only show if domain is in GSC */}
      {showAdvancedReporting && (isExternalSiteInGsc || !externalSelectedSite || sites.length === 0) && (
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
    </>
  );
};

function getDateNDaysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split("T")[0];
}

export default GSCDashboardPanel;
