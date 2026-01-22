import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BookOpen, Search, BarChart3, Globe, Shield, Zap, Users, 
  TrendingUp, FileText, MessageSquare, Target, Rocket, 
  ArrowRight, GraduationCap, Lightbulb, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";
import { useState } from "react";

const categories = [
  {
    name: "SEO Fundamentals",
    description: "Master the basics of search engine optimization",
    icon: Search,
    color: "from-cyan-400 to-blue-500",
    articles: [
      { title: "Complete Guide to On-Page SEO", href: "/learn/on-page-seo-guide", time: "12 min read" },
      { title: "Off-Page SEO: Building Authority", href: "/learn/off-page-seo-guide", time: "10 min read" },
      { title: "Technical SEO Essentials", href: "/learn/technical-seo-guide", time: "15 min read" },
    ]
  },
  {
    name: "Analytics & Intelligence",
    description: "Turn data into actionable business insights",
    icon: BarChart3,
    color: "from-violet-400 to-purple-500",
    articles: [
      { title: "Mastering Website Analytics", href: "/learn/analytics-guide", time: "14 min read" },
      { title: "Visitor Intelligence Deep Dive", href: "/learn/visitor-intelligence-guide", time: "11 min read" },
      { title: "Traffic De-Anonymization Explained", href: "/learn/traffic-deanonymization-guide", time: "8 min read" },
    ]
  },
  {
    name: "Content & Marketing",
    description: "Create content that ranks and converts",
    icon: FileText,
    color: "from-emerald-400 to-green-500",
    articles: [
      { title: "Automated Blogging Strategy", href: "/learn/automated-blogging-guide", time: "10 min read" },
      { title: "FAQ Generation for SEO", href: "/learn/faq-generation-guide", time: "7 min read" },
      { title: "Social Signals & SEO Impact", href: "/learn/social-signals-guide", time: "9 min read" },
    ]
  },
  {
    name: "Local & Maps SEO",
    description: "Dominate local search results",
    icon: Globe,
    color: "from-amber-400 to-orange-500",
    articles: [
      { title: "Google Business Profile Mastery", href: "/learn/gmb-optimization-guide", time: "13 min read" },
      { title: "Local SEO Ranking Factors", href: "/learn/local-seo-guide", time: "11 min read" },
    ]
  },
  {
    name: "Authority Building",
    description: "Build trust and domain authority",
    icon: TrendingUp,
    color: "from-pink-400 to-rose-500",
    articles: [
      { title: "Domain Authority Explained", href: "/learn/domain-authority-guide", time: "12 min read" },
      { title: "Link Building Best Practices", href: "/learn/link-building-guide", time: "14 min read" },
    ]
  },
  {
    name: "Performance & Reliability",
    description: "Keep your site fast and always online",
    icon: Zap,
    color: "from-sky-400 to-indigo-500",
    articles: [
      { title: "Uptime Monitoring Essentials", href: "/learn/uptime-monitoring-guide", time: "8 min read" },
      { title: "Web Hosting for SEO", href: "/learn/web-hosting-guide", time: "10 min read" },
      { title: "Core Web Vitals Guide", href: "/learn/core-web-vitals-guide", time: "12 min read" },
    ]
  },
  {
    name: "Conversion Optimization",
    description: "Turn traffic into customers",
    icon: Target,
    color: "from-red-400 to-pink-500",
    articles: [
      { title: "PPC Landing Page Mastery", href: "/learn/ppc-landing-pages-guide", time: "11 min read" },
      { title: "Conversion Rate Optimization", href: "/learn/cro-guide", time: "13 min read" },
    ]
  }
];

const featuredGuides = [
  {
    title: "The CEO's Complete Guide to SEO",
    description: "Everything you need to know about SEO in one comprehensive guide. From fundamentals to advanced strategies.",
    href: "/learn/on-page-seo-guide",
    icon: GraduationCap,
    tag: "Most Popular"
  },
  {
    title: "Analytics That Drive Revenue",
    description: "Learn how to interpret your analytics data and make decisions that directly impact your bottom line.",
    href: "/learn/analytics-guide",
    icon: Lightbulb,
    tag: "Essential Reading"
  },
  {
    title: "SEO Glossary A-Z",
    description: "Master SEO terminology with our complete glossary. Clear definitions for every term you need to know.",
    href: "/learn/glossary",
    icon: BookOpen,
    tag: "Reference"
  }
];

const Learn = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = categories.map(cat => ({
    ...cat,
    articles: cat.articles.filter(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.articles.length > 0 || cat.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Learning Center - SEO & Website Management Guides"
        description="Master SEO, analytics, and website management with our comprehensive learning center. Free guides, tutorials, and best practices for CEOs and marketers."
        keywords="SEO guide, website analytics tutorial, domain authority, on-page SEO, off-page SEO, learning center, digital marketing education"
        canonical="/learn"
        schema={{
          "@context": "https://schema.org",
          "@type": "LearningResource",
          "name": "Webstack.ceo Learning Center",
          "description": "Comprehensive guides for SEO and website management",
          "provider": {
            "@type": "Organization",
            "name": "Webstack.ceo"
          }
        }}
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { 
            label: "Learning Center",
            altText: "SEO and website management educational resources"
          }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"
            animate={{ y: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                <BookOpen className="w-4 h-4 inline mr-2" />
                Learning Center
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Master Your{" "}
                <span className="gradient-text">Web Presence</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Comprehensive guides, tutorials, and best practices to help you dominate search rankings, 
                understand your analytics, and grow your business online.
              </p>
              
              {/* Search */}
              <div className="max-w-xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search guides and tutorials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-lg bg-background/80 backdrop-blur-sm border-border/50"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Guides */}
        <section className="py-16 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <h2 className="text-2xl font-bold text-foreground">Featured Guides</h2>
              <p className="text-muted-foreground">Start here for the most impactful knowledge</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredGuides.map((guide, index) => (
                <Link key={guide.title} to={guide.href}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card rounded-2xl p-6 h-full hover:glow-accent transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {guide.tag}
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center mb-4">
                      <guide.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {guide.description}
                    </p>
                    <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read Guide <ArrowRight className="w-4 h-4" />
                    </span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* All Categories */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Browse by <span className="gradient-text">Topic</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Deep dive into specific areas of website management and SEO
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card rounded-2xl p-6"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{category.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                    
                    <ul className="space-y-3">
                      {category.articles.map((article) => (
                        <li key={article.title}>
                          <Link 
                            to={article.href}
                            className="flex items-center justify-between group hover:bg-secondary/50 rounded-lg p-2 -mx-2 transition-colors"
                          >
                            <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                              {article.title}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {article.time}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
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
              <GraduationCap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Put Knowledge Into <span className="gradient-text">Action</span>?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Stop reading, start doing. Webstack.ceo automates everything you learn here—so you can focus on running your business.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/pricing">
                    Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
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

export default Learn;
