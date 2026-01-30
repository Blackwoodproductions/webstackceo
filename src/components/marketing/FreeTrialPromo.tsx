import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BarChart3, Zap, ChevronRight, Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FreeTrialPromoProps {
  variant?: 'popup' | 'banner' | 'footer' | 'side-tab';
  onClose?: () => void;
}

export function FreeTrialPromo({ variant = 'popup', onClose }: FreeTrialPromoProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Side tab scroll positioning (staggered at 40% - higher than beta tab)
  const [topPosition, setTopPosition] = useState('40%');
  const [tabOpacity, setTabOpacity] = useState(1);
  const throttleRef = useRef(false);

  // Show popup after delay (only for popup variant)
  useEffect(() => {
    if (variant === 'popup') {
      const dismissed = sessionStorage.getItem('free_trial_promo_dismissed');
      if (dismissed || user) return;

      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [variant, user]);

  // Handle scroll to stop above footer and fade out
  useEffect(() => {
    if (variant !== 'side-tab') return;
    
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
        const defaultTop = window.innerHeight * 0.40;
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
          setTopPosition('40%');
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
  }, [variant]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error('Sign in failed. Please try again.');
        console.error('OAuth error:', error);
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
      console.error('Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('free_trial_promo_dismissed', 'true');
    onClose?.();
  };

  // Already logged in - don't show promo
  if (user) return null;

  // Side tab variant (left side of screen) - Futuristic Design
  if (variant === 'side-tab') {
    if (tabOpacity === 0) return null;
    
    return (
      <div 
        className="fixed left-0 z-[100] flex items-center transition-all duration-500"
        style={{ top: topPosition, opacity: tabOpacity }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Futuristic Tab Handle */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.02, x: 2 }}
          whileTap={{ scale: 0.98 }}
          className={`relative flex flex-col items-center gap-1.5 py-4 px-2 overflow-hidden rounded-r-2xl border border-l-0 transition-all duration-500 ${
            isHovered || isExpanded
              ? 'bg-gradient-to-b from-emerald-500/95 via-teal-500/90 to-cyan-600/95 border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
              : 'bg-gradient-to-b from-emerald-600/80 via-teal-600/70 to-cyan-700/80 border-emerald-500/30 shadow-lg'
          }`}
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
        >
          {/* Scanning line effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-transparent"
            animate={{ y: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ height: '50%' }}
          />
          
          {/* Glow pulse */}
          <div className={`absolute inset-0 bg-gradient-to-b from-emerald-300/20 via-transparent to-cyan-300/20 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
          
          {/* Icon with glow */}
          <div className="relative">
            <Gift className="w-5 h-5 text-white rotate-90 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          </div>
          
          {/* Text with gradient */}
          <span className="relative tracking-[0.2em] text-[11px] font-bold bg-gradient-to-b from-white via-emerald-100 to-cyan-200 bg-clip-text text-transparent drop-shadow-lg">
            FREE
          </span>
          
          {/* Chevron with animation */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight className="w-3.5 h-3.5 text-cyan-200" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="ml-2 relative overflow-hidden"
            >
              {/* Glassmorphism panel */}
              <div className="relative backdrop-blur-xl bg-gradient-to-b from-emerald-950/80 via-teal-900/70 to-cyan-950/80 border border-emerald-400/30 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] p-5 max-w-[300px]">
                {/* Animated border glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-400/20 to-emerald-500/20 animate-pulse" />
                
                {/* Inner content */}
                <div className="relative flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 border border-emerald-400/30">
                      <Sparkles className="w-5 h-5 text-emerald-300" />
                    </div>
                    <span className="text-white font-bold text-base bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                      Start Free!
                    </span>
                  </div>
                  
                  {/* Description */}
                  <p className="text-white/70 text-sm leading-relaxed">
                    Get your first website <strong className="text-emerald-300">FREE</strong> with Google Sign-in. No credit card required.
                  </p>
                  
                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-200/90 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-3 py-1.5">
                      <BarChart3 className="w-3 h-3" />
                      Analytics
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-cyan-200/90 bg-cyan-500/20 border border-cyan-400/30 rounded-full px-3 py-1.5">
                      <Zap className="w-3 h-3" />
                      SEO Tools
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-white via-emerald-50 to-white text-emerald-700 hover:from-emerald-50 hover:via-white hover:to-emerald-50 text-sm h-10 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isLoading ? 'Signing in...' : 'Claim Free'}
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Banner variant (top of page)
  if (variant === 'banner') {
    return (
      <div className="relative bg-gradient-to-r from-violet-600 via-primary to-cyan-500 text-white py-2 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/80 via-primary/80 to-cyan-500/80 backdrop-blur-sm" />
        <div className="relative max-w-7xl mx-auto flex items-center justify-center gap-4 text-sm">
          <Gift className="w-4 h-4 animate-bounce" />
          <span className="font-medium">
            🎉 Limited Time: Get your <strong>first website FREE</strong> with Google Sign-in!
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Claim Now'}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // Footer CTA variant
  if (variant === 'footer') {
    return (
      <div className="bg-gradient-to-br from-primary/10 via-violet-500/10 to-cyan-500/10 border border-primary/20 rounded-2xl p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold text-foreground">Start Free Today</h3>
          </div>
          <p className="text-muted-foreground mb-6">
            Sign in with Google to get <strong className="text-primary">free dashboard access</strong> and start monitoring your first website immediately.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              variant="hero"
              className="gap-2"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </Button>
            <p className="text-xs text-muted-foreground">No credit card required</p>
          </div>
        </div>
      </div>
    );
  }

  // Popup variant (floating modal)
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={handleDismiss}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[90vw] max-w-md"
          >
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-violet-500/10 to-cyan-500/10" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full" />
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              
              {/* Content */}
              <div className="relative p-8 text-center">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Get Your First Website <span className="text-primary">FREE</span>
                </h2>
                
                <p className="text-muted-foreground mb-6">
                  Sign up now with Google and get instant access to our full dashboard—no credit card required.
                </p>
                
                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { icon: BarChart3, text: 'Live Analytics' },
                    { icon: Zap, text: 'SEO Monitoring' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
                      <Icon className="w-4 h-4 text-primary" />
                      {text}
                    </div>
                  ))}
                </div>
                
                {/* CTA */}
                <Button
                  size="lg"
                  variant="hero"
                  className="w-full gap-2"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {isLoading ? 'Signing in...' : 'Claim Free Access'}
                </Button>
                
                <p className="text-xs text-muted-foreground mt-4">
                  By signing up, you agree to our Terms of Service
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default FreeTrialPromo;
