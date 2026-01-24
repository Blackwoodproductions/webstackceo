import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  DollarSign, ArrowRight, Eye, Zap, Activity, X, Filter, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Sun, Moon, MessageCircle, Calendar as CalendarIcon, User as UserIcon, FlaskConical, Search, AlertTriangle, Code, Download, Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import SEO from '@/components/SEO';
import { generateAPIDocs } from '@/lib/generateAPIDocs';

import VisitorFlowDiagram, { VisitorFlowSummary, TimeRange } from '@/components/marketing/VisitorFlowDiagram';
import { GSCDashboardPanel } from '@/components/marketing/GSCDashboardPanel';
import FloatingChatBar from '@/components/marketing/FloatingChatBar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { QuickStatsExpandableRow } from '@/components/marketing/QuickStatsExpandableRow';
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
  
  // GSC domain tracking status
  const [selectedGscDomain, setSelectedGscDomain] = useState<string | null>(null);
  const [gscDomainHasTracking, setGscDomainHasTracking] = useState<boolean>(true); // Default to true until we check
  const [gscSites, setGscSites] = useState<{ siteUrl: string; permissionLevel: string }[]>([]);
  const [gscAuthenticated, setGscAuthenticated] = useState<boolean>(false);
  const [selectedGscSiteUrl, setSelectedGscSiteUrl] = useState<string>("");
  
  // Tracked domains from visitor intelligence (domains with tracking code installed)
  const [trackedDomains, setTrackedDomains] = useState<string[]>([]);
  const [selectedTrackedDomain, setSelectedTrackedDomain] = useState<string>("");

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
        return <Badge className="text-[10px] bg-amber-500">🤔 Considering</Badge>;
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
    <div className="min-h-screen bg-background relative animate-fade-in pt-4 px-4 md:px-6 lg:px-8">
      <SEO 
        title="Visitor Intelligence Dashboard | Webstack.ceo"
        description="Real-time visitor intelligence and analytics dashboard"
        canonical="/visitor-intelligence-dashboard"
      />

      {/* Header */}
      <header className="border border-border bg-card rounded-t-xl max-w-[1800px] mx-auto">
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground leading-tight">
                  webstack<span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500 group-hover:from-amber-400 group-hover:to-yellow-500 transition-all duration-500">.ceo</span>
                </span>
                <span className="text-[9px] text-muted-foreground tracking-wide">
                  by Blackwood Productions
                </span>
              </div>
            </a>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground whitespace-nowrap">Visitor Intelligence</h1>
            </div>
            <span className="text-sm text-muted-foreground hidden lg:inline">— Marketing Funnel Analytics</span>
          </div>
          
          {/* Right: User Controls */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              {
                user.email?.toLowerCase().includes('rob') ? 'CTO' :
                user.email?.toLowerCase() === 'eric@blackwoodproductions.com' ? 'COO' :
                user.email?.toLowerCase() === 'que@blackwoodproductions.com' ? 'CEO' :
                user.email
              }
            </span>
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

      {/* Date Range Selector Bar */}
      <div className="border-x border-b border-border bg-card/50 backdrop-blur-sm sticky top-4 z-40 max-w-[1800px] mx-auto">
        <div className="px-6 py-2 flex items-center justify-between">
          {/* Left: Domain Selector & Time Range Selector */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Domain Selector - controls both Visitor Intelligence and GSC sections */}
            {(() => {
              // Combine GSC sites and tracked domains into unified list
              // Tracked domains with Visitor Intelligence get priority display
              const allDomains: { value: string; label: string; source: 'gsc' | 'tracking' | 'both'; hasTracking: boolean }[] = [];
              
              // First, add tracked domains (these have Visitor Intelligence installed)
              trackedDomains.forEach(domain => {
                allDomains.push({ value: domain, label: domain, source: 'tracking', hasTracking: true });
              });
              
              // Add GSC sites, marking if they also have tracking
              if (gscAuthenticated && gscSites.length > 0) {
                gscSites.forEach(site => {
                  const cleanLabel = site.siteUrl.replace('sc-domain:', '').replace('https://', '').replace('http://', '').replace(/\/$/, '');
                  // Check if this GSC site matches a tracked domain (exact match only)
                  const matchingTracked = allDomains.find(d => d.label === cleanLabel);
                  if (matchingTracked) {
                    // Update existing tracked domain to show it also has GSC
                    matchingTracked.source = 'both';
                    matchingTracked.value = site.siteUrl; // Use GSC URL for API calls
                  } else {
                    // Add as GSC-only domain
                    allDomains.push({ value: site.siteUrl, label: cleanLabel, source: 'gsc', hasTracking: false });
                  }
                });
              }
              
              const cleanDomainLabel = (v: string) =>
                v
                  .replace('sc-domain:', '')
                  .replace('https://', '')
                  .replace('http://', '')
                  .replace(/\/$/, '');

              // IMPORTANT: Radix Select must receive a `value` that exactly matches one of the
              // SelectItem values. For domains that are BOTH (GSC + tracking), the SelectItem
              // value is the GSC siteUrl, while the tracked-domain state is the clean hostname.
              // If we pass the clean hostname as `value`, Radix can reset/snap to the first item.
              const selectedByTrackedLabel = selectedTrackedDomain
                ? allDomains.find((d) => d.label === selectedTrackedDomain)
                : undefined;

              const selectValue =
                selectedByTrackedLabel?.value || selectedGscSiteUrl || selectedTrackedDomain || '';

              const displayLabel = selectValue ? cleanDomainLabel(selectValue) : '';
              
              if (allDomains.length > 0) {
                return (
                  <>
                    <Select 
                      value={selectValue} 
                      onValueChange={(value) => {
                        const selected = allDomains.find(d => d.value === value);
                        if (selected) {
                          // Update tracking status based on domain selection
                          setGscDomainHasTracking(selected.hasTracking);
                          
                          if (selected.source === 'gsc') {
                            // GSC-only domain
                            setSelectedGscSiteUrl(value);
                            setSelectedGscDomain(selected.label);
                            setSelectedTrackedDomain('');
                          } else if (selected.source === 'both') {
                            // Domain has both tracking and GSC
                            setSelectedGscSiteUrl(value);
                            setSelectedGscDomain(selected.label);
                            setSelectedTrackedDomain(selected.label);
                          } else {
                            // Tracking-only domain
                            setSelectedTrackedDomain(value);
                            setSelectedGscDomain(value);
                            setSelectedGscSiteUrl('');
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-[200px] h-7 text-sm bg-background border-border">
                        <Globe className="w-3 h-3 mr-1.5 flex-shrink-0 text-cyan-500" />
                        <span className="truncate max-w-[150px]">
                          {displayLabel
                            ? (displayLabel.length > 20 ? `${displayLabel.slice(0, 20)}...` : displayLabel)
                            : 'Select domain'}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border shadow-lg z-50 max-w-[300px]">
                        {allDomains.map((domain) => (
                          <SelectItem key={domain.value} value={domain.value} className="text-xs">
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[140px]" title={domain.label}>{domain.label.length > 20 ? domain.label.slice(0, 20) + '...' : domain.label}</span>
                              <div className="flex gap-1 flex-shrink-0">
                                {domain.hasTracking && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-green-500/10 text-green-500 border-green-500/30">VI</Badge>
                                )}
                                {(domain.source === 'gsc' || domain.source === 'both') && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-cyan-500/10 text-cyan-500 border-cyan-500/30">GSC</Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="w-px h-5 bg-border" />
                  </>
                );
              } else {
                return (
                  <>
                    <Badge variant="outline" className="h-7 text-xs bg-muted/50 text-muted-foreground border-border px-3">
                      <Globe className="w-3 h-3 mr-1.5" />
                      No domains yet
                    </Badge>
                    <div className="w-px h-5 bg-border" />
                  </>
                );
              }
            })()}
            
            {/* Time Range Selector */}
            <div className="flex gap-1">
              <div className="flex flex-col gap-1 items-center w-5">
                <CalendarIcon className="w-4 h-4 text-primary mt-1.5" />
                {pageFilter && <Filter className="w-4 h-4 text-purple-400 mt-1.5" />}
              </div>
              <div className="flex flex-col gap-1">
                <Select value={diagramTimeRange} onValueChange={(value: TimeRange) => setDiagramTimeRange(value)}>
                  <SelectTrigger className="w-[130px] h-7 text-sm bg-background border-border">
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="live">Last 24h</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">Year</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {pageFilter && (
                  <Badge variant="secondary" className="flex items-center gap-2 px-2 py-0.5 h-7 bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                    {pageFilter === '/' ? 'Homepage' : pageFilter}
                    <button onClick={() => setPageFilter(null)} className="ml-1 hover:bg-purple-500/30 rounded p-0.5"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
              </div>
            </div>
            {diagramTimeRange === 'custom' && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-7 text-sm px-3", !diagramCustomDateRange.from && "text-muted-foreground")}>
                      {diagramCustomDateRange.from ? format(diagramCustomDateRange.from, "MMM d, yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border border-border z-50" align="start">
                    <Calendar mode="single" selected={diagramCustomDateRange.from} onSelect={(date) => setDiagramCustomDateRange(prev => ({ ...prev, from: date }))} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <span className="text-sm text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-7 text-sm px-3", !diagramCustomDateRange.to && "text-muted-foreground")}>
                      {diagramCustomDateRange.to ? format(diagramCustomDateRange.to, "MMM d, yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border border-border z-50" align="start">
                    <Calendar mode="single" selected={diagramCustomDateRange.to} onSelect={(date) => setDiagramCustomDateRange(prev => ({ ...prev, to: date }))} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          
          {/* Center: Stats Badges */}
          <div className="flex-1 flex items-center justify-center gap-2 flex-wrap">
            {/* Show stats only if no GSC domain selected OR the selected domain has tracking */}
            {(!selectedGscDomain || gscDomainHasTracking) && flowSummary && (
              <>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                  <Eye className="w-3 h-3 mr-1" />{flowSummary.totalVisits} views
                </Badge>
                <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/30">
                  <Users className="w-3 h-3 mr-1" />{flowSummary.uniqueSessions} sessions
                </Badge>
                <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  <MousePointer className="w-3 h-3 mr-1" />{flowSummary.avgPagesPerSession} pg/session
                </Badge>
                <Badge variant="outline" className="text-xs bg-rose-500/10 text-rose-400 border-rose-500/30">
                  <ArrowRight className="w-3 h-3 mr-1" />{flowSummary.bounceRate}% bounce
                </Badge>
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  <UserCheck className="w-3 h-3 mr-1" />{flowSummary.newVisitorsToday} new today
                </Badge>
                <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">
                  <Zap className="w-3 h-3 mr-1" />{flowSummary.toolInteractions} tool uses
                </Badge>
                {flowSummary.externalReferrals > 0 && (
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                    <TrendingUp className="w-3 h-3 mr-1" />{flowSummary.externalReferrals} referrals
                  </Badge>
                )}
                {flowSummary.activeVisitors > 0 && (
                  <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                    <Activity className="w-3 h-3 mr-1" />{flowSummary.activeVisitors} live
                  </Badge>
                )}
              </>
            )}
            {/* Show install tracking prompt when domain selected but no tracking */}
            {selectedGscDomain && !gscDomainHasTracking && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Install tracking code to see visitor data for {selectedGscDomain}
              </Badge>
            )}
          </div>
          
          {/* Right: API Docs & Chat Controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
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
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex min-h-[calc(100vh-180px)] max-w-[1800px] mx-auto bg-card rounded-b-xl border-x border-b border-border">
        {/* Left Sidebar - Only show when tracking is installed or no GSC domain selected */}
        {(!selectedGscDomain || gscDomainHasTracking) && (
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
          {selectedGscDomain && !gscDomainHasTracking && (
            <div className="mb-4 animate-fade-in">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">Install tracking for {selectedGscDomain}</p>
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400">Required</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Add the tracking script to see visitor flow, engagement & leads</p>
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
})(window,document,'script','wscLayer','${selectedGscDomain}');
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
'${selectedGscDomain}');
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

          {/* Full-Width Visitor Intelligence Panel (when open) - only show if tracking installed or no domain selected */}
          {siteArchOpen && (!selectedGscDomain || gscDomainHasTracking) && (
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
          {!siteArchOpen && (!selectedGscDomain || gscDomainHasTracking) && (
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

          {/* Full Width Stats Layout - only show if tracking installed or no domain selected */}
          {(!selectedGscDomain || gscDomainHasTracking) && (
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
        {(!selectedGscDomain || gscDomainHasTracking) && (
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
                                  <SelectItem value="considering">🤔 Considering</SelectItem>
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

        {/* Google Search Console Integration */}
        <div className="mb-8">
          <GSCDashboardPanel 
            externalSelectedSite={selectedGscSiteUrl}
            onSiteChange={(site) => {
              // When GSC domain changes, update state
              const cleanDomain = site.replace('sc-domain:', '').replace('https://', '').replace('http://', '').replace(/\/$/, '');
              setSelectedGscDomain(cleanDomain);
              setSelectedGscSiteUrl(site);
              console.log('GSC site changed:', cleanDomain);
            }}
            onDataLoaded={(data) => {
              // Receive GSC metrics when loaded
              console.log('GSC data loaded:', data);
            }}
            onTrackingStatus={(hasTracking, domain) => {
              // Only update tracking status if this domain is NOT in our known tracked domains list
              // (tracked domains always have tracking by definition)
              const isKnownTrackedDomain = trackedDomains.some(td => 
                td === domain || domain.includes(td) || td.includes(domain)
              );
              
              if (isKnownTrackedDomain) {
                // Always show VI dashboard for known tracked domains
                setGscDomainHasTracking(true);
                console.log(`Tracking status for ${domain}: forced TRUE (known tracked domain)`);
              } else {
                // For other domains, use the database check result
                setGscDomainHasTracking(hasTracking);
                console.log(`Tracking status for ${domain}: ${hasTracking ? 'installed' : 'not installed'}`);
              }
            }}
             onSitesLoaded={(sites) => {
              // Store available GSC sites for header dropdown
              setGscSites(sites);
              // Auto-select first site ONLY if NO tracked domain is already selected
              // Priority: trackedDomains > GSC sites
              if (sites.length > 0 && !selectedGscSiteUrl && !selectedTrackedDomain) {
                // Check if any GSC site matches a tracked domain - prefer that one
                const matchingTrackedSite = sites.find(site => {
                  const cleanDomain = site.siteUrl.replace('sc-domain:', '').replace('https://', '').replace('http://', '').replace(/\/$/, '');
                  return trackedDomains.includes(cleanDomain);
                });
                
                if (matchingTrackedSite) {
                  // Use the tracked domain that has GSC
                  const cleanDomain = matchingTrackedSite.siteUrl.replace('sc-domain:', '').replace('https://', '').replace('http://', '').replace(/\/$/, '');
                  setSelectedGscSiteUrl(matchingTrackedSite.siteUrl);
                  setSelectedGscDomain(cleanDomain);
                  setSelectedTrackedDomain(cleanDomain);
                  setGscDomainHasTracking(true); // Known tracked domain
                } else {
                  // No matching tracked domain, use first GSC site
                  setSelectedGscSiteUrl(sites[0].siteUrl);
                  const cleanDomain = sites[0].siteUrl.replace('sc-domain:', '').replace('https://', '').replace('http://', '').replace(/\/$/, '');
                  setSelectedGscDomain(cleanDomain);
                  // Check if this is a known tracked domain
                  const isTracked = trackedDomains.includes(cleanDomain);
                  setGscDomainHasTracking(isTracked);
                }
              }
            }}
            onAuthStatusChange={(isAuth) => {
              setGscAuthenticated(isAuth);
            }}
          />
        </div>

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

      {/* Floating Chat Bar */}
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
    </div>
  );
};

export default MarketingDashboard;
