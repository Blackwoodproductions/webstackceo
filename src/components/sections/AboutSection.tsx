import { motion } from "framer-motion";
import { CheckCircle, Award, Users, Building } from "lucide-react";

const stats = [
  { icon: Building, value: "22", label: "Years in Business" },
  { icon: Users, value: "500+", label: "CEOs Trust Us" },
  { icon: Award, value: "50+", label: "Industry Awards" },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
              About Us
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Built by{" "}
              <span className="gradient-text">Blackwood Productions</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              For over two decades, Blackwood Productions has been at the forefront 
              of web technology, helping businesses build and maintain their digital 
              presence. Webstack.ceo is the culmination of 22 years of experience, 
              designed specifically for CEOs who demand excellence.
            </p>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              We understand the challenges of running a successful website—the 
              countless metrics to track, tools to manage, and decisions to make. 
              That's why we built a unified command center that puts you in control.
            </p>

            <div className="space-y-4">
              {[
                "Enterprise-grade security and reliability",
                "24/7 dedicated support for CEOs",
                "Continuous updates and new integrations",
                "White-glove onboarding experience",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 text-center hover:glow-accent transition-all duration-300"
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <div className="text-3xl font-bold gradient-text mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass-card rounded-2xl p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-violet-500/20 rounded-full blur-2xl" />
              <blockquote className="relative z-10">
                <p className="text-lg text-foreground italic mb-4">
                  "After 22 years of building websites and helping businesses succeed 
                  online, we've distilled everything into one platform. Webstack.ceo 
                  is the tool I wish I had when I started."
                </p>
                <footer className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white font-bold">
                    BP
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Founder</div>
                    <div className="text-sm text-muted-foreground">Blackwood Productions</div>
                  </div>
                </footer>
              </blockquote>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
