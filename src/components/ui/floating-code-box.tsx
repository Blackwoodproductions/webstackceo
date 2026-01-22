import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { useSoundContext } from "@/contexts/SoundContext";
import { useSoundEffects } from "@/hooks/use-sound-effects";

const FloatingCodeBox = () => {
  const [isHovered, setIsHovered] = useState(false);
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set((clientX / innerWidth) - 0.5);
      mouseY.set((clientY / innerHeight) - 0.5);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      style={{ x: floatX, y: floatY }}
      className="fixed top-24 right-6 w-20 h-20 rounded-xl glass-card hidden lg:flex overflow-hidden cursor-pointer transition-all duration-300 z-40"
      onMouseEnter={() => {
        setIsHovered(true);
        if (soundEnabled) playSound("code");
      }}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* Real code typing animation */}
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
            className="text-amber-400 text-[7px] font-mono leading-[11px] overflow-hidden"
          >
            <span 
              className="inline-block"
              style={{ 
                textShadow: '0 0 6px rgba(251, 191, 36, 0.7)',
                animation: `floatingCodeTypewrite 3s steps(${codeLine.length}) infinite`,
                animationDelay: `${rowIndex * 0.5}s`,
                width: '0',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {codeLine}
            </span>
            <span 
              className="inline-block w-[3px] h-[8px] bg-amber-400 ml-[1px] align-middle"
              style={{
                animation: `floatingCodeBlink 0.8s step-end infinite`,
                animationDelay: `${rowIndex * 0.5}s`,
                boxShadow: '0 0 4px rgba(251, 191, 36, 0.8)'
              }}
            />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes floatingCodeTypewrite {
          0%, 100% { width: 0; }
          50%, 90% { width: 100%; }
        }
        @keyframes floatingCodeBlink {
          50% { opacity: 0; }
        }
      `}</style>
    </motion.div>
  );
};

export default FloatingCodeBox;
