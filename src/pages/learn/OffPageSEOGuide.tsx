import { Link } from "react-router-dom";
import { 
  TrendingUp, CheckCircle2, ArrowRight, ArrowLeft, 
  Link2, Users, FileText, Share2, Award, AlertTriangle, Layers
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
import FadeIn from "@/components/ui/fade-in";
import diamondFlowImg from "@/assets/bron-seo-diamond-flow.png";
import { getTermsByGuide } from "@/data/glossaryData";

// Get terms linked to this guide from shared glossary
const offPageSEOTerms = getTermsByGuide("/learn/off-page-seo-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const OffPageSEOGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Off-Page SEO: Building Authority - Learning Center"
        description="Learn how to build domain authority through off-page SEO. Master link building, brand mentions, social signals, and reputation management strategies."
        keywords="off-page SEO, link building, domain authority, backlinks, brand mentions, social signals, reputation management, SEO strategy"
        canonical="/learn/off-page-seo-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Off-Page SEO Guide", altText: "Building authority through off-page optimization" }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 via-transparent to-cyan-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <FadeIn>
              <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Center
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-violet-400/10 text-violet-400 text-sm font-medium">
                  SEO Fundamentals
                </span>
                <span className="text-sm text-muted-foreground">10 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Off-Page SEO: <span className="gradient-text">Building Authority</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                While on-page SEO optimizes your website, off-page SEO builds your reputation across the internet. Learn how to establish authority that search engines trust.
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
                  What is Off-Page SEO?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Off-page SEO encompasses all the activities you do outside of your website to improve search rankings. It's how the internet perceives your brand, authority, and trustworthiness.
                </p>
                <p className="text-muted-foreground">
                  Think of on-page SEO as your resume, and off-page SEO as your reputation. Both matter, but your reputation—what others say about you—often carries more weight.
                </p>
              </FadeIn>

              {/* Why It Matters */}
              <FadeIn delay={50} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  Why Off-Page SEO Matters for Business
                </h2>
                <p className="text-muted-foreground mb-6">
                  Google's algorithm uses off-page signals to determine if your content is valuable enough to rank. Without strong off-page SEO:
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Competitors with more backlinks will outrank you—even with worse content",
                    "Your domain authority stays low, limiting all your pages' potential",
                    "New content takes longer to rank without established trust",
                    "You miss referral traffic from authoritative sites"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <p className="text-foreground font-medium">
                    📊 <strong>The Data:</strong> A study of 1 million Google search results found that the #1 result has an average of 3.8x more backlinks than positions #2-#10.
                  </p>
                </div>
              </FadeIn>

              {/* Link Building */}
              <FadeIn delay={100} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Link2 className="w-6 h-6 text-primary" />
                  1. Link Building: The Foundation
                </h2>
                <p className="text-muted-foreground mb-4">
                  Backlinks remain one of Google's top ranking factors. But not all links are equal—quality matters far more than quantity.
                </p>
                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">High-Value Link Sources:</h3>
                <ul className="space-y-2 mb-6">
                  {[
                    "Industry publications and news sites",
                    "Educational institutions (.edu domains)",
                    "Government websites (.gov domains)",
                    "Relevant niche blogs with real audiences",
                    "Professional associations and directories"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Link Building Strategies:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Guest Posting", desc: "Write valuable content for authoritative sites in your industry" },
                    { title: "Broken Link Building", desc: "Find broken links on relevant sites and offer your content as a replacement" },
                    { title: "Digital PR", desc: "Create newsworthy content that journalists want to cover" },
                    { title: "Resource Pages", desc: "Get listed on curated resource pages in your niche" }
                  ].map((strategy, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{strategy.title}</p>
                      <p className="text-sm text-muted-foreground">{strategy.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Diamond Flow - Content Silo */}
              <FadeIn delay={125} className="glass-card rounded-2xl p-8 mb-8 bg-gradient-to-br from-violet-400/5 to-cyan-500/5">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Layers className="w-6 h-6 text-primary" />
                  The Diamond Flow: Strategic Link Architecture
                </h2>
                <p className="text-muted-foreground mb-6">
                  Effective off-page SEO requires structure. The <strong className="text-foreground">Diamond Flow</strong> architecture creates content silos that channel link equity directly to your money pages using a bottom-up power structure.
                </p>
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div>
                    <img 
                      src={diamondFlowImg} 
                      alt="BRON SEO Diamond Flow showing content silo with money page at top, supporting pages, and resources page with inbound links flowing upward" 
                      className="rounded-xl shadow-lg w-full"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground font-medium">Money Page at the Top</p>
                        <p className="text-sm text-muted-foreground">Your client's target URL receives all upward-flowing link equity</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground font-medium">Supporting Pages (2 per cluster)</p>
                        <p className="text-sm text-muted-foreground">Niche-relevant content we create that links to the money page</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground font-medium">Resources Page (Topical Index)</p>
                        <p className="text-sm text-muted-foreground">An index of the 3 keyword pages above, reinforcing topical authority</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground font-medium">Inbound Links Flow Upward</p>
                        <p className="text-sm text-muted-foreground">All link equity is channeled to boost your money page</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground font-medium">Real Business Websites</p>
                        <p className="text-sm text-muted-foreground">All inbound links come from real, relevant business websites in your niche—not PBNs or spam sites</p>
                      </div>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 mt-4">
                      <p className="text-sm text-foreground">
                        <strong>Already have a money page?</strong> We skip the main keyword page and link directly to your existing URL.
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Brand Mentions */}
              <FadeIn delay={150} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Award className="w-6 h-6 text-primary" />
                  2. Brand Mentions & Citations
                </h2>
                <p className="text-muted-foreground mb-4">
                  Google can recognize when your brand is mentioned online, even without a link. These "implied links" contribute to your perceived authority and trustworthiness.
                </p>
                <ul className="space-y-2">
                  {[
                    "Monitor brand mentions across the web",
                    "Reach out to convert unlinked mentions into backlinks",
                    "Build consistent NAP (Name, Address, Phone) citations",
                    "Encourage customer reviews and testimonials",
                    "Participate in industry discussions and forums"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* Social Signals */}
              <FadeIn delay={200} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Share2 className="w-6 h-6 text-primary" />
                  3. Social Signals
                </h2>
                <p className="text-muted-foreground mb-4">
                  While Google has stated social signals aren't a direct ranking factor, there's strong correlation between social engagement and rankings. Social shares amplify content reach, leading to more backlinks.
                </p>
                <ul className="space-y-2">
                  {[
                    "Create shareable content that resonates with your audience",
                    "Maintain active, engaged social media profiles",
                    "Encourage social sharing with easy-to-use buttons",
                    "Engage with industry influencers and thought leaders",
                    "Repurpose content across different social platforms"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* Content Marketing */}
              <FadeIn delay={250} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  4. Content Marketing for Links
                </h2>
                <p className="text-muted-foreground mb-4">
                  The best link building strategy is creating content so valuable that people naturally want to link to it. This "link bait" approach is sustainable and builds genuine authority.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Original Research", desc: "Conduct surveys or studies that others will cite" },
                    { title: "Comprehensive Guides", desc: "Create the definitive resource on a topic" },
                    { title: "Tools & Calculators", desc: "Build useful tools people link to repeatedly" },
                    { title: "Infographics", desc: "Visual content that's highly shareable" }
                  ].map((type, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{type.title}</p>
                      <p className="text-sm text-muted-foreground">{type.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Influencer Outreach */}
              <FadeIn delay={300} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  5. Influencer & Outreach Marketing
                </h2>
                <p className="text-muted-foreground mb-4">
                  Building relationships with industry influencers can amplify your content reach and naturally generate high-quality backlinks.
                </p>
                <ul className="space-y-2">
                  {[
                    "Identify key influencers in your niche",
                    "Engage genuinely before asking for anything",
                    "Collaborate on content that benefits both parties",
                    "Offer expert quotes for their content",
                    "Participate in podcasts and interviews"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* CTA */}
              <FadeIn delay={350} className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-violet-400/10 to-cyan-500/10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Build Your Domain Authority?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo tracks your backlink profile, monitors brand mentions, and helps you build authority systematically.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/off-page-seo">
                      Explore Off-Page SEO Features <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/learn/domain-authority-guide">Learn About Domain Authority</Link>
                  </Button>
                </div>
              </FadeIn>

              {/* Glossary Legend */}
              <GlossaryLegend terms={offPageSEOTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "The Complete Guide to On-Page SEO",
                  href: "/learn/on-page-seo-guide",
                  category: "SEO Fundamentals"
                }}
                next={{
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

export default OffPageSEOGuide;