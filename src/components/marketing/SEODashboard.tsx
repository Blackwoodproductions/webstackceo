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
import { Progress } from '@/components/ui/progress';
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

// Large Radial Gauge Component
const RadialGauge = ({ 
  value, 
  max = 100, 
  label, 
  sublabel,
  icon: Icon,
  color = '#06b6d4',
  size = 'md'
}: { 
  value: number; 
  max?: number; 
  label: string;
  sublabel?: string;
  icon?: any;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const percentage = Math.min(100, (value / max) * 100);
  const sizes = { sm: 100, md: 140, lg: 180 };
  const dim = sizes[size];
  const radius = (dim - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative flex flex-col items-center">
      <svg width={dim} height={dim} className="transform -rotate-90">
        <defs>
          <linearGradient id={`gauge-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Background track */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={size === 'lg' ? 12 : 8}
          fill="none"
          className="text-muted/10"
        />
        {/* Animated fill */}
        <motion.circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          stroke={`url(#gauge-${label})`}
          strokeWidth={size === 'lg' ? 12 : 8}
          fill="none"
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {Icon && <Icon className="w-5 h-5 mb-1" style={{ color }} />}
        <motion.span 
          className={`font-bold ${size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl'}`}
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : Math.round(value)}
        </motion.span>
        {sublabel && <span className="text-[10px] text-muted-foreground">{sublabel}</span>}
      </div>
      <span className="text-xs text-muted-foreground mt-2 text-center font-medium">{label}</span>
    </div>
  );
};

// Semicircle Speedometer
const Speedometer = ({ 
  value, 
  max = 100, 
  label,
  thresholds = { good: 33, warning: 66 }
}: { 
  value: number; 
  max?: number; 
  label: string;
  thresholds?: { good: number; warning: number };
}) => {
  const percentage = Math.min(100, (value / max) * 100);
  const angle = (percentage / 100) * 180 - 90;
  
  const getColor = () => {
    if (percentage <= thresholds.good) return '#22c55e';
    if (percentage <= thresholds.warning) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="relative w-32 h-20 overflow-hidden">
      <svg viewBox="0 0 100 60" className="w-full h-full">
        <defs>
          <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted/20"
        />
        {/* Colored arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="url(#speedGradient)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Needle */}
        <motion.line
          x1="50"
          y1="55"
          x2="50"
          y2="20"
          stroke={getColor()}
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ rotate: -90 }}
          animate={{ rotate: angle }}
          transition={{ duration: 1, type: "spring" }}
          style={{ transformOrigin: '50px 55px' }}
        />
        {/* Center dot */}
        <circle cx="50" cy="55" r="4" fill={getColor()} />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 text-center">
        <span className="text-xs font-medium" style={{ color: getColor() }}>{Math.round(value)}</span>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};

// Bar Chart Component
const HorizontalBarChart = ({ 
  data, 
  maxValue,
  color = '#8b5cf6'
}: { 
  data: Array<{ label: string; value: number }>; 
  maxValue: number;
  color?: string;
}) => (
  <div className="space-y-3">
    {data.map((item, i) => (
      <motion.div 
        key={item.label}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.1 }}
        className="space-y-1"
      >
        <div className="flex justify-between text-xs">
          <span className="truncate max-w-[150px]">{item.label}</span>
          <span className="font-medium" style={{ color }}>{formatNumber(item.value)}</span>
        </div>
        <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${(item.value / maxValue) * 100}%` }}
            transition={{ duration: 0.8, delay: i * 0.1 }}
          />
        </div>
      </motion.div>
    ))}
  </div>
);

// Mini Trend Line
const TrendLine = ({ data, color = '#06b6d4' }: { data: number[]; color?: string }) => {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`trend-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#trend-${color})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Status Indicator
const StatusIndicator = ({ passed, label, compact = false }: { passed: boolean; label: string; compact?: boolean }) => (
  <div className={`flex items-center gap-2 ${compact ? 'p-1.5' : 'p-2'} rounded-lg ${passed ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
    {passed ? (
      <CheckCircle className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-green-500 shrink-0`} />
    ) : (
      <XCircle className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-red-500 shrink-0`} />
    )}
    <span className={`${compact ? 'text-xs' : 'text-sm'} ${passed ? 'text-green-500' : 'text-red-500'}`}>{label}</span>
  </div>
);

// Competition Badge
const CompetitionBadge = ({ level }: { level: string }) => {
  const config = {
    LOW: { color: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500/30' },
    MEDIUM: { color: 'text-amber-500', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
    HIGH: { color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  };
  const c = config[level as keyof typeof config] || config.LOW;
  
  return (
    <Badge variant="outline" className={`text-[10px] ${c.color} ${c.bg} ${c.border}`}>
      {level}
    </Badge>
  );
};

// Donut Chart
const DonutChart = ({ 
  segments, 
  centerLabel,
  size = 120
}: { 
  segments: Array<{ value: number; color: string; label: string }>; 
  centerLabel: string;
  size?: number;
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedOffset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {segments.map((segment, i) => {
          const segmentLength = (segment.value / total) * circumference;
          const offset = accumulatedOffset;
          accumulatedOffset += segmentLength;
          
          return (
            <motion.circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="16"
              strokeDasharray={`${segmentLength} ${circumference}`}
              strokeDashoffset={-offset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.2 }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{total}</span>
        <span className="text-[10px] text-muted-foreground">{centerLabel}</span>
      </div>
    </div>
  );
};

export const SEODashboard = ({ domain }: SEODashboardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
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

  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  const callAPI = async (action: string, data: any) => {
    const { data: response, error } = await supabase.functions.invoke('dataforseo-api', {
      body: { action, data }
    });
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
      const kwResponse = await callAPI('keywords_for_site', [{
        target: cleanDomain,
        location_code: 2840,
        language_code: 'en',
        limit: 50
      }]);
      if (kwResponse?.tasks?.[0]?.result) {
        setKeywords(kwResponse.tasks[0].result);
      }

      setLoadingSection('technical');
      const onpageResponse = await callAPI('onpage_instant_pages', [{
        url: `https://${cleanDomain}`,
        enable_javascript: true
      }]);
      if (onpageResponse?.tasks?.[0]?.result?.[0]?.items?.[0]) {
        setOnpageData(onpageResponse.tasks[0].result[0].items[0]);
      }

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

  const runKeywordResearch = useCallback(async () => {
    if (seedKeywords.length === 0) {
      toast.error('Add at least one seed keyword');
      return;
    }
    setIsResearching(true);
    try {
      const response = await callAPI('keywords_for_keywords', [{
        keywords: seedKeywords,
        location_code: 2840,
        language_code: 'en',
        limit: 100
      }]);
      if (response?.tasks?.[0]?.result) {
        setResearchKeywords(response.tasks[0].result);
        toast.success(`Found ${response.tasks[0].result.length} keyword ideas!`);
      }
    } catch (err) {
      toast.error('Failed to research keywords');
    } finally {
      setIsResearching(false);
    }
  }, [seedKeywords]);

  const addSeedKeyword = () => {
    const trimmed = seedKeyword.trim().toLowerCase();
    if (trimmed && !seedKeywords.includes(trimmed)) {
      setSeedKeywords(prev => [...prev, trimmed]);
      setSeedKeyword('');
    }
  };

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

  const metrics = useMemo(() => {
    const totalSearchVolume = keywords.reduce((sum, k) => sum + (k.search_volume || 0), 0);
    const avgCPC = keywords.length > 0 
      ? keywords.reduce((sum, k) => sum + (k.cpc || 0), 0) / keywords.filter(k => k.cpc).length 
      : 0;
    const trafficValue = keywords.reduce((sum, k) => sum + ((k.search_volume || 0) * (k.cpc || 0) * 0.03), 0);
    
    const checks = onpageData?.checks || {};
    const passedChecks = Object.values(checks).filter(v => v === true).length;
    const failedChecks = Object.values(checks).filter(v => v === false).length;
    const totalChecks = passedChecks + failedChecks;
    const seoScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    
    const lowComp = keywords.filter(k => k.competition === 'LOW').length;
    const medComp = keywords.filter(k => k.competition === 'MEDIUM').length;
    const highComp = keywords.filter(k => k.competition === 'HIGH').length;
    
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
      lowComp, medComp, highComp
    };
  }, [keywords, onpageData]);

  const checkCategories = useMemo(() => {
    if (!onpageData?.checks) return { content: [], technical: [], seo: [] };
    const checks = onpageData.checks;
    return {
      content: [
        { key: 'no_title', label: 'Title Tag', passed: !checks.no_title },
        { key: 'no_description', label: 'Meta Description', passed: !checks.no_description },
        { key: 'no_h1_tag', label: 'H1 Tag', passed: !checks.no_h1_tag },
        { key: 'low_content_rate', label: 'Content Rate', passed: !checks.low_content_rate },
      ],
      technical: [
        { key: 'is_https', label: 'HTTPS', passed: checks.is_https },
        { key: 'has_html_doctype', label: 'DOCTYPE', passed: checks.has_html_doctype },
        { key: 'high_loading_time', label: 'Fast Loading', passed: !checks.high_loading_time },
        { key: 'no_favicon', label: 'Favicon', passed: !checks.no_favicon },
      ],
      seo: [
        { key: 'seo_friendly_url', label: 'SEO URL', passed: checks.seo_friendly_url },
        { key: 'canonical', label: 'Canonical', passed: checks.canonical },
        { key: 'no_image_alt', label: 'Image Alts', passed: !checks.no_image_alt },
        { key: 'duplicate_title', label: 'Unique Title', passed: !checks.duplicate_title_tag },
      ]
    };
  }, [onpageData]);

  const topKeywordsByVolume = useMemo(() => 
    [...keywords].sort((a, b) => b.search_volume - a.search_volume).slice(0, 5)
  , [keywords]);

  const keywordOpportunities = useMemo(() => 
    keywords.filter(k => k.competition === 'LOW' && k.search_volume >= 100).slice(0, 5)
  , [keywords]);

  return (
    <div className="relative space-y-6 min-h-[600px]">
      <VIDashboardEffects />
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <motion.div 
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-violet-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30"
            animate={{ boxShadow: ['0 0 20px rgba(6,182,212,0.3)', '0 0 40px rgba(139,92,246,0.4)', '0 0 20px rgba(6,182,212,0.3)'] }}
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

      {/* Initial State */}
      {!hasLoaded && !isLoading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative border-2 border-dashed border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 backdrop-blur-sm overflow-hidden">
            <CardContent className="py-16 text-center">
              <motion.div
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Radar className="w-10 h-10 text-cyan-500" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">
                {cleanDomain ? 'Ready to Scan' : 'Select a Domain'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {cleanDomain 
                  ? `Launch a comprehensive SEO analysis on ${cleanDomain}`
                  : 'Choose a domain from the selector above to begin.'
                }
              </p>
              {cleanDomain && (
                <Button onClick={loadAllData} size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 shadow-lg">
                  <Zap className="w-4 h-4 mr-2" />
                  Start Analysis
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Dashboard Content */}
      {(hasLoaded || isLoading) && cleanDomain && (
        <div className="space-y-6">
          {/* Row 1: Score Ring + Performance Gauges + Quick Stats */}
          <div className="grid grid-cols-12 gap-4">
            {/* SEO Score - Large Ring */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-12 lg:col-span-3"
            >
              <Card className="relative h-full border-cyan-500/20 bg-gradient-to-br from-card via-card to-cyan-500/5 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500" />
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[240px]">
                  {isLoading && !onpageData ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
                      <span className="text-sm text-muted-foreground">Scanning...</span>
                    </div>
                  ) : (
                    <RadialGauge 
                      value={metrics.seoScore} 
                      max={100}
                      label="SEO Health Score"
                      sublabel="of 100"
                      icon={Shield}
                      color={metrics.seoScore >= 80 ? '#22c55e' : metrics.seoScore >= 60 ? '#eab308' : '#ef4444'}
                      size="lg"
                    />
                  )}
                  <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-1 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-green-500">{metrics.passedChecks}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <XCircle className="w-3 h-3 text-red-500" />
                      <span className="text-red-500">{metrics.failedChecks}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Performance Speedometers */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="col-span-12 lg:col-span-5"
            >
              <Card className="relative h-full border-violet-500/20 bg-gradient-to-br from-card via-card to-violet-500/5 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-pink-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-violet-500" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading && !onpageData ? (
                    <div className="h-32 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col items-center">
                        <Speedometer 
                          value={metrics.lcp / 40} 
                          max={100} 
                          label="LCP"
                          thresholds={{ good: 25, warning: 40 }}
                        />
                        <span className="text-[10px] text-muted-foreground mt-1">{formatTime(metrics.lcp)}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Speedometer 
                          value={metrics.tti / 50} 
                          max={100} 
                          label="TTI"
                          thresholds={{ good: 38, warning: 73 }}
                        />
                        <span className="text-[10px] text-muted-foreground mt-1">{formatTime(metrics.tti)}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Speedometer 
                          value={metrics.domComplete / 50} 
                          max={100} 
                          label="DOM"
                          thresholds={{ good: 30, warning: 60 }}
                        />
                        <span className="text-[10px] text-muted-foreground mt-1">{formatTime(metrics.domComplete)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stat Boxes */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="col-span-12 lg:col-span-4"
            >
              <div className="grid grid-cols-2 gap-3 h-full">
                {[
                  { label: 'Keywords', value: metrics.totalKeywords, icon: Hash, color: '#06b6d4', gradient: 'from-cyan-500/10 to-blue-500/5' },
                  { label: 'Volume', value: formatNumber(metrics.totalSearchVolume), icon: TrendingUp, color: '#8b5cf6', gradient: 'from-violet-500/10 to-purple-500/5' },
                  { label: 'Avg CPC', value: formatCurrency(metrics.avgCPC), icon: DollarSign, color: '#22c55e', gradient: 'from-emerald-500/10 to-green-500/5' },
                  { label: 'Traffic Value', value: formatCurrency(metrics.trafficValue), icon: Sparkles, color: '#f59e0b', gradient: 'from-amber-500/10 to-orange-500/5' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * i }}
                    className={`relative p-4 rounded-xl bg-gradient-to-br ${stat.gradient} border border-white/10 overflow-hidden group hover:scale-[1.02] transition-transform`}
                  >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-[30px]" />
                    <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
                    {isLoading ? (
                      <div className="h-7 bg-muted/30 rounded animate-pulse" />
                    ) : (
                      <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    )}
                    <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Row 2: Keyword Charts + Competition Donut + Technical Checks */}
          <div className="grid grid-cols-12 gap-4">
            {/* Top Keywords Bar Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-12 md:col-span-6 lg:col-span-4"
            >
              <Card className="h-full border-emerald-500/20 bg-gradient-to-br from-card to-emerald-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Top Keywords by Volume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading && !keywords.length ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : topKeywordsByVolume.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No keywords found</p>
                  ) : (
                    <HorizontalBarChart 
                      data={topKeywordsByVolume.map(k => ({ label: k.keyword, value: k.search_volume }))}
                      maxValue={Math.max(...topKeywordsByVolume.map(k => k.search_volume))}
                      color="#22c55e"
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Keyword Opportunities */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="col-span-12 md:col-span-6 lg:col-span-4"
            >
              <Card className="h-full border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Quick Win Opportunities
                    <Badge variant="outline" className="ml-auto text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30">
                      Low Competition
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {keywordOpportunities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No opportunities found</p>
                  ) : (
                    <div className="space-y-2">
                      {keywordOpportunities.map((kw, i) => (
                        <motion.div 
                          key={kw.keyword}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span className="text-sm truncate max-w-[120px]">{kw.keyword}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendLine data={kw.monthly_searches?.slice(0, 6).map(m => m.search_volume) || []} color="#f59e0b" />
                            <Badge variant="outline" className="text-[10px]">{formatNumber(kw.search_volume)}</Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Competition Distribution Donut */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="col-span-12 lg:col-span-4"
            >
              <Card className="h-full border-violet-500/20 bg-gradient-to-br from-card to-violet-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-violet-500" />
                    Competition Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading && !keywords.length ? (
                    <div className="h-32 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-around">
                      <DonutChart 
                        segments={[
                          { value: metrics.lowComp, color: '#22c55e', label: 'Low' },
                          { value: metrics.medComp, color: '#eab308', label: 'Medium' },
                          { value: metrics.highComp, color: '#ef4444', label: 'High' },
                        ]}
                        centerLabel="Keywords"
                        size={100}
                      />
                      <div className="space-y-2">
                        {[
                          { label: 'Low', value: metrics.lowComp, color: '#22c55e' },
                          { label: 'Medium', value: metrics.medComp, color: '#eab308' },
                          { label: 'High', value: metrics.highComp, color: '#ef4444' },
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                            <span>{item.label}</span>
                            <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Row 3: Technical Health Grid + SERP Overview */}
          <div className="grid grid-cols-12 gap-4">
            {/* Technical Health Checks */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="col-span-12 lg:col-span-8"
            >
              <Card className="h-full border-blue-500/20 bg-gradient-to-br from-card to-blue-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-blue-500" />
                    Technical Health Audit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading && !onpageData ? (
                    <div className="grid grid-cols-3 gap-4">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : !onpageData ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Content Checks */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                          <Type className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-medium text-emerald-500">Content</span>
                        </div>
                        {checkCategories.content.map((check) => (
                          <StatusIndicator key={check.key} passed={check.passed} label={check.label} compact />
                        ))}
                      </div>
                      {/* Technical Checks */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                          <Code className="w-4 h-4 text-violet-500" />
                          <span className="text-xs font-medium text-violet-500">Technical</span>
                        </div>
                        {checkCategories.technical.map((check) => (
                          <StatusIndicator key={check.key} passed={check.passed} label={check.label} compact />
                        ))}
                      </div>
                      {/* SEO Checks */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                          <Search className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-medium text-blue-500">SEO</span>
                        </div>
                        {checkCategories.seo.map((check) => (
                          <StatusIndicator key={check.key} passed={check.passed} label={check.label} compact />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* SERP Features */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="col-span-12 lg:col-span-4"
            >
              <Card className="h-full border-pink-500/20 bg-gradient-to-br from-card to-pink-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Search className="w-4 h-4 text-pink-500" />
                    SERP Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {serpData?.aiOverview && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-cyan-500" />
                        <span className="text-xs font-medium text-cyan-500">AI Overview Detected</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{serpData.aiOverview.slice(0, 80)}...</p>
                    </motion.div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/20 text-center">
                      <span className="text-2xl font-bold text-pink-500">{serpData?.organic.length || 0}</span>
                      <p className="text-[10px] text-muted-foreground">Organic Results</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 text-center">
                      <span className="text-2xl font-bold text-amber-500">{serpData?.paa.length || 0}</span>
                      <p className="text-[10px] text-muted-foreground">PAA Questions</p>
                    </div>
                  </div>

                  {serpData?.related?.[0]?.items && (
                    <div>
                      <span className="text-xs text-muted-foreground mb-2 block">Related Searches:</span>
                      <div className="flex flex-wrap gap-1">
                        {serpData.related[0].items.slice(0, 4).map((item: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{item.title}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Row 4: Site Stats + Keyword Research Tool */}
          <div className="grid grid-cols-12 gap-4">
            {/* Site Statistics */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="col-span-12 lg:col-span-4"
            >
              <Card className="h-full border-cyan-500/20 bg-gradient-to-br from-card to-cyan-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Network className="w-4 h-4 text-cyan-500" />
                    Site Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Content Size', value: formatNumber(onpageData?.content_size || 0), icon: FileText, color: '#8b5cf6' },
                      { label: 'DOM Size', value: formatNumber(onpageData?.total_dom_size || 0), icon: Code, color: '#06b6d4' },
                      { label: 'Internal Links', value: onpageData?.internal_links_count || 0, icon: Link2, color: '#3b82f6' },
                      { label: 'External Links', value: onpageData?.external_links_count || 0, icon: ExternalLink, color: '#22c55e' },
                      { label: 'Images', value: onpageData?.images_count || 0, icon: Image, color: '#ec4899' },
                      { label: 'H1 Tags', value: onpageData?.meta?.h1?.length || 0, icon: Type, color: '#f59e0b' },
                    ].map((stat, i) => (
                      <motion.div 
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 * i }}
                        className="p-3 rounded-lg bg-muted/20 flex items-center gap-3"
                      >
                        <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                        <div>
                          <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
                          <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Keyword Research Tool */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="col-span-12 lg:col-span-8"
            >
              <Card className="h-full border-amber-500/20 bg-gradient-to-br from-card via-card to-amber-500/5 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-500" />
                    Keyword Research Tool
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      {isResearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                      <span className="ml-2">{isResearching ? 'Researching...' : 'Find Keywords'}</span>
                    </Button>
                  </div>

                  {seedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {seedKeywords.map((kw) => (
                        <Badge 
                          key={kw}
                          variant="outline" 
                          className="bg-amber-500/10 border-amber-500/30 text-amber-500 pl-2 pr-1 py-1"
                        >
                          {kw}
                          <button onClick={() => setSeedKeywords(prev => prev.filter(k => k !== kw))} className="ml-1.5 hover:bg-amber-500/20 rounded p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {researchKeywords.length > 0 && (
                    <div className="border-t border-border/50 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground">Found {researchKeywords.length} keyword ideas</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">
                            <Snowflake className="w-3 h-3 mr-1" />
                            Low Comp: {researchKeywords.filter(k => k.competition === 'LOW').length}
                          </Badge>
                        </div>
                      </div>
                      <div className="max-h-[200px] overflow-auto rounded-lg border border-border/30">
                        <Table>
                          <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                            <TableRow>
                              <TableHead className="text-xs">Keyword</TableHead>
                              <TableHead className="text-xs text-right">Volume</TableHead>
                              <TableHead className="text-xs text-center">Competition</TableHead>
                              <TableHead className="text-xs text-right">CPC</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {researchKeywords.slice(0, 10).map((kw, i) => (
                              <TableRow key={i} className="hover:bg-amber-500/5">
                                <TableCell className="text-sm font-medium py-2">{kw.keyword}</TableCell>
                                <TableCell className="text-right py-2">{formatNumber(kw.search_volume)}</TableCell>
                                <TableCell className="text-center py-2"><CompetitionBadge level={kw.competition} /></TableCell>
                                <TableCell className="text-right py-2">{formatCurrency(kw.cpc)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Row 5: Full Keywords Table */}
          {keywords.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <Card className="border-emerald-500/20 overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-emerald-500/5 to-transparent">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Hash className="w-4 h-4 text-emerald-500" />
                    All Keywords ({keywords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[400px] overflow-auto">
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
                        {keywords.map((kw, i) => (
                          <TableRow key={i} className="hover:bg-emerald-500/5">
                            <TableCell className="font-medium max-w-[300px] truncate">
                              <div className="flex items-center gap-2">
                                {kw.competition === 'LOW' && kw.search_volume >= 100 && (
                                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                                )}
                                <span className="truncate">{kw.keyword}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(kw.search_volume)}</TableCell>
                            <TableCell className="text-center">
                              <TrendLine data={kw.monthly_searches?.slice(0, 6).map(m => m.search_volume) || []} color="#22c55e" />
                            </TableCell>
                            <TableCell className="text-center"><CompetitionBadge level={kw.competition} /></TableCell>
                            <TableCell className="text-right">{formatCurrency(kw.cpc)}</TableCell>
                            <TableCell className="text-right">{formatCurrency((kw.search_volume || 0) * (kw.cpc || 0) * 0.03)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
