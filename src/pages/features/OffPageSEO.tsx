import { motion } from "framer-motion";
import { Link2, CheckCircle, ArrowRight, Globe, Users, TrendingUp, Shield, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FeatureBreadcrumb from "@/components/ui/feature-breadcrumb";
import SEO from "@/components/SEO";

const benefits = [
  { icon: Globe, title: "Niche Categorization", description: "Every client site is categorized by niche, enabling highly relevant link placements across your portfolio." },
  { icon: Users, title: "Automated Outreach", description: "Our system matches sites by niche and builds contextual links automatically—no manual work required." },
  { icon: TrendingUp, title: "Portfolio-Wide Scale", description: "The more clients you onboard, the stronger the niche network. Links improve across all your sites." },
  { icon: Shield, title: "No PBNs", description: "100% white-hat link building with real business websites. No private blog networks or risky tactics." },
  { icon: Award, title: "Agency-Ready", description: "White-label reports and dashboards you can brand as your own for client delivery." },
  { icon: Link2, title: "Niche Matching", description: "Links are placed on relevant sites in the same or complementary niches for maximum SEO impact." },
];

const OffPageSEO = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Niche Link Building - Automated Backlinks for Agencies"
        description="Automated niche-specific link building for SEO agencies. We categorize client websites and build relevant backlinks at scale. White-label ready."
        keywords="niche link building, automated backlinks, SEO agency tools, white label links, niche categorization, link building automation"
        canonical="/features/off-page-seo"
      />
      <ScrollProgress />
      <Navbar />
      
      <main>
        <FeatureBreadcrumb featureName="Niche Link Building" featureKeyword="Automated niche-specific backlink building for agencies" />
        
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-20 right-10 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl"
            animate={{ y: [0, -30, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mx-auto mb-6">
                <Link2 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Niche <span className="gradient-text">Link Building</span> on Autopilot
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                When your agency onboards clients, we categorize each site by niche—then 
                automatically build highly relevant backlinks across your entire portfolio.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#pricing">Start Building Authority <ArrowRight className="ml-2 w-5 h-5" /></a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="/#contact">See Our Link Portfolio</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                How It Works
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Categorize Once, <span className="gradient-text">Link Forever</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Our niche categorization system powers automated, relevant link building at scale.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 hover:glow-accent transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Link Quality */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Agency Standards
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Links Your Clients <span className="gradient-text">Will Love</span>
              </h2>
            </motion.div>

            <div className="glass-card rounded-2xl p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-500" /> What We Do
                  </h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Automatic niche categorization on client onboarding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Links matched by industry and relevance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Portfolio-wide link building at scale</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>White-label reports for client delivery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Real business websites, no spam</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" /> What We Never Do
                  </h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">✕</span>
                      <span>Private Blog Networks (PBNs)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">✕</span>
                      <span>Link farms or link exchanges</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">✕</span>
                      <span>Paid links that violate guidelines</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">✕</span>
                      <span>Spammy directory submissions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">✕</span>
                      <span>Automated link building tools</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Scale That <span className="gradient-text">Works for Agencies</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { stat: "50K+", label: "Sites categorized by niche" },
                { stat: "1000+", label: "Agency partners" },
                { stat: "100%", label: "White-hat methods only" },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-8 text-center"
                >
                  <div className="text-5xl font-bold gradient-text mb-2">{item.stat}</div>
                  <p className="text-muted-foreground">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Scale Your Agency with <span className="gradient-text">Niche Linking</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Onboard clients, we categorize and link. It's that simple.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/pricing">Get Started <ArrowRight className="ml-2 w-5 h-5" /></a>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default OffPageSEO;