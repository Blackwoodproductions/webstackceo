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

const SectionDivider = () => (
  <div className="max-w-6xl mx-auto px-6">
    <Separator className="bg-border/50" />
  </div>
);

const About = () => {
  return (
    <div className="min-h-screen bg-background">
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
