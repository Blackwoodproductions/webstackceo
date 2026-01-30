import { memo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Zap, Globe, Sparkles, Shield, TrendingUp, FileText, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useGeoCurrency } from '@/hooks/use-geo-currency';
import { 
  BRON_PRODUCTS, 
  CADE_PRODUCTS, 
  BUNDLE_PRODUCTS, 
  DAX_PRODUCTS,
} from '@/lib/stripeProducts';

// À La Carte Add-on Services mapped from real Stripe products
const products = [
  // VI Domain Add-on
  {
    id: 'vi-domain-addon',
    priceId: 'price_1RGLeTDhwTkpKWXvUE214Xqr',
    productId: 'prod_SAh2LhPb8MjufT',
    name: 'Additional VI Domain',
    description: 'Add another domain to your Visitor Intelligence dashboard for comprehensive tracking.',
    price: 200,
    currency: 'usd',
    type: 'one_time' as const,
    icon: Globe,
    color: 'cyan',
    popular: true,
  },
  // BRON Boost
  {
    id: BRON_PRODUCTS[0].id,
    priceId: BRON_PRODUCTS[0].priceId,
    productId: BRON_PRODUCTS[0].productId,
    name: BRON_PRODUCTS[0].name,
    description: BRON_PRODUCTS[0].description,
    price: BRON_PRODUCTS[0].price,
    currency: BRON_PRODUCTS[0].currency,
    type: BRON_PRODUCTS[0].type,
    icon: TrendingUp,
    color: 'emerald',
    popular: false,
  },
  // CADE Boost
  {
    id: CADE_PRODUCTS[0].id,
    priceId: CADE_PRODUCTS[0].priceId,
    productId: CADE_PRODUCTS[0].productId,
    name: CADE_PRODUCTS[0].name,
    description: CADE_PRODUCTS[0].description,
    price: CADE_PRODUCTS[0].price,
    currency: CADE_PRODUCTS[0].currency,
    type: CADE_PRODUCTS[0].type,
    icon: FileText,
    color: 'amber',
    popular: false,
  },
  // Bundle Boost (Best Value)
  {
    id: BUNDLE_PRODUCTS[0].id,
    priceId: BUNDLE_PRODUCTS[0].priceId,
    productId: BUNDLE_PRODUCTS[0].productId,
    name: BUNDLE_PRODUCTS[0].name,
    description: BUNDLE_PRODUCTS[0].description,
    price: BUNDLE_PRODUCTS[0].price,
    currency: BUNDLE_PRODUCTS[0].currency,
    type: BUNDLE_PRODUCTS[0].type,
    icon: Crown,
    color: 'violet',
    popular: true,
    savings: 'Best Value',
  },
  // DAX Boost
  {
    id: DAX_PRODUCTS[0].id,
    priceId: DAX_PRODUCTS[0].priceId,
    productId: DAX_PRODUCTS[0].productId,
    name: DAX_PRODUCTS[0].name,
    description: DAX_PRODUCTS[0].description,
    price: DAX_PRODUCTS[0].price,
    currency: DAX_PRODUCTS[0].currency,
    type: DAX_PRODUCTS[0].type,
    icon: Sparkles,
    color: 'violet',
    popular: false,
  },
  // Priority Support
  {
    id: 'priority-support',
    priceId: 'price_1RjOEUDhwTkpKWXvNUtR9nfh',
    productId: 'prod_SehdzWU9I7OMYk',
    name: 'Priority Support',
    description: 'Get dedicated support with faster response times and direct access to our SEO experts.',
    price: 99900,
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

export const ProductCatalog = memo(function ProductCatalog() {
  const { addItem } = useCart();
  const { formatLocalPrice, getEquivalent, country, isUSD, loading } = useGeoCurrency();

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
          {!isUSD && !loading && (
            <p className="text-xs text-muted-foreground mt-2">
              Prices shown in your local currency ({country}). Billed in USD.
            </p>
          )}
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
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-bold">
                        {formatLocalPrice(product.price)}
                      </span>
                      <span className="text-muted-foreground text-sm">/month</span>
                    </div>
                    {!isUSD && (
                      <p className="text-xs text-muted-foreground mb-4">
                        ≈ ${(product.price / 100).toFixed(0)} USD
                      </p>
                    )}
                    {isUSD && <div className="mb-4" />}

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
