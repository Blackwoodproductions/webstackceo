import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MapPin, CheckCircle2, ArrowRight, ArrowLeft, 
  Star, Building2, Search, AlertTriangle, Zap, Globe
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
const localSEOTerms = getTermsByGuide("/learn/local-seo-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const LocalSEOGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Local SEO Ranking Factors Guide - Learning Center"
        description="Master local SEO ranking factors. Learn about Google Business Profile, local citations, reviews, and strategies to dominate local search results."
        keywords="local SEO, local search ranking, Google Business Profile, local citations, local pack, NAP consistency, local keywords"
        canonical="/learn/local-seo-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Local SEO Guide", altText: "Local search ranking factors" }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-orange-500/10" />
          
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
                <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-sm font-medium">
                  Local & Maps SEO
                </span>
                <span className="text-sm text-muted-foreground">11 min read</span>
              </div>
              
              <GuideFeatureLink 
                title="Local SEO:" 
                gradientText="Ranking Factors That Matter" 
                featureHref="/features/gmb-optimization" 
              />
              <p className="text-xl text-muted-foreground mt-6">
                Learn the key ranking factors that determine who appears in local search results and the coveted Local Pack.
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
                  <MapPin className="w-6 h-6 text-primary" />
                  Understanding Local SEO
                </h2>
                <p className="text-muted-foreground mb-4">
                  Local SEO optimizes your online presence to attract customers from nearby geographic areas. When someone searches "pizza near me" or "plumber in Chicago," local SEO determines who shows up.
                </p>
                <p className="text-muted-foreground">
                  The Local Pack—those three business listings with a map—appears in 93% of searches with local intent. Getting into that pack can transform your business.
                </p>
              </motion.div>

              {/* Key Ranking Factors */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-primary" />
                  Top Local Ranking Factors
                </h2>
                <div className="space-y-4">
                  {[
                    { factor: "Google Business Profile", weight: "25%", desc: "Completeness, accuracy, and activity of your GBP listing" },
                    { factor: "Reviews", weight: "17%", desc: "Quantity, quality, velocity, and diversity of reviews" },
                    { factor: "On-Page Signals", weight: "16%", desc: "NAP consistency, local keywords, city/state in content" },
                    { factor: "Link Signals", weight: "13%", desc: "Local backlinks, authority, and anchor text" },
                    { factor: "Citations", weight: "11%", desc: "Consistent NAP across directories and listings" },
                    { factor: "Behavioral Signals", weight: "10%", desc: "Click-through rate, mobile clicks to call, check-ins" },
                    { factor: "Personalization", weight: "8%", desc: "Search history, location, device type" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-secondary/50 rounded-xl p-4">
                      <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold">{item.weight}</span>
                      </div>
                      <div>
                        <p className="text-foreground font-medium">{item.factor}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Reviews */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Star className="w-6 h-6 text-primary" />
                  The Power of Reviews
                </h2>
                <ul className="space-y-2">
                  {[
                    "Respond to every review within 24-48 hours",
                    "Ask satisfied customers for reviews at the right moment",
                    "Never buy fake reviews—Google will penalize you",
                    "Aim for a steady stream rather than bursts of reviews",
                    "Diversify review sources (Google, Yelp, industry-specific)"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* NAP Consistency */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-primary" />
                  NAP Consistency
                </h2>
                <p className="text-muted-foreground mb-4">
                  NAP stands for Name, Address, Phone. Consistent NAP information across the web is crucial for local SEO:
                </p>
                <ul className="space-y-2">
                  {[
                    "Use the exact same business name everywhere",
                    "Format your address identically (St. vs Street, Suite vs Ste)",
                    "Use a local phone number, not toll-free",
                    "Audit major directories for NAP accuracy",
                    "Update citations immediately after any changes"
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
                className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-amber-400/10 to-orange-500/10"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Dominate Local Search?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo monitors your local presence and helps you outrank competitors in your area.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/gmb-optimization">
                      Explore Local Features <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/pricing">Start Free Trial</Link>
                  </Button>
                </div>
              </motion.div>

              {/* Glossary Terms */}
              <GlossaryLegend terms={localSEOTerms} title="Key Terms in This Guide" />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Google Business Profile Mastery",
                  href: "/learn/gmb-optimization-guide",
                  category: "Local & Maps SEO"
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

export default LocalSEOGuide;
