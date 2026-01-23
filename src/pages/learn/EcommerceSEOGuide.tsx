import { Link } from "react-router-dom";
import { 
  ShoppingCart, CheckCircle2, ArrowRight, ArrowLeft, 
  Target, TrendingUp, Tag, Search, Package, CreditCard, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";
import ArticleNavigation from "@/components/ui/article-navigation";
import GlossaryLegend from "@/components/ui/glossary-legend";
import GuideFeatureLink from "@/components/ui/guide-feature-link";
import FadeIn from "@/components/ui/fade-in";
import GlossaryTooltip from "@/components/ui/glossary-tooltip";
import { getTermsByGuide } from "@/data/glossaryData";

// Get terms linked to this guide from shared glossary
const ecommerceTerms = getTermsByGuide("/learn/ecommerce-seo-guide").map(t => ({
  term: t.term,
  shortDescription: t.shortDescription,
  slug: t.slug
}));

const EcommerceSEOGuide = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="E-commerce SEO Guide - Learning Center"
        description="Master e-commerce SEO. Learn how to optimize product pages, category pages, and your entire online store for better search rankings and more sales."
        keywords="ecommerce SEO, product page SEO, category page optimization, online store SEO, product schema, shopping SEO"
        canonical="/learn/ecommerce-seo-guide"
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Learning Center", href: "/learn", altText: "Back to all guides" },
          { label: "E-commerce SEO Guide", altText: "E-commerce optimization guide" }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-orange-500/10" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <FadeIn>
              <Link to="/learn" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Learning Center
              </Link>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-sm font-medium">
                  SEO Fundamentals
                </span>
                <span className="text-sm text-muted-foreground">16 min read</span>
              </div>
              
              <GuideFeatureLink 
                title="E-commerce SEO:" 
                gradientText="Rank Products & Drive Sales" 
                featureHref="/features/on-page-seo" 
              />
              <p className="text-xl text-muted-foreground mt-6">
                E-commerce SEO requires unique strategies for product pages, categories, and technical optimization. Learn how to outrank competitors and drive organic sales.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="prose prose-lg prose-invert max-w-none">
              
              {/* Introduction */}
              <FadeIn className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                  What is E-commerce SEO?
                </h2>
                <p className="text-muted-foreground mb-4">
                  E-commerce SEO is the practice of optimizing online stores to rank higher in search engines. It involves optimizing product pages, category pages, and the overall site architecture to attract organic traffic that converts into sales.
                </p>
                <p className="text-muted-foreground">
                  Unlike content sites, e-commerce SEO focuses heavily on commercial and transactional keywords—terms people use when they're ready to buy.
                </p>
              </FadeIn>

              {/* Product Page Optimization */}
              <FadeIn delay={50} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Package className="w-6 h-6 text-primary" />
                  Product Page Optimization
                </h2>
                <div className="space-y-4">
                  {[
                    { element: "Product Titles", tip: "Include primary keyword + brand + key attributes (size, color, model)" },
                    { element: "Product Descriptions", tip: "Write unique, detailed descriptions—never use manufacturer copy" },
                    { element: "Product Images", tip: "Multiple angles, zoom capability, descriptive alt text with keywords" },
                    { element: "URL Structure", tip: "Clean URLs: /category/product-name not /product.php?id=12345" },
                    { element: "Customer Reviews", tip: "Enable and encourage reviews—they add unique content and build trust" },
                    { element: "Product Schema", tip: "Implement Product schema for rich snippets (price, availability, ratings)" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.element}</p>
                      <p className="text-sm text-muted-foreground">{item.tip}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Category Pages */}
              <FadeIn delay={100} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Search className="w-6 h-6 text-primary" />
                  Category Page Strategy
                </h2>
                <p className="text-muted-foreground mb-4">
                  Category pages often have the highest SEO potential in e-commerce because they target broader keywords with higher search volume.
                </p>
                <ul className="space-y-2">
                  {[
                    "Add unique introductory content (150-300 words) above product grids",
                    "Include the primary keyword in H1, meta title, and description",
                    "Use faceted navigation wisely—canonicalize filtered pages",
                    "Link to subcategories and related categories",
                    "Show enough products per page (20-40) to reduce pagination issues",
                    "Add FAQ sections for common category questions"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* Technical E-commerce SEO */}
              <FadeIn delay={150} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-primary" />
                  Technical E-commerce SEO
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { issue: "Duplicate Content", solution: "Use canonical tags for product variations and filtered pages" },
                    { issue: "Out-of-Stock Pages", solution: "Keep pages live with 'notify me' options; don't 404 seasonal products" },
                    { issue: "Site Speed", solution: "Optimize images, use lazy loading, implement CDN for product media" },
                    { issue: "Internal Linking", solution: "Cross-sell and related products create valuable internal link networks" },
                    { issue: "Crawl Budget", solution: "Block faceted navigation parameters in robots.txt if needed" },
                    { issue: "HTTPS & Security", solution: "SSL is mandatory for e-commerce—affects rankings and trust" }
                  ].map((item, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-foreground font-medium mb-1">{item.issue}</p>
                      <p className="text-sm text-muted-foreground">{item.solution}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Schema Markup */}
              <FadeIn delay={200} className="glass-card rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Star className="w-6 h-6 text-primary" />
                  E-commerce Schema Markup
                </h2>
                <p className="text-muted-foreground mb-4">
                  Schema markup helps your products appear with rich snippets in search results, showing prices, ratings, and availability.
                </p>
                <ul className="space-y-2">
                  {[
                    "Product schema: name, description, SKU, brand, price, currency",
                    "Offer schema: price, availability, price valid until",
                    "AggregateRating: average rating and review count",
                    "Review schema: individual customer reviews",
                    "BreadcrumbList: navigation path to the product",
                    "Organization schema: your store's contact and social info"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>

              {/* CTA */}
              <FadeIn delay={250} className="glass-card rounded-2xl p-8 text-center bg-gradient-to-br from-amber-400/10 to-orange-500/10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Boost Your Store's Rankings?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Webstack.ceo helps e-commerce sites optimize on-page elements and track product rankings.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/features/on-page-seo">
                      Explore On-Page SEO <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/pricing">Start Free Trial</Link>
                  </Button>
                </div>
              </FadeIn>

              {/* Glossary Legend */}
              <GlossaryLegend terms={ecommerceTerms} />

              {/* Article Navigation */}
              <ArticleNavigation
                previous={{
                  title: "Mobile SEO Guide",
                  href: "/learn/mobile-seo-guide",
                  category: "SEO Fundamentals"
                }}
                next={{
                  title: "Complete Guide to On-Page SEO",
                  href: "/learn/on-page-seo-guide",
                  category: "SEO Fundamentals"
                }}
              />

            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default EcommerceSEOGuide;
