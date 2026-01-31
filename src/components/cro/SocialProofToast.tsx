import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Clock, Star, ShoppingBag, UserPlus } from 'lucide-react';

interface ProofEvent {
  type: 'signup' | 'purchase' | 'review';
  name: string;
  location: string;
  time: string;
  product?: string;
  rating?: number;
}

// Realistic fake data for social proof
const PROOF_EVENTS: ProofEvent[] = [
  { type: 'signup', name: 'Michael R.', location: 'New York, NY', time: '2 min ago' },
  { type: 'purchase', name: 'Sarah K.', location: 'Los Angeles, CA', time: '5 min ago', product: 'Business CEO' },
  { type: 'signup', name: 'David L.', location: 'Austin, TX', time: '8 min ago' },
  { type: 'review', name: 'Jennifer M.', location: 'Chicago, IL', time: '12 min ago', rating: 5 },
  { type: 'purchase', name: 'Robert T.', location: 'Miami, FL', time: '15 min ago', product: 'BRON Package' },
  { type: 'signup', name: 'Emily W.', location: 'Seattle, WA', time: '18 min ago' },
  { type: 'purchase', name: 'James B.', location: 'Denver, CO', time: '22 min ago', product: 'VI Dashboard' },
  { type: 'review', name: 'Lisa P.', location: 'Boston, MA', time: '25 min ago', rating: 5 },
  { type: 'signup', name: 'Chris H.', location: 'San Francisco, CA', time: '28 min ago' },
  { type: 'purchase', name: 'Amanda S.', location: 'Phoenix, AZ', time: '32 min ago', product: 'Agency Plan' },
];

interface SocialProofToastProps {
  /** Interval between toasts (ms) */
  intervalMs?: number;
  /** Duration toast is visible (ms) */
  displayMs?: number;
  /** Initial delay before first toast (ms) */
  initialDelayMs?: number;
}

/**
 * Social Proof Notifications - Shows recent activity toasts
 * "John from NYC just signed up" style notifications
 */
export const SocialProofToast = memo(function SocialProofToast({
  intervalMs = 45000, // 45 seconds between toasts
  displayMs = 5000,   // 5 seconds visible
  initialDelayMs = 15000, // 15 seconds before first
}: SocialProofToastProps) {
  const [currentEvent, setCurrentEvent] = useState<ProofEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [eventIndex, setEventIndex] = useState(0);

  useEffect(() => {
    // Check if user dismissed toasts
    const dismissed = sessionStorage.getItem('social_proof_dismissed');
    if (dismissed) return;

    // Initial delay
    const initialTimer = setTimeout(() => {
      showNextToast();
    }, initialDelayMs);

    return () => clearTimeout(initialTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNextToast = () => {
    const event = PROOF_EVENTS[eventIndex % PROOF_EVENTS.length];
    setCurrentEvent(event);
    setIsVisible(true);
    setEventIndex((prev) => prev + 1);

    // Hide after display duration
    setTimeout(() => {
      setIsVisible(false);
      
      // Schedule next toast
      setTimeout(showNextToast, intervalMs);
    }, displayMs);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('social_proof_dismissed', 'true');
  };

  const getIcon = (type: ProofEvent['type']) => {
    switch (type) {
      case 'signup':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'purchase':
        return <ShoppingBag className="w-4 h-4 text-cyan-400" />;
      case 'review':
        return <Star className="w-4 h-4 text-amber-400 fill-amber-400" />;
    }
  };

  const getMessage = (event: ProofEvent) => {
    switch (event.type) {
      case 'signup':
        return 'just signed up';
      case 'purchase':
        return `purchased ${event.product}`;
      case 'review':
        return `left a ${event.rating}-star review`;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && currentEvent && (
        <motion.div
          initial={{ opacity: 0, x: -100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-6 z-[150] max-w-sm"
        >
          <div
            className="relative bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-2xl p-4 cursor-pointer hover:bg-card transition-colors"
            onClick={handleDismiss}
          >
            {/* Live indicator */}
            <div className="absolute -top-1 -right-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-white uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live
            </div>
            
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{currentEvent.name}</span>
                  {' '}
                  <span className="text-muted-foreground">{getMessage(currentEvent)}</span>
                </p>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {currentEvent.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {currentEvent.time}
                  </span>
                </div>
              </div>
              
              {/* Type icon */}
              <div className="flex-shrink-0">
                {getIcon(currentEvent.type)}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default SocialProofToast;
