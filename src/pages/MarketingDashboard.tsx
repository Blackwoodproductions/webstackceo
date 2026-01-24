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
  DollarSign, ArrowRight, Eye, Zap, Activity, X, Filter, CheckCircle, ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import SEO from '@/components/SEO';
import VisitorEngagementPanel from '@/components/marketing/VisitorEngagementPanel';
import VisitorFlowDiagram from '@/components/marketing/VisitorFlowDiagram';
import ReferrerBreakdownChart from '@/components/marketing/ReferrerBreakdownChart';
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
    navigate('/auth?redirect=/marketing-dashboard');
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the marketing dashboard.
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
    { label: 'With Name', count: funnelStats.withName, icon: UserCheck, color: 'from-amber-400 to-amber-600' },
    { label: 'Qualified', count: funnelStats.withCompanyInfo, icon: Target, color: 'from-orange-400 to-orange-600' },
    { label: 'Closed', count: funnelStats.closedLeads, icon: DollarSign, color: 'from-green-400 to-green-600' },
  ];

  const maxFunnel = Math.max(...funnelSteps.map(s => s.count), 1);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Marketing Dashboard | Webstack.ceo"
        description="Internal marketing analytics dashboard"
        canonical="/marketing-dashboard"
      />

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Customer Journey</h1>
              <p className="text-sm text-muted-foreground">Marketing Funnel Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAllData}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Main Layout - Traffic Sources on Left, Stats & Info on Right */}
        <div className="grid lg:grid-cols-5 gap-6 mb-6">
          {/* Left Column - Traffic Sources (stretches to match right column height) */}
          <div className="lg:col-span-1 flex">
            <div className="w-full">
              <ReferrerBreakdownChart sessions={sessions} />
            </div>
          </div>

          {/* Right Column - Stats + Funnel + Info Boxes */}
          <div className="lg:col-span-4 space-y-4">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="p-4 border-green-500/30 bg-green-500/5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/20 relative flex-shrink-0">
                    <Activity className="w-5 h-5 text-green-500" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-green-500 leading-tight">{activeVisitors}</p>
                    <p className="text-xs text-muted-foreground">Active Now</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-cyan-500/30 bg-cyan-500/5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-500/20 flex-shrink-0">
                    <UserCheck className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-cyan-500 leading-tight">{newVisitorsToday}</p>
                    <p className="text-xs text-muted-foreground">New Today</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-violet-500/10 flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-violet-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-foreground leading-tight">
                      {funnelStats.visitors > 0 ? ((funnelStats.leads / funnelStats.visitors) * 100).toFixed(1) : '0'}%
                    </p>
                    <p className="text-xs text-muted-foreground">Lead Rate</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10 flex-shrink-0">
                    <Target className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-foreground leading-tight">
                      {funnelStats.leads > 0 ? ((funnelStats.closedLeads / funnelStats.leads) * 100).toFixed(1) : '0'}%
                    </p>
                    <p className="text-xs text-muted-foreground">Close Rate</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-green-500/30 bg-green-500/5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/20 flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-green-500 leading-tight truncate">
                      ${leads.reduce((sum, l) => sum + (l.closed_amount || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-pink-500/10 flex-shrink-0">
                    <MousePointer className="w-5 h-5 text-pink-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-foreground leading-tight">
                      {funnelStats.visitors > 0 ? ((filteredData.toolInteractions.length / funnelStats.visitors) * 100).toFixed(1) : '0'}%
                    </p>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Conversion Funnel Row */}
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

            {/* Entry Pages, Top Tools, Recent Leads Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-foreground text-sm">Entry Pages</h2>
                </div>
                <div className="space-y-2">
                  {(() => {
                    const pageCounts: Record<string, number> = {};
                    sessions.forEach(s => {
                      const page = s.first_page || '/';
                      pageCounts[page] = (pageCounts[page] || 0) + 1;
                    });
                    return Object.entries(pageCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([page, count]) => (
                        <div key={page} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate flex-1 mr-2">
                            {page === '/' ? 'Homepage' : page}
                          </span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ));
                  })()}
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MousePointer className="w-4 h-4 text-pink-500" />
                  <h2 className="font-bold text-foreground text-sm">Top Tools</h2>
                </div>
                <div className="space-y-2">
                  {(() => {
                    const toolCounts: Record<string, number> = {};
                    toolInteractions.forEach(t => {
                      toolCounts[t.tool_name] = (toolCounts[t.tool_name] || 0) + 1;
                    });
                    const entries = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                    if (entries.length === 0) {
                      return <p className="text-xs text-muted-foreground">No tool usage yet</p>;
                    }
                    return entries.map(([tool, count]) => (
                      <div key={tool} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate flex-1 mr-2">{tool}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ));
                  })()}
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-violet-500" />
                  <h2 className="font-bold text-foreground text-sm">Recent Leads</h2>
                </div>
                <div className="space-y-2">
                  {leads.slice(0, 5).map(lead => (
                    <div key={lead.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate flex-1 mr-2">{lead.email.split('@')[0]}</span>
                      {lead.status === 'closed' ? (
                        <Badge className="text-[8px] h-4 bg-green-500">Closed</Badge>
                      ) : lead.full_name ? (
                        <Badge className="text-[8px] h-4 bg-amber-500">Named</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[8px] h-4">New</Badge>
                      )}
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <p className="text-xs text-muted-foreground">No leads yet</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Site Architecture - Full Width Collapsible */}
        <Collapsible defaultOpen className="mb-6">
          <Card className="p-4">
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground">Site Architecture</h2>
                {pageFilter && (
                  <Badge variant="secondary" className="ml-2 text-[10px] bg-purple-500/20 text-purple-400">
                    Filtered: {pageFilter === '/' ? 'Homepage' : pageFilter}
                  </Badge>
                )}
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              {pageFilter && (
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 border-purple-500/30">
                    <Filter className="w-3 h-3" />
                    Filtering by: <span className="font-bold">{pageFilter === '/' ? 'Homepage' : pageFilter}</span>
                    <button 
                      onClick={() => setPageFilter(null)}
                      className="ml-1 hover:bg-purple-500/30 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Showing {pageViews.filter(pv => pv.page_path === pageFilter || pv.page_path.startsWith(pageFilter + '/')).length} page views, {' '}
                    {toolInteractions.filter(ti => ti.page_path === pageFilter || (ti.page_path && ti.page_path.startsWith(pageFilter + '/'))).length} interactions
                  </span>
                </div>
              )}
              <VisitorFlowDiagram 
                onPageFilter={setPageFilter}
                activeFilter={pageFilter}
              />
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Leads Section - Full Width */}
        <div className="mb-8">
          {/* Lead Quality Bar */}
          <div className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-foreground">Lead Quality</span>
            </div>
            <div className="flex flex-1 justify-between gap-2">
              {[
                { label: 'Open', count: funnelStats.leads - funnelStats.closedLeads, color: 'bg-blue-500' },
                { label: 'With Name', count: funnelStats.withName, color: 'bg-amber-500' },
                { label: 'Qualified', count: funnelStats.withCompanyInfo, color: 'bg-orange-500' },
                { label: 'Closed', count: funnelStats.closedLeads, color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.label} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border/30">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="font-bold text-sm">{Math.max(0, item.count)}</span>
                </div>
              ))}
            </div>
          </div>

          <Tabs defaultValue="leads" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-4">
              <TabsTrigger value="leads" className="text-xs sm:text-sm">
                <Mail className="w-3 h-3 mr-1.5" />
                Leads ({pageFilter ? filteredData.leads.length : funnelStats.leads})
              </TabsTrigger>
              <TabsTrigger value="journey" className="text-xs sm:text-sm">
                <TrendingUp className="w-3 h-3 mr-1.5" />
                Journey
              </TabsTrigger>
              <TabsTrigger value="tools" className="text-xs sm:text-sm">
                <MousePointer className="w-3 h-3 mr-1.5" />
                Tools ({filteredData.toolInteractions.length})
              </TabsTrigger>
            </TabsList>

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
                              {lead.status === 'closed' ? (
                                <Badge className="text-[10px] bg-green-500">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Closed
                                  {lead.closed_amount && (
                                    <span className="ml-1">${lead.closed_amount.toLocaleString()}</span>
                                  )}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">
                                  Open
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground py-2">
                              {format(new Date(lead.created_at), 'MMM d, HH:mm')}
                            </TableCell>
                            <TableCell className="py-2 text-right">
                              {lead.status === 'closed' ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 text-xs"
                                  onClick={() => handleReopenLead(lead)}
                                >
                                  Reopen
                                </Button>
                              ) : (
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                  onClick={() => setCloseLeadDialog({ open: true, lead })}
                                >
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  Close
                                </Button>
                              )}
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
      </main>

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
