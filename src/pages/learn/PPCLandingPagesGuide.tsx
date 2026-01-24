import { Link } from "react-router-dom";
import { 
  MousePointerClick, CheckCircle2, ArrowRight, ArrowLeft,
  Target, Zap, DollarSign
} from "lucide-react";
import QuickMetricCheck from "@/components/QuickMetricCheck";
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
const ppcTerms = getTermsByGuide("/learn/ppc-landing-pages-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const PPCLandingPagesGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="PPC Landing Page Mastery Guide - Learning Center"
        description="Master PPC landing page optimization. Learn about Quality Score, message match, conversion optimization, and creating high-converting ad landing pages."
        keywords="PPC landing pages, landing page optimization, Quality Score, ad landing pages, conversion optimization, Google Ads landing pages"
        canonical="/learn/ppc-landing-pages-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "PPC Landing Pages Guide", altText: "Landing page optimization" }
        ]}
      />
      
      <main className="pt-8">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 via-transparent to-pink-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <FadeIn>
              <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Center
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-red-400/10 text-red-400 text-sm font-medium">
                  Conversion Optimization
                </span>
                <span className="text-sm text-muted-foreground">11 min read</span>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium border border-amber-500/30">
                  Add-on
                </span>
              </div>
              
              <GuideFeatureLink 
                title="PPC Landing Pages:" 
                gradientText="Convert Clicks to Customers" 
                featureHref="/features/ppc-landing-pages" 
              />
              <p className="text-xl text-muted-foreground mt-6">
                Your landing page determines whether paid traffic becomes paying customers. Master the art of high-converting landing pages.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Quick Metric Check */}
        <section className="py-8">
          <div className="container mx-auto px-6 max-w-4xl">
            <QuickMetricCheck metricType="page_speed" />
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="prose prose-lg prose-invert max-w-none">
              
              {/* Introduction */}
              <FadeIn className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <MousePointerClick className="w-6 h-6 text-primary" />
                  Why PPC Landing Pages Matter
                </h2>
                <p className="text-muted-foreground mb-4">
                  A dedicated landing page for your PPC campaigns can double or triple your <GlossaryTooltip term="conversion-rate">conversion rate</GlossaryTooltip> compared to sending traffic to your homepage. The key is creating a focused experience that matches visitor intent.
                </p>
                <p className="text-muted-foreground">
                  Google also rewards relevant landing pages with higher Quality Scores, reducing your cost per click and improving ad positions.
                </p>
              </FadeIn>

              {/* Quality Score */}
              <FadeIn delay={50} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-primary" />
                  Landing Page Experience & Quality Score
                </h2>
                <p className="text-muted-foreground mb-4">
                  Landing page experience is one of three factors that determine your Quality Score:
                </p>
                <ul className="space-y-2">
                  {[
                    "Relevance: Does your page match the ad and keyword intent?",
                    "Transparency: Is your business info and offer clear?",
                    "Navigation: Is it easy to find information?",
                    "Speed: Does the page load quickly on all devices?",
                    "Mobile: Is the experience good on mobile?"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* Key Elements */}
              <FadeIn delay={100} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" />
                  Essential Landing Page Elements
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Compelling Headline", desc: "Match your ad copy and address visitor intent immediately" },
                    { title: "Clear Value Prop", desc: "Explain what you offer and why it matters—in seconds" },
                    { title: "Social Proof", desc: "Reviews, testimonials, logos, and trust signals" },
                    { title: "Strong CTA", desc: "One clear, action-oriented call-to-action" },
                    { title: "Minimal Friction", desc: "Remove navigation and distractions that compete with CTA" },
                    { title: "Fast Loading", desc: "Every second of delay costs conversions" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Best Practices */}
              <FadeIn delay={150} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-primary" />
                  Optimization Best Practices
                </h2>
                <ul className="space-y-2">
                  {[
                    "Create unique landing pages for different ad groups",
                    "Match headline to the search query/ad copy exactly",
                    "Use urgency and scarcity appropriately",
                    "A/B test headlines, CTAs, and layouts continuously",
                    "Ensure mobile responsiveness—most traffic is mobile",
                    "Track micro-conversions to understand user behavior"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* CTA */}
              <FadeIn delay={200} className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-red-400/10 to-pink-500/10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Convert More Clicks?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo helps you create and test high-converting landing pages for your PPC campaigns.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/ppc-landing-pages">
                      Explore Features <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">Book a Call</a>
                  </Button>
                </div>
              </FadeIn>

              {/* Glossary Legend */}
              <GlossaryLegend terms={ppcTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Core Web Vitals Guide",
                  href: "/learn/core-web-vitals-guide",
                  category: "Performance & Reliability"
                }}
                next={{
                  title: "Conversion Rate Optimization",
                  href: "/learn/cro-guide",
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

export default PPCLandingPagesGuide;