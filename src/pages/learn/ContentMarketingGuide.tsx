import { Link } from "react-router-dom";
import { 
  FileText, CheckCircle2, ArrowRight, ArrowLeft, 
  Target, TrendingUp, Users, Layers, Calendar
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
const contentTerms = getTermsByGuide("/learn/content-marketing-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const ContentMarketingGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Content Marketing Strategy Guide - Learning Center"
        description="Master content marketing for SEO. Learn how to create valuable content that attracts, engages, and converts your target audience."
        keywords="content marketing, content strategy, SEO content, blog strategy, content creation, content calendar, content optimization"
        canonical="/learn/content-marketing-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Content Marketing Guide", altText: "Content marketing strategy" }
        ]}
      />
      
      <main className="pt-8">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-green-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <FadeIn>
              <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Center
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-sm font-medium">
                  Content & Marketing
                </span>
                <span className="text-sm text-muted-foreground">15 min read</span>
              </div>
              
              <GuideFeatureLink 
                title="Content Marketing:" 
                gradientText="Build Authority & Drive Traffic" 
                featureHref="/features/automated-blog" 
              />
              <p className="text-xl text-muted-foreground mt-6">
                Content marketing is how brands build trust, establish authority, and attract customers organically. Learn to create a strategy that delivers results.
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
                  <FileText className="w-6 h-6 text-primary" />
                  What is Content Marketing?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Content marketing is a strategic approach focused on creating and distributing valuable, relevant content to attract and retain a clearly defined audience—and ultimately drive profitable customer action.
                </p>
                <p className="text-muted-foreground">
                  Unlike traditional advertising, content marketing provides value first. Instead of pushing your product, you help your audience solve problems, answer questions, and make better decisions.
                </p>
              </FadeIn>

              {/* Content Types */}
              <FadeIn delay={50} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" />
                  Types of Content
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Blog Posts", desc: "Educational articles that target specific keywords and answer user questions" },
                    { title: "Long-form Guides", desc: "Comprehensive resources (like this one) that establish topical authority" },
                    { title: "Case Studies", desc: "Real-world examples showing how you've helped customers succeed" },
                    { title: "Videos", desc: "Visual content for YouTube, social media, and embedded on your site" },
                    { title: "Infographics", desc: "Visual data presentations that are highly shareable and linkable" },
                    { title: "Podcasts", desc: "Audio content for building personal connections with your audience" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Content Funnel */}
              <FadeIn delay={100} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  Content for Every Stage
                </h2>
                <div className="space-y-4">
                  {[
                    { stage: "Awareness (Top of Funnel)", desc: "Educational blog posts, how-to guides, infographics", goal: "Attract visitors searching for information" },
                    { stage: "Consideration (Middle of Funnel)", desc: "Comparison guides, case studies, webinars", goal: "Help users evaluate solutions" },
                    { stage: "Decision (Bottom of Funnel)", desc: "Product demos, pricing pages, testimonials", goal: "Convert prospects into customers" },
                    { stage: "Retention (Post-Purchase)", desc: "Onboarding guides, tutorials, newsletters", goal: "Reduce churn and increase lifetime value" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.stage}</p>
                      <p className="text-sm text-muted-foreground mb-1">{item.desc}</p>
                      <p className="text-xs text-primary">Goal: {item.goal}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Content Calendar */}
              <FadeIn delay={150} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-primary" />
                  Building a Content Calendar
                </h2>
                <p className="text-muted-foreground mb-4">
                  Consistency is key in content marketing. A content calendar helps you plan, organize, and execute your strategy effectively.
                </p>
                <ul className="space-y-2">
                  {[
                    "Map content to keywords and business goals",
                    "Plan content around seasonal trends and events",
                    "Balance content types across the funnel",
                    "Schedule promotion and distribution alongside creation",
                    "Build in time for content updates and refreshes"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* SEO Integration */}
              <FadeIn delay={200} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  Content + SEO Best Practices
                </h2>
                <ul className="space-y-2">
                  {[
                    "Start with keyword research before writing",
                    "Create content clusters around pillar topics",
                    "Optimize on-page elements (title, headers, meta description)",
                    "Include internal links to related content",
                    "Update and refresh old content regularly",
                    "Promote content to earn backlinks and social shares"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* CTA */}
              <FadeIn delay={250} className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-emerald-400/10 to-green-500/10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Scale Your Content?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo's automated blogging feature helps you create SEO-optimized content at scale.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/automated-blog">
                      Explore Automated Blog <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/pricing">Start Free Trial</Link>
                  </Button>
                </div>
              </FadeIn>

              {/* Glossary Legend */}
              <GlossaryLegend terms={contentTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Keyword Research Guide",
                  href: "/learn/keyword-research-guide",
                  category: "SEO Fundamentals"
                }}
                next={{
                  title: "Mobile SEO Guide",
                  href: "/learn/mobile-seo-guide",
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

export default ContentMarketingGuide;
