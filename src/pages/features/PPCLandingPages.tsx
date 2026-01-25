import { motion } from "framer-motion";
import { MousePointerClick, ArrowRight, Zap, Target, BarChart3, Layers, TestTube, Smartphone, DollarSign, TrendingUp, FileStack, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FeatureBreadcrumb from "@/components/ui/feature-breadcrumb";
import SEO from "@/components/SEO";
import QuickMetricCheck from "@/components/QuickMetricCheck";

const benefits = [
  { icon: FileStack, title: "Bulk Keyword Pages", description: "Generate thousands of hyper-relevant landing pages at scale, each targeting specific keywords your prospects are searching." },
  { icon: TestTube, title: "A/B Testing Built-In", description: "Test headlines, CTAs, layouts, and offers simultaneously. Data-driven optimization that continuously improves conversions." },
  { icon: TrendingUp, title: "Higher Quality Score", description: "Keyword-specific pages dramatically improve relevance, boosting your Quality Score and lowering your cost per click." },
  { icon: DollarSign, title: "Lower CPC", description: "Better Quality Scores mean you pay less for each click. Save 20-50% on ad spend with optimized landing pages." },
  { icon: Zap, title: "Lightning Fast", description: "Sub-second load times that maximize your Quality Score and keep visitors engaged." },
  { icon: Smartphone, title: "Mobile-First", description: "Responsive designs that convert on every device—critical for today's mobile-dominant traffic." },
];

const PPCLandingPages = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="PPC Landing Pages - A/B Testing & Bulk Keyword Pages for Quality Score"
        description="Generate thousands of keyword-specific landing pages with built-in A/B testing. Improve Quality Score, lower CPC, and maximize your Google Ads ROI."
        keywords="PPC landing pages, Quality Score optimization, A/B testing, bulk landing pages, keyword landing pages, Google Ads optimization, lower CPC, ad landing pages"
        canonical="/features/ppc-landing-pages"
      />
      <ScrollProgress />
      <Navbar />
      
      <main>
        <FeatureBreadcrumb featureName="PPC Landing Pages" featureKeyword="A/B testing & bulk keyword pages for Quality Score" />
        
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
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
                Create thousands of keyword-specific landing pages with built-in A/B testing.
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Boost your Quality Score, pay less per click, and convert more visitors into customers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#pricing">Start Saving on Ads <ArrowRight className="ml-2 w-5 h-5" /></a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="/#contact">See How It Works</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Metric Check */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-4xl">
            <QuickMetricCheck metricType="page_speed" />
          </div>
        </section>

        {/* The Problem - Quality Score Focus */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Why <span className="gradient-text">Quality Score</span> Matters
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Google rewards relevance. When your landing page matches the user's search intent, you pay less and rank higher.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Generic Page Problem */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-destructive" />
                  </div>
                  <h3 className="text-lg font-bold text-destructive">Generic Homepage</h3>
                </div>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">✗</span>
                    One page for all keywords = low relevance
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">✗</span>
                    Quality Score: 4-5/10
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">✗</span>
                    Paying $8-15 per click
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive">✗</span>
                    No way to test what works
                  </li>
                </ul>
              </motion.div>

              {/* Keyword Pages Solution */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-green-600 dark:text-green-400">Keyword-Specific Pages</h3>
                </div>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    Unique page per keyword = maximum relevance
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    Quality Score: 8-10/10
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    Paying $3-6 per click (50%+ savings)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    A/B test everything automatically
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* Savings Calculator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <h3 className="text-xl font-bold mb-4">The Math Is Simple</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-3xl font-bold text-destructive mb-1">$10,000</p>
                  <p className="text-sm text-muted-foreground">Monthly ad spend (before)</p>
                </div>
                <div>
                  <p className="text-3xl font-bold gradient-text mb-1">50%</p>
                  <p className="text-sm text-muted-foreground">Typical CPC reduction</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-500 mb-1">$5,000</p>
                  <p className="text-sm text-muted-foreground">Saved per month</p>
                </div>
              </div>
            </motion.div>
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
                Everything You Need to <span className="gradient-text">Dominate PPC</span>
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

        {/* How Bulk Pages Work */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                How It Works
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Generate <span className="gradient-text">Thousands of Pages</span> in Minutes
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { 
                  step: "1", 
                  title: "Upload Your Keywords", 
                  description: "Import your keyword list from Google Ads, SEMrush, or any source. We support CSV, Excel, or direct paste." 
                },
                { 
                  step: "2", 
                  title: "AI Generates Pages", 
                  description: "Our system creates unique, highly-relevant landing pages for each keyword—customized to your brand and offer." 
                },
                { 
                  step: "3", 
                  title: "A/B Test & Optimize", 
                  description: "Each page runs automatic A/B tests on headlines, CTAs, and layouts. The best versions win automatically." 
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 relative"
                >
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 mt-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* A/B Testing Deep Dive */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                A/B Testing
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Test <span className="gradient-text">Everything</span>, Automatically
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Stop guessing what works. Our built-in A/B testing runs continuously, finding the highest-converting combinations.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Headlines", description: "Test different value propositions, urgency triggers, and emotional hooks to find what resonates." },
                { title: "Call-to-Actions", description: "Button text, colors, placement, and size—every element is tested to maximize clicks." },
                { title: "Page Layouts", description: "Single column vs. multi-column, form placement, image positioning—discover the optimal structure." },
                { title: "Offers & Pricing", description: "Test different pricing displays, discounts, and value propositions to increase conversions." },
                { title: "Trust Elements", description: "Testimonials, logos, guarantees—find the social proof that builds the most confidence." },
                { title: "Form Fields", description: "Short forms vs. long forms, field labels, required fields—optimize for lead quality and quantity." },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
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
        <section className="py-24 bg-secondary/20">
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

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { stat: "50%+", label: "Lower cost per click" },
                { stat: "3x", label: "Higher conversion rates" },
                { stat: "8-10", label: "Avg. Quality Score achieved" },
                { stat: "10,000+", label: "Pages generated per client" },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 text-center"
                >
                  <div className="text-4xl font-bold gradient-text mb-2">{item.stat}</div>
                  <p className="text-muted-foreground text-sm">{item.label}</p>
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
                Stop Overpaying for <span className="gradient-text">Clicks</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Generate thousands of keyword-specific landing pages, A/B test automatically, and watch your Quality Score—and ROI—skyrocket.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/#pricing">Start Saving Today <ArrowRight className="ml-2 w-5 h-5" /></a>
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
