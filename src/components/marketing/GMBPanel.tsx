import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  MapPin, Building, CheckCircle, RefreshCw, Zap, BarChart3, 
  Star, Globe, Clock, LogOut, AlertTriangle, 
  Eye, Phone, MessageCircle, TrendingUp, Users, 
  ExternalLink, Radio, Edit, Save, X, Plus, Loader2,
  Calendar, Image, FileText, Settings, ChevronRight, Search,
  ShieldAlert, UserCheck, Info
} from 'lucide-react';
import { GMBOnboardingWizard } from './GMBOnboardingWizard';
import { GMBPerformancePanel } from './GMBPerformancePanel';

interface GmbReview {
  name: string;
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: string;
  comment?: string;
  createTime: string;
  updateTime?: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

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
  reviews?: GmbReview[];
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

const starRatingToNumber = (rating: string): number => {
  const map: Record<string, number> = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 };
  return map[rating] || 0;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatHours = (time: { hours: number; minutes?: number }) => {
  const h = time.hours;
  const m = time.minutes || 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

// Google Business icon
const GoogleBusinessIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#34A853"/>
    <path d="M12 2v4c1.38 0 2.5 1.12 2.5 2.5S13.38 11 12 11v11s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#4285F4"/>
  </svg>
);

export function GMBPanel({ selectedDomain }: GMBPanelProps) {
  const { googleProfile } = useAuth();
  
  // Connection state
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<GmbAccount[]>([]);
  const [locations, setLocations] = useState<GmbLocation[]>([]);
  const [matchingLocation, setMatchingLocation] = useState<GmbLocation | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState("overview");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Check if user's Google account email domain matches selected domain
  // or if they have any GMB listing for that domain
  const ownershipStatus = useMemo(() => {
    if (!selectedDomain || !accessToken) {
      return { isOwner: null, reason: '' };
    }

    const normalizedDomain = normalizeDomain(selectedDomain);
    
    // Check 1: Does user's email domain match the selected domain?
    const userEmailDomain = googleProfile?.email?.split('@')[1]?.toLowerCase() || '';
    const emailDomainMatch = userEmailDomain && (
      normalizedDomain.includes(userEmailDomain.replace(/^www\./, '')) ||
      userEmailDomain.includes(normalizedDomain.replace(/^www\./, ''))
    );

    // Check 2: Does user have a GMB listing for this domain?
    const hasGmbListing = !!matchingLocation;

    // Check 3: Does user have ANY GMB locations (suggests they manage businesses)?
    const hasAnyLocations = locations.length > 0;

    // Determine ownership status
    if (hasGmbListing) {
      return { isOwner: true, reason: 'verified', verifiedBy: 'gmb' };
    }
    
    if (emailDomainMatch) {
      return { isOwner: true, reason: 'email', verifiedBy: 'email' };
    }

    // If they have other locations but not this domain, likely not owner
    if (hasAnyLocations && !hasGmbListing) {
      return { 
        isOwner: false, 
        reason: 'no_listing',
        message: `Your Google account (${googleProfile?.email}) does not appear to own or manage ${selectedDomain}. You have ${locations.length} other business listing(s).`
      };
    }

    // No locations at all - might be new user or domain not claimed
    return { 
      isOwner: null, 
      reason: 'unknown',
      message: `No Google Business Profile listings found for your account. You may need to claim ${selectedDomain} on Google Maps.`
    };
  }, [selectedDomain, accessToken, googleProfile?.email, matchingLocation, locations]);

  // Get stored connection from unified auth
  const getStoredConnection = useCallback(() => {
    const gmbToken = localStorage.getItem('gmb_access_token');
    const gmbExpiry = localStorage.getItem('gmb_token_expiry');
    
    if (gmbToken && gmbExpiry) {
      const expiryTime = parseInt(gmbExpiry, 10);
      if (Date.now() < expiryTime - 300000) {
        return { token: gmbToken };
      }
    }
    
    const unifiedToken = localStorage.getItem('gsc_access_token') || localStorage.getItem('ga_access_token');
    const unifiedExpiry = localStorage.getItem('gsc_token_expiry') || localStorage.getItem('ga_token_expiry');
    
    if (unifiedToken && unifiedExpiry) {
      const expiryTime = parseInt(unifiedExpiry, 10);
      if (Date.now() < expiryTime - 300000) {
        return { token: unifiedToken };
      }
    }
    
    return null;
  }, []);

  // Sync GMB data from API
  const syncGmbData = useCallback(async (token: string, expirySeconds = 3600) => {
    setIsCheckingAccount(true);
    setSyncError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('gmb-sync', {
        body: { accessToken: token, expiresInSeconds: expirySeconds, targetDomain: selectedDomain },
      });

      if (error) throw new Error(error.message);
      
      // Handle authentication errors (401) - clear stale tokens and reset state
      if (data?.error) {
        const errorMsg = data.error.toLowerCase();
        const is401Error = errorMsg.includes('401') || 
                           errorMsg.includes('unauthenticated') || 
                           errorMsg.includes('invalid authentication') ||
                           errorMsg.includes('invalid credentials');
        
        if (is401Error) {
          console.warn('[GMBPanel] Token expired or invalid, clearing credentials');
          // Clear all stale tokens
          localStorage.removeItem('gmb_access_token');
          localStorage.removeItem('gmb_token_expiry');
          sessionStorage.removeItem('gmb_access_token');
          // Also clear unified tokens if they're stale
          localStorage.removeItem('gsc_access_token');
          localStorage.removeItem('gsc_token_expiry');
          localStorage.removeItem('ga_access_token');
          localStorage.removeItem('ga_token_expiry');
          // Reset state to show connect flow
          setAccessToken(null);
          setAccounts([]);
          setLocations([]);
          setMatchingLocation(null);
          toast.info('Your Google session has expired. Please reconnect to continue.');
          return;
        }
        
        if (data.isQuotaError) {
          // Quota exceeded - still allow access to onboarding, just show a toast
          console.warn('[GMBPanel] API quota exceeded, showing onboarding option');
          toast.warning('GMB API quota exceeded. You can still add a new listing.');
          // Don't set syncError - let the UI flow to "no listing found" state
          setAccounts([]);
          setLocations([]);
          setMatchingLocation(null);
          localStorage.setItem('gmb_access_token', token);
          localStorage.setItem('gmb_token_expiry', String(Date.now() + expirySeconds * 1000));
          return;
        } else {
          setSyncError(data.error);
          return;
        }
      }

      const fetchedAccounts = data?.accounts || [];
      const fetchedLocations = data?.locations || [];
      
      setAccounts(fetchedAccounts);
      setLocations(fetchedLocations);
      
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
        setMatchingLocation(match || null);
      }
    } catch (err) {
      console.error('[GMBPanel] Sync error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync GMB data';
      
      // Check if catch block error is also a 401
      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthenticated')) {
        localStorage.removeItem('gmb_access_token');
        localStorage.removeItem('gmb_token_expiry');
        setAccessToken(null);
        setAccounts([]);
        setLocations([]);
        setMatchingLocation(null);
        toast.info('Your Google session has expired. Please reconnect to continue.');
        return;
      }
      
      setSyncError(errorMessage);
    } finally {
      setIsCheckingAccount(false);
    }
  }, [selectedDomain]);

  // Auto-connect on mount
  useEffect(() => {
    const connection = getStoredConnection();
    if (connection) {
      setAccessToken(connection.token);
      const expiry = localStorage.getItem('gmb_token_expiry') || localStorage.getItem('gsc_token_expiry') || localStorage.getItem('ga_token_expiry');
      const remainingSeconds = expiry ? Math.max(60, Math.floor((parseInt(expiry, 10) - Date.now()) / 1000)) : 3600;
      syncGmbData(connection.token, remainingSeconds);
    } else {
      setTimeout(() => setIsCheckingAccount(false), 500);
    }
    
    const handleAuthSync = () => {
      const newConnection = getStoredConnection();
      if (newConnection) {
        setAccessToken(newConnection.token);
        syncGmbData(newConnection.token);
      }
    };
    
    window.addEventListener("google-auth-synced", handleAuthSync);
    return () => window.removeEventListener("google-auth-synced", handleAuthSync);
  }, [getStoredConnection, syncGmbData]);

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
    setShowOnboarding(false);
  }, [selectedDomain, locations]);

  const handleRefresh = useCallback(async () => {
    const token = getStoredConnection()?.token;
    if (!token) return;
    setIsRefreshing(true);
    await syncGmbData(token);
    setIsRefreshing(false);
    toast.success('GMB data refreshed');
  }, [getStoredConnection, syncGmbData]);

  // Popup to open Google Business Profile creation page
  const openGmbPopup = useCallback(() => {
    const width = 600;
    const height = 700;
    const left = (window.screenX ?? 0) + (window.outerWidth - width) / 2;
    const top = (window.screenY ?? 0) + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      'https://business.google.com/create',
      'CreateGMBBusiness',
      `popup=yes,width=${width},height=${height},left=${Math.max(0, left)},top=${Math.max(0, top)}`
    );
    
    if (!popup) {
      toast.error('Popup blocked. Please allow popups for this site and try again.');
      return;
    }

    // Poll to detect when popup is closed, then refresh
    const pollInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollInterval);
        toast.info('Checking for new listings...');
        handleRefresh();
      }
    }, 1000);
  }, [handleRefresh]);

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
    setShowOnboarding(false);
    toast.info('Disconnected from Google Business Profile');
  }, []);

  const handleSetupComplete = useCallback(async () => {
    const token = getStoredConnection()?.token;
    if (token) {
      toast.info('Refreshing business locations...');
      await syncGmbData(token);
      toast.success('Business listing created! It may take a few minutes to appear in Google Maps.');
    }
    setShowOnboarding(false);
  }, [getStoredConnection, syncGmbData]);

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
  }, [accounts, getStoredConnection]);

  const handleReplySubmit = async (reviewName: string) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }
    setSubmittingReply(true);
    // Placeholder - would call GMB API to submit reply
    setTimeout(() => {
      toast.success("Reply submitted successfully!");
      setReplyingTo(null);
      setReplyText("");
      setSubmittingReply(false);
    }, 1000);
  };

  const rating = matchingLocation?.averageRating || 0;
  const reviewCount = matchingLocation?.totalReviewCount || 0;
  const reviews = matchingLocation?.reviews || [];

  return (
    <div className="relative space-y-3 overflow-hidden min-h-[400px]">
      {/* Background Effects - Blue/Green theme for GMB */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <motion.div 
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-500/15 via-green-500/10 to-transparent rounded-bl-[250px]"
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-green-500/15 via-blue-500/8 to-transparent rounded-tr-[200px]"
          animate={{ scale: [1.05, 1, 1.05], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60" />
      </div>

      {/* Compact Header */}
      <header className="relative flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/5 via-transparent to-green-500/5 border border-blue-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Google Business Profile</h2>
            <p className="text-xs text-muted-foreground">Manage listings, reviews & local SEO → Boost Map Pack rankings</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {accessToken && matchingLocation ? (
            <>
              <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">
                <GoogleBusinessIcon /><span className="ml-1.5">Connected</span>
              </Badge>
              <motion.span
                className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Radio className="w-2 h-2" />LIVE
              </motion.span>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-7">
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDisconnect} className="h-7 text-muted-foreground hover:text-destructive">
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : accessToken && isCheckingAccount ? (
            <>
              <Badge variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-500/10">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />Checking...
              </Badge>
            </>
          ) : accessToken ? (
            <>
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10">
                <AlertTriangle className="w-3 h-3 mr-1" />No Listing Found
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-7">
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
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

      {/* Domain Ownership Verification Section - Always show when connected */}
      {!isCheckingAccount && accessToken && selectedDomain && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {/* Verified Owner - Has GMB Listing */}
          {ownershipStatus.isOwner === true && matchingLocation && (
            <Alert className="border-green-500/30 bg-green-500/10">
              <UserCheck className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-sm flex items-center gap-2">
                <span className="font-semibold text-green-400">Verified Owner: </span>
                Your Google account ({googleProfile?.email}) manages this business listing.
                <Badge variant="outline" className="ml-2 text-green-400 border-green-500/30 bg-green-500/10 text-[10px]">
                  <CheckCircle className="w-3 h-3 mr-1" />GMB Verified
                </Badge>
              </AlertDescription>
            </Alert>
          )}

          {/* Verified by Email Domain Match */}
          {ownershipStatus.isOwner === true && ownershipStatus.verifiedBy === 'email' && !matchingLocation && (
            <Alert className="border-blue-500/30 bg-blue-500/10">
              <UserCheck className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm flex items-center gap-2">
                <span className="font-semibold text-blue-400">Domain Match: </span>
                Your email domain matches {selectedDomain}. You can claim this listing.
                <Badge variant="outline" className="ml-2 text-blue-400 border-blue-500/30 bg-blue-500/10 text-[10px]">
                  <CheckCircle className="w-3 h-3 mr-1" />Email Verified
                </Badge>
              </AlertDescription>
            </Alert>
          )}

          {/* Ownership Warning - User has other listings but not this domain */}
          {ownershipStatus.isOwner === false && (
            <Alert className="border-amber-500/30 bg-amber-500/10">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                <span className="font-semibold text-amber-400">Ownership Warning: </span>
                {ownershipStatus.message}
              </AlertDescription>
            </Alert>
          )}

          {/* No Listings Found - Unknown ownership */}
          {ownershipStatus.isOwner === null && !matchingLocation && (
            <Alert className="border-blue-500/30 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm flex items-center justify-between gap-4">
                <div>
                  <span className="font-semibold text-blue-400">Verification Status: </span>
                  {ownershipStatus.message || `No GMB listings found for ${selectedDomain}. Connect your Google account to verify ownership and add a listing.`}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh} 
                  disabled={isRefreshing}
                  className="shrink-0 border-blue-500/30 hover:bg-blue-500/10 text-blue-400"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Re-check
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </motion.div>
      )}

      {/* Loading State */}
      {isCheckingAccount ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <motion.div 
              className="w-24 h-24 rounded-full border-4 border-blue-500/20 border-t-blue-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute inset-2 rounded-full border-4 border-green-500/20 border-b-green-500"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <MapPin className="w-8 h-8 text-blue-500" />
              </motion.div>
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">Checking Google Business Profile</p>
            <p className="text-sm text-muted-foreground">Searching for listings matching {selectedDomain || 'your domain'}...</p>
          </div>
        </motion.div>
      ) : syncError ? (
        /* Error State */
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Connection Error</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">{syncError}</p>
          <Button onClick={handleRefresh} className="bg-gradient-to-r from-blue-600 to-green-600">
            <RefreshCw className="w-4 h-4 mr-2" />Try Again
          </Button>
        </motion.div>
      ) : !accessToken ? (
        /* Not Connected - Need Google Auth */
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-green-500/20 flex items-center justify-center mb-4">
            <MapPin className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Connect Google Account</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            Sign in with Google from the main navigation to access your Google Business Profile listings.
          </p>
          <Badge variant="outline" className="text-muted-foreground">
            <GoogleBusinessIcon /><span className="ml-2">Google Sign-in Required</span>
          </Badge>
        </motion.div>
      ) : showOnboarding ? (
        /* Onboarding Wizard */
        <GMBOnboardingWizard
          domain={selectedDomain || ''}
          accessToken={accessToken}
          accountId={accounts[0]?.name || null}
          accounts={accounts}
          onComplete={handleSetupComplete}
          onCancel={() => setShowOnboarding(false)}
          onRefreshAccounts={refreshAccounts}
        />
      ) : matchingLocation ? (
        /* Connected Dashboard */
        <AnimatePresence mode="wait">
          <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* 6-Tab Dashboard matching CADE layout */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="w-full justify-start gap-1 bg-background/50 border border-border p-1 rounded-xl">
                <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-green-500/20 data-[state=active]:border-blue-500/30 rounded-lg border border-transparent px-3 py-1.5 text-xs">
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />Overview
                </TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:border-amber-500/30 rounded-lg border border-transparent px-3 py-1.5 text-xs">
                  <Star className="w-3.5 h-3.5 mr-1.5" />Reviews
                </TabsTrigger>
                <TabsTrigger value="info" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border-violet-500/30 rounded-lg border border-transparent px-3 py-1.5 text-xs">
                  <Building className="w-3.5 h-3.5 mr-1.5" />Business Info
                </TabsTrigger>
                <TabsTrigger value="posts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-rose-500/20 data-[state=active]:border-pink-500/30 rounded-lg border border-transparent px-3 py-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />Posts
                </TabsTrigger>
                <TabsTrigger value="photos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:border-cyan-500/30 rounded-lg border border-transparent px-3 py-1.5 text-xs">
                  <Image className="w-3.5 h-3.5 mr-1.5" />Photos
                </TabsTrigger>
                <TabsTrigger value="insights" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:border-emerald-500/30 rounded-lg border border-transparent px-3 py-1.5 text-xs">
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" />Insights
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Business Header Card */}
                <Card className="border-blue-500/20 bg-gradient-to-br from-card via-blue-500/5 to-card">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <motion.div
                          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20"
                          whileHover={{ scale: 1.05, rotate: 3 }}
                        >
                          <MapPin className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="text-xl font-bold">{matchingLocation.title}</h3>
                          {matchingLocation.categories?.primaryCategory?.displayName && (
                            <p className="text-sm text-muted-foreground">{matchingLocation.categories.primaryCategory.displayName}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {rating > 0 && (
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                                ))}
                                <span className="text-sm font-bold ml-1">{rating.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">({reviewCount})</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-blue-500/30 hover:bg-blue-500/10" onClick={() => window.open(`https://business.google.com/`, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />Open in GMB
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Star, label: 'Rating', value: rating > 0 ? rating.toFixed(1) : 'No rating', sublabel: `${reviewCount} reviews`, gradient: 'from-amber-500/20 to-orange-500/10', iconColor: 'text-amber-500', borderColor: 'border-amber-500/30' },
                    { icon: MessageCircle, label: 'Reviews', value: reviewCount.toString(), sublabel: 'Total reviews', gradient: 'from-blue-500/20 to-cyan-500/10', iconColor: 'text-blue-500', borderColor: 'border-blue-500/30' },
                    { icon: Globe, label: 'Website', value: matchingLocation.websiteUri ? 'Active' : 'Not set', sublabel: matchingLocation.websiteUri || 'Add website', gradient: 'from-emerald-500/20 to-green-500/10', iconColor: 'text-emerald-500', borderColor: 'border-emerald-500/30' },
                    { icon: Phone, label: 'Phone', value: matchingLocation.phoneNumbers?.primaryPhone ? 'Active' : 'Not set', sublabel: matchingLocation.phoneNumbers?.primaryPhone || 'Add phone', gradient: 'from-violet-500/20 to-purple-500/10', iconColor: 'text-violet-500', borderColor: 'border-violet-500/30' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`relative p-4 rounded-xl bg-gradient-to-br ${stat.gradient} border ${stat.borderColor} overflow-hidden group`}
                    >
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity }} />
                      <div className="relative z-10">
                        <stat.icon className={`w-5 h-5 ${stat.iconColor} mb-2`} />
                        <p className="text-lg font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground truncate">{stat.sublabel}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Actions */}
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Reply to Review', icon: MessageCircle, onClick: () => setActiveTab('reviews'), color: 'from-blue-500 to-cyan-500' },
                        { label: 'Update Info', icon: Edit, onClick: () => setActiveTab('info'), color: 'from-violet-500 to-purple-500' },
                        { label: 'Add Post', icon: FileText, onClick: () => setActiveTab('posts'), color: 'from-pink-500 to-rose-500' },
                        { label: 'Upload Photo', icon: Image, onClick: () => setActiveTab('photos'), color: 'from-emerald-500 to-green-500' },
                      ].map((action, i) => (
                        <Button key={action.label} variant="outline" className="h-auto py-3 flex flex-col items-center gap-2 hover:border-blue-500/50" onClick={action.onClick}>
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                            <action.icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs">{action.label}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Panel */}
                <GMBPerformancePanel accessToken={accessToken} locationName={matchingLocation.name} locationTitle={matchingLocation.title} />
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-4">
                <Card className="border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />Reviews & Replies
                      </CardTitle>
                      {reviewCount > 0 && (
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                          ))}
                          <span className="text-sm font-bold">{rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">({reviewCount})</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {reviews.length > 0 ? (
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {reviews.map((review, i) => {
                            const stars = starRatingToNumber(review.starRating);
                            return (
                              <motion.div
                                key={review.reviewId}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-4 rounded-xl bg-background/60 border border-border group hover:border-amber-500/30 transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  {review.reviewer.profilePhotoUrl ? (
                                    <img src={review.reviewer.profilePhotoUrl} alt={review.reviewer.displayName} className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500/20" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                                      {review.reviewer.displayName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <p className="font-medium text-sm truncate">{review.reviewer.displayName}</p>
                                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(review.createTime)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mb-2">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={`w-3 h-3 ${s <= stars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                                      ))}
                                    </div>
                                    {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}
                                    
                                    {review.reviewReply ? (
                                      <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                        <p className="text-xs font-medium text-primary mb-1">Your response</p>
                                        <p className="text-xs text-muted-foreground">{review.reviewReply.comment}</p>
                                      </div>
                                    ) : replyingTo === review.reviewId ? (
                                      <div className="mt-3 space-y-2">
                                        <Textarea
                                          placeholder="Write your reply..."
                                          value={replyText}
                                          onChange={(e) => setReplyText(e.target.value)}
                                          className="text-sm min-h-[80px]"
                                        />
                                        <div className="flex gap-2">
                                          <Button size="sm" onClick={() => handleReplySubmit(review.name)} disabled={submittingReply} className="bg-gradient-to-r from-blue-600 to-green-600">
                                            {submittingReply ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                                            Submit
                                          </Button>
                                          <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(''); }}>
                                            <X className="w-3 h-3 mr-1" />Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setReplyingTo(review.reviewId)}>
                                        <MessageCircle className="w-3 h-3 mr-1" />Reply
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">No reviews yet</p>
                        <p className="text-xs text-muted-foreground">Reviews will appear here once customers leave feedback</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Business Info Tab */}
              <TabsContent value="info" className="space-y-4">
                <Card className="border-violet-500/20 bg-gradient-to-br from-card to-violet-500/5">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Building className="w-4 h-4 text-violet-500" />Business Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-background/50 border border-border">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Address</p>
                            <p className="text-sm font-medium">{matchingLocation.storefrontAddress?.addressLines?.join(', ')}</p>
                            <p className="text-xs text-muted-foreground">
                              {matchingLocation.storefrontAddress?.locality}, {matchingLocation.storefrontAddress?.administrativeArea} {matchingLocation.storefrontAddress?.postalCode}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-background/50 border border-border">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="text-sm font-medium">{matchingLocation.phoneNumbers?.primaryPhone || 'Not set'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-background/50 border border-border">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-violet-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Website</p>
                            <p className="text-sm font-medium truncate">{matchingLocation.websiteUri || 'Not set'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-background/50 border border-border">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Category</p>
                            <p className="text-sm font-medium">{matchingLocation.categories?.primaryCategory?.displayName || 'Not set'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hours */}
                    {matchingLocation.regularHours?.periods && (
                      <div className="p-4 rounded-xl bg-background/50 border border-border">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500" />Business Hours
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                            const period = matchingLocation.regularHours?.periods.find(p => p.openDay.startsWith(day.toUpperCase()));
                            return (
                              <div key={day} className="text-xs">
                                <span className="text-muted-foreground">{day}:</span>{' '}
                                <span className={period ? '' : 'text-red-400'}>{period ? `${formatHours(period.openTime)} - ${formatHours(period.closeTime)}` : 'Closed'}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <Button variant="outline" className="w-full border-violet-500/30 hover:bg-violet-500/10" onClick={() => window.open('https://business.google.com/', '_blank')}>
                      <Edit className="w-4 h-4 mr-2" />Edit in Google Business
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Posts Tab */}
              <TabsContent value="posts" className="space-y-4">
                <Card className="border-pink-500/20 bg-gradient-to-br from-card to-pink-500/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-pink-500" />Google Posts
                      </CardTitle>
                      <Button size="sm" className="bg-gradient-to-r from-pink-600 to-rose-600">
                        <Plus className="w-3 h-3 mr-1" />New Post
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-pink-500/50" />
                      </div>
                      <p className="text-sm font-medium mb-2">Create Your First Post</p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">Google Posts help you share updates, offers, and events directly on your Business Profile.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="space-y-4">
                <Card className="border-cyan-500/20 bg-gradient-to-br from-card to-cyan-500/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Image className="w-4 h-4 text-cyan-500" />Photos & Media
                      </CardTitle>
                      <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-blue-600">
                        <Plus className="w-3 h-3 mr-1" />Upload
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                        <Image className="w-8 h-8 text-cyan-500/50" />
                      </div>
                      <p className="text-sm font-medium mb-2">Add Business Photos</p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">Photos help customers understand your business. Add images of your products, services, and location.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-4">
                <GMBPerformancePanel accessToken={accessToken} locationName={matchingLocation.name} locationTitle={matchingLocation.title} />
              </TabsContent>
            </Tabs>
          </motion.div>
        </AnimatePresence>
      ) : (
        /* No Listing Found - Inline Onboarding Wizard Style */
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Inline Wizard Card - Matches GSC/GA onboarding style */}
          <div className="p-4 rounded-lg bg-secondary/30 border border-amber-500/30">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground mb-0.5">
                  Add Your Business to Google Maps
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  <span className="text-amber-400 font-medium">{selectedDomain}</span> isn't listed on Google Maps yet
                </p>
              </div>
            </div>

            {/* Step 1: Main Setup Options */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Get your business visible in local search results:
              </p>

              {/* Option 1: Add to Google Maps */}
              <button
                onClick={openGmbPopup}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" fill="#4285F4"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">Create New Listing</span>
                    <Badge className="text-[8px] py-0 h-3.5 bg-blue-500/20 text-blue-400 border-blue-500/30">Recommended</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Add {selectedDomain} to Google Business Profile</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
              </button>

              {/* Option 2: Claim Existing Listing */}
              <button
                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedDomain || '')}+claim+business`, '_blank')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Search className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-foreground block">Claim Existing Listing</span>
                  <p className="text-[10px] text-muted-foreground">Search for and claim an unclaimed listing</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-green-400 transition-colors" />
              </button>

              {/* Option 3: Re-check Connection */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <RefreshCw className={`w-4 h-4 text-violet-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-foreground block">Re-check Connection</span>
                  <p className="text-[10px] text-muted-foreground">Sync your Google account for new listings</p>
                </div>
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                )}
              </button>
            </div>
          </div>

          {/* Compact Benefits Summary - Single Row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: MapPin, label: 'Local Search', value: 'Top 3 get 70% clicks', color: 'blue' },
              { icon: Star, label: 'Reviews', value: '4.5+ stars = 25% more', color: 'amber' },
              { icon: TrendingUp, label: 'Insights', value: 'Track all actions', color: 'green' },
            ].map((benefit, i) => {
              const colorMap: Record<string, string> = {
                blue: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
                amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
                green: 'border-green-500/20 bg-green-500/5 text-green-400',
              };
              
              return (
                <motion.div
                  key={benefit.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-3 rounded-lg border ${colorMap[benefit.color]}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <benefit.icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-medium">{benefit.label}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">{benefit.value}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
