import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, memo } from "react";
import { 
  Check, Star, Shield, Flame, Crown, Zap, Sparkles, 
  TrendingUp, FileText, Globe, Search, MonitorPlay, 
  BarChart3, Rocket, ChevronDown, ShoppingCart, Lock,
  CreditCard, Clock, Users, Building2, HeadphonesIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StripePaymentIcons from "@/components/ui/stripe-payment-icons";
import { useCart, CartProvider } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { useGeoCurrency } from "@/hooks/use-geo-currency";
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
} from "@/lib/stripeProducts";

// Calculate scarcity
const getPositionsLeft = () => {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const monthSeed = now.getMonth() + now.getFullYear() * 12;
  const baseDecrease = Math.floor(dayOfMonth * 0.7);
  const randomVariance = ((monthSeed * dayOfMonth * 7) % 5) - 2;
  return Math.max(3, 21 - baseDecrease + randomVariance);
};

// Core subscription plans
const corePlans = [
  {
    id: 'basic',
    name: "Basic",
    monthlyPrice: 15,
    yearlyPrice: 12,
    description: "Essential visitor intelligence per domain",
    icon: Globe,
    color: "from-cyan-500 to-blue-500",
    features: [
      "Visitor Intelligence Dashboard",
      "Real-time visitor tracking",
      "Page view analytics",
      "Session recordings",
      "Basic heatmaps",
      "Google Maps integration",
      "AI Assistant (30 min free)",
    ],
    highlighted: false,
    perDomain: true,
  },
  {
    id: 'business-ceo',
    name: "Business CEO",
    monthlyPrice: 75,
    yearlyPrice: 60,
    originalPrice: 150,
    description: "Everything to dominate local SEO",
    icon: Crown,
    color: "from-violet-500 to-purple-500",
    features: [
      "15 keyword phrases",
      "BRON Rankings included",
      "CADE (2 articles/mo)",
      "VI Dashboard (1 domain)",
      "AI Assistant (5 hrs/week)",
      "AEO and GEO signals",
      "Free directory listing",
      "Uptime monitoring",
      "DA - DR Booster",
      "Bi-weekly SEO reports",
      "GMB Integration",
    ],
    highlighted: true,
    hasScarcity: true,
    priceId: 'price_business_ceo_monthly',
  },
  {
    id: 'white-label',
    name: "White Label",
    monthlyPrice: 499,
    yearlyPrice: 399,
    description: "Resell our services under your brand",
    icon: Building2,
    color: "from-emerald-500 to-teal-500",
    features: [
      "Everything in Business CEO",
      "Free Marketplace Listing",
      "40% off all keywords",
      "AI Assistant (10 hrs/week)",
      "White-label dashboard",
      "Custom branding",
      "Priority 24/7 support",
      "Bulk client management",
      "Dedicated account manager",
      "Multi-client analytics",
    ],
    highlighted: false,
    priceId: 'price_white_label_monthly',
  },
  {
    id: 'super-reseller',
    name: "Super Reseller",
    monthlyPrice: 1499,
    yearlyPrice: 1199,
    description: "Enterprise API for agencies at scale",
    icon: Rocket,
    color: "from-amber-500 to-orange-500",
    features: [
      "Everything in White Label",
      "60% off normal pricing",
      "AI Assistant (Unlimited)",
      "Full API access",
      "Custom integrations",
      "Volume-based pricing",
      "Dedicated success team",
      "Enterprise SLA",
      "SOC 2 compliant",
    ],
    highlighted: false,
    isEnterprise: true,
  },
];

// Service categories
const serviceCategories = [
  {
    id: 'bundles',
    name: 'Power Bundles',
    description: 'Best value - BRON + CADE combined',
    icon: Crown,
    color: 'from-amber-500 to-orange-500',
    products: BUNDLE_PRODUCTS,
    popular: true,
  },
  {
    id: 'bron',
    name: 'BRON Off-Page SEO',
    description: 'Automated backlinks & authority',
    icon: TrendingUp,
    color: 'from-emerald-500 to-cyan-500',
    products: BRON_PRODUCTS.filter(p => p.type === 'recurring'),
  },
  {
    id: 'cade',
    name: 'CADE AI Content',
    description: 'Automated articles & FAQs',
    icon: FileText,
    color: 'from-violet-500 to-purple-500',
    products: CADE_PRODUCTS.filter(p => p.type === 'recurring'),
  },
  {
    id: 'dax',
    name: 'DAX Authority Boost',
    description: 'Domain Authority boosting',
    icon: Rocket,
    color: 'from-pink-500 to-rose-500',
    products: DAX_PRODUCTS.filter(p => p.type === 'recurring'),
  },
  {
    id: 'onpage',
    name: 'On-Page SEO',
    description: 'AI-powered optimization',
    icon: Search,
    color: 'from-cyan-500 to-blue-500',
    products: ONPAGE_SEO_PRODUCTS,
  },
  {
    id: 'web-builder',
    name: 'WEB Builder',
    description: 'AI website generation',
    icon: MonitorPlay,
    color: 'from-indigo-500 to-violet-500',
    products: WEB_BUILDER_PRODUCTS.filter(p => !p.priceId.startsWith('price_web')),
  },
  {
    id: 'ppc',
    name: 'PPC Landing Pages',
    description: 'A/B tested conversion pages',
    icon: BarChart3,
    color: 'from-orange-500 to-red-500',
    products: PPC_PRODUCTS,
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

const NewPricingSectionInner = memo(function NewPricingSectionInner() {
  const [isYearly, setIsYearly] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');
  const [expandedService, setExpandedService] = useState<string | null>('bundles');
  const positionsLeft = useMemo(() => getPositionsLeft(), []);
  const { addItem, totalItems } = useCart();
  const { formatLocalPrice, isUSD, country, loading } = useGeoCurrency();

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
    <section className="relative py-24 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Scanning line effect */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        animate={{ y: [0, 1000] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Transparent Pricing</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Build Your SEO
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Command Center
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Choose a core plan or build your custom stack with à la carte services
          </motion.p>

          {/* Currency Notice */}
          {!isUSD && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4"
            >
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Prices shown for {country}. Billed in USD.
              </span>
            </motion.div>
          )}
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-muted/50 dark:bg-slate-900/50 border border-border/50 dark:border-white/10 p-1 rounded-2xl">
              <TabsTrigger 
                value="plans" 
                className="px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-violet-500 data-[state=active]:text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                Core Plans
              </TabsTrigger>
              <TabsTrigger 
                value="services"
                className="px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-violet-500 data-[state=active]:text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                À La Carte
              </TabsTrigger>
            </TabsList>
          </div>

          {/* CORE PLANS TAB */}
          <TabsContent value="plans" className="space-y-12">
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                  isYearly ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <motion.div
                  className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md"
                  animate={{ x: isYearly ? 28 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
              <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Yearly
              </span>
              <Badge className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white border-0">
                Save 20%
              </Badge>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {corePlans.map((plan, index) => {
                const Icon = plan.icon;
                const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="relative"
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg px-4 py-1">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <Card className={`relative h-full p-6 overflow-hidden transition-all duration-300 ${
                      plan.highlighted
                        ? 'bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary shadow-[0_0_40px_hsl(var(--primary)/0.3)]'
                        : 'bg-card/95 dark:bg-slate-900/50 border-border dark:border-white/10 hover:border-primary/30 dark:hover:border-white/20'
                    }`}>
                      {/* Glow effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-5`} />
                      
                      <div className="relative">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                          {plan.description}
                        </p>
                        
                        {/* Price */}
                        <div className="mb-4">
                          <div className="flex items-baseline gap-2">
                            {plan.originalPrice && !isYearly && (
                              <span className="text-lg text-muted-foreground line-through">
                                {formatLocalPrice(plan.originalPrice * 100)}
                              </span>
                            )}
                            <span className="text-3xl font-bold">
                              {formatLocalPrice(price * 100)}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              /{plan.perDomain ? 'domain/mo' : 'month'}
                            </span>
                          </div>
                          
                          {plan.originalPrice && !isYearly && (
                            <Badge className="mt-2 bg-gradient-to-r from-red-500 to-rose-500 text-white border-0">
                              50% OFF
                            </Badge>
                          )}
                          
                          {plan.hasScarcity && (
                            <div className="flex items-center gap-1 mt-2 text-orange-400 text-xs">
                              <Flame className="w-3 h-3 animate-pulse" />
                              <span>Only {positionsLeft} spots left!</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Features */}
                        <ul className="space-y-2 mb-6">
                          {plan.features.slice(0, 6).map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                          {plan.features.length > 6 && (
                            <li className="text-xs text-primary">
                              +{plan.features.length - 6} more features
                            </li>
                          )}
                        </ul>
                        
                        {/* CTA */}
                        {plan.isEnterprise ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            asChild
                          >
                            <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">
                              <HeadphonesIcon className="w-4 h-4 mr-2" />
                              Book a Call
                            </a>
                          </Button>
                        ) : (
                          <Button
                            variant={plan.highlighted ? "default" : "outline"}
                            className={`w-full ${plan.highlighted ? 'bg-gradient-to-r from-primary to-violet-500 hover:opacity-90' : ''}`}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Get Started
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* À LA CARTE SERVICES TAB */}
          <TabsContent value="services" className="space-y-8">
            <div className="max-w-5xl mx-auto space-y-4">
              {serviceCategories.map((category, categoryIndex) => {
                const Icon = category.icon;
                const isExpanded = expandedService === category.id;
                
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.05 }}
                    viewport={{ once: true }}
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => setExpandedService(isExpanded ? null : category.id)}
                      className="w-full group"
                    >
                      <Card className={`p-5 transition-all duration-300 ${
                        isExpanded 
                          ? 'bg-white/5 border-white/20' 
                          : 'bg-slate-900/50 border-white/5 hover:bg-white/5 hover:border-white/10'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white">{category.name}</h3>
                                {category.popular && (
                                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px]">
                                    BEST VALUE
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{category.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground hidden sm:block">
                              {category.products.length} {category.products.length === 1 ? 'plan' : 'plans'}
                            </span>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            </motion.div>
                          </div>
                        </div>
                      </Card>
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
                          <div className="pt-4 pl-4 md:pl-16 pr-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {category.products.map((product, productIndex) => (
                              <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: productIndex * 0.05 }}
                              >
                                <Card className="relative p-5 bg-slate-900/30 border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300">
                                  {/* Tier Badge */}
                                  {product.tier && (
                                    <Badge 
                                      className={`absolute -top-2 left-3 text-[10px] border-0 bg-gradient-to-r ${category.color} text-white`}
                                    >
                                      {tierLabels[product.tier] || product.tier}
                                    </Badge>
                                  )}
                                  
                                  <div className="pt-2">
                                    <h4 className="font-semibold text-white mb-1">{product.name}</h4>
                                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[32px]">
                                      {product.description}
                                    </p>
                                    
                                    <div className="flex items-baseline gap-1 mb-4">
                                      <span className="text-2xl font-bold text-white">
                                        {formatLocalPrice(product.price)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {product.type === 'recurring' ? '/mo' : ''}
                                      </span>
                                    </div>
                                    
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddToCart(product)}
                                      className={`w-full bg-gradient-to-r ${category.color} hover:opacity-90 text-white border-0`}
                                    >
                                      <ShoppingCart className="w-3 h-3 mr-1.5" />
                                      Add to Cart
                                    </Button>
                                  </div>
                                </Card>
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
        </Tabs>

        {/* Security & Trust Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24"
        >
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-4">Secure & Trusted</h2>
            <p className="text-muted-foreground">Enterprise-grade security for your peace of mind</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Lock, label: "256-bit SSL Encryption", desc: "Bank-level security" },
              { icon: Shield, label: "SOC 2 Compliant", desc: "Enterprise certified" },
              { icon: CreditCard, label: "PCI DSS Level 1", desc: "Payment security" },
              { icon: Clock, label: "99.9% Uptime SLA", desc: "Always available" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-sm mb-1">{item.label}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Payment Icons */}
          <div className="flex justify-center mt-8">
            <StripePaymentIcons />
          </div>
        </motion.div>

        {/* FAQ Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-primary/10 to-violet-500/10 border-primary/20">
            <h3 className="text-xl font-bold mb-2">Have Questions?</h3>
            <p className="text-muted-foreground mb-4">
              Check out our FAQ or schedule a call with our team
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <a href="/faq">View FAQ</a>
              </Button>
              <Button className="bg-gradient-to-r from-primary to-violet-500" asChild>
                <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">
                  <HeadphonesIcon className="w-4 h-4 mr-2" />
                  Book a Demo
                </a>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer />
    </section>
  );
});

// Wrapper with CartProvider
export const NewPricingSection = memo(function NewPricingSection() {
  return (
    <CartProvider>
      <NewPricingSectionInner />
    </CartProvider>
  );
});

export default NewPricingSection;
