import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, Star, Award, ExternalLink, ChevronDown,
  Search as SearchIcon, Link2, PenTool, MousePointerClick, Users, 
  Mail, Globe, BarChart3, MapPin, Cpu, Shield, TrendingUp, ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import { supabase } from "@/integrations/supabase/client";
import PartnerApplicationDialog from "@/components/marketplace/PartnerApplicationDialog";

// Icon mapping for categories
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search: SearchIcon,
  Link2: Link2,
  PenTool: PenTool,
  MousePointerClick: MousePointerClick,
  Users: Users,
  Mail: Mail,
  Globe: Globe,
  BarChart3: BarChart3,
  MapPin: MapPin,
  Cpu: Cpu,
  Shield: Shield,
  TrendingUp: TrendingUp,
};

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

interface Partner {
  id: string;
  company_name: string;
  slug: string;
  logo_url: string | null;
  description: string;
  website_url: string | null;
  category_id: string | null;
  is_sponsored: boolean;
  rating: number;
  review_count: number;
  ranking_score: number;
  created_at: string;
  marketplace_categories?: Category | null;
}

type SortOption = "ranking" | "rating" | "reviews" | "newest";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "ranking", label: "Top Ranked" },
  { value: "rating", label: "Highest Rated" },
  { value: "reviews", label: "Most Reviews" },
  { value: "newest", label: "Newest" },
];

const PARTNERS_PER_PAGE = 9;

const Marketplace = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("ranking");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchPartners();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("marketplace_categories")
      .select("*")
      .order("display_order");

    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchPartners = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("marketplace_partners")
      .select(`
        *,
        marketplace_categories (
          id, name, slug, description, icon
        )
      `)
      .order("is_sponsored", { ascending: false })
      .order("ranking_score", { ascending: false })
      .order("rating", { ascending: false });

    if (!error && data) {
      setPartners(data as Partner[]);
    }
    setIsLoading(false);
  };

  const filteredAndSortedPartners = useMemo(() => {
    let filtered = partners.filter((partner) => {
      const matchesCategory = !selectedCategory || partner.category_id === selectedCategory;
      const matchesSearch = !searchQuery || 
        partner.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Sort partners based on selected option
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return Number(b.rating) - Number(a.rating);
        case "reviews":
          return b.review_count - a.review_count;
        case "newest":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "ranking":
        default:
          return b.ranking_score - a.ranking_score;
      }
    });

    return sorted;
  }, [partners, selectedCategory, searchQuery, sortBy]);

  const sponsoredPartners = filteredAndSortedPartners.filter(p => p.is_sponsored);
  const regularPartners = filteredAndSortedPartners.filter(p => !p.is_sponsored);

  // Pagination calculations
  const totalPages = Math.ceil(regularPartners.length / PARTNERS_PER_PAGE);
  const paginatedRegularPartners = regularPartners.slice(
    (currentPage - 1) * PARTNERS_PER_PAGE,
    currentPage * PARTNERS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy]);

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const PartnerCard = ({ partner, isSponsored = false }: { partner: Partner; isSponsored?: boolean }) => {
    const CategoryIcon = partner.marketplace_categories?.icon 
      ? iconMap[partner.marketplace_categories.icon] 
      : Globe;

    return (
      <Link to={`/marketplace/${partner.slug}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`relative glass-card rounded-2xl p-6 transition-all duration-300 cursor-pointer hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:border-amber-400/30 border ${
            isSponsored ? "border-primary/50 shadow-[0_0_30px_hsl(var(--primary)/0.15)]" : "border-transparent"
          }`}
        >
          {isSponsored && (
            <div className="absolute -top-3 left-4">
              <span className="bg-gradient-to-r from-cyan-400 to-violet-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <Award className="w-3 h-3" />
                Sponsored
              </span>
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center shrink-0">
              {partner.logo_url ? (
                <img src={partner.logo_url} alt={partner.company_name} className="w-12 h-12 object-contain rounded-lg" />
              ) : (
                <CategoryIcon className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-foreground truncate">{partner.company_name}</h3>
              {partner.marketplace_categories && (
                <span className="text-xs text-primary font-medium">
                  {partner.marketplace_categories.name}
                </span>
              )}
              {renderStars(Number(partner.rating))}
            </div>
          </div>

          <p className="text-muted-foreground text-sm mt-4 line-clamp-3">
            {partner.description}
          </p>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {partner.review_count} reviews
            </span>
            <Button variant="ghost" size="sm" className="pointer-events-none">
              View Profile <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </motion.div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"
            animate={{ y: [0, 30, 0] }}
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
                Partner Marketplace
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Find Trusted{" "}
                <span className="gradient-text">Marketing Partners</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Connect with vetted SEO agencies, link builders, and digital marketing experts. 
                Ranked by performance and client satisfaction.
              </p>
              <Button 
                variant="hero" 
                size="lg"
                onClick={() => setIsApplicationOpen(true)}
              >
                Become a Partner
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Search & Filter Section */}
        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="flex flex-col gap-4">
              {/* Search and Sort Row */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search partners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Category Filter Row */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "hero" : "heroOutline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Button>
                {categories.map((category) => {
                  const Icon = category.icon ? iconMap[category.icon] : Globe;
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "hero" : "heroOutline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex items-center gap-1"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden lg:inline">{category.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Sponsored Section */}
        {sponsoredPartners.length > 0 && (
          <section className="py-12 bg-secondary/20">
            <div className="container mx-auto px-6 max-w-6xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Award className="w-6 h-6 text-primary" />
                  Featured Partners
                </h2>
                <p className="text-muted-foreground">Premium partners with proven track records</p>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sponsoredPartners.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} isSponsored />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Partners Section */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Top Rated Partners
              </h2>
              <p className="text-muted-foreground">
                Ranked by performance, reviews, and client satisfaction
              </p>
            </motion.div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-muted" />
                      <div className="flex-1">
                        <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-16 bg-muted rounded mt-4" />
                  </div>
                ))}
              </div>
            ) : regularPartners.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedRegularPartners.map((partner) => (
                    <PartnerCard key={partner.id} partner={partner} />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {getPageNumbers().map((page, index) => (
                          <PaginationItem key={index}>
                            {page === "ellipsis" ? (
                              <PaginationEllipsis />
                            ) : (
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            )}
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Showing {(currentPage - 1) * PARTNERS_PER_PAGE + 1}-{Math.min(currentPage * PARTNERS_PER_PAGE, regularPartners.length)} of {regularPartners.length} partners
                    </p>
                  </div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No partners found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || selectedCategory 
                    ? "Try adjusting your search or filters"
                    : "Be the first to join our marketplace!"}
                </p>
                <Button variant="hero" onClick={() => setIsApplicationOpen(true)}>
                  Become a Partner
                </Button>
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Grow Your{" "}
                <span className="gradient-text">Agency?</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join our curated marketplace and connect with businesses looking for your expertise.
              </p>
              <Button variant="hero" size="lg" onClick={() => setIsApplicationOpen(true)}>
                Apply to Join
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />

      <PartnerApplicationDialog 
        open={isApplicationOpen} 
        onOpenChange={setIsApplicationOpen}
        categories={categories}
      />
    </div>
  );
};

export default Marketplace;
