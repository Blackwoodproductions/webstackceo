import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { 
  Sparkles, Zap, FileText, TrendingUp, Clock, Target,
  ArrowRight, CheckCircle2, Rocket, Brain, BarChart3,
  Bot, Cpu, Network, Workflow, Globe, PenTool
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CADEActivationPitchProps {
  domain?: string;
}

const features = [
  { icon: FileText, label: "AI Blog Posts", description: "Auto-generated SEO articles", color: "violet" },
  { icon: Target, label: "FAQ Generation", description: "Schema-ready Q&A content", color: "cyan" },
  { icon: TrendingUp, label: "Rank Tracking", description: "Monitor keyword positions", color: "emerald" },
  { icon: Clock, label: "Scheduled Publishing", description: "Set it and forget it", color: "amber" },
];

const benefits = [
  "10x faster content creation",
  "SEO-optimized from day one",
  "Automatic internal linking",
  "WordPress, Shopify & Wix support",
];

// Animated counter component
const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (value >= 1000) {
      return Math.round(latest / 1000) + "K";
    }
    return Math.round(latest).toString();
  });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: "easeOut" });
    const unsubscribe = rounded.on("change", (v) => setDisplayValue(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, count, rounded]);

  return <span>{displayValue}{suffix}</span>;
};

// Floating particle component
const FloatingParticle = ({ delay, duration, size, color }: { delay: number; duration: number; size: number; color: string }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: size,
      height: size,
      background: color,
      boxShadow: `0 0 ${size * 2}px ${color}`,
    }}
    initial={{ 
      x: Math.random() * 100 + "%", 
      y: "110%",
      opacity: 0,
    }}
    animate={{ 
      y: "-10%",
      opacity: [0, 1, 1, 0],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "linear",
    }}
  />
);

// Neural network node component
const NeuralNode = ({ x, y, delay }: { x: number; y: number; delay: number }) => (
  <motion.div
    className="absolute"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: [0, 1, 0.8, 1], opacity: [0, 1, 0.8, 1] }}
    transition={{ duration: 2, delay, repeat: Infinity, repeatType: "reverse" }}
  >
    <div className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
  </motion.div>
);

// Connection line component
const ConnectionLine = ({ x1, y1, x2, y2, delay }: { x1: number; y1: number; x2: number; y2: number; delay: number }) => (
  <motion.line
    x1={`${x1}%`}
    y1={`${y1}%`}
    x2={`${x2}%`}
    y2={`${y2}%`}
    stroke="url(#neural-gradient)"
    strokeWidth="1"
    initial={{ pathLength: 0, opacity: 0 }}
    animate={{ pathLength: [0, 1], opacity: [0, 0.6, 0.6, 0] }}
    transition={{ duration: 3, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

export const CADEActivationPitch = ({ domain }: CADEActivationPitchProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContactSupport = () => {
    window.open("mailto:support@webstack.ceo?subject=Activate CADE for " + (domain || "my domain"), "_blank");
  };

  const handleLearnMore = () => {
    window.open("/features/automated-blog", "_blank");
  };

  // Generate neural network nodes
  const nodes = [
    { x: 15, y: 20 }, { x: 25, y: 35 }, { x: 10, y: 50 },
    { x: 30, y: 65 }, { x: 20, y: 80 }, { x: 75, y: 25 },
    { x: 85, y: 40 }, { x: 70, y: 55 }, { x: 80, y: 70 },
    { x: 90, y: 85 }, { x: 50, y: 15 }, { x: 50, y: 85 },
  ];

  const connections = [
    { x1: 15, y1: 20, x2: 25, y2: 35 },
    { x1: 25, y1: 35, x2: 10, y2: 50 },
    { x1: 10, y1: 50, x2: 30, y2: 65 },
    { x1: 30, y1: 65, x2: 20, y2: 80 },
    { x1: 75, y1: 25, x2: 85, y2: 40 },
    { x1: 85, y1: 40, x2: 70, y2: 55 },
    { x1: 70, y1: 55, x2: 80, y2: 70 },
    { x1: 80, y1: 70, x2: 90, y2: 85 },
    { x1: 50, y1: 15, x2: 25, y2: 35 },
    { x1: 50, y1: 15, x2: 75, y2: 25 },
    { x1: 50, y1: 85, x2: 30, y2: 65 },
    { x1: 50, y1: 85, x2: 80, y2: 70 },
  ];

  return (
    <div 
      ref={containerRef}
      className="relative min-h-[calc(100vh-200px)] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-violet-950/30 to-slate-900 border border-violet-500/20"
    >
      {/* Animated Background Grid */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Neural Network Visualization */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.8)" />
            <stop offset="100%" stopColor="rgba(6,182,212,0.8)" />
          </linearGradient>
        </defs>
        {connections.map((conn, i) => (
          <ConnectionLine key={i} {...conn} delay={i * 0.2} />
        ))}
      </svg>

      {/* Neural Nodes */}
      <div className="absolute inset-0 pointer-events-none">
        {nodes.map((node, i) => (
          <NeuralNode key={i} {...node} delay={i * 0.15} />
        ))}
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 0.5}
            duration={8 + Math.random() * 4}
            size={2 + Math.random() * 3}
            color={i % 3 === 0 ? "rgba(139,92,246,0.6)" : i % 3 === 1 ? "rgba(6,182,212,0.6)" : "rgba(245,158,11,0.6)"}
          />
        ))}
      </div>

      {/* Animated Gradient Orbs */}
      <motion.div
        className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 60%)' }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 50, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 60%)' }}
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -50, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 max-w-4xl"
        >
          {/* Central AI Brain Icon */}
          <motion.div
            className="relative inline-flex items-center justify-center mb-8"
          >
            {/* Outer ring pulse */}
            <motion.div
              className="absolute w-40 h-40 rounded-full border border-violet-500/30"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute w-48 h-48 rounded-full border border-cyan-500/20"
              animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            />
            
            {/* Core icon */}
            <motion.div
              className="relative"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/40">
                <Brain className="w-14 h-14 text-white" />
              </div>
              
              {/* Orbiting icons */}
              {[Bot, Cpu, Network, Workflow].map((Icon, i) => (
                <motion.div
                  key={i}
                  className="absolute w-10 h-10 rounded-xl bg-background/80 backdrop-blur-sm border border-violet-500/30 flex items-center justify-center shadow-lg"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: Math.cos((i / 4) * Math.PI * 2) * 70 - 20,
                    y: Math.sin((i / 4) * Math.PI * 2) * 70 - 20,
                    rotate: [0, 360],
                  }}
                  transition={{
                    x: { duration: 0 },
                    y: { duration: 0 },
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  }}
                >
                  <Icon className="w-5 h-5 text-violet-400" />
                </motion.div>
              ))}
              
              {/* Sparkle accents */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    top: [-20, -10, 100, 90][i] + '%',
                    left: [-10, 100, 100, -20][i] + '%',
                  }}
                  animate={{
                    scale: [0.5, 1, 0.5],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Badge className="bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-violet-300 border-violet-500/40 mb-6 px-5 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Content Automation Engine
            </Badge>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            <span className="text-white">Activate </span>
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              CADE
            </span>
            <span className="text-white"> for</span>
            <br />
            <span className="text-white">{domain || "Your Website"}</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
          >
            Transform your content strategy with AI-powered blog posts, FAQs, and automatic publishing.
            <span className="text-violet-300"> Join hundreds of businesses saving 20+ hours per week.</span>
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12 max-w-5xl w-full"
        >
          {features.map((feature, i) => {
            const colorClasses = {
              violet: "from-violet-500/20 to-violet-600/10 border-violet-500/30 hover:border-violet-400/50",
              cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-400/50",
              emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-400/50",
              amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-400/50",
            }[feature.color];
            
            const iconColorClass = {
              violet: "text-violet-400",
              cyan: "text-cyan-400",
              emerald: "text-emerald-400",
              amber: "text-amber-400",
            }[feature.color];

            return (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -8 }}
                className={`relative p-6 rounded-2xl bg-gradient-to-br ${colorClasses} border backdrop-blur-sm transition-all duration-300 group cursor-pointer`}
              >
                {/* Glow effect on hover */}
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at center, ${
                      feature.color === 'violet' ? 'rgba(139,92,246,0.15)' :
                      feature.color === 'cyan' ? 'rgba(6,182,212,0.15)' :
                      feature.color === 'emerald' ? 'rgba(16,185,129,0.15)' :
                      'rgba(245,158,11,0.15)'
                    } 0%, transparent 70%)`
                  }}
                />
                
                <div className="relative">
                  <motion.div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-4`}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className={`w-7 h-7 ${iconColorClass}`} />
                  </motion.div>
                  <h3 className="font-bold text-white mb-1">{feature.label}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Benefits + CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="relative w-full max-w-5xl p-8 md:p-10 rounded-3xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-cyan-500/10 border border-violet-500/30 backdrop-blur-sm overflow-hidden"
        >
          {/* Animated border */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative flex flex-col lg:flex-row items-center gap-8">
            {/* Benefits List */}
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                What You Get With CADE
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 + i * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-200">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 w-full lg:w-auto">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button 
                  onClick={handleContactSupport}
                  size="lg"
                  className="w-full lg:w-auto bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600 text-white shadow-xl shadow-violet-500/30 px-10 py-6 text-lg font-semibold"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Activate CADE Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
              
              <Button 
                variant="ghost" 
                onClick={handleLearnMore}
                size="lg"
                className="text-slate-300 hover:text-white hover:bg-white/10"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                See How It Works
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="flex items-center justify-center gap-6 md:gap-12 mt-12 text-center"
        >
          {[
            { value: 500, suffix: "+", label: "Websites Powered", color: "text-violet-400" },
            { value: 50000, suffix: "+", label: "Articles Generated", color: "text-cyan-400" },
            { value: 4.9, suffix: "★", label: "User Rating", color: "text-amber-400", isDecimal: true },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 + i * 0.1 }}
              className="relative"
            >
              <p className={`text-3xl md:text-4xl font-bold ${stat.color}`}>
                {stat.isDecimal ? (
                  <>{stat.value}{stat.suffix}</>
                ) : (
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                )}
              </p>
              <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default CADEActivationPitch;
