import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, Shield, LogOut, Loader2, Link2, TrendingUp, 
  Award, Building, Sparkles, CheckCircle, Zap, Target,
  LogIn, ArrowRight, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { BRONExtendedSection } from "./ServiceTabExtensions";

interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

const BRON_DASHBOARD_URL = "https://dashdev.imagehosting.space/dashboard";
const BRON_LOGIN_URL = "https://dashdev.imagehosting.space/login";
const STORAGE_KEY = "bron_dashboard_auth";

// Public API for checking login status (keys are public routing identifiers, not secrets)
const BRON_STATUS_API = "https://public.imagehosting.space/feed/Article.php";
const BRON_API_ID = "53084";
const BRON_API_KEY = "347819526879185";
const BRON_KKYY = "AKhpU6QAbMtUDTphRPCezo96CztR9EXR";

export const BRONPlatformConnect = ({ domain, onConnectionComplete }: BRONPlatformConnectProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWaitingForPopup, setIsWaitingForPopup] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);

  // Check for existing auth on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.authenticated && authData.expiry > Date.now()) {
          setIsAuthenticated(true);
          onConnectionComplete?.("bron");
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, [onConnectionComplete]);

  const persistAuth = () => {
    const authData = {
      authenticated: true,
      expiry: Date.now() + 24 * 60 * 60 * 1000,
      authenticatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    setIsAuthenticated(true);
    setIsWaitingForPopup(false);
    onConnectionComplete?.("bron");
  };

  // Check login status via public API (keys are public routing identifiers)
  const checkLoginStatus = async (): Promise<boolean> => {
    if (!domain) return false;
    
    try {
      const url = `${BRON_STATUS_API}?feedit=add&domain=${encodeURIComponent(domain)}&apiid=${BRON_API_ID}&apikey=${BRON_API_KEY}&kkyy=${BRON_KKYY}`;
      
      const response = await fetch(url);
      if (!response.ok) return false;
      
      const text = await response.text();
      // API returns JSON array with domain data when logged in
      // e.g. [{"domainid":"111073","status":"2",...}]
      if (text.startsWith('[') && text.includes('"domainid"')) {
        console.log("[BRON] Login detected via API");
        return true;
      }
      return false;
    } catch (error) {
      console.log("[BRON] API check error:", error);
      return false;
    }
  };

  // Popup-based login with API polling
  const handlePopupLogin = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    setIsWaitingForPopup(true);

    const width = 520;
    const height = 720;
    const left = (window.screenX ?? 0) + (window.outerWidth - width) / 2;
    const top = (window.screenY ?? 0) + (window.outerHeight - height) / 2;

    const popup = window.open(
      BRON_LOGIN_URL,
      "bron_login",
      `popup=yes,width=${width},height=${height},left=${Math.max(0, left)},top=${Math.max(0, top)},scrollbars=yes`
    );

    if (!popup) {
      setIsWaitingForPopup(false);
      toast({
        title: "Popup Blocked",
        description: "Please allow popups so you can login to BRON.",
        variant: "destructive",
      });
      return;
    }

    popupRef.current = popup;

    // Poll API for login status every 2 seconds
    pollRef.current = window.setInterval(async () => {
      // Check if popup was closed
      const popupClosed = !popupRef.current || popupRef.current.closed;
      
      // Check login status via API
      const isLoggedIn = await checkLoginStatus();
      
      if (isLoggedIn) {
        // Login detected - close popup and show dashboard
        if (pollRef.current) window.clearInterval(pollRef.current);
        try { popupRef.current?.close(); } catch { /* ignore */ }
        popupRef.current = null;
        persistAuth();
        return;
      }
      
      if (popupClosed) {
        // Popup closed without login detected - stop polling but stay in waiting state
        if (pollRef.current) window.clearInterval(pollRef.current);
        popupRef.current = null;
      }
    }, 2000);
  };

  const handleContinueAfterLogin = () => {
    // User clicked "I've logged in" - close popup if still open and continue
    if (pollRef.current) window.clearInterval(pollRef.current);
    try {
      popupRef.current?.close();
    } catch {
      // ignore
    }
    popupRef.current = null;
    persistAuth();
  };

  const handleCancelLogin = () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    try {
      popupRef.current?.close();
    } catch {
      // ignore
    }
    popupRef.current = null;
    setIsWaitingForPopup(false);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    toast({
      title: "Disconnected",
      description: "You have been disconnected from BRON.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Waiting for popup login state
  if (isWaitingForPopup) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-8 space-y-6"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <motion.div
            className="absolute -inset-2 rounded-3xl border-2 border-emerald-400/50"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold">Waiting for BRON Login</h3>
          <p className="text-muted-foreground max-w-md">
            Complete your login in the popup window. Once you're logged in, 
            <span className="font-semibold text-foreground"> close the popup </span> 
            or click the button below.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button
            onClick={handleContinueAfterLogin}
            size="lg"
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            I've Logged In — Show Dashboard
          </Button>
          <Button
            onClick={handleCancelLogin}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      </motion.div>
    );
  }

  // Show embedded dashboard when authenticated
  if (isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Simple header with logout */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-green-600 dark:text-green-400">BRON Dashboard</span>
            {domain && <span className="text-sm text-muted-foreground">• {domain}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const iframe = document.getElementById('bron-dashboard-iframe') as HTMLIFrameElement | null;
                if (iframe) iframe.src = iframe.src;
              }}
              className="h-8 px-2"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(BRON_DASHBOARD_URL, '_blank')}
              className="h-8 px-2"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="h-8 gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Embedded BRON Dashboard */}
        <div className="rounded-xl overflow-hidden border border-border shadow-lg bg-background">
          <iframe
            id="bron-dashboard-iframe"
            src={BRON_DASHBOARD_URL}
            className="w-full h-[750px] border-0"
            title="BRON Dashboard"
            allow="clipboard-write; clipboard-read"
          />
        </div>
      </motion.div>
    );
  }

  // Login prompt
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
          { icon: Award, title: "DA & DR Growth", desc: "Increase domain authority metrics" },
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

      {/* Connect Card */}
      <Card className="border-emerald-500/30 bg-gradient-to-br from-background via-background to-emerald-500/5">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Connect to BRON Dashboard</CardTitle>
          <CardDescription>
            Access the Diamond Flow link building platform to boost your domain authority
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary: Popup Login */}
          <Button
            onClick={handlePopupLogin}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Login to BRON
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Login happens in a popup. After you sign in, close the popup to load the dashboard here.
          </p>
        </CardContent>
      </Card>

      {/* Info about the integration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-lg bg-secondary/30">
          <Sparkles className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
          <p className="text-sm font-medium">AI-Powered</p>
          <p className="text-xs text-muted-foreground">Intelligent link strategies</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30">
          <Building className="w-6 h-6 mx-auto mb-2 text-green-400" />
          <p className="text-sm font-medium">Real Websites</p>
          <p className="text-xs text-muted-foreground">No PBNs, only quality sites</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30">
          <Target className="w-6 h-6 mx-auto mb-2 text-teal-400" />
          <p className="text-sm font-medium">Targeted Links</p>
          <p className="text-xs text-muted-foreground">Relevant niche placements</p>
        </div>
      </div>

      {/* Show extended section preview */}
      <BRONExtendedSection domain={domain} />
    </motion.div>
  );
};

export default BRONPlatformConnect;