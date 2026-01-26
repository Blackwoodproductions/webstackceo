import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, Loader2, Sparkles, RefreshCw, Check
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
  const [dashboardWindow, setDashboardWindow] = useState<Window | null>(null);
  const popupRef = useRef<Window | null>(null);
  const hasNotified = useRef(false);
  const autoOpenAttempted = useRef(false);

  // Dashboard URL
  const dashboardUrl = `${BRON_LOGIN_URL}?domain_id=${BRON_DOMAIN_ID}&tab=analysis`;

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

  // Mark as authenticated
  const setAuthenticated = useCallback(() => {
    console.log("[BRON] Setting authenticated state");
    
    const authData = {
      authenticated: true,
      expiry: Date.now() + 24 * 60 * 60 * 1000,
      authenticatedAt: new Date().toISOString(),
      domainId: BRON_DOMAIN_ID,
    };
    localStorage.setItem(BRON_STORAGE_KEY, JSON.stringify(authData));
    
    setIsConnected(true);
    setIsWaitingForLogin(false);
    
    // Keep the popup window reference as the dashboard window
    if (popupRef.current && !popupRef.current.closed) {
      setDashboardWindow(popupRef.current);
    }
    
    if (!hasNotified.current) {
      hasNotified.current = true;
      onConnectionComplete?.("bron");
    }
    
    toast({
      title: "Connected to BRON",
      description: "Dashboard is open in a separate window.",
    });
  }, [onConnectionComplete]);

  const openDashboard = useCallback(() => {
    const popupWidth = 1400;
    const popupHeight = 900;
    const left = (window.screenX ?? 0) + (window.outerWidth - popupWidth) / 2;
    const top = (window.screenY ?? 0) + (window.outerHeight - popupHeight) / 2;

    setIsWaitingForLogin(true);

    const popup = window.open(
      dashboardUrl,
      "bron_dashboard",
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
    setDashboardWindow(popup);
  }, [dashboardUrl]);

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

  // Auto-open dashboard popup on first render when domain is present
  useEffect(() => {
    if (!isLoading && domain && !autoOpenAttempted.current) {
      autoOpenAttempted.current = true;
      
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        console.log("[BRON] Auto-opening dashboard popup");
        openDashboard();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, domain, openDashboard]);

  // Poll for popup state
  useEffect(() => {
    if (!isWaitingForLogin || !popupRef.current) return;
    
    const pollInterval = setInterval(() => {
      // Check if popup is closed
      if (!popupRef.current || popupRef.current.closed) {
        clearInterval(pollInterval);
        popupRef.current = null;
        setDashboardWindow(null);
        
        // Mark as authenticated since they used the dashboard
        if (!isConnected) {
          setAuthenticated();
        }
        setIsWaitingForLogin(false);
        return;
      }
      
      // If popup is still open after 3 seconds, assume they're logged in
      // and mark as connected (they're using the dashboard)
      if (!isConnected) {
        setAuthenticated();
      }
    }, 1000);

    // Mark as connected after a short delay (popup is open = using dashboard)
    const authTimer = setTimeout(() => {
      if (!isConnected && popupRef.current && !popupRef.current.closed) {
        setAuthenticated();
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(authTimer);
    };
  }, [isWaitingForLogin, isConnected, setAuthenticated]);

  // Check if dashboard window is still open
  useEffect(() => {
    if (!dashboardWindow) return;
    
    const checkInterval = setInterval(() => {
      if (dashboardWindow.closed) {
        setDashboardWindow(null);
      }
    }, 2000);
    
    return () => clearInterval(checkInterval);
  }, [dashboardWindow]);

  const handleLogout = () => {
    localStorage.removeItem(BRON_STORAGE_KEY);
    setIsConnected(false);
    hasNotified.current = false;
    autoOpenAttempted.current = false;
    
    // Close dashboard window if open
    if (dashboardWindow && !dashboardWindow.closed) {
      dashboardWindow.close();
    }
    setDashboardWindow(null);
    
    toast({
      title: "Disconnected",
      description: "You've been logged out of BRON.",
    });
  };

  const focusDashboard = () => {
    if (dashboardWindow && !dashboardWindow.closed) {
      dashboardWindow.focus();
    } else {
      openDashboard();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Connected state - show status and controls
  if (isConnected) {
    const isDashboardOpen = dashboardWindow && !dashboardWindow.closed;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
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
                Managing <span className="text-emerald-400 font-medium">{domain}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={focusDashboard}
              className="gap-1.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              <ExternalLink className="w-4 h-4" />
              {isDashboardOpen ? "Focus Dashboard" : "Open Dashboard"}
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

        {/* Status Card */}
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-green-500/5 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
              {isDashboardOpen ? (
                <Check className="w-7 h-7 text-emerald-400" />
              ) : (
                <ExternalLink className="w-7 h-7 text-emerald-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-emerald-400">
                {isDashboardOpen ? "Dashboard is Open" : "Dashboard Ready"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isDashboardOpen 
                  ? "The BRON dashboard is open in a separate window. Click 'Focus Dashboard' to bring it to front."
                  : "Click 'Open Dashboard' to access your BRON dashboard in a new window."
                }
              </p>
            </div>
          </div>
          
          {!isDashboardOpen && (
            <Button
              onClick={focusDashboard}
              className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open BRON Dashboard
            </Button>
          )}
        </div>

        {/* Info boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-lg bg-secondary/30 border border-emerald-500/10">
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
            <p className="text-sm font-medium">AI-Powered</p>
            <p className="text-xs text-muted-foreground">Intelligent link strategies</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30 border border-emerald-500/10">
            <Check className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-sm font-medium">Real Websites</p>
            <p className="text-xs text-muted-foreground">No PBNs, only quality sites</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30 border border-emerald-500/10">
            <ExternalLink className="w-6 h-6 mx-auto mb-2 text-teal-400" />
            <p className="text-sm font-medium">Full Access</p>
            <p className="text-xs text-muted-foreground">Opens in dedicated window</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Not connected - show waiting state
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
        <h2 className="text-2xl font-bold">Opening BRON Dashboard...</h2>
        <p className="text-muted-foreground max-w-md">
          {isWaitingForLogin 
            ? "Login in the popup window. The dashboard will stay open for you to use."
            : "Opening dashboard window..."
          }
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.focus();
          } else {
            openDashboard();
          }
        }}
        className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
      >
        <RefreshCw className="w-4 h-4" />
        {isWaitingForLogin ? "Focus Dashboard Window" : "Open Dashboard"}
      </Button>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-emerald-400" />
        Dashboard opens in a dedicated window for best experience
      </p>
    </motion.div>
  );
};

export default BRONPlatformConnect;
