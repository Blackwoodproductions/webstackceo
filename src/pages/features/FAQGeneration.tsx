import { motion } from "framer-motion";
import { HelpCircle, ArrowRight, Search, MessageSquare, Sparkles, TrendingUp, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";

const benefits = [
  { icon: Search, title: "Search-Optimized", description: "FAQs structured to appear in Google's featured snippets and People Also Ask." },
  { icon: MessageSquare, title: "Customer Insights", description: "Generated from real customer questions and search queries." },
  { icon: Sparkles, title: "AI-Powered", description: "Intelligent answers that reflect your brand voice and expertise." },
  { icon: TrendingUp, title: "Ranking Boost", description: "FAQ schema markup that improves your search visibility." },
  { icon: Clock, title: "Time Savings", description: "Automatically updated as new questions emerge in your industry." },
  { icon: Target, title: "Conversion Focused", description: "FAQs that address objections and move visitors toward purchase." },
];

const FAQGeneration = () => {
  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-40 right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl"
            animate={{ y: [0, -20, 0] }}
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
                <HelpCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                FAQ <span className="gradient-text">Generation</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Automatically generate comprehensive FAQs that answer customer questions 
                and boost your search visibility with featured snippet opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#pricing">Generate FAQs Now <ArrowRight className="ml-2 w-5 h-5" /></a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="/#contact">Learn More</a>
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
                Smart FAQs
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Questions That <span className="gradient-text">Drive Traffic</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Strategic FAQ content that serves both users and search engines.
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
                The Process
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                How We Generate <span className="gradient-text">Your FAQs</span>
              </h2>
            </motion.div>

            <div className="space-y-8">
              {[
                { step: "01", title: "Question Discovery", description: "We analyze search data, customer inquiries, and competitor FAQs to identify the most valuable questions to answer." },
                { step: "02", title: "Answer Generation", description: "AI creates comprehensive, accurate answers that reflect your expertise and brand voice." },
                { step: "03", title: "Schema Implementation", description: "FAQ schema markup is added for rich snippet eligibility in search results." },
                { step: "04", title: "Strategic Placement", description: "FAQs are placed on relevant pages to maximize their SEO and conversion impact." },
                { step: "05", title: "Continuous Updates", description: "New questions are added as they emerge, keeping your FAQ content fresh and relevant." },
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
                FAQ <span className="gradient-text">Impact</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { stat: "47%", label: "More featured snippet appearances" },
                { stat: "32%", label: "Reduction in support inquiries" },
                { stat: "2.3x", label: "Higher time on page" },
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
                Answer Questions <span className="gradient-text">Before They're Asked</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Build trust and drive traffic with comprehensive FAQ content.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/#pricing">Get Started <ArrowRight className="ml-2 w-5 h-5" /></a>
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

export default FAQGeneration;