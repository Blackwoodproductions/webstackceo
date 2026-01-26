import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import ContactSection from "@/components/sections/ContactSection";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";
import ogImages from "@/assets/og";
import { VIDashboardEffects } from "@/components/ui/vi-dashboard-effects";
import InteractiveGrid from "@/components/ui/interactive-grid";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* VI Dashboard Background Effects - exact replica */}
      <VIDashboardEffects />
      <InteractiveGrid className="fixed inset-0 opacity-30 pointer-events-none z-0" glowRadius={120} glowIntensity={0.12} />
      <SEO
        title="Contact Us - Get in Touch"
        description="Contact Webstack.ceo for questions about our platform, pricing, or to schedule a demo. Our team is here to help you succeed online."
        keywords="contact us, get in touch, customer support, schedule demo, webstack support, sales inquiry"
        canonical="/contact"
        ogImage={ogImages.contact}
        schema={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact Webstack.ceo",
          "description": "Get in touch with our team"
        }}
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { 
            label: "Contact",
            altText: "Contact our website management support team"
          }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero Section */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-40 right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl"
            animate={{ y: [0, -20, 0] }}
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
                Get in Touch
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Let's Start a{" "}
                <span className="gradient-text">Conversation</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Have questions about our platform? Ready to transform your digital presence? 
                Our team is here to help you succeed.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Form */}
        <ContactSection />
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Contact;
