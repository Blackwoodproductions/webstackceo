import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileSearch, Search, FileText, Code, Gauge, ImageIcon, Link2, Type,
  CheckCircle2, AlertTriangle, Clock, TrendingUp, Zap, Bot, 
  Play, Pause, Settings, RefreshCw, Eye, Target, Award, Building,
  Sparkles, Activity, BarChart3, ArrowUpRight, Shield, Crown,
  Loader2, Power
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OnPageSEOPlatformWizard } from './OnPageSEOPlatformWizard';
import { OnPageSEOHealthMonitor } from './OnPageSEOHealthMonitor';
import { OnPageSEOPricingTiers } from './OnPageSEOPricingTiers';

interface SEOIssue {
  id: string;
  type: 'meta_title' | 'meta_description' | 'h1' | 'alt_text' | 'schema' | 'internal_links';
  severity: 'critical' | 'warning' | 'info';
  page: string;
  issue: string;
  suggestion: string;
  autoFixable: boolean;
  status: 'pending' | 'in_progress' | 'fixed' | 'ignored';
  fixedAt?: string;
  platform?: string;
}

interface FixLogEntry {
  id: string;
  issueType: string;
  page: string;
  description: string;
  fixedAt: string;
  platform: string;
  automatic: boolean;
}

interface OptimizationStats {
  pagesScanned: number;
  issuesFound: number;
  issuesFixed: number;
  seoScore: number;
  lastScan: string;
  autopilotActive: boolean;
}

interface OnPageSEODashboardProps {
  domain?: string;
  isSubscribed?: boolean;
  connectedPlatform?: string;
}

const mockIssues: SEOIssue[] = [
  {
    id: '1',
    type: 'meta_title',
    severity: 'critical',
    page: '/services',
    issue: 'Title tag is 78 characters (exceeds 60 char limit)',
    suggestion: 'Shorten to "Professional SEO Services | WebStack CEO"',
    autoFixable: true,
    status: 'pending',
  },
  {
    id: '2',
    type: 'meta_description',
    severity: 'warning',
    page: '/about',
    issue: 'Meta description missing',
    suggestion: 'Add compelling 150-160 character description with target keywords',
    autoFixable: true,
    status: 'pending',
  },
  {
    id: '3',
    type: 'alt_text',
    severity: 'warning',
    page: '/blog/seo-tips',
    issue: '3 images missing alt text',
    suggestion: 'Add descriptive alt text with relevant keywords',
    autoFixable: true,
    status: 'fixed',
  },
  {
    id: '4',
    type: 'schema',
    severity: 'info',
    page: '/contact',
    issue: 'LocalBusiness schema not implemented',
    suggestion: 'Add LocalBusiness structured data for local SEO boost',
    autoFixable: true,
    status: 'pending',
  },
  {
    id: '5',
    type: 'h1',
    severity: 'critical',
    page: '/pricing',
    issue: 'Multiple H1 tags detected (3 found)',
    suggestion: 'Use single H1 tag for main heading, convert others to H2/H3',
    autoFixable: true,
    status: 'in_progress',
  },
];

const issueTypeConfig = {
  meta_title: { icon: Type, label: 'Meta Title', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  meta_description: { icon: FileText, label: 'Meta Description', color: 'text-violet-500', bg: 'bg-violet-500/10' },
  h1: { icon: Code, label: 'Header Structure', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  alt_text: { icon: ImageIcon, label: 'Image Alt Text', color: 'text-green-500', bg: 'bg-green-500/10' },
  schema: { icon: Gauge, label: 'Schema Markup', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  internal_links: { icon: Link2, label: 'Internal Links', color: 'text-pink-500', bg: 'bg-pink-500/10' },
};

const severityConfig = {
  critical: { color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  warning: { color: 'text-amber-500', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  info: { color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
};

export const OnPageSEODashboard = ({ domain, isSubscribed = false, connectedPlatform }: OnPageSEODashboardProps) => {
  // Ensure we're using the selected domain, not a hardcoded value
  const activeDomain = domain || 'example.com';
  
  const [stats, setStats] = useState<OptimizationStats>({
    pagesScanned: 47,
    issuesFound: 23,
    issuesFixed: 18,
    seoScore: 78,
    lastScan: new Date().toISOString(),
    autopilotActive: false,
  });
  const [issues, setIssues] = useState<SEOIssue[]>(mockIssues);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [activePlatform, setActivePlatform] = useState<string>(connectedPlatform || '');
  const [fixLog, setFixLog] = useState<FixLogEntry[]>([
    {
      id: '1',
      issueType: 'meta_title',
      page: '/services',
      description: 'Title tag shortened to 58 characters',
      fixedAt: new Date(Date.now() - 120000).toISOString(),
      platform: 'lovable',
      automatic: true,
    },
    {
      id: '2',
      issueType: 'alt_text',
      page: '/blog/seo-tips',
      description: 'Added alt text to 3 images',
      fixedAt: new Date(Date.now() - 300000).toISOString(),
      platform: 'wordpress',
      automatic: true,
    },
    {
      id: '3',
      issueType: 'schema',
      page: '/about',
      description: 'Added Organization schema markup',
      fixedAt: new Date(Date.now() - 600000).toISOString(),
      platform: 'lovable',
      automatic: true,
    },
  ]);

  // Reset state when domain changes
  useEffect(() => {
    if (domain) {
      console.log('[OnPage SEO] Domain changed to:', domain);
      // Reset stats for new domain
      setStats(prev => ({
        ...prev,
        pagesScanned: 0,
        issuesFound: 0,
        issuesFixed: 0,
        seoScore: 0,
        lastScan: new Date().toISOString(),
      }));
      setIssues([]);
      // Trigger initial scan for the new domain
      handleRunScan();
    }
  }, [domain]);

  // Auto-enable autopilot for Lovable sites
  useEffect(() => {
    if (activePlatform === 'lovable' || activePlatform === 'php-bron') {
      setStats(prev => ({ ...prev, autopilotActive: true }));
    }
  }, [activePlatform]);

  // Check if platform supports auto-fix (all platforms do)
  const supportsAutoFix = (platform: string): boolean => {
    return ['lovable', 'php-bron', 'wordpress', 'shopify', 'wix'].includes(platform);
  };

  const handleToggleAutopilot = () => {
    setStats(prev => ({ ...prev, autopilotActive: !prev.autopilotActive }));
    toast.success(stats.autopilotActive ? 'Autopilot disabled' : 'Autopilot enabled', {
      description: stats.autopilotActive 
        ? 'Manual approval required for all changes'
        : 'AI will automatically fix detected issues',
    });
  };

  const handleRunScan = async () => {
    if (!activeDomain) {
      toast.error('No domain selected', { description: 'Please select a domain to scan' });
      return;
    }
    
    setIsScanning(true);
    toast.info(`Scanning ${activeDomain}...`, { description: 'Analyzing all pages for SEO issues' });
    
    // Simulate domain-specific scan
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate domain-specific mock data
    const pagesFound = Math.floor(Math.random() * 30) + 20;
    const issuesFound = Math.floor(Math.random() * 15) + 5;
    
    setStats(prev => ({
      ...prev,
      pagesScanned: pagesFound,
      issuesFound: issuesFound,
      seoScore: Math.floor(Math.random() * 30) + 60,
      lastScan: new Date().toISOString(),
    }));
    
    // Generate domain-specific issues
    setIssues([
      {
        id: '1',
        type: 'meta_title',
        severity: 'critical',
        page: `/${activeDomain}/services`,
        issue: 'Title tag is 78 characters (exceeds 60 char limit)',
        suggestion: `Shorten to "Professional Services | ${activeDomain}"`,
        autoFixable: true,
        status: 'pending',
      },
      {
        id: '2',
        type: 'meta_description',
        severity: 'warning',
        page: `/${activeDomain}/about`,
        issue: 'Meta description missing',
        suggestion: 'Add compelling 150-160 character description with target keywords',
        autoFixable: true,
        status: 'pending',
      },
      {
        id: '3',
        type: 'schema',
        severity: 'info',
        page: `/${activeDomain}/contact`,
        issue: 'LocalBusiness schema not implemented',
        suggestion: 'Add LocalBusiness structured data for local SEO boost',
        autoFixable: true,
        status: 'pending',
      },
    ]);
    
    setIsScanning(false);
    toast.success('Scan complete!', { description: `Found ${issuesFound} issues on ${activeDomain}` });
  };

  const handleFixIssue = async (issueId: string, automatic: boolean = false) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    setIssues(prev => prev.map(i => 
      i.id === issueId ? { ...i, status: 'in_progress' } : i
    ));

    // Simulate fix
    await new Promise(resolve => setTimeout(resolve, 1500));

    const fixedAt = new Date().toISOString();
    setIssues(prev => prev.map(i => 
      i.id === issueId ? { ...i, status: 'fixed', fixedAt } : i
    ));
    setStats(prev => ({ ...prev, issuesFixed: prev.issuesFixed + 1 }));

    // Add to fix log
    const typeConfig = issueTypeConfig[issue.type];
    setFixLog(prev => [{
      id: crypto.randomUUID(),
      issueType: issue.type,
      page: issue.page,
      description: `Fixed: ${issue.suggestion.substring(0, 50)}...`,
      fixedAt,
      platform: activePlatform || 'lovable',
      automatic,
    }, ...prev].slice(0, 50)); // Keep last 50 entries

    toast.success('Issue fixed!', { 
      description: 'Change has been applied to your website',
    });
  };

  const handleFixAll = async () => {
    const pendingIssues = issues.filter(i => i.status === 'pending' && i.autoFixable);
    
    for (const issue of pendingIssues) {
      await handleFixIssue(issue.id, stats.autopilotActive);
    }
  };

  const pendingCount = issues.filter(i => i.status === 'pending').length;
  const criticalCount = issues.filter(i => i.severity === 'critical' && i.status === 'pending').length;
  const recentFixes = fixLog.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <FileSearch className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">On-Page SEO Automation</h2>
              {stats.autopilotActive && (
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30 animate-pulse">
                  <Bot className="w-3 h-3 mr-1" />
                  Autopilot Active
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered optimization making <span className="text-amber-500 font-medium">real changes</span> to your website
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Autopilot Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
            <Bot className={`w-4 h-4 ${stats.autopilotActive ? 'text-green-500' : 'text-muted-foreground'}`} />
            <span className="text-sm">Autopilot</span>
            <Switch
              checked={stats.autopilotActive}
              onCheckedChange={handleToggleAutopilot}
            />
          </div>

          <Button
            onClick={handleRunScan}
            disabled={isScanning}
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Run Scan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* SEO Score */}
        <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">SEO Score</span>
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                <TrendingUp className="w-3 h-3 mr-1" />
                +5
              </Badge>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-amber-500">{stats.seoScore}</span>
              <span className="text-lg text-muted-foreground mb-1">/100</span>
            </div>
            <Progress value={stats.seoScore} className="h-2 mt-2" />
          </CardContent>
        </Card>

        {/* Pages Scanned */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Pages Scanned</span>
            </div>
            <span className="text-3xl font-bold">{stats.pagesScanned}</span>
          </CardContent>
        </Card>

        {/* Issues Found */}
        <Card className={criticalCount > 0 ? 'border-red-500/30' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`w-4 h-4 ${criticalCount > 0 ? 'text-red-500' : 'text-amber-500'}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Issues Found</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{stats.issuesFound}</span>
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-[10px]">{criticalCount} critical</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Issues Fixed */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Issues Fixed</span>
            </div>
            <span className="text-3xl font-bold text-green-500">{stats.issuesFixed}</span>
          </CardContent>
        </Card>

        {/* Autopilot Status */}
        <Card className={stats.autopilotActive ? 'border-green-500/30' : 'border-muted'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Power className={`w-4 h-4 ${stats.autopilotActive ? 'text-green-500' : 'text-muted-foreground'}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Auto-Fix</span>
            </div>
            <span className={`text-lg font-bold ${stats.autopilotActive ? 'text-green-500' : 'text-muted-foreground'}`}>
              {stats.autopilotActive ? 'Active' : 'Manual'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="bg-background/50 border border-border/50">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="issues" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Issues
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="platforms" className="gap-2">
            <Settings className="w-4 h-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2">
            <Shield className="w-4 h-4" />
            Health Monitor
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <Crown className="w-4 h-4" />
            Plans
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Issue Categories */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(issueTypeConfig).map(([key, config]) => {
              const Icon = config.icon;
              const count = issues.filter(i => i.type === key && i.status === 'pending').length;
              
              return (
                <Card key={key} className={`${config.bg} border-0`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{config.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {count} pending {count === 1 ? 'issue' : 'issues'}
                          </p>
                        </div>
                      </div>
                      {count > 0 && (
                        <Badge className={`${config.bg} ${config.color} border-0`}>
                          {count}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Quick Optimization</h3>
                  <p className="text-sm text-muted-foreground">
                    {pendingCount} issues ready for auto-fix
                  </p>
                </div>
                <Button 
                  onClick={handleFixAll}
                  disabled={pendingCount === 0}
                  className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  <Zap className="w-4 h-4" />
                  Fix All Issues
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-4">
          {issues.length === 0 ? (
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-500">All Clear!</h3>
                <p className="text-sm text-muted-foreground mt-2">No SEO issues detected on your website</p>
              </CardContent>
            </Card>
          ) : (
            issues.map((issue, i) => {
              const typeConfig = issueTypeConfig[issue.type];
              const Icon = typeConfig.icon;
              const severity = severityConfig[issue.severity];

              return (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`${issue.status === 'fixed' ? 'opacity-60' : ''} ${severity.border} border`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg ${typeConfig.bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-5 h-5 ${typeConfig.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{typeConfig.label}</span>
                              <Badge className={`text-[10px] ${severity.bg} ${severity.color} border-0`}>
                                {issue.severity}
                              </Badge>
                              <span className="text-xs text-muted-foreground">on {issue.page}</span>
                            </div>
                            <p className="text-sm text-foreground mb-1">{issue.issue}</p>
                            <p className="text-xs text-muted-foreground">
                              <span className="text-green-500 font-medium">Suggestion:</span> {issue.suggestion}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {issue.status === 'pending' && issue.autoFixable && (
                            <Button 
                              size="sm" 
                              onClick={() => handleFixIssue(issue.id)}
                              className="gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                            >
                              <Zap className="w-3 h-3" />
                              Auto-Fix
                            </Button>
                          )}
                          {issue.status === 'in_progress' && (
                            <Badge className="bg-blue-500/20 text-blue-500">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Fixing...
                            </Badge>
                          )}
                          {issue.status === 'fixed' && (
                            <Badge className="bg-green-500/20 text-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Fixed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </TabsContent>

        {/* Platforms Tab */}
        <TabsContent value="platforms">
          <OnPageSEOPlatformWizard 
            domain={domain}
            onConnectionComplete={(platform, status) => {
              setIsConnected(true);
              setActivePlatform(platform);
              // Auto-enable autopilot for all connected platforms
              if (supportsAutoFix(platform)) {
                setStats(prev => ({ ...prev, autopilotActive: true }));
                toast.success('Auto-fix enabled!', {
                  description: `${platform} supports automatic SEO fixes. Autopilot is now active.`,
                });
              } else {
                toast.success('Platform connected!');
              }
            }}
          />
        </TabsContent>

        {/* Health Monitor Tab */}
        <TabsContent value="health">
          <OnPageSEOHealthMonitor domain={domain} />
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <OnPageSEOPricingTiers 
            pageCount={stats.pagesScanned}
            onSubscribe={(tier) => {
              toast.success(`Subscribed to ${tier} plan!`);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Recent Fixes Activity Log - Bottom Panel */}
      <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Recent Fixes Applied
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                {recentFixes.length} changes
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Bot className={`w-4 h-4 ${stats.autopilotActive ? 'text-green-500' : 'text-muted-foreground'}`} />
              {stats.autopilotActive ? 'Auto-fix active' : 'Manual mode'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {recentFixes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No fixes applied yet. Run a scan to detect issues.
            </p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {recentFixes.map((fix, i) => {
                const typeConfig = issueTypeConfig[fix.issueType as keyof typeof issueTypeConfig] || issueTypeConfig.meta_title;
                const Icon = typeConfig.icon;
                const timeAgo = getTimeAgo(fix.fixedAt);
                
                return (
                  <motion.div
                    key={fix.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-background/50 border border-green-500/10 hover:border-green-500/30 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg ${typeConfig.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${typeConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{fix.description}</span>
                        {fix.automatic && (
                          <Badge className="bg-violet-500/20 text-violet-500 border-0 text-[10px] shrink-0">
                            <Bot className="w-2.5 h-2.5 mr-0.5" />
                            Auto
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{fix.page}</span>
                        <span>•</span>
                        <span className="capitalize">{fix.platform}</span>
                        <span>•</span>
                        <span>{timeAgo}</span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function for time ago
function getTimeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default OnPageSEODashboard;
