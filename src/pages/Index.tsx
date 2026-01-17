import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import LogoCarousel from "@/components/sections/LogoCarousel";
import StatsSection from "@/components/sections/StatsSection";
import FeaturesSection from "@/components/sections/FeaturesSection";

import TestimonialsSection from "@/components/sections/TestimonialsSection";
import PricingSection from "@/components/sections/PricingSection";
import FAQSection from "@/components/sections/FAQSection";
import ContactSection from "@/components/sections/ContactSection";

import CTASection from "@/components/sections/CTASection";
import Footer from "@/components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import LoadingScreen from "@/components/ui/loading-screen";
import SectionIndicator from "@/components/ui/section-indicator";
import KeyboardShortcutsHelp from "@/components/ui/keyboard-shortcuts-help";
import LiveChatWidget from "@/components/ui/live-chat-widget";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";

const SectionDivider = () => (
  <div className="max-w-6xl mx-auto px-6">
    <Separator className="bg-border/50" />
  </div>
);

const Index = () => {
  // Enable keyboard navigation
  useKeyboardNavigation();

  return (
    <div className="min-h-screen bg-background">
      <LoadingScreen />
      <ScrollProgress />
      <SectionIndicator />
      <KeyboardShortcutsHelp />
      <LiveChatWidget />
      <Navbar />
      <main>
        <HeroSection />
        <LogoCarousel />
        <SectionDivider />
        <StatsSection />
        <SectionDivider />
        <FeaturesSection />
        <SectionDivider />
        <TestimonialsSection />
        <SectionDivider />
        <PricingSection />
        <SectionDivider />
        <FAQSection />
        <SectionDivider />
        <ContactSection />
        <SectionDivider />
        <CTASection />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Index;
