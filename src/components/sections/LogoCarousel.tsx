import { motion } from "framer-motion";

const companies = [
  { name: "TechFlow", style: "font-bold" },
  { name: "Elevate", style: "font-light tracking-widest" },
  { name: "Brightpath", style: "font-bold italic" },
  { name: "Velocity", style: "font-black" },
  { name: "GrowthLab", style: "font-medium tracking-tight" },
  { name: "Nexus", style: "font-bold tracking-wide" },
  { name: "Pinnacle", style: "font-semibold" },
  { name: "Forge", style: "font-black uppercase" },
  { name: "Quantum", style: "font-light" },
  { name: "Apex", style: "font-bold uppercase tracking-widest" },
];

const LogoCarousel = () => {
  return (
    <section className="py-12 relative overflow-hidden border-y border-border/30">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-sm text-muted-foreground mb-8"
        >
          Trusted by leading companies worldwide
        </motion.p>

        {/* Infinite scroll container */}
        <div className="relative">
          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Scrolling logos */}
          <div className="flex overflow-hidden">
            <motion.div
              className="flex gap-12 items-center"
              animate={{ x: [0, -1920] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 30,
                  ease: "linear",
                },
              }}
            >
              {/* Double the logos for seamless loop */}
              {[...companies, ...companies, ...companies].map((company, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 px-6 py-3 opacity-40 hover:opacity-80 transition-opacity duration-300 cursor-default"
                >
                  <span
                    className={`text-xl md:text-2xl text-foreground whitespace-nowrap ${company.style}`}
                  >
                    {company.name}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LogoCarousel;
