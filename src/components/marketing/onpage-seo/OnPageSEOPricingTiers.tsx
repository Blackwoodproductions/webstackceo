import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Building2, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ONPAGE_SEO_PRODUCTS } from '@/lib/stripeProducts';
import { useGeoCurrency } from '@/hooks/use-geo-currency';

// Stripe Product/Price IDs for On-Page SEO tiers (from centralized config)
export const ON_PAGE_SEO_TIERS = {
  starter: {
    name: 'Starter',
    pages: '≤500 pages',
    price: 99,
    priceId: ONPAGE_SEO_PRODUCTS[0].priceId,
    productId: ONPAGE_SEO_PRODUCTS[0].productId,
    icon: Zap,
    features: [
      'Up to 500 pages',
      'All platform connectors',
      'Auto meta tag optimization',
      'Schema markup generation',
      'Image alt text AI',
      'Weekly health scans',
    ],
    popular: false,
  },
  pro: {
    name: 'Pro',
    pages: '501-2000 pages',
    price: 199,
    priceId: ONPAGE_SEO_PRODUCTS[1].priceId,
    productId: ONPAGE_SEO_PRODUCTS[1].productId,
    icon: Crown,
    features: [
      'Up to 2,000 pages',
      'All Starter features',
      'Priority scanning queue',
      'Advanced schema types',
      'Bi-weekly auto-remediation',
      'Dedicated support',
    ],
    popular: true,
  },
  enterprise: {
    name: 'Enterprise',
    pages: '2001-5000 pages',
    price: 299,
    priceId: ONPAGE_SEO_PRODUCTS[2].priceId,
    productId: ONPAGE_SEO_PRODUCTS[2].productId,
    icon: Building2,
    features: [
      'Up to 5,000 pages',
      'All Pro features',
      'Daily automated scans',
      'Custom schema templates',
      'API access',
      'White-glove onboarding',
    ],
    popular: false,
  },
  unlimited: {
    name: 'Unlimited',
    pages: '5000+ pages',
    price: 499,
    priceId: ONPAGE_SEO_PRODUCTS[3].priceId,
    productId: ONPAGE_SEO_PRODUCTS[3].productId,
    icon: Rocket,
    features: [
      'Unlimited pages',
      'All Enterprise features',
      'Real-time monitoring',
      'Multi-site management',
      'Priority API access',
      'SLA guarantee',
    ],
    popular: false,
  },
};

interface OnPageSEOPricingTiersProps {
  currentTier?: string;
  pageCount?: number;
  onSubscribe?: (tier: keyof typeof ON_PAGE_SEO_TIERS) => void;
}

export const OnPageSEOPricingTiers = ({ 
  currentTier, 
  pageCount = 0, 
  onSubscribe 
}: OnPageSEOPricingTiersProps) => {
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const { formatLocalPrice, isUSD, country, loading } = useGeoCurrency();

  const recommendedTier = (): keyof typeof ON_PAGE_SEO_TIERS => {
    if (pageCount <= 500) return 'starter';
    if (pageCount <= 2000) return 'pro';
    if (pageCount <= 5000) return 'enterprise';
    return 'unlimited';
  };

  const handleSubscribe = async (tierId: keyof typeof ON_PAGE_SEO_TIERS) => {
    setSubscribing(tierId);
    
    try {
      const tier = ON_PAGE_SEO_TIERS[tierId];
      
      // Create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: tier.priceId,
          successUrl: `${window.location.origin}/visitor-intelligence-dashboard#on-page-seo`,
          cancelUrl: `${window.location.origin}/pricing`,
          metadata: {
            service: 'on-page-seo',
            tier: tierId,
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }

      onSubscribe?.(tierId);
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Unable to process subscription', {
        description: 'Please try again or contact support.',
      });
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Choose Your On-Page SEO Plan</h3>
        <p className="text-muted-foreground">
          Pricing based on your website size. All plans include real platform editing.
        </p>
        {!isUSD && !loading && (
          <p className="text-xs text-muted-foreground mt-1">
            Prices shown in your local currency ({country}). Billed in USD.
          </p>
        )}
        {pageCount > 0 && (
          <Badge className="mt-3 bg-amber-500/20 text-amber-500 border-amber-500/30">
            Your site: ~{pageCount.toLocaleString()} pages → Recommended: {ON_PAGE_SEO_TIERS[recommendedTier()].name}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.entries(ON_PAGE_SEO_TIERS) as [keyof typeof ON_PAGE_SEO_TIERS, typeof ON_PAGE_SEO_TIERS[keyof typeof ON_PAGE_SEO_TIERS]][]).map(([id, tier], i) => {
          const Icon = tier.icon;
          const isRecommended = id === recommendedTier() && pageCount > 0;
          const isCurrent = currentTier === id;

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`relative h-full ${
                tier.popular 
                  ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-orange-500/5' 
                  : isRecommended
                    ? 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/5'
                    : ''
              }`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-500 text-white border-0 shadow-lg">
                      Most Popular
                    </Badge>
                  </div>
                )}
                {isRecommended && !tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-500 text-white border-0 shadow-lg">
                      Recommended
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      tier.popular 
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500' 
                        : 'bg-muted'
                    }`}>
                      <Icon className={`w-5 h-5 ${tier.popular ? 'text-white' : 'text-foreground'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{tier.pages}</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{formatLocalPrice(tier.price * 100)}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  {!isUSD && (
                    <p className="text-xs text-muted-foreground">≈ ${tier.price} USD</p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {tier.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(id)}
                    disabled={subscribing !== null || isCurrent}
                    className={`w-full gap-2 ${
                      tier.popular || isRecommended
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                        : ''
                    }`}
                    variant={tier.popular || isRecommended ? 'default' : 'outline'}
                  >
                    {isCurrent ? (
                      'Current Plan'
                    ) : subscribing === id ? (
                      'Processing...'
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Get Started
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        All plans include: WordPress, Shopify, Wix, PHP/HTML connectors • Autopilot mode • Real-time dashboard
      </p>
    </div>
  );
};

export default OnPageSEOPricingTiers;
