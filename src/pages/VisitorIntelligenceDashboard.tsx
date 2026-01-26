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

import VisitorFlowDiagram, { VisitorFlowSummary, TimeRange } from '@/components/marketing/VisitorFlowDiagram';
import { GSCDashboardPanel } from '@/components/marketing/GSCDashboardPanel';
import { GADashboardPanel } from '@/components/marketing/GADashboardPanel';
import { GAMetricsBoxes } from '@/components/marketing/GAMetricsBoxes';
import FloatingChatBar from '@/components/marketing/FloatingChatBar';
import { BRONExtendedSection, CADEExtendedSection, SocialSignalsExtendedSection, OnPageSEOExtendedSection, GMBExtendedSection, PPCLandingPagesExtendedSection } from '@/components/marketing/ServiceTabExtensions';
import { OnPageSEOCarousel } from '@/components/marketing/OnPageSEOCarousel';
import { OnPageSEOConnect } from '@/components/marketing/OnPageSEOConnect';

import { CADEPlatformConnect } from '@/components/marketing/CADEPlatformConnect';
import { BRONPlatformConnect } from '@/components/marketing/BRONPlatformConnect';
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
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { QuickStatsExpandableRow } from '@/components/marketing/QuickStatsExpandableRow';
import { DomainSelectorBar } from '@/components/marketing/DomainSelectorBar';
import { GMBOnboardingWizard } from '@/components/marketing/GMBOnboardingWizard';
import { GMBPerformancePanel } from '@/components/marketing/GMBPerformancePanel';
import { LandingPagesPanel } from '@/components/marketing/LandingPagesPanel';

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
  const [sidebarChats, setSidebarChats] = useState<{ id: string; session_id: string; status: string; visitor_name: string | null; last_message_at: string; current_page: string | null; }[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [prevChatCount, setPrevChatCount] = useState(0);
  const [expandedStatFilter, setExpandedStatFilter] = useState<string | null>(null);
  const [formTestDialogOpen, setFormTestDialogOpen] = useState(false);
  const [formTests, setFormTests] = useState<{ id: string; form_name: string; status: string; tested_at: string; response_time_ms: number | null; error_message: string | null }[]>([]);
  const [testingForm, setTestingForm] = useState<string | null>(null);
  
  // Dashboard main tabs
  type DashboardTab = 'visitor-intelligence' | 'bron' | 'cade' | 'gmb' | 'social-signals' | 'on-page-seo' | 'landing-pages';
  
  const validTabs: DashboardTab[] = [
    'visitor-intelligence',
    'bron',
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
  
  // GMB (Google My Business) state
  const [gmbAuthenticated, setGmbAuthenticated] = useState<boolean>(false);
  const [gmbConnecting, setGmbConnecting] = useState(false);
  const [gmbAccounts, setGmbAccounts] = useState<{ name: string; accountName: string; type: string }[]>([]);
  const [gmbLocations, setGmbLocations] = useState<{ name: string; title: string; websiteUri?: string; storefrontAddress?: { locality?: string; administrativeArea?: string } }[]>([]);
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
  
  // User-added domains
  const [userAddedDomains, setUserAddedDomains] = useState<string[]>(() => {
    const stored = localStorage.getItem('vi_user_added_domains');
    return stored ? JSON.parse(stored) : [];
  });
  const [addDomainDialogOpen, setAddDomainDialogOpen] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');
  
  // Persist user-added domains to localStorage
  useEffect(() => {
    localStorage.setItem('vi_user_added_domains', JSON.stringify(userAddedDomains));
  }, [userAddedDomains]);
  
  // GSC domain tracking status
  // Single source-of-truth for the header domain selector (domain-first)
  const [selectedDomainKey, setSelectedDomainKey] = useState<string>("");
  const [selectedGscDomain, setSelectedGscDomain] = useState<string | null>(null);
  const [gscDomainHasTracking, setGscDomainHasTracking] = useState<boolean>(true); // Default to true until we check
  const [gscTrackingByDomain, setGscTrackingByDomain] = useState<Record<string, boolean>>({});
  const [gscSites, setGscSites] = useState<{ siteUrl: string; permissionLevel: string }[]>([]);
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
  
  // Tracked domains from visitor intelligence (domains with tracking code installed)
  const [trackedDomains, setTrackedDomains] = useState<string[]>([]);
  const [selectedTrackedDomain, setSelectedTrackedDomain] = useState<string>("");
  
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
      .select('id, session_id, status, visitor_name, last_message_at, current_page')
      .in('status', ['active', 'pending'])
      .order('last_message_at', { ascending: false });
    
    if (data) {
      setSidebarChats(data);
    }
  };

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
    // Check for existing GMB token
    const storedToken = sessionStorage.getItem('gmb_access_token');
    const storedExpiry = sessionStorage.getItem('gmb_token_expiry');
    if (storedToken && storedExpiry && Date.now() < Number(storedExpiry)) {
      // IMPORTANT: Don't just mark "authenticated"; also hydrate accounts + locations.
      const remainingSeconds = Math.max(
        60,
        Math.floor((Number(storedExpiry) - Date.now()) / 1000)
      );
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !session) {
    navigate('/auth?redirect=/visitor-intelligence-dashboard');
    return null;
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
    { label: 'Visitors', count: funnelStats.visitors, icon: Eye, color: 'from-blue-400 to-blue-600' },
    { label: 'Tool Users', count: filteredData.toolInteractions.length, icon: MousePointer, color: 'from-cyan-400 to-cyan-600' },
    { label: 'Leads', count: filteredData.leads.length || funnelStats.leads, icon: Mail, color: 'from-violet-400 to-violet-600' },
    { label: 'Qualified', count: funnelStats.withCompanyInfo, icon: Target, color: 'from-orange-400 to-orange-600' },
    { label: 'Open', count: leads.filter(l => l.status === 'open').length, icon: FileText, color: 'from-slate-400 to-slate-600' },
    { label: 'Closed', count: funnelStats.closedLeads, icon: DollarSign, color: 'from-green-400 to-green-600' },
  ];

  const maxFunnel = Math.max(...funnelSteps.map(s => s.count), 1);

  return (
    <div className="min-h-screen bg-background relative animate-fade-in pt-16 px-6 md:px-10 lg:px-16 overflow-hidden">
      <SEO 
        title="Visitor Intelligence Dashboard | Webstack.ceo"
        description="Real-time visitor intelligence and analytics dashboard"
        canonical="/visitor-intelligence-dashboard"
      />

      {/* High-tech background effects - matching AuditResults page */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Corner gradient accents */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-primary/10 via-violet-500/5 to-transparent rounded-bl-[200px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-cyan-500/10 via-primary/5 to-transparent rounded-tr-[150px]" />
        
        {/* Animated scanning line */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent"
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Floating particles - animated with framer-motion */}
        <motion.div
          className="absolute top-[10%] right-[8%] w-2 h-2 rounded-full bg-cyan-400/70"
          animate={{ y: [0, -12, 0], opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-[20%] right-[15%] w-1.5 h-1.5 rounded-full bg-violet-400/70"
          animate={{ y: [0, -10, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
        />
        <motion.div
          className="absolute top-[15%] right-[25%] w-1 h-1 rounded-full bg-amber-400/70"
          animate={{ y: [0, -8, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
        />
        <motion.div
          className="absolute top-[25%] left-[10%] w-1.5 h-1.5 rounded-full bg-primary/70"
          animate={{ y: [0, -6, 0], x: [0, 3, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-[20%] left-[15%] w-2 h-2 rounded-full bg-emerald-400/60"
          animate={{ y: [0, -15, 0], opacity: [0.4, 0.8, 0.4], scale: [1, 1.3, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute bottom-[30%] right-[12%] w-1.5 h-1.5 rounded-full bg-rose-400/60"
          animate={{ y: [0, -10, 0], x: [0, -5, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.8 }}
        />
        <motion.div
          className="absolute top-[40%] left-[5%] w-1 h-1 rounded-full bg-cyan-300/50"
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
        />
        <motion.div
          className="absolute top-[60%] right-[5%] w-1.5 h-1.5 rounded-full bg-violet-300/50"
          animate={{ y: [0, -12, 0], x: [0, 8, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: 2 }}
        />
        
        {/* Radial glow from top center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-radial from-primary/8 via-violet-500/3 to-transparent" />
      </div>

      {/* Header with integrated tabs - wrapped with animated glow effect, sticky */}
      <div className="relative max-w-[1480px] mx-auto sticky top-0 z-50 group">
        {/* Animated gradient glow background - matching AuditResults */}
        <motion.div
          className="absolute -inset-[2px] rounded-t-[14px] opacity-40 group-hover:opacity-60 transition-opacity duration-500 blur-md"
          animate={{
            background: [
              "linear-gradient(0deg, rgba(34,211,238,0.4), rgba(139,92,246,0.4), rgba(251,191,36,0.3))",
              "linear-gradient(90deg, rgba(139,92,246,0.4), rgba(251,191,36,0.3), rgba(34,211,238,0.4))",
              "linear-gradient(180deg, rgba(251,191,36,0.3), rgba(34,211,238,0.4), rgba(139,92,246,0.4))",
              "linear-gradient(270deg, rgba(34,211,238,0.4), rgba(139,92,246,0.4), rgba(251,191,36,0.3))",
              "linear-gradient(360deg, rgba(34,211,238,0.4), rgba(139,92,246,0.4), rgba(251,191,36,0.3))",
            ],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
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
          
          {/* Animated scanning line effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 via-violet-500/5 to-transparent rounded-bl-[50px] pointer-events-none" />
        
          {/* Tabs - offset slightly right from center, floating at bottom of header */}
          <div className="absolute left-1/2 -bottom-px flex items-end gap-0 z-20" style={{ transform: 'translateX(calc(-50% + 80px))' }}>
            {[
              { id: 'visitor-intelligence' as DashboardTab, label: 'Visitor', icon: Eye, isPaid: false },
              { id: 'bron' as DashboardTab, label: 'Bron', icon: TrendingUp, isPaid: true },
              { id: 'cade' as DashboardTab, label: 'Cade', icon: FileText, isPaid: true },
              { id: 'gmb' as DashboardTab, label: 'Maps', icon: MapPin, isPaid: true },
              { id: 'social-signals' as DashboardTab, label: 'Social', icon: Activity, isPaid: true },
              { id: 'on-page-seo' as DashboardTab, label: 'SEO', icon: FileSearch, isPaid: true },
              { id: 'landing-pages' as DashboardTab, label: 'PPC', icon: Target, isPaid: true },
            ].map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ zIndex: activeTab === tab.id ? 10 : 8 - index }}
                className={`relative flex flex-col items-center justify-center w-16 h-11 transition-all rounded-t-lg border-t border-x gap-0.5 ${
                  activeTab === tab.id
                    ? tab.isPaid 
                      ? 'bg-gradient-to-b from-amber-500/10 to-background text-amber-500 border-amber-500/30'
                      : 'bg-background text-primary border-border'
                    : tab.isPaid
                      ? 'bg-gradient-to-b from-amber-500/5 to-muted/30 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 border-transparent -ml-1 first:ml-0'
                      : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent -ml-1 first:ml-0'
                }`}
                title={tab.isPaid ? `${tab.label} (Premium Add-on)` : tab.label}
              >
                <tab.icon className={`w-4 h-4 ${tab.isPaid && activeTab === tab.id ? 'text-amber-500' : ''}`} />
                <span className="text-[9px] font-medium leading-none">{tab.label}</span>
                {/* Active tab bottom cover */}
                {activeTab === tab.id && (
                  <span className={`absolute -bottom-px left-0 right-0 h-px ${tab.isPaid ? 'bg-gradient-to-r from-amber-500/20 via-background to-amber-500/20' : 'bg-background'}`} />
                )}
              </button>
            ))}
          </div>
        
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
          <div className="flex items-center gap-4">
            {gscAuthenticated && gscProfile?.picture ? (
              <div className="hidden md:flex items-center gap-2">
                <img
                  src={gscProfile.picture}
                  alt={gscProfile.name ? `${gscProfile.name} profile photo` : 'Google profile photo'}
                  className="w-7 h-7 rounded-full object-cover border border-border shadow-lg shadow-primary/10"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <span className="text-sm text-muted-foreground">
                  {gscProfile.name ||
                    (user.email?.toLowerCase().includes('rob') ? 'CTO' :
                      user.email?.toLowerCase() === 'eric@blackwoodproductions.com' ? 'COO' :
                      user.email?.toLowerCase() === 'que@blackwoodproductions.com' ? 'CEO' :
                      'Google User')}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground hidden md:block">
                {
                  user.email?.toLowerCase().includes('rob') ? 'CTO' :
                  user.email?.toLowerCase() === 'eric@blackwoodproductions.com' ? 'COO' :
                  user.email?.toLowerCase() === 'que@blackwoodproductions.com' ? 'CEO' :
                  user.email
                }
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 p-0 hover:bg-primary/10"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-red-500/10 hover:text-red-500">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        </header>
      </div>

      {/* Domain Selector Bar - Show on all tabs */}
      <DomainSelectorBar
        trackedDomains={trackedDomains}
        userAddedDomains={userAddedDomains}
        selectedDomain={selectedTrackedDomain}
        onDomainChange={(value) => {
          setSelectedTrackedDomain(value);
          setSelectedDomainKey(value);
          // Check if this domain has tracking installed
          const hasTracking = trackedDomains.includes(value) && !userAddedDomains.includes(value);
          setGscDomainHasTracking(hasTracking);
        }}
        onAddDomainClick={() => setAddDomainDialogOpen(true)}
        showTimeRange={activeTab === 'visitor-intelligence'}
        timeRange={diagramTimeRange}
        onTimeRangeChange={setDiagramTimeRange}
        customDateRange={diagramCustomDateRange}
        onCustomDateRangeChange={setDiagramCustomDateRange}
        showPageFilter={activeTab === 'visitor-intelligence'}
        pageFilter={pageFilter}
        rightContent={(
          <>
            {/* Free SEO Audit / Case Study Pill */}
            {selectedTrackedDomain && (
              <Button
                size="sm"
                onClick={() => {
                  const cleanDomain = selectedTrackedDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
                  if (savedAuditForDomain) {
                    // Navigate to case study page
                    navigate(`/case-study/${encodeURIComponent(cleanDomain)}`);
                  } else {
                    // Run audit first, then navigate
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
          </>
        )}
      />

      {/* Main Layout - Only show for Visitor Intelligence tab */}
      {activeTab === 'visitor-intelligence' && (
      <div className="relative max-w-[1480px] mx-auto group/main">
        {/* Animated gradient glow for main container */}
        <motion.div
          className="absolute -inset-[2px] rounded-b-[14px] opacity-30 group-hover/main:opacity-50 transition-opacity duration-500 blur-md -z-10"
          animate={{
            background: [
              "linear-gradient(180deg, rgba(34,211,238,0.3), rgba(139,92,246,0.3))",
              "linear-gradient(270deg, rgba(139,92,246,0.3), rgba(34,211,238,0.3))",
              "linear-gradient(180deg, rgba(34,211,238,0.3), rgba(139,92,246,0.3))",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative flex min-h-[calc(100vh-180px)] bg-gradient-to-br from-card via-card/98 to-primary/5 rounded-b-xl border-x border-b border-border backdrop-blur-xl overflow-hidden">
        {/* Left Sidebar - Only show when tracking is installed or no GSC site is selected */}
        {shouldShowViPanels && (
          <>
            {/* Collapsed Sidebar (thin bar when diagram is closed) */}
            {!siteArchOpen && (
              <div className="w-12 flex-shrink-0 border-r border-border bg-card/50">
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
                                <circle cx={18} cy={18} r={16} fill="none" stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7}>
                                  <animate attributeName="r" values="14;17;14" dur="2s" repeatCount="indefinite" />
                                  <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" />
                                </circle>
                                {[0, 60, 120, 180, 240, 300].map((angle) => {
                                  const rad = (angle * Math.PI) / 180;
                                  const x1 = 18 + Math.cos(rad) * 11;
                                  const y1 = 18 + Math.sin(rad) * 11;
                                  const x2 = 18 + Math.cos(rad) * 15;
                                  const y2 = 18 + Math.sin(rad) * 15;
                                  return (
                                    <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f97316" strokeWidth={1.5} strokeLinecap="round" opacity={0.7}>
                                      <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" begin={`${angle / 360}s`} repeatCount="indefinite" />
                                    </line>
                                  );
                                })}
                              </>
                            )}
                            {/* Live visitor glow */}
                            {hasLiveVisitor && (
                              <circle cx={18} cy={18} r={14} fill="#22c55e" opacity={0.25} className="animate-pulse" />
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

        {/* Main Content Area */}
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
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <Card className="relative overflow-hidden p-4 group border-border hover:shadow-lg transition-shadow">
                    {/* Grid pattern */}
                    <div 
                      className="absolute inset-0 opacity-[0.02] pointer-events-none"
                      style={{
                        backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
                        backgroundSize: '16px 16px'
                      }}
                    />
                    {/* Corner glow */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-[40px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="flex items-center gap-2 relative z-10">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${step.color} flex-shrink-0 shadow-lg`}>
                        <step.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
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
            <div className="flex items-stretch gap-3 mb-4 p-2 rounded-xl bg-secondary/30 border border-border">
              {/* Tabs - takes up left portion */}
              <TabsList className="flex-1 grid grid-cols-3 bg-background/40 p-1 h-auto gap-1 rounded-lg">
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
              <div className="flex-1 grid grid-cols-5 gap-2">
                {[
                  { label: 'Open', count: funnelStats.leads - funnelStats.closedLeads, dotColor: 'bg-blue-500', activeClass: 'bg-blue-500/20 border-blue-500/50', glowColor: 'from-blue-500/10' },
                  { label: 'Named', count: funnelStats.withName, dotColor: 'bg-amber-500', activeClass: 'bg-amber-500/20 border-amber-500/50', glowColor: 'from-amber-500/10' },
                  { label: 'Qualified', count: funnelStats.withCompanyInfo, dotColor: 'bg-orange-500', activeClass: 'bg-orange-500/20 border-orange-500/50', glowColor: 'from-orange-500/10' },
                  { label: 'Closed', count: funnelStats.closedLeads, dotColor: 'bg-green-500', activeClass: 'bg-green-500/20 border-green-500/50', glowColor: 'from-green-500/10' },
                ].map((item) => (
                  <motion.button
                    key={item.label}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setExpandedStatFilter(expandedStatFilter === item.label ? null : item.label)}
                    className={`relative overflow-hidden flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all cursor-pointer group ${
                      expandedStatFilter === item.label 
                        ? item.activeClass 
                        : 'bg-background/60 border-border/30 hover:border-border'
                    }`}
                  >
                    {/* Corner glow */}
                    <div className={`absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl ${item.glowColor} to-transparent rounded-bl-[20px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className={`w-2.5 h-2.5 rounded-full ${item.dotColor} relative z-10`} />
                    <span className="text-xs text-muted-foreground relative z-10">{item.label}</span>
                    <span className="font-bold text-sm relative z-10">{Math.max(0, item.count)}</span>
                    <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform relative z-10 ${expandedStatFilter === item.label ? 'rotate-180' : ''}`} />
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateTestLead}
                  className="relative overflow-hidden flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-background/60 border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 transition-colors group"
                  title="Create a test lead for demo purposes"
                >
                  <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-[20px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
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

              {/* Leads Tab */}
              <TabsContent value="leads" className="mt-0">
                <Card className="p-0 overflow-hidden">
                  <div className="max-h-[420px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
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

              {/* Customer Journey Tab */}
              <TabsContent value="journey" className="mt-0">
                <div className="grid grid-cols-2 gap-3">
                  {/* Top Entry Pages */}
                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4 text-green-500" />
                      Top Entry Pages
                    </h3>
                    <div className="space-y-2">
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
                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                      <MousePointer className="w-4 h-4 text-violet-500" />
                      Tool Usage
                    </h3>
                    <div className="space-y-2">
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
                  <Card className="p-4 col-span-2">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-pink-500" />
                      Lead Sources
                    </h3>
                    <div className="flex flex-wrap gap-2">
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
                <Card className="p-0 overflow-hidden">
                  <div className="max-h-[420px] overflow-auto">
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
        <div className={`flex-shrink-0 border-l border-border bg-card/50 transition-all duration-300 ${chatPanelOpen ? 'w-64' : 'w-14'}`}>
          <div className="sticky top-[52px] h-[calc(100vh-140px)] flex flex-col">
            {/* Header with animated icon */}
            <div className="flex flex-col border-b border-border">
              <div 
                onClick={() => {
                  setChatPanelOpen(!chatPanelOpen);
                  setHasNewMessage(false); // Clear notification when opening
                }}
                className="flex items-center justify-center gap-2 p-3 cursor-pointer"
              >
                <div className={`relative ${hasNewMessage ? 'animate-ring-bell' : ''}`}>
                  {chatOnline ? (
                    <>
                      <MessageCircle className={`w-5 h-5 absolute inset-0 ${hasNewMessage ? 'text-amber-500/50 animate-ping' : 'text-cyan-500/30 animate-ping'}`} />
                      <MessageCircle className={`w-5 h-5 relative ${hasNewMessage ? 'text-amber-500' : 'text-cyan-500'}`} />
                    </>
                  ) : (
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                  {chatOnline && sidebarChats.length > 0 && (
                    <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center ${hasNewMessage ? 'bg-amber-500 animate-bounce' : 'bg-red-500 animate-pulse'}`}>
                      {sidebarChats.length > 9 ? '9+' : sidebarChats.length}
                    </span>
                  )}
                </div>
                {chatPanelOpen && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Live Chats</span>
                    {hasNewMessage && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-medium animate-pulse">
                        NEW
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
              
            {/* Chat List - only show when online */}
            {chatOnline && chatPanelOpen && (
              <div className="flex-1 flex flex-col-reverse gap-1 p-2 overflow-auto">
                {sidebarChats.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-8 animate-fade-in">
                      <div className="relative mx-auto w-12 h-12 mb-3">
                        <MessageCircle className="w-12 h-12 text-cyan-500/20 absolute inset-0 animate-ping" />
                        <MessageCircle className="w-12 h-12 text-cyan-500/40 relative" />
                      </div>
                      <p className="text-xs text-muted-foreground">Waiting for chats...</p>
                    </div>
                  </div>
                ) : (
                  sidebarChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id === selectedChatId ? null : chat.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedChatId === chat.id 
                          ? 'bg-cyan-500/20 border border-cyan-500/30' 
                          : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
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
                  ))
                )}
              </div>
            )}

            {/* Collapsed state - just show icons when online */}
            {chatOnline && !chatPanelOpen && sidebarChats.length > 0 && (
              <div className="flex-1 flex flex-col items-center gap-2 py-3 overflow-auto">
                {sidebarChats.slice(0, 8).map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setChatPanelOpen(true);
                      setSelectedChatId(chat.id);
                    }}
                    className={`relative w-10 h-10 rounded-full cursor-pointer transition-all hover:scale-110 ${
                      chat.status === 'pending' ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-background' : ''
                    }`}
                    title={chat.visitor_name || 'Visitor'}
                  >
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    {chat.status === 'pending' && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </div>
                ))}
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
            <BRONPlatformConnect />
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
            {/* Title Header */}
            <header className="flex items-start justify-between gap-4 relative overflow-hidden">
              {/* Matrix Data Streams - CADE */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Vertical falling data streams */}
                <div className="absolute w-px h-16 bg-gradient-to-b from-transparent via-violet-400/60 to-transparent animate-[slide-down_2s_linear_infinite] left-[12%] -top-4" />
                <div className="absolute w-px h-12 bg-gradient-to-b from-transparent via-purple-500/50 to-transparent animate-[slide-down_2.5s_linear_infinite_0.3s] left-[25%] -top-4" />
                <div className="absolute w-px h-20 bg-gradient-to-b from-transparent via-fuchsia-400/40 to-transparent animate-[slide-down_1.8s_linear_infinite_0.6s] left-[40%] -top-4" />
                <div className="absolute w-px h-14 bg-gradient-to-b from-transparent via-violet-500/55 to-transparent animate-[slide-down_2.2s_linear_infinite_0.9s] left-[55%] -top-4" />
                <div className="absolute w-px h-18 bg-gradient-to-b from-transparent via-purple-400/45 to-transparent animate-[slide-down_1.6s_linear_infinite_1.2s] left-[70%] -top-4" />
                <div className="absolute w-px h-10 bg-gradient-to-b from-transparent via-fuchsia-500/50 to-transparent animate-[slide-down_2.8s_linear_infinite_1.5s] left-[82%] -top-4" />
                {/* Horizontal scan line */}
                <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent animate-[slide-right_3s_linear_infinite] top-1/2" />
              </div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shrink-0">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">CADE</h2>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    Content automation and topical authority signals. AI-powered content generation that matches your native CSS and inner-links to your money pages.
                  </p>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
                {/* Trust Badges */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/40 shadow-sm hover:scale-105 hover:shadow-amber-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-[7px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 whitespace-nowrap">1,000+ CEOs</span>
                  </div>
                  <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-slate-500/20 to-zinc-600/20 border border-slate-500/40 shadow-sm hover:scale-105 hover:shadow-slate-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                    <Building className="w-4 h-4 text-slate-500" />
                    <span className="text-[7px] font-bold text-slate-600 dark:text-slate-400 mt-0.5 whitespace-nowrap">100+ Partners</span>
                  </div>
                  <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/40 shadow-sm hover:scale-105 hover:shadow-violet-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                    <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                    <span className="text-[7px] font-bold text-violet-600 dark:text-violet-400 mt-0.5 whitespace-nowrap">Agentic AI</span>
                  </div>
                </div>
                {/* Feature Pills - Row 1 */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                    <Sparkles className="w-2.5 h-2.5 text-violet-500" />
                    <span className="text-[9px] font-medium text-violet-600 dark:text-violet-400">7 Types</span>
                  </div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                    <CheckCircle className="w-2.5 h-2.5 text-green-500" />
                    <span className="text-[9px] font-medium text-green-600 dark:text-green-400">CSS Match</span>
                  </div>
                </div>
                {/* Feature Pills - Row 2 */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                    <Network className="w-2.5 h-2.5 text-purple-500" />
                    <span className="text-[9px] font-medium text-purple-600 dark:text-purple-400">Inner Links</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Top row: Header section + How It Works grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left - Connect section */}
              <div className="lg:col-span-4">
                <div className="h-full p-6 rounded-xl border-2 border-dashed border-violet-500/30 bg-violet-500/5">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-violet-500" />
                      <h3 className="text-lg font-semibold">Connect Your Website</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">
                      Connect your CMS to enable automated content generation that reverse-engineers competitor rankings.
                    </p>
                    <Badge variant="outline" className="w-fit text-amber-500 border-amber-500/30 bg-amber-500/10">
                      Coming Soon
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-3">
                      Content that inner-links directly into your most important pages.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right - How It Works */}
              <div className="lg:col-span-8">
                <h3 className="text-lg font-semibold mb-4">How It Works</h3>
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
              </div>
            </div>

            {/* Bottom row: Feature cards */}
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
            {/* Platform Connection Section */}
            <CADEPlatformConnect 
              domain={selectedTrackedDomain || selectedDomainKey} 
              onConnectionComplete={(platform) => {
                toast.success(`Successfully connected to ${platform}!`);
              }}
            />
          </div>
          </div>
        </div>
      )}

      {/* GMB (Google My Business) Tab Content */}
      {activeTab === 'gmb' && (
        <div className="max-w-[1480px] mx-auto bg-card rounded-b-xl border-x border-b border-border p-8 glow-primary">
          <header className="flex items-start justify-between gap-4 mb-6 relative overflow-hidden">
            {/* Radar Pulse Scanner - GMB */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Central radar pulse */}
              <div className="absolute left-[15%] top-1/2 -translate-y-1/2">
                <div className="w-8 h-8 rounded-full border border-blue-400/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <div className="absolute inset-0 w-8 h-8 rounded-full border border-green-400/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
                <div className="absolute inset-2 w-4 h-4 rounded-full bg-blue-500/30" />
              </div>
              {/* GPS signal dots */}
              <div className="absolute w-2 h-2 rounded-full bg-green-400/50 animate-[pulse_1.5s_ease-in-out_infinite] top-2 left-[35%]" />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-teal-400/40 animate-[pulse_1.8s_ease-in-out_infinite_0.3s] top-6 left-[50%]" />
              <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-400/45 animate-[pulse_2s_ease-in-out_infinite_0.6s] top-3 left-[65%]" />
              {/* Connecting lines */}
              <div className="absolute w-20 h-px bg-gradient-to-r from-blue-400/30 via-green-400/20 to-transparent top-4 left-[30%] animate-[pulse_2.5s_ease-in-out_infinite]" />
            </div>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shrink-0 shadow-lg">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">Google Business Profile</h2>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-blue-400 animate-pulse" />
                    <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide">Coming Soon</span>
                  </span>
                </div>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  Manage your Google My Business listings, respond to reviews, and track local SEO performance. When CADE is active, new articles and FAQs are automatically posted to your GMB listing.
                </p>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
              {/* Trust Badges */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/40 shadow-sm hover:scale-105 hover:shadow-amber-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-[7px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 whitespace-nowrap">1,000+ CEOs</span>
                </div>
                <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-slate-500/20 to-zinc-600/20 border border-slate-500/40 shadow-sm hover:scale-105 hover:shadow-slate-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                  <Building className="w-4 h-4 text-slate-500" />
                  <span className="text-[7px] font-bold text-slate-600 dark:text-slate-400 mt-0.5 whitespace-nowrap">100+ Partners</span>
                </div>
                <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/40 shadow-sm hover:scale-105 hover:shadow-violet-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                  <Sparkles className="w-4 h-4 text-violet-500 animate-[spin_3s_linear_infinite]" />
                  <span className="text-[7px] font-bold text-violet-600 dark:text-violet-400 mt-0.5 whitespace-nowrap">Agentic AI</span>
                </div>
              </div>
              {/* Feature Pills - Row 1 */}
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                  <Globe className="w-2.5 h-2.5 text-blue-500" />
                  <span className="text-[9px] font-medium text-blue-600 dark:text-blue-400">Local SEO</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                  <Star className="w-2.5 h-2.5 text-green-500" />
                  <span className="text-[9px] font-medium text-green-600 dark:text-green-400">Reviews</span>
                </div>
              </div>
              {/* Feature Pills - Row 2 */}
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                  <MapPin className="w-2.5 h-2.5 text-teal-500" />
                  <span className="text-[9px] font-medium text-teal-600 dark:text-teal-400">Map Pack</span>
                </div>
              </div>
            </div>
          </header>

          {!gmbAuthenticated ? (
            /* Not Connected State */
            <div className="space-y-6">
              {/* Top row: Connect panel + How It Works grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left - Connect panel */}
                <div className="lg:col-span-4">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-green-500/15 border border-blue-500/20 h-full flex flex-col">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center mb-4 shadow-lg">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Connect Your Account</h3>
                    <p className="text-muted-foreground text-sm flex-1">
                      Link your Google Business Profile to manage listings and track performance.
                    </p>
                    <div className="mt-auto pt-4 border-t border-blue-500/20">
                      <Button
                        size="lg"
                        onClick={async () => {
                          setGmbConnecting(true);
                          try {
                            const scopes = [
                              'https://www.googleapis.com/auth/business.manage',
                              'openid',
                              'profile',
                              'email'
                            ].join(' ');
                            
                            const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
                            const encoder = new TextEncoder();
                            const data = encoder.encode(codeVerifier);
                            const digest = await crypto.subtle.digest('SHA-256', data);
                            const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
                              .replace(/\+/g, '-')
                              .replace(/\//g, '_')
                              .replace(/=+$/, '');
                            
                            sessionStorage.setItem('gmb_code_verifier', codeVerifier);
                            sessionStorage.setItem('gmb_oauth_pending', 'true');
                            localStorage.setItem('gmb_code_verifier', codeVerifier);
                            localStorage.setItem('gmb_oauth_pending', 'true');
                            
                            const clientId = localStorage.getItem("gsc_client_id") || localStorage.getItem("ga_client_id") || import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
                            
                            if (!clientId) {
                              toast.error('Please connect Google Search Console first to configure your OAuth credentials');
                              setGmbConnecting(false);
                              return;
                            }
                            const redirectUri = `${window.location.origin}/visitor-intelligence-dashboard`;
                            
                            const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
                            authUrl.searchParams.set('client_id', clientId);
                            authUrl.searchParams.set('redirect_uri', redirectUri);
                            authUrl.searchParams.set('response_type', 'code');
                            authUrl.searchParams.set('scope', scopes);
                            authUrl.searchParams.set('code_challenge', base64);
                            authUrl.searchParams.set('code_challenge_method', 'S256');
                            authUrl.searchParams.set('access_type', 'offline');
                            authUrl.searchParams.set('prompt', 'consent select_account');
                            authUrl.searchParams.set('state', 'gmb');

                            const popupWidth = 520;
                            const popupHeight = 720;
                            const left = (window.screenX ?? (window as any).screenLeft ?? 0) + (window.outerWidth - popupWidth) / 2;
                            const top = (window.screenY ?? (window as any).screenTop ?? 0) + (window.outerHeight - popupHeight) / 2;
                            const popup = window.open(
                              authUrl.toString(),
                              'gmb_oauth',
                              `popup=yes,width=${popupWidth},height=${popupHeight},left=${Math.max(0, left)},top=${Math.max(0, top)}`
                            );

                            if (!popup) {
                              window.location.href = authUrl.toString();
                            }
                          } catch (err) {
                            console.error('GMB OAuth init error:', err);
                            toast.error('Failed to start Google Business Profile connection');
                            setGmbConnecting(false);
                          }
                        }}
                        disabled={gmbConnecting}
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold"
                      >
                        {gmbConnecting ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Connecting...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Connect Account
                          </span>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        Requires access to a Business Profile
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right - How It Works */}
                <div className="lg:col-span-8">
                  <h3 className="text-lg font-semibold mb-4">How It Works</h3>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                      { 
                        step: '1', 
                        icon: Globe,
                        title: 'Connect Account', 
                        desc: 'Securely link your Google Business Profile with OAuth authentication.',
                        highlight: 'OAuth 2.0 Secure'
                      },
                      { 
                        step: '2', 
                        icon: MapPin,
                        title: 'Manage Locations', 
                        desc: 'Update hours, address, photos, and key info for each location.',
                        highlight: 'Multi-Location'
                      },
                      { 
                        step: '3', 
                        icon: MessageCircle,
                        title: 'Monitor Reviews', 
                        desc: 'Track and respond to customer reviews. Build your reputation.',
                        highlight: 'Real-Time Alerts'
                      },
                      { 
                        step: '4', 
                        icon: Newspaper,
                        title: 'CADE Auto-Posts', 
                        desc: 'Articles and FAQs are auto-shared to your GMB listing.',
                        highlight: 'Powered by CADE'
                      },
                    ].map((item) => (
                      <div key={item.step} className="relative p-5 rounded-xl bg-gradient-to-br from-blue-500/5 to-green-500/10 border border-blue-500/20 flex flex-col min-h-[180px]">
                        <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-green-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                          {item.step}
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3 mt-1">
                          <item.icon className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="font-semibold text-sm mb-2">{item.title}</p>
                        <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{item.desc}</p>
                        <Badge variant="outline" className="mt-3 w-fit text-[10px] text-blue-500 border-blue-500/30 bg-blue-500/5">
                          {item.highlight}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom row: Feature cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: BarChart3, label: 'Performance Insights', desc: 'Track views, calls, direction requests, and website clicks for each location', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                  { icon: Star, label: 'Review Management', desc: 'Monitor ratings, respond to reviews, and build your online reputation', color: 'text-green-500', bgColor: 'bg-green-500/10' },
                  { icon: TrendingUp, label: 'Local SEO Boost', desc: 'Consistent GMB activity signals freshness to Google, boosting local rankings', color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
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

              {/* Local SEO Stats & Benefits Section */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/5 via-transparent to-green-500/5 border border-blue-500/10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-green-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Why Google Business Profile Matters</h3>
                    <p className="text-xs text-muted-foreground">Local search dominance starts here</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  {[
                    { stat: '46%', label: 'of Google searches', sublabel: 'have local intent' },
                    { stat: '88%', label: 'of mobile searches', sublabel: 'visit within 24hrs' },
                    { stat: '76%', label: 'of local searches', sublabel: 'visit a business' },
                    { stat: '28%', label: 'local searches', sublabel: 'result in purchase' },
                  ].map((item, i) => (
                    <div key={i} className="text-center p-4 rounded-xl bg-background/50 border border-border">
                      <p className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">{item.stat}</p>
                      <p className="text-xs text-foreground font-medium mt-1">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.sublabel}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-background/30">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Appear in the Local 3-Pack</p>
                      <p className="text-xs text-muted-foreground">Active GMB listings rank higher in Google's coveted local map results</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-background/30">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Build Trust with Reviews</p>
                      <p className="text-xs text-muted-foreground">Businesses with 40+ reviews earn 15% more customer trust than competitors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-background/30">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Drive Foot Traffic & Calls</p>
                      <p className="text-xs text-muted-foreground">Optimized profiles get 7x more clicks than incomplete listings</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-background/30">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">CADE-Powered Automation</p>
                      <p className="text-xs text-muted-foreground">Automatic FAQ and article posts keep your listing fresh and engaging</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Connected State */
            <div className="space-y-6">
              {/* Compact Header Row */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">Google Business Profile</h2>
                      {selectedDomainInGmb ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Connected
                        </span>
                      ) : gmbAccounts.length > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">
                          <Globe className="w-3 h-3" />
                          Account Linked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Setup Required
                        </span>
                      )}
                    </div>
                    {(selectedTrackedDomain || selectedDomainKey) && (
                      <p className="text-sm text-muted-foreground">{selectedTrackedDomain || selectedDomainKey}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    sessionStorage.removeItem('gmb_access_token');
                    sessionStorage.removeItem('gmb_cooldown_until');
                    setGmbAuthenticated(false);
                    setGmbAccounts([]);
                    setGmbLocations([]);
                    setGmbOnboardingStep(0);
                    toast.success('Disconnected from Google Business Profile');
                  }}
                >
                  Disconnect
                </Button>
              </div>
              
              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Domain Status */}
                <div className="flex flex-col">
                  {/* Domain Not Found Card */}
                  {(selectedTrackedDomain || selectedDomainKey) && !selectedDomainInGmb && gmbOnboardingStep === 0 && (
                    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 overflow-hidden flex-1 flex flex-col">
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                            <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base">Domain Not Linked</h3>
                            <p className="text-xs text-muted-foreground">No matching Business Profile found</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          <span className="font-medium text-foreground">{selectedTrackedDomain || selectedDomainKey}</span> isn't connected to any of your Google Business Profile locations.
                        </p>
                        <Button
                          onClick={() => setGmbOnboardingStep(1)}
                          size="sm"
                          className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Business to Google Maps
                        </Button>
                      </div>
                      
                      {/* Simulated Google Maps Listing Preview */}
                      <div className="border-t border-amber-500/20 bg-background/40 p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />
                          Preview of your listing on Google Maps
                        </p>
                        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
                          {/* Map placeholder */}
                          <div className="h-32 bg-gradient-to-br from-blue-100 to-green-50 dark:from-blue-950/30 dark:to-green-950/20 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                              {/* Stylized map grid lines */}
                              <div className="absolute inset-0 opacity-20">
                                <div className="grid grid-cols-6 h-full">
                                  {[...Array(6)].map((_, i) => (
                                    <div key={i} className="border-r border-muted-foreground/20" />
                                  ))}
                                </div>
                                <div className="absolute inset-0 grid grid-rows-4">
                                  {[...Array(4)].map((_, i) => (
                                    <div key={i} className="border-b border-muted-foreground/20" />
                                  ))}
                                </div>
                              </div>
                              {/* Center pin */}
                              <div className="relative z-10">
                                <div className="w-8 h-8 rounded-full bg-red-500 shadow-lg flex items-center justify-center animate-pulse">
                                  <MapPin className="w-5 h-5 text-white" />
                                </div>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45" />
                              </div>
                            </div>
                          </div>
                          {/* Listing card */}
                          <div className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                                <Building className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">Your Business Name</p>
                                <p className="text-xs text-muted-foreground">Business Category</p>
                                <div className="flex items-center gap-1 mt-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  ))}
                                  <span className="text-xs text-muted-foreground ml-1">(0 reviews)</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {selectedTrackedDomain || selectedDomainKey}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                          This is a preview. Your actual listing will appear on Google Maps after verification.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Domain Linked Success Card */}
                  {selectedDomainInGmb && (
                    <div className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5 overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center">
                            <CheckCircle className="w-4.5 h-4.5 text-green-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base">Domain Linked</h3>
                            <p className="text-xs text-muted-foreground">Business Profile found</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-background/60 rounded-lg border border-border">
                          <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{selectedDomainInGmb.title}</p>
                            {selectedDomainInGmb.storefrontAddress && (
                              <p className="text-xs text-muted-foreground truncate">
                                {selectedDomainInGmb.storefrontAddress.locality}, {selectedDomainInGmb.storefrontAddress.administrativeArea}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Business Accounts */}
                  {gmbAccounts.length > 0 && gmbOnboardingStep === 0 && (
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="px-5 py-3 border-b border-border bg-muted/30">
                        <h3 className="text-sm font-medium">Your Business Accounts</h3>
                      </div>
                      <div className="p-3 space-y-2">
                        {gmbAccounts.map((account) => (
                          <div
                            key={account.name}
                            onClick={() => setSelectedGmbAccount(account.name)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedGmbAccount === account.name
                                ? 'border-primary bg-primary/5'
                                : 'border-transparent hover:border-border hover:bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center">
                                  <Building className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{account.accountName}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{account.type.replace('_', ' ')}</p>
                                </div>
                              </div>
                              {selectedGmbAccount === account.name && (
                                <CheckCircle className="w-4 h-4 text-primary" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - API Status / Actions */}
                <div className="flex flex-col">
                  {/* Quota Error Card */}
                  {gmbOnboardingStep === 0 && gmbAccounts.length === 0 && (gmbSyncError?.includes('429') || gmbSyncError?.includes('quota') || gmbSyncError?.includes('Quota')) && (
                    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 overflow-hidden flex-1 flex flex-col">
                      <div className="px-5 py-3 border-b border-amber-500/20 bg-amber-500/5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <h3 className="font-semibold text-sm">API Access Required</h3>
                        </div>
                      </div>
                      <div className="p-5 space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Your Google Cloud project needs API quota approval for Business Profile APIs.
                        </p>
                        
                        <div className="bg-background/60 rounded-lg p-4 space-y-2 text-sm">
                          <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">Setup Steps</p>
                          <ol className="space-y-2 text-muted-foreground">
                            <li className="flex gap-2">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                              <span>Open <a href="https://support.google.com/business/contact/business_profile_apis_contact_form" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">GBP API Contact Form</a></span>
                            </li>
                            <li className="flex gap-2">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                              <span>Select <strong className="text-foreground">"Quota Increase Request"</strong></span>
                            </li>
                            <li className="flex gap-2">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                              <span>Project #: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">1002415062213</code></span>
                            </li>
                            <li className="flex gap-2">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                              <span>Wait 24-48 hours for approval</span>
                            </li>
                          </ol>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => window.open('https://support.google.com/business/contact/business_profile_apis_contact_form', '_blank')}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          >
                            Open GBP Form
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              sessionStorage.removeItem('gmb_cooldown_until');
                              const token = sessionStorage.getItem('gmb_access_token');
                              if (token) {
                                toast.info('Retrying sync...');
                                applyGmbToken(token);
                              }
                            }}
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                            Retry
                          </Button>
                        </div>
                        
                        {gmbLastSyncAt && (
                          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                            Last attempt: {new Date(gmbLastSyncAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* No Accounts Found - Non-quota error */}
                  {gmbOnboardingStep === 0 && gmbAccounts.length === 0 && !(gmbSyncError?.includes('429') || gmbSyncError?.includes('quota') || gmbSyncError?.includes('Quota')) && (
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="p-8 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <Building className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium mb-1">No Business Accounts Found</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
                          The connected Google account doesn't have access to any Business Profiles.
                        </p>
                        {gmbSyncError && (
                          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-left mb-4 max-w-sm mx-auto">
                            <p className="text-xs font-medium text-foreground mb-1">Details</p>
                            <p className="text-xs text-muted-foreground break-words">{gmbSyncError}</p>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            sessionStorage.removeItem('gmb_access_token');
                            sessionStorage.removeItem('gmb_token_expiry');
                            sessionStorage.removeItem('gmb_cooldown_until');
                            setGmbAuthenticated(false);
                            setGmbAccounts([]);
                            setGmbLocations([]);
                            setGmbOnboardingStep(0);
                            toast.message('Disconnected. Please reconnect with the correct Google account.');
                          }}
                        >
                          Disconnect & Reconnect
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions when accounts exist */}
                  {gmbAccounts.length > 0 && gmbOnboardingStep === 0 && !selectedDomainInGmb && (
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="px-5 py-3 border-b border-border bg-muted/30">
                        <h3 className="text-sm font-medium">Quick Actions</h3>
                      </div>
                      <div className="p-4 space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setGmbOnboardingStep(1)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add New Business Location
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-muted-foreground"
                          onClick={() => {
                            const token = sessionStorage.getItem('gmb_access_token');
                            if (token) {
                              toast.info('Refreshing...');
                              applyGmbToken(token);
                            }
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh Locations
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Panel - Full Width Below Grid */}
              {selectedDomainInGmb && (
                <GMBPerformancePanel
                  accessToken={sessionStorage.getItem('gmb_access_token') || ''}
                  locationName={selectedDomainInGmb.name}
                  locationTitle={selectedDomainInGmb.title}
                />
              )}

              {/* Onboarding Wizard */}
              {gmbOnboardingStep > 0 && (
                <GMBOnboardingWizard
                  domain={selectedTrackedDomain || selectedDomainKey}
                  accessToken={sessionStorage.getItem('gmb_access_token') || ''}
                  accountId={selectedGmbAccount}
                  accounts={gmbAccounts}
                  onComplete={async () => {
                    setGmbOnboardingStep(0);
                    const accessToken = sessionStorage.getItem('gmb_access_token');
                    if (accessToken) {
                      toast.info('Refreshing business locations...');
                      await applyGmbToken(accessToken);
                      toast.success('Business listing created! It may take a few minutes to appear in Google Maps.');
                    } else {
                      toast.success('Business listing process completed');
                    }
                  }}
                  onCancel={() => {
                    setGmbOnboardingStep(0);
                  }}
                />
              )}

              {/* All Locations for Domain - Grid below main content */}
              {gmbLocationsForSelectedDomain.length > 0 && gmbOnboardingStep === 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Locations for {selectedTrackedDomain || selectedDomainKey || 'selected domain'} ({gmbLocationsForSelectedDomain.length})
                    </h3>
                    <p className="text-xs text-muted-foreground">Click a location to view performance</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {gmbLocationsForSelectedDomain.map((location) => {
                      const isMatchedToDomain = selectedDomainInGmb?.name === location.name;
                      const isSelected = selectedGmbLocation === location.name;
                      return (
                        <div
                          key={location.name}
                          onClick={() => setSelectedGmbLocation(isSelected ? null : location.name)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : isMatchedToDomain
                              ? 'border-green-500 bg-green-500/5 hover:bg-green-500/10'
                              : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <MapPin className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-primary' : isMatchedToDomain ? 'text-green-500' : 'text-muted-foreground'}`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium">{location.title}</p>
                                {isMatchedToDomain && (
                                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                                    Matched to {selectedTrackedDomain || selectedDomainKey}
                                  </Badge>
                                )}
                                {isSelected && (
                                  <Badge variant="outline" className="text-xs">
                                    Viewing
                                  </Badge>
                                )}
                              </div>
                              {location.storefrontAddress && (
                                <p className="text-sm text-muted-foreground">
                                  {location.storefrontAddress.locality}, {location.storefrontAddress.administrativeArea}
                                </p>
                              )}
                              {location.websiteUri && (
                                <p className="text-xs text-primary mt-1">{location.websiteUri}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Performance Panel for Selected Location */}
                  {selectedGmbLocation && (
                    <div className="pt-4">
                      <GMBPerformancePanel
                        accessToken={sessionStorage.getItem('gmb_access_token') || ''}
                        locationName={selectedGmbLocation}
                        locationTitle={gmbLocations.find(l => l.name === selectedGmbLocation)?.title || 'Business Location'}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Coming Soon Footer */}
              {gmbOnboardingStep === 0 && (
                <div className="pt-6 border-t border-border">
                  <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
                    Full GMB Management Coming Soon
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Review responses, post updates, and analytics will be available in the next update.
                  </p>
                </div>
              )}

              {/* Extended Content Section */}
              <GMBExtendedSection domain={selectedTrackedDomain || selectedDomainKey} />
            </div>
          )}
        </div>
      )}

      {/* Social Signals Tab Content */}
      {activeTab === 'social-signals' && (
        <div className="max-w-[1480px] mx-auto bg-card rounded-b-xl border-x border-b border-border p-8 glow-primary">
          <div className="space-y-6">
            {/* Title Header */}
            <header className="flex items-start justify-between gap-4 relative overflow-hidden">
              {/* Network Nodes & Connections - Social Signals */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Glowing network nodes */}
                <div className="absolute w-3 h-3 rounded-full bg-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.5)] animate-[pulse_2s_ease-in-out_infinite] top-2 left-[10%]" />
                <div className="absolute w-2 h-2 rounded-full bg-rose-400/40 shadow-[0_0_8px_rgba(251,113,133,0.4)] animate-[pulse_2.3s_ease-in-out_infinite_0.3s] top-6 left-[28%]" />
                <div className="absolute w-2.5 h-2.5 rounded-full bg-pink-400/45 shadow-[0_0_10px_rgba(244,114,182,0.4)] animate-[pulse_1.8s_ease-in-out_infinite_0.6s] top-3 left-[48%]" />
                <div className="absolute w-2 h-2 rounded-full bg-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-[pulse_2.5s_ease-in-out_infinite_0.9s] top-5 left-[65%]" />
                <div className="absolute w-3 h-3 rounded-full bg-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.4)] animate-[pulse_2s_ease-in-out_infinite_1.2s] top-1 left-[80%]" />
                {/* Connection lines between nodes */}
                <svg className="absolute inset-0 w-full h-full opacity-30">
                  <line x1="12%" y1="30%" x2="28%" y2="70%" stroke="url(#pinkGradient)" strokeWidth="1" className="animate-[pulse_3s_ease-in-out_infinite]" />
                  <line x1="28%" y1="70%" x2="48%" y2="40%" stroke="url(#pinkGradient)" strokeWidth="1" className="animate-[pulse_3s_ease-in-out_infinite_0.5s]" />
                  <line x1="48%" y1="40%" x2="65%" y2="60%" stroke="url(#pinkGradient)" strokeWidth="1" className="animate-[pulse_3s_ease-in-out_infinite_1s]" />
                  <line x1="65%" y1="60%" x2="80%" y2="20%" stroke="url(#pinkGradient)" strokeWidth="1" className="animate-[pulse_3s_ease-in-out_infinite_1.5s]" />
                  <defs>
                    <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgb(236,72,153)" stopOpacity="0.5" />
                      <stop offset="50%" stopColor="rgb(244,114,182)" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="rgb(251,113,133)" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shrink-0">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">Social Signals</h2>
                    <span className="px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-pink-400 animate-pulse" />
                      <span className="text-[10px] font-semibold text-pink-400 uppercase tracking-wide">Coming Soon</span>
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    Automated social media posting powered by CADE. Every new blog post and FAQ drop is shared across your connected X, LinkedIn, and Facebook profiles.
                  </p>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
                {/* Trust Badges */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/40 shadow-sm hover:scale-105 hover:shadow-amber-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-[7px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 whitespace-nowrap">1,000+ CEOs</span>
                  </div>
                  <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-slate-500/20 to-zinc-600/20 border border-slate-500/40 shadow-sm hover:scale-105 hover:shadow-slate-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                    <Building className="w-4 h-4 text-slate-500" />
                    <span className="text-[7px] font-bold text-slate-600 dark:text-slate-400 mt-0.5 whitespace-nowrap">100+ Partners</span>
                  </div>
                  <div className="flex flex-col items-center justify-center px-2 h-11 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/40 shadow-sm hover:scale-105 hover:shadow-violet-500/30 hover:shadow-md transition-all duration-300 cursor-default">
                    <Sparkles className="w-4 h-4 text-violet-500 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    <span className="text-[7px] font-bold text-violet-600 dark:text-violet-400 mt-0.5 whitespace-nowrap">Agentic AI</span>
                  </div>
                </div>
                {/* Feature Pills - Row 1 */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                    <Zap className="w-2.5 h-2.5 text-pink-500" />
                    <span className="text-[9px] font-medium text-pink-600 dark:text-pink-400">Auto-Post</span>
                  </div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                    <Twitter className="w-2.5 h-2.5 text-sky-500" />
                    <span className="text-[9px] font-medium text-sky-600 dark:text-sky-400">3 Platforms</span>
                  </div>
                </div>
                {/* Feature Pills - Row 2 */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:scale-105 transition-all duration-200 cursor-default">
                    <Bell className="w-2.5 h-2.5 text-rose-500" />
                    <span className="text-[9px] font-medium text-rose-600 dark:text-rose-400">Engagement</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Top row: Header section + How It Works grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left - Connect section */}
              <div className="lg:col-span-4">
                <div className="h-full p-6 rounded-xl border-2 border-dashed border-pink-500/30 bg-pink-500/5">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-5 h-5 text-pink-500" />
                      <h3 className="text-lg font-semibold">Connect Accounts</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">
                      Link your social media accounts to enable automated posting when CADE publishes new content.
                    </p>
                    <Badge variant="outline" className="w-fit text-violet-500 border-violet-500/30 bg-violet-500/10">
                      Activates with CADE
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-3">
                      Connect once—CADE handles the rest automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right - How It Works */}
              <div className="lg:col-span-8">
                <h3 className="text-lg font-semibold mb-4">How It Works</h3>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    { 
                      step: '1', 
                      icon: Twitter,
                      title: 'Connect Platforms', 
                      desc: 'Link your X (Twitter), LinkedIn, and Facebook accounts securely with OAuth authentication.',
                      highlight: 'One-Time Setup'
                    },
                    { 
                      step: '2', 
                      icon: FileText,
                      title: 'CADE Creates Content', 
                      desc: 'When CADE publishes new blog posts or FAQ drops, social posts are automatically generated.',
                      highlight: 'AI-Generated'
                    },
                    { 
                      step: '3', 
                      icon: Zap,
                      title: 'Instant Publishing', 
                      desc: 'Posts go live across all platforms simultaneously the moment new content is published.',
                      highlight: 'Real-Time'
                    },
                    { 
                      step: '4', 
                      icon: TrendingUp,
                      title: 'Drive Traffic Back', 
                      desc: 'Social posts include links that drive engagement and traffic back to your fresh content.',
                      highlight: 'Traffic Boost'
                    },
                  ].map((item) => (
                    <div key={item.step} className="relative p-5 rounded-xl bg-gradient-to-br from-pink-500/5 to-rose-500/10 border border-pink-500/20 flex flex-col min-h-[180px]">
                      <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                        {item.step}
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center mb-3 mt-1">
                        <item.icon className="w-5 h-5 text-pink-500" />
                      </div>
                      <p className="font-semibold text-sm mb-2">{item.title}</p>
                      <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{item.desc}</p>
                      <Badge variant="outline" className="mt-3 w-fit text-[10px] text-pink-500 border-pink-500/30 bg-pink-500/5">
                        {item.highlight}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom row: Platform cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Twitter, label: 'X (Twitter)', desc: 'Auto-post new articles with hashtags, excerpts, and engaging copy tailored for X audiences', color: 'text-sky-500', bgColor: 'bg-sky-500/10' },
                { icon: Linkedin, label: 'LinkedIn', desc: 'Professional posts to your company page with business-appropriate messaging', color: 'text-blue-600', bgColor: 'bg-blue-600/10' },
                { icon: Facebook, label: 'Facebook', desc: 'Engaging posts with images to your business page for maximum reach', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
              ].map((platform) => (
                <div key={platform.label} className="p-5 rounded-xl bg-muted/30 border border-border flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg ${platform.bgColor} flex items-center justify-center shrink-0`}>
                    <platform.icon className={`w-5 h-5 ${platform.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">{platform.label}</p>
                    <p className="text-xs text-muted-foreground">{platform.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Extended Content Section */}
            <SocialSignalsExtendedSection domain={selectedTrackedDomain || selectedDomainKey} />
          </div>
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
          
          {/* Extended Content Section */}
          <PPCLandingPagesExtendedSection domain={selectedTrackedDomain || selectedDomainKey} />
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
