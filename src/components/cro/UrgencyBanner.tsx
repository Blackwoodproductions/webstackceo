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
          className="fixed top-[64px] left-0 right-0 z-40"
        >
          {/* Futuristic glassmorphism container */}
          <div className="relative overflow-hidden">
            {/* Multi-layer gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-violet-500/15 to-primary/10" />
            
            {/* Animated scanning line */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{ width: '50%' }}
            />
            
            {/* Top highlight border */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            
            {/* Bottom glow border */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
            
            {/* Content */}
            <div className="relative container mx-auto px-6 py-3">
              <div className="flex items-center justify-between gap-6">
                {/* Left: Offer text with futuristic styling */}
                <div className="flex items-center gap-4">
                  {/* Animated icon container */}
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-400/40 flex items-center justify-center backdrop-blur-sm shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                    >
                      <Flame className="w-5 h-5 text-amber-400" />
                    </motion.div>
                    {/* Pulse ring */}
                    <motion.div
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 rounded-xl border border-amber-400/50"
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/80 font-medium">
                      Limited Time Offer
                    </span>
                    <span className="font-bold text-sm sm:text-base text-white">
                      Flash Sale: <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">{discount}% OFF</span> all plans
                    </span>
                  </div>
                </div>
                
                {/* Center: Countdown & Spots - High-tech display */}
                <div className="hidden md:flex items-center gap-8">
                  {/* Countdown - Digital display style */}
                  {showCountdown && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-muted-foreground/80">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs uppercase tracking-wider">Ends in</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        <div className="relative">
                          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-cyan-500/30 rounded-lg px-3 py-1.5 shadow-[0_0_15px_rgba(6,182,212,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <span className="text-lg font-bold bg-gradient-to-b from-white to-cyan-100 bg-clip-text text-transparent">
                              {formatTime(timeLeft.hours)}
                            </span>
                          </div>
                        </div>
                        <span className="text-cyan-400 font-bold text-lg animate-pulse">:</span>
                        <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-cyan-500/30 rounded-lg px-3 py-1.5 shadow-[0_0_15px_rgba(6,182,212,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]">
                          <span className="text-lg font-bold bg-gradient-to-b from-white to-cyan-100 bg-clip-text text-transparent">
                            {formatTime(timeLeft.minutes)}
                          </span>
                        </div>
                        <span className="text-cyan-400 font-bold text-lg animate-pulse">:</span>
                        <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-cyan-500/30 rounded-lg px-3 py-1.5 shadow-[0_0_15px_rgba(6,182,212,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]">
                          <span className="text-lg font-bold bg-gradient-to-b from-white to-cyan-100 bg-clip-text text-transparent">
                            {formatTime(timeLeft.seconds)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Divider */}
                  <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                  
                  {/* Spots left - Scarcity indicator */}
                  {showSpots && (
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/30 to-purple-600/20 border border-violet-400/40 flex items-center justify-center">
                          <Users className="w-4 h-4 text-violet-400" />
                        </div>
                        {/* Active indicator */}
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-violet-400/80">Availability</span>
                        <span className="text-sm font-semibold text-white">
                          Only <span className="text-amber-400 font-bold">{spotsLeft}</span> spots left
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right: CTA & Close - Premium button design */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleClaim}
                    size="sm"
                    className="relative group overflow-hidden bg-gradient-to-r from-cyan-500 via-primary to-violet-500 hover:from-cyan-400 hover:via-primary hover:to-violet-400 text-white font-bold shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] border-0 px-5 py-2 transition-all duration-300"
                  >
                    {/* Button shine effect */}
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                    <span className="relative flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span>Claim Offer</span>
                    </span>
                  </Button>
                  
                  <button
                    onClick={handleDismiss}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200"
                  >
                    <X className="w-4 h-4 text-white/60 hover:text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default UrgencyBanner;
