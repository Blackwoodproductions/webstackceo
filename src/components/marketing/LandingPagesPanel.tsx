import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Target, FileText, FlaskConical, TrendingUp, CheckCircle,
  RefreshCw, Zap, BarChart3, Eye, ArrowRight,
  ExternalLink, Flame, Layers, AlertCircle, LogOut, Clock
} from 'lucide-react';
import { GoogleAdsCampaignSetupWizard } from './GoogleAdsCampaignSetupWizard';
import { GoogleAdsOnboardingWizard } from './GoogleAdsOnboardingWizard';

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
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12.32 8.45L3.85 22.52a3.36 3.36 0 01-2.89-1.65 3.33 3.33 0 01-.01-3.36L9.43 3.03a3.36 3.36 0 014.6 1.24 3.36 3.36 0 01-1.71 4.18z" fill="#FBBC04"/>
    <path d="M21.97 17.27a3.36 3.36 0 11-5.82 3.36 3.36 3.36 0 015.82-3.36z" fill="#4285F4"/>
    <path d="M12.32 8.45a3.36 3.36 0 01-2.89-5.42l8.47 14.58a3.35 3.35 0 012.89 5.01L12.32 8.45z" fill="#34A853"/>
  </svg>
);

export function LandingPagesPanel({ selectedDomain }: LandingPagesPanelProps) {
  const hasOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = sessionStorage.getItem('google_ads_oauth_state');
    return Boolean(code && state && state === storedState);
  };

  const getStoredConnection = () => {
    const adsToken = localStorage.getItem('google_ads_access_token');
    const adsExpiry = localStorage.getItem('google_ads_token_expiry');
    const storedCustomerId = localStorage.getItem('google_ads_customer_id');
    
    if (adsToken && adsExpiry) {
      const expiryTime = parseInt(adsExpiry, 10);
      if (Date.now() < expiryTime - 300000) {
        return { token: adsToken, customerId: storedCustomerId || 'unified-auth', isUnifiedAuth: true };
      }
    }
    
    const unifiedToken = localStorage.getItem('unified_google_token') || 
                         localStorage.getItem('gsc_access_token') || 
                         localStorage.getItem('ga_access_token');
    const unifiedExpiry = localStorage.getItem('unified_google_expiry') ||
                          localStorage.getItem('gsc_token_expiry') || 
                          localStorage.getItem('ga_token_expiry');
    
    if (unifiedToken && unifiedExpiry) {
      const expiryTime = parseInt(unifiedExpiry, 10);
      if (Date.now() < expiryTime - 300000) {
        localStorage.setItem('google_ads_access_token', unifiedToken);
        localStorage.setItem('google_ads_token_expiry', unifiedExpiry);
        return { token: unifiedToken, customerId: storedCustomerId || 'unified-auth', isUnifiedAuth: true };
      }
    }
    
    return null;
  };

  const storedConnection = getStoredConnection();
  
  const [isConnected, setIsConnected] = useState(!!storedConnection);
  const [showWizard, setShowWizard] = useState(false);
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
  const [isUnifiedAuth, setIsUnifiedAuth] = useState(storedConnection?.isUnifiedAuth || false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);

  useEffect(() => {
    const checkAndRestore = () => {
      const connection = getStoredConnection();
      if (connection && !hasOAuthCallback()) {
        setIsConnected(true);
        setAccessToken(connection.token);
        setConnectedCustomerId(connection.customerId);
        setIsUnifiedAuth(connection.isUnifiedAuth || false);
        handleFetchKeywordsWithToken(connection.token, connection.customerId);
      }
    };
    checkAndRestore();
    
    const handleAuthSync = (e: CustomEvent) => {
      const newConnection = getStoredConnection();
      if (newConnection) {
        setIsConnected(true);
        setAccessToken(newConnection.token);
        setConnectedCustomerId(newConnection.customerId);
        setIsUnifiedAuth(newConnection.isUnifiedAuth || false);
        handleFetchKeywordsWithToken(newConnection.token, newConnection.customerId);
      }
    };
    
    window.addEventListener("google-auth-synced", handleAuthSync as EventListener);
    return () => window.removeEventListener("google-auth-synced", handleAuthSync as EventListener);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWizardComplete = useCallback((customerId: string, token: string) => {
    localStorage.setItem('google_ads_access_token', token);
    localStorage.setItem('google_ads_customer_id', customerId);
    localStorage.setItem('google_ads_token_expiry', String(Date.now() + 3600000));
    setConnectedCustomerId(customerId);
    setAccessToken(token);
    setIsConnected(true);
    setShowWizard(false);
    handleFetchKeywordsWithToken(token, customerId);
  }, []);

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

  const handleSkipWizard = useCallback(() => {
    setShowWizard(false);
    setIsConnected(true);
    toast.info('Using demo data - Connect Google Ads for live keywords');
    handleFetchKeywords();
  }, []);

  const handleStartConnection = useCallback(() => {
    setShowWizard(true);
  }, []);

  const handleFetchKeywordsWithToken = useCallback(async (token: string, customerId: string) => {
    setIsFetchingKeywords(true);
    setIsCheckingAccount(true);
    setHasCampaigns(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-keywords', {
        body: { action: 'get-keywords', accessToken: token, customerId, domain: selectedDomain },
      });

      if (error) throw error;

      const isRealData = data.hasCampaigns === true && !data.isDemo;
      
      if (isRealData) {
        setKeywords(data.keywords || []);
        setSummary(data.summary || null);
        setHasCampaigns(true);
        setShowCampaignSetup(false);
      } else {
        setKeywords([]);
        setSummary(null);
        setHasCampaigns(false);
        setShowCampaignSetup(true);
      }
    } catch (err) {
      console.error('Error fetching keywords:', err);
      setShowCampaignSetup(true);
      setHasCampaigns(false);
    } finally {
      setIsFetchingKeywords(false);
      setIsCheckingAccount(false);
    }
  }, [selectedDomain]);

  const handleFetchKeywords = useCallback(async () => {
    setIsFetchingKeywords(true);
    setHasCampaigns(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-keywords', {
        body: { action: 'get-keywords', accessToken: accessToken || 'demo-token', customerId: connectedCustomerId || 'demo-customer', domain: selectedDomain },
      });

      if (error) throw error;

      setKeywords(data.keywords || []);
      setSummary(data.summary || null);
      setHasCampaigns(data.hasCampaigns !== false);
      
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

  const handleCampaignSetupComplete = useCallback(() => {
    setShowCampaignSetup(false);
    setHasCampaigns(true);
    if (accessToken && connectedCustomerId) {
      handleFetchKeywordsWithToken(accessToken, connectedCustomerId);
    } else {
      handleFetchKeywords();
    }
  }, [accessToken, connectedCustomerId, handleFetchKeywordsWithToken, handleFetchKeywords]);

  const handleToggleKeyword = (keywordId: string) => {
    setSelectedKeywords(prev => {
      const next = new Set(prev);
      if (next.has(keywordId)) next.delete(keywordId);
      else next.add(keywordId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedKeywords.size === keywords.length) setSelectedKeywords(new Set());
    else setSelectedKeywords(new Set(keywords.map(k => k.id)));
  };

  const handleGeneratePages = useCallback(async () => {
    if (selectedKeywords.size === 0) { toast.error('Please select at least one keyword'); return; }
    setIsGenerating(true);

    try {
      const selectedKws = keywords.filter(k => selectedKeywords.has(k.id));
      const { data, error } = await supabase.functions.invoke('google-ads-keywords', {
        body: { action: 'generate-pages', keywords: selectedKws, domain: selectedDomain || 'example.com', options: { enableABTesting: true, enableHeatTracking: true } },
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

  const getQualityScoreColor = (score: number) => score >= 8 ? 'text-green-500' : score >= 6 ? 'text-amber-500' : 'text-red-500';
  const getQualityScoreBg = (score: number) => score >= 8 ? 'bg-green-500/20' : score >= 6 ? 'bg-amber-500/20' : 'bg-red-500/20';

  return (
    <div className="relative space-y-3 overflow-hidden min-h-[400px]">
      {/* VI Dashboard Effects - Full Background (matching VIDashboardEffects exactly) */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Corner gradient accents - large blobs */}
        <motion.div 
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-orange-500/15 via-amber-500/10 to-transparent rounded-bl-[250px]"
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-500/15 via-orange-500/8 to-transparent rounded-tr-[200px]"
          animate={{ 
            scale: [1.05, 1, 1.05],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        
        {/* Additional corner blobs for richness */}
        <motion.div 
          className="absolute -top-20 -left-20 w-[350px] h-[350px] bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent rounded-full blur-xl"
          animate={{ 
            x: [0, 30, 0],
            y: [0, 20, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -bottom-20 -right-20 w-[300px] h-[300px] bg-gradient-to-tl from-red-500/10 via-orange-500/5 to-transparent rounded-full blur-xl"
          animate={{ 
            x: [0, -20, 0],
            y: [0, -30, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        
        {/* Animated vertical scanning line */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent"
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Animated horizontal scanning line */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/3 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear', delay: 4 }}
        />
        
        {/* Floating particles - animated with framer-motion (exactly like VI dashboard) */}
        <motion.div
          className="absolute top-[10%] right-[8%] w-2 h-2 rounded-full bg-orange-400/70"
          animate={{ y: [0, -12, 0], opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-[20%] right-[15%] w-1.5 h-1.5 rounded-full bg-amber-400/70"
          animate={{ y: [0, -10, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
        />
        <motion.div
          className="absolute top-[15%] right-[25%] w-1 h-1 rounded-full bg-yellow-400/70"
          animate={{ y: [0, -8, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
        />
        <motion.div
          className="absolute top-[25%] left-[10%] w-1.5 h-1.5 rounded-full bg-orange-500/70"
          animate={{ y: [0, -6, 0], x: [0, 3, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-[20%] left-[15%] w-2 h-2 rounded-full bg-red-400/60"
          animate={{ y: [0, -15, 0], opacity: [0.4, 0.8, 0.4], scale: [1, 1.3, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute bottom-[30%] right-[12%] w-1.5 h-1.5 rounded-full bg-amber-400/60"
          animate={{ y: [0, -10, 0], x: [0, -5, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.8 }}
        />
        <motion.div
          className="absolute top-[40%] left-[5%] w-1 h-1 rounded-full bg-orange-300/50"
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
        />
        <motion.div
          className="absolute top-[60%] right-[5%] w-1.5 h-1.5 rounded-full bg-yellow-300/50"
          animate={{ y: [0, -12, 0], x: [0, 8, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: 2 }}
        />
        
        {/* Additional floating particles for PPC theme */}
        <motion.div
          className="absolute top-[5%] left-[40%] w-1 h-1 rounded-full bg-orange-500/60"
          animate={{ y: [0, -18, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[30%] w-2 h-2 rounded-full bg-amber-400/50"
          animate={{ y: [0, -14, 0], x: [0, 6, 0], opacity: [0.4, 0.8, 0.4], scale: [1, 1.15, 1] }}
          transition={{ duration: 3.8, repeat: Infinity, delay: 1.2 }}
        />
        <motion.div
          className="absolute top-[70%] left-[25%] w-1.5 h-1.5 rounded-full bg-yellow-300/50"
          animate={{ y: [0, -10, 0], opacity: [0.25, 0.6, 0.25] }}
          transition={{ duration: 4.2, repeat: Infinity, delay: 2.5 }}
        />
        <motion.div
          className="absolute top-[35%] right-[35%] w-1 h-1 rounded-full bg-red-300/40"
          animate={{ y: [0, -8, 0], x: [0, -4, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.8 }}
        />
        
        {/* Radial glow from top center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-radial from-orange-500/8 via-amber-500/3 to-transparent" />
        
        {/* Bottom radial glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-amber-500/5 via-orange-500/2 to-transparent" />
        
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60" />
        
        {/* Side vignettes */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background/50 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background/50 to-transparent" />
        
        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
      
      {/* Compact Header */}
      <header className="relative flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 border border-orange-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">PPC Landing Pages</h2>
            <p className="text-xs text-muted-foreground">Import keywords → Generate optimized pages → Boost Quality Score</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected && accessToken ? (
            <>
              <Badge variant="outline" className="text-orange-400 border-orange-500/30 bg-orange-500/10">
                <GoogleAdsIcon /><span className="ml-1.5">{isUnifiedAuth ? 'Connected' : `Account: ${connectedCustomerId}`}</span>
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleDisconnect} className="h-7 text-muted-foreground hover:text-destructive">
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-400">1,000+ CEOs</Badge>
              <Badge variant="outline" className="text-[10px] border-violet-500/30 bg-violet-500/10 text-violet-400">AI-Powered</Badge>
            </div>
          )}
        </div>
      </header>

      {/* Loading State */}
      {isCheckingAccount && accessToken ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center"><Target className="w-6 h-6 text-orange-500" /></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">Checking Google Ads Account</h3>
            <p className="text-sm text-muted-foreground">Looking for campaigns targeting {selectedDomain || 'your domain'}...</p>
          </div>
        </motion.div>
      ) : showCampaignSetup && accessToken ? (
        <GoogleAdsCampaignSetupWizard domain={selectedDomain || ''} customerId={connectedCustomerId || 'unified-auth'} accessToken={accessToken} onComplete={handleCampaignSetupComplete} onCancel={() => setShowCampaignSetup(false)} />
      ) : !accessToken ? (
        /* Google Ads Onboarding Wizard - Show by default when not connected */
        <GoogleAdsOnboardingWizard 
          domain={selectedDomain || ''} 
          onComplete={handleWizardComplete} 
          onSkip={handleSkipWizard} 
        />
      ) : (
        /* Connected State - Keywords Dashboard */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Summary Cards - Compact */}
          {summary && (
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-muted/30 border border-border">
                <p className="text-xl font-bold">{summary.totalKeywords}</p>
                <p className="text-[10px] text-muted-foreground">Active Keywords</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xl font-bold text-amber-400">{summary.avgQualityScore}/10</p>
                <p className="text-[10px] text-muted-foreground">Avg Quality Score</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border">
                <p className="text-xl font-bold">${summary.estimatedMonthlySpend}</p>
                <p className="text-[10px] text-muted-foreground">Est. Monthly Spend</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-xl font-bold text-green-400">${summary.potentialMonthlySavings}</p>
                <p className="text-[10px] text-muted-foreground">Potential Savings</p>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox checked={selectedKeywords.size === keywords.length && keywords.length > 0} onCheckedChange={handleSelectAll} />
              <span className="text-xs text-muted-foreground">{selectedKeywords.size} of {keywords.length} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleFetchKeywords} disabled={isFetchingKeywords} className="h-7 text-xs">
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingKeywords ? 'animate-spin' : ''}`} />
              </Button>
              <Button size="sm" onClick={handleGeneratePages} disabled={selectedKeywords.size === 0 || isGenerating} className="h-7 text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Zap className="w-3.5 h-3.5 mr-1" />Generate {selectedKeywords.size} Pages</>}
              </Button>
            </div>
          </div>

          {/* Keywords Table */}
          {isFetchingKeywords ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Importing keywords from Google Ads...</p>
            </div>
          ) : keywords.length > 0 ? (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-10 px-3 py-2"></th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Keyword</th>
                      <th className="text-center px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Match</th>
                      <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">CPC</th>
                      <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Impr</th>
                      <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Clicks</th>
                      <th className="text-center px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">QS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {keywords.map((kw) => (
                      <tr key={kw.id} className={`hover:bg-muted/30 transition-colors ${selectedKeywords.has(kw.id) ? 'bg-orange-500/5' : ''}`}>
                        <td className="px-3 py-2"><Checkbox checked={selectedKeywords.has(kw.id)} onCheckedChange={() => handleToggleKeyword(kw.id)} /></td>
                        <td className="px-3 py-2"><span className="font-medium text-xs">{kw.text}</span></td>
                        <td className="px-3 py-2 text-center"><Badge variant="outline" className="text-[9px]">{kw.matchType}</Badge></td>
                        <td className="px-3 py-2 text-right text-xs">${kw.avgCpc.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-xs text-muted-foreground">{kw.impressions.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-xs text-muted-foreground">{kw.clicks.toLocaleString()}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getQualityScoreBg(kw.qualityScore)} ${getQualityScoreColor(kw.qualityScore)}`}>{kw.qualityScore}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">No Active Campaigns Found</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                {selectedDomain ? <>No campaigns targeting <span className="font-medium text-primary">{selectedDomain}</span>.</> : <>No active campaigns in your account.</>}
              </p>
              <Button onClick={() => setShowCampaignSetup(true)} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                <Zap className="w-4 h-4 mr-2" />Create Campaign
              </Button>
            </div>
          )}

          {/* Generated Pages Preview */}
          {generatedPages.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-orange-500" />Generated Pages</h3>
              <div className="grid grid-cols-3 gap-3">
                {generatedPages.slice(0, 6).map((page) => (
                  <div key={page.keywordId} className="p-3 rounded-xl border border-border bg-card hover:border-orange-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="text-[9px] bg-orange-500/20 text-orange-400">{page.abVariants.length} Variants</Badge>
                      <Badge variant="outline" className="text-[9px] text-green-400 border-green-500/30">QS: {page.estimatedQualityScore}/10</Badge>
                    </div>
                    <p className="font-medium text-xs mb-2 truncate">{page.keyword}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />Heat</span>
                      <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />Analytics</span>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full mt-2 text-[10px] h-7">Preview <ExternalLink className="w-3 h-3 ml-1" /></Button>
                  </div>
                ))}
              </div>
              {generatedPages.length > 6 && <p className="text-center text-xs text-muted-foreground">+ {generatedPages.length - 6} more pages</p>}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default LandingPagesPanel;
