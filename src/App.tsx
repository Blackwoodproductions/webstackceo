import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SoundProvider } from "@/contexts/SoundContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Marketplace from "./pages/Marketplace";
import PartnerDetail from "./pages/PartnerDetail";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Security from "./pages/Security";
import Cookies from "./pages/Cookies";
import OnPageSEO from "./pages/features/OnPageSEO";
import OffPageSEO from "./pages/features/OffPageSEO";
import AutomatedBlog from "./pages/features/AutomatedBlog";
import FAQGeneration from "./pages/features/FAQGeneration";
import TrafficDeAnonymization from "./pages/features/TrafficDeAnonymization";
import VisitorIntelligence from "./pages/features/VisitorIntelligence";
import PPCLandingPages from "./pages/features/PPCLandingPages";
import DomainAuthority from "./pages/features/DomainAuthority";
import AdvancedAnalytics from "./pages/features/AdvancedAnalytics";
import GMBOptimization from "./pages/features/GMBOptimization";
import UptimeMonitoring from "./pages/features/UptimeMonitoring";
import WebHosting from "./pages/features/WebHosting";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SoundProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:slug" element={<PartnerDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/security" element={<Security />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/features/on-page-seo" element={<OnPageSEO />} />
            <Route path="/features/off-page-seo" element={<OffPageSEO />} />
            <Route path="/features/automated-blog" element={<AutomatedBlog />} />
            <Route path="/features/faq-generation" element={<FAQGeneration />} />
            <Route path="/features/traffic-de-anonymization" element={<TrafficDeAnonymization />} />
            <Route path="/features/visitor-intelligence" element={<VisitorIntelligence />} />
            <Route path="/features/ppc-landing-pages" element={<PPCLandingPages />} />
            <Route path="/features/domain-authority" element={<DomainAuthority />} />
            <Route path="/features/advanced-analytics" element={<AdvancedAnalytics />} />
            <Route path="/features/gmb-optimization" element={<GMBOptimization />} />
            <Route path="/features/uptime-monitoring" element={<UptimeMonitoring />} />
            <Route path="/features/web-hosting" element={<WebHosting />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SoundProvider>
  </QueryClientProvider>
);

export default App;
