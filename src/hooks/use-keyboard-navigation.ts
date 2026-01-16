import { useEffect, useState, useCallback } from "react";

const sections = [
  "hero",
  "features",
  "services",
  "testimonials",
  "pricing",
  "faq",
  "contact",
  "about",
];

export const useKeyboardNavigation = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);

  const scrollToSection = useCallback((sectionId: string) => {
    if (sectionId === "hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 80;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  }, []);

  const navigateToSection = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, sections.length - 1));
    setCurrentIndex(clampedIndex);
    scrollToSection(sections[clampedIndex]);
  }, [scrollToSection]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        !isEnabled
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowDown":
        case "j": // Vim-style navigation
          e.preventDefault();
          navigateToSection(currentIndex + 1);
          break;
        case "ArrowUp":
        case "k": // Vim-style navigation
          e.preventDefault();
          navigateToSection(currentIndex - 1);
          break;
        case "Home":
          e.preventDefault();
          navigateToSection(0);
          break;
        case "End":
          e.preventDefault();
          navigateToSection(sections.length - 1);
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
          e.preventDefault();
          navigateToSection(parseInt(e.key) - 1);
          break;
      }
    };

    // Update current index based on scroll position
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const element = section === "hero" ? document.body : document.getElementById(section);
        
        if (element) {
          const offsetTop = section === "hero" ? 0 : element.offsetTop;
          if (scrollPosition >= offsetTop) {
            setCurrentIndex(i);
            break;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [currentIndex, isEnabled, navigateToSection]);

  return { 
    currentIndex, 
    currentSection: sections[currentIndex],
    isEnabled,
    setIsEnabled,
    navigateToSection,
    sections 
  };
};
