import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Code, CheckCircle2, ArrowRight, ArrowLeft, 
  Server, Zap, Shield, Search, AlertTriangle, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";
import ArticleNavigation from "@/components/ui/article-navigation";
import GlossaryLegend from "@/components/ui/glossary-legend";

const technicalSEOTerms = [
  { term: "Core Web Vitals", shortDescription: "Google's metrics for page experience including loading, interactivity, and visual stability.", slug: "core-web-vitals" },
  { term: "SERP", shortDescription: "Search Engine Results Page—what users see after entering a search query.", slug: "serp" },
];

const TechnicalSEOGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Technical SEO Essentials Guide - Learning Center"
        description="Master technical SEO fundamentals. Learn about site architecture, crawlability, indexing, page speed, mobile optimization, and structured data."
        keywords="technical SEO, site architecture, crawlability, indexing, page speed, mobile SEO, structured data, schema markup"
        canonical="/learn/technical-seo-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Technical SEO Guide", altText: "Technical SEO essentials" }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-400/10 via-transparent to-zinc-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Center
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-slate-400/10 text-slate-400 text-sm font-medium">
                  SEO Fundamentals
                </span>
                <span className="text-sm text-muted-foreground">15 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Technical SEO: <span className="gradient-text">The Foundation</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Technical SEO ensures search engines can crawl, index, and render your website properly. Without it, even the best content won't rank.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="prose prose-lg prose-invert max-w-none">
              
              {/* Introduction */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Code className="w-6 h-6 text-primary" />
                  What is Technical SEO?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Technical SEO refers to optimizing your website's infrastructure so search engines can efficiently crawl, understand, and index your content. It's the foundation that all other SEO efforts build upon.
                </p>
                <p className="text-muted-foreground">
                  Think of technical SEO as building a house: you need a solid foundation before you can focus on the interior design (content) or curb appeal (links).
                </p>
              </motion.div>

              {/* Why It Matters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  Why Technical SEO Matters
                </h2>
                <ul className="space-y-3 mb-6">
                  {[
                    "If Google can't crawl your site, it can't rank your content",
                    "Page speed directly impacts rankings and user experience",
                    "Mobile-friendliness is a confirmed ranking factor",
                    "Structured data helps search engines understand your content",
                    "Security (HTTPS) builds trust and is a ranking signal"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Key Areas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Settings className="w-6 h-6 text-primary" />
                  Key Technical SEO Areas
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Crawlability", desc: "Ensure search engines can access all important pages" },
                    { title: "Indexing", desc: "Control which pages appear in search results" },
                    { title: "Site Architecture", desc: "Organize content with clear hierarchy and internal links" },
                    { title: "Page Speed", desc: "Optimize loading times for better rankings and UX" },
                    { title: "Mobile Optimization", desc: "Ensure your site works perfectly on all devices" },
                    { title: "Structured Data", desc: "Help search engines understand your content with schema" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Page Speed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-primary" />
                  Page Speed Optimization
                </h2>
                <ul className="space-y-2">
                  {[
                    "Compress and optimize images (WebP format recommended)",
                    "Minify CSS, JavaScript, and HTML files",
                    "Enable browser caching for static resources",
                    "Use a Content Delivery Network (CDN)",
                    "Reduce server response time (TTFB)",
                    "Eliminate render-blocking resources"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Security */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-primary" />
                  Security Best Practices
                </h2>
                <ul className="space-y-2">
                  {[
                    "Implement HTTPS across your entire site",
                    "Keep CMS and plugins updated",
                    "Use security headers (CSP, HSTS, X-Frame-Options)",
                    "Regularly scan for malware and vulnerabilities",
                    "Implement strong authentication practices"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-slate-400/10 to-zinc-500/10"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Fix Technical Issues?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo automatically audits your site for technical SEO issues and provides actionable fixes.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features">
                      Explore Features <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/pricing">Start Free Trial</Link>
                  </Button>
                </div>
              </motion.div>

              {/* Glossary Legend */}
              <GlossaryLegend terms={technicalSEOTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Off-Page SEO Guide",
                  href: "/learn/off-page-seo-guide",
                  category: "SEO Fundamentals"
                }}
                next={{
                  title: "Mastering Website Analytics",
                  href: "/learn/analytics-guide",
                  category: "Analytics & Intelligence"
                }}
              />

            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default TechnicalSEOGuide;
