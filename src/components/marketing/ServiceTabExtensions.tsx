import { motion } from "framer-motion";
import { 
  TrendingUp, Zap, Target, Shield, Link2, Award, Boxes,
  FileText, Sparkles, Network, Palette, HelpCircle, Flame, Crosshair,
  Activity, Twitter, Linkedin, Facebook, Bell,
  Search, Code, Gauge, ImageIcon, Type, MapPin,
  BarChart3, Users, Clock, CheckCircle2, ArrowRight, Star, Globe, Rocket
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Animated counter component
const AnimatedNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, type: "spring" }}
      className="tabular-nums"
    >
      {value.toLocaleString()}{suffix}
    </motion.span>
  );
};

// Floating particle animation
const FloatingParticle = ({ delay, color }: { delay: number; color: string }) => (
  <motion.div
    className={`absolute w-2 h-2 rounded-full ${color} opacity-60`}
    initial={{ y: 0, opacity: 0 }}
    animate={{
      y: [-20, -60, -20],
      opacity: [0, 0.6, 0],
      x: [0, Math.random() * 40 - 20, 0]
    }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

// ============ BRON Extended Section ============
interface BRONExtendedSectionProps {
  domain?: string;
}

export const BRONExtendedSection = ({ domain }: BRONExtendedSectionProps) => {
  // Platform capabilities - not fake client data
  const capabilities = [
    { label: "Partner Network Size", value: "12,500+", icon: Users, desc: "Verified businesses" },
    { label: "Niche Categories", value: "200+", icon: Target, desc: "Industry verticals" },
    { label: "Avg. Placement Time", value: "48hrs", icon: Clock, desc: "From request to live" },
    { label: "Quality Guarantee", value: "DA 30+", icon: Award, desc: "Minimum site authority" },
  ];

  return (
    <div className="mt-8 space-y-8">
      {/* Diamond Flow Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative p-8 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-green-500/10 to-teal-500/5 border border-emerald-500/20 overflow-hidden"
      >
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute" style={{ left: `${10 + i * 12}%`, top: "50%" }}>
              <FloatingParticle delay={i * 0.4} color="bg-emerald-400" />
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Boxes className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold">The Diamond Flow Methodology</h3>
              <p className="text-sm text-muted-foreground">AI-powered topical relevance matching</p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: "Analyze", desc: "AI scans your content to identify topical clusters and authority signals", icon: Search },
              { step: "Match", desc: "Our network of 12,500+ businesses is filtered for niche relevance", icon: Target },
              { step: "Connect", desc: "Outreach is automated to relevant sites seeking quality content", icon: Link2 },
              { step: "Build", desc: "Natural, contextual links flow into your content clusters", icon: TrendingUp },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-4 rounded-xl bg-background/50 border border-emerald-500/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="font-semibold text-emerald-500">{item.step}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
                {i < 3 && (
                  <motion.div
                    className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Platform Capabilities Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {capabilities.map((cap, i) => (
          <motion.div
            key={cap.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <cap.icon className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-500">{cap.value}</p>
            <p className="text-xs font-medium mt-1">{cap.label}</p>
            <p className="text-[10px] text-muted-foreground">{cap.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Domain-specific CTA */}
      {domain && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-6 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20"
        >
          <div className="flex items-center gap-4">
            <Globe className="w-8 h-8 text-emerald-500" />
            <div className="flex-1">
              <p className="font-semibold">Ready to build authority for {domain}?</p>
              <p className="text-sm text-muted-foreground">Start your link building campaign with our partner network</p>
            </div>
            <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600">
              Get Started
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ============ CADE Extended Section ============
interface CADEExtendedSectionProps {
  domain?: string;
}

export const CADEExtendedSection = ({ domain }: CADEExtendedSectionProps) => {
  const contentTypes = [
    { type: "Listicles", desc: "Top 10, Best Of, X Ways To...", icon: "📋" },
    { type: "How-To Guides", desc: "Step-by-step tutorials", icon: "📖" },
    { type: "Comparison Posts", desc: "X vs Y breakdowns", icon: "⚖️" },
    { type: "Ultimate Guides", desc: "Comprehensive pillar content", icon: "🏆" },
    { type: "FAQ Articles", desc: "Answer box targeting", icon: "❓" },
    { type: "Case Studies", desc: "Data-driven stories", icon: "📊" },
    { type: "News & Updates", desc: "Industry freshness signals", icon: "📰" },
  ];

  return (
    <div className="mt-8 space-y-8">
      {/* Content Types Showcase */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative p-8 rounded-2xl bg-gradient-to-br from-violet-500/5 via-purple-500/10 to-fuchsia-500/5 border border-violet-500/20 overflow-hidden"
      >
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute" style={{ left: `${10 + i * 12}%`, top: "50%" }}>
              <FloatingParticle delay={i * 0.4} color="bg-violet-400" />
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold">7 AI-Generated Content Types</h3>
              <p className="text-sm text-muted-foreground">Each optimized for different search intents</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {contentTypes.map((content, i) => (
              <motion.div
                key={content.type}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="p-4 rounded-xl bg-background/50 border border-violet-500/10 text-center cursor-default"
              >
                <motion.span 
                  className="text-2xl block mb-2"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                >
                  {content.icon}
                </motion.span>
                <p className="font-medium text-xs">{content.type}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{content.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Competitor Analysis Visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="p-8 rounded-2xl bg-muted/30 border border-border"
      >
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-violet-500" />
          Competitor Reverse Engineering
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          CADE analyzes the top 5 ranking pages for each target keyword, extracting the patterns that make them rank.
        </p>
        
        <div className="grid md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((rank) => (
            <motion.div
              key={rank}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: rank * 0.1 }}
              className="relative p-4 rounded-xl bg-gradient-to-b from-violet-500/10 to-transparent border border-violet-500/20"
            >
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                {rank}
              </div>
              <div className="space-y-2">
                <div className="h-2 rounded bg-violet-500/30 w-full" />
                <div className="h-2 rounded bg-violet-500/20 w-4/5" />
                <div className="h-2 rounded bg-violet-500/10 w-3/5" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 text-center">
                Rank #{rank} analyzed
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="font-medium text-sm">AI Synthesis Complete</p>
              <p className="text-xs text-muted-foreground">Your article will outperform all 5 competitors</p>
            </div>
            <Badge className="bg-violet-500">10x Better</Badge>
          </div>
        </div>
      </motion.div>

      {/* ROI Calculator Teaser */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Content Pieces/Month", value: 30, suffix: "", icon: FileText, desc: "Automated articles" },
          { label: "Hours Saved", value: 120, suffix: "+", icon: Clock, desc: "Per month" },
          { label: "Cost Savings", value: 8500, suffix: "", prefix: "$", icon: BarChart3, desc: "vs. agency rates" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 text-center"
          >
            <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
              <stat.icon className="w-6 h-6 text-violet-500" />
            </div>
            <p className="text-3xl font-bold text-violet-500">
              {stat.prefix}<AnimatedNumber value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="font-medium text-sm mt-1">{stat.label}</p>
            <p className="text-xs text-muted-foreground">{stat.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ============ Social Signals Extended Section ============
interface SocialSignalsExtendedSectionProps {
  domain?: string;
}

export const SocialSignalsExtendedSection = ({ domain }: SocialSignalsExtendedSectionProps) => {
  const distributionSteps = [
    { time: "0s", action: "Article published by CADE", detail: "Content queued for distribution", status: "complete" },
    { time: "5s", action: "AI generates copy", detail: "Platform-specific posts created", status: "complete" },
    { time: "10s", action: "Hashtags optimized", detail: "Trending tags added automatically", status: "complete" },
    { time: "15s", action: "Posts scheduled", detail: "Optimal times selected", status: "complete" },
    { time: "Live", action: "Content goes live", detail: "Simultaneous release", status: "active" },
  ];

  const platformExamples = [
    { 
      platform: "X (Twitter)", 
      icon: Twitter, 
      color: "from-sky-400 to-blue-500",
      preview: "🚀 New guide: How to boost your local SEO rankings in 2025! Key takeaways inside 👇\n\n#SEO #LocalBusiness #Marketing",
      stats: { chars: 142, hashtags: 3 }
    },
    { 
      platform: "LinkedIn", 
      icon: Linkedin, 
      color: "from-blue-500 to-blue-700",
      preview: "Excited to share our latest comprehensive guide on local SEO strategies that are actually working in 2025.\n\nHere's what we cover:\n✅ Google Business optimization\n✅ Review generation tactics\n✅ Local citation building",
      stats: { chars: 240, hashtags: 0 }
    },
    { 
      platform: "Facebook", 
      icon: Facebook, 
      color: "from-blue-600 to-indigo-600",
      preview: "📍 Want to rank higher in local searches? We just published a complete guide covering everything from GMB optimization to review strategies. Check it out!",
      stats: { chars: 168, hashtags: 0 }
    },
  ];

  const benefits = [
    { icon: Zap, title: "Zero Manual Work", desc: "CADE handles everything" },
    { icon: Target, title: "Platform Optimized", desc: "Tailored for each network" },
    { icon: TrendingUp, title: "Consistent Presence", desc: "Never miss a post" },
    { icon: Sparkles, title: "AI-Powered Copy", desc: "Compelling content" },
  ];

  return (
    <div className="mt-8 space-y-6">
      {/* CADE Subscription Required Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/15 to-pink-500/10 border-2 border-violet-500/30 overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30"
              >
                <Sparkles className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  CADE Subscription Required
                  <Badge className="bg-violet-500/20 text-violet-500 border-violet-500/30">
                    Content Engine
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  Social Signals is powered by CADE. When you subscribe, every new article and FAQ drop is automatically shared across your connected social platforms.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center p-4 rounded-xl bg-background/50 border border-violet-500/20 min-w-[200px]">
              <p className="text-sm text-muted-foreground">Starting at</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-violet-500">$99</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <div className="mt-2 space-y-1 text-center">
                <p className="text-xs text-muted-foreground">2 articles per week</p>
                <p className="text-xs text-muted-foreground">3-5 FAQs per article</p>
              </div>
              <Badge variant="outline" className="mt-3 text-violet-500 border-violet-500/30">
                Includes Social Signals
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Benefits Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {benefits.map((benefit, i) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-xl bg-muted/30 border border-border text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-500/10 flex items-center justify-center mx-auto mb-2">
              <benefit.icon className="w-5 h-5 text-pink-500" />
            </div>
            <h4 className="font-semibold text-sm">{benefit.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{benefit.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

// ============ On-page SEO Extended Section ============
interface OnPageSEOExtendedSectionProps {
  domain?: string;
}

export const OnPageSEOExtendedSection = ({ domain }: OnPageSEOExtendedSectionProps) => {
  // Capabilities list - not fake completion stats
  const capabilities = [
    { task: "Meta title optimization", icon: Type, desc: "AI-generated, keyword-rich titles" },
    { task: "Meta description writing", icon: FileText, desc: "Compelling CTAs under 160 chars" },
    { task: "H1-H6 structure analysis", icon: Gauge, desc: "Proper heading hierarchy" },
    { task: "Image alt text generation", icon: ImageIcon, desc: "Accessible, keyword-optimized" },
    { task: "Schema markup injection", icon: Code, desc: "Rich snippets for SERPs" },
  ];

  return (
    <div className="mt-8 space-y-8">
      {/* Optimization Capabilities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative p-8 rounded-2xl bg-gradient-to-br from-amber-500/5 via-orange-500/10 to-yellow-500/5 border border-amber-500/20 overflow-hidden"
      >
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute" style={{ left: `${10 + i * 12}%`, top: "50%" }}>
              <FloatingParticle delay={i * 0.4} color="bg-amber-400" />
            </div>
          ))}
        </div>

        <h3 className="text-xl font-bold mb-6 flex items-center gap-3 relative z-10">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center"
          >
            <Gauge className="w-5 h-5 text-white" />
          </motion.div>
          On-page Optimization Capabilities
        </h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.task}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl bg-background/50 border border-amber-500/10 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <cap.icon className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium text-sm">{cap.task}</p>
                <p className="text-xs text-muted-foreground">{cap.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ROI Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-2 gap-6"
      >
        <div className="p-6 rounded-xl bg-muted/30 border border-border">
          <h4 className="font-bold mb-4 flex items-center gap-2 text-muted-foreground">
            <Users className="w-5 h-5" />
            Traditional SEO Agency
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Time to optimize 100 pages</span>
              <span className="font-semibold">40+ hours</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Monthly cost</span>
              <span className="font-semibold">$3,000+</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Human error rate</span>
              <span className="font-semibold text-red-500">15-20%</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <h4 className="font-bold mb-4 flex items-center gap-2 text-amber-500">
            <Rocket className="w-5 h-5" />
            BRON On-page Automation
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Time to optimize 100 pages</span>
              <span className="font-semibold text-amber-500">Under 5 minutes</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Monthly cost</span>
              <span className="font-semibold text-amber-500">Included</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Error rate</span>
              <span className="font-semibold text-amber-500">0%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Schema Types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="p-6 rounded-xl bg-muted/30 border border-border"
      >
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <Code className="w-5 h-5 text-amber-500" />
          Auto-Generated Schema Types
        </h4>
        <div className="flex flex-wrap gap-2">
          {["LocalBusiness", "Organization", "Article", "FAQPage", "BreadcrumbList", "WebPage", "Product", "Review", "Event", "HowTo"].map((schema, i) => (
            <motion.div
              key={schema}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
            >
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/5">
                {schema}
              </Badge>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ============ GMB Extended Section ============
interface GMBExtendedSectionProps {
  domain?: string;
}

export const GMBExtendedSection = ({ domain }: GMBExtendedSectionProps) => {
  const features = [
    { feature: "Profile Optimization", desc: "Complete GMB profile setup and optimization", icon: Target },
    { feature: "Photo Management", desc: "Automated photo uploads and organization", icon: ImageIcon },
    { feature: "Review Responses", desc: "AI-powered review response suggestions", icon: Star },
    { feature: "Post Scheduling", desc: "Automated updates, offers, and event posts", icon: Clock },
    { feature: "Q&A Management", desc: "Monitor and respond to customer questions", icon: HelpCircle },
    { feature: "Insights Analytics", desc: "Track views, searches, and actions", icon: BarChart3 },
  ];

  const automationSteps = [
    { step: "Connect", desc: "Link your Google Business Profile", icon: Link2 },
    { step: "Sync", desc: "Import all location data", icon: Globe },
    { step: "Optimize", desc: "AI enhances your listing", icon: Sparkles },
    { step: "Automate", desc: "CADE posts articles & FAQs", icon: Zap },
  ];

  return (
    <div className="mt-8 space-y-8">
      {/* GMB Automation Flow */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative p-8 rounded-2xl bg-gradient-to-br from-red-500/5 via-orange-500/10 to-yellow-500/5 border border-red-500/20 overflow-hidden"
      >
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute" style={{ left: `${10 + i * 12}%`, top: "50%" }}>
              <FloatingParticle delay={i * 0.4} color="bg-red-400" />
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MapPin className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold">Local Presence Automation</h3>
              <p className="text-sm text-muted-foreground">Keep your Google Business Profile active 24/7</p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {automationSteps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-4 rounded-xl bg-background/50 border border-red-500/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="font-semibold text-red-500">{item.step}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
                {i < 3 && (
                  <motion.div
                    className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Feature Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feat, i) => (
          <motion.div
            key={feat.feature}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-5 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20"
          >
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-3">
              <feat.icon className="w-5 h-5 text-red-500" />
            </div>
            <p className="font-medium text-sm">{feat.feature}</p>
            <p className="text-xs text-muted-foreground mt-1">{feat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* CADE Integration Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="p-6 rounded-xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 border border-red-500/20"
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <div className="flex-1">
            <p className="font-semibold">Powered by CADE Automation</p>
            <p className="text-sm text-muted-foreground">When CADE is active, articles and FAQs are automatically posted to your GMB listing</p>
          </div>
          <Badge className="bg-gradient-to-r from-red-500 to-orange-500">Auto-Sync</Badge>
        </div>
      </motion.div>
    </div>
  );
};

// ============ PPC Landing Pages Extended Section ============
interface PPCLandingPagesExtendedSectionProps {
  domain?: string;
}

export const PPCLandingPagesExtendedSection = ({ domain }: PPCLandingPagesExtendedSectionProps) => {
  const benefits = [
    { benefit: "Higher Quality Score", desc: "Keyword-matched pages boost Google Ads QS", icon: TrendingUp, value: "+40%" },
    { benefit: "Lower Cost Per Click", desc: "Improved relevance reduces CPC", icon: Target, value: "-25%" },
    { benefit: "Better Conversion Rates", desc: "Focused landing pages convert more", icon: Users, value: "+60%" },
    { benefit: "Faster Load Times", desc: "Optimized pages under 2s load", icon: Zap, value: "<2s" },
  ];

  const pageTypes = [
    { type: "Service Pages", desc: "Dedicated pages for each service keyword", icon: "🎯" },
    { type: "Location Pages", desc: "Geo-targeted landing pages", icon: "📍" },
    { type: "Product Pages", desc: "Individual product landing pages", icon: "🛒" },
    { type: "Lead Gen Pages", desc: "High-converting form pages", icon: "📋" },
    { type: "Offer Pages", desc: "Promotional and discount pages", icon: "🎁" },
    { type: "Comparison Pages", desc: "You vs. competitors pages", icon: "⚖️" },
  ];

  return (
    <div className="mt-8 space-y-8">
      {/* Page Types Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative p-8 rounded-2xl bg-gradient-to-br from-cyan-500/5 via-blue-500/10 to-indigo-500/5 border border-cyan-500/20 overflow-hidden"
      >
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute" style={{ left: `${10 + i * 12}%`, top: "50%" }}>
              <FloatingParticle delay={i * 0.4} color="bg-cyan-400" />
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <FileText className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold">Bulk Page Generation</h3>
              <p className="text-sm text-muted-foreground">Create keyword-specific landing pages at scale</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {pageTypes.map((page, i) => (
              <motion.div
                key={page.type}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="p-4 rounded-xl bg-background/50 border border-cyan-500/10 text-center cursor-default"
              >
                <motion.span 
                  className="text-2xl block mb-2"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                >
                  {page.icon}
                </motion.span>
                <p className="font-medium text-xs">{page.type}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{page.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Combined A/B Testing & Results Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="p-8 rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-cyan-500/20 overflow-hidden relative"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-500" />
            Built-in A/B Testing & Heat Tracking
          </h3>

          {/* Results Stats - Moved from separate section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {benefits.map((item, i) => (
              <motion.div
                key={item.benefit}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 text-center"
              >
                <div className="w-8 h-8 rounded-md bg-cyan-500/10 flex items-center justify-center mx-auto mb-2">
                  <item.icon className="w-4 h-4 text-cyan-500" />
                </div>
                <p className="text-xl font-bold text-cyan-500">{item.value}</p>
                <p className="font-medium text-xs mt-0.5">{item.benefit}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* A/B Testing Progress */}
          <p className="text-sm text-muted-foreground mb-4">
            Every landing page includes automatic split testing and visitor heat maps to optimize conversions.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: "Version A", desc: "Original design", progress: 45 },
              { label: "Version B", desc: "New headline", progress: 55 },
              { label: "Winner", desc: "Auto-selected after 1000 visits", progress: 100 },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-background/50 border border-cyan-500/10"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.progress}%</span>
                </div>
                <motion.div 
                  className="h-2 rounded-full bg-muted overflow-hidden"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                >
                  <div 
                    className={`h-full rounded-full ${i === 2 ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-cyan-500/50'}`}
                    style={{ width: `${item.progress}%` }}
                  />
                </motion.div>
                <p className="text-xs text-muted-foreground mt-2">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
