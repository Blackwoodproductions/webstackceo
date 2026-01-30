import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShoppingCart, Zap, Globe, Sparkles, TrendingUp, 
  FileText, Crown, Shield, Search, Cpu, Rocket, 
  BarChart3, MonitorPlay, ChevronRight, Eye, Gift,
  Building2, Users, Star, Check, Brain, Target,
  Layers, ArrowRight
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  type StripeProduct
} from '@/lib/stripeProducts';

interface ShopModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Core subscription plans
const corePlans = [
  {
    id: 'vi-basic',
    name: 'Starter',
    subtitle: 'Visitor Intelligence',
    price: 0,
    priceLabel: 'FREE',
    period: 'forever',
    description: '1 website included free',
    icon: Eye,
    color: 'from-cyan-500 to-blue-500',
    features: ['1 Website Dashboard', 'Live Visitor Tracking', 'Page Analytics', 'Form Tracking', 'Session Replays'],
    isFree: true,
    popular: false,
  },
  {
    id: 'business-ceo',
    name: 'Business CEO',
    subtitle: 'Full SEO Suite',
    price: 7500,
    period: '/mo',
    description: 'Complete marketing dashboard',
    icon: TrendingUp,
    color: 'from-emerald-500 to-cyan-500',
    features: ['Everything in Starter', 'BRON Keyword Tracking', 'CADE AI Content (2 articles)', 'GMB Optimization', 'Social Signals', 'AEO/GEO Visibility'],
    popular: true,
  },
  {
    id: 'white-label',
    name: 'White Label',
    subtitle: 'Agency Solution',
    price: 49900,
    period: '/mo',
    description: 'Your brand, our platform',
    icon: Building2,
    color: 'from-violet-500 to-purple-500',
    features: ['Everything in Business', 'Custom Branding', '10 Client Domains', '40% Partner Discount', 'Priority Support', 'Dedicated Onboarding'],
    isAgency: true,
  },
  {
    id: 'super-reseller',
    name: 'Super Reseller',
    subtitle: 'Enterprise API',
    price: 149900,
    period: '/mo',
    description: 'Full platform access',
    icon: Rocket,
    color: 'from-pink-500 to-rose-500',
    features: ['Unlimited Everything', 'Full API Access', '60% Partner Discount', 'White Label Exports', 'Dedicated Account Manager', 'Custom Integrations'],
    isEnterprise: true,
  },
];

// Service categories with products
const serviceCategories = [
  {
    id: 'bundle',
    name: 'Power Bundles',
    description: 'BRON + CADE combined - best value',
    icon: Crown,
    color: 'from-amber-500 to-orange-500',
    bgGlow: 'bg-amber-500/20',
    products: BUNDLE_PRODUCTS,
    popular: true,
  },
  {
    id: 'bron',
    name: 'BRON Off-Page SEO',
    description: 'Automated backlinks & authority',
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
  const { formatLocalPrice } = useGeoCurrency();
  const [activeTab, setActiveTab] = useState<string>('plans');
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

  const handleSelectPlan = (planId: string) => {
    if (planId === 'vi-basic') {
      // Free plan - redirect to signup
      window.location.href = '/auth?signup=true';
    } else {
      // Paid plans - redirect to pricing with plan selected
      window.location.href = `/pricing?plan=${planId}`;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] p-0 bg-transparent border-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Outer Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 rounded-3xl blur-xl opacity-25" />
          
          {/* Main Container */}
          <div className="relative bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-950 border border-white/10 rounded-3xl backdrop-blur-xl">
            {/* Header Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
            
            {/* Subtle Scanning Line */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent opacity-50"
              animate={{ y: [0, 700, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            />

            {/* Header */}
            <div className="relative px-8 py-5 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Animated Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-2xl blur-lg opacity-40" />
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center">
                      <Brain className="w-7 h-7 text-cyan-400" />
                    </div>
                    <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400" />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent">
                      Command Center Shop
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Choose your marketing arsenal
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {totalItems > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30"
                    >
                      <ShoppingCart className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-medium text-white">{totalItems}</span>
                    </motion.div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenChange(false)}
                    className="rounded-full hover:bg-white/5"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="px-8 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl w-full justify-start">
                  <TabsTrigger 
                    value="plans" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-violet-500/20 data-[state=active]:border-cyan-500/30 rounded-lg px-6"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Plans & Pricing
                  </TabsTrigger>
                  <TabsTrigger 
                    value="services" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:border-amber-500/30 rounded-lg px-6"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Service Bundles
                  </TabsTrigger>
                  <TabsTrigger 
                    value="whitelabel" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border-violet-500/30 rounded-lg px-6"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    White Label
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[calc(92vh-280px)] mt-4">
                  {/* Plans Tab */}
                  <TabsContent value="plans" className="mt-0 space-y-6">
                    {/* Free Website Hero */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-gradient-to-r from-cyan-950/50 via-slate-900/80 to-violet-950/50"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,182,212,0.15),transparent_50%)]" />
                      <div className="relative flex items-center justify-between p-6">
                        <div className="flex items-center gap-5">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                              <Gift className="w-8 h-8 text-white" />
                            </div>
                            <motion.div 
                              className="absolute -inset-2 rounded-2xl border-2 border-cyan-400/50"
                              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </div>
                          <div>
                            <Badge className="mb-2 bg-emerald-500/20 border-emerald-500/40 text-emerald-300">
                              <Star className="w-3 h-3 mr-1" />
                              LIMITED OFFER
                            </Badge>
                            <h3 className="text-xl font-bold text-white">1 Website FREE Forever</h3>
                            <p className="text-slate-400 text-sm">Full Visitor Intelligence dashboard - no credit card required</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSelectPlan('vi-basic')}
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 shadow-lg shadow-cyan-500/25"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Get Started Free
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </motion.div>

                    {/* Core Plans Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {corePlans.map((plan, idx) => {
                        const Icon = plan.icon;
                        return (
                          <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
                              plan.popular 
                                ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/30 to-slate-900/80 shadow-[0_0_30px_rgba(16,185,129,0.15)]' 
                                : plan.isFree
                                ? 'border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900/80'
                                : 'border-white/10 bg-slate-900/50 hover:border-white/20'
                            }`}
                          >
                            {plan.popular && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0 shadow-lg">
                                  <Star className="w-3 h-3 mr-1" />
                                  MOST POPULAR
                                </Badge>
                              </div>
                            )}
                            
                            <div className="p-5">
                              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-lg`}>
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              
                              <h3 className="font-bold text-lg text-white">{plan.name}</h3>
                              <p className="text-xs text-muted-foreground mb-3">{plan.subtitle}</p>
                              
                              <div className="flex items-baseline gap-1 mb-4">
                                {plan.isFree ? (
                                  <span className="text-3xl font-bold text-cyan-400">{plan.priceLabel}</span>
                                ) : (
                                  <>
                                    <span className="text-3xl font-bold text-white">{formatLocalPrice(plan.price)}</span>
                                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                                  </>
                                )}
                              </div>
                              
                              <ul className="space-y-2 mb-5">
                                {plan.features.slice(0, 4).map((feature) => (
                                  <li key={feature} className="flex items-center gap-2 text-xs text-slate-300">
                                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                    {feature}
                                  </li>
                                ))}
                                {plan.features.length > 4 && (
                                  <li className="text-xs text-muted-foreground">+{plan.features.length - 4} more</li>
                                )}
                              </ul>
                              
                              <Button
                                onClick={() => handleSelectPlan(plan.id)}
                                className={`w-full ${
                                  plan.isFree 
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500' 
                                    : plan.popular
                                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400'
                                    : 'bg-white/10 hover:bg-white/20'
                                } text-white`}
                              >
                                {plan.isFree ? 'Start Free' : 'Select Plan'}
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  {/* Services Tab */}
                  <TabsContent value="services" className="mt-0">
                    <div className="grid gap-3">
                      {serviceCategories.map((category, categoryIndex) => {
                        const Icon = category.icon;
                        const isExpanded = expandedCategory === category.id;
                        
                        return (
                          <motion.div
                            key={category.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: categoryIndex * 0.03 }}
                          >
                            <button
                              onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                              className="w-full group"
                            >
                              <div className={`relative p-4 rounded-xl border transition-all duration-300 ${
                                isExpanded 
                                  ? 'bg-white/5 border-white/20' 
                                  : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                              }`}>
                                <div className={`absolute inset-0 rounded-xl ${category.bgGlow} blur-xl opacity-0 group-hover:opacity-20 transition-opacity`} />
                                
                                <div className="relative flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
                                      <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="text-left">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-white text-sm">{category.name}</h3>
                                        {category.popular && (
                                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-2">
                                            BEST VALUE
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground">{category.description}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">
                                      {category.products.length} plans
                                    </span>
                                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </motion.div>
                                  </div>
                                </div>
                              </div>
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-3 pl-14 pr-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {category.products.map((product, productIndex) => (
                                      <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: productIndex * 0.05 }}
                                        className="relative p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] transition-all"
                                      >
                                        {product.tier && (
                                          <Badge 
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
                  </TabsContent>

                  {/* White Label Tab */}
                  <TabsContent value="whitelabel" className="mt-0 space-y-6">
                    {/* White Label Hero */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative rounded-2xl overflow-hidden border border-violet-500/30 bg-gradient-to-r from-violet-950/50 via-slate-900/80 to-purple-950/50 p-8"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.2),transparent_50%)]" />
                      <div className="relative text-center max-w-2xl mx-auto">
                        <Badge className="mb-4 bg-violet-500/20 border-violet-500/40 text-violet-300">
                          <Building2 className="w-3 h-3 mr-1.5" />
                          AGENCY & ENTERPRISE
                        </Badge>
                        <h3 className="text-3xl font-bold text-white mb-3">
                          Your Brand. Our Platform.
                        </h3>
                        <p className="text-slate-400 mb-6">
                          Offer the full webstack.ceo platform under your own brand. 
                          Perfect for agencies and resellers.
                        </p>
                      </div>
                    </motion.div>

                    {/* White Label Plans */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* White Label Plan */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-950/30 to-slate-900/80 p-6"
                      >
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/25">
                          <Building2 className="w-7 h-7 text-white" />
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-1">White Label</h3>
                        <p className="text-sm text-muted-foreground mb-4">Perfect for growing agencies</p>
                        
                        <div className="flex items-baseline gap-1 mb-6">
                          <span className="text-4xl font-bold text-white">{formatLocalPrice(49900)}</span>
                          <span className="text-muted-foreground">/mo</span>
                        </div>
                        
                        <ul className="space-y-3 mb-6">
                          {[
                            'Custom logo & branding',
                            '10 client domains included',
                            '40% partner discount on add-ons',
                            'Priority support',
                            'Client management dashboard',
                            'Branded reports & exports',
                          ].map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                              <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        <Button
                          onClick={() => handleSelectPlan('white-label')}
                          className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white"
                        >
                          Get Started
                        </Button>
                      </motion.div>

                      {/* Super Reseller Plan */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative rounded-2xl border border-pink-500/30 bg-gradient-to-b from-pink-950/30 to-slate-900/80 p-6"
                      >
                        <Badge className="absolute -top-3 left-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">
                          <Rocket className="w-3 h-3 mr-1" />
                          ENTERPRISE
                        </Badge>
                        
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-4 shadow-lg shadow-pink-500/25">
                          <Rocket className="w-7 h-7 text-white" />
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-1">Super Reseller</h3>
                        <p className="text-sm text-muted-foreground mb-4">For enterprise & large agencies</p>
                        
                        <div className="flex items-baseline gap-1 mb-6">
                          <span className="text-4xl font-bold text-white">{formatLocalPrice(149900)}</span>
                          <span className="text-muted-foreground">/mo</span>
                        </div>
                        
                        <ul className="space-y-3 mb-6">
                          {[
                            'Everything in White Label',
                            'Unlimited domains',
                            '60% partner discount',
                            'Full API access',
                            'Dedicated account manager',
                            'Custom integrations',
                          ].map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                              <Check className="w-4 h-4 text-pink-400 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        <Button
                          onClick={() => handleSelectPlan('super-reseller')}
                          className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white"
                        >
                          Contact Sales
                        </Button>
                      </motion.div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap justify-center items-center gap-6 pt-4">
                      {[
                        { icon: Shield, label: 'SOC 2 Compliant' },
                        { icon: Users, label: '500+ Agencies' },
                        { icon: Layers, label: 'White Label Ready' },
                        { icon: Target, label: 'Enterprise SLA' },
                      ].map((badge) => (
                        <div key={badge.label} className="flex items-center gap-2 text-sm text-slate-500">
                          <badge.icon className="w-4 h-4 text-slate-600" />
                          {badge.label}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>

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
                    className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 text-white gap-2"
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
