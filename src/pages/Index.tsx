import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
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
import InteractiveGrid from "@/components/ui/interactive-grid";
import FloatingAIShield from "@/components/ui/floating-ai-shield";
import { VIDashboardEffects } from "@/components/ui/vi-dashboard-effects";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import SEO from "@/components/SEO";
import ogImages from "@/assets/og";

// Shopping cart & promo components
import { CartProvider } from "@/contexts/CartContext";
import { ProductCatalog, CartDrawer } from "@/components/shop";
import { TrustBadges } from "@/components/marketing/PromoComponents";

const SectionDivider = () => (
  <div className="max-w-6xl mx-auto px-6">
    <Separator className="bg-border/50" />
  </div>
);

const Index = () => {
  // Enable keyboard navigation
  useKeyboardNavigation();

  return (
    <CartProvider>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* VI Dashboard Background Effects - exact replica */}
        <VIDashboardEffects />
        <InteractiveGrid className="fixed inset-0 opacity-30 pointer-events-none z-0" glowRadius={120} glowIntensity={0.12} />
        {/* Floating AI Shield */}
        <FloatingAIShield />
        <SEO
          title="Webstack.ceo | Command Your Website & Operate Like a BOSS"
          description="All-in-one SEO command center. Free instant audits, visitor intelligence, automated content (BRON & CADE), AEO/GEO optimization, uptime monitoring, and white-label dashboards. One platform for everything—fully automated."
          keywords="SEO platform, visitor intelligence, website analytics, SEO audit, automated content, AEO optimization, GEO SEO, uptime monitoring, white-label SEO, link building, BRON, CADE, traffic intelligence"
          canonical="/"
          ogImage={ogImages.home}
        />
        <LoadingScreen />
        <ScrollProgress />
        <SectionIndicator />
        <KeyboardShortcutsHelp />
        
        {/* Cart Drawer - floating cart button + slide-out drawer */}
        <CartDrawer />
        
        <Navbar />
        <main className="pb-16">
          <HeroSection />
          <SectionDivider />
          <StatsSection />
          <SectionDivider />
          
          {/* Trust badges after stats */}
          <TrustBadges />
          
          <SectionDivider />
          <TestimonialsSection />
          <SectionDivider />
          <FeaturesSection />
          <SectionDivider />
          
          {/* À La Carte Product Catalog */}
          <ProductCatalog />
          
          <SectionDivider />
          <PricingSection />
          <SectionDivider />
          <ContactSection />
        </main>
        <Footer />
        <BackToTop />
      </div>
    </CartProvider>
  );
};

export default Index;
