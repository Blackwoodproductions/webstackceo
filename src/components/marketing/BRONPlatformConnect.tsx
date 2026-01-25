import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, ShoppingBag, Palette, Rocket, CheckCircle2, 
  ArrowRight, ExternalLink, Loader2, Shield, Zap, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Platform {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgGradient: string;
  description: string;
  features: string[];
  authUrl?: string;
}

const platforms: Platform[] = [
  {
    id: "wordpress",
    name: "WordPress",
    icon: Globe,
    color: "text-blue-500",
    bgGradient: "from-blue-500/10 to-sky-500/5",
    description: "Connect your WordPress site via REST API",
    features: ["Auto-publish posts", "Media library sync", "Category mapping", "SEO meta injection"],
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: ShoppingBag,
    color: "text-green-500",
    bgGradient: "from-green-500/10 to-emerald-500/5",
    description: "Integrate with your Shopify store's blog",
    features: ["Blog article creation", "Product descriptions", "Collection pages", "Store analytics"],
  },
  {
    id: "wix",
    name: "Wix",
    icon: Palette,
    color: "text-yellow-500",
    bgGradient: "from-yellow-500/10 to-amber-500/5",
    description: "Connect your Wix website seamlessly",
    features: ["Blog post automation", "Dynamic pages", "SEO settings", "Media manager"],
  },
  {
    id: "lovable",
    name: "Lovable",
    icon: Rocket,
    color: "text-violet-500",
    bgGradient: "from-violet-500/10 to-purple-500/5",
    description: "Native integration for Lovable apps",
    features: ["Direct content streaming", "Real-time updates", "Component injection", "API webhooks"],
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
  const [selectedPlatform, setSelectedPlatform] = useState<string>("wordpress");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);

  // Generate OAuth URL for each platform
  const getAuthUrl = (platformId: string): string => {
    const redirectUri = `${window.location.origin}/auth/callback/${platformId}`;
    const state = crypto.randomUUID().replace(/-/g, "");
    
    // Store state for CSRF protection
    sessionStorage.setItem(`oauth_state_${platformId}`, state);
    sessionStorage.setItem(`oauth_redirect_path`, window.location.pathname + window.location.hash);

    switch (platformId) {
      case "wordpress":
        // WordPress.com OAuth
        const wpClientId = import.meta.env.VITE_WORDPRESS_CLIENT_ID || "YOUR_WP_CLIENT_ID";
        return `https://public-api.wordpress.com/oauth2/authorize?client_id=${wpClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=global&state=${state}`;
      
      case "shopify":
        // Shopify OAuth - requires shop domain input first
        return `#shopify-connect`; // Will trigger modal
      
      case "wix":
        // Wix OAuth
        const wixClientId = import.meta.env.VITE_WIX_CLIENT_ID || "YOUR_WIX_CLIENT_ID";
        return `https://www.wix.com/installer/install?appId=${wixClientId}&redirectUrl=${encodeURIComponent(redirectUri)}&state=${state}`;
      
      case "lovable":
        // Lovable native - no OAuth needed, direct API key
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
        // For Lovable, generate an API key directly
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
          siteName: domain || "Lovable App"
        }]);

        toast({
          title: "Lovable Connected!",
          description: "Your API key has been generated. Content will stream automatically.",
        });

        onConnectionComplete?.(platformId);
      } else {
        // For external platforms, redirect to OAuth
        const authUrl = getAuthUrl(platformId);
        
        if (authUrl.startsWith("#")) {
          // Handle special cases (Shopify shop input, etc.)
          toast({
            title: "Configuration Required",
            description: `Please configure your ${platform.name} credentials first.`,
          });
        } else {
          // Redirect to OAuth provider
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

  const getConnection = (platformId: string) => {
    return connections.find(c => c.platform === platformId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
        >
          <Zap className="w-7 h-7 text-white" />
        </motion.div>
        <div>
          <h3 className="text-2xl font-bold">Connect Your Platform</h3>
          <p className="text-muted-foreground">
            Link your website to receive AI-generated content automatically
          </p>
        </div>
      </div>

      {/* Platform Tabs */}
      <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform} className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-muted/50">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const connected = isConnected(platform.id);
            
            return (
              <TabsTrigger
                key={platform.id}
                value={platform.id}
                className="relative flex flex-col items-center gap-1.5 py-3 px-2 data-[state=active]:bg-background"
              >
                <div className={`relative ${platform.color}`}>
                  <Icon className="w-5 h-5" />
                  {connected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background"
                    />
                  )}
                </div>
                <span className="text-xs font-medium">{platform.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Platform Content */}
        <AnimatePresence mode="wait">
          {platforms.map((platform) => (
            <TabsContent key={platform.id} value={platform.id} className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`bg-gradient-to-br ${platform.bgGradient} border-${platform.color.replace('text-', '')}/20`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.bgGradient} border border-border flex items-center justify-center`}>
                          <platform.icon className={`w-6 h-6 ${platform.color}`} />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {platform.name}
                            {isConnected(platform.id) && (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{platform.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Features Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {platform.features.map((feature, i) => (
                        <motion.div
                          key={feature}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border"
                        >
                          <CheckCircle2 className={`w-4 h-4 ${platform.color}`} />
                          <span className="text-sm">{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Connection Status or Connect Button */}
                    {isConnected(platform.id) ? (
                      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="font-medium text-green-600 dark:text-green-400">
                                Connection Active
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Site: {getConnection(platform.id)?.siteName || domain}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Settings className="w-4 h-4" />
                            Configure
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={() => handleConnect(platform.id)}
                          disabled={connecting === platform.id}
                          className={`flex-1 gap-2 bg-gradient-to-r ${
                            platform.id === "wordpress" ? "from-blue-500 to-sky-500" :
                            platform.id === "shopify" ? "from-green-500 to-emerald-500" :
                            platform.id === "wix" ? "from-yellow-500 to-amber-500" :
                            "from-violet-500 to-purple-500"
                          } hover:opacity-90 text-white`}
                        >
                          {connecting === platform.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              Connect {platform.name}
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                        <Button variant="outline" className="gap-2">
                          <ExternalLink className="w-4 h-4" />
                          View Docs
                        </Button>
                      </div>
                    )}

                    {/* Platform-specific instructions */}
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Setup Instructions
                      </h4>
                      <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                        {platform.id === "wordpress" && (
                          <>
                            <li>Click "Connect WordPress" to authorize via WordPress.com</li>
                            <li>Grant BRON permission to publish content</li>
                            <li>Select which blog or site to sync with</li>
                            <li>Configure category mappings in settings</li>
                          </>
                        )}
                        {platform.id === "shopify" && (
                          <>
                            <li>Enter your Shopify store domain (yourstore.myshopify.com)</li>
                            <li>Install the BRON app from Shopify App Store</li>
                            <li>Authorize API access for blog management</li>
                            <li>Map product collections to content categories</li>
                          </>
                        )}
                        {platform.id === "wix" && (
                          <>
                            <li>Click "Connect Wix" to open the Wix installer</li>
                            <li>Select the site you want to connect</li>
                            <li>Grant permissions for blog and media access</li>
                            <li>Configure your content preferences</li>
                          </>
                        )}
                        {platform.id === "lovable" && (
                          <>
                            <li>Click "Connect Lovable" to generate your API key</li>
                            <li>Add the BRON webhook URL to your app settings</li>
                            <li>Content will stream directly to your components</li>
                            <li>Use our React hooks for real-time updates</li>
                          </>
                        )}
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          ))}
        </AnimatePresence>
      </Tabs>

      {/* Security Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border"
      >
        <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
        <p className="text-sm text-muted-foreground">
          All connections use OAuth 2.0 with encrypted tokens. Your credentials are never stored on our servers.
          <a href="/security" className="text-primary hover:underline ml-1">Learn more about security</a>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default BRONPlatformConnect;
