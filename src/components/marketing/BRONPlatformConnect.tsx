import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, Shield, LogOut, Loader2, Link2, TrendingUp, 
  Award, Building, Sparkles, CheckCircle, Boxes, Zap, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

const BRON_DASHBOARD_URL = "https://dashdev.imagehosting.space";
const BRON_LOGIN_URL = "https://dashdev.imagehosting.space/login";
const STORAGE_KEY = "bron_dashboard_auth";

export const BRONPlatformConnect = ({ domain, onConnectionComplete }: BRONPlatformConnectProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoadCount, setIframeLoadCount] = useState(0);

  // Check for existing auth on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.authenticated && authData.expiry > Date.now()) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Listen for auth confirmation from the dashboard (postMessage)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === "https://dashdev.imagehosting.space") {
        if (event.data?.type === "bron-auth-success") {
          const authData = {
            authenticated: true,
            expiry: Date.now() + 24 * 60 * 60 * 1000,
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

  // Auto-detect login by listening to iframe load events
  useEffect(() => {
    if (isAuthenticated) return;
    
    const handleIframeLoad = () => {
      const iframe = document.querySelector('iframe[title="BRON Login"]') as HTMLIFrameElement;
      if (!iframe) return;
      
      try {
        // Try to get the current URL - if it's no longer the login page, user has logged in
        // This will throw if cross-origin, but we can detect based on iframe behavior
        const iframeSrc = iframe.src;
        
        // If the iframe was redirected internally after login, detect by checking the URL
        // Since we can't access contentWindow.location due to cross-origin, we'll use a different approach
      } catch (e) {
        // Cross-origin access expected - this is actually a sign login might have succeeded
        // because the iframe is now showing the dashboard (different domain behavior)
      }
    };

    // Listen for navigation changes in the iframe
    const iframe = document.querySelector('iframe[title="BRON Login"]') as HTMLIFrameElement;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      return () => iframe.removeEventListener('load', handleIframeLoad);
    }
  }, [isAuthenticated]);

  // Check for cookies/session storage that might indicate authentication
  useEffect(() => {
    if (isAuthenticated) return;
    
    // Poll to check if the login page has been replaced with dashboard content
    // by monitoring for successful form submission redirect
    const pollInterval = setInterval(() => {
      const iframe = document.querySelector('iframe[title="BRON Login"]') as HTMLIFrameElement;
      if (!iframe) return;
      
      // Check if the iframe is showing non-login content by attempting to read its document
      // This is a heuristic - the external site's login will redirect on success
      try {
        // If we can access the iframe content at all, check if it's the dashboard
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          // Check if the page is the dashboard (not login)
          const isLoginPage = doc.querySelector('form[action*="login"]') || 
                             doc.querySelector('input[name="email"]') ||
                             doc.querySelector('input[name="password"]');
          
          if (!isLoginPage && doc.body && doc.body.innerText.length > 100) {
            // Likely logged in - dashboard is showing
            handleManualAuth();
          }
        }
      } catch {
        // Cross-origin - expected, cannot detect this way
      }
    }, 1500);
    
    return () => clearInterval(pollInterval);
  }, [isAuthenticated]);
  
  const handleManualAuth = () => {
    // Allow manual confirmation if auto-detection doesn't work
    const authData = {
      authenticated: true,
      expiry: Date.now() + 24 * 60 * 60 * 1000,
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
              If the dashboard shows a 419 error, click "Open Dashboard" above to use it in a new tab while iframe permissions are being configured.
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

  // Login prompt - full-width layout with iframe
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">BRON Dashboard Login</h2>
            <p className="text-sm text-muted-foreground">
              Log in below to access the Diamond Flow link building platform
            </p>
          </div>
        </div>
        <Button
          onClick={handleManualAuth}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          I've Logged In - Show Dashboard
        </Button>
      </div>

      {/* Full-width Login iframe with load detection */}
      <div className="rounded-xl border border-cyan-500/30 overflow-hidden bg-background">
        <iframe
          src={BRON_LOGIN_URL}
          className="w-full border-0"
          style={{ minHeight: '800px' }}
          title="BRON Login"
          allow="clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
          onLoad={() => {
            // Track iframe loads - first load is login page, second load is dashboard after login
            setIframeLoadCount(prev => {
              const newCount = prev + 1;
              
              // If this is the second (or later) load, user likely logged in
              if (newCount >= 2) {
                // Small delay to ensure dashboard content is ready
                setTimeout(() => {
                  const iframe = document.querySelector('iframe[title="BRON Login"]') as HTMLIFrameElement;
                  if (iframe) {
                    try {
                      const doc = iframe.contentDocument || iframe.contentWindow?.document;
                      if (doc) {
                        // Check if password field is gone (means we're past login)
                        const hasLoginForm = doc.querySelector('input[type="password"]');
                        if (!hasLoginForm) {
                          handleManualAuth();
                        }
                      }
                    } catch {
                      // Cross-origin error means we're on the dashboard (different page behavior)
                      // Auto-authenticate since login page was readable but dashboard is not
                      handleManualAuth();
                    }
                  }
                }, 300);
              }
              
              return newCount;
            });
          }}
        />
      </div>
    </motion.div>
  );
};

export default BRONPlatformConnect;
