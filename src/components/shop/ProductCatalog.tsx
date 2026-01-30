import { memo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Zap, Globe, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';

// Webstack.ceo À La Carte Add-on Services
// These are add-ons to subscription plans, not legacy Stripe products
const products = [
  {
    id: 'vi-domain-addon',
    priceId: 'price_vi_domain_addon', // To be created in Stripe
    productId: 'prod_vi_domain',
    name: 'Additional VI Domain',
    description: 'Add another domain to your Visitor Intelligence dashboard for comprehensive tracking.',
    price: 1500, // $15/month
    currency: 'usd',
    type: 'one_time' as const,
    icon: Globe,
    color: 'cyan',
    popular: true,
  },
  {
    id: 'aeo-geo-10',
    priceId: 'price_aeo_geo_10', // To be created in Stripe
    productId: 'prod_aeo_geo',
    name: 'AEO/GEO 10 Keywords',
    description: 'Track 10 keywords for AI Engine Optimization and Geographic signals visibility.',
    price: 2000, // $20/month (10 x $2)
    currency: 'usd',
    type: 'one_time' as const,
    icon: Sparkles,
    color: 'violet',
    popular: false,
  },
  {
    id: 'aeo-geo-25',
    priceId: 'price_aeo_geo_25', // To be created in Stripe
    productId: 'prod_aeo_geo',
    name: 'AEO/GEO 25 Keywords',
    description: 'Track 25 keywords for comprehensive AI visibility monitoring across search engines.',
    price: 5000, // $50/month (25 x $2)
    currency: 'usd',
    type: 'one_time' as const,
    icon: Sparkles,
    color: 'violet',
    popular: true,
    savings: 'Best Value',
  },
  {
    id: 'priority-support',
    priceId: 'price_priority_support', // To be created in Stripe
    productId: 'prod_priority_support',
    name: 'Priority Support',
    description: 'Get dedicated support with faster response times and direct access to our SEO experts.',
    price: 4900, // $49/month
    currency: 'usd',
    type: 'one_time' as const,
    icon: Shield,
    color: 'amber',
    popular: false,
  },
];

const colorClasses = {
  emerald: {
    bg: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30 hover:border-emerald-500/50',
    icon: 'text-emerald-400 bg-emerald-500/20',
    button: 'bg-emerald-600 hover:bg-emerald-700',
  },
  cyan: {
    bg: 'from-cyan-500/20 to-cyan-600/10',
    border: 'border-cyan-500/30 hover:border-cyan-500/50',
    icon: 'text-cyan-400 bg-cyan-500/20',
    button: 'bg-cyan-600 hover:bg-cyan-700',
  },
  violet: {
    bg: 'from-violet-500/20 to-violet-600/10',
    border: 'border-violet-500/30 hover:border-violet-500/50',
    icon: 'text-violet-400 bg-violet-500/20',
    button: 'bg-violet-600 hover:bg-violet-700',
  },
  amber: {
    bg: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/30 hover:border-amber-500/50',
    icon: 'text-amber-400 bg-amber-500/20',
    button: 'bg-amber-600 hover:bg-amber-700',
  },
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export const ProductCatalog = memo(function ProductCatalog() {
  const { addItem } = useCart();

  return (
    <section id="services" className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            <Zap className="w-3 h-3 mr-1" />
            À La Carte Services
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Build Your Custom{' '}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              SEO Stack
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select the services you need. Mix and match to create the perfect SEO solution for your business.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => {
            const colors = colorClasses[product.color as keyof typeof colorClasses];
            const Icon = product.icon;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative h-full bg-gradient-to-br ${colors.bg} border ${colors.border} transition-all duration-300 hover:shadow-lg hover:shadow-primary/5`}>
                  {product.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-primary to-violet-500 text-white border-0 shadow-lg">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {'savings' in product && product.savings && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-emerald-500 text-white border-0 shadow-lg">
                        {product.savings}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                    <CardTitle className="text-xl mt-4">{product.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {product.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-4">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-bold">
                        {formatPrice(product.price, product.currency)}
                      </span>
                      <span className="text-muted-foreground text-sm">/month</span>
                    </div>

                    <Button
                      className={`w-full ${colors.button} text-white`}
                      onClick={() => addItem(product)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default ProductCatalog;
