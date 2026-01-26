import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FeaturesSection from "@/components/sections/FeaturesSection";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";
import ogImages from "@/assets/og";
import { VIDashboardEffects } from "@/components/ui/vi-dashboard-effects";
import InteractiveGrid from "@/components/ui/interactive-grid";

const Features = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* VI Dashboard Background Effects - exact replica */}
      <VIDashboardEffects />
      <InteractiveGrid className="fixed inset-0 opacity-30 pointer-events-none z-0" glowRadius={120} glowIntensity={0.12} />
      <SEO
        title="Features - White-Label SEO Tools for Agencies"
        description="Explore Webstack.ceo's agency tools: automated niche linking, white-label dashboards, bulk client management, domain authority building, and more."
        keywords="agency SEO features, white label SEO tools, niche link building, bulk client management, automated backlinks, reseller SEO tools"
        canonical="/features"
        ogImage={ogImages.features}
        schema={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Webstack.ceo Agency Features",
          "description": "Complete suite of white-label SEO tools for agencies",
          "numberOfItems": 12,
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Niche Link Building"},
            {"@type": "ListItem", "position": 2, "name": "On-Page SEO"},
            {"@type": "ListItem", "position": 3, "name": "White-Label Dashboards"},
            {"@type": "ListItem", "position": 4, "name": "Domain Authority Building"},
            {"@type": "ListItem", "position": 5, "name": "Bulk Client Management"},
            {"@type": "ListItem", "position": 6, "name": "Automated Content"}
          ]
        }}
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { 
            label: "Features",
            altText: "Explore all white-label SEO features for agencies"
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
                Agency Features
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                White-Label Tools to{" "}
                <span className="gradient-text">Scale Your Agency</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                A complete suite of SEO and link building tools designed for agencies 
                and marketing companies. Categorize client sites, automate niche linking, 
                and deliver results at scale.
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
