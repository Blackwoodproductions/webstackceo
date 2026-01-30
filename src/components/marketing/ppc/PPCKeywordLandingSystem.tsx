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
import { PPC_PRODUCTS, formatPrice } from '@/lib/stripeProducts';
import {
  Target, Zap, BarChart3, Eye, ArrowRight, Flame, AlertTriangle,
  DollarSign, TrendingUp, TrendingDown, FileStack, TestTube2, Layers,
  Sparkles, CheckCircle2, XCircle, Rocket, MousePointerClick, Activity,
  ShoppingCart, Lock, RefreshCw, ExternalLink, Wand2, LayoutGrid, Globe2,
  Brain, Gauge, LineChart, MapPin, Search, Scan, Play, Pause, Crown,
  AlertCircle, Calculator, Percent, Timer, Crosshair, Filter, SlidersHorizontal,
  Thermometer, Grid3X3, Award, Star, Info, ChevronRight, ChevronDown,
  CircleDollarSign, ArrowUpRight, ArrowDownRight, X
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
  potentialSavings?: number;
  expectedQsBoost?: number;
}

interface PPCKeywordLandingSystemProps {
  selectedDomain: string | null;
  accessToken?: string | null;
  keywords?: Keyword[];
  isConnected?: boolean;
}

const PLATFORM_OPTIONS = [
  { id: 'lovable', name: 'Lovable', icon: Sparkles, color: 'from-violet-500 to-fuchsia-500', description: 'AI-powered web builder', recommended: true },
  { id: 'wordpress', name: 'WordPress', icon: Globe2, color: 'from-blue-600 to-cyan-500', description: 'Most popular CMS' },
  { id: 'shopify', name: 'Shopify', icon: ShoppingCart, color: 'from-green-500 to-emerald-400', description: 'E-commerce leader' },
  { id: 'webflow', name: 'Webflow', icon: LayoutGrid, color: 'from-indigo-500 to-blue-400', description: 'Visual design platform' },
  { id: 'wix', name: 'Wix', icon: Layers, color: 'from-amber-500 to-yellow-400', description: 'Easy drag & drop' },
  { id: 'squarespace', name: 'Squarespace', icon: FileStack, color: 'from-slate-600 to-slate-400', description: 'Beautiful templates' },
];

const PAGE_TYPES = [
  { id: 'service', name: 'Service Pages', icon: Target, description: 'Dedicated pages for each service keyword', emoji: '🎯' },
  { id: 'location', name: 'Location Pages', icon: MapPin, description: 'Geo-targeted landing pages', emoji: '📍' },
  { id: 'product', name: 'Product Pages', icon: ShoppingCart, description: 'Individual product landing pages', emoji: '🛒' },
  { id: 'leadgen', name: 'Lead Gen Pages', icon: MousePointerClick, description: 'High-converting form pages', emoji: '📝' },
  { id: 'offer', name: 'Offer Pages', icon: DollarSign, description: 'Promotional and discount pages', emoji: '🎁' },
  { id: 'comparison', name: 'Comparison Pages', icon: BarChart3, description: 'You vs. competitors pages', emoji: '⚔️' },
];

// Get pricing from centralized config
const KEYWORD_PRICE = PPC_PRODUCTS.find(p => p.id === 'ppc-keyword-ab-test')?.price || 2500;
const PAGE_EDITOR_PRICE = PPC_PRODUCTS.find(p => p.id === 'ppc-page-editor-session')?.price || 25000;

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
  const [showEditorCheckout, setShowEditorCheckout] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('quality-score');

  // Demo keywords with Quality Score data and savings estimates
  useEffect(() => {
    if (!externalKeywords?.length) {
      setKeywords([
        { id: '1', text: 'plumber near me', matchType: 'exact', avgCpc: 12.50, impressions: 4500, clicks: 180, qualityScore: 4, hasLandingPage: false, potentialSavings: 540, expectedQsBoost: 4 },
        { id: '2', text: 'emergency plumbing services', matchType: 'phrase', avgCpc: 18.20, impressions: 2800, clicks: 95, qualityScore: 3, hasLandingPage: false, potentialSavings: 692, expectedQsBoost: 5 },
        { id: '3', text: '24 hour plumber', matchType: 'exact', avgCpc: 15.80, impressions: 3200, clicks: 128, qualityScore: 5, hasLandingPage: false, abTestStatus: 'running', conversionRate: 4.2, potentialSavings: 405, expectedQsBoost: 3 },
        { id: '4', text: 'water heater repair', matchType: 'broad', avgCpc: 9.40, impressions: 5100, clicks: 204, qualityScore: 6, hasLandingPage: true, abTestStatus: 'complete', conversionRate: 6.8 },
        { id: '5', text: 'drain cleaning service', matchType: 'exact', avgCpc: 11.20, impressions: 3800, clicks: 152, qualityScore: 4, hasLandingPage: false, potentialSavings: 341, expectedQsBoost: 4 },
        { id: '6', text: 'bathroom remodel contractor', matchType: 'phrase', avgCpc: 22.50, impressions: 1900, clicks: 57, qualityScore: 3, hasLandingPage: false, potentialSavings: 513, expectedQsBoost: 5 },
        { id: '7', text: 'kitchen plumbing installation', matchType: 'exact', avgCpc: 14.30, impressions: 2400, clicks: 72, qualityScore: 5, hasLandingPage: true, abTestStatus: 'running', conversionRate: 5.1 },
        { id: '8', text: 'sewer line repair', matchType: 'broad', avgCpc: 19.80, impressions: 1600, clicks: 48, qualityScore: 4, hasLandingPage: false, potentialSavings: 380, expectedQsBoost: 4 },
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
    return Math.round(totalSpend * 0.4);
  };

  const handleScanCampaigns = async () => {
    setIsScanning(true);
    await new Promise(r => setTimeout(r, 3000));
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
          priceId: PPC_PRODUCTS.find(p => p.id === 'ppc-keyword-ab-test')?.priceId,
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

  const handleEditorCheckout = async () => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }
    
    setIsLaunching(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: PPC_PRODUCTS.find(p => p.id === 'ppc-page-editor-session')?.priceId,
          quantity: 1,
          mode: 'payment',
          successUrl: `${window.location.origin}/vi-dashboard?tab=ppc&editor=true`,
          cancelUrl: `${window.location.origin}/vi-dashboard?tab=ppc&canceled=true`,
          metadata: {
            type: 'ppc_page_editor',
            domain: selectedDomain,
          }
        }
      });
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Editor checkout error:', err);
      toast.error('Failed to start checkout');
    } finally {
      setIsLaunching(false);
      setShowEditorCheckout(false);
    }
  };

  const totalCost = selectedKeywords.size * KEYWORD_PRICE;
  const avgQs = keywords.length > 0 
    ? (keywords.reduce((s, k) => s + k.qualityScore, 0) / keywords.length).toFixed(1) 
    : '0';
  const lowQsCount = keywords.filter(k => k.qualityScore < 7).length;
  const potentialSavings = calculatePotentialSavings();
  const keywordsWithoutPages = keywords.filter(k => !k.hasLandingPage).length;

  return (
    <div className="relative min-h-[600px] space-y-6">
      <HighTechBackground variant="subtle" showParticles showGrid showScanLine />
      
      {/* HERO SECTION - Quality Score Education */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <div className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-gradient-to-br from-destructive/10 via-background/95 to-amber-500/10 p-8">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-destructive/20 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-radial from-amber-500/15 to-transparent rounded-full blur-2xl" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-destructive/30 to-amber-500/30 flex items-center justify-center flex-shrink-0 border border-destructive/20">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-2xl font-bold text-foreground">
                    You're Paying More Per Click Than You Should
                  </h2>
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    Quality Score Alert
                  </Badge>
                </div>
                
                <p className="text-lg text-muted-foreground mb-2">
                  <span className="text-foreground font-semibold">Without a dedicated landing page for each keyword</span>, 
                  Google assigns you a <span className="text-destructive font-bold">lower Quality Score</span>.
                </p>
                
                <div className="glass-card rounded-xl p-4 border border-amber-500/20 bg-amber-500/5 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Calculator className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-amber-400">How Quality Score Affects Your CPC</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">QS 3</p>
                      <p className="text-lg font-bold text-destructive">+400%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">QS 5</p>
                      <p className="text-lg font-bold text-amber-500">+100%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">QS 7</p>
                      <p className="text-lg font-bold text-cyan-400">Base CPC</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">QS 10</p>
                      <p className="text-lg font-bold text-emerald-400">-50%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { value: lowQsCount, label: 'Low QS Keywords', sublabel: 'Below 7/10', color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertCircle },
                { value: avgQs, label: 'Average Quality Score', sublabel: 'Current', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Gauge },
                { value: `$${potentialSavings.toLocaleString()}`, label: 'Monthly Overpayment', sublabel: 'Estimated', color: 'text-destructive', bg: 'bg-destructive/10', icon: CircleDollarSign },
                { value: keywordsWithoutPages, label: 'Missing Pages', sublabel: 'Keywords need pages', color: 'text-violet-400', bg: 'bg-violet-500/10', icon: FileStack },
                { value: '+40%', label: 'QS Improvement', sublabel: 'With dedicated pages', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: TrendingUp },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <HighTechCardWrapper>
                    <div className={`glass-card rounded-xl p-4 text-center border border-border/30 ${stat.bg}`}>
                      <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs font-medium text-foreground">{stat.label}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.sublabel}</p>
                    </div>
                  </HighTechCardWrapper>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* BULK PAGE GENERATION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10"
      >
        <div className="glass-card rounded-2xl p-6 border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-cyan-500/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
              <FileStack className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                Bulk Page Generation
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">AI-Powered</Badge>
              </h3>
              <p className="text-sm text-muted-foreground">Create keyword-specific landing pages at scale</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {PAGE_TYPES.map((type) => (
              <HighTechCardWrapper key={type.id} showGlow={selectedPageType === type.id}>
                <button
                  onClick={() => setSelectedPageType(type.id)}
                  className={`w-full glass-card rounded-xl p-4 text-center transition-all duration-300 h-full ${
                    selectedPageType === type.id 
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30' 
                      : 'border-border/50 hover:border-primary/30'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{type.emoji}</span>
                  <p className="text-xs font-medium">{type.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{type.description}</p>
                </button>
              </HighTechCardWrapper>
            ))}
          </div>
        </div>
      </motion.div>

      {/* A/B TESTING & HEAT TRACKING */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10"
      >
        <div className="glass-card rounded-2xl p-6 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-background to-violet-500/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                <TestTube2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  Built-in A/B Testing & Heat Tracking
                  <LiveBadge label="LIVE" color="primary" />
                </h3>
                <p className="text-sm text-muted-foreground">Automated split testing with heatmaps for every page</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: TrendingUp, value: '+40%', label: 'Higher Quality Score', desc: 'Keyword-matched pages boost Google Ads QS', color: 'from-emerald-500 to-green-400' },
              { icon: TrendingDown, value: '-25%', label: 'Lower Cost Per Click', desc: 'Improved relevance reduces CPC', color: 'from-cyan-500 to-blue-400' },
              { icon: MousePointerClick, value: '+60%', label: 'Better Conversion Rates', desc: 'Focused landing pages convert more', color: 'from-violet-500 to-purple-400' },
              { icon: Zap, value: '<2s', label: 'Faster Load Times', desc: 'Optimized pages under 2s load', color: 'from-amber-500 to-yellow-400' },
            ].map((stat, i) => (
              <HighTechCardWrapper key={stat.label}>
                <div className="glass-card rounded-xl p-5 text-center h-full border border-border/30 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`} />
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-3`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{stat.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{stat.desc}</p>
                </div>
              </HighTechCardWrapper>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            Every landing page includes automatic split testing and visitor heat maps to optimize conversions.
          </p>

          {/* A/B Test Preview */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { version: 'Version A', percent: 45, desc: 'Original design', color: 'bg-cyan-500', textColor: 'text-cyan-400' },
              { version: 'Version B', percent: 55, desc: 'New headline', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
              { version: 'Winner', percent: 100, desc: 'Auto-selected after 1000 visits', color: 'bg-gradient-to-r from-primary to-violet-500', textColor: 'text-primary', isWinner: true },
            ].map((item) => (
              <div key={item.version} className={`glass-card rounded-xl p-4 border ${item.isWinner ? 'border-primary/30 bg-primary/5' : 'border-border/50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {item.isWinner && <Crown className="w-4 h-4 text-amber-500" />}
                    <span className={`text-sm font-bold ${item.textColor}`}>{item.version}</span>
                  </div>
                  <span className={`text-lg font-bold ${item.textColor}`}>{item.percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-background/50 overflow-hidden mb-2">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.percent}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* KEYWORD SELECTION TABLE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-10"
      >
        <div className="glass-card rounded-2xl p-6 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h4 className="font-bold text-lg">Select Keywords to Launch</h4>
              <Badge variant="outline">{keywords.length} keywords</Badge>
              {selectedKeywords.size > 0 && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {selectedKeywords.size} selected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleScanCampaigns} disabled={isScanning}>
                <Scan className={`w-4 h-4 mr-1 ${isScanning ? 'animate-pulse' : ''}`} />
                {isScanning ? 'Scanning...' : 'Scan Campaigns'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                Select All ({keywordsWithoutPages})
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {keywords.map((keyword, idx) => {
              const isSelected = selectedKeywords.has(keyword.id);
              const qsColor = keyword.qualityScore < 5 ? 'text-destructive' : keyword.qualityScore < 7 ? 'text-amber-500' : 'text-emerald-400';
              const qsBg = keyword.qualityScore < 5 ? 'bg-destructive/10 border-destructive/20' : keyword.qualityScore < 7 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20';
              
              return (
                <motion.div
                  key={keyword.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                      : keyword.hasLandingPage 
                        ? 'border-emerald-500/30 bg-emerald-500/5' 
                        : 'border-border/50 hover:border-primary/30'
                  }`}
                >
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={() => handleToggleKeyword(keyword.id)}
                    disabled={keyword.hasLandingPage}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{keyword.text}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5">{keyword.matchType}</Badge>
                      {keyword.hasLandingPage && (
                        <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Page Active
                        </Badge>
                      )}
                      {keyword.abTestStatus === 'running' && (
                        <Badge className="text-[9px] bg-violet-500/20 text-violet-400 border-violet-500/30">
                          <Activity className="w-3 h-3 mr-1" /> A/B Testing
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {keyword.impressions.toLocaleString()} impr
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="w-3 h-3" />
                        {keyword.clicks.toLocaleString()} clicks
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${keyword.avgCpc.toFixed(2)} CPC
                      </span>
                      {keyword.conversionRate && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {keyword.conversionRate}% CVR
                        </span>
                      )}
                      {keyword.potentialSavings && !keyword.hasLandingPage && (
                        <span className="text-amber-500 flex items-center gap-1">
                          <CircleDollarSign className="w-3 h-3" />
                          Save ${keyword.potentialSavings}/mo
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${qsBg}`}>
                    <Gauge className={`w-4 h-4 ${qsColor}`} />
                    <span className={`text-lg font-bold ${qsColor}`}>{keyword.qualityScore}</span>
                    <span className="text-[10px] text-muted-foreground">/10</span>
                    {keyword.expectedQsBoost && !keyword.hasLandingPage && (
                      <span className="text-[10px] text-emerald-400 flex items-center">
                        <ArrowUpRight className="w-3 h-3" />+{keyword.expectedQsBoost}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* PLATFORM SELECTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10"
      >
        <div className="glass-card rounded-2xl p-6 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Globe2 className="w-5 h-5 text-primary" />
            <h4 className="font-bold">Deploy To Platform</h4>
            <Badge variant="outline" className="text-[10px]">BRON Plugin Integration</Badge>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {PLATFORM_OPTIONS.map((platform) => (
              <HighTechCardWrapper key={platform.id} showGlow={selectedPlatform === platform.id}>
                <button
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`w-full glass-card rounded-xl p-4 text-center transition-all duration-300 relative ${
                    selectedPlatform === platform.id 
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30' 
                      : 'border-border/50 hover:border-primary/30'
                  }`}
                >
                  {platform.recommended && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[8px]">
                        <Star className="w-2.5 h-2.5 mr-0.5" /> Best
                      </Badge>
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center mx-auto mb-2`}>
                    <platform.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-medium">{platform.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{platform.description}</p>
                </button>
              </HighTechCardWrapper>
            ))}
          </div>
        </div>
      </motion.div>

      {/* PRICING SUMMARY & CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10"
      >
        <div className="glass-card rounded-2xl p-6 border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-violet-500/10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Ready to Lower Your CPC & Boost Quality Score?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedKeywords.size > 0 
                    ? `${selectedKeywords.size} keywords selected · Each gets a dedicated A/B tested landing page`
                    : 'Select keywords above to launch dedicated landing pages with A/B testing'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Per Keyword</p>
                <p className="text-2xl font-bold gradient-text">{formatLocalPrice(KEYWORD_PRICE)}</p>
                <p className="text-[10px] text-muted-foreground">A/B Test + Heatmap</p>
              </div>
              
              {selectedKeywords.size > 0 && (
                <div className="text-center px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold gradient-text">{formatLocalPrice(totalCost)}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedKeywords.size} pages</p>
                </div>
              )}
              
              <Button 
                variant="hero" 
                size="lg" 
                onClick={handleLaunchPages}
                disabled={selectedKeywords.size === 0}
                className="min-w-[200px]"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Launch {selectedKeywords.size || ''} Pages
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* PAGE EDITOR PREMIUM UPSELL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative z-10"
      >
        <div className="glass-card rounded-2xl p-6 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-violet-500/10 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-amber-500/10 to-transparent rounded-full blur-2xl" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                <Wand2 className="w-7 h-7 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-lg">AI Page Editor</h4>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                    <Crown className="w-3 h-3 mr-1" /> Premium Service
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Need custom changes to your landing pages? Our AI-powered editor uses natural language to handle design updates, 
                  copy changes, and conversion optimizations. Just describe what you want changed.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { icon: Wand2, text: 'Natural Language Editing' },
                    { icon: LayoutGrid, text: 'Design Overhauls' },
                    { icon: FileStack, text: 'Copy Updates' },
                    { icon: TrendingUp, text: 'Conversion Optimization' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <item.icon className="w-4 h-4 text-amber-500" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-right flex-shrink-0">
                <p className="text-3xl font-bold text-amber-400">{formatLocalPrice(PAGE_EDITOR_PRICE)}</p>
                <p className="text-xs text-muted-foreground mb-3">per editing session</p>
                <Button 
                  variant="outline" 
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  onClick={() => setShowEditorCheckout(true)}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Start Editing
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CHECKOUT MODAL - Keyword Pages */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowCheckout(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card rounded-2xl p-8 max-w-lg w-full border border-primary/30 relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowCheckout(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                  <Rocket className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Launch Landing Pages</h3>
                  <p className="text-sm text-muted-foreground">A/B Testing + Heatmaps + Quality Score Boost</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Selected Keywords</span>
                  <span className="font-bold text-lg">{selectedKeywords.size}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Price per Keyword</span>
                  <span className="font-bold">{formatLocalPrice(KEYWORD_PRICE)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Platform</span>
                  <span className="font-bold capitalize">{selectedPlatform}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Page Type</span>
                  <span className="font-bold capitalize">{selectedPageType}</span>
                </div>
                
                <div className="glass-card rounded-xl p-4 bg-primary/10 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total</span>
                    <span className="text-3xl font-bold gradient-text">{formatLocalPrice(totalCost)}</span>
                  </div>
                </div>
              </div>
              
              <div className="glass-card rounded-lg p-3 bg-emerald-500/5 border border-emerald-500/20 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Included:</span>
                  <span className="text-muted-foreground">A/B Testing, Heatmaps, Conversion Analytics</span>
                </div>
              </div>
              
              {countryCode !== 'US' && (
                <p className="text-xs text-muted-foreground mb-4 text-center">
                  Prices shown in local currency. Billed in USD.
                </p>
              )}
              
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

      {/* CHECKOUT MODAL - Page Editor */}
      <AnimatePresence>
        {showEditorCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowEditorCheckout(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card rounded-2xl p-8 max-w-lg w-full border border-amber-500/30 relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowEditorCheckout(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-violet-500 flex items-center justify-center">
                  <Wand2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">AI Page Editor Session</h3>
                  <p className="text-sm text-muted-foreground">Premium natural language page editing</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Session Type</span>
                  <span className="font-bold">Full Editing Session</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Includes</span>
                  <span className="font-bold">Unlimited Changes</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-muted-foreground">AI-Powered</span>
                  <span className="font-bold text-amber-400">Natural Language</span>
                </div>
                
                <div className="glass-card rounded-xl p-4 bg-amber-500/10 border border-amber-500/20">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total</span>
                    <span className="text-3xl font-bold text-amber-400">{formatLocalPrice(PAGE_EDITOR_PRICE)}</span>
                  </div>
                </div>
              </div>
              
              <div className="glass-card rounded-lg p-3 bg-amber-500/5 border border-amber-500/20 mb-4">
                <p className="text-xs text-muted-foreground">
                  <span className="text-amber-400 font-medium">Premium Service:</span> Our AI editor understands natural language commands 
                  to make design changes, copy updates, A/B test variants, and conversion optimizations to your landing pages.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowEditorCheckout(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-amber-500 to-violet-500 hover:from-amber-600 hover:to-violet-600" 
                  onClick={handleEditorCheckout} 
                  disabled={isLaunching}
                >
                  {isLaunching ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Purchase Session
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
