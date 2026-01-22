import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import PricingSection from "@/components/sections/PricingSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";
import ogImages from "@/assets/og";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Pricing - Affordable Plans for Every Business"
        description="Transparent pricing for Webstack.ceo. Choose from Starter ($97/mo), Professional ($197/mo), or Enterprise ($297/mo) plans. No hidden fees, cancel anytime."
        keywords="pricing plans, SaaS pricing, website management pricing, SEO tools pricing, monthly subscription, enterprise pricing"
        canonical="/pricing"
        ogImage={ogImages.pricing}
        schema={{
          "@context": "https://schema.org",
          "@type": "PriceSpecification",
          "name": "Webstack.ceo Pricing",
          "description": "Transparent pricing with no hidden fees",
          "priceCurrency": "USD"
        }}
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { 
            label: "Pricing",
            altText: "View SEO and website management pricing plans"
          }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero Section */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-20 right-10 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl"
            animate={{ y: [0, -30, 0] }}
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
                Pricing Plans
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Invest in Your{" "}
                <span className="gradient-text">Digital Success</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Transparent pricing with no hidden fees. Choose the plan that fits 
                your business needs and scale as you grow.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Grid */}
        <PricingSection />

        {/* Testimonials */}
        <TestimonialsSection />
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Pricing;
