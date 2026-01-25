import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, Shield, BarChart3, Calendar, Tag, 
  ArrowRight, Rocket, Brain, Target, TrendingUp,
  CheckCircle2, Zap, Globe, Eye, MessageCircle, Image, type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";
import { supabase } from "@/integrations/supabase/client";

type ChangeType = "feature" | "improvement" | "fix" | "announcement";

interface ChangelogEntry {
  date: string;
  version: string;
  title: string;
  description: string;
  type: ChangeType;
  icon: LucideIcon;
  changes: string[];
  highlight?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Sparkles, Shield, BarChart3, Rocket, Brain, Target, TrendingUp,
  CheckCircle2, Zap, Globe, Eye, MessageCircle, Image
};

const changeTypeConfig: Record<ChangeType, { label: string; color: string; bg: string }> = {
  feature: { label: "New Feature", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  improvement: { label: "Improvement", color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
  fix: { label: "Bug Fix", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
  announcement: { label: "Announcement", color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20" },
};

const staticChangelog: ChangelogEntry[] = [
  {
    date: "January 24, 2026",
    version: "2.5.0",
    title: "Visitor Intelligence Dashboard & AI Sales Center",
    description: "Major dashboard overhaul with a new name, streamlined layout, and integrated AI chat assistant for real-time visitor engagement and lead conversion.",
    type: "feature",
    icon: Eye,
    highlight: true,
    changes: [
      "Renamed Marketing Dashboard to Visitor Intelligence Dashboard",
      "New AI Sales Center with embedded Calendly booking",
      "AI chat assistant with full website knowledge base",
      "Live chat transfer to human operators",
      "Redesigned header with centered 'Marketing Funnel Analytics and AI Sales Center' tagline",
      "Streamlined stats bar with views, sessions, bounce rate, and engagement metrics",
      "Chat controls moved to sticky header bar",
      "Dashboard screenshots added to feature and guide pages"
    ]
  },
  {
    date: "January 22, 2026",
    version: "2.4.0",
    title: "AEO & GEO Reporting Dashboard",
    description: "Our new dashboard now includes comprehensive Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) reporting—helping you dominate both traditional search and AI-powered search results.",
    type: "feature",
    icon: Globe,
    highlight: true,
    changes: [
      "New AEO metrics tracking your visibility in AI answer boxes",
      "GEO performance dashboard for generative search engines",
      "AI citation tracking across ChatGPT, Perplexity, and Gemini",
      "Featured snippet monitoring with position history",
      "Voice search optimization scoring",
      "People Also Ask (PAA) tracking and opportunities",
      "AI overview appearance monitoring",
      "Competitive AEO benchmarking tools"
    ]
  },
  {
    date: "January 18, 2026",
    version: "2.3.0",
    title: "AI Guard Rails System",
    description: "Introducing our proprietary AI Guard Rails technology—ensuring all AI-generated content stays aligned, accurate, and on-brand. No more hallucinations or off-topic content.",
    type: "feature",
    icon: Shield,
    highlight: true,
    changes: [
      "Real-time content accuracy verification",
      "Brand voice consistency enforcement",
      "Factual claim cross-referencing engine",
      "Automatic source citation for AI claims",
      "Hallucination detection and prevention",
      "Content alignment scoring dashboard",
      "Custom brand guidelines integration",
      "Industry-specific accuracy rules"
    ]
  },
  {
    date: "January 15, 2026",
    version: "2.2.0",
    title: "Cade Integration",
    description: "Seamlessly connect with Cade—the AI-powered development assistant—to automate technical SEO fixes and implement optimizations directly in your codebase.",
    type: "feature",
    icon: Zap,
    highlight: true,
    changes: [
      "One-click Cade workspace connection",
      "Automated technical SEO implementations",
      "Schema markup generation and deployment",
      "Core Web Vitals auto-optimization",
      "Meta tag management through Cade",
      "Sitemap generation and updates",
      "Redirect rule automation",
      "Real-time sync between Webstack.ceo and Cade"
    ]
  },
  {
    date: "January 10, 2026",
    version: "2.1.0",
    title: "Enhanced Ranking App",
    description: "Major updates to our keyword ranking application with new AI-powered insights and predictive analytics.",
    type: "improvement",
    icon: TrendingUp,
    changes: [
      "Predictive ranking trajectory modeling",
      "AI-powered keyword opportunity scoring",
      "Competitor movement alerts",
      "SERP feature tracking (featured snippets, PAA, etc.)",
      "Local pack position monitoring",
      "Mobile vs desktop ranking splits",
      "Historical trend visualization improvements",
      "Export capabilities for client reporting"
    ]
  },
  {
    date: "January 5, 2026",
    version: "2.0.5",
    title: "Dashboard Performance Overhaul",
    description: "Significant performance improvements across the entire dashboard, making your workflow faster than ever.",
    type: "improvement",
    icon: Rocket,
    changes: [
      "50% faster initial dashboard load time",
      "Optimized data fetching with smart caching",
      "Reduced memory footprint for large accounts",
      "Improved chart rendering performance",
      "Background data sync for instant updates",
      "Mobile dashboard responsiveness improvements"
    ]
  },
  {
    date: "December 28, 2025",
    version: "2.0.4",
    title: "AI Content Analyzer Updates",
    description: "Enhanced our AI content analysis engine with better understanding of E-E-A-T signals and content quality metrics.",
    type: "improvement",
    icon: Brain,
    changes: [
      "E-E-A-T scoring now includes author authority signals",
      "Improved content freshness detection",
      "Better topic clustering for content gaps",
      "Enhanced readability analysis",
      "New content depth scoring algorithm"
    ]
  },
  {
    date: "December 20, 2025",
    version: "2.0.3",
    title: "Bug Fixes & Stability",
    description: "Various bug fixes and stability improvements based on user feedback.",
    type: "fix",
    icon: CheckCircle2,
    changes: [
      "Fixed timezone issues in scheduled reports",
      "Resolved data sync delays for some integrations",
      "Corrected keyword difficulty calculations",
      "Fixed export formatting issues in CSV reports",
      "Addressed minor UI glitches in dark mode"
    ]
  },
  {
    date: "December 15, 2025",
    version: "2.0.0",
    title: "Webstack.ceo 2.0 Launch",
    description: "The biggest update in our history. A complete redesign with new features, faster performance, and an AI-first approach to SEO management.",
    type: "announcement",
    icon: Sparkles,
    changes: [
      "Completely redesigned dashboard interface",
      "New AI-powered insights engine",
      "Unified analytics across all platforms",
      "Real-time collaboration features",
      "Advanced reporting and white-label options",
      "New integrations marketplace",
      "Enhanced security with SOC 2 compliance",
      "24/7 priority support for all plans"
    ]
  }
];

const Changelog = () => {
  const [dynamicEntries, setDynamicEntries] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDynamicChangelog = async () => {
      try {
        const { data, error } = await supabase
          .from("changelog_entries")
          .select("*")
          .eq("is_published", true)
          .order("published_at", { ascending: false });

        if (error) throw error;

        if (data) {
          const mappedEntries: ChangelogEntry[] = data.map((entry) => ({
            date: new Date(entry.published_at || entry.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric"
            }),
            version: entry.version,
            title: entry.title,
            description: entry.description,
            type: entry.type as ChangeType,
            icon: iconMap[entry.icon] || Zap,
            changes: Array.isArray(entry.changes) ? entry.changes as string[] : [],
            highlight: entry.highlight
          }));
          setDynamicEntries(mappedEntries);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic changelog:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDynamicChangelog();
  }, []);

  // Combine dynamic entries (newest) with static entries
  const allEntries = [...dynamicEntries, ...staticChangelog];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Changelog - Latest Updates & New Features"
        description="Stay up to date with the latest Webstack.ceo updates, new features, and improvements. See what's new in our SEO and website management platform."
        keywords="changelog, updates, new features, product updates, release notes, version history, SEO tools updates"
        canonical="/changelog"
        schema={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "name": "Webstack.ceo Changelog",
          "description": "Latest updates and release notes"
        }}
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { 
            label: "Changelog",
            altText: "View latest product updates and new features"
          }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-20 right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl"
            animate={{ y: [0, -30, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Product Updates
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                What's <span className="gradient-text">New</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Follow along as we ship new features, improvements, and fixes. 
                We're constantly evolving to help you dominate online.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {Object.entries(changeTypeConfig).map(([key, config]) => (
                  <span 
                    key={key}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border ${config.bg} ${config.color}`}
                  >
                    {config.label}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Changelog Timeline */}
        <section className="py-16">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/50 to-transparent hidden md:block" />
              
              <div className="space-y-12">
                {allEntries.map((entry, index) => {
                  const typeConfig = changeTypeConfig[entry.type];
                  const Icon = entry.icon;
                  
                  return (
                    <motion.div
                      key={entry.version}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="relative"
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-8 -translate-x-1/2 w-4 h-4 rounded-full bg-primary hidden md:block" />
                      
                      <div className={`md:ml-16 glass-card rounded-2xl p-8 transition-all duration-300 hover:glow-accent ${
                        entry.highlight ? "ring-2 ring-primary/30" : ""
                      }`}>
                        {/* Header */}
                        <div className="flex flex-wrap items-start gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${typeConfig.bg} ${typeConfig.color}`}>
                                {typeConfig.label}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                v{entry.version}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {entry.date}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-foreground">{entry.title}</h3>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground mb-6">
                          {entry.description}
                        </p>

                        {/* Changes List */}
                        <div className="bg-secondary/30 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            What's Included
                          </h4>
                          <ul className="grid md:grid-cols-2 gap-2">
                            {entry.changes.map((change, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-foreground">{change}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-violet-500/5" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-3xl p-12 text-center"
            >
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Experience the <span className="gradient-text">Latest Features</span>?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of CEOs who trust Webstack.ceo to manage their online presence. 
                Book a call today and get access to all the latest updates.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">
                    Book a Call <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="/features">
                    Explore Features
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Changelog;
