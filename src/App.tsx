import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SoundProvider } from "@/contexts/SoundContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";
import ScrollToTop from "@/components/ui/scroll-to-top";
import ErrorBoundary from "@/components/ErrorBoundary";

// Critical path - loaded immediately
import Index from "./pages/Index";

// Lazy load all other pages for code splitting
const About = lazy(() => import("./pages/About"));
const Careers = lazy(() => import("./pages/Careers"));
const Features = lazy(() => import("./pages/Features"));
const Pricing = lazy(() => import("./pages/Pricing"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const PartnerDetail = lazy(() => import("./pages/PartnerDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Admin = lazy(() => import("./pages/Admin"));
const VisitorIntelligenceDashboard = lazy(() => import("./pages/VisitorIntelligenceDashboard"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const Security = lazy(() => import("./pages/Security"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Directory = lazy(() => import("./pages/Directory"));
const DirectoryDetail = lazy(() => import("./pages/DirectoryDetail"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Changelog = lazy(() => import("./pages/Changelog"));
const Learn = lazy(() => import("./pages/Learn"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const AuditResults = lazy(() => import("./pages/AuditResults"));
const WebsiteAudits = lazy(() => import("./pages/WebsiteAudits"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const Tools = lazy(() => import("./pages/Tools"));
const Documentation = lazy(() => import("./pages/Documentation"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BronCallback = lazy(() => import("./pages/BronCallback"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));

// Feature pages - lazy loaded
const OnPageSEO = lazy(() => import("./pages/features/OnPageSEO"));
const OffPageSEO = lazy(() => import("./pages/features/OffPageSEO"));
const AutomatedBlog = lazy(() => import("./pages/features/AutomatedBlog"));
const FAQGeneration = lazy(() => import("./pages/features/FAQGeneration"));
const TrafficDeAnonymization = lazy(() => import("./pages/features/TrafficDeAnonymization"));
const VisitorIntelligence = lazy(() => import("./pages/features/VisitorIntelligence"));
const PPCLandingPages = lazy(() => import("./pages/features/PPCLandingPages"));
const DomainAuthority = lazy(() => import("./pages/features/DomainAuthority"));
const AdvancedAnalytics = lazy(() => import("./pages/features/AdvancedAnalytics"));
const GMBOptimization = lazy(() => import("./pages/features/GMBOptimization"));
const UptimeMonitoring = lazy(() => import("./pages/features/UptimeMonitoring"));
const WebHosting = lazy(() => import("./pages/features/WebHosting"));
const SocialSignals = lazy(() => import("./pages/features/SocialSignals"));

// Learn pages - lazy loaded
const OnPageSEOGuide = lazy(() => import("./pages/learn/OnPageSEOGuide"));
const OffPageSEOGuide = lazy(() => import("./pages/learn/OffPageSEOGuide"));
const AnalyticsGuide = lazy(() => import("./pages/learn/AnalyticsGuide"));
const DomainAuthorityGuide = lazy(() => import("./pages/learn/DomainAuthorityGuide"));
const VisitorIntelligenceGuide = lazy(() => import("./pages/learn/VisitorIntelligenceGuide"));
const GMBOptimizationGuide = lazy(() => import("./pages/learn/GMBOptimizationGuide"));
const AutomatedBloggingGuide = lazy(() => import("./pages/learn/AutomatedBloggingGuide"));
const UptimeMonitoringGuide = lazy(() => import("./pages/learn/UptimeMonitoringGuide"));
const TechnicalSEOGuide = lazy(() => import("./pages/learn/TechnicalSEOGuide"));
const TrafficDeanonymizationGuide = lazy(() => import("./pages/learn/TrafficDeanonymizationGuide"));
const FAQGenerationGuide = lazy(() => import("./pages/learn/FAQGenerationGuide"));
const SocialSignalsGuide = lazy(() => import("./pages/learn/SocialSignalsGuide"));
const LocalSEOGuide = lazy(() => import("./pages/learn/LocalSEOGuide"));
const LinkBuildingGuide = lazy(() => import("./pages/learn/LinkBuildingGuide"));
const WebHostingGuide = lazy(() => import("./pages/learn/WebHostingGuide"));
const CoreWebVitalsGuide = lazy(() => import("./pages/learn/CoreWebVitalsGuide"));
const PPCLandingPagesGuide = lazy(() => import("./pages/learn/PPCLandingPagesGuide"));
const CROGuide = lazy(() => import("./pages/learn/CROGuide"));
const KeywordResearchGuide = lazy(() => import("./pages/learn/KeywordResearchGuide"));
const ContentMarketingGuide = lazy(() => import("./pages/learn/ContentMarketingGuide"));
const MobileSEOGuide = lazy(() => import("./pages/learn/MobileSEOGuide"));
const EcommerceSEOGuide = lazy(() => import("./pages/learn/EcommerceSEOGuide"));
const GlossaryTerm = lazy(() => import("./pages/learn/glossary/GlossaryTerm"));
const GlossaryIndex = lazy(() => import("./pages/learn/glossary/GlossaryIndex"));

// Lazy load non-critical UI components
const FloatingCodeBox = lazy(() => import("@/components/ui/floating-code-box"));
const FloatingLiveStats = lazy(() => import("@/components/ui/floating-live-stats"));
const BetaNoticeBanner = lazy(() => import("@/components/BetaNoticeBanner"));

const ShopSideTab = lazy(() => import("@/components/marketing/ShopSideTab"));

// Minimal loading fallback - no heavy animations
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

import { VisitorTrackingProvider } from "@/components/VisitorTrackingProvider";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <SoundProvider>
          <TooltipProvider delayDuration={300}>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <VisitorTrackingProvider>
                <ScrollToTop />
                <Suspense fallback={null}>
                  <ErrorBoundary fallback={<></>}>
                    <BetaNoticeBanner />
                  </ErrorBoundary>
                  <ErrorBoundary fallback={<></>}>
                    <ShopSideTab />
                  </ErrorBoundary>
                  <ErrorBoundary fallback={<></>}>
                    <FloatingCodeBox />
                  </ErrorBoundary>
                  <ErrorBoundary fallback={<></>}>
                    <FloatingLiveStats />
                  </ErrorBoundary>
                </Suspense>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
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
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/visitor-intelligence-dashboard" element={<VisitorIntelligenceDashboard />} />
                      <Route path="/dashboard" element={<Navigate to="/visitor-intelligence-dashboard" replace />} />
                      <Route path="/marketing-dashboard" element={<Navigate to="/visitor-intelligence-dashboard" replace />} />
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
                      <Route path="/features/social-signals" element={<SocialSignals />} />
                      <Route path="/directory" element={<Directory />} />
                      <Route path="/directory/:slug" element={<DirectoryDetail />} />
                      <Route path="/integrations" element={<Integrations />} />
                      <Route path="/changelog" element={<Changelog />} />
                      <Route path="/learn" element={<Learn />} />
                      <Route path="/learn/on-page-seo-guide" element={<OnPageSEOGuide />} />
                      <Route path="/learn/off-page-seo-guide" element={<OffPageSEOGuide />} />
                      <Route path="/learn/analytics-guide" element={<AnalyticsGuide />} />
                      <Route path="/learn/domain-authority-guide" element={<DomainAuthorityGuide />} />
                      <Route path="/learn/visitor-intelligence-guide" element={<VisitorIntelligenceGuide />} />
                      <Route path="/learn/gmb-optimization-guide" element={<GMBOptimizationGuide />} />
                      <Route path="/learn/automated-blogging-guide" element={<AutomatedBloggingGuide />} />
                      <Route path="/learn/uptime-monitoring-guide" element={<UptimeMonitoringGuide />} />
                      <Route path="/learn/glossary" element={<GlossaryIndex />} />
                      <Route path="/learn/glossary/:slug" element={<GlossaryTerm />} />
                      <Route path="/learn/technical-seo-guide" element={<TechnicalSEOGuide />} />
                      <Route path="/learn/traffic-deanonymization-guide" element={<TrafficDeanonymizationGuide />} />
                      <Route path="/learn/faq-generation-guide" element={<FAQGenerationGuide />} />
                      <Route path="/learn/social-signals-guide" element={<SocialSignalsGuide />} />
                      <Route path="/learn/local-seo-guide" element={<LocalSEOGuide />} />
                      <Route path="/learn/link-building-guide" element={<LinkBuildingGuide />} />
                      <Route path="/learn/web-hosting-guide" element={<WebHostingGuide />} />
                      <Route path="/learn/core-web-vitals-guide" element={<CoreWebVitalsGuide />} />
                      <Route path="/learn/ppc-landing-pages-guide" element={<PPCLandingPagesGuide />} />
                      <Route path="/learn/cro-guide" element={<CROGuide />} />
                      <Route path="/learn/keyword-research-guide" element={<KeywordResearchGuide />} />
                      <Route path="/learn/content-marketing-guide" element={<ContentMarketingGuide />} />
                      <Route path="/learn/mobile-seo-guide" element={<MobileSEOGuide />} />
                      <Route path="/learn/ecommerce-seo-guide" element={<EcommerceSEOGuide />} />
                      <Route path="/sitemap" element={<Sitemap />} />
                      <Route path="/tools" element={<Tools />} />
                      <Route path="/docs" element={<Documentation />} />
                      <Route path="/analytics" element={<Navigate to="/visitor-intelligence-dashboard" replace />} />
                      <Route path="/audits" element={<WebsiteAudits />} />
                      <Route path="/case-studies" element={<CaseStudies />} />
                      <Route path="/case-study/:domain" element={<AuditResults />} />
                      <Route path="/audit/:domain" element={<AuditResults />} />
                      <Route path="/bron/callback" element={<BronCallback />} />
                      <Route path="/checkout-success" element={<CheckoutSuccess />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </VisitorTrackingProvider>
            </BrowserRouter>
          </TooltipProvider>
        </SoundProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
