import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  BarChart3,
  Globe,
  Zap,
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  Shield,
  Clock,
  Server,
  Share2,
  MapPin,
  Eye,
  Target,
  Layers,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BackToTop from '@/components/ui/back-to-top';
import ScrollProgress from '@/components/ui/scroll-progress';
import SEO from '@/components/SEO';
import SEOBreadcrumb from '@/components/ui/seo-breadcrumb';
import { VIDashboardEffects } from '@/components/ui/vi-dashboard-effects';
import InteractiveGrid from '@/components/ui/interactive-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Core Platform Services
const coreServices = [
  {
    id: 'visitor-intelligence',
    name: 'Visitor Intelligence (VI)',
    description: 'Real-time website visitor tracking and de-anonymization. Identify companies visiting your site, track user journeys, and convert anonymous traffic into actionable leads.',
    icon: Eye,
    color: 'cyan',
    features: [
      'Real-time visitor tracking',
      'Company identification',
      'Session replay & heatmaps',
      'Lead scoring & alerts',
      'CRM integrations'
    ],
    link: '/features/visitor-intelligence',
    tier: 'Basic'
  },
  {
    id: 'bron',
    name: 'BRON (Backlink & Ranking Optimization Network)',
    description: 'Automated niche linking and keyword ranking system. Track keyword positions across search engines, monitor backlink profiles, and build domain authority through strategic link building.',
    icon: TrendingUp,
    color: 'violet',
    features: [
      'Keyword rank tracking (Google, Bing, Yahoo)',
      'Backlink monitoring & analysis',
      'Niche-based link building',
      'Competitor gap analysis',
      'Citation tracking & management'
    ],
    link: '/features/off-page-seo',
    tier: 'Business'
  },
  {
    id: 'cade',
    name: 'CADE (Content Automation & Delivery Engine)',
    description: 'AI-powered content automation platform. Generate SEO-optimized blog posts, FAQs, and landing pages automatically based on your domain context and target keywords.',
    icon: FileText,
    color: 'emerald',
    features: [
      'Automated blog generation',
      'FAQ content creation',
      'Domain context learning',
      'Multi-platform publishing',
      'Content scheduling'
    ],
    link: '/features/automated-blog',
    tier: 'Business'
  },
  {
    id: 'aeo-geo',
    name: 'AEO/GEO (AI Engine & Geographic Optimization)',
    description: 'Monitor your visibility in AI-powered search engines and LLMs. Track how ChatGPT, Claude, and other AI assistants reference your brand and optimize for AI discovery.',
    icon: Sparkles,
    color: 'amber',
    features: [
      'AI search visibility monitoring',
      'LLM brand mention tracking',
      'Geographic search optimization',
      'AI citation analysis',
      'Prompt optimization insights'
    ],
    link: '/features/advanced-analytics',
    tier: 'Business'
  }
];

// Dashboard Integrations
const integrations = [
  {
    name: 'Google Analytics',
    description: 'Connect your GA4 properties for unified analytics across all your domains.',
    icon: BarChart3,
    status: 'Available'
  },
  {
    name: 'Google Search Console',
    description: 'Monitor search performance, indexation status, and keyword impressions.',
    icon: Search,
    status: 'Available'
  },
  {
    name: 'Google Business Profile',
    description: 'Manage GMB listings, posts, photos, and reviews from one dashboard.',
    icon: MapPin,
    status: 'Available'
  },
  {
    name: 'Google Ads',
    description: 'Track PPC campaigns, keywords, and conversion metrics alongside organic data.',
    icon: Target,
    status: 'Available'
  },
  {
    name: 'Social Platforms',
    description: 'Connect Facebook, Instagram, LinkedIn for social signals tracking.',
    icon: Share2,
    status: 'Available'
  }
];

// Additional Features
const additionalFeatures = [
  {
    name: 'On-Page SEO',
    description: 'Automated meta optimization, schema markup, keyword placement, and image alt tags.',
    icon: Layers,
    link: '/features/on-page-seo'
  },
  {
    name: 'Domain Authority Building',
    description: 'Strategic backlink acquisition and domain rating improvement strategies.',
    icon: Shield,
    link: '/features/domain-authority'
  },
  {
    name: 'Uptime Monitoring',
    description: '24/7 website uptime monitoring with instant alerts and status pages.',
    icon: Clock,
    link: '/features/uptime-monitoring'
  },
  {
    name: 'Web Hosting',
    description: 'Managed hosting infrastructure optimized for speed and SEO performance.',
    icon: Server,
    link: '/features/web-hosting'
  },
  {
    name: 'PPC Landing Pages',
    description: 'High-converting landing page templates designed for paid advertising campaigns.',
    icon: Target,
    link: '/features/ppc-landing-pages'
  },
  {
    name: 'FAQ Generation',
    description: 'AI-powered FAQ creation based on industry trends and user queries.',
    icon: MessageSquare,
    link: '/features/faq-generation'
  },
  {
    name: 'Traffic De-Anonymization',
    description: 'Convert anonymous website visitors into identifiable business leads.',
    icon: Users,
    link: '/features/traffic-de-anonymization'
  },
  {
    name: 'Social Signals',
    description: 'Track and amplify social media engagement to boost search visibility.',
    icon: Share2,
    link: '/features/social-signals'
  }
];

// Subscription Tiers
const subscriptionTiers = [
  {
    name: 'Basic',
    price: '$15',
    period: '/domain/mo',
    description: 'Essential visitor intelligence for single domains',
    features: [
      'Visitor Intelligence Dashboard',
      'Real-time visitor tracking',
      'Google Maps integration',
      '1 domain included',
      'Basic analytics'
    ],
    color: 'cyan'
  },
  {
    name: 'Business CEO',
    price: '$75',
    period: '/mo',
    description: 'Complete SEO toolkit for growing businesses',
    features: [
      'Everything in Basic',
      'BRON keyword tracking',
      'CADE content automation',
      'Social signals',
      'AEO/GEO ($2/keyword add-on)',
      '3 domains included'
    ],
    color: 'violet',
    popular: true
  },
  {
    name: 'White Label',
    price: '$499',
    period: '/mo',
    description: 'Agency-ready with custom branding',
    features: [
      'Everything in Business',
      'White-label dashboard',
      'Custom branding',
      'On-Page SEO tools',
      'Client management',
      'Priority support'
    ],
    color: 'emerald'
  },
  {
    name: 'Super Reseller',
    price: '$1,499',
    period: '/mo',
    description: 'Enterprise-scale agency operations',
    features: [
      'Everything in White Label',
      'Unlimited domains',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'Volume discounts'
    ],
    color: 'amber'
  }
];

const colorClasses = {
  cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-500/50',
  violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 hover:border-violet-500/50',
  emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-500/50',
  amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-500/50'
};

const iconColorClasses = {
  cyan: 'text-cyan-400 bg-cyan-500/20',
  violet: 'text-violet-400 bg-violet-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/20',
  amber: 'text-amber-400 bg-amber-500/20'
};

const Documentation = memo(function Documentation() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <VIDashboardEffects />
      <InteractiveGrid className="fixed inset-0 opacity-30 pointer-events-none z-0" glowRadius={120} glowIntensity={0.12} />
      
      <SEO
        title="Documentation - Complete Platform Guide & Service Overview"
        description="Comprehensive documentation for Webstack.ceo platform. Learn about Visitor Intelligence, BRON link building, CADE content automation, AEO/GEO AI optimization, and all SEO tools."
        keywords="webstack documentation, SEO platform guide, visitor intelligence docs, BRON documentation, CADE guide, AEO GEO, white label SEO docs"
        canonical="/docs"
        schema={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "name": "Webstack.ceo Platform Documentation",
          "description": "Complete guide to all Webstack.ceo services and features",
          "articleSection": "Documentation"
        }}
      />
      
      <ScrollProgress />
      <Navbar />
      
      <SEOBreadcrumb
        items={[
          { label: "Documentation", altText: "Platform documentation and service overview" }
        ]}
      />
      
      <main className="pt-4 pb-16">
        {/* Hero Section */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">
                <BookOpen className="w-3 h-3 mr-1" />
                Platform Documentation
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Everything You Need to{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
                  Succeed
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Complete documentation for the Webstack.ceo platform. Explore our core services, 
                integrations, features, and subscription options.
              </p>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-6 max-w-6xl">
          {/* Core Services */}
          <section className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Core Platform Services</h2>
                <p className="text-muted-foreground text-sm">The foundation of your SEO success</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {coreServices.map((service, index) => {
                const Icon = service.icon;
                const colors = colorClasses[service.color as keyof typeof colorClasses];
                const iconColors = iconColorClasses[service.color as keyof typeof iconColorClasses];
                
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`h-full bg-gradient-to-br ${colors} border transition-all duration-300 hover:shadow-lg`}>
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className={`w-12 h-12 rounded-xl ${iconColors} flex items-center justify-center`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {service.tier}+ Tier
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{service.name}</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {service.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <h4 className="text-sm font-semibold mb-3 text-foreground">Key Features:</h4>
                        <ul className="space-y-2 mb-4">
                          {service.features.map((feature, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Link to={service.link}>
                          <Button variant="outline" size="sm" className="w-full group">
                            Learn More
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <Separator className="mb-20" />

          {/* Integrations */}
          <section className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Platform Integrations</h2>
                <p className="text-muted-foreground text-sm">Connect your existing tools seamlessly</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {integrations.map((integration, index) => {
                const Icon = integration.icon;
                return (
                  <motion.div
                    key={integration.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="h-full glass-card border-border/50 hover:border-primary/30 transition-all duration-300">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm">{integration.name}</h3>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {integration.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{integration.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <Separator className="mb-20" />

          {/* Additional Features */}
          <section className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Additional Features</h2>
                <p className="text-muted-foreground text-sm">Specialized tools for every SEO need</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4">
              {additionalFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={feature.link}>
                      <Card className="h-full glass-card border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                        <CardContent className="pt-6">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                            {feature.name}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {feature.description}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <Separator className="mb-20" />

          {/* Subscription Tiers */}
          <section className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Subscription Tiers</h2>
                <p className="text-muted-foreground text-sm">Choose the plan that fits your needs</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4">
              {subscriptionTiers.map((tier, index) => {
                const colors = colorClasses[tier.color as keyof typeof colorClasses];
                return (
                  <motion.div
                    key={tier.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`h-full bg-gradient-to-br ${colors} border transition-all duration-300 relative`}>
                      {tier.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-primary to-violet-500 text-white border-0">
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{tier.name}</CardTitle>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold">{tier.price}</span>
                          <span className="text-muted-foreground text-sm">{tier.period}</span>
                        </div>
                        <CardDescription className="text-xs">
                          {tier.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1.5">
                          {tier.features.map((feature, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="text-center mt-8">
              <Link to="/pricing">
                <Button variant="hero" size="lg">
                  View Full Pricing Details
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </section>

          {/* Learning Resources */}
          <section className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Learning Resources</h2>
                <p className="text-muted-foreground text-sm">Expand your SEO knowledge</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Link to="/learn" className="group">
                <Card className="h-full glass-card hover:border-primary/30 transition-all duration-300">
                  <CardContent className="pt-6">
                    <BookOpen className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Learning Center</h3>
                    <p className="text-sm text-muted-foreground">In-depth guides on SEO, content marketing, and digital growth strategies.</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link to="/learn/glossary" className="group">
                <Card className="h-full glass-card hover:border-primary/30 transition-all duration-300">
                  <CardContent className="pt-6">
                    <FileText className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">SEO Glossary</h3>
                    <p className="text-sm text-muted-foreground">Comprehensive dictionary of SEO terms and digital marketing concepts.</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link to="/faq" className="group">
                <Card className="h-full glass-card hover:border-primary/30 transition-all duration-300">
                  <CardContent className="pt-6">
                    <MessageSquare className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">FAQ</h3>
                    <p className="text-sm text-muted-foreground">Answers to common questions about our platform and services.</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
      <BackToTop />
    </div>
  );
});

export default Documentation;
