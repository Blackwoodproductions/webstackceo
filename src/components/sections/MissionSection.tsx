import { motion } from "framer-motion";
import { Target, Eye, Heart, Shield } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Excellence",
    description: "We deliver nothing less than exceptional quality in everything we build.",
  },
  {
    icon: Eye,
    title: "Transparency",
    description: "Clear communication and honest partnerships are the foundation of our success.",
  },
  {
    icon: Heart,
    title: "Customer First",
    description: "Every decision we make starts with how it benefits our clients.",
  },
  {
    icon: Shield,
    title: "Trust & Security",
    description: "Enterprise-grade security and reliability you can depend on.",
  },
];

const MissionSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-violet-500/5" />
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
              Our Purpose
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Our <span className="gradient-text">Mission</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              To empower every CEO with the tools, insights, and confidence to command their digital presence. 
              We believe that technology should serve leaders, not complicate their lives.
            </p>
            
            <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-violet-500/20 rounded-full blur-2xl" />
              <h3 className="text-xl font-bold text-foreground mb-4 relative z-10">Our Vision</h3>
              <p className="text-muted-foreground relative z-10 leading-relaxed">
                A world where every business leader has complete visibility and control over their 
                website performance, enabling them to make data-driven decisions that drive growth 
                and success.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6 hover:glow-accent transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
