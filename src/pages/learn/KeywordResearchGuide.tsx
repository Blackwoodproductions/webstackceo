import { Link } from "react-router-dom";
import { 
  Search, CheckCircle2, ArrowRight, ArrowLeft, 
  Target, TrendingUp, BarChart3, Lightbulb
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
const keywordTerms = getTermsByGuide("/learn/keyword-research-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const KeywordResearchGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Keyword Research Guide - Learning Center"
        description="Master keyword research for SEO. Learn how to find profitable keywords, analyze search intent, and build a keyword strategy that drives organic traffic."
        keywords="keyword research, SEO keywords, search intent, long-tail keywords, keyword strategy, keyword difficulty, search volume"
        canonical="/learn/keyword-research-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Keyword Research Guide", altText: "Complete keyword research guide" }
        ]}
      />
      
      <main className="pt-8">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-blue-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <FadeIn>
              <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Center
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-sm font-medium">
                  SEO Fundamentals
                </span>
                <span className="text-sm text-muted-foreground">14 min read</span>
              </div>
              
              <GuideFeatureLink 
                title="Keyword Research:" 
                gradientText="The Foundation of SEO" 
                featureHref="/features/on-page-seo" 
              />
              <p className="text-xl text-muted-foreground mt-6">
                Every successful SEO campaign starts with keyword research. Learn how to discover what your audience is searching for and how to target those terms effectively.
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
                  What is Keyword Research?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Keyword research is the process of finding and analyzing search terms that people enter into search engines. It helps you understand what your target audience is looking for and how to create content that meets their needs.
                </p>
                <p className="text-muted-foreground">
                  Good keyword research reveals the language your customers use, the questions they ask, and the problems they need solved—giving you a roadmap for content creation.
                </p>
              </FadeIn>

              {/* Why It Matters */}
              <FadeIn delay={50} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" />
                  Why Keyword Research Matters
                </h2>
                <ul className="space-y-2">
                  {[
                    "Understand what your audience is actually searching for",
                    "Discover content opportunities your competitors missed",
                    "Prioritize pages and content that will drive the most traffic",
                    "Align your content with user intent for better conversions",
                    "Build a data-driven content strategy instead of guessing"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* Types of Keywords */}
              <FadeIn delay={100} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Lightbulb className="w-6 h-6 text-primary" />
                  Types of Keywords
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Short-tail Keywords", desc: "1-2 words, high volume, high competition (e.g., 'running shoes')" },
                    { title: "Long-tail Keywords", desc: "3+ words, lower volume, easier to rank (e.g., 'best running shoes for flat feet')" },
                    { title: "Informational Keywords", desc: "Users seeking information (e.g., 'how to tie running shoes')" },
                    { title: "Commercial Keywords", desc: "Users researching before buying (e.g., 'Nike vs Adidas running shoes')" },
                    { title: "Transactional Keywords", desc: "Users ready to buy (e.g., 'buy Nike Air Max online')" },
                    { title: "Navigational Keywords", desc: "Users looking for a specific site (e.g., 'Nike official website')" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Keyword Metrics */}
              <FadeIn delay={150} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  Key Metrics to Analyze
                </h2>
                <div className="space-y-4">
                  {[
                    { metric: "Search Volume", desc: "How many times per month a keyword is searched. Higher isn't always better—balance with competition." },
                    { metric: "Keyword Difficulty", desc: "How hard it is to rank for a term. New sites should target lower difficulty keywords first." },
                    { metric: "Search Intent", desc: "What users want when they search. Match your content type to their intent." },
                    { metric: "CPC (Cost Per Click)", desc: "What advertisers pay per click. High CPC often indicates commercial value." },
                    { metric: "SERP Features", desc: "What appears in search results (featured snippets, maps, images). Affects click-through potential." }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.metric}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Best Practices */}
              <FadeIn delay={200} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  Keyword Research Best Practices
                </h2>
                <ul className="space-y-2">
                  {[
                    "Start with seed keywords based on your products or services",
                    "Use multiple tools (Google Keyword Planner, Ahrefs, Semrush)",
                    "Analyze competitor keywords to find opportunities",
                    "Group keywords by topic to create content clusters",
                    "Prioritize keywords by business value, not just volume",
                    "Update your keyword research quarterly—trends change"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* CTA */}
              <FadeIn delay={250} className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-cyan-400/10 to-blue-500/10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Optimize Your Keywords?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo helps you track rankings and optimize content for your target keywords.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/on-page-seo">
                      Explore On-Page SEO <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">Book a Call</a>
                  </Button>
                </div>
              </FadeIn>

              {/* Glossary Legend */}
              <GlossaryLegend terms={keywordTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Technical SEO Essentials",
                  href: "/learn/technical-seo-guide",
                  category: "SEO Fundamentals"
                }}
                next={{
                  title: "Content Marketing Strategy",
                  href: "/learn/content-marketing-guide",
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

export default KeywordResearchGuide;
