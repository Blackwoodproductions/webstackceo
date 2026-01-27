import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, Loader2, Sparkles, Check, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useBronApiAuth } from "@/hooks/use-bron-api-auth";
import { useBronTokenAuth, BronSession } from "@/hooks/use-bron-token-auth";

const BRON_DASHBOARD_URL = "https://dashdev.imagehosting.space/dashboard";

interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

export const BRONPlatformConnect = ({ domain, onConnectionComplete }: BRONPlatformConnectProps) => {
  const [iframeKey, setIframeKey] = useState(0);
  const hasNotified = useRef(false);
  const autoOpenAttempted = useRef(false);

  // Token-based authentication
  const {
    isLoading: isTokenLoading,
    isAuthenticated,
    session,
    createSession,
    logout,
  } = useBronTokenAuth({
    domain: domain || "",
    onAuthenticated: (sess: BronSession) => {
      console.log("[BRON] Token auth successful, domainId:", sess.domainId, "embedToken:", !!sess.embedToken);
      setIframeKey(prev => prev + 1);
      
      if (!hasNotified.current) {
        hasNotified.current = true;
        onConnectionComplete?.("bron");
      }
      
      toast({
        title: "Connected to BRON",
        description: "Dashboard is now loading below.",
      });
    },
    onLogout: () => {
      hasNotified.current = false;
      autoOpenAttempted.current = false;
    },
  });

  // Popup-based login flow - now receives token from callback
  const {
    isWaitingForLogin,
    popupBlocked,
    openPopup,
    focusPopup,
  } = useBronApiAuth({
    domain: domain || "",
    onLoggedIn: async (bronToken?: string | null) => {
      // After popup login, create a token session with the BRON token
      console.log("[BRON] Popup login completed, creating token session with bronToken:", !!bronToken);
      const success = await createSession(bronToken);
      if (!success) {
        toast({
          title: "Session Error",
          description: "Failed to create session. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Auto-open login popup when component mounts (if not already authenticated)
  useEffect(() => {
    if (!isTokenLoading && !isAuthenticated && domain && !autoOpenAttempted.current) {
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
  }, [domain, isAuthenticated, isTokenLoading, openPopup]);

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Disconnected",
      description: "You've been logged out of BRON.",
    });
  };

  // Build iframe URL with token parameters for BRON authentication
  const buildIframeSrc = useCallback(() => {
    const params = new URLSearchParams();
    params.set("tab", "analysis");
    
    if (session?.domainId) {
      params.set("domain_id", session.domainId);
    }
    if (session?.userId) {
      params.set("user_id", session.userId);
    }
    // Pass embed token for authentication within BRON's dashboard
    if (session?.embedToken) {
      params.set("token", session.embedToken);
      params.set("auth_token", session.embedToken);
      params.set("embed_token", session.embedToken);
    }
    
    return `${BRON_DASHBOARD_URL}?${params.toString()}`;
  }, [session]);

  // Loading state
  if (isTokenLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Authenticated state - show iframe dashboard
  if (isAuthenticated && session) {
    const iframeSrc = buildIframeSrc();
    
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
                  {session.embedToken ? "Token Auth" : "Session Active"}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Managing <span className="text-emerald-400 font-medium">{domain}</span>
                {session.domainId && (
                  <span className="text-xs ml-2 text-muted-foreground/60">
                    (ID: {session.domainId})
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
          >
            Disconnect
          </Button>
        </div>

        {/* Session info */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
          <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="text-muted-foreground">
            <span className="text-emerald-400 font-medium">
              {session.embedToken ? "Token-based authentication active." : "Session active."}
            </span>{" "}
            Expires: {new Date(session.expiresAt).toLocaleString()}
          </div>
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

  // Not authenticated - show waiting for login
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
          {isWaitingForLogin ? "Waiting for Login..." : "Opening Login..."}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {popupBlocked
            ? "Your browser blocked the popup. Please allow popups, then click 'Open Login'."
            : isWaitingForLogin
              ? "Please complete the login in the popup window. Your session token will be used to authenticate the dashboard."
              : "Opening BRON login window..."}
        </p>
      </div>

      {/* Show Open Login button if popup blocked or not waiting */}
      {(popupBlocked || !isWaitingForLogin) && (
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

      {isWaitingForLogin && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Waiting for login confirmation...
        </p>
      )}
    </motion.div>
  );
};

export default BRONPlatformConnect;
