import { motion } from "framer-motion";
import { Check, Zap, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import SEO from "@/components/SEO";
import SEOBreadcrumb from "@/components/ui/seo-breadcrumb";

const integrations = [
  {
    name: "WordPress",
    description: "The world's most popular CMS. Seamlessly connect your WordPress site to unlock powerful SEO insights, automated optimizations, and real-time performance monitoring.",
    logo: "https://s.w.org/style/images/about/WordPress-logotype-simplified.png",
    features: [
      "One-click plugin installation",
      "Automatic meta tag optimization",
      "Real-time rank tracking",
      "Content performance analytics",
      "Automated XML sitemap generation"
    ],
    color: "from-[#21759b] to-[#464342]",
    stats: { sites: "43%", label: "of all websites" }
  },
  {
    name: "Lovable",
    description: "Build and ship full-stack apps with AI. Our native Lovable integration means your AI-built applications come with enterprise-grade SEO and analytics built right in.",
    logo: "https://lovable.dev/icon-192x192.png",
    features: [
      "Native platform integration",
      "Zero-config setup",
      "AI-powered SEO suggestions",
      "Automatic performance optimization",
      "Built-in analytics dashboard"
    ],
    color: "from-violet-500 to-fuchsia-500",
    stats: { sites: "Native", label: "integration" }
  },
  {
    name: "Shopify",
    description: "Power your e-commerce with data-driven insights. Connect your Shopify store to optimize product pages, track conversions, and dominate search rankings.",
    logo: "https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-primary-logo-456baa801ee66a0a435671082365958316831c9960c480451dd0330bcdae304f.svg",
    features: [
      "Product page SEO optimization",
      "Conversion tracking & analytics",
      "Inventory-aware sitemaps",
      "Rich snippet automation",
      "E-commerce performance reports"
    ],
    color: "from-[#96bf48] to-[#5e8e3e]",
    stats: { sites: "4M+", label: "active stores" }
  },
  {
    name: "Wix",
    description: "Elevate your Wix website beyond the basics. Our integration brings enterprise-level SEO tools and analytics to your Wix-built site.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Wix.com_website_logo.svg/1200px-Wix.com_website_logo.svg.png",
    features: [
      "Simple API connection",
      "Advanced SEO controls",
      "Competitor analysis tools",
      "Backlink monitoring",
      "Mobile performance tracking"
    ],
    color: "from-[#0C6EFC] to-[#000]",
    stats: { sites: "200M+", label: "users worldwide" }
  }
];

const benefits = [
  {
    title: "5-Minute Setup",
    description: "Connect your platform in minutes, not hours. Our streamlined onboarding gets you up and running fast."
  },
  {
    title: "No Code Required",
    description: "Simply authenticate and go. No developers needed, no complex configurations to manage."
  },
  {
    title: "Real-Time Sync",
    description: "Changes sync instantly between your platform and Webstack.ceo. Always have the latest data."
  },
  {
    title: "Secure Connection",
    description: "Enterprise-grade security with OAuth 2.0 authentication and encrypted data transfer."
  }
];

const Integrations = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Integrations - Connect WordPress, Shopify, Wix & More"
        description="Easily integrate Webstack.ceo with WordPress, Lovable, Shopify, and Wix. One-click setup, no coding required. Supercharge your website's SEO and analytics."
        keywords="WordPress integration, Shopify integration, Wix integration, Lovable integration, SEO tools, website analytics, CMS integration, e-commerce SEO"
        canonical="/integrations"
        schema={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Webstack.ceo Integrations",
          "applicationCategory": "WebApplication",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "USD",
            "lowPrice": "97"
          }
        }}
      />
      <ScrollProgress />
      <Navbar />
      <SEOBreadcrumb
        items={[
          { 
            label: "Integrations",
            altText: "Platform integrations for WordPress, Shopify, Wix, and Lovable"
          }
        ]}
      />
      
      <main className="pt-4">
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"
            animate={{ y: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
            animate={{ y: [0, -30, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Platform Integrations
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Connect in{" "}
                <span className="gradient-text">Minutes</span>, Not Days
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                No matter where your website lives, Webstack.ceo plugs right in. 
                One-click integrations with the platforms you already use—zero coding required.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="#platforms">View All Integrations</a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="/pricing">Start Free Trial</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits Bar */}
        <section className="py-12 border-y border-border/50 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations Grid */}
        <section id="platforms" className="py-24">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Supported Platforms
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Works With Your <span className="gradient-text">Favorite Tools</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Whether you're on WordPress, Shopify, Wix, or building with Lovable—we've got you covered.
              </p>
            </motion.div>

            <div className="space-y-8">
              {integrations.map((integration, index) => (
                <motion.div
                  key={integration.name}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-8 hover:glow-accent transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Logo & Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${integration.color} p-3 flex items-center justify-center`}>
                          <img 
                            src={integration.logo} 
                            alt={`${integration.name} logo`}
                            className="w-10 h-10 object-contain filter brightness-0 invert"
                          />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">{integration.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="text-primary font-semibold">{integration.stats.sites}</span>
                            <span>{integration.stats.label}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-6">
                        {integration.description}
                      </p>
                      <Button variant="heroOutline" className="group">
                        Connect {integration.name}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>

                    {/* Features */}
                    <div className="lg:w-80 lg:border-l lg:border-border lg:pl-8">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        Key Features
                      </h4>
                      <ul className="space-y-3">
                        {integration.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-sm text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-violet-500/5" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-3xl p-12 text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to <span className="gradient-text">Supercharge</span> Your Website?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Connect your platform in under 5 minutes and start seeing actionable insights immediately. 
                No credit card required to get started.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/pricing">
                    Start Your Free Trial <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="https://calendly.com/d/csmt-vs9-zq6/seo-local-book-demo" target="_blank" rel="noopener noreferrer">
                    Talk to Sales <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
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

export default Integrations;
