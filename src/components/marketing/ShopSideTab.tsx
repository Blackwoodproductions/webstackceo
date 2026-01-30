import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ShopSideTab = memo(function ShopSideTab() {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // Side tab scroll positioning (staggered at 55% - between FREE at 40% and BETA at 60%)
  const [topPosition, setTopPosition] = useState('55%');
  const [tabOpacity, setTabOpacity] = useState(1);
  const throttleRef = useRef(false);

  // Handle scroll to stop above footer and fade out
  useEffect(() => {
    const handleScroll = () => {
      if (throttleRef.current) return;
      throttleRef.current = true;
      
      requestAnimationFrame(() => {
        const footer = document.querySelector('footer');
        if (!footer) {
          throttleRef.current = false;
          return;
        }

        const footerRect = footer.getBoundingClientRect();
        const elementHeight = 56;
        const buffer = 40;
        const defaultTop = window.innerHeight * 0.55;
        const fadeStartDistance = 150;
        
        const maxTop = footerRect.top - elementHeight - buffer;
        const distanceToFooter = footerRect.top - defaultTop - elementHeight;
        
        if (distanceToFooter < fadeStartDistance) {
          const fadeProgress = Math.max(0, distanceToFooter / fadeStartDistance);
          setTabOpacity(fadeProgress);
        } else {
          setTabOpacity(1);
        }
        
        if (defaultTop > maxTop) {
          setTopPosition(`${maxTop}px`);
        } else {
          setTopPosition('55%');
        }
        throttleRef.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleClick = () => {
    // Navigate to pricing page
    navigate('/pricing');
  };

  if (tabOpacity === 0) return null;

  return (
    <div 
      className="fixed left-0 z-[100] flex items-center transition-all duration-500"
      style={{ top: topPosition, opacity: tabOpacity }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Futuristic Tab Handle - Opens pricing page */}
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.02, x: 2 }}
        whileTap={{ scale: 0.98 }}
        className={`relative flex flex-col items-center gap-1.5 py-4 px-2 overflow-hidden rounded-r-2xl border border-l-0 transition-all duration-500 ${
          isHovered
            ? 'bg-gradient-to-b from-amber-500/95 via-orange-500/90 to-rose-600/95 border-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
            : 'bg-gradient-to-b from-amber-600/80 via-orange-600/70 to-rose-700/80 border-amber-500/30 shadow-lg'
        }`}
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {/* Scanning line effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-300/30 to-transparent"
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ height: '50%' }}
        />
        
        {/* Glow pulse */}
        <div className={`absolute inset-0 bg-gradient-to-b from-amber-300/20 via-transparent to-rose-300/20 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
        
        {/* Icon with glow */}
        <div className="relative">
          <ShoppingBag className="w-5 h-5 text-white rotate-90 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        </div>
        
        {/* Text with gradient */}
        <span className="relative tracking-[0.2em] text-[11px] font-bold bg-gradient-to-b from-white via-amber-100 to-orange-200 bg-clip-text text-transparent drop-shadow-lg">
          SHOP
        </span>
      </motion.button>
    </div>
  );
});

export default ShopSideTab;
