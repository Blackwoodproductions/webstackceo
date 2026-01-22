import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FeaturesSection from "@/components/sections/FeaturesSection";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";
import ogImages from "@/assets/og";

const Features = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Features - Complete Website Management Suite"
        description="Explore Webstack.ceo's powerful features: SEO analytics, rank tracking, domain authority building, uptime monitoring, visitor intelligence, and more."
        keywords="SEO features, website analytics, rank tracking, domain authority, uptime monitoring, visitor intelligence, automated blogging, PPC landing pages"
        canonical="/features"
        ogImage={ogImages.features}
        schema={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Webstack.ceo Features",
          "description": "Complete suite of website management tools",
          "numberOfItems": 12,
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Advanced Analytics"},
            {"@type": "ListItem", "position": 2, "name": "On-Page SEO"},
            {"@type": "ListItem", "position": 3, "name": "Off-Page SEO"},
            {"@type": "ListItem", "position": 4, "name": "Domain Authority Building"},
            {"@type": "ListItem", "position": 5, "name": "Uptime Monitoring"},
            {"@type": "ListItem", "position": 6, "name": "Web Hosting"}
          ]
        }}
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { 
            label: "Features",
            altText: "Explore all SEO and website management features"
          }
        ]}
      />
      
      <main className="pt-4">
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
