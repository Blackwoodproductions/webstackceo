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
  DollarSign, ArrowRight, Eye, Zap, Activity, X, Filter, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Sun, Moon, MessageCircle, Calendar as CalendarIcon, User as UserIcon, FlaskConical
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import SEO from '@/components/SEO';
import VisitorEngagementPanel from '@/components/marketing/VisitorEngagementPanel';
import VisitorFlowDiagram, { VisitorFlowSummary, TimeRange } from '@/components/marketing/VisitorFlowDiagram';
import ReferrerBreakdownChart from '@/components/marketing/ReferrerBreakdownChart';
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

  // Create test lead for demo purposes
  const handleCreateTestLead = async () => {
    try {
      const testLead = {
        email: `test-${Date.now()}@example.com`,
        full_name: 'Test Lead (Demo)',
        phone: '+1 555-000-0000',
        domain: 'example.com',
        metric_type: 'test_demo',
        source_page: '/',
        company_employees: '10-50',
        annual_revenue: '$100k-$500k',
        funnel_stage: 'lead',
        status: 'open',
      };

      const { data, error } = await supabase
        .from('leads')
        .insert(testLead)
        .select()
        .single();

      if (error) throw error;

      // Add to local state immediately
      if (data) {
        setLeads(prev => [data as Lead, ...prev]);
        setFunnelStats(prev => ({
          ...prev,
          leads: prev.leads + 1,
          withName: prev.withName + 1,
          withCompanyInfo: prev.withCompanyInfo + 1,
        }));
      }
    } catch (error) {
      console.error('Error creating test lead:', error);
    }
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
    <div className="min-h-screen bg-background relative animate-fade-in">
      <SEO 
        title="Visitor Intelligence Dashboard | Webstack.ceo"
        description="Real-time visitor intelligence and analytics dashboard"
        canonical="/visitor-intelligence-dashboard"
      />

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <BarChart3 className="w-7 h-7 text-primary" />
              <h1 className="text-xl font-bold text-foreground whitespace-nowrap">Visitor Intelligence</h1>
            </a>
            <span className="text-sm text-muted-foreground hidden md:inline">— Marketing Funnel Analytics and AI Sales Center</span>
          </div>
          
          {/* Right: User Controls */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome - {
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
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="w-full px-6 py-2 flex items-center justify-between">
          {/* Left: Time Range Selector */}
          <div className="flex items-center gap-4 flex-shrink-0">
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
            {flowSummary && (
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
          </div>
          
          {/* Right: Chat Controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
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
      <div className="flex min-h-[calc(100vh-140px)]">
        {/* Left Sidebar - Collapsed Icons (only visible when diagram is closed) */}
        {!siteArchOpen && (
          <div className="w-48 flex-shrink-0 border-r border-border bg-card/50">
            <div className="sticky top-[52px] h-[calc(100vh-140px)] flex flex-col">
              {/* Sidebar Header - Click to expand */}
              <button 
                onClick={() => setSiteArchOpen(true)}
                className="flex items-center gap-2 p-3 border-b border-border hover:bg-secondary/30 transition-colors"
                title="Open Visitor Intelligence"
              >
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground flex-1 text-left">Pages</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              
              {/* Page Icons with Names */}
              <div className="flex-1 flex flex-col gap-1 py-3 px-2 overflow-auto">
                {flowSummary && flowSummary.topPages.slice(0, 12).map((page) => {
                  const maxVisits = flowSummary.topPages[0]?.visits || 1;
                  const intensity = page.visits / maxVisits;
                  const heatColor = intensity > 0.7 ? '#3b82f6' : intensity > 0.4 ? '#22c55e' : '#eab308';
                  const hasLiveVisitor = page.liveCount > 0;
                  const hasExternalReferrer = page.hasExternalReferrer;
                  
                  return (
                    <div
                      key={page.path}
                      className={`relative flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors ${pageFilter === page.path ? 'bg-primary/10 border border-primary/30' : ''}`}
                      onClick={() => setPageFilter(page.path === pageFilter ? null : page.path)}
                    >
                      <div className="relative flex-shrink-0">
                        <svg width={44} height={44} className="overflow-visible">
                          {/* External referrer starburst */}
                          {hasExternalReferrer && (
                            <>
                              <circle cx={22} cy={22} r={20} fill="none" stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7}>
                                <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" />
                              </circle>
                              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                                const rad = (angle * Math.PI) / 180;
                                const x1 = 22 + Math.cos(rad) * 14;
                                const y1 = 22 + Math.sin(rad) * 14;
                                const x2 = 22 + Math.cos(rad) * 19;
                                const y2 = 22 + Math.sin(rad) * 19;
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
                            <circle cx={22} cy={22} r={18} fill="#22c55e" opacity={0.2} className="animate-pulse" />
                          )}
                          {/* Main circle */}
                          <circle cx={22} cy={22} r={14} fill="hsl(var(--background))" stroke={hasLiveVisitor ? "#22c55e" : heatColor} strokeWidth={2.5} />
                          <text x={22} y={26} textAnchor="middle" fill="#8b5cf6" style={{ fontSize: '11px', fontWeight: 'bold' }}>
                            {page.visits > 999 ? `${Math.round(page.visits / 100) / 10}k` : page.visits}
                          </text>
                          {/* Live count badge */}
                          {hasLiveVisitor && (
                            <>
                              <circle cx={34} cy={10} r={7} fill="#22c55e" />
                              <text x={34} y={13} textAnchor="middle" fill="white" style={{ fontSize: '9px', fontWeight: 'bold' }}>{page.liveCount}</text>
                            </>
                          )}
                          {/* External count badge */}
                          {page.externalCount > 0 && (
                            <>
                              <circle cx={10} cy={34} r={7} fill="#f97316" />
                              <text x={10} y={37} textAnchor="middle" fill="white" style={{ fontSize: '9px', fontWeight: 'bold' }}>{page.externalCount > 99 ? '99+' : page.externalCount}</text>
                            </>
                          )}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{page.name}</p>
                        <p className="text-[10px] text-muted-foreground">{page.visits} visits</p>
                      </div>
                    </div>
                  );
                })}
                {(!flowSummary || flowSummary.topPages.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">No page data</p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Full-Width Visitor Intelligence Panel (when open) */}
          {siteArchOpen && (
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
          {!siteArchOpen && (
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

          {/* Full Width Stats Layout */}
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


        {/* Leads Section - Full Width */}
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

        {/* Visitor Engagement Panel (Heatmap + Active Visitors) */}
        <div className="mb-8">
          <VisitorEngagementPanel />
        </div>

        {/* Traffic Sources - Full Width */}
        <div className="mb-8">
          <ReferrerBreakdownChart sessions={sessions} horizontal />
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
    </div>
  );
};

export default MarketingDashboard;
