import { memo, useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingExportPDFProps {
  onExport?: () => void;
  domain?: string;
}

const FloatingExportPDF = memo(({ onExport, domain }: FloatingExportPDFProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [topPosition, setTopPosition] = useState('11rem');
  const [isGold, setIsGold] = useState(false);

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
      setIsGold(e.detail.isGold);
    };
    window.addEventListener('logoGoldChange', handleLogoGoldChange as EventListener);
    return () => window.removeEventListener('logoGoldChange', handleLogoGoldChange as EventListener);
  }, []);

  // Handle scroll to stop above footer - positioned below FloatingCodeBox
  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (!footer) return;

      const footerRect = footer.getBoundingClientRect();
      const elementHeight = 48; // Button height
      const buffer = 40; // Space above footer
      const floatingCodeBoxHeight = 80; // Height of FloatingCodeBox
      const gap = 16; // Gap between elements
      const defaultTop = 128 + floatingCodeBoxHeight + gap; // 8rem + code box + gap
      
      // Calculate max position (above footer)
      const maxTop = footerRect.top - elementHeight - buffer;
      
      if (defaultTop > maxTop) {
        // Element would overlap footer, cap it
        setTopPosition(`${maxTop}px`);
      } else {
        setTopPosition(`${defaultTop}px`);
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
    <Button
      onClick={onExport}
      size="sm"
      className={`fixed right-6 z-40 hidden lg:flex flex-col items-center justify-center gap-1 w-20 h-12 px-0 animate-fade-in transition-all duration-700 ${
        isGold 
          ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-[0_0_20px_rgba(251,191,36,0.4)]" 
          : ""
      }`}
      style={{ top: topPosition }}
    >
      <Download className="w-4 h-4" />
      <span className="text-[9px] leading-none">Export PDF</span>
    </Button>
  );
});

FloatingExportPDF.displayName = "FloatingExportPDF";

export default FloatingExportPDF;
