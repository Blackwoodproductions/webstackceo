import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, MapPin, Phone, Globe, Star, Building2,
  UtensilsCrossed, ShoppingBag, Heart, Briefcase, Home, Car,
  Sparkles, Landmark, Scale, GraduationCap, Music, Building, 
  Laptop, Plane, Dumbbell, Check, ShieldCheck, CreditCard, Clock, HeadphonesIcon, Zap, Crown, Shield, Flame
} from "lucide-react";
import DirectoryListingDialog from "@/components/directory/DirectoryListingDialog";

const iconMap: Record<string, any> = {
  UtensilsCrossed, ShoppingBag, Heart, Briefcase, Home, Car,
  Sparkles, Landmark, Scale, GraduationCap, Music, Building, 
  Laptop, Plane, Dumbbell
};

// Premium features that get special badges
const premiumFeatures: Record<string, { icon: typeof Sparkles; label: string; color: string }> = {
  "Free directory listing": { icon: Star, label: "Included", color: "from-emerald-400 to-green-500" },
  "Free Marketplace Listing": { icon: Star, label: "Included", color: "from-emerald-400 to-green-500" },
  "AEO and GEO signals": { icon: Sparkles, label: "AI Ready", color: "from-fuchsia-400 to-pink-500" },
  "DA - DR BOOSTER": { icon: Zap, label: "Power", color: "from-amber-400 to-orange-500" },
  "Up to 40% off normal keyword pricing": { icon: Crown, label: "Deal", color: "from-violet-400 to-purple-500" },
  "Up to 60% off normal pricing": { icon: Crown, label: "Best Deal", color: "from-cyan-400 to-blue-500" },
};

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

const directoryPlans = [
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
    originalPrice: 150,
    hasScarcity: true,
  },
  {
    name: "White Label",
    monthlyPrice: 499,
    yearlyPrice: 399,
    description: "Resell our services under your brand",
    features: [
      "Everything in Business CEO",
      "Free Marketplace Listing",
      "Up to 40% off normal keyword pricing",
      "White-label dashboard & reports",
      "Custom branding on all deliverables",
      "Priority 24/7 support",
      "Bulk client management tools",
      "Dedicated account manager",
      "White-label everything",
    ],
    highlighted: true,
  },
  {
    name: "Super Reseller",
    monthlyPrice: 1499,
    yearlyPrice: 1199,
    description: "Enterprise API access for agencies at scale",
    features: [
      "Everything in White Label",
      "Up to 60% off normal pricing",
      "Full API access to all data",
      "Custom integrations & webhooks",
      "Volume-based enterprise pricing",
      "Dedicated success team",
      "Priority enterprise support",
    ],
    highlighted: false,
    buttonText: "Book a Call",
  },
];

const Directory = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const positionsLeft = useMemo(() => getPositionsLeft(), []);

  const { data: categories = [] } = useQuery({
    queryKey: ["directory-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directory_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: listings = [] } = useQuery({
    queryKey: ["directory-listings", selectedCategory, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("directory_listings")
        .select("*, directory_categories(name, icon)")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("display_order");

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }

      if (searchTerm) {
        query = query.or(`business_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-40 right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl"
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Business Directory
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Find Local{" "}
                <span className="gradient-text">Businesses</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Discover trusted businesses in your area. Browse by category or search for exactly what you need.
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto flex gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search businesses, services, or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-14 text-lg bg-background/80 backdrop-blur-sm border-border/50"
                  />
                </div>
              </div>

              <Button 
                variant="hero" 
                size="lg"
                onClick={() => setIsDialogOpen(true)}
                className="transition-all duration-300 hover:from-amber-400 hover:to-yellow-500 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]"
              >
                List Your Business - $49/year
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8 border-y border-border/50">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === null
                    ? "bg-primary text-primary-foreground"
                    : "glass-card text-muted-foreground hover:text-foreground"
                }`}
              >
                All Categories
              </button>
              {categories.map((category: any) => {
                const IconComponent = iconMap[category.icon] || Building2;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "glass-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Listings Grid */}
        <section className="py-16">
          <div className="container mx-auto px-6 max-w-6xl">
            {listings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No listings found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || selectedCategory
                    ? "Try adjusting your search or category filter."
                    : "Be the first to list your business in our directory!"}
                </p>
                <Button 
                  variant="hero" 
                  onClick={() => setIsDialogOpen(true)}
                  className="transition-all duration-300 hover:from-amber-400 hover:to-yellow-500 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]"
                >
                  List Your Business
                </Button>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing: any, index: number) => {
                  const CategoryIcon = listing.directory_categories?.icon 
                    ? iconMap[listing.directory_categories.icon] 
                    : Building2;
                  return (
                    <Link
                      key={listing.id}
                      to={`/directory/${listing.slug}`}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`glass-card rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full ${
                          listing.is_featured ? "ring-2 ring-amber-400/50" : ""
                        }`}
                      >
                        {listing.is_featured && (
                          <span className="inline-block px-3 py-1 rounded-full bg-amber-400/20 text-amber-400 text-xs font-medium mb-3">
                            Featured
                          </span>
                        )}
                        
                        <div className="flex items-start gap-4 mb-4">
                          {listing.logo_url ? (
                            <img 
                              src={listing.logo_url} 
                              alt={listing.business_name}
                              className="w-16 h-16 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center">
                              <CategoryIcon className="w-8 h-8 text-primary" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-foreground">
                              {listing.business_name}
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              {listing.directory_categories?.name}
                            </span>
                          </div>
                        </div>

                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {listing.description}
                        </p>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          {listing.city && listing.state && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{listing.city}, {listing.state}</span>
                            </div>
                          )}
                          {listing.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{listing.phone}</span>
                            </div>
                          )}
                          {listing.website_url && (
                            <div className="flex items-center gap-2 text-primary">
                              <Globe className="w-4 h-4" />
                              <span>Visit Website</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 relative overflow-hidden">
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
                Directory Pricing
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
                Get Your Business{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
                  Listed
                </span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Choose a plan that works for you. Business CEO includes a free directory listing!
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
              {directoryPlans.map((plan, index) => (
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
                  className={`relative rounded-2xl p-8 cursor-pointer transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary shadow-[0_0_40px_hsl(var(--primary)/0.2)]"
                      : "glass-card border border-white/10"
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
                    <p className="text-muted-foreground text-sm mb-4 min-h-[40px] flex items-center justify-center">
                      {plan.description}
                    </p>
                    
                    {/* Price display with original price strikethrough for Business CEO */}
                    <div className="flex items-baseline justify-center gap-2">
                      {plan.originalPrice && !isYearly && (
                        <span className="text-xl text-muted-foreground line-through">
                          ${plan.originalPrice}
                        </span>
                      )}
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
                    
                    {/* Half off badge for Business CEO */}
                    {plan.originalPrice && !isYearly && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-block mt-2"
                      >
                        <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          50% OFF
                        </span>
                      </motion.div>
                    )}
                    
                    {isYearly && plan.yearlyPrice && (
                      <p className="text-xs text-primary mt-1">
                        Billed annually (${plan.yearlyPrice * 12}/year)
                      </p>
                    )}
                    
                    {/* Scarcity indicator */}
                    {plan.hasScarcity && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 flex items-center justify-center gap-2"
                      >
                        <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                        <span className="text-sm font-medium text-orange-500">
                          Only {positionsLeft} spots left this month!
                        </span>
                      </motion.div>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => {
                      const premium = premiumFeatures[feature];
                      const PremiumIcon = premium?.icon;
                      
                      return (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                            {feature}
                            {premium && (
                              <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                transition={{ 
                                  delay: featureIndex * 0.05, 
                                  type: "spring", 
                                  stiffness: 400, 
                                  damping: 15 
                                }}
                                viewport={{ once: true }}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${premium.color} shadow-sm`}
                              >
                                <motion.span
                                  animate={{ rotate: [0, 10, -10, 0] }}
                                  transition={{ 
                                    duration: 2, 
                                    repeat: Infinity, 
                                    repeatDelay: 3 
                                  }}
                                >
                                  <PremiumIcon className="w-3 h-3" />
                                </motion.span>
                                {premium.label}
                              </motion.span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <Button
                    variant={plan.highlighted ? "hero" : "heroOutline"}
                    className="w-full"
                    size="lg"
                    asChild
                  >
                    <Link to="/pricing">{plan.buttonText || "Get Started"}</Link>
                  </Button>
                </motion.div>
              ))}
            </div>

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
              ].map((item) => (
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

            {/* Standalone Listing Option */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 glass-card rounded-3xl p-12 text-center"
            >
              <h3 className="text-2xl font-bold mb-4">
                Just Need a Directory Listing?
              </h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                If you only need a directory listing without our full SEO services, you can list your business for just $49/year.
              </p>
              <Button 
                variant="heroOutline" 
                size="lg"
                onClick={() => setIsDialogOpen(true)}
                className="transition-all duration-300 hover:border-amber-400/50 hover:text-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]"
              >
                List Your Business - $49/year
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />

      <DirectoryListingDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        categories={categories}
      />
    </div>
  );
};

export default Directory;
