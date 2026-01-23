import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, CheckCircle2, ArrowRight, ArrowLeft, 
  Eye, Target, Building2, TrendingUp, AlertTriangle, Zap
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
const visitorIntelligenceTerms = getTermsByGuide("/learn/visitor-intelligence-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const VisitorIntelligenceGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Visitor Intelligence Guide - Learning Center"
        description="Learn how to understand your website visitors at a deeper level. Master visitor intelligence, traffic de-anonymization, and lead identification strategies."
        keywords="visitor intelligence, website visitors, traffic analysis, lead identification, visitor tracking, B2B leads, website analytics"
        canonical="/learn/visitor-intelligence-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Visitor Intelligence Guide", altText: "Understanding your website visitors" }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 via-transparent to-cyan-500/10" />
          
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
                <span className="px-3 py-1 rounded-full bg-violet-400/10 text-violet-400 text-sm font-medium">
                  Analytics & Intelligence
                </span>
                <span className="text-sm text-muted-foreground">11 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Visitor Intelligence: <span className="gradient-text">Know Your Audience</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Transform anonymous website traffic into actionable insights. Learn how to identify, understand, and convert your website visitors.
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
                  <Eye className="w-6 h-6 text-primary" />
                  What is Visitor Intelligence?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Visitor intelligence goes beyond basic analytics. While traditional tools tell you how many people visited your site, visitor intelligence reveals who they are, what they're interested in, and how ready they are to buy.
                </p>
                <p className="text-muted-foreground">
                  For B2B companies especially, knowing that "Company X visited your pricing page 5 times this week" is infinitely more valuable than "You had 500 visitors this week."
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
                  Why Visitor Intelligence Matters for Business
                </h2>
                <p className="text-muted-foreground mb-6">
                  97% of website visitors leave without converting. Without visitor intelligence, you have no idea who they were or why they left:
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Identify high-intent prospects before they reach out",
                    "Personalize follow-up based on actual browsing behavior",
                    "Prioritize sales efforts on companies showing buying signals",
                    "Understand which content attracts your ideal customers",
                    "Reduce wasted ad spend by targeting already-interested companies"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <p className="text-foreground font-medium">
                    📊 <strong>The Opportunity:</strong> Companies using visitor intelligence report 30-50% increases in sales pipeline by reaching out to prospects who were already researching them.
                  </p>
                </div>
              </motion.div>

              {/* How It Works */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-primary" />
                  How Visitor Intelligence Works
                </h2>
                <p className="text-muted-foreground mb-4">
                  Visitor intelligence platforms use various data sources to identify anonymous visitors:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {[
                    { title: "IP Intelligence", desc: "Match visitor IPs to company databases to identify B2B traffic" },
                    { title: "Behavioral Tracking", desc: "Monitor pages visited, time spent, and engagement patterns" },
                    { title: "Intent Signals", desc: "Identify buying behavior like pricing page visits or demo requests" },
                    { title: "Firmographic Data", desc: "Enrich visitors with company size, industry, and revenue data" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Key Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  Key Visitor Intelligence Metrics
                </h2>
                <ul className="space-y-2">
                  {[
                    "Company identification rate—what % of B2B traffic can you identify?",
                    "Intent score—how interested are identified companies?",
                    "Return visitor rate—are prospects coming back?",
                    "Page depth by company—what content are prospects consuming?",
                    "Time to conversion—how long from first visit to action?"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Best Practices */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" />
                  Best Practices for Visitor Intelligence
                </h2>
                <ul className="space-y-2">
                  {[
                    "Set up alerts for high-value target accounts visiting your site",
                    "Create personalized outreach based on pages visited",
                    "Integrate with your CRM for seamless lead handoff",
                    "Combine with advertising for account-based retargeting",
                    "Respect privacy—ensure GDPR/CCPA compliance",
                    "Focus on companies, not individuals, for B2B applications"
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
                className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-violet-400/10 to-cyan-500/10"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Know Your Visitors?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo's visitor intelligence reveals who's on your site and what they're interested in—turning anonymous traffic into sales opportunities.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/visitor-intelligence">
                      Explore Visitor Intelligence <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/pricing">Start Free Trial</Link>
                  </Button>
                </div>
              </motion.div>

              {/* Glossary Legend */}
              <GlossaryLegend terms={visitorIntelligenceTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Mastering Website Analytics",
                  href: "/learn/analytics-guide",
                  category: "Analytics & Intelligence"
                }}
                next={{
                  title: "Google Business Profile Mastery",
                  href: "/learn/gmb-optimization-guide",
                  category: "Local & Maps SEO"
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

export default VisitorIntelligenceGuide;
