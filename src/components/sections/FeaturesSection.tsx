import { motion } from "framer-motion";
import { 
  Activity, 
  Server, 
  Search, 
  Link2, 
  UserCheck,
  Eye,
  PenTool,
  HelpCircle
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Site Uptime Monitoring",
    description: "24/7 monitoring with instant alerts. Know the moment your site goes down and get detailed incident reports.",
  },
  {
    icon: Server,
    title: "Premium Web Hosting",
    description: "Enterprise-grade hosting with 99.99% uptime SLA, global CDN, and automatic scaling for peak traffic.",
  },
  {
    icon: Search,
    title: "On-Page SEO",
    description: "Technical audits, meta optimization, content structure, and Core Web Vitals improvements for higher rankings.",
  },
  {
    icon: Link2,
    title: "Off-Page SEO & Link Building",
    description: "Quality inbound links from real business websites. No PBNs, only genuine authority-building partnerships.",
  },
  {
    icon: PenTool,
    title: "Automated Blog & Content",
    description: "AI-powered blog posts, articles, and web copy that positions your brand as the authority in your niche.",
  },
  {
    icon: HelpCircle,
    title: "FAQ Generation",
    description: "Automatically generate comprehensive FAQs that answer customer questions and boost your search visibility.",
  },
  {
    icon: UserCheck,
    title: "Traffic De-Anonymization",
    description: "Identify your anonymous website visitors. Turn unknown traffic into qualified leads with company-level insights.",
  },
  {
    icon: Eye,
    title: "Visitor Intelligence",
    description: "See which companies visit your site, what pages they view, and when they're ready to buy.",
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
            Stop Paying More,{" "}
            <span className="gradient-text">Getting Less</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join over 1,000 CEOs who trust Webstack to deliver real results. 
            One platform, every tool you need, zero compromise.
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
