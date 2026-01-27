import { useState, useEffect, useMemo } from "react";
import { MessageCircle, Users, ChevronRight, ChevronLeft, Clock, Globe, Mail, Phone, Eye, MousePointer, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

interface LiveVisitor {
  session_id: string;
  current_page: string | null;
  first_page: string | null;
  started_at: string | null;
  last_activity_at: string | null;
  referrer: string | null;
  user_id: string | null;
}

interface ChatSidebarProps {
  className?: string;
}

const ChatSidebar = ({ className }: ChatSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<LiveVisitor | null>(null);
  const [visitors, setVisitors] = useState<LiveVisitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageViews, setPageViews] = useState<Record<string, number>>({});

  // Fetch live visitors
  const fetchVisitors = async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('live_visitors')
        .select('*')
        .gte('last_activity_at', fiveMinutesAgo)
        .order('last_activity_at', { ascending: false })
        .limit(25);

      if (error) throw error;
      
      // Deduplicate by session_id
      const uniqueVisitors = (data || []).reduce((acc: LiveVisitor[], curr) => {
        if (!acc.find(v => v.session_id === curr.session_id)) {
          acc.push(curr);
        }
        return acc;
      }, []);

      setVisitors(uniqueVisitors);

      // Fetch page view counts for each session
      if (uniqueVisitors.length > 0) {
        const sessionIds = uniqueVisitors.map(v => v.session_id);
        const { data: pvData } = await supabase
          .from('page_views')
          .select('session_id')
          .in('session_id', sessionIds);
        
        if (pvData) {
          const counts: Record<string, number> = {};
          pvData.forEach(pv => {
            counts[pv.session_id] = (counts[pv.session_id] || 0) + 1;
          });
          setPageViews(counts);
        }
      }
    } catch (err) {
      console.error('Error fetching live visitors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchVisitors();
    
    // Poll every 10 seconds for updates
    const interval = setInterval(fetchVisitors, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('live-visitors-sidebar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitor_sessions' },
        () => {
          fetchVisitors();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'page_views' },
        () => {
          fetchVisitors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  const getPageName = (path?: string | null) => {
    if (!path) return "Unknown";
    if (path === "/") return "Home";
    const segments = path.split("/").filter(Boolean);
    const last = segments.pop() || path;
    return last.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  const getVisitorIcon = (visitor: LiveVisitor) => {
    if (visitor.user_id) {
      return <User className="h-3.5 w-3.5 text-primary" />;
    }
    return <Globe className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const getVisitorLabel = (visitor: LiveVisitor) => {
    if (visitor.user_id) return "Logged In";
    return "Anonymous";
  };

  const getReferrerHost = (url?: string | null) => {
    if (!url) return null;
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div 
      className={cn(
        "h-full bg-card/95 backdrop-blur-md border-l border-border/50 flex flex-col transition-[width] duration-200 ease-out shadow-xl",
        isExpanded ? "w-80" : "w-14",
        className
      )}
      style={{ contain: "layout" }}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-border/50 shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
        {isExpanded ? (
          <>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Eye className="h-4 w-4 text-primary" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <span className="font-medium text-sm">Live Visitors</span>
              <Badge variant="secondary" className="text-xs h-5 bg-green-500/10 text-green-500 border-green-500/20">
                {visitors.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setIsExpanded(false);
                setSelectedVisitor(null);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 mx-auto relative"
            onClick={() => setIsExpanded(true)}
          >
            <Eye className="h-4 w-4" />
            {visitors.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold animate-pulse">
                {visitors.length > 9 ? "9+" : visitors.length}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 flex overflow-hidden">
          {/* Visitor List */}
          <div className={cn(
            "flex flex-col transition-[width] duration-200",
            selectedVisitor ? "w-0 overflow-hidden" : "w-full"
          )}>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : visitors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No active visitors</p>
                    <p className="text-xs mt-1">Visitors active in the last 5 min appear here</p>
                  </div>
                ) : (
                  visitors.map((visitor) => (
                    <button
                      key={visitor.session_id}
                      onClick={() => setSelectedVisitor(visitor)}
                      className="w-full p-2.5 rounded-lg text-left hover:bg-muted/50 transition-colors group border border-transparent hover:border-border/50"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                          visitor.user_id 
                            ? "bg-gradient-to-br from-primary/30 to-primary/10" 
                            : "bg-gradient-to-br from-muted to-muted/50"
                        )}>
                          {getVisitorIcon(visitor)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                            <span className="text-xs font-medium truncate">
                              {getPageName(visitor.current_page)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">
                              {formatTime(visitor.last_activity_at)}
                            </span>
                            {pageViews[visitor.session_id] > 1 && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <MousePointer className="h-2.5 w-2.5" />
                                {pageViews[visitor.session_id]} pages
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Visitor Detail */}
          {selectedVisitor && (
            <div className="w-full flex flex-col animate-in slide-in-from-right-2 duration-200">
              <div className="p-3 border-b border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 -ml-2 text-xs"
                  onClick={() => setSelectedVisitor(null)}
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Back
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Visitor Header */}
                  <div className="text-center">
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-2",
                      selectedVisitor.user_id 
                        ? "bg-gradient-to-br from-primary/30 to-primary/10" 
                        : "bg-gradient-to-br from-muted to-muted/50"
                    )}>
                      {selectedVisitor.user_id 
                        ? <User className="h-5 w-5 text-primary" />
                        : <Globe className="h-5 w-5 text-muted-foreground" />
                      }
                    </div>
                    <h3 className="font-medium text-sm">{getVisitorLabel(selectedVisitor)}</h3>
                    <p className="text-xs text-muted-foreground">
                      Session: {selectedVisitor.session_id.slice(0, 12)}...
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] text-green-500 font-medium">Active now</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Activity Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Activity
                    </h4>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <Eye className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Current Page</p>
                          <p className="text-sm font-medium truncate">{getPageName(selectedVisitor.current_page)}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{selectedVisitor.current_page}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="h-7 w-7 rounded bg-muted/50 flex items-center justify-center shrink-0">
                          <MousePointer className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pages Viewed</p>
                          <p className="text-sm font-medium">{pageViews[selectedVisitor.session_id] || 1} pages</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="h-7 w-7 rounded bg-muted/50 flex items-center justify-center shrink-0">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Session Started</p>
                          <p className="text-sm font-medium">{formatTime(selectedVisitor.started_at)}</p>
                        </div>
                      </div>

                      {selectedVisitor.referrer && (
                        <div className="flex items-start gap-2.5">
                          <div className="h-7 w-7 rounded bg-muted/50 flex items-center justify-center shrink-0">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Referrer</p>
                            <p className="text-sm font-medium truncate">
                              {getReferrerHost(selectedVisitor.referrer)}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-2.5">
                        <div className="h-7 w-7 rounded bg-muted/50 flex items-center justify-center shrink-0">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Entry Page</p>
                          <p className="text-sm font-medium truncate">{getPageName(selectedVisitor.first_page)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </h4>
                    <div className="grid gap-2">
                      <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs">
                        <MessageCircle className="h-3 w-3 mr-2" />
                        Start Chat
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs">
                        <Mail className="h-3 w-3 mr-2" />
                        Send Email
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs">
                        <Phone className="h-3 w-3 mr-2" />
                        Request Call
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      )}

      {/* Collapsed State - Quick Stats */}
      {!isExpanded && (
        <div className="flex-1 flex flex-col items-center py-4 gap-3">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">{visitors.length}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Live</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
