import { motion } from 'framer-motion';

interface HighTechBackgroundProps {
  variant?: 'default' | 'subtle' | 'intense';
  showParticles?: boolean;
  showGrid?: boolean;
  showScanLine?: boolean;
  gridSize?: number;
  scanDuration?: number;
  particleCount?: number;
  className?: string;
}

export const HighTechBackground = ({
  variant = 'default',
  showParticles = true,
  showGrid = true,
  showScanLine = true,
  gridSize = 24,
  scanDuration = 6,
  particleCount = 8,
  className = '',
}: HighTechBackgroundProps) => {
  const opacity = {
    default: { grid: 0.02, particles: 0.4, scan: 0.03 },
    subtle: { grid: 0.015, particles: 0.25, scan: 0.02 },
    intense: { grid: 0.04, particles: 0.6, scan: 0.05 },
  }[variant];

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Grid Pattern */}
      {showGrid && (
        <div
          className="absolute inset-0"
          style={{
            opacity: opacity.grid,
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />
      )}

      {/* Vertical Scanning Line */}
      {showScanLine && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-primary to-transparent"
          style={{ opacity: opacity.scan }}
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: scanDuration, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Floating Particles */}
      {showParticles && (
        <>
          {Array.from({ length: particleCount }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary"
              style={{
                left: `${10 + (i * 80) / particleCount}%`,
                top: `${20 + ((i * 60) % 60)}%`,
                opacity: opacity.particles,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, i % 2 === 0 ? 15 : -15, 0],
                scale: [1, 1.5, 1],
                opacity: [opacity.particles * 0.5, opacity.particles, opacity.particles * 0.5],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.3,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};

interface HighTechCardWrapperProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  showGlow?: boolean;
  showShimmer?: boolean;
}

export const HighTechCardWrapper = ({
  children,
  className = '',
  glowColor = 'primary',
  showGlow = true,
  showShimmer = true,
}: HighTechCardWrapperProps) => {
  const glowClass = {
    primary: 'from-primary/30 to-primary/10',
    emerald: 'from-emerald-500/30 to-emerald-500/10',
    amber: 'from-amber-500/30 to-amber-500/10',
    violet: 'from-violet-500/30 to-violet-500/10',
    cyan: 'from-cyan-500/30 to-cyan-500/10',
  }[glowColor] || 'from-primary/30 to-primary/10';

  return (
    <div className={`relative group ${className}`}>
      {/* Animated Glow Border */}
      {showGlow && (
        <motion.div
          className={`absolute -inset-[1px] rounded-xl bg-gradient-to-br ${glowClass} opacity-0 group-hover:opacity-40 blur-sm transition-opacity`}
          animate={{
            background: [
              `linear-gradient(0deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.1))`,
              `linear-gradient(180deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.3))`,
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Shimmer Effect */}
      {showShimmer && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {children}
    </div>
  );
};

export const PulsingDot = ({ color = 'primary', size = 'sm' }: { color?: string; size?: 'xs' | 'sm' | 'md' }) => {
  const sizeClass = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
  }[size];

  const colorClass = {
    primary: 'bg-primary',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    cyan: 'bg-cyan-500',
  }[color] || 'bg-primary';

  return (
    <span className="relative flex">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClass} opacity-75`} />
      <span className={`relative inline-flex rounded-full ${sizeClass} ${colorClass}`} />
    </span>
  );
};

export const LiveBadge = ({ label = 'LIVE', color = 'primary' }: { label?: string; color?: string }) => {
  const colorClass = {
    primary: 'bg-primary/20 text-primary border-primary/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  }[color] || 'bg-primary/20 text-primary border-primary/30';

  return (
    <motion.span
      className={`flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <PulsingDot color={color} size="xs" />
      {label}
    </motion.span>
  );
};
