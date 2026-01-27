import { memo, useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const FloatingAIShield = memo(() => {
  const { isLoading: authLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isShieldGold, setIsShieldGold] = useState(false);
  const [topPosition, setTopPosition] = useState('78%');
  const [opacity, setOpacity] = useState(1);

  // Delay render until auth is stable
  useEffect(() => {
    if (authLoading) return;
    let handle: number;
    const hasIdle = typeof window !== "undefined" && "requestIdleCallback" in window;

    if (hasIdle) {
      handle = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(() => setIsVisible(true), { timeout: 1000 });
    } else {
      handle = setTimeout(() => setIsVisible(true), 100) as unknown as number;
    }

    return () => {
      if (hasIdle) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle);
      } else {
        clearTimeout(handle);
      }
    };
  }, [authLoading]);

  // Listen for logo gold state changes from Navbar
  useEffect(() => {
    const handleLogoGoldChange = (e: CustomEvent<{ isGold: boolean }>) => {
      setIsShieldGold(e.detail.isGold);
    };
    window.addEventListener('logoGoldChange', handleLogoGoldChange as EventListener);
    return () => window.removeEventListener('logoGoldChange', handleLogoGoldChange as EventListener);
  }, []);

  // Handle scroll to stop above footer and fade out
  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (!footer) return;

      const footerRect = footer.getBoundingClientRect();
      const elementHeight = 56; // 14 * 4 = h-14
      const buffer = 40; // Space above footer
      const defaultTop = window.innerHeight * 0.72;
      const fadeStartDistance = 150; // Start fading when this close to footer
      
      // Calculate max position (above footer)
      const maxTop = footerRect.top - elementHeight - buffer;
      
      // Calculate opacity based on proximity to footer
      const distanceToFooter = footerRect.top - defaultTop - elementHeight;
      if (distanceToFooter < fadeStartDistance) {
        const fadeProgress = Math.max(0, distanceToFooter / fadeStartDistance);
        setOpacity(fadeProgress);
      } else {
        setOpacity(1);
      }
      
      if (defaultTop > maxTop) {
        setTopPosition(`${maxTop}px`);
      } else {
        setTopPosition('72%');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      data-floating-ai-shield
      className={`fixed left-6 w-14 h-14 rounded-xl glass-card hidden lg:flex items-center justify-center cursor-pointer z-40 animate-fade-in transition-opacity duration-300 ${
        isShieldGold 
          ? "bg-gradient-to-br from-amber-400/20 to-yellow-500/20 shadow-[0_0_25px_rgba(251,191,36,0.5)]" 
          : "bg-gradient-to-br from-cyan-400/20 to-violet-500/20"
      }`}
      style={{ top: topPosition, opacity }}
    >
      <Shield className={`w-[42px] h-[42px] transition-colors duration-700 ${isShieldGold ? "text-amber-400" : "text-primary"}`} />
      <span className={`absolute font-bold text-[11px] tracking-tight transition-colors duration-700 ${isShieldGold ? "text-amber-400" : "text-primary"}`}>AI</span>
    </div>
  );
});

FloatingAIShield.displayName = "FloatingAIShield";

export default FloatingAIShield;
