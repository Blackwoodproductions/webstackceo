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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Main Container with gradient border */}
      <div className="relative p-8 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-green-500/10 to-teal-500/5 border border-emerald-500/20 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-500/10 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10">
          {/* Header with prominent styling */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(16, 185, 129, 0.3)",
                    "0 0 40px rgba(16, 185, 129, 0.5)",
                    "0 0 20px rgba(16, 185, 129, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-xl"
              >
                <Plug className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  Connect Your Website
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    One-Click Setup
                  </Badge>
                </h3>
                <p className="text-muted-foreground mt-1">
                  Select your platform below to start receiving AI-generated content automatically
                </p>
              </div>
            </div>
          </div>

          {/* How it works - 3 steps */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { step: 1, title: "Choose Platform", desc: "Select your CMS below", icon: Link2 },
              { step: 2, title: "Authorize Access", desc: "One-click OAuth login", icon: Shield },
              { step: 3, title: "Receive Content", desc: "Auto-publish enabled", icon: Zap },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative p-4 rounded-xl bg-background/50 border border-emerald-500/10 text-center"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                  {item.step}
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto mt-2 mb-2">
                  <item.icon className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Platform Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    transition={{ delay: i * 0.1 }}
                    onMouseEnter={() => setHoveredPlatform(platform.id)}
                    onMouseLeave={() => setHoveredPlatform(null)}
                    className="group relative"
                  >
                    <div className={`
                      relative p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer h-full min-h-[280px] flex flex-col
                      ${connected 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : isHovered 
                          ? `bg-gradient-to-br ${platform.gradientFrom}/10 ${platform.gradientTo}/5 border-${platform.color.replace('text-', '')}/40`
                          : 'bg-background/50 border-border hover:border-muted-foreground/30'
                      }
                    `}>
                      {/* Connected indicator */}
                      {connected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </motion.div>
                      )}

                      {/* Platform Icon */}
                      <motion.div
                        animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                        className={`
                          w-14 h-14 rounded-xl bg-gradient-to-br ${platform.gradientFrom} ${platform.gradientTo} 
                          flex items-center justify-center mb-4 shadow-lg
                        `}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </motion.div>

                      {/* Platform Info */}
                      <h4 className="font-bold text-lg mb-1">{platform.name}</h4>
                      <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">{platform.description}</p>

                      {/* Quick steps preview */}
                      <div className="space-y-1 mb-4 flex-1">
                        {platform.steps.slice(0, 2).map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${platform.gradientFrom}/20 ${platform.gradientTo}/10 flex items-center justify-center shrink-0`}>
                              <span className={`text-[10px] font-bold ${platform.color}`}>{idx + 1}</span>
                            </div>
                            <span className="truncate">{step}</span>
                          </div>
                        ))}
                      </div>

                      {/* Connect Button */}
                      <Button
                        onClick={() => handleConnect(platform.id)}
                        disabled={isConnecting || connected}
                        className={`
                          w-full gap-2 transition-all duration-300
                          ${connected 
                            ? 'bg-green-500/20 text-green-600 border border-green-500/30 hover:bg-green-500/30' 
                            : `bg-gradient-to-r ${platform.gradientFrom} ${platform.gradientTo} hover:opacity-90 text-white shadow-lg`
                          }
                        `}
                        size="sm"
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connecting...
                          </>
                        ) : connected ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Connected
                          </>
                        ) : (
                          <>
                            Connect
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>

                      {/* Hover effect glow */}
                      {isHovered && !connected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`absolute inset-0 -z-10 rounded-xl bg-gradient-to-br ${platform.gradientFrom}/20 ${platform.gradientTo}/10 blur-xl`}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Bottom info bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-emerald-500/10"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Secure OAuth 2.0 • Your credentials never touch our servers</span>
            </div>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ExternalLink className="w-4 h-4" />
              View Integration Docs
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default BRONPlatformConnect;
