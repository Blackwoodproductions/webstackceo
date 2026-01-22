import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Map, Home, FileText, Users, DollarSign, HelpCircle, 
  Mail, Building2, Briefcase, Shield, BookOpen, Settings,
  Globe, BarChart3, Zap, Target, ArrowRight
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";

interface SitemapSection {
  title: string;
  icon: React.ElementType;
  links: { name: string; href: string; description?: string }[];
}

const sitemapData: SitemapSection[] = [
  {
    title: "Main Pages",
    icon: Home,
    links: [
      { name: "Home", href: "/", description: "Webstack.ceo homepage - AI-powered website management" },
      { name: "Features", href: "/features", description: "Explore all platform features" },
      { name: "Pricing", href: "/pricing", description: "View plans and pricing options" },
      { name: "About", href: "/about", description: "Learn about our company and mission" },
      { name: "Contact", href: "/contact", description: "Get in touch with our team" },
      { name: "FAQ", href: "/faq", description: "Frequently asked questions" },
      { name: "Careers", href: "/careers", description: "Join our team" },
    ]
  },
  {
    title: "Features",
    icon: Settings,
    links: [
      { name: "On-Page SEO", href: "/features/on-page-seo", description: "Optimize your page content" },
      { name: "Off-Page SEO", href: "/features/off-page-seo", description: "Build authority and backlinks" },
      { name: "Automated Blog", href: "/features/automated-blog", description: "AI-powered content creation" },
      { name: "FAQ Generation", href: "/features/faq-generation", description: "Generate SEO-optimized FAQs" },
      { name: "Traffic De-Anonymization", href: "/features/traffic-de-anonymization", description: "Identify anonymous visitors" },
      { name: "Visitor Intelligence", href: "/features/visitor-intelligence", description: "Understand your audience" },
      { name: "PPC Landing Pages", href: "/features/ppc-landing-pages", description: "High-converting landing pages" },
      { name: "Domain Authority", href: "/features/domain-authority", description: "Build domain trust" },
      { name: "Advanced Analytics", href: "/features/advanced-analytics", description: "Deep performance insights" },
      { name: "GMB Optimization", href: "/features/gmb-optimization", description: "Local search optimization" },
      { name: "Uptime Monitoring", href: "/features/uptime-monitoring", description: "24/7 site monitoring" },
      { name: "Web Hosting", href: "/features/web-hosting", description: "Fast, reliable hosting" },
      { name: "Social Signals", href: "/features/social-signals", description: "Social media integration" },
    ]
  },
  {
    title: "Learning Center",
    icon: BookOpen,
    links: [
      { name: "Learning Center Hub", href: "/learn", description: "All guides and tutorials" },
      { name: "On-Page SEO Guide", href: "/learn/on-page-seo-guide", description: "Master on-page optimization" },
      { name: "Off-Page SEO Guide", href: "/learn/off-page-seo-guide", description: "Build off-page authority" },
      { name: "Technical SEO Guide", href: "/learn/technical-seo-guide", description: "Technical SEO essentials" },
      { name: "Analytics Guide", href: "/learn/analytics-guide", description: "Master website analytics" },
      { name: "Visitor Intelligence Guide", href: "/learn/visitor-intelligence-guide", description: "Know your visitors" },
      { name: "Traffic De-Anonymization Guide", href: "/learn/traffic-deanonymization-guide", description: "Reveal anonymous traffic" },
      { name: "Automated Blogging Guide", href: "/learn/automated-blogging-guide", description: "Scale content creation" },
      { name: "FAQ Generation Guide", href: "/learn/faq-generation-guide", description: "FAQ content for SEO" },
      { name: "Social Signals Guide", href: "/learn/social-signals-guide", description: "Social media & SEO" },
      { name: "GMB Optimization Guide", href: "/learn/gmb-optimization-guide", description: "Google Business Profile" },
      { name: "Local SEO Guide", href: "/learn/local-seo-guide", description: "Dominate local search" },
      { name: "Domain Authority Guide", href: "/learn/domain-authority-guide", description: "Build domain authority" },
      { name: "Link Building Guide", href: "/learn/link-building-guide", description: "Ethical link building" },
      { name: "Uptime Monitoring Guide", href: "/learn/uptime-monitoring-guide", description: "Site reliability" },
      { name: "Web Hosting Guide", href: "/learn/web-hosting-guide", description: "Hosting for SEO" },
      { name: "Core Web Vitals Guide", href: "/learn/core-web-vitals-guide", description: "Page experience metrics" },
      { name: "PPC Landing Pages Guide", href: "/learn/ppc-landing-pages-guide", description: "Convert PPC traffic" },
      { name: "CRO Guide", href: "/learn/cro-guide", description: "Conversion optimization" },
    ]
  },
  {
    title: "SEO Glossary",
    icon: FileText,
    links: [
      { name: "Glossary Index", href: "/learn/glossary", description: "A-Z SEO terminology" },
      { name: "Title Tag", href: "/learn/glossary/title-tag", description: "HTML title element" },
      { name: "Meta Description", href: "/learn/glossary/meta-description", description: "Page summary for SERPs" },
      { name: "Header Tags", href: "/learn/glossary/header-tags", description: "H1-H6 headings" },
      { name: "Alt Text", href: "/learn/glossary/alt-text", description: "Image descriptions" },
      { name: "Anchor Text", href: "/learn/glossary/anchor-text", description: "Link text" },
      { name: "Backlinks", href: "/learn/glossary/backlinks", description: "Inbound links" },
      { name: "Internal Linking", href: "/learn/glossary/internal-linking", description: "Site navigation links" },
      { name: "Domain Authority", href: "/learn/glossary/domain-authority", description: "Site authority score" },
      { name: "Core Web Vitals", href: "/learn/glossary/core-web-vitals", description: "Page experience metrics" },
      { name: "SERP", href: "/learn/glossary/serp", description: "Search results page" },
      { name: "Bounce Rate", href: "/learn/glossary/bounce-rate", description: "Single-page visits" },
      { name: "Conversion Rate", href: "/learn/glossary/conversion-rate", description: "Goal completion rate" },
    ]
  },
  {
    title: "Directories",
    icon: Globe,
    links: [
      { name: "Business Directory", href: "/directory", description: "Browse business listings" },
      { name: "Partner Marketplace", href: "/marketplace", description: "Find certified partners" },
      { name: "Integrations", href: "/integrations", description: "Platform integrations" },
    ]
  },
  {
    title: "Legal & Policies",
    icon: Shield,
    links: [
      { name: "Privacy Policy", href: "/privacy-policy", description: "How we handle your data" },
      { name: "Terms of Service", href: "/terms", description: "Terms and conditions" },
      { name: "Cookie Policy", href: "/cookies", description: "Cookie usage information" },
      { name: "Security", href: "/security", description: "Our security practices" },
    ]
  },
  {
    title: "Resources",
    icon: BarChart3,
    links: [
      { name: "Changelog", href: "/changelog", description: "Platform updates and releases" },
      { name: "XML Sitemap", href: "/sitemap.xml", description: "Machine-readable sitemap" },
    ]
  },
];

const Sitemap = () => {
  // Generate SiteNavigationElement schema
  const navigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": sitemapData.flatMap((section, sectionIndex) => 
      section.links.map((link, linkIndex) => ({
        "@type": "SiteNavigationElement",
        "position": sectionIndex * 100 + linkIndex + 1,
        "name": link.name,
        "description": link.description,
        "url": `https://webstackceo.lovable.app${link.href}`
      }))
    )
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Sitemap - Complete Site Navigation | Webstack.ceo"
        description="Browse the complete sitemap of Webstack.ceo. Find all pages including features, learning guides, SEO glossary, and resources for easy navigation."
        keywords="sitemap, site navigation, webstack.ceo pages, site structure, website map"
        canonical="/sitemap"
        schema={navigationSchema}
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { label: "Sitemap", altText: "Complete site navigation" }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center mx-auto mb-6">
                <Map className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Site<span className="gradient-text">map</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Navigate through all pages on Webstack.ceo. Find features, guides, resources, and more.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Sitemap Grid */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sitemapData.map((section, index) => {
                const Icon = section.icon;
                return (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
                    </div>
                    <ul className="space-y-2">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            to={link.href}
                            className="group flex items-start gap-2 py-1.5 hover:text-primary transition-colors"
                          >
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div>
                              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                                {link.name}
                              </span>
                              {link.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {link.description}
                                </p>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">Site Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Total Pages", value: sitemapData.reduce((acc, s) => acc + s.links.length, 0).toString() },
                  { label: "Learning Guides", value: "18" },
                  { label: "Glossary Terms", value: "12" },
                  { label: "Features", value: "13" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Sitemap;
