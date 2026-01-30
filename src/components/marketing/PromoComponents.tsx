import { memo } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Star, Sparkles, TrendingUp, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export const HeroPromo = memo(function HeroPromo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="relative mt-8 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-violet-500/10 to-cyan-500/10 border border-primary/20 max-w-2xl mx-auto"
    >
      {/* Glow effect */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/20 via-violet-500/20 to-cyan-500/20 blur-xl opacity-50" />
      
      <div className="relative">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Limited Time Offer
          </Badge>
        </div>
        
        <h3 className="text-xl md:text-2xl font-bold text-center mb-2">
          First Website{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            FREE
          </span>
        </h3>
        
        <p className="text-center text-muted-foreground text-sm mb-4">
          Sign in with Google to get free dashboard access & visitor intelligence for your first domain.
        </p>
        
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {['Visitor Analytics', 'SEO Insights', 'Live Tracking'].map((feature) => (
            <span key={feature} className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="w-3 h-3 text-emerald-400" />
              {feature}
            </span>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-gradient-to-r from-primary to-violet-500 hover:opacity-90">
            <Link to="/auth">
              <Zap className="w-4 h-4 mr-2" />
              Get Started Free
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-primary/30 hover:bg-primary/10">
            <a href="#services">
              View Services
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

export const StickyPromoBar = memo(function StickyPromoBar() {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 2 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-primary via-violet-500 to-cyan-500 text-white py-3 px-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
            <Star className="w-3 h-3" />
            Special Offer
          </div>
          <p className="text-sm font-medium">
            <span className="hidden sm:inline">🚀 Launch Special: </span>
            Get BRON + CADE Bundle and{' '}
            <span className="font-bold">Save $50</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="bg-white text-primary hover:bg-white/90 font-semibold"
          >
            <a href="#services">
              Shop Now
              <ArrowRight className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

export const TrustBadges = memo(function TrustBadges() {
  return (
    <div className="flex flex-wrap justify-center gap-6 py-8">
      {[
        { icon: Shield, label: 'SSL Secured' },
        { icon: TrendingUp, label: 'Proven Results' },
        { icon: Star, label: '5-Star Rated' },
      ].map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-2 text-muted-foreground text-sm">
          <Icon className="w-4 h-4 text-primary" />
          {label}
        </div>
      ))}
    </div>
  );
});
