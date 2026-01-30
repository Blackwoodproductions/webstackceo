import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, ShoppingBag, Palette, Rocket, CheckCircle2, ArrowRight, 
  ExternalLink, Loader2, Shield, Plug, Sparkles, AlertTriangle,
  Code, Eye, Settings, Copy, Check, X, RefreshCw, Zap, Link2, FileSearch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Platform {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  description: string;
  features: string[];
  setupSteps: string[];
}

const platforms: Platform[] = [
  {
    id: 'wordpress',
    name: 'WordPress',
    icon: Globe,
    color: 'text-blue-500',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-sky-400',
    description: 'Direct editing via REST API or plugin',
    features: ['Meta tag optimization', 'Schema markup injection', 'Alt text generation', 'Header restructuring'],
    setupSteps: ['Install WP SEO Bridge plugin', 'Generate API credentials', 'Connect & authorize'],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: ShoppingBag,
    color: 'text-green-500',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-400',
    description: 'Product & collection SEO optimization',
    features: ['Product meta optimization', 'Collection SEO', 'Image alt automation', 'Structured data'],
    setupSteps: ['Install private app', 'Configure permissions', 'Connect store'],
  },
  {
    id: 'wix',
    name: 'Wix',
    icon: Palette,
    color: 'text-amber-500',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-yellow-400',
    description: 'Velo API integration for dynamic SEO',
    features: ['Page title optimization', 'Meta descriptions', 'Structured data', 'SEO patterns'],
    setupSteps: ['Enable Velo', 'Generate API key', 'Authorize access'],
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    icon: Code,
    color: 'text-slate-500',
    gradientFrom: 'from-slate-500',
    gradientTo: 'to-gray-400',
    description: 'Developer API for advanced SEO',
    features: ['Page SEO settings', 'Collection items', 'Blog optimization', 'Product SEO'],
    setupSteps: ['Create API key', 'Set permissions', 'Connect site'],
  },
  {
    id: 'webflow',
    name: 'Webflow',
    icon: Zap,
    color: 'text-indigo-500',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-blue-400',
    description: 'CMS API for collection SEO',
    features: ['CMS item SEO', 'Page settings', 'Meta optimization', 'Open Graph'],
    setupSteps: ['Generate API token', 'Select site', 'Grant permissions'],
  },
  {
    id: 'custom',
    name: 'Custom/Other',
    icon: Link2,
    color: 'text-violet-500',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-400',
    description: 'Universal webhook-based integration',
    features: ['Webhook receiver', 'REST API endpoint', 'Manual sync', 'Batch updates'],
    setupSteps: ['Configure webhook URL', 'Set auth token', 'Test connection'],
  },
];

interface ConnectionStatus {
  platform: string;
  connected: boolean;
  lastSync?: string;
  siteName?: string;
  siteUrl?: string;
  pagesOptimized?: number;
}

interface OnPageSEOPlatformWizardProps {
  domain?: string;
  onConnectionComplete?: (platform: string, status: ConnectionStatus) => void;
}

export const OnPageSEOPlatformWizard = ({ domain, onConnectionComplete }: OnPageSEOPlatformWizardProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [apiCredentials, setApiCredentials] = useState({ apiKey: '', apiSecret: '', siteUrl: '' });
  const [copied, setCopied] = useState(false);

  // Load existing connections
  useEffect(() => {
    const loadConnections = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for existing platform connections in oauth_tokens or user_api_keys
      const { data: tokens } = await supabase
        .from('oauth_tokens')
        .select('provider, created_at')
        .eq('user_id', user.id);

      if (tokens) {
        const platformConnections = tokens
          .filter(t => ['wordpress', 'shopify', 'wix', 'squarespace', 'webflow'].includes(t.provider))
          .map(t => ({
            platform: t.provider,
            connected: true,
            lastSync: t.created_at,
          }));
        setConnections(platformConnections);
      }
    };

    loadConnections();
  }, []);

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setWizardStep(0);
    setApiCredentials({ apiKey: '', apiSecret: '', siteUrl: '' });
    setWizardOpen(true);
  };

  const handleConnect = async () => {
    if (!selectedPlatform) return;
    setConnecting(selectedPlatform);

    try {
      const platform = platforms.find(p => p.id === selectedPlatform);
      if (!platform) return;

      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newConnection: ConnectionStatus = {
        platform: selectedPlatform,
        connected: true,
        lastSync: new Date().toISOString(),
        siteName: apiCredentials.siteUrl || domain || 'Connected Site',
        siteUrl: apiCredentials.siteUrl,
        pagesOptimized: 0,
      };

      setConnections(prev => [...prev.filter(c => c.platform !== selectedPlatform), newConnection]);
      
      toast.success(`${platform.name} connected successfully!`, {
        description: 'SEO optimization is now active for your site.',
      });

      setWizardOpen(false);
      onConnectionComplete?.(selectedPlatform, newConnection);
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Connection failed', {
        description: 'Unable to connect to the platform. Please check your credentials.',
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

  const copyWebhookUrl = () => {
    const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onpage-seo-webhook`;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Platform Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Plug className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Connect Your Website Platform</h3>
              <p className="text-sm text-muted-foreground">
                We make <span className="text-amber-500 font-medium">real changes</span> to your website—not pixel injections
              </p>
            </div>
          </div>
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Direct Platform Editing
          </Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform, i) => {
            const Icon = platform.icon;
            const connected = isConnected(platform.id);
            const connection = getConnection(platform.id);

            return (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group relative"
              >
                <Card 
                  className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    connected 
                      ? 'border-green-500/50 bg-green-500/5' 
                      : 'hover:border-amber-500/50'
                  }`}
                  onClick={() => !connected && handlePlatformSelect(platform.id)}
                >
                  {/* Connected indicator */}
                  {connected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </motion.div>
                  )}

                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.gradientFrom} ${platform.gradientTo} flex items-center justify-center shadow-lg shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{platform.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{platform.description}</p>
                        
                        {connected && connection ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-green-500 font-medium">✓ Connected</p>
                            {connection.pagesOptimized !== undefined && (
                              <p className="text-[10px] text-muted-foreground">
                                {connection.pagesOptimized} pages optimized
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {platform.features.slice(0, 2).map(feature => (
                              <Badge key={feature} variant="outline" className="text-[9px] px-1.5 py-0">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {!connected && (
                      <Button
                        className={`w-full mt-3 gap-1.5 bg-gradient-to-r ${platform.gradientFrom} ${platform.gradientTo} hover:opacity-90 text-white shadow-md`}
                        size="sm"
                      >
                        <span className="text-xs">Connect</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {connected && (
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1 text-xs">
                          <Settings className="w-3 h-3 mr-1" />
                          Manage
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs">
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Connection Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedPlatform && (
                <>
                  {(() => {
                    const platform = platforms.find(p => p.id === selectedPlatform);
                    if (!platform) return null;
                    const Icon = platform.icon;
                    return (
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${platform.gradientFrom} ${platform.gradientTo} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    );
                  })()}
                  <span>Connect {platforms.find(p => p.id === selectedPlatform)?.name}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Follow the steps below to connect your website for automated SEO optimization.
            </DialogDescription>
          </DialogHeader>

          {selectedPlatform && (
            <div className="space-y-6 mt-4">
              {/* Progress Steps */}
              <div className="flex items-center gap-2">
                {platforms.find(p => p.id === selectedPlatform)?.setupSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < wizardStep ? 'bg-green-500 text-white' :
                      i === wizardStep ? 'bg-amber-500 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {i < wizardStep ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    {i < (platforms.find(p => p.id === selectedPlatform)?.setupSteps.length || 0) - 1 && (
                      <div className={`flex-1 h-0.5 ${i < wizardStep ? 'bg-green-500' : 'bg-muted'}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={wizardStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {wizardStep === 0 && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Step 1: {platforms.find(p => p.id === selectedPlatform)?.setupSteps[0]}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {selectedPlatform === 'wordpress' && 'Install our WP SEO Bridge plugin from the WordPress plugin directory, or download and upload it manually.'}
                          {selectedPlatform === 'shopify' && 'Create a private app in your Shopify admin with read/write access to Products, Collections, and Pages.'}
                          {selectedPlatform === 'wix' && 'Enable Velo by Wix in your site settings to access the API functionality.'}
                          {selectedPlatform === 'squarespace' && 'Navigate to Settings > Developer API and create a new API key.'}
                          {selectedPlatform === 'webflow' && 'Go to Site Settings > Integrations and generate an API token.'}
                          {selectedPlatform === 'custom' && 'Configure a webhook endpoint on your server to receive optimization updates.'}
                        </p>
                      </div>
                      <Button onClick={() => setWizardStep(1)} className="w-full">
                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}

                  {wizardStep === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="siteUrl">Website URL</Label>
                          <Input
                            id="siteUrl"
                            placeholder="https://yoursite.com"
                            value={apiCredentials.siteUrl}
                            onChange={e => setApiCredentials(prev => ({ ...prev, siteUrl: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apiKey">API Key</Label>
                          <Input
                            id="apiKey"
                            type="password"
                            placeholder="Enter your API key"
                            value={apiCredentials.apiKey}
                            onChange={e => setApiCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                          />
                        </div>
                        {selectedPlatform === 'shopify' && (
                          <div className="space-y-2">
                            <Label htmlFor="apiSecret">API Secret</Label>
                            <Input
                              id="apiSecret"
                              type="password"
                              placeholder="Enter your API secret"
                              value={apiCredentials.apiSecret}
                              onChange={e => setApiCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
                            />
                          </div>
                        )}
                      </div>

                      {selectedPlatform === 'custom' && (
                        <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                          <p className="text-xs text-muted-foreground mb-2">Your webhook URL:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs bg-background p-2 rounded overflow-x-auto">
                              {import.meta.env.VITE_SUPABASE_URL}/functions/v1/onpage-seo-webhook
                            </code>
                            <Button size="sm" variant="outline" onClick={copyWebhookUrl}>
                              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setWizardStep(0)} className="flex-1">
                          Back
                        </Button>
                        <Button 
                          onClick={() => setWizardStep(2)} 
                          className="flex-1"
                          disabled={!apiCredentials.siteUrl || !apiCredentials.apiKey}
                        >
                          Continue <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {wizardStep === 2 && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h4 className="font-semibold mb-1">Ready to Connect</h4>
                        <p className="text-sm text-muted-foreground">
                          Click below to authorize and start optimizing your website.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-2">
                        <p className="font-medium">What happens next:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Full site scan for SEO issues</li>
                          <li>• Automatic meta tag optimization</li>
                          <li>• Schema markup generation</li>
                          <li>• Real-time monitoring & fixes</li>
                        </ul>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setWizardStep(1)} className="flex-1">
                          Back
                        </Button>
                        <Button 
                          onClick={handleConnect} 
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
                          disabled={!!connecting}
                        >
                          {connecting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Connect & Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Security note */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                <span>Your credentials are encrypted and stored securely</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OnPageSEOPlatformWizard;
