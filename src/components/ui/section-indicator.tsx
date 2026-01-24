import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const sections = [
  { id: "hero", label: "Home" },
  { id: "stats", label: "Stats" },
  { id: "testimonials", label: "Testimonials" },
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
  { id: "contact", label: "Contact" },
];

const SectionIndicator = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isAtBottom = window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 200;
      
      // Detect scroll direction
      setIsScrollingUp(currentScrollY < lastScrollY);
      setLastScrollY(currentScrollY);

      // Hide when at the bottom of the page, unless scrolling up
      if (isAtBottom && !isScrollingUp) {
        setIsVisible(false);
      } else {
        // Show indicator after scrolling past hero
        setIsVisible(currentScrollY > 300);
      }

      // Find active section
      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id)
      })).filter(s => s.element);

      // For hero, check if we're near the top
      if (currentScrollY < 300) {
        setActiveSection("hero");
        return;
      }

      for (const { id, element } of sectionElements) {
        if (element) {
          const rect = element.getBoundingClientRect();
          const offset = 200; // Offset from top of viewport
          if (rect.top <= offset && rect.bottom >= offset) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isScrollingUp]);

  const scrollToSection = (sectionId: string) => {
    if (sectionId === "hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 80;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20 }}
      transition={{ duration: 0.3 }}
      className="fixed left-6 top-[47%] -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3"
    >
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => scrollToSection(section.id)}
          className="group flex items-center gap-3"
          aria-label={`Go to ${section.label}`}
        >
          {/* Dot indicator */}
          <motion.div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              activeSection === section.id
                ? "bg-gradient-to-br from-cyan-400 to-violet-500 scale-125"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            layoutId="activeDot"
          />
          
          {/* Label tooltip */}
          <span
            className={`text-xs font-medium transition-all duration-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 ${
              activeSection === section.id
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            {section.label}
          </span>
        </button>
      ))}
      
      {/* Active indicator line */}
      <div className="absolute left-[4px] top-0 bottom-0 w-px bg-border -z-10" />
    </motion.div>
  );
};

export default SectionIndicator;
