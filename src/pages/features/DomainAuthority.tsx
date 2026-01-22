import { motion } from "framer-motion";
import { TrendingUp, ArrowRight, Award, Link2, BarChart3, Target, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FeatureBreadcrumb from "@/components/ui/feature-breadcrumb";
import SEO from "@/components/SEO";

const benefits = [
  { icon: Award, title: "DR/DA Growth", description: "Systematic strategies to increase your Domain Rating and Domain Authority scores." },
  { icon: Link2, title: "Quality Backlinks", description: "High-authority links that move the needle on your domain metrics." },
  { icon: BarChart3, title: "Progress Tracking", description: "Monthly reports showing your DR/DA growth and link profile improvements." },
  { icon: Target, title: "Competitor Analysis", description: "Benchmark against competitors and identify opportunities to outrank them." },
  { icon: Shield, title: "Link Profile Health", description: "Monitor and maintain a clean, penalty-free backlink profile." },
  { icon: Zap, title: "Faster Rankings", description: "Higher authority means faster indexing and better ranking potential." },
];

const DomainAuthority = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Domain Authority Building - Increase Your DR & DA"
        description="Grow your Domain Rating and Domain Authority with proven strategies. Quality backlinks, competitor analysis, and monthly progress reports."
        keywords="domain authority, domain rating, DR, DA, backlinks, link building, SEO authority"
        canonical="/features/domain-authority"
      />
      <ScrollProgress />
      <Navbar />
      
      <main>
        <FeatureBreadcrumb featureName="Domain Authority" />
        
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-20 right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl"
            animate={{ y: [0, -25, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Domain Rating & <span className="gradient-text">Authority</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Boost your DR and DA scores with proven strategies. 
                Build lasting domain authority that drives organic growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#pricing">Boost Your Authority <ArrowRight className="ml-2 w-5 h-5" /></a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="/#contact">Get a Free Analysis</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* What is DR/DA */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Understanding Authority
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                What is <span className="gradient-text">DR and DA?</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8"
              >
                <h3 className="text-2xl font-bold text-foreground mb-4">Domain Rating (DR)</h3>
                <p className="text-muted-foreground mb-4">
                  Ahrefs' metric that measures the strength of your website's backlink profile on a scale of 0-100.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Based on quantity and quality of backlinks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Higher DR = more ranking power</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Industry standard for link building</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8"
              >
                <h3 className="text-2xl font-bold text-foreground mb-4">Domain Authority (DA)</h3>
                <p className="text-muted-foreground mb-4">
                  Moz's metric predicting how well a website will rank on search engine result pages (SERPs).
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Score of 1-100 based on multiple factors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Considers linking root domains</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Widely used in the SEO industry</span>
                  </li>
                </ul>
              </motion.div>
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
                Our Approach
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                How We Build <span className="gradient-text">Authority</span>
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

        {/* Growth Timeline */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Timeline
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Expected <span className="gradient-text">Growth</span>
              </h2>
            </motion.div>

            <div className="space-y-6">
              {[
                { month: "Month 1-3", dr: "+5-10 DR", description: "Foundation building with initial high-quality links" },
                { month: "Month 4-6", dr: "+10-20 DR", description: "Accelerated growth as link momentum builds" },
                { month: "Month 7-12", dr: "+20-40 DR", description: "Significant authority gains with sustained strategy" },
              ].map((item, index) => (
                <motion.div
                  key={item.month}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 flex items-center gap-6"
                >
                  <div className="text-center min-w-[100px]">
                    <p className="text-sm text-muted-foreground">{item.month}</p>
                    <p className="text-2xl font-bold gradient-text">{item.dr}</p>
                  </div>
                  <div className="h-16 w-px bg-border" />
                  <p className="text-muted-foreground">{item.description}</p>
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
                Client <span className="gradient-text">Results</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { stat: "+32", label: "Average DR increase in 12 months" },
                { stat: "89%", label: "Clients see DR growth in 90 days" },
                { stat: "100%", label: "White-hat, penalty-free methods" },
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
                Build <span className="gradient-text">Lasting Authority</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Higher domain authority means better rankings and more organic traffic.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/#pricing">Grow Your Authority <ArrowRight className="ml-2 w-5 h-5" /></a>
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

export default DomainAuthority;