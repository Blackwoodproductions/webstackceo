import { motion } from "framer-motion";
import { MousePointerClick, ArrowRight, Zap, Target, BarChart3, Palette, TestTube, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FeatureBreadcrumb from "@/components/ui/feature-breadcrumb";

const benefits = [
  { icon: Zap, title: "Lightning Fast", description: "Sub-second load times that maximize your Quality Score and lower CPC." },
  { icon: Target, title: "Conversion Optimized", description: "Battle-tested layouts designed to turn clicks into customers." },
  { icon: BarChart3, title: "A/B Testing Built-In", description: "Easily test headlines, CTAs, and layouts to maximize ROI." },
  { icon: Palette, title: "Brand Aligned", description: "Custom designs that match your brand while following conversion best practices." },
  { icon: TestTube, title: "Continuous Optimization", description: "Regular updates based on performance data to improve results." },
  { icon: Smartphone, title: "Mobile-First", description: "Responsive designs that convert on every device." },
];

const PPCLandingPages = () => {
  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />
      
      <main>
        <FeatureBreadcrumb featureName="PPC Landing Pages" />
        
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-40 left-10 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"
            animate={{ y: [0, 25, 0] }}
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
                <MousePointerClick className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                PPC <span className="gradient-text">Landing Pages</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                High-converting landing pages optimized for paid campaigns. 
                Maximize your ad spend with pages built to convert.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#pricing">Build Converting Pages <ArrowRight className="ml-2 w-5 h-5" /></a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="/#contact">See Examples</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* The Problem */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Your Ads Are Only as Good as Your <span className="gradient-text">Landing Pages</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Most businesses send paid traffic to their homepage—and waste 90% of their ad spend.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { problem: "Generic homepages", impact: "3% conversion rate" },
                { problem: "Optimized landing pages", impact: "12%+ conversion rate" },
                { problem: "Your improvement", impact: "4x more leads" },
              ].map((item, index) => (
                <motion.div
                  key={item.problem}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 text-center"
                >
                  <p className="text-muted-foreground mb-2">{item.problem}</p>
                  <p className="text-2xl font-bold gradient-text">{item.impact}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Features
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Pages Built to <span className="gradient-text">Convert</span>
              </h2>
            </motion.div>

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

        {/* What We Build */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Page Types
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Landing Pages for <span className="gradient-text">Every Campaign</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Lead Generation", description: "Capture form submissions with compelling offers and clear value propositions." },
                { title: "Click-Through", description: "Warm up visitors before sending them to your main conversion page." },
                { title: "Product Launch", description: "Build anticipation and capture early interest for new offerings." },
                { title: "Event Registration", description: "Drive signups for webinars, demos, and events." },
                { title: "Free Trial", description: "Convert visitors into trial users with low-friction signup flows." },
                { title: "Comparison Pages", description: "Win competitive searches with side-by-side comparisons." },
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
                Results That <span className="gradient-text">Pay for Themselves</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { stat: "312%", label: "Average increase in conversion rate" },
                { stat: "47%", label: "Lower cost per acquisition" },
                { stat: "2.1s", label: "Average page load time" },
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
                Stop Wasting <span className="gradient-text">Ad Spend</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Get landing pages that turn clicks into customers.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/#pricing">Build Your Landing Pages <ArrowRight className="ml-2 w-5 h-5" /></a>
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

export default PPCLandingPages;