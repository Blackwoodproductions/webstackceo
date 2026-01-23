import { motion } from "framer-motion";

import forbesLogo from "@/assets/logos/forbes.png";
import bloombergLogo from "@/assets/logos/bloomberg.png";
import reutersLogo from "@/assets/logos/reuters.png";
import usatodayLogo from "@/assets/logos/usatoday.png";
import marketwatchLogo from "@/assets/logos/marketwatch.png";
import businessinsiderLogo from "@/assets/logos/businessinsider.png";

const mediaOutlets = [
  { name: "Forbes", logo: forbesLogo },
  { name: "Bloomberg", logo: bloombergLogo },
  { name: "Reuters", logo: reutersLogo },
  { name: "USA Today", logo: usatodayLogo },
  { name: "MarketWatch", logo: marketwatchLogo },
  { name: "Business Insider", logo: businessinsiderLogo },
];

const AsSeenOnSection = () => {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="inline-block px-4 py-2 rounded-full glass-card text-sm font-medium text-primary mb-4">
            Media Coverage
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            As Seen On
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
        >
          {mediaOutlets.map((outlet, index) => (
            <motion.div
              key={outlet.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 * index }}
              className="flex items-center justify-center hover:scale-105 transition-transform duration-300"
            >
              <img
                src={outlet.logo}
                alt={`${outlet.name} logo`}
                className="h-8 md:h-10 w-auto object-contain"
                loading="lazy"
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          Featured in major news outlets and publications worldwide
        </motion.p>
      </div>
    </section>
  );
};

export default AsSeenOnSection;
