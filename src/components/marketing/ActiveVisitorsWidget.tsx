import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, Clock, Eye, MousePointer, Mail, Phone, User, 
  Building, Activity, Wifi, WifiOff, BarChart3, Search, 
  MapPin, CheckCircle2, XCircle, Globe, MessageSquare,
  UserCheck, UserX, Zap, Flame, Star, Target, Sparkles
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

      // DEDUPLICATION: 
      // 1. Always deduplicate by session_id first (prevent same session appearing multiple times)
      // 2. For authenticated users, keep only the most recent session per user_id
      const deduplicatedSessions: any[] = [];
      const seenSessionIds = new Set<string>();
      const seenUserIds = new Set<string>();
      
      for (const session of sessions) {
        // Skip if we've already seen this exact session_id
        if (seenSessionIds.has(session.session_id)) {
          continue;
        }
        
        if (session.user_id) {
          // Authenticated user - only keep their most recent session
          if (!seenUserIds.has(session.user_id)) {
            seenUserIds.add(session.user_id);
            seenSessionIds.add(session.session_id);
            deduplicatedSessions.push(session);
          }
        } else {
          // Anonymous user - keep the session (already deduplicated by session_id above)
          seenSessionIds.add(session.session_id);
          deduplicatedSessions.push(session);
        }
      }

      const sessionIds = deduplicatedSessions.map((s: any) => s.session_id);
      const userIds = deduplicatedSessions
        .map((s: any) => s.user_id)
        .filter((id: string | null) => id !== null);

      const [pageViewsRes, toolsRes, leadsRes, profilesRes, tokensRes, chatsRes] = await Promise.all([
        supabase.from('page_views').select('session_id, page_path').in('session_id', sessionIds),
        supabase.from('tool_interactions').select('session_id').in('session_id', sessionIds),
        supabase.from('leads').select('email, phone, full_name, company_employees'),
        userIds.length > 0 
          ? supabase.from('profiles').select('user_id, avatar_url, full_name, email').in('user_id', userIds)
          : Promise.resolve({ data: [] }),
        userIds.length > 0
          ? supabase.from('oauth_tokens').select('user_id, scope, provider').in('user_id', userIds).eq('provider', 'google')
          : Promise.resolve({ data: [] }),
        supabase.from('chat_conversations').select('session_id').in('session_id', sessionIds),
      ]);

      const pageViewCounts: Record<string, number> = {};
      const pagesPerSession: Record<string, string[]> = {};
      pageViewsRes.data?.forEach(pv => {
        pageViewCounts[pv.session_id] = (pageViewCounts[pv.session_id] || 0) + 1;
        if (!pagesPerSession[pv.session_id]) pagesPerSession[pv.session_id] = [];
        if (!pagesPerSession[pv.session_id].includes(pv.page_path)) {
          pagesPerSession[pv.session_id].push(pv.page_path);
        }
      });

      const toolCounts: Record<string, number> = {};
      toolsRes.data?.forEach(t => {
        toolCounts[t.session_id] = (toolCounts[t.session_id] || 0) + 1;
      });

      const leads = leadsRes.data || [];
      const hasAnyEmail = leads.length > 0;
      const hasAnyPhone = leads.some(l => l.phone);
      const hasAnyName = leads.some(l => l.full_name);
      const hasAnyCompanyInfo = leads.some(l => l.company_employees);

      const profilesMap: Record<string, { avatar_url: string | null; full_name: string | null; email: string | null }> = {};
      profilesRes.data?.forEach((p: any) => {
        profilesMap[p.user_id] = { avatar_url: p.avatar_url, full_name: p.full_name, email: p.email };
      });

      const tokensMap: Record<string, string> = {};
      tokensRes.data?.forEach((t: any) => {
        tokensMap[t.user_id] = t.scope;
      });

      const chatSessions = new Set((chatsRes.data || []).map((c: any) => c.session_id));

      const enrichedSessions: ActiveSession[] = deduplicatedSessions.map((session: any) => {
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

    const channel = supabase
      .channel('active-visitors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_sessions' }, () => fetchActiveSessions())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'page_views' }, () => fetchActiveSessions())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tool_interactions' }, () => fetchActiveSessions())
      .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));

    const interval = setInterval(fetchActiveSessions, 30000);
    return () => { channel.unsubscribe(); clearInterval(interval); };
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
    if (score <= 2) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (score <= 4) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  };

  // Split sessions into logged-in and anonymous
  const loggedInSessions = activeSessions.filter(s => s.user_id);
  const anonymousSessions = activeSessions.filter(s => !s.user_id);

  // Visitor card colors for anonymous users
  const visitorColors = [
    'from-red-600 to-rose-700',
    'from-orange-600 to-amber-700',
    'from-emerald-600 to-green-700',
    'from-blue-600 to-indigo-700',
    'from-purple-600 to-violet-700',
    'from-cyan-600 to-teal-700',
  ];
  const visitorIcons = [Eye, Zap, Flame, Star, Target, Sparkles, Activity];

  const getVisitorColor = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return visitorColors[hash % visitorColors.length];
  };
  
  const getVisitorIcon = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return visitorIcons[hash % visitorIcons.length];
  };

  const renderVisitorCard = (session: ActiveSession, index: number, isAuthenticated: boolean) => {
    const dataScore = getDataScore(session);
    const colorClass = getVisitorColor(session.session_id);
    const VisitorIcon = getVisitorIcon(session.session_id);

    return (
      <motion.div
        key={session.session_id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`group relative p-4 rounded-xl border transition-all duration-300 overflow-hidden ${
          isAuthenticated 
            ? 'bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-violet-500/5 border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10' 
            : 'bg-gradient-to-br from-primary/5 to-violet-500/5 border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10'
        }`}
      >
        {/* Animated glow effect for authenticated users */}
        {isAuthenticated && (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}

        {/* Header with avatar and identity */}
        <div className="relative flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar/Icon with glow effect */}
            <div className="relative">
              {session.avatar_url ? (
                <>
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 opacity-40 blur-md group-hover:opacity-60 transition-opacity" />
                  <img 
                    src={session.avatar_url} 
                    alt={session.full_name || 'User'} 
                    className="relative w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/50 shadow-lg"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-background shadow-lg shadow-emerald-400/50">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  </span>
                </>
              ) : (
                <>
                  <div className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${colorClass} opacity-40 blur-md group-hover:opacity-60 transition-opacity`} />
                  <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg overflow-hidden`}>
                    <div className="absolute inset-0.5 rounded-lg bg-gradient-to-br from-white/20 to-transparent" />
                    <motion.div 
                      className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ y: [0, 48, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <VisitorIcon className="w-5 h-5 text-white relative z-10 drop-shadow-sm" />
                    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l-2 border-t-2 border-white/40 rounded-tl-sm" />
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r-2 border-b-2 border-white/40 rounded-br-sm" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background shadow-lg shadow-emerald-400/50">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  </span>
                </>
              )}
            </div>

            <div>
              {session.full_name ? (
                <p className="font-semibold text-foreground flex items-center gap-2">
                  {session.full_name}
                  {isAuthenticated && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                      Google
                    </Badge>
                  )}
                </p>
              ) : (
                <span className="font-medium text-foreground flex items-center gap-2">
                  Visitor #{index + 1}
                </span>
              )}
              {session.email ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {session.email}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground truncate max-w-[180px] flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {session.first_page || '/'}
                </p>
              )}
            </div>
          </div>

          <Badge className={`${getDataScoreColor(dataScore)} text-xs border`}>
            {dataScore}/6 Intel
          </Badge>
        </div>

        {/* Google Services Connected */}
        {session.googleServices && (
          <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-background/60 backdrop-blur-sm border border-border/50">
            <span className="text-[10px] text-muted-foreground font-medium">Services:</span>
            <div className="flex items-center gap-1.5">
              {[
                { key: 'GA', has: session.googleServices.hasGA, icon: BarChart3, color: 'orange' },
                { key: 'GSC', has: session.googleServices.hasGSC, icon: Search, color: 'blue' },
                { key: 'GMB', has: session.googleServices.hasGMB, icon: MapPin, color: 'green' },
              ].map(({ key, has, icon: Icon, color }) => (
                <div key={key} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                  has 
                    ? `bg-${color}-500/20 text-${color}-400 shadow-sm shadow-${color}-500/20` 
                    : 'bg-muted/50 text-muted-foreground'
                }`}>
                  <Icon className="w-3 h-3" />
                  {key}
                  {has ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5 opacity-50" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Stats - Premium glass cards */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { icon: Clock, value: getTimeOnSite(session.started_at), label: 'Time', color: 'cyan' },
            { icon: Eye, value: session.pageViewCount, label: 'Pages', color: 'violet' },
            { icon: MousePointer, value: session.toolsUsedCount, label: 'Tools', color: 'amber' },
            { icon: Activity, value: formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: false }), label: 'Last', color: 'emerald' },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="p-2.5 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 text-center group/stat hover:border-primary/30 transition-all">
              <Icon className={`w-4 h-4 mx-auto mb-1 text-${color}-400`} />
              <span className="text-sm font-bold block">{value}</span>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Pages Visited - Enhanced badges */}
        {session.pagesVisited.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Pages Visited:</p>
            <div className="flex flex-wrap gap-1">
              {session.pagesVisited.slice(0, 5).map((page, i) => (
                <Badge key={i} variant="outline" className="text-[9px] bg-background/60 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all">
                  {page === '/' ? 'Home' : page.slice(0, 20)}
                </Badge>
              ))}
              {session.pagesVisited.length > 5 && (
                <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/30">
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
            {(session.hasPhone || session.hasCompanyInfo) && (
              <div className="flex gap-1">
                {session.hasPhone && (
                  <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
                    <Phone className="w-3 h-3 text-amber-400" />
                  </div>
                )}
                {session.hasCompanyInfo && (
                  <div className="p-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
                    <Building className="w-3 h-3 text-green-400" />
                  </div>
                )}
              </div>
            )}
          </div>
          {session.referrer && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 px-2 py-1 rounded-full bg-background/50">
              <Globe className="w-3 h-3" />
              {(() => {
                try { return new URL(session.referrer).hostname; } catch { return 'Direct'; }
              })()}
            </span>
          )}
        </div>

        {/* Shimmer effect on hover */}
        <motion.div 
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
      </motion.div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-primary/30 animate-pulse" />
          <span className="text-sm text-muted-foreground">Loading active visitors...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' : 'bg-red-500'}`} />
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Active Visitors
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <Wifi className="w-3 h-3 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
              <WifiOff className="w-3 h-3 mr-1" />
              Connecting
            </Badge>
          )}
          <Badge className="bg-primary/20 text-primary border border-primary/30">
            <Users className="w-3 h-3 mr-1" />
            {activeSessions.length}
          </Badge>
        </div>
      </div>

      {activeSessions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <Users className="w-16 h-16 text-primary/20 absolute inset-0" />
            <Users className="w-16 h-16 text-primary/10 absolute inset-0 animate-ping" />
          </div>
          <p className="font-medium">No active visitors in the last 5 minutes</p>
          <p className="text-sm mt-1">Visitors will appear here in real-time</p>
        </div>
      ) : (
        <ScrollArea className="h-[520px]">
          <div className="space-y-6 pr-2">
            {/* Logged In Users Section */}
            {loggedInSessions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-500/20">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">Logged In Users</h4>
                  <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                    {loggedInSessions.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {loggedInSessions.map((session, index) => renderVisitorCard(session, index, true))}
                </div>
              </div>
            )}

            {/* Anonymous Visitors Section */}
            {anonymousSessions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <UserX className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">Website Visitors</h4>
                  <Badge className="ml-auto bg-muted text-muted-foreground border border-border/50 text-xs">
                    {anonymousSessions.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {anonymousSessions.map((session, index) => renderVisitorCard(session, index, false))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};

export default ActiveVisitorsWidget;
