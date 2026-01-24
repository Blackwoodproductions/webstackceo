import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Menu, X, Moon, Sun, Volume2, VolumeX, ChevronDown,
  Search, Link2, PenTool, HelpCircle, UserCheck, Eye,
  MousePointerClick, TrendingUp, BarChart3, MapPin, Activity, Server, Shield,
  FileText, Target, Zap
} from "lucide-react";
import { useSoundContext } from "@/contexts/SoundContext";
import { useSoundEffects } from "@/hooks/use-sound-effects";

const includedFeatures = [
  { icon: Link2, name: "Niche Link Building", href: "/features/off-page-seo" },
  { icon: PenTool, name: "Automated Blog", href: "/features/automated-blog" },
  { icon: HelpCircle, name: "FAQ Generation", href: "/features/faq-generation" },
  { icon: UserCheck, name: "Traffic De-Anonymization", href: "/features/traffic-de-anonymization" },
  { icon: Eye, name: "Visitor Intelligence", href: "/features/visitor-intelligence" },
  { icon: TrendingUp, name: "Domain Authority", href: "/features/domain-authority" },
  { icon: BarChart3, name: "Advanced Analytics", href: "/features/advanced-analytics" },
  { icon: MapPin, name: "GMB Optimization", href: "/features/gmb-optimization" },
  { icon: Activity, name: "Uptime Monitoring", href: "/features/uptime-monitoring" },
];

const addOnFeatures = [
  { icon: Search, name: "On-Page SEO", href: "/features/on-page-seo" },
  { icon: MousePointerClick, name: "PPC Landing Pages", href: "/features/ppc-landing-pages" },
  { icon: Server, name: "Lovable Premium Hosting", href: "/features/web-hosting" },
];

const seoTools = [
  { icon: Link2, name: "Backlink Analyzer", href: "/tools#backlinks", description: "Analyze your link profile" },
  { icon: FileText, name: "Technical SEO Audit", href: "/tools#technical_audit", description: "Check technical health" },
  { icon: TrendingUp, name: "Traffic Estimator", href: "/tools#traffic", description: "Estimate organic traffic" },
  { icon: Target, name: "Keyword Rankings", href: "/tools#keywords", description: "Discover ranking keywords" },
  { icon: BarChart3, name: "Domain Authority", href: "/tools#domain_rating", description: "Check domain rating" },
  { icon: Zap, name: "Page Speed Test", href: "/tools#page_speed", description: "Test Core Web Vitals" },
  { icon: Search, name: "Schema Checker", href: "/tools#schema", description: "Verify structured data" },
  { icon: Shield, name: "Security Scanner", href: "/tools#security", description: "Check SSL & headers" },
];

const Navbar = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isMobileFeaturesOpen, setIsMobileFeaturesOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isMobileContactOpen, setIsMobileContactOpen] = useState(false);
  const [isBlogOpen, setIsBlogOpen] = useState(false);
  const [isMobileBlogOpen, setIsMobileBlogOpen] = useState(false);
  const [isSubmitSiteOpen, setIsSubmitSiteOpen] = useState(false);
  const [isMobileSubmitSiteOpen, setIsMobileSubmitSiteOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isLogoGold, setIsLogoGold] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const { soundEnabled, toggleSound } = useSoundContext();
  const { playSound } = useSoundEffects();

  // Auto-animate logo to gold every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsLogoGold(true);
      // Dispatch custom event for other components to sync
      window.dispatchEvent(new CustomEvent('logoGoldChange', { detail: { isGold: true } }));
      // Stay gold for 3 seconds, then fade back
      setTimeout(() => {
        setIsLogoGold(false);
        window.dispatchEvent(new CustomEvent('logoGoldChange', { detail: { isGold: false } }));
      }, 3000);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

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
  ];

  const blogSubLinks = [
    { name: "Blog", href: "/blog" },
    { name: "FAQ", href: "/faq" },
  ];

  const contactSubLinks = [
    { name: "Contact", href: "/contact" },
    { name: "About", href: "/about" },
    { name: "Careers", href: "/careers" },
  ];

  const submitSiteSubLinks = [
    { name: "SIGN UP", href: "/pricing", highlight: true },
    { name: "Directory", href: "/directory" },
    { name: "Marketplace", href: "/marketplace" },
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
        <a 
          href="/" 
          className="flex items-center gap-2"
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center relative transition-all duration-700 ${
            isLogoHovered || isLogoGold 
              ? "bg-gradient-to-br from-amber-400/20 to-yellow-500/20 shadow-[0_0_25px_rgba(251,191,36,0.5)] scale-110" 
              : "bg-gradient-to-br from-cyan-400/20 to-violet-500/20"
          }`}>
            <Shield className={`w-7 h-7 transition-colors duration-700 ${
              isLogoHovered || isLogoGold ? "text-amber-400" : "text-primary"
            }`} />
            <span className={`absolute font-bold text-[9px] tracking-tight transition-all duration-700 ${
              isLogoHovered || isLogoGold ? "text-amber-400" : "text-primary"
            }`}>AI</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground leading-tight">
              webstack<span className={`bg-clip-text text-transparent transition-all duration-700 ${
                isLogoHovered || isLogoGold 
                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" 
                  : "bg-gradient-to-r from-cyan-400 to-violet-500"
              }`}>.ceo</span>
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
              className="text-muted-foreground hover:text-hover-accent transition-all duration-300 font-medium flex items-center gap-1 hover:drop-shadow-[var(--hover-accent-glow)]"
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
                    className="bg-background border border-border/50 rounded-2xl p-6 w-[750px] shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.25),0_0_40px_-10px_hsl(var(--primary)/0.15)] backdrop-blur-sm"
                    initial={{ boxShadow: "0 10px 30px -10px hsl(var(--primary)/0)" }}
                    animate={{ boxShadow: "0 20px 60px -15px hsl(var(--primary)/0.25), 0 0 40px -10px hsl(var(--primary)/0.15)" }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <motion.div 
                      className="pb-3 mb-3 border-b border-border"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.05 }}
                    >
                      <a 
                        href="/features"
                        className="text-sm font-semibold text-primary hover:text-hover-accent hover:drop-shadow-[var(--hover-accent-glow)] transition-all duration-300"
                      >
                        View All Features →
                      </a>
                    </motion.div>
                    
                    {/* Included Features - 3 column grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {includedFeatures.map((feature, index) => (
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
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-all duration-300 group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center group-hover:from-hover-accent/20 group-hover:to-hover-accent/30 group-hover:shadow-[var(--hover-accent-glow)] group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                            <feature.icon className="w-4 h-4 text-primary group-hover:text-hover-accent transition-colors duration-300" />
                          </div>
                          <span className="text-sm font-medium text-foreground group-hover:text-hover-accent group-hover:drop-shadow-[var(--hover-accent-glow)] transition-all duration-300">
                            {feature.name}
                          </span>
                        </motion.a>
                      ))}
                    </div>
                    
                    {/* Add-ons Separator */}
                    <motion.div 
                      className="pt-3 mb-3 border-t border-border"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.3 }}
                    >
                      <span className="text-xs font-semibold text-amber-500 flex items-center gap-2">
                        <span className="bg-amber-500/10 px-2 py-0.5 rounded-full">ADD-ONS</span>
                        <span className="text-muted-foreground font-normal">Extra Cost</span>
                        <span className="bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">Coming Soon</span>
                      </span>
                    </motion.div>
                    
                    {/* Add-on Features - horizontal row */}
                    <div className="grid grid-cols-3 gap-2">
                      {addOnFeatures.map((feature, index) => (
                        <motion.a
                          key={feature.name}
                          href={feature.href}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            duration: 0.2, 
                            delay: 0.35 + (index * 0.03),
                            ease: "easeOut"
                          }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-500/10 transition-all duration-300 group bg-amber-500/5"
                        >
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center group-hover:from-amber-400/30 group-hover:to-orange-500/30 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                            <feature.icon className="w-4 h-4 text-amber-500 group-hover:text-amber-400 transition-colors duration-300" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground group-hover:text-amber-500 transition-all duration-300">
                              {feature.name}
                            </span>
                            <span className="text-[10px] text-violet-400">Coming Soon</span>
                          </div>
                        </motion.a>
                      ))}
                    </div>
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
              className="text-muted-foreground hover:text-hover-accent transition-all duration-300 font-medium hover:drop-shadow-[var(--hover-accent-glow)]"
            >
              {link.name}
            </a>
          ))}

          {/* Tools Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsToolsOpen(true)}
            onMouseLeave={() => setIsToolsOpen(false)}
          >
            <a
              href="/tools"
              className="text-muted-foreground hover:text-hover-accent transition-all duration-300 font-medium flex items-center gap-1 hover:drop-shadow-[var(--hover-accent-glow)]"
            >
              Tools
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`} />
            </a>
            
            <AnimatePresence>
              {isToolsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-4 z-50"
                >
                  <motion.div 
                    className="bg-background border border-border/50 rounded-2xl p-5 w-[420px] shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.25),0_0_40px_-10px_hsl(var(--primary)/0.15)] backdrop-blur-sm"
                    initial={{ boxShadow: "0 10px 30px -10px hsl(var(--primary)/0)" }}
                    animate={{ boxShadow: "0 20px 60px -15px hsl(var(--primary)/0.25), 0 0 40px -10px hsl(var(--primary)/0.15)" }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <motion.div 
                      className="pb-3 mb-3 border-b border-border"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.05 }}
                    >
                      <a 
                        href="/tools"
                        className="text-sm font-semibold text-primary hover:text-hover-accent hover:drop-shadow-[var(--hover-accent-glow)] transition-all duration-300"
                      >
                        View All Tools →
                      </a>
                    </motion.div>
                    
                    {/* Tools Grid - 2 columns */}
                    <div className="grid grid-cols-2 gap-2">
                      {seoTools.map((tool, index) => (
                        <motion.a
                          key={tool.name}
                          href={tool.href}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            duration: 0.2, 
                            delay: 0.05 + (index * 0.03),
                            ease: "easeOut"
                          }}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-all duration-300 group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center group-hover:from-hover-accent/20 group-hover:to-hover-accent/30 group-hover:shadow-[var(--hover-accent-glow)] group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                            <tool.icon className="w-4 h-4 text-primary group-hover:text-hover-accent transition-colors duration-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-foreground group-hover:text-hover-accent group-hover:drop-shadow-[var(--hover-accent-glow)] transition-all duration-300 block">
                              {tool.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground block truncate">
                              {tool.description}
                            </span>
                          </div>
                        </motion.a>
                      ))}
                    </div>
                    
                    {/* Full Audit CTA */}
                    <motion.div 
                      className="pt-3 mt-3 border-t border-border"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.3 }}
                    >
                      <a 
                        href="/audits"
                        className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/10 to-violet-500/10 hover:from-primary/20 hover:to-violet-500/20 transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                            <Search className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-foreground block">Full Website Audit</span>
                            <span className="text-[11px] text-muted-foreground">Complete SEO analysis + free backlink</span>
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-primary -rotate-90 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>


          {/* Contact Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsContactOpen(true)}
            onMouseLeave={() => setIsContactOpen(false)}
          >
            <a
              href="/contact"
              className="text-muted-foreground hover:text-hover-accent transition-all duration-300 font-medium flex items-center gap-1 hover:drop-shadow-[var(--hover-accent-glow)]"
            >
              Contact
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isContactOpen ? 'rotate-180' : ''}`} />
            </a>
            
            <AnimatePresence>
              {isContactOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-4 z-50"
                >
                  <motion.div 
                    className="bg-background border border-border/50 rounded-xl p-2 min-w-[140px] shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.25),0_0_40px_-10px_hsl(var(--primary)/0.15)] backdrop-blur-sm"
                    initial={{ boxShadow: "0 10px 30px -10px hsl(var(--primary)/0)" }}
                    animate={{ boxShadow: "0 20px 60px -15px hsl(var(--primary)/0.25), 0 0 40px -10px hsl(var(--primary)/0.15)" }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    {contactSubLinks.map((subLink, index) => (
                      <motion.a
                        key={subLink.name}
                        href={subLink.href}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.2, 
                          delay: 0.05 + (index * 0.03),
                          ease: "easeOut"
                        }}
                        className="block px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:text-hover-accent hover:bg-secondary hover:drop-shadow-[var(--hover-accent-glow)] transition-all duration-300"
                      >
                        {subLink.name}
                      </motion.a>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Blog Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsBlogOpen(true)}
            onMouseLeave={() => setIsBlogOpen(false)}
          >
            <a
              href="/blog"
              className="text-muted-foreground hover:text-hover-accent transition-all duration-300 font-medium flex items-center gap-1 hover:drop-shadow-[var(--hover-accent-glow)]"
            >
              Blog
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isBlogOpen ? 'rotate-180' : ''}`} />
            </a>
            
            <AnimatePresence>
              {isBlogOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-4 z-50"
                >
                  <motion.div 
                    className="bg-background border border-border/50 rounded-xl p-2 min-w-[140px] shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.25),0_0_40px_-10px_hsl(var(--primary)/0.15)] backdrop-blur-sm"
                    initial={{ boxShadow: "0 10px 30px -10px hsl(var(--primary)/0)" }}
                    animate={{ boxShadow: "0 20px 60px -15px hsl(var(--primary)/0.25), 0 0 40px -10px hsl(var(--primary)/0.15)" }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    {blogSubLinks.map((subLink, index) => (
                      <motion.a
                        key={subLink.name}
                        href={subLink.href}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.2, 
                          delay: 0.05 + (index * 0.03),
                          ease: "easeOut"
                        }}
                        className="block px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:text-hover-accent hover:bg-secondary hover:drop-shadow-[var(--hover-accent-glow)] transition-all duration-300"
                      >
                        {subLink.name}
                      </motion.a>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit Site Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsSubmitSiteOpen(true)}
            onMouseLeave={() => setIsSubmitSiteOpen(false)}
          >
            <button
              className="text-muted-foreground hover:text-hover-accent transition-all duration-300 font-medium flex items-center gap-1 hover:drop-shadow-[var(--hover-accent-glow)]"
            >
              Submit Site
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSubmitSiteOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isSubmitSiteOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="absolute top-full left-1/2 -translate-x-1/2 pt-4 z-50"
                >
                  <motion.div 
                    className="bg-background border border-border/50 rounded-xl p-2 min-w-[160px] shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.25),0_0_40px_-10px_hsl(var(--primary)/0.15)] backdrop-blur-sm"
                    initial={{ boxShadow: "0 10px 30px -10px hsl(var(--primary)/0)" }}
                    animate={{ boxShadow: "0 20px 60px -15px hsl(var(--primary)/0.25), 0 0 40px -10px hsl(var(--primary)/0.15)" }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    {submitSiteSubLinks.map((subLink, index) => (
                      <motion.a
                        key={subLink.name}
                        href={subLink.href}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.2, 
                          delay: 0.05 + (index * 0.03),
                          ease: "easeOut"
                        }}
                        className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          subLink.highlight 
                            ? "bg-gradient-to-r from-amber-400/10 to-yellow-500/10 text-amber-500 hover:from-amber-400/20 hover:to-yellow-500/20 hover:text-amber-400 border border-amber-400/30" 
                            : "text-foreground hover:text-hover-accent hover:bg-secondary hover:drop-shadow-[var(--hover-accent-glow)]"
                        }`}
                      >
                        {subLink.highlight && <span className="mr-1">✨</span>}
                        {subLink.name}
                      </motion.a>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
          <Button variant="heroOutline" size="sm" asChild className="transition-all duration-300 hover:border-amber-400/50 hover:text-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            <a href="https://dashdev.imagehosting.space/">Login</a>
          </Button>
          <Button variant="hero" size="sm" asChild className="transition-all duration-300 hover:from-amber-400 hover:to-yellow-500 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]">
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
                      {includedFeatures.map((feature) => (
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
                      
                      {/* Add-ons in Mobile */}
                      <div className="pt-2 mt-2 border-t border-border">
                        <span className="text-xs font-semibold text-amber-500 flex items-center gap-2 py-1">
                          <span className="bg-amber-500/10 px-2 py-0.5 rounded-full">ADD-ONS</span>
                          <span className="bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">Coming Soon</span>
                        </span>
                        {addOnFeatures.map((feature) => (
                          <a
                            key={feature.name}
                            href={feature.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-amber-500 py-1 transition-colors"
                          >
                            <feature.icon className="w-4 h-4 text-amber-500" />
                            <span className="flex flex-col">
                              <span>{feature.name}</span>
                              <span className="text-[10px] text-violet-400">Coming Soon</span>
                            </span>
                          </a>
                        ))}
                      </div>
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

            {/* Mobile Tools Accordion */}
            <div>
              <button
                onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
                className="flex items-center justify-between w-full text-foreground hover:text-primary transition-colors font-medium py-2"
              >
                Tools
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMobileToolsOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isMobileToolsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 pt-2 space-y-2">
                      <a
                        href="/tools"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-sm text-primary font-medium py-1"
                      >
                        View All Tools →
                      </a>
                      {seoTools.map((tool) => (
                        <a
                          key={tool.name}
                          href={tool.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-1 transition-colors"
                        >
                          <tool.icon className="w-4 h-4 text-primary" />
                          <div className="flex flex-col">
                            <span>{tool.name}</span>
                            <span className="text-[10px] text-muted-foreground">{tool.description}</span>
                          </div>
                        </a>
                      ))}
                      
                      {/* Full Audit CTA */}
                      <a
                        href="/audits"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-sm py-2 mt-2 pt-2 border-t border-border text-primary hover:text-hover-accent transition-colors"
                      >
                        <Search className="w-4 h-4" />
                        Full Website Audit →
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            {/* Mobile Contact Accordion */}
            <div>
              <button
                onClick={() => setIsMobileContactOpen(!isMobileContactOpen)}
                className="flex items-center justify-between w-full text-foreground hover:text-primary transition-colors font-medium py-2"
              >
                Contact
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMobileContactOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isMobileContactOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 pt-2 space-y-2">
                      {contactSubLinks.map((subLink) => (
                        <a
                          key={subLink.name}
                          href={subLink.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block text-sm text-muted-foreground hover:text-foreground py-1 transition-colors"
                        >
                          {subLink.name}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Blog Accordion */}
            <div>
              <button
                onClick={() => setIsMobileBlogOpen(!isMobileBlogOpen)}
                className="flex items-center justify-between w-full text-foreground hover:text-primary transition-colors font-medium py-2"
              >
                Blog
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMobileBlogOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isMobileBlogOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 pt-2 space-y-2">
                      {blogSubLinks.map((subLink) => (
                        <a
                          key={subLink.name}
                          href={subLink.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block text-sm text-muted-foreground hover:text-foreground py-1 transition-colors"
                        >
                          {subLink.name}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Submit Site Accordion */}
            <div>
              <button
                onClick={() => setIsMobileSubmitSiteOpen(!isMobileSubmitSiteOpen)}
                className="flex items-center justify-between w-full text-foreground hover:text-primary transition-colors font-medium py-2"
              >
                Submit Site
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMobileSubmitSiteOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isMobileSubmitSiteOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 pt-2 space-y-2">
                      {submitSiteSubLinks.map((subLink) => (
                        <a
                          key={subLink.name}
                          href={subLink.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`block text-sm py-1 transition-colors ${
                            subLink.highlight 
                              ? "text-amber-500 font-medium" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {subLink.highlight && <span className="mr-1">✨</span>}
                          {subLink.name}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <Button variant="heroOutline" className="w-full transition-all duration-300 hover:border-amber-400/50 hover:text-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]" asChild>
                <a href="https://dashdev.imagehosting.space/">Login</a>
              </Button>
              <Button variant="hero" className="w-full transition-all duration-300 hover:from-amber-400 hover:to-yellow-500 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]" asChild>
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
