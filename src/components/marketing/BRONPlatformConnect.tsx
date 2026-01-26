import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, Loader2, Sparkles, RefreshCw, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const BRON_STORAGE_KEY = "bron_dashboard_auth";
const BRON_SESSION_KEY = "bron_session_data";
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
  const [iframeKey, setIframeKey] = useState(0);
  const [loginDetected, setLoginDetected] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const hasAutoOpened = useRef(false);
  const hasNotified = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loginCheckRef = useRef<HTMLIFrameElement | null>(null);

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
        localStorage.removeItem(BRON_SESSION_KEY);
      }
    } catch {
      // Ignore parse errors
    }
    return false;
  }, []);

  // Mark as authenticated and close popup
  const setAuthenticated = useCallback(() => {
    console.log("[BRON] Setting authenticated state");
    
    const authData = {
      authenticated: true,
      expiry: Date.now() + 24 * 60 * 60 * 1000,
      authenticatedAt: new Date().toISOString(),
      domainId: BRON_DOMAIN_ID,
    };
    localStorage.setItem(BRON_STORAGE_KEY, JSON.stringify(authData));
    
    // Close the popup if it's still open
    if (popupRef.current && !popupRef.current.closed) {
      console.log("[BRON] Closing popup window");
      popupRef.current.close();
    }
    popupRef.current = null;
    
    setIsConnected(true);
    setIsWaitingForLogin(false);
    setLoginDetected(false);
    setIframeKey(prev => prev + 1);
    
    if (!hasNotified.current) {
      hasNotified.current = true;
      onConnectionComplete?.("bron");
    }
    
    toast({
      title: "Connected to BRON",
      description: "Loading dashboard...",
    });
  }, [onConnectionComplete]);

  const openLoginPopup = useCallback(() => {
    const loginUrl = `${BRON_LOGIN_URL}?domain_id=${BRON_DOMAIN_ID}&tab=analysis`;
    
    const popupWidth = 1200;
    const popupHeight = 800;
    const left = (window.screenX ?? 0) + (window.outerWidth - popupWidth) / 2;
    const top = (window.screenY ?? 0) + (window.outerHeight - popupHeight) / 2;

    setIsWaitingForLogin(true);
    setLoginDetected(false);

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
  }, []);

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

  // Listen for messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const allowedOrigins = [
        window.location.origin,
        "https://dashdev.imagehosting.space"
      ];
      
      if (!allowedOrigins.includes(event.origin)) return;
      
      console.log("[BRON] Message received:", event.data);
      
      if (event.data?.type === "BRON_AUTH_SUCCESS" || 
          event.data?.type === "auth" || 
          event.data?.authenticated ||
          event.data?.type === "login_complete" || 
          event.data?.loggedIn) {
        setAuthenticated();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setAuthenticated]);

  // Aggressive login detection polling
  useEffect(() => {
    if (!isWaitingForLogin || !popupRef.current) return;
    
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes max
    
    const pollInterval = setInterval(() => {
      attempts++;
      
      // Check if popup is closed
      if (!popupRef.current || popupRef.current.closed) {
        console.log("[BRON] Popup closed - assuming login complete");
        clearInterval(pollInterval);
        setAuthenticated();
        return;
      }
      
      // Try to detect if user has navigated to dashboard (logged in)
      try {
        // This will throw a security error if on cross-origin login page
        // but might work if they navigate to a page we can access
        const popupLocation = popupRef.current.location.href;
        console.log("[BRON] Can read popup location:", popupLocation);
        
        // If we can read the URL and it contains dashboard indicators
        if (popupLocation && popupLocation.includes('domain')) {
          console.log("[BRON] Dashboard URL detected - login complete");
          setLoginDetected(true);
          // Give it a moment to fully load, then close
          setTimeout(() => {
            if (popupRef.current && !popupRef.current.closed) {
              popupRef.current.close();
            }
            setAuthenticated();
          }, 1500);
          clearInterval(pollInterval);
          return;
        }
      } catch {
        // Expected cross-origin error - popup is still on BRON domain
        // This is normal during the login process
      }
      
      // Try to detect focus changes (user might have completed action)
      try {
        // Check if popup document is accessible (same-origin check)
        const popupDoc = popupRef.current.document;
        if (popupDoc) {
          // If we can access the document, check for logged-in indicators
          const hasProfile = popupDoc.querySelector('[class*="profile"], [class*="user"], [class*="avatar"]');
          const hasDashboard = popupDoc.querySelector('[class*="dashboard"], [class*="domain"]');
          
          if (hasProfile || hasDashboard) {
            console.log("[BRON] Login indicators found in popup DOM");
            setLoginDetected(true);
            setTimeout(() => {
              if (popupRef.current && !popupRef.current.closed) {
                popupRef.current.close();
              }
              setAuthenticated();
            }, 1000);
            clearInterval(pollInterval);
            return;
          }
        }
      } catch {
        // Cross-origin access denied - expected
      }
      
      // Timeout - stop polling after max attempts
      if (attempts >= maxAttempts) {
        console.log("[BRON] Max polling attempts reached");
        clearInterval(pollInterval);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [isWaitingForLogin, setAuthenticated]);

  // Auto-open login popup immediately when not connected
  useEffect(() => {
    if (!isLoading && !isConnected && !hasAutoOpened.current && domain) {
      hasAutoOpened.current = true;
      openLoginPopup();
    }
  }, [isLoading, isConnected, domain, openLoginPopup]);

  const handleLogout = () => {
    localStorage.removeItem(BRON_STORAGE_KEY);
    localStorage.removeItem(BRON_SESSION_KEY);
    setIsConnected(false);
    hasNotified.current = false;
    hasAutoOpened.current = false;
    setIframeKey(prev => prev + 1);
    toast({
      title: "Disconnected",
      description: "You've been logged out of BRON.",
    });
  };

  const refreshDashboard = () => {
    setIframeKey(prev => prev + 1);
    toast({
      title: "Refreshing",
      description: "Reloading BRON dashboard...",
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
              onClick={refreshDashboard}
              className="gap-1.5 border-border text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
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

        {/* Cookie/Session Notice */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p>
            If the dashboard shows a login page, your browser may be blocking third-party cookies. 
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => window.open(iframeSrc, "_blank")}
              className="text-amber-400 hover:text-amber-300 px-1 h-auto"
            >
              Open in a new tab
            </Button>
            for full functionality.
          </p>
        </div>

        {/* Iframe Container */}
        <div className="relative rounded-xl overflow-hidden border border-emerald-500/20 bg-background">
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={iframeSrc}
            className="w-full min-h-[700px] border-0"
            title="BRON Dashboard"
            allow="clipboard-write"
          />
        </div>
      </motion.div>
    );
  }

  // Not connected - show waiting state (popup opened automatically)
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
          {loginDetected ? "Login Detected!" : "Connecting to BRON..."}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {loginDetected 
            ? "Closing popup and loading dashboard..."
            : isWaitingForLogin 
              ? "Complete the login in the popup window. It will close automatically once done."
              : "Opening login popup..."
          }
        </p>
      </div>

      {isWaitingForLogin && !loginDetected && (
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
      )}

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-emerald-400" />
        {loginDetected ? "Preparing dashboard..." : "Popup will close automatically after login"}
      </p>
    </motion.div>
  );
};

export default BRONPlatformConnect;
