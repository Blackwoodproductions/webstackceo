import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Clock, Eye, MousePointer, Mail, Phone, User, 
  Building, Activity, Wifi, WifiOff, Flame, TrendingUp,
  Globe, Monitor, Smartphone, ArrowRight, Zap, Radio
} from 'lucide-react';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';

interface ActiveSession {
  session_id: string;
  started_at: string;
  last_activity_at: string;
  first_page: string | null;
  referrer: string | null;
  user_agent: string | null;
  pageViewCount: number;
  toolsUsedCount: number;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  companyEmployees: string | null;
  recentPages: string[];
}

interface PageEngagement {
  page_path: string;
  views: number;
  toolInteractions: number;
  uniqueSessions: number;
  engagementScore: number;
}

const VisitorEngagementPanel = () => {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [pageData, setPageData] = useState<PageEngagement[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [maxScore, setMaxScore] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const [sessionsRes, pageViewsRes, toolsRes, leadsRes, formSubmissionsRes] = await Promise.all([
        supabase
          .from('visitor_sessions')
          .select('session_id, started_at, last_activity_at, first_page, referrer, user_agent')
          .gte('last_activity_at', fiveMinutesAgo)
          .order('last_activity_at', { ascending: false }),
        supabase.from('page_views').select('page_path, session_id, created_at'),
        supabase.from('tool_interactions').select('page_path, session_id'),
        supabase.from('leads').select('email, phone, full_name, company_employees'),
        supabase.from('form_submissions').select('session_id, form_data')
      ]);

      const sessions = sessionsRes.data || [];
      const pageViews = pageViewsRes.data || [];
      const toolInteractions = toolsRes.data || [];
      const formSubmissions = formSubmissionsRes.data || [];

      // Process page engagement heatmap
      const pageMap = new Map<string, { views: number; tools: number; sessions: Set<string>; }>();
      
      pageViews.forEach(pv => {
        const path = pv.page_path || '/';
        if (!pageMap.has(path)) {
          pageMap.set(path, { views: 0, tools: 0, sessions: new Set() });
        }
        const data = pageMap.get(path)!;
        data.views++;
        data.sessions.add(pv.session_id);
      });

      toolInteractions.forEach(ti => {
        const path = ti.page_path || '/';
        if (!pageMap.has(path)) {
          pageMap.set(path, { views: 0, tools: 0, sessions: new Set() });
        }
        const data = pageMap.get(path)!;
        data.tools++;
        data.sessions.add(ti.session_id);
      });

      const engagementData: PageEngagement[] = [];
      let max = 1;

      pageMap.forEach((data, path) => {
        const score = data.views + (data.tools * 3) + (data.sessions.size * 2);
        max = Math.max(max, score);
        engagementData.push({
          page_path: path,
          views: data.views,
          toolInteractions: data.tools,
          uniqueSessions: data.sessions.size,
          engagementScore: score,
        });
      });

      engagementData.sort((a, b) => b.engagementScore - a.engagementScore);
      setPageData(engagementData.slice(0, 10));
      setMaxScore(max);

      // Process active sessions
      if (sessions.length > 0) {
        const sessionIds = sessions.map(s => s.session_id);
        
        const pageViewCounts: Record<string, number> = {};
        const recentPagesMap: Record<string, string[]> = {};
        
        pageViews.forEach(pv => {
          if (sessionIds.includes(pv.session_id)) {
            pageViewCounts[pv.session_id] = (pageViewCounts[pv.session_id] || 0) + 1;
            if (!recentPagesMap[pv.session_id]) recentPagesMap[pv.session_id] = [];
            recentPagesMap[pv.session_id].push(pv.page_path);
          }
        });

        const toolCounts: Record<string, number> = {};
        toolInteractions.forEach(t => {
          if (sessionIds.includes(t.session_id)) {
            toolCounts[t.session_id] = (toolCounts[t.session_id] || 0) + 1;
          }
        });

        const sessionLeadData: Record<string, { email: string | null; phone: string | null; fullName: string | null; companyEmployees: string | null }> = {};
        
        formSubmissions.forEach(fs => {
          if (fs.session_id && fs.form_data) {
            const data = fs.form_data as any;
            if (!sessionLeadData[fs.session_id]) {
              sessionLeadData[fs.session_id] = { email: null, phone: null, fullName: null, companyEmployees: null };
            }
            if (data.email) sessionLeadData[fs.session_id].email = data.email;
            if (data.phone) sessionLeadData[fs.session_id].phone = data.phone;
            if (data.full_name || data.name) sessionLeadData[fs.session_id].fullName = data.full_name || data.name;
            if (data.company_employees) sessionLeadData[fs.session_id].companyEmployees = data.company_employees;
          }
        });

        const enrichedSessions: ActiveSession[] = sessions.map(session => {
          const leadData = sessionLeadData[session.session_id] || { email: null, phone: null, fullName: null, companyEmployees: null };
          
          return {
            session_id: session.session_id,
            started_at: session.started_at,
            last_activity_at: session.last_activity_at,
            first_page: session.first_page,
            referrer: session.referrer,
            user_agent: session.user_agent,
            pageViewCount: pageViewCounts[session.session_id] || 0,
            toolsUsedCount: toolCounts[session.session_id] || 0,
            email: leadData.email,
            phone: leadData.phone,
            fullName: leadData.fullName,
            companyEmployees: leadData.companyEmployees,
            recentPages: (recentPagesMap[session.session_id] || []).slice(-3),
          };
        });

        setActiveSessions(enrichedSessions);
      } else {
        setActiveSessions([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('visitor-engagement')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_sessions' }, fetchData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'page_views' }, fetchData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tool_interactions' }, fetchData)
      .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));

    const interval = setInterval(fetchData, 30000);
    return () => { channel.unsubscribe(); clearInterval(interval); };
  }, [fetchData]);

  const getTimeOnSite = useCallback((startedAt: string) => {
    const seconds = differenceInSeconds(new Date(), new Date(startedAt));
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }, []);

  const getHeatColor = useCallback((score: number) => {
    const intensity = score / maxScore;
    if (intensity > 0.8) return 'from-red-500/20 to-orange-500/20';
    if (intensity > 0.6) return 'from-orange-500/20 to-amber-500/20';
    if (intensity > 0.4) return 'from-amber-500/20 to-yellow-500/20';
    if (intensity > 0.2) return 'from-yellow-500/20 to-lime-500/20';
    return 'from-lime-500/20 to-green-500/20';
  }, [maxScore]);

  const getHeatBorder = useCallback((score: number) => {
    const intensity = score / maxScore;
    if (intensity > 0.8) return 'border-red-500/40';
    if (intensity > 0.6) return 'border-orange-500/40';
    if (intensity > 0.4) return 'border-amber-500/40';
    if (intensity > 0.2) return 'border-yellow-500/40';
    return 'border-green-500/40';
  }, [maxScore]);

  const formatPageName = useCallback((path: string) => {
    if (path === '/') return 'Home';
    return path.replace(/^\//, '').replace(/-/g, ' ').split('/')[0].slice(0, 12);
  }, []);

  const getEngagementLevel = useCallback((session: ActiveSession) => {
    const score = session.pageViewCount + (session.toolsUsedCount * 2);
    if (score >= 10) return { label: 'Hot', color: 'bg-red-500/20 text-red-400 border-red-500/30', cardStyle: 'border-red-500/40 bg-gradient-to-br from-red-500/10 to-orange-500/5' };
    if (score >= 5) return { label: 'Warm', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', cardStyle: 'border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-amber-500/5' };
    if (score >= 2) return { label: 'Active', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', cardStyle: 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/5' };
    return { label: 'New', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', cardStyle: 'border-primary/30 bg-gradient-to-br from-primary/10 to-violet-500/5' };
  }, []);

  const getDeviceType = useCallback((userAgent: string | null) => {
    if (!userAgent) return 'desktop';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
    return 'desktop';
  }, []);

  const getReferrerBadge = useCallback((referrer: string | null) => {
    if (!referrer) return { label: 'Direct', icon: Globe, color: 'text-blue-400' };
    try {
      const hostname = new URL(referrer).hostname;
      if (hostname.includes('google')) return { label: 'Google', icon: TrendingUp, color: 'text-green-400' };
      if (hostname.includes('facebook') || hostname.includes('instagram')) return { label: 'Social', icon: Users, color: 'text-pink-400' };
      if (hostname.includes('linkedin')) return { label: 'LinkedIn', icon: Building, color: 'text-blue-400' };
      return { label: hostname.slice(0, 10), icon: Globe, color: 'text-muted-foreground' };
    } catch {
      return { label: 'Referral', icon: ArrowRight, color: 'text-violet-400' };
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="ml-3 text-sm text-muted-foreground">Loading engagement data...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/20">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground">Live Visitor Engagement</h3>
              <span className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                <Radio className="w-2 h-2" />
                LIVE
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Active sessions & page heatmap</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-[10px]">
              <Wifi className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">
              <WifiOff className="w-3 h-3 mr-1" />
              Connecting
            </Badge>
          )}
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
            <Users className="w-3 h-3 mr-1" />
            {activeSessions.length} Online
          </Badge>
        </div>
      </div>

      {/* Page Heatmap Strip */}
      <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-secondary/40 to-secondary/20 border border-border/50 relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-orange-500/20">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <span className="text-xs font-semibold text-foreground">Top Pages by Engagement</span>
          <div className="flex items-center gap-1.5 ml-auto text-[10px] text-muted-foreground">
            <span className="w-3 h-1.5 rounded-full bg-gradient-to-r from-green-500 to-lime-500" />
            <span>Cool</span>
            <span className="w-3 h-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 ml-2" />
            <span>Hot</span>
          </div>
        </div>
        
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(pageData.length || 1, 5)}, minmax(0, 1fr))` }}>
          {pageData.slice(0, 5).map((page, i) => (
            <div
              key={page.page_path}
              className={`relative p-3 rounded-lg bg-gradient-to-br ${getHeatColor(page.engagementScore)} border ${getHeatBorder(page.engagementScore)} transition-transform hover:scale-[1.02] cursor-pointer`}
            >
              <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold text-foreground">
                {i + 1}
              </div>
              <p className="text-sm font-medium text-foreground truncate pl-2">{formatPageName(page.page_path)}</p>
              <div className="flex items-center gap-3 mt-2 pl-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />{page.views}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MousePointer className="w-3 h-3" />{page.toolInteractions}
                </span>
              </div>
            </div>
          ))}
          {pageData.length === 0 && (
            <span className="text-xs text-muted-foreground py-2 col-span-full text-center">No page data yet</span>
          )}
        </div>
      </div>

      {/* Active Visitor Cards */}
      {activeSessions.length === 0 ? (
        <div className="text-center py-12 relative z-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">No active visitors in the last 5 minutes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 relative z-10">
          {activeSessions.slice(0, 9).map((session, index) => {
            const engagement = getEngagementLevel(session);
            const device = getDeviceType(session.user_agent);
            const referrer = getReferrerBadge(session.referrer);
            const ReferrerIcon = referrer.icon;
            
            return (
              <div
                key={session.session_id}
                className={`relative p-4 rounded-xl overflow-hidden border ${engagement.cardStyle} transition-all duration-200 hover:shadow-lg cursor-pointer group`}
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-violet-500 to-cyan-500 opacity-60" />
                
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/20 flex items-center justify-center">
                      {session.fullName || session.email ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <span className="text-xs font-bold text-primary">
                          {session.session_id.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      {/* Status dot */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground truncate max-w-[140px]">
                        {session.fullName || session.email?.split('@')[0] || `Visitor ${session.session_id.slice(0, 6)}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[9px] ${engagement.color}`}>
                    {engagement.label}
                  </Badge>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-secondary/40 text-center">
                    <p className="text-lg font-bold text-foreground">{session.pageViewCount}</p>
                    <p className="text-[9px] text-muted-foreground">Pages</p>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/40 text-center">
                    <p className="text-lg font-bold text-foreground">{session.toolsUsedCount}</p>
                    <p className="text-[9px] text-muted-foreground">Actions</p>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/40 text-center">
                    <p className="text-lg font-bold text-foreground">{getTimeOnSite(session.started_at)}</p>
                    <p className="text-[9px] text-muted-foreground">Time</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="flex items-center gap-1.5">
                    <ReferrerIcon className={`w-3 h-3 ${referrer.color}`} />
                    <span className="text-[10px] text-muted-foreground">{referrer.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {device === 'mobile' ? (
                      <Smartphone className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <Monitor className="w-3 h-3 text-muted-foreground" />
                    )}
                    {session.email && <Mail className="w-3 h-3 text-green-400" />}
                    {session.phone && <Phone className="w-3 h-3 text-blue-400" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VisitorEngagementPanel;
