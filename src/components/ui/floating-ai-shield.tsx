import { memo, useState, useEffect } from "react";
import { Shield } from "lucide-react";

const FloatingAIShield = memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [isShieldGold, setIsShieldGold] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Delay render to not block initial page paint
  useEffect(() => {
    let handle: number;
    const hasIdle = typeof window !== "undefined" && "requestIdleCallback" in window;

    if (hasIdle) {
      handle = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(() => setIsVisible(true), { timeout: 1000 });
    } else {
      handle = setTimeout(() => setIsVisible(true), 1) as unknown as number;
    }

    return () => {
      if (hasIdle) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle);
      } else {
        clearTimeout(handle);
      }
    };
  }, []);

  // Listen for logo gold state changes from Navbar
  useEffect(() => {
    const handleLogoGoldChange = (e: CustomEvent<{ isGold: boolean }>) => {
      setIsShieldGold(e.detail.isGold);
    };
    window.addEventListener('logoGoldChange', handleLogoGoldChange as EventListener);
    return () => window.removeEventListener('logoGoldChange', handleLogoGoldChange as EventListener);
  }, []);

  // Handle scroll to stop at bottom (same as floating code box)
  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const stopPoint = window.innerHeight - 120; // Stop 120px from bottom
        setIsAtBottom(footerRect.top < stopPoint);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed left-20 w-16 h-16 rounded-xl glass-card hidden lg:flex items-center justify-center cursor-pointer z-40 animate-fade-in transition-all duration-700 ${
        isShieldGold 
          ? "bg-gradient-to-br from-amber-400/20 to-yellow-500/20 shadow-[0_0_25px_rgba(251,191,36,0.5)]" 
          : "bg-gradient-to-br from-cyan-400/20 to-violet-500/20"
      }`}
      style={{
        top: isAtBottom ? 'auto' : '68%',
        bottom: isAtBottom ? '120px' : 'auto',
      }}
    >
      <Shield className={`w-[42px] h-[42px] transition-colors duration-700 ${isShieldGold ? "text-amber-400" : "text-primary"}`} />
      <span className={`absolute font-bold text-[11px] tracking-tight transition-colors duration-700 ${isShieldGold ? "text-amber-400" : "text-primary"}`}>AI</span>
    </div>
  );
});

FloatingAIShield.displayName = "FloatingAIShield";

export default FloatingAIShield;
