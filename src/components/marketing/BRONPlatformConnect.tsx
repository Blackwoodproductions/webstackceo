import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, Loader2, Sparkles, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const BRON_STORAGE_KEY = "bron_dashboard_auth";
const BRON_LOGIN_URL = "https://dashdev.imagehosting.space/dashboard";
const BRON_DOMAIN_ID = "112619";

interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

export const BRONPlatformConnect = ({ domain, onConnectionComplete }: BRONPlatformConnectProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWaitingForLogin, setIsWaitingForLogin] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const hasAutoOpened = useRef(false);
  const hasNotified = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if already authenticated from localStorage
  const checkAuth = useCallback(() => {
    try {
      const stored = localStorage.getItem(BRON_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.authenticated && data.expiry > Date.now()) {
          return true;
        }
        // Expired - clear it
        localStorage.removeItem(BRON_STORAGE_KEY);
      }
    } catch {
      // Ignore parse errors
    }
    return false;
  }, []);

  // Mark as authenticated
  const setAuthenticated = useCallback(() => {
    const authData = {
      authenticated: true,
      expiry: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      authenticatedAt: new Date().toISOString(),
    };
    localStorage.setItem(BRON_STORAGE_KEY, JSON.stringify(authData));
    setIsConnected(true);
    setIsWaitingForLogin(false);
    
    if (!hasNotified.current) {
      hasNotified.current = true;
      onConnectionComplete?.("bron");
    }
    
    toast({
      title: "Connected to BRON",
      description: "Successfully authenticated. Loading dashboard...",
    });
  }, [onConnectionComplete]);

  // Cleanup polling
  const cleanupPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const openLoginPopup = useCallback(() => {
    // Construct the login URL - point to their main dashboard page
    const loginUrl = `${BRON_LOGIN_URL}?domain_id=${BRON_DOMAIN_ID}&tab=analysis`;
    
    // Popup dimensions
    const popupWidth = 1200;
    const popupHeight = 800;
    const left = (window.screenX ?? 0) + (window.outerWidth - popupWidth) / 2;
    const top = (window.screenY ?? 0) + (window.outerHeight - popupHeight) / 2;

    setIsWaitingForLogin(true);

    const popup = window.open(
      loginUrl,
      "bron_login_popup",
      `popup=yes,width=${popupWidth},height=${popupHeight},left=${Math.max(0, left)},top=${Math.max(0, top)}`
    );

    if (!popup) {
      setIsWaitingForLogin(false);
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site and try again.",
        variant: "destructive",
      });
      return;
    }

    popupRef.current = popup;

    // Poll to detect when user has logged in (URL changes to dashboard with domain)
    // or when popup is closed
    cleanupPolling();
    
    pollIntervalRef.current = setInterval(() => {
      try {
        // Check if popup is closed
        if (!popupRef.current || popupRef.current.closed) {
          cleanupPolling();
          setIsWaitingForLogin(false);
          popupRef.current = null;
          return;
        }

        // Try to read the popup URL - this will work once they're on the dashboard
        // (same-origin policy prevents reading cross-origin URLs during login)
        try {
          const popupUrl = popupRef.current.location.href;
          
          // If we can read the URL and it contains domain info, they're logged in
          // The dashboard URL pattern is: /dashboard?domain_id=XXX or /domain/XXX
          if (popupUrl && (
            popupUrl.includes('/dashboard?domain_id=') ||
            popupUrl.includes('/domain/') ||
            popupUrl.includes('tab=analysis')
          )) {
            // User is logged in - check if we can see the dashboard content
            // Look for indicators that login was successful
            const doc = popupRef.current.document;
            if (doc) {
              // Check for logged-in indicators (profile elements, domain selectors, etc.)
              const hasNavbar = doc.querySelector('.navbar, nav, [class*="header"]');
              const hasDomainContent = doc.querySelector('[class*="domain"], [class*="dashboard"]');
              
              if (hasNavbar || hasDomainContent) {
                console.log("[BRON] Login detected - closing popup");
                cleanupPolling();
                popupRef.current.close();
                popupRef.current = null;
                setAuthenticated();
                return;
              }
            }
          }
        } catch {
          // Cross-origin error - this is expected during login flow
          // We'll keep polling until login completes
        }
      } catch {
        // Ignore errors from checking popup
      }
    }, 1000);

  }, [cleanupPolling, setAuthenticated]);

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

  // Listen for auth success message from popup (in case BronCallback is used)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === "BRON_AUTH_SUCCESS") {
        console.log("[BRON] Auth success message received from callback");
        cleanupPolling();
        
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        popupRef.current = null;
        
        setAuthenticated();
      } else if (event.data?.type === "BRON_AUTH_ERROR") {
        console.error("[BRON] Auth error:", event.data.error);
        cleanupPolling();
        setIsWaitingForLogin(false);
        toast({
          title: "Connection Failed",
          description: event.data.error || "Could not connect to BRON.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [cleanupPolling, setAuthenticated]);

  // Auto-open login popup immediately when not connected
  useEffect(() => {
    if (!isLoading && !isConnected && !hasAutoOpened.current && domain) {
      hasAutoOpened.current = true;
      openLoginPopup();
    }
  }, [isLoading, isConnected, domain, openLoginPopup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPolling();
    };
  }, [cleanupPolling]);

  const handleLogout = () => {
    localStorage.removeItem(BRON_STORAGE_KEY);
    setIsConnected(false);
    hasNotified.current = false;
    hasAutoOpened.current = false;
    toast({
      title: "Disconnected",
      description: "You've been logged out of BRON.",
    });
  };

  // Manually confirm login (fallback button)
  const confirmLogin = () => {
    cleanupPolling();
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
    setAuthenticated();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Connected - show iframe dashboard directly on this page
  if (isConnected && domain) {
    const iframeSrc = `${BRON_LOGIN_URL}?domain_id=${BRON_DOMAIN_ID}&tab=analysis`;
    
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <motion.div
                className="absolute -inset-1 rounded-xl border border-emerald-400/50"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                BRON Dashboard
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Connected
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Viewing dashboard for <span className="text-emerald-400 font-medium">{domain}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(iframeSrc, "_blank")}
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

        {/* Iframe Container - Full dashboard displayed here */}
        <div className="relative rounded-xl overflow-hidden border border-emerald-500/20 bg-background">
          <iframe
            src={iframeSrc}
            className="w-full min-h-[700px] border-0"
            title="BRON Dashboard"
            allow="clipboard-write"
          />
        </div>
      </motion.div>
    );
  }

  // Not connected - show waiting for popup state (popup already opened automatically)
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
        <h2 className="text-2xl font-bold">Connecting to BRON...</h2>
        <p className="text-muted-foreground max-w-md">
          {isWaitingForLogin 
            ? "Complete the login in the popup window. The dashboard will appear here once authenticated."
            : "Opening login popup..."
          }
        </p>
      </div>

      {isWaitingForLogin && (
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="default"
            size="lg"
            onClick={confirmLogin}
            className="gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
          >
            <Sparkles className="w-4 h-4" />
            I've Logged In - Show Dashboard
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (popupRef.current && !popupRef.current.closed) {
                popupRef.current.focus();
              } else {
                openLoginPopup();
              }
            }}
            className="gap-1.5 text-muted-foreground hover:text-emerald-400"
          >
            <RefreshCw className="w-4 h-4" />
            Popup not visible? Click to reopen
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-emerald-400" />
        Dashboard will load on this page after login
      </p>
    </motion.div>
  );
};

export default BRONPlatformConnect;
