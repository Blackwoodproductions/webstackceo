import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Circle, ExternalLink, Copy, RefreshCw,
  ArrowRight, Loader2, Plus, Globe, BarChart3, Code
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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
}

type OnboardingStep = 1 | 2 | 3;

export const GAInlineOnboardingWizard = ({
  domain,
  properties,
  onRefresh,
  isRefreshing = false,
}: GAInlineOnboardingWizardProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    properties.length > 0 ? 2 : 1
  );
  const [copiedCode, setCopiedCode] = useState(false);

  const normalizeDomain = (d: string) =>
    d.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").toLowerCase();

  const normalizedDomain = normalizeDomain(domain);

  const getFirstPropertyId = () => {
    if (properties.length === 0) return null;
    return properties[0].name.replace("properties/", "");
  };

  const getTrackingCode = (measurementId: string = "G-XXXXXXXXXX") => {
    return `<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');
</script>`;
  };

  const copyTrackingCode = async () => {
    await navigator.clipboard.writeText(getTrackingCode());
    setCopiedCode(true);
    toast({ title: "Copied!", description: "Tracking code copied to clipboard" });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const steps = [
    {
      number: 1 as OnboardingStep,
      icon: Plus,
      title: "Create Property",
      description: "Set up GA4 property",
      completed: properties.length > 0,
    },
    {
      number: 2 as OnboardingStep,
      icon: Globe,
      title: "Add Data Stream",
      description: `Add ${normalizedDomain}`,
      completed: false,
    },
    {
      number: 3 as OnboardingStep,
      icon: Code,
      title: "Install & Verify",
      description: "Add tracking code",
      completed: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-card to-orange-500/5"
    >
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-pulse" style={{ animationDuration: '4s' }} />
      <motion.div 
        className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Corner glows */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-[60px]" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-tr-[50px]" />
      
      <div className="relative z-10 p-4">
        {/* Header with Domain Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
              <img 
                src={`https://www.google.com/s2/favicons?domain=${normalizedDomain}&sz=32`}
                alt={normalizedDomain}
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                }}
              />
              <Globe className="w-4 h-4 text-amber-500 fallback-icon hidden" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                Setup Required
                <Badge className="text-[8px] bg-amber-500/20 text-amber-500 border-amber-500/30">
                  {normalizedDomain}
                </Badge>
              </h4>
              <p className="text-[10px] text-muted-foreground">
                {properties.length > 0 
                  ? "Add a web data stream for this domain"
                  : "Create a GA4 property to start tracking"
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-7 text-xs hover:bg-amber-500/10"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            Verify
          </Button>
        </div>

        {/* Compact Step Progress */}
        <div className="flex items-center gap-2 mb-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <motion.button
                onClick={() => setCurrentStep(step.number)}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all flex-1 ${
                  currentStep === step.number 
                    ? 'bg-amber-500/20 border border-amber-500/40' 
                    : step.completed 
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-secondary/50 border border-border/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.completed 
                    ? 'bg-green-500/20' 
                    : currentStep === step.number 
                      ? 'bg-amber-500/30' 
                      : 'bg-muted'
                }`}>
                  {step.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <step.icon className={`w-3 h-3 ${currentStep === step.number ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <p className={`text-[10px] font-medium ${currentStep === step.number ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {step.title}
                  </p>
                </div>
              </motion.button>
              {index < steps.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground/30 mx-1 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content - Compact */}
        <div className="bg-secondary/30 rounded-lg p-3 backdrop-blur-sm border border-border/30">
          {currentStep === 1 && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-amber-500">1</span>
                <span>Go to <span className="font-medium text-foreground">Google Analytics Admin</span> → Create Property</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-amber-500">2</span>
                <span>Name it <code className="bg-background px-1 rounded text-[10px]">{normalizedDomain}</code></span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="h-7 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  onClick={() => window.open("https://analytics.google.com/analytics/web/#/admin/create-property", "_blank")}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Create Property
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setCurrentStep(2)}
                >
                  I've Done This
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-amber-500">1</span>
                <span>In GA Admin → <span className="font-medium text-foreground">Data Streams</span> → Add Stream → Web</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-amber-500">2</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Enter URL:</span>
                  <code className="bg-background px-1.5 py-0.5 rounded text-[10px] font-mono">https://{normalizedDomain}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${normalizedDomain}`);
                      toast({ title: "Copied!" });
                    }}
                  >
                    <Copy className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="h-7 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  onClick={() => {
                    const propId = getFirstPropertyId();
                    if (propId) {
                      window.open(`https://analytics.google.com/analytics/web/#/p${propId}/admin/streams`, "_blank");
                    } else {
                      window.open("https://analytics.google.com/analytics/web/#/admin", "_blank");
                    }
                  }}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open Data Streams
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setCurrentStep(3)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-amber-500">1</span>
                <span>Copy tracking code from your data stream → Add to <code className="bg-background px-1 rounded">&lt;head&gt;</code></span>
              </div>
              
              {/* Compact code preview */}
              <div className="bg-zinc-900 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-2 py-1 bg-zinc-800 border-b border-zinc-700">
                  <span className="text-[9px] text-zinc-400">gtag.js snippet</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-zinc-400 hover:text-white"
                    onClick={copyTrackingCode}
                  >
                    {copiedCode ? <CheckCircle2 className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                  </Button>
                </div>
                <pre className="p-2 text-[9px] text-green-400 font-mono overflow-x-auto max-h-16 scrollbar-hide">
                  {getTrackingCode()}
                </pre>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="h-7 text-xs bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  )}
                  Verify Setup
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    const propId = getFirstPropertyId();
                    if (propId) {
                      window.open(`https://analytics.google.com/analytics/web/#/p${propId}/realtime/overview`, "_blank");
                    } else {
                      window.open("https://analytics.google.com/analytics/web/", "_blank");
                    }
                  }}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Realtime
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Property badges if available */}
        {properties.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] text-muted-foreground">Available:</span>
              {properties.slice(0, 3).map((prop) => (
                <Badge key={prop.name} variant="secondary" className="text-[9px] py-0 h-4">
                  {prop.displayName}
                </Badge>
              ))}
              {properties.length > 3 && (
                <Badge variant="secondary" className="text-[9px] py-0 h-4">
                  +{properties.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GAInlineOnboardingWizard;
