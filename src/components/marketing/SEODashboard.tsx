import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Link2, TrendingUp, Search, Target, Users, BarChart3, 
  Globe, ArrowUpRight, ArrowDownRight, Minus, RefreshCw,
  Award, Zap, ExternalLink, Filter, ChevronDown, ChevronRight,
  Activity, Loader2, AlertCircle, CheckCircle2, Eye, DollarSign,
  Hash, FileText, Sparkles, Network, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useDataForSEO, BacklinksSummary, RankedKeyword, Competitor, BacklinkItem, AnchorData } from '@/hooks/use-dataforseo';
import { toast } from 'sonner';

interface SEODashboardProps {
  domain: string;
}

// Helper to format large numbers
const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

// Helper to format currency
const formatCurrency = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return '$0';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
};

// Position change indicator
const PositionChange = ({ current, previous }: { current: number; previous: number | null }) => {
  if (previous === null) return <Badge variant="outline" className="text-[10px]">New</Badge>;
  const diff = previous - current;
  if (diff > 0) return <span className="flex items-center text-green-500 text-xs"><ArrowUpRight className="w-3 h-3" />{diff}</span>;
  if (diff < 0) return <span className="flex items-center text-red-500 text-xs"><ArrowDownRight className="w-3 h-3" />{Math.abs(diff)}</span>;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
};

// Intent badge
const IntentBadge = ({ intent }: { intent: string[] }) => {
  const colors: Record<string, string> = {
    informational: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    commercial: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    transactional: 'bg-green-500/20 text-green-500 border-green-500/30',
    navigational: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  };
  const primary = intent[0] || 'informational';
  return (
    <Badge variant="outline" className={`text-[10px] ${colors[primary] || colors.informational}`}>
      {primary.charAt(0).toUpperCase()}
    </Badge>
  );
};

export const SEODashboard = ({ domain }: SEODashboardProps) => {
  const {
    loading,
    error,
    getBacklinksSummary,
    getBacklinks,
    getAnchors,
    getReferringDomains,
    getDomainRankOverview,
    getRankedKeywords,
    getCompetitors,
  } = useDataForSEO();

  // State for all data
  const [backlinksSummary, setBacklinksSummary] = useState<BacklinksSummary | null>(null);
  const [domainOverview, setDomainOverview] = useState<any>(null);
  const [rankedKeywords, setRankedKeywords] = useState<RankedKeyword[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [backlinks, setBacklinks] = useState<BacklinkItem[]>([]);
  const [anchors, setAnchors] = useState<AnchorData[]>([]);
  const [referringDomains, setReferringDomains] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Clean domain for API
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  // Load all data
  const loadAllData = useCallback(async () => {
    if (!cleanDomain || isLoading) return;
    
    setIsLoading(true);
    setHasLoaded(true);
    toast.info(`Analyzing ${cleanDomain}...`);

    try {
      // Load overview data in parallel
      setLoadingSection('overview');
      const [blSummary, domainRank] = await Promise.all([
        getBacklinksSummary(cleanDomain),
        getDomainRankOverview(cleanDomain),
      ]);
      
      setBacklinksSummary(blSummary);
      setDomainOverview(domainRank);

      // Load keywords
      setLoadingSection('keywords');
      const keywords = await getRankedKeywords(cleanDomain, 100);
      setRankedKeywords(keywords);

      // Load backlinks data
      setLoadingSection('backlinks');
      const [blList, anchorList, refDomains] = await Promise.all([
        getBacklinks(cleanDomain, 50),
        getAnchors(cleanDomain, 30),
        getReferringDomains(cleanDomain, 50),
      ]);
      setBacklinks(blList);
      setAnchors(anchorList);
      setReferringDomains(refDomains);

      // Load competitors
      setLoadingSection('competitors');
      const compList = await getCompetitors(cleanDomain, 15);
      setCompetitors(compList);

      toast.success('SEO analysis complete!');
    } catch (err) {
      toast.error('Failed to load SEO data');
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingSection(null);
    }
  }, [cleanDomain, getBacklinksSummary, getDomainRankOverview, getRankedKeywords, getBacklinks, getAnchors, getReferringDomains, getCompetitors, isLoading]);

  // Auto-load when domain changes
  useEffect(() => {
    if (cleanDomain && !hasLoaded) {
      // Delay initial load slightly
      const timer = setTimeout(() => loadAllData(), 500);
      return () => clearTimeout(timer);
    }
  }, [cleanDomain]);

  // Calculate domain score (DR-like metric)
  const domainScore = backlinksSummary?.rank 
    ? Math.min(100, Math.max(0, Math.round(Math.log10(backlinksSummary.rank + 1) * 15)))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with Domain & Refresh */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.div 
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <BarChart3 className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">SEO Intelligence</h2>
              <Badge variant="outline" className="text-cyan-500 border-cyan-500/30 bg-cyan-500/10">
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
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {loadingSection ? `Loading ${loadingSection}...` : 'Analyzing...'}
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Analyze Domain
            </>
          )}
        </Button>
      </header>

      {/* No domain selected state */}
      {!cleanDomain && (
        <Card className="border-dashed border-2 border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="py-12 text-center">
            <Globe className="w-12 h-12 mx-auto mb-4 text-cyan-500/50" />
            <h3 className="text-lg font-semibold mb-2">Select a Domain</h3>
            <p className="text-sm text-muted-foreground">
              Choose a domain from the selector above to view comprehensive SEO analytics
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading state before first load */}
      {cleanDomain && !hasLoaded && !isLoading && (
        <Card className="border-dashed border-2 border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-cyan-500/50" />
            <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Analyze Domain" to fetch SEO data for {cleanDomain}
            </p>
            <Button onClick={loadAllData} className="bg-gradient-to-r from-cyan-500 to-blue-500">
              <Zap className="w-4 h-4 mr-2" />
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Content */}
      {(hasLoaded || isLoading) && cleanDomain && (
        <>
          {/* Overview Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Domain Rank */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-[40px]" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Award className="w-4 h-4 text-cyan-500" />
                </div>
                <span className="text-xs text-muted-foreground">Domain Rank</span>
              </div>
              {isLoading && !backlinksSummary ? (
                <div className="h-8 bg-muted/50 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-cyan-500">{formatNumber(backlinksSummary?.rank)}</p>
              )}
            </motion.div>

            {/* Backlinks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="relative p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-[40px]" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-xs text-muted-foreground">Backlinks</span>
              </div>
              {isLoading && !backlinksSummary ? (
                <div className="h-8 bg-muted/50 rounded animate-pulse" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-blue-500">{formatNumber(backlinksSummary?.backlinks)}</p>
                  {(backlinksSummary?.backlinks_new ?? 0) > 0 && (
                    <span className="text-[10px] text-green-500 flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> +{formatNumber(backlinksSummary?.backlinks_new)} new
                    </span>
                  )}
                </>
              )}
            </motion.div>

            {/* Referring Domains */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-[40px]" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Network className="w-4 h-4 text-violet-500" />
                </div>
                <span className="text-xs text-muted-foreground">Ref. Domains</span>
              </div>
              {isLoading && !backlinksSummary ? (
                <div className="h-8 bg-muted/50 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-violet-500">{formatNumber(backlinksSummary?.referring_domains)}</p>
              )}
            </motion.div>

            {/* Organic Keywords */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-[40px]" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Hash className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-xs text-muted-foreground">Keywords</span>
              </div>
              {isLoading && !rankedKeywords.length ? (
                <div className="h-8 bg-muted/50 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-emerald-500">{formatNumber(rankedKeywords.length)}</p>
              )}
            </motion.div>

            {/* Organic Traffic */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-[40px]" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xs text-muted-foreground">Est. Traffic</span>
              </div>
              {isLoading && !domainOverview ? (
                <div className="h-8 bg-muted/50 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-amber-500">
                  {formatNumber(domainOverview?.organic_traffic || rankedKeywords.reduce((sum, k) => sum + k.traffic, 0))}
                </p>
              )}
            </motion.div>

            {/* Traffic Value */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="relative p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-pink-500/5 border border-rose-500/20 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-bl-[40px]" />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-rose-500" />
                </div>
                <span className="text-xs text-muted-foreground">Traffic Value</span>
              </div>
              {isLoading && !rankedKeywords.length ? (
                <div className="h-8 bg-muted/50 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-rose-500">
                  {formatCurrency(domainOverview?.organic_cost || rankedKeywords.reduce((sum, k) => sum + k.traffic_cost, 0))}
                </p>
              )}
            </motion.div>
          </div>

          {/* Tabs for detailed data */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-muted/30 p-1 h-auto flex-wrap gap-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-500">
                <BarChart3 className="w-4 h-4 mr-1.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="keywords" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-500">
                <Hash className="w-4 h-4 mr-1.5" /> Keywords ({rankedKeywords.length})
              </TabsTrigger>
              <TabsTrigger value="backlinks" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-500">
                <Link2 className="w-4 h-4 mr-1.5" /> Backlinks ({backlinks.length})
              </TabsTrigger>
              <TabsTrigger value="competitors" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-500">
                <Target className="w-4 h-4 mr-1.5" /> Competitors ({competitors.length})
              </TabsTrigger>
              <TabsTrigger value="anchors" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
                <FileText className="w-4 h-4 mr-1.5" /> Anchors ({anchors.length})
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Keywords Preview */}
                <Card className="border-emerald-500/20 bg-gradient-to-br from-card to-emerald-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Hash className="w-4 h-4 text-emerald-500" />
                      Top Ranking Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading && !rankedKeywords.length ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : rankedKeywords.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No keywords found</p>
                    ) : (
                      <div className="space-y-2">
                        {rankedKeywords.slice(0, 5).map((kw, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Badge variant="outline" className="shrink-0 w-8 justify-center">{kw.position}</Badge>
                              <span className="text-sm truncate">{kw.keyword}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-muted-foreground">{formatNumber(kw.search_volume)}/mo</span>
                              <IntentBadge intent={kw.intent} />
                            </div>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setActiveTab('keywords')}>
                          View All Keywords <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Backlinks Preview */}
                <Card className="border-blue-500/20 bg-gradient-to-br from-card to-blue-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-blue-500" />
                      Top Backlinks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading && !backlinks.length ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : backlinks.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No backlinks found</p>
                    ) : (
                      <div className="space-y-2">
                        {backlinks.slice(0, 5).map((bl, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Badge variant={bl.dofollow ? "default" : "secondary"} className="shrink-0 text-[10px]">
                                {bl.dofollow ? 'DF' : 'NF'}
                              </Badge>
                              <span className="text-sm truncate">{bl.domain_from}</span>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">DR: {bl.domain_from_rank}</span>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setActiveTab('backlinks')}>
                          View All Backlinks <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Competitors Preview */}
                <Card className="border-violet-500/20 bg-gradient-to-br from-card to-violet-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4 text-violet-500" />
                      Top Competitors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading && !competitors.length ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : competitors.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No competitors found</p>
                    ) : (
                      <div className="space-y-2">
                        {competitors.slice(0, 5).map((comp, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <span className="text-sm truncate flex-1">{comp.domain}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-muted-foreground">{formatNumber(comp.keywords_common)} common</span>
                            </div>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setActiveTab('competitors')}>
                          View All Competitors <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Anchors Preview */}
                <Card className="border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      Top Anchor Texts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading && !anchors.length ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : anchors.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No anchors found</p>
                    ) : (
                      <div className="space-y-2">
                        {anchors.slice(0, 5).map((anchor, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <span className="text-sm truncate flex-1">{anchor.anchor || '(empty)'}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{formatNumber(anchor.backlinks)} links</span>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setActiveTab('anchors')}>
                          View All Anchors <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Keywords Tab */}
            <TabsContent value="keywords" className="mt-6">
              <Card className="border-emerald-500/20">
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead>Keyword</TableHead>
                          <TableHead className="text-center">Intent</TableHead>
                          <TableHead className="text-right">Volume</TableHead>
                          <TableHead className="text-right">CPC</TableHead>
                          <TableHead className="text-right">Traffic</TableHead>
                          <TableHead className="text-right">KD</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankedKeywords.map((kw, i) => (
                          <TableRow key={i} className="hover:bg-emerald-500/5">
                            <TableCell className="text-center font-medium">{kw.position}</TableCell>
                            <TableCell className="max-w-[250px] truncate">{kw.keyword}</TableCell>
                            <TableCell className="text-center"><IntentBadge intent={kw.intent} /></TableCell>
                            <TableCell className="text-right">{formatNumber(kw.search_volume)}</TableCell>
                            <TableCell className="text-right">${kw.cpc.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{formatNumber(kw.traffic)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Progress value={kw.keyword_difficulty} className="w-12 h-1.5" />
                                <span className="text-xs w-6">{kw.keyword_difficulty}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {rankedKeywords.length === 0 && !isLoading && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No keywords found for this domain
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Backlinks Tab */}
            <TabsContent value="backlinks" className="mt-6">
              <Card className="border-blue-500/20">
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead className="w-16">Type</TableHead>
                          <TableHead>From Domain</TableHead>
                          <TableHead>Anchor</TableHead>
                          <TableHead className="text-right">DR</TableHead>
                          <TableHead className="text-right">First Seen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backlinks.map((bl, i) => (
                          <TableRow key={i} className="hover:bg-blue-500/5">
                            <TableCell>
                              <Badge variant={bl.dofollow ? "default" : "secondary"} className="text-[10px]">
                                {bl.dofollow ? 'DoFollow' : 'NoFollow'}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <a href={bl.url_from} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1 truncate">
                                {bl.domain_from}
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                              {bl.anchor || '(no anchor)'}
                            </TableCell>
                            <TableCell className="text-right">{bl.domain_from_rank}</TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              {bl.first_seen ? new Date(bl.first_seen).toLocaleDateString() : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        {backlinks.length === 0 && !isLoading && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No backlinks found for this domain
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Competitors Tab */}
            <TabsContent value="competitors" className="mt-6">
              <Card className="border-violet-500/20">
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead>Competitor</TableHead>
                          <TableHead className="text-right">Common Keywords</TableHead>
                          <TableHead className="text-right">Unique Keywords</TableHead>
                          <TableHead className="text-right">Organic Traffic</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {competitors.map((comp, i) => (
                          <TableRow key={i} className="hover:bg-violet-500/5">
                            <TableCell>
                              <a href={`https://${comp.domain}`} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-500 hover:underline flex items-center gap-1">
                                {comp.domain}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(comp.keywords_common)}</TableCell>
                            <TableCell className="text-right">{formatNumber(comp.keywords_unique)}</TableCell>
                            <TableCell className="text-right">{formatNumber(comp.organic_traffic)}</TableCell>
                          </TableRow>
                        ))}
                        {competitors.length === 0 && !isLoading && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No competitors found for this domain
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Anchors Tab */}
            <TabsContent value="anchors" className="mt-6">
              <Card className="border-amber-500/20">
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead>Anchor Text</TableHead>
                          <TableHead className="text-right">Backlinks</TableHead>
                          <TableHead className="text-right">Ref. Domains</TableHead>
                          <TableHead className="text-right">DoFollow</TableHead>
                          <TableHead className="text-right">NoFollow</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {anchors.map((anchor, i) => (
                          <TableRow key={i} className="hover:bg-amber-500/5">
                            <TableCell className="max-w-[300px] truncate">
                              {anchor.anchor || '(empty anchor)'}
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(anchor.backlinks)}</TableCell>
                            <TableCell className="text-right">{formatNumber(anchor.referring_domains)}</TableCell>
                            <TableCell className="text-right text-green-500">{formatNumber(anchor.dofollow)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatNumber(anchor.nofollow)}</TableCell>
                          </TableRow>
                        ))}
                        {anchors.length === 0 && !isLoading && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No anchor data found for this domain
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default SEODashboard;
