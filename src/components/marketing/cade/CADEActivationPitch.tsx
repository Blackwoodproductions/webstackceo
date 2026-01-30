import { 
  Sparkles, Zap, FileText, TrendingUp, Clock, Target,
  ArrowRight, CheckCircle2, Brain, BarChart3, Cpu,
  Bot, Wand2, Layers, Globe, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface CADEActivationPitchProps {
  domain?: string;
}

const features = [
  { icon: FileText, label: "AI Blog Posts", color: "violet" },
  { icon: Target, label: "FAQ Generation", color: "cyan" },
  { icon: TrendingUp, label: "Rank Tracking", color: "emerald" },
  { icon: Clock, label: "Auto-Publish", color: "amber" },
] as const;

const workflowSteps = [
  { icon: Bot, label: "Learn", desc: "Analyzes your brand voice" },
  { icon: Wand2, label: "Create", desc: "Generates SEO content" },
  { icon: Layers, label: "Optimize", desc: "Adds links & schema" },
  { icon: Globe, label: "Publish", desc: "Posts to your CMS" },
];

export const CADEActivationPitch = ({ domain }: CADEActivationPitchProps) => {
  const handleContactSupport = () => {
    window.open("mailto:support@webstack.ceo?subject=Activate CADE for " + (domain || "my domain"), "_blank");
  };

  const handleLearnMore = () => {
    window.open("/features/automated-blog", "_blank");
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900 via-violet-950/20 to-slate-900">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-violet-500/20 via-violet-500/5 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-radial from-cyan-500/15 via-cyan-500/5 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '5s', animationDelay: '1s' }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-violet-400/60"
            style={{
              left: `${10 + (i * 11)}%`,
              top: `${15 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-8 px-8 py-10 lg:px-12 lg:py-12">
        
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl blur-xl opacity-50 animate-pulse" style={{ animationDuration: '3s' }} />
              <div className="relative grid h-18 w-18 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 shadow-2xl shadow-violet-500/40">
                <Brain className="h-9 w-9 text-white" />
              </div>
              <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <Badge className="mb-2 border-violet-500/40 bg-violet-500/20 px-3 py-1 text-xs text-violet-300 backdrop-blur-sm">
                <Cpu className="mr-1.5 h-3 w-3 animate-pulse" />
                AI Content Automation Engine
              </Badge>
              <h1 className="text-3xl font-bold leading-tight text-white lg:text-4xl">
                Activate <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">CADE</span> for {domain || "your site"}
              </h1>
              <p className="mt-2 text-slate-400 max-w-xl">
                Autonomous AI agent that creates, optimizes, and publishes SEO content 24/7
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={handleContactSupport}
              size="lg"
              className="relative overflow-hidden bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-8 text-base font-semibold text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 hover:scale-105"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              <Zap className="mr-2 h-5 w-5" />
              Activate CADE Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleLearnMore}
              size="lg"
              className="text-slate-400 hover:bg-white/10 hover:text-white border border-white/10"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              See How It Works
            </Button>
          </div>
        </div>

        {/* Main Content: Two-Column Layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          
          {/* Left: Features Pills + Benefits */}
          <div className="space-y-6">
            {/* Feature Pills Row */}
            <div className="flex flex-wrap gap-2">
              {features.map((feature, idx) => {
                const colorClasses = {
                  violet: "border-violet-500/40 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25",
                  cyan: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25",
                  emerald: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25",
                  amber: "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25",
                }[feature.color];

                return (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.08 }}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all cursor-default ${colorClasses}`}
                  >
                    <feature.icon className="h-4 w-4" />
                    {feature.label}
                  </motion.div>
                );
              })}
            </div>

            {/* Benefits List */}
            <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-300 mb-4">What You Get</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  "10x faster content creation",
                  "SEO-optimized from day one",
                  "Automatic internal linking",
                  "WordPress, Shopify & Wix",
                  "Schema markup ready",
                  "Multi-language support",
                ].map((b, idx) => (
                  <motion.div 
                    key={b} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.05 }}
                    className="flex items-center gap-2 text-sm text-slate-300"
                  >
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                    <span className="truncate">{b}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: AI Workflow Pipeline Visual */}
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-5">
              <Play className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">How CADE Works</h3>
            </div>
            
            {/* Pipeline Steps */}
            <div className="relative">
              {/* Connection line */}
              <div className="absolute top-8 left-8 right-8 h-0.5 bg-gradient-to-r from-violet-500/50 via-cyan-500/50 to-emerald-500/50" />
              
              <div className="relative grid grid-cols-4 gap-3">
                {workflowSteps.map((step, idx) => (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="flex flex-col items-center text-center"
                  >
                    {/* Icon circle */}
                    <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-3 border transition-transform hover:scale-110 ${
                      idx === 0 ? "bg-violet-500/20 border-violet-500/40 text-violet-400" :
                      idx === 1 ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" :
                      idx === 2 ? "bg-amber-500/20 border-amber-500/40 text-amber-400" :
                      "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    }`}>
                      <step.icon className="h-7 w-7" />
                    </div>
                    
                    {/* Step number */}
                    <span className="text-[10px] text-muted-foreground mb-1">Step {idx + 1}</span>
                    
                    {/* Label */}
                    <span className="text-sm font-semibold text-white">{step.label}</span>
                    <span className="text-xs text-slate-400 mt-1 leading-tight">{step.desc}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Animated processing bar */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>AI Processing Pipeline</span>
                <span className="text-emerald-400">Active</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/10 pt-6">
          <div className="flex flex-wrap items-center gap-8">
            {[
              { value: "500+", label: "Websites Powered", color: "text-violet-400" },
              { value: "50K+", label: "Articles Generated", color: "text-cyan-400" },
              { value: "4.9★", label: "User Rating", color: "text-amber-400" },
              { value: "14d", label: "Avg. Time to Rank", color: "text-emerald-400" },
            ].map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="text-center"
              >
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SOC 2 Compliant • Enterprise Ready
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default CADEActivationPitch;
