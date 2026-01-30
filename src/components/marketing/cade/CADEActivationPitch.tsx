import { 
  Sparkles, Zap, FileText, TrendingUp, Clock, Target,
  ArrowRight, CheckCircle2, Brain, BarChart3, Cpu, Network,
  Bot, Wand2, Layers, Globe, Shield, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface CADEActivationPitchProps {
  domain?: string;
}

const features = [
  { icon: FileText, label: "AI Blog Posts", description: "Auto-generated SEO articles with semantic optimization", color: "violet" },
  { icon: Target, label: "FAQ Generation", description: "Schema-ready Q&A content for featured snippets", color: "cyan" },
  { icon: TrendingUp, label: "Rank Tracking", description: "Real-time keyword position monitoring", color: "emerald" },
  { icon: Clock, label: "Scheduled Publishing", description: "Automated content calendar management", color: "amber" },
] as const;

const benefits = [
  "10x faster content creation",
  "SEO-optimized from day one",
  "Automatic internal linking",
  "WordPress, Shopify & Wix support",
];

const aiCapabilities = [
  { icon: Bot, title: "Autonomous Content Agent", description: "Self-improving AI that learns your brand voice and SEO patterns over time" },
  { icon: Wand2, title: "Semantic Optimization", description: "NLP-powered content that matches search intent and ranks faster" },
  { icon: Layers, title: "Multi-Platform Sync", description: "One-click publishing to WordPress, Shopify, Wix, and custom CMS" },
  { icon: Globe, title: "Global SEO Intelligence", description: "Localized content strategies based on regional search trends" },
];

const trustSignals = [
  { icon: Shield, label: "Enterprise Security", value: "SOC 2 Compliant" },
  { icon: Rocket, label: "Avg. Time to Rank", value: "14 Days" },
  { icon: Network, label: "API Integrations", value: "50+" },
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
      {/* Animated AI neural background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Radial glows */}
        <div 
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-violet-500/20 via-violet-500/5 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-radial from-cyan-500/15 via-cyan-500/5 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '5s', animationDelay: '1s' }}
        />
        
        {/* Flowing data lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="rgb(6 182 212)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          {/* Horizontal flowing lines */}
          <g className="animate-[flowRight_8s_linear_infinite]">
            <line x1="-100%" y1="20%" x2="200%" y2="20%" stroke="url(#lineGrad1)" strokeWidth="1" />
            <line x1="-100%" y1="40%" x2="200%" y2="40%" stroke="url(#lineGrad2)" strokeWidth="0.5" />
            <line x1="-100%" y1="60%" x2="200%" y2="60%" stroke="url(#lineGrad1)" strokeWidth="0.5" />
            <line x1="-100%" y1="80%" x2="200%" y2="80%" stroke="url(#lineGrad2)" strokeWidth="1" />
          </g>
        </svg>

        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-violet-400/60"
            style={{
              left: `${10 + (i * 7)}%`,
              top: `${15 + (i % 4) * 20}%`,
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
            {/* Brain icon with glow */}
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

          {/* CTA Buttons */}
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

        {/* Features Grid */}
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {features.map((feature, idx) => {
              const colorClasses = {
                violet: "border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/50",
                cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50",
                emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50",
                amber: "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50",
              }[feature.color];

              return (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`group flex flex-col gap-3 rounded-xl border p-5 backdrop-blur-sm transition-all duration-300 cursor-pointer ${colorClasses}`}
                >
                  <feature.icon className="h-6 w-6 transition-transform group-hover:scale-110" />
                  <div>
                    <p className="text-sm font-semibold text-white">{feature.label}</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Benefits sidebar */}
          <div className="flex flex-col gap-3 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">What You Get</p>
            {benefits.map((b, idx) => (
              <motion.div 
                key={b} 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="flex items-center gap-3 text-sm text-slate-300"
              >
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                {b}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

        {/* AI Capabilities Section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Network className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Advanced AI Capabilities</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {aiCapabilities.map((cap, idx) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="group relative rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-300"
              >
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <cap.icon className="h-8 w-8 text-violet-400 mb-3 group-hover:text-violet-300 transition-colors" />
                <h3 className="text-sm font-semibold text-white mb-2">{cap.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{cap.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats & Trust Signals */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 border-t border-white/10 pt-8">
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-8">
            {[
              { value: "500+", label: "Websites Powered", color: "text-violet-400" },
              { value: "50K+", label: "Articles Generated", color: "text-cyan-400" },
              { value: "4.9★", label: "User Rating", color: "text-amber-400" },
            ].map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className="text-center"
              >
                <p className={`text-2xl lg:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center gap-4">
            {trustSignals.map((signal, idx) => (
              <motion.div
                key={signal.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + idx * 0.1 }}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
              >
                <signal.icon className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs text-slate-400">{signal.label}</p>
                  <p className="text-xs font-semibold text-white">{signal.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
        @keyframes flowRight {
          0% { transform: translateX(-33%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
};

export default CADEActivationPitch;
