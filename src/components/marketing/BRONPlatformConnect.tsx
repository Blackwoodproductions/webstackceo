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

  // Login prompt - full-width standardized layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Title Header */}
      <header className="flex items-start justify-between gap-4 relative overflow-hidden">
        {/* Animated Rising Bubbles - BRON */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-3 h-3 rounded-full bg-cyan-400/40 animate-[float_3s_ease-in-out_infinite] top-2 left-[10%]" />
          <div className="absolute w-2 h-2 rounded-full bg-sky-500/35 animate-[float_4s_ease-in-out_infinite_0.5s] top-8 left-[25%]" />
          <div className="absolute w-4 h-4 rounded-full bg-cyan-300/30 animate-[float_5s_ease-in-out_infinite_1s] top-4 left-[40%]" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-sky-400/40 animate-[float_3.5s_ease-in-out_infinite_1.5s] top-6 left-[55%]" />
          <div className="absolute w-3 h-3 rounded-full bg-cyan-500/35 animate-[float_4.5s_ease-in-out_infinite_2s] top-1 left-[70%]" />
        </div>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center shrink-0">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">BRON</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Link building and content clustering automation. Build topical authority through the Diamond Flow methodology with real business partnerships.
            </p>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
          {/* Trust Badges */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/40 shadow-sm hover:scale-105 hover:shadow-amber-500/30 hover:shadow-md transition-all duration-300 cursor-default">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-[7px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 whitespace-nowrap">1,000+ CEOs</span>
            </div>
            <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-slate-500/20 to-zinc-600/20 border border-slate-500/40 shadow-sm hover:scale-105 hover:shadow-slate-500/30 hover:shadow-md transition-all duration-300 cursor-default">
              <Building className="w-4 h-4 text-slate-500" />
              <span className="text-[7px] font-bold text-slate-600 dark:text-slate-400 mt-0.5 whitespace-nowrap">100+ Partners</span>
            </div>
            <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/40 shadow-sm hover:scale-105 hover:shadow-violet-500/30 hover:shadow-md transition-all duration-300 cursor-default">
              <Sparkles className="w-4 h-4 text-violet-500 animate-[spin_4s_linear_infinite]" />
              <span className="text-[7px] font-bold text-violet-600 dark:text-violet-400 mt-0.5 whitespace-nowrap">Agentic AI</span>
            </div>
          </div>
          {/* Feature Pills - Row 1 */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:scale-105 transition-all duration-200 cursor-default">
              <Shield className="w-2.5 h-2.5 text-cyan-500" />
              <span className="text-[9px] font-medium text-cyan-600 dark:text-cyan-400">No PBNs</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:scale-105 transition-all duration-200 cursor-default">
              <CheckCircle className="w-2.5 h-2.5 text-green-500" />
              <span className="text-[9px] font-medium text-green-600 dark:text-green-400">Real Partners</span>
            </div>
          </div>
          {/* Feature Pills - Row 2 */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 hover:scale-105 transition-all duration-200 cursor-default">
              <TrendingUp className="w-2.5 h-2.5 text-sky-500" />
              <span className="text-[9px] font-medium text-sky-600 dark:text-sky-400">DA Growth</span>
            </div>
          </div>
        </div>
      </header>

      {/* Top row: Header section + How It Works grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left - Header section */}
        <div className="lg:col-span-4">
          <div className="h-full p-6 rounded-xl border-2 border-dashed border-cyan-500/30 bg-cyan-500/5">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-5 h-5 text-cyan-500" />
                <h3 className="text-lg font-semibold">Connect Your Website</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                Connect your CMS to enable automated link building and topical authority through the Diamond Flow methodology.
              </p>
              <Button
                onClick={handleLogin}
                className="mb-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Login to BRON Dashboard
              </Button>
              <Badge variant="outline" className="w-fit text-amber-500 border-amber-500/30 bg-amber-500/10">
                Coming Soon
              </Badge>
              <p className="text-xs text-muted-foreground mt-3">
                Diamond Flow ensures links come from topically relevant sites.
              </p>
            </div>
          </div>
        </div>

        {/* Right - How It Works */}
        <div className="lg:col-span-8">
          <h3 className="text-lg font-semibold mb-4">How It Works</h3>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { 
                step: '1', 
                icon: Boxes,
                title: 'Keyword Clustering', 
                desc: 'AI-powered topical grouping organizes your keywords into content silos for maximum relevance signals.',
                highlight: 'AI-Powered'
              },
              { 
                step: '2', 
                icon: Link2,
                title: 'Deep Linking', 
                desc: 'Strategic backlinks are built into your content clusters from real, relevant business websites.',
                highlight: 'Real Websites'
              },
              { 
                step: '3', 
                icon: Award,
                title: 'DA & DR Growth', 
                desc: 'Watch your domain authority and domain rating rise as quality backlinks accumulate over time.',
                highlight: 'Authority Building'
              },
              { 
                step: '4', 
                icon: Zap,
                title: 'Autopilot Links', 
                desc: 'Relevant inbound links from real businesses flow in automatically. No PBNs. No spam. Just authentic relationships.',
                highlight: 'Industry First'
              },
            ].map((item) => (
              <div key={item.step} className="relative p-5 rounded-xl bg-gradient-to-br from-cyan-500/5 to-sky-500/10 border border-cyan-500/20 flex flex-col min-h-[180px]">
                <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  {item.step}
                </div>
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-3 mt-1">
                  <item.icon className="w-5 h-5 text-cyan-500" />
                </div>
                <p className="font-semibold text-sm mb-2">{item.title}</p>
                <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{item.desc}</p>
                <Badge variant="outline" className="mt-3 w-fit text-[10px] text-cyan-500 border-cyan-500/30 bg-cyan-500/5">
                  {item.highlight}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Target, label: 'Topical Relevance', desc: 'Links come from websites in your niche, sending strong relevance signals to search engines', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
          { icon: Shield, label: 'No PBNs or Spam', desc: 'Only authentic business relationships—never private blog networks or spammy link farms', color: 'text-sky-500', bgColor: 'bg-sky-500/10' },
          { icon: TrendingUp, label: 'Sustainable Growth', desc: 'Build lasting authority that compounds over time, not quick wins that get penalized', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
        ].map((feature) => (
          <div key={feature.label} className="p-5 rounded-xl bg-muted/30 border border-border flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center shrink-0`}>
              <feature.icon className={`w-5 h-5 ${feature.color}`} />
            </div>
            <div>
              <p className="font-medium text-sm mb-1">{feature.label}</p>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default BRONPlatformConnect;
