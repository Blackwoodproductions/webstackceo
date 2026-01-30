import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import PricingSection from "@/components/sections/PricingSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";
import ogImages from "@/assets/og";
import { VIDashboardEffects } from "@/components/ui/vi-dashboard-effects";
import InteractiveGrid from "@/components/ui/interactive-grid";
import { CartProvider } from "@/contexts/CartContext";

const Pricing = () => {
  return (
    <CartProvider>
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* VI Dashboard Background Effects - exact replica */}
      <VIDashboardEffects />
      <InteractiveGrid className="fixed inset-0 opacity-30 pointer-events-none z-0" glowRadius={120} glowIntensity={0.12} />
      <SEO
        title="Pricing - Agency Plans for SEO & Marketing Companies"
        description="Transparent pricing for SEO agencies and marketing companies. Business CEO ($75/mo), White Label ($499/mo), or Super Reseller ($1499/mo). Scale your agency with niche linking automation."
        keywords="SEO agency pricing, white label SEO pricing, reseller SEO plans, agency tools pricing, link building pricing, marketing agency software"
        canonical="/pricing"
        ogImage={ogImages.pricing}
        schema={{
          "@context": "https://schema.org",
          "@type": "PriceSpecification",
          "name": "Webstack.ceo Agency Pricing",
          "description": "Transparent pricing for SEO agencies with automated niche linking",
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
        {/* Minimal spacing before pricing */}
        <div className="py-8" />

        {/* Pricing Grid */}
        <PricingSection />

        {/* Testimonials */}
        <TestimonialsSection />
      </main>

      <Footer />
      <BackToTop />
    </div>
    </CartProvider>
  );
};

export default Pricing;
