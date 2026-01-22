import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Menu, X, Moon, Sun, Volume2, VolumeX, ChevronDown,
  Search, Link2, PenTool, HelpCircle, UserCheck, Eye,
  MousePointerClick, TrendingUp, BarChart3, MapPin, Activity, Server, Shield
} from "lucide-react";
import { useSoundContext } from "@/contexts/SoundContext";
import { useSoundEffects } from "@/hooks/use-sound-effects";

const featureItems = [
  { icon: Search, name: "On-Page SEO", href: "/features/on-page-seo" },
  { icon: Link2, name: "Off-Page SEO", href: "/features/off-page-seo" },
  { icon: PenTool, name: "Automated Blog", href: "/features/automated-blog" },
  { icon: HelpCircle, name: "FAQ Generation", href: "/features/faq-generation" },
  { icon: UserCheck, name: "Traffic De-Anonymization", href: "/features/traffic-de-anonymization" },
  { icon: Eye, name: "Visitor Intelligence", href: "/features/visitor-intelligence" },
  { icon: MousePointerClick, name: "PPC Landing Pages", href: "/features/ppc-landing-pages" },
  { icon: TrendingUp, name: "Domain Authority", href: "/features/domain-authority" },
  { icon: BarChart3, name: "Advanced Analytics", href: "/features/advanced-analytics" },
  { icon: MapPin, name: "GMB Optimization", href: "/features/gmb-optimization" },
  { icon: Activity, name: "Uptime Monitoring", href: "/features/uptime-monitoring" },
  { icon: Server, name: "Web Hosting", href: "/features/web-hosting" },
];

const Navbar = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isMobileFeaturesOpen, setIsMobileFeaturesOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const { soundEnabled, toggleSound } = useSoundContext();
  const { playSound } = useSoundEffects();

  useEffect(() => {
    // Check for saved preference, default to dark if no preference saved
    const savedTheme = localStorage.getItem("theme");
    const shouldBeDark = savedTheme ? savedTheme === "dark" : true; // Default to dark
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  const navLinks = [
    { name: "Pricing", href: "/pricing", isPage: true },
    { name: "FAQ", href: "/faq", isPage: true },
    { name: "Contact", href: "/contact", isPage: true },
    { name: "About", href: "/about", isPage: true },
    { name: "Careers", href: "/careers", isPage: true },
    { name: "Marketplace", href: "/marketplace", isPage: true },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isPage?: boolean) => {
    if (isPage) {
      // Let the link navigate normally for page routes
      setIsMobileMenuOpen(false);
      return;
    }
    e.preventDefault();
    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);
    if (element) {
      const offsetTop = element.offsetTop - 80; // Account for fixed navbar
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "glass-card py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center relative">
            <Shield className="w-7 h-7 text-white" />
            <span className="absolute text-white font-bold text-[9px] tracking-tight">AI</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground leading-tight">
              webstack<span className="gradient-text">.ceo</span>
            </span>
            <span className="text-[10px] text-muted-foreground tracking-wide">
              by Blackwood Productions
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {/* Features Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsFeaturesOpen(true)}
            onMouseLeave={() => setIsFeaturesOpen(false)}
          >
            <a
              href="/features"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium flex items-center gap-1"
            >
              Features
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFeaturesOpen ? 'rotate-180' : ''}`} />
            </a>
            
            <AnimatePresence>
              {isFeaturesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-4 z-50"
                >
                  <motion.div 
                    className="bg-background border border-border/50 rounded-2xl p-6 w-[600px] grid grid-cols-2 gap-2 shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.25),0_0_40px_-10px_hsl(var(--primary)/0.15)] backdrop-blur-sm"
                    initial={{ boxShadow: "0 10px 30px -10px hsl(var(--primary)/0)" }}
                    animate={{ boxShadow: "0 20px 60px -15px hsl(var(--primary)/0.25), 0 0 40px -10px hsl(var(--primary)/0.15)" }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <motion.div 
                      className="col-span-2 pb-3 mb-3 border-b border-border"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.05 }}
                    >
                      <a 
                        href="/features"
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        View All Features →
                      </a>
                    </motion.div>
                    {featureItems.map((feature, index) => (
                      <motion.a
                        key={feature.name}
                        href={feature.href}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          duration: 0.2, 
                          delay: 0.05 + (index * 0.03),
                          ease: "easeOut"
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center group-hover:from-cyan-400/30 group-hover:to-violet-500/30 group-hover:scale-110 transition-all duration-200">
                          <feature.icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {feature.name}
                        </span>
                      </motion.a>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href, link.isPage)}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => {
              toggleSound();
              if (!soundEnabled) playSound("success");
            }}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Toggle sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-foreground" />
            ) : (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-foreground" />
            ) : (
              <Moon className="w-5 h-5 text-foreground" />
            )}
          </button>
          <Button variant="heroOutline" size="sm" asChild>
            <a href="https://dashdev.imagehosting.space/">Login</a>
          </Button>
          <Button variant="hero" size="sm" asChild>
            <a href="/pricing">Get Started</a>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => {
              toggleSound();
              if (!soundEnabled) playSound("success");
            }}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Toggle sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-foreground" />
            ) : (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-foreground" />
            ) : (
              <Moon className="w-5 h-5 text-foreground" />
            )}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-background border border-border mt-2 mx-4 rounded-xl p-6"
        >
          <nav className="flex flex-col gap-4">
            {/* Mobile Features Accordion */}
            <div>
              <button
                onClick={() => setIsMobileFeaturesOpen(!isMobileFeaturesOpen)}
                className="flex items-center justify-between w-full text-foreground hover:text-primary transition-colors font-medium py-2"
              >
                Features
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMobileFeaturesOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isMobileFeaturesOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 pt-2 space-y-2">
                      <a
                        href="/features"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-sm text-primary font-medium py-1"
                      >
                        View All Features →
                      </a>
                      {featureItems.map((feature) => (
                        <a
                          key={feature.name}
                          href={feature.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-1 transition-colors"
                        >
                          <feature.icon className="w-4 h-4 text-primary" />
                          {feature.name}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href, link.isPage)}
                className="text-foreground hover:text-primary transition-colors font-medium py-2"
              >
                {link.name}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <Button variant="heroOutline" className="w-full" asChild>
                <a href="https://dashdev.imagehosting.space/">Login</a>
              </Button>
              <Button variant="hero" className="w-full" asChild>
                <a href="/pricing">Get Started</a>
              </Button>
            </div>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Navbar;
