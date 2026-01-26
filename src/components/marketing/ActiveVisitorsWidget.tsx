import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, Clock, Eye, MousePointer, Mail, Phone, User, 
  Building, Activity, Wifi, WifiOff, BarChart3, Search, 
  MapPin, CheckCircle2, XCircle, Globe, MessageSquare
} from 'lucide-react';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';

interface GoogleServices {
  hasGA: boolean;
  hasGSC: boolean;
  hasGMB: boolean;
  scopes: string[];
}

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
  // Google profile data
  user_id: string | null;
  avatar_url: string | null;
  full_name: string | null;
  email: string | null;
  googleServices: GoogleServices | null;
  hasChatEngagement: boolean;
  pagesVisited: string[];
}

const ActiveVisitorsWidget = () => {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const parseGoogleScopes = (scopes: string | null): GoogleServices => {
    if (!scopes) {
      return { hasGA: false, hasGSC: false, hasGMB: false, scopes: [] };
    }
    const scopeList = scopes.split(' ');
    return {
      hasGA: scopeList.some(s => s.includes('analytics')),
      hasGSC: scopeList.some(s => s.includes('webmasters')),
      hasGMB: scopeList.some(s => s.includes('business') || s.includes('mybusiness')),
      scopes: scopeList,
    };
  };

  const fetchActiveSessions = async () => {
    try {
      // Get sessions active in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: sessions, error: sessionsError } = await (supabase
        .from('visitor_sessions')
        .select('session_id, started_at, last_activity_at, first_page, referrer, user_id') as any)
        .gte('last_activity_at', fiveMinutesAgo)
        .order('last_activity_at', { ascending: false });

      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) {
        setActiveSessions([]);
        setLoading(false);
        return;
      }

      const sessionIds = sessions.map((s: any) => s.session_id);
      const userIds = sessions
        .map((s: any) => s.user_id)
        .filter((id: string | null) => id !== null);

      // Fetch related data in parallel
      const [pageViewsRes, toolsRes, leadsRes, profilesRes, tokensRes, chatsRes] = await Promise.all([
        supabase
          .from('page_views')
          .select('session_id, page_path')
          .in('session_id', sessionIds),
        supabase
          .from('tool_interactions')
          .select('session_id')
          .in('session_id', sessionIds),
        supabase
          .from('leads')
          .select('email, phone, full_name, company_employees'),
        userIds.length > 0 
          ? supabase.from('profiles').select('user_id, avatar_url, full_name, email').in('user_id', userIds)
          : Promise.resolve({ data: [] }),
        userIds.length > 0
          ? supabase.from('oauth_tokens').select('user_id, scope, provider').in('user_id', userIds).eq('provider', 'google')
          : Promise.resolve({ data: [] }),
        supabase.from('chat_conversations').select('session_id').in('session_id', sessionIds),
      ]);

      // Count page views per session and collect pages
      const pageViewCounts: Record<string, number> = {};
      const pagesPerSession: Record<string, string[]> = {};
      pageViewsRes.data?.forEach(pv => {
        pageViewCounts[pv.session_id] = (pageViewCounts[pv.session_id] || 0) + 1;
        if (!pagesPerSession[pv.session_id]) pagesPerSession[pv.session_id] = [];
        if (!pagesPerSession[pv.session_id].includes(pv.page_path)) {
          pagesPerSession[pv.session_id].push(pv.page_path);
        }
      });

      // Count tools used per session
      const toolCounts: Record<string, number> = {};
      toolsRes.data?.forEach(t => {
        toolCounts[t.session_id] = (toolCounts[t.session_id] || 0) + 1;
      });

      // Build lead lookup
      const leads = leadsRes.data || [];
      const hasAnyEmail = leads.length > 0;
      const hasAnyPhone = leads.some(l => l.phone);
      const hasAnyName = leads.some(l => l.full_name);
      const hasAnyCompanyInfo = leads.some(l => l.company_employees);

      // Build profiles map
      const profilesMap: Record<string, { avatar_url: string | null; full_name: string | null; email: string | null }> = {};
      profilesRes.data?.forEach((p: any) => {
        profilesMap[p.user_id] = { avatar_url: p.avatar_url, full_name: p.full_name, email: p.email };
      });

      // Build tokens map for Google services
      const tokensMap: Record<string, string> = {};
      tokensRes.data?.forEach((t: any) => {
        tokensMap[t.user_id] = t.scope;
      });

      // Build chat engagement map
      const chatSessions = new Set((chatsRes.data || []).map((c: any) => c.session_id));

      const enrichedSessions: ActiveSession[] = sessions.map((session: any) => {
        const profile = session.user_id ? profilesMap[session.user_id] : null;
        const scopes = session.user_id ? tokensMap[session.user_id] : null;
        
        return {
          session_id: session.session_id,
          started_at: session.started_at,
          last_activity_at: session.last_activity_at,
          first_page: session.first_page,
          referrer: session.referrer,
          pageViewCount: pageViewCounts[session.session_id] || 0,
          toolsUsedCount: toolCounts[session.session_id] || 0,
          hasEmail: hasAnyEmail,
          hasPhone: hasAnyPhone,
          hasName: hasAnyName,
          hasCompanyInfo: hasAnyCompanyInfo,
          // Google profile data
          user_id: session.user_id,
          avatar_url: profile?.avatar_url || null,
          full_name: profile?.full_name || null,
          email: profile?.email || null,
          googleServices: scopes ? parseGoogleScopes(scopes) : null,
          hasChatEngagement: chatSessions.has(session.session_id),
          pagesVisited: pagesPerSession[session.session_id] || [],
        };
      });

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
    if (session.email || session.hasEmail) score += 1;
    if (session.hasPhone) score += 1;
    if (session.full_name || session.hasName) score += 1;
    if (session.hasCompanyInfo) score += 1;
    if (session.googleServices?.hasGA) score += 1;
    if (session.googleServices?.hasGSC) score += 1;
    return score;
  };

  const getDataScoreColor = (score: number) => {
    if (score === 0) return 'bg-muted text-muted-foreground';
    if (score <= 2) return 'bg-blue-500/20 text-blue-400';
    if (score <= 4) return 'bg-amber-500/20 text-amber-400';
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
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {activeSessions.map((session, index) => {
              const dataScore = getDataScore(session);
              const isAuthenticated = !!session.user_id;
              
              return (
                <div
                  key={session.session_id}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    isAuthenticated 
                      ? 'bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/30 hover:border-primary/50' 
                      : 'bg-secondary/50 border-border/50 hover:border-border'
                  }`}
                >
                  {/* Header with avatar and identity */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {session.avatar_url ? (
                        <img 
                          src={session.avatar_url} 
                          alt={session.full_name || 'User'} 
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div>
                        {session.full_name ? (
                          <p className="font-semibold text-foreground">{session.full_name}</p>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">
                            Visitor #{index + 1}
                          </span>
                        )}
                        {session.email ? (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {session.email}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {session.first_page || '/'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`${getDataScoreColor(dataScore)} text-xs`}>
                        {dataScore}/6 Intel
                      </Badge>
                      {isAuthenticated && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-[10px]">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                          Google User
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Google Services Connected */}
                  {session.googleServices && (
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-background/50">
                      <span className="text-[10px] text-muted-foreground font-medium">Google Services:</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          session.googleServices.hasGA 
                            ? 'bg-orange-500/20 text-orange-400' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <BarChart3 className="w-3 h-3" />
                          GA
                          {session.googleServices.hasGA ? (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          ) : (
                            <XCircle className="w-2.5 h-2.5 opacity-50" />
                          )}
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          session.googleServices.hasGSC 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <Search className="w-3 h-3" />
                          GSC
                          {session.googleServices.hasGSC ? (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          ) : (
                            <XCircle className="w-2.5 h-2.5 opacity-50" />
                          )}
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          session.googleServices.hasGMB 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <MapPin className="w-3 h-3" />
                          GMB
                          {session.googleServices.hasGMB ? (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          ) : (
                            <XCircle className="w-2.5 h-2.5 opacity-50" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Activity Stats */}
                  <div className="grid grid-cols-4 gap-2 text-center mb-3">
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

                  {/* Pages Visited */}
                  {session.pagesVisited.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-muted-foreground mb-1 font-medium">Pages Visited:</p>
                      <div className="flex flex-wrap gap-1">
                        {session.pagesVisited.slice(0, 5).map((page, i) => (
                          <Badge key={i} variant="outline" className="text-[9px] bg-background/50">
                            {page === '/' ? 'Home' : page.slice(0, 20)}
                          </Badge>
                        ))}
                        {session.pagesVisited.length > 5 && (
                          <Badge variant="outline" className="text-[9px] bg-background/50">
                            +{session.pagesVisited.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bottom row - Additional data & engagement */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      {session.hasChatEngagement && (
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px]">
                          <MessageSquare className="w-2.5 h-2.5 mr-0.5" />
                          Chat Active
                        </Badge>
                      )}
                      {(session.hasEmail || session.hasPhone || session.hasName || session.hasCompanyInfo) && (
                        <div className="flex gap-1">
                          {session.hasPhone && (
                            <div className="p-1 rounded bg-amber-500/20">
                              <Phone className="w-3 h-3 text-amber-400" />
                            </div>
                          )}
                          {session.hasCompanyInfo && (
                            <div className="p-1 rounded bg-green-500/20">
                              <Building className="w-3 h-3 text-green-400" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {session.referrer && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {(() => {
                          try {
                            return new URL(session.referrer).hostname;
                          } catch {
                            return 'Direct';
                          }
                        })()}
                      </span>
                    )}
                  </div>
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
