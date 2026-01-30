import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { Store, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShopModal } from '@/components/shop/ShopModal';
import { CartProvider } from '@/contexts/CartContext';
import { CartDrawer } from '@/components/shop/CartDrawer';

// Inner component that uses cart context
const ShopSideTabInner = memo(function ShopSideTabInner() {
  const [isHovered, setIsHovered] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const { user } = useAuth();
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
    if (user) {
      // Logged in: open the shop modal
      setIsShopOpen(true);
    } else {
      // Not logged in: navigate to pricing
      navigate('/pricing');
    }
  };

  if (tabOpacity === 0) return null;

  return (
    <>
      <div 
        className="fixed left-0 z-[100] flex items-center transition-all duration-500"
        style={{ top: topPosition, opacity: tabOpacity }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Holographic Glass Tab - Distinct from right-side tabs */}
        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.05, x: 3 }}
          whileTap={{ scale: 0.95 }}
          className="relative group"
        >
          {/* Outer glow ring */}
          <motion.div
            className={`absolute -inset-1 rounded-r-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 blur-md transition-opacity duration-500 ${
              isHovered ? 'opacity-80' : 'opacity-40'
            }`}
            animate={isHovered ? { 
              rotate: [0, 5, -5, 0],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Main button container */}
          <div
            className={`relative flex flex-col items-center gap-2 py-5 px-3 rounded-r-3xl border border-l-0 backdrop-blur-xl transition-all duration-500 ${
              isHovered
                ? 'bg-gradient-to-b from-slate-900/95 via-slate-800/90 to-slate-900/95 border-white/30 shadow-[0_0_40px_rgba(168,85,247,0.4)]'
                : 'bg-gradient-to-b from-slate-900/80 via-slate-800/70 to-slate-900/80 border-white/10 shadow-xl'
            }`}
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            {/* Holographic shimmer effect */}
            <motion.div
              className="absolute inset-0 rounded-r-3xl overflow-hidden"
              style={{ mixBlendMode: 'overlay' }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-transparent to-cyan-500/20"
                animate={{ 
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
            
            {/* Rainbow border animation on hover */}
            <motion.div
              className={`absolute inset-0 rounded-r-3xl transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(236,72,153,0.3) 25%, rgba(168,85,247,0.3) 50%, rgba(34,211,238,0.3) 75%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
              animate={isHovered ? { backgroundPosition: ['200% 0%', '-200% 0%'] } : {}}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            
            {/* Sparkle icon */}
            <motion.div
              className="relative"
              animate={isHovered ? { 
                rotate: [0, 15, -15, 0],
                scale: [1, 1.2, 1],
              } : {}}
              transition={{ duration: 0.6 }}
            >
              <Sparkles className={`w-4 h-4 transition-colors duration-300 ${isHovered ? 'text-pink-400' : 'text-purple-400'}`} />
            </motion.div>
            
            {/* Store icon */}
            <div className="relative">
              <Store className={`w-5 h-5 transition-all duration-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)] ${
                isHovered ? 'text-white' : 'text-purple-200'
              }`} />
            </div>
            
            {/* Text with rainbow gradient on hover */}
            <span className={`relative tracking-[0.25em] text-[10px] font-black uppercase transition-all duration-300 ${
              isHovered 
                ? 'bg-gradient-to-b from-pink-300 via-purple-200 to-cyan-300 bg-clip-text text-transparent'
                : 'bg-gradient-to-b from-purple-200 via-white to-purple-200 bg-clip-text text-transparent'
            }`}>
              SHOP
            </span>
            
            {/* Pulsing dot indicator */}
            <motion.div
              className="relative w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.button>
      </div>

      {/* Shop Modal for logged-in users */}
      <ShopModal open={isShopOpen} onOpenChange={setIsShopOpen} />
      
      {/* Cart Drawer - controlled by CartContext */}
      <CartDrawer />
    </>
  );
});

// Wrapper component that provides CartContext
export const ShopSideTab = memo(function ShopSideTab() {
  return (
    <CartProvider>
      <ShopSideTabInner />
    </CartProvider>
  );
});

export default ShopSideTab;
