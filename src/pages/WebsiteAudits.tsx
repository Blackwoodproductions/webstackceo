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
  ExternalLink,
  TrendingUp,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  ecommerce: 'E-commerce',
  saas: 'SaaS / Software',
  local_business: 'Local Business',
  blog_media: 'Blog / Media',
  professional_services: 'Professional Services',
  healthcare: 'Healthcare',
  finance: 'Finance',
  education: 'Education',
  real_estate: 'Real Estate',
  hospitality: 'Hospitality',
  nonprofit: 'Nonprofit',
  technology: 'Technology',
  other: 'General Business',
};

const WebsiteAudits = () => {
  const [audits, setAudits] = useState<SavedAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
      selectedCategory === "all" || audit.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group audits by category
  const groupedAudits = filteredAudits.reduce((acc, audit) => {
    const cat = audit.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(audit);
    return acc;
  }, {} as Record<string, SavedAudit[]>);

  const categories = Object.keys(categoryLabels);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Website Audits | SEO Analysis Archive"
        description="Browse our archive of website SEO audits. Find detailed analysis of websites across various industries including e-commerce, SaaS, local businesses, and more."
      />
      <Navbar />
      <BackToTop />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Search className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">SEO Audit Archive</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Website{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-400 bg-clip-text text-transparent">
                Audits
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse our collection of SEO audits across different industries. Each audit includes
              detailed metrics, recommendations, and insights.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-4 mb-8"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by domain or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

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
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Be the first to run an audit and save it here!"}
              </p>
              <Button asChild>
                <Link to="/">Run Free Audit</Link>
              </Button>
            </motion.div>
          )}

          {/* Audits by Category */}
          {!isLoading && selectedCategory === "all" && Object.keys(groupedAudits).length > 0 && (
            <div className="space-y-12">
              {Object.entries(groupedAudits).map(([category, categoryAudits]) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-bold">{categoryLabels[category] || category}</h2>
                    <Badge variant="secondary">{categoryAudits.length}</Badge>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryAudits.map((audit) => (
                      <AuditCard key={audit.id} audit={audit} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Flat list when filtering */}
          {!isLoading && selectedCategory !== "all" && filteredAudits.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAudits.map((audit) => (
                <AuditCard key={audit.id} audit={audit} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

const AuditCard = ({ audit }: { audit: SavedAudit }) => {
  return (
    <Link
      to={`/audit/${encodeURIComponent(audit.domain)}`}
      className="group block p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center overflow-hidden">
          {audit.favicon_url ? (
            <img
              src={audit.favicon_url}
              alt=""
              className="w-6 h-6"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
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
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
              <span>DR: {audit.domain_rating}</span>
            </div>
          )}
          {audit.organic_traffic !== null && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>{audit.organic_traffic.toLocaleString()} traffic</span>
            </div>
          )}
        </div>
        <Badge variant="outline" className="text-[10px]">
          {categoryLabels[audit.category] || audit.category}
        </Badge>
      </div>
    </Link>
  );
};

export default WebsiteAudits;
