import { motion } from "framer-motion";
import { Server, ArrowRight, Zap, Shield, Globe, Clock, Cpu, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FeatureBreadcrumb from "@/components/ui/feature-breadcrumb";
import SEO from "@/components/SEO";
import QuickMetricCheck from "@/components/QuickMetricCheck";

const benefits = [
  { icon: Zap, title: "Lightning Performance", description: "NVMe SSD storage and optimized servers for sub-second load times." },
  { icon: Shield, title: "Enterprise Security", description: "DDoS protection, WAF, and automatic malware scanning included." },
  { icon: Globe, title: "Global CDN", description: "Content delivered from 200+ edge locations worldwide." },
  { icon: Clock, title: "99.99% Uptime SLA", description: "Industry-leading uptime guarantee with automatic failover." },
  { icon: Cpu, title: "Auto-Scaling", description: "Handle traffic spikes without manual intervention." },
  { icon: HardDrive, title: "Daily Backups", description: "Automatic daily backups with one-click restore." },
];

const WebHosting = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Lovable Premium Hosting - Fast, Secure, Scalable"
        description="Enterprise-grade web hosting with NVMe SSD storage, global CDN, 99.99% uptime SLA, DDoS protection, and automatic backups."
        keywords="web hosting, premium hosting, fast hosting, secure hosting, CDN, SSD hosting, managed hosting"
        canonical="/features/web-hosting"
      />
      <ScrollProgress />
      <Navbar />
      
      <main>
        <FeatureBreadcrumb featureName="Web Hosting" featureKeyword="Premium SSD web hosting with 99.99% uptime and global CDN" />
        
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-20 left-20 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"
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
                <Server className="w-10 h-10 text-white" />
              </div>
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium border border-amber-500/30">
                  Add-on
                </span>
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium border border-primary/30">
                  Coming Soon
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Lovable Premium <span className="gradient-text">Hosting</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Enterprise-grade hosting with 99.99% uptime SLA, global CDN, 
                and automatic scaling for peak traffic—all included in your plan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#pricing">Get Premium Hosting <ArrowRight className="ml-2 w-5 h-5" /></a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">Talk to Sales</a>
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
                Enterprise Features, <span className="gradient-text">Simple Pricing</span>
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

        {/* Tech Specs */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Tech Specs
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Built for <span className="gradient-text">Performance</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { label: "Storage", value: "NVMe SSD", description: "10x faster than traditional SSDs" },
                { label: "CDN", value: "200+ PoPs", description: "Global edge network for fast delivery" },
                { label: "SSL", value: "Free Included", description: "Auto-renewing Let's Encrypt certificates" },
                { label: "HTTP/3", value: "Enabled", description: "Latest protocol for fastest performance" },
                { label: "PHP", value: "8.x Support", description: "Latest PHP versions supported" },
                { label: "Database", value: "MySQL/PostgreSQL", description: "Your choice of database engine" },
              ].map((spec, index) => (
                <motion.div
                  key={spec.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 flex items-center gap-4"
                >
                  <div className="text-center min-w-[80px]">
                    <p className="text-sm text-muted-foreground">{spec.label}</p>
                    <p className="text-lg font-bold gradient-text">{spec.value}</p>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <p className="text-muted-foreground text-sm">{spec.description}</p>
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
                Hosting <span className="gradient-text">Performance</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { stat: "99.99%", label: "Uptime SLA guarantee" },
                { stat: "<200ms", label: "Average response time" },
                { stat: "200+", label: "Global edge locations" },
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
                Hosting That <span className="gradient-text">Just Works</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Focus on your business while we handle the infrastructure.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/#pricing">Get Premium Hosting <ArrowRight className="ml-2 w-5 h-5" /></a>
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

export default WebHosting;