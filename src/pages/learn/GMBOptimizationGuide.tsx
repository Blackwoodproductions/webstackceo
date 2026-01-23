import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MapPin, CheckCircle2, ArrowRight, ArrowLeft, 
  Star, Clock, Image, MessageSquare, TrendingUp, AlertTriangle, Phone
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
const gmbTerms = getTermsByGuide("/learn/gmb-optimization-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const GMBOptimizationGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Google Business Profile Optimization Guide - Learning Center"
        description="Master Google Business Profile (formerly GMB) optimization. Learn how to rank in local search, Google Maps, and drive more customers to your business."
        keywords="Google Business Profile, GMB optimization, local SEO, Google Maps ranking, local search, business listings, local pack"
        canonical="/learn/gmb-optimization-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "GMB Optimization Guide", altText: "Google Business Profile mastery" }
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
                <span className="text-sm text-muted-foreground">13 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Google Business Profile: <span className="gradient-text">Complete Mastery</span>
              </h1>
              <div className="mb-6">
                <GuideFeatureLink featureTitle="GMB Optimization" featureHref="/features/gmb-optimization" />
              </div>
              <p className="text-xl text-muted-foreground">
                Your Google Business Profile is often the first thing customers see. Learn how to optimize it for maximum visibility and conversions.
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
                  What is Google Business Profile?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Google Business Profile (formerly Google My Business) is a free tool that lets you manage how your business appears on Google Search and Maps. It's the foundation of local SEO and directly impacts whether customers find—and choose—your business.
                </p>
                <p className="text-muted-foreground">
                  When someone searches "restaurants near me" or "plumber in [city]," they see the Local Pack—those prominent business listings with ratings and contact info. Your Google Business Profile determines if you appear there.
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
                  Why GBP Optimization is Critical
                </h2>
                <p className="text-muted-foreground mb-6">
                  Local search has exploded. Consider these statistics:
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "46% of all Google searches have local intent",
                    "88% of mobile local searches result in a call or visit within 24 hours",
                    "Businesses in the Local Pack get 126% more traffic than others",
                    "76% of people who search for something nearby visit a business that day"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <p className="text-foreground font-medium">
                    💰 <strong>The Bottom Line:</strong> An optimized Google Business Profile is free advertising that reaches customers exactly when they're ready to buy.
                  </p>
                </div>
              </motion.div>

              {/* Key Ranking Factors */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  Local Pack Ranking Factors
                </h2>
                <p className="text-muted-foreground mb-4">
                  Google uses three primary factors to determine local rankings:
                </p>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-xl font-bold text-primary mb-1">Relevance</p>
                    <p className="text-sm text-muted-foreground">How well your profile matches the search query</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-xl font-bold text-primary mb-1">Distance</p>
                    <p className="text-sm text-muted-foreground">How close you are to the searcher</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-xl font-bold text-primary mb-1">Prominence</p>
                    <p className="text-sm text-muted-foreground">How well-known your business is</p>
                  </div>
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
                  Mastering Reviews
                </h2>
                <p className="text-muted-foreground mb-4">
                  Reviews are the single most important factor in local SEO success. They impact rankings, click-through rates, and conversion.
                </p>
                <ul className="space-y-2">
                  {[
                    "Actively ask satisfied customers for reviews",
                    "Respond to ALL reviews—positive and negative—within 24 hours",
                    "Never buy fake reviews—Google will penalize you",
                    "Use review keywords in your responses naturally",
                    "Address negative reviews professionally and offer solutions",
                    "Aim for a steady stream of reviews, not bursts"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Profile Optimization */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Image className="w-6 h-6 text-primary" />
                  Complete Profile Optimization
                </h2>
                <div className="space-y-4">
                  {[
                    { title: "Business Name", desc: "Use your exact legal business name. No keyword stuffing!" },
                    { title: "Categories", desc: "Choose the most specific primary category. Add all relevant secondary categories." },
                    { title: "Description", desc: "Write a compelling 750-character description with natural keywords." },
                    { title: "Photos", desc: "Add high-quality photos of your business, products, team, and work." },
                    { title: "Hours", desc: "Keep hours accurate, including special holiday hours." },
                    { title: "Attributes", desc: "Fill in all applicable attributes (wheelchair access, WiFi, etc.)" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Posts & Updates */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-primary" />
                  Google Posts Strategy
                </h2>
                <p className="text-muted-foreground mb-4">
                  Google Posts let you share updates, offers, events, and products directly on your profile. Active profiles rank better.
                </p>
                <ul className="space-y-2">
                  {[
                    "Post at least weekly to show Google you're active",
                    "Include clear calls-to-action in every post",
                    "Use high-quality images (minimum 400x300 pixels)",
                    "Promote offers, events, and new products/services",
                    "Keep posts relevant and timely"
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
                  Webstack.ceo automates GBP optimization, monitors your rankings, and helps you build a review strategy that wins.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/gmb-optimization">
                      Explore GMB Features <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/pricing">Start Free Trial</Link>
                  </Button>
                </div>
              </motion.div>

              {/* Glossary Terms */}
              <GlossaryLegend terms={gmbTerms} title="Key Terms in This Guide" />

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

export default GMBOptimizationGuide;
