import { Link } from "react-router-dom";
import { 
  Activity, CheckCircle2, ArrowRight, ArrowLeft, 
  Zap, Clock, MousePointer, Target
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
const cwvTerms = getTermsByGuide("/learn/core-web-vitals-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const CoreWebVitalsGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Core Web Vitals Complete Guide - Learning Center"
        description="Master Google's Core Web Vitals. Learn about LCP, INP, CLS, how to measure them, and optimization strategies for better rankings."
        keywords="Core Web Vitals, LCP, INP, CLS, page experience, page speed, web performance, Google ranking factors"
        canonical="/learn/core-web-vitals-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Core Web Vitals Guide", altText: "Page experience metrics" }
        ]}
      />
      
      <main className="pt-8">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-transparent to-emerald-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <FadeIn>
              <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Center
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-green-400/10 text-green-400 text-sm font-medium">
                  Performance & Reliability
                </span>
                <span className="text-sm text-muted-foreground">12 min read</span>
              </div>
              
              <GuideFeatureLink 
                title="Core Web Vitals:" 
                gradientText="The Complete Guide" 
                featureHref="/features/web-hosting" 
                isAddOn 
              />
              <p className="text-xl text-muted-foreground mt-6">
                Google's Core Web Vitals are now ranking factors. Learn what they measure and how to optimize them.
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
                  <Activity className="w-6 h-6 text-primary" />
                  What Are Core Web Vitals?
                </h2>
                <p className="text-muted-foreground mb-4">
                  <GlossaryTooltip term="core-web-vitals">Core Web Vitals</GlossaryTooltip> are a set of specific metrics that Google uses to measure real-world user experience on web pages. They focus on three aspects: loading performance, interactivity, and visual stability.
                </p>
                <p className="text-muted-foreground">
                  Since 2021, these metrics are part of Google's ranking algorithm, making them essential for SEO success.
                </p>
              </FadeIn>

              {/* The Three Metrics */}
              <FadeIn delay={50} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-primary" />
                  The Three Core Web Vitals
                </h2>
                <div className="space-y-6">
                  <div className="bg-secondary/50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-6 h-6 text-green-400" />
                      <h3 className="text-lg font-bold text-foreground">LCP - Largest Contentful Paint</h3>
                    </div>
                    <p className="text-muted-foreground mb-3">Measures loading performance—how long it takes for the main content to load.</p>
                    <div className="flex gap-4 text-sm flex-wrap">
                      <span className="px-3 py-1 rounded-full bg-green-400/20 text-green-400">Good: ≤2.5s</span>
                      <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-400">Needs Work: ≤4.0s</span>
                      <span className="px-3 py-1 rounded-full bg-red-400/20 text-red-400">Poor: &gt;4.0s</span>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <MousePointer className="w-6 h-6 text-blue-400" />
                      <h3 className="text-lg font-bold text-foreground">INP - Interaction to Next Paint</h3>
                    </div>
                    <p className="text-muted-foreground mb-3">Measures interactivity—how quickly the page responds to user interactions.</p>
                    <div className="flex gap-4 text-sm flex-wrap">
                      <span className="px-3 py-1 rounded-full bg-green-400/20 text-green-400">Good: ≤200ms</span>
                      <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-400">Needs Work: ≤500ms</span>
                      <span className="px-3 py-1 rounded-full bg-red-400/20 text-red-400">Poor: &gt;500ms</span>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Activity className="w-6 h-6 text-purple-400" />
                      <h3 className="text-lg font-bold text-foreground">CLS - Cumulative Layout Shift</h3>
                    </div>
                    <p className="text-muted-foreground mb-3">Measures visual stability—how much the page layout shifts during loading.</p>
                    <div className="flex gap-4 text-sm flex-wrap">
                      <span className="px-3 py-1 rounded-full bg-green-400/20 text-green-400">Good: ≤0.1</span>
                      <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-400">Needs Work: ≤0.25</span>
                      <span className="px-3 py-1 rounded-full bg-red-400/20 text-red-400">Poor: &gt;0.25</span>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Optimization Tips */}
              <FadeIn delay={100} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" />
                  Optimization Strategies
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Improve LCP:</h3>
                    <ul className="space-y-1">
                      {[
                        "Optimize and compress images (use WebP format)",
                        "Preload critical resources",
                        "Use a CDN for faster content delivery",
                        "Minimize render-blocking JavaScript and CSS"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Improve INP:</h3>
                    <ul className="space-y-1">
                      {[
                        "Break up long JavaScript tasks",
                        "Optimize event handlers",
                        "Use web workers for heavy computations",
                        "Reduce JavaScript bundle size"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Improve CLS:</h3>
                    <ul className="space-y-1">
                      {[
                        "Set explicit dimensions on images and videos",
                        "Reserve space for ads and embeds",
                        "Avoid inserting content above existing content",
                        "Use CSS transform for animations"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </FadeIn>

              {/* CTA */}
              <FadeIn delay={150} className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-green-400/10 to-emerald-500/10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Optimize Your Vitals?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo monitors your Core Web Vitals and provides actionable recommendations.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/advanced-analytics">
                      Explore Analytics <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">Book a Call</a>
                  </Button>
                </div>
              </FadeIn>

              {/* Glossary Legend */}
              <GlossaryLegend terms={cwvTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Web Hosting for SEO",
                  href: "/learn/web-hosting-guide",
                  category: "Performance & Reliability"
                }}
                next={{
                  title: "PPC Landing Page Mastery",
                  href: "/learn/ppc-landing-pages-guide",
                  category: "Conversion Optimization"
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

export default CoreWebVitalsGuide;