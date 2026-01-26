import { motion } from "framer-motion";
import { MapPin, Star, Phone, Clock, Building2, CheckCircle2, AlertTriangle, XCircle, ExternalLink, Zap, Radio } from "lucide-react";

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

const getScoreGlow = (score: number) => {
  if (score >= 70) return "from-emerald-500/30 via-green-500/20 to-cyan-500/30";
  if (score >= 40) return "from-amber-500/30 via-orange-500/20 to-yellow-500/30";
  return "from-red-500/30 via-rose-500/20 to-pink-500/30";
};

export const LocalSEOSection = ({ metrics, businessName, isLoading }: LocalSEOSectionProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border border-emerald-500/30 overflow-hidden">
          {/* Animated gradient glow */}
          <motion.div
            className="absolute -inset-[1px] rounded-[18px] opacity-40 blur-sm"
            animate={{
              background: [
                "linear-gradient(0deg, rgba(16,185,129,0.3), rgba(34,211,238,0.2), rgba(16,185,129,0.3))",
                "linear-gradient(180deg, rgba(34,211,238,0.3), rgba(16,185,129,0.2), rgba(34,211,238,0.3))",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Radar pulse effect */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-64 h-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/20"
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
          
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10">
            <MapPin className="w-5 h-5 text-emerald-400" />
            Local SEO Score
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
            {[1, 2, 3, 4].map((i) => (
              <motion.div 
                key={i} 
                className="h-20 bg-muted/50 rounded-xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              />
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
      <div className="relative group">
        {/* Animated gradient glow background */}
        <motion.div
          className="absolute -inset-[1px] rounded-[18px] opacity-50 group-hover:opacity-70 blur-sm transition-opacity duration-500"
          animate={{
            background: [
              "linear-gradient(0deg, rgba(16,185,129,0.3), rgba(34,211,238,0.2), rgba(16,185,129,0.3))",
              "linear-gradient(120deg, rgba(34,211,238,0.3), rgba(16,185,129,0.2), rgba(34,211,238,0.3))",
              "linear-gradient(240deg, rgba(16,185,129,0.3), rgba(34,211,238,0.2), rgba(16,185,129,0.3))",
              "linear-gradient(360deg, rgba(34,211,238,0.3), rgba(16,185,129,0.2), rgba(34,211,238,0.3))",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-card via-card/98 to-emerald-500/5 border border-emerald-500/30 overflow-hidden">
          {/* Background grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `linear-gradient(hsl(152, 76%, 40%) 1px, transparent 1px), linear-gradient(90deg, hsl(152, 76%, 40%) 1px, transparent 1px)`,
              backgroundSize: '28px 28px'
            }}
          />
          
          {/* Location pulse effects */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-emerald-500/20"
              style={{
                width: 100 + i * 60,
                height: 100 + i * 60,
                right: -20 - i * 30,
                top: -20 - i * 30,
              }}
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.1, 0.3] 
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
          
          {/* Scanning line */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent pointer-events-none"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />

          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <motion.div
                  className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/10"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </motion.div>
                Local SEO Score
                <motion.span
                  className="ml-2 flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Radio className="w-2.5 h-2.5" />
                  LIVE
                </motion.span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {businessName ? `Optimizing "${businessName}" for local search` : "Local business optimization analysis"}
              </p>
            </div>
            <motion.div 
              className={`text-center px-4 py-2 rounded-xl bg-gradient-to-r ${getScoreGlow(metrics.overallScore)} border border-emerald-500/30`}
              animate={{ boxShadow: ["0 0 15px rgba(16,185,129,0.2)", "0 0 30px rgba(16,185,129,0.4)", "0 0 15px rgba(16,185,129,0.2)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div 
                className={`text-3xl font-bold ${getScoreColor(metrics.overallScore)}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                {metrics.overallScore}
              </motion.div>
              <div className="text-xs text-muted-foreground">/100</div>
            </motion.div>
          </div>

          {/* Score Bar */}
          <div className="h-3 bg-muted/50 rounded-full overflow-hidden mb-6 relative z-10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics.overallScore}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-cyan-500 rounded-full relative"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative z-10">
            {[
              { icon: Building2, color: "text-emerald-400", bg: "from-emerald-500/20 to-green-500/10", label: "Local Checks", value: `${passedChecks}/${checks.length}` },
              { icon: Star, color: "text-amber-400", bg: "from-amber-500/20 to-orange-500/10", label: "Reviews", value: metrics.hasReviews ? `~${metrics.estimatedReviewCount}` : "None" },
              { icon: Phone, color: "text-cyan-400", bg: "from-cyan-500/20 to-blue-500/10", label: "NAP", value: metrics.napConsistent ? "Consistent" : metrics.hasNAP ? "Partial" : "Missing" },
              { icon: Clock, color: "text-violet-400", bg: "from-violet-500/20 to-purple-500/10", label: "Citation Score", value: `${metrics.citationScore}/100` },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`relative p-4 rounded-xl bg-gradient-to-br ${stat.bg} border border-border/40 overflow-hidden group/stat`}
              >
                {/* Shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover/stat:opacity-100"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <motion.div 
                  className="text-xl font-bold relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  {stat.value}
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Detailed Checks */}
          <div className="grid md:grid-cols-2 gap-3 mb-6 relative z-10">
            {checks.map((check, i) => (
              <motion.div
                key={check.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ x: 4 }}
                className={`flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r ${
                  check.status 
                    ? "from-emerald-500/10 to-green-500/5 border-emerald-500/20" 
                    : check.partial 
                      ? "from-amber-500/10 to-orange-500/5 border-amber-500/20"
                      : "from-red-500/10 to-rose-500/5 border-red-500/20"
                } border`}
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
            <div className="mb-4 relative z-10">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-4 h-4 text-emerald-400" />
                </motion.div>
                Local Keywords Detected
              </h3>
              <div className="flex flex-wrap gap-2">
                {metrics.localKeywords.slice(0, 8).map((kw, i) => (
                  <motion.span
                    key={kw}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-green-500/10 border border-emerald-500/30 text-emerald-400 text-sm cursor-default"
                  >
                    {kw}
                  </motion.span>
                ))}
              </div>
            </div>
          )}

          {/* GMB Link */}
          {metrics.gmbSignals.hasGMBLink && metrics.gmbSignals.gmbUrl && (
            <div className="pt-4 border-t border-border/50 relative z-10">
              <a 
                href={metrics.gmbSignals.gmbUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors group/link"
              >
                <ExternalLink className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
                View Google Business Profile
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LocalSEOSection;
