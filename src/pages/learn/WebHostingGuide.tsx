import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Server, CheckCircle2, ArrowRight, ArrowLeft, 
  Zap, Shield, Globe, AlertTriangle, Clock
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
import { getTermsByGuide } from "@/data/glossaryData";

// Get terms linked to this guide from shared glossary
const hostingTerms = getTermsByGuide("/learn/web-hosting-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const WebHostingGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Web Hosting for SEO Guide - Learning Center"
        description="Learn how web hosting affects SEO. Understand server speed, uptime, security, and choosing the right hosting for optimal search rankings."
        keywords="web hosting SEO, hosting speed, server location, uptime, SSL hosting, managed hosting, CDN"
        canonical="/learn/web-hosting-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Web Hosting Guide", altText: "Hosting for SEO" }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-400/10 via-transparent to-indigo-500/10" />
          
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
                <span className="px-3 py-1 rounded-full bg-sky-400/10 text-sky-400 text-sm font-medium">
                  Performance & Reliability
                </span>
                <span className="text-sm text-muted-foreground">10 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Web Hosting: <span className="gradient-text">The SEO Foundation</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Your hosting provider directly impacts page speed, uptime, and security—all critical SEO factors.
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
                  <Server className="w-6 h-6 text-primary" />
                  Why Hosting Matters for SEO
                </h2>
                <p className="text-muted-foreground mb-4">
                  Your web host is the foundation of your online presence. A slow or unreliable host can tank your search rankings, while a fast, secure host gives you a competitive edge.
                </p>
                <p className="text-muted-foreground">
                  Google has confirmed that page speed is a ranking factor, and Core Web Vitals are now part of the algorithm. Your hosting directly affects these metrics.
                </p>
              </motion.div>

              {/* Key Factors */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-primary" />
                  Key Hosting Factors for SEO
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Server Speed", desc: "Fast servers mean faster page loads and better rankings" },
                    { title: "Uptime Guarantee", desc: "99.9%+ uptime ensures Google can always crawl your site" },
                    { title: "Server Location", desc: "Servers near your audience reduce latency" },
                    { title: "SSL/Security", desc: "HTTPS is a ranking factor and builds trust" },
                    { title: "CDN Integration", desc: "Content delivery networks speed up global access" },
                    { title: "Scalability", desc: "Handle traffic spikes without performance drops" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Hosting Types */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Globe className="w-6 h-6 text-primary" />
                  Hosting Types Compared
                </h2>
                <div className="space-y-4">
                  {[
                    { type: "Shared Hosting", pros: "Cheap, easy to start", cons: "Slow, shared resources, less reliable" },
                    { type: "VPS Hosting", pros: "Better performance, more control", cons: "More expensive, some technical knowledge needed" },
                    { type: "Dedicated Hosting", pros: "Maximum performance and control", cons: "Expensive, requires server management" },
                    { type: "Managed Hosting", pros: "Optimized for CMS, fast, hassle-free", cons: "Premium pricing, less flexibility" },
                    { type: "Cloud Hosting", pros: "Scalable, reliable, pay-as-you-go", cons: "Can be complex, variable costs" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-2">{item.type}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-emerald-400">✓ {item.pros}</span>
                        <span className="text-muted-foreground">✗ {item.cons}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Best Practices */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-primary" />
                  Hosting Best Practices
                </h2>
                <ul className="space-y-2">
                  {[
                    "Choose servers located near your primary audience",
                    "Use a CDN to serve content globally",
                    "Enable HTTP/2 or HTTP/3 for faster loading",
                    "Ensure automatic SSL certificate management",
                    "Set up automatic backups and disaster recovery",
                    "Monitor server performance and uptime continuously"
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
                className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-sky-400/10 to-indigo-500/10"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready for Reliable Hosting?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo includes optimized hosting designed specifically for SEO performance.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/web-hosting">
                      Explore Hosting <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/pricing">Start Free Trial</Link>
                  </Button>
                </div>
              </motion.div>

              {/* Glossary Legend */}
              <GlossaryLegend terms={hostingTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Uptime Monitoring Essentials",
                  href: "/learn/uptime-monitoring-guide",
                  category: "Performance & Reliability"
                }}
                next={{
                  title: "Core Web Vitals Guide",
                  href: "/learn/core-web-vitals-guide",
                  category: "Performance & Reliability"
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

export default WebHostingGuide;
