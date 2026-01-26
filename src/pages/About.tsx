import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AboutSection from "@/components/sections/AboutSection";
import MissionSection from "@/components/sections/MissionSection";
import TimelineSection from "@/components/sections/TimelineSection";
import TeamSection from "@/components/sections/TeamSection";
import PartnershipSection from "@/components/sections/PartnershipSection";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import { Separator } from "@/components/ui/separator";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";
import ogImages from "@/assets/og";
import { VIDashboardEffects } from "@/components/ui/vi-dashboard-effects";
import InteractiveGrid from "@/components/ui/interactive-grid";

const SectionDivider = () => (
  <div className="max-w-6xl mx-auto px-6">
    <Separator className="bg-border/50" />
  </div>
);

const About = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* VI Dashboard Background Effects - exact replica */}
      <VIDashboardEffects />
      <InteractiveGrid className="fixed inset-0 opacity-30 pointer-events-none z-0" glowRadius={120} glowIntensity={0.12} />
      <SEO
        title="About Us - 22 Years Powering SEO Agencies"
        description="Learn about Webstack.ceo - 22 years of experience building tools for SEO agencies and marketing companies. Our automated niche categorization powers link building at scale."
        keywords="about webstack, SEO agency tools, blackwood productions, white label SEO, niche link building, marketing agency partner"
        canonical="/about"
        ogImage={ogImages.about}
        schema={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About Webstack.ceo",
          "description": "22 years of experience powering SEO agencies with automated niche linking",
          "mainEntity": {
            "@type": "Organization",
            "name": "Blackwood Productions",
            "foundingDate": "2003"
          }
        }}
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { 
            label: "About Us",
            altText: "Learn about our web development expertise and team"
          }
        ]}
      />
      <main>
        <AboutSection />
        <SectionDivider />
        <MissionSection />
        <SectionDivider />
        <TimelineSection />
        <SectionDivider />
        <TeamSection />
        <SectionDivider />
        <PartnershipSection />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default About;
