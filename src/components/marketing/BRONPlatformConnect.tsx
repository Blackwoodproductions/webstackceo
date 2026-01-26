import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, Loader2, Link2, TrendingUp, 
  Award, Sparkles, Zap, Target, LogIn, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { BronDashboard } from "./BronDashboard";

const BRON_STORAGE_KEY = "bron_dashboard_auth";
const BRON_LOGIN_URL = "https://dashdev.imagehosting.space/";

interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

export const BRONPlatformConnect = ({ domain, onConnectionComplete }: BRONPlatformConnectProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
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
        setIsOpening(false);
        
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
        setIsOpening(false);
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

  // Auto-open login popup when component mounts and not connected
  useEffect(() => {
    if (!isLoading && !isConnected && !hasAutoOpened.current && domain) {
      hasAutoOpened.current = true;
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        openLoginPopup();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isConnected, domain]);

  // Poll for popup closure
  useEffect(() => {
    if (!popupRef.current) return;
    
    const pollInterval = setInterval(() => {
      if (popupRef.current?.closed) {
        clearInterval(pollInterval);
        setIsOpening(false);
        
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
  }, [isOpening, checkAuth, isConnected, onConnectionComplete]);

  const openLoginPopup = () => {
    // Construct callback URL
    const callbackUrl = `${window.location.origin}/bron-callback`;
    const loginUrl = `${BRON_LOGIN_URL}?redirect_uri=${encodeURIComponent(callbackUrl)}`;
    
    // Popup dimensions
    const popupWidth = 520;
    const popupHeight = 720;
    const left = (window.screenX ?? 0) + (window.outerWidth - popupWidth) / 2;
    const top = (window.screenY ?? 0) + (window.outerHeight - popupHeight) / 2;

    setIsOpening(true);

    const popup = window.open(
      loginUrl,
      "bron_login_popup",
      `popup=yes,width=${popupWidth},height=${popupHeight},left=${Math.max(0, left)},top=${Math.max(0, top)}`
    );

    if (!popup) {
      setIsOpening(false);
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site and try again.",
        variant: "destructive",
      });
      return;
    }

    popupRef.current = popup;
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Connected - show dashboard
  if (isConnected && domain) {
    return <BronDashboard domain={domain} onLogout={handleLogout} />;
  }

  // Not connected - show login prompt
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Link2, title: "Keyword Clustering", desc: "AI-powered topical organization" },
          { icon: TrendingUp, title: "Deep Linking", desc: "Strategic internal link building" },
          { icon: Award, title: "Authority Growth", desc: "Increase domain authority metrics" },
          { icon: Zap, title: "Autopilot Links", desc: "Automated inbound link acquisition" },
        ].map((feature, index) => (
          <Card key={index} className="bg-gradient-to-br from-background to-secondary/20 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400/20 to-green-500/20 flex items-center justify-center mb-3">
                <feature.icon className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Login Card */}
      <Card className="border-emerald-500/30 bg-gradient-to-br from-background via-background to-emerald-500/5">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Connect to BRON</CardTitle>
          <CardDescription>
            {isOpening 
              ? "Complete the login in the popup window..."
              : "Sign in to your BRON account to access the dashboard."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={openLoginPopup}
            disabled={isOpening}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold"
          >
            {isOpening ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Waiting for login...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Sign in with BRON
              </>
            )}
          </Button>

          {isOpening && (
            <div className="text-center">
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
                className="text-emerald-400 hover:text-emerald-300"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Popup not visible? Click to reopen
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-2">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Login opens in a popup window</span>
          </div>
        </CardContent>
      </Card>

      {/* No domain selected message */}
      {!domain && (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="py-8 text-center">
            <Target className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Select a domain from the dropdown above to view your dashboard.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info about the integration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-lg bg-secondary/30">
          <Sparkles className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
          <p className="text-sm font-medium">AI-Powered</p>
          <p className="text-xs text-muted-foreground">Intelligent link strategies</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30">
          <Award className="w-6 h-6 mx-auto mb-2 text-green-400" />
          <p className="text-sm font-medium">Real Websites</p>
          <p className="text-xs text-muted-foreground">No PBNs, only quality sites</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30">
          <Target className="w-6 h-6 mx-auto mb-2 text-teal-400" />
          <p className="text-sm font-medium">Targeted Links</p>
          <p className="text-xs text-muted-foreground">Relevant niche placements</p>
        </div>
      </div>

      {/* External link fallback */}
      <div className="text-center">
        <Button
          variant="link"
          onClick={() => window.open(BRON_LOGIN_URL, "_blank")}
          className="text-muted-foreground hover:text-emerald-400"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Open BRON Dashboard in New Tab
        </Button>
      </div>
    </motion.div>
  );
};

export default BRONPlatformConnect;
