import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Copy, RefreshCw, Loader2, Globe, 
  BarChart3, Link2, ChevronRight, Sparkles, Radio,
  FileText, Code, ExternalLink, Rocket, AlertCircle,
  Shield, CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GAProperty {
  name: string;
  displayName: string;
  propertyType: string;
}

interface GAInlineOnboardingWizardProps {
  domain: string;
  properties: GAProperty[];
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
  accessToken?: string | null;
}

interface DataStreamResult {
  measurementId: string;
  displayName: string;
  defaultUri: string;
  existing: boolean;
}

type VerificationMethod = 'META' | 'DNS_TXT' | 'ANALYTICS';

interface GSCSetupState {
  step: 'choose-method' | 'show-token' | 'verifying' | 'verified' | 'error';
  selectedMethod: VerificationMethod | null;
  token: string | null;
  error: string | null;
  isLoading: boolean;
}

// GSC Setup Wizard Sub-Component
interface GSCSetupWizardProps {
  domain: string;
  siteUrl: string;
  accessToken: string | null;
  gscState: GSCSetupState;
  setGscState: React.Dispatch<React.SetStateAction<GSCSetupState>>;
  onVerified: () => void;
  isRefreshing: boolean;
  copiedMeta: boolean;
  copiedDNS: boolean;
  copyMetaTag: () => Promise<void>;
  copyDNSRecord: () => Promise<void>;
  getMetaTag: (token?: string) => string;
  getDNSRecord: (token?: string) => string;
}

const GSCSetupWizard = ({
  domain,
  siteUrl,
  accessToken,
  gscState,
  setGscState,
  onVerified,
  isRefreshing,
  copiedMeta,
  copiedDNS,
  copyMetaTag,
  copyDNSRecord,
  getMetaTag,
  getDNSRecord,
}: GSCSetupWizardProps) => {
  const { toast } = useToast();

  // Step 1: Add site to GSC and get verification token
  const handleSelectMethod = async (method: VerificationMethod) => {
    if (!accessToken) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Google account first",
        variant: "destructive",
      });
      return;
    }

    setGscState(prev => ({ ...prev, selectedMethod: method, isLoading: true, error: null }));

    try {
      // First, add the site to GSC
      console.log(`[GSC Wizard] Adding site: ${siteUrl}`);
      const addResult = await supabase.functions.invoke("search-console", {
        body: { action: 'addSite', accessToken, siteUrl },
      });

      if (addResult.error) {
        throw new Error(addResult.error.message || "Failed to add site");
      }

      // Now get the verification token
      console.log(`[GSC Wizard] Getting token for method: ${method}`);
      const tokenResult = await supabase.functions.invoke("search-console", {
        body: { action: 'getVerificationToken', accessToken, siteUrl, verificationType: method },
      });

      if (tokenResult.error || !tokenResult.data?.success) {
        throw new Error(tokenResult.data?.error || tokenResult.error?.message || "Failed to get verification token");
      }

      setGscState(prev => ({
        ...prev,
        step: 'show-token',
        token: tokenResult.data.token,
        isLoading: false,
      }));

      toast({
        title: "Site Added to Search Console!",
        description: `Now add the verification code to your ${method === 'META' ? 'website' : method === 'DNS_TXT' ? 'DNS settings' : 'Google Analytics'}`,
      });
    } catch (err) {
      console.error("[GSC Wizard] Error:", err);
      setGscState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to setup verification",
        isLoading: false,
      }));
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to setup verification",
        variant: "destructive",
      });
    }
  };

  // Step 2: Verify ownership
  const handleVerifySite = async () => {
    if (!accessToken || !gscState.selectedMethod) {
      return;
    }

    setGscState(prev => ({ ...prev, step: 'verifying', isLoading: true, error: null }));

    try {
      console.log(`[GSC Wizard] Verifying site: ${siteUrl} with method: ${gscState.selectedMethod}`);
      const verifyResult = await supabase.functions.invoke("search-console", {
        body: { 
          action: 'verifySite', 
          accessToken, 
          siteUrl,
          verificationType: gscState.selectedMethod,
        },
      });

      if (verifyResult.error || !verifyResult.data?.success) {
        throw new Error(verifyResult.data?.error || verifyResult.error?.message || "Verification failed");
      }

      if (verifyResult.data.verified) {
        setGscState(prev => ({ ...prev, step: 'verified', isLoading: false }));
        toast({
          title: "✓ Domain Verified!",
          description: `${domain} is now verified in Google Search Console`,
        });
        
        // Trigger refresh to continue to GA setup
        setTimeout(() => {
          onVerified();
        }, 1500);
      } else {
        throw new Error("Verification not confirmed. Please ensure you've added the verification code correctly.");
      }
    } catch (err) {
      console.error("[GSC Wizard] Verify error:", err);
      setGscState(prev => ({
        ...prev,
        step: 'show-token',
        error: err instanceof Error ? err.message : "Verification failed",
        isLoading: false,
      }));
      toast({
        title: "Verification Failed",
        description: err instanceof Error ? err.message : "Please ensure you've added the verification code correctly",
        variant: "destructive",
      });
    }
  };

  // Reset to method selection
  const handleReset = () => {
    setGscState({
      step: 'choose-method',
      selectedMethod: null,
      token: null,
      error: null,
      isLoading: false,
    });
  };

  return (
    <div className="space-y-3">
      <div className="p-4 rounded-lg bg-secondary/30 border border-amber-500/30">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground mb-0.5">
              {gscState.step === 'verified' ? 'Domain Verified!' : 'Verify Domain in Google Search Console'}
            </h4>
            <p className="text-[10px] text-muted-foreground">
              <span className="text-amber-400 font-medium">{domain}</span> must be verified in GSC before linking to GA4
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Choose Verification Method */}
          {gscState.step === 'choose-method' && (
            <motion.div
              key="choose-method"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <p className="text-xs text-muted-foreground mb-3">
                Choose your preferred verification method:
              </p>

              {/* Method Options */}
              <div className="space-y-2">
                {/* Meta Tag Option */}
                <button
                  onClick={() => handleSelectMethod('META')}
                  disabled={gscState.isLoading}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all text-left group disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Code className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">HTML Meta Tag</span>
                      <Badge className="text-[8px] py-0 h-3.5 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Recommended</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Add a meta tag to your homepage</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                </button>

                {/* DNS TXT Option */}
                <button
                  onClick={() => handleSelectMethod('DNS_TXT')}
                  disabled={gscState.isLoading}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 transition-all text-left group disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-foreground block">DNS TXT Record</span>
                    <p className="text-[10px] text-muted-foreground">Add a TXT record to your DNS settings</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                </button>

                {/* Google Analytics Option */}
                <button
                  onClick={() => handleSelectMethod('ANALYTICS')}
                  disabled={gscState.isLoading}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-left group disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-foreground block">Google Analytics</span>
                    <p className="text-[10px] text-muted-foreground">Use existing GA tracking code</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition-colors" />
                </button>
              </div>

              {gscState.isLoading && (
                <div className="flex items-center justify-center gap-2 p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span className="text-xs text-muted-foreground">Adding site to Search Console...</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Show Token and Instructions */}
          {gscState.step === 'show-token' && (
            <motion.div
              key="show-token"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Back Button */}
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-3 h-3 rotate-180" />
                Change method
              </button>

              {/* Method-specific instructions */}
              {gscState.selectedMethod === 'META' && (
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-medium text-cyan-400">Add this meta tag to your &lt;head&gt;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[9px] font-mono text-cyan-300 bg-zinc-900/80 p-2 rounded overflow-x-auto">
                      {getMetaTag(gscState.token || undefined)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 hover:bg-cyan-500/10"
                      onClick={copyMetaTag}
                    >
                      {copiedMeta ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {gscState.selectedMethod === 'DNS_TXT' && (
                <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-medium text-violet-400">Add this TXT record to your DNS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[9px] font-mono text-violet-300 bg-zinc-900/80 p-2 rounded overflow-x-auto">
                      {getDNSRecord(gscState.token || undefined)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 hover:bg-violet-500/10"
                      onClick={copyDNSRecord}
                    >
                      {copiedDNS ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-2">
                    DNS changes may take up to 72 hours to propagate
                  </p>
                </div>
              )}

              {gscState.selectedMethod === 'ANALYTICS' && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">Google Analytics Verification</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Ensure Google Analytics tracking code is installed on your homepage. 
                    The verification will use your existing GA implementation.
                  </p>
                </div>
              )}

              {/* Error Display */}
              {gscState.error && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-[10px] text-red-400">{gscState.error}</p>
                </div>
              )}

              {/* Verify Button */}
              <Button
                size="sm"
                className="h-9 text-xs bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white w-full"
                onClick={handleVerifySite}
                disabled={gscState.isLoading}
              >
                {gscState.isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                )}
                Verify Ownership
              </Button>
            </motion.div>
          )}

          {/* Step 3: Verifying */}
          {gscState.step === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-6 gap-3"
            >
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs text-muted-foreground">Verifying domain ownership...</p>
            </motion.div>
          )}

          {/* Step 4: Verified */}
          {gscState.step === 'verified' && (
            <motion.div
              key="verified"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-lg bg-green-500/10 border border-green-500/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-green-400">Domain Verified!</h4>
                  <p className="text-[10px] text-muted-foreground">
                    {domain} is now verified. Continuing to Google Analytics setup...
                  </p>
                </div>
              </div>
              {isRefreshing && (
                <div className="flex items-center gap-2 mt-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-green-500" />
                  <span className="text-[10px] text-muted-foreground">Loading analytics properties...</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const GAInlineOnboardingWizard = ({
  domain,
  properties,
  onRefresh,
  isRefreshing = false,
  accessToken = null,
}: GAInlineOnboardingWizardProps) => {
  const { toast } = useToast();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [showTrackingCode, setShowTrackingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMeta, setCopiedMeta] = useState(false);
  const [copiedDNS, setCopiedDNS] = useState(false);
  
  // GSC Setup State
  const [gscState, setGscState] = useState<GSCSetupState>({
    step: 'choose-method',
    selectedMethod: null,
    token: null,
    error: null,
    isLoading: false,
  });
  
  // New states for data stream creation
  const [isCreating, setIsCreating] = useState(false);
  const [dataStream, setDataStream] = useState<DataStreamResult | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    found: boolean;
    measurementId?: string;
  } | null>(null);

  const normalizeDomain = (d: string) =>
    d.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").toLowerCase();

  const normalizedDomain = normalizeDomain(domain);
  const siteUrl = `https://${normalizedDomain}/`;

  // Filter properties to only show ones matching the selected domain
  const matchingProperties = properties.filter((prop) => {
    const propName = prop.displayName.toLowerCase();
    return propName.includes(normalizedDomain) || normalizedDomain.includes(propName.replace(/\s+-\s+ga4$/i, '').trim());
  });

  const hasMatchingProperty = matchingProperties.length > 0;

  const getTrackingCode = (measurementId: string = "G-XXXXXXXXXX") => {
    return `<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');
</script>`;
  };

  const copyTrackingCode = async () => {
    const measurementId = dataStream?.measurementId || "G-XXXXXXXXXX";
    await navigator.clipboard.writeText(getTrackingCode(measurementId));
    setCopiedCode(true);
    toast({ title: "Copied!", description: "Tracking code copied to clipboard" });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(`https://${normalizedDomain}`);
    setCopiedUrl(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Generate meta tag with actual token
  const getMetaTag = (token?: string) => 
    `<meta name="google-site-verification" content="${token || 'YOUR_VERIFICATION_CODE'}" />`;
  
  // Generate DNS record with actual token
  const getDNSRecord = (token?: string) => 
    `google-site-verification=${token || 'YOUR_VERIFICATION_CODE'}`;

  const copyMetaTag = async () => {
    await navigator.clipboard.writeText(getMetaTag(gscState.token || undefined));
    setCopiedMeta(true);
    toast({ title: "Copied!", description: "Meta tag copied to clipboard" });
    setTimeout(() => setCopiedMeta(false), 2000);
  };

  const copyDNSRecord = async () => {
    await navigator.clipboard.writeText(getDNSRecord(gscState.token || undefined));
    setCopiedDNS(true);
    toast({ title: "Copied!", description: "DNS record copied to clipboard" });
    setTimeout(() => setCopiedDNS(false), 2000);
  };

  // Create data stream via API
  const handleCreateDataStream = async () => {
    if (!selectedProperty) return;
    
    setIsCreating(true);
    setCreateError(null);
    
    try {
      const propertyId = selectedProperty.replace("properties/", "");
      
      const { data, error } = await supabase.functions.invoke("ga-create-datastream", {
        body: { propertyId, domain: normalizedDomain },
      });

      if (error) {
        throw new Error(error.message || "Failed to create data stream");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.success && data?.dataStream) {
        setDataStream({
          measurementId: data.dataStream.measurementId,
          displayName: data.dataStream.displayName,
          defaultUri: data.dataStream.defaultUri,
          existing: data.existing,
        });
        setShowTrackingCode(true);
        
        toast({
          title: data.existing ? "Data Stream Found!" : "Data Stream Created!",
          description: `Measurement ID: ${data.dataStream.measurementId}`,
        });
      }
    } catch (err) {
      console.error("[GA Wizard] Create data stream error:", err);
      setCreateError(err instanceof Error ? err.message : "Failed to create data stream");
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create data stream",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Verify tracking code is installed on the website
  const handleVerifyTracking = async () => {
    if (!dataStream?.measurementId) return;
    
    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      // Scrape the website to check for GA code
      const { data, error } = await supabase.functions.invoke("scrape-website", {
        body: { 
          url: `https://${normalizedDomain}`,
          checkGACode: true 
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to check website");
      }

      const measurementId = dataStream.measurementId;
      const gaCheck = data?.gaCodeCheck;
      
      if (gaCheck?.hasGoogleAnalytics && gaCheck?.measurementId === measurementId) {
        setVerificationResult({ found: true, measurementId });
        toast({
          title: "✓ Tracking Code Verified!",
          description: `${measurementId} is installed on ${normalizedDomain}`,
        });
      } else if (gaCheck?.hasGoogleAnalytics && gaCheck?.measurementId) {
        // Has GA but different measurement ID
        setVerificationResult({ found: false });
        toast({
          title: "Different GA Code Found",
          description: `Found ${gaCheck.measurementId} but expected ${measurementId}. Update your tracking code.`,
          variant: "destructive",
        });
      } else if (gaCheck?.hasGTM) {
        // Has GTM instead
        setVerificationResult({ found: false });
        toast({
          title: "Google Tag Manager Detected",
          description: `GTM found. Make sure GA4 is configured in GTM with ${measurementId}.`,
        });
      } else {
        setVerificationResult({ found: false });
        toast({
          title: "Tracking Code Not Found",
          description: `Could not find ${measurementId} on ${normalizedDomain}. Install the code and try again.`,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("[GA Wizard] Verify tracking error:", err);
      toast({
        title: "Verification Failed",
        description: err instanceof Error ? err.message : "Could not verify tracking code",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-orange-500/5"
    >
      {/* Scanning line effect */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
      />
      
      <div className="relative z-10 p-4">
        {/* Sleek Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${normalizedDomain}&sz=32`}
                  alt={normalizedDomain}
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                  }}
                />
                <Globe className="w-5 h-5 text-amber-500 fallback-icon hidden" />
              </div>
              <motion.div 
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500"
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Link Domain</span>
                <Badge className="text-[9px] py-0 h-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
                  {normalizedDomain}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {hasMatchingProperty ? "Select a property to connect" : "Domain not found in GA4"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-7 text-[10px] hover:bg-amber-500/10 gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Properties Selection Grid */}
        {hasMatchingProperty ? (
          <div className="space-y-3">
            {/* Property Cards - Only show matching properties */}
            <div className="grid gap-2">
              {matchingProperties.map((prop, i) => {
                const isSelected = selectedProperty === prop.name;
                const propId = prop.name.replace("properties/", "");
                
                return (
                  <motion.button
                    key={prop.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedProperty(isSelected ? null : prop.name)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      isSelected 
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10' 
                        : 'bg-secondary/30 border-border/40 hover:bg-secondary/50 hover:border-amber-500/30'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-amber-500/30' : 'bg-muted/50'
                    }`}>
                      <BarChart3 className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isSelected ? 'text-amber-400' : 'text-foreground'}`}>
                        {prop.displayName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Property ID: {propId}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground/30'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Selected Property Actions */}
            <AnimatePresence>
              {selectedProperty && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 rounded-lg bg-secondary/40 border border-border/30 space-y-3">
                    {/* Success State - Show Tracking Code */}
                    {dataStream ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-green-400">
                              {dataStream.existing ? "Data Stream Found!" : "Data Stream Created!"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Measurement ID: <span className="text-green-400 font-mono">{dataStream.measurementId}</span>
                            </p>
                          </div>
                        </div>

                        {/* Tracking Code - Always visible after creation */}
                        <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 border-b border-zinc-700">
                            <div className="flex items-center gap-2">
                              <Code className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-xs text-zinc-300 font-medium">Add to your website's &lt;head&gt;</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-zinc-400 hover:text-white hover:bg-zinc-700"
                              onClick={copyTrackingCode}
                            >
                              {copiedCode ? (
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span className="ml-1 text-[9px]">{copiedCode ? 'Copied!' : 'Copy'}</span>
                            </Button>
                          </div>
                          <pre className="p-3 text-[10px] text-green-400 font-mono overflow-x-auto max-h-32 scrollbar-hide leading-relaxed">
                            {getTrackingCode(dataStream.measurementId)}
                          </pre>
                        </div>

                        {/* Verification Result */}
                        {verificationResult && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-2 rounded-lg border ${
                              verificationResult.found
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-amber-500/10 border-amber-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {verificationResult.found ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  <p className="text-xs text-green-400">
                                    Tracking code verified on {normalizedDomain}!
                                  </p>
                                </>
                              ) : (
                                <>
                                  <Radio className="w-4 h-4 text-amber-500" />
                                  <p className="text-xs text-amber-400">
                                    Tracking code not detected yet. Install and verify again.
                                  </p>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {/* Verify Connection Button */}
                        <Button
                          size="sm"
                          className={`h-8 text-xs w-full ${
                            verificationResult?.found
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                          } text-white`}
                          onClick={handleVerifyTracking}
                          disabled={isVerifying}
                        >
                          {isVerifying ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          ) : verificationResult?.found ? (
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          ) : (
                            <Radio className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          {isVerifying 
                            ? "Scanning Website..." 
                            : verificationResult?.found 
                              ? "Verified! Check Again" 
                              : "Verify Tracking Code is Installed"}
                        </Button>
                      </motion.div>
                    ) : (
                      /* Pre-creation state */
                      <>
                        {/* Domain URL to add */}
                        <div className="flex items-center gap-2">
                          <Link2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span className="text-[10px] text-muted-foreground">Will create Web Data Stream for:</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/30">
                          <code className="flex-1 text-xs font-mono text-amber-400 truncate">
                            https://{normalizedDomain}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 hover:bg-amber-500/10"
                            onClick={copyUrl}
                          >
                            {copiedUrl ? (
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            )}
                          </Button>
                        </div>

                        {/* Error State */}
                        {createError && (
                          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                            <p className="text-[10px] text-red-400">{createError}</p>
                          </div>
                        )}

                        {/* Create Data Stream Button */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white flex-1"
                            onClick={handleCreateDataStream}
                            disabled={isCreating}
                          >
                            {isCreating ? (
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <Rocket className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            {isCreating ? "Creating Data Stream..." : "Add Domain to Google Analytics"}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hint when no property selected */}
            {!selectedProperty && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <p className="text-[10px] text-muted-foreground">
                  Select a property above, then add <span className="text-amber-400 font-medium">{normalizedDomain}</span> as a web data stream
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Domain not found - Interactive GSC setup wizard */
          <GSCSetupWizard
            domain={normalizedDomain}
            siteUrl={siteUrl}
            accessToken={accessToken}
            gscState={gscState}
            setGscState={setGscState}
            onVerified={() => {
              // After GSC verification, refresh to check for properties
              onRefresh();
            }}
            isRefreshing={isRefreshing}
            copiedMeta={copiedMeta}
            copiedDNS={copiedDNS}
            copyMetaTag={copyMetaTag}
            copyDNSRecord={copyDNSRecord}
            getMetaTag={getMetaTag}
            getDNSRecord={getDNSRecord}
          />
        )}
      </div>
    </motion.div>
  );
};

export default GAInlineOnboardingWizard;
