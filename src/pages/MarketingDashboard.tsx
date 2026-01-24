import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Mail, Phone, MousePointer, FileText, TrendingUp, 
  Clock, Map, LogOut, RefreshCw, BarChart3 
} from 'lucide-react';
import { format } from 'date-fns';
import SEO from '@/components/SEO';

interface Lead {
  id: string;
  email: string;
  phone: string | null;
  domain: string;
  metric_type: string;
  source_page: string;
  created_at: string;
}

interface VisitorSession {
  id: string;
  session_id: string;
  first_page: string;
  referrer: string | null;
  started_at: string;
  last_activity_at: string;
}

interface PageView {
  id: string;
  session_id: string;
  page_path: string;
  page_title: string;
  created_at: string;
}

interface ToolInteraction {
  id: string;
  session_id: string;
  tool_name: string;
  tool_type: string;
  page_path: string;
  metadata: unknown;
  created_at: string;
}

interface FormSubmission {
  id: string;
  session_id: string | null;
  form_name: string;
  form_data: unknown;
  page_path: string;
  created_at: string;
}

interface Stats {
  totalLeads: number;
  totalSessions: number;
  totalPageViews: number;
  totalToolInteractions: number;
  totalFormSubmissions: number;
  leadsWithPhone: number;
}

const MarketingDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    totalSessions: 0,
    totalPageViews: 0,
    totalToolInteractions: 0,
    totalFormSubmissions: 0,
    leadsWithPhone: 0,
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [toolInteractions, setToolInteractions] = useState<ToolInteraction[]>([]);
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
      // Fetch all data in parallel
      const [
        leadsRes,
        sessionsRes,
        pageViewsRes,
        toolsRes,
        formsRes,
        leadsWithPhoneRes,
      ] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('visitor_sessions').select('*').order('started_at', { ascending: false }).limit(100),
        supabase.from('page_views').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('tool_interactions').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('form_submissions').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('leads').select('id', { count: 'exact' }).not('phone', 'is', null),
      ]);

      if (leadsRes.data) setLeads(leadsRes.data);
      if (sessionsRes.data) setSessions(sessionsRes.data);
      if (pageViewsRes.data) setPageViews(pageViewsRes.data);
      if (toolsRes.data) setToolInteractions(toolsRes.data);
      if (formsRes.data) setFormSubmissions(formsRes.data);

      // Get counts
      const [leadsCount, sessionsCount, pageViewsCount, toolsCount, formsCount] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('visitor_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('page_views').select('id', { count: 'exact', head: true }),
        supabase.from('tool_interactions').select('id', { count: 'exact', head: true }),
        supabase.from('form_submissions').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalLeads: leadsCount.count || 0,
        totalSessions: sessionsCount.count || 0,
        totalPageViews: pageViewsCount.count || 0,
        totalToolInteractions: toolsCount.count || 0,
        totalFormSubmissions: formsCount.count || 0,
        leadsWithPhone: leadsWithPhoneRes.count || 0,
      });
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
            <h1 className="text-2xl font-bold text-foreground">Marketing Dashboard</h1>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalLeads}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Phone className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.leadsWithPhone}</p>
                <p className="text-xs text-muted-foreground">With Phone</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Map className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalPageViews}</p>
                <p className="text-xs text-muted-foreground">Page Views</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <MousePointer className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalToolInteractions}</p>
                <p className="text-xs text-muted-foreground">Tool Uses</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <FileText className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalFormSubmissions}</p>
                <p className="text-xs text-muted-foreground">Form Fills</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="pageviews">Page Views</TabsTrigger>
            <TabsTrigger value="tools">Tool Usage</TabsTrigger>
            <TabsTrigger value="forms">Form Submissions</TabsTrigger>
          </TabsList>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Metric Type</TableHead>
                    <TableHead>Source Page</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.email}</TableCell>
                      <TableCell>
                        {lead.phone ? (
                          <Badge variant="secondary">{lead.phone}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{lead.domain}</TableCell>
                      <TableCell>
                        <Badge>{lead.metric_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lead.source_page}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(lead.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {leads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No leads captured yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>First Page</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-xs">{session.session_id.slice(0, 20)}...</TableCell>
                      <TableCell>{session.first_page}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {session.referrer || 'Direct'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(session.started_at), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(session.last_activity_at), 'MMM d, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {sessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No sessions recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Page Views Tab */}
          <TabsContent value="pageviews">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page Path</TableHead>
                    <TableHead>Page Title</TableHead>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageViews.map((pv) => (
                    <TableRow key={pv.id}>
                      <TableCell className="font-medium">{pv.page_path}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{pv.page_title}</TableCell>
                      <TableCell className="font-mono text-xs">{pv.session_id.slice(0, 15)}...</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(pv.created_at), 'MMM d, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {pageViews.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No page views recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Tool Usage Tab */}
          <TabsContent value="tools">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {toolInteractions.map((tool) => (
                    <TableRow key={tool.id}>
                      <TableCell className="font-medium">{tool.tool_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tool.tool_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{tool.page_path}</TableCell>
                      <TableCell className="font-mono text-xs">{tool.session_id.slice(0, 15)}...</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(tool.created_at), 'MMM d, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {toolInteractions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No tool interactions recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Form Submissions Tab */}
          <TabsContent value="forms">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Name</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formSubmissions.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="font-medium">{form.form_name}</TableCell>
                      <TableCell className="text-xs font-mono max-w-xs truncate">
                        {JSON.stringify(form.form_data)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{form.page_path}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {form.session_id?.slice(0, 15) || 'N/A'}...
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(form.created_at), 'MMM d, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {formSubmissions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No form submissions recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MarketingDashboard;
