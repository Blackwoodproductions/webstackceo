import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Share2, CheckCircle2, ArrowRight, ArrowLeft, 
  ThumbsUp, MessageCircle, TrendingUp, AlertTriangle, Zap
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
import GlossaryTooltip from "@/components/ui/glossary-tooltip";
import { getTermsByGuide } from "@/data/glossaryData";

// Get terms linked to this guide from shared glossary
const socialTerms = getTermsByGuide("/learn/social-signals-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const SocialSignalsGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Social Signals & SEO Impact Guide - Learning Center"
        description="Learn how social signals impact SEO. Understand the relationship between social media engagement, brand visibility, and search rankings."
        keywords="social signals SEO, social media SEO, social engagement, brand signals, social shares, SEO social media"
        canonical="/learn/social-signals-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "Social Signals Guide", altText: "Social media and SEO" }
        ]}
      />
      
      <main className="pt-8">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-transparent to-indigo-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Center
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-blue-400/10 text-blue-400 text-sm font-medium">
                  Content & Marketing
                </span>
                <span className="text-sm text-muted-foreground">9 min read</span>
              </div>
              
              <GuideFeatureLink 
                title="Social Signals:" 
                gradientText="The SEO Connection" 
                featureHref="/features/social-signals" 
              />
              <p className="text-xl text-muted-foreground mt-6">
                Understand how social media engagement influences search visibility and how to leverage it for SEO success.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="prose prose-lg prose-invert max-w-none">
              
              {/* Introduction */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Share2 className="w-6 h-6 text-primary" />
                  What Are Social Signals?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Social signals are engagement metrics from social media platforms—likes, shares, comments, and mentions. While not direct <GlossaryTooltip term="ranking-factors">ranking factors</GlossaryTooltip>, they create ripple effects that positively impact SEO.
                </p>
                <p className="text-muted-foreground">
                  Think of social signals as amplifiers: they increase content visibility, drive <GlossaryTooltip term="organic-traffic">traffic</GlossaryTooltip>, and create opportunities for natural <GlossaryTooltip term="backlinks">backlinks</GlossaryTooltip>.
                </p>
              </motion.div>

              {/* The Connection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  How Social Signals Impact SEO
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Content Discovery", desc: "Viral content gets seen by more potential linkers" },
                    { title: "Traffic Signals", desc: "High traffic from social can indicate quality content" },
                    { title: "Brand Searches", desc: "Social presence increases branded search volume" },
                    { title: "Link Opportunities", desc: "Shared content attracts natural backlinks" },
                    { title: "Indexing Speed", desc: "Popular content gets crawled more frequently" },
                    { title: "Entity Recognition", desc: "Strong social presence builds brand authority" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Best Practices */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-primary" />
                  Maximizing Social for SEO
                </h2>
                <ul className="space-y-2">
                  {[
                    "Create highly shareable content (listicles, infographics, original research)",
                    "Optimize social profiles with consistent branding and keywords",
                    "Share new content across all relevant platforms",
                    "Engage with your audience to build community",
                    "Make sharing easy with prominent social buttons",
                    "Time posts for maximum visibility in your target audience's timezone"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-blue-400/10 to-indigo-500/10"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Amplify Your SEO?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo tracks your social presence and its impact on SEO performance.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/social-signals">
                      Explore Features <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/pricing">Start Free Trial</Link>
                  </Button>
                </div>
              </motion.div>

              {/* Glossary Legend */}
              <GlossaryLegend terms={socialTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "FAQ Generation for SEO",
                  href: "/learn/faq-generation-guide",
                  category: "Content & Marketing"
                }}
                next={{
                  title: "Google Business Profile Mastery",
                  href: "/learn/gmb-optimization-guide",
                  category: "Local & Maps SEO"
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

export default SocialSignalsGuide;
