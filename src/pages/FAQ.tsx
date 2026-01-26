import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FAQSection, { generateFAQSchema } from "@/components/sections/FAQSection";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";
import ogImages from "@/assets/og";
import diamondFlowImg from "@/assets/bron-seo-diamond-flow.png";
import { CheckCircle2, Layers } from "lucide-react";
import { FuturisticParticles, FloatingOrbs, CyberLines, HUDOverlay, CornerBlobs } from "@/components/ui/futuristic-particles";
import InteractiveGrid from "@/components/ui/interactive-grid";
import { HighTechBackground } from "@/components/ui/high-tech-background";

const FAQ = () => {
  // Generate dynamic FAQ schema from actual content
  const faqSchema = generateFAQSchema();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Futuristic Background Effects */}
      <CornerBlobs className="fixed inset-0 z-0" />
      <FloatingOrbs className="fixed inset-0 z-0" />
      <FuturisticParticles className="fixed inset-0 z-0" particleCount={35} variant="subtle" />
      <InteractiveGrid className="fixed inset-0 opacity-25 pointer-events-none z-0" glowRadius={100} glowIntensity={0.1} />
      <CyberLines className="fixed inset-0 z-0" />
      <HighTechBackground variant="subtle" showParticles={false} className="fixed inset-0 z-0" />
      <HUDOverlay className="fixed inset-0 z-0" />
      <SEO
        title="FAQ - Frequently Asked Questions"
        description="Find answers to common questions about Webstack.ceo. Learn about our pricing, features, support, integrations, and how to get started."
        keywords="FAQ, frequently asked questions, help center, webstack support, pricing questions, feature questions, getting started"
        canonical="/faq"
        ogImage={ogImages.faq}
        schema={faqSchema}
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { 
            label: "FAQ",
            altText: "Frequently asked questions about website management"
          }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero Section */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute bottom-20 left-10 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Help Center
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Frequently Asked{" "}
                <span className="gradient-text">Questions</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Find answers to common questions about our platform, pricing, 
                features, and support. Can't find what you're looking for? Contact us.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Diamond Flow Section */}
        <section className="py-16 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Our Link Building Strategy
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The <span className="gradient-text">Diamond Flow</span> Architecture
              </h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                We build content silos that channel link equity directly to your money pages using a structured, bottom-up approach.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <img 
                  src={diamondFlowImg} 
                  alt="BRON SEO Diamond Flow - Content silo structure showing money page, supporting pages, and resources page with inbound link flow" 
                  className="rounded-2xl shadow-2xl w-full"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="glass-card rounded-2xl p-8">
                  <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                    <Layers className="w-6 h-6 text-primary" />
                    How Our Content Silos Work
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-medium text-foreground">Money Page (Your Target URL)</p>
                        <p className="text-sm text-muted-foreground">Your existing conversion page or one we create for your main keyword</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-medium text-foreground">Supporting Pages (2 per cluster)</p>
                        <p className="text-sm text-muted-foreground">We create niche-relevant content that links up to your money page</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-medium text-foreground">Resources Page (Topical Index)</p>
                        <p className="text-sm text-muted-foreground">A comprehensive index of the 3 keyword pages above, strengthening topical relevance</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-medium text-foreground">Inbound Links Flow Upward</p>
                        <p className="text-sm text-muted-foreground">All link equity channels through the silo to boost your money page</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-medium text-foreground">Real Business Websites</p>
                        <p className="text-sm text-muted-foreground">All inbound links come from real, relevant business websites in your niche—not PBNs or spam sites</p>
                      </div>
                    </li>
                  </ul>
                  <div className="mt-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <p className="text-sm text-foreground">
                      <strong>Already have a money page?</strong> We skip creating the main keyword page and build supporting pages that link directly to your existing high-value URL.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <FAQSection />
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default FAQ;
