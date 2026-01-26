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

  const openLoginPopup = useCallback(() => {
    // Construct the login URL with domain_id and tab
    const callbackUrl = `${window.location.origin}/bron-callback`;
    const loginUrl = `${BRON_LOGIN_URL}?domain_id=${BRON_DOMAIN_ID}&tab=analysis&redirect_uri=${encodeURIComponent(callbackUrl)}`;
    
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

  // Listen for auth success message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our own origin
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === "BRON_AUTH_SUCCESS") {
        console.log("[BRON] Auth success message received");
        setIsConnected(true);
        setIsWaitingForLogin(false);
        
        // Close popup if still open
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        popupRef.current = null;
        
        toast({
          title: "Connected to BRON",
          description: "Successfully authenticated. Loading dashboard...",
        });
        
        if (!hasNotified.current) {
          hasNotified.current = true;
          onConnectionComplete?.("bron");
        }
      } else if (event.data?.type === "BRON_AUTH_ERROR") {
        console.error("[BRON] Auth error:", event.data.error);
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
  }, [onConnectionComplete]);

  // Auto-open login popup immediately when not connected
  useEffect(() => {
    if (!isLoading && !isConnected && !hasAutoOpened.current && domain) {
      hasAutoOpened.current = true;
      // Open popup immediately
      openLoginPopup();
    }
  }, [isLoading, isConnected, domain, openLoginPopup]);

  // Poll for popup closure
  useEffect(() => {
    if (!popupRef.current) return;
    
    const pollInterval = setInterval(() => {
      if (popupRef.current?.closed) {
        clearInterval(pollInterval);
        setIsWaitingForLogin(false);
        
        // Check if auth was successful (localStorage updated by BronCallback)
        const isAuth = checkAuth();
        if (isAuth && !isConnected) {
          setIsConnected(true);
          if (!hasNotified.current) {
            hasNotified.current = true;
            onConnectionComplete?.("bron");
          }
          toast({
            title: "Connected to BRON",
            description: "Successfully authenticated. Loading dashboard...",
          });
        }
        popupRef.current = null;
      }
    }, 500);

    return () => clearInterval(pollInterval);
  }, [isWaitingForLogin, checkAuth, isConnected, onConnectionComplete]);

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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (popupRef.current && !popupRef.current.closed) {
                popupRef.current.focus();
              } else {
                openLoginPopup();
              }
            }}
            className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            <RefreshCw className="w-4 h-4" />
            Popup not visible? Click to reopen
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-emerald-400" />
        Dashboard will load automatically after login
      </p>
    </motion.div>
  );
};

export default BRONPlatformConnect;
