import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { TrendingUp, Users, Clock, Shield } from "lucide-react";

const stats = [
  {
    icon: Shield,
    value: 99.99,
    suffix: "%",
    label: "Uptime Guarantee",
    description: "Industry-leading reliability",
  },
  {
    icon: Users,
    value: 1000,
    suffix: "+",
    label: "Agencies Trust Us",
    description: "SEO & marketing partners",
  },
  {
    icon: Clock,
    value: 24,
    suffix: "hr",
    label: "Response Time",
    description: "White-glove support",
  },
  {
    icon: TrendingUp,
    value: 50000,
    suffix: "+",
    label: "Sites Categorized",
    description: "For niche linking",
  },
];

const AnimatedCounter = ({
  value,
  suffix,
  inView,
}: {
  value: number;
  suffix: string;
  inView: boolean;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, inView]);

  const displayValue = value % 1 !== 0 ? count.toFixed(2) : Math.floor(count);

  return (
    <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
      {displayValue}
      {suffix}
    </span>
  );
};

const StatsSection = () => {
  const ref = useRef(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section id="stats" ref={sectionRef} className="py-20 relative overflow-hidden">
      {/* Background with Parallax */}
      <motion.div 
        style={{ y: bgY }}
        className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" 
      />

      <div className="container mx-auto px-6 relative z-10 max-w-6xl" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary font-medium tracking-wider uppercase text-sm">
            By The Numbers
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4">
            Trusted Performance,{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              Proven Results
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card border border-white/10 rounded-2xl p-6 md:p-8 text-center group transition-all duration-300"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center transition-all duration-300">
                <stat.icon className="w-6 h-6 text-primary transition-colors duration-300" />
              </div>
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                inView={inView}
              />
              <p className="text-foreground font-semibold mt-2">{stat.label}</p>
              <p className="text-muted-foreground text-sm mt-1">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
