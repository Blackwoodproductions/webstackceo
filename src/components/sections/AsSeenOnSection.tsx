import { motion } from "framer-motion";

const mediaOutlets = [
  {
    name: "FOX",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Fox_Broadcasting_Company_logo_%282019%29.svg/200px-Fox_Broadcasting_Company_logo_%282019%29.svg.png",
  },
  {
    name: "NBC",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/NBC_logo.svg/200px-NBC_logo.svg.png",
  },
  {
    name: "CBS",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/CBS_logo.svg/200px-CBS_logo.svg.png",
  },
  {
    name: "ABC",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ABC-2021-LOGO.svg/200px-ABC-2021-LOGO.svg.png",
  },
  {
    name: "USA Today",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/USA_Today_logo_%282020%29.svg/200px-USA_Today_logo_%282020%29.svg.png",
  },
  {
    name: "Digital Journal",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Digital_Journal_Logo.svg/200px-Digital_Journal_Logo.svg.png",
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
                className="h-8 md:h-10 w-auto object-contain dark:invert"
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
