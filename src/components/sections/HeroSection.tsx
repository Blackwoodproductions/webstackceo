import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Zap } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSoundContext } from "@/contexts/SoundContext";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useTheme } from "next-themes";
import dashboardDark from "@/assets/homepage-dashboard-dark.png";
import dashboardLight from "@/assets/homepage-dashboard-light.png";
const HeroSection = () => {
  const { resolvedTheme } = useTheme();
  const dashboardImage = resolvedTheme === 'light' ? dashboardLight : dashboardDark;
  const [isDashboardHovered, setIsDashboardHovered] = useState(false);
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { soundEnabled } = useSoundContext();
  const { playSound } = useSoundEffects();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Mouse position tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for mouse following
  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  // Transform mouse position to movement values for different layers
  const blob1X = useTransform(smoothMouseX, [-0.5, 0.5], [-30, 30]);
  const blob2X = useTransform(smoothMouseX, [-0.5, 0.5], [25, -25]);
  const dashboardX = useTransform(smoothMouseX, [-0.5, 0.5], [-8, 8]);
  const dashboardY = useTransform(smoothMouseY, [-0.5, 0.5], [-5, 5]);

  // Scroll parallax
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, 200]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    // Clean the domain input
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, "");
    cleanDomain = cleanDomain.split("/")[0];

    setIsLoading(true);
    
    // Navigate to results page with domain as URL param
    setTimeout(() => {
      navigate(`/audit/${encodeURIComponent(cleanDomain)}`);
    }, 500);
  };

  return (
    <section id="hero" ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32">
      {/* Background Effects with Mouse + Scroll Parallax */}
      <motion.div 
        style={{ x: blob1X, y: bgY1 }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse-glow" 
      />
      <motion.div 
        style={{ x: blob2X, y: bgY2 }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse-glow" 
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[clamp(2.25rem,5.625vw,5.04rem)] font-bold leading-tight mb-8 mt-12"
          >
            <span className="whitespace-nowrap"><span className="gradient-text">C</span>ommand your W<span className="gradient-text">e</span>bsite &</span>
            <br />
            <span className="ml-4 md:ml-8 whitespace-nowrap">Operate like a B<span className="gradient-text">O</span>SS.!</span>
          </motion.h1>

          {/* Domain Audit Form */}
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="max-w-2xl mx-auto mb-6"
          >
            <div className="relative flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter your domain (e.g., example.com)"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="pl-12 pr-52 h-14 text-lg bg-background/80 backdrop-blur border-border/50 focus:border-primary/50"
                />
                {/* Trust indicator inside input */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Instant • No email • Free</span>
                </div>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={isLoading || !domain.trim()}
                className="relative h-14 px-8 bg-gradient-to-r from-primary via-cyan-500 to-violet-500 hover:from-amber-500 hover:via-amber-400 hover:to-amber-500 text-white font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all duration-300 group overflow-hidden"
              >
                {/* Animated shimmer effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {isLoading ? (
                  <span className="relative flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  <span className="relative flex items-center gap-2">
                    <Zap className="w-5 h-5 fill-current" />
                    Analyze Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </div>
          </motion.form>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-center"
          >
            <span className="block">Get a free instant SEO audit. One dashboard for everything—</span>
            <span className="block">uptime monitoring to traffic intelligence.</span>
            <span className="block">Fully automated.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8"
          >
            {/* Dashboard Preview */}
            <div 
              className="relative max-w-[90%] mx-auto"
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
                <div className="rounded-xl overflow-hidden">
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
                  <img 
                    src={dashboardImage} 
                    alt="Visitor Intelligence Dashboard showing real-time analytics, KPI metrics, conversion funnel, and leads table"
                    className="w-full h-auto"
                  />
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
