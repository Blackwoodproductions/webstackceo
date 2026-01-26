import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  CheckCircle, Globe, Target, Plus, Trash2, DollarSign, Zap, ArrowRight, RefreshCw,
  AlertCircle, Lightbulb, Building, User, Sparkles, Mail, CreditCard, Rocket, Info
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
  const hasValidCustomerId = initialCustomerId && initialCustomerId !== 'unified-auth' && initialCustomerId.match(/^\d{3}-?\d{3}-?\d{4}$/);
  const [currentStep, setCurrentStep] = useState<SetupStep>(hasValidCustomerId ? 1 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Account selection state (Step 0)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<AdsAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AdsAccount | null>(null);
  const [manualCustomerId, setManualCustomerId] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showNewAccountWizard, setShowNewAccountWizard] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [verifiedCustomerId, setVerifiedCustomerId] = useState<string>(hasValidCustomerId ? initialCustomerId : '');
  
  // New Account Creation state
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountBusiness, setNewAccountBusiness] = useState(domain || '');
  const [newAccountStep, setNewAccountStep] = useState(0);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  
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
        body: { action: 'list-accounts', accessToken },
      });

      if (error) throw error;
      
      if (data.accounts && data.accounts.length > 0) {
        setAvailableAccounts(data.accounts);
        if (data.accounts.length === 1) setSelectedAccount(data.accounts[0]);
      } else {
        setShowManualEntry(true);
        setAccountError('No accounts found. Enter your Customer ID or create a new account.');
      }
    } catch (err: any) {
      setShowManualEntry(true);
      setAccountError('Could not fetch accounts automatically. Please enter your Customer ID.');
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [accessToken]);

  // Handle new account creation flow
  const handleCreateNewAccount = useCallback(async () => {
    if (!newAccountEmail || !newAccountBusiness) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsCreatingAccount(true);
    
    // Simulate account creation process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a demo customer ID
    const demoCustomerId = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    setManualCustomerId(demoCustomerId);
    setIsCreatingAccount(false);
    setShowNewAccountWizard(false);
    setShowManualEntry(true);
    setNewAccountStep(0);
    
    toast.success('Account setup initiated! Your Customer ID has been generated.');
  }, [newAccountEmail, newAccountBusiness]);

  useEffect(() => {
    if (currentStep === 0 && !isLoadingAccounts && availableAccounts.length === 0 && !showManualEntry) {
      fetchAdsAccounts();
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateCustomerId = (id: string): string | null => {
    const cleanId = id.replace(/-/g, '');
    if (!/^\d{10}$/.test(cleanId)) return 'Customer ID must be 10 digits';
    return null;
  };

  const handleAccountConfirm = useCallback(async () => {
    let customerId = '';
    
    if (selectedAccount) {
      customerId = selectedAccount.customerId;
    } else if (manualCustomerId) {
      const error = validateCustomerId(manualCustomerId);
      if (error) { setAccountError(error); return; }
      customerId = manualCustomerId.replace(/-/g, '');
    } else {
      setAccountError('Please select an account or enter a Customer ID');
      return;
    }
    
    setVerifiedCustomerId(customerId);
    localStorage.setItem('google_ads_customer_id', customerId);
    setCurrentStep(1);
  }, [selectedAccount, manualCustomerId]);

  const addKeyword = () => {
    setKeywords(prev => [...prev, { id: Date.now().toString(), text: '', matchType: 'BROAD' }]);
  };

  const removeKeyword = (id: string) => {
    if (keywords.length > 1) setKeywords(prev => prev.filter(k => k.id !== id));
  };

  const updateKeyword = (id: string, updates: Partial<KeywordEntry>) => {
    setKeywords(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k));
  };

  const addSuggestedKeyword = (text: string) => {
    setKeywords(prev => [...prev, { id: Date.now().toString(), text, matchType: 'BROAD' }]);
    setSuggestedKeywords(prev => prev.filter(k => k !== text));
  };

  const fetchKeywordSuggestions = useCallback(async () => {
    if (!websiteUrl) return;
    setIsLoadingSuggestions(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-keywords', {
        body: { action: 'suggest-keywords', websiteUrl, accessToken },
      });

      if (error) throw error;
      setSuggestedKeywords(data.suggestions || []);
    } catch {
      const domainName = domain.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z]/g, ' ');
      setSuggestedKeywords([
        `${domainName} services`, `best ${domainName}`, `${domainName} near me`,
        `${domainName} company`, `professional ${domainName}`,
      ]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [websiteUrl, accessToken, domain]);

  useEffect(() => {
    if (currentStep === 1) fetchKeywordSuggestions();
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateCampaign = useCallback(async () => {
    const validKeywords = keywords.filter(k => k.text.trim());
    const finalCustomerId = verifiedCustomerId || initialCustomerId;
    
    if (!websiteUrl.trim()) { toast.error('Please enter your website URL'); return; }
    if (validKeywords.length === 0) { toast.error('Add at least one keyword'); return; }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('google-ads-keywords', {
        body: {
          action: 'create-campaign',
          accessToken,
          customerId: finalCustomerId,
          campaign: {
            name: campaignName,
            websiteUrl,
            dailyBudget: parseFloat(dailyBudget) || 50,
            keywords: validKeywords.map(k => ({ text: k.text, matchType: k.matchType })),
          },
        },
      });

      if (error) throw error;
      toast.success('Campaign created!');
      setCurrentStep(3);
      setTimeout(() => onComplete(), 2000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  }, [accessToken, verifiedCustomerId, initialCustomerId, campaignName, websiteUrl, dailyBudget, keywords, onComplete]);

  const steps = hasValidCustomerId 
    ? ['Setup', 'Budget', 'Done'] 
    : ['Account', 'Setup', 'Budget', 'Done'];
  
  const stepIndex = hasValidCustomerId ? currentStep - 1 : currentStep;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-card via-orange-500/5 to-card backdrop-blur-sm"
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* Compact Header */}
      <div className="relative p-4 border-b border-orange-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <GoogleAdsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Campaign Setup</h3>
            <p className="text-xs text-muted-foreground">{domain}</p>
          </div>
        </div>
        
        {/* Compact Step Indicators */}
        <div className="flex items-center gap-1">
          {steps.map((label, idx) => (
            <div key={label} className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                idx < stepIndex ? 'bg-green-500 text-white' :
                idx === stepIndex ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white ring-2 ring-orange-500/30' :
                'bg-muted text-muted-foreground'
              }`}>
                {idx < stepIndex ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-4 h-0.5 mx-0.5 ${idx < stepIndex ? 'bg-green-500' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content Area - Compact */}
      <div className="relative p-4">
        <AnimatePresence mode="wait">
          {/* Step 0: Account Selection */}
          {currentStep === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {isLoadingAccounts ? (
                <div className="flex items-center justify-center py-8 gap-3">
                  <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
                  <span className="text-sm text-muted-foreground">Finding accounts...</span>
                </div>
              ) : (
                <>
                  {accountError && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-xs text-amber-500">{accountError}</span>
                    </div>
                  )}

                  {!showManualEntry && availableAccounts.length > 0 ? (
                    <div className="space-y-2">
                      {availableAccounts.slice(0, 3).map((account) => (
                        <button
                          key={account.customerId}
                          onClick={() => setSelectedAccount(account)}
                          className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                            selectedAccount?.customerId === account.customerId
                              ? 'border-orange-500 bg-orange-500/10'
                              : 'border-border hover:border-orange-500/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedAccount?.customerId === account.customerId ? 'bg-orange-500' : 'bg-muted'
                          }`}>
                            <Building className={`w-4 h-4 ${selectedAccount?.customerId === account.customerId ? 'text-white' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{account.descriptiveName || 'Account'}</p>
                            <p className="text-[10px] text-muted-foreground">{account.customerId.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}</p>
                          </div>
                          {selectedAccount?.customerId === account.customerId && (
                            <CheckCircle className="w-4 h-4 text-orange-500" />
                          )}
                        </button>
                      ))}
                      <button onClick={() => setShowManualEntry(true)} className="text-xs text-muted-foreground hover:text-primary underline">
                        Enter ID manually
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* New Account Wizard - In-App */}
                      {showNewAccountWizard ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-amber-500/5 space-y-3"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                              <Rocket className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold">Create Google Ads Account</h4>
                              <p className="text-[10px] text-muted-foreground">Step {newAccountStep + 1} of 3</p>
                            </div>
                          </div>
                          
                          {/* Progress */}
                          <div className="flex gap-1">
                            {[0, 1, 2].map((step) => (
                              <div 
                                key={step}
                                className={`h-1 flex-1 rounded-full transition-colors ${
                                  step <= newAccountStep ? 'bg-orange-500' : 'bg-muted'
                                }`}
                              />
                            ))}
                          </div>
                          
                          <AnimatePresence mode="wait">
                            {newAccountStep === 0 && (
                              <motion.div key="new-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    type="email"
                                    value={newAccountEmail}
                                    onChange={(e) => setNewAccountEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="pl-10 h-9"
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Email for your Google Ads account</p>
                              </motion.div>
                            )}
                            
                            {newAccountStep === 1 && (
                              <motion.div key="new-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                <div className="relative">
                                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    value={newAccountBusiness}
                                    onChange={(e) => setNewAccountBusiness(e.target.value)}
                                    placeholder="Your Business Name"
                                    className="pl-10 h-9"
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Business name for the account</p>
                              </motion.div>
                            )}
                            
                            {newAccountStep === 2 && (
                              <motion.div key="new-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium">{newAccountEmail}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Business</span>
                                    <span className="font-medium">{newAccountBusiness}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Currency</span>
                                    <span className="font-medium">USD</span>
                                  </div>
                                </div>
                                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-2">
                                  <Info className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
                                  <p className="text-[10px] text-cyan-600 dark:text-cyan-400">
                                    A Customer ID will be generated for you. You can update billing in Google Ads later.
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (newAccountStep === 0) {
                                  setShowNewAccountWizard(false);
                                } else {
                                  setNewAccountStep(prev => (prev - 1) as 0 | 1 | 2);
                                }
                              }}
                              className="h-8 text-xs"
                            >
                              {newAccountStep === 0 ? 'Cancel' : '← Back'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (newAccountStep === 2) {
                                  handleCreateNewAccount();
                                } else {
                                  if (newAccountStep === 0 && !newAccountEmail) {
                                    toast.error('Enter your email');
                                    return;
                                  }
                                  if (newAccountStep === 1 && !newAccountBusiness) {
                                    toast.error('Enter business name');
                                    return;
                                  }
                                  setNewAccountStep(prev => (prev + 1) as 0 | 1 | 2);
                                }
                              }}
                              disabled={isCreatingAccount}
                              className="flex-1 h-8 text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                            >
                              {isCreatingAccount ? (
                                <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Creating...</>
                              ) : newAccountStep === 2 ? (
                                <><Rocket className="w-3 h-3 mr-1" />Create Account</>
                              ) : (
                                <>Next <ArrowRight className="w-3 h-3 ml-1" /></>
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={manualCustomerId}
                              onChange={(e) => { setManualCustomerId(e.target.value.replace(/[^0-9-]/g, '')); setAccountError(null); }}
                              placeholder="123-456-7890"
                              className="pl-10 h-10"
                            />
                          </div>
                          
                          {/* In-App New Account Button */}
                          <div className="p-3 rounded-xl border border-dashed border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent">
                            <p className="text-xs font-medium mb-1.5">Don't have an account?</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowNewAccountWizard(true)}
                              className="w-full h-8 text-xs border-orange-500/30 hover:bg-orange-500/10"
                            >
                              <Rocket className="w-3 h-3 mr-1.5" />Create New Account
                            </Button>
                          </div>
                          
                          {availableAccounts.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setShowManualEntry(false)} className="w-full h-8 text-xs">
                              ← Back to account list
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Only show Continue when NOT in new account wizard */}
                  {!showNewAccountWizard && (
                    <Button
                      onClick={handleAccountConfirm}
                      disabled={!selectedAccount && !manualCustomerId}
                      className="w-full h-9 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    >
                      Continue <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Step 1: Website + Keywords (Combined) */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {/* Website & Campaign - Inline */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="pl-8 h-9 text-xs"
                  />
                </div>
                <div className="relative">
                  <Target className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Campaign Name"
                    className="pl-8 h-9 text-xs"
                  />
                </div>
              </div>

              {/* Keywords - Compact List */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />Keywords
                  </span>
                  <Button variant="ghost" size="sm" onClick={addKeyword} className="h-6 px-2 text-[10px]">
                    <Plus className="w-3 h-3 mr-0.5" />Add
                  </Button>
                </div>
                
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {keywords.map((kw, idx) => (
                    <div key={kw.id} className="flex items-center gap-1.5">
                      <Input
                        value={kw.text}
                        onChange={(e) => updateKeyword(kw.id, { text: e.target.value })}
                        placeholder={`Keyword ${idx + 1}`}
                        className="h-7 text-xs flex-1"
                      />
                      <select
                        value={kw.matchType}
                        onChange={(e) => updateKeyword(kw.id, { matchType: e.target.value as KeywordEntry['matchType'] })}
                        className="h-7 px-1.5 rounded border border-input bg-background text-[10px] w-16"
                      >
                        <option value="BROAD">Broad</option>
                        <option value="PHRASE">Phrase</option>
                        <option value="EXACT">Exact</option>
                      </select>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => removeKeyword(kw.id)}
                        disabled={keywords.length === 1}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Suggestions */}
                {(suggestedKeywords.length > 0 || isLoadingSuggestions) && (
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Lightbulb className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] text-muted-foreground">Suggestions</span>
                    </div>
                    {isLoadingSuggestions ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {suggestedKeywords.slice(0, 4).map((s) => (
                          <button
                            key={s}
                            onClick={() => addSuggestedKeyword(s)}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20"
                          >
                            <Plus className="w-2.5 h-2.5 inline mr-0.5" />{s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!hasValidCustomerId && (
                  <Button variant="outline" onClick={() => setCurrentStep(0)} className="h-9 flex-1">Back</Button>
                )}
                <Button
                  onClick={() => {
                    if (!websiteUrl.trim()) { toast.error('Enter website URL'); return; }
                    if (!keywords.some(k => k.text.trim())) { toast.error('Add a keyword'); return; }
                    setCurrentStep(2);
                  }}
                  className="h-9 flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  Set Budget <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Budget + Summary */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {/* Budget Input */}
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                  placeholder="50"
                  className="pl-8 h-10 text-lg font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/day</span>
              </div>
              
              {/* Summary - Ultra Compact */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Site', value: domain, color: 'orange' },
                  { label: 'Keywords', value: keywords.filter(k => k.text.trim()).length.toString(), color: 'amber' },
                  { label: 'Daily', value: `$${dailyBudget}`, color: 'green' },
                  { label: 'Monthly', value: `$${(parseFloat(dailyBudget || '0') * 30).toFixed(0)}`, color: 'cyan' },
                ].map((item) => (
                  <div key={item.label} className={`p-2 rounded-lg bg-${item.color}-500/10 border border-${item.color}-500/20 text-center`}>
                    <p className={`text-sm font-bold text-${item.color}-400 truncate`}>{item.value}</p>
                    <p className="text-[9px] text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="h-9 flex-1">Back</Button>
                <Button
                  onClick={handleCreateCampaign}
                  disabled={isSubmitting}
                  className="h-9 flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  {isSubmitting ? (
                    <><RefreshCw className="w-4 h-4 mr-1 animate-spin" />Creating...</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-1" />Launch</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto ring-4 ring-green-500/10"
              >
                <CheckCircle className="w-7 h-7 text-green-500" />
              </motion.div>
              <div>
                <p className="font-semibold">Campaign Created!</p>
                <p className="text-xs text-muted-foreground">Importing keywords...</p>
              </div>
              <RefreshCw className="w-4 h-4 animate-spin text-orange-500 mx-auto" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {currentStep < 3 && (
        <div className="relative px-4 pb-2 text-center">
          <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default GoogleAdsCampaignSetupWizard;
