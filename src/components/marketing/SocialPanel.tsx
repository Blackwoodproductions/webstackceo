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

export const SocialPanel = ({ selectedDomain }: SocialPanelProps) => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [hasCadeSubscription, setHasCadeSubscription] = useState(false);
  const [isCheckingCade, setIsCheckingCade] = useState(false);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  // Simulate connected accounts (in real implementation, this would come from OAuth)
  const [connectedAccounts, setConnectedAccounts] = useState<Record<string, boolean>>({
    facebook: false,
    twitter: false,
    linkedin: false,
  });

  // Check CADE subscription
  const checkCadeSubscription = useCallback(async () => {
    if (!selectedDomain) return;
    
    setIsCheckingCade(true);
    try {
      const { data, error } = await supabase.functions.invoke('cade-api', {
        body: { action: 'subscription-active', domain: selectedDomain },
      });
      
      if (!error && data?.active) {
        setHasCadeSubscription(true);
      } else {
        setHasCadeSubscription(false);
      }
    } catch (err) {
      console.error('Error checking CADE subscription:', err);
      setHasCadeSubscription(false);
    } finally {
      setIsCheckingCade(false);
    }
  }, [selectedDomain]);

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
        { platform: 'facebook', url: socialLinks.facebook, detected: !!socialLinks.facebook, connected: connectedAccounts.facebook },
        { platform: 'twitter', url: socialLinks.twitter, detected: !!socialLinks.twitter, connected: connectedAccounts.twitter },
        { platform: 'linkedin', url: socialLinks.linkedin, detected: !!socialLinks.linkedin, connected: connectedAccounts.linkedin },
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
  }, [selectedDomain, connectedAccounts]);

  // OAuth connection handlers
  const connectPlatform = useCallback(async (platform: 'facebook' | 'twitter' | 'linkedin') => {
    // In a real implementation, this would trigger OAuth flow
    // For now, we'll show a popup explaining the feature
    
    const oauthUrls: Record<string, string> = {
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
      twitter: 'https://twitter.com/i/oauth2/authorize',
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
    };
    
    // Open OAuth popup (simulated - in production would use proper OAuth)
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    toast.info(`${platformConfig[platform].name} OAuth integration coming soon!`, {
      description: 'This will allow CADE to post to your social accounts automatically.'
    });
    
    // Simulate successful connection for demo
    setTimeout(() => {
      setConnectedAccounts(prev => ({ ...prev, [platform]: true }));
      setProfiles(prev => prev.map(p => 
        p.platform === platform ? { ...p, connected: true } : p
      ));
      toast.success(`${platformConfig[platform].name} connected successfully!`);
    }, 1500);
  }, []);

  const disconnectPlatform = useCallback((platform: string) => {
    setConnectedAccounts(prev => ({ ...prev, [platform]: false }));
    setProfiles(prev => prev.map(p => 
      p.platform === platform ? { ...p, connected: false } : p
    ));
    toast.info(`${platformConfig[platform as keyof typeof platformConfig].name} disconnected`);
  }, []);

  // Initial scan when domain changes
  useEffect(() => {
    if (selectedDomain) {
      scanWebsiteForSocials();
      checkCadeSubscription();
    }
  }, [selectedDomain, scanWebsiteForSocials, checkCadeSubscription]);

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
      <VIDashboardEffects />
      
      {/* Header with scan status */}
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <motion.div 
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center"
                animate={{ rotate: isScanning ? 360 : 0 }}
                transition={{ duration: 2, repeat: isScanning ? Infinity : 0, ease: "linear" }}
              >
                <Share2 className="w-5 h-5 text-white" />
              </motion.div>
              Social Media Dashboard
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage social signals for <span className="font-medium text-foreground">{selectedDomain}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isScanning ? (
              <Badge variant="outline" className="text-pink-400 border-pink-500/30 bg-pink-500/10">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />Scanning...
              </Badge>
            ) : scanComplete ? (
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                <CheckCircle className="w-3 h-3 mr-1" />
                {detectedCount} Profiles Found
              </Badge>
            ) : null}
            
            {connectedCount > 0 && (
              <Badge className="bg-gradient-to-r from-pink-500 to-rose-500">
                <Link2 className="w-3 h-3 mr-1" />
                {connectedCount} Connected
              </Badge>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={scanWebsiteForSocials}
              disabled={isScanning}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
              Rescan
            </Button>
          </div>
        </div>
      </div>

      {/* Detected Social Profiles Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {isScanning ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <Skeleton className="w-10 h-10 rounded-lg mx-auto mb-3" />
                <Skeleton className="h-4 w-20 mx-auto mb-2" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </CardContent>
            </Card>
          ))
        ) : (
          profiles.map((profile, i) => {
            const config = platformConfig[profile.platform];
            const IconComponent = config.icon;
            
            return (
              <motion.div
                key={profile.platform}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-pink-500/30 ${profile.detected ? '' : 'opacity-50'}`}>
                  {profile.connected && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-emerald-500 text-[10px] px-1.5 py-0.5">
                        <CheckCircle className="w-2.5 h-2.5 mr-0.5" />Live
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-4 text-center">
                    <motion.div 
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </motion.div>
                    
                    <p className="font-medium text-sm">{config.name}</p>
                    
                    {profile.detected ? (
                      <div className="mt-2">
                        {profile.username && (
                          <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                        )}
                        {profile.url && (
                          <a 
                            href={profile.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-pink-500 hover:underline flex items-center justify-center gap-1 mt-1"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-2">Not detected</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Connect Accounts Section */}
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
                const isConnected = connectedAccounts[platform];
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
                        {isConnected ? (
                          <p className="text-xs text-emerald-500">Connected</p>
                        ) : profile?.detected ? (
                          <p className="text-xs text-muted-foreground">Detected on site</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Not detected</p>
                        )}
                      </div>
                    </div>
                    
                    {isConnected ? (
                      <div className="flex gap-2">
                        <Badge variant="outline" className="flex-1 justify-center text-emerald-500 border-emerald-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />Read & Write
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => disconnectPlatform(platform)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => connectPlatform(platform)}
                        className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90`}
                      >
                        <IconComponent className="w-4 h-4 mr-2" />
                        Connect {config.name}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CADE Integration Section */}
      <AnimatePresence mode="wait">
        {isCheckingCade ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-8"
          >
            <Loader2 className="w-6 h-6 animate-spin text-pink-500 mr-2" />
            <span className="text-muted-foreground">Checking CADE subscription...</span>
          </motion.div>
        ) : hasCadeSubscription ? (
          /* Active CADE Dashboard */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <Sparkles className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        CADE Social Autopilot
                        <Badge className="bg-emerald-500">Active</Badge>
                      </CardTitle>
                      <CardDescription>
                        Automatically sharing your content across connected platforms
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant={autopilotEnabled ? "default" : "outline"}
                      onClick={() => {
                        setAutopilotEnabled(!autopilotEnabled);
                        toast.success(autopilotEnabled ? 'Autopilot paused' : 'Autopilot enabled');
                      }}
                      className={autopilotEnabled ? 'bg-gradient-to-r from-violet-500 to-purple-600' : ''}
                    >
                      {autopilotEnabled ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />Pause Autopilot
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />Enable Autopilot
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Autopilot Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Posts This Week', value: '12', icon: FileText, trend: '+4' },
                    { label: 'Total Reach', value: '2.4K', icon: Users, trend: '+18%' },
                    { label: 'Engagement Rate', value: '4.2%', icon: Heart, trend: '+0.8%' },
                    { label: 'Click-throughs', value: '156', icon: ArrowUpRight, trend: '+23' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-xl bg-background/50 border border-violet-500/10"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className="w-4 h-4 text-violet-500" />
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{stat.value}</span>
                        <span className="text-xs text-emerald-500">{stat.trend}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Separator className="bg-violet-500/20" />

                {/* Recent Automated Posts */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-violet-500" />
                    Recent Automated Posts
                  </h4>
                  
                  <div className="space-y-3">
                    {[
                      { 
                        title: '10 SEO Tips for Local Businesses in 2025',
                        platforms: ['twitter', 'linkedin', 'facebook'],
                        time: '2 hours ago',
                        engagement: { likes: 24, shares: 8, comments: 3 }
                      },
                      { 
                        title: 'How to Optimize Your Google Business Profile',
                        platforms: ['twitter', 'linkedin'],
                        time: '1 day ago',
                        engagement: { likes: 56, shares: 12, comments: 7 }
                      },
                      { 
                        title: 'The Ultimate Guide to Schema Markup',
                        platforms: ['linkedin', 'facebook'],
                        time: '3 days ago',
                        engagement: { likes: 89, shares: 23, comments: 11 }
                      },
                    ].map((post, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-background/30 border border-violet-500/10 hover:border-violet-500/30 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{post.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">{post.time}</span>
                            <div className="flex items-center gap-1">
                              {post.platforms.map(p => {
                                const PlatformIcon = platformConfig[p as keyof typeof platformConfig].icon;
                                return <PlatformIcon key={p} className="w-3 h-3 text-muted-foreground" />;
                              })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />{post.engagement.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="w-3 h-3" />{post.engagement.shares}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />{post.engagement.comments}
                          </span>
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Publishing Queue */}
                <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-violet-500" />
                      Upcoming Posts
                    </h4>
                    <Badge variant="outline" className="text-violet-500 border-violet-500/30">
                      3 scheduled
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {[
                      { title: 'Core Web Vitals: What You Need to Know', time: 'Tomorrow, 9:00 AM' },
                      { title: 'Monthly SEO Report Highlights', time: 'Wed, 2:00 PM' },
                      { title: '5 Quick Wins for Better Rankings', time: 'Fri, 10:00 AM' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-violet-500/5">
                        <span className="flex items-center gap-2">
                          <FileText className="w-3 h-3 text-violet-500" />
                          {item.title}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* CADE Sales Pitch */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm overflow-hidden">
              {/* Animated background glow */}
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
                {/* How it works */}
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

                {/* Platform previews */}
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { 
                      platform: 'twitter' as const, 
                      preview: '🚀 New guide: How to boost your local SEO rankings in 2025!\n\nKey takeaways inside 👇\n\n#SEO #LocalBusiness #Marketing',
                      stats: '280 chars max'
                    },
                    { 
                      platform: 'linkedin' as const, 
                      preview: 'Excited to share our latest comprehensive guide on local SEO strategies.\n\n✅ Google Business optimization\n✅ Review generation\n✅ Local citations',
                      stats: 'Professional tone'
                    },
                    { 
                      platform: 'facebook' as const, 
                      preview: '📍 Want to rank higher in local searches? We just published a complete guide covering everything!',
                      stats: 'Casual & engaging'
                    },
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

                {/* Benefits */}
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

                {/* CTA */}
                <div className="flex justify-center pt-4">
                  <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/30">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Started with CADE
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
