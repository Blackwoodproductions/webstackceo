import { useState, useMemo } from "react";
import { MessageCircle, Users, ChevronRight, ChevronLeft, Clock, Globe, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Visitor {
  session_id: string;
  current_page?: string;
  first_page?: string;
  started_at?: string;
  last_activity_at?: string;
  referrer?: string;
}

interface ChatSidebarProps {
  visitors: Visitor[];
  className?: string;
}

const ChatSidebar = ({ visitors, className }: ChatSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  const activeVisitors = useMemo(() => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    return visitors
      .filter(v => {
        const lastActivity = v.last_activity_at ? new Date(v.last_activity_at).getTime() : 0;
        return lastActivity > fiveMinutesAgo;
      })
      .slice(0, 20);
  }, [visitors]);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  const getPageName = (path?: string) => {
    if (!path) return "Unknown";
    if (path === "/") return "Home";
    return path.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || path;
  };

  return (
    <div 
      className={cn(
        "h-full bg-card/80 backdrop-blur-sm border-l border-border/50 flex flex-col transition-[width] duration-200 ease-out",
        isExpanded ? "w-80" : "w-14",
        className
      )}
      style={{ contain: "layout" }}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-border/50 shrink-0">
        {isExpanded ? (
          <>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Live Visitors</span>
              <Badge variant="secondary" className="text-xs h-5">
                {activeVisitors.length}
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
            className="h-8 w-8 mx-auto"
            onClick={() => setIsExpanded(true)}
          >
            <div className="relative">
              <Users className="h-4 w-4" />
              {activeVisitors.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold">
                  {activeVisitors.length > 9 ? "+" : activeVisitors.length}
                </span>
              )}
            </div>
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
                {activeVisitors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No active visitors
                  </div>
                ) : (
                  activeVisitors.map((visitor) => (
                    <button
                      key={visitor.session_id}
                      onClick={() => setSelectedVisitor(visitor)}
                      className="w-full p-2.5 rounded-lg text-left hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                          <Globe className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-medium truncate">
                              {getPageName(visitor.current_page)}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {formatTime(visitor.last_activity_at)}
                          </p>
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
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-medium text-sm">Anonymous Visitor</h3>
                    <p className="text-xs text-muted-foreground">
                      Session: {selectedVisitor.session_id.slice(0, 8)}...
                    </p>
                  </div>

                  <Separator />

                  {/* Activity Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Activity
                    </h4>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="h-7 w-7 rounded bg-muted/50 flex items-center justify-center shrink-0">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Current Page</p>
                          <p className="text-sm font-medium">{getPageName(selectedVisitor.current_page)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="h-7 w-7 rounded bg-muted/50 flex items-center justify-center shrink-0">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Started</p>
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
                              {new URL(selectedVisitor.referrer).hostname}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-2.5">
                        <div className="h-7 w-7 rounded bg-muted/50 flex items-center justify-center shrink-0">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Entry Page</p>
                          <p className="text-sm font-medium">{getPageName(selectedVisitor.first_page)}</p>
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
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{activeVisitors.length}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Live</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
