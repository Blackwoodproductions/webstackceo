import { motion } from "framer-motion";
import { Target, TrendingUp, Users, ExternalLink, Crown, Zap, Search, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const getOpportunityColor = (opportunity: "high" | "medium" | "low") => {
  switch (opportunity) {
    case "high": return "text-green-400 bg-green-500/20";
    case "medium": return "text-amber-400 bg-amber-500/20";
    case "low": return "text-muted-foreground bg-muted/50";
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
        <div className="p-6 rounded-2xl bg-card border border-border/50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Competitor Gap Analysis
          </h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!metrics) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="p-6 rounded-2xl bg-card border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Competitor Gap Analysis
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Traffic opportunity:</span>
            <span className="text-sm font-bold text-green-400">
              +{metrics.trafficOpportunity.toLocaleString()}/mo
            </span>
          </div>
        </div>

        {/* Competitor Comparison Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Domain</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">DR</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Traffic</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Keywords</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Backlinks</th>
              </tr>
            </thead>
            <tbody>
              {/* Your domain first */}
              <motion.tr 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border-b border-border/30 bg-primary/5"
              >
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-primary" />
                    <span className="font-medium">{currentDomain}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">You</span>
                  </div>
                </td>
                <td className="text-right py-3 px-2 font-semibold">{currentDR}</td>
                <td className="text-right py-3 px-2">{currentTraffic.toLocaleString()}</td>
                <td className="text-right py-3 px-2">-</td>
                <td className="text-right py-3 px-2">-</td>
              </motion.tr>
              
              {/* Competitors */}
              {metrics.competitors.map((comp, i) => (
                <motion.tr 
                  key={comp.domain}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (i + 1) * 0.05 }}
                  className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">#{i + 1}</span>
                      <a 
                        href={`https://${comp.domain}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {comp.domain}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2">
                    <span className={comp.domainRating > currentDR ? "text-red-400" : "text-green-400"}>
                      {comp.domainRating}
                    </span>
                  </td>
                  <td className="text-right py-3 px-2">{comp.organicTraffic.toLocaleString()}</td>
                  <td className="text-right py-3 px-2">{comp.organicKeywords.toLocaleString()}</td>
                  <td className="text-right py-3 px-2">{comp.backlinks.toLocaleString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Keyword Gaps */}
        {metrics.keywordGaps.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Keyword Opportunities ({metrics.totalKeywordGap} gaps found)
            </h3>
            <div className="grid gap-2">
              {metrics.keywordGaps.slice(0, 5).map((gap, i) => (
                <motion.div
                  key={gap.keyword}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30"
                >
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getOpportunityColor(gap.opportunity)}`}>
                    {gap.opportunity}
                  </span>
                  <span className="font-medium flex-1">{gap.keyword}</span>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Vol: {gap.volume.toLocaleString()}</span>
                    <span>KD: {gap.difficulty}</span>
                    <span>Comp: #{gap.competitorRank}</span>
                    <span className={gap.yourRank ? "" : "text-red-400"}>
                      You: {gap.yourRank ? `#${gap.yourRank}` : "Not ranking"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* SERP Features */}
        {metrics.serpFeatures.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              SERP Feature Opportunities
            </h3>
            <div className="flex flex-wrap gap-2">
              {metrics.serpFeatures.map((feature, i) => (
                <motion.div
                  key={feature.feature}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                    feature.hasIt 
                      ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                      : "bg-muted/50 text-muted-foreground border border-border/30"
                  }`}
                >
                  {feature.hasIt ? (
                    <Zap className="w-3.5 h-3.5" />
                  ) : (
                    <Target className="w-3.5 h-3.5" />
                  )}
                  <span>{feature.feature}</span>
                  {!feature.hasIt && feature.competitorsHaveIt > 0 && (
                    <span className="text-xs opacity-70">
                      ({feature.competitorsHaveIt} competitors have it)
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4 inline mr-2 text-green-400" />
            Outrank competitors with strategic link building and content optimization
          </div>
          <Button size="sm" className="gap-2" asChild>
            <a href="/pricing">
              <Zap className="w-4 h-4" />
              Close the Gap
            </a>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default CompetitorGapSection;
