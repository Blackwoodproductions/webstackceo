import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, Loader2, Sparkles, Check, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useBronLoginPopup } from "@/hooks/use-bron-login-popup";

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
  const [iframeKey, setIframeKey] = useState(0);
  const [readyToLoadAfterPopup, setReadyToLoadAfterPopup] = useState(false);
  const hasNotified = useRef(false);
  const autoOpenAttempted = useRef(false);

  // Dashboard URL for iframe
  const iframeSrc = `${BRON_LOGIN_URL}?domain_id=${BRON_DOMAIN_ID}&tab=analysis`;

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

  // Mark as authenticated (session is set by browser cookies; we only persist state)
  const setAuthenticated = useCallback(() => {
    console.log("[BRON] Setting authenticated state");
    
    // Store auth in localStorage
    const authData = {
      authenticated: true,
      expiry: Date.now() + 24 * 60 * 60 * 1000,
      authenticatedAt: new Date().toISOString(),
      domainId: BRON_DOMAIN_ID,
    };
    localStorage.setItem(BRON_STORAGE_KEY, JSON.stringify(authData));
    
    setIsConnected(true);
    setIframeKey(prev => prev + 1); // Force iframe refresh
    
    if (!hasNotified.current) {
      hasNotified.current = true;
      onConnectionComplete?.("bron");
    }
    
    toast({
      title: "Connected to BRON",
      description: "Dashboard is now loading below.",
    });
  }, [onConnectionComplete]);

  const {
    isWaitingForLogin,
    popupBlocked,
    didClose,
    openPopup,
    focusPopup,
  } = useBronLoginPopup({
    loginUrl: iframeSrc,
    onClosed: () => setReadyToLoadAfterPopup(true),
  });

  // Also accept explicit callback completion (if BRON redirects to /bron-callback).
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
    setReadyToLoadAfterPopup(false);
    
    if (isAuth && !hasNotified.current) {
      hasNotified.current = true;
      onConnectionComplete?.("bron");
    }
  }, [checkAuth, onConnectionComplete]);

  // Auto-open login popup when component mounts (if not already connected)
  useEffect(() => {
    if (!isLoading && !isConnected && domain && !autoOpenAttempted.current) {
      autoOpenAttempted.current = true;
      setReadyToLoadAfterPopup(false);
      
      // Small delay to ensure component is fully mounted
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
    setReadyToLoadAfterPopup(false);
    
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

        {/* Cookie warning */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-muted-foreground">
            If the dashboard doesn't load properly, your browser may be blocking third-party cookies.{" "}
            <button 
              onClick={() => window.open(iframeSrc, '_blank')}
              className="text-emerald-400 hover:underline"
            >
              Open in a new tab instead
            </button>
          </p>
        </div>

        {/* Dashboard iframe */}
        <div className="rounded-xl border border-border/50 overflow-hidden bg-background">
          <iframe
            key={iframeKey}
            src={iframeSrc}
            className="w-full min-h-[700px] border-0"
            title="BRON Dashboard"
            allow="clipboard-write"
          />
        </div>
      </motion.div>
    );
  }

  // Not connected - show waiting for login state
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
           {isWaitingForLogin
             ? "Waiting for Login..."
             : readyToLoadAfterPopup || didClose
               ? "Login window closed"
               : "Opening Login..."}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {popupBlocked
            ? "Your browser blocked the popup. Please allow popups, then click 'Open Login'."
            : isWaitingForLogin
              ? "Please login in the popup window. It will close automatically once you're logged in."
               : readyToLoadAfterPopup || didClose
                 ? "If you completed the BRON login, click 'Load Dashboard' to continue. If not, reopen the login popup."
                 : "Opening BRON login window..."}
        </p>
      </div>

       {(readyToLoadAfterPopup || didClose) && (
         <div className="flex items-center gap-2">
           <Button
             size="sm"
             onClick={() => {
               // We can't reliably verify cross-site login state; this simply loads the embedded dashboard.
               setAuthenticated();
             }}
             className="gap-1.5"
           >
             Load Dashboard
           </Button>
           <Button
             variant="outline"
             size="sm"
             onClick={() => {
               setReadyToLoadAfterPopup(false);
               const opened = openPopup();
               if (!opened) {
                 toast({
                   title: "Popup Blocked",
                   description: "Please allow popups for this site and try again.",
                   variant: "destructive",
                 });
               }
             }}
             className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
           >
             Reopen Login
           </Button>
         </div>
       )}

       {(isWaitingForLogin || popupBlocked) && !(readyToLoadAfterPopup || didClose) && (
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
          {isWaitingForLogin ? "Focus Login Window" : "Open Login"}
        </Button>
      )}

       <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-emerald-400" />
         Close the popup after you finish logging in, then load the dashboard here
      </p>
    </motion.div>
  );
};

export default BRONPlatformConnect;
