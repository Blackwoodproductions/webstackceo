import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Activity, CheckCircle2, ArrowRight, ArrowLeft, 
  Bell, Clock, Server, TrendingUp, AlertTriangle, Zap, Shield
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
import GuideFeatureLink from "@/components/ui/guide-feature-link";
import GlossaryTooltip from "@/components/ui/glossary-tooltip";
import { getTermsByGuide } from "@/data/glossaryData";

// Get terms linked to this guide from shared glossary
const uptimeTerms = getTermsByGuide("/learn/uptime-monitoring-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const UptimeMonitoringGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Uptime Monitoring Essentials - Learning Center"
        description="Learn why uptime monitoring is critical for SEO and business. Master monitoring strategies, alert systems, and incident response."
        keywords="uptime monitoring, website monitoring, server uptime, downtime alerts, website reliability, SEO uptime, site monitoring"
        canonical="/learn/uptime-monitoring-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Uptime Monitoring Guide", altText: "Website reliability essentials" }
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
                <span className="text-sm text-muted-foreground">8 min read</span>
              </div>
              
              <GuideFeatureLink 
                title="Uptime Monitoring:" 
                gradientText="Never Miss a Beat" 
                featureHref="/features/uptime-monitoring" 
              />
              <p className="text-xl text-muted-foreground mt-6">
                When your website goes down, you lose customers, revenue, and search rankings. Learn how to monitor uptime and respond to incidents fast.
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
                  <Activity className="w-6 h-6 text-primary" />
                  What is Uptime Monitoring?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Uptime monitoring continuously checks whether your website is accessible and functioning properly. When something goes wrong, it alerts you immediately so you can fix the problem before customers notice.
                </p>
                <p className="text-muted-foreground">
                  Modern uptime monitoring goes beyond simple "is it online" checks—it monitors <GlossaryTooltip term="page-speed">page speed</GlossaryTooltip>, SSL certificates, specific page content, API endpoints, and more.
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
                  The True Cost of Downtime
                </h2>
                <p className="text-muted-foreground mb-6">
                  Website downtime impacts more than just immediate sales:
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Average downtime costs small businesses $427 per minute",
                    "Google may deindex pages that return errors repeatedly",
                    "40% of users will leave a site that takes over 3 seconds to load",
                    "Downtime damages brand reputation and customer trust",
                    "Competitors can steal market share during your outages"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <p className="text-foreground font-medium">
                    ⏱️ <strong>Response Time Matters:</strong> The faster you detect and resolve issues, the less damage to your business and SEO.
                  </p>
                </div>
              </motion.div>

              {/* What to Monitor */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Server className="w-6 h-6 text-primary" />
                  What to Monitor
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "HTTP Status", desc: "Check that pages return 200 OK, not errors" },
                    { title: "Response Time", desc: "Monitor page load speed from multiple locations" },
                    { title: "SSL Certificates", desc: "Alert before certificates expire" },
                    { title: "Content Validation", desc: "Verify expected content is present on pages" },
                    { title: "API Endpoints", desc: "Monitor critical backend services" },
                    { title: "DNS Resolution", desc: "Ensure your domain resolves correctly" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Uptime Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  Understanding Uptime Percentages
                </h2>
                <p className="text-muted-foreground mb-4">
                  Uptime is measured as a percentage. Even small differences matter:
                </p>
                <div className="space-y-3">
                  {[
                    { uptime: "99%", downtime: "3.65 days/year", color: "text-red-400" },
                    { uptime: "99.9%", downtime: "8.76 hours/year", color: "text-amber-400" },
                    { uptime: "99.99%", downtime: "52.6 minutes/year", color: "text-emerald-400" },
                    { uptime: "99.999%", downtime: "5.26 minutes/year", color: "text-cyan-400" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-secondary/50 rounded-xl p-4">
                      <span className={`font-bold text-lg ${item.color}`}>{item.uptime}</span>
                      <span className="text-muted-foreground">=</span>
                      <span className="text-foreground">{item.downtime} downtime</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Alert Strategy */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Bell className="w-6 h-6 text-primary" />
                  Building an Alert Strategy
                </h2>
                <ul className="space-y-2">
                  {[
                    "Set up multiple notification channels (email, SMS, Slack, PagerDuty)",
                    "Create escalation policies for different severity levels",
                    "Avoid alert fatigue by setting appropriate thresholds",
                    "Monitor from multiple geographic locations",
                    "Test your alerts regularly to ensure they work",
                    "Document incident response procedures"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* SEO Impact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-primary" />
                  Uptime's Impact on SEO
                </h2>
                <p className="text-muted-foreground mb-4">
                  Google's crawlers visit your site regularly. Here's what happens when they find problems:
                </p>
                <ul className="space-y-2">
                  {[
                    "Repeated 5xx errors can cause pages to be deindexed",
                    "Slow response times hurt Core Web Vitals scores",
                    "Frequent outages reduce crawl budget allocation",
                    "SSL errors trigger security warnings that tank traffic",
                    "Uptime is a factor in overall site quality assessment"
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
                  Ready for Peace of Mind?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo monitors your site 24/7 from global locations and alerts you instantly when issues arise—before they impact your business.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/uptime-monitoring">
                      Explore Uptime Monitoring <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/pricing">Start Free Trial</Link>
                  </Button>
                </div>
              </motion.div>

              {/* Glossary Legend */}
              <GlossaryLegend terms={uptimeTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Automated Blogging Strategy",
                  href: "/learn/automated-blogging-guide",
                  category: "Content & Marketing"
                }}
                next={{
                  title: "Domain Authority Explained",
                  href: "/learn/domain-authority-guide",
                  category: "Authority Building"
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

export default UptimeMonitoringGuide;
