import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, ShieldCheck, Clock, HeadphonesIcon, Sparkles, Zap, Crown, Shield, Flame, Plus, CreditCard, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import StripePaymentIcons from "@/components/ui/stripe-payment-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Calculate positions left based on current date (decreases throughout month)
const getPositionsLeft = () => {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const monthSeed = now.getMonth() + now.getFullYear() * 12;
  const baseDecrease = Math.floor(dayOfMonth * 0.7);
  const randomVariance = ((monthSeed * dayOfMonth * 7) % 5) - 2;
  const positionsLeft = Math.max(3, 21 - baseDecrease + randomVariance);
  return positionsLeft;
};

// Premium features that get special badges
const premiumFeatures: Record<string, { icon: typeof Sparkles; label: string; color: string }> = {
  "Free directory listing": { icon: Star, label: "Included", color: "from-emerald-400 to-green-500" },
  "Free Marketplace Listing": { icon: Star, label: "Included", color: "from-emerald-400 to-green-500" },
  "AEO and GEO signals": { icon: Sparkles, label: "AI Ready", color: "from-fuchsia-400 to-pink-500" },
  "DA - DR BOOSTER": { icon: Zap, label: "Power", color: "from-amber-400 to-orange-500" },
  "Up to 40% off normal keyword pricing": { icon: Crown, label: "Deal", color: "from-violet-400 to-purple-500" },
  "Up to 60% off normal pricing": { icon: Crown, label: "Best Deal", color: "from-cyan-400 to-blue-500" },
  "Full API access to all data": { icon: Sparkles, label: "Pro", color: "from-pink-400 to-rose-500" },
  "SOC 2 compliant infrastructure": { icon: Shield, label: "Secure", color: "from-emerald-400 to-green-500" },
  "Dedicated success team": { icon: Star, label: "VIP", color: "from-amber-400 to-yellow-500" },
  "Priority enterprise support": { icon: HeadphonesIcon, label: "Priority", color: "from-blue-400 to-indigo-500" },
  "Advanced security & encryption": { icon: Shield, label: "Secure", color: "from-emerald-400 to-green-500" },
};

// Add-ons available for all plans
const addOns = [
  { name: "On-Page SEO", icon: Sparkles },
  { name: "PPC Landing Pages", icon: Zap },
  { name: "Lovable Premium Hosting", icon: Shield },
];

const plans = [
  {
    name: "Business CEO",
    monthlyPrice: 75,
    yearlyPrice: 60,
    description: "Everything you need to dominate local SEO",
    features: [
      "15 keyword phrases",
      "Free directory listing",
      "AEO and GEO signals",
      "Uptime monitoring",
      "Bi-weekly SEO ranking reports",
      "15 SEO rich content pages",
      "25 relevant business partners",
      "Up to 125 targeted Deep Links",
      "DA - DR BOOSTER",
      "In-depth analytics",
    ],
    highlighted: false,
    hasToggle: true,
    originalPrice: 150,
    hasScarcity: true,
  },
  {
    name: "White Label",
    monthlyPrice: 499,
    yearlyPrice: 399,
    description: "Resell our services under your brand",
    features: [
      "Everything in Growth plan",
      "Free Marketplace Listing",
      "Up to 40% off normal keyword pricing",
      "White-label dashboard & reports",
      "Custom branding on all deliverables",
      "Priority 24/7 support",
      "Bulk client management tools",
      "Dedicated account manager",
      "Client onboarding assistance",
      "Multi-client analytics dashboard",
      "Reseller training & resources",
      "White-label everything",
    ],
    highlighted: true,
    hasToggle: true,
  },
  {
    name: "Super Reseller",
    monthlyPrice: 1499,
    yearlyPrice: 1199,
    description: "Enterprise API access for agencies at scale",
    features: [
      "Everything in White Label plan",
      "Up to 60% off normal pricing",
      "Full API access to all data",
      "Pull data to your own systems",
      "Custom integrations & webhooks",
      "Volume-based enterprise pricing",
      "Dedicated success team",
      "Priority enterprise support",
      "Custom SLA agreements",
      "Dedicated security protocols",
      "Early access to new features",
    ],
    highlighted: false,
    hasToggle: true,
    buttonText: "Book a Call",
  },
];

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const positionsLeft = useMemo(() => getPositionsLeft(), []);

  const selectedPlan = plans.find(p => p.name === expandedPlan);

  return (
    <section id="pricing" className="py-12 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10 max-w-5xl">
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
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
          <span className="bg-gradient-to-r from-cyan-400 to-violet-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Save 20%
          </span>
        </div>

        {/* Condensed Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              onClick={() => setExpandedPlan(plan.name)}
              className={`relative rounded-xl p-5 cursor-pointer transition-all duration-300 ${
                plan.highlighted
                  ? "bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
                  : "glass-card border border-white/10 hover:border-primary/30"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-400 to-violet-500 text-white text-xs font-semibold px-3 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                
                {/* Price display */}
                <div className="flex items-baseline justify-center gap-1.5 mb-2">
                  {plan.originalPrice && !isYearly && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${plan.originalPrice}
                    </span>
                  )}
                  <span className="text-3xl font-bold">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                
                {/* Half off badge for Business CEO */}
                {plan.originalPrice && !isYearly && (
                  <span className="inline-block bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                    50% OFF
                  </span>
                )}
                
                {/* Scarcity indicator */}
                {plan.hasScarcity && (
                  <div className="flex items-center justify-center gap-1 text-xs text-orange-500 mb-2">
                    <Flame className="w-3 h-3 animate-pulse" />
                    <span>{positionsLeft} spots left</span>
                  </div>
                )}

                <p className="text-muted-foreground text-xs mb-3 line-clamp-2">
                  {plan.description}
                </p>

                {/* Preview features (first 3) */}
                <ul className="space-y-1.5 mb-3 text-left">
                  {plan.features.slice(0, 3).map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Expand trigger */}
                <button className="flex items-center justify-center gap-1 text-xs text-primary hover:text-primary/80 mx-auto mb-3">
                  <span>View all {plan.features.length} features</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {plan.buttonText === "Book a Call" ? (
                  <Button
                    variant="heroOutline"
                    className="w-full"
                    size="sm"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">
                      {plan.buttonText}
                    </a>
                  </Button>
                ) : (
                  <Button
                    variant={plan.highlighted ? "hero" : "heroOutline"}
                    className="w-full"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Get Started
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Expanded Plan Dialog */}
        <Dialog open={!!expandedPlan} onOpenChange={(open) => !open && setExpandedPlan(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            {selectedPlan && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{selectedPlan.name}</span>
                    {selectedPlan.highlighted && (
                      <span className="bg-gradient-to-r from-cyan-400 to-violet-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        Most Popular
                      </span>
                    )}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Price */}
                  <div className="text-center py-4 rounded-lg bg-muted/30">
                    <div className="flex items-baseline justify-center gap-2">
                      {selectedPlan.originalPrice && !isYearly && (
                        <span className="text-lg text-muted-foreground line-through">
                          ${selectedPlan.originalPrice}
                        </span>
                      )}
                      <span className="text-4xl font-bold">
                        ${isYearly ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    {selectedPlan.originalPrice && !isYearly && (
                      <span className="inline-block mt-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        50% OFF
                      </span>
                    )}
                    {isYearly && selectedPlan.yearlyPrice && (
                      <p className="text-xs text-primary mt-2">
                        Billed annually (${selectedPlan.yearlyPrice * 12}/year)
                      </p>
                    )}
                  </div>

                  <p className="text-muted-foreground text-center">
                    {selectedPlan.description}
                  </p>

                  {/* Full Features List */}
                  <div>
                    <h4 className="font-semibold mb-3">All Features</h4>
                    <ul className="space-y-3">
                      {selectedPlan.features.map((feature, featureIndex) => {
                        const premium = premiumFeatures[feature];
                        const PremiumIcon = premium?.icon;
                        
                        return (
                          <motion.li 
                            key={feature} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: featureIndex * 0.03 }}
                            className="flex items-start gap-3"
                          >
                            <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                              {feature}
                              {premium && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${premium.color}`}>
                                  <PremiumIcon className="w-3 h-3" />
                                  {premium.label}
                                </span>
                              )}
                            </span>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Add-ons */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Plus className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">Available Add-ons</span>
                    </div>
                    <ul className="space-y-2">
                      {addOns.map((addon) => {
                        const AddonIcon = addon.icon;
                        return (
                          <li key={addon.name} className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-sm text-muted-foreground">
                              <AddonIcon className="w-4 h-4 text-primary/60" />
                              {addon.name}
                            </span>
                            <span className="text-xs text-primary font-medium">Contact</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* CTA */}
                  {selectedPlan.buttonText === "Book a Call" ? (
                    <Button
                      variant="hero"
                      className="w-full"
                      size="lg"
                      asChild
                    >
                      <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">
                        {selectedPlan.buttonText}
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant="hero"
                      className="w-full"
                      size="lg"
                    >
                      Get Started with {selectedPlan.name}
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Stripe Payment Icons */}
        <StripePaymentIcons className="mt-10" />

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: ShieldCheck, title: "30-Day Money Back", desc: "Full refund guaranteed" },
            { icon: CreditCard, title: "Secure Payments", desc: "Stripe processing" },
            { icon: Clock, title: "Cancel Anytime", desc: "No contracts" },
            { icon: HeadphonesIcon, title: "24/7 Support", desc: "We're here to help" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center text-center p-3 rounded-lg glass-card border border-white/10"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-semibold text-xs mb-0.5">{item.title}</h4>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
