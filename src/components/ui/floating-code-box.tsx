import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, memo, useCallback } from "react";
import { useSoundContext } from "@/contexts/SoundContext";
import { useSoundEffects } from "@/hooks/use-sound-effects";

const FloatingCodeBox = memo(() => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { soundEnabled } = useSoundContext();
  const { playSound } = useSoundEffects();

  // Mouse position tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for mouse following
  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  // Transform mouse position to subtle movement
  const floatX = useTransform(smoothMouseX, [-0.5, 0.5], [-15, 15]);
  const floatY = useTransform(smoothMouseY, [-0.5, 0.5], [-10, 10]);

  // Delay visibility to prioritize critical content
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Throttled mouse move handler for performance
  useEffect(() => {
    if (!isVisible) return;

    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        mouseX.set((clientX / innerWidth) - 0.5);
        mouseY.set((clientY / innerHeight) - 0.5);
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [mouseX, mouseY, isVisible]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (soundEnabled) playSound("code");
  }, [soundEnabled, playSound]);

  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  if (!isVisible) return null;

  return (
    <motion.div
      style={{ x: floatX, y: floatY }}
      className="fixed top-24 right-6 w-20 h-20 rounded-xl glass-card hidden lg:flex overflow-hidden cursor-pointer transition-all duration-300 z-40 will-change-transform"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Static code display - no continuous animations for performance */}
      <div className="absolute inset-0 flex flex-col py-1.5 px-1.5">
        {[
          'const ai =',
          '  analyze()',
          'if (ready)',
          '  deploy();',
          'return data',
          '};',
        ].map((codeLine, rowIndex) => (
          <div 
            key={rowIndex} 
            className="text-amber-400 text-[7px] font-mono leading-[11px] overflow-hidden whitespace-nowrap"
            style={{ 
              textShadow: '0 0 6px rgba(251, 191, 36, 0.5)',
            }}
          >
            {codeLine}
          </div>
        ))}
      </div>
    </motion.div>
  );
});

FloatingCodeBox.displayName = "FloatingCodeBox";

export default FloatingCodeBox;
