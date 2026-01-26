import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Target, FileText, FlaskConical, TrendingUp, X, CheckCircle,
  RefreshCw, Zap, BarChart3, Eye, MousePointer, ArrowRight,
  ExternalLink, Flame, Layers, AlertCircle, LogOut, Award, Building, Sparkles, Clock
} from 'lucide-react';
import { GoogleAdsOnboardingWizard } from './GoogleAdsOnboardingWizard';
import { GoogleAdsCampaignSetupWizard } from './GoogleAdsCampaignSetupWizard';

interface Keyword {
  id: string;
  text: string;
  matchType: string;
  avgCpc: number;
  impressions: number;
  clicks: number;
  qualityScore: number;
}

interface KeywordSummary {
  totalKeywords: number;
  avgQualityScore: string;
  estimatedMonthlySpend: string;
  potentialMonthlySavings: string;
}

interface LandingPagesPanelProps {
  selectedDomain: string | null;
}

// Google Ads icon component
const GoogleAdsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12.32 8.45L3.85 22.52a3.36 3.36 0 01-2.89-1.65 3.33 3.33 0 01-.01-3.36L9.43 3.03a3.36 3.36 0 014.6 1.24 3.36 3.36 0 01-1.71 4.18z" fill="#FBBC04"/>
    <path d="M21.97 17.27a3.36 3.36 0 11-5.82 3.36 3.36 3.36 0 015.82-3.36z" fill="#4285F4"/>
    <path d="M12.32 8.45a3.36 3.36 0 01-2.89-5.42l8.47 14.58a3.35 3.35 0 012.89 5.01L12.32 8.45z" fill="#34A853"/>
  </svg>
);

export function LandingPagesPanel({ selectedDomain }: LandingPagesPanelProps) {
  // Check if returning from OAuth callback on mount
  const hasOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = sessionStorage.getItem('google_ads_oauth_state');
    return Boolean(code && state && state === storedState);
  };

  // Check for stored connection on mount
  const getStoredConnection = () => {
    const storedToken = localStorage.getItem('google_ads_access_token');
    const storedCustomerId = localStorage.getItem('google_ads_customer_id');
    const storedExpiry = localStorage.getItem('google_ads_token_expiry');
    
    // Check if token is still valid (with 5 min buffer)
    if (storedToken && storedCustomerId && storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10);
      if (Date.now() < expiryTime - 300000) {
        return { token: storedToken, customerId: storedCustomerId };
      }
    }
    return null;
  };

  const storedConnection = getStoredConnection();
  
  const [isConnected, setIsConnected] = useState(!!storedConnection);
  // Auto-show wizard if returning from OAuth callback
  const [showWizard, setShowWizard] = useState(hasOAuthCallback);
  const [showCampaignSetup, setShowCampaignSetup] = useState(false);
  const [hasCampaigns, setHasCampaigns] = useState<boolean | null>(null);
  const [isFetchingKeywords, setIsFetchingKeywords] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [summary, setSummary] = useState<KeywordSummary | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [generatedPages, setGeneratedPages] = useState<any[]>([]);
  const [connectedCustomerId, setConnectedCustomerId] = useState<string | null>(storedConnection?.customerId || null);
  const [accessToken, setAccessToken] = useState<string | null>(storedConnection?.token || null);

  const GOOGLE_ADS_SCOPES = 'https://www.googleapis.com/auth/adwords';

  // Restore connection and fetch keywords on mount if we have stored credentials
  useEffect(() => {
    if (storedConnection && !hasOAuthCallback()) {
      // Auto-fetch keywords with stored credentials
      handleFetchKeywordsWithToken(storedConnection.token, storedConnection.customerId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle wizard completion - store credentials
  const handleWizardComplete = useCallback((customerId: string, token: string) => {
    // Store in localStorage for persistence (1 hour expiry)
    localStorage.setItem('google_ads_access_token', token);
    localStorage.setItem('google_ads_customer_id', customerId);
    localStorage.setItem('google_ads_token_expiry', String(Date.now() + 3600000));
    
    setConnectedCustomerId(customerId);
    setAccessToken(token);
    setIsConnected(true);
    setShowWizard(false);
    
    // Auto-fetch keywords after connection
    handleFetchKeywordsWithToken(token, customerId);
  }, []);

  // Disconnect and clear stored credentials - return to domain selection
  const handleDisconnect = useCallback(() => {
    localStorage.removeItem('google_ads_access_token');
    localStorage.removeItem('google_ads_customer_id');
    localStorage.removeItem('google_ads_customer_name');
    localStorage.removeItem('google_ads_token_expiry');
    
    setIsConnected(false);
    setAccessToken(null);
    setConnectedCustomerId(null);
    setKeywords([]);
    setSummary(null);
    setHasCampaigns(null);
    setShowWizard(false);
    setShowCampaignSetup(false);
    setSelectedKeywords(new Set());
    setGeneratedPages([]);
    toast.info('Disconnected from Google Ads');
  }, []);

  // Skip wizard and use demo data
  const handleSkipWizard = useCallback(() => {
    setShowWizard(false);
    setIsConnected(true);
    toast.info('Using demo data - Connect Google Ads for live keywords');
    handleFetchKeywords();
  }, []);

  // Start the connection wizard
  const handleStartConnection = useCallback(() => {
    setShowWizard(true);
  }, []);

  // Fetch keywords with specific token/customer
  const handleFetchKeywordsWithToken = useCallback(async (token: string, customerId: string) => {
    setIsFetchingKeywords(true);
    setHasCampaigns(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-keywords', {
        body: {
          action: 'get-keywords',
          accessToken: token,
          customerId: customerId,
          domain: selectedDomain,
        },
      });

      if (error) throw error;

      setKeywords(data.keywords || []);
      setSummary(data.summary || null);
      setHasCampaigns(data.hasCampaigns !== false);
      
      // If no campaigns, show the campaign setup wizard
      if (data.hasCampaigns === false) {
        setShowCampaignSetup(true);
        toast.info('No active campaigns found. Let\'s set one up!');
      } else if (data.isDemo) {
        toast.info('Demo mode - Google Ads API developer token required for live data');
      }
    } catch (err) {
      console.error('Error fetching keywords:', err);
      toast.error('Failed to fetch keywords');
    } finally {
      setIsFetchingKeywords(false);
    }
  }, [selectedDomain]);

  // Fetch keywords with demo data
  const handleFetchKeywords = useCallback(async () => {
    setIsFetchingKeywords(true);
    setHasCampaigns(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-keywords', {
        body: {
          action: 'get-keywords',
          accessToken: accessToken || 'demo-token',
          customerId: connectedCustomerId || 'demo-customer',
          domain: selectedDomain,
        },
      });

      if (error) throw error;

      setKeywords(data.keywords || []);
      setSummary(data.summary || null);
      setHasCampaigns(data.hasCampaigns !== false);
      
      // If no campaigns, show the campaign setup wizard
      if (data.hasCampaigns === false) {
        setShowCampaignSetup(true);
        toast.info('No active campaigns found. Let\'s set one up!');
      } else if (data.isDemo) {
        toast.info('Showing demo data - Connect Google Ads API for live keywords');
      }
    } catch (err) {
      console.error('Error fetching keywords:', err);
      toast.error('Failed to fetch keywords');
    } finally {
      setIsFetchingKeywords(false);
    }
  }, [accessToken, connectedCustomerId, selectedDomain]);

  // Handle campaign setup completion
  const handleCampaignSetupComplete = useCallback(() => {
    setShowCampaignSetup(false);
    setHasCampaigns(true);
    // Re-fetch keywords after campaign creation
    if (accessToken && connectedCustomerId) {
      handleFetchKeywordsWithToken(accessToken, connectedCustomerId);
    } else {
      handleFetchKeywords();
    }
  }, [accessToken, connectedCustomerId, handleFetchKeywordsWithToken, handleFetchKeywords]);

  const handleToggleKeyword = (keywordId: string) => {
    setSelectedKeywords(prev => {
      const next = new Set(prev);
      if (next.has(keywordId)) {
        next.delete(keywordId);
      } else {
        next.add(keywordId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedKeywords.size === keywords.length) {
      setSelectedKeywords(new Set());
    } else {
      setSelectedKeywords(new Set(keywords.map(k => k.id)));
    }
  };

  const handleGeneratePages = useCallback(async () => {
    if (selectedKeywords.size === 0) {
      toast.error('Please select at least one keyword');
      return;
    }

    setIsGenerating(true);

    try {
      const selectedKws = keywords.filter(k => selectedKeywords.has(k.id));
      
      const { data, error } = await supabase.functions.invoke('google-ads-keywords', {
        body: {
          action: 'generate-pages',
          keywords: selectedKws,
          domain: selectedDomain || 'example.com',
          options: {
            enableABTesting: true,
            enableHeatTracking: true,
          },
        },
      });

      if (error) throw error;

      setGeneratedPages(data.pages || []);
      toast.success(`${data.pages?.length || 0} landing pages queued for generation!`);
    } catch (err) {
      console.error('Error generating pages:', err);
      toast.error('Failed to generate pages');
    } finally {
      setIsGenerating(false);
    }
  }, [keywords, selectedKeywords, selectedDomain]);

  const getQualityScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-amber-500';
    return 'text-red-500';
  };

  const getQualityScoreBg = (score: number) => {
    if (score >= 8) return 'bg-green-500/20';
    if (score >= 6) return 'bg-amber-500/20';
    return 'bg-red-500/20';
  };

  return (
    <div className="relative space-y-6 overflow-hidden">
      {/* High-tech background grid for entire panel */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          opacity: 0.015,
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
      
      {/* Header */}
      <header className="relative flex items-start justify-between gap-4 overflow-hidden">
        {/* Animated gradient glow behind header */}
        <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 rounded-3xl blur-xl pointer-events-none" />
        
        {/* Animated Target Rings - PPC */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-4 h-4 rounded-full border-2 border-orange-400/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] top-1 left-[12%]" />
          <div className="absolute w-3 h-3 rounded-full border-2 border-amber-500/35 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_0.4s] top-5 left-[28%]" />
          <div className="absolute w-5 h-5 rounded-full border-2 border-yellow-400/30 animate-[ping_2.2s_cubic-bezier(0,0,0.2,1)_infinite_0.8s] top-2 left-[42%]" />
          <div className="absolute w-3.5 h-3.5 rounded-full border-2 border-orange-300/40 animate-[ping_2.8s_cubic-bezier(0,0,0.2,1)_infinite_1.2s] top-4 left-[58%]" />
          <div className="absolute w-4 h-4 rounded-full border-2 border-amber-400/35 animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite_1.6s] top-1 left-[72%]" />
        </div>
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shrink-0 shadow-xl shadow-orange-500/25">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">PPC Landing Pages</h2>
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wide">Coming Soon</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Import keywords from Google Ads, generate optimized landing pages, and boost your Quality Score with built-in A/B testing and heat tracking.
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          {isConnected && connectedCustomerId ? (
            <>
              <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/5">
                <GoogleAdsIcon />
                <span className="ml-1.5">
                  {connectedCustomerId.startsWith('demo') ? 'Demo Account' : `Account: ${connectedCustomerId}`}
                </span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="h-7 text-muted-foreground hover:text-destructive hover:border-destructive/50"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Disconnect
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-end gap-2">
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
                  <Sparkles className="w-4 h-4 text-violet-500 animate-[spin_3s_linear_infinite]" />
                  <span className="text-[7px] font-bold text-violet-600 dark:text-violet-400 mt-0.5 whitespace-nowrap">Agentic AI</span>
                </div>
              </div>
              {/* Feature Pills - Row 1 */}
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                  <FlaskConical className="w-2.5 h-2.5 text-orange-500" />
                  <span className="text-[9px] font-medium text-orange-600 dark:text-orange-400">A/B Test</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                  <Flame className="w-2.5 h-2.5 text-red-500" />
                  <span className="text-[9px] font-medium text-red-600 dark:text-red-400">Heatmaps</span>
                </div>
              </div>
              {/* Feature Pills - Row 2 */}
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                  <TrendingUp className="w-2.5 h-2.5 text-amber-500" />
                  <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">Quality Score</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Show Campaign Setup Wizard when connected but no campaigns */}
      {showCampaignSetup && isConnected && accessToken && connectedCustomerId ? (
        <GoogleAdsCampaignSetupWizard
          domain={selectedDomain || ''}
          customerId={connectedCustomerId}
          accessToken={accessToken}
          onComplete={handleCampaignSetupComplete}
          onCancel={() => setShowCampaignSetup(false)}
        />
      ) : showWizard ? (
        <GoogleAdsOnboardingWizard
          domain={selectedDomain || ''}
          onComplete={handleWizardComplete}
          onSkip={handleSkipWizard}
        />
      ) : !isConnected ? (
        <div className="space-y-6">
          {/* Top row: Connect box + How It Works side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Connect Button - Left side */}
            <div className="lg:col-span-4">
              <div className="h-full p-6 rounded-xl border-2 border-dashed border-orange-500/30 bg-orange-500/5">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <GoogleAdsIcon />
                    <h3 className="text-lg font-semibold">Connect Google Ads</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    Import your active PPC keywords and generate optimized landing pages automatically.
                  </p>
                  <Button
                    onClick={handleStartConnection}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  >
                    <GoogleAdsIcon />
                    <span className="ml-2">Connect Account</span>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Read-only keyword access
                  </p>
                </div>
              </div>
            </div>

            {/* How It Works - Right side */}
            <div className="lg:col-span-8">
              <h3 className="text-lg font-semibold mb-4">How It Works</h3>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { 
                    step: '1', 
                    icon: Target,
                    title: 'Connect Google Ads', 
                    desc: 'Securely link your Google Ads account with read-only access to import your active campaigns and keywords.',
                    highlight: 'OAuth 2.0 Secure'
                  },
                  { 
                    step: '2', 
                    icon: BarChart3,
                    title: 'Import Keywords', 
                    desc: 'Automatically pull your active PPC keywords along with Quality Scores, CPC data, and performance metrics.',
                    highlight: 'Real-time Sync'
                  },
                  { 
                    step: '3', 
                    icon: Zap,
                    title: 'Generate Pages', 
                    desc: 'AI creates keyword-specific landing pages optimized for conversions with unique content for each target.',
                    highlight: 'AI-Powered'
                  },
                  { 
                    step: '4', 
                    icon: FlaskConical,
                    title: 'Track & Optimize', 
                    desc: 'Built-in A/B testing and heat maps show exactly what works. Watch your Quality Score and conversions improve.',
                    highlight: 'Heat Tracking'
                  },
                ].map((item) => (
                  <div key={item.step} className="relative p-5 rounded-xl bg-gradient-to-br from-orange-500/5 to-amber-500/10 border border-orange-500/20 flex flex-col min-h-[180px]">
                    <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      {item.step}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-3 mt-1">
                      <item.icon className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="font-semibold text-sm mb-2">{item.title}</p>
                    <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{item.desc}</p>
                    <Badge variant="outline" className="mt-3 w-fit text-[10px] text-orange-500 border-orange-500/30 bg-orange-500/5">
                      {item.highlight}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row: Feature cards in a horizontal row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: FileText, label: 'Bulk Page Generation', desc: '1,000s of keyword-specific pages with unique content for each target keyword', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
              { icon: FlaskConical, label: 'A/B Testing', desc: 'Test multiple headlines, CTAs, and layouts to maximize conversions', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
              { icon: Flame, label: 'Heat Tracking', desc: 'Visualize user behavior with click and scroll analytics on every page', color: 'text-red-500', bgColor: 'bg-red-500/10' },
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
        </div>
      ) : (
        <>
          {/* Connected State - Keywords Table */}
          <div className="w-full">
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-2xl font-bold text-foreground">{summary.totalKeywords}</p>
                  <p className="text-xs text-muted-foreground">Active Keywords</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-2xl font-bold text-amber-500">{summary.avgQualityScore}/10</p>
                  <p className="text-xs text-muted-foreground">Avg Quality Score</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-2xl font-bold text-foreground">${summary.estimatedMonthlySpend}</p>
                  <p className="text-xs text-muted-foreground">Est. Monthly Spend</p>
                </div>
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <p className="text-2xl font-bold text-green-500">${summary.potentialMonthlySavings}</p>
                  <p className="text-xs text-muted-foreground">Potential Savings</p>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="mb-4 p-3 rounded-xl bg-muted/30 border border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedKeywords.size === keywords.length && keywords.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedKeywords.size} of {keywords.length} selected
                </span>
              </div>
              <div className="flex items-center gap-2 justify-end flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Disconnect
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFetchKeywords}
                  disabled={isFetchingKeywords}
                >
                  {isFetchingKeywords ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span className="ml-1">Refresh</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleGeneratePages}
                  disabled={selectedKeywords.size === 0 || isGenerating}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-1" />
                      Generate {selectedKeywords.size} Pages
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Keywords Table */}
            {isFetchingKeywords ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
                <p className="text-muted-foreground">Importing keywords from Google Ads...</p>
              </div>
            ) : keywords.length > 0 ? (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="w-10 px-4 py-3"></th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Keyword</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Match</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Avg CPC</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Impressions</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Clicks</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Quality</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Potential</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {keywords.map((kw) => (
                        <tr 
                          key={kw.id} 
                          className={`hover:bg-muted/30 transition-colors ${selectedKeywords.has(kw.id) ? 'bg-orange-500/5' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={selectedKeywords.has(kw.id)}
                              onCheckedChange={() => handleToggleKeyword(kw.id)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-sm">{kw.text}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className="text-xs">
                              {kw.matchType}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-sm">${kw.avgCpc.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-sm text-muted-foreground">{kw.impressions.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-sm text-muted-foreground">{kw.clicks.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getQualityScoreBg(kw.qualityScore)} ${getQualityScoreColor(kw.qualityScore)}`}>
                              {kw.qualityScore}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-green-500/20 text-green-500">
                              {Math.min(10, kw.qualityScore + 3)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-amber-500/30 bg-amber-500/5">
                <div className="flex flex-col items-center text-center">
                  <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Campaigns Found</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md">
                    {selectedDomain ? (
                      <>We couldn't find any Google Ads campaigns targeting <span className="font-medium text-primary">{selectedDomain}</span>.</>
                    ) : (
                      <>We couldn't find any active campaigns in your Google Ads account.</>
                    )}
                  </p>
                  <Button
                    onClick={() => setShowCampaignSetup(true)}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                </div>
              </div>
            )}

            {/* Generated Pages Preview */}
            {generatedPages.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-500" />
                  Generated Landing Pages
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedPages.slice(0, 6).map((page) => (
                    <div key={page.keywordId} className="p-4 rounded-xl border border-border bg-card hover:border-orange-500/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                          {page.abVariants.length} Variants
                        </Badge>
                        <Badge variant="outline" className="text-green-500 border-green-500/30">
                          QS: {page.estimatedQualityScore}/10
                        </Badge>
                      </div>
                      <p className="font-medium text-sm mb-2">{page.keyword}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        Heat tracking enabled
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <BarChart3 className="w-3 h-3" />
                        Analytics ready
                      </div>
                      <Button variant="ghost" size="sm" className="w-full mt-3 text-xs">
                        Preview Page <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
                {generatedPages.length > 6 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    + {generatedPages.length - 6} more pages generated
                  </p>
                )}
              </div>
            )}

            {/* Demo Notice */}
            <div className="mt-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center">
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 mb-2">
                Demo Mode
              </Badge>
              <p className="text-xs text-muted-foreground">
                Showing sample data. Full Google Ads API integration requires a developer token from Google.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default LandingPagesPanel;
