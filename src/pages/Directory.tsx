import { useState } from "react";
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
  Laptop, Plane, Dumbbell
} from "lucide-react";
import DirectoryListingDialog from "@/components/directory/DirectoryListingDialog";

const iconMap: Record<string, any> = {
  UtensilsCrossed, ShoppingBag, Heart, Briefcase, Home, Car,
  Sparkles, Landmark, Scale, GraduationCap, Music, Building, 
  Laptop, Plane, Dumbbell
};

const Directory = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

        {/* CTA Section */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-violet-500/10" />
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-3xl p-12 text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Get Your Business Listed
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join our directory for just $49/year and reach thousands of potential customers looking for services like yours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="hero" 
                  size="lg"
                  onClick={() => setIsDialogOpen(true)}
                  className="transition-all duration-300 hover:from-amber-400 hover:to-yellow-500 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]"
                >
                  List Your Business - $49/year
                </Button>
              </div>
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
