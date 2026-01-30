import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Users, Mail, Phone, MousePointer, FileText, TrendingUp, 
  LogOut, RefreshCw, BarChart3, Target, UserCheck, Building,
  DollarSign, ArrowRight, Eye, Zap, Activity, X, Filter, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Sun, Moon, MessageCircle, Calendar as CalendarIcon, User as UserIcon, FlaskConical, Search, AlertTriangle, Code, Download, Globe, Plus, Shield, MapPin, FileSearch, Star, Boxes, Link2, Award, Sparkles, HelpCircle, Network, Flame, Palette, Crosshair, Twitter, Linkedin, Facebook, Bell, Newspaper, Type, Gauge, ImageIcon, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import SEO from '@/components/SEO';
import { generateAPIDocs } from '@/lib/generateAPIDocs';
import { InlineSEOReport } from '@/components/audit/InlineSEOReport';
import { AnimatedTagline } from '@/components/ui/animated-tagline';
import { useGoogleAuthSync } from '@/hooks/use-google-auth-sync';
import { useAuth } from '@/contexts/AuthContext';
import VisitorFlowDiagram, { VisitorFlowSummary, TimeRange } from '@/components/marketing/VisitorFlowDiagram';
import { GSCDashboardPanel } from '@/components/marketing/GSCDashboardPanel';
import { GADashboardPanel } from '@/components/marketing/GADashboardPanel';
import { GAMetricsBoxes } from '@/components/marketing/GAMetricsBoxes';
import FloatingChatBar from '@/components/marketing/FloatingChatBar';
import { BRONExtendedSection, CADEExtendedSection, SocialSignalsExtendedSection, OnPageSEOExtendedSection, GMBExtendedSection, PPCLandingPagesExtendedSection } from '@/components/marketing/ServiceTabExtensions';
import { OnPageSEOCarousel } from '@/components/marketing/OnPageSEOCarousel';
import { OnPageSEOConnect } from '@/components/marketing/OnPageSEOConnect';
import { CADEPlatformConnect } from '@/components/marketing/CADEPlatformConnect';
import { CADEDashboardNew } from '@/components/marketing/cade';
import { BRONPlatformConnect } from '@/components/marketing/BRONPlatformConnect';
import { AEOGeoDashboard } from '@/components/marketing/AEOGeoDashboard';
import { SocialPanel } from '@/components/marketing/SocialPanel';
import {
  Select,
  SelectGroup,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { QuickStatsExpandableRow } from '@/components/marketing/QuickStatsExpandableRow';

import { GMBPanel } from '@/components/marketing/GMBPanel';
import { LandingPagesPanel } from '@/components/marketing/LandingPagesPanel';

// Import modular dashboard components
import { VIDashboardEffects } from '@/components/ui/vi-dashboard-effects';
import { VIDashboardHeader } from '@/components/dashboard/VIDashboardHeader';
import { VIDashboardTabs, type DashboardTab } from '@/components/dashboard/VIDashboardTabs';
import { VIChatSidebar } from '@/components/dashboard/VIChatSidebar';

// Import optimized hooks
import { useVIAuth } from '@/hooks/use-vi-auth';
import { useVIChat } from '@/hooks/use-vi-chat';
import { useDomainCache } from '@/hooks/use-domain-cache';

interface Lead {
  id: string;
  email: string;
  phone: string | null;
  domain: string | null;
  metric_type: string;
  source_page: string | null;
  created_at: string;
  full_name: string | null;
  company_employees: string | null;
  annual_revenue: string | null;
  qualification_step: number | null;
  funnel_stage: string | null;
  status: string;
  closed_at: string | null;
  closed_amount: number | null;
}

interface VisitorSession {
  id: string;
  session_id: string;
  first_page: string | null;
  referrer: string | null;
  started_at: string;
  last_activity_at: string;
}

interface PageView {
  id: string;
  session_id: string;
  page_path: string;
  page_title: string | null;
  created_at: string;
}

interface ToolInteraction {
  id: string;
  session_id: string;
  tool_name: string;
  tool_type: string | null;
  page_path: string | null;
  metadata: unknown;
  created_at: string;
}

interface FunnelStats {
  visitors: number;
  engaged: number;
  leads: number;
  qualified: number;
  closedLeads: number;
  withName: number;
  withCompanyInfo: number;
}

type GoogleUserProfile = {
  name?: string;
  email?: string;
  picture?: string;
};

function normalizeDomain(v: string): string {
  return v
    .replace('sc-domain:', '')
    .replace('https://', '')
    .replace('http://', '')
    .replace(/\/$/, '');
}

function rootDomainFromUrl(v: string): string {
  return (v || '')
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .split('/')[0];
}

// Dynamic iframe component that resizes based on content height
const CaseStudyIframe = ({ domain }: { domain: string }) => {
  const [iframeHeight, setIframeHeight] = useState(800);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Reset loading state when domain changes
    setIsLoading(true);
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'iframe-height' && typeof event.data.height === 'number') {
        setIframeHeight(event.data.height);
        // Mark as loaded once we receive height (content is ready)
        setIsLoading(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [domain]);
  
  const slug = domain.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  
  return (
    <div className="relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/95 backdrop-blur-sm rounded-xl min-h-[400px]">
          <div className="relative">
            {/* Animated circles */}
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">Loading SEO Report...</p>
          <p className="text-xs text-muted-foreground mt-1">Analyzing domain metrics</p>
        </div>
      )}
      <iframe
        key={`case-study-iframe-${domain}`}
        src={`/case-study/${slug}?embed=true`}
        className={`w-full border-0 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{ height: `${iframeHeight}px`, minHeight: '400px' }}
        scrolling="no"
        title="SEO Case Study"
      />
    </div>
  );
};

const MarketingDashboard = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  // Sync Google OAuth tokens and profile for auto-connect
  useGoogleAuthSync();
  
  // Import useAuth for automatic re-login when tokens expire
  const { signInWithGoogle } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [funnelStats, setFunnelStats] = useState<FunnelStats>({
    visitors: 0,
    engaged: 0,
    leads: 0,
    qualified: 0,
    closedLeads: 0,
    withName: 0,
    withCompanyInfo: 0,
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [toolInteractions, setToolInteractions] = useState<ToolInteraction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [newVisitorsToday, setNewVisitorsToday] = useState(0);
  const [pageFilter, setPageFilter] = useState<string | null>(null);
  const [closeLeadDialog, setCloseLeadDialog] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });
  const [closeAmount, setCloseAmount] = useState<string>('');
  const [closingLead, setClosingLead] = useState(false);
  const [chatOnline, setChatOnline] = useState(() => {
    const stored = localStorage.getItem('chat_operator_online');
    return stored !== null ? stored === 'true' : true;
  });
  const [operatorStatus, setOperatorStatus] = useState<'online' | 'busy' | 'away' | 'offline'>(() => {
    const stored = localStorage.getItem('chat_operator_status');
    return (stored as 'online' | 'busy' | 'away' | 'offline') || 'online';
  });
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [siteArchOpen, setSiteArchOpen] = useState(false);
  const [flowSummary, setFlowSummary] = useState<VisitorFlowSummary | null>(null);
  const [diagramTimeRange, setDiagramTimeRange] = useState<TimeRange>('live');
  const [diagramCustomDateRange, setDiagramCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [sidebarChats, setSidebarChats] = useState<{ id: string; session_id: string; status: string; visitor_name: string | null; visitor_email: string | null; last_message_at: string; current_page: string | null; }[]>([]);
  const [chatProfileAvatars, setChatProfileAvatars] = useState<Record<string, string | null>>({});
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [prevChatCount, setPrevChatCount] = useState(0);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ avatar_url: string | null; full_name: string | null } | null>(null);

  // Keep chat session IDs in a ref so we don't have to re-trigger polling effects whenever chats update.
  const chatSessionIdsRef = useRef<string[]>([]);

  useEffect(() => {
    chatSessionIdsRef.current = sidebarChats.map((c) => c.session_id);
  }, [sidebarChats]);
  const [expandedStatFilter, setExpandedStatFilter] = useState<string | null>(null);
  const [liveVisitors, setLiveVisitors] = useState<{ session_id: string; first_page: string | null; last_activity_at: string; started_at: string; page_count?: number; user_id?: string | null; avatar_url?: string | null; display_name?: string | null; is_current_user?: boolean; }[]>([]);
  const [formTestDialogOpen, setFormTestDialogOpen] = useState(false);
  const [formTests, setFormTests] = useState<{ id: string; form_name: string; status: string; tested_at: string; response_time_ms: number | null; error_message: string | null }[]>([]);
  const [testingForm, setTestingForm] = useState<string | null>(null);
  
  // Dashboard main tabs
  type DashboardTab = 'visitor-intelligence' | 'bron' | 'aeo-geo' | 'cade' | 'gmb' | 'social-signals' | 'on-page-seo' | 'landing-pages';
  
  const validTabs: DashboardTab[] = [
    'visitor-intelligence',
    'bron',
    'aeo-geo',
    'cade',
    'gmb',
    'social-signals',
    'on-page-seo',
    'landing-pages',
  ];

  // Initialize tab from URL hash, and (critically) preserve return-to-tab during OAuth callback
  // so we don't clear ?code=...&state=... before the Landing Pages wizard can consume it.
  const getInitialTab = (): DashboardTab => {
    const hash = window.location.hash.replace('#', '');
    if (hash && validTabs.includes(hash as DashboardTab)) {
      return hash as DashboardTab;
    }

    const params = new URLSearchParams(window.location.search);
    const hasOAuthCallback = Boolean(params.get('code') && params.get('state'));
    const returnTab = sessionStorage.getItem('google_ads_return_tab');
    if (hasOAuthCallback && returnTab && validTabs.includes(returnTab as DashboardTab)) {
      return returnTab as DashboardTab;
    }

    return 'visitor-intelligence';
  };

  const [activeTab, setActiveTab] = useState<DashboardTab>(getInitialTab);

  // If we landed back here with OAuth callback params, force the wizard tab immediately.
  // (This ensures the wizard mounts, reads the params, exchanges the code, then clears the URL.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasOAuthCallback = Boolean(params.get('code') && params.get('state'));
    const returnTab = sessionStorage.getItem('google_ads_return_tab');
    if (hasOAuthCallback && returnTab && validTabs.includes(returnTab as DashboardTab)) {
      setActiveTab(returnTab as DashboardTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL hash in sync with the active tab WITHOUT clearing query params.
  // Query params are needed for OAuth callbacks and are cleared by the wizard after consumption.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.hash = activeTab === 'visitor-intelligence' ? '' : `#${activeTab}`;
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [activeTab]);
  
  // Auto re-login when Google tokens expire - triggers popup automatically
  useEffect(() => {
    const handleAuthExpired = async () => {
      console.log('[VI Dashboard] Google auth expired - triggering re-login popup');
      
      // Clear auth states
      setGscAuthenticated(false);
      setGaAuthenticated(false);
      setGmbAuthenticated(false);
      
      try {
        await signInWithGoogle();
        console.log('[VI Dashboard] Re-auth successful');
        // Tokens will be synced by AuthContext, trigger refresh
        window.location.reload();
      } catch (err) {
        console.error('[VI Dashboard] Re-auth failed:', err);
        toast.error('Session expired. Please sign in again.');
      }
    };

    window.addEventListener('google-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('google-auth-expired', handleAuthExpired);
  }, [signInWithGoogle]);
  
  // CADE subscription state
  const [cadeHasSubscription, setCadeHasSubscription] = useState(false);
  const [cadePlatformConnected, setCadePlatformConnected] = useState<string | null>(null);
  
  // GMB (Google My Business) state
  const [gmbAuthenticated, setGmbAuthenticated] = useState<boolean>(false);
  const [gmbConnecting, setGmbConnecting] = useState(false);
  const [gmbAccounts, setGmbAccounts] = useState<{ name: string; accountName: string; type: string }[]>([]);
  const [gmbLocations, setGmbLocations] = useState<{ 
    name: string; 
    title: string; 
    websiteUri?: string; 
    phoneNumbers?: { primaryPhone?: string };
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
      primaryCategory?: { displayName?: string };
      additionalCategories?: Array<{ displayName?: string }>;
    };
    reviews?: Array<{
      name: string;
      reviewId: string;
      reviewer: { displayName: string; profilePhotoUrl?: string };
      starRating: string;
      comment?: string;
      createTime: string;
      updateTime?: string;
      reviewReply?: { comment: string; updateTime: string };
    }>;
    averageRating?: number;
    totalReviewCount?: number;
  }[]>([]);
  const [selectedGmbAccount, setSelectedGmbAccount] = useState<string | null>(null);
  const [selectedGmbLocation, setSelectedGmbLocation] = useState<string | null>(null);
  const [gmbOnboardingStep, setGmbOnboardingStep] = useState<number>(0);
  const [gmbSyncError, setGmbSyncError] = useState<string | null>(null);
  const [gmbLastSyncAt, setGmbLastSyncAt] = useState<string | null>(null);
  const gmbSyncInFlightRef = useRef(false);

  // Google can enforce very low per-minute quotas on newly-enabled Business Profile APIs.
  // We keep a short client-side cooldown so we don't spam the endpoint and stay stuck at 429.
  const GMB_RATE_LIMIT_COOLDOWN_MS = 70_000;
  const getGmbCooldownUntil = () => Number(sessionStorage.getItem('gmb_cooldown_until') || '0');
  const setGmbCooldownUntil = (ts: number) => sessionStorage.setItem('gmb_cooldown_until', String(ts));

  // Use backend edge function for GMB sync (with server-side caching to reduce quota usage)
  const applyGmbToken = useCallback(async (accessToken: string, expiresIn?: number) => {
    // Prevent duplicate concurrent syncs (React StrictMode/dev + rapid clicks can double-invoke).
    if (gmbSyncInFlightRef.current) return;

    const cooldownUntil = getGmbCooldownUntil();
    if (Date.now() < cooldownUntil) {
      const seconds = Math.max(1, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setGmbSyncError(
        `Google temporarily rate-limited this project (429). Please wait ~${seconds}s and try again.`
      );
      return;
    }

    gmbSyncInFlightRef.current = true;
    setGmbLastSyncAt(new Date().toISOString());

    const safeExpiresIn = Number(expiresIn ?? 3600);
    const expiry = Date.now() + safeExpiresIn * 1000;

    sessionStorage.setItem('gmb_access_token', accessToken);
    sessionStorage.setItem('gmb_token_expiry', expiry.toString());

    setGmbAuthenticated(true);
    setGmbSyncError(null);

    // Use edge function with server-side caching (reduces Google API quota usage)
    try {
      console.log('[GMB] Calling gmb-sync edge function');
      const { data, error } = await supabase.functions.invoke('gmb-sync', {
        body: { accessToken },
      });

      if (error) {
        console.error('[GMB] Edge function error:', error);
        setGmbAccounts([]);
        setGmbLocations([]);
        setGmbSyncError(error.message || 'Failed to sync Google Business data');
        return;
      }

      // Handle quota errors from the edge function
      if (data?.isQuotaError || data?.status === 429) {
        const until = Date.now() + GMB_RATE_LIMIT_COOLDOWN_MS;
        setGmbCooldownUntil(until);
        const seconds = Math.ceil(GMB_RATE_LIMIT_COOLDOWN_MS / 1000);
        const msg = `Google Business API quota exceeded (429). Wait ~${seconds}s then retry. ${data?.details || ''}`;
        console.warn('[GMB]', msg);
        setGmbAccounts([]);
        setGmbLocations([]);
        setGmbSyncError(msg);
        return;
      }

      if (data?.error) {
        console.warn('[GMB] Sync error:', data.error, data.details);
        setGmbAccounts([]);
        setGmbLocations([]);
        setGmbSyncError(`${data.error}${data.details ? ` - ${data.details}` : ''}`);
        return;
      }

      // Clear any previous cooldown on success
      setGmbCooldownUntil(0);

      const { accounts, locations, syncedAt, fromCache } = data || {};
      
      if (fromCache) {
        console.log('[GMB] Using cached data from', syncedAt);
      }

      if (accounts && Array.isArray(accounts) && accounts.length > 0) {
        setGmbAccounts(accounts);
        setGmbLocations(locations || []);
        setGmbLastSyncAt(syncedAt || new Date().toISOString());
        console.log('[GMB] Synced', accounts.length, 'accounts,', (locations || []).length, 'locations');
      } else {
        const msg = 'No Google Business accounts found for the connected Google login.';
        console.warn('[GMB]', msg);
        setGmbAccounts([]);
        setGmbLocations([]);
        setGmbSyncError(msg);
      }
    } catch (err) {
      console.error('[GMB] Failed to sync:', err);
      setGmbAccounts([]);
      setGmbLocations([]);
      setGmbSyncError(err instanceof Error ? err.message : 'Failed to sync Google Business data');
    } finally {
      gmbSyncInFlightRef.current = false;
    }
  }, []);

  // Function to refresh GMB accounts and return them (for wizard use)
  const refreshGmbAccounts = useCallback(async (): Promise<{ name: string; accountName: string; type: string }[]> => {
    const accessToken = localStorage.getItem('gsc_access_token') || localStorage.getItem('ga_access_token') || sessionStorage.getItem('gmb_access_token');
    if (!accessToken) {
      return [];
    }

    try {
      console.log('[GMB] Refreshing accounts for wizard...');
      const { data, error } = await supabase.functions.invoke('gmb-sync', {
        body: { accessToken },
      });

      if (error || data?.error) {
        console.error('[GMB] Failed to refresh accounts:', error || data?.error);
        return [];
      }

      const { accounts, locations } = data || {};
      
      if (accounts && Array.isArray(accounts) && accounts.length > 0) {
        setGmbAccounts(accounts);
        setGmbLocations(locations || []);
        setGmbAuthenticated(true);
        setGmbSyncError(null);
        return accounts;
      }
      
      return [];
    } catch (err) {
      console.error('[GMB] Error refreshing accounts:', err);
      return [];
    }
  }, []);
  
  // SEO Audit state for selected domain
  const [savedAuditForDomain, setSavedAuditForDomain] = useState<{
    id: string;
    domain: string;
    slug: string;
    site_title: string | null;
    domain_rating: number | null;
    organic_traffic: number | null;
    organic_keywords: number | null;
    backlinks: number | null;
    referring_domains: number | null;
    traffic_value: number | null;
    created_at: string;
  } | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditDomainInput, setAuditDomainInput] = useState('');
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [inlineAuditData, setInlineAuditData] = useState<{
    domain: string;
    domainRating: number | null;
    organicTraffic: number | null;
    organicKeywords: number | null;
    backlinks: number | null;
    referringDomains: number | null;
    trafficValue: number | null;
    ahrefsRank: number | null;
  } | null>(null);
  const [inlineAuditError, setInlineAuditError] = useState<string | null>(null);
  
  // Domain caching hook - provides cached domain state with 24h persistence
  const {
    trackedDomains,
    userAddedDomains,
    gscSites,
    selectedDomainKey,
    selectedTrackedDomain: cachedSelectedTrackedDomain,
    setTrackedDomains,
    setUserAddedDomains,
    setGscSites,
    setSelectedDomainKey,
    setSelectedTrackedDomain: setCachedSelectedTrackedDomain,
    addUserDomain,
    removeUserDomain,
    isCacheFresh,
  } = useDomainCache();
  
  const [addDomainDialogOpen, setAddDomainDialogOpen] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [newlyAddedDomain, setNewlyAddedDomain] = useState<string | null>(null);
  
  // GSC domain tracking status
  // Single source-of-truth for the header domain selector (domain-first)
  const [selectedGscDomain, setSelectedGscDomain] = useState<string | null>(null);
  const [gscDomainHasTracking, setGscDomainHasTracking] = useState<boolean>(true); // Default to true until we check
  const [gscTrackingByDomain, setGscTrackingByDomain] = useState<Record<string, boolean>>({});
  const [gscAuthenticated, setGscAuthenticated] = useState<boolean>(false);
  const [gaAuthenticated, setGaAuthenticated] = useState<boolean>(false);
  const [gaMetrics, setGaMetrics] = useState<{
    sessions: number;
    users: number;
    newUsers: number;
    pageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
    engagementRate: number;
    pagesPerSession: number;
    sessionsChange: number;
    usersChange: number;
  } | null>(null);
  const [gaDomainMatches, setGaDomainMatches] = useState<boolean>(false);
  const [selectedGscSiteUrl, setSelectedGscSiteUrl] = useState<string>("");
  const selectedGscDomainRef = useRef<string>("");
  const [gscProfile, setGscProfile] = useState<GoogleUserProfile | null>(null);
  
  // selectedTrackedDomain is aliased from cache hook
  const selectedTrackedDomain = cachedSelectedTrackedDomain;
  const setSelectedTrackedDomain = setCachedSelectedTrackedDomain;
  
  // Track whether currently selected domain is in GSC
  const isCurrentDomainInGsc = useMemo(() => {
    if (!gscAuthenticated || gscSites.length === 0) return false;
    const currentDomain = selectedGscDomain || selectedTrackedDomain;
    if (!currentDomain) return false;
    return gscSites.some(site => {
      const cleanSite = normalizeDomain(site.siteUrl);
      return cleanSite === currentDomain;
    });
  }, [gscAuthenticated, gscSites, selectedGscDomain, selectedTrackedDomain]);

  // Find the matching GSC site URL for the currently selected VI domain
  const matchingGscSiteUrl = useMemo(() => {
    if (!gscSites.length || !selectedTrackedDomain) return undefined;
    const match = gscSites.find(s => normalizeDomain(s.siteUrl) === selectedTrackedDomain);
    return match?.siteUrl;
  }, [gscSites, selectedTrackedDomain]);

  // Check if selected domain matches any GMB location
  const selectedDomainInGmb = useMemo(() => {
    const currentDomain = rootDomainFromUrl(selectedTrackedDomain || selectedDomainKey);
    if (!currentDomain || !gmbLocations.length) return null;
    
    return gmbLocations.find(loc => {
      if (!loc.websiteUri) return false;
      const locDomain = rootDomainFromUrl(loc.websiteUri);
      return locDomain === currentDomain || locDomain.includes(currentDomain) || currentDomain.includes(locDomain);
    });
  }, [selectedTrackedDomain, selectedDomainKey, gmbLocations]);

  const gmbLocationsForSelectedDomain = useMemo(() => {
    const currentDomain = rootDomainFromUrl(selectedTrackedDomain || selectedDomainKey);
    if (!gmbLocations.length) return [];
    // If no domain is selected yet, keep the list unfiltered.
    if (!currentDomain) return gmbLocations;

    return gmbLocations.filter((loc) => {
      if (!loc.websiteUri) return false;
      const locDomain = rootDomainFromUrl(loc.websiteUri);
      return locDomain === currentDomain || locDomain.includes(currentDomain) || currentDomain.includes(locDomain);
    });
  }, [gmbLocations, selectedDomainKey, selectedTrackedDomain]);

  // Keep the UI focused on the selected domain's matching location.
  useEffect(() => {
    setSelectedGmbLocation(selectedDomainInGmb?.name ?? null);
  }, [selectedDomainInGmb?.name]);

  // Fetch saved audit for selected domain (used for the audit pill on all tabs)
  useEffect(() => {
    const fetchAuditForDomain = async () => {
      const domainToCheck = selectedTrackedDomain || selectedDomainKey;
      
      // If no domain selected, clear the audit state
      if (!domainToCheck) {
        setSavedAuditForDomain(null);
        return;
      }
      
      setIsLoadingAudit(true);
      try {
        // Clean the domain for matching
        const cleanDomain = domainToCheck.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
        const { data, error } = await supabase
          .from('saved_audits')
          .select('id, domain, slug, site_title, domain_rating, organic_traffic, organic_keywords, backlinks, referring_domains, traffic_value, created_at')
          .ilike('domain', cleanDomain)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching audit:', error);
          setSavedAuditForDomain(null);
        } else {
          setSavedAuditForDomain(data);
        }
      } catch (e) {
        console.error('Error:', e);
        setSavedAuditForDomain(null);
      } finally {
        setIsLoadingAudit(false);
      }
    };
    
    fetchAuditForDomain();
  }, [selectedTrackedDomain, selectedDomainKey]);

  // Trigger auto SEO audit for a domain
  const triggerAutoAudit = useCallback(async (domain: string) => {
    console.log('[VI Dashboard] Triggering auto-audit for:', domain);
    toast.info(`Running SEO audit for ${domain}...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('auto-seo-audit', {
        body: { domain }
      });
      
      if (error) {
        console.error('[VI Dashboard] Auto-audit error:', error);
        toast.error('Failed to run audit');
        return;
      }
      
      if (data?.success) {
        toast.success(`SEO audit complete for ${domain}`);
        // Refresh the audit data if we're on the On-page SEO tab
        if (activeTab === 'on-page-seo') {
          setSavedAuditForDomain(null);
          setIsLoadingAudit(true);
          const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
          const { data: auditData } = await supabase
            .from('saved_audits')
            .select('id, domain, slug, site_title, domain_rating, organic_traffic, organic_keywords, backlinks, referring_domains, traffic_value, created_at')
            .ilike('domain', cleanDomain)
            .maybeSingle();
          setSavedAuditForDomain(auditData);
          setIsLoadingAudit(false);
        }
      }
    } catch (err) {
      console.error('[VI Dashboard] Auto-audit error:', err);
      toast.error('Failed to run audit');
    }
  }, [activeTab]);

  // Persist chat online status and operator status
  useEffect(() => {
    localStorage.setItem('chat_operator_online', String(chatOnline));
  }, [chatOnline]);

  useEffect(() => {
    localStorage.setItem('chat_operator_status', operatorStatus);
    // If status is offline, also set chatOnline to false
    const isOffline = operatorStatus === 'offline';
    if (isOffline) {
      setChatOnline(false);
    } else if (!chatOnline) {
      setChatOnline(true);
    }
  }, [operatorStatus]);

  // Fetch sidebar chats
  const fetchSidebarChats = async () => {
    const { data } = await supabase
      .from('chat_conversations')
      .select('id, session_id, status, visitor_name, visitor_email, last_message_at, current_page')
      .in('status', ['active', 'pending'])
      .order('last_message_at', { ascending: false });
    
    if (data) {
      setSidebarChats(data);
      
      // Fetch profile avatars for chats with emails
      const emailsToLookup = data.filter(c => c.visitor_email).map(c => c.visitor_email!);
      if (emailsToLookup.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email, avatar_url')
          .in('email', emailsToLookup);
        
        if (profiles) {
          const avatarMap: Record<string, string | null> = {};
          profiles.forEach(p => {
            if (p.email) avatarMap[p.email] = p.avatar_url;
          });
          setChatProfileAvatars(avatarMap);
        }
      }
    }
  };

  // Fetch live visitors (active in last 5 minutes) - ordered by time on site, then page count
  // DEDUPLICATION: Show only ONE entry per user_id (most recent session), preventing duplicate avatars
  const fetchLiveVisitors = useCallback(async () => {
    // Get current user's session ID and user ID for marking
    const currentSessionId = sessionStorage.getItem('webstack_session_id');
    const currentUserId = user?.id || null;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: sessions } = await supabase
      .from('visitor_sessions')
      .select('session_id, first_page, last_activity_at, started_at, user_id')
      .gte('last_activity_at', fiveMinutesAgo)
      .order('last_activity_at', { ascending: false }) // Most recent first for dedup priority
      .limit(50);
    
    if (sessions) {
      // ========== STRICT DEDUPLICATION LOGIC ==========
      // Ensures only ONE entry per unique person appears in the visitor list
      const sortedByActivity = [...sessions].sort(
        (a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
      );
      
      const uniqueSessions: typeof sessions = [];
      const seenKeys = new Set<string>();
      let selfIncluded = false;
      
      for (const s of sortedByActivity) {
        // Check if this session belongs to the current user (by session OR user_id match)
        const isSelf =
          (!!currentUserId && s.user_id === currentUserId) ||
          (!!currentSessionId && s.session_id === currentSessionId);
        
        // STRICT: Only ONE "self" entry ever
        if (isSelf) {
          if (selfIncluded) continue; // Skip duplicate self entries
          selfIncluded = true;
          uniqueSessions.push(s);
          // Also mark both keys as seen to prevent any duplicate routes
          seenKeys.add('self');
          if (currentUserId) seenKeys.add(`u:${currentUserId}`);
          if (currentSessionId) seenKeys.add(`s:${currentSessionId}`);
          continue;
        }
        
        // For other users: dedupe by user_id (if logged in) or session_id (anonymous)
        const key = s.user_id ? `u:${s.user_id}` : `s:${s.session_id}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        uniqueSessions.push(s);
      }
      
      // Filter out sessions that already have an active chat
      const chatSessionIds = chatSessionIdsRef.current;
      const filteredSessions = uniqueSessions.filter(v => !chatSessionIds.includes(v.session_id));
      
      // Fetch page view counts for each session
      const sessionIds = filteredSessions.map(s => s.session_id);
      const { data: pageViews } = await supabase
        .from('page_views')
        .select('session_id')
        .in('session_id', sessionIds);
      
      // Count pages per session
      const pageCountMap: Record<string, number> = {};
      pageViews?.forEach(pv => {
        pageCountMap[pv.session_id] = (pageCountMap[pv.session_id] || 0) + 1;
      });
      
      // Fetch profiles for logged-in users
      const userIds = filteredSessions.filter(s => s.user_id).map(s => s.user_id!);
      let profilesMap: Record<string, { avatar_url: string | null; full_name: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, avatar_url, full_name')
          .in('user_id', userIds);
        
        if (profiles) {
          profiles.forEach(p => {
            profilesMap[p.user_id] = { avatar_url: p.avatar_url, full_name: p.full_name };
          });
        }
      }
      
      // Also get current user's profile if logged in but missing from profilesMap
      if (currentUserId && !profilesMap[currentUserId]) {
        const { data: selfProfile } = await supabase
          .from('profiles')
          .select('user_id, avatar_url, full_name')
          .eq('user_id', currentUserId)
          .single();
        if (selfProfile) {
          profilesMap[selfProfile.user_id] = { avatar_url: selfProfile.avatar_url, full_name: selfProfile.full_name };
        }
      }
      
      // Sort: time on site (descending), then page count (descending)
      const sorted = filteredSessions.sort((a, b) => {
        const timeA = Date.now() - new Date(a.started_at).getTime();
        const timeB = Date.now() - new Date(b.started_at).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return (pageCountMap[b.session_id] || 0) - (pageCountMap[a.session_id] || 0);
      });
      
      // Map with profiles and current user flag
      const visitorsWithProfiles = sorted.slice(0, 10).map(s => {
        const isSelf =
          (!!currentUserId && s.user_id === currentUserId) ||
          (!!currentSessionId && s.session_id === currentSessionId);
        
        // For "self", prefer current user's profile even if session has no user_id yet
        const profileUserId = isSelf && currentUserId ? currentUserId : s.user_id;
        
        return {
          ...s,
          page_count: pageCountMap[s.session_id] || 1,
          avatar_url: profileUserId ? profilesMap[profileUserId]?.avatar_url : null,
          display_name: profileUserId ? profilesMap[profileUserId]?.full_name : null,
          is_current_user: isSelf,
        };
      });
      
      // Sort to put current user first
      const finalSorted = visitorsWithProfiles.sort((a, b) => {
        if (a.is_current_user) return -1;
        if (b.is_current_user) return 1;
        return 0;
      });
      
      setLiveVisitors(finalSorted);
    }
  }, [user?.id]);

  // Poll for live visitors every 30 seconds
  useEffect(() => {
    if (chatOnline) {
      fetchLiveVisitors();
      const interval = setInterval(fetchLiveVisitors, 30000);
      return () => clearInterval(interval);
    }
  }, [chatOnline, fetchLiveVisitors]);

  // Play notification sound for new chats
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      const now = audioContext.currentTime;
      playTone(880, now, 0.15);
      playTone(1174.66, now + 0.15, 0.2);
      setTimeout(() => audioContext.close(), 500);
    } catch (e) {
      console.warn('Could not play notification sound:', e);
    }
  };

  useEffect(() => {
    if (chatOnline) {
      fetchSidebarChats();
    }

    // Subscribe to new conversations
    const convChannel = supabase
      .channel('sidebar-conversations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_conversations' },
        () => {
          if (chatOnline) {
            playNotificationSound();
            fetchSidebarChats();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_conversations' },
        () => {
          if (chatOnline) fetchSidebarChats();
        }
      )
      .subscribe();

    return () => {
      convChannel.unsubscribe();
    };
  }, [chatOnline]);

  // Track new chats for notification badge and ring animation
  useEffect(() => {
    if (sidebarChats.length > prevChatCount && prevChatCount > 0) {
      // New chat arrived - trigger ring animation
      playNotificationSound();
      setHasNewMessage(true);
      // Reset animation after it completes
      setTimeout(() => setHasNewMessage(false), 1500);
    }
    setPrevChatCount(sidebarChats.length);
  }, [sidebarChats.length]);

  // Fetch tracked domains from visitor_sessions (domains with tracking code installed)
  const fetchTrackedDomains = async () => {
    try {
      // Only include production domains with Visitor Intelligence installed
      // Filter out Lovable preview URLs, lovable.app, and lovableproject.com domains
      const allowedDomains = ['webstack.ceo'];
      
      setTrackedDomains(allowedDomains);
      
      // Auto-select first domain if none selected and no GSC sites
      // IMPORTANT: Prioritize tracked domains - they should always be the default
      if (allowedDomains.length > 0 && !selectedTrackedDomain && !selectedGscSiteUrl) {
        setSelectedTrackedDomain(allowedDomains[0]);
        setSelectedGscDomain(allowedDomains[0]);
        setSelectedDomainKey(allowedDomains[0]);
        // Ensure tracking status is TRUE for known tracked domains
        setGscDomainHasTracking(true);
      }
    } catch (err) {
      console.error('Error fetching tracked domains:', err);
    }
  };

  // Fetch tracked domains on mount
  useEffect(() => {
    fetchTrackedDomains();
  }, []);

  const selectedDomainLabel = useMemo(() => {
    // VI domain selector is the source of truth for VI panels
    return selectedTrackedDomain || "";
  }, [selectedTrackedDomain]);

  // Check if the GSC-selected domain is also in VI tracking
  const gscDomainIsInViTracking = useMemo(() => {
    if (!selectedGscDomain) return false;
    const viDomains = [...new Set([...trackedDomains, ...userAddedDomains])];
    return viDomains.includes(selectedGscDomain);
  }, [selectedGscDomain, trackedDomains, userAddedDomains]);

  // Check if VI-selected domain is a user-added domain without tracking installed
  const isViDomainPendingTracking = userAddedDomains.includes(selectedTrackedDomain) && !trackedDomains.includes(selectedTrackedDomain);
  
  // Show VI panels when a VI domain is selected and has tracking (not user-added pending)
  const shouldShowViPanels = !!selectedTrackedDomain && !isViDomainPendingTracking;
  
  // Show install prompt when VI domain is pending tracking installation
  const shouldShowInstallPrompt = isViDomainPendingTracking || 
    (gscAuthenticated && !!selectedGscDomain && !gscDomainIsInViTracking);

  // Enforce a single source of truth between the top domain selector and the GSC panel.
  // If a tracked domain is selected and it doesn't exist in GSC, the GSC site MUST be cleared.
  // If it does exist in GSC, ensure selectedGscSiteUrl points to the matching GSC site.
  useEffect(() => {
    if (!gscAuthenticated) return;
    if (!selectedTrackedDomain) return;

    const match = gscSites.find((s) => normalizeDomain(s.siteUrl) === selectedTrackedDomain);
    if (match) {
      if (selectedGscSiteUrl !== match.siteUrl) {
        setSelectedGscSiteUrl(match.siteUrl);
      }
    } else {
      if (selectedGscSiteUrl) {
        setSelectedGscSiteUrl("");
      }
    }
  }, [gscAuthenticated, gscSites, selectedTrackedDomain, selectedGscSiteUrl]);

  type GscDateRange = "7" | "28" | "90" | "180" | "365";
  const integratedGscDateRange = useMemo<GscDateRange>(() => {
    const clampToNearest = (days: number): GscDateRange => {
      const options: Array<{ d: number; v: GscDateRange }> = [
        { d: 7, v: "7" },
        { d: 28, v: "28" },
        { d: 90, v: "90" },
        { d: 180, v: "180" },
        { d: 365, v: "365" },
      ];
      let best = options[0];
      for (const opt of options) {
        if (Math.abs(opt.d - days) < Math.abs(best.d - days)) best = opt;
      }
      return best.v;
    };

    switch (diagramTimeRange) {
      case "live":
      case "yesterday":
      case "week":
        return "7";
      case "month":
        return "28";
      case "6months":
        return "180";
      case "1year":
        return "365";
      case "custom": {
        const from = diagramCustomDateRange.from;
        const to = diagramCustomDateRange.to;
        if (!from || !to) return "28";
        const ms = Math.abs(to.getTime() - from.getTime());
        const days = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
        return clampToNearest(days);
      }
      default:
        return "28";
    }
  }, [diagramTimeRange, diagramCustomDateRange.from, diagramCustomDateRange.to]);

  const shouldIntegrateGscDate = !!selectedGscSiteUrl && gscDomainIsInViTracking;

  // Keep ref in sync with currently selected domain (GSC site or tracked domain)
  useEffect(() => {
    const currentDomain = selectedGscSiteUrl 
      ? normalizeDomain(selectedGscSiteUrl) 
      : selectedTrackedDomain || '';
    selectedGscDomainRef.current = currentDomain;
    console.log('[Domain Ref] Updated to:', currentDomain);
  }, [selectedGscSiteUrl, selectedTrackedDomain]);

  // Pull Google profile (avatar) from the GSC OAuth session for header display
  useEffect(() => {
    const readProfile = () => {
      try {
        const raw = localStorage.getItem('gsc_google_profile');
        if (!raw) {
          setGscProfile(null);
          return;
        }
        const parsed = JSON.parse(raw) as GoogleUserProfile;
        setGscProfile(parsed);
      } catch {
        setGscProfile(null);
      }
    };

    readProfile();

    const onProfileUpdated = () => readProfile();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'gsc_google_profile') readProfile();
    };

    window.addEventListener('gsc-profile-updated', onProfileUpdated as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('gsc-profile-updated', onProfileUpdated as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // GMB OAuth callback handler and token check on mount
  useEffect(() => {
    // Check for existing GMB token - check multiple sources:
    // 1. GMB-specific token (from GMB OAuth flow)
    // 2. Unified Google auth token (from GA/GSC OAuth - stored as ga_access_token/gsc_access_token)
    // 3. Session storage fallback
    const gmbToken = localStorage.getItem('gmb_access_token');
    const gmbExpiry = localStorage.getItem('gmb_token_expiry');
    const unifiedToken = localStorage.getItem('gsc_access_token') || localStorage.getItem('ga_access_token');
    const unifiedExpiry = localStorage.getItem('gsc_token_expiry') || localStorage.getItem('ga_token_expiry');
    const sessionToken = sessionStorage.getItem('gmb_access_token');
    const sessionExpiry = sessionStorage.getItem('gmb_token_expiry');
    
    // Prefer GMB-specific, then unified auth, then session
    const storedToken = gmbToken || unifiedToken || sessionToken;
    const storedExpiry = gmbExpiry || unifiedExpiry || sessionExpiry;
    
    if (storedToken && storedExpiry && Date.now() < Number(storedExpiry)) {
      // IMPORTANT: Don't just mark "authenticated"; also hydrate accounts + locations.
      const remainingSeconds = Math.max(
        60,
        Math.floor((Number(storedExpiry) - Date.now()) / 1000)
      );
      console.log('[GMB] Using unified Google auth token for GMB sync');
      void applyGmbToken(storedToken, remainingSeconds);
    }
    
    // Handle OAuth callback
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (code && state === 'gmb') {
      const verifier = sessionStorage.getItem('gmb_code_verifier') || localStorage.getItem('gmb_code_verifier');
      
      if (!verifier) {
        console.error('[GMB] No code verifier found');
        sessionStorage.removeItem('gmb_oauth_pending');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      setGmbConnecting(true);
      
      (async () => {
        try {
          const redirectUri = `${window.location.origin}/visitor-intelligence-dashboard`;
          
          const tokenRes = await supabase.functions.invoke('google-oauth-token', {
            body: { code, codeVerifier: verifier, redirectUri },
          });
          
          if (tokenRes.error) {
            throw new Error(tokenRes.error.message || 'Token exchange failed');
          }
          
          const tokenJson = tokenRes.data;
          
          if (tokenJson?.error) {
            throw new Error(tokenJson.error_description || tokenJson.error);
          }
          
          if (tokenJson?.access_token) {
            // Clear verifier in both storage types (popup flow uses localStorage)
            sessionStorage.removeItem('gmb_code_verifier');
            sessionStorage.removeItem('gmb_oauth_pending');
            localStorage.removeItem('gmb_code_verifier');
            localStorage.removeItem('gmb_oauth_pending');

            const expiresIn = Number(tokenJson.expires_in ?? 3600);

            // If this is running in an OAuth popup, send token to opener and close.
            if (window.opener && !window.opener.closed) {
              console.log('[GMB] Sending OAuth success to parent window via postMessage');
              window.opener.postMessage(
                { type: 'gmb-oauth-success', accessToken: tokenJson.access_token, expiresIn },
                window.location.origin
              );
              try {
                window.close();
                return;
              } catch {
                // If close fails, continue to apply token in this window
                console.log('[GMB] Could not close popup, applying token in this window');
              }
            }

            console.log('[GMB] Applying token directly (not in popup or popup close failed)');
            await applyGmbToken(tokenJson.access_token, expiresIn);
            toast.success('Connected to Google Business Profile');
          }
        } catch (err) {
          console.error('[GMB] OAuth error:', err);
          toast.error(err instanceof Error ? err.message : 'Failed to connect Google Business Profile');
          sessionStorage.removeItem('gmb_code_verifier');
          sessionStorage.removeItem('gmb_oauth_pending');
        } finally {
          setGmbConnecting(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      })();
    }
  }, [applyGmbToken]);

  // Receive OAuth token from popup without navigating away
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as any;
      
      console.log('[GMB] Received postMessage:', data?.type);
      
      if (data?.type !== 'gmb-oauth-success' || !data?.accessToken) return;

      console.log('[GMB] Processing OAuth success from popup');
      setGmbConnecting(true);
      
      Promise.resolve(applyGmbToken(String(data.accessToken), Number(data.expiresIn ?? 3600)))
        .then(() => {
          console.log('[GMB] Successfully applied token from popup');
          toast.success('Connected to Google Business Profile');
        })
        .catch((err) => {
          console.error('[GMB] Popup OAuth apply error:', err);
          toast.error('Failed to finish Google Business Profile connection');
        })
        .finally(() => setGmbConnecting(false));
    };

    window.addEventListener('message', onMessage);
    console.log('[GMB] Message listener registered');
    
    return () => {
      window.removeEventListener('message', onMessage);
      console.log('[GMB] Message listener removed');
    };
  }, [applyGmbToken]);

  // Auto-connect GMB when tab becomes active and unified auth tokens are available
  useEffect(() => {
    if (activeTab !== 'gmb') return;
    if (gmbAuthenticated) return; // Already connected
    if (gmbConnecting) return; // Already in progress
    
    // Check for unified auth GMB tokens in localStorage
    const unifiedToken = localStorage.getItem('gmb_access_token');
    const unifiedExpiry = localStorage.getItem('gmb_token_expiry');
    
    if (unifiedToken && unifiedExpiry && Date.now() < Number(unifiedExpiry)) {
      console.log('[GMB] Found unified auth tokens, auto-connecting...');
      const remainingSeconds = Math.max(
        60,
        Math.floor((Number(unifiedExpiry) - Date.now()) / 1000)
      );
      void applyGmbToken(unifiedToken, remainingSeconds);
    }
  }, [activeTab, gmbAuthenticated, gmbConnecting, applyGmbToken]);
  
  // CRITICAL: Always keep gscDomainHasTracking TRUE when a tracked domain is selected
  // This prevents race conditions where GSC callbacks might incorrectly set it to false
  useEffect(() => {
    if (selectedGscDomain && trackedDomains.includes(selectedGscDomain)) {
      setGscDomainHasTracking(true);
    }
  }, [selectedGscDomain, trackedDomains]);

  const handleCloseLead = async () => {
    if (!closeLeadDialog.lead) return;
    
    setClosingLead(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closed_amount: closeAmount ? parseFloat(closeAmount) : null,
        })
        .eq('id', closeLeadDialog.lead.id);

      if (error) throw error;

      // Update local state
      setLeads(prev => prev.map(l => 
        l.id === closeLeadDialog.lead?.id 
          ? { ...l, status: 'closed', closed_at: new Date().toISOString(), closed_amount: closeAmount ? parseFloat(closeAmount) : null }
          : l
      ));
      
      // Update funnel stats
      setFunnelStats(prev => ({ ...prev, closedLeads: prev.closedLeads + 1 }));
      
      setCloseLeadDialog({ open: false, lead: null });
      setCloseAmount('');
    } catch (error) {
      console.error('Error closing lead:', error);
    } finally {
      setClosingLead(false);
    }
  };

  const handleReopenLead = async (lead: Lead) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          status: 'open',
          closed_at: null,
          closed_amount: null,
        })
        .eq('id', lead.id);

      if (error) throw error;

      // Update local state
      setLeads(prev => prev.map(l => 
        l.id === lead.id 
          ? { ...l, status: 'open', closed_at: null, closed_amount: null }
          : l
      ));
      
      // Update funnel stats
      setFunnelStats(prev => ({ ...prev, closedLeads: Math.max(0, prev.closedLeads - 1) }));
    } catch (error) {
      console.error('Error reopening lead:', error);
    }
  };

  const handleUpdateLeadStatus = async (lead: Lead, newStatus: string) => {
    if (newStatus === 'closed') {
      setCloseLeadDialog({ open: true, lead });
      return;
    }
    
    if (newStatus === 'deleted') {
      const isDemoLead = lead.metric_type === 'demo_respawn';
      
      try {
        // Permanently delete the lead from database
        const { error } = await supabase
          .from('leads')
          .delete()
          .eq('id', lead.id);

        if (error) throw error;
        
        // Remove from local state
        setLeads(prev => prev.filter(l => l.id !== lead.id));
        setFunnelStats(prev => ({
          ...prev,
          leads: Math.max(0, prev.leads - 1),
          withName: lead.full_name ? Math.max(0, prev.withName - 1) : prev.withName,
          withCompanyInfo: lead.company_employees ? Math.max(0, prev.withCompanyInfo - 1) : prev.withCompanyInfo,
        }));

        // If it's the demo lead, respawn it after 5 seconds (only if none exists)
        if (isDemoLead) {
          setTimeout(async () => {
            // Check if a demo lead already exists
            const { data: existingDemo } = await supabase
              .from('leads')
              .select('id')
              .eq('metric_type', 'demo_respawn')
              .maybeSingle();

            if (existingDemo) {
              // Demo lead already exists, just refresh the list
              const { data: freshLeads } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
              if (freshLeads) setLeads(freshLeads as Lead[]);
              return;
            }

            const { data: respawnedLead, error: respawnError } = await supabase
              .from('leads')
              .insert({
                email: 'demo@webstack.ceo',
                full_name: 'Demo Lead (Respawns)',
                phone: '+1 555-123-4567',
                domain: 'webstack.ceo',
                metric_type: 'demo_respawn',
                source_page: '/',
                company_employees: '50-200',
                annual_revenue: '$1M-$5M',
                funnel_stage: 'lead',
                status: 'open',
              })
              .select()
              .single();

            if (!respawnError && respawnedLead) {
              setLeads(prev => [respawnedLead as Lead, ...prev]);
              setFunnelStats(prev => ({
                ...prev,
                leads: prev.leads + 1,
                withName: prev.withName + 1,
                withCompanyInfo: prev.withCompanyInfo + 1,
              }));
            }
          }, 5000);
        }
      } catch (error) {
        console.error('Error deleting lead:', error);
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', lead.id);

      if (error) throw error;

      setLeads(prev => prev.map(l => 
        l.id === lead.id ? { ...l, status: newStatus } : l
      ));
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  // Fetch form test history
  const fetchFormTests = async () => {
    const { data } = await supabase
      .from('form_tests')
      .select('id, form_name, status, tested_at, response_time_ms, error_message')
      .order('tested_at', { ascending: false })
      .limit(20);
    
    if (data) setFormTests(data);
  };

  // Available forms to test
  const availableForms = [
    { name: 'Contact Form', endpoint: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/domain-audit`, testData: { domain: 'test-form-check.com' } },
    { name: 'Lead Capture (Quick Metric)', endpoint: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/domain-audit`, testData: { domain: 'form-test.example.com' } },
  ];

  // Run form test
  const handleRunFormTest = async (formName: string, formEndpoint: string, testData: Record<string, unknown>) => {
    setTestingForm(formName);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ formName, formEndpoint, testData }),
      });

      const result = await response.json();
      
      // Refresh test history
      await fetchFormTests();
      
      if (result.success) {
        console.log(`Form test passed: ${formName}`);
      } else {
        console.log(`Form test failed: ${formName} - ${result.errorMessage}`);
      }
    } catch (error) {
      console.error('Form test error:', error);
    } finally {
      setTestingForm(null);
    }
  };

  // Create test lead for demo purposes (old functionality kept for backwards compatibility)
  const handleCreateTestLead = async () => {
    setFormTestDialogOpen(true);
    await fetchFormTests();
  };

  const getStatusBadge = (status: string, closedAmount?: number | null) => {
    switch (status) {
      case 'closed':
        return (
          <Badge className="text-[10px] bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Closed
            {closedAmount && <span className="ml-1">${closedAmount.toLocaleString()}</span>}
          </Badge>
        );
      case 'called':
        return <Badge className="text-[10px] bg-blue-500">📞 Called</Badge>;
      case 'emailed':
        return <Badge className="text-[10px] bg-violet-500">✉️ Emailed</Badge>;
      case 'considering':
        return <Badge className="text-[10px] bg-amber-500">Considering</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Open</Badge>;
    }
  };

  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) setCurrentUserProfile(data);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          // User logged out - ensure we redirect immediately
          setIsAdmin(false);
          setIsLoading(false);
          setCurrentUserProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;
      
      const adminStatus = !!data;
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        await fetchAllData();
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      // Calculate time boundaries
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartISO = todayStart.toISOString();

      // Fetch all data in parallel
      const [
        leadsRes,
        sessionsRes,
        pageViewsRes,
        toolsRes,
        // Funnel counts
        totalSessions,
        engagedLeads,
        allLeads,
        qualifiedLeads,
        closedLeads,
        leadsWithName,
        leadsWithCompany,
        // Active & Today counts
        activeVisitorsRes,
        newVisitorsTodayRes,
      ] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('visitor_sessions').select('*').order('started_at', { ascending: false }).limit(100),
        supabase.from('page_views').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('tool_interactions').select('*').order('created_at', { ascending: false }).limit(100),
        // Funnel metrics
        supabase.from('visitor_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('funnel_stage', 'engaged'),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('funnel_stage', 'qualified'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).not('full_name', 'is', null),
        supabase.from('leads').select('id', { count: 'exact', head: true }).not('company_employees', 'is', null),
        // Active visitors (last 5 min)
        supabase.from('visitor_sessions').select('id', { count: 'exact', head: true }).gte('last_activity_at', fiveMinutesAgo),
        // New visitors today
        supabase.from('visitor_sessions').select('id', { count: 'exact', head: true }).gte('started_at', todayStartISO),
      ]);

      if (leadsRes.data) setLeads(leadsRes.data as Lead[]);
      if (sessionsRes.data) setSessions(sessionsRes.data as VisitorSession[]);
      if (pageViewsRes.data) setPageViews(pageViewsRes.data as PageView[]);
      if (toolsRes.data) setToolInteractions(toolsRes.data as ToolInteraction[]);

      setFunnelStats({
        visitors: totalSessions.count || 0,
        engaged: engagedLeads.count || 0,
        leads: allLeads.count || 0,
        qualified: qualifiedLeads.count || 0,
        closedLeads: closedLeads.count || 0,
        withName: leadsWithName.count || 0,
        withCompanyInfo: leadsWithCompany.count || 0,
      });

      setActiveVisitors(activeVisitorsRes.count || 0);
      setNewVisitorsToday(newVisitorsTodayRes.count || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getFunnelStageColor = (stage: string | null) => {
    switch (stage) {
      case 'qualified': return 'bg-green-500';
      case 'engaged': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  const getQualificationBadge = (step: number | null) => {
    if (!step || step === 0) return <Badge variant="outline">Email Only</Badge>;
    if (step === 1) return <Badge className="bg-amber-500">+ Phone</Badge>;
    if (step === 2) return <Badge className="bg-orange-500">+ Name</Badge>;
    if (step === 3) return <Badge className="bg-pink-500">+ Company</Badge>;
    return <Badge className="bg-green-500">Full Profile</Badge>;
  };

  // Filtered data based on page filter - MUST be before any conditional returns
  const filteredData = useMemo(() => {
    if (!pageFilter) {
      return { leads, pageViews, toolInteractions, sessions };
    }
    
    // Get sessions that visited the filtered page
    const matchingSessionIds = new Set(
      pageViews
        .filter(pv => pv.page_path === pageFilter || pv.page_path.startsWith(pageFilter + '/'))
        .map(pv => pv.session_id)
    );
    
    return {
      leads: leads.filter(l => l.source_page === pageFilter || (l.source_page && l.source_page.startsWith(pageFilter + '/'))),
      pageViews: pageViews.filter(pv => pv.page_path === pageFilter || pv.page_path.startsWith(pageFilter + '/')),
      toolInteractions: toolInteractions.filter(ti => ti.page_path === pageFilter || (ti.page_path && ti.page_path.startsWith(pageFilter + '/'))),
      sessions: sessions.filter(s => matchingSessionIds.has(s.session_id)),
    };
  }, [pageFilter, leads, pageViews, toolInteractions, sessions]);

  // Redirect to auth if not authenticated - using useEffect for proper navigation
  useEffect(() => {
    if (!isLoading && (!user || !session)) {
      navigate('/auth?redirect=/visitor-intelligence-dashboard');
    }
  }, [isLoading, user, session, navigate]);

  // Ref for the dashboard header (no longer used for sticky positioning)
  const dashboardHeaderShellRef = useRef<HTMLDivElement | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !session) {
    // Return loading state while redirect happens
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the visitor intelligence dashboard.
          </p>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </Card>
      </div>
    );
  }

  // Calculate funnel percentages
  const funnelSteps = [
    { label: 'Visitors', count: funnelStats.visitors, icon: Eye, color: 'from-blue-400 to-blue-600', bgGradient: 'from-blue-500/10 to-blue-600/5', borderColor: 'border-blue-500/25', glowColor: 'from-blue-500/20' },
    { label: 'Tool Users', count: filteredData.toolInteractions.length, icon: MousePointer, color: 'from-cyan-400 to-cyan-600', bgGradient: 'from-cyan-500/10 to-cyan-600/5', borderColor: 'border-cyan-500/25', glowColor: 'from-cyan-500/20' },
    { label: 'Leads', count: filteredData.leads.length || funnelStats.leads, icon: Mail, color: 'from-violet-400 to-violet-600', bgGradient: 'from-violet-500/10 to-violet-600/5', borderColor: 'border-violet-500/25', glowColor: 'from-violet-500/20' },
    { label: 'Qualified', count: funnelStats.withCompanyInfo, icon: Target, color: 'from-orange-400 to-orange-600', bgGradient: 'from-orange-500/10 to-orange-600/5', borderColor: 'border-orange-500/25', glowColor: 'from-orange-500/20' },
    { label: 'Open', count: leads.filter(l => l.status === 'open').length, icon: FileText, color: 'from-slate-400 to-slate-600', bgGradient: 'from-slate-500/10 to-slate-600/5', borderColor: 'border-slate-500/25', glowColor: 'from-slate-500/20' },
    { label: 'Closed', count: funnelStats.closedLeads, icon: DollarSign, color: 'from-green-400 to-green-600', bgGradient: 'from-green-500/10 to-green-600/5', borderColor: 'border-green-500/25', glowColor: 'from-green-500/20' },
  ];

  const maxFunnel = Math.max(...funnelSteps.map(s => s.count), 1);

  return (
    <div className="min-h-screen bg-background relative animate-fade-in pt-16 px-6 md:px-10 lg:px-16 overflow-hidden">
      <SEO 
        title="Visitor Intelligence Dashboard | Webstack.ceo"
        description="Real-time visitor intelligence and analytics dashboard"
        canonical="/visitor-intelligence-dashboard"
      />

      {/* High-tech background effects - STATIC version for performance */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Corner gradient accents - STATIC */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-primary/10 via-violet-500/5 to-transparent rounded-bl-[200px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-cyan-500/10 via-primary/5 to-transparent rounded-tr-[150px]" />
        
        {/* Static floating particles - CSS only, no Framer Motion */}
        <div className="absolute top-[10%] right-[8%] w-2 h-2 rounded-full bg-cyan-400/50" />
        <div className="absolute top-[20%] right-[15%] w-1.5 h-1.5 rounded-full bg-violet-400/50" />
        <div className="absolute top-[15%] right-[25%] w-1 h-1 rounded-full bg-amber-400/50" />
        <div className="absolute top-[25%] left-[10%] w-1.5 h-1.5 rounded-full bg-primary/50" />
        <div className="absolute bottom-[20%] left-[15%] w-2 h-2 rounded-full bg-emerald-400/40" />
        <div className="absolute bottom-[30%] right-[12%] w-1.5 h-1.5 rounded-full bg-rose-400/40" />
        
        {/* Radial glow from top center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-radial from-primary/8 via-violet-500/3 to-transparent" />
      </div>

      {/* Header with integrated tabs and domain selector */}
      <div
        ref={dashboardHeaderShellRef}
        className="relative max-w-[1480px] mx-auto z-40 group"
      >
        {/* Static gradient glow background - no animation for performance */}
        <div
          className="absolute -inset-[2px] rounded-t-[14px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 blur-md bg-gradient-to-r from-cyan-500/40 via-violet-500/40 to-amber-500/30"
        />
        
        <header className="relative border border-border bg-card/95 backdrop-blur-xl rounded-t-xl overflow-hidden">
          {/* Grid pattern overlay on header */}
          <div 
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: '30px 30px',
            }}
          />
          
          {/* Corner accent - static */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 via-violet-500/5 to-transparent rounded-bl-[50px] pointer-events-none" />
        
          {/* Tabs (shared component) */}
          <VIDashboardTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            variant="compact"
          />
        
        {/* Row 1: Logo and User Controls */}
        <div className="relative z-10 px-8 py-3 flex items-center justify-between">
          {/* Left: Logo */}
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity group flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center relative group-hover:from-amber-400/20 group-hover:to-yellow-500/20 group-hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] group-hover:scale-110 transition-all duration-700">
              <Shield className="w-7 h-7 text-primary group-hover:text-amber-400 transition-colors duration-700" />
              <span className="absolute font-bold text-[9px] tracking-tight text-primary group-hover:text-amber-400 transition-all duration-700">AI</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground leading-tight">
                webstack<span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500 group-hover:from-amber-400 group-hover:to-yellow-500 transition-all duration-500">.ceo</span>
              </span>
              <AnimatedTagline className="text-[9px] text-muted-foreground tracking-wide" />
            </div>
          </a>
          
          {/* Right: User Controls */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle - always visible */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 p-0 hover:bg-primary/10"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/50 hover:ring-primary transition-all duration-300 focus:outline-none">
                  {gscAuthenticated && gscProfile?.picture ? (
                    <img
                      src={gscProfile.picture}
                      alt={gscProfile.name ? `${gscProfile.name} profile photo` : 'Google profile photo'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  ) : currentUserProfile?.avatar_url ? (
                    <img 
                      src={currentUserProfile.avatar_url} 
                      alt={currentUserProfile.full_name || 'Profile'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {(currentUserProfile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border border-border z-50">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">
                    {gscProfile?.name || currentUserProfile?.full_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-primary font-medium">
                    {user.email?.toLowerCase().includes('rob') ? 'CTO' :
                      user.email?.toLowerCase() === 'eric@blackwoodproductions.com' ? 'COO' :
                      user.email?.toLowerCase() === 'que@blackwoodproductions.com' ? 'CEO' :
                      'Team Member'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <a href="/" className="flex items-center gap-2 cursor-pointer">
                    <Globe className="w-4 h-4" />
                    Home
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="flex items-center gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Row 2: Domain Selector - Integrated into header */}
        <div className="relative z-10 px-8 py-2 flex items-center justify-between border-t border-border/30 bg-background/30">
          {/* Left: Domain Selector & Time Range */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Domain Selector */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-cyan-500/10">
                <Globe className="w-4 h-4 text-primary" />
              </div>

              <Select 
                value={selectedTrackedDomain ? selectedTrackedDomain.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] : ''} 
                onValueChange={(value) => {
                  setSelectedTrackedDomain(value);
                  setSelectedDomainKey(value);
                  const hasTracking = trackedDomains.includes(value) && !userAddedDomains.includes(value);
                  setGscDomainHasTracking(hasTracking);
                }}
              >
                <SelectTrigger className="w-[180px] h-7 text-sm bg-background border-border/50">
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-2xl z-[200] max-w-[400px]">
                  {(() => {
                    const trackedSet = new Set(trackedDomains.map(d => d.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]));
                    const userAddedSet = new Set(userAddedDomains.map(d => d.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]));
                    const viDomains = [...new Set([...trackedSet, ...userAddedSet])].filter(Boolean);
                    
                    return (
                      <>
                        {viDomains.length === 0 && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            No domains yet
                          </div>
                        )}
                        {viDomains.map((domain) => {
                          const hasViTracking = trackedSet.has(domain);
                          const isUserAdded = userAddedSet.has(domain) && !hasViTracking;
                          return (
                            <div key={domain} className="flex items-center justify-between group">
                              <SelectItem
                                value={domain}
                                className="text-xs flex-1"
                              >
                                <div className="flex items-center gap-2">
                                  {hasViTracking && <Globe className="w-3.5 h-3.5 text-primary" />}
                                  <span className="truncate max-w-[250px]" title={domain}>
                                    {domain}
                                  </span>
                                </div>
                              </SelectItem>
                              {isUserAdded && (
                                <button
                                  type="button"
                                  className="p-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (confirm(`Remove "${domain}" and all its cached data?`)) {
                                      removeUserDomain(domain);
                                      // If this was the selected domain, clear selection
                                      if (selectedTrackedDomain === domain || selectedGscDomain === domain) {
                                        setSelectedTrackedDomain('');
                                        setSelectedGscDomain(null);
                                        setSelectedDomainKey('');
                                      }
                                      toast.success(`Removed ${domain} and all cached data`);
                                    }
                                  }}
                                  title="Remove domain and all cached data"
                                >
                                  <X className="w-3 h-3 text-destructive" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                        <SelectSeparator />
                        <div 
                          className="flex items-center gap-2 px-2 py-1.5 text-xs text-primary cursor-pointer hover:bg-accent rounded-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddDomainDialogOpen(true);
                          }}
                        >
                          <Plus className="w-3 h-3" />
                          Add domain
                        </div>
                      </>
                    );
                  })()}
                </SelectContent>
              </Select>
              
              {/* Live indicator */}
              <span className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                LIVE
              </span>
            </div>

            <div className="w-px h-5 bg-border/50" />
            
            {/* Time Range Selector - only on VI tab */}
            {activeTab === 'visitor-intelligence' && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <Select value={diagramTimeRange} onValueChange={(value: TimeRange) => setDiagramTimeRange(value)}>
                  <SelectTrigger className="w-[130px] h-7 text-sm bg-background/80 border-border/50">
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-sm border border-border shadow-xl z-50">
                    <SelectItem value="live">Last 24h</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">Year</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Custom date range pickers */}
                {diagramTimeRange === 'custom' && (
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("h-7 text-sm px-3 bg-background/80", !diagramCustomDateRange?.from && "text-muted-foreground")}>
                          {diagramCustomDateRange?.from ? format(diagramCustomDateRange.from, "MMM d, yyyy") : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover/95 backdrop-blur-sm border border-border z-50" align="start">
                        <Calendar 
                          mode="single" 
                          selected={diagramCustomDateRange?.from} 
                          onSelect={(date) => setDiagramCustomDateRange({ ...diagramCustomDateRange, from: date, to: diagramCustomDateRange?.to })} 
                          initialFocus 
                          className="p-3 pointer-events-auto" 
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-sm text-muted-foreground">to</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("h-7 text-sm px-3 bg-background/80", !diagramCustomDateRange?.to && "text-muted-foreground")}>
                          {diagramCustomDateRange?.to ? format(diagramCustomDateRange.to, "MMM d, yyyy") : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover/95 backdrop-blur-sm border border-border z-50" align="start">
                        <Calendar 
                          mode="single" 
                          selected={diagramCustomDateRange?.to} 
                          onSelect={(date) => setDiagramCustomDateRange({ from: diagramCustomDateRange?.from, to: date })} 
                          initialFocus 
                          className="p-3 pointer-events-auto" 
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                
                {/* Page filter badge */}
                {pageFilter && (
                  <Badge variant="secondary" className="flex items-center gap-2 px-2 py-0.5 h-7 bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                    <Filter className="w-3 h-3" />
                    {pageFilter === '/' ? 'Homepage' : pageFilter}
                    <button onClick={() => setPageFilter(null)} className="ml-1 hover:bg-purple-500/30 rounded p-0.5 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Free SEO Audit / Case Study Pill */}
            {selectedTrackedDomain && (
              <Button
                size="sm"
                onClick={() => {
                  const cleanDomain = selectedTrackedDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
                  if (savedAuditForDomain) {
                    navigate(`/case-study/${encodeURIComponent(cleanDomain)}`);
                  } else {
                    triggerAutoAudit(cleanDomain);
                    navigate(`/audit/${encodeURIComponent(cleanDomain)}`);
                  }
                }}
                className={`h-7 gap-1.5 text-xs font-semibold rounded-full px-4 ${
                  savedAuditForDomain 
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white'
                }`}
                title={savedAuditForDomain ? 'View 28-day Case Study report' : 'Run a free SEO audit for this domain'}
              >
                {savedAuditForDomain ? (
                  <>
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>CASE STUDY</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Free SEO Audit</span>
                  </>
                )}
              </Button>
            )}
            
            {/* API Docs Download - only on VI tab */}
            {activeTab === 'visitor-intelligence' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateAPIDocs()}
                className="h-7 gap-1.5 text-xs"
                title="Download API Documentation PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">API Docs</span>
              </Button>
            )}
            
            {/* Operator Status Selector - only on VI tab */}
            {activeTab === 'visitor-intelligence' && (
              <div className="flex items-center gap-2">
                <Select value={operatorStatus} onValueChange={(v) => setOperatorStatus(v as typeof operatorStatus)}>
                  <SelectTrigger className="h-7 w-[110px] text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="online">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Online
                      </div>
                    </SelectItem>
                    <SelectItem value="busy">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Busy
                      </div>
                    </SelectItem>
                    <SelectItem value="away">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        Away
                      </div>
                    </SelectItem>
                    <SelectItem value="offline">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-500" />
                        Offline
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        </header>
      </div>
      {/* Main Layout - Only show for Visitor Intelligence tab */}
      {activeTab === 'visitor-intelligence' && (
      <div className="relative max-w-[1480px] mx-auto group/main">
        {/* Animated gradient glow for main container */}
        {/* Animated gradient glow - GPU isolated to prevent layout interference */}
        <div
          className="absolute -inset-[2px] rounded-b-[14px] opacity-30 group-hover/main:opacity-50 transition-opacity duration-500 blur-md -z-10"
          style={{ 
            background: 'linear-gradient(180deg, rgba(34,211,238,0.3), rgba(139,92,246,0.3))',
            contain: 'strict',
            willChange: 'opacity'
          }}
        />
        <div className="relative flex min-h-[calc(100vh-180px)] bg-gradient-to-br from-card via-card/98 to-primary/5 rounded-b-xl border-x border-b border-border backdrop-blur-xl overflow-hidden">
        {/* Left Sidebar - Only show when tracking is installed or no GSC site is selected */}
        {shouldShowViPanels && (
          <>
            {/* Collapsed Sidebar (thin bar when diagram is closed) */}
            {!siteArchOpen && (
              <div className="w-12 flex-shrink-0 border-r border-border bg-card/50" style={{ contain: 'layout paint' }}>
                <div className="sticky top-[52px] h-[calc(100vh-140px)] flex flex-col">
                  {/* Expand button */}
                  <button 
                    onClick={() => setSiteArchOpen(true)}
                    className="flex flex-col items-center justify-center gap-1 p-3 border-b border-border hover:bg-secondary/30 transition-colors"
                    title="Open Visitor Intelligence"
                  >
                    <BarChart3 className="w-6 h-6 text-primary" />
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                  
                  {/* Compact page indicators with full visual data */}
                  <div className="flex-1 flex flex-col items-center gap-2 py-3 overflow-auto">
                    {flowSummary && flowSummary.topPages.slice(0, 10).map((page) => {
                      const maxVisits = flowSummary.topPages[0]?.visits || 1;
                      const intensity = page.visits / maxVisits;
                      const heatColor = intensity > 0.7 ? '#3b82f6' : intensity > 0.4 ? '#22c55e' : '#eab308';
                      const hasLiveVisitor = page.liveCount > 0;
                      const hasExternalReferrer = page.hasExternalReferrer;
                      
                      return (
                        <button
                          key={page.path}
                          className={`relative flex items-center justify-center transition-all ${pageFilter === page.path ? 'scale-110' : 'hover:scale-105'}`}
                          onClick={() => setPageFilter(page.path === pageFilter ? null : page.path)}
                          title={`${page.name}: ${page.visits} visits${hasLiveVisitor ? ` (${page.liveCount} live)` : ''}${page.externalCount > 0 ? ` (${page.externalCount} external)` : ''}`}
                        >
                          <svg width={36} height={36} className="overflow-visible">
                            {/* External referrer starburst */}
                            {hasExternalReferrer && (
                              <>
                                <circle cx={18} cy={18} r={16} fill="none" stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.55} />
                                {[0, 60, 120, 180, 240, 300].map((angle) => {
                                  const rad = (angle * Math.PI) / 180;
                                  const x1 = 18 + Math.cos(rad) * 11;
                                  const y1 = 18 + Math.sin(rad) * 11;
                                  const x2 = 18 + Math.cos(rad) * 15;
                                  const y2 = 18 + Math.sin(rad) * 15;
                                  return (
                                    <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f97316" strokeWidth={1.5} strokeLinecap="round" opacity={0.55} />
                                  );
                                })}
                              </>
                            )}
                            {/* Live visitor glow - static */}
                            {hasLiveVisitor && (
                              <circle cx={18} cy={18} r={14} fill="#22c55e" opacity={0.25} />
                            )}
                            {/* Main circle */}
                            <circle 
                              cx={18} cy={18} r={12} 
                              fill="hsl(var(--background))" 
                              stroke={pageFilter === page.path ? 'hsl(var(--primary))' : hasLiveVisitor ? "#22c55e" : heatColor} 
                              strokeWidth={pageFilter === page.path ? 3 : 2} 
                            />
                            <text x={18} y={22} textAnchor="middle" fill="#8b5cf6" style={{ fontSize: '9px', fontWeight: 'bold' }}>
                              {page.visits > 999 ? `${Math.round(page.visits / 100) / 10}k` : page.visits}
                            </text>
                            {/* Live count badge */}
                            {hasLiveVisitor && (
                              <>
                                <circle cx={28} cy={8} r={6} fill="#22c55e" />
                                <text x={28} y={11} textAnchor="middle" fill="white" style={{ fontSize: '8px', fontWeight: 'bold' }}>{page.liveCount}</text>
                              </>
                            )}
                            {/* External count badge */}
                            {page.externalCount > 0 && (
                              <>
                                <circle cx={8} cy={28} r={6} fill="#f97316" />
                                <text x={8} y={31} textAnchor="middle" fill="white" style={{ fontSize: '8px', fontWeight: 'bold' }}>{page.externalCount > 99 ? '99+' : page.externalCount}</text>
                              </>
                            )}
                          </svg>
                        </button>
                      );
                    })}
                    {(!flowSummary || flowSummary.topPages.length === 0) && (
                      <p className="text-[10px] text-muted-foreground text-center py-4 [writing-mode:vertical-rl]">No data</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Main Content Area - GPU accelerated to prevent reflow during sidebar transitions */}
        <main className="flex-1 p-6 overflow-auto">
          {/* No Tracking Installed Prompt - Show when GSC domain selected but no tracking */}
          {shouldShowInstallPrompt && (
            <div className="mb-4 animate-fade-in">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">Install Visitor Intelligence tracking for {selectedDomainLabel}</p>
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400">Required</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Add the VI tracking script to see visitor flow, engagement & leads</p>
                </div>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button size="sm" variant="outline" className="border-amber-500/30 hover:bg-amber-500/10">
                      <Code className="w-3 h-3 mr-1.5" />
                      View Code
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="absolute right-6 mt-2 z-50 w-[500px]">
                    <Card className="p-4 bg-background border shadow-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Tracking Code</span>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="h-7 text-xs"
                          onClick={() => {
                            const code = `<!-- Webstack.ceo Visitor Intelligence -->
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://webstack.ceo/track.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                            })(window,document,'script','wscLayer','${selectedDomainLabel}');
</script>`;
                            navigator.clipboard.writeText(code);
                          }}
                        >
                          <Code className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-zinc-900 rounded-md p-3 overflow-x-auto">
                        <pre className="text-[11px] text-green-400 whitespace-pre font-mono leading-relaxed">
{`<script>
(function(w,d,s,l,i){w[l]=w[l]||[];
w[l].push({'gtm.start':new Date().getTime(),
event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s);j.async=true;j.src=
'https://webstack.ceo/track.js?id='+i;
f.parentNode.insertBefore(j,f);
})(window,document,'script','wscLayer',
                              '${selectedDomainLabel}');
</script>`}
                        </pre>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">Paste in your website's &lt;head&gt; section</p>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          )}

          {/* Full-Width Visitor Intelligence Panel (when open) - only show if tracking installed or no GSC site selected */}
          {siteArchOpen && shouldShowViPanels && (
            <Card className="p-4 mb-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="default" 
                  size="default" 
                  onClick={() => setSiteArchOpen(false)}
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Collapse
                </Button>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h2 className="font-bold text-foreground">WebStack.CEO Visitor Intelligence</h2>
                  {pageFilter && (
                    <Badge variant="secondary" className="ml-2 text-[10px] bg-purple-500/20 text-purple-400">
                      Filtered: {pageFilter === '/' ? 'Homepage' : pageFilter}
                    </Badge>
                  )}
                </div>
                <div className="w-24" /> {/* Spacer to balance the layout */}
              </div>
              <VisitorFlowDiagram 
                onPageFilter={setPageFilter}
                activeFilter={pageFilter}
                onSummaryUpdate={setFlowSummary}
                timeRange={diagramTimeRange}
                onTimeRangeChange={setDiagramTimeRange}
                customDateRange={diagramCustomDateRange}
                onCustomDateRangeChange={setDiagramCustomDateRange}
              />
            </Card>
          )}
          {/* Hidden diagram to keep data flowing when sidebar is collapsed */}
          {!siteArchOpen && shouldShowViPanels && (
            <div className="hidden">
              <VisitorFlowDiagram 
                onPageFilter={setPageFilter}
                activeFilter={pageFilter}
                onSummaryUpdate={setFlowSummary}
                timeRange={diagramTimeRange}
                onTimeRangeChange={setDiagramTimeRange}
                customDateRange={diagramCustomDateRange}
                onCustomDateRangeChange={setDiagramCustomDateRange}
              />
            </div>
          )}

          {/* Google Analytics Panel (single instance)
              Kept in ONE location to prevent layout "jumping"/refresh loops.
              It will show connect/setup prompts until the selected domain is verified. */}
          <div className="mb-6">
            <GADashboardPanel 
              externalSelectedSite={selectedTrackedDomain}
              onAuthStatusChange={setGaAuthenticated}
              onMetricsUpdate={(metrics, _isConnected, domainMatches) => {
                setGaMetrics(metrics);
                // Only update if actually different to prevent loops
                if (domainMatches !== gaDomainMatches) {
                  setGaDomainMatches(domainMatches);
                }
              }}
              hidePropertySelector
            />
          </div>

          {/* Full Width Stats Layout - only show if tracking installed or no domain selected */}
          {shouldShowViPanels && (
          <div className="space-y-4 mb-6">
          
          {/* Quick Stats Row - Full Width (expandable) */}
          <QuickStatsExpandableRow
            activeVisitors={activeVisitors}
            newVisitorsToday={newVisitorsToday}
            leads={leads}
            sessions={sessions}
          />

          {/* Conversion Funnel Row - Full Width */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {funnelSteps.map((step, index) => {
              const conversionFromPrev = index > 0 && funnelSteps[index - 1].count > 0
                ? ((step.count / funnelSteps[index - 1].count) * 100).toFixed(0)
                : null;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="h-full"
                >
                  <Card className={`relative overflow-hidden h-full min-h-[88px] p-4 group border ${step.borderColor} bg-gradient-to-br ${step.bgGradient} hover:shadow-md transition-all`}>
                    {/* Corner glow accent */}
                    <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${step.glowColor} to-transparent rounded-bl-[40px] pointer-events-none`} />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${step.color} flex-shrink-0 shadow-md`}>
                        <step.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-bold text-foreground leading-tight">{step.count.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{step.label}</p>
                      </div>
                    </div>
                    {conversionFromPrev && (
                      <div className="mt-2 text-[10px] text-muted-foreground relative z-10">
                        <span className="text-foreground font-medium">{conversionFromPrev}%</span> from prev
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>

        </div>
          )}


        {/* Leads Section - Full Width - only show if tracking installed or no domain selected */}
        {shouldShowViPanels && (
        <div className="mb-8">
          <Tabs defaultValue="leads" className="w-full">
            {/* Combined Tab Header with Lead Quality Stats - Full Width */}
            <div className="relative overflow-hidden flex items-stretch gap-3 mb-4 p-2 rounded-xl bg-gradient-to-br from-secondary/30 via-secondary/20 to-primary/5 border border-border/60">
              {/* Subtle corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-[50px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-cyan-500/8 to-transparent rounded-tr-[40px] pointer-events-none" />
              
              {/* Tabs - takes up left portion */}
              <TabsList className="flex-1 grid grid-cols-3 bg-background/50 backdrop-blur-sm p-1 h-auto gap-1 rounded-lg relative z-10">
                <TabsTrigger value="leads" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5">
                  <Mail className="w-4 h-4 mr-2" />
                  Leads ({pageFilter ? filteredData.leads.length : funnelStats.leads})
                </TabsTrigger>
                <TabsTrigger value="journey" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Journey
                </TabsTrigger>
                <TabsTrigger value="tools" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5">
                  <MousePointer className="w-4 h-4 mr-2" />
                  Tools ({filteredData.toolInteractions.length})
                </TabsTrigger>
              </TabsList>
              
              {/* Lead Quality Stats - takes up right portion */}
              <div className="flex-1 grid grid-cols-5 gap-2 relative z-10">
                {[
                  { label: 'Open', count: funnelStats.leads - funnelStats.closedLeads, dotColor: 'bg-blue-500', activeClass: 'bg-blue-500/20 border-blue-500/50', glowColor: 'from-blue-500/15' },
                  { label: 'Named', count: funnelStats.withName, dotColor: 'bg-amber-500', activeClass: 'bg-amber-500/20 border-amber-500/50', glowColor: 'from-amber-500/15' },
                  { label: 'Qualified', count: funnelStats.withCompanyInfo, dotColor: 'bg-orange-500', activeClass: 'bg-orange-500/20 border-orange-500/50', glowColor: 'from-orange-500/15' },
                  { label: 'Closed', count: funnelStats.closedLeads, dotColor: 'bg-green-500', activeClass: 'bg-green-500/20 border-green-500/50', glowColor: 'from-green-500/15' },
                ].map((item) => (
                  <motion.button
                    key={item.label}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setExpandedStatFilter(expandedStatFilter === item.label ? null : item.label)}
                    className={`relative overflow-hidden flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all cursor-pointer group ${
                      expandedStatFilter === item.label 
                        ? item.activeClass 
                        : 'bg-background/60 border-border/50 hover:border-border hover:bg-background/80'
                    }`}
                  >
                    {/* Subtle corner glow on hover */}
                    <div className={`absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl ${item.glowColor} to-transparent rounded-bl-[20px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className={`w-2.5 h-2.5 rounded-full ${item.dotColor} relative z-10`} />
                    <span className="text-xs text-muted-foreground relative z-10">{item.label}</span>
                    <span className="font-bold text-sm relative z-10">{Math.max(0, item.count)}</span>
                    <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform relative z-10 ${expandedStatFilter === item.label ? 'rotate-180' : ''}`} />
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateTestLead}
                  className="relative overflow-hidden flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-background/60 border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 transition-colors group"
                  title="Create a test lead for demo purposes"
                >
                  <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-amber-500/15 to-transparent rounded-bl-[20px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  <FlaskConical className="w-3.5 h-3.5 relative z-10" />
                  <span className="text-xs relative z-10">Test Lead</span>
                </motion.button>
              </div>
            </div>

            {/* Expanded Stat Filter Panel */}
            {expandedStatFilter && (
              <div className="mb-4 p-4 rounded-xl bg-secondary/30 border border-border animate-accordion-down">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {expandedStatFilter === 'Open' && <Zap className="w-4 h-4 text-blue-500" />}
                    {expandedStatFilter === 'Named' && <UserCheck className="w-4 h-4 text-amber-500" />}
                    {expandedStatFilter === 'Qualified' && <Target className="w-4 h-4 text-orange-500" />}
                    {expandedStatFilter === 'Closed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {expandedStatFilter} Leads
                  </h4>
                  <Button variant="ghost" size="sm" onClick={() => setExpandedStatFilter(null)} className="h-7 w-7 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="max-h-[200px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Email</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Phone</TableHead>
                        <TableHead className="text-xs">Company</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.filter(l => {
                        if (expandedStatFilter === 'Open') return l.status === 'open';
                        if (expandedStatFilter === 'Named') return !!l.full_name;
                        if (expandedStatFilter === 'Qualified') return !!l.company_employees;
                        if (expandedStatFilter === 'Closed') return l.status === 'closed';
                        return false;
                      }).map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="text-sm py-2">{lead.email}</TableCell>
                          <TableCell className="text-sm py-2">{lead.full_name || '-'}</TableCell>
                          <TableCell className="text-sm py-2">{lead.phone || '-'}</TableCell>
                          <TableCell className="text-sm py-2">{lead.company_employees || '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground py-2">
                            {format(new Date(lead.created_at), 'MMM d, HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                      {leads.filter(l => {
                        if (expandedStatFilter === 'Open') return l.status === 'open';
                        if (expandedStatFilter === 'Named') return !!l.full_name;
                        if (expandedStatFilter === 'Qualified') return !!l.company_employees;
                        if (expandedStatFilter === 'Closed') return l.status === 'closed';
                        return false;
                      }).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-4 text-sm">
                            No {expandedStatFilter.toLowerCase()} leads yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

              <TabsContent value="leads" className="mt-0">
                <Card className="relative overflow-hidden p-0 border-border/60 bg-gradient-to-br from-card via-card to-violet-500/5">
                  {/* Subtle corner accents */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-[50px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-cyan-500/8 to-transparent rounded-tr-[40px] pointer-events-none" />
                  
                  <div className="max-h-[420px] overflow-auto relative z-10">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                        <TableRow>
                          <TableHead className="text-xs">Email</TableHead>
                          <TableHead className="text-xs">Name</TableHead>
                          <TableHead className="text-xs">Phone</TableHead>
                          <TableHead className="text-xs">Company</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(pageFilter ? filteredData.leads : leads).map((lead) => (
                          <TableRow key={lead.id} className={lead.status === 'closed' ? 'bg-green-500/5' : ''}>
                            <TableCell className="font-medium text-sm py-2">{lead.email}</TableCell>
                            <TableCell className="text-sm py-2">{lead.full_name || '-'}</TableCell>
                            <TableCell className="text-sm py-2">
                              {lead.phone ? lead.phone : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="py-2">
                              {lead.company_employees ? (
                                <div className="text-xs">
                                  <div>{lead.company_employees}</div>
                                  {lead.annual_revenue && (
                                    <div className="text-muted-foreground">{lead.annual_revenue}</div>
                                  )}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="py-2">
                              {getStatusBadge(lead.status, lead.closed_amount)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground py-2">
                              {format(new Date(lead.created_at), 'MMM d, HH:mm')}
                            </TableCell>
                            <TableCell className="py-2 text-right">
                              <Select 
                                value={lead.status} 
                                onValueChange={(value) => handleUpdateLeadStatus(lead, value)}
                              >
                                <SelectTrigger className="h-7 w-[110px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border border-border">
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="called">📞 Called</SelectItem>
                                  <SelectItem value="emailed">✉️ Emailed</SelectItem>
                                  <SelectItem value="considering">Considering</SelectItem>
                                  <SelectItem value="closed">💰 Closed</SelectItem>
                                  <SelectItem value="deleted" className="text-red-400">🗑️ Delete</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(pageFilter ? filteredData.leads : leads).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              {pageFilter ? `No leads from ${pageFilter}` : 'No leads captured yet'}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="journey" className="mt-0">
                <div className="grid grid-cols-2 gap-3">
                  {/* Top Entry Pages */}
                  <Card className="relative overflow-hidden p-4 border-border/60 bg-gradient-to-br from-card to-green-500/5">
                    <div className="absolute top-0 right-0 w-14 h-14 bg-gradient-to-bl from-green-500/15 to-transparent rounded-bl-[35px] pointer-events-none" />
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm relative z-10">
                      <Eye className="w-4 h-4 text-green-500" />
                      Top Entry Pages
                    </h3>
                    <div className="space-y-2 relative z-10">
                      {Object.entries(
                        sessions.reduce((acc, s) => {
                          const page = s.first_page || '/';
                          acc[page] = (acc[page] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([page, count]) => (
                          <div key={page} className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground truncate max-w-[140px]">{page}</span>
                            <span className="font-bold text-sm">{count}</span>
                          </div>
                        ))}
                    </div>
                  </Card>

                  {/* Tool Usage by Type */}
                  <Card className="relative overflow-hidden p-4 border-border/60 bg-gradient-to-br from-card to-violet-500/5">
                    <div className="absolute top-0 right-0 w-14 h-14 bg-gradient-to-bl from-violet-500/15 to-transparent rounded-bl-[35px] pointer-events-none" />
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm relative z-10">
                      <MousePointer className="w-4 h-4 text-violet-500" />
                      Tool Usage
                    </h3>
                    <div className="space-y-2 relative z-10">
                      {Object.entries(
                        toolInteractions.reduce((acc, t) => {
                          const type = t.tool_type || 'unknown';
                          acc[type] = (acc[type] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px]">{type}</Badge>
                            <span className="font-bold text-sm">{count}</span>
                          </div>
                        ))}
                    </div>
                  </Card>

                  {/* Recent Lead Sources */}
                  <Card className="relative overflow-hidden p-4 col-span-2 border-border/60 bg-gradient-to-br from-card to-pink-500/5">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-pink-500/15 to-transparent rounded-bl-[40px] pointer-events-none" />
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm relative z-10">
                      <FileText className="w-4 h-4 text-pink-500" />
                      Lead Sources
                    </h3>
                    <div className="flex flex-wrap gap-2 relative z-10">
                      {Object.entries(
                        leads.reduce((acc, l) => {
                          const source = l.metric_type || 'unknown';
                          acc[source] = (acc[source] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 6)
                        .map(([source, count]) => (
                          <Badge key={source} variant="secondary" className="px-2 py-1">
                            {source}: <span className="font-bold ml-1">{count}</span>
                          </Badge>
                        ))}
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Tool Usage Tab */}
              <TabsContent value="tools" className="mt-0">
                <Card className="relative overflow-hidden p-0 border-border/60 bg-gradient-to-br from-card via-card to-cyan-500/5">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-[50px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-violet-500/8 to-transparent rounded-tr-[40px] pointer-events-none" />
                  <div className="max-h-[420px] overflow-auto relative z-10">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead className="text-xs">Tool</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">Page</TableHead>
                          <TableHead className="text-xs">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.toolInteractions.map((tool) => (
                          <TableRow key={tool.id}>
                            <TableCell className="font-medium text-sm py-2">{tool.tool_name}</TableCell>
                            <TableCell className="py-2">
                              <Badge variant="outline" className="text-[10px]">{tool.tool_type}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground py-2 max-w-[120px] truncate">{tool.page_path}</TableCell>
                            <TableCell className="text-xs text-muted-foreground py-2">
                              {format(new Date(tool.created_at), 'MMM d, HH:mm')}
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredData.toolInteractions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              {pageFilter ? `No interactions on ${pageFilter}` : 'No tool interactions yet'}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </TabsContent>
          </Tabs>
        </div>
        )}

        {/* Google Search Console Panel - Full width */}
        <div className="mb-8">
          <GSCDashboardPanel 
            externalSelectedSite={matchingGscSiteUrl || selectedTrackedDomain}
            externalDateRange={integratedGscDateRange}
            hideDateSelector={true}
            onSiteChange={(site) => {
              const cleanDomain = normalizeDomain(site);
              setSelectedGscDomain(cleanDomain);
              setSelectedGscSiteUrl(site);
              selectedGscDomainRef.current = cleanDomain;
              console.log('[GSC Panel] Site changed to:', cleanDomain);
            }}
            onDataLoaded={(data) => {
              console.log('GSC data loaded:', data);
            }}
            onTrackingStatus={(hasTracking, domain) => {
              const cleanDomain = normalizeDomain(domain);
              setGscTrackingByDomain((prev) => ({ ...prev, [cleanDomain]: hasTracking }));
              console.log(`Tracking status for ${cleanDomain}: ${hasTracking ? 'installed' : 'not installed'}`);
            }}
            onSitesLoaded={(sites) => {
              setGscSites(sites);
              console.log('[GSC] Sites loaded:', sites.map(s => normalizeDomain(s.siteUrl)));
            }}
            onAuthStatusChange={(isAuth) => {
              setGscAuthenticated(isAuth);
              console.log('[GSC] Auth status changed:', isAuth);
            }}
          />
        </div>
        

        
        {/* Show VI install prompt when GSC domain is not in VI tracking */}
        {shouldShowInstallPrompt && selectedGscDomain && !selectedTrackedDomain && (
          <Card className="mb-8 border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                Add {selectedGscDomain} to Visitor Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Install the tracking code on <strong>{selectedGscDomain}</strong> to see visitor analytics alongside your GSC data.
              </p>
              <Button 
                size="sm" 
                onClick={() => {
                  // Add this GSC domain to user-added domains
                  if (!userAddedDomains.includes(selectedGscDomain)) {
                    setUserAddedDomains([...userAddedDomains, selectedGscDomain]);
                  }
                  setSelectedTrackedDomain(selectedGscDomain);
                  setSelectedDomainKey(selectedGscDomain);
                }}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add to VI Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        </main>

        {/* Right Sidebar - Chat Panel */}
        <div 
          className={`flex-shrink-0 border-l border-border bg-card/50 ${chatPanelOpen ? 'w-64' : 'w-14'}`}
          style={{ contain: 'layout paint', willChange: 'width' }}
        >
          <div className="sticky top-[52px] h-[calc(100vh-140px)] flex flex-col overflow-hidden">
            {/* Header with animated icon */}
            <div className="flex flex-col border-b border-border">
              <div 
                onClick={() => {
                  setChatPanelOpen(!chatPanelOpen);
                  setHasNewMessage(false); // Clear notification when opening
                }}
                className="flex items-center justify-center gap-2 p-3 cursor-pointer"
              >
                <div className="relative">
                  {chatOnline ? (
                    <>
                      {/* Static glow instead of animate-ping to reduce layout thrashing */}
                      <MessageCircle className={`w-5 h-5 absolute inset-0 ${hasNewMessage ? 'text-amber-500/30' : 'text-cyan-500/20'}`} style={{ transform: 'scale(1.3)', opacity: 0.5 }} />
                      <MessageCircle className={`w-5 h-5 relative ${hasNewMessage ? 'text-amber-500' : 'text-cyan-500'}`} />
                    </>
                  ) : (
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                  {chatOnline && sidebarChats.length > 0 && (
                    <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center ${hasNewMessage ? 'bg-amber-500' : 'bg-red-500'}`}>
                      {sidebarChats.length > 9 ? '9+' : sidebarChats.length}
                    </span>
                  )}
                </div>
                {chatPanelOpen && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Live Chats</span>
                    {hasNewMessage && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-medium">
                        NEW
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
              
            {/* Chat List - only show when online */}
            {chatOnline && chatPanelOpen && (
              <div className="flex-1 flex flex-col gap-1 p-2 overflow-auto">
                {/* Active Chats Section */}
                {sidebarChats.length > 0 && (
                  <>
                    <p className="text-[10px] text-muted-foreground font-medium px-1 mb-1">Active Chats</p>
                    {sidebarChats.map((chat) => {
                      const avatarUrl = chat.visitor_email ? chatProfileAvatars[chat.visitor_email] : null;
                      
                      return (
                        <div
                          key={chat.id}
                          onClick={() => setSelectedChatId(chat.id === selectedChatId ? null : chat.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedChatId === chat.id 
                              ? 'bg-cyan-500/20 border border-cyan-500/30' 
                              : 'hover:bg-secondary/50'
                          }`}
                        >
                          {avatarUrl ? (
                            <div className="relative w-8 h-8 flex-shrink-0">
                              <img 
                                src={avatarUrl} 
                                alt={chat.visitor_name || 'Visitor'} 
                                className="w-full h-full rounded-full object-cover ring-2 ring-cyan-500/30"
                              />
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                              <UserIcon className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {chat.visitor_name || 'Visitor'}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {chat.current_page || 'Unknown page'}
                            </p>
                          </div>
                          {chat.status === 'pending' && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Live Visitors Section */}
                {activeVisitors > 0 && (
                  <>
                    <p className="text-[10px] text-muted-foreground font-medium px-1 mb-1 mt-2 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Live Visitors
                      <span className="ml-auto text-emerald-500">{activeVisitors}</span>
                    </p>
                    {liveVisitors.map((visitor) => {
                      // Bold, vibrant colors (no pastels)
                      const colors = [
                        'from-red-600 to-rose-700',
                        'from-orange-600 to-amber-700',
                        'from-emerald-600 to-green-700',
                        'from-blue-600 to-indigo-700',
                        'from-purple-600 to-violet-700',
                        'from-cyan-600 to-teal-700',
                      ];
                      const visitorIcons = [Eye, Zap, Flame, Star, Target, Crosshair, Sparkles, Activity];
                      const hash = visitor.session_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      const colorClass = colors[hash % colors.length];
                      const VisitorIcon = visitorIcons[hash % visitorIcons.length];
                      const timeSince = Math.floor((Date.now() - new Date(visitor.started_at).getTime()) / 60000);
                      const timeLabel = timeSince < 1 ? 'Just now' : timeSince < 60 ? `${timeSince}m ago` : `${Math.floor(timeSince / 60)}h ago`;
                      
                      // Check if this visitor has an avatar (logged-in user)
                      const hasAvatar = visitor.avatar_url;
                      const isCurrentUser = visitor.is_current_user;
                      
                      return (
                        <div
                          key={visitor.session_id}
                          onClick={async () => {
                            if (isCurrentUser) return; // Don't start chat with yourself
                            const { data: newConv } = await supabase
                              .from('chat_conversations')
                              .insert({
                                session_id: visitor.session_id,
                                status: 'active',
                                current_page: visitor.first_page,
                              })
                              .select('id')
                              .single();
                            
                            if (newConv) {
                              await supabase.from('chat_messages').insert({
                                conversation_id: newConv.id,
                                sender_type: 'system',
                                message: `Chat initiated with visitor on ${visitor.first_page || 'homepage'}`,
                              });
                              setSelectedChatId(newConv.id);
                              fetchSidebarChats();
                              toast.success('Chat started with visitor');
                            }
                          }}
                          className={`group relative flex items-center gap-3 p-2 rounded-lg transition-all duration-300 border backdrop-blur-sm ${
                            isCurrentUser 
                              ? 'bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border-cyan-500/40 cursor-default' 
                              : 'hover:bg-primary/5 border-primary/10 hover:border-primary/30 cursor-pointer'
                          }`}
                        >
                          {/* Glow effect on hover */}
                          {!isCurrentUser && (
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                          
                          {/* Avatar or Icon container */}
                          <div className="relative flex-shrink-0">
                            {hasAvatar ? (
                              <>
                                {/* Outer glow for avatar */}
                                <div className={`absolute -inset-1 rounded-full ${isCurrentUser ? 'bg-gradient-to-br from-cyan-500 to-violet-500' : `bg-gradient-to-br ${colorClass}`} opacity-40 blur-sm group-hover:opacity-60 transition-opacity`} />
                                
                                {/* Avatar image */}
                                <div className={`relative w-9 h-9 rounded-full overflow-hidden ring-2 ${isCurrentUser ? 'ring-cyan-500/60' : 'ring-primary/30'}`}>
                                  <img 
                                    src={visitor.avatar_url!} 
                                    alt={visitor.display_name || 'User'} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                
                                {/* YOU badge for current user */}
                                {isCurrentUser && (
                                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-1.5 py-0.5 rounded-full shadow-lg">
                                    YOU
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                {/* Outer glow ring */}
                                <div className={`absolute -inset-1 rounded-lg bg-gradient-to-br ${colorClass} opacity-30 blur-sm group-hover:opacity-50 transition-opacity`} />
                                
                                {/* Main square */}
                                <div className={`relative w-9 h-9 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg`}>
                                  {/* Inner highlight */}
                                  <div className="absolute inset-0.5 rounded-md bg-gradient-to-br from-white/20 to-transparent" />
                                  
                                  {/* Scan line removed (was infinite animation) */}
                                  
                                  {/* Icon */}
                                  <VisitorIcon className="w-4 h-4 text-white relative z-10 drop-shadow-sm" />
                                  
                                  {/* Corner accents */}
                                  <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l-2 border-t-2 border-white/40 rounded-tl-sm" />
                                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r-2 border-b-2 border-white/40 rounded-br-sm" />
                                </div>
                              </>
                            )}
                            
                            {/* Live indicator - static for performance */}
                            <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background shadow-lg ${isCurrentUser ? 'bg-cyan-400 shadow-cyan-400/50' : 'bg-emerald-400 shadow-emerald-400/50'}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0 relative z-10">
                            <p className="text-xs font-medium text-foreground truncate flex items-center gap-1.5">
                              {isCurrentUser ? (
                                <>
                                  <span className="text-cyan-500">You</span>
                                  <Badge variant="outline" className="text-[8px] py-0 px-1 h-4 border-cyan-500/30 text-cyan-500">Online</Badge>
                                </>
                              ) : (
                                <>
                                  {visitor.display_name || visitor.first_page || '/'}
                                  {visitor.user_id && (
                                    <Badge variant="outline" className="text-[8px] py-0 px-1 h-4 border-emerald-500/30 text-emerald-500">Google</Badge>
                                  )}
                                </>
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                              <span className={`w-1 h-1 rounded-full ${isCurrentUser ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                              {isCurrentUser ? 'Your session' : `${timeLabel} • Click to engage`}
                            </p>
                          </div>
                          
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Empty state */}
                {sidebarChats.length === 0 && liveVisitors.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-8 animate-fade-in">
                      <div className="relative mx-auto w-12 h-12 mb-3">
                        <MessageCircle className="w-12 h-12 text-cyan-500/40" />
                      </div>
                      <p className="text-xs text-muted-foreground">Waiting for visitors...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Collapsed state - show chats + live visitors when online */}
            {chatOnline && !chatPanelOpen && (
              <div className="flex-1 flex flex-col items-center gap-2 py-3 overflow-auto">
                {/* Active Chats */}
                {sidebarChats.slice(0, 5).map((chat) => {
                  const avatarUrl = chat.visitor_email ? chatProfileAvatars[chat.visitor_email] : null;
                  
                  return (
                    <div
                      key={chat.id}
                      onClick={() => {
                        setChatPanelOpen(true);
                        setSelectedChatId(chat.id);
                      }}
                      className={`relative w-10 h-10 rounded-full cursor-pointer transition-all hover:scale-110 ${
                        chat.status === 'pending' ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-background' : ''
                      }`}
                      title={chat.visitor_name || 'Active Chat'}
                    >
                      {avatarUrl ? (
                        <>
                          <img 
                            src={avatarUrl} 
                            alt={chat.visitor_name || 'Visitor'} 
                            className="w-full h-full rounded-full object-cover ring-2 ring-cyan-500/50"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background" />
                        </>
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {chat.status === 'pending' && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </div>
                  );
                })}

                {/* Separator if both chats and visitors exist */}
                {sidebarChats.length > 0 && liveVisitors.length > 0 && (
                  <div className="w-6 h-px bg-border my-1" />
                )}

                {/* Live Visitors (not in chat yet) */}
                {liveVisitors.slice(0, 10 - Math.min(sidebarChats.length, 5)).map((visitor, index) => {
                  // Bold, vibrant colors (no pastels)
                  const colors = [
                    'from-red-600 to-rose-700',
                    'from-orange-600 to-amber-700',
                    'from-emerald-600 to-green-700',
                    'from-blue-600 to-indigo-700',
                    'from-purple-600 to-violet-700',
                    'from-cyan-600 to-teal-700',
                  ];
                  const hash = visitor.session_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const colorClass = colors[hash % colors.length];
                  const visitorIcons = [Eye, Zap, Flame, Star, Target, Crosshair, Sparkles, Activity];
                  const VisitorIcon = visitorIcons[hash % visitorIcons.length];
                  const timeSince = Math.floor((Date.now() - new Date(visitor.started_at).getTime()) / 60000);
                  const timeLabel = timeSince < 1 ? 'Just now' : timeSince < 60 ? `${timeSince}m` : `${Math.floor(timeSince / 60)}h`;
                  
                  // Check if this visitor has an avatar (logged-in user)
                  const hasAvatar = visitor.avatar_url;
                  const isCurrentUser = visitor.is_current_user;
                  
                  return (
                    <motion.div
                      key={visitor.session_id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={async () => {
                        if (isCurrentUser) return; // Don't start chat with yourself
                        const { data: newConv } = await supabase
                          .from('chat_conversations')
                          .insert({
                            session_id: visitor.session_id,
                            status: 'active',
                            current_page: visitor.first_page,
                          })
                          .select('id')
                          .single();
                        
                        if (newConv) {
                          await supabase.from('chat_messages').insert({
                            conversation_id: newConv.id,
                            sender_type: 'system',
                            message: `Chat initiated with visitor on ${visitor.first_page || 'homepage'}`,
                          });
                          setChatPanelOpen(true);
                          setSelectedChatId(newConv.id);
                          fetchSidebarChats();
                          toast.success('Chat started with visitor');
                        }
                      }}
                      className={`relative ${isCurrentUser ? 'w-12 h-12' : 'w-10 h-10'} group ${isCurrentUser ? 'cursor-default' : 'cursor-pointer'}`}
                      title={isCurrentUser ? 'You (Online)' : `${visitor.first_page || '/'} • ${timeLabel}`}
                      whileHover={isCurrentUser ? {} : { scale: 1.15 }}
                      whileTap={isCurrentUser ? {} : { scale: 0.95 }}
                    >
                      {hasAvatar ? (
                        <>
                          {/* Outer glow for avatar */}
                          <div className={`absolute -inset-1 rounded-full ${isCurrentUser ? 'bg-gradient-to-br from-cyan-500 to-violet-500' : `bg-gradient-to-br ${colorClass}`} opacity-50 blur-md group-hover:opacity-70 transition-opacity`} />
                          
                          {/* Avatar image */}
                          <div className={`relative w-full h-full rounded-full overflow-hidden ring-2 ${isCurrentUser ? 'ring-cyan-500/60' : 'ring-primary/40'} shadow-xl`}>
                            <img 
                              src={visitor.avatar_url!} 
                              alt={visitor.display_name || 'User'} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Live indicator - static */}
                          <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background shadow-lg ${isCurrentUser ? 'bg-cyan-400 shadow-cyan-400/60' : 'bg-emerald-400 shadow-emerald-400/60'}`} />
                          
                          {/* YOU badge for current user */}
                          {isCurrentUser && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-bold bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-1.5 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                              YOU
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Outer glow */}
                          <div className={`absolute -inset-1 rounded-lg bg-gradient-to-br ${colorClass} opacity-40 blur-md group-hover:opacity-70 transition-opacity`} />
                          
                          {/* Main container */}
                          <div className={`relative w-full h-full rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-xl overflow-hidden`}>
                            {/* Inner highlight */}
                            <div className="absolute inset-0.5 rounded-md bg-gradient-to-br from-white/25 to-transparent" />
                            
                            {/* Grid pattern overlay */}
                            <div 
                              className="absolute inset-0 opacity-20"
                              style={{
                                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                backgroundSize: '4px 4px'
                              }}
                            />
                            
                            {/* Icon */}
                            <VisitorIcon className="w-4 h-4 text-white relative z-10 drop-shadow-lg" />
                            
                            {/* Corner tech accents */}
                            <div className="absolute top-0.5 left-0.5 w-2 h-2 border-l-2 border-t-2 border-white/50 rounded-tl-sm" />
                            <div className="absolute bottom-0.5 right-0.5 w-2 h-2 border-r-2 border-b-2 border-white/50 rounded-br-sm" />
                          </div>
                          
                          {/* Live indicator - static */}
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background shadow-lg shadow-emerald-400/60" />
                        </>
                      )}
                      
                      {/* Hover tooltip with glass effect */}
                      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none scale-95 group-hover:scale-100">
                        <div className="bg-background/90 backdrop-blur-xl border border-primary/20 rounded-xl px-3 py-2 shadow-2xl shadow-primary/10 whitespace-nowrap">
                          <div className="flex items-center gap-2 mb-1">
                            {hasAvatar ? (
                              <img src={visitor.avatar_url!} alt="" className="w-4 h-4 rounded-full object-cover" />
                            ) : (
                              <div className={`w-2 h-2 rounded-sm bg-gradient-to-br ${colorClass}`} />
                            )}
                            <p className="text-[11px] text-foreground font-semibold">
                              {isCurrentUser ? 'You' : visitor.display_name || visitor.first_page || '/'}
                            </p>
                          </div>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isCurrentUser ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                            {isCurrentUser ? 'Your session' : `Click to engage • ${timeLabel}`}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Empty state when no chats and no visitors */}
                {sidebarChats.length === 0 && liveVisitors.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center animate-fade-in">
                      <Eye className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Offline message */}
            {!chatOnline && chatPanelOpen && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-8 px-4 animate-fade-in">
                  <div className="relative mx-auto w-12 h-12 mb-3">
                    <MessageCircle className="w-12 h-12 text-muted-foreground/20 relative" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-0.5 bg-muted-foreground/40 rotate-45" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Chat is offline</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">Turn on to receive chats</p>
                </div>
              </div>
            )}

            {/* Current User (You) - pinned to bottom */}
            {user && (
              <div className="mt-auto border-t border-border p-2">
                {chatPanelOpen ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                    {currentUserProfile?.avatar_url ? (
                      <img 
                        src={currentUserProfile.avatar_url} 
                        alt={currentUserProfile.full_name || 'You'} 
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/50"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {(currentUserProfile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {currentUserProfile?.full_name || user.email?.split('@')[0] || 'You'}
                      </p>
                      <p className="text-[10px] text-primary truncate">Operator</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    {currentUserProfile?.avatar_url ? (
                      <div className="relative">
                        <img 
                          src={currentUserProfile.avatar_url} 
                          alt={currentUserProfile.full_name || 'You'} 
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/50"
                          title={currentUserProfile.full_name || 'You (Operator)'}
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center ring-2 ring-primary/30" title="You (Operator)">
                        <span className="text-lg font-semibold text-white">
                          {(currentUserProfile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      )}


      {/* BRON Tab Content */}
      {activeTab === 'bron' && (
        <div className="relative max-w-[1480px] mx-auto group/bron">
          <motion.div
            className="absolute -inset-[2px] rounded-b-[14px] opacity-30 group-hover/bron:opacity-50 transition-opacity duration-500 blur-md -z-10"
            animate={{
              background: [
                "linear-gradient(180deg, rgba(34,197,94,0.3), rgba(16,185,129,0.3))",
                "linear-gradient(270deg, rgba(16,185,129,0.3), rgba(34,197,94,0.3))",
                "linear-gradient(180deg, rgba(34,197,94,0.3), rgba(16,185,129,0.3))",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <div className="relative bg-gradient-to-br from-card via-card/98 to-emerald-500/5 rounded-b-xl border-x border-b border-border backdrop-blur-xl p-8 overflow-hidden">
            {/* Grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(hsl(142 76% 36%) 1px, transparent 1px), linear-gradient(90deg, hsl(142 76% 36%) 1px, transparent 1px)`,
                backgroundSize: '30px 30px',
              }}
            />
            {/* Scanning line */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent pointer-events-none"
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
            <BRONPlatformConnect 
              domain={rootDomainFromUrl(selectedTrackedDomain || selectedDomainKey)} 
              isNewlyAddedDomain={newlyAddedDomain === rootDomainFromUrl(selectedTrackedDomain || selectedDomainKey)}
              onAutoFillComplete={() => setNewlyAddedDomain(null)}
            />
          </div>
        </div>
      )}

      {/* AEO/GEO Tab Content */}
      {activeTab === 'aeo-geo' && (
        <div className="relative max-w-[1480px] mx-auto group/aeo">
          <motion.div
            className="absolute -inset-[2px] rounded-b-[14px] opacity-30 group-hover/aeo:opacity-50 transition-opacity duration-500 blur-md -z-10"
            animate={{
              background: [
                "linear-gradient(180deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3))",
                "linear-gradient(270deg, rgba(236,72,153,0.3), rgba(139,92,246,0.3))",
                "linear-gradient(180deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3))",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <div className="relative bg-gradient-to-br from-card via-card/98 to-fuchsia-500/5 rounded-b-xl border-x border-b border-border backdrop-blur-xl p-8 overflow-hidden">
            {/* Grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(hsl(280 80% 60%) 1px, transparent 1px), linear-gradient(90deg, hsl(280 80% 60%) 1px, transparent 1px)`,
                backgroundSize: '30px 30px',
              }}
            />
            {/* Scanning line */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-fuchsia-500/5 to-transparent pointer-events-none"
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
            <AEOGeoDashboard 
              domain={rootDomainFromUrl(selectedTrackedDomain || selectedDomainKey)}
            />
          </div>
        </div>
      )}

      {/* CADE Tab Content */}
      {activeTab === 'cade' && (
        <div className="relative max-w-[1480px] mx-auto group/cade">
          <motion.div
            className="absolute -inset-[2px] rounded-b-[14px] opacity-30 group-hover/cade:opacity-50 transition-opacity duration-500 blur-md -z-10"
            animate={{
              background: [
                "linear-gradient(180deg, rgba(139,92,246,0.3), rgba(168,85,247,0.3))",
                "linear-gradient(270deg, rgba(168,85,247,0.3), rgba(139,92,246,0.3))",
                "linear-gradient(180deg, rgba(139,92,246,0.3), rgba(168,85,247,0.3))",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <div className="relative bg-gradient-to-br from-card via-card/98 to-violet-500/5 rounded-b-xl border-x border-b border-border backdrop-blur-xl p-8 overflow-hidden">
            {/* Grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(hsl(280 80% 60%) 1px, transparent 1px), linear-gradient(90deg, hsl(280 80% 60%) 1px, transparent 1px)`,
                backgroundSize: '30px 30px',
              }}
            />
            {/* Scanning line */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent pointer-events-none"
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
          <div className="space-y-6">
            {/* CADE Dashboard - Redesigned */}
            <CADEDashboardNew
              domain={selectedTrackedDomain || selectedDomainKey}
              onSubscriptionChange={setCadeHasSubscription}
            />

            {/* Platform Connection Section - Compact "Connected" state at BOTTOM after connection */}
            {cadeHasSubscription && cadePlatformConnected && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm flex items-center gap-2">
                        Website Connected
                        <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-[10px]">
                          {cadePlatformConnected}
                        </Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        AI-generated content will be auto-published to your {cadePlatformConnected} site
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-green-500/30 text-green-600 hover:bg-green-500/10"
                    onClick={() => setCadePlatformConnected(null)}
                  >
                    Change Platform
                  </Button>
                </div>
              </motion.div>
            )}

            {/* How It Works Section - Minimized by default */}
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group w-full">
                <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
                How CADE Works
                <Badge variant="outline" className="ml-auto text-[10px] text-violet-500 border-violet-500/30">Learn More</Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    { 
                      step: '1', 
                      icon: Target,
                      title: 'Competitor Analysis', 
                      desc: 'CADE analyzes the top 5 ranking competitors for each keyword to understand what makes content rank.',
                      highlight: '5 Competitors'
                    },
                    { 
                      step: '2', 
                      icon: Sparkles,
                      title: 'AI Content Creation', 
                      desc: 'Generate 7 different article types—listicles, how-tos, guides, and more—each optimized for your target keywords.',
                      highlight: '7 Article Types'
                    },
                    { 
                      step: '3', 
                      icon: Network,
                      title: 'Smart Inner Linking', 
                      desc: 'Every new piece of content automatically links to your core money pages, driving authority where it matters.',
                      highlight: 'Auto-Linked'
                    },
                    { 
                      step: '4', 
                      icon: Palette,
                      title: 'Native CSS Match', 
                      desc: 'Articles match your website\'s existing styling perfectly—seamless posts that look like they belong.',
                      highlight: 'Seamless Design'
                    },
                  ].map((item) => (
                    <div key={item.step} className="relative p-5 rounded-xl bg-gradient-to-br from-violet-500/5 to-purple-500/10 border border-violet-500/20 flex flex-col min-h-[180px]">
                      <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                        {item.step}
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3 mt-1">
                        <item.icon className="w-5 h-5 text-violet-500" />
                      </div>
                      <p className="font-semibold text-sm mb-2">{item.title}</p>
                      <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{item.desc}</p>
                      <Badge variant="outline" className="mt-3 w-fit text-[10px] text-violet-500 border-violet-500/30 bg-violet-500/5">
                        {item.highlight}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Feature cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { icon: HelpCircle, label: 'FAQ Optimization', desc: 'Multiple FAQ drops per article capture rich snippets and answer boxes in search results', color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
                    { icon: Flame, label: 'Topical Authority', desc: 'Build content silos that establish expertise and dominate your niche verticals', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
                    { icon: Crosshair, label: 'Keyword Gap Filling', desc: 'Systematically identifies and fills content gaps vs competitors automatically', color: 'text-fuchsia-500', bgColor: 'bg-fuchsia-500/10' },
                  ].map((feature) => (
                    <div key={feature.label} className="p-5 rounded-xl bg-muted/30 border border-border flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center shrink-0`}>
                        <feature.icon className={`w-5 h-5 ${feature.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm mb-1">{feature.label}</p>
                        <p className="text-xs text-muted-foreground">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

          </div>
          </div>
        </div>
      )}

      {/* GMB (Google My Business) Tab Content */}
      {activeTab === 'gmb' && (
        <div className="max-w-[1480px] mx-auto bg-card rounded-b-xl border-x border-b border-border p-8 glow-primary">
          <GMBPanel selectedDomain={selectedTrackedDomain || selectedDomainKey} />
        </div>
      )}

      {/* Social Signals Tab Content */}
      {activeTab === 'social-signals' && (
        <div className="max-w-[1480px] mx-auto bg-card rounded-b-xl border-x border-b border-border p-8 glow-primary">
          <SocialPanel selectedDomain={selectedTrackedDomain || selectedDomainKey} />
        </div>
      )}

      {/* On-page SEO Tab Content */}
      {activeTab === 'on-page-seo' && (
        <div className="max-w-[1480px] mx-auto bg-card rounded-b-xl border-x border-b border-border p-8 glow-primary">
          <div className="space-y-6">
            {/* Title Header */}
            <header className="flex items-start justify-between gap-4 relative overflow-hidden">
              {/* Circuit Board Traces - On-page SEO */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Horizontal traces with traveling light */}
                <div className="absolute h-px w-16 bg-gradient-to-r from-amber-500/50 via-orange-400/30 to-transparent top-3 left-[8%]">
                  <div className="absolute w-2 h-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)] animate-[slide-right_1.5s_linear_infinite]" />
                </div>
                <div className="absolute h-px w-20 bg-gradient-to-r from-transparent via-orange-500/40 to-amber-400/50 top-6 left-[25%]">
                  <div className="absolute w-2 h-full bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.8)] animate-[slide-right_2s_linear_infinite_0.5s]" />
                </div>
                <div className="absolute h-px w-14 bg-gradient-to-r from-yellow-500/40 via-amber-400/50 to-transparent top-2 left-[50%]">
                  <div className="absolute w-2 h-full bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)] animate-[slide-right_1.8s_linear_infinite_1s]" />
                </div>
                <div className="absolute h-px w-18 bg-gradient-to-r from-transparent via-amber-500/35 to-orange-400/45 top-5 left-[70%]">
                  <div className="absolute w-2 h-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-[slide-right_2.2s_linear_infinite_1.5s]" />
                </div>
                {/* Circuit nodes */}
                <div className="absolute w-2 h-2 rounded-sm bg-amber-500/60 shadow-[0_0_4px_rgba(245,158,11,0.6)] top-2.5 left-[8%]" />
                <div className="absolute w-1.5 h-1.5 rounded-sm bg-orange-400/50 shadow-[0_0_4px_rgba(251,146,60,0.5)] top-5.5 left-[45%]" />
                <div className="absolute w-2 h-2 rounded-sm bg-yellow-500/55 shadow-[0_0_4px_rgba(234,179,8,0.6)] top-1.5 left-[64%]" />
              </div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                  <FileSearch className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">On-page SEO</h2>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                      <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">Coming Soon</span>
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    AI-powered on-page optimization that handles tedious manual work—meta tags, schema markup, and content structure—saving you time and money.
                  </p>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
                {/* Trust Badges */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/40 shadow-sm hover:scale-105 hover:shadow-amber-500/30 hover:shadow-md transition-all duration-300 cursor-default hover:-translate-y-0.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-[7px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 whitespace-nowrap">1,000+ CEOs</span>
                  </div>
                  <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-slate-500/20 to-zinc-600/20 border border-slate-500/40 shadow-sm hover:scale-105 hover:shadow-slate-500/30 hover:shadow-md transition-all duration-300 cursor-default hover:-translate-y-0.5">
                    <Building className="w-4 h-4 text-slate-500" />
                    <span className="text-[7px] font-bold text-slate-600 dark:text-slate-400 mt-0.5 whitespace-nowrap">100+ Partners</span>
                  </div>
                  <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/40 shadow-sm hover:scale-105 hover:shadow-violet-500/30 hover:shadow-md transition-all duration-300 cursor-default hover:-translate-y-0.5">
                    <Sparkles className="w-4 h-4 text-violet-500 animate-[bounce_1s_ease-in-out_infinite]" />
                    <span className="text-[7px] font-bold text-violet-600 dark:text-violet-400 mt-0.5 whitespace-nowrap">Agentic AI</span>
                  </div>
                </div>
                {/* Feature Pills - Row 1 */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                    <Gauge className="w-2.5 h-2.5 text-amber-500" />
                    <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">24/7</span>
                  </div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                    <Code className="w-2.5 h-2.5 text-green-500" />
                    <span className="text-[9px] font-medium text-green-600 dark:text-green-400">Snippets</span>
                  </div>
                </div>
                {/* Feature Pills - Row 2 */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                    <Type className="w-2.5 h-2.5 text-orange-500" />
                    <span className="text-[9px] font-medium text-orange-600 dark:text-orange-400">Meta Tags</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Top row: Header section + How It Works grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left - Connect section */}
              <div className="lg:col-span-4">
                <div className="h-full p-6 rounded-xl border-2 border-dashed border-amber-500/30 bg-amber-500/5">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <FileSearch className="w-5 h-5 text-amber-500" />
                      <h3 className="text-lg font-semibold">Connect Your Website</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">
                      Connect your CMS to enable automated on-page optimization powered by BRON.
                    </p>
                    <Badge variant="outline" className="w-fit text-amber-500 border-amber-500/30 bg-amber-500/10">
                      Powered by BRON
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-3">
                      What used to take SEO specialists hours now happens in seconds.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right - How It Works */}
              <div className="lg:col-span-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-amber-500" />
                  On-page Optimization Capabilities
                </h3>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    { 
                      step: '1', 
                      icon: Search,
                      title: 'Page Analysis', 
                      desc: 'BRON scans every page on your site, analyzing titles, headers, content structure, and keyword usage.',
                      highlight: 'Full Site Scan'
                    },
                    { 
                      step: '2', 
                      icon: FileText,
                      title: 'Meta Optimization', 
                      desc: 'AI crafts perfect title tags, meta descriptions, and headers optimized for both users and search engines.',
                      highlight: 'AI-Generated'
                    },
                    { 
                      step: '3', 
                      icon: Code,
                      title: 'Schema & Structure', 
                      desc: 'Automatically generates structured data markup and ensures proper H1-H6 hierarchy across all pages.',
                      highlight: 'Rich Snippets'
                    },
                    { 
                      step: '4', 
                      icon: Gauge,
                      title: 'Continuous Scoring', 
                      desc: 'Real-time readability and SEO scoring with automatic fixes applied as issues are detected.',
                      highlight: '24/7 Monitoring'
                    },
                  ].map((item) => (
                    <div key={item.step} className="relative p-5 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/10 border border-amber-500/20 flex flex-col min-h-[180px]">
                      <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                        {item.step}
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3 mt-1">
                        <item.icon className="w-5 h-5 text-amber-500" />
                      </div>
                      <p className="font-semibold text-sm mb-2">{item.title}</p>
                      <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{item.desc}</p>
                      <Badge variant="outline" className="mt-3 w-fit text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/5">
                        {item.highlight}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom row: Auto-scrolling Feature Carousel */}
            <OnPageSEOCarousel />

            {/* Platform Connection Section */}
            <OnPageSEOConnect 
              domain={selectedTrackedDomain || selectedDomainKey} 
              onConnectionComplete={(platform) => {
                toast.success(`Successfully connected to ${platform}!`);
              }}
            />

            {/* FREE SEO Audit & Case Study Promo Section */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/15 to-violet-500/10 border-2 border-blue-500/30 overflow-hidden">
              {/* Background glow effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl" />
              </div>
              
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Left content */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                      <Search className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">FREE SEO Audit</h3>
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30 animate-pulse">
                          100% Free
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground max-w-xl">
                        Get a comprehensive SEO analysis of any domain—instantly. Track your progress over time with our ongoing Case Study reports that update automatically.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                          <span>Domain Rating</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                          <span>Organic Traffic</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Link2 className="w-3.5 h-3.5 text-violet-500" />
                          <span>Backlink Analysis</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Gauge className="w-3.5 h-3.5 text-amber-500" />
                          <span>Core Web Vitals</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right CTA */}
                  <div className="flex flex-col items-center gap-3 lg:min-w-[200px]">
                    <Button
                      size="lg"
                      asChild
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30"
                    >
                      <Link to="/audits#audit">
                        <Zap className="w-4 h-4 mr-2" />
                        Run Free Audit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-7 gap-1.5 text-xs"
                    >
                      <Link to="/case-studies">
                        <FileText className="w-3.5 h-3.5" />
                        View Case Studies
                      </Link>
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">
                      No signup required • Instant results
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'landing-pages' && (
        <div className="max-w-[1480px] mx-auto bg-card rounded-b-xl border-x border-b border-border p-8 glow-primary">
          <LandingPagesPanel selectedDomain={selectedTrackedDomain || selectedDomainKey || null} />
          
          {/* Extended Content Section - Reduced top spacing */}
          <div className="mt-2">
            <PPCLandingPagesExtendedSection domain={selectedTrackedDomain || selectedDomainKey} />
          </div>
        </div>
      )}

      {/* Floating Chat Bar - Show on all tabs */}
      <FloatingChatBar isOnline={chatOnline} selectedChatId={selectedChatId} onChatClose={() => setSelectedChatId(null)} />

      {/* Close Lead Dialog */}
      <Dialog open={closeLeadDialog.open} onOpenChange={(open) => setCloseLeadDialog({ open, lead: open ? closeLeadDialog.lead : null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Close Lead
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Closing lead for:</p>
              <p className="font-medium">{closeLeadDialog.lead?.email}</p>
              {closeLeadDialog.lead?.full_name && (
                <p className="text-sm text-muted-foreground">{closeLeadDialog.lead.full_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deal Amount (optional)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={closeAmount}
                  onChange={(e) => setCloseAmount(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">Record the payment amount for this closed deal</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseLeadDialog({ open: false, lead: null })}>
              Cancel
            </Button>
            <Button 
              onClick={handleCloseLead} 
              disabled={closingLead}
              className="bg-green-600 hover:bg-green-700"
            >
              {closingLead ? 'Closing...' : 'Mark as Closed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Test Dialog */}
      <Dialog open={formTestDialogOpen} onOpenChange={setFormTestDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-amber-500" />
              Form Testing Center
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Available Forms */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Run Form Tests</h4>
              <p className="text-xs text-muted-foreground">
                Test your forms by submitting real data to the endpoints. Results are recorded with timestamps.
              </p>
              <div className="grid gap-3">
                {availableForms.map((form) => (
                  <div key={form.name} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20">
                    <div>
                      <p className="text-sm font-medium">{form.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">{form.endpoint}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRunFormTest(form.name, form.endpoint, form.testData)}
                      disabled={testingForm === form.name}
                      className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                    >
                      {testingForm === form.name ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <FlaskConical className="w-3 h-3 mr-1" />
                          Run Test
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Test History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">Test History</h4>
                <Button variant="ghost" size="sm" onClick={fetchFormTests} className="h-7 text-xs">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
              </div>
              <div className="max-h-[200px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Form</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Response</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="text-sm py-2">{test.form_name}</TableCell>
                        <TableCell className="py-2">
                          {test.status === 'success' ? (
                            <Badge className="text-[10px] bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Passed
                            </Badge>
                          ) : test.status === 'failed' ? (
                            <Badge className="text-[10px] bg-red-500">
                              <X className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm py-2">
                          {test.response_time_ms ? `${test.response_time_ms}ms` : '-'}
                          {test.error_message && (
                            <span className="block text-xs text-red-400 truncate max-w-[150px]" title={test.error_message}>
                              {test.error_message}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm py-2 text-muted-foreground">
                          {format(new Date(test.tested_at), 'MMM d, HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {formTests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-sm">
                          No tests run yet. Click "Run Test" above to start.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormTestDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Domain Dialog */}
      <Dialog open={addDomainDialogOpen} onOpenChange={setAddDomainDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Domain</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-domain">Domain</Label>
              <Input
                id="new-domain"
                placeholder="example.com"
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const domain = normalizeDomain(newDomainInput.trim());
                    if (domain && !userAddedDomains.includes(domain) && !trackedDomains.includes(domain)) {
                      setUserAddedDomains([...userAddedDomains, domain]);
                      setSelectedDomainKey(domain);
                      setSelectedTrackedDomain(domain);
                      setSelectedGscDomain(domain);
                      setGscDomainHasTracking(false);
                      setNewDomainInput('');
                      setAddDomainDialogOpen(false);
                      setNewlyAddedDomain(domain);
                      // Trigger auto SEO audit
                      triggerAutoAudit(domain);
                    }
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter the root domain without http:// or https://
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNewDomainInput('');
              setAddDomainDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              const domain = normalizeDomain(newDomainInput.trim());
              if (domain && !userAddedDomains.includes(domain) && !trackedDomains.includes(domain)) {
                setUserAddedDomains([...userAddedDomains, domain]);
                setSelectedDomainKey(domain);
                setSelectedTrackedDomain(domain);
                setSelectedGscDomain(domain);
                setGscDomainHasTracking(false);
                setNewDomainInput('');
                setAddDomainDialogOpen(false);
                setNewlyAddedDomain(domain);
                // Trigger auto SEO audit
                triggerAutoAudit(domain);
              }
            }}>
              Add Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spacer for bottom padding */}
      <div className="h-6" />
    </div>
  );
};

export default MarketingDashboard;
