import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShoppingCart, Zap, Globe, Sparkles, TrendingUp, 
  FileText, Crown, Shield, Search, Cpu, Rocket, 
  BarChart3, MonitorPlay, ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/contexts/CartContext';
import { useGeoCurrency } from '@/hooks/use-geo-currency';
import { 
  BRON_PRODUCTS, 
  CADE_PRODUCTS, 
  BUNDLE_PRODUCTS, 
  DAX_PRODUCTS,
  ONPAGE_SEO_PRODUCTS,
  VI_ADDON_PRODUCTS,
  PPC_PRODUCTS,
  WEB_BUILDER_PRODUCTS,
  formatPrice,
  type StripeProduct
} from '@/lib/stripeProducts';

interface ShopModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Service categories with icons and colors
const serviceCategories = [
  {
    id: 'bundle',
    name: 'Power Bundles',
    description: 'Best value - BRON + CADE combined',
    icon: Crown,
    color: 'from-amber-500 to-orange-500',
    bgGlow: 'bg-amber-500/20',
    products: BUNDLE_PRODUCTS,
    popular: true,
  },
  {
    id: 'bron',
    name: 'BRON Off-Page SEO',
    description: 'Automated backlinks & authority building',
    icon: TrendingUp,
    color: 'from-emerald-500 to-cyan-500',
    bgGlow: 'bg-emerald-500/20',
    products: BRON_PRODUCTS.filter(p => p.type === 'recurring'),
  },
  {
    id: 'cade',
    name: 'CADE AI Content',
    description: 'Automated articles & FAQs',
    icon: FileText,
    color: 'from-violet-500 to-purple-500',
    bgGlow: 'bg-violet-500/20',
    products: CADE_PRODUCTS.filter(p => p.type === 'recurring'),
  },
  {
    id: 'dax',
    name: 'DAX Authority',
    description: 'Domain Authority boosting',
    icon: Rocket,
    color: 'from-pink-500 to-rose-500',
    bgGlow: 'bg-pink-500/20',
    products: DAX_PRODUCTS.filter(p => p.type === 'recurring'),
  },
  {
    id: 'onpage',
    name: 'On-Page SEO',
    description: 'AI-powered optimization',
    icon: Search,
    color: 'from-cyan-500 to-blue-500',
    bgGlow: 'bg-cyan-500/20',
    products: ONPAGE_SEO_PRODUCTS,
  },
  {
    id: 'web-builder',
    name: 'WEB Builder',
    description: 'AI website generation',
    icon: MonitorPlay,
    color: 'from-indigo-500 to-violet-500',
    bgGlow: 'bg-indigo-500/20',
    products: WEB_BUILDER_PRODUCTS.filter(p => !p.priceId.startsWith('price_web')),
  },
  {
    id: 'ppc',
    name: 'PPC Landing Pages',
    description: 'A/B tested conversion pages',
    icon: BarChart3,
    color: 'from-orange-500 to-red-500',
    bgGlow: 'bg-orange-500/20',
    products: PPC_PRODUCTS,
  },
  {
    id: 'addons',
    name: 'Add-ons',
    description: 'Extra domains & keywords',
    icon: Globe,
    color: 'from-slate-400 to-slate-500',
    bgGlow: 'bg-slate-500/20',
    products: VI_ADDON_PRODUCTS,
  },
];

const tierLabels: Record<string, string> = {
  boost: 'Boost',
  surge: 'Surge', 
  power: 'Power',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
  unlimited: 'Unlimited',
};

export const ShopModal = memo(function ShopModal({ open, onOpenChange }: ShopModalProps) {
  const { addItem, totalItems } = useCart();
  const { formatLocalPrice, isUSD } = useGeoCurrency();
  const [expandedCategory, setExpandedCategory] = useState<string | null>('bundle');

  const handleAddToCart = (product: StripeProduct) => {
    addItem({
      id: product.id,
      priceId: product.priceId,
      productId: product.productId,
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      type: product.type,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-transparent border-0 overflow-hidden">
        {/* Futuristic Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Outer Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-violet-500 to-cyan-500 rounded-3xl blur-xl opacity-30 animate-pulse" />
          
          {/* Main Container */}
          <div className="relative bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-950 border border-white/10 rounded-3xl backdrop-blur-xl">
            {/* Header Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            
            {/* Scanning Line Animation */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"
              animate={{ y: [0, 600, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />

            {/* Header */}
            <div className="relative px-8 py-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Holographic Icon */}
                  <motion.div 
                    className="relative"
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-cyan-500 rounded-2xl blur-lg opacity-50" />
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
                      <Cpu className="w-7 h-7 text-primary" />
                    </div>
                  </motion.div>
                  
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                      Command Center Shop
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Select your SEO arsenal
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Cart Badge */}
                  {totalItems > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30"
                    >
                      <ShoppingCart className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-white">{totalItems} items</span>
                    </motion.div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenChange(false)}
                    className="rounded-full hover:bg-white/5 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="h-[calc(90vh-180px)]">
              <div className="p-8">
                <div className="grid gap-4">
                  {serviceCategories.map((category, categoryIndex) => {
                    const Icon = category.icon;
                    const isExpanded = expandedCategory === category.id;
                    
                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: categoryIndex * 0.05 }}
                      >
                        {/* Category Header */}
                        <button
                          onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                          className="w-full group"
                        >
                          <div className={`relative p-4 rounded-2xl border transition-all duration-300 ${
                            isExpanded 
                              ? 'bg-white/5 border-white/20' 
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                          }`}>
                            {/* Category Glow */}
                            <div className={`absolute inset-0 rounded-2xl ${category.bgGlow} blur-xl opacity-0 group-hover:opacity-30 transition-opacity`} />
                            
                            <div className="relative flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
                                  <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-white">{category.name}</h3>
                                    {category.popular && (
                                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-2">
                                        BEST VALUE
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{category.description}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">
                                  {category.products.length} {category.products.length === 1 ? 'plan' : 'plans'}
                                </span>
                                <motion.div
                                  animate={{ rotate: isExpanded ? 90 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </motion.div>
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Expanded Products */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-3 pl-16 pr-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {category.products.map((product, productIndex) => (
                                  <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: productIndex * 0.05 }}
                                    className="group/card relative"
                                  >
                                    <div className="relative p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300">
                                      {/* Tier Badge */}
                                      {product.tier && (
                                        <Badge 
                                          variant="outline" 
                                          className={`absolute -top-2 left-3 text-[10px] border-0 bg-gradient-to-r ${category.color} text-white`}
                                        >
                                          {tierLabels[product.tier] || product.tier}
                                        </Badge>
                                      )}
                                      
                                      <div className="pt-2">
                                        <h4 className="font-medium text-white text-sm line-clamp-1">{product.name}</h4>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 h-8">
                                          {product.description}
                                        </p>
                                        
                                        <div className="flex items-baseline gap-1 mt-3">
                                          <span className="text-xl font-bold text-white">
                                            {formatLocalPrice(product.price)}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {product.type === 'recurring' ? '/mo' : ''}
                                          </span>
                                        </div>
                                        
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToCart(product);
                                          }}
                                          className={`w-full mt-3 bg-gradient-to-r ${category.color} hover:opacity-90 text-white border-0 text-xs h-8`}
                                        >
                                          <ShoppingCart className="w-3 h-3 mr-1.5" />
                                          Add to Cart
                                        </Button>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="relative px-8 py-4 border-t border-white/5 bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Secure checkout powered by Stripe</span>
                </div>
                
                {totalItems > 0 && (
                  <Button
                    onClick={() => onOpenChange(false)}
                    className="bg-gradient-to-r from-primary to-violet-500 hover:opacity-90 text-white gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    View Cart ({totalItems})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
});

export default ShopModal;
