import { useState, useEffect } from "react";
import {
  CheckCircle2, Circle, ExternalLink, Copy, RefreshCw,
  Activity, Code, ArrowRight, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface GAProperty {
  name: string;
  displayName: string;
  propertyType: string;
}

interface GAOnboardingWizardProps {
  domain: string;
  properties: GAProperty[];
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
}

type OnboardingStep = 1 | 2 | 3 | 4;

export const GAOnboardingWizard = ({
  domain,
  properties,
  onRefresh,
  isRefreshing = false,
}: GAOnboardingWizardProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(properties.length > 0 ? 2 : 1);
  const [expandedStep, setExpandedStep] = useState<OnboardingStep | null>(currentStep);
  const [copiedCode, setCopiedCode] = useState(false);

  // Determine which step we're on based on properties
  useEffect(() => {
    if (properties.length === 0) {
      setCurrentStep(1);
      setExpandedStep(1);
    } else {
      // Have properties but domain not found = need to add data stream (step 2)
      setCurrentStep(2);
      setExpandedStep(2);
    }
  }, [properties.length]);

  const normalizeDomain = (d: string) =>
    d.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").toLowerCase();

  const normalizedDomain = normalizeDomain(domain);

  // Get tracking code for the domain
  const getTrackingCode = (measurementId: string = "G-XXXXXXXXXX") => {
    return `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
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
      title: "Create GA4 Property",
      description: "Set up a property for your website in Google Analytics",
      completed: properties.length > 0,
    },
    {
      number: 2 as OnboardingStep,
      title: "Add Web Data Stream",
      description: `Add ${normalizedDomain} as a data stream`,
      completed: false, // Parent component determines this
    },
    {
      number: 3 as OnboardingStep,
      title: "Install Tracking Code",
      description: "Add the gtag.js snippet to your website",
      completed: false,
    },
    {
      number: 4 as OnboardingStep,
      title: "Verify Connection",
      description: "Confirm data is flowing to Google Analytics",
      completed: false,
    },
  ];

  const getFirstPropertyId = () => {
    if (properties.length === 0) return null;
    return properties[0].name.replace("properties/", "");
  };

  const renderStepContent = (stepNumber: OnboardingStep) => {
    switch (stepNumber) {
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              First, you need a GA4 property in your Google Analytics account. This is where all your website data will be collected.
            </p>
            <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-sm">Go to Google Analytics Admin</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-sm">Click <span className="font-medium">"Create Property"</span></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-sm">Enter <span className="font-mono bg-background px-1.5 py-0.5 rounded text-xs">{normalizedDomain}</span> as the property name</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">4</span>
                </div>
                <p className="text-sm">Select your timezone and currency, then click <span className="font-medium">"Next"</span></p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                onClick={() => window.open("https://analytics.google.com/analytics/web/#/admin/create-property", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Create Property in GA
              </Button>
              <Button variant="outline" onClick={onRefresh} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                I've Created It
              </Button>
            </div>
          </div>
        );

      case 2:
        const propId = getFirstPropertyId();
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Now add a <span className="font-medium">Web Data Stream</span> for <span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-xs">{normalizedDomain}</span> to your GA4 property.
            </p>
            <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-sm">In GA Admin, select your property: <span className="font-medium">{properties[0]?.displayName || "your property"}</span></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-sm">Click <span className="font-medium">"Data Streams"</span> in the left menu</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-sm">Click <span className="font-medium">"Add stream"</span> → Select <span className="font-medium">"Web"</span></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">4</span>
                </div>
                <div className="text-sm">
                  <p>Enter your website URL:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-background px-2 py-1 rounded text-xs font-mono">https://{normalizedDomain}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://${normalizedDomain}`);
                        toast({ title: "Copied!", description: "URL copied to clipboard" });
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">5</span>
                </div>
                <p className="text-sm">Name your stream (e.g., <span className="font-medium">"{normalizedDomain} - Web"</span>) and click <span className="font-medium">"Create stream"</span></p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                onClick={() => {
                  if (propId) {
                    window.open(`https://analytics.google.com/analytics/web/#/p${propId}/admin/streams`, "_blank");
                  } else {
                    window.open("https://analytics.google.com/analytics/web/#/admin", "_blank");
                  }
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Data Streams
              </Button>
              <Button variant="outline" onClick={() => setExpandedStep(3)}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Next: Install Code
              </Button>
            </div>
            {properties.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Your GA4 properties:</p>
                <div className="flex flex-wrap gap-2">
                  {properties.map((prop) => (
                    <Badge key={prop.name} variant="secondary" className="text-xs">
                      {prop.displayName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy the tracking code from your data stream and add it to your website's <code className="bg-secondary px-1 py-0.5 rounded text-xs">&lt;head&gt;</code> section.
            </p>
            <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-sm">In your data stream, click <span className="font-medium">"View tag instructions"</span></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-sm">Select <span className="font-medium">"Install manually"</span></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-sm">Copy the Google tag code</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">4</span>
                </div>
                <p className="text-sm">Paste it in your website's <code className="bg-background px-1 py-0.5 rounded text-xs">&lt;head&gt;</code> section (before <code className="bg-background px-1 py-0.5 rounded text-xs">&lt;/head&gt;</code>)</p>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-zinc-800 border-b border-zinc-700">
                <span className="text-xs text-zinc-400">Example tracking code</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-zinc-400 hover:text-white"
                  onClick={copyTrackingCode}
                >
                  {copiedCode ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span className="ml-1 text-xs">{copiedCode ? "Copied" : "Copy"}</span>
                </Button>
              </div>
              <pre className="p-3 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre">
                {getTrackingCode()}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Note:</span> Replace <code className="bg-secondary px-1 py-0.5 rounded">G-XXXXXXXXXX</code> with your actual Measurement ID from Google Analytics.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setExpandedStep(4)}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Next: Verify Setup
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              After installing the tracking code, verify that data is flowing correctly.
            </p>
            <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-sm">Visit your website in a new tab</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-sm">Open Google Analytics <span className="font-medium">Realtime</span> report</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-sm">You should see yourself as an active user</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                </div>
                <p className="text-sm">Once verified, click <span className="font-medium">"Verify Connection"</span> below</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Verify Connection
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const propId = getFirstPropertyId();
                  if (propId) {
                    window.open(`https://analytics.google.com/analytics/web/#/p${propId}/realtime/overview`, "_blank");
                  } else {
                    window.open("https://analytics.google.com/analytics/web/", "_blank");
                  }
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Realtime Report
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div
              className={`flex items-center gap-2 cursor-pointer ${
                expandedStep === step.number ? "opacity-100" : "opacity-60 hover:opacity-80"
              }`}
              onClick={() => setExpandedStep(step.number)}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  step.completed
                    ? "bg-green-500 text-white"
                    : step.number === currentStep
                    ? "bg-amber-500 text-white"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-bold">{step.number}</span>
                )}
              </div>
              <div className="hidden md:block">
                <p className={`text-xs font-medium ${step.number === currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.title}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 lg:w-16 h-0.5 mx-2 ${step.completed ? "bg-green-500" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {steps.map((step) => (
        <Collapsible
          key={step.number}
          open={expandedStep === step.number}
          onOpenChange={(open) => setExpandedStep(open ? step.number : null)}
        >
          <CollapsibleTrigger asChild>
            <div
              className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                expandedStep === step.number
                  ? "bg-amber-500/10 border border-amber-500/30"
                  : step.completed
                  ? "bg-green-500/5 border border-green-500/20"
                  : "bg-secondary/50 border border-border/50 hover:border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : step.number === currentStep
                      ? "bg-amber-500 text-white"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step.completed ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-sm font-bold">{step.number}</span>}
                </div>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {expandedStep === step.number ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 border-x border-b border-amber-500/30 rounded-b-lg bg-background">
              {renderStepContent(step.number)}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};

export default GAOnboardingWizard;
