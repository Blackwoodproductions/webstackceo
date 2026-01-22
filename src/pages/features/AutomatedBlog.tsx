import { motion } from "framer-motion";
import { PenTool, ArrowRight, Sparkles, Calendar, Target, Search, Zap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FeatureBreadcrumb from "@/components/ui/feature-breadcrumb";
import SEO from "@/components/SEO";

const benefits = [
  { icon: Sparkles, title: "AI-Powered Writing", description: "Advanced AI creates engaging, original content tailored to your brand voice." },
  { icon: Calendar, title: "Consistent Publishing", description: "Automated content calendar ensures you never miss a publishing deadline." },
  { icon: Target, title: "Topic Research", description: "Data-driven topic selection based on search demand and competition analysis." },
  { icon: Search, title: "SEO Optimized", description: "Every piece is optimized for target keywords and search intent." },
  { icon: Zap, title: "Quick Turnaround", description: "From idea to published article in hours, not weeks." },
  { icon: FileText, title: "Multiple Formats", description: "Blog posts, articles, guides, listicles, and more content types." },
];

const AutomatedBlog = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Automated Blog - AI-Powered Content Creation"
        description="Scale your content marketing with AI-powered blog automation. SEO-optimized articles, consistent publishing, and data-driven topic research."
        keywords="automated blog, AI content, content marketing, blog automation, SEO content, AI writing, content calendar"
        canonical="/features/automated-blog"
      />
      <ScrollProgress />
      <Navbar />
      
      <main>
        <FeatureBreadcrumb featureName="Automated Blog" />
        
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute bottom-20 left-10 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mx-auto mb-6">
                <PenTool className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Automated Blog & <span className="gradient-text">Content</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                AI-powered blog posts, articles, and web copy that positions your brand 
                as the authority in your niche—delivered on autopilot.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#pricing">Start Creating Content <ArrowRight className="ml-2 w-5 h-5" /></a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="/#contact">See Content Samples</a>
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
                Content Engine
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Content That <span className="gradient-text">Converts</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Not just any content—strategic pieces designed to attract, engage, and convert.
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

        {/* Content Types */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Content Types
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Every Format <span className="gradient-text">You Need</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Blog Posts", description: "Engaging articles that drive organic traffic and establish thought leadership." },
                { title: "How-To Guides", description: "Comprehensive tutorials that solve problems and build trust." },
                { title: "Industry News", description: "Timely commentary on trends that positions you as an industry voice." },
                { title: "Case Studies", description: "Success stories that demonstrate your value and convert prospects." },
                { title: "Listicles", description: "Scannable content that ranks well and gets shared." },
                { title: "Pillar Pages", description: "Comprehensive resources that anchor your topic clusters." },
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
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Content <span className="gradient-text">Results</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { stat: "4-8", label: "Articles published per month" },
                { stat: "92%", label: "Content ranks in top 20 within 90 days" },
                { stat: "10x", label: "Less time than hiring writers" },
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
                Never Struggle With <span className="gradient-text">Content Again</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Let AI handle your content while you focus on running your business.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/#pricing">Automate Your Content <ArrowRight className="ml-2 w-5 h-5" /></a>
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

export default AutomatedBlog;