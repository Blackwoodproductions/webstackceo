import { motion } from "framer-motion";

const mediaOutlets = [
  {
    name: "FOX",
    logo: "https://logo.clearbit.com/fox.com",
  },
  {
    name: "NBC",
    logo: "https://logo.clearbit.com/nbc.com",
  },
  {
    name: "CBS",
    logo: "https://logo.clearbit.com/cbs.com",
  },
  {
    name: "ABC",
    logo: "https://logo.clearbit.com/abc.com",
  },
  {
    name: "USA Today",
    logo: "https://logo.clearbit.com/usatoday.com",
  },
  {
    name: "Forbes",
    logo: "https://logo.clearbit.com/forbes.com",
  },
  {
    name: "Bloomberg",
    logo: "https://logo.clearbit.com/bloomberg.com",
  },
  {
    name: "Reuters",
    logo: "https://logo.clearbit.com/reuters.com",
  },
  {
    name: "MarketWatch",
    logo: "https://logo.clearbit.com/marketwatch.com",
  },
  {
    name: "Business Insider",
    logo: "https://logo.clearbit.com/businessinsider.com",
  },
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
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="flex items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
            >
              <img
                src={outlet.logo}
                alt={`${outlet.name} logo`}
                className="h-10 md:h-12 w-auto object-contain"
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
