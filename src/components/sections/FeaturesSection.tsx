import { motion } from "framer-motion";
import { 
  BarChart3, 
  Shield, 
  Zap, 
  Search, 
  Globe, 
  Bell,
  TrendingUp,
  Lock
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Unified Analytics",
    description: "All your metrics from Google Analytics, social platforms, and marketing tools in one dashboard.",
  },
  {
    icon: Search,
    title: "SEO Intelligence",
    description: "Real-time SEO monitoring, keyword tracking, and actionable recommendations.",
  },
  {
    icon: Zap,
    title: "Performance Monitoring",
    description: "Page speed, Core Web Vitals, and uptime monitoring with instant alerts.",
  },
  {
    icon: Shield,
    title: "Security Suite",
    description: "SSL monitoring, malware scanning, and vulnerability assessments.",
  },
  {
    icon: Globe,
    title: "Global CDN Insights",
    description: "Understand your global audience with geo-distributed analytics.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Customizable notifications for traffic spikes, errors, and opportunities.",
  },
  {
    icon: TrendingUp,
    title: "Conversion Tracking",
    description: "Track goals, funnels, and revenue attribution across all channels.",
  },
  {
    icon: Lock,
    title: "Compliance Dashboard",
    description: "GDPR, CCPA, and accessibility compliance monitoring.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Everything You Need,{" "}
            <span className="gradient-text">One Place</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Stop juggling between 15 different tools. Webstack.ceo brings all your 
            website management essentials into one powerful dashboard.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full glass-card rounded-2xl p-6 hover:glow-primary transition-all duration-500 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
