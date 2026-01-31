import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Zap, Users, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCROSettings, trackCROInteraction } from '@/hooks/use-cro-settings';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Urgency Banner - Countdown timer and limited spots indicator
 * Creates FOMO with time-limited offers
 */
export const UrgencyBanner = memo(function UrgencyBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 23, minutes: 59, seconds: 59 });
  const [spotsLeft, setSpotsLeft] = useState(7);
  const navigate = useNavigate();
  const { isEnabled, getConfig, loading: settingsLoading } = useCROSettings();

  // Get config from admin settings
  const discount = getConfig('urgency_banner', 'discount', 30);
  const showCountdown = getConfig('urgency_banner', 'show_countdown', true);
  const showSpots = getConfig('urgency_banner', 'show_spots', true);

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
    }, 3000);

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

    // Slowly decrease spots (for FOMO)
    const spotsInterval = setInterval(() => {
      setSpotsLeft((prev) => {
        if (prev <= 3) return prev; // Keep at least 3
        return Math.random() > 0.7 ? prev - 1 : prev;
      });
    }, 60000); // Check every minute

    return () => {
      clearTimeout(showTimer);
      clearInterval(interval);
      clearInterval(spotsInterval);
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
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-[64px] left-0 right-0 z-40 bg-gradient-to-r from-primary via-cyan-600 to-violet-600 text-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Offer text */}
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-amber-300 animate-pulse" />
                <span className="font-semibold text-sm sm:text-base">
                  🔥 Flash Sale: <span className="text-amber-300">{discount}% OFF</span> all plans today only!
                </span>
              </div>
              
              {/* Center: Countdown & Spots */}
              <div className="hidden md:flex items-center gap-6">
                {/* Countdown */}
                {showCountdown && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Ends in:</span>
                    <div className="flex items-center gap-1 font-mono font-bold">
                      <span className="bg-white/20 px-2 py-0.5 rounded">
                        {formatTime(timeLeft.hours)}
                      </span>
                      <span>:</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded">
                        {formatTime(timeLeft.minutes)}
                      </span>
                      <span>:</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded">
                        {formatTime(timeLeft.seconds)}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Spots left */}
                {showSpots && (
                  <div className="flex items-center gap-2 text-amber-200">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Only <span className="font-bold">{spotsLeft}</span> spots left!
                    </span>
                  </div>
                )}
              </div>
              
              {/* Right: CTA & Close */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleClaim}
                  size="sm"
                  className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Claim Offer
                </Button>
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default UrgencyBanner;
