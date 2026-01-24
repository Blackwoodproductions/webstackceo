import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import BackToTop from "@/components/ui/back-to-top";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Search,
  Filter,
  TrendingUp,
  ChevronRight,
  LayoutGrid,
  List,
  Building2,
  ShoppingCart,
  Code,
  Newspaper,
  Briefcase,
  Heart,
  DollarSign,
  GraduationCap,
  Home,
  Utensils,
  Users,
  Cpu,
  HelpCircle,
  CheckCircle2,
  Link2,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface SavedAudit {
  id: string;
  domain: string;
  slug: string;
  category: string;
  site_title: string | null;
  site_summary: string | null;
  favicon_url: string | null;
  logo_url: string | null;
  domain_rating: number | null;
  organic_traffic: number | null;
  organic_keywords: number | null;
  submitter_email: string | null;
  created_at: string;
}

const categoryConfig: Record<string, { label: string; icon: typeof Globe; color: string }> = {
  ecommerce: { label: 'E-commerce', icon: ShoppingCart, color: 'from-emerald-400 to-green-500' },
  saas: { label: 'SaaS / Software', icon: Code, color: 'from-blue-400 to-indigo-500' },
  local_business: { label: 'Local Business', icon: Building2, color: 'from-amber-400 to-orange-500' },
  blog_media: { label: 'Blog / Media', icon: Newspaper, color: 'from-pink-400 to-rose-500' },
  professional_services: { label: 'Professional Services', icon: Briefcase, color: 'from-slate-400 to-gray-500' },
  healthcare: { label: 'Healthcare', icon: Heart, color: 'from-red-400 to-pink-500' },
  finance: { label: 'Finance', icon: DollarSign, color: 'from-green-400 to-emerald-500' },
  education: { label: 'Education', icon: GraduationCap, color: 'from-violet-400 to-purple-500' },
  real_estate: { label: 'Real Estate', icon: Home, color: 'from-cyan-400 to-blue-500' },
  hospitality: { label: 'Hospitality', icon: Utensils, color: 'from-orange-400 to-red-500' },
  nonprofit: { label: 'Nonprofit', icon: Users, color: 'from-teal-400 to-cyan-500' },
  technology: { label: 'Technology', icon: Cpu, color: 'from-indigo-400 to-violet-500' },
  other: { label: 'General Business', icon: HelpCircle, color: 'from-gray-400 to-slate-500' },
};

const WebsiteAudits = () => {
  const [audits, setAudits] = useState<SavedAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchAudits = async () => {
      const { data, error } = await supabase
        .from("saved_audits")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching audits:", error);
      } else {
        setAudits(data || []);
      }
      setIsLoading(false);
    };

    fetchAudits();
  }, []);

  // Filter audits
  const filteredAudits = audits.filter((audit) => {
    const matchesSearch =
      audit.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (audit.site_title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory =
      !selectedCategory || audit.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group audits by category
  const groupedAudits = audits.reduce((acc, audit) => {
    const cat = audit.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(audit);
    return acc;
  }, {} as Record<string, SavedAudit[]>);

  // Get categories with counts
  const categoriesWithCounts = Object.entries(groupedAudits)
    .map(([key, items]) => ({ key, count: items.length, ...categoryConfig[key] }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Domain Audits | Analysis Archive"
        description="Browse our archive of domain audits. Find detailed analysis of websites across various industries including e-commerce, SaaS, local businesses, and more."
      />
      <Navbar />
      <BackToTop />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Search className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Domain Audit Archive</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Domain{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-400 bg-clip-text text-transparent">
                Audits
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse our collection of domain audits across different industries. Each audit includes
              detailed metrics, recommendations, and insights.
            </p>
          </motion.div>

          {/* Category Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Browse by Category</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* All Categories Card */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`p-4 rounded-xl border transition-all text-left ${
                  !selectedCategory
                    ? 'bg-primary/10 border-primary/50 shadow-lg shadow-primary/10'
                    : 'bg-card border-border/50 hover:border-primary/30'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center mb-3">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium text-sm">All Categories</p>
                <p className="text-xs text-muted-foreground">{audits.length} audits</p>
              </button>
              
              {categoriesWithCounts.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      selectedCategory === cat.key
                        ? 'bg-primary/10 border-primary/50 shadow-lg shadow-primary/10'
                        : 'bg-card border-border/50 hover:border-primary/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color} bg-opacity-20 flex items-center justify-center mb-3`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <p className="font-medium text-sm truncate">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.count} audits</p>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by domain or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          {/* Selected Category Header */}
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="text-muted-foreground"
              >
                ← Back to all
              </Button>
              <div className="h-6 w-px bg-border" />
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {categoryConfig[selectedCategory]?.label || selectedCategory}
                <Badge variant="secondary">{filteredAudits.length}</Badge>
              </h2>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-card border border-border/50 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-32 bg-muted rounded" />
                      <div className="h-4 w-24 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-muted rounded mb-2" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && filteredAudits.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No audits found</h2>
              <p className="text-muted-foreground mb-6">
                {searchQuery || selectedCategory
                  ? "Try adjusting your search or filter criteria."
                  : "Be the first to run an audit and save it here!"}
              </p>
              <Button asChild>
                <Link to="/">Run Free Audit</Link>
              </Button>
            </motion.div>
          )}

          {/* Audits Grid/List */}
          {!isLoading && filteredAudits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={viewMode === 'grid' 
                ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }
            >
              {filteredAudits.map((audit, index) => (
                <AuditCard key={audit.id} audit={audit} viewMode={viewMode} index={index} />
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

const AuditCard = ({ audit, viewMode, index }: { audit: SavedAudit; viewMode: 'grid' | 'list'; index: number }) => {
  const config = categoryConfig[audit.category] || categoryConfig.other;
  const IconComponent = config.icon;

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <Link
          to={`/audit/${encodeURIComponent(audit.domain)}`}
          className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
        >
          <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center overflow-hidden">
            {audit.favicon_url ? (
              <img
                src={audit.favicon_url}
                alt=""
                className="w-6 h-6"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <Globe className="w-6 h-6 text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
              {audit.site_title || audit.domain}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{audit.domain}</p>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm">
            {audit.domain_rating !== null && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-medium">DR: {audit.domain_rating}</span>
              </div>
            )}
            {audit.organic_traffic !== null && (
              <span className="text-muted-foreground">
                {audit.organic_traffic.toLocaleString()} traffic
              </span>
            )}
            {audit.submitter_email && (
              <div className="flex items-center gap-1 text-green-500">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">Claimed</span>
              </div>
            )}
          </div>
          
          <Badge variant="outline" className={`bg-gradient-to-r ${config.color} text-white border-0 text-xs`}>
            {config.label}
          </Badge>
          
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/audit/${encodeURIComponent(audit.domain)}`}
        className="group block p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 h-full"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center overflow-hidden">
            {audit.favicon_url ? (
              <img
                src={audit.favicon_url}
                alt=""
                className="w-6 h-6"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <Globe className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
              {audit.site_title || audit.domain}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{audit.domain}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
        </div>

        {audit.site_summary && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {audit.site_summary}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-4 text-xs">
            {audit.domain_rating !== null && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="font-medium">DR: {audit.domain_rating}</span>
              </div>
            )}
            {audit.organic_traffic !== null && (
              <span className="text-muted-foreground">
                {audit.organic_traffic.toLocaleString()} traffic
              </span>
            )}
            {audit.submitter_email && (
              <div className="flex items-center gap-1 text-green-500">
                <CheckCircle2 className="w-3 h-3" />
                <span className="font-medium">Claimed</span>
              </div>
            )}
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r ${config.color} text-white text-[10px] font-medium`}>
            <IconComponent className="w-3 h-3" />
            {config.label}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default WebsiteAudits;