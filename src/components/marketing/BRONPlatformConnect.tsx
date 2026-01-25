import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ExternalLink, Shield, LogOut, Sparkles, Loader2, Link2
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

  const handleLogin = () => {
    // Open login in new tab
    window.open(BRON_LOGIN_URL, "_blank");
    
    // Mark as authenticated after they click (they'll login in new tab)
    // This is a temporary solution - ideally we'd use postMessage from the dashboard
    setTimeout(() => {
      const authData = {
        authenticated: true,
        expiry: Date.now() + 24 * 60 * 60 * 1000,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
      setIsAuthenticated(true);
      onConnectionComplete?.("bron");
    }, 2000);
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
              <p className="text-xs text-muted-foreground">Blackwood SEO V2</p>
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

        {/* Dashboard iframe */}
        <div className="rounded-xl border border-border overflow-hidden bg-background">
          <iframe
            src={BRON_DASHBOARD_URL}
            className="w-full border-0"
            style={{ minHeight: '800px', height: 'calc(100vh - 300px)' }}
            title="BRON Dashboard"
            allow="clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </motion.div>
    );
  }

  // Login prompt using Connect Your Website box style
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl border-2 border-dashed border-cyan-500/40 bg-gradient-to-br from-slate-900/50 to-slate-800/30"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link2 className="w-6 h-6 text-cyan-400" />
        <h3 className="text-xl font-semibold text-foreground">Connect Your Website</h3>
      </div>

      {/* Description */}
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Connect your CMS to enable automated link building and topical authority through the Diamond Flow methodology.
      </p>

      {/* Login Button */}
      <Button
        onClick={handleLogin}
        className="mb-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Login to BRON Dashboard
      </Button>

      {/* Footer */}
      <div className="pt-4 border-t border-cyan-500/20">
        <Badge variant="outline" className="mb-3 border-amber-500/50 text-amber-400 bg-amber-500/10">
          Coming Soon
        </Badge>
        <p className="text-sm text-muted-foreground">
          Diamond Flow ensures links come from topically relevant sites.
        </p>
      </div>
    </motion.div>
  );
};

export default BRONPlatformConnect;
