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
  CheckCircle, Circle, ChevronDown, ChevronRight, ExternalLink,
  RefreshCw, Key, Building2, Link2, FileText, ArrowRight, Copy,
  AlertCircle, Hash, Info
} from 'lucide-react';

// Google Ads icon component
const GoogleAdsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.32 8.45L3.85 22.52a3.36 3.36 0 01-2.89-1.65 3.33 3.33 0 01-.01-3.36L9.43 3.03a3.36 3.36 0 014.6 1.24 3.36 3.36 0 01-1.71 4.18z" fill="#FBBC04"/>
    <path d="M21.97 17.27a3.36 3.36 0 11-5.82 3.36 3.36 3.36 0 015.82-3.36z" fill="#4285F4"/>
    <path d="M12.32 8.45a3.36 3.36 0 01-2.89-5.42l8.47 14.58a3.35 3.35 0 012.89 5.01L12.32 8.45z" fill="#34A853"/>
  </svg>
);

interface GoogleAdsCustomer {
  id: string;
  name: string;
  currencyCode: string;
}

interface GoogleAdsOnboardingWizardProps {
  domain: string;
  onComplete: (customerId: string, accessToken: string) => void;
  onSkip?: () => void;
}

type WizardStep = 1 | 2 | 3 | 4;

export function GoogleAdsOnboardingWizard({ 
  domain, 
  onComplete,
  onSkip 
}: GoogleAdsOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [expandedStep, setExpandedStep] = useState<WizardStep>(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [customers, setCustomers] = useState<GoogleAdsCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<GoogleAdsCustomer | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [manualCustomerId, setManualCustomerId] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const GOOGLE_ADS_SCOPES = [
    'https://www.googleapis.com/auth/adwords',
    'openid',
    'profile',
    'email'
  ].join(' ');

  // Get client ID from localStorage (reusing GSC/GA credentials) or env
  const getClientId = useCallback(() => {
    return localStorage.getItem('gsc_client_id') || 
           localStorage.getItem('ga_client_id') || 
           import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  }, []);

  // Generate code verifier and challenge for PKCE
  const generatePKCE = useCallback(async () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const codeVerifier = Array.from(array, (byte) => 
      byte.toString(16).padStart(2, '0')
    ).join('');
    
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    const codeChallenge = btoa(String.fromCharCode(...hashArray))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return { codeVerifier, codeChallenge };
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const storedState = sessionStorage.getItem('google_ads_oauth_state');
      const codeVerifier = sessionStorage.getItem('google_ads_code_verifier');
      const returnTab = sessionStorage.getItem('google_ads_return_tab');

      if (code && state && state === storedState && codeVerifier) {
        setIsConnecting(true);
        setAuthError(null);

        try {
          // Clear URL params but preserve hash for tab navigation
          const newUrl = returnTab 
            ? `${window.location.pathname}#${returnTab}`
            : window.location.pathname;
          window.history.replaceState({}, '', newUrl);

          // Exchange code for tokens
          const { data, error } = await supabase.functions.invoke('google-oauth-token', {
            body: {
              code,
              codeVerifier,
              redirectUri: window.location.origin + window.location.pathname,
            },
          });

          if (error) throw error;

          setAccessToken(data.access_token);
          if (data.refresh_token) {
            setRefreshToken(data.refresh_token);
          }

          // Move to step 2
          setCurrentStep(2);
          setExpandedStep(2);
          toast.success('Connected to Google successfully!');

          // Fetch customer accounts
          await fetchCustomerAccounts(data.access_token);
        } catch (err: any) {
          console.error('OAuth error:', err);
          setAuthError(err.message || 'Failed to authenticate with Google');
          toast.error('Failed to connect to Google Ads');
        } finally {
          setIsConnecting(false);
          // Clean up session storage
          sessionStorage.removeItem('google_ads_oauth_state');
          sessionStorage.removeItem('google_ads_code_verifier');
          sessionStorage.removeItem('google_ads_return_tab');
        }
      }
    };

    handleOAuthCallback();
  }, []);

  // Start OAuth flow
  const startOAuthFlow = useCallback(async () => {
    const clientId = getClientId();
    
    if (!clientId) {
      toast.error('Google Client ID not configured');
      return;
    }

    setIsConnecting(true);
    setAuthError(null);

    try {
      const { codeVerifier, codeChallenge } = await generatePKCE();
      const state = crypto.randomUUID();

      // Store for callback - including return tab
      sessionStorage.setItem('google_ads_oauth_state', state);
      sessionStorage.setItem('google_ads_code_verifier', codeVerifier);
      sessionStorage.setItem('google_ads_return_tab', 'landing-pages');

      const redirectUri = window.location.origin + window.location.pathname;
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', GOOGLE_ADS_SCOPES);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('state', state);

      // Redirect to Google OAuth
      window.location.href = authUrl.toString();
    } catch (err: any) {
      console.error('OAuth start error:', err);
      setAuthError(err.message || 'Failed to start authentication');
      setIsConnecting(false);
    }
  }, [getClientId, generatePKCE, GOOGLE_ADS_SCOPES]);

  // Fetch customer accounts
  const fetchCustomerAccounts = useCallback(async (token: string) => {
    setIsLoadingAccounts(true);

    try {
      const { data, error } = await supabase.functions.invoke('google-ads-keywords', {
        body: {
          action: 'list-customers',
          accessToken: token,
        },
      });

      if (error) throw error;

      setCustomers(data.customers || []);
      
      if (data.isDemo) {
        toast.info('Demo mode - Google Ads API developer token required for production', {
          duration: 5000,
        });
      }
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
      toast.error('Failed to fetch Google Ads accounts');
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  // Select customer account
  const handleSelectCustomer = useCallback((customer: GoogleAdsCustomer) => {
    setSelectedCustomer(customer);
    setCurrentStep(3);
    setExpandedStep(3);
  }, []);

  // Handle manual customer ID input
  const handleManualCustomerId = useCallback(() => {
    const cleanId = manualCustomerId.replace(/[^0-9-]/g, '').trim();
    if (!cleanId || cleanId.length < 10) {
      toast.error('Please enter a valid Customer ID (e.g., 123-456-7890)');
      return;
    }
    
    const customer: GoogleAdsCustomer = {
      id: cleanId,
      name: `Account ${cleanId}`,
      currencyCode: 'USD',
    };
    
    setSelectedCustomer(customer);
    setCurrentStep(3);
    setExpandedStep(3);
    toast.success('Customer ID set successfully');
  }, [manualCustomerId]);

  // Confirm and complete
  const handleConfirmConnection = useCallback(() => {
    if (!selectedCustomer || !accessToken) {
      toast.error('Please select an account first');
      return;
    }

    setCurrentStep(4);
    setExpandedStep(4);

    // Store connection info
    localStorage.setItem('google_ads_customer_id', selectedCustomer.id);
    localStorage.setItem('google_ads_customer_name', selectedCustomer.name);

    toast.success(`Connected to ${selectedCustomer.name}!`);
    
    // Call onComplete after a brief delay
    setTimeout(() => {
      onComplete(selectedCustomer.id, accessToken);
    }, 1000);
  }, [selectedCustomer, accessToken, onComplete]);

  const getStepStatus = (step: WizardStep) => {
    if (step < currentStep) return 'complete';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  const renderStepIcon = (step: WizardStep) => {
    const status = getStepStatus(step);
    if (status === 'complete') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (status === 'current') {
      return <Circle className="w-5 h-5 text-orange-500 fill-orange-500/20" />;
    }
    return <Circle className="w-5 h-5 text-muted-foreground" />;
  };

  const renderStepContent = (step: WizardStep) => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Google Ads account to import your active PPC keywords and generate optimized landing pages.
            </p>

            {authError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{authError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <Key className="w-4 h-4 text-orange-500 mb-2" />
                <p className="text-xs font-medium">Read-Only Access</p>
                <p className="text-xs text-muted-foreground">We only read keyword data</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <Building2 className="w-4 h-4 text-orange-500 mb-2" />
                <p className="text-xs font-medium">Multi-Account</p>
                <p className="text-xs text-muted-foreground">Support for MCC accounts</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <Link2 className="w-4 h-4 text-orange-500 mb-2" />
                <p className="text-xs font-medium">Secure OAuth 2.0</p>
                <p className="text-xs text-muted-foreground">Industry standard auth</p>
              </div>
            </div>

            <Button
              onClick={startOAuthFlow}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <GoogleAdsIcon className="w-4 h-4 mr-2" />
                  Connect with Google
                </>
              )}
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select an account from the list, or enter your Customer ID manually.
            </p>

            {/* Developer Token Info Banner */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-500">Need a Developer Token?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    To connect your real Google Ads account, you'll need a Developer Token from Google.{' '}
                    <a 
                      href="https://developers.google.com/google-ads/api/docs/get-started/dev-token" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline inline-flex items-center gap-1"
                    >
                      Get your token here <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {isLoadingAccounts ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                <span className="ml-2 text-sm text-muted-foreground">Loading accounts...</span>
              </div>
            ) : (
              <>
                {/* Account list */}
                {customers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Available Accounts</p>
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          selectedCustomer?.id === customer.id
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-border hover:border-orange-500/50 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {customer.id} • {customer.currencyCode}
                            </p>
                          </div>
                          {selectedCustomer?.id === customer.id && (
                            <CheckCircle className="w-5 h-5 text-orange-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Manual Customer ID Input */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="w-full text-left text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Hash className="w-4 h-4" />
                    {showManualInput ? 'Hide manual input' : 'Enter Customer ID manually'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showManualInput ? 'rotate-180' : ''}`} />
                  </button>

                  {showManualInput && (
                    <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                      <div>
                        <Label htmlFor="customerId" className="text-sm font-medium">Google Ads Customer ID</Label>
                        <div className="relative mt-1.5">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="customerId"
                            value={manualCustomerId}
                            onChange={(e) => setManualCustomerId(e.target.value)}
                            placeholder="123-456-7890"
                            className="pl-10"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Find your Customer ID in Google Ads → Settings → Account settings
                        </p>
                      </div>
                      <Button
                        onClick={handleManualCustomerId}
                        disabled={!manualCustomerId.trim()}
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Use This Customer ID
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            <Button
              variant="outline"
              onClick={() => accessToken && fetchCustomerAccounts(accessToken)}
              disabled={isLoadingAccounts}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingAccounts ? 'animate-spin' : ''}`} />
              Refresh Accounts
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirm your selection and connect to start importing keywords.
            </p>

            {selectedCustomer && (
              <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                    <GoogleAdsIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedCustomer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Account ID: {selectedCustomer.id}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Import active keywords & performance data</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Generate keyword-specific landing pages</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Track A/B test performance & heat maps</span>
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
                onClick={handleConfirmConnection}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                Confirm & Connect
                <ArrowRight className="w-4 h-4 ml-2" />
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
              <p className="font-medium text-lg">Connected Successfully!</p>
              <p className="text-sm text-muted-foreground">
                Your Google Ads account is now linked. We're importing your keywords...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
              <span className="text-sm text-muted-foreground">Loading keywords...</span>
            </div>
          </div>
        );
    }
  };

  const steps = [
    { number: 1, title: 'Connect Google', desc: 'Sign in with your Google account' },
    { number: 2, title: 'Select Account', desc: 'Choose your Ads account' },
    { number: 3, title: 'Confirm Setup', desc: 'Review and confirm connection' },
    { number: 4, title: 'Import Keywords', desc: 'Sync your active keywords' },
  ];

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mx-auto mb-4">
          <GoogleAdsIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Connect Google Ads</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Link your Google Ads account to import keywords and generate optimized landing pages
        </p>
        {domain && (
          <Badge variant="outline" className="mt-2">
            Domain: {domain}
          </Badge>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Step {currentStep} of {steps.length}</span>
          <span className="text-xs text-muted-foreground">{Math.round(progressPercentage)}% complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => {
          const isExpanded = expandedStep === step.number;
          const status = getStepStatus(step.number as WizardStep);

          return (
            <Collapsible 
              key={step.number} 
              open={isExpanded} 
              onOpenChange={() => status !== 'upcoming' && setExpandedStep(step.number as WizardStep)}
            >
              <CollapsibleTrigger 
                className={`w-full p-4 rounded-xl border transition-all ${
                  status === 'current' 
                    ? 'border-orange-500/50 bg-orange-500/5' 
                    : status === 'complete'
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-border bg-muted/20'
                } ${status !== 'upcoming' ? 'cursor-pointer hover:bg-muted/50' : 'cursor-not-allowed opacity-60'}`}
                disabled={status === 'upcoming'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {renderStepIcon(step.number as WizardStep)}
                    <div className="text-left">
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                  {status !== 'upcoming' && (
                    isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 pt-2">
                {renderStepContent(step.number as WizardStep)}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Skip Option */}
      {onSkip && currentStep === 1 && (
        <div className="text-center mt-6">
          <button 
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now and use demo data
          </button>
        </div>
      )}
    </div>
  );
}
