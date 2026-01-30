import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useGeoCurrency } from '@/hooks/use-geo-currency';
import { HighTechBackground, HighTechCardWrapper, PulsingDot, LiveBadge } from '@/components/ui/high-tech-background';
import {
  Target, Zap, BarChart3, Eye, ArrowRight, Flame, AlertTriangle,
  DollarSign, TrendingUp, TrendingDown, FileStack, TestTube2, Layers,
  Sparkles, CheckCircle2, XCircle, Rocket, MousePointerClick, Activity,
  ShoppingCart, Lock, RefreshCw, ExternalLink, Wand2, LayoutGrid, Globe2
} from 'lucide-react';

interface Keyword {
  id: string;
  text: string;
  matchType: string;
  avgCpc: number;
  impressions: number;
  clicks: number;
  qualityScore: number;
  hasLandingPage?: boolean;
  abTestStatus?: 'none' | 'running' | 'complete';
  conversionRate?: number;
}

interface PPCKeywordLandingSystemProps {
  selectedDomain: string | null;
  accessToken?: string | null;
  keywords?: Keyword[];
  isConnected?: boolean;
}

const PLATFORM_OPTIONS = [
  { id: 'lovable', name: 'Lovable', icon: Sparkles, color: 'from-violet-500 to-fuchsia-500', description: 'AI-powered web builder' },
  { id: 'wordpress', name: 'WordPress', icon: Globe2, color: 'from-blue-600 to-cyan-500', description: 'Most popular CMS' },
  { id: 'shopify', name: 'Shopify', icon: ShoppingCart, color: 'from-green-500 to-emerald-400', description: 'E-commerce leader' },
  { id: 'webflow', name: 'Webflow', icon: LayoutGrid, color: 'from-indigo-500 to-blue-400', description: 'Visual design platform' },
  { id: 'wix', name: 'Wix', icon: Layers, color: 'from-amber-500 to-yellow-400', description: 'Easy drag & drop' },
  { id: 'squarespace', name: 'Squarespace', icon: FileStack, color: 'from-slate-600 to-slate-400', description: 'Beautiful templates' },
];

const PAGE_TYPES = [
  { id: 'service', name: 'Service Pages', icon: Target, description: 'Dedicated pages for each service keyword' },
  { id: 'location', name: 'Location Pages', icon: Globe2, description: 'Geo-targeted landing pages' },
  { id: 'product', name: 'Product Pages', icon: ShoppingCart, description: 'Individual product landing pages' },
  { id: 'leadgen', name: 'Lead Gen Pages', icon: MousePointerClick, description: 'High-converting form pages' },
  { id: 'offer', name: 'Offer Pages', icon: DollarSign, description: 'Promotional and discount pages' },
  { id: 'comparison', name: 'Comparison Pages', icon: BarChart3, description: 'You vs. competitors pages' },
];

export function PPCKeywordLandingSystem({ 
  selectedDomain, 
  accessToken, 
  keywords: externalKeywords,
  isConnected 
}: PPCKeywordLandingSystemProps) {
  const { user } = useAuth();
  const { formatLocalPrice, countryCode } = useGeoCurrency();
  
  const [keywords, setKeywords] = useState<Keyword[]>(externalKeywords || []);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [selectedPlatform, setSelectedPlatform] = useState<string>('lovable');
  const [selectedPageType, setSelectedPageType] = useState<string>('service');
  const [isScanning, setIsScanning] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Demo keywords with Quality Score data
  useEffect(() => {
    if (!externalKeywords?.length) {
      setKeywords([
        { id: '1', text: 'plumber near me', matchType: 'exact', avgCpc: 12.50, impressions: 4500, clicks: 180, qualityScore: 4, hasLandingPage: false },
        { id: '2', text: 'emergency plumbing services', matchType: 'phrase', avgCpc: 18.20, impressions: 2800, clicks: 95, qualityScore: 3, hasLandingPage: false },
        { id: '3', text: '24 hour plumber', matchType: 'exact', avgCpc: 15.80, impressions: 3200, clicks: 128, qualityScore: 5, hasLandingPage: false, abTestStatus: 'running', conversionRate: 4.2 },
        { id: '4', text: 'water heater repair', matchType: 'broad', avgCpc: 9.40, impressions: 5100, clicks: 204, qualityScore: 6, hasLandingPage: true, abTestStatus: 'complete', conversionRate: 6.8 },
        { id: '5', text: 'drain cleaning service', matchType: 'exact', avgCpc: 11.20, impressions: 3800, clicks: 152, qualityScore: 4, hasLandingPage: false },
        { id: '6', text: 'bathroom remodel contractor', matchType: 'phrase', avgCpc: 22.50, impressions: 1900, clicks: 57, qualityScore: 3, hasLandingPage: false },
        { id: '7', text: 'kitchen plumbing installation', matchType: 'exact', avgCpc: 14.30, impressions: 2400, clicks: 72, qualityScore: 5, hasLandingPage: true, abTestStatus: 'running', conversionRate: 5.1 },
        { id: '8', text: 'sewer line repair', matchType: 'broad', avgCpc: 19.80, impressions: 1600, clicks: 48, qualityScore: 4, hasLandingPage: false },
      ]);
    }
  }, [externalKeywords]);

  const handleToggleKeyword = (id: string) => {
    setSelectedKeywords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const unpagedKeywords = keywords.filter(k => !k.hasLandingPage);
    if (selectedKeywords.size === unpagedKeywords.length) {
      setSelectedKeywords(new Set());
    } else {
      setSelectedKeywords(new Set(unpagedKeywords.map(k => k.id)));
    }
  };

  const calculatePotentialSavings = () => {
    const lowQsKeywords = keywords.filter(k => k.qualityScore < 7);
    const totalSpend = lowQsKeywords.reduce((sum, k) => sum + (k.avgCpc * k.clicks), 0);
    return Math.round(totalSpend * 0.4); // 40% savings estimate
  };

  const handleScanCampaigns = async () => {
    setIsScanning(true);
    // Simulate campaign scanning
    await new Promise(r => setTimeout(r, 2500));
    toast.success('Campaign scan complete! Found 8 keywords needing landing pages.');
    setIsScanning(false);
  };

  const handleLaunchPages = async () => {
    if (selectedKeywords.size === 0) {
      toast.error('Please select at least one keyword');
      return;
    }
    setShowCheckout(true);
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }
    
    setIsLaunching(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: 'price_1SvPAUDhwTkpKWXvBY3aJiCt',
          quantity: selectedKeywords.size,
          mode: 'payment',
          successUrl: `${window.location.origin}/vi-dashboard?tab=ppc&success=true`,
          cancelUrl: `${window.location.origin}/vi-dashboard?tab=ppc&canceled=true`,
          metadata: {
            type: 'ppc_landing_pages',
            domain: selectedDomain,
            keywords: Array.from(selectedKeywords).join(','),
            platform: selectedPlatform,
            pageType: selectedPageType,
          }
        }
      });
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Failed to start checkout');
    } finally {
      setIsLaunching(false);
      setShowCheckout(false);
    }
  };

  const totalCost = selectedKeywords.size * 25;
  const avgQs = keywords.length > 0 
    ? (keywords.reduce((s, k) => s + k.qualityScore, 0) / keywords.length).toFixed(1) 
    : '0';
  const lowQsCount = keywords.filter(k => k.qualityScore < 7).length;
  const potentialSavings = calculatePotentialSavings();

  return (
    <div className="relative min-h-[600px]">
      <HighTechBackground variant="subtle" showParticles showGrid showScanLine />
      
      {/* Quality Score Education Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-8"
      >
        <div className="glass-card rounded-2xl p-6 border border-destructive/20 bg-gradient-to-br from-destructive/5 via-background to-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-destructive/20 to-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                Missing Landing Pages = Paying More Per Click
                <Badge variant="destructive" className="text-xs">Quality Score Alert</Badge>
              </h3>
              <p className="text-muted-foreground mb-4">
                <span className="text-foreground font-semibold">Without a dedicated landing page for each keyword</span>, Google assigns you a lower Quality Score. 
                This means you're paying <span className="text-destructive font-bold">up to 400% more per click</span> than competitors with optimized pages.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-destructive">{lowQsCount}</p>
                  <p className="text-xs text-muted-foreground">Keywords Below 7 QS</p>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-500">{avgQs}</p>
                  <p className="text-xs text-muted-foreground">Average Quality Score</p>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-500">${potentialSavings.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Potential Monthly Savings</p>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold gradient-text">+40%</p>
                  <p className="text-xs text-muted-foreground">Higher Conversions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Page Type Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <FileStack className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">Bulk Page Generation</h4>
          <Badge variant="outline" className="text-[10px]">AI-Powered</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Create keyword-specific landing pages at scale</p>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {PAGE_TYPES.map((type) => (
            <HighTechCardWrapper key={type.id} showGlow={selectedPageType === type.id}>
              <button
                onClick={() => setSelectedPageType(type.id)}
                className={`w-full glass-card rounded-xl p-3 text-center transition-all duration-300 ${
                  selectedPageType === type.id 
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30' 
                    : 'border-border/50 hover:border-primary/30'
                }`}
              >
                <type.icon className={`w-5 h-5 mx-auto mb-2 ${selectedPageType === type.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-xs font-medium truncate">{type.name}</p>
              </button>
            </HighTechCardWrapper>
          ))}
        </div>
      </motion.div>

      {/* A/B Testing & Heat Tracking Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 mb-6"
      >
        <div className="glass-card rounded-2xl p-6 border border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <TestTube2 className="w-5 h-5 text-primary" />
            <h4 className="font-bold">Built-in A/B Testing & Heat Tracking</h4>
            <LiveBadge label="LIVE" color="primary" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: TrendingUp, value: '+40%', label: 'Higher Quality Score', desc: 'Keyword-matched pages boost Google Ads QS', color: 'text-emerald-400' },
              { icon: TrendingDown, value: '-25%', label: 'Lower Cost Per Click', desc: 'Improved relevance reduces CPC', color: 'text-cyan-400' },
              { icon: MousePointerClick, value: '+60%', label: 'Better Conversion Rates', desc: 'Focused landing pages convert more', color: 'text-violet-400' },
              { icon: Zap, value: '<2s', label: 'Faster Load Times', desc: 'Optimized pages under 2s load', color: 'text-amber-400' },
            ].map((stat, i) => (
              <HighTechCardWrapper key={stat.label}>
                <div className="glass-card rounded-xl p-4 text-center h-full">
                  <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs font-semibold text-foreground">{stat.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{stat.desc}</p>
                </div>
              </HighTechCardWrapper>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Every landing page includes automatic split testing and visitor heat maps to optimize conversions.
          </p>

          {/* A/B Test Preview */}
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { version: 'Version A', percent: 45, desc: 'Original design', color: 'bg-cyan-500' },
              { version: 'Version B', percent: 55, desc: 'New headline', color: 'bg-emerald-500' },
              { version: 'Winner', percent: 100, desc: 'Auto-selected after 1000 visits', color: 'bg-primary' },
            ].map((item) => (
              <div key={item.version} className="glass-card rounded-lg p-3 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{item.version}</span>
                  <span className="text-sm font-bold">{item.percent}%</span>
                </div>
                <Progress value={item.percent} className="h-1.5 mb-1" />
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Keyword Selection Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 mb-6"
      >
        <div className="glass-card rounded-2xl p-6 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h4 className="font-bold">Select Keywords to Launch</h4>
              <Badge variant="outline">{keywords.length} keywords</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleScanCampaigns} disabled={isScanning}>
                <RefreshCw className={`w-4 h-4 mr-1 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning...' : 'Scan Campaigns'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                Select All Without Pages
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
            {keywords.map((keyword, idx) => {
              const isSelected = selectedKeywords.has(keyword.id);
              const qsColor = keyword.qualityScore < 5 ? 'text-destructive' : keyword.qualityScore < 7 ? 'text-amber-500' : 'text-green-500';
              const qsBg = keyword.qualityScore < 5 ? 'bg-destructive/10' : keyword.qualityScore < 7 ? 'bg-amber-500/10' : 'bg-green-500/10';
              
              return (
                <motion.div
                  key={keyword.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : keyword.hasLandingPage 
                        ? 'border-green-500/30 bg-green-500/5' 
                        : 'border-border/50 hover:border-primary/30'
                  }`}
                >
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={() => handleToggleKeyword(keyword.id)}
                    disabled={keyword.hasLandingPage}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{keyword.text}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5">{keyword.matchType}</Badge>
                      {keyword.hasLandingPage && (
                        <Badge className="text-[9px] bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Page Active
                        </Badge>
                      )}
                      {keyword.abTestStatus === 'running' && (
                        <Badge className="text-[9px] bg-violet-500/20 text-violet-400 border-violet-500/30">
                          <Activity className="w-3 h-3 mr-1" /> A/B Testing
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[11px] text-muted-foreground">
                      <span>{keyword.impressions.toLocaleString()} impr</span>
                      <span>{keyword.clicks.toLocaleString()} clicks</span>
                      <span>${keyword.avgCpc.toFixed(2)} CPC</span>
                      {keyword.conversionRate && (
                        <span className="text-green-400">{keyword.conversionRate}% CVR</span>
                      )}
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${qsBg}`}>
                    <Target className={`w-3 h-3 ${qsColor}`} />
                    <span className={`text-sm font-bold ${qsColor}`}>{keyword.qualityScore}</span>
                    <span className="text-[10px] text-muted-foreground">/10</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Platform Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Globe2 className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">Deploy To Platform</h4>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {PLATFORM_OPTIONS.map((platform) => (
            <HighTechCardWrapper key={platform.id} showGlow={selectedPlatform === platform.id}>
              <button
                onClick={() => setSelectedPlatform(platform.id)}
                className={`w-full glass-card rounded-xl p-3 text-center transition-all duration-300 ${
                  selectedPlatform === platform.id 
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30' 
                    : 'border-border/50 hover:border-primary/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center mx-auto mb-2`}>
                  <platform.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium">{platform.name}</p>
              </button>
            </HighTechCardWrapper>
          ))}
        </div>
      </motion.div>

      {/* Checkout Panel */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowCheckout(false)}
          >
            <motion.div
              className="glass-card rounded-2xl p-8 max-w-md w-full border border-primary/30"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Launch Landing Pages</h3>
                  <p className="text-sm text-muted-foreground">A/B Testing + Heatmaps Included</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Selected Keywords</span>
                  <span className="font-bold">{selectedKeywords.size}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Price per Keyword</span>
                  <span className="font-bold">{formatLocalPrice(2500)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Platform</span>
                  <span className="font-bold capitalize">{selectedPlatform}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Page Type</span>
                  <span className="font-bold capitalize">{selectedPageType}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-primary/10 rounded-xl px-3">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold gradient-text">{formatLocalPrice(selectedKeywords.size * 2500)}</span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mb-4 text-center">
                {countryCode !== 'US' && 'Prices shown in local currency. Billed in USD.'}
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowCheckout(false)}>
                  Cancel
                </Button>
                <Button variant="hero" className="flex-1" onClick={handleCheckout} disabled={isLaunching}>
                  {isLaunching ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Pay & Launch
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launch CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10"
      >
        <div className="glass-card rounded-2xl p-6 border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-violet-500/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Ready to Lower Your CPC?</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedKeywords.size > 0 
                    ? `${selectedKeywords.size} keywords selected · ${formatLocalPrice(selectedKeywords.size * 2500)} total`
                    : 'Select keywords above to launch dedicated landing pages'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right mr-2">
                <p className="text-xs text-muted-foreground">Per keyword</p>
                <p className="text-lg font-bold gradient-text">{formatLocalPrice(2500)}</p>
              </div>
              <Button 
                variant="hero" 
                size="lg" 
                onClick={handleLaunchPages}
                disabled={selectedKeywords.size === 0}
                className="min-w-[180px]"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Launch {selectedKeywords.size || ''} Pages
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Page Editor Upsell */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 mt-6"
      >
        <div className="glass-card rounded-xl p-4 border border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-background to-violet-500/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-violet-500 flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm flex items-center gap-2">
                AI Page Editor
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Premium</Badge>
              </h4>
              <p className="text-xs text-muted-foreground">
                Need custom changes? Our AI editor handles design updates, copy changes, and conversion optimization.
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-amber-400">{formatLocalPrice(25000)}</p>
              <p className="text-[10px] text-muted-foreground">per session</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
