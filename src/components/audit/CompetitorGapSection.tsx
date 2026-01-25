import { motion } from "framer-motion";
import { Target, TrendingUp, Users, ExternalLink, Crown, Zap, Search, BarChart3, ArrowUpRight, Trophy, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Competitor {
  domain: string;
  domainRating: number;
  organicTraffic: number;
  organicKeywords: number;
  backlinks: number;
}

interface KeywordGap {
  keyword: string;
  volume: number;
  difficulty: number;
  competitorRank: number;
  yourRank: number | null;
  opportunity: "high" | "medium" | "low";
}

interface SerpFeature {
  feature: string;
  hasIt: boolean;
  competitorsHaveIt: number;
}

interface CompetitorGapMetrics {
  competitors: Competitor[];
  keywordGaps: KeywordGap[];
  serpFeatures: SerpFeature[];
  totalKeywordGap: number;
  trafficOpportunity: number;
}

interface CompetitorGapSectionProps {
  metrics: CompetitorGapMetrics | null;
  currentDomain: string;
  currentDR: number;
  currentTraffic: number;
  isLoading?: boolean;
}

const getOpportunityConfig = (opportunity: "high" | "medium" | "low") => {
  switch (opportunity) {
    case "high": return { 
      color: "text-emerald-400", 
      bg: "bg-gradient-to-r from-emerald-500/20 to-green-500/10", 
      border: "border-emerald-500/30",
      icon: Flame
    };
    case "medium": return { 
      color: "text-amber-400", 
      bg: "bg-gradient-to-r from-amber-500/20 to-orange-500/10", 
      border: "border-amber-500/30",
      icon: Sparkles
    };
    case "low": return { 
      color: "text-slate-400", 
      bg: "bg-muted/30", 
      border: "border-border/50",
      icon: Target
    };
  }
};

export const CompetitorGapSection = ({ 
  metrics, 
  currentDomain, 
  currentDR, 
  currentTraffic, 
  isLoading 
}: CompetitorGapSectionProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="p-8 rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            Competitor Gap Analysis
          </h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!metrics) return null;

  // Find max values for relative comparisons
  const maxTraffic = Math.max(currentTraffic, ...metrics.competitors.map(c => c.organicTraffic));
  const maxDR = Math.max(currentDR, ...metrics.competitors.map(c => c.domainRating));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="rounded-3xl bg-gradient-to-br from-card via-card to-violet-500/5 border border-border/50 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-transparent border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Competitor Gap Analysis</h2>
                <p className="text-sm text-muted-foreground">See how you stack up against top competitors</p>
              </div>
            </div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/10 border border-emerald-500/30"
            >
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs text-emerald-400/80 font-medium">Traffic Opportunity</div>
                <div className="text-xl font-bold text-emerald-400">+{metrics.trafficOpportunity.toLocaleString()}<span className="text-sm font-normal">/mo</span></div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Competitor Comparison Cards */}
        <div className="p-6">
          <div className="grid gap-3">
            {/* Your domain - highlighted */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border-2 border-primary/30 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{currentDomain}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">YOUR SITE</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Current benchmark position</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{currentDR}</div>
                    <div className="text-xs text-muted-foreground">Domain Rating</div>
                  </div>
                  <div className="w-px h-10 bg-border/50" />
                  <div className="text-center">
                    <div className="text-2xl font-bold">{currentTraffic.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Monthly Traffic</div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Competitors */}
            {metrics.competitors.map((comp, i) => {
              const drDiff = comp.domainRating - currentDR;
              const trafficProgress = (comp.organicTraffic / maxTraffic) * 100;
              
              return (
                <motion.div
                  key={comp.domain}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (i + 1) * 0.08 }}
                  className="group relative p-5 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 hover:border-border transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                        i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                        i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800' :
                        i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {i === 0 ? <Trophy className="w-5 h-5" /> : `#${i + 1}`}
                      </div>
                      <div>
                        <a 
                          href={`https://${comp.domain}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-semibold text-lg hover:text-primary transition-colors flex items-center gap-2 group/link"
                        >
                          {comp.domain}
                          <ExternalLink className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </a>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{comp.organicKeywords.toLocaleString()} keywords</span>
                          <span>•</span>
                          <span>{comp.backlinks.toLocaleString()} backlinks</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-2xl font-bold ${drDiff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {comp.domainRating}
                          </span>
                          {drDiff !== 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${drDiff > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {drDiff > 0 ? `+${drDiff}` : drDiff}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">DR</div>
                      </div>
                      <div className="w-px h-10 bg-border/50" />
                      <div className="text-center min-w-[100px]">
                        <div className="text-2xl font-bold">{comp.organicTraffic.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Traffic/mo</div>
                        <Progress value={trafficProgress} className="h-1 mt-1.5 bg-muted" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Keyword Opportunities */}
        {metrics.keywordGaps.length > 0 && (
          <div className="px-6 pb-6">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/20">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Search className="w-4 h-4 text-white" />
                </div>
                <span>Keyword Opportunities</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {metrics.totalKeywordGap} gaps found
                </span>
              </h3>
              <div className="grid gap-2">
                {metrics.keywordGaps.slice(0, 5).map((gap, i) => {
                  const config = getOpportunityConfig(gap.opportunity);
                  const OpportunityIcon = config.icon;
                  
                  return (
                    <motion.div
                      key={gap.keyword}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-4 p-4 rounded-xl ${config.bg} ${config.border} border`}
                    >
                      <div className={`flex items-center gap-2 ${config.color}`}>
                        <OpportunityIcon className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wide">{gap.opportunity}</span>
                      </div>
                      <span className="font-semibold flex-1">{gap.keyword}</span>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-semibold">{gap.volume.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Volume</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-semibold ${gap.difficulty > 50 ? 'text-red-400' : gap.difficulty > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {gap.difficulty}
                          </div>
                          <div className="text-xs text-muted-foreground">KD</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-primary">#{gap.competitorRank}</div>
                          <div className="text-xs text-muted-foreground">Competitor</div>
                        </div>
                        <div className="text-center min-w-[70px]">
                          <div className={`font-semibold ${gap.yourRank ? '' : 'text-red-400'}`}>
                            {gap.yourRank ? `#${gap.yourRank}` : 'Not ranking'}
                          </div>
                          <div className="text-xs text-muted-foreground">Your Rank</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SERP Features */}
        {metrics.serpFeatures.length > 0 && (
          <div className="px-6 pb-6">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <span>SERP Feature Opportunities</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {metrics.serpFeatures.map((feature, i) => (
                  <motion.div
                    key={feature.feature}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2.5 ${
                      feature.hasIt 
                        ? "bg-gradient-to-r from-emerald-500/20 to-green-500/10 text-emerald-400 border border-emerald-500/30" 
                        : "bg-muted/50 text-muted-foreground border border-border/50 hover:border-amber-500/30 hover:bg-amber-500/10 transition-colors"
                    }`}
                  >
                    {feature.hasIt ? (
                      <Zap className="w-4 h-4" />
                    ) : (
                      <Target className="w-4 h-4" />
                    )}
                    <span className="font-medium">{feature.feature}</span>
                    {!feature.hasIt && feature.competitorsHaveIt > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                        {feature.competitorsHaveIt} have it
                      </span>
                    )}
                    {feature.hasIt && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        ✓ Active
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CTA Footer */}
        <div className="p-6 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-transparent border-t border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="font-semibold">Ready to outrank your competitors?</div>
                <div className="text-sm text-muted-foreground">Strategic link building and content optimization to close the gap</div>
              </div>
            </div>
            <Button size="lg" className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25" asChild>
              <a href="/pricing">
                <Zap className="w-4 h-4" />
                Close the Gap
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CompetitorGapSection;
