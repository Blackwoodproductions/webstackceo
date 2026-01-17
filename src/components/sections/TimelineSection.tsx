import { motion } from "framer-motion";
import { Rocket, Users, Award, Globe, Zap, Target } from "lucide-react";

const milestones = [
  {
    year: "2002",
    title: "The Beginning",
    description: "Blackwood Productions founded in a small garage with a vision to revolutionize web development.",
    icon: Rocket,
  },
  {
    year: "2008",
    title: "First Major Client",
    description: "Landed our first Fortune 500 client, proving enterprise-grade quality from day one.",
    icon: Target,
  },
  {
    year: "2012",
    title: "Team Expansion",
    description: "Grew to 50+ team members and opened offices in New York and London.",
    icon: Users,
  },
  {
    year: "2016",
    title: "Industry Recognition",
    description: "Won 'Best Web Agency' at the International Digital Excellence Awards.",
    icon: Award,
  },
  {
    year: "2020",
    title: "Global Reach",
    description: "Expanded to serve clients in 30+ countries with 24/7 support capabilities.",
    icon: Globe,
  },
  {
    year: "2024",
    title: "Webstack.ceo Launch",
    description: "Launched our flagship product, distilling 22 years of expertise into one powerful platform.",
    icon: Zap,
  },
];

const TimelineSection = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-secondary/20">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
            Our Journey
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            22 Years of <span className="gradient-text">Excellence</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From a small startup to an industry leader, here's how we've grown.
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 via-violet-500 to-pink-500 transform md:-translate-x-1/2" />

          {milestones.map((milestone, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex items-center mb-12 ${
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Content */}
                <div className={`ml-12 md:ml-0 md:w-1/2 ${isEven ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                  <div className="glass-card rounded-2xl p-6 hover:glow-accent transition-all duration-300">
                    <span className="text-2xl font-bold gradient-text">{milestone.year}</span>
                    <h3 className="text-xl font-bold text-foreground mt-2 mb-2">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>

                {/* Icon */}
                <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg z-10">
                  <milestone.icon className="w-4 h-4 text-white" />
                </div>

                {/* Spacer for opposite side */}
                <div className="hidden md:block md:w-1/2" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
