import { motion } from "framer-motion";
import { Check, Star, ShieldCheck, CreditCard, Clock, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const plans = [
  {
    name: "Growth",
    monthlyPrice: 75,
    yearlyPrice: 60,
    description: "Everything you need to dominate local SEO",
    features: [
      "15 keyword phrases",
      "Uptime monitoring",
      "Bi-weekly SEO ranking reports",
      "15 SEO rich content pages",
      "25 relevant business partners",
      "Up to 125 targeted internal links",
      "DA - DR BOOSTER",
      "In-depth analytics",
    ],
    highlighted: true,
    hasToggle: true,
  },
  {
    name: "White Label",
    monthlyPrice: 499,
    yearlyPrice: 399,
    description: "Resell our services under your brand",
    features: [
      "Everything in Growth plan",
      "Up to 40% off normal keyword pricing",
      "White-label dashboard & reports",
      "Custom branding on all deliverables",
      "Priority 24/7 support",
      "Bulk client management tools",
      "Dedicated account manager",
      "Advanced security & encryption",
      "Client onboarding assistance",
      "Multi-client analytics dashboard",
      "Reseller training & resources",
    ],
    highlighted: false,
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
      "White-label everything",
      "Dedicated success team",
      "Priority enterprise support",
      "Custom SLA agreements",
      "SOC 2 compliant infrastructure",
      "Dedicated security protocols",
      "Quarterly business reviews",
      "Early access to new features",
    ],
    highlighted: false,
    hasToggle: true,
  },
];

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-medium tracking-wider uppercase text-sm">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the plan that fits your needs. No hidden fees, no surprises.
            Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
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
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.03, 
                y: -8,
                transition: { duration: 0.2 }
              }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-8 cursor-pointer transition-shadow duration-300 hover:shadow-[0_20px_50px_hsl(var(--primary)/0.15)] ${
                plan.highlighted
                  ? "bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary shadow-[0_0_40px_hsl(var(--primary)/0.2)]"
                  : "glass-card border border-white/10 hover:border-primary/30"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-400 to-violet-500 text-white text-sm font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-4 h-4 fill-current" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <motion.span 
                    key={isYearly ? 'yearly' : 'monthly'}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-bold"
                  >
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </motion.span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {isYearly && plan.yearlyPrice && (
                  <p className="text-xs text-primary mt-1">
                    Billed annually (${plan.yearlyPrice * 12}/year)
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "hero" : "heroOutline"}
                className="w-full"
                size="lg"
              >
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Comparison note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground mt-12"
        >
          All plans include a 14-day free trial. No credit card required.
        </motion.p>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { icon: ShieldCheck, title: "30-Day Money Back", desc: "Full refund, no questions asked" },
            { icon: CreditCard, title: "Secure Payments", desc: "256-bit SSL encryption" },
            { icon: Clock, title: "Cancel Anytime", desc: "No long-term contracts" },
            { icon: HeadphonesIcon, title: "24/7 Support", desc: "We're here to help" },
          ].map((item, index) => (
            <div
              key={item.title}
              className="flex flex-col items-center text-center p-4 rounded-xl glass-card border border-white/10"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
