import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FAQSection from "@/components/sections/FAQSection";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="FAQ - Frequently Asked Questions"
        description="Find answers to common questions about Webstack.ceo. Learn about our pricing, features, support, integrations, and how to get started."
        keywords="FAQ, frequently asked questions, help center, webstack support, pricing questions, feature questions, getting started"
        canonical="/faq"
        schema={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "name": "Webstack.ceo FAQ",
          "description": "Frequently asked questions about our platform"
        }}
      />
      <ScrollProgress />
      <Navbar />
      
      <main className="pt-20">
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

        {/* FAQ Content */}
        <FAQSection />
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default FAQ;
