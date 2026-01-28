import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useBronApi, BronDomain } from "@/hooks/use-bron-api";
import { BRONKeywordsTab } from "./BRONKeywordsTab";
import { BRONDomainsTab } from "./BRONDomainsTab";
import { BRONLinksTab } from "./BRONLinksTab";
import { BRONContentTab } from "./BRONContentTab";
import { BRONSerpTab } from "./BRONSerpTab";
import { BronDomainProfile, BronKeywordsInfoCards } from "./bron";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ───
interface BRONDashboardProps {
  selectedDomain?: string;
}

// ─── Constants ───
const DOMAINS_CACHE_KEY = 'bron_domains_cache';
const AUTH_TIMEOUT_MS = 35000;
const PREFETCH_DELAY_MS = 500;

// ─── Cache Helpers ───
const hasCachedData = (): boolean => {
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

// ─── Main Component ───
export const BRONDashboard = memo(({ selectedDomain }: BRONDashboardProps) => {
  const bronApi = useBronApi();
  const [activeTab, setActiveTab] = useState("keywords");
  
  // Check cache synchronously to determine initial state
  const [hasCached] = useState(hasCachedData);
  const [isAuthenticating, setIsAuthenticating] = useState(!hasCached);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorDetails, setAuthErrorDetails] = useState<string | null>(null);
  const [domainInfo, setDomainInfo] = useState<BronDomain | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [isBackgroundAuthenticating, setIsBackgroundAuthenticating] = useState(hasCached);

  // Refs to prevent duplicate requests
  const linksRequestedForDomainRef = useRef<string | null>(null);
  const keywordPrefetchStartedRef = useRef(false);

  // ─── Authentication ───
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      if (hasCached) {
        setIsBackgroundAuthenticating(true);
      } else {
        setIsAuthenticating(true);
      }
      setAuthError(null);
      setAuthErrorDetails(null);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Connection timed out")), AUTH_TIMEOUT_MS);
      });
      
      try {
        const isValid = await Promise.race([bronApi.verifyAuth(), timeoutPromise]);
        
        if (!mounted) return;
        
        if (!isValid && !hasCached) {
          setAuthError("Unable to authenticate with BRON API.");
          setAuthErrorDetails("verifyAuth returned unauthenticated");
        }
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[BRON Dashboard] Auth check failed:", message);
        
        if (!hasCached) {
          setAuthError(getAuthErrorMessage(message));
          setAuthErrorDetails(message);
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

  // ─── Screenshot Functions ───
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

  const handleScreenshotError = useCallback(() => {
    setScreenshotUrl(null);
  }, []);

  const handleCaptureScreenshot = useCallback(() => {
    if (selectedDomain) {
      captureScreenshot(selectedDomain);
    }
  }, [selectedDomain, captureScreenshot]);

  // ─── Data Loading Effects ───
  
  // Load domains on auth
  useEffect(() => {
    if (bronApi.isAuthenticated) {
      bronApi.fetchDomains();
    }
  }, [bronApi.isAuthenticated]);

  // Prefetch keywords for all domains (once per session)
  useEffect(() => {
    if (!bronApi.isAuthenticated || keywordPrefetchStartedRef.current || bronApi.domains.length === 0) return;
    
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })?.connection;
    if (connection?.saveData) return;

    keywordPrefetchStartedRef.current = true;

    const timeoutId = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        bronApi.prefetchKeywordsForDomains(bronApi.domains);
      }
    }, PREFETCH_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [bronApi.isAuthenticated, bronApi.domains]);

  // Sync domain selection with header selector
  useEffect(() => {
    if (bronApi.isAuthenticated) {
      bronApi.selectDomain(selectedDomain ?? null);
    }
  }, [bronApi.isAuthenticated, selectedDomain]);

  // Load domain-specific data
  useEffect(() => {
    let cancelled = false;
    
    if (!bronApi.isAuthenticated || !selectedDomain) return;

    linksRequestedForDomainRef.current = null;
    setScreenshotUrl(null);

    getExistingScreenshot(selectedDomain);

    // Fire all fetches in parallel
    bronApi.fetchDomain(selectedDomain).then((info) => {
      if (!cancelled && info) setDomainInfo(info);
    });
    bronApi.fetchKeywords(selectedDomain);
    bronApi.fetchSerpReport(selectedDomain);
    bronApi.fetchSerpList(selectedDomain);
    bronApi.fetchPages(selectedDomain);

    return () => { cancelled = true; };
  }, [bronApi.isAuthenticated, selectedDomain, getExistingScreenshot]);

  // Load link reports
  useEffect(() => {
    if (!bronApi.isAuthenticated || !selectedDomain) return;
    if (linksRequestedForDomainRef.current === selectedDomain) return;
    
    linksRequestedForDomainRef.current = selectedDomain;
    const domainId = domainInfo?.id;
    
    bronApi.fetchLinksIn(selectedDomain, domainId);
    bronApi.fetchLinksOut(selectedDomain, domainId);
  }, [bronApi.isAuthenticated, selectedDomain, domainInfo?.id]);

  // ─── Memoized Data ───
  const stableKeywords = useMemo(() => bronApi.keywords, [bronApi.keywords]);
  const stableSerpReports = useMemo(() => bronApi.serpReports, [bronApi.serpReports]);
  const stableSerpHistory = useMemo(() => bronApi.serpHistory, [bronApi.serpHistory]);
  const stableLinksIn = useMemo(() => bronApi.linksIn, [bronApi.linksIn]);
  const stableLinksOut = useMemo(() => bronApi.linksOut, [bronApi.linksOut]);
  const stableDomains = useMemo(() => bronApi.domains, [bronApi.domains]);
  const stablePages = useMemo(() => bronApi.pages, [bronApi.pages]);

  // ─── Stable Callbacks ───
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

  // ─── Render States ───
  
  // Loading state (only if no cache)
  if (isAuthenticating && !hasCached) {
    return <LoadingScreen message="Connecting to BRON API..." />;
  }

  // Error state (only if no cache)
  if (authError && !hasCached) {
    return (
      <AuthErrorScreen 
        error={authError}
        details={authErrorDetails}
        selectedDomain={selectedDomain}
      />
    );
  }

  // ─── Main Render ───
  return (
    <div 
      className="space-y-6 no-theme-transition" 
      style={{ contain: "layout style paint" }}
      data-no-theme-transition
    >
      {/* Background sync indicator */}
      {isBackgroundAuthenticating && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
          <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
          <span className="text-xs text-cyan-400">Syncing...</span>
        </div>
      )}
      
      {/* Domain Profile Section */}
      {selectedDomain && (
        <BronDomainProfile
          selectedDomain={selectedDomain}
          domainInfo={domainInfo}
          keywordCount={stableKeywords.length}
          screenshotUrl={screenshotUrl}
          isCapturingScreenshot={isCapturingScreenshot}
          onCaptureScreenshot={handleCaptureScreenshot}
          onScreenshotError={handleScreenshotError}
        />
      )}

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {activeTab === "keywords" && <BronKeywordsInfoCards />}

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

BRONDashboard.displayName = 'BRONDashboard';

// ─── Helper Components ───

const LoadingScreen = memo(({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4">
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 blur-xl opacity-50" />
      <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin motion-reduce:animate-none" />
      </div>
    </div>
    <p className="text-muted-foreground text-sm">{message}</p>
  </div>
));

LoadingScreen.displayName = 'LoadingScreen';

interface AuthErrorScreenProps {
  error: string;
  details: string | null;
  selectedDomain?: string;
}

const AuthErrorScreen = memo(({ error, details, selectedDomain }: AuthErrorScreenProps) => {
  const copyDiagnostics = async () => {
    try {
      const payload = JSON.stringify({
        feature: "bron",
        step: "verifyAuth",
        domain: selectedDomain || null,
        message: error,
        details,
        url: window.location.href,
        occurred_at: new Date().toISOString(),
      }, null, 2);
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
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
        {details && (
          <div className="mx-auto max-w-2xl rounded-lg bg-muted/50 p-4 text-left">
            <p className="text-xs text-muted-foreground mb-1">Details</p>
            <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-words max-h-40 overflow-auto">
              {details}
            </pre>
          </div>
        )}
        <div className="flex justify-center gap-2">
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Connection
          </Button>
          <Button onClick={copyDiagnostics} variant="secondary">
            Copy diagnostics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

AuthErrorScreen.displayName = 'AuthErrorScreen';

// ─── Utility Functions ───

function getAuthErrorMessage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("timed out")) {
    return "Connection timed out while contacting BRON.";
  }
  if (lowerMessage.includes("failed to send") || lowerMessage.includes("fetch")) {
    return "Connection temporarily unavailable.";
  }
  if (lowerMessage.includes("credentials") || lowerMessage.includes("configured")) {
    return "BRON API configuration error.";
  }
  return "Failed to connect to BRON.";
}

export default BRONDashboard;
