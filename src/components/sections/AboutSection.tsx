import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { CheckCircle, Award, Users, Building } from "lucide-react";

const stats = [
  { icon: Building, value: "22", label: "Years in Business" },
  { icon: Users, value: "1000+", label: "Agency Partners" },
  { icon: Award, value: "50K+", label: "Sites Categorized" },
];

const AboutSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const blob1Y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const blob2Y = useTransform(scrollYProgress, [0, 1], [-50, 100]);

  return (
    <section ref={sectionRef} id="about" className="py-24 relative overflow-hidden">
      <motion.div style={{ y: blob1Y }} className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      <motion.div style={{ y: blob2Y }} className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
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
              For over two decades, Blackwood Productions has powered SEO agencies 
              and marketing companies with enterprise-grade tools. Webstack.ceo is 
              the culmination of 22 years of experience, built specifically for 
              agencies who want to scale without the overhead.
            </p>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Our secret? When your clients onboard, we categorize each website by 
              niche—unlocking automated, highly relevant backlink building across 
              your entire portfolio. True niche linking on autopilot.
            </p>

            <div className="space-y-4">
              {[
                "Automated niche categorization for every client site",
                "White-label dashboards and reports",
                "Bulk client management at scale",
                "Dedicated agency success team",
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
                  "We built what every SEO agency needs: a system that categorizes 
                  client sites and builds niche-relevant links automatically. It's 
                  the unfair advantage we wish we had 22 years ago."
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
