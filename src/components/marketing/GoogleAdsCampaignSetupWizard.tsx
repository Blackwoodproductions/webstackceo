import { useState, useCallback, useEffect } from 'react';
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
  AlertCircle, Lightbulb, TrendingUp, Search, Tag, Building, User, ExternalLink
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

type SetupStep = 0 | 1 | 2 | 3 | 4;

interface KeywordEntry {
  id: string;
  text: string;
  matchType: 'BROAD' | 'PHRASE' | 'EXACT';
}

interface AdsAccount {
  customerId: string;
  descriptiveName: string;
  currencyCode: string;
}

export function GoogleAdsCampaignSetupWizard({
  domain,
  customerId: initialCustomerId,
  accessToken,
  onComplete,
  onCancel,
}: GoogleAdsCampaignSetupWizardProps) {
  // Start at step 0 (account selection) if no valid customer ID
  const hasValidCustomerId = initialCustomerId && initialCustomerId !== 'unified-auth' && initialCustomerId.match(/^\d{3}-?\d{3}-?\d{4}$/);
  const [currentStep, setCurrentStep] = useState<SetupStep>(hasValidCustomerId ? 1 : 0);
  const [expandedStep, setExpandedStep] = useState<SetupStep>(hasValidCustomerId ? 1 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Account selection state (Step 0)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<AdsAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AdsAccount | null>(null);
  const [manualCustomerId, setManualCustomerId] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [verifiedCustomerId, setVerifiedCustomerId] = useState<string>(hasValidCustomerId ? initialCustomerId : '');
  
  // Form state
  const [websiteUrl, setWebsiteUrl] = useState(domain ? `https://${domain}` : '');
  const [campaignName, setCampaignName] = useState(`${domain || 'My'} - PPC Campaign`);
  const [dailyBudget, setDailyBudget] = useState('50');
  const [keywords, setKeywords] = useState<KeywordEntry[]>([
    { id: '1', text: '', matchType: 'BROAD' },
  ]);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Fetch available Google Ads accounts on mount (Step 0)
  const fetchAdsAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    setAccountError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-keywords', {
        body: {
          action: 'list-accounts',
          accessToken,
        },
      });

      if (error) throw error;
      
      if (data.accounts && data.accounts.length > 0) {
        setAvailableAccounts(data.accounts);
        // Auto-select if only one account
        if (data.accounts.length === 1) {
          setSelectedAccount(data.accounts[0]);
        }
      } else {
        // No accounts found - show manual entry
        setShowManualEntry(true);
        setAccountError('No Google Ads accounts found. Enter your Customer ID manually or create a new account.');
      }
    } catch (err: any) {
      console.error('Error fetching Ads accounts:', err);
      setShowManualEntry(true);
      setAccountError('Could not fetch accounts automatically. Please enter your Customer ID.');
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [accessToken]);

  // Load accounts when starting at step 0
  useEffect(() => {
    if (currentStep === 0 && !isLoadingAccounts && availableAccounts.length === 0 && !showManualEntry) {
      fetchAdsAccounts();
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate and verify customer ID format
  const validateCustomerId = (id: string): string | null => {
    // Remove dashes for validation
    const cleanId = id.replace(/-/g, '');
    if (!/^\d{10}$/.test(cleanId)) {
      return 'Customer ID must be 10 digits (e.g., 123-456-7890)';
    }
    return null;
  };

  // Handle account selection and proceed
  const handleAccountConfirm = useCallback(async () => {
    let customerId = '';
    
    if (selectedAccount) {
      customerId = selectedAccount.customerId;
    } else if (manualCustomerId) {
      const error = validateCustomerId(manualCustomerId);
      if (error) {
        setAccountError(error);
        return;
      }
      customerId = manualCustomerId.replace(/-/g, '');
    } else {
      setAccountError('Please select an account or enter a Customer ID');
      return;
    }
    
    // Store the verified customer ID
    setVerifiedCustomerId(customerId);
    localStorage.setItem('google_ads_customer_id', customerId);
    
    // Proceed to step 1
    setCurrentStep(1);
    setExpandedStep(1);
  }, [selectedAccount, manualCustomerId]);

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
    const finalCustomerId = verifiedCustomerId || initialCustomerId;
    
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
          customerId: finalCustomerId,
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
  }, [accessToken, verifiedCustomerId, initialCustomerId, campaignName, websiteUrl, dailyBudget, keywords, onComplete]);

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
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Google Ads account to manage campaigns for <span className="text-primary font-medium">{domain}</span>.
            </p>

            {/* Loading state */}
            {isLoadingAccounts && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mr-3" />
                <span className="text-muted-foreground">Finding your Google Ads accounts...</span>
              </div>
            )}

            {/* Account selection */}
            {!isLoadingAccounts && availableAccounts.length > 0 && !showManualEntry && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Google Ads Account</Label>
                <div className="space-y-2">
                  {availableAccounts.map((account) => (
                    <button
                      key={account.customerId}
                      onClick={() => setSelectedAccount(account)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        selectedAccount?.customerId === account.customerId
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-border hover:border-orange-500/50 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedAccount?.customerId === account.customerId
                            ? 'bg-orange-500'
                            : 'bg-muted'
                        }`}>
                          <Building className={`w-5 h-5 ${
                            selectedAccount?.customerId === account.customerId
                              ? 'text-white'
                              : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{account.descriptiveName || 'Unnamed Account'}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {account.customerId.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')} • {account.currencyCode || 'USD'}
                          </p>
                        </div>
                        {selectedAccount?.customerId === account.customerId && (
                          <CheckCircle className="w-5 h-5 text-orange-500 ml-auto" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="text-sm text-muted-foreground hover:text-primary underline"
                >
                  Enter Customer ID manually instead
                </button>
              </div>
            )}

            {/* Manual entry */}
            {!isLoadingAccounts && (showManualEntry || availableAccounts.length === 0) && (
              <div className="space-y-4">
                {accountError && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-amber-500">{accountError}</span>
                  </div>
                )}

                <div>
                  <Label htmlFor="customerId" className="text-sm font-medium">Google Ads Customer ID</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="customerId"
                      value={manualCustomerId}
                      onChange={(e) => {
                        // Auto-format with dashes
                        const value = e.target.value.replace(/[^0-9-]/g, '');
                        setManualCustomerId(value);
                        setAccountError(null);
                      }}
                      placeholder="123-456-7890"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Find this in your Google Ads account settings (10-digit number)
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <p className="text-sm font-medium mb-2">Don't have a Google Ads account?</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Create one for free to start running PPC campaigns.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://ads.google.com/home/signup/', '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Create Google Ads Account
                  </Button>
                </div>

                {availableAccounts.length > 0 && (
                  <button
                    onClick={() => setShowManualEntry(false)}
                    className="text-sm text-muted-foreground hover:text-primary underline"
                  >
                    ← Back to account selection
                  </button>
                )}
              </div>
            )}

            {/* Continue button */}
            {!isLoadingAccounts && (
              <Button
                onClick={handleAccountConfirm}
                disabled={!selectedAccount && !manualCustomerId}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50"
              >
                Continue with this Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        );

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

  // Include Step 0 only if user needs to select an account
  const allSteps = [
    { number: 0, title: 'Connect Account', desc: 'Select Google Ads account' },
    { number: 1, title: 'Website & Campaign', desc: 'Enter your details' },
    { number: 2, title: 'Add Keywords', desc: 'Choose target keywords' },
    { number: 3, title: 'Set Budget', desc: 'Configure daily spend' },
    { number: 4, title: 'Launch', desc: 'Start your campaign' },
  ];
  
  // Filter to only show Step 0 if we started there (no valid customer ID)
  const steps = hasValidCustomerId 
    ? allSteps.filter(s => s.number !== 0) 
    : allSteps;
  
  const totalSteps = steps.length;
  const currentStepIndex = steps.findIndex(s => s.number === currentStep);
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
          <GoogleAdsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            {currentStep === 0 ? 'Connect Google Ads Account' : 'Set Up Google Ads Campaign'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {currentStep === 0 
              ? <>Link your Google Ads account to manage campaigns for <span className="text-primary font-medium">{domain}</span></>
              : <>Creating campaign for <span className="text-primary font-medium">{domain}</span></>
            }
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`text-xs ${
                getStepStatus(step.number as SetupStep) === 'current' ? 'text-orange-500 font-medium' :
                getStepStatus(step.number as SetupStep) === 'complete' ? 'text-green-500' :
                'text-muted-foreground'
              }`}
            >
              Step {index + 1}
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
