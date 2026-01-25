import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  CheckCircle, Circle, ChevronDown, ChevronRight, Globe, Target,
  Plus, Trash2, DollarSign, Calendar, Zap, ArrowRight, RefreshCw,
  AlertCircle, Lightbulb, TrendingUp, Search, Tag
} from 'lucide-react';

// Google Ads icon component
const GoogleAdsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.32 8.45L3.85 22.52a3.36 3.36 0 01-2.89-1.65 3.33 3.33 0 01-.01-3.36L9.43 3.03a3.36 3.36 0 014.6 1.24 3.36 3.36 0 01-1.71 4.18z" fill="#FBBC04"/>
    <path d="M21.97 17.27a3.36 3.36 0 11-5.82 3.36 3.36 3.36 0 015.82-3.36z" fill="#4285F4"/>
    <path d="M12.32 8.45a3.36 3.36 0 01-2.89-5.42l8.47 14.58a3.35 3.35 0 012.89 5.01L12.32 8.45z" fill="#34A853"/>
  </svg>
);

interface GoogleAdsCampaignSetupWizardProps {
  domain: string;
  customerId: string;
  accessToken: string;
  onComplete: () => void;
  onCancel: () => void;
}

type SetupStep = 1 | 2 | 3 | 4;

interface KeywordEntry {
  id: string;
  text: string;
  matchType: 'BROAD' | 'PHRASE' | 'EXACT';
}

export function GoogleAdsCampaignSetupWizard({
  domain,
  customerId,
  accessToken,
  onComplete,
  onCancel,
}: GoogleAdsCampaignSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>(1);
  const [expandedStep, setExpandedStep] = useState<SetupStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [websiteUrl, setWebsiteUrl] = useState(domain ? `https://${domain}` : '');
  const [campaignName, setCampaignName] = useState(`${domain || 'My'} - PPC Campaign`);
  const [dailyBudget, setDailyBudget] = useState('50');
  const [keywords, setKeywords] = useState<KeywordEntry[]>([
    { id: '1', text: '', matchType: 'BROAD' },
  ]);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const addKeyword = () => {
    setKeywords(prev => [...prev, { id: Date.now().toString(), text: '', matchType: 'BROAD' }]);
  };

  const removeKeyword = (id: string) => {
    if (keywords.length > 1) {
      setKeywords(prev => prev.filter(k => k.id !== id));
    }
  };

  const updateKeyword = (id: string, updates: Partial<KeywordEntry>) => {
    setKeywords(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k));
  };

  const addSuggestedKeyword = (text: string) => {
    setKeywords(prev => [...prev, { id: Date.now().toString(), text, matchType: 'BROAD' }]);
    setSuggestedKeywords(prev => prev.filter(k => k !== text));
  };

  // Fetch keyword suggestions based on domain
  const fetchKeywordSuggestions = useCallback(async () => {
    if (!websiteUrl) return;
    
    setIsLoadingSuggestions(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-keywords', {
        body: {
          action: 'suggest-keywords',
          websiteUrl,
          accessToken,
        },
      });

      if (error) throw error;
      setSuggestedKeywords(data.suggestions || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      // Use demo suggestions as fallback
      const domainName = domain.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z]/g, ' ');
      setSuggestedKeywords([
        `${domainName} services`,
        `best ${domainName}`,
        `${domainName} near me`,
        `${domainName} company`,
        `professional ${domainName}`,
        `${domainName} solutions`,
      ]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [websiteUrl, accessToken, domain]);

  // Submit campaign setup
  const handleCreateCampaign = useCallback(async () => {
    const validKeywords = keywords.filter(k => k.text.trim());
    
    if (!websiteUrl.trim()) {
      toast.error('Please enter your website URL');
      return;
    }
    
    if (validKeywords.length === 0) {
      toast.error('Please add at least one keyword');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-keywords', {
        body: {
          action: 'create-campaign',
          accessToken,
          customerId,
          campaign: {
            name: campaignName,
            websiteUrl,
            dailyBudget: parseFloat(dailyBudget) || 50,
            keywords: validKeywords.map(k => ({
              text: k.text,
              matchType: k.matchType,
            })),
          },
        },
      });

      if (error) throw error;

      toast.success('Campaign created successfully!');
      setCurrentStep(4);
      setExpandedStep(4);
      
      // Notify parent after delay
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      toast.error(err.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  }, [accessToken, customerId, campaignName, websiteUrl, dailyBudget, keywords, onComplete]);

  const getStepStatus = (step: SetupStep) => {
    if (step < currentStep) return 'complete';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  const renderStepIcon = (step: SetupStep) => {
    const status = getStepStatus(step);
    if (status === 'complete') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (status === 'current') {
      return <Circle className="w-5 h-5 text-orange-500 fill-orange-500/20" />;
    }
    return <Circle className="w-5 h-5 text-muted-foreground" />;
  };

  const renderStepContent = (step: SetupStep) => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your website URL and campaign name to get started.
            </p>

            <div className="space-y-3">
              <div>
                <Label htmlFor="websiteUrl" className="text-sm font-medium">Website URL</Label>
                <div className="relative mt-1.5">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="websiteUrl"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="campaignName" className="text-sm font-medium">Campaign Name</Label>
                <div className="relative mt-1.5">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="campaignName"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="My PPC Campaign"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                if (!websiteUrl.trim()) {
                  toast.error('Please enter your website URL');
                  return;
                }
                setCurrentStep(2);
                setExpandedStep(2);
                fetchKeywordSuggestions();
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              Continue to Keywords
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add keywords that your customers might search for. We'll generate landing pages for each.
            </p>

            {/* Keyword entries */}
            <div className="space-y-2">
              {keywords.map((kw, index) => (
                <div key={kw.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      value={kw.text}
                      onChange={(e) => updateKeyword(kw.id, { text: e.target.value })}
                      placeholder={`Keyword ${index + 1}`}
                    />
                  </div>
                  <select
                    value={kw.matchType}
                    onChange={(e) => updateKeyword(kw.id, { matchType: e.target.value as KeywordEntry['matchType'] })}
                    className="h-9 px-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="BROAD">Broad</option>
                    <option value="PHRASE">Phrase</option>
                    <option value="EXACT">Exact</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeKeyword(kw.id)}
                    disabled={keywords.length === 1}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addKeyword}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Keyword
              </Button>
            </div>

            {/* Suggested keywords */}
            {(suggestedKeywords.length > 0 || isLoadingSuggestions) && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Suggested Keywords</span>
                </div>
                {isLoadingSuggestions ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Loading suggestions...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {suggestedKeywords.slice(0, 6).map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => addSuggestedKeyword(suggestion)}
                        className="px-2 py-1 text-xs rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                      >
                        <Plus className="w-3 h-3 inline mr-1" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(1);
                  setExpandedStep(1);
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  const validKeywords = keywords.filter(k => k.text.trim());
                  if (validKeywords.length === 0) {
                    toast.error('Please add at least one keyword');
                    return;
                  }
                  setCurrentStep(3);
                  setExpandedStep(3);
                }}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                Set Budget
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set your daily budget. You can adjust this anytime in Google Ads.
            </p>

            <div>
              <Label htmlFor="dailyBudget" className="text-sm font-medium">Daily Budget (USD)</Label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="dailyBudget"
                  type="number"
                  min="1"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                  placeholder="50"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Estimated monthly spend: ${(parseFloat(dailyBudget || '0') * 30.4).toFixed(2)}
              </p>
            </div>

            {/* Campaign summary */}
            <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-3">
              <h4 className="font-medium text-sm">Campaign Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Website</span>
                  <span className="font-medium">{websiteUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Campaign</span>
                  <span className="font-medium">{campaignName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Keywords</span>
                  <span className="font-medium">{keywords.filter(k => k.text.trim()).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Budget</span>
                  <span className="font-medium text-green-500">${dailyBudget}/day</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(2);
                  setExpandedStep(2);
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateCampaign}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Create Campaign
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-lg">Campaign Created!</p>
              <p className="text-sm text-muted-foreground">
                Your Google Ads campaign is now active. We'll start generating landing pages for your keywords.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
              <span className="text-sm text-muted-foreground">Importing keywords...</span>
            </div>
          </div>
        );
    }
  };

  const steps = [
    { number: 1, title: 'Website & Campaign', desc: 'Enter your details' },
    { number: 2, title: 'Add Keywords', desc: 'Choose target keywords' },
    { number: 3, title: 'Set Budget', desc: 'Configure daily spend' },
    { number: 4, title: 'Launch', desc: 'Start your campaign' },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
          <GoogleAdsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Set Up Google Ads Campaign</h3>
          <p className="text-sm text-muted-foreground">
            No active campaigns found. Let's create one for <span className="text-primary font-medium">{domain}</span>
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <Progress value={(currentStep / 4) * 100} className="h-2" />
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`text-xs ${
                getStepStatus(step.number as SetupStep) === 'current' ? 'text-orange-500 font-medium' :
                getStepStatus(step.number as SetupStep) === 'complete' ? 'text-green-500' :
                'text-muted-foreground'
              }`}
            >
              Step {step.number}
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => {
          const isExpanded = expandedStep === step.number;
          const status = getStepStatus(step.number as SetupStep);

          return (
            <Collapsible
              key={step.number}
              open={isExpanded}
              onOpenChange={() => {
                if (status !== 'upcoming') {
                  setExpandedStep(step.number as SetupStep);
                }
              }}
            >
              <CollapsibleTrigger
                className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
                  status === 'current' ? 'border-orange-500/50 bg-orange-500/5' :
                  status === 'complete' ? 'border-green-500/30 bg-green-500/5' :
                  'border-border bg-muted/20 opacity-60'
                }`}
                disabled={status === 'upcoming'}
              >
                <div className="flex items-center gap-3">
                  {renderStepIcon(step.number as SetupStep)}
                  <div className="text-left">
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
                {status !== 'upcoming' && (
                  isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>

              <CollapsibleContent className="pt-4 px-4 pb-0">
                {renderStepContent(step.number as SetupStep)}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Cancel */}
      {currentStep < 4 && (
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
            Cancel Setup
          </Button>
        </div>
      )}
    </div>
  );
}

export default GoogleAdsCampaignSetupWizard;
