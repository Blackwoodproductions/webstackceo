import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSocialOAuth } from '@/hooks/use-social-oauth';
import { useBronApi, BronSubscription } from '@/hooks/use-bron-api';
import {
  loadCachedSocialProfiles,
  saveCachedSocialProfiles,
  type SocialCacheData
} from '@/lib/persistentCache';
import {
  Twitter, Linkedin, Facebook, Instagram, Youtube, 
  RefreshCw, CheckCircle, AlertCircle, ExternalLink,
  Link2, Globe, Loader2, Sparkles, Zap, Target,
  TrendingUp, Clock, BarChart3, Users, FileText, 
  Radio, Rocket, Shield, Eye, Heart, MessageCircle,
  Share2, Calendar, Settings, Play, Pause, ChevronRight,
  ArrowUpRight, Hash, AtSign
} from 'lucide-react';
import { VIDashboardEffects } from '@/components/ui/vi-dashboard-effects';

interface SocialProfile {
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'youtube' | 'tiktok';
  url: string | null;
  detected: boolean;
  connected: boolean;
  username?: string;
}

interface SocialPanelProps {
  selectedDomain: string | null;
}

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

const platformConfig = {
  facebook: { 
    icon: Facebook, 
    name: 'Facebook', 
    color: 'from-blue-600 to-blue-700',
    textColor: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  twitter: { 
    icon: Twitter, 
    name: 'X (Twitter)', 
    color: 'from-sky-500 to-blue-600',
    textColor: 'text-sky-500',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/20'
  },
  linkedin: { 
    icon: Linkedin, 
    name: 'LinkedIn', 
    color: 'from-blue-700 to-blue-800',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    borderColor: 'border-blue-600/20'
  },
  instagram: { 
    icon: Instagram, 
    name: 'Instagram', 
    color: 'from-pink-500 via-purple-500 to-orange-500',
    textColor: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20'
  },
  youtube: { 
    icon: Youtube, 
    name: 'YouTube', 
    color: 'from-red-600 to-red-700',
    textColor: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20'
  },
  tiktok: { 
    icon: TikTokIcon, 
    name: 'TikTok', 
    color: 'from-black to-gray-800',
    textColor: 'text-foreground',
    bgColor: 'bg-foreground/10',
    borderColor: 'border-foreground/20'
  },
};

// Legacy cache functions (kept for backwards compatibility during transition)
const SOCIAL_CACHE_KEY_LEGACY = 'social_profiles_cache';
const SOCIAL_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

interface SocialCacheEntry {
  profiles: SocialProfile[];
  hasCadeSubscription: boolean;
  bronSubscription: BronSubscription | null;
  cachedAt: number;
}

const loadCachedSocialData = (domain: string): SocialCacheEntry | null => {
  // First try persistent cache (new system)
  const persistent = loadCachedSocialProfiles(domain);
  if (persistent) {
    return {
      profiles: persistent.profiles as SocialProfile[],
      hasCadeSubscription: persistent.hasCadeSubscription,
      bronSubscription: persistent.bronSubscription as BronSubscription | null,
      cachedAt: Date.now(), // Persistent cache handles expiry internally
    };
  }
  
  // Fallback to legacy cache
  try {
    const cached = localStorage.getItem(SOCIAL_CACHE_KEY_LEGACY);
    if (!cached) return null;
    const allCaches = JSON.parse(cached) as Record<string, SocialCacheEntry>;
    const entry = allCaches[domain];
    if (entry && entry.cachedAt && (Date.now() - entry.cachedAt) < SOCIAL_CACHE_MAX_AGE) {
      return entry;
    }
  } catch (e) {
    console.warn('Failed to load social cache:', e);
  }
  return null;
};

const saveCachedSocialData = (domain: string, profiles: SocialProfile[], hasCadeSubscription: boolean, bronSubscription: BronSubscription | null) => {
  // Save to persistent cache (new system)
  saveCachedSocialProfiles(domain, {
    profiles: profiles as SocialCacheData['profiles'],
    hasCadeSubscription,
    bronSubscription,
  });
  
  // Also save to legacy cache for backwards compatibility
  try {
    const cached = localStorage.getItem(SOCIAL_CACHE_KEY_LEGACY);
    const allCaches: Record<string, SocialCacheEntry> = cached ? JSON.parse(cached) : {};
    allCaches[domain] = { profiles, hasCadeSubscription, bronSubscription, cachedAt: Date.now() };
    
    // Prune old entries (keep max 10 domains)
    const entries = Object.entries(allCaches);
    if (entries.length > 10) {
      entries.sort((a, b) => b[1].cachedAt - a[1].cachedAt);
      const toKeep = entries.slice(0, 10);
      const pruned: Record<string, SocialCacheEntry> = {};
      for (const [key, val] of toKeep) {
        pruned[key] = val;
      }
      localStorage.setItem(SOCIAL_CACHE_KEY_LEGACY, JSON.stringify(pruned));
    } else {
      localStorage.setItem(SOCIAL_CACHE_KEY_LEGACY, JSON.stringify(allCaches));
    }
  } catch (e) {
    console.warn('Failed to save social cache:', e);
  }
};

export const SocialPanel = ({ selectedDomain }: SocialPanelProps) => {
  const { user } = useAuth();
  const { connections, isConnecting, connect, disconnect } = useSocialOAuth();
  const { fetchSubscription } = useBronApi();
  
  // Check persistent cache synchronously for instant loading
  const [cachedData] = useState(() => selectedDomain ? loadCachedSocialData(selectedDomain) : null);
  
  const [isScanning, setIsScanning] = useState(!cachedData);
  const [scanComplete, setScanComplete] = useState(!!cachedData);
  const [profiles, setProfiles] = useState<SocialProfile[]>(cachedData?.profiles || []);
  const [hasCadeSubscription, setHasCadeSubscription] = useState(cachedData?.hasCadeSubscription || false);
  const [isCheckingCade, setIsCheckingCade] = useState(!cachedData);
  const [bronSubscription, setBronSubscription] = useState<BronSubscription | null>(cachedData?.bronSubscription || null);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(!!cachedData);

  // Check subscription via BRON API
  const checkCadeSubscription = useCallback(async (isBackground = false) => {
    if (!selectedDomain) return;
    
    if (!isBackground) {
      setIsCheckingCade(true);
      setBronSubscription(null);
    }
    try {
      const subscription = await fetchSubscription(selectedDomain);
      
      if (subscription && subscription.has_cade && subscription.status === 'active') {
        setHasCadeSubscription(true);
        setBronSubscription(subscription);
      } else {
        setHasCadeSubscription(false);
        setBronSubscription(subscription);
      }
      return subscription;
    } catch (err) {
      console.error('Error checking BRON subscription:', err);
      setHasCadeSubscription(false);
      setBronSubscription(null);
      return null;
    } finally {
      if (!isBackground) {
        setIsCheckingCade(false);
      }
    }
  }, [selectedDomain, fetchSubscription]);

  // Scan website for social links
  const scanWebsiteForSocials = useCallback(async () => {
    if (!selectedDomain) return;
    
    setIsScanning(true);
    setScanComplete(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-website', {
        body: { url: selectedDomain },
      });
      
      if (error) throw error;
      
      const socialLinks = data?.socialLinks || {};
      
      const detectedProfiles: SocialProfile[] = [
        { platform: 'facebook', url: socialLinks.facebook, detected: !!socialLinks.facebook, connected: connections.facebook.connected },
        { platform: 'twitter', url: socialLinks.twitter, detected: !!socialLinks.twitter, connected: connections.twitter.connected },
        { platform: 'linkedin', url: socialLinks.linkedin, detected: !!socialLinks.linkedin, connected: connections.linkedin.connected },
        { platform: 'instagram', url: socialLinks.instagram, detected: !!socialLinks.instagram, connected: false },
        { platform: 'youtube', url: socialLinks.youtube, detected: !!socialLinks.youtube, connected: false },
        { platform: 'tiktok', url: socialLinks.tiktok, detected: !!socialLinks.tiktok, connected: false },
      ];
      
      // Extract usernames from URLs
      detectedProfiles.forEach(profile => {
        if (profile.url) {
          const urlParts = profile.url.split('/').filter(Boolean);
          profile.username = urlParts[urlParts.length - 1]?.replace(/[?#].*/, '') || undefined;
        }
      });
      
      setProfiles(detectedProfiles);
      setScanComplete(true);
      toast.success('Social media scan complete!');
    } catch (err) {
      console.error('Error scanning website:', err);
      toast.error('Failed to scan website for social links');
    } finally {
      setIsScanning(false);
    }
  }, [selectedDomain, connections]);

  // Update profiles when connections change
  useEffect(() => {
    setProfiles(prev => prev.map(p => {
      if (p.platform === 'facebook' || p.platform === 'twitter' || p.platform === 'linkedin') {
        return { ...p, connected: connections[p.platform].connected };
      }
      return p;
    }));
  }, [connections]);

  // Initial scan when domain changes
  useEffect(() => {
    if (selectedDomain) {
      // If we have cached data, do background refresh
      if (cachedData) {
        setIsBackgroundSyncing(true);
        Promise.all([
          scanWebsiteForSocials(),
          checkCadeSubscription(true),
        ]).then(([, subscription]) => {
          // Save updated cache
          if (profiles.length > 0) {
            saveCachedSocialData(
              selectedDomain, 
              profiles, 
              subscription?.has_cade === true && subscription?.status === 'active',
              subscription || null
            );
          }
        }).finally(() => {
          setIsBackgroundSyncing(false);
        });
      } else {
        // No cache, do full scan
        scanWebsiteForSocials();
        checkCadeSubscription();
      }
    }
  }, [selectedDomain]);
  
  // Save to cache when data updates (after scans complete)
  useEffect(() => {
    if (selectedDomain && scanComplete && profiles.length > 0 && !isBackgroundSyncing) {
      saveCachedSocialData(selectedDomain, profiles, hasCadeSubscription, bronSubscription);
    }
  }, [selectedDomain, scanComplete, profiles, hasCadeSubscription, bronSubscription, isBackgroundSyncing]);

  const detectedCount = profiles.filter(p => p.detected).length;
  const connectedCount = profiles.filter(p => p.connected).length;

  if (!selectedDomain) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Select a domain to view social media insights</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Background sync indicator - subtle, non-blocking */}
      {isBackgroundSyncing && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 backdrop-blur-sm">
          <RefreshCw className="w-3 h-3 text-pink-400 animate-spin" />
          <span className="text-xs text-pink-400">Syncing social...</span>
        </div>
      )}
      <VIDashboardEffects />
      
      {/* Header with scan status and compact platform carousel */}
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shrink-0"
              animate={{ rotate: isScanning ? 360 : 0 }}
              transition={{ duration: 2, repeat: isScanning ? Infinity : 0, ease: "linear" }}
            >
              <Share2 className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Social Media Dashboard</h2>
                {/* CADE Subscription Detected Badge - shows on left after dashboard loads */}
                {hasCadeSubscription && !isCheckingCade && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/40"
                  >
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span className="text-[10px] font-semibold text-violet-300 uppercase tracking-wide">CADE Active</span>
                  </motion.div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Social signals for <span className="font-medium text-foreground">{selectedDomain}</span>
              </p>
            </div>
          </div>

          {/* Social Platform Carousel - Animated Marquee */}
          <div className="relative overflow-hidden flex-1 max-w-[600px] mx-4">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            
            {isScanning ? (
              <div className="flex items-center gap-3 py-1">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="w-20 h-16 rounded-xl shrink-0" />
                ))}
              </div>
            ) : (
              <motion.div
                className="flex items-center gap-3 py-1"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ 
                  duration: 20, 
                  repeat: Infinity, 
                  ease: 'linear',
                  repeatType: 'loop'
                }}
              >
                {/* Duplicate profiles for seamless loop */}
                {[...profiles, ...profiles].map((profile, i) => {
                  const config = platformConfig[profile.platform];
                  const IconComponent = config.icon;
                  
                  return (
                    <motion.div
                      key={`${profile.platform}-${i}`}
                      whileHover={{ scale: 1.08, y: -2 }}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all shrink-0 min-w-[88px] cursor-pointer ${
                        profile.detected 
                          ? `${config.bgColor} ${config.borderColor} shadow-lg` 
                          : 'bg-muted/30 border-border/50 opacity-50'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg shadow-${config.textColor}/20`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs font-semibold mt-2 truncate">{config.name.split(' ')[0]}</span>
                      <span className={`text-[10px] font-medium ${profile.detected ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                        {profile.detected ? (profile.connected ? 'Connected' : 'Detected') : 'Not found'}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* Status badges */}
            {isCheckingCade ? (
              <Badge variant="outline" className="text-violet-400 border-violet-500/30 bg-violet-500/10 text-xs">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />CADE...
              </Badge>
            ) : !hasCadeSubscription ? (
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />No Sub
              </Badge>
            ) : connectedCount > 0 ? (
              <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-xs">
                <Link2 className="w-3 h-3 mr-1" />{connectedCount}
              </Badge>
            ) : null}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={scanWebsiteForSocials}
              disabled={isScanning}
              className="h-8"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isScanning ? 'animate-spin' : ''}`} />
              Scan
            </Button>
          </div>
        </div>
      </div>

      {/* CADE Subscription Check / No Subscription Sales Pitch */}
      <AnimatePresence mode="wait">
        {isCheckingCade ? (
          <motion.div
            key="checking"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 border border-violet-500/30 overflow-hidden"
          >
            {/* Animated background effects */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="relative">
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/30"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-7 h-7 text-white" />
                </motion.div>
                <motion.div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                </motion.div>
              </div>
              
              <div className="text-center">
                <p className="text-base font-semibold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Verifying CADE Subscription
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Checking access for <span className="font-medium text-foreground">{selectedDomain}</span>
                </p>
              </div>
              
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-violet-400"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ) : !hasCadeSubscription ? (
          /* CADE Sales Pitch - No Subscription */
          <motion.div
            key="sales"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <motion.div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </div>
              
              <CardHeader className="relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30"
                    >
                      <Sparkles className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        Automate Your Social Signals with CADE
                        <Badge className="bg-violet-500/20 text-violet-500 border-violet-500/30">
                          AI-Powered
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1 max-w-xl">
                        When you subscribe to CADE, every new article and FAQ is automatically shared across your connected social platforms—building consistent brand presence and driving traffic on autopilot.
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex flex-col items-center p-4 rounded-xl bg-background/50 border border-violet-500/20 min-w-[200px]">
                    <p className="text-sm text-muted-foreground">Starting at</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-violet-500">$99</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                    <Badge variant="outline" className="mt-2 text-violet-500 border-violet-500/30">
                      Includes Social Signals
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10 space-y-6">
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-500" />
                    How CADE Automates Social Signals
                  </h4>
                  
                  <div className="grid md:grid-cols-5 gap-3">
                    {[
                      { step: '1', title: 'Article Published', desc: 'CADE creates optimized content', icon: FileText },
                      { step: '2', title: 'AI Adapts Copy', desc: 'Platform-specific versions', icon: Sparkles },
                      { step: '3', title: 'Hashtags Added', desc: 'Trending tags automatically', icon: Hash },
                      { step: '4', title: 'Scheduled', desc: 'Optimal posting times', icon: Clock },
                      { step: '5', title: 'Published', desc: 'Simultaneous release', icon: Rocket },
                    ].map((item, i) => (
                      <motion.div
                        key={item.step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative p-4 rounded-xl bg-background/30 border border-violet-500/10"
                      >
                        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                          {item.step}
                        </div>
                        <item.icon className="w-5 h-5 text-violet-500 mb-2" />
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                        
                        {i < 4 && (
                          <motion.div
                            className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2"
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <ChevronRight className="w-4 h-4 text-violet-400" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { platform: 'twitter' as const, preview: '🚀 New guide: How to boost your local SEO rankings in 2025!\n\nKey takeaways inside 👇\n\n#SEO #LocalBusiness #Marketing', stats: '280 chars max' },
                    { platform: 'linkedin' as const, preview: 'Excited to share our latest comprehensive guide on local SEO strategies.\n\n✅ Google Business optimization\n✅ Review generation\n✅ Local citations', stats: 'Professional tone' },
                    { platform: 'facebook' as const, preview: '📍 Want to rank higher in local searches? We just published a complete guide covering everything!', stats: 'Casual & engaging' },
                  ].map((item, i) => {
                    const config = platformConfig[item.platform];
                    const IconComponent = config.icon;
                    return (
                      <motion.div
                        key={item.platform}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor}`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-sm">{config.name}</span>
                          <Badge variant="outline" className="ml-auto text-[10px]">{item.stats}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-pre-line">{item.preview}</p>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: Zap, title: 'Zero Manual Work', desc: 'CADE handles everything' },
                    { icon: Target, title: 'Platform Optimized', desc: 'Tailored for each network' },
                    { icon: TrendingUp, title: 'Consistent Presence', desc: 'Never miss a post' },
                    { icon: Sparkles, title: 'AI-Powered Copy', desc: 'Compelling content' },
                  ].map((benefit, i) => (
                    <motion.div
                      key={benefit.title}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="p-4 rounded-xl bg-background/30 border border-violet-500/10 text-center"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-500/10 flex items-center justify-center mx-auto mb-2">
                        <benefit.icon className="w-5 h-5 text-pink-500" />
                      </div>
                      <h4 className="font-semibold text-sm">{benefit.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{benefit.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Connect Accounts Section - Only show when CADE subscription is active */}
      {hasCadeSubscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-purple-500/5 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-white" />
                </div>
                Connect Your Accounts
              </CardTitle>
              <CardDescription>
                Grant read & write access to enable automated posting powered by CADE
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {(['facebook', 'twitter', 'linkedin'] as const).map((platform) => {
                  const config = platformConfig[platform];
                  const IconComponent = config.icon;
                  const connection = connections[platform];
                  const isConnected = connection.connected;
                  const isPlatformConnecting = isConnecting === platform;
                  const profile = profiles.find(p => p.platform === platform);
                  
                  return (
                    <motion.div
                      key={platform}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-xl border ${isConnected ? 'border-emerald-500/30 bg-emerald-500/5' : config.borderColor + ' ' + config.bgColor}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{config.name}</p>
                          {isConnected && connection.profile ? (
                            <p className="text-xs text-emerald-500 truncate">
                              {connection.profile.name || connection.profile.email}
                            </p>
                          ) : profile?.detected ? (
                            <p className="text-xs text-muted-foreground">Detected on site</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Not detected</p>
                          )}
                        </div>
                        {isConnected && connection.profile?.picture && (
                          <img 
                            src={connection.profile.picture} 
                            alt={connection.profile.name || 'Profile'} 
                            className="w-8 h-8 rounded-full border-2 border-emerald-500/30"
                          />
                        )}
                      </div>
                      
                      {isConnected ? (
                        <div className="flex gap-2">
                          <Badge variant="outline" className="flex-1 justify-center text-emerald-500 border-emerald-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />Read & Write
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => disconnect(platform)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => connect(platform)}
                          disabled={isPlatformConnecting}
                          className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90`}
                        >
                          {isPlatformConnecting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <IconComponent className="w-4 h-4 mr-2" />
                              Connect {config.name}
                            </>
                          )}
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}


      {/* Social Presence Overview (if profiles detected) */}
      {scanComplete && detectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                Social Presence Overview
              </CardTitle>
              <CardDescription>
                Summary of detected social profiles for {selectedDomain}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Detected Profiles */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-pink-500" />
                    <span className="font-medium text-sm">Detected Profiles</span>
                  </div>
                  <p className="text-3xl font-bold">{detectedCount}</p>
                  <p className="text-xs text-muted-foreground">of 6 major platforms</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profiles.filter(p => p.detected).map(p => {
                      const config = platformConfig[p.platform];
                      const IconComponent = config.icon;
                      return (
                        <Badge key={p.platform} variant="outline" className={`${config.textColor} ${config.borderColor}`}>
                          <IconComponent className="w-3 h-3 mr-1" />
                          {config.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Connection Status */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium text-sm">Connected Accounts</span>
                  </div>
                  <p className="text-3xl font-bold">{connectedCount}</p>
                  <p className="text-xs text-muted-foreground">ready for automation</p>
                  
                  {connectedCount === 0 && (
                    <p className="text-xs text-amber-500 mt-3 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Connect accounts above to enable posting
                    </p>
                  )}
                </div>

                {/* CADE Status */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span className="font-medium text-sm">CADE Autopilot</span>
                  </div>
                  {hasCadeSubscription ? (
                    <>
                      <p className="text-3xl font-bold text-emerald-500">Active</p>
                      <p className="text-xs text-muted-foreground">Auto-posting enabled</p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-muted-foreground">Inactive</p>
                      <p className="text-xs text-muted-foreground">Subscribe to enable</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
