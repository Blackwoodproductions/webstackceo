import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, Shield, LogOut, Loader2, Link2, TrendingUp, 
  Award, Building, Sparkles, CheckCircle, Zap, Target,
  LogIn, ArrowRight, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

const BRON_DASHBOARD_URL = "https://dashdev.imagehosting.space/dashboard";
const BRON_LOGIN_URL = "https://dashdev.imagehosting.space/login";
const STORAGE_KEY = "bron_dashboard_auth";

// Production callback URL - your self-hosted domain
const PRODUCTION_CALLBACK_URL = "https://webstack.ceo/bron/callback";

// Get the callback URL - always use production domain
const getCallbackUrl = () => {
  return PRODUCTION_CALLBACK_URL;
};

export const BRONPlatformConnect = ({ domain, onConnectionComplete }: BRONPlatformConnectProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Listen for postMessage from BRON (if they implement it)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === "https://dashdev.imagehosting.space") {
        if (event.data?.type === "bron-auth-success") {
          const authData = {
            authenticated: true,
            token: event.data?.token || null,
            expiry: Date.now() + 24 * 60 * 60 * 1000,
            authenticatedAt: new Date().toISOString(),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
          setIsAuthenticated(true);
          onConnectionComplete?.("bron");
          toast({
            title: "Successfully Connected!",
            description: "Your BRON dashboard is now linked.",
          });
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConnectionComplete]);

  // Primary: Popup-based login - popup is ONLY for authentication, content shows on main page
  const handlePopupLogin = () => {
    setIsLoading(true);
    
    // Clear local auth first
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    
    const width = 480;
    const height = 550;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // Open login page - this is ONLY for authentication
    const popup = window.open(
      BRON_LOGIN_URL,
      "bron_login",
      `width=${width},height=${height},left=${left},top=${top},popup=1,scrollbars=yes`
    );
    
    if (!popup) {
      setIsLoading(false);
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site to login to BRON.",
        variant: "destructive",
      });
      return;
    }

    // Track if we've completed auth to prevent duplicate handling
    let authCompleted = false;

    const completeAuth = () => {
      if (authCompleted) return;
      authCompleted = true;
      
      // Force close popup immediately - we don't want content shown there
      try {
        popup.close();
      } catch {
        // Popup might already be closed
      }
      
      // Save auth and show dashboard on MAIN page (not popup)
      const authData = {
        authenticated: true,
        token: null,
        expiry: Date.now() + 24 * 60 * 60 * 1000,
        authenticatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
      setIsAuthenticated(true);
      setIsLoading(false);
      onConnectionComplete?.("bron");
      
      toast({
        title: "Successfully Connected!",
        description: "BRON dashboard is now displayed on this page.",
      });
    };
    
    // Very fast polling - close popup as soon as we detect dashboard or any navigation
    const pollTimer = setInterval(() => {
      // Check if popup was closed by user
      if (popup.closed) {
        clearInterval(pollTimer);
        // User closed popup - assume they logged in successfully
        completeAuth();
        return;
      }
      
      try {
        // Try to read popup URL - this will throw cross-origin error most of the time
        const href = popup.location?.href;
        if (href) {
          // If we can read it and it's on the dashboard, close immediately
          if (href.includes('/dashboard') || href.includes('dashdev.imagehosting.space/dashboard')) {
            clearInterval(pollTimer);
            completeAuth();
            return;
          }
        }
      } catch {
        // Cross-origin error is expected when popup is on external domain
        // We'll rely on popup.closed detection or manual confirmation
      }
    }, 100); // Poll every 100ms for faster detection
    
    // Also listen for when user returns focus to main window
    const handleFocus = () => {
      // When user clicks back to main window, check if popup is still open
      setTimeout(() => {
        if (popup && !popup.closed) {
          // Popup still open - user might have logged in, close it
          try {
            // Try to read the URL one more time
            const href = popup.location?.href;
            if (href && href.includes('/dashboard')) {
              clearInterval(pollTimer);
              window.removeEventListener('focus', handleFocus);
              completeAuth();
            }
          } catch {
            // Can't read URL - that's ok
          }
        }
      }, 200);
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Timeout after 3 minutes
    setTimeout(() => {
      clearInterval(pollTimer);
      window.removeEventListener('focus', handleFocus);
      if (!authCompleted) {
        try { popup.close(); } catch {}
        setIsLoading(false);
        toast({
          title: "Login Timeout",
          description: "Please try again or use 'Login in New Tab' option.",
          variant: "destructive",
        });
      }
    }, 3 * 60 * 1000);
  };

  // Open in new tab as alternative
  const handleNewTabLogin = () => {
    window.open(BRON_LOGIN_URL, '_blank');
    toast({
      title: "Login in New Tab",
      description: "After logging in, return here and click 'Show Dashboard'.",
    });
  };

  // Manual confirmation for when redirect doesn't work
  const handleManualAuth = () => {
    const authData = {
      authenticated: true,
      token: null,
      expiry: Date.now() + 24 * 60 * 60 * 1000,
      authenticatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    setIsAuthenticated(true);
    onConnectionComplete?.("bron");
    toast({
      title: "Successfully Connected!",
      description: "Your BRON dashboard is now linked.",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    toast({
      title: "Logged Out",
      description: "You have been disconnected from the BRON dashboard.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  // Show BRON Dashboard iframe when authenticated
  if (isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Header with logout */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">BRON Dashboard Connected</p>
              {domain && (
                <p className="text-xs text-muted-foreground">Domain: {domain}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const iframe = document.getElementById('bron-dashboard-iframe') as HTMLIFrameElement;
                if (iframe) iframe.src = iframe.src;
              }}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => window.open(BRON_DASHBOARD_URL, '_blank')}
              className="text-xs gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs gap-1 text-muted-foreground hover:text-destructive hover:border-destructive/50"
            >
              <LogOut className="w-3 h-3" />
              Disconnect
            </Button>
          </div>
        </div>

        {/* BRON Dashboard iframe */}
        <div className="rounded-xl overflow-hidden border border-border shadow-lg bg-background">
          <iframe
            id="bron-dashboard-iframe"
            src={BRON_DASHBOARD_URL}
            className="w-full h-[700px] border-0"
            title="BRON Dashboard"
            allow="clipboard-write; clipboard-read"
          />
        </div>
      </motion.div>
    );
  }

  // Login prompt with redirect-based OAuth
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
          <Card key={index} className="bg-gradient-to-br from-background to-secondary/20 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center mb-3">
                <feature.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Login Card */}
      <Card className="border-cyan-500/30 bg-gradient-to-br from-background via-background to-cyan-500/5">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mx-auto mb-4">
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
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Waiting for login...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Login to BRON
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Alternative: New Tab Login */}
          <Button
            onClick={handleNewTabLogin}
            variant="outline"
            className="w-full border-cyan-500/30 hover:bg-cyan-500/10"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Login in New Tab
          </Button>

          {/* Manual confirmation for edge cases */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Already logged in to BRON in another tab?
            </p>
            <Button
              onClick={handleManualAuth}
              variant="ghost"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              I've Logged In - Show Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info about the integration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-lg bg-secondary/30">
          <Sparkles className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
          <p className="text-sm font-medium">AI-Powered</p>
          <p className="text-xs text-muted-foreground">Intelligent link strategies</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30">
          <Building className="w-6 h-6 mx-auto mb-2 text-blue-400" />
          <p className="text-sm font-medium">Real Websites</p>
          <p className="text-xs text-muted-foreground">No PBNs, only quality sites</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30">
          <Target className="w-6 h-6 mx-auto mb-2 text-violet-400" />
          <p className="text-sm font-medium">Targeted Links</p>
          <p className="text-xs text-muted-foreground">Relevant niche placements</p>
        </div>
      </div>
    </motion.div>
  );
};

export default BRONPlatformConnect;
