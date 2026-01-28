import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { 
  Loader2, Key, FileText, BarChart3, Link2, ArrowUpRight, 
  ArrowDownLeft, RefreshCw, TrendingUp, ChevronDown,
  MapPin, X, Camera, Facebook, Linkedin, Instagram, Twitter, Youtube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useBronApi, BronDomain } from "@/hooks/use-bron-api";
import { BRONKeywordsTab } from "./BRONKeywordsTab";
import { BRONDomainsTab } from "./BRONDomainsTab";
import { BRONLinksTab } from "./BRONLinksTab";
import { BRONContentTab } from "./BRONContentTab";
import { BRONSerpTab } from "./BRONSerpTab";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BRONDashboardProps {
  selectedDomain?: string;
}

// Check if we have cached data to show instantly
const DOMAINS_CACHE_KEY = 'bron_domains_cache';
const MAP_CACHE_KEY = 'bron_map_cache';
const MAP_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days for map cache

const hasCachedData = () => {
  try {
    const cached = localStorage.getItem(DOMAINS_CACHE_KEY);
    if (!cached) return false;
    const entry = JSON.parse(cached);
    const isValid = entry?.domains?.length > 0 && 
      (Date.now() - entry.cachedAt) < 24 * 60 * 60 * 1000;
    return isValid;
  } catch {
    return false;
  }
};

// Map cache functions - store static map images per address
interface MapCacheEntry {
  url: string;
  cachedAt: number;
}

function loadCachedMap(address: string): string | null {
  try {
    const cached = localStorage.getItem(MAP_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as Record<string, MapCacheEntry>;
    const entry = parsed[address];
    if (!entry || (Date.now() - entry.cachedAt) > MAP_CACHE_MAX_AGE) return null;
    return entry.url;
  } catch {
    return null;
  }
}

function saveCachedMap(address: string, url: string) {
  try {
    const cached = localStorage.getItem(MAP_CACHE_KEY);
    const parsed = cached ? JSON.parse(cached) as Record<string, MapCacheEntry> : {};
    
    // Keep max 20 cached maps
    const addresses = Object.keys(parsed);
    if (addresses.length >= 20 && !parsed[address]) {
      const oldest = addresses.sort((a, b) => parsed[a].cachedAt - parsed[b].cachedAt)[0];
      delete parsed[oldest];
    }
    
    parsed[address] = { url, cachedAt: Date.now() };
    localStorage.setItem(MAP_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // localStorage may fail
  }
}

export const BRONDashboard = memo(({ selectedDomain }: BRONDashboardProps) => {
  const bronApi = useBronApi();
  const [activeTab, setActiveTab] = useState("keywords");
  
  // Check cache synchronously to determine initial state
  const [hasCached] = useState(() => hasCachedData());
  // If we have cached data, skip the loading screen entirely
  const [isAuthenticating, setIsAuthenticating] = useState(!hasCached);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorDetails, setAuthErrorDetails] = useState<string | null>(null);
  const [domainInfo, setDomainInfo] = useState<BronDomain | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  
  // Background auth status for when we have cache but still need to verify
  const [isBackgroundAuthenticating, setIsBackgroundAuthenticating] = useState(hasCached);

  // Avoid duplicate link loads and UI thrash when domainInfo arrives (id changes).
  const linksRequestedForDomainRef = useRef<string | null>(null);

  // Ensure background keyword prefetch runs only once per auth session.
  const keywordPrefetchStartedRef = useRef(false);

  // Verify authentication on mount with timeout protection
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      // If we have cached data, run auth check in background
      if (hasCached) {
        setIsBackgroundAuthenticating(true);
      } else {
        setIsAuthenticating(true);
      }
      setAuthError(null);
      setAuthErrorDetails(null);
      
      // Add a client-side timeout for the entire auth check
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        // Keep this higher than the backend auth timeout (can be slow)
        setTimeout(() => reject(new Error("Connection timed out")), 35000);
      });
      
      try {
        const isValid = await Promise.race([
          bronApi.verifyAuth(),
          timeoutPromise
        ]);
        
        if (!mounted) return;
        
        if (!isValid) {
          // Only show error if we don't have cached data to fall back on
          if (!hasCached) {
            setAuthError("Unable to authenticate with BRON API.");
            setAuthErrorDetails("verifyAuth returned unauthenticated");
          } else {
            console.log("[BRON Dashboard] Auth failed but serving cached data");
          }
        }
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[BRON Dashboard] Auth check failed:", message);
        
        // Only show errors if we don't have cached data
        if (!hasCached) {
          if (message.toLowerCase().includes("timed out")) {
            setAuthError("Connection timed out while contacting BRON.");
            setAuthErrorDetails("The BRON API is responding slowly. Please try again.");
          } else if (message.toLowerCase().includes("failed to send") || message.toLowerCase().includes("fetch")) {
            setAuthError("Connection temporarily unavailable.");
            setAuthErrorDetails("Please check your internet connection and try again.");
          } else if (message.toLowerCase().includes("credentials") || message.toLowerCase().includes("configured")) {
            setAuthError("BRON API configuration error.");
            setAuthErrorDetails(message);
          } else {
            setAuthError("Failed to connect to BRON.");
            setAuthErrorDetails(message);
          }
        } else {
          console.log("[BRON Dashboard] Auth error but serving cached data:", message);
        }
      } finally {
        if (mounted) {
          setIsAuthenticating(false);
          setIsBackgroundAuthenticating(false);
        }
      }
    };
    
    checkAuth();
    return () => { mounted = false; };
  }, [hasCached]);

  // Capture website screenshot function
  const captureScreenshot = useCallback(async (domain: string) => {
    setIsCapturingScreenshot(true);
    try {
      const { data, error } = await supabase.functions.invoke("capture-website-screenshot", {
        body: { action: "capture", domain }
      });

      if (error) {
        console.error("Screenshot capture error:", error);
        return null;
      }

      if (data?.success && data?.url) {
        // Add cache buster for fresh captures
        const url = data.cached ? data.url : `${data.url}?t=${Date.now()}`;
        setScreenshotUrl(url);
        if (!data.cached) {
          toast.success("Website screenshot captured!");
        }
        return url;
      }
      
      return data?.fallbackUrl || null;
    } catch (err) {
      console.error("Failed to capture screenshot:", err);
      return null;
    } finally {
      setIsCapturingScreenshot(false);
    }
  }, []);

  // Get existing screenshot
  const getExistingScreenshot = useCallback(async (domain: string) => {
    try {
      const { data } = await supabase.functions.invoke("capture-website-screenshot", {
        body: { action: "get", domain }
      });

      if (data?.success && data?.url) {
        setScreenshotUrl(data.url);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (bronApi.isAuthenticated) {
      bronApi.fetchDomains();
    }
  }, [bronApi.isAuthenticated]);

  // Prefetch keywords for all domains immediately after domains load.
  // This runs once per session to pre-warm cache for instant domain switching.
  useEffect(() => {
    if (!bronApi.isAuthenticated) return;
    if (keywordPrefetchStartedRef.current) return;
    if (bronApi.domains.length === 0) return;

    // Respect data-saver / low bandwidth.
    const connection = (navigator as any)?.connection;
    if (connection?.saveData) return;

    keywordPrefetchStartedRef.current = true;

    // Start prefetch immediately (short delay to let active domain load first)
    const timeoutId = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        bronApi.prefetchKeywordsForDomains(bronApi.domains);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bronApi.isAuthenticated, bronApi.domains]);

  // Keep BRON hook in sync with the header domain selector.
  // This hydrates cached results immediately (or clears), preventing the UI from
  // showing results from a previously selected domain.
  useEffect(() => {
    if (!bronApi.isAuthenticated) return;
    bronApi.selectDomain(selectedDomain ?? null);
    // Note: bronApi methods are stable; avoid depending on the whole object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bronApi.isAuthenticated, selectedDomain]);

  // Load domain-specific data when domain changes
  // IMPORTANT: Don't reset data before fetching - let cache serve instantly
  // NOTE: Don't use Promise.all to wait - fire fetches in parallel but don't block UI
  useEffect(() => {
    let cancelled = false;
    const loadCore = () => {
      if (!bronApi.isAuthenticated || !selectedDomain) return;

      // Only reset the refs to prevent stale requests, NOT the data
      // The fetch functions will serve cached data immediately if available
      linksRequestedForDomainRef.current = null;
      setScreenshotUrl(null);

      // Only load cached screenshot - don't auto-capture (user clicks camera to refresh)
      getExistingScreenshot(selectedDomain);

      // Fire all fetches in parallel - they handle cache-first internally
      // Each will update state immediately if cache exists, then background refresh
      // Don't await - let each function update its own state independently
      bronApi.fetchDomain(selectedDomain).then((info) => {
        if (!cancelled && info) setDomainInfo(info);
      });
      bronApi.fetchKeywords(selectedDomain);
      bronApi.fetchSerpReport(selectedDomain);
      bronApi.fetchSerpList(selectedDomain);
      
      // Fetch pages separately (lower priority)
      bronApi.fetchPages(selectedDomain);
    };

    loadCore();

    return () => {
      cancelled = true;
    };
  }, [bronApi.isAuthenticated, selectedDomain, captureScreenshot, getExistingScreenshot]);

  // Load link reports eagerly (in parallel) for faster dashboard loading
  useEffect(() => {
    if (!bronApi.isAuthenticated || !selectedDomain) return;

    // Prevent duplicate requests for the same domain
    if (linksRequestedForDomainRef.current === selectedDomain) return;
    linksRequestedForDomainRef.current = selectedDomain;

    // Use domain ID if available (preferred by the API)
    const domainId = domainInfo?.id;
    console.log(`[BRON Dashboard] Loading links for domain: ${selectedDomain}, id: ${domainId || 'N/A'}`);
    
    // Fire both link fetches in parallel - don't await, let them update state independently
    bronApi.fetchLinksIn(selectedDomain, domainId);
    bronApi.fetchLinksOut(selectedDomain, domainId);
  }, [bronApi.isAuthenticated, selectedDomain, domainInfo?.id]);

  // Derived data and stable callbacks (MUST be above any conditional returns)
  // Otherwise React will throw "Rendered more hooks than during the previous render".
  const keywordProgress = Math.min(bronApi.keywords.length, 37);

  // Stabilize data references to prevent child component re-renders
  const stableKeywords = useMemo(() => bronApi.keywords, [bronApi.keywords]);
  const stableSerpReports = useMemo(() => bronApi.serpReports, [bronApi.serpReports]);
  const stableSerpHistory = useMemo(() => bronApi.serpHistory, [bronApi.serpHistory]);
  const stableLinksIn = useMemo(() => bronApi.linksIn, [bronApi.linksIn]);
  const stableLinksOut = useMemo(() => bronApi.linksOut, [bronApi.linksOut]);
  const stableDomains = useMemo(() => bronApi.domains, [bronApi.domains]);
  const stablePages = useMemo(() => bronApi.pages, [bronApi.pages]);

  // Stable callbacks for child components
  // Note: bronApi methods are internally stable via refs, no need to include bronApi in deps
  const handleRefreshKeywords = useCallback(() => {
    if (selectedDomain) bronApi.fetchKeywords(selectedDomain, true);
  }, [selectedDomain]);

  const handleAddKeyword = useCallback((data: Record<string, unknown>) => {
    return bronApi.addKeyword(data, selectedDomain);
  }, [selectedDomain]);

  const handleUpdateKeyword = useCallback((id: string, data: Record<string, unknown>) => {
    return bronApi.updateKeyword(id, data, selectedDomain);
  }, [selectedDomain]);

  const handleDeleteKeyword = useCallback((id: string) => {
    return bronApi.deleteKeyword(id, selectedDomain);
  }, [selectedDomain]);

  const handleRestoreKeyword = useCallback((id: string) => {
    return bronApi.restoreKeyword(id, selectedDomain);
  }, [selectedDomain]);

  const handleRefreshPages = useCallback(() => {
    if (selectedDomain) bronApi.fetchPages(selectedDomain);
  }, [selectedDomain]);

  const handleRefreshSerp = useCallback(() => {
    if (selectedDomain) bronApi.fetchSerpReport(selectedDomain, true);
  }, [selectedDomain]);

  const handleRefreshLinksIn = useCallback(() => {
    if (selectedDomain) bronApi.fetchLinksIn(selectedDomain);
  }, [selectedDomain]);

  const handleRefreshLinksOut = useCallback(() => {
    if (selectedDomain) bronApi.fetchLinksOut(selectedDomain);
  }, [selectedDomain]);

  // Only show loading if we DON'T have cached data
  // If we have cache, render the dashboard immediately while auth happens in background
  if (isAuthenticating && !hasCached) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 blur-xl opacity-50" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin motion-reduce:animate-none" />
          </div>
        </div>
        <p className="text-muted-foreground text-sm">Connecting to BRON API...</p>
      </div>
    );
  }

  // Only show auth error screen if we don't have cached data to fall back on
  if (authError && !hasCached) {
    const copyBronDiagnostics = async () => {
      try {
        const payload = JSON.stringify(
          {
            feature: "bron",
            step: "verifyAuth",
            domain: selectedDomain || null,
            message: authError,
            details: authErrorDetails,
            url: window.location.href,
            occurred_at: new Date().toISOString(),
          },
          null,
          2
        );
        await navigator.clipboard.writeText(payload);
        toast.success("Diagnostics copied");
      } catch {
        toast.error("Could not copy diagnostics");
      }
    };

    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-destructive">Connection Failed</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{authError}</p>
          {authErrorDetails && (
            <div className="mx-auto max-w-2xl rounded-lg bg-muted/50 p-4 text-left">
              <p className="text-xs text-muted-foreground mb-1">Details</p>
              <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-words max-h-40 overflow-auto">
                {authErrorDetails}
              </pre>
            </div>
          )}
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Connection
          </Button>
          <Button
            onClick={copyBronDiagnostics}
            variant="secondary"
            className="mt-2"
          >
            Copy diagnostics
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Generate Google Maps embed URL from address
  const getGoogleMapsEmbedUrl = (address?: string) => {
    if (!address) return null;
    const encoded = encodeURIComponent(address);
    return `https://www.google.com/maps?q=${encoded}&output=embed`;
  };

  // Get service package name based on servicetype
  const getPackageName = (serviceType?: string) => {
    const packages: Record<string, string> = {
      "383": "SEOM 60",
      "380": "SEOM 30",
      "381": "SEOM 45",
      "382": "SEOM Premium",
    };
    return packages[serviceType || ""] || `Package ${serviceType || "N/A"}`;
  };

  // Cached Map Image Component - uses static map with localStorage cache
  const CachedMapImage = memo(({ address }: { address?: string }) => {
    const [mapUrl, setMapUrl] = useState<string | null>(() => {
      if (!address) return null;
      return loadCachedMap(address);
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (!address) {
        setMapUrl(null);
        return;
      }

      // Check cache first
      const cached = loadCachedMap(address);
      if (cached) {
        setMapUrl(cached);
        return;
      }

      // Generate static map URL (OpenStreetMap-based, no API key needed)
      setIsLoading(true);
      const encoded = encodeURIComponent(address);
      // Use a static map service that doesn't require API keys
      const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=15&size=400x200&maptype=roadmap&markers=color:red%7C${encoded}&key=`;
      
      // Fallback to embed URL as image proxy isn't available - use lazy-loaded iframe but mark as "cached"
      // For true caching, we'll store the embed URL and treat it as cached after first load
      const embedUrl = `https://www.google.com/maps?q=${encoded}&output=embed`;
      setMapUrl(embedUrl);
      saveCachedMap(address, embedUrl);
      setIsLoading(false);
    }, [address]);

    if (!address) {
      return (
        <div className="relative min-h-[140px] w-full h-full bg-muted/30 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-muted-foreground/30" />
        </div>
      );
    }

    return (
      <div className="relative min-h-[140px]">
        {mapUrl ? (
          <iframe
            src={mapUrl}
            className="w-full h-full border-0"
            loading="eager"
            referrerPolicy="no-referrer-when-downgrade"
            title="Business Location"
            style={{ minHeight: '140px' }}
          />
        ) : isLoading ? (
          <div className="w-full h-full min-h-[140px] bg-muted/30 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground/50" />
          </div>
        ) : (
          <div className="w-full h-full min-h-[140px] bg-muted/30 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        {/* View larger map link overlay */}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 text-[10px] text-cyan-500 hover:underline bg-white/90 px-1.5 py-0.5 rounded"
        >
          View larger map
        </a>
      </div>
    );
  });

  return (
    <div 
      className="space-y-6 no-theme-transition" 
      style={{ contain: "layout style paint" }}
      data-no-theme-transition
    >
      {/* Background sync indicator - subtle, non-blocking */}
      {isBackgroundAuthenticating && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
          <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
          <span className="text-xs text-cyan-400">Syncing...</span>
        </div>
      )}
      {/* Domain Profile Section - Matching Reference Design */}
      {selectedDomain && (
        <Card 
          className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm no-theme-transition"
          data-no-theme-transition
          style={{ contain: 'layout style paint' }}
        >
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* LEFT: Website Screenshot with Domain Options */}
              <div className="lg:col-span-3 p-4 border-r border-border/30">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border/50 bg-muted/30 mb-3">
                {/* Loading overlay on the image box */}
                  {isCapturingScreenshot && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-md" />
                          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                             <Loader2 className="w-6 h-6 text-white animate-spin motion-reduce:animate-none" />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-foreground">Capturing screenshot...</span>
                      </div>
                    </div>
                  )}
                  {/* Use stored screenshot or fallback to external services */}
                  <img 
                    src={screenshotUrl || `https://api.microlink.io/?url=https://${selectedDomain}&screenshot=true&meta=false&embed=screenshot.url`}
                    alt={`${selectedDomain} preview`}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      // Only use fallbacks if we don't have a stored screenshot
                      if (screenshotUrl) {
                        // Stored screenshot failed, try external
                        setScreenshotUrl(null);
                        return;
                      }
                      if (!target.dataset.fallback) {
                        target.dataset.fallback = "1";
                        target.src = `https://image.thum.io/get/width/400/crop/300/https://${selectedDomain}`;
                      } else if (target.dataset.fallback === "1") {
                        target.dataset.fallback = "2";
                        target.src = `https://s.wordpress.com/mshots/v1/https%3A%2F%2F${selectedDomain}?w=400&h=300`;
                      } else {
                        target.dataset.fallback = "3";
                        target.src = `https://www.google.com/s2/favicons?domain=${selectedDomain}&sz=128`;
                        target.className = "w-20 h-20 object-contain mx-auto mt-12";
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
                  {/* Recapture button - only show when not loading */}
                  {!isCapturingScreenshot && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 bg-background/90 hover:bg-background border border-border/50 shadow-sm transition-all"
                      onClick={() => captureScreenshot(selectedDomain)}
                      title="Recapture screenshot"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                  onClick={() => window.open(`https://${selectedDomain}`, '_blank')}
                >
                  <span className="mr-2">⋮</span>
                  Domain Options
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* MIDDLE: Domain Info Fields */}
              <div className="lg:col-span-4 p-4 border-r border-border/30 flex items-center">
                <div className="space-y-3 w-full">
                  {/* Domain Info Progress */}
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm min-w-[110px]">Domain Info :</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-8 bg-secondary/50 rounded border border-border/50 flex items-center px-3">
                        <span className="text-sm">{keywordProgress}/37</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">0%</Badge>
                    </div>
                  </div>

                  {/* Domain Status */}
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm min-w-[110px]">Domain Status :</span>
                    <Badge 
                      variant="secondary" 
                      className="bg-secondary/80 text-foreground border-border/50"
                    >
                      LIVE
                    </Badge>
                  </div>

                  {/* Package */}
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm min-w-[110px]">Package :</span>
                    <span className="text-sm font-medium">{getPackageName(domainInfo?.servicetype)}</span>
                  </div>

                  {/* Last Feed Check */}
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm min-w-[110px]">Last Feed Check :</span>
                    <span className="text-sm font-medium">
                      {domainInfo?.updated_at 
                        ? new Date(domainInfo.updated_at).toLocaleDateString()
                        : "1 month ago"}
                    </span>
                  </div>

                  {/* Domain Category */}
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm min-w-[110px]">Domain Category :</span>
                    <span className="text-sm font-medium">
                      {domainInfo?.wr_name ? `${domainInfo.wr_name.split(' ').slice(-1)[0]} Services` : "Business Services"}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT: Google My Business Card with Map */}
              <div className="lg:col-span-5 p-4">
                <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-cyan-600/10 overflow-hidden h-full">
                  {/* GMB Header */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-background/50 border-b border-cyan-500/20">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Google My Business
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-0 h-[calc(100%-36px)]">
                    {/* Business Info */}
                    <div className="p-3 space-y-2 border-r border-cyan-500/20">
                      <h4 className="font-semibold text-sm">
                        {domainInfo?.wr_name || selectedDomain}
                      </h4>
                      {domainInfo?.wr_address && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {domainInfo.wr_address}
                        </p>
                      )}
                      {domainInfo?.wr_phone && (
                        <p className="text-xs text-muted-foreground">
                          {domainInfo.wr_phone}
                        </p>
                      )}
                      <a 
                        href={`https://${selectedDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:underline"
                      >
                        {selectedDomain}
                      </a>
                      
                      {/* Social Media Icons */}
                      {(domainInfo?.wr_facebook || domainInfo?.wr_linkedin || domainInfo?.wr_instagram || domainInfo?.wr_twitter || domainInfo?.wr_video) && (
                        <div className="flex items-center gap-2 pt-2 mt-1 border-t border-border/30">
                          {domainInfo?.wr_facebook && (
                            <a
                              href={domainInfo.wr_facebook.startsWith('http') ? domainInfo.wr_facebook : `https://facebook.com/${domainInfo.wr_facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-6 h-6 rounded-full bg-[#1877F2] flex items-center justify-center hover:opacity-80 transition-opacity"
                              title="Facebook"
                            >
                              <Facebook className="w-3.5 h-3.5 text-white" />
                            </a>
                          )}
                          {domainInfo?.wr_linkedin && (
                            <a
                              href={domainInfo.wr_linkedin.startsWith('http') ? domainInfo.wr_linkedin : `https://linkedin.com/company/${domainInfo.wr_linkedin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-6 h-6 rounded-full bg-[#0A66C2] flex items-center justify-center hover:opacity-80 transition-opacity"
                              title="LinkedIn"
                            >
                              <Linkedin className="w-3.5 h-3.5 text-white" />
                            </a>
                          )}
                          {domainInfo?.wr_instagram && (
                            <a
                              href={domainInfo.wr_instagram.startsWith('http') ? domainInfo.wr_instagram : `https://instagram.com/${domainInfo.wr_instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-6 h-6 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center hover:opacity-80 transition-opacity"
                              title="Instagram"
                            >
                              <Instagram className="w-3.5 h-3.5 text-white" />
                            </a>
                          )}
                          {domainInfo?.wr_twitter && (
                            <a
                              href={domainInfo.wr_twitter.startsWith('http') ? domainInfo.wr_twitter : `https://twitter.com/${domainInfo.wr_twitter}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-6 h-6 rounded-full bg-black flex items-center justify-center hover:opacity-80 transition-opacity"
                              title="X (Twitter)"
                            >
                              <Twitter className="w-3.5 h-3.5 text-white" />
                            </a>
                          )}
                          {domainInfo?.wr_video && (
                            <a
                              href={domainInfo.wr_video.startsWith('http') ? domainInfo.wr_video : `https://youtube.com/${domainInfo.wr_video}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-6 h-6 rounded-full bg-[#FF0000] flex items-center justify-center hover:opacity-80 transition-opacity"
                              title="YouTube"
                            >
                              <Youtube className="w-3.5 h-3.5 text-white" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Google Maps - Static Image with Cache */}
                    <CachedMapImage address={domainInfo?.wr_address} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Info Cards Header - merged into keywords section */}
        {activeTab === "keywords" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <InfoCard
              icon={BarChart3}
              title="Keyword Content"
              description="Manage your target keywords and edit content to optimize search visibility."
              color="cyan"
            />
            <InfoCard
              icon={Link2}
              title="Citation Links"
              description="Build quality backlinks and manage citations to boost your site's authority."
              color="violet"
            />
            <InfoCard
              icon={TrendingUp}
              title="Ranking/Analytics"
              description="Track search engine rankings and monitor your campaign progress."
              color="primary"
            />
          </div>
        )}

        <TabsContent value="domains" className="mt-0">
          <BRONDomainsTab 
            domains={stableDomains}
            isLoading={bronApi.isLoading}
            onRefresh={bronApi.fetchDomains}
            onUpdate={bronApi.updateDomain}
            onDelete={bronApi.deleteDomain}
            onRestore={bronApi.restoreDomain}
          />
        </TabsContent>

        <TabsContent value="keywords" className="mt-0">
          <BRONKeywordsTab 
            keywords={stableKeywords}
            serpReports={stableSerpReports}
            serpHistory={stableSerpHistory}
            linksIn={stableLinksIn}
            linksOut={stableLinksOut}
            selectedDomain={selectedDomain}
            isLoading={bronApi.isLoading}
            onRefresh={handleRefreshKeywords}
            onAdd={handleAddKeyword}
            onUpdate={handleUpdateKeyword}
            onDelete={handleDeleteKeyword}
            onRestore={handleRestoreKeyword}
            onFetchSerpDetail={bronApi.fetchSerpDetail}
          />
        </TabsContent>

        <TabsContent value="content" className="mt-0">
          <BRONContentTab 
            pages={stablePages}
            selectedDomain={selectedDomain}
            isLoading={bronApi.isLoading}
            onRefresh={handleRefreshPages}
          />
        </TabsContent>

        <TabsContent value="serp" className="mt-0">
          <BRONSerpTab 
            serpReports={stableSerpReports}
            selectedDomain={selectedDomain}
            isLoading={bronApi.isLoading}
            onRefresh={handleRefreshSerp}
          />
        </TabsContent>

        <TabsContent value="links" className="mt-0">
          <BRONLinksTab 
            linksIn={stableLinksIn}
            linksOut={stableLinksOut}
            selectedDomain={selectedDomain}
            isLoading={bronApi.isLoading}
            onRefreshIn={handleRefreshLinksIn}
            onRefreshOut={handleRefreshLinksOut}
            errorIn={bronApi.linksInError}
            errorOut={bronApi.linksOutError}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
});

// Stat Card Component
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "cyan" | "violet" | "emerald" | "amber" | "blue" | "primary";
}

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => {
  const colorClasses: Record<string, string> = {
    cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400",
    violet: "from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
    primary: "from-primary/20 to-primary/10 border-primary/30 text-primary",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-3 ${colorClasses[color]}`}
      style={{ contain: "layout style paint" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold mt-0.5">{value.toLocaleString()}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

// Info Card Component (non-clickable)
interface InfoCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: "cyan" | "violet" | "primary";
}

const InfoCard = ({ icon: Icon, title, description, color }: InfoCardProps) => {
  const colorClasses: Record<string, { border: string; icon: string }> = {
    cyan: { 
      border: "border-cyan-500/30", 
      icon: "from-cyan-500/30 to-cyan-600/20 text-cyan-400",
    },
    violet: { 
      border: "border-violet-500/30", 
      icon: "from-violet-500/30 to-violet-600/20 text-violet-400",
    },
    primary: { 
      border: "border-primary/30", 
      icon: "from-primary/30 to-primary/20 text-primary",
    },
  };

  const styles = colorClasses[color];

  return (
    <div
      className={`relative rounded-xl border ${styles.border} bg-card/50 backdrop-blur-sm p-4`}
      style={{ contain: "layout style paint" }}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${styles.icon} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

// Action Card Component
interface ActionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: "cyan" | "violet" | "primary";
  onClick: () => void;
  active?: boolean;
}

const ActionCard = ({ icon: Icon, title, description, color, onClick, active }: ActionCardProps) => {
  const colorClasses: Record<string, { border: string; icon: string; glow: string }> = {
    cyan: { 
      border: active ? "border-cyan-500" : "border-cyan-500/30 hover:border-cyan-500/60", 
      icon: "from-cyan-500/30 to-cyan-600/20 text-cyan-400",
      glow: "bg-cyan-500/20"
    },
    violet: { 
      border: active ? "border-violet-500" : "border-violet-500/30 hover:border-violet-500/60", 
      icon: "from-violet-500/30 to-violet-600/20 text-violet-400",
      glow: "bg-violet-500/20"
    },
    primary: { 
      border: active ? "border-primary" : "border-primary/30 hover:border-primary/60", 
      icon: "from-primary/30 to-primary/20 text-primary",
      glow: "bg-primary/20"
    },
  };

  const styles = colorClasses[color];

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl border-2 ${styles.border} bg-card/50 backdrop-blur-sm p-4 transition-colors duration-200`}
      style={{ contain: "layout style paint" }}
    >
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${styles.icon} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      {active && (
        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/3 h-1 rounded-full ${styles.glow}`} />
      )}
    </div>
  );
};

BRONDashboard.displayName = 'BRONDashboard';

export default BRONDashboard;
