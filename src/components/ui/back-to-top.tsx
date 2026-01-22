import { useState, useEffect, memo, useCallback, forwardRef } from "react";
import { ArrowUp } from "lucide-react";

const BackToTop = memo(forwardRef<HTMLButtonElement>((_, ref) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let rafId: number;
    let lastScrollY = 0;
    
    const toggleVisibility = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        if ((currentScrollY > 400) !== (lastScrollY > 400)) {
          setIsVisible(currentScrollY > 400);
        }
        lastScrollY = currentScrollY;
      });
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <button
      ref={ref}
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-lg flex items-center justify-center group will-change-transform transition-all duration-300 ${
        isVisible 
          ? "opacity-100 scale-100 translate-y-0" 
          : "opacity-0 scale-75 translate-y-4 pointer-events-none"
      }`}
      aria-label="Back to top"
      aria-hidden={!isVisible}
    >
      <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
    </button>
  );
}));

BackToTop.displayName = "BackToTop";

export default BackToTop;