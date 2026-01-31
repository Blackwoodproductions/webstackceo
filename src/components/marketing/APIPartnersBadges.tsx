import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Link2, 
  Search, 
  CreditCard, 
  BarChart3, 
  MapPin, 
  TrendingUp,
  Zap,
  Globe,
  Shield,
  ExternalLink,
  Award,
  CheckCircle2,
  Star,
  Bot,
  Sparkles,
  Brain,
  Cpu
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface APIPartner {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  category: 'seo' | 'google' | 'payment' | 'analytics' | 'ai';
  url?: string;
}

const apiPartners: APIPartner[] = [
  // AI Partners (Free via Lovable AI Gateway)
  {
    name: 'Google Gemini',
    description: 'Advanced AI Models',
    icon: Sparkles,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/40',
    glowColor: 'shadow-blue-500/20',
    category: 'ai',
    url: 'https://deepmind.google/technologies/gemini/'
  },
  {
    name: 'OpenAI GPT-5',
    description: 'Powerful Language AI',
    icon: Brain,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/40',
    glowColor: 'shadow-emerald-500/20',
    category: 'ai',
    url: 'https://openai.com'
  },
  {
    name: 'Lovable AI',
    description: 'Unified AI Gateway',
    icon: Bot,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/40',
    glowColor: 'shadow-violet-500/20',
    category: 'ai',
    url: 'https://lovable.dev'
  },
  // SEO Partners
  {
    name: 'DataForSEO',
    description: 'Keyword Research & SERP Data',
    icon: Database,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/40',
    glowColor: 'shadow-blue-500/20',
    category: 'seo',
    url: 'https://dataforseo.com'
  },
  {
    name: 'Ahrefs',
    description: 'Backlink & Domain Analysis',
    icon: Link2,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/40',
    glowColor: 'shadow-orange-500/20',
    category: 'seo',
    url: 'https://ahrefs.com'
  },
  // Google Partners
  {
    name: 'Google Search Console',
    description: 'Search Performance & Indexation',
    icon: Search,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/40',
    glowColor: 'shadow-green-500/20',
    category: 'google',
    url: 'https://search.google.com/search-console'
  },
  {
    name: 'Google Analytics',
    description: 'Website Traffic & Behavior',
    icon: BarChart3,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/40',
    glowColor: 'shadow-yellow-500/20',
    category: 'google',
    url: 'https://analytics.google.com'
  },
  {
    name: 'Google Business Profile',
    description: 'Local SEO & GMB Management',
    icon: MapPin,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/40',
    glowColor: 'shadow-red-500/20',
    category: 'google',
    url: 'https://business.google.com'
  },
  {
    name: 'Google PageSpeed',
    description: 'Core Web Vitals & Performance',
    icon: Zap,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/40',
    glowColor: 'shadow-cyan-500/20',
    category: 'google',
    url: 'https://pagespeed.web.dev'
  },
  {
    name: 'Google Ads',
    description: 'PPC Campaigns & Keywords',
    icon: TrendingUp,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/40',
    glowColor: 'shadow-blue-500/20',
    category: 'google',
    url: 'https://ads.google.com'
  },
  {
    name: 'Google Places',
    description: 'Location & Business Data',
    icon: Globe,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/40',
    glowColor: 'shadow-emerald-500/20',
    category: 'google',
    url: 'https://developers.google.com/maps/documentation/places'
  },
  // Payment
  {
    name: 'Stripe',
    description: 'Secure Payment Processing',
    icon: CreditCard,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/40',
    glowColor: 'shadow-violet-500/20',
    category: 'payment',
    url: 'https://stripe.com'
  },
];

// Award-style badge for the homepage banner
const AwardBadge = memo(function AwardBadge({ partner }: { partner: APIPartner }) {
  const Icon = partner.icon;
  
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -3 }}
      className={cn(
        "flex-shrink-0 relative group cursor-default"
      )}
    >
      {/* Outer glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-xl blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300",
        partner.bgColor
      )} />
      
      {/* Badge container */}
      <div className={cn(
        "relative flex flex-col items-center gap-2 px-5 py-4 rounded-xl",
        "border-2 backdrop-blur-sm",
        "bg-gradient-to-b from-card/80 to-card/40",
        partner.borderColor,
        "shadow-lg group-hover:shadow-xl transition-all duration-300"
      )}>
        {/* Certified ribbon */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            "bg-gradient-to-r from-amber-500/90 to-yellow-500/90 text-amber-950",
            "shadow-md"
          )}>
            <CheckCircle2 className="w-2.5 h-2.5" />
            Certified
          </div>
        </div>
        
        {/* Icon with decorative ring */}
        <div className="relative mt-2">
          <div className={cn(
            "absolute inset-0 rounded-full opacity-30",
            partner.bgColor
          )} style={{ transform: 'scale(1.4)' }} />
          <div className={cn(
            "relative w-10 h-10 rounded-full flex items-center justify-center",
            "border-2",
            partner.borderColor,
            partner.bgColor
          )}>
            <Icon className={cn("w-5 h-5", partner.color)} />
          </div>
        </div>
        
        {/* Partner name */}
        <span className="text-sm font-semibold text-foreground whitespace-nowrap text-center">
          {partner.name}
        </span>
        
        {/* Star rating decoration */}
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
          ))}
        </div>
      </div>
    </motion.div>
  );
});

// Compact badge for banners and headers
export const APIPartnerBadge = memo(function APIPartnerBadge({ 
  partner, 
  compact = false 
}: { 
  partner: APIPartner; 
  compact?: boolean;
}) {
  const Icon = partner.icon;
  
  if (compact) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/50",
        partner.bgColor
      )}>
        <Icon className={cn("w-3 h-3", partner.color)} />
        <span className="text-xs font-medium text-foreground/80">{partner.name}</span>
      </div>
    );
  }
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border-2 bg-card/50 backdrop-blur-sm",
        partner.borderColor,
        "hover:shadow-lg transition-all duration-300 cursor-default group"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center border",
        partner.borderColor,
        partner.bgColor
      )}>
        <Icon className={cn("w-5 h-5", partner.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">{partner.name}</span>
          <CheckCircle2 className={cn("w-3.5 h-3.5", partner.color)} />
          {partner.url && (
            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
        <span className="text-xs text-muted-foreground">{partner.description}</span>
      </div>
    </motion.div>
  );
});

// Full banner section for homepage - Award style
export const APIPartnersBanner = memo(function APIPartnersBanner() {
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-violet-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        {/* Header with award styling */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 blur-xl rounded-full" />
              <div className="relative flex items-center gap-2 px-4 py-2 rounded-full border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-yellow-500/10">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                  Official API Partners
                </span>
                <Award className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Certified{" "}
            <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
              Enterprise Integrations
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time data from the world's most trusted SEO and analytics APIs
          </p>
        </div>
        
        {/* Award badges grid */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          <div className="flex overflow-hidden py-4">
            <div className="flex gap-6 items-stretch animate-scroll-partners">
              {[...apiPartners, ...apiPartners].map((partner, index) => (
                <AwardBadge key={`${partner.name}-${index}`} partner={partner} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Trust indicator */}
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span>SOC 2 Compliant</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>99.9% Uptime</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Real-time Data</span>
          </div>
        </div>
        
        <style>{`
          @keyframes scroll-partners {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .animate-scroll-partners {
            animation: scroll-partners 35s linear infinite;
            will-change: transform;
          }
          .animate-scroll-partners:hover {
            animation-play-state: paused;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-scroll-partners {
              animation: none;
            }
          }
        `}</style>
      </div>
    </section>
  );
});

// Grid section for documentation
export const APIPartnersGrid = memo(function APIPartnersGrid({ 
  showCategories = true,
  maxItems
}: { 
  showCategories?: boolean;
  maxItems?: number;
}) {
  const aiAPIs = apiPartners.filter(p => p.category === 'ai');
  const seoAPIs = apiPartners.filter(p => p.category === 'seo');
  const googleAPIs = apiPartners.filter(p => p.category === 'google');
  const otherAPIs = apiPartners.filter(p => !['seo', 'google', 'ai'].includes(p.category));
  
  const displayedPartners = maxItems ? apiPartners.slice(0, maxItems) : apiPartners;
  
  if (!showCategories) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedPartners.map((partner) => (
          <APIPartnerBadge key={partner.name} partner={partner} />
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* AI APIs */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          AI & Machine Learning
          <Badge variant="secondary" className="ml-2 text-[10px]">FREE</Badge>
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {aiAPIs.map((partner) => (
            <APIPartnerBadge key={partner.name} partner={partner} />
          ))}
        </div>
      </div>
      
      {/* SEO Data APIs */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          SEO Data APIs
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {seoAPIs.map((partner) => (
            <APIPartnerBadge key={partner.name} partner={partner} />
          ))}
        </div>
      </div>
      
      {/* Google APIs */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Google Platform APIs
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {googleAPIs.map((partner) => (
            <APIPartnerBadge key={partner.name} partner={partner} />
          ))}
        </div>
      </div>
      
      {/* Other APIs */}
      {otherAPIs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment & Other APIs
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {otherAPIs.map((partner) => (
              <APIPartnerBadge key={partner.name} partner={partner} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Compact inline badges for headers/footers
export const APIPartnersInline = memo(function APIPartnersInline({ 
  limit = 5 
}: { 
  limit?: number;
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center justify-center">
      <span className="text-xs text-muted-foreground mr-2">Powered by:</span>
      {apiPartners.slice(0, limit).map((partner) => (
        <APIPartnerBadge key={partner.name} partner={partner} compact />
      ))}
      {apiPartners.length > limit && (
        <Badge variant="outline" className="text-xs">
          +{apiPartners.length - limit} more
        </Badge>
      )}
    </div>
  );
});

// Export partners data for documentation
export { apiPartners };
export type { APIPartner };
