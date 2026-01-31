import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Side tab scroll positioning (staggered at 55% - between FREE at 40% and BETA at 60%)
  const [topPosition, setTopPosition] = useState('55%');
  const [tabOpacity, setTabOpacity] = useState(1);
  const throttleRef = useRef(false);

  // Listen for chat widget and AI assistant open/close events
  useEffect(() => {
    const handleChatState = (e: CustomEvent<{ isOpen: boolean }>) => {
      setIsChatOpen(e.detail.isOpen);
    };
    
    const handleAiAssistantState = (e: CustomEvent<{ isOpen: boolean }>) => {
      setIsAiAssistantOpen(e.detail.isOpen);
    };
    
    window.addEventListener('chat-widget-state', handleChatState as EventListener);
    window.addEventListener('ai-assistant-state', handleAiAssistantState as EventListener);
    return () => {
      window.removeEventListener('chat-widget-state', handleChatState as EventListener);
      window.removeEventListener('ai-assistant-state', handleAiAssistantState as EventListener);
    };
  }, []);

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

  // Hide shop tab completely when AI assistant is open
  if (isAiAssistantOpen) return null;
  if (tabOpacity === 0 && !isChatOpen) return null;

  // Compact badge for chat header
  const ChatHeaderBadge = (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-500 text-white text-xs font-bold uppercase tracking-wide shadow-lg"
    >
      <Store className="w-3.5 h-3.5" />
      <span>Shop</span>
      <Sparkles className="w-3 h-3 text-amber-300" />
    </motion.button>
  );


  return (
    <>
      {/* Animate between positions */}
      <AnimatePresence mode="wait">
        {isChatOpen ? (
          // Render in chat header area (portal-like positioning)
          <motion.div
            key="chat-header-shop"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed bottom-[calc(6px+500px-60px)] right-[calc(6px+320px-80px)] sm:right-[calc(6px+384px-80px)] z-[60]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {ChatHeaderBadge}
          </motion.div>
        ) : (
          <>
            {/* SHOP side tab position */}
            <motion.div
              key="side-tab-shop"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: tabOpacity, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="fixed left-0 z-[100] flex items-center"
              style={{ top: topPosition }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Holographic Glass Tab - Horizontal pink design */}
              <motion.button
                onClick={handleClick}
                whileHover={{ scale: 1.08, x: 6 }}
                whileTap={{ scale: 0.95 }}
                className="relative group"
              >
                {/* Outer glow ring - Pink themed */}
                <motion.div
                  className={`absolute -inset-1.5 rounded-r-2xl blur-lg transition-all duration-500 ${
                    isHovered 
                      ? 'opacity-100 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600' 
                      : 'opacity-50 bg-pink-500/60'
                  }`}
                  animate={isHovered ? { 
                    scale: [1, 1.05, 1],
                  } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                
                {/* Main button container - Horizontal layout */}
                <div
                  className={`relative flex flex-col items-center gap-1.5 py-4 px-3 rounded-r-2xl border border-l-0 backdrop-blur-xl transition-all duration-500 overflow-hidden ${
                    isHovered
                      ? 'bg-gradient-to-br from-pink-950/95 via-rose-900/90 to-pink-950/95 border-pink-400/50 shadow-[0_0_50px_rgba(236,72,153,0.5)]'
                      : 'bg-gradient-to-br from-pink-950/80 via-rose-950/70 to-pink-950/80 border-pink-500/30 shadow-[0_0_25px_rgba(236,72,153,0.25)]'
                  }`}
                >
                  {/* Scanning line animation */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ opacity: isHovered ? 1 : 0.5 }}
                  >
                    <motion.div
                      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400 to-transparent"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  </motion.div>
                  
                  {/* SHOP text - Horizontal on top, bigger */}
                  <span className={`relative text-sm font-black uppercase tracking-widest transition-all duration-300 ${
                    isHovered 
                      ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]'
                      : 'bg-gradient-to-r from-pink-200 via-rose-200 to-pink-200 bg-clip-text text-transparent'
                  }`}>
                    SHOP
                  </span>
                  
                  {/* Icons row below text */}
                  <div className="flex items-center gap-1.5">
                    {/* Pulsing dot */}
                    <motion.div
                      className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-rose-400"
                      animate={{ 
                        scale: [1, 1.4, 1],
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    
                    {/* Store icon */}
                    <motion.div
                      animate={isHovered ? { y: [-1, 1, -1] } : {}}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      <Store className={`w-5 h-5 transition-all duration-300 ${
                        isHovered ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-pink-300'
                      }`} />
                    </motion.div>
                    
                    {/* Sparkle icon */}
                    <motion.div
                      animate={isHovered ? { 
                        rotate: [0, 20, -20, 0],
                        scale: [1, 1.2, 1],
                      } : {}}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      <Sparkles className={`w-4 h-4 transition-all duration-300 ${
                        isHovered ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-pink-400'
                      }`} />
                    </motion.div>
                  </div>
                  
                  {/* Shimmer overlay on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={isHovered ? { x: '100%' } : { x: '-100%' }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  />
                </div>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
