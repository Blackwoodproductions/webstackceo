import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Clock, CheckCircle2, XCircle, Loader2, RefreshCw,
  ChevronDown, ChevronUp, Globe, Target, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCadeEventTasks } from "@/hooks/use-cade-event-tasks";

// ─── Types ───
interface EventBackedTask {
  id: string;
  domain: string;
  status: string;
  request_id?: string;
  target_request_id?: string;
  user_id?: string;
  progress?: number;
  pages_crawled?: number;
  total_pages?: number;
  created_at?: string;
  error?: string;
}

interface CADETaskMonitorProps {
  domain?: string;
  onRefresh?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// ─── Component ───
export const CADETaskMonitor = ({ 
  domain, 
  onRefresh,
  isCollapsed = false,
  onToggleCollapse
}: CADETaskMonitorProps) => {
  const { byType, isLoading, error, refresh } = useCadeEventTasks(domain);

  const crawlTasks: EventBackedTask[] = useMemo(() => byType.crawl, [byType.crawl]);
  const categorizationTasks: EventBackedTask[] = useMemo(() => byType.categorization, [byType.categorization]);
  const contentTasks: EventBackedTask[] = useMemo(() => byType.content, [byType.content]);

  const handleRefresh = () => {
    refresh();
    onRefresh?.();
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "done":
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "processing":
      case "running":
      case "in_progress":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "pending":
      case "queued":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "failed":
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "done":
      case "success":
        return "bg-green-500/15 text-green-600 border-green-500/30";
      case "processing":
      case "running":
      case "in_progress":
        return "bg-blue-500/15 text-blue-600 border-blue-500/30";
      case "pending":
      case "queued":
        return "bg-amber-500/15 text-amber-600 border-amber-500/30";
      case "failed":
      case "error":
        return "bg-red-500/15 text-red-600 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleString();
  };

  const totalActiveTasks = 
    crawlTasks.filter(t => t.status.toLowerCase().includes("running") || t.status.toLowerCase().includes("processing") || t.status.toLowerCase().includes("pending") || t.status.toLowerCase().includes("queued")).length +
    categorizationTasks.filter(t => t.status.toLowerCase().includes("running") || t.status.toLowerCase().includes("processing") || t.status.toLowerCase().includes("pending") || t.status.toLowerCase().includes("queued")).length;

  const totalTasks = crawlTasks.length + categorizationTasks.length + contentTasks.length;

  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-background to-blue-500/5">
      <Collapsible open={!isCollapsed} onOpenChange={() => onToggleCollapse?.()}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-blue-400" />
                Task Monitor
                {totalActiveTasks > 0 && (
                  <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {totalActiveTasks} active
                  </Badge>
                )}
              </CardTitle>
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {totalTasks} total
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-blue-500/30 hover:bg-blue-500/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {error}
              </div>
            )}

            {isLoading && totalTasks === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : totalTasks === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No tasks found</p>
                <p className="text-xs mt-1">Start a crawl to see tasks here</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {/* Crawl Tasks */}
                  {crawlTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2 text-muted-foreground">
                        <Globe className="w-4 h-4" />
                        Crawl Tasks ({crawlTasks.length})
                      </h4>
                      <div className="space-y-2">
                        {crawlTasks.map((task, idx) => (
                          <TaskRow
                            key={task.id || idx}
                            task={task}
                            type="crawl"
                            getStatusIcon={getStatusIcon}
                            getStatusBadgeClass={getStatusBadgeClass}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categorization Tasks */}
                  {categorizationTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2 text-muted-foreground">
                        <Target className="w-4 h-4" />
                        Categorization Tasks ({categorizationTasks.length})
                      </h4>
                      <div className="space-y-2">
                        {categorizationTasks.map((task, idx) => (
                          <TaskRow
                            key={task.id || idx}
                            task={task}
                            type="categorization"
                            getStatusIcon={getStatusIcon}
                            getStatusBadgeClass={getStatusBadgeClass}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Tasks */}
                  {contentTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        Content Tasks ({contentTasks.length})
                      </h4>
                      <div className="space-y-2">
                        {contentTasks.map((task, idx) => (
                          <TaskRow
                            key={task.id || idx}
                            task={task}
                            type="content"
                            getStatusIcon={getStatusIcon}
                            getStatusBadgeClass={getStatusBadgeClass}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// ─── Task Row Component ───
interface TaskRowProps {
  task: EventBackedTask;
  type: "crawl" | "categorization" | "content";
  getStatusIcon: (status?: string) => React.ReactNode;
  getStatusBadgeClass: (status?: string) => string;
  formatDate: (date?: string) => string;
}

const TaskRow = ({ task, type, getStatusIcon, getStatusBadgeClass, formatDate }: TaskRowProps) => {
  const statusLower = (task.status || "").toLowerCase();
  const isActive =
    statusLower.includes("processing") ||
    statusLower.includes("pending") ||
    statusLower.includes("running") ||
    statusLower.includes("queued");
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-3 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getStatusIcon(task.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {task.domain || "Unknown"}
              </span>
              <Badge className={`text-xs ${getStatusBadgeClass(task.status)}`}>
                {task.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              {type === "crawl" && task.pages_crawled !== undefined && (
                <span>{task.pages_crawled} / {task.total_pages || "?"} pages</span>
              )}
              <span>{formatDate(task.created_at)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Progress for crawl tasks */}
          {type === "crawl" && task.progress !== undefined && isActive && (
            <div className="w-20">
              <Progress value={task.progress} className="h-1.5" />
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {task.error && (
        <div className="mt-2 p-2 rounded bg-red-500/10 text-xs text-red-400">
          {task.error}
        </div>
      )}
    </motion.div>
  );
};

export default CADETaskMonitor;
