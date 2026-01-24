import { motion } from "framer-motion";
import { Activity, ArrowRight, Bell, Clock, Globe, Shield, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/back-to-top";
import ScrollProgress from "@/components/ui/scroll-progress";
import FeatureBreadcrumb from "@/components/ui/feature-breadcrumb";
import SEO from "@/components/SEO";
import QuickMetricCheck from "@/components/QuickMetricCheck";

const benefits = [
  { icon: Bell, title: "Instant Alerts", description: "Get notified within seconds when your site goes down via SMS, email, or Slack." },
  { icon: Clock, title: "1-Minute Checks", description: "Monitoring every 60 seconds from multiple global locations." },
  { icon: Globe, title: "Global Monitoring", description: "Checks from data centers worldwide to ensure global availability." },
  { icon: Shield, title: "SSL Monitoring", description: "Get alerts before your SSL certificate expires." },
  { icon: Zap, title: "Performance Tracking", description: "Monitor response times and identify slowdowns before users notice." },
  { icon: BarChart3, title: "Detailed Reports", description: "Monthly uptime reports and incident history for stakeholders." },
];

const UptimeMonitoring = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Uptime Monitoring - 24/7 Website Availability Tracking"
        description="Monitor your website 24/7 with 1-minute checks from global locations. Get instant alerts via SMS, email, or Slack when your site goes down."
        keywords="uptime monitoring, website monitoring, downtime alerts, SSL monitoring, server monitoring, 24/7 monitoring"
        canonical="/features/uptime-monitoring"
      />
      <ScrollProgress />
      <Navbar />
      
      <main>
        <FeatureBreadcrumb featureName="Uptime Monitoring" featureKeyword="24/7 website uptime monitoring with instant downtime alerts" />
        
        {/* Hero Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <motion.div
            className="absolute bottom-20 right-10 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl"
            animate={{ y: [0, -25, 0] }}
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
                <Activity className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Site Uptime <span className="gradient-text">Monitoring</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                24/7 monitoring with instant alerts. Know the moment your site goes down 
                and get detailed incident reports to resolve issues fast.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#pricing">Start Monitoring <ArrowRight className="ml-2 w-5 h-5" /></a>
                </Button>
                <Button variant="heroOutline" size="lg" asChild>
                  <a href="/#contact">Learn More</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Metric Check */}
        <section className="py-12">
          <div className="container mx-auto px-6 max-w-4xl">
            <QuickMetricCheck metricType="security" />
          </div>
        </section>

        {/* Cost of Downtime */}
        <section className="py-24 bg-secondary/20">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
                The Cost of Downtime
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Every Minute <span className="gradient-text">Counts</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { stat: "$5,600", description: "Average cost per minute of downtime" },
                { stat: "40%", description: "of users abandon sites that take >3s to load" },
                { stat: "79%", description: "of shoppers won't return after poor performance" },
              ].map((item, index) => (
                <motion.div
                  key={item.stat}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-8 text-center"
                >
                  <p className="text-4xl font-bold gradient-text mb-4">{item.stat}</p>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
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
                Complete Monitoring
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Never Miss a <span className="gradient-text">Beat</span>
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

        {/* Status Dashboard */}
        <section className="py-24 bg-secondary/20">
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
                Real-Time <span className="gradient-text">Status</span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-semibold text-foreground">All Systems Operational</span>
                </div>
                <span className="text-sm text-muted-foreground">Last 30 days: 99.98% uptime</span>
              </div>

              <div className="space-y-4">
                {[
                  { name: "Main Website", status: "Operational", uptime: "99.99%", response: "142ms" },
                  { name: "API Endpoints", status: "Operational", uptime: "99.97%", response: "89ms" },
                  { name: "Dashboard App", status: "Operational", uptime: "99.99%", response: "156ms" },
                ].map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-foreground">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-green-400">{service.status}</span>
                      <span className="text-muted-foreground">{service.uptime}</span>
                      <span className="text-muted-foreground">{service.response}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Results */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Monitoring <span className="gradient-text">Stats</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { stat: "60s", label: "Check interval" },
                { stat: "30+", label: "Global monitoring locations" },
                { stat: "<10s", label: "Alert delivery time" },
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
                Never Get Caught <span className="gradient-text">Offline</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Know about issues before your customers do.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/#pricing">Start Monitoring <ArrowRight className="ml-2 w-5 h-5" /></a>
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

export default UptimeMonitoring;