import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  UserCheck, CheckCircle2, ArrowRight, ArrowLeft, 
  Eye, Target, Building2, AlertTriangle, Zap, Shield
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
import { getTermsByGuide } from "@/data/glossaryData";

// Get terms linked to this guide from shared glossary
const deanonymizationTerms = getTermsByGuide("/learn/traffic-deanonymization-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const TrafficDeanonymizationGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Traffic De-Anonymization Explained - Learning Center"
        description="Learn how traffic de-anonymization reveals which companies visit your website. Understand IP intelligence, compliance, and B2B lead generation."
        keywords="traffic de-anonymization, IP tracking, B2B leads, website visitor identification, company identification, lead generation"
        canonical="/learn/traffic-deanonymization-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Traffic De-Anonymization Guide", altText: "Understanding visitor identification" }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 via-transparent to-purple-500/10" />
          
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
                <span className="text-sm text-muted-foreground">8 min read</span>
              </div>
              
              <GuideFeatureLink 
                title="Traffic De-Anonymization:" 
                gradientText="Reveal Your Visitors" 
                featureHref="/features/traffic-de-anonymization" 
              />
              <p className="text-xl text-muted-foreground mt-6">
                Turn anonymous website traffic into actionable sales intelligence. Learn how to identify the companies visiting your site.
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
                  What is Traffic De-Anonymization?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Traffic de-anonymization is the process of identifying which companies are visiting your website, even when individual visitors haven't filled out a form or identified themselves.
                </p>
                <p className="text-muted-foreground">
                  Using IP intelligence and company databases, you can match anonymous visitors to their employers—turning your website into a lead generation machine.
                </p>
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
                  How It Works
                </h2>
                <div className="space-y-4">
                  {[
                    { step: "1", title: "IP Capture", desc: "Track visitor IP addresses when they browse your site" },
                    { step: "2", title: "Company Matching", desc: "Match IPs to company databases containing millions of businesses" },
                    { step: "3", title: "Data Enrichment", desc: "Add firmographic data like industry, size, and revenue" },
                    { step: "4", title: "Behavior Analysis", desc: "Track which pages they viewed and for how long" },
                    { step: "5", title: "Lead Scoring", desc: "Prioritize companies showing buying intent" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-foreground font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" />
                  Benefits for B2B Sales
                </h2>
                <ul className="space-y-3">
                  {[
                    "Identify high-intent prospects before they reach out",
                    "Prioritize outreach to companies already researching you",
                    "Personalize sales conversations based on pages viewed",
                    "Reduce wasted time on cold outreach",
                    "Measure true marketing ROI by tracking company engagement"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Privacy & Compliance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-primary" />
                  Privacy & Compliance
                </h2>
                <p className="text-muted-foreground mb-4">
                  Traffic de-anonymization focuses on identifying companies, not individuals. This approach is generally compliant with privacy regulations when implemented correctly:
                </p>
                <ul className="space-y-2">
                  {[
                    "Only company-level data is captured, not personal information",
                    "B2B use cases have different privacy considerations than B2C",
                    "Always include appropriate privacy disclosures",
                    "Ensure your implementation complies with GDPR and CCPA",
                    "Work with reputable data providers who maintain compliance"
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
                className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-violet-400/10 to-purple-500/10"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Identify Your Visitors?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo reveals which companies are visiting your site and what they're interested in.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/traffic-de-anonymization">
                      Explore Features <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/pricing">Start Free Trial</Link>
                  </Button>
                </div>
              </motion.div>

              {/* Glossary Legend */}
              <GlossaryLegend terms={deanonymizationTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Visitor Intelligence Deep Dive",
                  href: "/learn/visitor-intelligence-guide",
                  category: "Analytics & Intelligence"
                }}
                next={{
                  title: "Automated Blogging Strategy",
                  href: "/learn/automated-blogging-guide",
                  category: "Content & Marketing"
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

export default TrafficDeanonymizationGuide;
