import { motion } from "framer-motion";
import { MapPin, Star, Phone, Clock, Building2, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from "lucide-react";

interface LocalSEOMetrics {
  hasLocalSchema: boolean;
  hasNAP: boolean;
  napConsistent: boolean;
  hasGoogleMapsEmbed: boolean;
  hasLocalKeywords: boolean;
  localKeywords: string[];
  hasBusinessHours: boolean;
  hasReviews: boolean;
  estimatedReviewCount: number;
  hasServiceArea: boolean;
  citationScore: number;
  gmbSignals: {
    hasGMBLink: boolean;
    gmbUrl: string | null;
  };
  overallScore: number;
}

interface LocalSEOSectionProps {
  metrics: LocalSEOMetrics | null;
  businessName?: string;
  isLoading?: boolean;
}

const getScoreColor = (score: number) => {
  if (score >= 70) return "text-green-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
};

const getScoreBg = (score: number) => {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
};

export const LocalSEOSection = ({ metrics, businessName, isLoading }: LocalSEOSectionProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border border-emerald-500/30">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            Local SEO Score
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!metrics) return null;

  const checks = [
    { 
      name: "Local Business Schema", 
      status: metrics.hasLocalSchema, 
      description: "Structured data helps search engines understand your business"
    },
    { 
      name: "NAP Consistency", 
      status: metrics.hasNAP && metrics.napConsistent, 
      partial: metrics.hasNAP && !metrics.napConsistent,
      description: "Name, Address, Phone should be consistent across the web"
    },
    { 
      name: "Google Maps Integration", 
      status: metrics.hasGoogleMapsEmbed, 
      description: "Embedded map helps users find your location"
    },
    { 
      name: "Local Keywords", 
      status: metrics.hasLocalKeywords, 
      description: "Location-based keywords improve local visibility"
    },
    { 
      name: "Business Hours", 
      status: metrics.hasBusinessHours, 
      description: "Display hours to improve local search and user experience"
    },
    { 
      name: "Review Signals", 
      status: metrics.hasReviews, 
      description: "Customer reviews boost local rankings and trust"
    },
    { 
      name: "Service Area", 
      status: metrics.hasServiceArea, 
      description: "Defining service area helps target local customers"
    },
    { 
      name: "GMB Profile Link", 
      status: metrics.gmbSignals.hasGMBLink, 
      description: "Link to Google Business Profile for credibility"
    },
  ];

  const passedChecks = checks.filter(c => c.status).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border border-emerald-500/30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Local SEO Score
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {businessName ? `Optimizing "${businessName}" for local search` : "Local business optimization analysis"}
            </p>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(metrics.overallScore)}`}>
              {metrics.overallScore}
            </div>
            <div className="text-xs text-muted-foreground">/100</div>
          </div>
        </div>

        {/* Score Bar */}
        <div className="h-3 bg-muted rounded-full overflow-hidden mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${metrics.overallScore}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full ${getScoreBg(metrics.overallScore)} rounded-full`}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-muted/30 border border-border/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Local Checks</span>
            </div>
            <div className="text-xl font-bold">{passedChecks}/{checks.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-xl bg-muted/30 border border-border/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Reviews</span>
            </div>
            <div className="text-xl font-bold">
              {metrics.hasReviews ? `~${metrics.estimatedReviewCount}` : "None detected"}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-muted/30 border border-border/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-muted-foreground">NAP</span>
            </div>
            <div className="text-xl font-bold">
              {metrics.napConsistent ? "Consistent" : metrics.hasNAP ? "Partial" : "Missing"}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-xl bg-muted/30 border border-border/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-muted-foreground">Citation Score</span>
            </div>
            <div className="text-xl font-bold">{metrics.citationScore}/100</div>
          </motion.div>
        </div>

        {/* Detailed Checks */}
        <div className="grid md:grid-cols-2 gap-3 mb-6">
          {checks.map((check, i) => (
            <motion.div
              key={check.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/20"
            >
              {check.status ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              ) : check.partial ? (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium">{check.name}</p>
                <p className="text-xs text-muted-foreground">{check.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Local Keywords */}
        {metrics.localKeywords.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Local Keywords Detected
            </h3>
            <div className="flex flex-wrap gap-2">
              {metrics.localKeywords.slice(0, 8).map((kw, i) => (
                <motion.span
                  key={kw}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm"
                >
                  {kw}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* GMB Link */}
        {metrics.gmbSignals.hasGMBLink && metrics.gmbSignals.gmbUrl && (
          <div className="pt-4 border-t border-border/50">
            <a 
              href={metrics.gmbSignals.gmbUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Google Business Profile
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LocalSEOSection;
