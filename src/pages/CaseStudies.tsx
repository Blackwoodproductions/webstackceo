import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SEO from '@/components/SEO';
import BackToTop from '@/components/ui/back-to-top';
import {
  TrendingUp,
  Globe,
  Building2,
  ShoppingCart,
  Briefcase,
  Heart,
  GraduationCap,
  Home,
  Utensils,
  Laptop,
  BarChart3,
  Users,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Category configuration matching audit_category enum
const categoryConfig: Record<string, { label: string; icon: typeof Globe; color: string; gradient: string }> = {
  ecommerce: { label: 'E-Commerce', icon: ShoppingCart, color: 'text-emerald-400', gradient: 'from-emerald-500/10 to-green-500/10' },
  saas: { label: 'SaaS', icon: Laptop, color: 'text-blue-400', gradient: 'from-blue-500/10 to-indigo-500/10' },
  local_business: { label: 'Local Business', icon: Building2, color: 'text-amber-400', gradient: 'from-amber-500/10 to-orange-500/10' },
  blog_media: { label: 'Blog & Media', icon: BarChart3, color: 'text-purple-400', gradient: 'from-purple-500/10 to-violet-500/10' },
  professional_services: { label: 'Professional Services', icon: Briefcase, color: 'text-cyan-400', gradient: 'from-cyan-500/10 to-blue-500/10' },
  healthcare: { label: 'Healthcare', icon: Heart, color: 'text-rose-400', gradient: 'from-rose-500/10 to-pink-500/10' },
  finance: { label: 'Finance', icon: TrendingUp, color: 'text-green-400', gradient: 'from-green-500/10 to-emerald-500/10' },
  education: { label: 'Education', icon: GraduationCap, color: 'text-indigo-400', gradient: 'from-indigo-500/10 to-purple-500/10' },
  real_estate: { label: 'Real Estate', icon: Home, color: 'text-teal-400', gradient: 'from-teal-500/10 to-cyan-500/10' },
  hospitality: { label: 'Hospitality', icon: Utensils, color: 'text-orange-400', gradient: 'from-orange-500/10 to-amber-500/10' },
  nonprofit: { label: 'Nonprofit', icon: Users, color: 'text-pink-400', gradient: 'from-pink-500/10 to-rose-500/10' },
  technology: { label: 'Technology', icon: Laptop, color: 'text-violet-400', gradient: 'from-violet-500/10 to-purple-500/10' },
  other: { label: 'Other', icon: Globe, color: 'text-gray-400', gradient: 'from-gray-500/10 to-slate-500/10' },
};

interface CaseStudy {
  id: string;
  domain: string;
  slug: string;
  category: string;
  site_title: string | null;
  site_summary: string | null;
  favicon_url: string | null;
  domain_rating: number | null;
  organic_traffic: number | null;
  created_at: string;
  // Progress data from first audit
  initial_dr?: number | null;
  initial_traffic?: number | null;
}

const CaseStudies = () => {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCaseStudies = async () => {
      try {
        // Get all saved audits
        const { data: audits, error } = await supabase
          .from('saved_audits')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch baseline history for each audit
        const studiesWithProgress = await Promise.all(
          (audits || []).map(async (audit) => {
            const { data: history } = await supabase
              .from('audit_history')
              .select('domain_rating, organic_traffic')
              .eq('domain', audit.domain)
              .order('snapshot_at', { ascending: true })
              .limit(1)
              .maybeSingle();

            return {
              ...audit,
              initial_dr: history?.domain_rating,
              initial_traffic: history?.organic_traffic ? Number(history.organic_traffic) : null,
            };
          })
        );

        setCaseStudies(studiesWithProgress);
      } catch (err) {
        console.error('Error fetching case studies:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseStudies();
  }, []);

  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    caseStudies.forEach((study) => {
      const cat = study.category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(categoryConfig)
      .filter(([key]) => counts[key] > 0)
      .map(([key, config]) => ({
        key,
        ...config,
        count: counts[key] || 0,
      }));
  }, [caseStudies]);

  const filteredStudies = useMemo(() => {
    if (!selectedCategory) return caseStudies;
    return caseStudies.filter((s) => s.category === selectedCategory);
  }, [caseStudies, selectedCategory]);

  const calculateImprovement = (current: number | null, initial: number | null) => {
    if (!current || !initial || initial === 0) return null;
    return Math.round(((current - initial) / initial) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="SEO Case Studies | Webstack.ceo"
        description="Browse real SEO case studies showing measurable improvements in domain rating, organic traffic, and search visibility across various industries."
        keywords="SEO case studies, domain rating improvement, organic traffic growth, SEO results, SEO success stories"
        canonical="/case-studies"
      />
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Real Results
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              SEO <span className="text-primary">Case Studies</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Automated progress tracking showing real SEO improvements over time.
              Browse by industry to find case studies relevant to your niche.
            </p>
          </motion.div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !selectedCategory
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              All ({caseStudies.length})
            </button>
            {categoriesWithCounts.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === cat.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {cat.label} ({cat.count})
                </button>
              );
            })}
          </div>

          {/* Case Studies Grid */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredStudies.length === 0 ? (
            <div className="text-center py-20">
              <Globe className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Case Studies Yet</h3>
              <p className="text-muted-foreground">
                Run your first SEO audit to start building your case study library.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudies.map((study, index) => {
                const config = categoryConfig[study.category] || categoryConfig.other;
                const IconComponent = config.icon;
                const drImprovement = calculateImprovement(study.domain_rating, study.initial_dr);
                const trafficImprovement = calculateImprovement(
                  study.organic_traffic ? Number(study.organic_traffic) : null,
                  study.initial_traffic
                );

                return (
                  <motion.div
                    key={study.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/case-study/${study.slug}`}>
                      <Card className={`h-full hover:border-primary/50 transition-all hover:shadow-lg bg-gradient-to-br ${config.gradient} border-border/50`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {study.favicon_url ? (
                                <img
                                  src={study.favicon_url}
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-contain bg-background/50"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center ${config.color}`}>
                                  <IconComponent className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <CardTitle className="text-base font-semibold line-clamp-1">
                                  {study.domain}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {study.site_title || config.label}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className={`${config.color} border-current/30 text-xs`}>
                              {config.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {study.site_summary && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {study.site_summary}
                            </p>
                          )}

                          {/* Progress Metrics */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-background/50">
                              <p className="text-xs text-muted-foreground mb-1">Domain Rating</p>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-blue-400">
                                  {study.domain_rating ?? '—'}
                                </span>
                                {drImprovement !== null && drImprovement > 0 && (
                                  <span className="text-xs text-emerald-400 flex items-center">
                                    <TrendingUp className="w-3 h-3 mr-0.5" />
                                    +{drImprovement}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="p-3 rounded-lg bg-background/50">
                              <p className="text-xs text-muted-foreground mb-1">Organic Traffic</p>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-green-400">
                                  {study.organic_traffic
                                    ? study.organic_traffic >= 1000
                                      ? `${(Number(study.organic_traffic) / 1000).toFixed(1)}k`
                                      : study.organic_traffic
                                    : '—'}
                                </span>
                                {trafficImprovement !== null && trafficImprovement > 0 && (
                                  <span className="text-xs text-emerald-400 flex items-center">
                                    <TrendingUp className="w-3 h-3 mr-0.5" />
                                    +{trafficImprovement}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Since {new Date(study.created_at).toLocaleDateString()}</span>
                            <span className="flex items-center text-primary">
                              View Case Study <ArrowRight className="w-3 h-3 ml-1" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default CaseStudies;
