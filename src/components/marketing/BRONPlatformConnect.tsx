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

export const BRONPlatformConnect = ({ domain, onConnectionComplete }: BRONPlatformConnectProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const popupRef = useRef<Window | null>(null);

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
    onConnectionComplete?.("bron");
  };

  // Popup-based login: keep auth in popup, render dashboard on this page via iframe
  const handlePopupLogin = () => {
    setIsLoading(true);
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);

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
      setIsLoading(false);
      toast({
        title: "Popup Blocked",
        description: "Please allow popups so you can login to BRON.",
        variant: "destructive",
      });
      return;
    }

    popupRef.current = popup;

    // We can't reliably read popup URL due to cross-origin; the most reliable signal is popup closure.
    toast({
      title: "Login in Popup",
      description: "Complete login in the popup, then close it to load the dashboard here.",
    });

    const poll = window.setInterval(() => {
      if (!popupRef.current || popupRef.current.closed) {
        window.clearInterval(poll);
        popupRef.current = null;
        persistAuth();
        setIsLoading(false);
      }
    }, 400);

    // Safety timeout
    window.setTimeout(() => {
      window.clearInterval(poll);
      if (popupRef.current && !popupRef.current.closed) {
        // Don't force-close; just stop loading state.
        setIsLoading(false);
      }
    }, 3 * 60 * 1000);
  };

  const handleManualContinue = () => {
    // Use when popup can't be detected / user already logged in.
    try {
      popupRef.current?.close();
    } catch {
      // ignore
    }
    popupRef.current = null;
    persistAuth();
    setIsLoading(false);
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
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  // Show connected state with embedded dashboard (iframe)
  if (isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Connection Header */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-green-600 dark:text-green-400">BRON Dashboard Connected</p>
              {domain && (
                <p className="text-sm text-muted-foreground">Managing links for: {domain}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const iframe = document.getElementById('bron-dashboard-iframe') as HTMLIFrameElement | null;
                if (iframe) iframe.src = iframe.src;
              }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => window.open(BRON_DASHBOARD_URL, '_blank')}
              className="gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive hover:border-destructive/50"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Embedded BRON Dashboard */}
        <div className="rounded-xl overflow-hidden border border-border shadow-lg bg-background">
          <iframe
            id="bron-dashboard-iframe"
            src={BRON_DASHBOARD_URL}
            className="w-full h-[720px] border-0"
            title="BRON Dashboard"
            allow="clipboard-write; clipboard-read"
          />
        </div>

        {/* Quick Stats / Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Status", value: "Active", icon: CheckCircle, color: "text-green-500" },
            { label: "Platform", value: "Diamond Flow", icon: Zap, color: "text-emerald-500" },
            { label: "Network", value: "12,500+", icon: Link2, color: "text-cyan-500" },
            { label: "Quality", value: "DA 30+", icon: Award, color: "text-amber-500" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl bg-secondary/30 border border-border text-center"
            >
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Extended Section with features */}
        <BRONExtendedSection domain={domain} />
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

          <div className="text-xs text-muted-foreground text-center space-y-2">
            <p>Login happens in a popup. After you sign in, close the popup to load the dashboard here.</p>
            <Button
              type="button"
              variant="ghost"
              onClick={handleManualContinue}
              className="w-full"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              I’m logged in — show dashboard
            </Button>
          </div>
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
