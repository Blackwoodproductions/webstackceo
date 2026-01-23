import { Link } from "react-router-dom";
import { 
  TrendingUp, CheckCircle2, ArrowRight, ArrowLeft, 
  Award, Link2, Shield, AlertTriangle, BarChart3, Target
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
const domainAuthorityTerms = getTermsByGuide("/learn/domain-authority-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const DomainAuthorityGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Domain Authority Explained - Learning Center"
        description="Understand domain authority, how it's calculated, and why it matters for SEO. Learn strategies to build authority and improve your website's ranking potential."
        keywords="domain authority, DA score, domain rating, DR, website authority, link building, SEO authority, Moz DA, Ahrefs DR"
        canonical="/learn/domain-authority-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Domain Authority Guide", altText: "Understanding and building domain authority" }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 via-transparent to-violet-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <FadeIn>
              <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Center
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-pink-400/10 text-pink-400 text-sm font-medium">
                  Authority Building
                </span>
                <span className="text-sm text-muted-foreground">12 min read</span>
              </div>
              
              <GuideFeatureLink 
                title="Domain Authority:" 
                gradientText="The Complete Guide" 
                featureHref="/features/domain-authority" 
              />
              <p className="text-xl text-muted-foreground mt-6">
                Domain Authority is one of the most important metrics in SEO. Learn what it is, how it works, and exactly how to improve it.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="prose prose-lg prose-invert max-w-none">
              
              {/* What is DA */}
              <FadeIn className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Award className="w-6 h-6 text-primary" />
                  What is Domain Authority?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Domain Authority (DA) is a search engine ranking score developed by Moz that predicts how likely a website is to rank in search engine results. Scores range from 1 to 100, with higher scores corresponding to greater ranking ability.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong className="text-foreground">Important:</strong> DA is not a Google ranking factor. It's a third-party metric that helps SEOs understand a site's competitive strength. However, the factors that influence DA (like quality backlinks) are the same factors Google uses.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-red-400 mb-1">1-30</p>
                    <p className="text-sm text-muted-foreground">Low Authority</p>
                    <p className="text-xs text-foreground mt-2">New or small sites</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-amber-400 mb-1">31-60</p>
                    <p className="text-sm text-muted-foreground">Medium Authority</p>
                    <p className="text-xs text-foreground mt-2">Established businesses</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-400 mb-1">61-100</p>
                    <p className="text-sm text-muted-foreground">High Authority</p>
                    <p className="text-xs text-foreground mt-2">Industry leaders</p>
                  </div>
                </div>
              </FadeIn>

              {/* DA vs DR */}
              <FadeIn delay={50} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  DA vs DR: Understanding the Difference
                </h2>
                <p className="text-muted-foreground mb-4">
                  You'll often see both Domain Authority (DA) and Domain Rating (DR) mentioned. Here's the difference:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-foreground font-bold mb-2">Domain Authority (DA) - Moz</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Based on Moz's link index</li>
                      <li>• Considers link quality and quantity</li>
                      <li>• Includes spam score analysis</li>
                      <li>• More established metric</li>
                    </ul>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-foreground font-bold mb-2">Domain Rating (DR) - Ahrefs</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Based on Ahrefs' link index</li>
                      <li>• Focuses purely on backlink strength</li>
                      <li>• Updated more frequently</li>
                      <li>• Often considered more accurate</li>
                    </ul>
                  </div>
                </div>
                <p className="text-muted-foreground mt-4">
                  <strong className="text-foreground">Pro tip:</strong> Track both metrics but don't obsess over either. Focus on building genuine authority through quality content and natural link acquisition.
                </p>
              </FadeIn>

              {/* Why It Matters */}
              <FadeIn delay={100} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  Why Domain Authority Matters for Your Business
                </h2>
                <p className="text-muted-foreground mb-6">
                  While DA isn't a direct ranking factor, it correlates strongly with ranking success:
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Higher DA sites rank faster for new content",
                    "Strong authority helps you compete for difficult keywords",
                    "Partners and publishers use DA to evaluate link opportunities",
                    "Investors and buyers look at DA when valuing websites",
                    "It's a benchmark for measuring SEO progress over time"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <p className="text-foreground font-medium">
                    📊 <strong>Research shows:</strong> The average DA of top 10 Google results is 77. Competing in most industries requires building authority over time.
                  </p>
                </div>
              </FadeIn>

              {/* How to Improve */}
              <FadeIn delay={150} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  How to Improve Your Domain Authority
                </h2>
                <p className="text-muted-foreground mb-4">
                  Building DA is a long-term process. Here are proven strategies:
                </p>
                
                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" /> 1. Earn High-Quality Backlinks
                </h3>
                <ul className="space-y-2 mb-6">
                  {[
                    "Create link-worthy content (original research, comprehensive guides)",
                    "Guest post on authoritative industry publications",
                    "Build relationships with journalists for digital PR",
                    "Participate in expert roundups and interviews",
                    "Create free tools that others want to link to"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" /> 2. Remove Toxic Backlinks
                </h3>
                <ul className="space-y-2 mb-6">
                  {[
                    "Regularly audit your backlink profile",
                    "Identify spammy or irrelevant links",
                    "Use Google's Disavow Tool for toxic links",
                    "Monitor for negative SEO attacks"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" /> 3. Improve On-Site Fundamentals
                </h3>
                <ul className="space-y-2">
                  {[
                    "Create comprehensive, authoritative content",
                    "Optimize site structure and internal linking",
                    "Improve page speed and Core Web Vitals",
                    "Ensure mobile-friendliness",
                    "Build topical authority in your niche"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* Common Mistakes */}
              <FadeIn delay={200} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Common DA Building Mistakes to Avoid
                </h2>
                <div className="space-y-4">
                  {[
                    { 
                      mistake: "Buying links from link farms", 
                      why: "Google can detect purchased links and may penalize your site"
                    },
                    { 
                      mistake: "Focusing on quantity over quality", 
                      why: "100 spammy links hurt more than 1 quality link helps"
                    },
                    { 
                      mistake: "Expecting overnight results", 
                      why: "DA builds slowly. Expect 6-12 months for meaningful improvement"
                    },
                    { 
                      mistake: "Ignoring your competitor's DA", 
                      why: "You need to understand the authority gap you're trying to close"
                    },
                    { 
                      mistake: "Not tracking progress", 
                      why: "Monthly DA monitoring helps you see what's working"
                    }
                  ].map((item, i) => (
                    <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <p className="text-red-400 font-medium mb-1">❌ {item.mistake}</p>
                      <p className="text-sm text-muted-foreground">{item.why}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* CTA */}
              <FadeIn delay={250} className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-pink-400/10 to-violet-500/10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Build Your Domain Authority?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo tracks your DA/DR in real-time, monitors your backlink profile, and identifies opportunities to build authority faster.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/domain-authority">
                      Explore DA Building Features <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/learn/off-page-seo-guide">Learn Off-Page SEO</Link>
                  </Button>
                </div>
              </FadeIn>

              {/* Glossary Legend */}
              <GlossaryLegend terms={domainAuthorityTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Mastering Website Analytics",
                  href: "/learn/analytics-guide",
                  category: "Analytics & Intelligence"
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

export default DomainAuthorityGuide;