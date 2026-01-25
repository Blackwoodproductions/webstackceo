import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  Search,
  RefreshCw,
  Users,
  Eye,
  MousePointer,
  Clock,
  BarChart3,
  Activity,
  Sparkles,
  Calendar,
  FileText,
  Target,
  Zap,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressIndicator } from './ProgressIndicator';

interface AuditMetrics {
  domain: string;
  domainRating: number | null;
  organicTraffic: number | null;
  organicKeywords: number | null;
  backlinks: number | null;
  referringDomains: number | null;
  trafficValue: number | null;
  ahrefsRank: number | null;
}

interface HistorySnapshot {
  id: string;
  domain_rating: number | null;
  organic_traffic: number | null;
  organic_keywords: number | null;
  backlinks: number | null;
  referring_domains: number | null;
  traffic_value: number | null;
  snapshot_at: string;
  source: string;
}

interface CrossDashboardMetrics {
  // Visitor Intelligence
  viSessions?: number;
  viLeads?: number;
  viToolInteractions?: number;
  viBounceRate?: number;
  // Google Analytics
  gaSessions?: number;
  gaUsers?: number;
  gaPageViews?: number;
  gaAvgSessionDuration?: number;
  gaBounceRate?: number;
  // Google Search Console
  gscClicks?: number;
  gscImpressions?: number;
  gscCtr?: number;
  gscPosition?: number;
}

interface InlineSEOReportProps {
  auditData: AuditMetrics;
  savedAudit?: {
    domain: string;
    created_at: string;
    site_title?: string;
  } | null;
  onNewAudit: () => void;
  onRefreshAudit: () => void;
  isRefreshing?: boolean;
  // Cross-dashboard data
  viMetrics?: {
    sessions: number;
    leads: number;
    toolInteractions: number;
    bounceRate?: number;
  };
  gaMetrics?: {
    sessions: number;
    users: number;
    pageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
  } | null;
  gscMetrics?: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  } | null;
}

export const InlineSEOReport = ({
  auditData,
  savedAudit,
  onNewAudit,
  onRefreshAudit,
  isRefreshing,
  viMetrics,
  gaMetrics,
  gscMetrics,
}: InlineSEOReportProps) => {
  const [historySnapshots, setHistorySnapshots] = useState<HistorySnapshot[]>([]);
  const [baselineSnapshot, setBaselineSnapshot] = useState<HistorySnapshot | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Fetch audit history for this domain
  useEffect(() => {
    const fetchHistory = async () => {
      if (!auditData.domain) return;
      
      setIsLoadingHistory(true);
      try {
        const cleanDomain = auditData.domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
        
        const { data, error } = await supabase
          .from('audit_history')
          .select('*')
          .eq('domain', cleanDomain)
          .order('snapshot_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching history:', error);
          return;
        }
        
        if (data && data.length > 0) {
          setHistorySnapshots(data);
          setBaselineSnapshot(data[0]); // First snapshot is baseline
        }
      } catch (err) {
        console.error('History fetch error:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    fetchHistory();
  }, [auditData.domain]);

  // Generate AI summary when we have baseline data
  useEffect(() => {
    if (!baselineSnapshot || !auditData || isGeneratingSummary || aiSummary) return;
    
    const generateSummary = async () => {
      setIsGeneratingSummary(true);
      
      try {
        // Calculate improvements
        const improvements = {
          domainRating: (auditData.domainRating || 0) - (baselineSnapshot.domain_rating || 0),
          organicTraffic: (auditData.organicTraffic || 0) - (Number(baselineSnapshot.organic_traffic) || 0),
          organicKeywords: (auditData.organicKeywords || 0) - (Number(baselineSnapshot.organic_keywords) || 0),
          backlinks: (auditData.backlinks || 0) - (Number(baselineSnapshot.backlinks) || 0),
          referringDomains: (auditData.referringDomains || 0) - (Number(baselineSnapshot.referring_domains) || 0),
          trafficValue: (auditData.trafficValue || 0) - (Number(baselineSnapshot.traffic_value) || 0),
        };
        
        const baselineDate = new Date(baselineSnapshot.snapshot_at).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
        
        // Generate local summary based on data
        const positiveChanges: string[] = [];
        const negativeChanges: string[] = [];
        
        if (improvements.domainRating > 0) positiveChanges.push(`Domain Rating increased by ${improvements.domainRating} points`);
        else if (improvements.domainRating < 0) negativeChanges.push(`Domain Rating decreased by ${Math.abs(improvements.domainRating)} points`);
        
        if (improvements.organicTraffic > 0) positiveChanges.push(`Organic traffic grew by ${improvements.organicTraffic.toLocaleString()} visitors`);
        else if (improvements.organicTraffic < 0) negativeChanges.push(`Organic traffic declined by ${Math.abs(improvements.organicTraffic).toLocaleString()} visitors`);
        
        if (improvements.organicKeywords > 0) positiveChanges.push(`Now ranking for ${improvements.organicKeywords.toLocaleString()} more keywords`);
        
        if (improvements.backlinks > 0) positiveChanges.push(`Gained ${improvements.backlinks.toLocaleString()} new backlinks`);
        
        if (improvements.referringDomains > 0) positiveChanges.push(`${improvements.referringDomains.toLocaleString()} new referring domains`);
        
        if (improvements.trafficValue > 0) positiveChanges.push(`Traffic value increased by $${improvements.trafficValue.toLocaleString()}`);
        
        let summary = `**Progress Report since ${baselineDate}**\n\n`;
        
        if (positiveChanges.length > 0) {
          summary += `✅ **Improvements:**\n${positiveChanges.map(c => `• ${c}`).join('\n')}\n\n`;
        }
        
        if (negativeChanges.length > 0) {
          summary += `⚠️ **Areas to Watch:**\n${negativeChanges.map(c => `• ${c}`).join('\n')}\n\n`;
        }
        
        if (positiveChanges.length === 0 && negativeChanges.length === 0) {
          summary += `Metrics have remained stable since the initial audit. Continue with your current SEO strategy while monitoring for new opportunities.`;
        } else if (positiveChanges.length > negativeChanges.length) {
          summary += `📈 **Overall:** Strong positive trajectory! The SEO efforts are paying off with measurable gains across key metrics.`;
        } else {
          summary += `📊 **Overall:** Mixed results indicate opportunity for optimization. Focus on content quality and link building strategies.`;
        }
        
        setAiSummary(summary);
      } catch (err) {
        console.error('Summary generation error:', err);
      } finally {
        setIsGeneratingSummary(false);
      }
    };
    
    generateSummary();
  }, [baselineSnapshot, auditData, isGeneratingSummary, aiSummary]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const hasHistory = historySnapshots.length > 1;
  const hasImprovements = baselineSnapshot && (
    (auditData.domainRating || 0) > (baselineSnapshot.domain_rating || 0) ||
    (auditData.organicTraffic || 0) > (Number(baselineSnapshot.organic_traffic) || 0) ||
    (auditData.backlinks || 0) > (Number(baselineSnapshot.backlinks) || 0)
  );

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
            <Globe className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{auditData.domain}</h2>
            <p className="text-sm text-muted-foreground">
              {savedAudit?.site_title || 'SEO Performance Report'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onNewAudit}>
            <Search className="w-4 h-4 mr-2" />
            New Audit
          </Button>
          <Button 
            onClick={onRefreshAudit}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Progress Summary Banner */}
      {baselineSnapshot && hasImprovements && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Progress tracked since {formatDate(baselineSnapshot.snapshot_at)}
              </p>
              <p className="text-xs text-muted-foreground">
                {historySnapshots.length} snapshots recorded
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main SEO Metrics Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          SEO Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricBox
            label="Domain Rating"
            value={auditData.domainRating}
            baseline={baselineSnapshot?.domain_rating}
            color="blue"
          />
          <MetricBox
            label="Organic Traffic"
            value={auditData.organicTraffic}
            baseline={baselineSnapshot?.organic_traffic ? Number(baselineSnapshot.organic_traffic) : undefined}
            color="green"
            suffix="/mo"
          />
          <MetricBox
            label="Keywords"
            value={auditData.organicKeywords}
            baseline={baselineSnapshot?.organic_keywords ? Number(baselineSnapshot.organic_keywords) : undefined}
            color="violet"
          />
          <MetricBox
            label="Backlinks"
            value={auditData.backlinks}
            baseline={baselineSnapshot?.backlinks ? Number(baselineSnapshot.backlinks) : undefined}
            color="amber"
          />
          <MetricBox
            label="Referring Domains"
            value={auditData.referringDomains}
            baseline={baselineSnapshot?.referring_domains ? Number(baselineSnapshot.referring_domains) : undefined}
            color="cyan"
          />
          <MetricBox
            label="Traffic Value"
            value={auditData.trafficValue}
            baseline={baselineSnapshot?.traffic_value ? Number(baselineSnapshot.traffic_value) : undefined}
            color="rose"
            prefix="$"
          />
        </div>
      </div>

      {/* Cross-Dashboard Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Visitor Intelligence Metrics */}
        {viMetrics && (
          <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Visitor Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Sessions</span>
                <span className="text-lg font-bold text-indigo-400">{viMetrics.sessions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Leads Captured</span>
                <span className="text-lg font-bold text-emerald-400">{viMetrics.leads}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Tool Interactions</span>
                <span className="text-lg font-bold text-amber-400">{viMetrics.toolInteractions}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Google Analytics Metrics */}
        {gaMetrics && (
          <Card className="bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-400" />
                Google Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Users</span>
                <span className="text-lg font-bold text-orange-400">{gaMetrics.users.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Page Views</span>
                <span className="text-lg font-bold text-rose-400">{gaMetrics.pageViews.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Bounce Rate</span>
                <span className="text-lg font-bold text-yellow-400">{gaMetrics.bounceRate.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Google Search Console Metrics */}
        {gscMetrics && (
          <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                Search Console
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Clicks</span>
                <span className="text-lg font-bold text-blue-400">{gscMetrics.clicks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Impressions</span>
                <span className="text-lg font-bold text-cyan-400">{gscMetrics.impressions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Avg. Position</span>
                <span className="text-lg font-bold text-teal-400">{gscMetrics.position.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Progress Summary */}
      {(aiSummary || isGeneratingSummary) && (
        <Card className="bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border-violet-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="w-4 h-4 text-violet-400" />
              AI Progress Analysis
              {isGeneratingSummary && (
                <div className="ml-2 w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiSummary ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {aiSummary.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={i} className="font-semibold text-foreground">{line.replace(/\*\*/g, '')}</p>;
                  }
                  if (line.startsWith('•')) {
                    return <p key={i} className="text-muted-foreground ml-4">{line}</p>;
                  }
                  if (line.startsWith('✅') || line.startsWith('⚠️') || line.startsWith('📈') || line.startsWith('📊')) {
                    return <p key={i} className="text-sm mt-2">{line}</p>;
                  }
                  return line ? <p key={i} className="text-sm text-muted-foreground">{line}</p> : null;
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Generating analysis...</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit History Timeline */}
      {historySnapshots.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Audit History
          </h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-4">
              {historySnapshots.slice().reverse().slice(0, 5).map((snapshot, index) => (
                <motion.div
                  key={snapshot.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-10"
                >
                  <div className={`absolute left-2 w-4 h-4 rounded-full ${
                    index === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`} />
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{formatDate(snapshot.snapshot_at)}</span>
                      <Badge variant="outline" className="text-xs">
                        {snapshot.source === 'auto' ? 'Scheduled' : 'Manual'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">DR: </span>
                        <span className="font-medium">{snapshot.domain_rating ?? '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Traffic: </span>
                        <span className="font-medium">{snapshot.organic_traffic?.toLocaleString() ?? '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Backlinks: </span>
                        <span className="font-medium">{snapshot.backlinks?.toLocaleString() ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Auto-saved badge */}
      <div className="text-center pt-4 border-t border-border/50">
        <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
          <Activity className="w-3 h-3 mr-1" />
          Auto-saved to your audits • Next refresh scheduled weekly
        </Badge>
      </div>
    </div>
  );
};

// Metric Box Component
interface MetricBoxProps {
  label: string;
  value: number | null;
  baseline?: number | null;
  color: 'blue' | 'green' | 'violet' | 'amber' | 'cyan' | 'rose';
  prefix?: string;
  suffix?: string;
}

const MetricBox = ({ label, value, baseline, color, prefix = '', suffix = '' }: MetricBoxProps) => {
  const colorClasses = {
    blue: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-400',
    green: 'from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-400',
    violet: 'from-violet-500/10 to-purple-500/10 border-violet-500/20 text-violet-400',
    amber: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400',
    cyan: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20 text-cyan-400',
    rose: 'from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-400',
  };

  const hasChange = baseline !== undefined && baseline !== null && value !== null && value !== baseline;
  const isPositive = hasChange && value! > baseline!;
  const diff = hasChange ? value! - baseline! : 0;

  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toLocaleString();
  };

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} border`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClasses[color].split(' ').pop()}`}>
        {prefix}{value !== null ? formatValue(value) : '—'}{suffix}
      </p>
      {hasChange && (
        <div className="mt-2">
          <div className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${
            isPositive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{formatValue(diff)}
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineSEOReport;
