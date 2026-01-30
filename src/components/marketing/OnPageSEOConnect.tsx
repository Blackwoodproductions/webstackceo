import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, ShoppingBag, Palette, Rocket, CheckCircle2, 
  ArrowRight, ExternalLink, Loader2, Shield,
  Plug, Sparkles, Code, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
}

const platforms: Platform[] = [
  {
    id: "php-bron",
    name: "PHP / HTML",
    icon: Code,
    color: "text-indigo-500",
    gradientFrom: "from-indigo-500",
    gradientTo: "to-blue-400",
    description: "Direct BRON API integration",
  },
  {
    id: "wordpress",
    name: "WordPress",
    icon: Globe,
    color: "text-blue-500",
    gradientFrom: "from-blue-500",
    gradientTo: "to-sky-400",
    description: "Auto-optimize meta tags & schema",
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: ShoppingBag,
    color: "text-green-500",
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-400",
    description: "Product SEO & store pages",
  },
  {
    id: "wix",
    name: "Wix",
    icon: Palette,
    color: "text-amber-500",
    gradientFrom: "from-amber-500",
    gradientTo: "to-yellow-400",
    description: "Page titles & descriptions",
  },
  {
    id: "lovable",
    name: "Lovable",
    icon: Rocket,
    color: "text-violet-500",
    gradientFrom: "from-violet-500",
    gradientTo: "to-purple-400",
    description: "Native real-time optimization",
  },
];

interface ConnectionStatus {
  platform: string;
  connected: boolean;
  lastSync?: string;
  siteName?: string;
}

interface OnPageSEOConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

export const OnPageSEOConnect = ({ domain, onConnectionComplete }: OnPageSEOConnectProps) => {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const [showPhpDialog, setShowPhpDialog] = useState(false);
  const [phpApiKey, setPhpApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      case "php-bron":
        return `#bron-connect`;
      default:
        return "#";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "API key copied to clipboard." });
  };

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    
    try {
      const platform = platforms.find(p => p.id === platformId);
      if (!platform) return;

      if (platformId === "lovable" || platformId === "php-bron") {
        const { data, error } = await supabase.functions.invoke("bron-platform-connect", {
          body: { 
            action: "generate_api_key",
            platform: platformId,
            domain 
          }
        });

        if (error) throw error;

        if (platformId === "php-bron" && data?.api_key) {
          setPhpApiKey(data.api_key);
          setShowPhpDialog(true);
        }

        setConnections(prev => [...prev.filter(c => c.platform !== platformId), {
          platform: platformId,
          connected: true,
          lastSync: new Date().toISOString(),
          siteName: domain || (platformId === "php-bron" ? "PHP Site" : "Lovable App")
        }]);

        toast({
          title: platformId === "php-bron" ? "PHP/HTML Connected!" : "Lovable Connected!",
          description: platformId === "php-bron" 
            ? "Add the BRON PHP snippet to your website header."
            : "On-page SEO optimization is now active.",
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
      {/* Main Container - Compact with amber theme */}
      <div className="relative p-5 rounded-xl bg-gradient-to-br from-amber-500/5 via-orange-500/10 to-yellow-500/5 border border-amber-500/20 overflow-hidden">
        {/* Background decorations - smaller */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-2xl" />
        
        <div className="relative z-10">
          {/* Compact Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Plug className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                Connect Your Website
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px]">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                  One-Click
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Select your platform to enable AI-powered on-page SEO
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
                          ? `bg-gradient-to-br ${platform.gradientFrom}/10 ${platform.gradientTo}/5 border-amber-500/40`
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
          <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-amber-500/10">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Secure OAuth 2.0</span>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground h-7 px-2">
              <ExternalLink className="w-3 h-3" />
              Docs
            </Button>
          </div>
        </div>
      </div>

      {/* PHP/BRON API Key Dialog */}
      <Dialog open={showPhpDialog} onOpenChange={setShowPhpDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center">
                <Code className="w-4 h-4 text-white" />
              </div>
              PHP / HTML Site Connected
            </DialogTitle>
            <DialogDescription>
              Add this BRON PHP snippet to your website header to enable on-page SEO optimization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* API Key Display */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your API Key</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                  {phpApiKey || "Generating..."}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => phpApiKey && copyToClipboard(phpApiKey)}
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* PHP Snippet */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add to your &lt;head&gt; tag</label>
              <div className="relative">
                <pre className="p-4 bg-muted rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
{`<?php
// BRON On-Page SEO Optimization
$bron_api_key = "${phpApiKey || 'YOUR_API_KEY'}";
include_once("https://api.bfrg.io/seo/onpage.php?key=" . $bron_api_key);
?>`}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(`<?php\n// BRON On-Page SEO Optimization\n$bron_api_key = "${phpApiKey}";\ninclude_once("https://api.bfrg.io/seo/onpage.php?key=" . $bron_api_key);\n?>`)}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">How it works:</strong> The BRON PHP snippet connects directly to our SEO optimization engine. 
                It will automatically update meta tags, schema markup, and content structure on your pages without any CMS plugins required.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPhpDialog(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setShowPhpDialog(false);
                toast({ title: "Setup Complete", description: "Your PHP site is now connected to BRON." });
              }}
              className="bg-gradient-to-r from-indigo-500 to-blue-400 text-white"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default OnPageSEOConnect;
