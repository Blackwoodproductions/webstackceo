import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import LogoCarousel from "@/components/sections/LogoCarousel";
import StatsSection from "@/components/sections/StatsSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
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
    <div className="min-h-screen bg-background">
      <SEO
        title="Webstack.ceo | Your Website's Command Center"
        description="One unified dashboard to manage analytics, SEO, performance, security, and marketing—everything a CEO needs to run a successful website. Built by Blackwood Productions."
        keywords="website management, SEO tools, analytics dashboard, website performance, CEO tools, digital marketing, website security, SaaS platform, web hosting, domain authority, uptime monitoring"
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
        <FeaturesSection />
        <SectionDivider />
        <TestimonialsSection />
        <SectionDivider />
        <PricingSection />
        <LogoCarousel />
        <SectionDivider />
        <ContactSection />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Index;
