import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Sticky Bottom CTA - Persistent conversion bar for non-logged-in users
 * Appears after scrolling past the hero section
 */
export const StickyBottomCTA = memo(function StickyBottomCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Don't show to logged-in users or if dismissed this session
    if (user || isDismissed) return;

    const handleScroll = () => {
      // Show after scrolling 600px
      const scrolled = window.scrollY > 600;
      setIsVisible(scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleCTA = () => {
    navigate('/pricing');
  };

  if (user) return null;

  return (
    <AnimatePresence>
      {isVisible && !isDismissed && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[160] bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Message */}
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary hidden sm:block" />
                <div>
                  <p className="font-semibold text-foreground text-sm sm:text-base">
                    Ready to dominate your SEO?
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Start your free trial • No credit card required
                  </p>
                </div>
              </div>

              {/* Right: CTAs */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCTA}
                  className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white font-semibold group"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <button
                  onClick={handleDismiss}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default StickyBottomCTA;
