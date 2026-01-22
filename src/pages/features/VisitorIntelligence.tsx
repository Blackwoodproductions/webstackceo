import { motion } from "framer-motion";
import { Eye, ArrowRight, BarChart3, Clock, MousePointer, Building2, Target, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FeatureBreadcrumb from "@/components/ui/feature-breadcrumb";
import SEO from "@/components/SEO";

const benefits = [
  { icon: Building2, title: "Company Profiles", description: "See detailed company information for every identified visitor." },
  { icon: MousePointer, title: "Page-Level Tracking", description: "Know exactly which pages each company viewed and for how long." },
  { icon: Clock, title: "Visit Timeline", description: "Complete history of every visit, session duration, and return visits." },
  { icon: BarChart3, title: "Engagement Scoring", description: "Automatic scoring based on pages viewed and engagement level." },
  { icon: Target, title: "Buying Signals", description: "Identify when companies are showing purchase intent." },
  { icon: Bell, title: "Real-Time Alerts", description: "Get notified when high-value companies visit your site." },
];

const VisitorIntelligence = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Visitor Intelligence - Identify Anonymous Website Visitors"
        description="Turn anonymous website traffic into leads. Identify companies visiting your site, track their behavior, and get real-time alerts for high-value prospects."
        keywords="visitor intelligence, website visitor tracking, lead identification, B2B leads, company identification, visitor analytics"
        canonical="/features/visitor-intelligence"
      />
      <ScrollProgress />
      <Navbar />
      
      <main>
        <FeatureBreadcrumb featureName="Visitor Intelligence" featureKeyword="Identify anonymous website visitors and convert to B2B leads" />
        
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute bottom-20 right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl"
            animate={{ y: [0, -30, 0] }}
            transition={{ duration: 9, repeat: Infinity }}
          />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mx-auto mb-6">
                <Eye className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Visitor <span className="gradient-text">Intelligence</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                See which companies visit your site, what pages they view, 
                and when they're ready to buy—all in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#pricing">Get Visitor Insights <ArrowRight className="ml-2 w-5 h-5" /></a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="/#contact">Watch Demo</a>
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
                Deep Insights
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Know Your <span className="gradient-text">Visitors</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Comprehensive intelligence on every company that visits your website.
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

        {/* Dashboard Preview */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                Dashboard
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Everything at a <span className="gradient-text">Glance</span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-8"
            >
              <div className="space-y-6">
                {[
                  { company: "Acme Corporation", pages: "Pricing, Features, Case Studies", time: "12 min ago", score: 92 },
                  { company: "TechStart Inc.", pages: "Homepage, About, Contact", time: "34 min ago", score: 78 },
                  { company: "Global Industries", pages: "Enterprise, Security, API", time: "1 hour ago", score: 85 },
                ].map((visitor, index) => (
                  <div key={visitor.company} className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{visitor.company}</h4>
                        <p className="text-sm text-muted-foreground">Viewed: {visitor.pages}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{visitor.time}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          visitor.score >= 90 ? 'bg-green-500/20 text-green-400' :
                          visitor.score >= 80 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          Score: {visitor.score}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
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
                Intelligence That <span className="gradient-text">Converts</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { stat: "5x", label: "More informed sales conversations" },
                { stat: "40%", label: "Higher conversion rates" },
                { stat: "Real-time", label: "Visitor alerts and notifications" },
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
                See Who's <span className="gradient-text">Interested</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Turn anonymous traffic into actionable sales intelligence.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/#pricing">Get Visitor Intelligence <ArrowRight className="ml-2 w-5 h-5" /></a>
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

export default VisitorIntelligence;