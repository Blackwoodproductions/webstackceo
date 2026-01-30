import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, ShoppingBag, Palette, Rocket, CheckCircle2, 
  ArrowRight, ExternalLink, Loader2, Shield, Zap,
  Link2, Plug, Sparkles, Key, User, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Platform {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  description: string;
  steps: string[];
  authType: "app-password" | "oauth" | "api-key";
}

const platforms: Platform[] = [
  {
    id: "php-bron",
    name: "PHP / HTML",
    icon: Globe,
    color: "text-indigo-500",
    gradientFrom: "from-indigo-500",
    gradientTo: "to-blue-400",
    description: "Direct BRON API integration",
    steps: ["Click Connect", "Get API key", "Add PHP snippet", "Go live!"],
    authType: "api-key",
  },
  {
    id: "wordpress",
    name: "WordPress",
    icon: Globe,
    color: "text-blue-500",
    gradientFrom: "from-blue-500",
    gradientTo: "to-sky-400",
    description: "Auto-publish blog posts & pages",
    steps: ["Enter site URL", "Add username", "Paste Application Password", "Connect!"],
    authType: "app-password",
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: ShoppingBag,
    color: "text-green-500",
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-400",
    description: "Blog articles & product content",
    steps: ["Click Connect", "Enter store URL", "Install app", "Authorize"],
    authType: "oauth",
  },
  {
    id: "wix",
    name: "Wix",
    icon: Palette,
    color: "text-amber-500",
    gradientFrom: "from-amber-500",
    gradientTo: "to-yellow-400",
    description: "Blog posts & dynamic pages",
    steps: ["Click Connect", "Select site", "Grant permissions", "Ready!"],
    authType: "oauth",
  },
  {
    id: "lovable",
    name: "Lovable",
    icon: Rocket,
    color: "text-violet-500",
    gradientFrom: "from-violet-500",
    gradientTo: "to-purple-400",
    description: "Native real-time streaming",
    steps: ["Click Connect", "Get API key", "Add webhook", "Stream content"],
    authType: "api-key",
  },
];

interface ConnectionStatus {
  platform: string;
  connected: boolean;
  lastSync?: string;
  siteName?: string;
}

interface CADEPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

export const CADEPlatformConnect = ({ domain, onConnectionComplete }: CADEPlatformConnectProps) => {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  
  // WordPress App Password Dialog State
  const [showWpDialog, setShowWpDialog] = useState(false);
  const [wpSiteUrl, setWpSiteUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpAppPassword, setWpAppPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingWp, setIsTestingWp] = useState(false);

  const handleConnect = async (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return;

    // WordPress uses Application Password dialog
    if (platformId === "wordpress") {
      setShowWpDialog(true);
      return;
    }

    setConnecting(platformId);
    
    try {
      if (platformId === "lovable" || platformId === "php-bron") {
        const { data, error } = await supabase.functions.invoke("bron-platform-connect", {
          body: { 
            action: "generate_api_key",
            platform: platformId,
            domain 
          }
        });

        if (error) throw error;

        setConnections(prev => [...prev.filter(c => c.platform !== platformId), {
          platform: platformId,
          connected: true,
          lastSync: new Date().toISOString(),
          siteName: domain || (platformId === "php-bron" ? "PHP Site" : "Lovable App")
        }]);

        toast({
          title: platformId === "php-bron" ? "PHP/HTML Connected!" : "Lovable Connected!",
          description: platformId === "php-bron" 
            ? `API key generated: ${data?.api_key?.slice(0, 12)}...`
            : "Your API key has been generated. Content will stream automatically.",
        });

        onConnectionComplete?.(platformId);
      } else {
        // Other platforms - show coming soon
        toast({
          title: "Coming Soon",
          description: `${platform.name} integration is coming soon!`,
        });
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description: "Unable to connect to the platform. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const handleWordPressConnect = async () => {
    if (!wpSiteUrl.trim() || !wpUsername.trim() || !wpAppPassword.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingWp(true);

    try {
      // Test the WordPress connection via CADE API
      const { data, error } = await supabase.functions.invoke("cade-api", {
        body: {
          action: "connect-platform",
          domain: domain,
          params: {
            platform: "wordpress",
            site_url: wpSiteUrl.trim().replace(/\/$/, ""),
            username: wpUsername.trim(),
            app_password: wpAppPassword.trim(),
          }
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      // Success - store connection
      setConnections(prev => [...prev.filter(c => c.platform !== "wordpress"), {
        platform: "wordpress",
        connected: true,
        lastSync: new Date().toISOString(),
        siteName: wpSiteUrl.replace(/^https?:\/\//, "").split("/")[0]
      }]);

      // Store in localStorage for persistence
      localStorage.setItem("cade_wp_connected", JSON.stringify({
        siteUrl: wpSiteUrl.trim(),
        username: wpUsername.trim(),
        connectedAt: new Date().toISOString(),
      }));

      toast({
        title: "WordPress Connected!",
        description: "Your WordPress site is now connected for content publishing.",
      });

      setShowWpDialog(false);
      setWpSiteUrl("");
      setWpUsername("");
      setWpAppPassword("");
      onConnectionComplete?.("wordpress");

    } catch (error) {
      console.error("WordPress connection error:", error);
      const errMsg = error instanceof Error ? error.message : "Connection failed";
      
      if (errMsg.toLowerCase().includes("unauthorized") || errMsg.toLowerCase().includes("401")) {
        toast({
          title: "Authentication Failed",
          description: "Invalid username or application password. Please check your credentials.",
          variant: "destructive",
        });
      } else if (errMsg.toLowerCase().includes("not found") || errMsg.toLowerCase().includes("404")) {
        toast({
          title: "Site Not Found",
          description: "Could not reach the WordPress site. Please verify the URL.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: errMsg,
          variant: "destructive",
        });
      }
    } finally {
      setIsTestingWp(false);
    }
  };

  const isConnected = (platformId: string) => {
    // Check localStorage for WordPress
    if (platformId === "wordpress") {
      const saved = localStorage.getItem("cade_wp_connected");
      if (saved) return true;
    }
    return connections.some(c => c.platform === platformId && c.connected);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Main Container - Compact with violet theme */}
        <div className="relative p-5 rounded-xl bg-gradient-to-br from-violet-500/5 via-purple-500/10 to-fuchsia-500/5 border border-violet-500/20 overflow-hidden">
          {/* Background decorations - smaller */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full blur-2xl" />
          
          <div className="relative z-10">
            {/* Compact Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md">
                <Plug className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  Connect Your Website
                  <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/30 text-[10px]">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                    One-Click
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select your platform to receive AI-generated content
                </p>
              </div>
            </div>

            {/* Platform Cards Grid - Compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <AnimatePresence>
                {platforms.map((platform, i) => {
                  const Icon = platform.icon;
                  const connected = isConnected(platform.id);
                  const isHovered = hoveredPlatform === platform.id;
                  const isConnecting = connecting === platform.id;
                  
                  return (
                    <motion.div
                      key={platform.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onMouseEnter={() => setHoveredPlatform(platform.id)}
                      onMouseLeave={() => setHoveredPlatform(null)}
                      className="group relative"
                    >
                      <div className={`
                        relative p-4 rounded-lg border transition-all duration-300 cursor-pointer h-full flex flex-col
                        ${connected 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : isHovered 
                            ? `bg-gradient-to-br ${platform.gradientFrom}/10 ${platform.gradientTo}/5 border-violet-500/40`
                            : 'bg-background/50 border-border hover:border-muted-foreground/30'
                        }
                      `}>
                        {/* Connected indicator */}
                        {connected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-md"
                          >
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </motion.div>
                        )}

                        {/* Platform Icon & Name Row */}
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className={`
                            w-9 h-9 rounded-lg bg-gradient-to-br ${platform.gradientFrom} ${platform.gradientTo} 
                            flex items-center justify-center shadow-md shrink-0
                          `}>
                            <Icon className="w-4.5 h-4.5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm">{platform.name}</h4>
                            <p className="text-[10px] text-muted-foreground truncate">{platform.description}</p>
                          </div>
                        </div>

                        {/* Connect Button */}
                        <Button
                          onClick={() => handleConnect(platform.id)}
                          disabled={isConnecting || connected}
                          className={`
                            w-full gap-1.5 transition-all duration-300 mt-auto
                            ${connected 
                              ? 'bg-green-500/20 text-green-600 border border-green-500/30 hover:bg-green-500/30' 
                              : `bg-gradient-to-r ${platform.gradientFrom} ${platform.gradientTo} hover:opacity-90 text-white shadow-md`
                            }
                          `}
                          size="sm"
                        >
                          {isConnecting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : connected ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="text-xs">Connected</span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs">Connect</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Bottom info - Compact */}
            <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-violet-500/10">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-violet-500" />
                <span>Secure Authentication</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                onClick={() => window.open("https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/", "_blank")}
              >
                <ExternalLink className="w-3 h-3" />
                App Password Guide
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* WordPress Application Password Dialog */}
      <Dialog open={showWpDialog} onOpenChange={setShowWpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              Connect WordPress
            </DialogTitle>
            <DialogDescription>
              Use Application Passwords for secure access. No plugins required!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Site URL */}
            <div className="space-y-2">
              <Label htmlFor="wp-site-url" className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                WordPress Site URL
              </Label>
              <Input
                id="wp-site-url"
                placeholder="https://yoursite.com"
                value={wpSiteUrl}
                onChange={(e) => setWpSiteUrl(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="wp-username" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                WordPress Username
              </Label>
              <Input
                id="wp-username"
                placeholder="admin"
                value={wpUsername}
                onChange={(e) => setWpUsername(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Application Password */}
            <div className="space-y-2">
              <Label htmlFor="wp-app-password" className="flex items-center gap-2">
                <Key className="w-4 h-4 text-muted-foreground" />
                Application Password
              </Label>
              <div className="relative">
                <Input
                  id="wp-app-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  value={wpAppPassword}
                  onChange={(e) => setWpAppPassword(e.target.value)}
                  className="h-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Create one at: <span className="font-mono text-[10px]">WordPress Admin → Users → Profile → Application Passwords</span>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowWpDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleWordPressConnect}
              disabled={isTestingWp || !wpSiteUrl || !wpUsername || !wpAppPassword}
              className="bg-gradient-to-r from-blue-500 to-sky-400 text-white"
            >
              {isTestingWp ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Connect WordPress
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CADEPlatformConnect;
