import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import StatsSection from "@/components/sections/StatsSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import ServicesSection from "@/components/sections/ServicesSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import PricingSection from "@/components/sections/PricingSection";
import FAQSection from "@/components/sections/FAQSection";
import ContactSection from "@/components/sections/ContactSection";
import AboutSection from "@/components/sections/AboutSection";
import CTASection from "@/components/sections/CTASection";
import Footer from "@/components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import BackToTop from "@/components/ui/back-to-top";

const SectionDivider = () => (
  <div className="max-w-6xl mx-auto px-6">
    <Separator className="bg-border/50" />
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <SectionDivider />
        <StatsSection />
        <SectionDivider />
        <FeaturesSection />
        <SectionDivider />
        <ServicesSection />
        <SectionDivider />
        <TestimonialsSection />
        <SectionDivider />
        <PricingSection />
        <SectionDivider />
        <FAQSection />
        <SectionDivider />
        <ContactSection />
        <SectionDivider />
        <AboutSection />
        <SectionDivider />
        <CTASection />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Index;
