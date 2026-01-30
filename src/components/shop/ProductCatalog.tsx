import { memo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Zap, TrendingUp, FileText, Award, Brain, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';

// Your existing Stripe products mapped to a catalog
const products = [
  {
    id: 'bron-15',
    priceId: 'price_1ST2P1DhwTkpKWXviUKZcjHg',
    productId: 'prod_TPs99FAUdyhPHW',
    name: 'BRON 15 Keywords',
    description: 'Boost your site\'s authority with automated, industry-relevant backlinks from real business websites.',
    price: 5000,
    currency: 'usd',
    type: 'one_time' as const,
    icon: TrendingUp,
    color: 'emerald',
    popular: false,
  },
  {
    id: 'bron-60',
    priceId: 'price_1SVGnnDhwTkpKWXveaUdIBtn',
    productId: 'prod_TSBAjvIHDqrici',
    name: 'BRON 60 Keywords',
    description: 'Enterprise-level backlink building with 60 keyword targeting for maximum SEO impact.',
    price: 29900,
    currency: 'usd',
    type: 'one_time' as const,
    icon: TrendingUp,
    color: 'emerald',
    popular: true,
  },
  {
    id: 'cade',
    priceId: 'price_1ST2SkDhwTkpKWXv7jSyg5zG',
    productId: 'prod_TPsD0SbpheHZwj',
    name: 'CADE Content Automation',
    description: 'Weekly, competitor-informed content including blog drip, knowledge base articles, and FAQs.',
    price: 14900,
    currency: 'usd',
    type: 'one_time' as const,
    icon: FileText,
    color: 'cyan',
    popular: true,
  },
  {
    id: 'bron-cade-combo',
    priceId: 'price_1SPbjRDhwTkpKWXv2RH12zjV',
    productId: 'prod_TMKOsaPgcTdIkD',
    name: 'BRON + CADE Bundle',
    description: 'Complete SEO package: backlink building + content automation at a discounted rate.',
    price: 44900,
    currency: 'usd',
    type: 'one_time' as const,
    icon: Zap,
    color: 'violet',
    popular: true,
    savings: 'Save $50',
  },
  {
    id: 'dax-50',
    priceId: 'price_1ST2WCDhwTkpKWXvEaNP2rKP',
    productId: 'prod_TPsGrSQHfjG2iA',
    name: 'DAX 50 Domain Authority',
    description: 'Boost your domain authority to 50+ with our proven link building strategy.',
    price: 4900,
    currency: 'usd',
    type: 'one_time' as const,
    icon: Award,
    color: 'amber',
    popular: false,
  },
  {
    id: 'dax-60',
    priceId: 'price_1ST2XTDhwTkpKWXv7Vx663I4',
    productId: 'prod_TPsIyDYbIjDqIY',
    name: 'DAX 60 Domain Authority',
    description: 'Premium authority building package for competitive niches.',
    price: 9900,
    currency: 'usd',
    type: 'one_time' as const,
    icon: Award,
    color: 'amber',
    popular: false,
  },
  {
    id: 'dax-70',
    priceId: 'price_1ST2XmDhwTkpKWXvW1kMKl69',
    productId: 'prod_TPsI93Rq3YmOwi',
    name: 'DAX 70 Domain Authority',
    description: 'Enterprise-level domain authority for maximum search visibility.',
    price: 19900,
    currency: 'usd',
    type: 'one_time' as const,
    icon: Award,
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
