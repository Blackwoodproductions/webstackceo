import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, ShoppingBag, Palette, Rocket, CheckCircle2, 
  ArrowRight, ExternalLink, Loader2, Shield, Zap, Settings,
  Link2, Plug, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

const platforms: Platform[] = [
  {
    id: "wordpress",
    name: "WordPress",
    icon: Globe,
    color: "text-blue-500",
    gradientFrom: "from-blue-500",
    gradientTo: "to-sky-400",
    description: "Auto-publish blog posts & pages",
    steps: ["Click Connect", "Authorize access", "Select your site", "Done!"],
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
  },
];

interface ConnectionStatus {
  platform: string;
  connected: boolean;
  lastSync?: string;
  siteName?: string;
}

interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

export const BRONPlatformConnect = ({ domain, onConnectionComplete }: BRONPlatformConnectProps) => {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);

  const getAuthUrl = (platformId: string): string => {
    const redirectUri = `${window.location.origin}/auth/callback/${platformId}`;
    const state = crypto.randomUUID().replace(/-/g, "");
    
    sessionStorage.setItem(`oauth_state_${platformId}`, state);
    sessionStorage.setItem(`oauth_redirect_path`, window.location.pathname + window.location.hash);

    switch (platformId) {
      case "wordpress":
        const wpClientId = import.meta.env.VITE_WORDPRESS_CLIENT_ID || "YOUR_WP_CLIENT_ID";
        return `https://public-api.wordpress.com/oauth2/authorize?client_id=${wpClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=global&state=${state}`;
      case "shopify":
        return `#shopify-connect`;
      case "wix":
        const wixClientId = import.meta.env.VITE_WIX_CLIENT_ID || "YOUR_WIX_CLIENT_ID";
        return `https://www.wix.com/installer/install?appId=${wixClientId}&redirectUrl=${encodeURIComponent(redirectUri)}&state=${state}`;
      case "lovable":
        return `#lovable-connect`;
      default:
        return "#";
    }
  };

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    
    try {
      const platform = platforms.find(p => p.id === platformId);
      if (!platform) return;

      if (platformId === "lovable") {
        const { error } = await supabase.functions.invoke("bron-platform-connect", {
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
          siteName: domain || "Lovable App"
        }]);

        toast({
          title: "Lovable Connected!",
          description: "Your API key has been generated. Content will stream automatically.",
        });

        onConnectionComplete?.(platformId);
      } else {
        const authUrl = getAuthUrl(platformId);
        
        if (authUrl.startsWith("#")) {
          toast({
            title: "Configuration Required",
            description: `Please configure your ${platform.name} credentials first.`,
          });
        } else {
          window.location.href = authUrl;
        }
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

  const isConnected = (platformId: string) => {
    return connections.some(c => c.platform === platformId && c.connected);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Main Container - Compact */}
      <div className="relative p-5 rounded-xl bg-gradient-to-br from-cyan-500/5 via-sky-500/10 to-blue-500/5 border border-cyan-500/20 overflow-hidden">
        {/* Background decorations - smaller */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-2xl" />
        
        <div className="relative z-10">
          {/* Compact Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center shadow-md">
              <Plug className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                Connect Your Website
                <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/30 text-[10px]">
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
                          ? `bg-gradient-to-br ${platform.gradientFrom}/10 ${platform.gradientTo}/5 border-cyan-500/40`
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
          <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-cyan-500/10">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-cyan-500" />
              <span>Secure OAuth 2.0</span>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground h-7 px-2">
              <ExternalLink className="w-3 h-3" />
              Docs
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BRONPlatformConnect;
