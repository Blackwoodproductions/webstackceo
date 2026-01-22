import { Link } from "react-router-dom";
import { 
  BarChart3, CheckCircle2, ArrowRight, ArrowLeft, 
  TrendingUp, Users, Target, Clock, AlertTriangle,
  PieChart, LineChart, Activity
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

const analyticsTerms = [
  { term: "Bounce Rate", shortDescription: "The percentage of visitors who leave after viewing only one page.", slug: "bounce-rate" },
  { term: "Conversion Rate", shortDescription: "The percentage of visitors who complete a desired action or goal.", slug: "conversion-rate" },
  { term: "SERP", shortDescription: "Search Engine Results Page—what users see after entering a search query.", slug: "serp" },
];

const AnalyticsGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Mastering Website Analytics - Learning Center"
        description="Learn how to use website analytics to drive business decisions. Understand traffic sources, user behavior, conversion tracking, and actionable insights."
        keywords="website analytics, Google Analytics, traffic analysis, conversion tracking, user behavior, analytics guide, data-driven decisions"
        canonical="/learn/analytics-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Analytics Guide", altText: "Mastering website analytics" }
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
                  Analytics & Intelligence
                </span>
                <span className="text-sm text-muted-foreground">14 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Mastering <span className="gradient-text">Website Analytics</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Data without insight is just noise. Learn how to transform your analytics into actionable strategies that drive real business growth.
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
                  <BarChart3 className="w-6 h-6 text-primary" />
                  Why Analytics Matter for CEOs
                </h2>
                <p className="text-muted-foreground mb-4">
                  Your website generates thousands of data points every day. The difference between successful companies and struggling ones often comes down to who can extract meaning from that data.
                </p>
                <p className="text-muted-foreground">
                  As a CEO, you don't need to become a data scientist—but you do need to know which metrics matter, what they mean, and how to act on them.
                </p>
              </FadeIn>

              {/* The Cost of Ignoring Analytics */}
              <FadeIn delay={50} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  The Cost of Flying Blind
                </h2>
                <p className="text-muted-foreground mb-6">
                  Companies that don't leverage analytics effectively face serious disadvantages:
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Wasted marketing budget on channels that don't convert",
                    "Missed opportunities to optimize high-performing content",
                    "Inability to identify and fix user experience problems",
                    "No clear understanding of customer journey",
                    "Decisions based on gut feeling instead of data"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <p className="text-foreground font-medium">
                    💰 <strong>The Reality:</strong> Businesses using analytics are 5x more likely to make faster decisions and 3x more likely to execute those decisions as intended.
                  </p>
                </div>
              </FadeIn>

              {/* Key Metrics */}
              <FadeIn delay={100} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Activity className="w-6 h-6 text-primary" />
                  Essential Metrics Every CEO Should Track
                </h2>
                <p className="text-muted-foreground mb-6">
                  Don't get lost in vanity metrics. Focus on these key performance indicators:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {[
                    { title: "Traffic Sources", desc: "Know where your visitors come from (organic, paid, social, referral)", icon: TrendingUp },
                    { title: "Conversion Rate", desc: "Percentage of visitors who take desired actions", icon: Target },
                    { title: "Bounce Rate", desc: "Visitors who leave without interacting", icon: Activity },
                    { title: "Session Duration", desc: "How long users engage with your content", icon: Clock },
                    { title: "Pages Per Session", desc: "Content engagement and site navigation", icon: PieChart },
                    { title: "User Demographics", desc: "Who your visitors actually are", icon: Users }
                  ].map((metric, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4 flex items-start gap-3">
                      <metric.icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground font-medium">{metric.title}</p>
                        <p className="text-sm text-muted-foreground">{metric.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Traffic Analysis */}
              <FadeIn delay={150} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <LineChart className="w-6 h-6 text-primary" />
                  Understanding Traffic Sources
                </h2>
                <p className="text-muted-foreground mb-4">
                  Not all traffic is equal. Understanding where your visitors come from helps you double down on what works.
                </p>
                <div className="space-y-4">
                  {[
                    { source: "Organic Search", desc: "Free traffic from Google, Bing, etc. The holy grail of sustainable growth.", color: "text-emerald-400" },
                    { source: "Paid Search/Ads", desc: "Traffic you pay for. Track ROI closely to ensure profitability.", color: "text-amber-400" },
                    { source: "Social Media", desc: "Traffic from Facebook, LinkedIn, Twitter, etc. Great for brand awareness.", color: "text-blue-400" },
                    { source: "Referral", desc: "Visitors from other websites linking to you. Sign of authority.", color: "text-violet-400" },
                    { source: "Direct", desc: "Users typing your URL directly. Indicates brand recognition.", color: "text-cyan-400" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className={`font-medium mb-1 ${item.color}`}>{item.source}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Conversion Tracking */}
              <FadeIn delay={200} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" />
                  Conversion Tracking: From Visitor to Customer
                </h2>
                <p className="text-muted-foreground mb-4">
                  The ultimate goal of analytics is understanding how visitors become customers. Set up proper conversion tracking for:
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "Form submissions (contact, quote requests, newsletter signups)",
                    "Product purchases and checkout completion",
                    "Account registrations and free trial starts",
                    "Content downloads (ebooks, whitepapers, guides)",
                    "Phone calls and chat interactions",
                    "Video views and engagement milestones"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-secondary/50 rounded-xl p-4">
                  <p className="text-foreground font-medium mb-2">💡 Pro Tip: Multi-Touch Attribution</p>
                  <p className="text-sm text-muted-foreground">
                    Customers rarely convert on their first visit. Set up attribution modeling to understand the full customer journey—from first touch to final conversion.
                  </p>
                </div>
              </FadeIn>

              {/* Actionable Insights */}
              <FadeIn delay={250} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  Turning Data Into Action
                </h2>
                <p className="text-muted-foreground mb-4">
                  The value of analytics comes from taking action. Here's how to move from data to decisions:
                </p>
                <div className="space-y-4">
                  {[
                    { insight: "High traffic, low conversion", action: "Review landing page messaging and CTA placement. Consider user experience testing." },
                    { insight: "High bounce rate on key pages", action: "Check page load speed, content relevance, and mobile experience." },
                    { insight: "Traffic dropping from organic search", action: "Audit for technical SEO issues, check for algorithm updates, analyze competitor movements." },
                    { insight: "One traffic source dominates", action: "Diversify channels to reduce risk. Don't put all eggs in one basket." }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">📊 {item.insight}</p>
                      <p className="text-sm text-muted-foreground">→ {item.action}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* CTA */}
              <FadeIn delay={300} className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-violet-400/10 to-cyan-500/10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready for Analytics That Make Sense?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo consolidates all your analytics into one CEO-friendly dashboard. No more switching between tools or deciphering complex reports.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/advanced-analytics">
                      Explore Analytics Features <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/learn/domain-authority-guide">Learn About Domain Authority</Link>
                  </Button>
                </div>
              </FadeIn>

              {/* Glossary Legend */}
              <GlossaryLegend terms={analyticsTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Off-Page SEO: Building Authority",
                  href: "/learn/off-page-seo-guide",
                  category: "SEO Fundamentals"
                }}
                next={{
                  title: "Domain Authority: The Complete Guide",
                  href: "/learn/domain-authority-guide",
                  category: "Authority Building"
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

export default AnalyticsGuide;