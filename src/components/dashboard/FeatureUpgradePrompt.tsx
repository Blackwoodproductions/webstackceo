import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Crown, Lock, Zap, TrendingUp, FileText, BrainCircuit, MapPin, Activity, FileSearch, Target, Globe, Bot
} from 'lucide-react';

export type FeatureType = 'bron' | 'cade' | 'aeo-geo' | 'gmb' | 'social-signals' | 'on-page-seo' | 'landing-pages' | 'vi-domain' | 'web-builder' | 'ai-assistant';

interface FeatureUpgradePromptProps {
  feature: FeatureType;
  onUpgrade?: () => void;
  className?: string;
}

const featureConfig: Record<FeatureType, {
  name: string;
  description: string;
  icon: typeof TrendingUp;
  price: string;
  priceSubtext?: string;
  color: string;
  benefits: string[];
  cta: string;
  tier: string;
}> = {
  'bron': {
    name: 'BRON SEO Rankings',
    description: 'Unlock powerful keyword tracking, backlink monitoring, and SEO analytics',
    icon: TrendingUp,
    price: '$75',
    priceSubtext: '/month',
    color: 'emerald',
    benefits: [
      '15 keyword phrases tracked',
      'Bi-weekly ranking reports',
      '15 SEO rich content pages',
      'DA/DR booster included'
    ],
    cta: 'Activate BRON Package',
    tier: 'Business CEO'
  },
  'cade': {
    name: 'CADE AI Content',
    description: 'Automated AI-powered content generation tied to your BRON subscription',
    icon: FileText,
    price: 'Included',
    priceSubtext: 'with BRON',
    color: 'amber',
    benefits: [
      '2 articles/month (basic)',
      'SEO-optimized content',
      'Auto-publish capability',
      'FAQ generation'
    ],
    cta: 'Requires BRON Package',
    tier: 'Business CEO'
  },
  'aeo-geo': {
    name: 'AEO/GEO LLM Training',
    description: 'Track your brand visibility across AI models like ChatGPT, Gemini & Perplexity',
    icon: BrainCircuit,
    price: '$2',
    priceSubtext: '/keyword/month',
    color: 'violet',
    benefits: [
      'Multi-model LLM tracking',
      'Citation monitoring',
      'Training insights',
      'Prominence scoring'
    ],
    cta: 'Add to BRON Package',
    tier: 'Add-on'
  },
  'gmb': {
    name: 'Google Business Profile',
    description: 'Optimize your local SEO with Google Business Profile management',
    icon: MapPin,
    price: 'Included',
    priceSubtext: 'with BRON',
    color: 'sky',
    benefits: [
      'Profile optimization',
      'Review management',
      'Post scheduling',
      'Insights analytics'
    ],
    cta: 'Requires BRON Package',
    tier: 'Business CEO'
  },
  'social-signals': {
    name: 'Social Signals',
    description: 'Connect and manage your social media presence',
    icon: Activity,
    price: 'Included',
    priceSubtext: 'with BRON',
    color: 'blue',
    benefits: [
      'Multi-platform connect',
      'Social analytics',
      'Engagement tracking',
      'Brand monitoring'
    ],
    cta: 'Requires BRON Package',
    tier: 'Business CEO'
  },
  'on-page-seo': {
    name: 'On-Page SEO Automation',
    description: 'AI-powered optimization that makes real changes to your website—not pixel injections',
    icon: FileSearch,
    price: '$99',
    priceSubtext: '/mo (≤500 pages)',
    color: 'amber',
    benefits: [
      'Direct platform editing (WordPress, Shopify, Wix, PHP/HTML)',
      'Auto meta tag & schema optimization',
      'Image alt text generation',
      'Real-time monitoring & auto-fix',
      '$199/mo for 501-2000 pages',
      '$299/mo for 2001-5000 pages',
      '$499/mo for 5000+ pages'
    ],
    cta: 'Activate On-Page SEO',
    tier: 'Premium Add-on'
  },
  'landing-pages': {
    name: 'PPC Landing Pages',
    description: 'High-converting landing pages for your paid campaigns',
    icon: Target,
    price: 'Contact',
    priceSubtext: 'for pricing',
    color: 'rose',
    benefits: [
      'Custom landing pages',
      'A/B testing',
      'Conversion tracking',
      'Google Ads integration'
    ],
    cta: 'Add PPC Pages',
    tier: 'Add-on'
  },
  'vi-domain': {
    name: 'Additional VI Domain',
    description: 'Add another domain to your Visitor Intelligence dashboard',
    icon: Zap,
    price: '$15',
    priceSubtext: '/month',
    color: 'cyan',
    benefits: [
      'Full VI dashboard access',
      'Real-time visitor tracking',
      'Session recordings',
      'Engagement analytics'
    ],
    cta: 'Add Domain',
    tier: 'Add-on'
  },
  'web-builder': {
    name: 'AI Website Generator',
    description: 'Build unlimited websites and applications with AI assistance',
    icon: Globe,
    price: '$125',
    priceSubtext: '/month',
    color: 'fuchsia',
    benefits: [
      'Unlimited AI website generation',
      'All templates included',
      'Inline AI editing assistant',
      'Export to any platform',
      'Mobile-responsive designs',
      'SEO-optimized code output'
    ],
    cta: 'Activate WEB Builder',
    tier: 'Premium Add-on'
  },
  'ai-assistant': {
    name: 'AI Assistant',
    description: 'Get expert SEO help with keyword research, domain onboarding, and troubleshooting',
    icon: Bot,
    price: 'Usage-based',
    priceSubtext: '',
    color: 'violet',
    benefits: [
      '30 min free for all users',
      '5 hours/week on paid plans',
      'Keyword research & analysis',
      'Domain onboarding help',
      'SEO troubleshooting',
      'Access to your Google data'
    ],
    cta: 'Upgrade for More Time',
    tier: 'All Plans'
  }
};

const colorClasses: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  emerald: {
    bg: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20'
  },
  amber: {
    bg: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20'
  },
  violet: {
    bg: 'from-violet-500/20 to-violet-500/5',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    glow: 'shadow-violet-500/20'
  },
  sky: {
    bg: 'from-sky-500/20 to-sky-500/5',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
    glow: 'shadow-sky-500/20'
  },
  blue: {
    bg: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20'
  },
  rose: {
    bg: 'from-rose-500/20 to-rose-500/5',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    glow: 'shadow-rose-500/20'
  },
  cyan: {
    bg: 'from-cyan-500/20 to-cyan-500/5',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20'
  },
  fuchsia: {
    bg: 'from-fuchsia-500/20 to-fuchsia-500/5',
    border: 'border-fuchsia-500/30',
    text: 'text-fuchsia-400',
    glow: 'shadow-fuchsia-500/20'
  }
};

export const FeatureUpgradePrompt = memo(function FeatureUpgradePrompt({
  feature,
  onUpgrade,
  className = ''
}: FeatureUpgradePromptProps) {
  const config = featureConfig[feature];
  const colors = colorClasses[config.color];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl border ${colors.border} bg-gradient-to-b ${colors.bg} p-8 ${className}`}
    >
      {/* Background glow */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${colors.bg} blur-3xl opacity-50`} />
      
      {/* Lock overlay pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)`,
          backgroundSize: '20px 20px'
        }} />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto">
        {/* Icon with lock */}
        <div className="relative mb-6">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${colors.bg} ${colors.border} border flex items-center justify-center shadow-xl ${colors.glow}`}>
            <Icon className={`w-10 h-10 ${colors.text}`} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Tier badge */}
        <Badge 
          variant="outline" 
          className={`mb-4 ${colors.border} ${colors.text} text-xs font-medium`}
        >
          {config.tier}
        </Badge>

        {/* Title */}
        <h3 className="text-2xl font-bold text-foreground mb-2">
          Unlock {config.name}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground mb-6">
          {config.description}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-6">
          <span className={`text-4xl font-bold ${colors.text}`}>{config.price}</span>
          {config.priceSubtext && (
            <span className="text-muted-foreground text-sm">{config.priceSubtext}</span>
          )}
        </div>

        {/* Benefits */}
        <ul className="space-y-2 mb-8 text-left w-full">
          {config.benefits.map((benefit, index) => (
            <motion.li
              key={benefit}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 text-sm text-muted-foreground"
            >
              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center`}>
                <Zap className={`w-3 h-3 ${colors.text}`} />
              </div>
              {benefit}
            </motion.li>
          ))}
        </ul>

        {/* CTA Button */}
        <Button
          size="lg"
          className={`w-full bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 text-white font-semibold shadow-lg`}
          asChild
        >
          <Link to="/pricing">
            <Crown className="w-4 h-4 mr-2" />
            {config.cta}
          </Link>
        </Button>

        {/* View all plans link */}
        <Link
          to="/pricing"
          className={`mt-4 text-sm ${colors.text} hover:underline`}
        >
          View all plans →
        </Link>
      </div>
    </motion.div>
  );
});

export default FeatureUpgradePrompt;
