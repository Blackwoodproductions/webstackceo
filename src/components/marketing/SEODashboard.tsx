import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Search, Target, Users, BarChart3, 
  Globe, ArrowUpRight, ArrowDownRight, RefreshCw,
  Zap, ExternalLink, ChevronRight, ChevronDown,
  Activity, Loader2, AlertCircle, CheckCircle2, Eye, DollarSign,
  Hash, FileText, Sparkles, Shield, Clock, Gauge, 
  LineChart, PieChart, AlertTriangle, CheckCircle, XCircle,
  Smartphone, Monitor, Wifi, WifiOff, Code, Image,
  Layout, Type, Link2, FileWarning, Layers, Settings2,
  Lightbulb, Plus, X, Wand2, Brain, Flame, Snowflake
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { VIDashboardEffects } from '@/components/ui/vi-dashboard-effects';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SEODashboardProps {
  domain: string;
}

interface KeywordData {
  keyword: string;
  search_volume: number;
  cpc: number | null;
  competition: string;
  competition_index: number;
  monthly_searches: Array<{ month: number; year: number; search_volume: number }>;
}

interface OnPageCheckItem {
  url: string;
  meta: {
    title: string;
    description: string;
    h1: string[];
  };
  page_timing: {
    time_to_interactive: number;
    dom_complete: number;
    largest_contentful_paint: number;
  };
  onpage_score: number;
  checks: Record<string, boolean>;
  content_size: number;
  total_dom_size: number;
  internal_links_count: number;
  external_links_count: number;
  images_count: number;
  duplicate_title: boolean;
  duplicate_description: boolean;
  duplicate_content: boolean;
}

interface SERPItem {
  type: string;
  rank_group: number;
  title: string;
  description: string;
  url: string;
  domain: string;
}

// Format numbers nicely
const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatCurrency = (num: number | undefined | null): string => {
  if (num === undefined || num === null || num === 0) return '-';
  return `$${num.toFixed(2)}`;
};

const formatTime = (ms: number | undefined | null): string => {
  if (ms === undefined || ms === null) return '-';
  return `${(ms / 1000).toFixed(2)}s`;
};

// Animated gauge component
const AnimatedGauge = ({ value, max = 100, label, color, icon: Icon }: { 
  value: number; 
  max?: number; 
  label: string;
  color: string;
  icon: any;
}) => {
  const percentage = Math.min(100, (value / max) * 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative flex flex-col items-center">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted/20"
        />
        <motion.circle
          cx="64"
          cy="64"
          r="45"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Icon className="w-5 h-5 mb-1" style={{ color }} />
        <motion.span 
          className="text-2xl font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {Math.round(value)}
        </motion.span>
      </div>
      <span className="text-xs text-muted-foreground mt-2 text-center">{label}</span>
    </div>
  );
};

// SEO Score Ring
const SEOScoreRing = ({ score, issues }: { score: number; issues: { passed: number; warnings: number; errors: number } }) => {
  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getScoreColor = (s: number) => {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="relative">
      <svg className="w-40 h-40 transform -rotate-90">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle
          cx="80"
          cy="80"
          r="58"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          className="text-muted/10"
        />
        <motion.circle
          cx="80"
          cy="80"
          r="58"
          stroke="url(#scoreGradient)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-4xl font-bold bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 bg-clip-text text-transparent"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground">SEO Score</span>
      </div>
      
      {/* Issue indicators */}
      <div className="flex justify-center gap-3 mt-3">
        <div className="flex items-center gap-1 text-xs">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span className="text-green-500">{issues.passed}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span className="text-amber-500">{issues.warnings}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <XCircle className="w-3 h-3 text-red-500" />
          <span className="text-red-500">{issues.errors}</span>
        </div>
      </div>
    </div>
  );
};

// Keyword Trend Chart
const KeywordTrendMini = ({ data }: { data: Array<{ month: number; year: number; search_volume: number }> }) => {
  if (!data || data.length === 0) return <span className="text-muted-foreground">-</span>;
  
  const maxVolume = Math.max(...data.map(d => d.search_volume));
  const height = 24;
  const width = 80;
  
  const points = data.slice(0, 6).reverse().map((d, i) => {
    const x = (i / 5) * width;
    const y = height - (d.search_volume / maxVolume) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke="url(#trendGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// Competition badge
const CompetitionBadge = ({ level, index }: { level: string; index: number }) => {
  const colors = {
    LOW: 'bg-green-500/20 text-green-500 border-green-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    HIGH: 'bg-red-500/20 text-red-500 border-red-500/30',
  };
  
  return (
    <Badge variant="outline" className={`text-[10px] ${colors[level as keyof typeof colors] || colors.LOW}`}>
      {level} ({index})
    </Badge>
  );
};

// Check status indicator
const CheckStatus = ({ passed, label }: { passed: boolean; label: string }) => (
  <div className={`flex items-center gap-2 p-2 rounded-lg ${passed ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
    {passed ? (
      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
    )}
    <span className={`text-sm ${passed ? 'text-green-500' : 'text-red-500'}`}>{label}</span>
  </div>
);

export const SEODashboard = ({ domain }: SEODashboardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastDomain, setLastDomain] = useState<string | null>(null);
  
  // Data states
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [onpageData, setOnpageData] = useState<OnPageCheckItem | null>(null);
  const [serpData, setSerpData] = useState<{
    organic: SERPItem[];
    paa: any[];
    related: any[];
    aiOverview: string | null;
  } | null>(null);
  
  // Keyword Research states
  const [seedKeyword, setSeedKeyword] = useState('');
  const [seedKeywords, setSeedKeywords] = useState<string[]>([]);
  const [researchKeywords, setResearchKeywords] = useState<KeywordData[]>([]);
  const [isResearching, setIsResearching] = useState(false);
  const [researchHistory, setResearchHistory] = useState<string[]>([]);

  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  // Call DataForSEO API
  const callAPI = async (action: string, data: any) => {
    const { data: response, error } = await supabase.functions.invoke('dataforseo-api', {
      body: { action, data }
    });
    
    if (error) throw new Error(error.message);
    return response;
  };

  // Load all data
  const loadAllData = useCallback(async () => {
    if (!cleanDomain || isLoading) return;
    
    setIsLoading(true);
    setHasLoaded(true);
    setLastDomain(cleanDomain);
    toast.info(`Analyzing ${cleanDomain}...`);

    try {
      // 1. Load Keywords for Site
      setLoadingSection('keywords');
      const kwResponse = await callAPI('keywords_for_site', [{
        target: cleanDomain,
        location_code: 2840,
        language_code: 'en',
        limit: 50
      }]);
      
      if (kwResponse?.tasks?.[0]?.result) {
        setKeywords(kwResponse.tasks[0].result);
      }

      // 2. Load OnPage Instant Analysis
      setLoadingSection('technical');
      const onpageResponse = await callAPI('onpage_instant_pages', [{
        url: `https://${cleanDomain}`,
        enable_javascript: true
      }]);
      
      if (onpageResponse?.tasks?.[0]?.result?.[0]?.items?.[0]) {
        setOnpageData(onpageResponse.tasks[0].result[0].items[0]);
      }

      // 3. Load SERP data for brand keyword
      setLoadingSection('serp');
      const serpResponse = await callAPI('serp_google_organic', [{
        keyword: cleanDomain.split('.')[0],
        location_code: 2840,
        language_code: 'en'
      }]);
      
      if (serpResponse?.tasks?.[0]?.result?.[0]) {
        const result = serpResponse.tasks[0].result[0];
        const items = result.items || [];
        
        setSerpData({
          organic: items.filter((i: any) => i.type === 'organic').slice(0, 10),
          paa: items.filter((i: any) => i.type === 'people_also_ask'),
          related: items.filter((i: any) => i.type === 'related_searches'),
          aiOverview: items.find((i: any) => i.type === 'ai_overview')?.items?.[0]?.text || null
        });
      }

      toast.success('Analysis complete!');
    } catch (err) {
      console.error('[SEO Dashboard] Error:', err);
      toast.error('Failed to load some data');
    } finally {
      setIsLoading(false);
      setLoadingSection(null);
    }
  }, [cleanDomain, isLoading]);

  // Keyword Research function
  const runKeywordResearch = useCallback(async () => {
    if (seedKeywords.length === 0) {
      toast.error('Add at least one seed keyword');
      return;
    }
    
    setIsResearching(true);
    toast.info(`Researching ${seedKeywords.length} seed keyword(s)...`);
    
    try {
      const response = await callAPI('keywords_for_keywords', [{
        keywords: seedKeywords,
        location_code: 2840,
        language_code: 'en',
        limit: 100
      }]);
      
      if (response?.tasks?.[0]?.result) {
        setResearchKeywords(response.tasks[0].result);
        setResearchHistory(prev => [...new Set([...seedKeywords, ...prev])].slice(0, 10));
        toast.success(`Found ${response.tasks[0].result.length} keyword ideas!`);
      } else {
        toast.error('No keyword ideas found');
      }
    } catch (err) {
      console.error('[Keyword Research] Error:', err);
      toast.error('Failed to research keywords');
    } finally {
      setIsResearching(false);
    }
  }, [seedKeywords]);

  // Add seed keyword
  const addSeedKeyword = () => {
    const trimmed = seedKeyword.trim().toLowerCase();
    if (trimmed && !seedKeywords.includes(trimmed)) {
      setSeedKeywords(prev => [...prev, trimmed]);
      setSeedKeyword('');
    }
  };

  // Remove seed keyword
  const removeSeedKeyword = (kw: string) => {
    setSeedKeywords(prev => prev.filter(k => k !== kw));
  };

  // Reset when domain changes
  useEffect(() => {
    if (cleanDomain !== lastDomain) {
      setHasLoaded(false);
      setKeywords([]);
      setOnpageData(null);
      setSerpData(null);
      setResearchKeywords([]);
      setSeedKeywords([]);
    }
  }, [cleanDomain, lastDomain]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalSearchVolume = keywords.reduce((sum, k) => sum + (k.search_volume || 0), 0);
    const avgCPC = keywords.length > 0 
      ? keywords.reduce((sum, k) => sum + (k.cpc || 0), 0) / keywords.filter(k => k.cpc).length 
      : 0;
    const trafficValue = keywords.reduce((sum, k) => sum + ((k.search_volume || 0) * (k.cpc || 0) * 0.03), 0);
    
    // OnPage score calculation
    const checks = onpageData?.checks || {};
    const passedChecks = Object.values(checks).filter(v => v === true).length;
    const failedChecks = Object.values(checks).filter(v => v === false).length;
    const totalChecks = passedChecks + failedChecks;
    const seoScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    
    return {
      totalKeywords: keywords.length,
      totalSearchVolume,
      avgCPC: avgCPC || 0,
      trafficValue,
      seoScore,
      passedChecks,
      failedChecks,
      lcp: onpageData?.page_timing?.largest_contentful_paint || 0,
      tti: onpageData?.page_timing?.time_to_interactive || 0,
      domComplete: onpageData?.page_timing?.dom_complete || 0,
    };
  }, [keywords, onpageData]);

  // Check categories
  const checkCategories = useMemo(() => {
    if (!onpageData?.checks) return { content: [], technical: [], seo: [] };
    
    const checks = onpageData.checks;
    
    return {
      content: [
        { key: 'no_title', label: 'Has Title Tag', passed: !checks.no_title },
        { key: 'no_description', label: 'Has Meta Description', passed: !checks.no_description },
        { key: 'no_h1_tag', label: 'Has H1 Tag', passed: !checks.no_h1_tag },
        { key: 'low_content_rate', label: 'Content Rate OK', passed: !checks.low_content_rate },
        { key: 'low_readability_rate', label: 'Readability OK', passed: !checks.low_readability_rate },
        { key: 'lorem_ipsum', label: 'No Lorem Ipsum', passed: !checks.lorem_ipsum },
      ],
      technical: [
        { key: 'is_https', label: 'Uses HTTPS', passed: checks.is_https },
        { key: 'has_html_doctype', label: 'Has DOCTYPE', passed: checks.has_html_doctype },
        { key: 'no_encoding_meta_tag', label: 'Has Encoding', passed: !checks.no_encoding_meta_tag },
        { key: 'high_loading_time', label: 'Fast Loading', passed: !checks.high_loading_time },
        { key: 'no_favicon', label: 'Has Favicon', passed: !checks.no_favicon },
        { key: 'is_broken', label: 'Not Broken', passed: !checks.is_broken },
      ],
      seo: [
        { key: 'seo_friendly_url', label: 'SEO-Friendly URL', passed: checks.seo_friendly_url },
        { key: 'canonical', label: 'Has Canonical', passed: checks.canonical },
        { key: 'no_image_alt', label: 'Images Have Alt', passed: !checks.no_image_alt },
        { key: 'duplicate_title', label: 'No Duplicate Title', passed: !checks.duplicate_title_tag },
        { key: 'duplicate_meta_tags', label: 'No Duplicate Meta', passed: !checks.duplicate_meta_tags },
        { key: 'has_meta_refresh_redirect', label: 'No Meta Refresh', passed: !checks.has_meta_refresh_redirect },
      ]
    };
  }, [onpageData]);

  return (
    <div className="relative space-y-6 min-h-[600px]">
      {/* Background effects */}
      <VIDashboardEffects />
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <motion.div 
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-violet-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30"
            animate={{ 
              boxShadow: ['0 0 20px rgba(6,182,212,0.3)', '0 0 40px rgba(139,92,246,0.4)', '0 0 20px rgba(6,182,212,0.3)']
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <BarChart3 className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">
                SEO Intelligence
              </h2>
              <Badge variant="outline" className="text-cyan-500 border-cyan-500/30 bg-cyan-500/10 animate-pulse">
                <Sparkles className="w-3 h-3 mr-1" />
                DataForSEO
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {cleanDomain || 'Select a domain to analyze'}
            </p>
          </div>
        </div>
        
        <Button
          onClick={loadAllData}
          disabled={isLoading || !cleanDomain}
          size="lg"
          className="bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 hover:opacity-90 shadow-lg shadow-violet-500/30"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {loadingSection ? `Analyzing ${loadingSection}...` : 'Analyzing...'}
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Run Full Analysis
            </>
          )}
        </Button>
      </header>

      {/* No domain / Ready state */}
      {!hasLoaded && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="relative border-2 border-dashed border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5" />
            <CardContent className="relative py-16 text-center">
              <motion.div
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Search className="w-10 h-10 text-cyan-500" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">
                {cleanDomain ? 'Ready to Analyze' : 'Select a Domain'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {cleanDomain 
                  ? `Run a comprehensive SEO analysis on ${cleanDomain} including keyword research, technical audit, and SERP analysis.`
                  : 'Choose a domain from the selector above to begin your SEO intelligence analysis.'
                }
              </p>
              {cleanDomain && (
                <Button 
                  onClick={loadAllData} 
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 shadow-lg"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Analysis
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Dashboard */}
      {(hasLoaded || isLoading) && cleanDomain && (
        <>
          {/* Hero Metrics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* SEO Score Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-1"
            >
              <Card className="relative h-full border-cyan-500/20 bg-gradient-to-br from-card via-card to-cyan-500/5 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 via-violet-500/5 to-transparent rounded-bl-[80px]" />
                <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                  {isLoading && !onpageData ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
                      <span className="text-sm text-muted-foreground">Analyzing...</span>
                    </div>
                  ) : (
                    <SEOScoreRing 
                      score={metrics.seoScore} 
                      issues={{ 
                        passed: metrics.passedChecks, 
                        warnings: 0, 
                        errors: metrics.failedChecks 
                      }} 
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Performance Gauges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3"
            >
              <Card className="relative h-full border-violet-500/20 bg-gradient-to-br from-card via-card to-violet-500/5 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4 text-violet-500" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading && !onpageData ? (
                    <div className="h-40 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <AnimatedGauge 
                        value={Math.min(100, (metrics.lcp / 4000) * 100)} 
                        label="LCP" 
                        color={metrics.lcp < 2500 ? '#22c55e' : metrics.lcp < 4000 ? '#eab308' : '#ef4444'}
                        icon={Clock}
                      />
                      <AnimatedGauge 
                        value={Math.min(100, (metrics.tti / 5000) * 100)} 
                        label="TTI" 
                        color={metrics.tti < 3800 ? '#22c55e' : metrics.tti < 7300 ? '#eab308' : '#ef4444'}
                        icon={Zap}
                      />
                      <AnimatedGauge 
                        value={metrics.totalKeywords} 
                        max={100}
                        label="Keywords" 
                        color="#8b5cf6"
                        icon={Hash}
                      />
                      <AnimatedGauge 
                        value={metrics.totalSearchVolume / 100} 
                        max={100}
                        label="Search Vol." 
                        color="#06b6d4"
                        icon={TrendingUp}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { 
                label: 'Keywords Found', 
                value: formatNumber(metrics.totalKeywords), 
                icon: Hash, 
                color: 'cyan',
                gradient: 'from-cyan-500/10 to-blue-500/5',
                border: 'border-cyan-500/20'
              },
              { 
                label: 'Total Volume', 
                value: formatNumber(metrics.totalSearchVolume), 
                icon: TrendingUp, 
                color: 'violet',
                gradient: 'from-violet-500/10 to-purple-500/5',
                border: 'border-violet-500/20'
              },
              { 
                label: 'Avg. CPC', 
                value: formatCurrency(metrics.avgCPC), 
                icon: DollarSign, 
                color: 'emerald',
                gradient: 'from-emerald-500/10 to-green-500/5',
                border: 'border-emerald-500/20'
              },
              { 
                label: 'Traffic Value', 
                value: formatCurrency(metrics.trafficValue), 
                icon: Sparkles, 
                color: 'amber',
                gradient: 'from-amber-500/10 to-orange-500/5',
                border: 'border-amber-500/20'
              },
              { 
                label: 'Internal Links', 
                value: formatNumber(onpageData?.internal_links_count || 0), 
                icon: Link2, 
                color: 'blue',
                gradient: 'from-blue-500/10 to-indigo-500/5',
                border: 'border-blue-500/20'
              },
              { 
                label: 'Images', 
                value: formatNumber(onpageData?.images_count || 0), 
                icon: Image, 
                color: 'pink',
                gradient: 'from-pink-500/10 to-rose-500/5',
                border: 'border-pink-500/20'
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className={`relative p-4 rounded-xl bg-gradient-to-br ${stat.gradient} border ${stat.border} overflow-hidden group hover:scale-[1.02] transition-transform`}
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-[40px]" />
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center`}>
                    <stat.icon className={`w-4 h-4 text-${stat.color}-500`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                {isLoading ? (
                  <div className="h-8 bg-muted/50 rounded animate-pulse" />
                ) : (
                  <p className={`text-2xl font-bold text-${stat.color}-500`}>{stat.value}</p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="relative z-10">
            <TabsList className="w-full justify-start bg-card/50 backdrop-blur-sm border border-border/50 p-1 h-auto flex-wrap gap-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-violet-500/20 data-[state=active]:text-cyan-500">
                <Layers className="w-4 h-4 mr-1.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="keywords" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-500">
                <Hash className="w-4 h-4 mr-1.5" /> Keywords ({keywords.length})
              </TabsTrigger>
              <TabsTrigger value="technical" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-500">
                <Settings2 className="w-4 h-4 mr-1.5" /> Technical SEO
              </TabsTrigger>
              <TabsTrigger value="serp" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-500">
                <Search className="w-4 h-4 mr-1.5" /> SERP Analysis
              </TabsTrigger>
              <TabsTrigger value="research" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:text-amber-500">
                <Lightbulb className="w-4 h-4 mr-1.5" /> Keyword Research
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Top Keywords */}
                <Card className="border-emerald-500/20 bg-gradient-to-br from-card to-emerald-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Hash className="w-4 h-4 text-emerald-500" />
                      Top Keywords by Volume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading && !keywords.length ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : keywords.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No keywords found</p>
                    ) : (
                      <div className="space-y-2">
                        {keywords.slice(0, 5).map((kw, i) => (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <span className="text-sm truncate flex-1">{kw.keyword}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <KeywordTrendMini data={kw.monthly_searches} />
                              <Badge variant="outline" className="text-[10px]">
                                {formatNumber(kw.search_volume)}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                        <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setActiveTab('keywords')}>
                          View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Technical Checks Summary */}
                <Card className="border-violet-500/20 bg-gradient-to-br from-card to-violet-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-violet-500" />
                      Technical Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading && !onpageData ? (
                      <div className="space-y-2">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : !onpageData ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No data</p>
                    ) : (
                      <div className="space-y-2">
                        {checkCategories.technical.slice(0, 6).map((check, i) => (
                          <motion.div
                            key={check.key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <CheckStatus passed={check.passed} label={check.label} />
                          </motion.div>
                        ))}
                        <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setActiveTab('technical')}>
                          View Full Audit <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* SERP Features */}
                <Card className="border-blue-500/20 bg-gradient-to-br from-card to-blue-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Search className="w-4 h-4 text-blue-500" />
                      SERP Features Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading && !serpData ? (
                      <div className="space-y-2">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : !serpData ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No SERP data</p>
                    ) : (
                      <div className="space-y-3">
                        {serpData.aiOverview && (
                          <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="w-4 h-4 text-cyan-500" />
                              <span className="text-xs font-medium text-cyan-500">AI Overview</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {serpData.aiOverview.slice(0, 100)}...
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <span className="text-sm">Organic Results</span>
                          <Badge variant="outline">{serpData.organic.length}</Badge>
                        </div>
                        
                        {serpData.paa.length > 0 && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <span className="text-sm">People Also Ask</span>
                            <Badge variant="outline">{serpData.paa.length}</Badge>
                          </div>
                        )}
                        
                        {serpData.related.length > 0 && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <span className="text-sm">Related Searches</span>
                            <Badge variant="outline">{serpData.related.length}</Badge>
                          </div>
                        )}
                        
                        <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setActiveTab('serp')}>
                          View SERP <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Keywords Tab */}
            <TabsContent value="keywords" className="mt-6">
              <Card className="border-emerald-500/20 overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-emerald-500/5 to-transparent">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Hash className="w-4 h-4 text-emerald-500" />
                    Keyword Opportunities ({keywords.length} found)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[600px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Keyword</TableHead>
                          <TableHead className="text-right">Volume</TableHead>
                          <TableHead className="text-center">Trend</TableHead>
                          <TableHead className="text-center">Competition</TableHead>
                          <TableHead className="text-right">CPC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keywords.map((kw, i) => (
                          <TableRow key={i} className="hover:bg-emerald-500/5 group">
                            <TableCell className="font-medium max-w-[300px] truncate">
                              {kw.keyword}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium text-emerald-500">{formatNumber(kw.search_volume)}</span>
                              <span className="text-xs text-muted-foreground">/mo</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <KeywordTrendMini data={kw.monthly_searches} />
                            </TableCell>
                            <TableCell className="text-center">
                              <CompetitionBadge level={kw.competition} index={kw.competition_index} />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(kw.cpc)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {keywords.length === 0 && !isLoading && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              No keyword data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Technical SEO Tab */}
            <TabsContent value="technical" className="mt-6 space-y-6">
              {/* Page Info */}
              {onpageData && (
                <Card className="border-violet-500/20 bg-gradient-to-br from-card to-violet-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-violet-500" />
                      Page Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <span className="text-xs text-muted-foreground">Title</span>
                        <p className="text-sm font-medium truncate">{onpageData.meta?.title || 'No title'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <span className="text-xs text-muted-foreground">Description</span>
                        <p className="text-sm truncate">{onpageData.meta?.description || 'No description'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-muted/20 text-center">
                        <span className="text-2xl font-bold text-violet-500">{formatNumber(onpageData.content_size)}</span>
                        <p className="text-xs text-muted-foreground">Content Size</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/20 text-center">
                        <span className="text-2xl font-bold text-cyan-500">{formatNumber(onpageData.total_dom_size)}</span>
                        <p className="text-xs text-muted-foreground">DOM Size</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/20 text-center">
                        <span className="text-2xl font-bold text-blue-500">{onpageData.internal_links_count}</span>
                        <p className="text-xs text-muted-foreground">Internal Links</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/20 text-center">
                        <span className="text-2xl font-bold text-emerald-500">{onpageData.external_links_count}</span>
                        <p className="text-xs text-muted-foreground">External Links</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Check Categories */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Content Checks */}
                <Card className="border-emerald-500/20">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Type className="w-4 h-4 text-emerald-500" />
                      Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2">
                    {checkCategories.content.map((check, i) => (
                      <CheckStatus key={check.key} passed={check.passed} label={check.label} />
                    ))}
                  </CardContent>
                </Card>

                {/* Technical Checks */}
                <Card className="border-violet-500/20">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code className="w-4 h-4 text-violet-500" />
                      Technical
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2">
                    {checkCategories.technical.map((check, i) => (
                      <CheckStatus key={check.key} passed={check.passed} label={check.label} />
                    ))}
                  </CardContent>
                </Card>

                {/* SEO Checks */}
                <Card className="border-blue-500/20">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Search className="w-4 h-4 text-blue-500" />
                      SEO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2">
                    {checkCategories.seo.map((check, i) => (
                      <CheckStatus key={check.key} passed={check.passed} label={check.label} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SERP Tab */}
            <TabsContent value="serp" className="mt-6 space-y-6">
              {/* AI Overview */}
              {serpData?.aiOverview && (
                <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-500" />
                      AI Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {serpData.aiOverview}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Organic Results */}
              <Card className="border-blue-500/20">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-500" />
                    Organic Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Domain</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serpData?.organic.map((item, i) => (
                          <TableRow key={i} className="hover:bg-blue-500/5">
                            <TableCell className="font-bold text-blue-500">{item.rank_group}</TableCell>
                            <TableCell className="max-w-[300px]">
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-blue-500 hover:underline flex items-center gap-1 truncate">
                                {item.title}
                                <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                              </a>
                              <p className="text-xs text-muted-foreground truncate">{item.description?.slice(0, 100)}...</p>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{item.domain}</TableCell>
                          </TableRow>
                        ))}
                        {(!serpData?.organic || serpData.organic.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              No organic results found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* People Also Ask & Related */}
              <div className="grid md:grid-cols-2 gap-6">
                {serpData?.paa && serpData.paa.length > 0 && (
                  <Card className="border-amber-500/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        People Also Ask
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {serpData.paa.slice(0, 4).map((item: any, i: number) => (
                        <div key={i} className="p-2 rounded-lg bg-muted/30 text-sm">
                          {item.title || item.items?.[0]?.title || 'Question'}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                
                {serpData?.related && serpData.related.length > 0 && (
                  <Card className="border-pink-500/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="w-4 h-4 text-pink-500" />
                        Related Searches
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {serpData.related[0]?.items?.slice(0, 8).map((item: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {item.title}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Keyword Research Tab */}
            <TabsContent value="research" className="mt-6 space-y-6">
              {/* Research Input Section */}
              <Card className="border-amber-500/20 bg-gradient-to-br from-card via-card to-amber-500/5 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-amber-500" />
                    Keyword Research Tool
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Enter a seed keyword (e.g., 'seo tools')"
                        value={seedKeyword}
                        onChange={(e) => setSeedKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSeedKeyword()}
                        className="pr-10 bg-muted/30 border-amber-500/20 focus:border-amber-500"
                      />
                      {seedKeyword && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-amber-500"
                          onClick={addSeedKeyword}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={runKeywordResearch}
                      disabled={isResearching || seedKeywords.length === 0}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90"
                    >
                      {isResearching ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Researching...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Find Keywords
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Seed Keywords Tags */}
                  {seedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {seedKeywords.map((kw, i) => (
                        <motion.div
                          key={kw}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <Badge 
                            variant="outline" 
                            className="bg-amber-500/10 border-amber-500/30 text-amber-500 pl-2 pr-1 py-1"
                          >
                            {kw}
                            <button
                              onClick={() => removeSeedKeyword(kw)}
                              className="ml-1.5 hover:bg-amber-500/20 rounded p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">Quick add:</span>
                    {[cleanDomain?.split('.')[0], 'best', 'how to', 'vs', 'review'].filter(Boolean).map((suggestion) => (
                      <Badge
                        key={suggestion}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted/50 text-xs"
                        onClick={() => {
                          if (!seedKeywords.includes(suggestion!)) {
                            setSeedKeywords(prev => [...prev, suggestion!]);
                          }
                        }}
                      >
                        + {suggestion}
                      </Badge>
                    ))}
                  </div>

                  {/* Research History */}
                  {researchHistory.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">Recent searches:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {researchHistory.slice(0, 5).map((kw) => (
                          <Badge
                            key={kw}
                            variant="secondary"
                            className="cursor-pointer text-xs opacity-70 hover:opacity-100"
                            onClick={() => {
                              if (!seedKeywords.includes(kw)) {
                                setSeedKeywords(prev => [...prev, kw]);
                              }
                            }}
                          >
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Research Results */}
              {researchKeywords.length > 0 && (
                <Card className="border-amber-500/20 overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-gradient-to-r from-amber-500/5 to-transparent">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        Keyword Ideas ({researchKeywords.length})
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                          <Snowflake className="w-3 h-3 mr-1" />
                          Low Comp: {researchKeywords.filter(k => k.competition === 'LOW').length}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/20">
                          <Flame className="w-3 h-3 mr-1" />
                          High Vol: {researchKeywords.filter(k => k.search_volume >= 1000).length}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[500px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Keyword</TableHead>
                            <TableHead className="text-right">Volume</TableHead>
                            <TableHead className="text-center">Trend</TableHead>
                            <TableHead className="text-center">Competition</TableHead>
                            <TableHead className="text-right">CPC</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {researchKeywords.map((kw, i) => {
                            const potentialValue = (kw.search_volume || 0) * (kw.cpc || 0) * 0.03;
                            return (
                              <motion.tr
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className="hover:bg-amber-500/5 group"
                              >
                                <TableCell className="font-medium max-w-[300px]">
                                  <div className="flex items-center gap-2">
                                    {kw.competition === 'LOW' && kw.search_volume >= 100 && (
                                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                                    )}
                                    <span className="truncate">{kw.keyword}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="font-medium text-amber-500">{formatNumber(kw.search_volume)}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <KeywordTrendMini data={kw.monthly_searches} />
                                </TableCell>
                                <TableCell className="text-center">
                                  <CompetitionBadge level={kw.competition} index={kw.competition_index} />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(kw.cpc)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="text-xs text-muted-foreground">
                                    {formatCurrency(potentialValue)}
                                  </span>
                                </TableCell>
                              </motion.tr>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {researchKeywords.length === 0 && !isResearching && (
                <Card className="border-dashed border-2 border-amber-500/20 bg-amber-500/5">
                  <CardContent className="py-12 text-center">
                    <motion.div
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Lightbulb className="w-8 h-8 text-amber-500" />
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-2 text-amber-500">Discover Keyword Opportunities</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Enter seed keywords above to find related keyword ideas with search volume, 
                      CPC, and competition data. Great for content planning and PPC campaigns.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default SEODashboard;
