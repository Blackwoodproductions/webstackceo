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
  Lightbulb, Plus, X, Wand2, Brain, Flame, Snowflake,
  Radar, CircleDot, Network, Award, TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  meta: { title: string; description: string; h1: string[] };
  page_timing: { time_to_interactive: number; dom_complete: number; largest_contentful_paint: number };
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

// Elegant Score Ring with glassmorphism
const ScoreRing = ({ 
  value, 
  max = 100, 
  label, 
  color,
  size = 120
}: { 
  value: number; 
  max?: number; 
  label: string;
  color: string;
  size?: number;
}) => {
  const percentage = Math.min(100, (value / max) * 100);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
        <defs>
          <linearGradient id={`ring-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id="glow-ring">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth="8" fill="none" className="text-white/5" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#ring-${label})`}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          filter="url(#glow-ring)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-3xl font-bold"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          {Math.round(value)}
        </motion.span>
        <span className="text-[10px] text-muted-foreground/80">{label}</span>
      </div>
    </div>
  );
};

// Compact Metric Card
const MetricCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  color,
  trend,
  isLoading
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  subValue?: string;
  color: string;
  trend?: 'up' | 'down' | null;
  isLoading?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative p-4 rounded-xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] overflow-hidden group hover:bg-white/[0.04] transition-all hover:border-white/10"
  >
    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(135deg, ${color}08 0%, transparent 60%)` }} />
    <div className="relative flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        {isLoading ? (
          <div className="h-7 w-16 bg-white/5 rounded animate-pulse" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold" style={{ color }}>{value}</span>
            {subValue && <span className="text-[10px] text-muted-foreground">{subValue}</span>}
          </div>
        )}
      </div>
      {trend && (
        <div className={`flex items-center gap-0.5 text-[10px] ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        </div>
      )}
    </div>
  </motion.div>
);

// Performance Dial
const PerformanceDial = ({ value, label, unit, thresholds }: { value: number; label: string; unit: string; thresholds: { good: number; warn: number } }) => {
  const getColor = () => {
    if (value <= thresholds.good) return '#22c55e';
    if (value <= thresholds.warn) return '#eab308';
    return '#ef4444';
  };
  const percentage = Math.min(100, (value / (thresholds.warn * 1.5)) * 100);
  
  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
      <div className="relative w-16 h-8 mb-1">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path d="M 5 45 A 40 40 0 0 1 95 45" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" strokeLinecap="round" />
          <motion.path 
            d="M 5 45 A 40 40 0 0 1 95 45" 
            fill="none" 
            stroke={getColor()} 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray="141"
            initial={{ strokeDashoffset: 141 }}
            animate={{ strokeDashoffset: 141 - (percentage / 100) * 141 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          <span className="text-sm font-bold" style={{ color: getColor() }}>{value.toFixed(1)}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-[9px] text-muted-foreground/60">{unit}</span>
    </div>
  );
};

// Check Status Row
const CheckRow = ({ passed, label }: { passed: boolean; label: string }) => (
  <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${passed ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
    {passed ? <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" /> : <XCircle className="w-3 h-3 text-rose-400 shrink-0" />}
    <span className={`text-xs ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>{label}</span>
  </div>
);

// Mini Trend Sparkline
const Sparkline = ({ data, color = '#06b6d4' }: { data: number[]; color?: string }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 60;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#spark-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

// Competition Pill
const CompPill = ({ level }: { level: string }) => {
  const cfg = {
    LOW: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    MEDIUM: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    HIGH: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  };
  const c = cfg[level as keyof typeof cfg] || cfg.LOW;
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${c.bg} ${c.text} border ${c.border}`}>{level}</span>;
};

export const SEODashboard = ({ domain }: SEODashboardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [lastDomain, setLastDomain] = useState<string | null>(null);
  
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [onpageData, setOnpageData] = useState<OnPageCheckItem | null>(null);
  const [serpData, setSerpData] = useState<{ organic: SERPItem[]; paa: any[]; related: any[]; aiOverview: string | null } | null>(null);
  
  const [seedKeyword, setSeedKeyword] = useState('');
  const [seedKeywords, setSeedKeywords] = useState<string[]>([]);
  const [researchKeywords, setResearchKeywords] = useState<KeywordData[]>([]);
  const [isResearching, setIsResearching] = useState(false);

  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  const callAPI = async (action: string, data: any) => {
    const { data: response, error } = await supabase.functions.invoke('dataforseo-api', { body: { action, data } });
    if (error) throw new Error(error.message);
    return response;
  };

  const loadAllData = useCallback(async () => {
    if (!cleanDomain || isLoading) return;
    setIsLoading(true);
    setHasLoaded(true);
    setLastDomain(cleanDomain);
    toast.info(`Analyzing ${cleanDomain}...`);

    try {
      setLoadingSection('keywords');
      const kwResponse = await callAPI('keywords_for_site', [{ target: cleanDomain, location_code: 2840, language_code: 'en', limit: 50 }]);
      if (kwResponse?.tasks?.[0]?.result) setKeywords(kwResponse.tasks[0].result);

      setLoadingSection('technical');
      const onpageResponse = await callAPI('onpage_instant_pages', [{ url: `https://${cleanDomain}`, enable_javascript: true }]);
      if (onpageResponse?.tasks?.[0]?.result?.[0]?.items?.[0]) setOnpageData(onpageResponse.tasks[0].result[0].items[0]);

      setLoadingSection('serp');
      const serpResponse = await callAPI('serp_google_organic', [{ keyword: cleanDomain.split('.')[0], location_code: 2840, language_code: 'en' }]);
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

  const runKeywordResearch = useCallback(async () => {
    if (seedKeywords.length === 0) { toast.error('Add at least one seed keyword'); return; }
    setIsResearching(true);
    try {
      const response = await callAPI('keywords_for_keywords', [{ keywords: seedKeywords, location_code: 2840, language_code: 'en', limit: 100 }]);
      if (response?.tasks?.[0]?.result) {
        setResearchKeywords(response.tasks[0].result);
        toast.success(`Found ${response.tasks[0].result.length} keyword ideas!`);
      }
    } catch (err) { toast.error('Failed to research keywords'); }
    finally { setIsResearching(false); }
  }, [seedKeywords]);

  const addSeedKeyword = () => {
    const trimmed = seedKeyword.trim().toLowerCase();
    if (trimmed && !seedKeywords.includes(trimmed)) { setSeedKeywords(prev => [...prev, trimmed]); setSeedKeyword(''); }
  };

  useEffect(() => {
    if (cleanDomain !== lastDomain) { setHasLoaded(false); setKeywords([]); setOnpageData(null); setSerpData(null); setResearchKeywords([]); setSeedKeywords([]); }
  }, [cleanDomain, lastDomain]);

  const metrics = useMemo(() => {
    const totalSearchVolume = keywords.reduce((sum, k) => sum + (k.search_volume || 0), 0);
    const avgCPC = keywords.length > 0 ? keywords.reduce((sum, k) => sum + (k.cpc || 0), 0) / keywords.filter(k => k.cpc).length : 0;
    const trafficValue = keywords.reduce((sum, k) => sum + ((k.search_volume || 0) * (k.cpc || 0) * 0.03), 0);
    const checks = onpageData?.checks || {};
    const passedChecks = Object.values(checks).filter(v => v === true).length;
    const failedChecks = Object.values(checks).filter(v => v === false).length;
    const totalChecks = passedChecks + failedChecks;
    const seoScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    return {
      totalKeywords: keywords.length, totalSearchVolume, avgCPC: avgCPC || 0, trafficValue, seoScore, passedChecks, failedChecks,
      lcp: (onpageData?.page_timing?.largest_contentful_paint || 0) / 1000,
      tti: (onpageData?.page_timing?.time_to_interactive || 0) / 1000,
      dom: (onpageData?.page_timing?.dom_complete || 0) / 1000,
    };
  }, [keywords, onpageData]);

  const checkCategories = useMemo(() => {
    if (!onpageData?.checks) return { content: [], technical: [], seo: [] };
    const c = onpageData.checks;
    return {
      content: [{ key: 'title', label: 'Title Tag', passed: !c.no_title }, { key: 'desc', label: 'Meta Description', passed: !c.no_description }, { key: 'h1', label: 'H1 Tag', passed: !c.no_h1_tag }],
      technical: [{ key: 'https', label: 'HTTPS', passed: c.is_https }, { key: 'load', label: 'Fast Loading', passed: !c.high_loading_time }, { key: 'favicon', label: 'Favicon', passed: !c.no_favicon }],
      seo: [{ key: 'url', label: 'SEO URL', passed: c.seo_friendly_url }, { key: 'canonical', label: 'Canonical', passed: c.canonical }, { key: 'alt', label: 'Image Alts', passed: !c.no_image_alt }]
    };
  }, [onpageData]);

  const topKeywords = useMemo(() => [...keywords].sort((a, b) => b.search_volume - a.search_volume).slice(0, 6), [keywords]);
  const opportunities = useMemo(() => keywords.filter(k => k.competition === 'LOW' && k.search_volume >= 100).slice(0, 5), [keywords]);

  return (
    <div className="relative space-y-6 min-h-[600px]">
      <VIDashboardEffects />
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <motion.div 
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30"
            animate={{ boxShadow: ['0 8px 30px rgba(139,92,246,0.25)', '0 8px 40px rgba(6,182,212,0.35)', '0 8px 30px rgba(139,92,246,0.25)'] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <BarChart3 className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              SEO Intelligence
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              {cleanDomain || 'Select a domain'}
            </p>
          </div>
        </div>
        
        <Button onClick={loadAllData} disabled={isLoading || !cleanDomain} className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 shadow-lg shadow-cyan-500/20">
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{loadingSection || 'Analyzing'}...</> : <><Zap className="w-4 h-4 mr-2" />Analyze</>}
        </Button>
      </header>

      {/* Empty State */}
      {!hasLoaded && !isLoading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border border-dashed border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5 backdrop-blur-sm">
            <CardContent className="py-16 text-center">
              <motion.div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                <Radar className="w-8 h-8 text-cyan-400" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-1">{cleanDomain ? 'Ready to Analyze' : 'Select a Domain'}</h3>
              <p className="text-sm text-muted-foreground mb-4">{cleanDomain ? `Comprehensive SEO analysis for ${cleanDomain}` : 'Choose a domain from the selector above'}</p>
              {cleanDomain && <Button onClick={loadAllData} className="bg-gradient-to-r from-cyan-500 to-violet-500"><Zap className="w-4 h-4 mr-2" />Start Analysis</Button>}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Dashboard Grid */}
      {(hasLoaded || isLoading) && cleanDomain && (
        <div className="space-y-4">
          {/* Row 1: Score + Performance + Quick Stats */}
          <div className="grid grid-cols-12 gap-4">
            {/* SEO Score Ring */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="col-span-12 sm:col-span-6 lg:col-span-3">
              <Card className="h-full border-white/[0.05] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
                  {isLoading && !onpageData ? (
                    <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
                  ) : (
                    <>
                      <ScoreRing value={metrics.seoScore} label="SEO Score" color={metrics.seoScore >= 75 ? '#22c55e' : metrics.seoScore >= 50 ? '#eab308' : '#ef4444'} />
                      <div className="flex gap-4 mt-3 text-[11px]">
                        <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3 h-3" />{metrics.passedChecks} passed</span>
                        <span className="flex items-center gap-1 text-rose-400"><XCircle className="w-3 h-3" />{metrics.failedChecks} failed</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Core Web Vitals */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="col-span-12 sm:col-span-6 lg:col-span-4">
              <Card className="h-full border-white/[0.05] bg-white/[0.02] backdrop-blur-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Gauge className="w-4 h-4 text-violet-400" />Core Web Vitals
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {isLoading && !onpageData ? (
                    <div className="h-24 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <PerformanceDial value={metrics.lcp} label="LCP" unit="sec" thresholds={{ good: 2.5, warn: 4 }} />
                      <PerformanceDial value={metrics.tti} label="TTI" unit="sec" thresholds={{ good: 3.8, warn: 7.3 }} />
                      <PerformanceDial value={metrics.dom} label="DOM" unit="sec" thresholds={{ good: 3, warn: 6 }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Metrics */}
            <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="col-span-12 lg:col-span-5">
              <div className="grid grid-cols-2 gap-3 h-full">
                <MetricCard icon={Hash} label="Keywords" value={metrics.totalKeywords} color="#06b6d4" isLoading={isLoading && !keywords.length} />
                <MetricCard icon={TrendingUp} label="Search Volume" value={formatNumber(metrics.totalSearchVolume)} color="#8b5cf6" isLoading={isLoading && !keywords.length} />
                <MetricCard icon={DollarSign} label="Avg CPC" value={formatCurrency(metrics.avgCPC)} color="#22c55e" isLoading={isLoading && !keywords.length} />
                <MetricCard icon={Sparkles} label="Traffic Value" value={formatCurrency(metrics.trafficValue)} subValue="/mo" color="#f59e0b" isLoading={isLoading && !keywords.length} />
              </div>
            </motion.div>
          </div>

          {/* Row 2: Keywords + Checks */}
          <div className="grid grid-cols-12 gap-4">
            {/* Top Keywords */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="col-span-12 lg:col-span-5">
              <Card className="h-full border-white/[0.05] bg-white/[0.02] backdrop-blur-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Search className="w-4 h-4 text-emerald-400" />Top Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {topKeywords.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 text-center py-6">No keywords found</p>
                  ) : (
                    <div className="space-y-2">
                      {topKeywords.map((kw, i) => (
                        <motion.div key={kw.keyword} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] text-muted-foreground/50 w-4">{i + 1}</span>
                            <span className="text-sm truncate">{kw.keyword}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-cyan-400 font-medium">{formatNumber(kw.search_volume)}</span>
                            <CompPill level={kw.competition} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* SEO Checks */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="col-span-12 lg:col-span-4">
              <Card className="h-full border-white/[0.05] bg-white/[0.02] backdrop-blur-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Shield className="w-4 h-4 text-amber-400" />Technical Audit
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {!onpageData ? (
                    <p className="text-sm text-muted-foreground/60 text-center py-6">Run analysis to see checks</p>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Content</span>
                        <div className="grid grid-cols-3 gap-1 mt-1">{checkCategories.content.map(c => <CheckRow key={c.key} passed={c.passed} label={c.label} />)}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Technical</span>
                        <div className="grid grid-cols-3 gap-1 mt-1">{checkCategories.technical.map(c => <CheckRow key={c.key} passed={c.passed} label={c.label} />)}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">SEO</span>
                        <div className="grid grid-cols-3 gap-1 mt-1">{checkCategories.seo.map(c => <CheckRow key={c.key} passed={c.passed} label={c.label} />)}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Wins */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="col-span-12 lg:col-span-3">
              <Card className="h-full border-white/[0.05] bg-white/[0.02] backdrop-blur-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Lightbulb className="w-4 h-4 text-amber-400" />Quick Wins
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {opportunities.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 text-center py-6">No opportunities</p>
                  ) : (
                    <div className="space-y-2">
                      {opportunities.map((kw, i) => (
                        <motion.div key={kw.keyword} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                          <p className="text-xs truncate mb-1">{kw.keyword}</p>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-amber-400">{formatNumber(kw.search_volume)} vol</span>
                            <span className="text-emerald-400">Low comp</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Row 3: SERP Features + Keyword Research */}
          <div className="grid grid-cols-12 gap-4">
            {/* SERP Overview */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="col-span-12 lg:col-span-6">
              <Card className="border-white/[0.05] bg-white/[0.02] backdrop-blur-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Globe className="w-4 h-4 text-cyan-400" />SERP Features
                    {serpData?.aiOverview && <Badge className="ml-auto bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]"><Brain className="w-3 h-3 mr-1" />AI Overview</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {!serpData ? (
                    <p className="text-sm text-muted-foreground/60 text-center py-6">Run analysis to see SERP data</p>
                  ) : (
                    <div className="space-y-3">
                      {serpData.aiOverview && (
                        <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                          <p className="text-xs text-muted-foreground line-clamp-3">{serpData.aiOverview}</p>
                        </div>
                      )}
                      <div className="flex gap-3 flex-wrap">
                        <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30">{serpData.organic.length} Organic</Badge>
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">{serpData.paa.length} PAA</Badge>
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">{serpData.related.length} Related</Badge>
                      </div>
                      {serpData.organic.slice(0, 3).map((item, i) => (
                        <div key={i} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-cyan-400 font-medium">#{item.rank_group}</span>
                            <span className="text-xs truncate">{item.title}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground/60 truncate">{item.url}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Keyword Research Tool */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="col-span-12 lg:col-span-6">
              <Card className="border-white/[0.05] bg-white/[0.02] backdrop-blur-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Wand2 className="w-4 h-4 text-fuchsia-400" />Keyword Research
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex gap-2 mb-3">
                    <Input value={seedKeyword} onChange={e => setSeedKeyword(e.target.value)} placeholder="Enter seed keyword..." className="h-9 bg-white/[0.02] border-white/[0.05] text-sm" onKeyDown={e => e.key === 'Enter' && addSeedKeyword()} />
                    <Button onClick={addSeedKeyword} size="sm" variant="outline" className="shrink-0 border-white/[0.1]"><Plus className="w-4 h-4" /></Button>
                  </div>
                  {seedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {seedKeywords.map(kw => (
                        <Badge key={kw} variant="secondary" className="bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20 text-xs">
                          {kw}
                          <button onClick={() => setSeedKeywords(prev => prev.filter(k => k !== kw))} className="ml-1.5 hover:text-fuchsia-300"><X className="w-3 h-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button onClick={runKeywordResearch} disabled={isResearching || seedKeywords.length === 0} size="sm" className="w-full bg-gradient-to-r from-fuchsia-500 to-violet-500 mb-3">
                    {isResearching ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Researching...</> : <><Search className="w-4 h-4 mr-2" />Find Keywords</>}
                  </Button>
                  {researchKeywords.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-1.5">
                      {researchKeywords.slice(0, 8).map((kw, i) => (
                        <div key={kw.keyword} className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/[0.03] text-xs">
                          <span className="truncate mr-2">{kw.keyword}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-cyan-400">{formatNumber(kw.search_volume)}</span>
                            <CompPill level={kw.competition} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SEODashboard;
