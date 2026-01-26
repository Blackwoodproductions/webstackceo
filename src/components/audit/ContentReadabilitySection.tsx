import { motion } from "framer-motion";
import { FileText, BookOpen, Hash, Eye, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";

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

const getReadabilityGlow = (score: number) => {
  if (score >= 60) return "from-emerald-500/30 via-green-500/20 to-cyan-500/30";
  if (score >= 40) return "from-amber-500/30 via-orange-500/20 to-yellow-500/30";
  return "from-red-500/30 via-rose-500/20 to-pink-500/30";
};

export const ContentReadabilitySection = ({ metrics, isLoading }: ContentReadabilitySectionProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <div className="relative group p-6 rounded-2xl bg-card border border-border/50 h-full overflow-hidden">
          {/* Animated gradient glow */}
          <motion.div
            className="absolute -inset-[1px] rounded-[18px] opacity-40 blur-sm"
            animate={{
              background: [
                "linear-gradient(0deg, rgba(139,92,246,0.3), rgba(34,211,238,0.2), rgba(139,92,246,0.3))",
                "linear-gradient(120deg, rgba(34,211,238,0.3), rgba(139,92,246,0.2), rgba(34,211,238,0.3))",
                "linear-gradient(240deg, rgba(139,92,246,0.3), rgba(34,211,238,0.2), rgba(139,92,246,0.3))",
                "linear-gradient(360deg, rgba(34,211,238,0.3), rgba(139,92,246,0.2), rgba(34,211,238,0.3))",
              ],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Scanning line */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10">
            <FileText className="w-5 h-5 text-primary" />
            Content & Readability Analysis
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
      className="h-full"
    >
      <div className="relative group h-full">
        {/* Animated gradient glow background */}
        <motion.div
          className="absolute -inset-[1px] rounded-[18px] opacity-40 group-hover:opacity-60 blur-sm transition-opacity duration-500"
          animate={{
            background: [
              "linear-gradient(0deg, rgba(139,92,246,0.3), rgba(34,211,238,0.2), rgba(139,92,246,0.3))",
              "linear-gradient(120deg, rgba(34,211,238,0.3), rgba(139,92,246,0.2), rgba(34,211,238,0.3))",
              "linear-gradient(240deg, rgba(139,92,246,0.3), rgba(34,211,238,0.2), rgba(139,92,246,0.3))",
              "linear-gradient(360deg, rgba(34,211,238,0.3), rgba(139,92,246,0.2), rgba(34,211,238,0.3))",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-card via-card/98 to-violet-500/5 border border-border/50 h-full overflow-hidden">
          {/* Background grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />
          
          {/* Floating particles */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/30"
              style={{
                left: `${20 + i * 20}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
          
          {/* Scanning line */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/3 to-transparent pointer-events-none"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />

          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <motion.div
                className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/10"
                whileHover={{ scale: 1.05 }}
              >
                <FileText className="w-5 h-5 text-violet-400" />
              </motion.div>
              Content & Readability
            </h2>
            <motion.div 
              className={`px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r ${getReadabilityGlow(metrics.readingScore)} ${getReadabilityColor(metrics.readingScore)} border border-current/20`}
              animate={{ boxShadow: ["0 0 10px rgba(139,92,246,0.2)", "0 0 20px rgba(139,92,246,0.4)", "0 0 10px rgba(139,92,246,0.2)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {metrics.readingScore}/100
            </motion.div>
          </div>

          {/* Thin Content Warning */}
          {metrics.thinContentWarning && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 flex items-center gap-3 relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 relative z-10" />
              <div className="relative z-10">
                <p className="text-sm font-medium text-amber-400">Thin Content Detected</p>
                <p className="text-xs text-muted-foreground">Pages with less than 300 words may struggle to rank.</p>
              </div>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative z-10">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="relative group/stat p-4 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/40 overflow-hidden"
              >
                {/* Hover glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity"
                />
                
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <motion.span 
                    className="text-xl font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    {stat.value}
                  </motion.span>
                  {stat.status === "pass" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {stat.status === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Keyword Density */}
          {metrics.keywordDensity.length > 0 && (
            <div className="relative z-10">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </motion.div>
                Top Keywords Detected
              </h3>
              <div className="flex flex-wrap gap-2">
                {metrics.keywordDensity.slice(0, 10).map((kw, i) => (
                  <motion.span
                    key={kw.keyword}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ scale: 1.05, y: -1 }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500/20 to-purple-500/10 border border-violet-500/20 text-sm flex items-center gap-2 cursor-default"
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
          <div className="mt-6 pt-4 border-t border-border/50 relative z-10">
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
      </div>
    </motion.div>
  );
};

export default ContentReadabilitySection;
