import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, Loader2, Sparkles, Check, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useBronApiAuth } from "@/hooks/use-bron-api-auth";

const BRON_STORAGE_KEY = "bron_dashboard_auth";
const BRON_DASHBOARD_URL = "https://dashdev.imagehosting.space/dashboard";
const BRON_DOMAIN_ID = "112619";

interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

export const BRONPlatformConnect = ({ domain, onConnectionComplete }: BRONPlatformConnectProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeError, setIframeError] = useState(false);
  const hasNotified = useRef(false);
  const autoOpenAttempted = useRef(false);

  // Dashboard URL for iframe
  const iframeSrc = `${BRON_DASHBOARD_URL}?domain_id=${BRON_DOMAIN_ID}&tab=analysis`;

  // Check if already authenticated from localStorage
  const checkAuth = useCallback(() => {
    try {
      const stored = localStorage.getItem(BRON_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.authenticated && data.expiry > Date.now()) {
          return true;
        }
        localStorage.removeItem(BRON_STORAGE_KEY);
      }
    } catch {
      // Ignore parse errors
    }
    return false;
  }, []);

  // Mark as authenticated and store in localStorage
  const setAuthenticated = useCallback(() => {
    console.log("[BRON] Setting authenticated state");
    
    setIframeError(false);
    
    const authData = {
      authenticated: true,
      expiry: Date.now() + 24 * 60 * 60 * 1000,
      authenticatedAt: new Date().toISOString(),
      domainId: BRON_DOMAIN_ID,
    };
    localStorage.setItem(BRON_STORAGE_KEY, JSON.stringify(authData));
    
    setIsConnected(true);
    setIframeKey(prev => prev + 1);
    
    if (!hasNotified.current) {
      hasNotified.current = true;
      onConnectionComplete?.("bron");
    }
    
    toast({
      title: "Connected to BRON",
      description: "Dashboard is now loading below.",
    });
  }, [onConnectionComplete]);

  // Use API-based auth detection
  const {
    isPolling,
    popupBlocked,
    openPopup,
    focusPopup,
  } = useBronApiAuth({
    domain: domain || "",
    onLoggedIn: setAuthenticated,
    pollIntervalMs: 2000,
  });

  // Listen for callback page postMessage
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "BRON_AUTH_SUCCESS") {
        setAuthenticated();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [setAuthenticated]);

  // Initial auth check
  useEffect(() => {
    const isAuth = checkAuth();
    setIsConnected(isAuth);
    setIsLoading(false);
    
    if (isAuth && !hasNotified.current) {
      hasNotified.current = true;
      onConnectionComplete?.("bron");
    }
  }, [checkAuth, onConnectionComplete]);

  // Auto-open login popup when component mounts (if not already connected)
  useEffect(() => {
    if (!isLoading && !isConnected && domain && !autoOpenAttempted.current) {
      autoOpenAttempted.current = true;
      
      const timer = setTimeout(() => {
        console.log("[BRON] Auto-opening login popup");
        const opened = openPopup();
        if (!opened) {
          toast({
            title: "Popup Blocked",
            description: "Please allow popups for this site, then click 'Open Login'.",
            variant: "destructive",
          });
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [domain, isConnected, isLoading, openPopup]);

  const handleLogout = () => {
    localStorage.removeItem(BRON_STORAGE_KEY);
    setIsConnected(false);
    hasNotified.current = false;
    autoOpenAttempted.current = false;
    
    toast({
      title: "Disconnected",
      description: "You've been logged out of BRON.",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Auto-open dashboard in new tab when connected (since iframe won't have cookies)
  useEffect(() => {
    if (isConnected && !iframeError) {
      // Give iframe a chance to load, then check if it shows login page
      const checkTimer = setTimeout(() => {
        // Since we can't read cross-origin iframe content, assume cookie issue
        // and prompt user or auto-open in new tab
        console.log("[BRON] Connected - dashboard ready");
      }, 2000);
      
      return () => clearTimeout(checkTimer);
    }
  }, [isConnected, iframeError]);

  // Connected state - show iframe dashboard
  if (isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <motion.div
                className="absolute -inset-1 rounded-xl border border-emerald-400/50"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                BRON Dashboard
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Check className="w-3 h-3 inline mr-1" />
                  Connected
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Managing <span className="text-emerald-400 font-medium">{domain}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(iframeSrc, '_blank')}
              className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              Disconnect
            </Button>
          </div>
        </div>

        {/* Important: Due to cookie restrictions, open dashboard in new tab */}
        <div className="flex items-start gap-2 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Sparkles className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-foreground font-medium mb-2">
              Your BRON account is connected!
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Due to browser security restrictions, the dashboard must be opened in a new tab to access your authenticated session.
            </p>
            <Button
              onClick={() => window.open(iframeSrc, '_blank')}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ExternalLink className="w-4 h-4" />
              Open BRON Dashboard
            </Button>
          </div>
        </div>

        {/* Dashboard preview (may show login due to cookie restrictions) */}
        <div className="rounded-xl border border-border/50 overflow-hidden bg-background relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 p-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Dashboard Ready</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              You're logged in to BRON. Click below to access your full dashboard with all features.
            </p>
            <Button
              size="lg"
              onClick={() => window.open(iframeSrc, '_blank')}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ExternalLink className="w-5 h-5" />
              Launch Dashboard
            </Button>
          </div>
          <iframe
            key={iframeKey}
            src={iframeSrc}
            className="w-full min-h-[500px] border-0 opacity-30"
            title="BRON Dashboard Preview"
            allow="clipboard-write"
            onError={() => setIframeError(true)}
          />
        </div>
      </motion.div>
    );
  }

  // Not connected - show waiting for login with API polling
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 space-y-6"
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
        <motion.div
          className="absolute -inset-2 rounded-2xl border-2 border-emerald-400/50"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {isPolling ? "Checking Login Status..." : "Opening Login..."}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {popupBlocked
            ? "Your browser blocked the popup. Please allow popups, then click 'Open Login'."
            : isPolling
              ? "Please complete the login in the popup window. We're automatically detecting when you log in."
              : "Opening BRON login window..."}
        </p>
      </div>

      {/* Only show Open Login button if popup blocked or not polling */}
      {(popupBlocked || !isPolling) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const focused = focusPopup();
            if (!focused) {
              const opened = openPopup();
              if (!opened) {
                toast({
                  title: "Popup Blocked",
                  description: "Please allow popups for this site and try again.",
                  variant: "destructive",
                });
              }
            }
          }}
          className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
        >
          {isPolling ? "Focus Login Window" : "Open Login"}
        </Button>
      )}

      {isPolling && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Auto-detecting login via BRON API...
        </p>
      )}
    </motion.div>
  );
};

export default BRONPlatformConnect;
