import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Target, FileText, FlaskConical, TrendingUp, X, CheckCircle,
  RefreshCw, Zap, BarChart3, Eye, MousePointer, ArrowRight,
  ExternalLink, Flame, Layers
} from 'lucide-react';
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
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12.32 8.45L3.85 22.52a3.36 3.36 0 01-2.89-1.65 3.33 3.33 0 01-.01-3.36L9.43 3.03a3.36 3.36 0 014.6 1.24 3.36 3.36 0 01-1.71 4.18z" fill="#FBBC04"/>
    <path d="M21.97 17.27a3.36 3.36 0 11-5.82 3.36 3.36 3.36 0 015.82-3.36z" fill="#4285F4"/>
    <path d="M12.32 8.45a3.36 3.36 0 01-2.89-5.42l8.47 14.58a3.35 3.35 0 012.89 5.01L12.32 8.45z" fill="#34A853"/>
  </svg>
);

export function LandingPagesPanel({ selectedDomain }: LandingPagesPanelProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [isFetchingKeywords, setIsFetchingKeywords] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [summary, setSummary] = useState<KeywordSummary | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [generatedPages, setGeneratedPages] = useState<any[]>([]);
  const [connectedCustomerId, setConnectedCustomerId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const GOOGLE_ADS_SCOPES = 'https://www.googleapis.com/auth/adwords';

  // Handle wizard completion
  const handleWizardComplete = useCallback((customerId: string, token: string) => {
    setConnectedCustomerId(customerId);
    setAccessToken(token);
    setIsConnected(true);
    setShowWizard(false);
    
    // Auto-fetch keywords after connection
    handleFetchKeywordsWithToken(token, customerId);
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
    
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-keywords', {
        body: {
          action: 'get-keywords',
          accessToken: token,
          customerId: customerId,
        },
      });

      if (error) throw error;

      setKeywords(data.keywords || []);
      setSummary(data.summary || null);
      
      if (data.isDemo) {
        toast.info('Demo mode - Google Ads API developer token required for live data');
      }
    } catch (err) {
      console.error('Error fetching keywords:', err);
      toast.error('Failed to fetch keywords');
    } finally {
      setIsFetchingKeywords(false);
    }
  }, []);

  // Fetch keywords with demo data
  const handleFetchKeywords = useCallback(async () => {
    setIsFetchingKeywords(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-keywords', {
        body: {
          action: 'get-keywords',
          accessToken: accessToken || 'demo-token',
          customerId: connectedCustomerId || 'demo-customer',
        },
      });

      if (error) throw error;

      setKeywords(data.keywords || []);
      setSummary(data.summary || null);
      
      if (data.isDemo) {
        toast.info('Showing demo data - Connect Google Ads API for live keywords');
      }
    } catch (err) {
      console.error('Error fetching keywords:', err);
      toast.error('Failed to fetch keywords');
    } finally {
      setIsFetchingKeywords(false);
    }
  }, [accessToken, connectedCustomerId]);

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
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shrink-0">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">PPC Landing Pages</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Import keywords from Google Ads, generate optimized landing pages, and boost your Quality Score with built-in A/B testing and heat tracking.
            </p>
          </div>
        </div>

        {selectedDomain && (
          <div className="md:pt-1">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
              Domain: {selectedDomain}
            </Badge>
          </div>
        )}
      </header>

      {/* Show Wizard when connecting */}
      {showWizard ? (
        <GoogleAdsOnboardingWizard
          domain={selectedDomain || ''}
          onComplete={handleWizardComplete}
          onSkip={handleSkipWizard}
        />
      ) : !isConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
              {[
                { icon: FileText, label: 'Bulk Page Generation', desc: '1,000s of keyword-specific pages', color: 'text-orange-500' },
                { icon: FlaskConical, label: 'A/B Testing', desc: 'Headlines, CTAs & layouts', color: 'text-amber-500' },
                { icon: Flame, label: 'Heat Tracking', desc: 'Click & scroll analytics', color: 'text-red-500' },
              ].map((feature) => (
                <div key={feature.label} className="p-4 rounded-xl bg-muted/30 border border-border">
                  <feature.icon className={`w-6 h-6 ${feature.color} mb-2`} />
                  <p className="font-medium text-sm">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Connect Button */}
            <div className="p-6 rounded-xl border-2 border-dashed border-orange-500/30 bg-orange-500/5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <GoogleAdsIcon />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">Connect Google Ads</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Import your active PPC keywords and generate optimized landing pages automatically.
                  </p>
                  <Button
                    onClick={handleStartConnection}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  >
                    <GoogleAdsIcon />
                    <span className="ml-2">Connect Google Ads Account</span>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    We only request read access to your keyword data
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="lg:col-span-7">
            <h3 className="text-lg font-semibold mb-4">How It Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { step: '1', title: 'Connect Google Ads', desc: 'Securely link your account' },
                { step: '2', title: 'Import Keywords', desc: 'Auto-pull active PPC keywords' },
                { step: '3', title: 'Generate Pages', desc: 'AI creates optimized pages' },
                { step: '4', title: 'Track & Optimize', desc: 'A/B test with heat maps' },
              ].map((item) => (
                <div key={item.step} className="relative p-4 rounded-xl bg-gradient-to-br from-orange-500/5 to-amber-500/5 border border-orange-500/20">
                  <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                    {item.step}
                  </div>
                  <p className="font-medium text-sm mt-2">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
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
              <div className="flex items-center gap-2 justify-end">
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
              <div className="text-center py-12 text-muted-foreground">
                No keywords found. Make sure you have active campaigns in Google Ads.
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
