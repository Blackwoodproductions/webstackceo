import { Link } from "react-router-dom";
import { 
  Search, CheckCircle2, ArrowRight, ArrowLeft, BookOpen,
  FileText, Code, Image, Link2, Gauge, AlertTriangle
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
const onPageSEOTerms = getTermsByGuide("/learn/on-page-seo-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const OnPageSEOGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Complete Guide to On-Page SEO - Learning Center"
        description="Master on-page SEO with our comprehensive guide. Learn about title tags, meta descriptions, header structure, content optimization, and technical best practices."
        keywords="on-page SEO guide, title tags, meta descriptions, header tags, content optimization, internal linking, image SEO, schema markup"
        canonical="/learn/on-page-seo-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "On-Page SEO Guide", altText: "Complete guide to on-page optimization" }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <FadeIn>
              <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Center
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-sm font-medium">
                  SEO Fundamentals
                </span>
                <span className="text-sm text-muted-foreground">12 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                The Complete Guide to <span className="gradient-text">On-Page SEO</span>
              </h1>
              <div className="mb-6">
                <GuideFeatureLink featureTitle="On-Page SEO" featureHref="/features/on-page-seo" isAddOn />
              </div>
              <p className="text-xl text-muted-foreground">
                On-page SEO is the foundation of your search visibility. Learn how to optimize every element of your pages to rank higher and drive more organic traffic.
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
                  <Search className="w-6 h-6 text-primary" />
                  What is On-Page SEO?
                </h2>
                <p className="text-muted-foreground mb-4">
                  On-page SEO refers to all the optimizations you make directly on your website pages to improve search engine rankings. Unlike off-page SEO (which focuses on external signals like backlinks), on-page SEO is entirely within your control.
                </p>
                <p className="text-muted-foreground">
                  Think of on-page SEO as speaking Google's language. You're helping search engines understand what your page is about, who it's for, and why it deserves to rank above competitors.
                </p>
              </FadeIn>

              {/* Why It Matters */}
              <FadeIn delay={50} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  Why On-Page SEO is Critical for CEOs
                </h2>
                <p className="text-muted-foreground mb-6">
                  As a CEO, your website is often the first impression potential customers have of your business. Poor on-page SEO means:
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Your competitors appear in search results instead of you",
                    "You're paying more for ads because organic traffic is weak",
                    "Potential customers can't find you when they're ready to buy",
                    "Your brand authority suffers in your industry"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <p className="text-foreground font-medium">
                    💡 <strong>The ROI Reality:</strong> Companies that invest in on-page SEO see an average of 14.6% conversion rate from organic search, compared to just 1.7% from outbound methods like cold calling.
                  </p>
                </div>
              </FadeIn>

              {/* Title Tags */}
              <FadeIn delay={100} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  1. Title Tags: Your First Impression
                </h2>
                <p className="text-muted-foreground mb-4">
                  The title tag is the clickable headline that appears in search results. It's arguably the most important on-page SEO element because it directly impacts both rankings and click-through rates.
                </p>
                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Best Practices:</h3>
                <ul className="space-y-2 mb-6">
                  {[
                    "Keep titles under 60 characters to avoid truncation",
                    "Place your primary keyword near the beginning",
                    "Make it compelling—you're competing for clicks",
                    "Include your brand name for recognition",
                    "Each page needs a unique title"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-secondary/50 rounded-xl p-4 font-mono text-sm">
                  <p className="text-muted-foreground mb-2">❌ Bad: "Home | Company Name"</p>
                  <p className="text-emerald-400">✅ Good: "Enterprise SEO Tools for CEOs | Webstack.ceo"</p>
                </div>
              </FadeIn>

              {/* Meta Descriptions */}
              <FadeIn delay={150} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Code className="w-6 h-6 text-primary" />
                  2. Meta Descriptions: Your Sales Pitch
                </h2>
                <p className="text-muted-foreground mb-4">
                  Meta descriptions don't directly impact rankings, but they massively influence click-through rates. A compelling meta description can be the difference between a user clicking your result or a competitor's.
                </p>
                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Optimization Tips:</h3>
                <ul className="space-y-2">
                  {[
                    "Stay under 160 characters for full visibility",
                    "Include a clear value proposition",
                    "Add a call-to-action when appropriate",
                    "Use your target keyword naturally",
                    "Match the search intent of the query"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* Header Structure */}
              <FadeIn delay={200} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-primary" />
                  3. Header Structure: Organize for Humans & Bots
                </h2>
                <p className="text-muted-foreground mb-4">
                  Headers (H1-H6) create a logical hierarchy for your content. Search engines use this structure to understand the relationship between different sections of your page.
                </p>
                <div className="bg-secondary/50 rounded-xl p-6 mb-4">
                  <p className="text-foreground font-medium mb-3">Proper Header Hierarchy:</p>
                  <div className="space-y-2 font-mono text-sm">
                    <p className="text-foreground">H1: Main Page Title (only one per page)</p>
                    <p className="text-muted-foreground pl-4">H2: Major Section Heading</p>
                    <p className="text-muted-foreground pl-8">H3: Subsection Heading</p>
                    <p className="text-muted-foreground pl-12">H4: Sub-subsection Heading</p>
                  </div>
                </div>
              </FadeIn>

              {/* Images */}
              <FadeIn delay={250} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Image className="w-6 h-6 text-primary" />
                  4. Image Optimization
                </h2>
                <p className="text-muted-foreground mb-4">
                  Images can drive significant traffic through Google Image Search, but only if they're properly optimized. Plus, image optimization directly impacts page speed—a confirmed ranking factor.
                </p>
                <ul className="space-y-2">
                  {[
                    "Use descriptive, keyword-rich file names",
                    "Always add alt text describing the image",
                    "Compress images to reduce file size",
                    "Use modern formats (WebP, AVIF) when possible",
                    "Implement lazy loading for below-fold images"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* Internal Linking */}
              <FadeIn delay={300} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Link2 className="w-6 h-6 text-primary" />
                  5. Internal Linking Strategy
                </h2>
                <p className="text-muted-foreground mb-4">
                  Internal links help search engines discover and understand the relationship between your pages. They also distribute "link equity" throughout your site, helping important pages rank higher.
                </p>
                <ul className="space-y-2">
                  {[
                    "Link from high-authority pages to important target pages",
                    "Use descriptive anchor text (not 'click here')",
                    "Create content hubs around key topics",
                    "Ensure every page is reachable within 3 clicks",
                    "Regularly audit for broken internal links"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* Core Web Vitals */}
              <FadeIn delay={350} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Gauge className="w-6 h-6 text-primary" />
                  6. Core Web Vitals & Page Experience
                </h2>
                <p className="text-muted-foreground mb-4">
                  Google's Core Web Vitals are now a confirmed ranking factor. These metrics measure loading performance, interactivity, and visual stability of your pages.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary mb-1">LCP</p>
                    <p className="text-sm text-muted-foreground">Largest Contentful Paint</p>
                    <p className="text-xs text-foreground mt-2">Target: &lt; 2.5s</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary mb-1">INP</p>
                    <p className="text-sm text-muted-foreground">Interaction to Next Paint</p>
                    <p className="text-xs text-foreground mt-2">Target: &lt; 200ms</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary mb-1">CLS</p>
                    <p className="text-sm text-muted-foreground">Cumulative Layout Shift</p>
                    <p className="text-xs text-foreground mt-2">Target: &lt; 0.1</p>
                  </div>
                </div>
              </FadeIn>

              {/* CTA */}
              <FadeIn delay={400} className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-cyan-400/10 to-violet-500/10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Automate Your On-Page SEO?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo automatically monitors and optimizes all these on-page factors for you. Stop manual auditing—start ranking.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/on-page-seo">
                      Explore On-Page SEO Features <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/pricing">Start Free Trial</Link>
                  </Button>
                </div>
              </FadeIn>

              {/* Glossary Legend */}
              <GlossaryLegend terms={onPageSEOTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                next={{
                  title: "Off-Page SEO: Building Authority",
                  href: "/learn/off-page-seo-guide",
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

export default OnPageSEOGuide;