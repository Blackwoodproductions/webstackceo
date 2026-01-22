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

const SectionDivider = () => (
  <div className="max-w-6xl mx-auto px-6">
    <Separator className="bg-border/50" />
  </div>
);

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="About Us - Our Story & Mission"
        description="Learn about Webstack.ceo - 22 years of web development expertise helping CEOs command their online presence. Meet our team and discover our mission."
        keywords="about webstack, web development company, blackwood productions, CEO website tools, digital marketing experts, SEO professionals"
        canonical="/about"
        schema={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About Webstack.ceo",
          "description": "Learn about our 22 years of web development expertise",
          "mainEntity": {
            "@type": "Organization",
            "name": "Blackwood Productions",
            "foundingDate": "2003"
          }
        }}
      />
      <ScrollProgress />
      <Navbar />
      <main className="pt-20">
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
