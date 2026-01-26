import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  MapPin, Building, CheckCircle, RefreshCw, Zap, BarChart3, 
  ArrowRight, Star, Globe, Clock, LogOut, AlertTriangle, Target,
  Eye, FlaskConical
} from 'lucide-react';
import { GMBOnboardingWizard } from './GMBOnboardingWizard';
import { GMBConnectedDashboard } from './GMBConnectedDashboard';

interface GmbLocation {
  name: string;
  title: string;
  websiteUri?: string;
  phoneNumbers?: {
    primaryPhone?: string;
  };
  storefrontAddress?: {
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    addressLines?: string[];
  };
  regularHours?: {
    periods: Array<{
      openDay: string;
      openTime: { hours: number; minutes?: number };
      closeDay: string;
      closeTime: { hours: number; minutes?: number };
    }>;
  };
  categories?: {
    primaryCategory?: {
      displayName?: string;
    };
    additionalCategories?: Array<{ displayName?: string }>;
  };
  reviews?: any[];
  averageRating?: number;
  totalReviewCount?: number;
}

interface GmbAccount {
  name: string;
  accountName: string;
  type: string;
}

interface GMBPanelProps {
  selectedDomain: string | null;
}

function normalizeDomain(url: string): string {
  return (url || '')
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .split('/')[0]
    .replace(/\/$/, '');
}

// Google Business icon
const GoogleBusinessIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#34A853"/>
    <path d="M12 2v4c1.38 0 2.5 1.12 2.5 2.5S13.38 11 12 11v11s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#4285F4"/>
  </svg>
);

export function GMBPanel({ selectedDomain }: GMBPanelProps) {
  // Get stored connection from unified auth (always connected if user logged in with Google)
  const getStoredConnection = () => {
    // Check GMB-specific tokens first
    const gmbToken = localStorage.getItem('gmb_access_token');
    const gmbExpiry = localStorage.getItem('gmb_token_expiry');
    
    if (gmbToken && gmbExpiry) {
      const expiryTime = parseInt(gmbExpiry, 10);
      if (Date.now() < expiryTime - 300000) {
        return { token: gmbToken };
      }
    }
    
    // Fall back to unified Google auth tokens
    const unifiedToken = localStorage.getItem('gsc_access_token') || 
                         localStorage.getItem('ga_access_token');
    const unifiedExpiry = localStorage.getItem('gsc_token_expiry') || 
                          localStorage.getItem('ga_token_expiry');
    
    if (unifiedToken && unifiedExpiry) {
      const expiryTime = parseInt(unifiedExpiry, 10);
      if (Date.now() < expiryTime - 300000) {
        return { token: unifiedToken };
      }
    }
    
    return null;
  };

  const storedConnection = getStoredConnection();
  
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(storedConnection?.token || null);
  const [accounts, setAccounts] = useState<GmbAccount[]>([]);
  const [locations, setLocations] = useState<GmbLocation[]>([]);
  const [matchingLocation, setMatchingLocation] = useState<GmbLocation | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync GMB data from API
  const syncGmbData = useCallback(async (token: string, expirySeconds = 3600) => {
    setIsCheckingAccount(true);
    setSyncError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('gmb-sync', {
        body: { accessToken: token, expiresInSeconds: expirySeconds },
      });

      if (error) throw new Error(error.message);
      
      if (data?.error) {
        if (data.isQuotaError) {
          setSyncError('API quota exceeded. Please try again in a minute.');
        } else {
          setSyncError(data.error);
        }
        return;
      }

      const fetchedAccounts = data?.accounts || [];
      const fetchedLocations = data?.locations || [];
      
      setAccounts(fetchedAccounts);
      setLocations(fetchedLocations);
      
      // Store the token
      localStorage.setItem('gmb_access_token', token);
      localStorage.setItem('gmb_token_expiry', String(Date.now() + expirySeconds * 1000));
      
      // Check if selected domain matches any location
      if (selectedDomain) {
        const normalizedSelected = normalizeDomain(selectedDomain);
        const match = fetchedLocations.find((loc: GmbLocation) => {
          const locDomain = normalizeDomain(loc.websiteUri || '');
          return locDomain === normalizedSelected || 
                 locDomain.includes(normalizedSelected) || 
                 normalizedSelected.includes(locDomain);
        });
        
        if (match) {
          setMatchingLocation(match);
        } else {
          setMatchingLocation(null);
        }
      }
    } catch (err) {
      console.error('[GMBPanel] Sync error:', err);
      setSyncError(err instanceof Error ? err.message : 'Failed to sync GMB data');
    } finally {
      setIsCheckingAccount(false);
    }
  }, [selectedDomain]);

  // Auto-connect on mount - always starts checking
  useEffect(() => {
    const connection = getStoredConnection();
    if (connection) {
      setAccessToken(connection.token);
      const expiry = localStorage.getItem('gmb_token_expiry') || 
                     localStorage.getItem('gsc_token_expiry') || 
                     localStorage.getItem('ga_token_expiry');
      const remainingSeconds = expiry 
        ? Math.max(60, Math.floor((parseInt(expiry, 10) - Date.now()) / 1000))
        : 3600;
      syncGmbData(connection.token, remainingSeconds);
    } else {
      // No token - finish checking after brief delay
      setTimeout(() => {
        setIsCheckingAccount(false);
      }, 500);
    }
    
    // Listen for auth sync events
    const handleAuthSync = () => {
      const newConnection = getStoredConnection();
      if (newConnection) {
        setAccessToken(newConnection.token);
        syncGmbData(newConnection.token);
      }
    };
    
    window.addEventListener("google-auth-synced", handleAuthSync);
    return () => window.removeEventListener("google-auth-synced", handleAuthSync);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-check domain match when selected domain changes
  useEffect(() => {
    if (!selectedDomain || locations.length === 0) {
      setMatchingLocation(null);
      return;
    }
    
    const normalizedSelected = normalizeDomain(selectedDomain);
    const match = locations.find((loc) => {
      const locDomain = normalizeDomain(loc.websiteUri || '');
      return locDomain === normalizedSelected || 
             locDomain.includes(normalizedSelected) || 
             normalizedSelected.includes(locDomain);
    });
    
    setMatchingLocation(match || null);
  }, [selectedDomain, locations]);

  const handleRefresh = useCallback(async () => {
    const token = getStoredConnection()?.token;
    if (!token) return;
    setIsRefreshing(true);
    await syncGmbData(token);
    setIsRefreshing(false);
    toast.success('GMB data refreshed');
  }, [syncGmbData]);

  const handleDisconnect = useCallback(() => {
    localStorage.removeItem('gmb_access_token');
    localStorage.removeItem('gmb_token_expiry');
    sessionStorage.removeItem('gmb_access_token');
    sessionStorage.removeItem('gmb_cooldown_until');
    setAccessToken(null);
    setAccounts([]);
    setLocations([]);
    setMatchingLocation(null);
    setSyncError(null);
    toast.info('Disconnected from Google Business Profile');
  }, []);

  const handleSetupComplete = useCallback(async () => {
    const token = getStoredConnection()?.token;
    if (token) {
      toast.info('Refreshing business locations...');
      await syncGmbData(token);
      toast.success('Business listing created! It may take a few minutes to appear in Google Maps.');
    }
  }, [syncGmbData]);

  const refreshAccounts = useCallback(async (): Promise<GmbAccount[]> => {
    const token = getStoredConnection()?.token;
    if (!token) return [];
    try {
      const { data, error } = await supabase.functions.invoke('gmb-sync', {
        body: { accessToken: token, expiresInSeconds: 3600 },
      });
      if (error) throw error;
      const fetchedAccounts = data?.accounts || [];
      setAccounts(fetchedAccounts);
      return fetchedAccounts;
    } catch (err) {
      console.error('[GMBPanel] Refresh accounts error:', err);
      return accounts;
    }
  }, [accounts]);

  return (
    <div className="relative space-y-3 overflow-hidden min-h-[400px]">
      {/* Background Effects - Blue/Green theme for GMB (matching PPC style) */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Corner gradient accents - blue/green theme */}
        <motion.div 
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-500/15 via-green-500/10 to-transparent rounded-bl-[250px]"
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-green-500/15 via-blue-500/8 to-transparent rounded-tr-[200px]"
          animate={{ 
            scale: [1.05, 1, 1.05],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        
        {/* Additional corner blobs for richness */}
        <motion.div 
          className="absolute -top-20 -left-20 w-[350px] h-[350px] bg-gradient-to-br from-green-500/10 via-teal-500/5 to-transparent rounded-full blur-xl"
          animate={{ 
            x: [0, 30, 0],
            y: [0, 20, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -bottom-20 -right-20 w-[300px] h-[300px] bg-gradient-to-tl from-blue-500/10 via-cyan-500/5 to-transparent rounded-full blur-xl"
          animate={{ 
            x: [0, -20, 0],
            y: [0, -30, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        
        {/* Animated vertical scanning line */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Animated horizontal scanning line */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/3 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear', delay: 4 }}
        />
        
        {/* Floating particles */}
        <motion.div
          className="absolute top-[10%] right-[8%] w-2 h-2 rounded-full bg-blue-400/70"
          animate={{ y: [0, -12, 0], opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-[20%] right-[15%] w-1.5 h-1.5 rounded-full bg-green-400/70"
          animate={{ y: [0, -10, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
        />
        <motion.div
          className="absolute top-[15%] right-[25%] w-1 h-1 rounded-full bg-teal-400/70"
          animate={{ y: [0, -8, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
        />
        <motion.div
          className="absolute top-[25%] left-[10%] w-1.5 h-1.5 rounded-full bg-blue-500/70"
          animate={{ y: [0, -6, 0], x: [0, 3, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-[20%] left-[15%] w-2 h-2 rounded-full bg-green-400/60"
          animate={{ y: [0, -15, 0], opacity: [0.4, 0.8, 0.4], scale: [1, 1.3, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute bottom-[30%] right-[12%] w-1.5 h-1.5 rounded-full bg-teal-400/60"
          animate={{ y: [0, -10, 0], x: [0, -5, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.8 }}
        />
        
        {/* Radial glow from top center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-radial from-blue-500/8 via-green-500/3 to-transparent" />
        
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60" />
        
        {/* Side vignettes */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background/50 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background/50 to-transparent" />
      </div>
      
      {/* Compact Header (matching PPC style exactly) */}
      <header className="relative flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/5 via-transparent to-green-500/5 border border-blue-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Google Business Profile</h2>
              <Badge variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-500/10 text-[10px]">
                <Clock className="w-3 h-3 mr-1" />Coming Soon
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Manage listings, reviews & local SEO → Boost Map Pack rankings</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {accessToken ? (
            <>
              <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">
                <GoogleBusinessIcon /><span className="ml-1.5">Connected</span>
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-7">
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDisconnect} className="h-7 text-muted-foreground hover:text-destructive">
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-green-500/30 bg-green-500/10 text-green-400">1,000+ CEOs</Badge>
              <Badge variant="outline" className="text-[10px] border-blue-500/30 bg-blue-500/10 text-blue-400">Local SEO</Badge>
            </div>
          )}
        </div>
      </header>

      {/* Loading State - Futuristic spinner matching VI dashboard */}
      {isCheckingAccount ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="flex flex-col items-center justify-center py-20 space-y-6"
        >
          {/* Animated spinner with multiple rings */}
          <div className="relative">
            {/* Outer ring */}
            <motion.div 
              className="w-24 h-24 rounded-full border-4 border-blue-500/20 border-t-blue-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            {/* Middle ring */}
            <motion.div 
              className="absolute inset-2 rounded-full border-4 border-green-500/20 border-b-green-500"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            {/* Inner glow */}
            <motion.div 
              className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500/20 to-green-500/20"
              animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <MapPin className="w-8 h-8 text-blue-500" />
              </motion.div>
            </div>
          </div>
          
          {/* Loading text with animation */}
          <div className="text-center space-y-2">
            <motion.h3 
              className="text-xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Checking Google Business Profile
            </motion.h3>
            <p className="text-sm text-muted-foreground">
              Looking for listings matching <span className="font-medium text-foreground">{selectedDomain || 'your domain'}</span>...
            </p>
          </div>
          
          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-blue-500"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      ) : matchingLocation && accessToken ? (
        /* Connected State - Domain has matching GMB listing */
        <GMBConnectedDashboard
          location={matchingLocation}
          accessToken={accessToken}
          onDisconnect={handleDisconnect}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      ) : (
        /* No listing found - Show Wizard inline (matching PPC pattern exactly) */
        <GMBOnboardingWizard
          domain={selectedDomain || ''}
          accessToken={accessToken || localStorage.getItem('gsc_access_token') || localStorage.getItem('ga_access_token') || ''}
          accountId={accounts.length > 0 ? accounts[0].name : null}
          accounts={accounts}
          onComplete={handleSetupComplete}
          onCancel={() => {
            // User cancelled - trigger a refresh to check again
            handleRefresh();
          }}
          onRefreshAccounts={refreshAccounts}
        />
      )}
      
      {/* Sync Error Display */}
      {syncError && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Connection Issue</p>
              <p className="text-xs text-muted-foreground mt-1">{syncError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                className="mt-3 h-8 text-xs border-amber-500/30 hover:bg-amber-500/10"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Retry Connection
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
