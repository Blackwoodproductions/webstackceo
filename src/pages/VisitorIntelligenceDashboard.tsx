import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  DollarSign, ArrowRight, Eye, Zap, Activity, X, Filter, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Sun, Moon, MessageCircle, Calendar as CalendarIcon, User as UserIcon, FlaskConical, Search, AlertTriangle, Code, Download, Globe, Plus, Shield, MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import SEO from '@/components/SEO';
import { generateAPIDocs } from '@/lib/generateAPIDocs';
import { InlineSEOReport } from '@/components/audit/InlineSEOReport';

import VisitorFlowDiagram, { VisitorFlowSummary, TimeRange } from '@/components/marketing/VisitorFlowDiagram';
import { GSCDashboardPanel } from '@/components/marketing/GSCDashboardPanel';
import { GADashboardPanel } from '@/components/marketing/GADashboardPanel';
import { GAMetricsBoxes } from '@/components/marketing/GAMetricsBoxes';
import FloatingChatBar from '@/components/marketing/FloatingChatBar';
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

// Dynamic iframe component that resizes based on content height
const CaseStudyIframe = ({ domain }: { domain: string }) => {
  const [iframeHeight, setIframeHeight] = useState(800); // Start smaller
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'iframe-height' && typeof event.data.height === 'number') {
        // Set exact height with no extra padding
        setIframeHeight(event.data.height);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  const slug = domain.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  
  return (
    <iframe
      key={`case-study-iframe-${domain}`}
      src={`/case-study/${slug}?embed=true`}
      className="w-full border-0"
      style={{ height: `${iframeHeight}px`, minHeight: '400px' }}
      scrolling="no"
      title="SEO Case Study"
    />
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
  type DashboardTab = 'visitor-intelligence' | 'seo-audit' | 'bron' | 'cade' | 'gmb' | 'landing-pages';
  const [activeTab, setActiveTab] = useState<DashboardTab>('visitor-intelligence');
  
  // GMB (Google My Business) state
  const [gmbAuthenticated, setGmbAuthenticated] = useState<boolean>(false);
  const [gmbConnecting, setGmbConnecting] = useState(false);
  const [gmbAccounts, setGmbAccounts] = useState<{ name: string; accountName: string; type: string }[]>([]);
  const [gmbLocations, setGmbLocations] = useState<{ name: string; title: string; websiteUri?: string; storefrontAddress?: { locality?: string; administrativeArea?: string } }[]>([]);
  const [selectedGmbAccount, setSelectedGmbAccount] = useState<string | null>(null);
  const [gmbOnboardingStep, setGmbOnboardingStep] = useState<number>(0);

  const applyGmbToken = useCallback(async (accessToken: string, expiresIn?: number) => {
    const safeExpiresIn = Number(expiresIn ?? 3600);
    const expiry = Date.now() + safeExpiresIn * 1000;

    sessionStorage.setItem('gmb_access_token', accessToken);
    sessionStorage.setItem('gmb_token_expiry', expiry.toString());

    setGmbAuthenticated(true);

    // Fetch GMB accounts
    try {
      const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        if (accountsData.accounts && Array.isArray(accountsData.accounts)) {
          setGmbAccounts(accountsData.accounts.map((a: any) => ({
            name: a.name,
            accountName: a.accountName || a.name?.split('/').pop() || 'Business Account',
            type: a.type || 'PERSONAL',
          })));
        }
      }
    } catch (accountErr) {
      console.error('[GMB] Failed to fetch accounts:', accountErr);
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
    const currentDomain = (selectedTrackedDomain || selectedDomainKey).toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    if (!currentDomain || !gmbLocations.length) return null;
    
    return gmbLocations.find(loc => {
      if (!loc.websiteUri) return false;
      const locDomain = loc.websiteUri.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      return locDomain === currentDomain || locDomain.includes(currentDomain) || currentDomain.includes(locDomain);
    });
  }, [selectedTrackedDomain, selectedDomainKey, gmbLocations]);

  // Fetch saved audit for selected domain when tab changes or domain changes
  useEffect(() => {
    const fetchAuditForDomain = async () => {
      const domainToCheck = selectedTrackedDomain || selectedDomainKey;
      
      // If no domain selected but we're on seo-audit tab, try to load the most recent audit
      if (activeTab !== 'seo-audit') {
        setSavedAuditForDomain(null);
        return;
      }
      
      setIsLoadingAudit(true);
      try {
        let query = supabase
          .from('saved_audits')
          .select('id, domain, slug, site_title, domain_rating, organic_traffic, organic_keywords, backlinks, referring_domains, traffic_value, created_at');
        
        if (domainToCheck) {
          // Clean the domain for matching
          const cleanDomain = domainToCheck.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
          query = query.ilike('domain', cleanDomain);
        } else {
          // No domain selected - get most recent audit
          query = query.order('created_at', { ascending: false }).limit(1);
        }
        
        const { data, error } = await query.maybeSingle();
        
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
  }, [selectedTrackedDomain, selectedDomainKey, activeTab]);

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
        // Refresh the audit data if we're on the SEO Audit tab
        if (activeTab === 'seo-audit') {
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

  // Persist chat online status
  useEffect(() => {
    localStorage.setItem('chat_operator_online', String(chatOnline));
  }, [chatOnline]);

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

  // Track new chats for notification badge
  useEffect(() => {
    if (sidebarChats.length > prevChatCount && prevChatCount > 0) {
      // New chat arrived
      playNotificationSound();
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
        const raw = localStorage.getItem('gsc_google_profile') || sessionStorage.getItem('gsc_google_profile');
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
      setGmbAuthenticated(true);
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
              window.opener.postMessage(
                { type: 'gmb-oauth-success', accessToken: tokenJson.access_token, expiresIn },
                window.location.origin
              );
              try {
                window.close();
                return;
              } catch {
                // ignore
              }
            }

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
  }, []);

  // Receive OAuth token from popup without navigating away
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as any;
      if (data?.type !== 'gmb-oauth-success' || !data?.accessToken) return;

      setGmbConnecting(true);
      Promise.resolve(applyGmbToken(String(data.accessToken), Number(data.expiresIn ?? 3600)))
        .then(() => toast.success('Connected to Google Business Profile'))
        .catch((err) => {
          console.error('[GMB] Popup OAuth apply error:', err);
          toast.error('Failed to finish Google Business Profile connection');
        })
        .finally(() => setGmbConnecting(false));
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
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
    <div className="min-h-screen bg-background relative animate-fade-in pt-4 px-6 md:px-10 lg:px-16">
      <SEO 
        title="Visitor Intelligence Dashboard | Webstack.ceo"
        description="Real-time visitor intelligence and analytics dashboard"
        canonical="/visitor-intelligence-dashboard"
      />

      {/* Header with integrated tabs */}
      <header className="border border-border bg-card rounded-t-xl max-w-[1530px] mx-auto">
        <div className="px-8 py-3 flex items-center justify-between relative">
          {/* Left: Logo + Tabs grouped together */}
          <div className="flex items-end gap-4">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity group mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center relative group-hover:from-amber-400/20 group-hover:to-yellow-500/20 group-hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] group-hover:scale-110 transition-all duration-700">
                <Shield className="w-7 h-7 text-primary group-hover:text-amber-400 transition-colors duration-700" />
                <span className="absolute font-bold text-[9px] tracking-tight text-primary group-hover:text-amber-400 transition-all duration-700">AI</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground leading-tight">
                  webstack<span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500 group-hover:from-amber-400 group-hover:to-yellow-500 transition-all duration-500">.ceo</span>
                </span>
                <span className="text-[9px] text-muted-foreground tracking-wide">
                  by Blackwood Productions
                </span>
              </div>
            </a>
          
            {/* Tabs Navigation - left-justified after logo */}
            <div className="flex items-end gap-0 -mb-3">
            {[
              { id: 'visitor-intelligence' as DashboardTab, label: 'Visitor Intelligence', icon: Eye },
              { id: 'seo-audit' as DashboardTab, label: (inlineAuditData || savedAuditForDomain) ? 'Case Study' : 'SEO Audit', icon: Search },
              { id: 'bron' as DashboardTab, label: 'BRON', icon: TrendingUp },
              { id: 'cade' as DashboardTab, label: 'CADE', icon: FileText },
              { id: 'gmb' as DashboardTab, label: 'GMB', icon: MapPin },
              { id: 'landing-pages' as DashboardTab, label: 'Landing Pages', icon: Target },
            ].map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ zIndex: activeTab === tab.id ? 10 : 5 - index }}
                className={`relative flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-all rounded-t-lg border-t border-x ${
                  activeTab === tab.id
                    ? 'bg-background text-primary border-border translate-y-px'
                    : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent -ml-2 first:ml-0'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {/* Active tab bottom cover */}
                {activeTab === tab.id && (
                  <span className="absolute -bottom-px left-0 right-0 h-px bg-background" />
                )}
              </button>
            ))}
            </div>
          </div>
          
          {/* Right: User Controls */}
          <div className="flex items-center gap-4">
            {gscAuthenticated && gscProfile?.picture ? (
              <div className="hidden md:flex items-center gap-2">
                <img
                  src={gscProfile.picture}
                  alt={gscProfile.name ? `${gscProfile.name} profile photo` : 'Google profile photo'}
                  className="w-7 h-7 rounded-full object-cover border border-border"
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
              className="w-9 h-9 p-0"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

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
        onPageFilterClear={() => setPageFilter(null)}
        rightContent={activeTab === 'visitor-intelligence' ? (
          <>
            {/* API Docs Download */}
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
            
            <div className="flex items-center gap-2">
              <Switch
                id="chat-online"
                checked={chatOnline}
                onCheckedChange={setChatOnline}
                className="data-[state=checked]:bg-green-500"
              />
              <Label htmlFor="chat-online" className="text-xs text-muted-foreground">
                {chatOnline ? 'Online' : 'Offline'}
              </Label>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChatPanelOpen(!chatPanelOpen)}
              className="relative"
            >
              <MessageCircle className="w-5 h-5" />
              {sidebarChats.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {sidebarChats.length}
                </span>
              )}
            </Button>
          </>
        ) : activeTab === 'seo-audit' ? (
          <>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Domain: {selectedTrackedDomain || selectedDomainKey || 'None selected'}
            </Badge>
          </>
        ) : undefined}
      />

      {/* Main Layout - Only show for Visitor Intelligence tab */}
      {activeTab === 'visitor-intelligence' && (
      <div className="flex min-h-[calc(100vh-180px)] max-w-[1530px] mx-auto bg-card rounded-b-xl border-x border-b border-border">
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
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
                <Card key={step.label} className="p-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${step.color} flex-shrink-0`}>
                      <step.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-foreground leading-tight">{step.count.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{step.label}</p>
                    </div>
                  </div>
                  {conversionFromPrev && (
                    <div className="mt-2 text-[10px] text-muted-foreground">
                      <span className="text-foreground font-medium">{conversionFromPrev}%</span> from prev
                    </div>
                  )}
                </Card>
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
            <div className="flex items-stretch gap-3 mb-4 p-2 rounded-xl bg-secondary/30 border border-border/50">
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
                  { label: 'Open', count: funnelStats.leads - funnelStats.closedLeads, dotColor: 'bg-blue-500', activeClass: 'bg-blue-500/20 border-blue-500/50' },
                  { label: 'Named', count: funnelStats.withName, dotColor: 'bg-amber-500', activeClass: 'bg-amber-500/20 border-amber-500/50' },
                  { label: 'Qualified', count: funnelStats.withCompanyInfo, dotColor: 'bg-orange-500', activeClass: 'bg-orange-500/20 border-orange-500/50' },
                  { label: 'Closed', count: funnelStats.closedLeads, dotColor: 'bg-green-500', activeClass: 'bg-green-500/20 border-green-500/50' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setExpandedStatFilter(expandedStatFilter === item.label ? null : item.label)}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
                      expandedStatFilter === item.label 
                        ? item.activeClass 
                        : 'bg-background/60 border-border/30 hover:border-border/50'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${item.dotColor}`} />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="font-bold text-sm">{Math.max(0, item.count)}</span>
                    <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${expandedStatFilter === item.label ? 'rotate-180' : ''}`} />
                  </button>
                ))}
                <button
                  onClick={handleCreateTestLead}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-background/60 border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 transition-colors"
                  title="Create a test lead for demo purposes"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span className="text-xs">Test Lead</span>
                </button>
              </div>
            </div>

            {/* Expanded Stat Filter Panel */}
            {expandedStatFilter && (
              <div className="mb-4 p-4 rounded-xl bg-secondary/30 border border-border/50 animate-accordion-down">
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
                onClick={() => setChatPanelOpen(!chatPanelOpen)}
                className="flex items-center justify-center gap-2 p-3 cursor-pointer"
              >
                <div className="relative">
                  {chatOnline ? (
                    <>
                      <MessageCircle className="w-5 h-5 text-cyan-500/30 absolute inset-0 animate-ping" />
                      <MessageCircle className="w-5 h-5 text-cyan-500 relative" />
                    </>
                  ) : (
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                  {chatOnline && sidebarChats.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                      {sidebarChats.length > 9 ? '9+' : sidebarChats.length}
                    </span>
                  )}
                </div>
                {chatPanelOpen && (
                  <span className="text-sm font-medium text-foreground">Live Chats</span>
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
      )}

      {/* SEO Audit Tab Content - Case Study via iframe */}
      {activeTab === 'seo-audit' && (
        <div className="max-w-[1530px] mx-auto bg-card rounded-b-xl border-x border-b border-border overflow-hidden">
          {isLoadingAudit || isRunningAudit ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Analyzing domain...</p>
            </div>
          ) : (selectedTrackedDomain || selectedDomainKey || savedAuditForDomain?.domain) ? (
            /* Embed Case Study page via iframe */
            <div className="relative">
              {/* Action bar above iframe */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Search className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Case Study</h3>
                    <p className="text-xs text-muted-foreground">
                      {savedAuditForDomain?.domain || selectedTrackedDomain || selectedDomainKey}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const domainToAudit = savedAuditForDomain?.domain || selectedTrackedDomain || selectedDomainKey;
                      if (!domainToAudit) return;
                      
                      setIsRunningAudit(true);
                      try {
                        const { data, error } = await supabase.functions.invoke('domain-audit', {
                          body: { domain: domainToAudit }
                        });
                        if (error) throw error;
                        
                        const ahrefsData = data?.ahrefs || data;
                        const slug = domainToAudit.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                        await supabase.from('saved_audits').upsert({
                          domain: domainToAudit,
                          slug,
                          domain_rating: ahrefsData?.domainRating ?? null,
                          organic_traffic: ahrefsData?.organicTraffic ?? null,
                          organic_keywords: ahrefsData?.organicKeywords ?? null,
                          backlinks: ahrefsData?.backlinks ?? null,
                          referring_domains: ahrefsData?.referringDomains ?? null,
                          traffic_value: ahrefsData?.trafficValue ?? null,
                          ahrefs_rank: ahrefsData?.ahrefsRank ?? null,
                        }, { onConflict: 'slug' });
                        
                        // Also save to audit_history for progress tracking
                        await supabase.from('audit_history').insert({
                          domain: domainToAudit,
                          domain_rating: ahrefsData?.domainRating ?? null,
                          organic_traffic: ahrefsData?.organicTraffic ?? null,
                          organic_keywords: ahrefsData?.organicKeywords ?? null,
                          backlinks: ahrefsData?.backlinks ?? null,
                          referring_domains: ahrefsData?.referringDomains ?? null,
                          traffic_value: ahrefsData?.trafficValue ?? null,
                          ahrefs_rank: ahrefsData?.ahrefsRank ?? null,
                        });
                        
                        toast.success('Audit refreshed and saved');
                        // Refresh the iframe by forcing re-render
                        setSavedAuditForDomain(prev => prev ? { ...prev } : prev);
                      } catch (err) {
                        console.error('Failed to refresh audit:', err);
                        toast.error('Failed to refresh audit');
                      } finally {
                        setIsRunningAudit(false);
                      }
                    }}
                    className="gap-1.5"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isRunningAudit && "animate-spin")} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link 
                      to={`/case-study/${(savedAuditForDomain?.domain || selectedTrackedDomain || selectedDomainKey || '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                      target="_blank"
                      className="gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Open Full Page
                    </Link>
                  </Button>
                </div>
              </div>
              
              {/* Iframe container - dynamically sized based on content */}
              <CaseStudyIframe 
                domain={savedAuditForDomain?.domain || selectedTrackedDomain || selectedDomainKey || ''}
              />
            </div>
          ) : (
            /* No domain selected - show input prompt */
            <div className="p-8">
              <div className="max-w-2xl mx-auto text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-3">Run Your First SEO Audit</h2>
                <p className="text-muted-foreground mb-8">
                  Select a domain from the dropdown above or enter one to get a comprehensive SEO analysis including domain authority, backlinks, organic traffic, and actionable recommendations.
                </p>
                
                {inlineAuditError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    {inlineAuditError}
                  </div>
                )}
                
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const domainToAudit = auditDomainInput.trim();
                    if (!domainToAudit) return;
                    let cleanDomain = domainToAudit.toLowerCase();
                    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, "");
                    cleanDomain = cleanDomain.split("/")[0];
                    
                    setIsRunningAudit(true);
                    setInlineAuditError(null);
                    
                    try {
                      const { data, error } = await supabase.functions.invoke('domain-audit', {
                        body: { domain: cleanDomain }
                      });
                      
                      if (error) throw error;
                      
                      const ahrefsData = data?.ahrefs || data;
                      const slug = cleanDomain.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                      
                      // Save to saved_audits
                      await supabase.from('saved_audits').upsert({
                        domain: cleanDomain,
                        slug,
                        domain_rating: ahrefsData?.domainRating ?? null,
                        organic_traffic: ahrefsData?.organicTraffic ?? null,
                        organic_keywords: ahrefsData?.organicKeywords ?? null,
                        backlinks: ahrefsData?.backlinks ?? null,
                        referring_domains: ahrefsData?.referringDomains ?? null,
                        traffic_value: ahrefsData?.trafficValue ?? null,
                        ahrefs_rank: ahrefsData?.ahrefsRank ?? null,
                      }, { onConflict: 'slug' });
                      
                      // Also save to audit_history
                      await supabase.from('audit_history').insert({
                        domain: cleanDomain,
                        domain_rating: ahrefsData?.domainRating ?? null,
                        organic_traffic: ahrefsData?.organicTraffic ?? null,
                        organic_keywords: ahrefsData?.organicKeywords ?? null,
                        backlinks: ahrefsData?.backlinks ?? null,
                        referring_domains: ahrefsData?.referringDomains ?? null,
                        traffic_value: ahrefsData?.trafficValue ?? null,
                        ahrefs_rank: ahrefsData?.ahrefsRank ?? null,
                      });
                      
                      // Set states to show iframe
                      setSelectedTrackedDomain(cleanDomain);
                      setSelectedDomainKey(cleanDomain);
                      setSavedAuditForDomain({
                        id: '',
                        domain: cleanDomain,
                        slug,
                        site_title: null,
                        domain_rating: ahrefsData?.domainRating ?? null,
                        organic_traffic: ahrefsData?.organicTraffic ?? null,
                        organic_keywords: ahrefsData?.organicKeywords ?? null,
                        backlinks: ahrefsData?.backlinks ?? null,
                        referring_domains: ahrefsData?.referringDomains ?? null,
                        traffic_value: ahrefsData?.trafficValue ?? null,
                        created_at: new Date().toISOString(),
                      });
                      
                      toast.success(`Audit complete for ${cleanDomain}`);
                      setAuditDomainInput('');
                    } catch (err) {
                      console.error('[SEO Audit] Form error:', err);
                      setInlineAuditError('Failed to run audit. Please try again.');
                    } finally {
                      setIsRunningAudit(false);
                    }
                  }}
                  className="max-w-xl mx-auto"
                >
                  <div className="relative flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Enter domain (e.g., example.com)"
                        value={auditDomainInput}
                        onChange={(e) => setAuditDomainInput(e.target.value)}
                        className="pl-12 h-14 text-lg bg-background/80 backdrop-blur border-border/50 focus:border-primary/50"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isRunningAudit || !auditDomainInput.trim()}
                      className="h-14 px-8 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-lg"
                    >
                      {isRunningAudit ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Analyzing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Run Audit
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
                
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Instant • Comprehensive • Auto-saved</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BRON Tab Content */}
      {activeTab === 'bron' && (
        <div className="max-w-[1530px] mx-auto bg-card rounded-b-xl border-x border-b border-border p-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">BRON</h2>
            {(selectedTrackedDomain || selectedDomainKey) && (
              <p className="text-sm text-primary font-medium mb-2">
                Domain: {selectedTrackedDomain || selectedDomainKey}
              </p>
            )}
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Link building and content clustering automation. Build topical authority through the Diamond Flow methodology.
            </p>
            <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
              Coming Soon
            </Badge>
          </div>
        </div>
      )}

      {/* CADE Tab Content */}
      {activeTab === 'cade' && (
        <div className="max-w-[1530px] mx-auto bg-card rounded-b-xl border-x border-b border-border p-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">CADE</h2>
            {(selectedTrackedDomain || selectedDomainKey) && (
              <p className="text-sm text-primary font-medium mb-2">
                Domain: {selectedTrackedDomain || selectedDomainKey}
              </p>
            )}
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Content automation and topical authority signals. AI-powered content generation and optimization.
            </p>
            <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
              Coming Soon
            </Badge>
          </div>
        </div>
      )}

      {/* GMB (Google My Business) Tab Content */}
      {activeTab === 'gmb' && (
        <div className="max-w-[1530px] mx-auto bg-card rounded-b-xl border-x border-b border-border p-8">
          {!gmbAuthenticated ? (
            /* Not Connected State */
            <div className="text-center py-16 max-w-xl mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Connect Google Business Profile</h2>
              {(selectedTrackedDomain || selectedDomainKey) && (
                <p className="text-sm text-primary font-medium mb-2">
                  Domain: {selectedTrackedDomain || selectedDomainKey}
                </p>
              )}
              <p className="text-muted-foreground mb-8">
                Manage your Google My Business listings, respond to reviews, update business info, and track local SEO performance—all from one dashboard.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: MapPin, label: 'Manage Locations', desc: 'Update hours, address, photos' },
                  { icon: MessageCircle, label: 'Reviews', desc: 'Monitor & respond to reviews' },
                  { icon: BarChart3, label: 'Insights', desc: 'Track views, calls, directions' },
                ].map((feature) => (
                  <div key={feature.label} className="p-4 rounded-xl bg-muted/30 border border-border">
                    <feature.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="font-medium text-sm">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={async () => {
                  setGmbConnecting(true);
                  try {
                    // GMB API requires these scopes
                    const scopes = [
                      'https://www.googleapis.com/auth/business.manage',
                      'openid',
                      'profile',
                      'email'
                    ].join(' ');
                    
                    // Generate PKCE code verifier and challenge
                    const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
                    const encoder = new TextEncoder();
                    const data = encoder.encode(codeVerifier);
                    const digest = await crypto.subtle.digest('SHA-256', data);
                    const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
                      .replace(/\+/g, '-')
                      .replace(/\//g, '_')
                      .replace(/=+$/, '');
                    
                    // Store for callback
                    sessionStorage.setItem('gmb_code_verifier', codeVerifier);
                    sessionStorage.setItem('gmb_oauth_pending', 'true');
                    // Also store in localStorage so the verifier is available if we use a popup window
                    localStorage.setItem('gmb_code_verifier', codeVerifier);
                    localStorage.setItem('gmb_oauth_pending', 'true');
                    
                    // Reuse client ID from GSC/GA settings
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
                    authUrl.searchParams.set('prompt', 'consent');
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

                    // Fallback if popup blocked
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
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold px-8 py-6 text-lg"
              >
                {gmbConnecting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Connect Google Business Profile
                  </span>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground mt-4">
                Requires a Google account with access to at least one Business Profile
              </p>
            </div>
          ) : (
            /* Connected State */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Google Business Profile</h2>
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        Connected
                      </p>
                      {(selectedTrackedDomain || selectedDomainKey) && (
                        <Badge variant="outline" className="text-xs">
                          {selectedTrackedDomain || selectedDomainKey}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    sessionStorage.removeItem('gmb_access_token');
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
              
              {/* Check if selected domain exists in GMB */}
              {(selectedTrackedDomain || selectedDomainKey) && !selectedDomainInGmb && gmbOnboardingStep === 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">Domain Not Found in Google Business Profile</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        <span className="font-medium text-foreground">{selectedTrackedDomain || selectedDomainKey}</span> is not linked to any of your Google Business Profile locations. Would you like to add it?
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setGmbOnboardingStep(1)}
                          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Business to Google Maps
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Onboarding Wizard */}
              {gmbOnboardingStep > 0 && (
                <GMBOnboardingWizard
                  domain={selectedTrackedDomain || selectedDomainKey}
                  accessToken={sessionStorage.getItem('gmb_access_token') || ''}
                  accountId={selectedGmbAccount}
                  accounts={gmbAccounts}
                  onComplete={() => {
                    setGmbOnboardingStep(0);
                    // Refresh GMB data
                    toast.success('Business listing process completed');
                  }}
                  onCancel={() => {
                    setGmbOnboardingStep(0);
                  }}
                />
              )}

              {/* Show matched location if domain is found */}
              {selectedDomainInGmb && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">Domain Linked to Business Profile</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium text-foreground">{selectedTrackedDomain || selectedDomainKey}</span> is linked to:
                      </p>
                      <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                        <MapPin className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">{selectedDomainInGmb.title}</p>
                          {selectedDomainInGmb.storefrontAddress && (
                            <p className="text-sm text-muted-foreground">
                              {selectedDomainInGmb.storefrontAddress.locality}, {selectedDomainInGmb.storefrontAddress.administrativeArea}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Accounts List */}
              {gmbAccounts.length > 0 && gmbOnboardingStep === 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Your Business Accounts</h3>
                  <div className="grid gap-3">
                    {gmbAccounts.map((account) => (
                      <div
                        key={account.name}
                        onClick={() => setSelectedGmbAccount(account.name)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedGmbAccount === account.name
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center">
                              <Building className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{account.accountName}</p>
                              <p className="text-xs text-muted-foreground capitalize">{account.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          {selectedGmbAccount === account.name && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : gmbOnboardingStep === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Building className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">No business accounts found</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Make sure your Google account has access to at least one Business Profile
                  </p>
                </div>
              )}
              
              {gmbLocations.length > 0 && selectedGmbAccount && gmbOnboardingStep === 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-medium text-muted-foreground">Locations</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {gmbLocations.map((location) => (
                      <div
                        key={location.name}
                        className={`p-4 rounded-xl border transition-all ${
                          selectedDomainInGmb?.name === location.name
                            ? 'border-green-500 bg-green-500/5'
                            : 'border-border bg-muted/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className={`w-5 h-5 mt-0.5 ${selectedDomainInGmb?.name === location.name ? 'text-green-500' : 'text-primary'}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{location.title}</p>
                              {selectedDomainInGmb?.name === location.name && (
                                <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                                  Matched
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
                    ))}
                  </div>
                </div>
              )}
              
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
            </div>
          )}
        </div>
      )}

      {activeTab === 'landing-pages' && (
        <div className="max-w-[1530px] mx-auto bg-card rounded-b-xl border-x border-b border-border p-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Landing Pages</h2>
            {(selectedTrackedDomain || selectedDomainKey) && (
              <p className="text-sm text-primary font-medium mb-2">
                Domain: {selectedTrackedDomain || selectedDomainKey}
              </p>
            )}
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              High-converting PPC landing pages optimized for conversions and quality scores.
            </p>
            <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
              Coming Soon
            </Badge>
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

      {/* Bottom-right title badge - outside main content */}
      <div className="max-w-[1530px] mx-auto flex justify-end mt-4 pb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border/50 text-muted-foreground">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Visitor Intelligence</span>
          <span className="text-xs hidden sm:inline">— Marketing Funnel Analytics</span>
        </div>
      </div>
    </div>
  );
};

export default MarketingDashboard;
