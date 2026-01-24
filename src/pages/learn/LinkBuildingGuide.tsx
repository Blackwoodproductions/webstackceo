import { Link } from "react-router-dom";
import { 
  Link2, CheckCircle2, ArrowRight, ArrowLeft, 
  Target, AlertTriangle, Zap, Layers
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
import QuickMetricCheck from "@/components/QuickMetricCheck";
import diamondFlowImg from "@/assets/bron-seo-diamond-flow.png";
import { getTermsByGuide } from "@/data/glossaryData";

// Get terms linked to this guide from shared glossary
const linkBuildingTerms = getTermsByGuide("/learn/link-building-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const LinkBuildingGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Link Building Best Practices Guide - Learning Center"
        description="Master ethical link building strategies. Learn about guest posting, broken link building, digital PR, and earning high-quality backlinks."
        keywords="link building, backlinks, guest posting, digital PR, broken link building, link outreach, SEO links"
        canonical="/learn/link-building-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Link Building Guide", altText: "Link building best practices" }
        ]}
      />
      
      <main className="pt-8">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 via-transparent to-rose-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <FadeIn>
              <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Center
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-pink-400/10 text-pink-400 text-sm font-medium">
                  Authority Building
                </span>
                <span className="text-sm text-muted-foreground">14 min read</span>
              </div>
              
              <GuideFeatureLink 
                title="Link Building:" 
                gradientText="Best Practices" 
                featureHref="/features/domain-authority" 
              />
              <p className="text-xl text-muted-foreground mt-6">
                Backlinks remain one of Google's top ranking factors. Learn how to build links ethically and effectively.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Quick Backlink Check */}
        <section className="py-8">
          <div className="container mx-auto px-6 max-w-4xl">
            <QuickMetricCheck metricType="backlinks" />
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="prose prose-lg prose-invert max-w-none">
              
              {/* Introduction */}
              <FadeIn className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Link2 className="w-6 h-6 text-primary" />
                  Why Links Still Matter
                </h2>
                <p className="text-muted-foreground mb-4">
                  Despite years of algorithm updates, <GlossaryTooltip term="backlinks">backlinks</GlossaryTooltip> remain one of Google's strongest ranking signals. Links from authoritative, relevant websites tell Google your content is trustworthy and valuable.
                </p>
                <p className="text-muted-foreground">
                  But not all links are created equal. Quality matters far more than quantity, and spammy link building can get you penalized.
                </p>
              </FadeIn>

              {/* Strategies */}
              <FadeIn delay={50} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-primary" />
                  Effective Link Building Strategies
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Guest Posting", desc: "Write quality content for relevant industry publications" },
                    { title: "Digital PR", desc: "Create newsworthy content and pitch to journalists" },
                    { title: "Broken Link Building", desc: "Find broken links and offer your content as replacement" },
                    { title: "Resource Link Building", desc: "Create comprehensive resources others want to reference" },
                    { title: "HARO (Help a Reporter)", desc: "Provide expert quotes for media coverage" },
                    { title: "Competitor Analysis", desc: "Replicate competitors' best backlinks" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* What to Avoid */}
              <FadeIn delay={100} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  What to Avoid
                </h2>
                <ul className="space-y-2">
                  {[
                    "Buying links from PBNs (Private Blog Networks)",
                    "Excessive link exchanges (\"you link to me, I'll link to you\")",
                    "Low-quality directory submissions",
                    "Comment spam with keyword-rich anchor text",
                    "Automated link building tools",
                    "Links from irrelevant or low-quality websites"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-red-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-400 text-xs">✕</span>
                      </span>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* Best Practices */}
              <FadeIn delay={150} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" />
                  Link Building Best Practices
                </h2>
                <ul className="space-y-2">
                  {[
                    "Focus on relevance—links from your industry matter most",
                    "Prioritize authority—one link from NYT beats 100 from spam sites",
                    "Diversify anchor text to look natural",
                    "Build relationships, not just links",
                    "Create link-worthy content first, then promote",
                    "Monitor your backlink profile for toxic links"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* Diamond Flow - Content Silo */}
              <FadeIn delay={175} className="glass-card rounded-2xl p-8 mb-8 bg-gradient-to-br from-cyan-400/5 to-violet-500/5">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Layers className="w-6 h-6 text-primary" />
                  Content Silo Link Architecture
                </h2>
                <p className="text-muted-foreground mb-6">
                  The most effective link building uses a structured content silo approach. We call this the <strong className="text-foreground">Diamond Flow</strong>—a bottom-up power structure that channels link equity to your most valuable pages.
                </p>
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div>
                    <img 
                      src={diamondFlowImg} 
                      alt="BRON SEO Diamond Flow showing content silo structure with money page, supporting pages, and resources page" 
                      className="rounded-xl shadow-lg w-full"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">💰 Money Page</p>
                      <p className="text-sm text-muted-foreground">Your target URL—either your existing page or one we create for your main keyword</p>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">📄 Supporting Pages</p>
                      <p className="text-sm text-muted-foreground">2 pages per cluster with relevant content linking up to your money page</p>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">📑 Resources Page</p>
                      <p className="text-sm text-muted-foreground">A topical index of the 3 keyword pages above, reinforcing the silo's thematic relevance</p>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">🔗 Real Business Links</p>
                      <p className="text-sm text-muted-foreground">All inbound links come from real, relevant business websites in your niche—not PBNs or spam sites</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm text-foreground">
                        <strong>Note:</strong> If you already have a money page, we skip creating the main keyword page and send links directly to your existing URL.
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* CTA */}
              <FadeIn delay={200} className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-pink-400/10 to-rose-500/10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Build Authority?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo helps you identify link opportunities and track your backlink growth.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/off-page-seo">
                      Explore Link Features <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">Book a Call</a>
                  </Button>
                </div>
              </FadeIn>

              {/* Glossary Legend */}
              <GlossaryLegend terms={linkBuildingTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Domain Authority Explained",
                  href: "/learn/domain-authority-guide",
                  category: "Authority Building"
                }}
                next={{
                  title: "Uptime Monitoring Essentials",
                  href: "/learn/uptime-monitoring-guide",
                  category: "Performance & Reliability"
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

export default LinkBuildingGuide;