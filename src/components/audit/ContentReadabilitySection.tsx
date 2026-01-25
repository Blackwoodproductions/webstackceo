import { motion } from "framer-motion";
import { FileText, BookOpen, Hash, Eye, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ContentMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  readingLevel: string;
  readingScore: number; // Flesch-Kincaid score
  keywordDensity: { keyword: string; count: number; density: number }[];
  thinContentWarning: boolean;
}

interface ContentReadabilitySectionProps {
  metrics: ContentMetrics | null;
  isLoading?: boolean;
}

const getReadabilityColor = (score: number) => {
  if (score >= 60) return "text-green-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
};

const getReadabilityBg = (score: number) => {
  if (score >= 60) return "bg-green-500/20";
  if (score >= 40) return "bg-amber-500/20";
  return "bg-red-500/20";
};

export const ContentReadabilitySection = ({ metrics, isLoading }: ContentReadabilitySectionProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="p-6 rounded-2xl bg-card border border-border/50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Content & Readability Analysis
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

  const stats = [
    { label: "Word Count", value: metrics.wordCount.toLocaleString(), icon: FileText, status: metrics.wordCount >= 300 ? "pass" : "warning" },
    { label: "Sentences", value: metrics.sentenceCount.toLocaleString(), icon: BookOpen, status: "neutral" },
    { label: "Avg Words/Sentence", value: metrics.avgWordsPerSentence.toFixed(1), icon: Hash, status: metrics.avgWordsPerSentence <= 20 ? "pass" : "warning" },
    { label: "Reading Level", value: metrics.readingLevel, icon: Eye, status: metrics.readingScore >= 50 ? "pass" : "warning" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="p-6 rounded-2xl bg-card border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Content & Readability Analysis
          </h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getReadabilityBg(metrics.readingScore)} ${getReadabilityColor(metrics.readingScore)}`}>
            Score: {metrics.readingScore}/100
          </div>
        </div>

        {/* Thin Content Warning */}
        {metrics.thinContentWarning && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-400">Thin Content Detected</p>
              <p className="text-xs text-muted-foreground">Pages with less than 300 words may struggle to rank. Consider adding more valuable content.</p>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-muted/30 border border-border/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{stat.value}</span>
                {stat.status === "pass" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {stat.status === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Keyword Density */}
        {metrics.keywordDensity.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              Top Keywords Detected
            </h3>
            <div className="flex flex-wrap gap-2">
              {metrics.keywordDensity.slice(0, 10).map((kw, i) => (
                <motion.span
                  key={kw.keyword}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="px-3 py-1.5 rounded-lg bg-muted/50 text-sm flex items-center gap-2"
                >
                  <span className="font-medium">{kw.keyword}</span>
                  <span className="text-xs text-muted-foreground">
                    {kw.count}x ({kw.density.toFixed(1)}%)
                  </span>
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Readability Tips */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <h3 className="text-sm font-semibold mb-2">Readability Tips</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              {metrics.avgWordsPerSentence <= 20 ? (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-500" />
              )}
              Average sentence length: {metrics.avgWordsPerSentence <= 20 ? "Good" : "Consider shorter sentences"}
            </li>
            <li className="flex items-center gap-2">
              {metrics.wordCount >= 300 ? (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-500" />
              )}
              Word count: {metrics.wordCount >= 300 ? "Sufficient content" : "Add more content (aim for 300+ words)"}
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default ContentReadabilitySection;
