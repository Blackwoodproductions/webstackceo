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
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { generateServicesPDF } from "@/lib/generateServicesPDF";
import { toast } from "sonner";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
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
  );
};

export default Pricing;
