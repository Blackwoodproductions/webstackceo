import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  MapPin, Building, CheckCircle, RefreshCw, Zap, BarChart3, 
  ArrowRight, Star, Globe, Clock, LogOut, AlertTriangle, Plus
} from 'lucide-react';
import { GMBOnboardingWizard } from './GMBOnboardingWizard';
import { GMBConnectedDashboard } from './GMBConnectedDashboard';
import { GMBExtendedSection } from './ServiceTabExtensions';

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

export function GMBPanel({ selectedDomain }: GMBPanelProps) {
  // Get stored connection from unified auth
  const getStoredConnection = () => {
    // Check GMB-specific tokens first
    const gmbToken = localStorage.getItem('gmb_access_token');
    const gmbExpiry = localStorage.getItem('gmb_token_expiry');
    
    if (gmbToken && gmbExpiry) {
      const expiryTime = parseInt(gmbExpiry, 10);
      if (Date.now() < expiryTime - 300000) {
        return { token: gmbToken, isUnifiedAuth: true };
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
        return { token: unifiedToken, isUnifiedAuth: true };
      }
    }
    
    return null;
  };

  const storedConnection = getStoredConnection();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(!!storedConnection);
  const [accessToken, setAccessToken] = useState<string | null>(storedConnection?.token || null);
  const [accounts, setAccounts] = useState<GmbAccount[]>([]);
  const [locations, setLocations] = useState<GmbLocation[]>([]);
  const [matchingLocation, setMatchingLocation] = useState<GmbLocation | null>(null);
  const [showWizard, setShowWizard] = useState(false);
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
        setIsConnected(true); // Still mark as connected even if quota error
        return;
      }

      const fetchedAccounts = data?.accounts || [];
      const fetchedLocations = data?.locations || [];
      
      setAccounts(fetchedAccounts);
      setLocations(fetchedLocations);
      setIsConnected(true);
      
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
          setShowWizard(false);
        } else {
          setMatchingLocation(null);
          setShowWizard(true);
        }
      } else if (fetchedLocations.length > 0) {
        // No domain selected but has locations
        setMatchingLocation(null);
        setShowWizard(false);
      } else {
        // No locations at all
        setShowWizard(true);
      }
    } catch (err) {
      console.error('[GMBPanel] Sync error:', err);
      setSyncError(err instanceof Error ? err.message : 'Failed to sync GMB data');
      setIsConnected(true);
      setShowWizard(true);
    } finally {
      setIsCheckingAccount(false);
    }
  }, [selectedDomain]);

  // Auto-connect on mount if tokens available
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
      setIsCheckingAccount(false);
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
      if (isConnected && selectedDomain) {
        setShowWizard(true);
      }
      return;
    }
    
    const normalizedSelected = normalizeDomain(selectedDomain);
    const match = locations.find((loc) => {
      const locDomain = normalizeDomain(loc.websiteUri || '');
      return locDomain === normalizedSelected || 
             locDomain.includes(normalizedSelected) || 
             normalizedSelected.includes(locDomain);
    });
    
    if (match) {
      setMatchingLocation(match);
      setShowWizard(false);
    } else {
      setMatchingLocation(null);
      setShowWizard(true);
    }
  }, [selectedDomain, locations, isConnected]);

  const handleRefresh = useCallback(async () => {
    if (!accessToken) return;
    setIsRefreshing(true);
    await syncGmbData(accessToken);
    setIsRefreshing(false);
    toast.success('GMB data refreshed');
  }, [accessToken, syncGmbData]);

  const handleDisconnect = useCallback(() => {
    localStorage.removeItem('gmb_access_token');
    localStorage.removeItem('gmb_token_expiry');
    sessionStorage.removeItem('gmb_access_token');
    sessionStorage.removeItem('gmb_cooldown_until');
    setIsConnected(false);
    setAccessToken(null);
    setAccounts([]);
    setLocations([]);
    setMatchingLocation(null);
    setShowWizard(false);
    setSyncError(null);
    toast.info('Disconnected from Google Business Profile');
  }, []);

  const handleWizardComplete = useCallback(async () => {
    setShowWizard(false);
    if (accessToken) {
      toast.info('Refreshing business locations...');
      await syncGmbData(accessToken);
      toast.success('Business listing created! It may take a few minutes to appear in Google Maps.');
    }
  }, [accessToken, syncGmbData]);

  const refreshAccounts = useCallback(async (): Promise<GmbAccount[]> => {
    if (!accessToken) return [];
    try {
      const { data, error } = await supabase.functions.invoke('gmb-sync', {
        body: { accessToken, expiresInSeconds: 3600 },
      });
      if (error) throw error;
      const fetchedAccounts = data?.accounts || [];
      setAccounts(fetchedAccounts);
      return fetchedAccounts;
    } catch (err) {
      console.error('[GMBPanel] Refresh accounts error:', err);
      return accounts;
    }
  }, [accessToken, accounts]);

  return (
    <div className="relative space-y-3 overflow-hidden min-h-[400px]">
      {/* Background Effects - Blue/Green theme for GMB */}
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
        
        {/* Animated vertical scanning line */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
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
          className="absolute bottom-[20%] left-[15%] w-2 h-2 rounded-full bg-teal-400/60"
          animate={{ y: [0, -15, 0], opacity: [0.4, 0.8, 0.4], scale: [1, 1.3, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
        />
        
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60" />
      </div>
      
      {/* Compact Header */}
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
            <p className="text-xs text-muted-foreground">Manage listings, reviews & local SEO performance</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected && accessToken ? (
            <>
              <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">
                <CheckCircle className="w-3 h-3 mr-1" />
                <span>Connected</span>
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
              <Badge variant="outline" className="text-[10px] border-green-500/30 bg-green-500/10 text-green-400">Local SEO</Badge>
              <Badge variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-400">Reviews</Badge>
            </div>
          )}
        </div>
      </header>

      {/* Loading State */}
      {isCheckingAccount ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">Checking Google Business Profile</h3>
            <p className="text-sm text-muted-foreground">Looking for listings matching {selectedDomain || 'your domain'}...</p>
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
      ) : showWizard && accessToken && selectedDomain ? (
        /* Authenticated but no domain match - show wizard */
        <div className="space-y-4">
          {/* Compact status header */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium">No Listing Found for {selectedDomain}</p>
                <p className="text-xs text-muted-foreground">Create a new Google Business Profile listing below</p>
              </div>
            </div>
          </div>
          
          <GMBOnboardingWizard
            domain={selectedDomain}
            accessToken={accessToken}
            accountId={accounts.length > 0 ? accounts[0].name : null}
            accounts={accounts}
            onComplete={handleWizardComplete}
            onCancel={() => setShowWizard(false)}
            onRefreshAccounts={refreshAccounts}
          />
        </div>
      ) : isConnected && !selectedDomain ? (
        /* Connected but no domain selected */
        <div className="space-y-4">
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">Select a Domain</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Choose a domain from the dropdown above to check if it has a Google Business Profile listing or to create a new one.
            </p>
          </div>
          
          {/* Show all locations if any */}
          {locations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Your Business Locations ({locations.length})
              </h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {locations.map((location) => (
                  <div
                    key={location.name}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Building className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{location.title}</p>
                        {location.storefrontAddress?.locality && (
                          <p className="text-xs text-muted-foreground">
                            {location.storefrontAddress.locality}, {location.storefrontAddress.administrativeArea}
                          </p>
                        )}
                        {location.websiteUri && (
                          <p className="text-xs text-primary truncate mt-1">
                            {location.websiteUri.replace(/^https?:\/\/(www\.)?/, '')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <GMBExtendedSection domain={selectedDomain || undefined} />
        </div>
      ) : !accessToken ? (
        /* Not connected - show connection prompt */
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Compact Hero Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-blue-500/5 to-card border border-blue-500/20 p-5">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent opacity-50" />
            
            {/* Animated glow */}
            <motion.div 
              className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            
            <div className="relative z-10 flex items-center gap-6">
              {/* Left - CTA */}
              <div className="flex-1 space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] font-medium text-blue-400">Local SEO Management</span>
                </div>
                
                <h3 className="text-lg font-bold leading-tight">
                  Dominate <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-500">Local Search</span> With GMB
                </h3>
                
                <p className="text-sm text-muted-foreground">
                  Sign in with Google to manage your Business Profile listings, respond to reviews, and boost local rankings.
                </p>
                
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" />Read-only</span>
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" />OAuth 2.0</span>
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" />Free</span>
                </div>
              </div>
              
              {/* Right - Mini Stats */}
              <div className="hidden md:grid grid-cols-2 gap-1.5 w-40">
                {[
                  { value: '46%', label: 'Local Intent', color: 'text-blue-400' },
                  { value: '88%', label: 'Call/Visit', color: 'text-green-400' },
                  { value: '4.8★', label: 'Avg Rating', color: 'text-amber-400' },
                  { value: '312%', label: 'Views↑', color: 'text-cyan-400' },
                ].map((stat) => (
                  <div key={stat.label} className="p-2 rounded-lg bg-muted/30 border border-border/50 text-center">
                    <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[8px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Process Steps */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Globe, title: 'Connect', desc: 'Link Google account', color: 'blue' },
              { icon: MapPin, title: 'Verify', desc: 'Find your listing', color: 'green' },
              { icon: Star, title: 'Manage', desc: 'Reviews & updates', color: 'amber' },
              { icon: BarChart3, title: 'Track', desc: 'Local performance', color: 'cyan' },
            ].map((item, idx) => (
              <motion.div 
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-3 rounded-xl bg-${item.color}-500/5 border border-${item.color}-500/20 text-center hover:bg-${item.color}-500/10 transition-colors`}
              >
                <item.icon className={`w-5 h-5 mx-auto mb-1.5 text-${item.color}-500`} />
                <p className="text-xs font-medium">{item.title}</p>
                <p className="text-[9px] text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          
          <GMBExtendedSection domain={selectedDomain || undefined} />
        </motion.div>
      ) : (
        /* Fallback - show extended section */
        <GMBExtendedSection domain={selectedDomain || undefined} />
      )}
      
      {/* Sync Error Display */}
      {syncError && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Connection Issue</p>
              <p className="text-xs text-muted-foreground mt-1">{syncError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                className="mt-2 h-7 text-xs"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
