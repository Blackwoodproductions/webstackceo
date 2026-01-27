import { memo, useState, useEffect, forwardRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const FloatingCodeBox = memo(forwardRef<HTMLDivElement>(function FloatingCodeBox(_, ref) {
  const { isLoading: authLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [topPosition, setTopPosition] = useState('8rem');
  const [isGold, setIsGold] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isEmbedMode = searchParams.get('embed') === 'true';

  // Hide on admin/dashboard pages and in embed mode
  const hiddenPaths = ['/visitor-intelligence-dashboard', '/admin', '/auth'];
  const shouldHide = isEmbedMode || hiddenPaths.some(path => location.pathname.startsWith(path));

  // Delay render until auth is stable to prevent crashes during auth state changes
  useEffect(() => {
    if (authLoading) return;
    
    let handle: number;
    const hasIdle = typeof window !== "undefined" && "requestIdleCallback" in window;

    if (hasIdle) {
      handle = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(() => setIsVisible(true), { timeout: 1000 });
    } else {
      handle = setTimeout(() => setIsVisible(true), 150) as unknown as number;
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
    const handleLogoGoldChange = (e: Event) => {
      // Defensive: in case a non-CustomEvent (or missing detail) is dispatched
      const custom = e as CustomEvent<{ isGold?: unknown }>;
      const next = custom?.detail?.isGold;
      if (typeof next === 'boolean') setIsGold(next);
    };
    window.addEventListener('logoGoldChange', handleLogoGoldChange);
    return () => window.removeEventListener('logoGoldChange', handleLogoGoldChange);
  }, []);

  // Handle scroll to stop above footer
  useEffect(() => {
    const handleScroll = () => {
      try {
        const footer = document.querySelector('footer');
        if (!footer) return;

        const footerRect = footer.getBoundingClientRect();
        const elementHeight = 80; // 20 * 4 = h-20
        const buffer = 40; // Space above footer
        const defaultTop = 128; // 8rem = 128px

        // Calculate max position (above footer)
        const maxTop = footerRect.top - elementHeight - buffer;
        if (!Number.isFinite(maxTop)) return;

        if (defaultTop > maxTop) {
          // Element would overlap footer, cap it
          setTopPosition(`${maxTop}px`);
        } else {
          setTopPosition('8rem');
        }
      } catch {
        // Never allow this non-critical widget to crash the page.
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

  if (!isVisible || shouldHide) return null;

  const codeLines = [
    'const ai =',
    '  analyze()',
    'if (ready)',
    '  deploy();',
    'return data',
    '};',
  ];

  return (
    <div 
      ref={ref}
      className={`fixed right-6 w-20 h-20 rounded-xl glass-card hidden lg:flex overflow-hidden cursor-pointer z-40 animate-fade-in ${
        isGold ? "shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-shadow duration-700" : "transition-shadow duration-700"
      }`}
      style={{ top: topPosition }}
    >
      <div className="absolute inset-0 flex flex-col py-1.5 px-1.5">
        {codeLines.map((codeLine, rowIndex) => (
          <div 
            key={rowIndex} 
            className={`text-[7px] font-mono leading-[11px] overflow-hidden transition-colors duration-700 ${
              isGold ? "text-amber-400" : "text-primary"
            }`}
          >
            <span 
              className="inline-block floating-code-line"
              style={{ 
                textShadow: isGold 
                  ? '0 0 6px rgba(251, 191, 36, 0.7)' 
                  : '0 0 6px hsl(var(--primary) / 0.7)',
                animationDelay: `${rowIndex * 0.5}s`,
              }}
            >
              {codeLine}
            </span>
            <span 
              className={`inline-block w-[3px] h-[8px] ml-[1px] align-middle floating-code-cursor transition-colors duration-700 ${
                isGold ? "bg-amber-400" : "bg-primary"
              }`}
              style={{
                animationDelay: `${rowIndex * 0.5}s`,
                boxShadow: isGold 
                  ? '0 0 4px rgba(251, 191, 36, 0.8)' 
                  : '0 0 4px hsl(var(--primary) / 0.8)'
              }}
            />
          </div>
        ))}
      </div>
      <style>{`
        .floating-code-line {
          animation: floatingCodeTypewrite 3s steps(12) infinite;
          width: 0;
          overflow: hidden;
          white-space: nowrap;
        }
        .floating-code-cursor {
          animation: floatingCodeBlink 0.8s step-end infinite;
        }
        @keyframes floatingCodeTypewrite {
          0%, 100% { width: 0; }
          50%, 90% { width: 100%; }
        }
        @keyframes floatingCodeBlink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}));

FloatingCodeBox.displayName = "FloatingCodeBox";

export default FloatingCodeBox;
