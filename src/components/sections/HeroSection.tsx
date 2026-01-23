import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useSoundContext } from "@/contexts/SoundContext";
import { useSoundEffects } from "@/hooks/use-sound-effects";

const HeroSection = () => {
  const [isDashboardHovered, setIsDashboardHovered] = useState(false);
  const [isShieldGold, setIsShieldGold] = useState(false);
  const { soundEnabled } = useSoundContext();
  const { playSound } = useSoundEffects();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Listen for logo gold state changes from Navbar
  useEffect(() => {
    const handleLogoGoldChange = (e: CustomEvent<{ isGold: boolean }>) => {
      setIsShieldGold(e.detail.isGold);
    };
    window.addEventListener('logoGoldChange', handleLogoGoldChange as EventListener);
    return () => window.removeEventListener('logoGoldChange', handleLogoGoldChange as EventListener);
  }, []);

  // Mouse position tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for mouse following
  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  // Transform mouse position to movement values for different layers
  const blob1X = useTransform(smoothMouseX, [-0.5, 0.5], [-30, 30]);
  const blob1Y = useTransform(smoothMouseY, [-0.5, 0.5], [-30, 30]);
  const blob2X = useTransform(smoothMouseX, [-0.5, 0.5], [25, -25]);
  const blob2Y = useTransform(smoothMouseY, [-0.5, 0.5], [25, -25]);
  const float1X = useTransform(smoothMouseX, [-0.5, 0.5], [-50, 50]);
  const float1Y = useTransform(smoothMouseY, [-0.5, 0.5], [-40, 40]);
  const float2X = useTransform(smoothMouseX, [-0.5, 0.5], [40, -40]);
  const float2Y = useTransform(smoothMouseY, [-0.5, 0.5], [35, -35]);
  const dashboardX = useTransform(smoothMouseX, [-0.5, 0.5], [-8, 8]);
  const dashboardY = useTransform(smoothMouseY, [-0.5, 0.5], [-5, 5]);

  // Scroll parallax
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const floatScrollY1 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const floatScrollY2 = useTransform(scrollYProgress, [0, 1], [0, 80]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      // Normalize mouse position to -0.5 to 0.5
      mouseX.set((clientX / innerWidth) - 0.5);
      mouseY.set((clientY / innerHeight) - 0.5);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section id="hero" ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28">
      {/* Background Effects with Mouse + Scroll Parallax */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <motion.div 
        style={{ x: blob1X, y: bgY1 }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse-glow" 
      />
      <motion.div 
        style={{ x: blob2X, y: bgY2 }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse-glow" 
      />
      
      
      {/* Floating Element with Mouse + Scroll Parallax */}
      <motion.div
        style={{ x: float2X, y: floatScrollY2 }}
        className={`absolute bottom-32 left-20 w-16 h-16 rounded-lg flex items-center justify-center hidden lg:flex transition-all duration-700 ${
          isShieldGold 
            ? "bg-gradient-to-br from-amber-400/20 to-yellow-500/20 shadow-[0_0_25px_rgba(251,191,36,0.5)]" 
            : "bg-gradient-to-br from-cyan-400/20 to-violet-500/20"
        }`}
      >
        <Shield className={`w-[46px] h-[46px] transition-colors duration-700 ${isShieldGold ? "text-amber-400" : "text-primary"}`} />
        <span className={`absolute font-bold text-[12px] tracking-tight transition-colors duration-700 ${isShieldGold ? "text-amber-400" : "text-primary"}`}>AI</span>
      </motion.div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 mt-12"
          >
            <span className="gradient-text">C</span>ommand your W<span className="gradient-text">e</span>bsite &
            <br />
            <span className="ml-4 md:ml-8">Operate like a B<span className="gradient-text">O</span>SS.!</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            One unified dashboard that simplifies every task—from basic uptime monitoring 
            to advanced SEO and traffic intelligence. Everything you need to run a modern, 
            high-converting website, all in one place.
          </motion.p>


          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button variant="hero" size="xl" className="group">
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="glass" size="xl" className="group">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16"
          >
            {/* Dashboard Preview */}
            <div 
              className="relative"
              onMouseEnter={() => setIsDashboardHovered(true)}
              onMouseLeave={() => setIsDashboardHovered(false)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ x: dashboardX, y: dashboardY }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="relative rounded-2xl glass-card p-2 glow-primary transition-all duration-500"
              >
                <div className="rounded-xl bg-card overflow-hidden">
                  <div className="bg-secondary/50 px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-background/50 rounded-md px-3 py-1 text-sm text-muted-foreground text-center">
                        dashboard.webstack.ceo
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-background to-secondary/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {[
                        { label: "Uptime", value: "99.99%", change: "This month" },
                        { label: "Visitors Identified", value: "847", change: "+23 today" },
                        { label: "Domain Authority", value: "58", change: "+4 this month" },
                        { label: "Backlinks Built", value: "142", change: "+12 this week" },
                      ].map((stat) => (
                        <div key={stat.label} className="glass-card rounded-xl p-4">
                          <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                          <p className="text-xs text-green-400">{stat.change}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 glass-card rounded-xl p-4 h-32">
                        <div className="flex items-end justify-between h-full">
                          {[40, 65, 55, 80, 70, 90, 85, 95, 88, 92, 87, 94].map((height, i) => (
                            <div
                              key={i}
                              className="w-full mx-0.5 rounded-t bg-gradient-to-t from-cyan-400 to-violet-500 opacity-80"
                              style={{ height: `${height}%` }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="glass-card rounded-xl p-4 h-32 flex items-center justify-center">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="35"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              className="text-secondary"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="35"
                              stroke="url(#gradient)"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray="220"
                              strokeDashoffset="22"
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="hsl(199 89% 48%)" />
                                <stop offset="100%" stopColor="hsl(262 83% 58%)" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">90%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
