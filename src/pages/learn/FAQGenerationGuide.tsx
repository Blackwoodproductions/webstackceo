import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  HelpCircle, CheckCircle2, ArrowRight, ArrowLeft, 
  Search, MessageSquare, Target, AlertTriangle, Zap
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
const faqTerms = getTermsByGuide("/learn/faq-generation-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const FAQGenerationGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="FAQ Generation for SEO Guide - Learning Center"
        description="Learn how FAQ content boosts SEO rankings. Master FAQ schema, featured snippets, and AI-powered FAQ generation strategies."
        keywords="FAQ SEO, FAQ schema, featured snippets, FAQ generation, question keywords, voice search SEO"
        canonical="/learn/faq-generation-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "FAQ Generation Guide", altText: "FAQ content for SEO" }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-teal-500/10" />
          
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
                <span className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-sm font-medium">
                  Content & Marketing
                </span>
                <span className="text-sm text-muted-foreground">7 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                FAQ Generation: <span className="gradient-text">Answer to Rank</span>
              </h1>
              <div className="mb-6">
                <GuideFeatureLink featureTitle="FAQ Generation" featureHref="/features/faq-generation" />
              </div>
              <p className="text-xl text-muted-foreground">
                FAQ content is a secret weapon for SEO. Learn how to generate, optimize, and leverage FAQs to dominate search results.
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
                  <HelpCircle className="w-6 h-6 text-primary" />
                  Why FAQs Matter for SEO
                </h2>
                <p className="text-muted-foreground mb-4">
                  FAQ content directly answers the questions your customers are asking—and these are the same questions they're typing into Google. By providing clear, helpful answers, you position your site to capture featured snippets and voice search results.
                </p>
                <p className="text-muted-foreground">
                  Plus, FAQ schema markup can give your listings enhanced visibility in search results with expandable question-and-answer sections.
                </p>
              </motion.div>

              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-primary" />
                  SEO Benefits of FAQ Content
                </h2>
                <ul className="space-y-3">
                  {[
                    "Capture featured snippets (position zero) in search results",
                    "Rank for question-based and long-tail keywords",
                    "Dominate voice search results (40% of voice answers come from featured snippets)",
                    "Increase on-page time as users find their answers",
                    "Reduce bounce rate by addressing common objections",
                    "Get rich results with FAQ schema markup"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Finding Questions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Search className="w-6 h-6 text-primary" />
                  Finding the Right Questions
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "People Also Ask", desc: "Mine Google's PAA boxes for related questions" },
                    { title: "Search Console", desc: "Find question queries you already rank for" },
                    { title: "Customer Support", desc: "Analyze common support tickets and inquiries" },
                    { title: "Competitor FAQs", desc: "See what questions competitors are answering" },
                    { title: "Answer the Public", desc: "Generate question ideas from seed keywords" },
                    { title: "Forums & Reddit", desc: "Find real questions people are asking" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
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
                  <Target className="w-6 h-6 text-primary" />
                  FAQ Best Practices
                </h2>
                <ul className="space-y-2">
                  {[
                    "Keep answers concise—aim for 40-60 words for featured snippet potential",
                    "Start answers with a direct response, then elaborate",
                    "Use the exact question format users search for",
                    "Implement FAQ schema markup for rich results",
                    "Group related FAQs by topic for better organization",
                    "Update FAQs regularly as your product/industry evolves"
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
                className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-emerald-400/10 to-teal-500/10"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Generate FAQs at Scale?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo uses AI to generate SEO-optimized FAQs from your content and industry data.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/faq-generation">
                      Explore FAQ Features <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/pricing">Start Free Trial</Link>
                  </Button>
                </div>
              </motion.div>

              {/* Glossary Legend */}
              <GlossaryLegend terms={faqTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Automated Blogging Strategy",
                  href: "/learn/automated-blogging-guide",
                  category: "Content & Marketing"
                }}
                next={{
                  title: "Social Signals & SEO Impact",
                  href: "/learn/social-signals-guide",
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

export default FAQGenerationGuide;
