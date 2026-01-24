import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, Clock, Eye, MousePointer, Mail, Phone, User, 
  Building, Activity, Wifi, WifiOff, Flame, TrendingUp,
  Globe, MapPin, Monitor, Smartphone, ArrowRight, Zap, MessageCircle, Bell
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

interface ChatConversation {
  id: string;
  session_id: string;
  status: string;
  last_message_at: string;
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

  const fetchData = async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      // Fetch all data in parallel
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
      const leads = leadsRes.data || [];
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

        // Build a map of session_id to lead data from form submissions
        const sessionLeadData: Record<string, { email: string | null; phone: string | null; fullName: string | null; companyEmployees: string | null }> = {};
        
        formSubmissions.forEach(fs => {
          if (fs.session_id && fs.form_data) {
            const data = fs.form_data as any;
            if (!sessionLeadData[fs.session_id]) {
              sessionLeadData[fs.session_id] = { email: null, phone: null, fullName: null, companyEmployees: null };
            }
            // Merge data from form submissions
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
  };

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
  }, []);

  const getTimeOnSite = (startedAt: string) => {
    const seconds = differenceInSeconds(new Date(), new Date(startedAt));
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getHeatColor = (score: number) => {
    const intensity = score / maxScore;
    if (intensity > 0.8) return 'from-red-500 to-orange-500';
    if (intensity > 0.6) return 'from-orange-500 to-amber-500';
    if (intensity > 0.4) return 'from-amber-500 to-yellow-500';
    if (intensity > 0.2) return 'from-yellow-500 to-lime-500';
    return 'from-lime-500 to-green-500';
  };

  const getHeatTextColor = (score: number) => {
    const intensity = score / maxScore;
    if (intensity > 0.8) return 'text-red-400';
    if (intensity > 0.6) return 'text-orange-400';
    if (intensity > 0.4) return 'text-amber-400';
    if (intensity > 0.2) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatPageName = (path: string) => {
    if (path === '/') return 'Home';
    return path.replace(/^\//, '').replace(/-/g, ' ').split('/')[0].slice(0, 12);
  };

  const getEngagementLevel = (session: ActiveSession) => {
    const score = session.pageViewCount + (session.toolsUsedCount * 2);
    if (score >= 10) return { label: 'Hot', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    if (score >= 5) return { label: 'Warm', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    if (score >= 2) return { label: 'Active', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    return { label: 'New', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  };

  const getDeviceType = (userAgent: string | null) => {
    if (!userAgent) return 'desktop';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
    return 'desktop';
  };

  const getReferrerBadge = (referrer: string | null) => {
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
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-muted animate-pulse" />
          <span className="text-sm text-muted-foreground">Loading engagement data...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Live Visitor Engagement</h3>
            <p className="text-xs text-muted-foreground">Active sessions & page heatmap</p>
          </div>
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
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <Users className="w-3 h-3 mr-1" />
            {activeSessions.length} Online
          </Badge>
        </div>
      </div>

      {/* Page Heatmap Strip - Full Width */}
      <div className="mb-5 p-3 rounded-xl bg-secondary/30 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-semibold text-foreground">Top Pages</span>
          <div className="flex items-center gap-1 ml-auto text-[10px] text-muted-foreground">
            <span className="w-2 h-2 rounded bg-gradient-to-r from-green-500 to-lime-500" />Cool
            <span className="w-2 h-2 rounded bg-gradient-to-r from-red-500 to-orange-500 ml-1" />Hot
          </div>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(pageData.length || 1, 10)}, minmax(0, 1fr))` }}>
          {pageData.map((page, i) => (
            <div
              key={page.page_path}
              className="relative group"
            >
              <div className={`px-3 py-3 rounded-lg bg-gradient-to-br ${getHeatColor(page.engagementScore)} bg-opacity-20 border border-white/10 hover:scale-[1.02] transition-transform cursor-pointer h-full`}>
                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold">
                  {i + 1}
                </div>
                <p className="text-sm font-medium text-foreground truncate">{formatPageName(page.page_path)}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="w-3 h-3" />{page.views}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MousePointer className="w-3 h-3" />{page.toolInteractions}
                  </span>
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-full bg-gradient-to-r ${getHeatColor(page.engagementScore)}`} />
            </div>
          ))}
          {pageData.length === 0 && (
            <span className="text-xs text-muted-foreground py-2 col-span-full">No page data yet</span>
          )}
        </div>
      </div>

      {/* Active Visitor Cards */}
      {activeSessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No active visitors in the last 5 minutes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {activeSessions.slice(0, 9).map((session, index) => {
              const engagement = getEngagementLevel(session);
              const device = getDeviceType(session.user_agent);
              const referrer = getReferrerBadge(session.referrer);
              const ReferrerIcon = referrer.icon;
              const isHot = engagement.label === 'Hot';
              const isWarm = engagement.label === 'Warm';
              
              return (
                <div
                  key={session.session_id}
                  className={`relative p-4 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer group h-[220px] flex flex-col
                    ${isHot 
                      ? 'bg-gradient-to-br from-red-500/10 via-orange-500/5 to-amber-500/10 border-2 border-red-500/30 shadow-lg shadow-red-500/10' 
                      : isWarm 
                        ? 'bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-yellow-500/10 border border-orange-500/30 shadow-md shadow-orange-500/10'
                        : 'bg-gradient-to-br from-primary/10 via-violet-500/5 to-cyan-500/10 border border-primary/20'
                    }`}
                >
                  {/* Animated background glow for hot visitors */}
                  {isHot && (
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-orange-500/10 to-red-500/0 animate-pulse" />
                  )}
                  
                  {/* Top accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    isHot ? 'from-red-500 via-orange-500 to-amber-500' 
                    : isWarm ? 'from-orange-500 via-amber-500 to-yellow-500'
                    : 'from-primary via-violet-500 to-cyan-500'
                  }`} />
                  
                  {/* Engagement pulse indicator */}
                  <div className={`absolute top-4 right-4 flex items-center gap-2`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      isHot ? 'bg-red-500 animate-ping' : isWarm ? 'bg-orange-500 animate-pulse' : 'bg-green-500'
                    }`} />
                    <div className={`w-2.5 h-2.5 rounded-full absolute ${
                      isHot ? 'bg-red-500' : isWarm ? 'bg-orange-500' : 'bg-green-500'
                    }`} />
                  </div>
                  
                  {/* Header row */}
                  <div className="flex items-start gap-3 mb-4 relative z-10">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                        isHot 
                          ? 'bg-gradient-to-br from-red-500/30 to-orange-500/30 border-2 border-red-500/40 shadow-lg shadow-red-500/20' 
                          : isWarm 
                            ? 'bg-gradient-to-br from-orange-500/30 to-amber-500/30 border border-orange-500/30'
                            : 'bg-gradient-to-br from-primary/30 to-violet-500/30 border border-primary/30'
                      }`}>
                        {device === 'mobile' ? (
                          <Smartphone className={`w-6 h-6 ${isHot ? 'text-red-400' : isWarm ? 'text-orange-400' : 'text-primary'}`} />
                        ) : (
                          <Monitor className={`w-6 h-6 ${isHot ? 'text-red-400' : isWarm ? 'text-orange-400' : 'text-primary'}`} />
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        isHot ? 'bg-red-500 text-white' : isWarm ? 'bg-orange-500 text-white' : 'bg-primary text-white'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge className={`text-[10px] px-2 py-0.5 font-bold flex-shrink-0 ${
                          isHot ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                          : isWarm ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                          : 'bg-primary/20 text-primary border-primary/40'
                        }`}>
                          <Zap className="w-3 h-3 mr-1" />
                          {engagement.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-background/50 flex-shrink-0 max-w-[80px] truncate">
                          <ReferrerIcon className={`w-3 h-3 mr-1 flex-shrink-0 ${referrer.color}`} />
                          <span className="truncate">{referrer.label.slice(0, 8)}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        Entry: <span className="text-foreground font-medium truncate">{formatPageName(session.first_page || '/')}</span>
                      </p>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-2 mb-3 relative z-10 flex-shrink-0">
                    {[
                      { icon: Clock, value: getTimeOnSite(session.started_at), color: 'text-cyan-400', bg: 'from-cyan-500/20 to-cyan-500/5' },
                      { icon: Eye, value: session.pageViewCount, color: 'text-violet-400', bg: 'from-violet-500/20 to-violet-500/5' },
                      { icon: MousePointer, value: session.toolsUsedCount, color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-500/5' },
                      { icon: Activity, value: formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: false }).replace(' minutes', 'm').replace(' seconds', 's').replace('less than a minute', '<1m').replace(' minute', 'm').replace(' second', 's').slice(0, 4), color: 'text-green-400', bg: 'from-green-500/20 to-green-500/5' },
                    ].map((stat, i) => (
                      <div key={i} className={`text-center p-2 rounded-xl bg-gradient-to-b ${stat.bg} border border-white/5 backdrop-blur-sm transition-transform hover:scale-105`}>
                        <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                        <span className="text-xs font-bold text-foreground truncate block">{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Journey trail */}
                  {session.recentPages.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3 overflow-hidden relative z-10">
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 font-medium">Path:</span>
                      {session.recentPages.slice(-3).map((page, i) => (
                        <span key={i} className="flex items-center text-[10px]">
                          {i > 0 && <ArrowRight className="w-3 h-3 mx-1 text-primary/50" />}
                          <span className="px-2 py-1 rounded-lg bg-background/60 text-foreground font-medium truncate max-w-[70px] border border-border/30">
                            {formatPageName(page)}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Data indicators - only show if we have actual data */}
                  {(session.email || session.phone || session.fullName || session.companyEmployees) && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/30 relative z-10 mt-auto flex-shrink-0 overflow-hidden">
                      <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0">Captured:</span>
                      <div className="flex gap-1 ml-auto overflow-hidden">
                        {session.email && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 flex-shrink-0" title={session.email}>
                            <Mail className="w-3 h-3 text-blue-400" />
                          </div>
                        )}
                        {session.phone && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 flex-shrink-0" title={session.phone}>
                            <Phone className="w-3 h-3 text-amber-400" />
                          </div>
                        )}
                        {session.fullName && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-500/20 border border-orange-500/30 flex-shrink-0" title={session.fullName}>
                            <User className="w-3 h-3 text-orange-400" />
                          </div>
                        )}
                        {session.companyEmployees && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/30 flex-shrink-0" title={session.companyEmployees}>
                            <Building className="w-3 h-3 text-green-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
          })}
        </div>
      )}
    </Card>
  );
};

export default VisitorEngagementPanel;
