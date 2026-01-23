import { Link } from "react-router-dom";
import { 
  TrendingUp, CheckCircle2, ArrowRight, ArrowLeft,
  Target, Zap, BarChart3
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
import FadeIn from "@/components/ui/fade-in";
import GlossaryTooltip from "@/components/ui/glossary-tooltip";
import { getTermsByGuide } from "@/data/glossaryData";

// Get terms linked to this guide from shared glossary
const croTerms = getTermsByGuide("/learn/cro-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const CROGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Conversion Rate Optimization (CRO) Guide - Learning Center"
        description="Master conversion rate optimization. Learn A/B testing, user research, landing page optimization, and strategies to turn more visitors into customers."
        keywords="CRO, conversion rate optimization, A/B testing, conversion optimization, landing page optimization, user experience, conversion funnel"
        canonical="/learn/cro-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "CRO Guide", altText: "Conversion rate optimization" }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 via-transparent to-red-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <FadeIn>
              <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Center
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-orange-400/10 text-orange-400 text-sm font-medium">
                  Conversion Optimization
                </span>
                <span className="text-sm text-muted-foreground">13 min read</span>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium border border-amber-500/30">
                  Add-on
                </span>
              </div>
              
              <GuideFeatureLink 
                title="CRO:" 
                gradientText="Turn Visitors Into Customers" 
                featureHref="/features/ppc-landing-pages" 
              />
              <p className="text-xl text-muted-foreground mt-6">
                Traffic means nothing without conversions. Learn how to systematically improve your website's ability to convert visitors.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="prose prose-lg prose-invert max-w-none">
              
              {/* Introduction */}
              <FadeIn className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  What is Conversion Rate Optimization?
                </h2>
                <p className="text-muted-foreground mb-4">
                  CRO is the systematic process of increasing the percentage of website visitors who take a desired action—whether that's making a purchase, filling out a form, or signing up for a newsletter.
                </p>
                <p className="text-muted-foreground">
                  Unlike traffic acquisition (SEO, ads), CRO maximizes the value of traffic you already have. A 1% improvement in <GlossaryTooltip term="conversion-rate">conversion rate</GlossaryTooltip> can mean thousands in additional revenue.
                </p>
              </FadeIn>

              {/* The Math */}
              <FadeIn delay={50} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  The Power of CRO
                </h2>
                <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
                  <p className="text-foreground font-medium mb-4">Consider this scenario:</p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <p className="text-muted-foreground mb-2">Before CRO:</p>
                      <p className="text-foreground">10,000 visitors × 2% conversion = <strong>200 customers</strong></p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <p className="text-muted-foreground mb-2">After CRO (3% conversion):</p>
                      <p className="text-foreground">10,000 visitors × 3% conversion = <strong>300 customers</strong></p>
                    </div>
                  </div>
                  <p className="text-emerald-400 mt-4 font-semibold">That's 50% more customers without spending more on traffic!</p>
                </div>
              </FadeIn>

              {/* CRO Process */}
              <FadeIn delay={100} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-primary" />
                  The CRO Process
                </h2>
                <div className="space-y-4">
                  {[
                    { step: "1", title: "Research", desc: "Analyze data, user behavior, and feedback to find problems" },
                    { step: "2", title: "Hypothesize", desc: "Form testable hypotheses about what changes might improve conversions" },
                    { step: "3", title: "Prioritize", desc: "Rank tests by potential impact and ease of implementation" },
                    { step: "4", title: "Test", desc: "Run A/B tests to validate hypotheses with statistical significance" },
                    { step: "5", title: "Learn", desc: "Analyze results and apply learnings to future tests" }
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
              </FadeIn>

              {/* Key Areas */}
              <FadeIn delay={150} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" />
                  Key Areas to Optimize
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Headlines", desc: "Your first chance to grab attention and communicate value" },
                    { title: "CTAs", desc: "Button text, color, size, and placement all impact clicks" },
                    { title: "Forms", desc: "Reduce fields, improve labels, minimize friction" },
                    { title: "Social Proof", desc: "Reviews, testimonials, trust badges, and logos" },
                    { title: "Page Speed", desc: "Faster pages convert better—period" },
                    { title: "Mobile Experience", desc: "Most users are on mobile; optimize accordingly" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* CTA */}
              <FadeIn delay={200} className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-orange-400/10 to-red-500/10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Boost Conversions?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo helps you identify conversion opportunities and test improvements.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/advanced-analytics">
                      Explore Analytics <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/pricing">Start Free Trial</Link>
                  </Button>
                </div>
              </FadeIn>

              {/* Glossary Legend */}
              <GlossaryLegend terms={croTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "PPC Landing Page Mastery",
                  href: "/learn/ppc-landing-pages-guide",
                  category: "Conversion Optimization"
                }}
                next={{
                  title: "Complete Guide to On-Page SEO",
                  href: "/learn/on-page-seo-guide",
                  category: "SEO Fundamentals"
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

export default CROGuide;