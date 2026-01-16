import { motion } from "framer-motion";
import { 
  Building2, 
  TrendingUp, 
  Globe2, 
  BarChart3
} from "lucide-react";

const services = [
  {
    icon: Building2,
    title: "Real Business Backlinks",
    description: "We partner with genuine companies to build your domain authority. No link farms, no shortcuts—only quality.",
  },
  {
    icon: TrendingUp,
    title: "Lead Generation",
    description: "Convert anonymous traffic into actionable sales leads with company names, contact info, and intent signals.",
  },
  {
    icon: Globe2,
    title: "Global Infrastructure",
    description: "Your site hosted on enterprise infrastructure with edge locations worldwide for lightning-fast load times.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track uptime, page speed, SEO rankings, and visitor insights all from one unified dashboard.",
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 relative overflow-hidden bg-secondary/30">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Your Complete{" "}
            <span className="gradient-text">Web Stack</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything works together seamlessly. Host with us, rank higher, 
            and know exactly who's visiting your site.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors duration-300">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {service.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
