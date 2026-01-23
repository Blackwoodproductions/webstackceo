import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import StatsSection from "@/components/sections/StatsSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import DomainAuditSection from "@/components/sections/DomainAuditSection";
import PricingSection from "@/components/sections/PricingSection";
import ContactSection from "@/components/sections/ContactSection";
import Footer from "@/components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import LoadingScreen from "@/components/ui/loading-screen";
import SectionIndicator from "@/components/ui/section-indicator";
import KeyboardShortcutsHelp from "@/components/ui/keyboard-shortcuts-help";
import LiveChatWidget from "@/components/ui/live-chat-widget";
import InteractiveGrid from "@/components/ui/interactive-grid";
import FloatingAIShield from "@/components/ui/floating-ai-shield";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import SEO from "@/components/SEO";
import ogImages from "@/assets/og";

const SectionDivider = () => (
  <div className="max-w-6xl mx-auto px-6">
    <Separator className="bg-border/50" />
  </div>
);

const Index = () => {
  // Enable keyboard navigation
  useKeyboardNavigation();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Full-page interactive grid */}
      <InteractiveGrid className="fixed inset-0 opacity-40 pointer-events-none z-0" glowRadius={120} glowIntensity={0.4} />
      {/* Floating AI Shield */}
      <FloatingAIShield />
      <SEO
        title="Webstack.ceo | Niche Linking on Autopilot for SEO Agencies"
        description="White-label SEO tools for agencies and marketing companies. We categorize client websites by niche to enable automated, relevant backlink building at scale. Built by Blackwood Productions."
        keywords="SEO agency tools, white label SEO, niche link building, automated backlinks, marketing agency software, reseller SEO platform, link building automation, agency SEO tools"
        canonical="/"
        ogImage={ogImages.home}
      />
      <LoadingScreen />
      <ScrollProgress />
      <SectionIndicator />
      <KeyboardShortcutsHelp />
      <LiveChatWidget />
      <Navbar />
      <main>
        <HeroSection />
        <SectionDivider />
        <StatsSection />
        <SectionDivider />
        <TestimonialsSection />
        <SectionDivider />
        <FeaturesSection />
        <SectionDivider />
        <DomainAuditSection />
        <SectionDivider />
        <PricingSection />
        <SectionDivider />
        <ContactSection />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Index;
