import { motion } from "framer-motion";

/**
 * Exact replica of the Visitor Intelligence Dashboard background effects
 * Use this on all main pages for consistent high-tech aesthetic
 */
export const VIDashboardEffects = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Corner gradient accents - large blobs */}
      <motion.div 
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/15 via-violet-500/10 to-transparent rounded-bl-[250px]"
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/15 via-primary/8 to-transparent rounded-tr-[200px]"
        animate={{ 
          scale: [1.05, 1, 1.05],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      
      {/* Additional corner blobs for richness */}
      <motion.div 
        className="absolute -top-20 -left-20 w-[350px] h-[350px] bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent rounded-full blur-xl"
        animate={{ 
          x: [0, 30, 0],
          y: [0, 20, 0],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute -bottom-20 -right-20 w-[300px] h-[300px] bg-gradient-to-tl from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-xl"
        animate={{ 
          x: [0, -20, 0],
          y: [0, -30, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      
      {/* Animated vertical scanning line */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent"
        animate={{ y: ['-100%', '200%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Animated horizontal scanning line */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/3 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear', delay: 4 }}
      />
      
      {/* Floating particles - animated with framer-motion (exactly like VI dashboard) */}
      <motion.div
        className="absolute top-[10%] right-[8%] w-2 h-2 rounded-full bg-cyan-400/70"
        animate={{ y: [0, -12, 0], opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-[20%] right-[15%] w-1.5 h-1.5 rounded-full bg-violet-400/70"
        animate={{ y: [0, -10, 0], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
      />
      <motion.div
        className="absolute top-[15%] right-[25%] w-1 h-1 rounded-full bg-amber-400/70"
        animate={{ y: [0, -8, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
      />
      <motion.div
        className="absolute top-[25%] left-[10%] w-1.5 h-1.5 rounded-full bg-primary/70"
        animate={{ y: [0, -6, 0], x: [0, 3, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.8, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-[20%] left-[15%] w-2 h-2 rounded-full bg-emerald-400/60"
        animate={{ y: [0, -15, 0], opacity: [0.4, 0.8, 0.4], scale: [1, 1.3, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
      />
      <motion.div
        className="absolute bottom-[30%] right-[12%] w-1.5 h-1.5 rounded-full bg-rose-400/60"
        animate={{ y: [0, -10, 0], x: [0, -5, 0], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, delay: 0.8 }}
      />
      <motion.div
        className="absolute top-[40%] left-[5%] w-1 h-1 rounded-full bg-cyan-300/50"
        animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
      />
      <motion.div
        className="absolute top-[60%] right-[5%] w-1.5 h-1.5 rounded-full bg-violet-300/50"
        animate={{ y: [0, -12, 0], x: [0, 8, 0], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3.2, repeat: Infinity, delay: 2 }}
      />
      
      {/* Additional floating particles for public pages */}
      <motion.div
        className="absolute top-[5%] left-[40%] w-1 h-1 rounded-full bg-primary/60"
        animate={{ y: [0, -18, 0], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 4.5, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="absolute bottom-[10%] right-[30%] w-2 h-2 rounded-full bg-cyan-400/50"
        animate={{ y: [0, -14, 0], x: [0, 6, 0], opacity: [0.4, 0.8, 0.4], scale: [1, 1.15, 1] }}
        transition={{ duration: 3.8, repeat: Infinity, delay: 1.2 }}
      />
      <motion.div
        className="absolute top-[70%] left-[25%] w-1.5 h-1.5 rounded-full bg-amber-300/50"
        animate={{ y: [0, -10, 0], opacity: [0.25, 0.6, 0.25] }}
        transition={{ duration: 4.2, repeat: Infinity, delay: 2.5 }}
      />
      <motion.div
        className="absolute top-[35%] right-[35%] w-1 h-1 rounded-full bg-emerald-300/40"
        animate={{ y: [0, -8, 0], x: [0, -4, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1.8 }}
      />
      
      {/* Radial glow from top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-radial from-primary/8 via-violet-500/3 to-transparent" />
      
      {/* Bottom radial glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-cyan-500/5 via-primary/2 to-transparent" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60" />
      
      {/* Side vignettes */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background/50 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background/50 to-transparent" />
      
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default VIDashboardEffects;
