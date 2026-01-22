import { motion } from "framer-motion";
import { UserCheck, ArrowRight, Building2, Mail, Phone, Target, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FeatureBreadcrumb from "@/components/ui/feature-breadcrumb";
import SEO from "@/components/SEO";

const benefits = [
  { icon: Building2, title: "Company Identification", description: "See which companies are visiting your site, even if they don't fill out a form." },
  { icon: Mail, title: "Contact Discovery", description: "Get contact information for key decision-makers at visiting companies." },
  { icon: Phone, title: "Sales Intelligence", description: "Know who to call and what they're interested in before you reach out." },
  { icon: Target, title: "Intent Signals", description: "Identify high-intent visitors based on their browsing behavior." },
  { icon: Sparkles, title: "Lead Scoring", description: "Automatically prioritize leads based on company fit and engagement." },
  { icon: Filter, title: "CRM Integration", description: "Push identified companies directly to your sales team's workflow." },
];

const TrafficDeAnonymization = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Traffic De-Anonymization - Turn Anonymous Visitors into Leads"
        description="Identify anonymous website visitors and turn them into leads. Company identification, contact discovery, and CRM integration for B2B sales teams."
        keywords="traffic de-anonymization, lead generation, visitor identification, B2B leads, sales intelligence, intent data"
        canonical="/features/traffic-de-anonymization"
      />
      <ScrollProgress />
      <Navbar />
      
      <main>
        <FeatureBreadcrumb featureName="Traffic De-Anonymization" />
        
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute top-20 left-20 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"
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
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mx-auto mb-6">
                <UserCheck className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Traffic <span className="gradient-text">De-Anonymization</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Identify your anonymous website visitors. Turn unknown traffic into 
                qualified leads with company-level insights and contact discovery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#pricing">Unmask Your Visitors <ArrowRight className="ml-2 w-5 h-5" /></a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="/#contact">See a Demo</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                98% of Website Visitors <span className="gradient-text">Leave Anonymous</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                You're spending money driving traffic to your site, but most visitors 
                never identify themselves. Until now.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8"
              >
                <h3 className="text-xl font-bold text-foreground mb-4">Without De-Anonymization</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✕</span>
                    <span>98% of visitors leave without a trace</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✕</span>
                    <span>Sales team has no visibility into website activity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✕</span>
                    <span>Marketing can't retarget effectively</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✕</span>
                    <span>Wasted ad spend on unknown visitors</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 border-primary/50"
              >
                <h3 className="text-xl font-bold text-foreground mb-4">With De-Anonymization</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Identify 20-30% of your B2B website visitors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Get company names, contacts, and intent data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Personalized outreach based on pages viewed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Shorter sales cycles with informed conversations</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Features
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Complete Visitor <span className="gradient-text">Intelligence</span>
              </h2>
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
                Real <span className="gradient-text">Results</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { stat: "25%", label: "Of B2B visitors identified" },
                { stat: "67%", label: "More qualified leads" },
                { stat: "3x", label: "Faster sales cycles" },
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
                Stop Losing <span className="gradient-text">Leads</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Know who's visiting your site and turn them into customers.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/#pricing">Start Identifying Visitors <ArrowRight className="ml-2 w-5 h-5" /></a>
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

export default TrafficDeAnonymization;