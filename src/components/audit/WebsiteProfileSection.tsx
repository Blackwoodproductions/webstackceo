import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Globe, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  ExternalLink,
  Sparkles,
  Zap,
  TrendingUp,
  Shield,
  Users,
  Crown,
  Bot,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WebsiteProfileProps {
  domain: string;
  profile: {
    title: string | null;
    description: string | null;
    favicon: string | null;
    logo: string | null;
    summary: string | null;
    socialLinks: {
      facebook: string | null;
      twitter: string | null;
      linkedin: string | null;
      instagram: string | null;
      youtube: string | null;
      tiktok: string | null;
    };
    contactInfo: {
      email: string | null;
      phone: string | null;
      address: string | null;
    };
    detectedCategory: string;
  } | null;
  isLoading?: boolean;
}

const categoryLabels: Record<string, string> = {
  ecommerce: 'E-commerce',
  saas: 'SaaS / Software',
  local_business: 'Local Business',
  blog_media: 'Blog / Media',
  professional_services: 'Professional Services',
  healthcare: 'Healthcare',
  finance: 'Finance',
  education: 'Education',
  real_estate: 'Real Estate',
  hospitality: 'Hospitality',
  nonprofit: 'Nonprofit',
  technology: 'Technology',
  other: 'General Business',
};

const categoryIcons: Record<string, typeof Globe> = {
  ecommerce: TrendingUp,
  saas: Zap,
  healthcare: Shield,
  technology: Sparkles,
};

const SocialIcon = ({ platform, url }: { platform: string; url: string }) => {
  const icons: Record<string, typeof Facebook> = {
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
    instagram: Instagram,
    youtube: Youtube,
  };
  
  const Icon = icons[platform] || Globe;
  
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 hover:from-primary/40 hover:to-violet-500/40 transition-all duration-300 group border border-primary/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20"
      title={platform.charAt(0).toUpperCase() + platform.slice(1)}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="w-4 h-4 text-primary group-hover:text-primary transition-colors" />
    </motion.a>
  );
};

// Compact countdown timer component
const ProfileCountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      
      return {
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-center px-4 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/40 shadow-sm">
      <div className="flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-primary" />
        <span className="text-[9px] font-bold text-primary uppercase tracking-wide">Next Report</span>
      </div>
      <div className="font-mono text-sm font-bold text-foreground">
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </div>
    </div>
  );
};

export const WebsiteProfileSection = ({ domain, profile, isLoading }: WebsiteProfileProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="relative p-8 rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border/50 overflow-hidden">
          {/* Animated scanning effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <div className="flex items-center gap-6 animate-pulse relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-56 bg-muted rounded-lg" />
              <div className="h-5 w-full bg-muted rounded-lg" />
              <div className="h-5 w-3/4 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!profile) {
    return null;
  }

  const socialLinks = Object.entries(profile.socialLinks || {}).filter(([_, url]) => url);
  const hasContact = profile.contactInfo?.email || profile.contactInfo?.phone || profile.contactInfo?.address;
  const CategoryIcon = categoryIcons[profile.detectedCategory] || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-10"
    >
      {/* Main Profile Card */}
      <div className="relative group">
        {/* Animated glow background */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-violet-500/30 to-amber-500/30 rounded-[28px] blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500"
          animate={{
            background: [
              "linear-gradient(90deg, rgba(34,211,238,0.3), rgba(139,92,246,0.3), rgba(251,191,36,0.3))",
              "linear-gradient(180deg, rgba(139,92,246,0.3), rgba(251,191,36,0.3), rgba(34,211,238,0.3))",
              "linear-gradient(270deg, rgba(251,191,36,0.3), rgba(34,211,238,0.3), rgba(139,92,246,0.3))",
              "linear-gradient(360deg, rgba(34,211,238,0.3), rgba(139,92,246,0.3), rgba(251,191,36,0.3))",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative p-8 rounded-3xl bg-gradient-to-br from-card via-card/95 to-primary/5 border border-border/50 backdrop-blur-xl overflow-hidden">
          {/* Decorative corner accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-[100px]" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-violet-500/10 to-transparent rounded-tr-[80px]" />
          
          {/* Floating particles */}
          <motion.div
            className="absolute top-8 right-12 w-2 h-2 rounded-full bg-cyan-400/60"
            animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-16 right-24 w-1.5 h-1.5 rounded-full bg-violet-400/60"
            animate={{ y: [0, -8, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          />
          <motion.div
            className="absolute bottom-12 right-16 w-1 h-1 rounded-full bg-amber-400/60"
            animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />

          {/* Header with Logo/Favicon */}
          <div className="flex flex-col lg:flex-row items-start gap-6 mb-6 relative z-10">
            {/* Logo Container */}
            <motion.div 
              className="shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative">
                {/* Animated ring */}
                <motion.div
                  className="absolute -inset-2 rounded-2xl border-2 border-primary/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  style={{ borderRadius: "18px" }}
                />
                
                {profile.logo ? (
                  <img
                    src={profile.logo}
                    alt={`${domain} logo`}
                    className="w-20 h-20 rounded-2xl object-cover bg-muted shadow-xl shadow-primary/10 border border-border/50"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 via-violet-500/20 to-amber-500/10 flex items-center justify-center shadow-xl shadow-primary/10 border border-primary/20 ${profile.logo ? 'hidden' : ''}`}>
                  {profile.favicon ? (
                    <img
                      src={profile.favicon}
                      alt={`${domain} favicon`}
                      className="w-10 h-10"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Globe className="w-10 h-10 text-primary" />
                  )}
                </div>
              </div>
            </motion.div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title Row */}
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <motion.h1 
                  className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {profile.title || domain}
                </motion.h1>
                
                {/* Live Data Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Badge 
                    variant="outline" 
                    className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-medium flex items-center gap-1.5"
                  >
                    <motion.span
                      className="w-2 h-2 rounded-full bg-emerald-500"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    Live Data
                  </Badge>
                </motion.div>
              </div>
              
              {/* Subtitle with Category */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <motion.span
                  className="text-muted-foreground font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Free Website Audit Tool
                </motion.span>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Badge 
                    variant="outline" 
                    className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-violet-500/10 text-primary border-primary/30 font-semibold flex items-center gap-2"
                  >
                    <CategoryIcon className="w-3.5 h-3.5" />
                    {categoryLabels[profile.detectedCategory] || 'General'}
                  </Badge>
                </motion.div>
              </div>
              
              {/* Domain Link */}
              <motion.a
                href={`https://${domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4 group/link"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ x: 3 }}
              >
                <Globe className="w-4 h-4" />
                {domain}
                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
              </motion.a>
              
              {/* Summary with Timer and Badges */}
              <div className="flex items-end gap-6">
                {/* Summary Text */}
                {profile.summary && (
                  <motion.p 
                    className="text-base text-muted-foreground leading-relaxed flex-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {profile.summary}
                  </motion.p>
                )}
                
                {/* Timer Box and Badges */}
                <motion.div 
                  className="shrink-0 flex items-center gap-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {/* Countdown Timer */}
                  <ProfileCountdownTimer />
                  
                  {/* Trust Badges */}
                  <div className="flex flex-col items-center justify-center px-3 h-14 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 shadow-sm hover:scale-105 hover:shadow-cyan-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                    <Users className="w-5 h-5 text-cyan-500" />
                    <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 mt-0.5 whitespace-nowrap">100+ Agencies</span>
                  </div>
                  <div className="flex flex-col items-center justify-center px-3 h-14 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/40 shadow-sm hover:scale-105 hover:shadow-amber-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 whitespace-nowrap">1,000+ CEOs</span>
                  </div>
                  <div className="flex flex-col items-center justify-center px-3 h-14 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/40 shadow-sm hover:scale-105 hover:shadow-violet-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                    <Bot className="w-5 h-5 text-violet-500 animate-[pulse_2s_ease-in-out_infinite]" />
                    <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400 mt-0.5 whitespace-nowrap">Agentic AI</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Divider with gradient */}
          {(socialLinks.length > 0 || hasContact) && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gradient-to-r from-transparent via-border to-transparent" />
              </div>
              <div className="absolute inset-0 flex items-center">
                <motion.div 
                  className="w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
            </div>
          )}

          {/* Social Links & Contact */}
          {(socialLinks.length > 0 || hasContact) && (
            <motion.div 
              className="flex flex-wrap items-center gap-6 relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Social</span>
                  <div className="flex items-center gap-2">
                    {socialLinks.map(([platform, url], index) => (
                      <motion.div
                        key={platform}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                      >
                        <SocialIcon platform={platform} url={url!} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              
              {hasContact && (
                <div className="flex items-center gap-4 text-sm">
                  {profile.contactInfo?.email && (
                    <motion.a
                      href={`mailto:${profile.contactInfo.email}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 hover:bg-primary/10 border border-border/50 hover:border-primary/30 transition-all duration-300 text-muted-foreground hover:text-primary"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Mail className="w-4 h-4" />
                      <span className="font-medium">{profile.contactInfo.email}</span>
                    </motion.a>
                  )}
                  {profile.contactInfo?.phone && (
                    <motion.a
                      href={`tel:${profile.contactInfo.phone}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 hover:bg-primary/10 border border-border/50 hover:border-primary/30 transition-all duration-300 text-muted-foreground hover:text-primary"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Phone className="w-4 h-4" />
                      <span className="font-medium">{profile.contactInfo.phone}</span>
                    </motion.a>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
