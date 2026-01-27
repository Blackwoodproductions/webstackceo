import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Copy, RefreshCw, Loader2, Globe, 
  BarChart3, Link2, ChevronRight, Sparkles, Radio
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

export const GAInlineOnboardingWizard = ({
  domain,
  properties,
  onRefresh,
  isRefreshing = false,
}: GAInlineOnboardingWizardProps) => {
  const { toast } = useToast();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [showTrackingCode, setShowTrackingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const normalizeDomain = (d: string) =>
    d.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").toLowerCase();

  const normalizedDomain = normalizeDomain(domain);

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
    await navigator.clipboard.writeText(getTrackingCode());
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
                    {/* Domain URL to add */}
                    <div className="flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="text-[10px] text-muted-foreground">Add this URL as a Web Data Stream:</span>
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

                    {/* Show Tracking Code Toggle */}
                    <button
                      onClick={() => setShowTrackingCode(!showTrackingCode)}
                      className="flex items-center gap-2 text-[10px] text-amber-500 hover:text-amber-400 transition-colors"
                    >
                      <ChevronRight className={`w-3 h-3 transition-transform ${showTrackingCode ? 'rotate-90' : ''}`} />
                      {showTrackingCode ? 'Hide' : 'Show'} tracking code snippet
                    </button>

                    {/* Tracking Code */}
                    <AnimatePresence>
                      {showTrackingCode && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                            <div className="flex items-center justify-between px-2 py-1.5 bg-zinc-800/50 border-b border-zinc-700">
                              <span className="text-[9px] text-zinc-400 font-medium">gtag.js</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-2 text-zinc-400 hover:text-white hover:bg-zinc-700"
                                onClick={copyTrackingCode}
                              >
                                {copiedCode ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span className="ml-1 text-[9px]">{copiedCode ? 'Copied' : 'Copy'}</span>
                              </Button>
                            </div>
                            <pre className="p-2 text-[9px] text-green-400 font-mono overflow-x-auto max-h-20 scrollbar-hide leading-relaxed">
                              {getTrackingCode()}
                            </pre>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Verify Button */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white flex-1"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                      >
                        {isRefreshing ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Radio className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Verify Connection
                      </Button>
                    </div>
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
          /* Domain not found in any property - Show add to GA prompt */
          <div className="p-4 rounded-lg bg-secondary/30 border border-amber-500/30 text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <Globe className="w-5 h-5 text-amber-500" />
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              Domain Not Found
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              <span className="text-amber-400 font-medium">{normalizedDomain}</span> is not linked to any GA4 property in your account.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                className="h-8 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white w-full"
                onClick={() => window.open("https://analytics.google.com/analytics/web/#/admin/create-property", "_blank")}
              >
                Create GA4 Property for {normalizedDomain}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs w-full"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh After Adding
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GAInlineOnboardingWizard;
