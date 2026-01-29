import { motion } from "framer-motion";
import { 
  Sparkles, Zap, FileText, TrendingUp, Clock, Target,
  ArrowRight, CheckCircle2, Rocket, Brain, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CADEActivationPitchProps {
  domain?: string;
}

const features = [
  { icon: FileText, label: "AI Blog Posts", description: "Auto-generated SEO articles" },
  { icon: Target, label: "FAQ Generation", description: "Schema-ready Q&A content" },
  { icon: TrendingUp, label: "Rank Tracking", description: "Monitor keyword positions" },
  { icon: Clock, label: "Scheduled Publishing", description: "Set it and forget it" },
];

const benefits = [
  "10x faster content creation",
  "SEO-optimized from day one",
  "Automatic internal linking",
  "WordPress, Shopify & Wix support",
];

export const CADEActivationPitch = ({ domain }: CADEActivationPitchProps) => {
  const handleContactSupport = () => {
    window.open("mailto:support@webstack.ceo?subject=Activate CADE for " + (domain || "my domain"), "_blank");
  };

  const handleLearnMore = () => {
    window.open("/features/automated-blog", "_blank");
  };

  return (
    <div className="relative py-8 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)' }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          {/* Animated Icon */}
          <motion.div
            className="relative inline-flex items-center justify-center mb-6"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 blur-2xl scale-150" />
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-violet-500/30">
              <Brain className="w-12 h-12 text-white" />
              {/* Orbiting sparkles */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 1,
                  }}
                >
                  <Sparkles 
                    className="w-3 h-3 text-amber-400" 
                    style={{ transform: `translateX(40px) translateY(-6px)` }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/30 mb-4 px-4 py-1.5">
              <Sparkles className="w-3 h-3 mr-1.5" />
              Unlock AI Content Automation
            </Badge>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Activate <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">CADE</span> for{" "}
            <span className="text-foreground">{domain || "Your Website"}</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Transform your content strategy with AI-powered blog posts, FAQs, and automatic publishing.
            Join hundreds of businesses saving 20+ hours per week.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="relative p-5 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 hover:border-violet-500/30 transition-all group overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-violet-500/0 group-hover:from-violet-500/5 group-hover:to-cyan-500/5 transition-all" />
              
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{feature.label}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Benefits + CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="relative p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-cyan-500/10 border border-violet-500/20 overflow-hidden"
        >
          {/* Background pattern */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative flex flex-col md:flex-row items-center gap-8">
            {/* Benefits List */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-violet-400" />
                What You Get With CADE
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={handleContactSupport}
                  size="lg"
                  className="w-full md:w-auto bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 px-8"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Activate CADE Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
              
              <Button 
                variant="ghost" 
                onClick={handleLearnMore}
                className="text-muted-foreground hover:text-foreground"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                See How It Works
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex items-center justify-center gap-8 mt-8 text-center"
        >
          <div>
            <p className="text-2xl font-bold text-violet-400">500+</p>
            <p className="text-xs text-muted-foreground">Websites Powered</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-2xl font-bold text-cyan-400">50K+</p>
            <p className="text-xs text-muted-foreground">Articles Generated</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-2xl font-bold text-emerald-400">4.9★</p>
            <p className="text-xs text-muted-foreground">User Rating</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CADEActivationPitch;
