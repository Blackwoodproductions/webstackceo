import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, Shield, LogOut, Loader2, Link2, TrendingUp, 
  Award, Building, Sparkles, Zap, Target, RefreshCw, LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { BRONExtendedSection } from "./ServiceTabExtensions";
import { supabase } from "@/integrations/supabase/client";

interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

const BRON_DASHBOARD_URL = "https://dashdev.imagehosting.space/";
// Redirect-based login: redirect_uri points back to our callback page
const BRON_LOGIN_URL = `https://dashdev.imagehosting.space/login?redirect_uri=${encodeURIComponent(window.location.origin + '/bron-callback')}`;
const STORAGE_KEY = "bron_dashboard_auth";

export const BRONPlatformConnect = ({ domain, onConnectionComplete }: BRONPlatformConnectProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWaitingForPopup, setIsWaitingForPopup] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);
  const hasTriggeredAutoLogin = useRef(false);
  const [popupBlocked, setPopupBlocked] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.authenticated && authData.expiry > Date.now()) {
          setIsAuthenticated(true);
          onConnectionComplete?.("bron");
          setIsLoading(false);
          return;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, [onConnectionComplete]);

  // Listen for postMessage from popup callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our own origin
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === "BRON_AUTH_SUCCESS") {
        console.log("[BRON] Received auth success from popup");
        // Stop polling
        if (pollRef.current) window.clearInterval(pollRef.current);
        // Close popup if still open
        try { popupRef.current?.close(); } catch { /* ignore */ }
        popupRef.current = null;
        
        // Persist auth and show dashboard
        persistAuth();
        toast({
          title: "Connected to BRON",
          description: `Successfully connected ${domain} to the BRON platform.`,
        });
      } else if (event.data?.type === "BRON_AUTH_ERROR") {
        console.log("[BRON] Received auth error from popup:", event.data.error);
        if (pollRef.current) window.clearInterval(pollRef.current);
        popupRef.current = null;
        setIsWaitingForPopup(false);
        toast({
          title: "Connection Failed",
          description: event.data.error || "Failed to connect to BRON.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [domain]);

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

  // Check login status via backend function (avoids browser CORS)
  const checkLoginStatus = async (): Promise<boolean> => {
    if (!domain) return false;
    try {
      const { data, error } = await supabase.functions.invoke("bron-login-status", {
        body: { domain, feedit: "add" },
      });

      if (error) {
        console.log("[BRON] login-status error:", error);
        return false;
      }

      console.log("[BRON] login-status response:", data);
      return !!(data as any)?.loggedIn;
    } catch (err) {
      console.log("[BRON] login-status exception:", err);
      return false;
    }
  };

  // Check if localStorage was updated by the popup
  const checkLocalStorageAuth = (): boolean => {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.authenticated && authData.expiry > Date.now()) {
          return true;
        }
      } catch {
        // ignore
      }
    }
    return false;
  };

  // Start polling for login status
  const startLoginPolling = () => {
    pollRef.current = window.setInterval(async () => {
      const popupClosed = !popupRef.current || popupRef.current.closed;
      
      // First check localStorage (fastest, set by popup callback)
      if (checkLocalStorageAuth()) {
        if (pollRef.current) window.clearInterval(pollRef.current);
        try { popupRef.current?.close(); } catch { /* ignore */ }
        popupRef.current = null;
        persistAuth();
        toast({
          title: "Connected to BRON",
          description: `Successfully connected ${domain} to the BRON platform.`,
        });
        return;
      }
      
      // Fallback: check via backend API
      const isLoggedIn = await checkLoginStatus();
      if (isLoggedIn) {
        if (pollRef.current) window.clearInterval(pollRef.current);
        try { popupRef.current?.close(); } catch { /* ignore */ }
        popupRef.current = null;
        persistAuth();
        toast({
          title: "Connected to BRON",
          description: `Successfully connected ${domain} to the BRON platform.`,
        });
        return;
      }

      if (popupClosed) {
        // Popup closed without auth - check one more time
        if (checkLocalStorageAuth()) {
          if (pollRef.current) window.clearInterval(pollRef.current);
          popupRef.current = null;
          persistAuth();
          toast({
            title: "Connected to BRON",
            description: `Successfully connected ${domain} to the BRON platform.`,
          });
          return;
        }
        
        if (pollRef.current) window.clearInterval(pollRef.current);
        popupRef.current = null;
        setIsWaitingForPopup(false);
      }
    }, 1500);
  };

  // Open popup and start polling
  const openLoginPopup = () => {
    if (!domain) return;
    
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    setPopupBlocked(false);
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
      setPopupBlocked(true);
      return;
    }

    popupRef.current = popup;
    startLoginPolling();
  };

  // Auto-trigger login popup when component mounts (if not authenticated and domain is set)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && domain && !hasTriggeredAutoLogin.current && !isWaitingForPopup && !popupBlocked) {
      hasTriggeredAutoLogin.current = true;
      const timer = setTimeout(() => {
        openLoginPopup();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, domain, isWaitingForPopup, popupBlocked]);

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

  // Waiting for popup login state (auto-triggered)
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
          <h3 className="text-xl font-bold">Connecting to BRON</h3>
          <p className="text-muted-foreground max-w-md">
            Complete your login in the popup window. Once authenticated, the dashboard will load automatically.
          </p>
          {domain && (
            <p className="text-sm text-emerald-500 font-medium">Domain: {domain}</p>
          )}
        </div>

        <Button
          onClick={handleCancelLogin}
          variant="ghost"
          className="text-muted-foreground"
        >
          Cancel
        </Button>
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

  // Auto-login in progress or waiting for domain selection
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

      {/* Popup Blocked Instructions */}
      {popupBlocked && (
        <Card className="border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-background to-amber-500/5">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">Popup Blocked</CardTitle>
            <CardDescription>
              Your browser blocked the login popup. Please allow popups for webstack.ceo to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Chrome Instructions */}
            <div className="bg-secondary/50 rounded-lg p-4 text-sm space-y-3">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-red-500 via-yellow-500 to-green-500" />
                <span>Google Chrome</span>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Click the <strong>three dots (⋮)</strong> in the top-right corner → <strong>Settings</strong></li>
                <li>In the left menu, click <strong>"Privacy and security"</strong></li>
                <li>Click <strong>"Site Settings"</strong></li>
                <li>Under Content, find and click <strong>"Pop-ups and redirects"</strong></li>
                <li>Click <strong>"Add"</strong> next to "Allowed to send pop-ups"</li>
                <li>Enter <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">[*.]webstack.ceo</code> and click <strong>Add</strong></li>
              </ol>
            </div>

            {/* Firefox Instructions */}
            <div className="bg-secondary/50 rounded-lg p-4 text-sm space-y-3">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-orange-500 to-orange-600" />
                <span>Mozilla Firefox</span>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Click the <strong>three lines (☰)</strong> in the top-right corner → <strong>Settings</strong></li>
                <li>In the left menu, click <strong>"Privacy & Security"</strong></li>
                <li>Scroll down to the <strong>"Permissions"</strong> section</li>
                <li>Find <strong>"Block pop-up windows"</strong> and click <strong>"Exceptions..."</strong></li>
                <li>Enter <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">webstack.ceo</code> in the address field</li>
                <li>Click <strong>"Allow"</strong> then <strong>"Save Changes"</strong></li>
              </ol>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              After allowing popups, click the button below to try again.
            </p>
            
            <Button
              onClick={() => {
                setPopupBlocked(false);
                hasTriggeredAutoLogin.current = false;
                openLoginPopup();
              }}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Connect Card - shows when waiting for domain or ready to connect */}
      {!popupBlocked && (
        <Card className="border-emerald-500/30 bg-gradient-to-br from-background via-background to-emerald-500/5">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4">
              {domain ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <TrendingUp className="w-8 h-8 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {domain ? "Connecting to BRON..." : "Select a Domain"}
            </CardTitle>
            <CardDescription>
              {domain 
                ? "Opening login popup... Once you sign in, the dashboard will load automatically."
                : "Select a domain from the dropdown above to connect to the BRON platform."
              }
            </CardDescription>
          </CardHeader>
          {!domain && (
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Use the domain selector in the header to choose which domain to connect.
              </p>
            </CardContent>
          )}
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