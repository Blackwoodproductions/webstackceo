import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, Shield, LogOut, Loader2, Link2, TrendingUp, 
  Award, Building, Sparkles, CheckCircle, Boxes, Zap, Target,
  LogIn, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

const BRON_DASHBOARD_URL = "https://dashdev.imagehosting.space/dashboard";
const BRON_LOGIN_URL = "https://dashdev.imagehosting.space/login";
const BRON_LOGOUT_URL = "https://dashdev.imagehosting.space/logout";
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

  // Primary: Popup-based login - forces logout first to ensure login prompt
  const handlePopupLogin = () => {
    setIsLoading(true);
    
    // Clear local auth first
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // First logout to clear any existing session, then redirect to login
    // Using logout URL with redirect back to login to force credential prompt
    const logoutThenLoginUrl = `${BRON_LOGOUT_URL}?redirect=${encodeURIComponent(BRON_LOGIN_URL)}`;
    
    const popup = window.open(
      logoutThenLoginUrl,
      "bron_login",
      `width=${width},height=${height},left=${left},top=${top},popup=1`
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
    
    // Poll to check if popup closed AND if user navigated to dashboard (successful login)
    const pollTimer = setInterval(() => {
      try {
        // Check if popup navigated to dashboard (successful login)
        if (popup.location?.href?.includes('/dashboard')) {
          clearInterval(pollTimer);
          popup.close();
          
          // User successfully logged in - save auth and show iframe
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
            description: "Your BRON dashboard is now displayed below.",
          });
          return;
        }
      } catch {
        // Cross-origin error - can't read popup location, continue polling
      }
      
      // Check if popup was closed manually
      if (popup.closed) {
        clearInterval(pollTimer);
        setIsLoading(false);
        
        // Automatically show dashboard since user likely logged in
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
          title: "Dashboard Connected",
          description: "Your BRON dashboard is now displayed below.",
        });
      }
    }, 500);
    
    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(pollTimer);
      setIsLoading(false);
    }, 5 * 60 * 1000);
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

  // Show iframe when authenticated
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
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => window.open(BRON_DASHBOARD_URL, '_blank')}
              className="text-xs gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Dashboard
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

        {/* Info banner for iframe configuration */}
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
              <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              If the dashboard shows a 419 error, click "Open Dashboard" above to use it in a new tab.
            </p>
          </div>
        </div>

        {/* Dashboard iframe - full width */}
        <div className="rounded-xl border border-border overflow-hidden bg-background">
          <iframe
            src={BRON_DASHBOARD_URL}
            className="w-full border-0"
            style={{ minHeight: '2400px' }}
            title="BRON Dashboard"
            allow="clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
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
