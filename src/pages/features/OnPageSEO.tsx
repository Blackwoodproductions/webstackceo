import { motion } from "framer-motion";
import { Search, CheckCircle, ArrowRight, FileText, Code, Gauge, Image, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FeatureBreadcrumb from "@/components/ui/feature-breadcrumb";
import SEO from "@/components/SEO";

const benefits = [
  { icon: FileText, title: "Meta Tag Optimization", description: "Perfectly crafted title tags and meta descriptions that drive clicks and rankings." },
  { icon: Code, title: "Schema Markup", description: "Rich snippets that make your listings stand out in search results." },
  { icon: Gauge, title: "Core Web Vitals", description: "Lightning-fast page speeds that Google rewards with higher rankings." },
  { icon: Image, title: "Image Optimization", description: "Compressed, properly-tagged images that load fast and rank in image search." },
  { icon: Link2, title: "Internal Linking", description: "Strategic link architecture that distributes authority throughout your site." },
  { icon: Search, title: "Keyword Optimization", description: "Natural keyword placement that signals relevance without over-optimization." },
];

const OnPageSEO = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="On-Page SEO - Technical Optimization Services"
        description="Professional on-page SEO optimization including meta tags, schema markup, Core Web Vitals, image optimization, and keyword placement."
        keywords="on-page SEO, technical SEO, meta tags, schema markup, Core Web Vitals, image optimization, internal linking"
        canonical="/features/on-page-seo"
      />
      <ScrollProgress />
      <Navbar />
      
      <main>
        <FeatureBreadcrumb featureName="On-Page SEO" />
        
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"
            animate={{ y: [0, 30, 0] }}
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
                <Search className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                On-Page <span className="gradient-text">SEO</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Technical audits, meta optimization, content structure, and Core Web Vitals improvements 
                that propel your pages to the top of search results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#pricing">Get Started <ArrowRight className="ml-2 w-5 h-5" /></a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="/#contact">Talk to an Expert</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                What's Included
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Complete On-Page <span className="gradient-text">Optimization</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Every element of your pages optimized for maximum search visibility.
              </p>
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

        {/* How It Works */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Our Process
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                How It <span className="gradient-text">Works</span>
              </h2>
            </motion.div>

            <div className="space-y-8">
              {[
                { step: "01", title: "Comprehensive Audit", description: "We analyze every page of your site to identify optimization opportunities and technical issues holding you back." },
                { step: "02", title: "Keyword Mapping", description: "Strategic keyword assignment ensures each page targets the right terms without cannibalization." },
                { step: "03", title: "Content Optimization", description: "We optimize headings, content structure, and on-page elements for both users and search engines." },
                { step: "04", title: "Technical Implementation", description: "Schema markup, meta tags, and technical fixes are implemented across your entire site." },
                { step: "05", title: "Continuous Monitoring", description: "Ongoing tracking ensures your optimizations deliver results and adapt to algorithm changes." },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-6 items-start"
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
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
                Results That <span className="gradient-text">Matter</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { stat: "156%", label: "Average increase in organic traffic" },
                { stat: "89%", label: "Improvement in Core Web Vitals scores" },
                { stat: "3.2x", label: "More keywords ranking in top 10" },
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
                Ready to Dominate <span className="gradient-text">Search Results?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join 1,000+ CEOs who trust Webstack.ceo for their on-page SEO needs.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/#pricing">Start Optimizing Today <ArrowRight className="ml-2 w-5 h-5" /></a>
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

export default OnPageSEO;