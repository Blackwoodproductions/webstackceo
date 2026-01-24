import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, Clock, Eye, MousePointer, Mail, Phone, User, 
  Building, Activity, Wifi, WifiOff
} from 'lucide-react';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';

interface ActiveSession {
  session_id: string;
  started_at: string;
  last_activity_at: string;
  first_page: string | null;
  referrer: string | null;
  pageViewCount: number;
  toolsUsedCount: number;
  hasEmail: boolean;
  hasPhone: boolean;
  hasName: boolean;
  hasCompanyInfo: boolean;
}

const ActiveVisitorsWidget = () => {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchActiveSessions = async () => {
    try {
      // Get sessions active in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('visitor_sessions')
        .select('session_id, started_at, last_activity_at, first_page, referrer')
        .gte('last_activity_at', fiveMinutesAgo)
        .order('last_activity_at', { ascending: false });

      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) {
        setActiveSessions([]);
        setLoading(false);
        return;
      }

      const sessionIds = sessions.map(s => s.session_id);

      // Fetch related data in parallel
      const [pageViewsRes, toolsRes, leadsRes] = await Promise.all([
        supabase
          .from('page_views')
          .select('session_id')
          .in('session_id', sessionIds),
        supabase
          .from('tool_interactions')
          .select('session_id')
          .in('session_id', sessionIds),
        supabase
          .from('leads')
          .select('email, phone, full_name, company_employees')
      ]);

      // Count page views per session
      const pageViewCounts: Record<string, number> = {};
      pageViewsRes.data?.forEach(pv => {
        pageViewCounts[pv.session_id] = (pageViewCounts[pv.session_id] || 0) + 1;
      });

      // Count tools used per session
      const toolCounts: Record<string, number> = {};
      toolsRes.data?.forEach(t => {
        toolCounts[t.session_id] = (toolCounts[t.session_id] || 0) + 1;
      });

      // Build lead lookup (we don't have session_id on leads, so we check if any leads exist)
      const leads = leadsRes.data || [];
      const hasAnyEmail = leads.length > 0;
      const hasAnyPhone = leads.some(l => l.phone);
      const hasAnyName = leads.some(l => l.full_name);
      const hasAnyCompanyInfo = leads.some(l => l.company_employees);

      const enrichedSessions: ActiveSession[] = sessions.map(session => ({
        session_id: session.session_id,
        started_at: session.started_at,
        last_activity_at: session.last_activity_at,
        first_page: session.first_page,
        referrer: session.referrer,
        pageViewCount: pageViewCounts[session.session_id] || 0,
        toolsUsedCount: toolCounts[session.session_id] || 0,
        // For now, we'll show aggregate lead stats
        hasEmail: hasAnyEmail,
        hasPhone: hasAnyPhone,
        hasName: hasAnyName,
        hasCompanyInfo: hasAnyCompanyInfo,
      }));

      setActiveSessions(enrichedSessions);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSessions();

    // Set up realtime subscription for visitor_sessions updates
    const channel = supabase
      .channel('active-visitors')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visitor_sessions',
        },
        () => {
          fetchActiveSessions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'page_views',
        },
        () => {
          fetchActiveSessions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tool_interactions',
        },
        () => {
          fetchActiveSessions();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Refresh every 30 seconds as backup
    const interval = setInterval(fetchActiveSessions, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getTimeOnSite = (startedAt: string) => {
    const seconds = differenceInSeconds(new Date(), new Date(startedAt));
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getDataScore = (session: ActiveSession) => {
    let score = 0;
    if (session.hasEmail) score += 1;
    if (session.hasPhone) score += 1;
    if (session.hasName) score += 1;
    if (session.hasCompanyInfo) score += 1;
    return score;
  };

  const getDataScoreColor = (score: number) => {
    if (score === 0) return 'bg-muted text-muted-foreground';
    if (score === 1) return 'bg-blue-500/20 text-blue-400';
    if (score === 2) return 'bg-amber-500/20 text-amber-400';
    if (score === 3) return 'bg-orange-500/20 text-orange-400';
    return 'bg-green-500/20 text-green-400';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-muted animate-pulse" />
          <span className="text-sm text-muted-foreground">Loading active visitors...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Active Visitors
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
              <Wifi className="w-3 h-3 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
              <WifiOff className="w-3 h-3 mr-1" />
              Connecting
            </Badge>
          )}
          <Badge className="bg-primary/20 text-primary">
            <Users className="w-3 h-3 mr-1" />
            {activeSessions.length}
          </Badge>
        </div>
      </div>

      {activeSessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No active visitors in the last 5 minutes</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {activeSessions.map((session, index) => {
              const dataScore = getDataScore(session);
              
              return (
                <div
                  key={session.session_id}
                  className="p-4 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-mono text-xs text-muted-foreground">
                          #{index + 1} · {session.session_id.slice(0, 12)}...
                        </span>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {session.first_page || '/'}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${getDataScoreColor(dataScore)} text-xs`}>
                      {dataScore}/4 Data
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-background/50">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                      <span className="text-sm font-bold">{getTimeOnSite(session.started_at)}</span>
                      <p className="text-[10px] text-muted-foreground">Time</p>
                    </div>
                    <div className="p-2 rounded-lg bg-background/50">
                      <Eye className="w-4 h-4 mx-auto mb-1 text-violet-400" />
                      <span className="text-sm font-bold">{session.pageViewCount}</span>
                      <p className="text-[10px] text-muted-foreground">Pages</p>
                    </div>
                    <div className="p-2 rounded-lg bg-background/50">
                      <MousePointer className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                      <span className="text-sm font-bold">{session.toolsUsedCount}</span>
                      <p className="text-[10px] text-muted-foreground">Tools</p>
                    </div>
                    <div className="p-2 rounded-lg bg-background/50">
                      <Activity className="w-4 h-4 mx-auto mb-1 text-green-400" />
                      <span className="text-[10px] font-medium">
                        {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: false })}
                      </span>
                      <p className="text-[10px] text-muted-foreground">Last</p>
                    </div>
                  </div>

                  {/* Data collected indicators - only show if we have data */}
                  {(session.hasEmail || session.hasPhone || session.hasName || session.hasCompanyInfo) && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                    <span className="text-[10px] text-muted-foreground">Data:</span>
                    <div className="flex gap-1">
                      {session.hasEmail && (
                        <div className="p-1 rounded bg-blue-500/20">
                          <Mail className="w-3 h-3 text-blue-400" />
                        </div>
                      )}
                      {session.hasPhone && (
                        <div className="p-1 rounded bg-amber-500/20">
                          <Phone className="w-3 h-3 text-amber-400" />
                        </div>
                      )}
                      {session.hasName && (
                        <div className="p-1 rounded bg-orange-500/20">
                          <User className="w-3 h-3 text-orange-400" />
                        </div>
                      )}
                      {session.hasCompanyInfo && (
                        <div className="p-1 rounded bg-green-500/20">
                          <Building className="w-3 h-3 text-green-400" />
                        </div>
                      )}
                    </div>
                    {session.referrer && (
                      <span className="text-[10px] text-muted-foreground ml-auto truncate max-w-[120px]">
                        via {new URL(session.referrer).hostname}
                      </span>
                    )}
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};

export default ActiveVisitorsWidget;
