import { motion } from "framer-motion";
import { BarChart3, ArrowRight, TrendingUp, Search, Target, Eye, Bell, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FeatureBreadcrumb from "@/components/ui/feature-breadcrumb";
import SEO from "@/components/SEO";

const benefits = [
  { icon: TrendingUp, title: "Rank Tracking", description: "Monitor your keyword positions daily across all search engines and locations." },
  { icon: Search, title: "Competitor Analysis", description: "See what's working for competitors and identify opportunities to outrank them." },
  { icon: Target, title: "Keyword Research", description: "Discover high-value keywords with search volume and difficulty data." },
  { icon: Eye, title: "SERP Features", description: "Track featured snippets, People Also Ask, and other SERP opportunities." },
  { icon: Bell, title: "Ranking Alerts", description: "Get notified when rankings change significantly—up or down." },
  { icon: FileText, title: "Custom Reports", description: "Automated reports delivered to your inbox with the metrics that matter." },
];

const AdvancedAnalytics = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Advanced Analytics - SEO Rank Tracking & Reporting"
        description="Track keyword rankings, analyze competitors, and get automated SEO reports. Monitor your search performance with real-time analytics dashboard."
        keywords="SEO analytics, rank tracking, keyword research, competitor analysis, SERP tracking, SEO reports"
        canonical="/features/advanced-analytics"
      />
      <ScrollProgress />
      <Navbar />
      
      <main>
        <FeatureBreadcrumb featureName="Advanced Analytics" featureKeyword="SEO rank tracking and analytics dashboard for website performance" />
        
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute bottom-20 left-20 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
          />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Advanced Rankings & <span className="gradient-text">Analytics</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Deep insights into your search rankings, competitor analysis, 
                and actionable data to outperform your competition.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#pricing">Get Analytics Access <ArrowRight className="ml-2 w-5 h-5" /></a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="/#contact">See Dashboard Demo</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-6xl">

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 hover:glow-accent transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>


        {/* Competitor Analysis */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Competitive Edge
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Know Your <span className="gradient-text">Competition</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                See exactly where competitors rank and find opportunities to beat them.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Keyword Gap Analysis", description: "Find keywords your competitors rank for that you're missing." },
                { title: "Content Gap Analysis", description: "Discover topics competitors cover that you haven't addressed." },
                { title: "Backlink Comparison", description: "See where competitors get links and replicate their success." },
                { title: "SERP Overlap", description: "Identify keywords where you compete directly with rivals." },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Data-Driven <span className="gradient-text">Results</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { stat: "500+", label: "Keywords tracked per account" },
                { stat: "Daily", label: "Ranking updates" },
                { stat: "5", label: "Competitor profiles tracked" },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-8 text-center"
                >
                  <div className="text-5xl font-bold gradient-text mb-2">{item.stat}</div>
                  <p className="text-muted-foreground">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Make Data-Driven <span className="gradient-text">Decisions</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Get the insights you need to outrank your competition.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/#pricing">Access Analytics <ArrowRight className="ml-2 w-5 h-5" /></a>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default AdvancedAnalytics;