import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AnimatedTagline } from "@/components/ui/animated-tagline";
import { useTheme } from "next-themes";
import { 
  Menu, X, Moon, Sun, Volume2, VolumeX, ChevronDown,
  Search, Link2, PenTool, HelpCircle, Headset, UserCheck, Eye,
  MousePointerClick, TrendingUp, BarChart3, MapPin, Activity, Server, Shield,
  FileText, Target, Zap, LogOut, User as UserIcon, Settings
} from "lucide-react";
import GetStartedDialog from "@/components/GetStartedDialog";
import { useSoundContext } from "@/contexts/SoundContext";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  { icon: BarChart3, name: "Search Console", href: "/analytics", description: "Google Search Console data", highlight: true },
  { icon: Link2, name: "Backlink Analyzer", href: "/tools#backlinks", description: "Analyze your link profile" },
  { icon: FileText, name: "Technical SEO Audit", href: "/tools#technical_audit", description: "Check technical health" },
  { icon: TrendingUp, name: "Traffic Estimator", href: "/tools#traffic", description: "Estimate organic traffic" },
  { icon: Target, name: "Keyword Rankings", href: "/tools#keywords", description: "Discover ranking keywords" },
  { icon: BarChart3, name: "Domain Authority", href: "/tools#domain_rating", description: "Check domain rating" },
  { icon: Zap, name: "Page Speed Test", href: "/tools#page_speed", description: "Test Core Web Vitals" },
  { icon: Search, name: "Schema Checker", href: "/tools#schema", description: "Verify structured data" },
  { icon: Shield, name: "Security Scanner", href: "/tools#security", description: "Check SSL & headers" },
];

const MotionLink = motion(Link);

const Navbar = () => {
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
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
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isThemeMounted, setIsThemeMounted] = useState(false);
  const [isLogoGold, setIsLogoGold] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const { soundEnabled, toggleSound } = useSoundContext();
  const { playSound } = useSoundEffects();
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ avatar_url: string | null; full_name: string | null } | null>(null);

  // Check auth state on mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      // Fetch profile after auth state change
      if (session?.user) {
        setTimeout(() => {
          supabase
            .from('profiles')
            .select('avatar_url, full_name')
            .eq('user_id', session.user.id)
            .maybeSingle()
            .then(({ data }) => {
              if (data) setUserProfile(data);
            });
        }, 0);
      } else {
        setUserProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setUserProfile(data);
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    
    // Clear all Google service tokens
    localStorage.removeItem('unified_google_token');
    localStorage.removeItem('unified_google_expiry');
    localStorage.removeItem('unified_google_scopes');
    localStorage.removeItem('ga_access_token');
    localStorage.removeItem('ga_token_expiry');
    localStorage.removeItem('gsc_access_token');
    localStorage.removeItem('gsc_token_expiry');
    localStorage.removeItem('google_ads_access_token');
    localStorage.removeItem('google_ads_token_expiry');
    localStorage.removeItem('gmb_access_token');
    localStorage.removeItem('gmb_token_expiry');
  };

  const handleGoogleSignIn = async () => {
    // Extended scopes for GA, GSC, Ads, GMB auto-connect
    const EXTENDED_GOOGLE_SCOPES = [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/webmasters",
      "https://www.googleapis.com/auth/adwords",
      "https://www.googleapis.com/auth/business.manage",
    ].join(" ");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: EXTENDED_GOOGLE_SCOPES,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent select_account',
          include_granted_scopes: 'true',
        },
        skipBrowserRedirect: true,
      }
    });
    
    if (error) {
      console.error('Google sign-in error:', error);
      return;
    }
    
    if (!data?.url) {
      console.error('No OAuth URL returned');
      return;
    }

    // Open Google auth in a popup window
    const popupWidth = 520;
    const popupHeight = 720;
    const left = (window.screenX ?? 0) + (window.outerWidth - popupWidth) / 2;
    const top = (window.screenY ?? 0) + (window.outerHeight - popupHeight) / 2;

    const popup = window.open(
      data.url,
      "google_auth_popup",
      `popup=yes,width=${popupWidth},height=${popupHeight},left=${Math.max(0, left)},top=${Math.max(0, top)}`
    );

    if (!popup) {
      console.error('Popup was blocked');
      // Fallback to redirect if popup blocked
      window.location.href = data.url;
      return;
    }

    // Poll for popup closure and check for session
    const pollInterval = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(pollInterval);
          
          // Check if we got a session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setUser(session.user);
            
            // Fetch profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('avatar_url, full_name')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (profileData) {
              setUserProfile(profileData);
            }
            
            // Navigate to dashboard
            window.location.href = '/visitor-intelligence-dashboard';
          }
        }
      } catch {
        // Ignore cross-origin errors while popup is on Google's domain
      }
    }, 500);
  };

  // next-themes can be undefined on first client render; avoid flicker.
  useEffect(() => {
    setIsThemeMounted(true);
  }, []);

  const isDark = isThemeMounted ? (resolvedTheme ?? "dark") !== "light" : true;

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const current = resolvedTheme ?? "dark";
    const next = current === "light" ? "dark" : "light";
    setTheme(next);
  };

  const navLinks = [
    { name: "Pricing", href: "/pricing", isPage: true },
  ];

  // Blog links moved to footer for cleaner nav

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
    <>
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
            <AnimatedTagline className="text-[10px] text-muted-foreground tracking-wide" />
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {/* Features Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsFeaturesOpen(true)}
            onMouseLeave={() => setIsFeaturesOpen(false)}
          >
            <motion.a
              href="/features"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 group overflow-hidden ${
                isFeaturesOpen 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-primary shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              {/* Animated background shimmer */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isFeaturesOpen 
                  ? 'bg-gradient-to-br from-cyan-400 to-violet-500 shadow-lg' 
                  : 'bg-muted group-hover:bg-gradient-to-br group-hover:from-cyan-400 group-hover:to-violet-500'
              }`}>
                <Zap className={`w-3.5 h-3.5 transition-colors duration-300 ${isFeaturesOpen ? 'text-white' : 'text-muted-foreground group-hover:text-white'}`} />
              </div>
              <span className="relative">Features</span>
              <ChevronDown className={`w-4 h-4 transition-all duration-300 ${isFeaturesOpen ? 'rotate-180 text-primary opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover:text-primary'}`} />
            </motion.a>
            
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

          {/* Pricing Link - Enhanced */}
          {navLinks.map((link) => (
            <motion.a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href, link.isPage)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-amber-500/10 transition-all duration-300 group overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <div className="w-6 h-6 rounded-lg bg-muted group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-orange-500 flex items-center justify-center transition-all duration-300">
                <Target className="w-3.5 h-3.5 text-muted-foreground group-hover:text-white transition-colors duration-300" />
              </div>
              <span className="relative">{link.name}</span>
            </motion.a>
          ))}

          {/* Tools Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsToolsOpen(true)}
            onMouseLeave={() => setIsToolsOpen(false)}
          >
            <motion.a
              href="/tools"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 group overflow-hidden ${
                isToolsOpen 
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                  : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10'
              }`}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isToolsOpen 
                  ? 'bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg' 
                  : 'bg-muted group-hover:bg-gradient-to-br group-hover:from-emerald-400 group-hover:to-cyan-500'
              }`}>
                <Search className={`w-3.5 h-3.5 transition-colors duration-300 ${isToolsOpen ? 'text-white' : 'text-muted-foreground group-hover:text-white'}`} />
              </div>
              <span className="relative">Tools</span>
              <ChevronDown className={`w-4 h-4 transition-all duration-300 ${isToolsOpen ? 'rotate-180 text-emerald-500 opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover:text-emerald-500'}`} />
            </motion.a>
            
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
                      {seoTools.map((tool, index) => {
                        const transition = {
                          duration: 0.2,
                          delay: 0.05 + index * 0.03,
                        };

                        const className = `flex items-start gap-3 p-3 rounded-xl transition-all duration-300 group ${
                          'highlight' in tool && tool.highlight
                            ? 'bg-gradient-to-r from-primary/10 to-violet-500/10 hover:from-primary/20 hover:to-violet-500/20 ring-1 ring-primary/20'
                            : 'hover:bg-secondary'
                        }`;

                        const content = (
                          <>
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300 flex-shrink-0 ${
                              'highlight' in tool && tool.highlight
                                ? 'bg-gradient-to-br from-primary to-violet-500 group-hover:shadow-[var(--hover-accent-glow)]'
                                : 'bg-gradient-to-br from-cyan-400/20 to-violet-500/20 group-hover:from-hover-accent/20 group-hover:to-hover-accent/30 group-hover:shadow-[var(--hover-accent-glow)]'
                            }`}>
                              <tool.icon className={`w-4 h-4 transition-colors duration-300 ${
                                'highlight' in tool && tool.highlight ? 'text-white' : 'text-primary group-hover:text-hover-accent'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm font-medium group-hover:drop-shadow-[var(--hover-accent-glow)] transition-all duration-300 block ${
                                'highlight' in tool && tool.highlight ? 'text-primary group-hover:text-hover-accent' : 'text-foreground group-hover:text-hover-accent'
                              }`}>
                                {tool.name}
                                {'highlight' in tool && tool.highlight && <span className="ml-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">NEW</span>}
                              </span>
                              <span className="text-[11px] text-muted-foreground block truncate">
                                {tool.description}
                              </span>
                            </div>
                          </>
                        );

                        if (tool.href === "/analytics") {
                          return (
                            <MotionLink
                              key={tool.name}
                              to={tool.href}
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={transition}
                              className={className}
                            >
                              {content}
                            </MotionLink>
                          );
                        }

                        return (
                          <motion.a
                            key={tool.name}
                            href={tool.href}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={transition}
                            className={className}
                          >
                            {content}
                          </motion.a>
                        );
                      })}
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
            <motion.a
              href="/contact"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 group overflow-hidden ${
                isContactOpen 
                  ? 'bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]' 
                  : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10'
              }`}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isContactOpen 
                  ? 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg' 
                  : 'bg-muted group-hover:bg-gradient-to-br group-hover:from-rose-400 group-hover:to-pink-500'
              }`}>
                <Headset className={`w-3.5 h-3.5 transition-colors duration-300 ${isContactOpen ? 'text-white' : 'text-muted-foreground group-hover:text-white'}`} />
              </div>
              <span className="relative">Contact</span>
              <ChevronDown className={`w-4 h-4 transition-all duration-300 ${isContactOpen ? 'rotate-180 text-rose-500 opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover:text-rose-500'}`} />
            </motion.a>
            
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

          {/* Blog link moved to footer */}

          {/* Submit Site Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsSubmitSiteOpen(true)}
            onMouseLeave={() => setIsSubmitSiteOpen(false)}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 group overflow-hidden ${
                isSubmitSiteOpen 
                  ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                  : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
              }`}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isSubmitSiteOpen 
                  ? 'bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg' 
                  : 'bg-muted group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500'
              }`}>
                <TrendingUp className={`w-3.5 h-3.5 transition-colors duration-300 ${isSubmitSiteOpen ? 'text-white' : 'text-muted-foreground group-hover:text-white'}`} />
              </div>
              <span className="relative">Submit Site</span>
              <ChevronDown className={`w-4 h-4 transition-all duration-300 ${isSubmitSiteOpen ? 'rotate-180 text-amber-500 opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover:text-amber-500'}`} />
            </motion.button>
            
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
          
          {/* Auth Section */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/50 hover:ring-primary transition-all duration-300 focus:outline-none">
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt={userProfile.full_name || 'Profile'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {(userProfile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border border-border z-50">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">
                    {userProfile?.full_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <a href="/visitor-intelligence-dashboard" className="flex items-center gap-2 cursor-pointer">
                    <BarChart3 className="w-4 h-4" />
                    Dashboard
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/visitor-intelligence-dashboard#settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    Settings
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button 
                variant="hero" 
                size="sm" 
                onClick={() => setIsGetStartedOpen(true)}
                className="transition-all duration-300 hover:from-amber-400 hover:to-yellow-500 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]"
              >
                Get Started
              </Button>
              <Button 
                variant="heroOutline" 
                size="sm" 
                onClick={handleGoogleSignIn}
                className="transition-all duration-300 hover:border-amber-400/50 hover:text-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in
              </Button>
            </>
          )}
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

            {/* Blog moved to footer */}

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
              {user ? (
                <>
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    {userProfile?.avatar_url ? (
                      <img 
                        src={userProfile.avatar_url} 
                        alt={userProfile.full_name || 'Profile'} 
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/50"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                        <span className="text-lg font-semibold text-white">
                          {(userProfile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {userProfile?.full_name || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="heroOutline" className="w-full" asChild>
                    <a href="/visitor-intelligence-dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Dashboard
                    </a>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-red-500 hover:text-red-500 hover:bg-red-500/10" 
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="heroOutline" className="w-full transition-all duration-300 hover:border-amber-400/50 hover:text-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]" asChild>
                    <a href="/auth?redirect=/visitor-intelligence-dashboard">Login</a>
                  </Button>
                  <Button 
                    variant="hero" 
                    className="w-full transition-all duration-300 hover:from-amber-400 hover:to-yellow-500 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]" 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsGetStartedOpen(true);
                    }}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </nav>
        </motion.div>
      )}
    </motion.header>
    
    <GetStartedDialog open={isGetStartedOpen} onOpenChange={setIsGetStartedOpen} />
    </>
  );
};

export default Navbar;
