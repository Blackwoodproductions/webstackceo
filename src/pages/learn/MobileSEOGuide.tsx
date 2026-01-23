import { Link } from "react-router-dom";
import { 
  Smartphone, CheckCircle2, ArrowRight, ArrowLeft, 
  Zap, Eye, TouchpadIcon, AlertTriangle
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
import { getTermsByGuide } from "@/data/glossaryData";

// Get terms linked to this guide from shared glossary
const mobileTerms = getTermsByGuide("/learn/mobile-seo-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const MobileSEOGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Mobile SEO Guide - Learning Center"
        description="Master mobile SEO and mobile-first indexing. Learn how to optimize your website for mobile users and Google's mobile-first algorithm."
        keywords="mobile SEO, mobile-first indexing, responsive design, mobile usability, mobile page speed, mobile optimization"
        canonical="/learn/mobile-seo-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Mobile SEO Guide", altText: "Mobile optimization guide" }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 via-transparent to-purple-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <FadeIn>
              <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Center
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-violet-400/10 text-violet-400 text-sm font-medium">
                  SEO Fundamentals
                </span>
                <span className="text-sm text-muted-foreground">11 min read</span>
              </div>
              
              <GuideFeatureLink 
                title="Mobile SEO:" 
                gradientText="Win the Mobile-First World" 
                featureHref="/features/on-page-seo" 
              />
              <p className="text-xl text-muted-foreground mt-6">
                With mobile-first indexing, Google primarily uses your mobile site for ranking. Learn how to optimize for the 60%+ of searches that happen on mobile devices.
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
                  <Smartphone className="w-6 h-6 text-primary" />
                  What is Mobile SEO?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Mobile SEO is the practice of optimizing your website for users on smartphones and tablets. Since Google switched to mobile-first indexing, your mobile site is now the primary version Google uses to rank your pages.
                </p>
                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <p className="text-foreground font-medium">
                    💡 Mobile-First Indexing: Google predominantly uses the mobile version of your content for indexing and ranking. If your mobile site is lacking, your desktop rankings suffer too.
                  </p>
                </div>
              </FadeIn>

              {/* Why It Matters */}
              <FadeIn delay={50} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-primary" />
                  Why Mobile SEO is Critical
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { stat: "60%+", desc: "of all Google searches happen on mobile devices" },
                    { stat: "53%", desc: "of mobile users abandon sites that take over 3 seconds to load" },
                    { stat: "70%", desc: "of web traffic now comes from mobile devices" },
                    { stat: "100%", desc: "of new sites are now indexed mobile-first by Google" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-primary mb-1">{item.stat}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Mobile Design */}
              <FadeIn delay={100} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Eye className="w-6 h-6 text-primary" />
                  Mobile Design Best Practices
                </h2>
                <div className="space-y-4">
                  {[
                    { title: "Responsive Design", desc: "One site that adapts to all screen sizes. Google's recommended approach." },
                    { title: "Readable Text", desc: "16px minimum font size without requiring zoom to read." },
                    { title: "Touch-Friendly Buttons", desc: "Tap targets at least 48px with adequate spacing between them." },
                    { title: "No Horizontal Scrolling", desc: "Content fits within the viewport—no side-to-side scrolling needed." },
                    { title: "Avoid Intrusive Interstitials", desc: "Pop-ups that cover content can hurt rankings and user experience." }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Mobile Speed */}
              <FadeIn delay={150} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-primary" />
                  Mobile Page Speed
                </h2>
                <p className="text-muted-foreground mb-4">
                  Mobile users are often on slower connections. Speed is even more critical on mobile than desktop.
                </p>
                <ul className="space-y-2">
                  {[
                    "Compress and lazy-load images (use WebP format)",
                    "Minimize JavaScript and CSS—defer non-critical scripts",
                    "Use a CDN to serve content from nearby servers",
                    "Enable browser caching for returning visitors",
                    "Implement AMP for news/article pages (optional)",
                    "Target under 3 seconds for full page load"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* Mobile UX */}
              <FadeIn delay={200} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <TouchpadIcon className="w-6 h-6 text-primary" />
                  Mobile UX Optimization
                </h2>
                <ul className="space-y-2">
                  {[
                    "Simplify navigation—use hamburger menus appropriately",
                    "Make phone numbers clickable (tel: links)",
                    "Ensure forms are easy to complete on mobile",
                    "Use mobile-friendly media players",
                    "Test on real devices, not just emulators",
                    "Check Google's Mobile-Friendly Test regularly"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* CTA */}
              <FadeIn delay={250} className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-violet-400/10 to-purple-500/10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Go Mobile-First?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo monitors your mobile performance and helps identify optimization opportunities.
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
              <GlossaryLegend terms={mobileTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Content Marketing Strategy",
                  href: "/learn/content-marketing-guide",
                  category: "Content & Marketing"
                }}
                next={{
                  title: "E-commerce SEO Guide",
                  href: "/learn/ecommerce-seo-guide",
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

export default MobileSEOGuide;
