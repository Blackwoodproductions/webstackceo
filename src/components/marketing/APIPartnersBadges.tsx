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
  ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface APIPartner {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  category: 'seo' | 'google' | 'payment' | 'analytics';
  url?: string;
}

const apiPartners: APIPartner[] = [
  {
    name: 'DataForSEO',
    description: 'Keyword Research & SERP Data',
    icon: Database,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    category: 'seo',
    url: 'https://dataforseo.com'
  },
  {
    name: 'Ahrefs',
    description: 'Backlink & Domain Analysis',
    icon: Link2,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    category: 'seo',
    url: 'https://ahrefs.com'
  },
  {
    name: 'Google Search Console',
    description: 'Search Performance & Indexation',
    icon: Search,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    category: 'google',
    url: 'https://search.google.com/search-console'
  },
  {
    name: 'Google Analytics',
    description: 'Website Traffic & Behavior',
    icon: BarChart3,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    category: 'google',
    url: 'https://analytics.google.com'
  },
  {
    name: 'Google Business Profile',
    description: 'Local SEO & GMB Management',
    icon: MapPin,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    category: 'google',
    url: 'https://business.google.com'
  },
  {
    name: 'Google PageSpeed',
    description: 'Core Web Vitals & Performance',
    icon: Zap,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    category: 'google',
    url: 'https://pagespeed.web.dev'
  },
  {
    name: 'Google Ads',
    description: 'PPC Campaigns & Keywords',
    icon: TrendingUp,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    category: 'google',
    url: 'https://ads.google.com'
  },
  {
    name: 'Google Places',
    description: 'Location & Business Data',
    icon: Globe,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    category: 'google',
    url: 'https://developers.google.com/maps/documentation/places'
  },
  {
    name: 'Stripe',
    description: 'Secure Payment Processing',
    icon: CreditCard,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    category: 'payment',
    url: 'https://stripe.com'
  },
];

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
        "flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm",
        "hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-default group"
      )}
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", partner.bgColor)}>
        <Icon className={cn("w-5 h-5", partner.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">{partner.name}</span>
          {partner.url && (
            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
        <span className="text-xs text-muted-foreground">{partner.description}</span>
      </div>
    </motion.div>
  );
});

// Full banner section for homepage
export const APIPartnersBanner = memo(function APIPartnersBanner() {
  return (
    <section className="py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-violet-500/5" />
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <Shield className="w-3 h-3 mr-1.5" />
            Enterprise API Integrations
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Powered by{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              Industry Leaders
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time data from the world's most trusted SEO and analytics APIs
          </p>
        </div>
        
        {/* Scrolling badges row */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          <div className="flex overflow-hidden">
            <div className="flex gap-4 items-center animate-scroll-partners">
              {[...apiPartners, ...apiPartners].map((partner, index) => {
                const Icon = partner.icon;
                return (
                  <div
                    key={`${partner.name}-${index}`}
                    className={cn(
                      "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-border/50",
                      partner.bgColor,
                      "hover:scale-105 transition-transform duration-300"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", partner.color)} />
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">
                      {partner.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <style>{`
          @keyframes scroll-partners {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .animate-scroll-partners {
            animation: scroll-partners 30s linear infinite;
            will-change: transform;
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
  const seoAPIs = apiPartners.filter(p => p.category === 'seo');
  const googleAPIs = apiPartners.filter(p => p.category === 'google');
  const otherAPIs = apiPartners.filter(p => !['seo', 'google'].includes(p.category));
  
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
