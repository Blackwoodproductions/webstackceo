import { motion } from "framer-motion";
import { 
  TrendingUp, Zap, Target, Shield, Link2, Award, Boxes,
  FileText, Sparkles, Network, Palette, HelpCircle, Flame, Crosshair,
  Activity, Twitter, Linkedin, Facebook, Bell,
  Search, Code, Gauge, ImageIcon, Type,
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
export const BRONExtendedSection = () => {
  const stats = [
    { label: "Average DA Increase", value: 23, suffix: "%", icon: TrendingUp },
    { label: "Links Built Monthly", value: 847, suffix: "+", icon: Link2 },
    { label: "Partner Network", value: 12500, suffix: "+", icon: Users },
    { label: "Time to First Link", value: 48, suffix: "hrs", icon: Clock },
  ];

  const testimonials = [
    {
      quote: "BRON took our DA from 24 to 51 in just 8 months. The quality of links is incredible.",
      author: "Sarah Chen",
      role: "SEO Director, TechScale",
      avatar: "SC"
    },
    {
      quote: "Finally, link building that doesn't feel like spam. Real businesses, real results.",
      author: "Marcus Williams",
      role: "Founder, GrowthLab",
      avatar: "MW"
    }
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <stat.icon className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-500">
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="grid md:grid-cols-2 gap-4">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.author}
            initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-xl bg-muted/30 border border-border"
          >
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-foreground mb-4 italic">"{t.quote}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold text-sm">
                {t.avatar}
              </div>
              <div>
                <p className="text-sm font-medium">{t.author}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ============ CADE Extended Section ============
export const CADEExtendedSection = () => {
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
export const SocialSignalsExtendedSection = () => {
  const platforms = [
    { name: "X (Twitter)", posts: 234, engagement: "12.4K", color: "from-sky-400 to-blue-500", icon: Twitter },
    { name: "LinkedIn", posts: 156, engagement: "8.7K", color: "from-blue-500 to-blue-700", icon: Linkedin },
    { name: "Facebook", posts: 189, engagement: "15.2K", color: "from-blue-600 to-indigo-600", icon: Facebook },
  ];

  return (
    <div className="mt-8 space-y-8">
      {/* Platform Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="p-8 rounded-2xl bg-gradient-to-br from-pink-500/5 via-rose-500/10 to-red-500/5 border border-pink-500/20"
      >
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center"
          >
            <Activity className="w-5 h-5 text-white" />
          </motion.div>
          Platform Performance Dashboard
        </h3>

        <div className="grid md:grid-cols-3 gap-6">
          {platforms.map((platform, i) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-xl bg-background/50 border border-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                  <platform.icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold">{platform.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">{platform.posts}</p>
                  <p className="text-xs text-muted-foreground">Posts this month</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-pink-500">{platform.engagement}</p>
                  <p className="text-xs text-muted-foreground">Engagements</p>
                </div>
              </div>
              <motion.div 
                className="mt-4 h-2 rounded-full bg-muted overflow-hidden"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
              >
                <div className={`h-full bg-gradient-to-r ${platform.color} w-3/4`} />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Auto-posting Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="p-8 rounded-2xl bg-muted/30 border border-border"
      >
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-pink-500" />
          Automatic Content Distribution
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          When CADE publishes new content, social posts are generated and scheduled automatically.
        </p>

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-pink-500 via-rose-500 to-transparent" />
          
          {[
            { time: "0s", action: "New article published by CADE", status: "complete" },
            { time: "5s", action: "AI generates platform-specific copy", status: "complete" },
            { time: "10s", action: "Posts scheduled across all platforms", status: "complete" },
            { time: "Live", action: "Content goes live simultaneously", status: "active" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative pl-10 pb-6 last:pb-0"
            >
              <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${
                item.status === "active" 
                  ? "bg-gradient-to-br from-pink-500 to-rose-500 animate-pulse" 
                  : "bg-pink-500"
              }`}>
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-pink-500 border-pink-500/30">
                  {item.time}
                </Badge>
                <span className="text-sm">{item.action}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ============ On-page SEO Extended Section ============
export const OnPageSEOExtendedSection = () => {
  const optimizations = [
    { task: "Meta titles optimized", count: 156, color: "emerald" },
    { task: "Meta descriptions written", count: 156, color: "teal" },
    { task: "H1 tags fixed", count: 23, color: "cyan" },
    { task: "Image alt tags added", count: 412, color: "green" },
    { task: "Schema markup generated", count: 89, color: "lime" },
  ];

  return (
    <div className="mt-8 space-y-8">
      {/* Optimization Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-teal-500/10 to-cyan-500/5 border border-emerald-500/20"
      >
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"
          >
            <Gauge className="w-5 h-5 text-white" />
          </motion.div>
          Optimization Tasks Completed
        </h3>

        <div className="space-y-4">
          {optimizations.map((opt, i) => (
            <motion.div
              key={opt.task}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="w-32 text-sm font-medium">{opt.task}</div>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(100, opt.count / 4)}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                />
              </div>
              <Badge className="bg-emerald-500 min-w-[60px] justify-center">
                {opt.count}
              </Badge>
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
              <span className="font-semibold text-amber-500">15-20%</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <h4 className="font-bold mb-4 flex items-center gap-2 text-emerald-500">
            <Rocket className="w-5 h-5" />
            BRON On-page Automation
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Time to optimize 100 pages</span>
              <span className="font-semibold text-emerald-500">Under 5 minutes</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Monthly cost</span>
              <span className="font-semibold text-emerald-500">Included</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Error rate</span>
              <span className="font-semibold text-emerald-500">0%</span>
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
          <Code className="w-5 h-5 text-emerald-500" />
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
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/5">
                {schema}
              </Badge>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
