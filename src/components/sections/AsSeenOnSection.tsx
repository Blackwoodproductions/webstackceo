import { motion } from "framer-motion";

const mediaOutlets = [
  { name: "FOX" },
  { name: "NBC" },
  { name: "CBS" },
  { name: "ABC" },
  { name: "USA TODAY" },
  { name: "FORBES" },
  { name: "BLOOMBERG" },
  { name: "REUTERS" },
  { name: "MARKETWATCH" },
  { name: "BUSINESS INSIDER" },
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
          className="flex flex-wrap items-center justify-center gap-6 md:gap-10"
        >
          {mediaOutlets.map((outlet, index) => (
            <motion.div
              key={outlet.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 * index }}
              className="flex items-center justify-center opacity-50 hover:opacity-100 transition-all duration-300"
            >
              <span className="text-lg md:text-xl font-bold tracking-tight text-foreground whitespace-nowrap">
                {outlet.name}
              </span>
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
