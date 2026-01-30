import { 
  Sparkles, Zap, FileText, TrendingUp, Clock, Target,
  ArrowRight, CheckCircle2, Brain, BarChart3, Cpu,
  Bot, Wand2, Layers, Globe, Play, Star, Shield,
  Rocket, Crown, Gift, Award, Users, LineChart
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

const pricingTiers = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    description: "Perfect for small businesses",
    features: ["2 AI Articles/month", "Basic FAQ Generation", "WordPress Integration", "Email Support"],
    popular: false,
    color: "cyan",
  },
  {
    name: "Professional",
    price: "$149",
    period: "/mo",
    description: "For growing businesses",
    features: ["10 AI Articles/month", "Unlimited FAQs", "All CMS Integrations", "Priority Support", "Schema Markup", "Internal Linking"],
    popular: true,
    color: "violet",
  },
  {
    name: "Enterprise",
    price: "$399",
    period: "/mo",
    description: "Full content automation",
    features: ["Unlimited Articles", "Multi-site Support", "Custom AI Training", "Dedicated Manager", "API Access", "White Label"],
    popular: false,
    color: "emerald",
  },
];

const testimonials = [
  { name: "Sarah M.", role: "Marketing Director", quote: "CADE saved us 40+ hours per month on content creation.", rating: 5 },
  { name: "James K.", role: "SEO Specialist", quote: "Our organic traffic increased 340% in 3 months.", rating: 5 },
  { name: "Lisa P.", role: "Agency Owner", quote: "The ROI is incredible. Best investment we've made.", rating: 5 },
];

export const CADEActivationPitch = ({ domain }: CADEActivationPitchProps) => {
  const handleSubscribe = (tier?: string) => {
    window.location.href = "/pricing?feature=cade&tier=" + (tier || 'professional') + "&domain=" + encodeURIComponent(domain || "");
  };

  const handleLearnMore = () => {
    window.open("/features/automated-blog", "_blank");
  };

  return (
    <div className="relative overflow-hidden" style={{ contain: 'layout style' }}>
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div 
          className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-radial from-violet-500/15 via-violet-500/5 to-transparent rounded-full blur-3xl"
          style={{ animation: 'pulse 6s ease-in-out infinite' }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-radial from-cyan-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl"
          style={{ animation: 'pulse 8s ease-in-out infinite 2s' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-fuchsia-500/8 via-transparent to-transparent rounded-full blur-3xl"
          style={{ animation: 'pulse 10s ease-in-out infinite 4s' }}
        />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-slate-900/95 via-violet-950/30 to-slate-900/95 backdrop-blur-xl p-8 lg:p-12"
        >
          {/* Top badge */}
          <div className="flex justify-center mb-6">
            <Badge className="px-4 py-2 text-sm bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border-violet-500/40 text-violet-200">
              <Rocket className="w-4 h-4 mr-2" />
              Unlock AI-Powered Content for {domain || "Your Website"}
            </Badge>
          </div>

          {/* Main Hero */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                Transform Your Content
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                Strategy with AI
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              CADE uses advanced AI to write SEO-optimized blog posts, generate FAQs, and auto-publish to your CMS. 
              Join 500+ businesses already ranking higher with AI content.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <Button 
                onClick={() => handleSubscribe('professional')}
                size="lg"
                className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 px-10 py-6 text-lg font-bold text-white shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 transition-all duration-300 hover:scale-105 border border-violet-400/30"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                <Zap className="mr-2 h-5 w-5" />
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLearnMore}
                size="lg"
                className="px-8 py-6 text-lg text-slate-300 border-slate-600 hover:bg-slate-800/50 hover:border-violet-500/50"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>500+ active users</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Pills Row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {features.map((feature, idx) => {
            const colorClasses = {
              violet: "border-violet-500/40 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 shadow-[0_0_20px_rgba(139,92,246,0.15)]",
              cyan: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
              emerald: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
              amber: "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 shadow-[0_0_20px_rgba(245,158,11,0.15)]",
            }[feature.color];

            return (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + idx * 0.08 }}
                className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-all cursor-default ${colorClasses}`}
              >
                <feature.icon className="h-4 w-4" />
                {feature.label}
              </motion.div>
            );
          })}
        </motion.div>

        {/* How It Works */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl p-8"
        >
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-cyan-500/20 border-cyan-500/40 text-cyan-300">
              <Cpu className="w-3 h-3 mr-1.5" />
              AI Workflow
            </Badge>
            <h2 className="text-2xl lg:text-3xl font-bold text-white">How CADE Works</h2>
          </div>
          
          {/* Pipeline Steps */}
          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-12 left-[10%] right-[10%] h-1 bg-gradient-to-r from-violet-500/50 via-cyan-500/50 to-emerald-500/50 rounded-full hidden lg:block" />
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {workflowSteps.map((step, idx) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className={`relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center mb-4 border-2 transition-transform hover:scale-110 ${
                    idx === 0 ? "bg-violet-500/20 border-violet-500/50 text-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.3)]" :
                    idx === 1 ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)]" :
                    idx === 2 ? "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]" :
                    "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                  }`}>
                    <step.icon className="h-9 w-9" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-white">{step.label}</span>
                  <span className="text-sm text-slate-400 mt-1">{step.desc}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pricing Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="text-center">
            <Badge className="mb-4 bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300">
              <Crown className="w-3 h-3 mr-1.5" />
              Pricing Plans
            </Badge>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">Choose Your Plan</h2>
            <p className="text-slate-400">Start free, upgrade when you're ready</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingTiers.map((tier, idx) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className={`relative rounded-2xl border backdrop-blur-xl p-6 ${
                  tier.popular 
                    ? 'border-violet-500/50 bg-gradient-to-b from-violet-950/50 to-slate-900/80 shadow-[0_0_40px_rgba(139,92,246,0.2)]' 
                    : 'border-slate-700/50 bg-slate-900/50'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0 shadow-lg">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{tier.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                    <span className="text-slate-400">{tier.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${
                        tier.color === 'violet' ? 'text-violet-400' :
                        tier.color === 'cyan' ? 'text-cyan-400' : 'text-emerald-400'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={() => handleSubscribe(tier.name.toLowerCase())}
                  className={`w-full ${
                    tier.popular 
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                  }`}
                >
                  {tier.popular ? 'Start Free Trial' : 'Get Started'}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl p-8"
        >
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-amber-500/20 border-amber-500/40 text-amber-300">
              <Award className="w-3 h-3 mr-1.5" />
              Testimonials
            </Badge>
            <h2 className="text-2xl font-bold text-white">Loved by Content Teams</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm mb-4">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-950/50 via-fuchsia-950/50 to-violet-950/50 backdrop-blur-xl p-8 text-center"
        >
          <Gift className="w-12 h-12 mx-auto mb-4 text-violet-400" />
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">
            Ready to Transform Your Content?
          </h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">
            Join 500+ businesses using CADE to create SEO-optimized content at scale. 
            Start your free 14-day trial today.
          </p>
          <Button 
            onClick={() => handleSubscribe('professional')}
            size="lg"
            className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 px-12 py-6 text-lg font-bold text-white shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 transition-all duration-300 hover:scale-105"
          >
            <Zap className="mr-2 h-5 w-5" />
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        {/* Stats Row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-8 py-6"
        >
          {[
            { value: "500+", label: "Websites Powered", icon: Globe, color: "text-violet-400" },
            { value: "50K+", label: "Articles Generated", icon: FileText, color: "text-cyan-400" },
            { value: "340%", label: "Avg Traffic Increase", icon: LineChart, color: "text-emerald-400" },
            { value: "4.9★", label: "User Rating", icon: Star, color: "text-amber-400" },
          ].map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + idx * 0.1 }}
              className="flex items-center gap-3 px-6 py-3 rounded-xl border border-slate-700/50 bg-slate-900/50"
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div className="text-center">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default CADEActivationPitch;
