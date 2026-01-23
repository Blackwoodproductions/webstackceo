import { motion } from "framer-motion";

// SVG Logo Components for reliable rendering
const FoxLogo = () => (
  <svg viewBox="0 0 100 40" className="h-8 md:h-10 w-auto">
    <text x="0" y="32" className="fill-current" style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'Arial Black, sans-serif', letterSpacing: '-2px' }}>FOX</text>
  </svg>
);

const NbcLogo = () => (
  <svg viewBox="0 0 100 40" className="h-8 md:h-10 w-auto">
    <text x="0" y="32" className="fill-current" style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'Arial, sans-serif', letterSpacing: '1px' }}>NBC</text>
  </svg>
);

const CbsLogo = () => (
  <svg viewBox="0 0 100 40" className="h-8 md:h-10 w-auto">
    <text x="0" y="32" className="fill-current" style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'Arial, sans-serif', letterSpacing: '2px' }}>CBS</text>
  </svg>
);

const AbcLogo = () => (
  <svg viewBox="0 0 100 40" className="h-8 md:h-10 w-auto">
    <text x="0" y="32" className="fill-current" style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'Arial, sans-serif', letterSpacing: '2px' }}>ABC</text>
  </svg>
);

const ForbesLogo = () => (
  <svg viewBox="0 0 140 40" className="h-8 md:h-10 w-auto">
    <text x="0" y="32" className="fill-current" style={{ fontSize: '30px', fontWeight: 400, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Forbes</text>
  </svg>
);

const BloombergLogo = () => (
  <svg viewBox="0 0 180 40" className="h-8 md:h-10 w-auto">
    <text x="0" y="30" className="fill-current" style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'Arial, sans-serif', letterSpacing: '1px' }}>Bloomberg</text>
  </svg>
);

const ReutersLogo = () => (
  <svg viewBox="0 0 140 40" className="h-8 md:h-10 w-auto">
    <text x="0" y="30" className="fill-current" style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>Reuters</text>
  </svg>
);

const UsaTodayLogo = () => (
  <svg viewBox="0 0 180 40" className="h-8 md:h-10 w-auto">
    <text x="0" y="30" className="fill-current" style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'Arial Black, sans-serif', letterSpacing: '-1px' }}>USA TODAY</text>
  </svg>
);

const MarketWatchLogo = () => (
  <svg viewBox="0 0 200 40" className="h-8 md:h-10 w-auto">
    <text x="0" y="30" className="fill-current" style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Georgia, serif' }}>MarketWatch</text>
  </svg>
);

const BusinessInsiderLogo = () => (
  <svg viewBox="0 0 240 40" className="h-8 md:h-10 w-auto">
    <text x="0" y="30" className="fill-current" style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>Business Insider</text>
  </svg>
);

const mediaOutlets = [
  { name: "FOX", Logo: FoxLogo },
  { name: "NBC", Logo: NbcLogo },
  { name: "CBS", Logo: CbsLogo },
  { name: "ABC", Logo: AbcLogo },
  { name: "USA TODAY", Logo: UsaTodayLogo },
  { name: "Forbes", Logo: ForbesLogo },
  { name: "Bloomberg", Logo: BloombergLogo },
  { name: "Reuters", Logo: ReutersLogo },
  { name: "MarketWatch", Logo: MarketWatchLogo },
  { name: "Business Insider", Logo: BusinessInsiderLogo },
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
              className="flex items-center justify-center text-foreground/50 hover:text-foreground transition-all duration-300"
            >
              <outlet.Logo />
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
