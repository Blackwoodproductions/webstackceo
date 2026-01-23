import { memo } from "react";
import { motion, type Easing } from "framer-motion";

const AnimatedDiamondFlow = memo(() => {
  // Animation variants for flowing links
  const flowUp = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { 
      pathLength: 1, 
      opacity: 1,
      transition: { duration: 1.5, ease: "easeInOut" as Easing, repeat: Infinity, repeatDelay: 2 }
    }
  };

  const pulseGlow = {
    initial: { opacity: 0.5, scale: 0.95 },
    animate: { 
      opacity: [0.5, 1, 0.5], 
      scale: [0.95, 1, 0.95],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as Easing }
    }
  };

  const inboundLink = (delay: number) => ({
    initial: { x: -20, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: [0, 1, 1, 0],
      transition: { duration: 2, delay, repeat: Infinity, repeatDelay: 1 }
    }
  });

  const inboundLinkRight = (delay: number) => ({
    initial: { x: 20, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: [0, 1, 1, 0],
      transition: { duration: 2, delay, repeat: Infinity, repeatDelay: 1 }
    }
  });

  return (
    <div className="relative w-full max-w-4xl mx-auto py-8">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 rounded-3xl" />
      
      <div className="relative">
        {/* SVG for connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
          {/* Upward flowing lines - Resources to Supporting Pages */}
          <motion.path
            d="M 400 520 L 250 420"
            stroke="url(#flowGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            variants={flowUp}
            initial="initial"
            animate="animate"
          />
          <motion.path
            d="M 400 520 L 550 420"
            stroke="url(#flowGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            variants={flowUp}
            initial="initial"
            animate="animate"
            style={{ animationDelay: "0.3s" }}
          />
          
          {/* Supporting Pages to Main Keyword */}
          <motion.path
            d="M 250 380 L 400 280"
            stroke="url(#flowGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            variants={flowUp}
            initial="initial"
            animate="animate"
            style={{ animationDelay: "0.5s" }}
          />
          <motion.path
            d="M 550 380 L 400 280"
            stroke="url(#flowGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            variants={flowUp}
            initial="initial"
            animate="animate"
            style={{ animationDelay: "0.7s" }}
          />
          
          {/* Main Keyword to Money Page */}
          <motion.path
            d="M 400 240 L 400 140"
            stroke="url(#flowGradientStrong)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            variants={flowUp}
            initial="initial"
            animate="animate"
            style={{ animationDelay: "1s" }}
          />

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="flowGradientStrong" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="inboundGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Diagram Content */}
        <div className="relative flex flex-col items-center gap-8 px-4">
          
          {/* Money Page - Top */}
          <div className="relative">
            {/* Inbound links from businesses */}
            <motion.div 
              className="absolute -left-32 top-1/2 -translate-y-1/2 flex items-center gap-2"
              variants={inboundLink(0)}
              initial="initial"
              animate="animate"
            >
              <div className="text-xs text-emerald-400 font-medium whitespace-nowrap">Industry Blog</div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-400/30 to-emerald-400" />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </motion.div>
            <motion.div 
              className="absolute -right-32 top-1/2 -translate-y-1/2 flex items-center gap-2"
              variants={inboundLinkRight(0.5)}
              initial="initial"
              animate="animate"
            >
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <div className="w-8 h-0.5 bg-gradient-to-l from-emerald-400/30 to-emerald-400" />
              <div className="text-xs text-emerald-400 font-medium whitespace-nowrap">News Site</div>
            </motion.div>

            <motion.div 
              className="glass-card rounded-2xl p-6 border-2 border-amber-400/50 bg-gradient-to-br from-amber-400/10 to-amber-500/5 min-w-[220px] text-center relative overflow-hidden"
              variants={pulseGlow}
              initial="initial"
              animate="animate"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-amber-400/20 to-transparent opacity-50" />
              <div className="relative">
                <div className="text-amber-400 font-bold text-lg mb-1">💰 MONEY PAGE</div>
                <div className="text-xs text-muted-foreground">(Client Target URL)</div>
                <div className="mt-2 text-xs text-amber-400/80">Receives all link equity</div>
              </div>
            </motion.div>
          </div>

          {/* Upward arrow indicator */}
          <div className="flex items-center gap-2 text-primary/60">
            <motion.div
              animate={{ y: [-5, 0, -5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ▲
            </motion.div>
            <span className="text-xs font-medium">Link Equity Flows Up</span>
            <motion.div
              animate={{ y: [-5, 0, -5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ▲
            </motion.div>
          </div>

          {/* Main Keyword Page */}
          <div className="relative">
            <motion.div 
              className="absolute -left-36 top-1/2 -translate-y-1/2 flex items-center gap-2"
              variants={inboundLink(1)}
              initial="initial"
              animate="animate"
            >
              <div className="text-xs text-emerald-400 font-medium whitespace-nowrap">Partner Site</div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-400/30 to-emerald-400" />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </motion.div>

            <motion.div 
              className="glass-card rounded-2xl p-5 border border-primary/30 min-w-[200px] text-center"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-primary font-bold mb-1">Main Keyword Page</div>
              <div className="text-xs text-muted-foreground">(Created if no money page exists)</div>
            </motion.div>
          </div>

          {/* Upward arrow indicator */}
          <div className="flex items-center gap-2 text-primary/60">
            <motion.div
              animate={{ y: [-5, 0, -5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            >
              ▲
            </motion.div>
            <span className="text-xs font-medium">Authority Passed Up</span>
            <motion.div
              animate={{ y: [-5, 0, -5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            >
              ▲
            </motion.div>
          </div>

          {/* Supporting Pages Row */}
          <div className="flex gap-8 md:gap-16 relative">
            {/* Left Supporting Page */}
            <div className="relative">
              <motion.div 
                className="absolute -left-28 top-1/2 -translate-y-1/2 flex items-center gap-2"
                variants={inboundLink(1.5)}
                initial="initial"
                animate="animate"
              >
                <div className="text-xs text-emerald-400 font-medium whitespace-nowrap">Niche Blog</div>
                <div className="w-6 h-0.5 bg-gradient-to-r from-emerald-400/30 to-emerald-400" />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </motion.div>

              <motion.div 
                className="glass-card rounded-xl p-4 border border-cyan-400/30 min-w-[150px] text-center"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-cyan-400 font-semibold text-sm mb-1">Supporting Page</div>
                <div className="text-xs text-muted-foreground">(Cluster 1)</div>
              </motion.div>
            </div>

            {/* Right Supporting Page */}
            <div className="relative">
              <motion.div 
                className="absolute -right-28 top-1/2 -translate-y-1/2 flex items-center gap-2"
                variants={inboundLinkRight(2)}
                initial="initial"
                animate="animate"
              >
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <div className="w-6 h-0.5 bg-gradient-to-l from-emerald-400/30 to-emerald-400" />
                <div className="text-xs text-emerald-400 font-medium whitespace-nowrap">Directory</div>
              </motion.div>

              <motion.div 
                className="glass-card rounded-xl p-4 border border-cyan-400/30 min-w-[150px] text-center"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-cyan-400 font-semibold text-sm mb-1">Supporting Page</div>
                <div className="text-xs text-muted-foreground">(Cluster 2)</div>
              </motion.div>
            </div>
          </div>

          {/* Upward arrow indicator */}
          <div className="flex items-center gap-2 text-primary/60">
            <motion.div
              animate={{ y: [-5, 0, -5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            >
              ▲
            </motion.div>
            <span className="text-xs font-medium">Inbound Links Enter</span>
            <motion.div
              animate={{ y: [-5, 0, -5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            >
              ▲
            </motion.div>
          </div>

          {/* Resources Page - Bottom */}
          <div className="relative">
            <motion.div 
              className="absolute -left-32 top-1/2 -translate-y-1/2 flex items-center gap-2"
              variants={inboundLink(2.5)}
              initial="initial"
              animate="animate"
            >
              <div className="text-xs text-emerald-400 font-medium whitespace-nowrap">Local Biz</div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-400/30 to-emerald-400" />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </motion.div>
            <motion.div 
              className="absolute -right-32 top-1/2 -translate-y-1/2 flex items-center gap-2"
              variants={inboundLinkRight(3)}
              initial="initial"
              animate="animate"
            >
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <div className="w-8 h-0.5 bg-gradient-to-l from-emerald-400/30 to-emerald-400" />
              <div className="text-xs text-emerald-400 font-medium whitespace-nowrap">Supplier</div>
            </motion.div>

            <motion.div 
              className="glass-card rounded-xl p-4 border border-violet-400/30 bg-gradient-to-br from-violet-400/5 to-violet-500/5 min-w-[180px] text-center"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-violet-400 font-semibold mb-1">📑 Resources Page</div>
              <div className="text-xs text-muted-foreground">(Topical Index)</div>
              <div className="text-xs text-violet-400/70 mt-1">Indexes 3 pages above</div>
            </motion.div>
          </div>

          {/* Legend */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-muted-foreground">Inbound links from relevant businesses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-gradient-to-t from-primary/30 to-primary rounded" />
              <span className="text-muted-foreground">Link equity flow (upward)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-muted-foreground">Money page (receives all authority)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

AnimatedDiamondFlow.displayName = "AnimatedDiamondFlow";

export default AnimatedDiamondFlow;
