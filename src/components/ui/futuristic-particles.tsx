import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

interface FuturisticParticlesProps {
  className?: string;
  particleCount?: number;
  connectionDistance?: number;
  mouseRadius?: number;
  speed?: number;
  variant?: "default" | "subtle" | "intense" | "cosmic";
}

export const FuturisticParticles = ({
  className = "",
  particleCount = 50,
  connectionDistance = 120,
  mouseRadius = 150,
  speed = 0.5,
  variant = "default",
}: FuturisticParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const variantConfig = {
    default: { opacity: 0.6, lineOpacity: 0.15, glowSize: 3 },
    subtle: { opacity: 0.3, lineOpacity: 0.08, glowSize: 2 },
    intense: { opacity: 0.8, lineOpacity: 0.25, glowSize: 5 },
    cosmic: { opacity: 0.7, lineOpacity: 0.2, glowSize: 4 },
  }[variant];

  const getComputedColor = useCallback(() => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const primaryHsl = style.getPropertyValue("--primary").trim();
    if (primaryHsl) {
      const [h] = primaryHsl.split(" ");
      return parseFloat(h) || 200;
    }
    return 200;
  }, []);

  // Initialize particles
  useEffect(() => {
    if (dimensions.width === 0) return;
    
    const baseHue = getComputedColor();
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      hue: baseHue + (Math.random() - 0.5) * 30,
    }));
  }, [dimensions, particleCount, speed, getComputedColor]);

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const style = window.getComputedStyle(containerRef.current);
        if (style.position === 'fixed') {
          mousePos.current = { x: e.clientX, y: e.clientY };
        } else {
          const rect = containerRef.current.getBoundingClientRect();
          mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
      }
    };

    const handleMouseLeave = () => {
      mousePos.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      const particles = particlesRef.current;
      const { x: mx, y: my } = mousePos.current;

      // Update and draw particles
      particles.forEach((p, i) => {
        // Mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < mouseRadius && dist > 0) {
          const force = (mouseRadius - dist) / mouseRadius;
          p.vx += (dx / dist) * force * 0.5;
          p.vy += (dy / dist) * force * 0.5;
        }

        // Apply velocity with damping
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = dimensions.width;
        if (p.x > dimensions.width) p.x = 0;
        if (p.y < 0) p.y = dimensions.height;
        if (p.y > dimensions.height) p.y = 0;

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < connectionDistance) {
            const opacity = (1 - cdist / connectionDistance) * variantConfig.lineOpacity;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(${p.hue}, 70%, 60%, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Draw particle with glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * variantConfig.glowSize);
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${p.opacity * variantConfig.opacity})`);
        gradient.addColorStop(0.5, `hsla(${p.hue}, 70%, 60%, ${p.opacity * variantConfig.opacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 60%, 50%, 0)`);
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * variantConfig.glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${p.opacity * variantConfig.opacity})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, connectionDistance, mouseRadius, variantConfig]);

  return (
    <div ref={containerRef} className={`absolute inset-0 pointer-events-none ${className}`}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
};

// Floating orbs with blur effect
export const FloatingOrbs = ({ className = "" }: { className?: string }) => {
  const orbs = [
    { size: 300, x: "10%", y: "20%", color: "primary", delay: 0 },
    { size: 400, x: "80%", y: "60%", color: "violet", delay: 1 },
    { size: 250, x: "60%", y: "10%", color: "cyan", delay: 2 },
    { size: 350, x: "20%", y: "70%", color: "emerald", delay: 0.5 },
  ];

  const colorMap: Record<string, string> = {
    primary: "bg-primary/20",
    violet: "bg-violet-500/20",
    cyan: "bg-cyan-500/20",
    emerald: "bg-emerald-500/20",
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${colorMap[orb.color]}`}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.9, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
};

// Cyber lines effect
export const CyberLines = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Horizontal scanning lines */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        style={{ top: "30%" }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"
        style={{ top: "60%" }}
        animate={{ x: ["100%", "-100%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 2 }}
      />
      
      {/* Vertical pulse lines */}
      <motion.div
        className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-violet-500/30 to-transparent"
        style={{ left: "25%" }}
        animate={{ y: ["-100%", "100%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent"
        style={{ left: "75%" }}
        animate={{ y: ["100%", "-100%"] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 3 }}
      />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/10 rounded-tl-3xl" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-primary/10 rounded-tr-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-primary/10 rounded-bl-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/10 rounded-br-3xl" />
    </div>
  );
};

// HUD overlay effect
export const HUDOverlay = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80" />
      
      {/* Side gradients */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background/60 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background/60 to-transparent" />
      
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default FuturisticParticles;
