import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FeaturesSection from "@/components/sections/FeaturesSection";
import { motion } from "framer-motion";

const Features = () => {
  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 relative overflow-hidden">
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
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Our Features
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Everything You Need to{" "}
                <span className="gradient-text">Dominate Online</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                A complete suite of SEO, analytics, and web management tools designed 
                specifically for CEOs who demand results without the complexity.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <FeaturesSection />
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Features;
