import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Zap, ArrowRight, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useCROSettings, trackCROInteraction } from '@/hooks/use-cro-settings';

interface ExitIntentPopupProps {
  /** Delay before exit intent is active (ms) */
  delayMs?: number;
  /** Cookie expiry days for dismissed popup */
  dismissDays?: number;
}

/**
 * Exit-Intent Popup - Captures leaving visitors with special offers
 * Triggers when mouse moves toward browser chrome (top of viewport)
 */
export const ExitIntentPopup = memo(function ExitIntentPopup({
  delayMs = 5000,
  dismissDays = 3,
}: ExitIntentPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const { user } = useAuth();
  const { isEnabled: isCROEnabled, getConfig, loading: settingsLoading } = useCROSettings();

  // Get config from admin settings
  const discount = getConfig('exit_intent_popup', 'discount', 25);
  const configDelay = getConfig('exit_intent_popup', 'delay_ms', delayMs);
  const configDismissDays = getConfig('exit_intent_popup', 'dismiss_days', dismissDays);

  // Check if popup was recently dismissed
  const wasRecentlyDismissed = useCallback(() => {
    const dismissed = localStorage.getItem('exit_intent_dismissed');
    if (!dismissed) return false;
    const dismissedTime = parseInt(dismissed, 10);
    const daysSince = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    return daysSince < configDismissDays;
  }, [configDismissDays]);

  // Enable exit intent after delay (only if CRO is enabled)
  useEffect(() => {
    // Don't show to logged-in users, recently dismissed, or if disabled in admin
    if (user || wasRecentlyDismissed() || settingsLoading) return;
    if (!isCROEnabled('exit_intent_popup')) return;

    const timer = setTimeout(() => {
      setIsEnabled(true);
    }, configDelay);

    return () => clearTimeout(timer);
  }, [user, configDelay, wasRecentlyDismissed, isCROEnabled, settingsLoading]);

  // Detect exit intent (mouse moving to top of viewport)
  useEffect(() => {
    if (!isEnabled) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves through the top
      if (e.clientY <= 5 && !isVisible) {
        setIsVisible(true);
        trackCROInteraction('exit_intent_popup', 'view');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isEnabled, isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('exit_intent_dismissed', Date.now().toString());
    trackCROInteraction('exit_intent_popup', 'dismiss');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    // Track conversion
    trackCROInteraction('exit_intent_popup', 'convert', { email });
    console.log('[ExitIntent] Lead captured:', email);
    setIsSubmitted(true);
    
    // Store for future reference
    localStorage.setItem('exit_intent_lead', email);
    localStorage.setItem('exit_intent_dismissed', Date.now().toString());
    
    // Auto-close after success
    setTimeout(() => setIsVisible(false), 3000);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200]"
            onClick={handleDismiss}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-full max-w-lg mx-4"
          >
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Animated gradient border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-cyan-500 to-violet-500 opacity-20 blur-xl" />
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors z-10"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <div className="relative p-8">
                {!isSubmitted ? (
                  <>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-cyan-500 shadow-lg shadow-primary/30">
                        <Gift className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                          Wait! Before you go...
                        </p>
                        <h3 className="text-2xl font-bold text-foreground">
                          Get {discount}% Off Your First Month
                        </h3>
                      </div>
                    </div>
                    
                    {/* Value props */}
                    <div className="space-y-2 mb-6">
                      {[
                        'Unlimited SEO audits & monitoring',
                        'AI-powered content automation',
                        'Real-time visitor intelligence',
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-muted-foreground">
                          <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Email form */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-12 bg-background/50"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white font-semibold group"
                        onClick={() => trackCROInteraction('exit_intent_popup', 'click')}
                      >
                        Claim My {discount}% Discount
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </form>
                    
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      No spam. Unsubscribe anytime. Limited time offer.
                    </p>
                  </>
                ) : (
                  /* Success state */
                  <div className="text-center py-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      You're All Set! 🎉
                    </h3>
                    <p className="text-muted-foreground">
                      Check your inbox for your exclusive discount code.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default ExitIntentPopup;
