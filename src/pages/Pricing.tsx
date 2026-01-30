import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import { NewPricingSection } from "@/components/sections/NewPricingSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";
import ogImages from "@/assets/og";
import { VIDashboardEffects } from "@/components/ui/vi-dashboard-effects";
import InteractiveGrid from "@/components/ui/interactive-grid";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* VI Dashboard Background Effects - exact replica */}
      <VIDashboardEffects />
      <InteractiveGrid className="fixed inset-0 opacity-30 pointer-events-none z-0" glowRadius={120} glowIntensity={0.12} />
      <SEO
        title="Pricing - All SEO Services & Plans | Webstack.ceo"
        description="Transparent pricing for all SEO services. Core plans from $15/domain, Business CEO ($75/mo), White Label ($499/mo), Super Reseller ($1499/mo). À la carte BRON, CADE, DAX, On-Page SEO, and more."
        keywords="SEO pricing, BRON pricing, CADE pricing, DAX pricing, on-page SEO pricing, white label SEO, agency SEO plans, link building pricing"
        canonical="/pricing"
        ogImage={ogImages.pricing}
        schema={{
          "@context": "https://schema.org",
          "@type": "PriceSpecification",
          "name": "Webstack.ceo SEO Services Pricing",
          "description": "Complete pricing for all SEO automation services including BRON, CADE, DAX, On-Page SEO, and more",
          "priceCurrency": "USD"
        }}
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { 
            label: "Pricing",
            altText: "View all SEO service pricing and plans"
          }
        ]}
      />
      
      <main className="pt-4">
        {/* Minimal spacing before pricing */}
        <div className="py-4" />

        {/* New Comprehensive Pricing Section */}
        <NewPricingSection />

        {/* Testimonials */}
        <TestimonialsSection />
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Pricing;
