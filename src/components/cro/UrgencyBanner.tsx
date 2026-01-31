import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCROSettings, trackCROInteraction } from '@/hooks/use-cro-settings';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Urgency Banner - Subtle floating corner badge with countdown
 * Elegant, non-intrusive FOMO indicator
 */
export const UrgencyBanner = memo(function UrgencyBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 23, minutes: 59, seconds: 59 });
  const navigate = useNavigate();
  const { isEnabled, getConfig, loading: settingsLoading } = useCROSettings();

  // Get config from admin settings
  const discount = getConfig('urgency_banner', 'discount', 30);
  const showCountdown = getConfig('urgency_banner', 'show_countdown', true);

  useEffect(() => {
    // Check if disabled in admin
    if (settingsLoading) return;
    if (!isEnabled('urgency_banner')) return;
    
    // Check if banner was dismissed today
    const dismissed = localStorage.getItem('urgency_banner_dismissed');
    if (dismissed) {
      const dismissedDate = new Date(parseInt(dismissed, 10));
      const today = new Date();
      if (
        dismissedDate.getDate() === today.getDate() &&
        dismissedDate.getMonth() === today.getMonth()
      ) {
        return; // Don't show if dismissed today
      }
    }

    // Show banner after short delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      trackCROInteraction('urgency_banner', 'view');
    }, 4000);

    // Initialize countdown based on time until midnight
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);
      
      const diff = midnight.getTime() - now.getTime();
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(interval);
    };
  }, [isEnabled, settingsLoading]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('urgency_banner_dismissed', Date.now().toString());
    trackCROInteraction('urgency_banner', 'dismiss');
  };

  const handleClaim = () => {
    trackCROInteraction('urgency_banner', 'click');
    navigate('/pricing');
    handleDismiss();
  };

  const formatTime = (n: number) => n.toString().padStart(2, '0');

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 100, opacity: 0, scale: 0.9 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50"
        >
          {/* Floating card - subtle glassmorphism */}
          <div className="relative group cursor-pointer" onClick={handleClaim}>
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 via-violet-500/40 to-cyan-500/40 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
            
            {/* Main card */}
            <div className="relative bg-background/95 dark:bg-slate-900/95 backdrop-blur-xl border border-border/50 dark:border-white/10 rounded-2xl p-4 shadow-2xl min-w-[200px]">
              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="absolute -top-2 -right-2 p-1.5 rounded-full bg-muted hover:bg-muted-foreground/20 border border-border/50 dark:border-white/10 transition-colors z-10"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
              
              {/* Content */}
              <div className="flex flex-col gap-3">
                {/* Header with icon */}
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 dark:from-amber-500/30 dark:to-orange-500/20 border border-amber-400/30 flex items-center justify-center"
                  >
                    <Flame className="w-4 h-4 text-amber-500" />
                  </motion.div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Flash Sale
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{discount}% OFF</span>
                    </p>
                  </div>
                </div>
                
                {/* Countdown - compact */}
                {showCountdown && (
                  <div className="flex items-center justify-center gap-1 font-mono text-xs">
                    <div className="bg-muted/80 dark:bg-slate-800/80 rounded px-2 py-1 border border-border/30 dark:border-cyan-500/20">
                      <span className="font-bold text-foreground">{formatTime(timeLeft.hours)}</span>
                    </div>
                    <span className="text-primary font-bold">:</span>
                    <div className="bg-muted/80 dark:bg-slate-800/80 rounded px-2 py-1 border border-border/30 dark:border-cyan-500/20">
                      <span className="font-bold text-foreground">{formatTime(timeLeft.minutes)}</span>
                    </div>
                    <span className="text-primary font-bold">:</span>
                    <div className="bg-muted/80 dark:bg-slate-800/80 rounded px-2 py-1 border border-border/30 dark:border-cyan-500/20">
                      <span className="font-bold text-foreground">{formatTime(timeLeft.seconds)}</span>
                    </div>
                  </div>
                )}
                
                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-primary to-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg hover:shadow-primary/25 transition-shadow"
                >
                  <Zap className="w-3 h-3" />
                  Claim Offer
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default UrgencyBanner;
