import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, Clock, CheckCircle2, XCircle, Loader2, RefreshCw,
  ChevronDown, ChevronUp, Globe, Target, FileText, Palette,
  Link2, Hash, MapPin, Languages, Info, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCadeEventTasks, CadeEventTask } from "@/hooks/use-cade-event-tasks";

interface CADETaskMonitorProps {
  domain?: string;
  onRefresh?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isEmbedded?: boolean;
}

export const CADETaskMonitor = ({ 
  domain, 
  onRefresh,
  isCollapsed = false,
  onToggleCollapse,
  isEmbedded = false
}: CADETaskMonitorProps) => {
  const { byType, isLoading, error, refresh } = useCadeEventTasks(domain);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const crawlTasks = useMemo(() => byType.crawl, [byType.crawl]);
  const categorizationTasks = useMemo(() => byType.categorization, [byType.categorization]);
  const contentTasks = useMemo(() => byType.content, [byType.content]);
  const cssTasks = useMemo(() => byType.css, [byType.css]);

  const handleRefresh = () => {
    refresh();
    onRefresh?.();
  };

  const getStatusIcon = (statusValue?: string) => {
    const s = (statusValue || "").toLowerCase();
    if (s === "completed" || s === "done" || s === "success") {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    if (s === "processing" || s === "running" || s === "in_progress") {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    if (s === "pending" || s === "queued") {
      return <Clock className="w-4 h-4 text-amber-500" />;
    }
    if (s === "failed" || s === "error") {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return <Activity className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusBadgeClass = (statusValue?: string) => {
    const s = (statusValue || "").toLowerCase();
    if (s === "completed" || s === "done" || s === "success") {
      return "bg-green-500/15 text-green-600 border-green-500/30";
    }
    if (s === "processing" || s === "running" || s === "in_progress") {
      return "bg-blue-500/15 text-blue-600 border-blue-500/30";
    }
    if (s === "pending" || s === "queued") {
      return "bg-amber-500/15 text-amber-600 border-amber-500/30";
    }
    if (s === "failed" || s === "error") {
      return "bg-red-500/15 text-red-600 border-red-500/30";
    }
    return "bg-muted text-muted-foreground";
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleString();
  };

  const isActiveStatus = (statusValue: string) => {
    const s = statusValue.toLowerCase();
    return s.includes("processing") || s.includes("pending") || s.includes("running") || s.includes("queued");
  };

  const totalActiveTasks = 
    crawlTasks.filter(t => isActiveStatus(t.statusValue)).length +
    categorizationTasks.filter(t => isActiveStatus(t.statusValue)).length +
    cssTasks.filter(t => isActiveStatus(t.statusValue)).length;

  const totalTasks = crawlTasks.length + categorizationTasks.length + contentTasks.length + cssTasks.length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "crawl": return <Globe className="w-4 h-4" />;
      case "categorization": return <Target className="w-4 h-4" />;
      case "content": return <FileText className="w-4 h-4" />;
      case "css": return <Palette className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "crawl": return "Crawl";
      case "categorization": return "Categorization";
      case "content": return "Content";
      case "css": return "CSS Analysis";
      default: return type;
    }
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const innerContent = (
    <>
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {isLoading && totalTasks === 0 ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : totalTasks === 0 ? (
        <div className="text-center py-3 text-muted-foreground">
          <Activity className="w-6 h-6 mx-auto mb-1 opacity-30" />
          <p className="text-xs">No tasks found</p>
        </div>
      ) : (
        <ScrollArea className={isEmbedded ? "h-[140px]" : "h-[200px]"}>
          <div className="space-y-2">
            {/* Crawl Tasks */}
            <TaskSection
              title="Crawl Tasks"
              icon={<Globe className="w-4 h-4" />}
              tasks={crawlTasks}
              type="crawl"
              expandedTaskId={expandedTaskId}
              onToggleExpand={toggleExpand}
              getStatusIcon={getStatusIcon}
              getStatusBadgeClass={getStatusBadgeClass}
              formatDate={formatDate}
              isActiveStatus={isActiveStatus}
            />

            {/* Categorization Tasks */}
            <TaskSection
              title="Categorization Tasks"
              icon={<Target className="w-4 h-4" />}
              tasks={categorizationTasks}
              type="categorization"
              expandedTaskId={expandedTaskId}
              onToggleExpand={toggleExpand}
              getStatusIcon={getStatusIcon}
              getStatusBadgeClass={getStatusBadgeClass}
              formatDate={formatDate}
              isActiveStatus={isActiveStatus}
            />

            {/* CSS Tasks */}
            <TaskSection
              title="CSS Analysis Tasks"
              icon={<Palette className="w-4 h-4" />}
              tasks={cssTasks}
              type="css"
              expandedTaskId={expandedTaskId}
              onToggleExpand={toggleExpand}
              getStatusIcon={getStatusIcon}
              getStatusBadgeClass={getStatusBadgeClass}
              formatDate={formatDate}
              isActiveStatus={isActiveStatus}
            />

            {/* Content Tasks */}
            <TaskSection
              title="Content Tasks"
              icon={<FileText className="w-4 h-4" />}
              tasks={contentTasks}
              type="content"
              expandedTaskId={expandedTaskId}
              onToggleExpand={toggleExpand}
              getStatusIcon={getStatusIcon}
              getStatusBadgeClass={getStatusBadgeClass}
              formatDate={formatDate}
              isActiveStatus={isActiveStatus}
            />
          </div>
        </ScrollArea>
      )}
    </>
  );

  // Embedded mode: simplified header + content without Card wrapper
  if (isEmbedded) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Activity className="w-4 h-4 text-blue-400" />
            Task History
            {totalActiveTasks > 0 && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] py-0">
                {totalActiveTasks} active
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {innerContent}
      </div>
    );
  }

  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-background to-blue-500/5">
      <Collapsible open={!isCollapsed} onOpenChange={() => onToggleCollapse?.()}>
        <CardHeader className="flex flex-row items-center justify-between py-2 px-4">
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
          <CardContent className="space-y-3 pt-0 pb-3">
            {innerContent}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// ─── Task Section Component ───
interface TaskSectionProps {
  title: string;
  icon: React.ReactNode;
  tasks: CadeEventTask[];
  type: string;
  expandedTaskId: string | null;
  onToggleExpand: (id: string) => void;
  getStatusIcon: (status?: string) => React.ReactNode;
  getStatusBadgeClass: (status?: string) => string;
  formatDate: (date?: string) => string;
  isActiveStatus: (status: string) => boolean;
}

const TaskSection = ({
  title,
  icon,
  tasks,
  type,
  expandedTaskId,
  onToggleExpand,
  getStatusIcon,
  getStatusBadgeClass,
  formatDate,
  isActiveStatus,
}: TaskSectionProps) => {
  if (tasks.length === 0) return null;

  return (
    <div className="mb-2">
      <h4 className="text-xs font-medium flex items-center gap-1.5 mb-1.5 text-muted-foreground">
        {icon}
        {title} ({tasks.length})
      </h4>
      <div className="space-y-1">
        {tasks.map((task, idx) => (
          <TaskRow
            key={task.id || idx}
            task={task}
            type={type}
            isExpanded={expandedTaskId === task.id}
            onToggleExpand={() => onToggleExpand(task.id)}
            getStatusIcon={getStatusIcon}
            getStatusBadgeClass={getStatusBadgeClass}
            formatDate={formatDate}
            isActiveStatus={isActiveStatus}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Task Row Component ───
interface TaskRowProps {
  task: CadeEventTask;
  type: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  getStatusIcon: (status?: string) => React.ReactNode;
  getStatusBadgeClass: (status?: string) => string;
  formatDate: (date?: string) => string;
  isActiveStatus: (status: string) => boolean;
}

const TaskRow = ({ 
  task, 
  type, 
  isExpanded, 
  onToggleExpand, 
  getStatusIcon, 
  getStatusBadgeClass, 
  formatDate,
  isActiveStatus 
}: TaskRowProps) => {
  const isActive = isActiveStatus(task.statusValue);
  const hasExtendedInfo = task.message || task.categories || task.description || task.request_id || task.current_url;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors overflow-hidden"
    >
      {/* Main row - clickable to expand */}
      <div 
        className={`py-2 px-3 ${hasExtendedInfo ? "cursor-pointer" : ""}`}
        onClick={hasExtendedInfo ? onToggleExpand : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getStatusIcon(task.statusValue)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-xs truncate">
                  {task.type}
                </span>
                <Badge className={`text-[10px] py-0 ${getStatusBadgeClass(task.statusValue)}`}>
                  {task.statusValue}
                </Badge>
              </div>
              {task.message && (
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{task.message}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Progress for crawl tasks */}
            {type === "crawl" && task.progress !== undefined && isActive && (
              <div className="w-16">
                <Progress value={task.progress} className="h-1" />
              </div>
            )}
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {formatDate(task.created_at)}
            </span>
            {hasExtendedInfo && (
              <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            )}
          </div>
        </div>

        {/* Error message */}
        {task.error && (
          <div className="mt-2 p-2 rounded bg-red-500/10 text-xs text-red-400">
            {task.error}
          </div>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && hasExtendedInfo && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border bg-muted/20"
        >
          <div className="p-3 space-y-3 text-xs">
            {/* Tracking IDs */}
            <div className="flex flex-wrap gap-2">
              {task.request_id && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="font-mono text-[10px] gap-1">
                        <Hash className="w-3 h-3" />
                        {task.request_id.slice(0, 20)}...
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-mono text-xs">request_id: {task.request_id}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {task.target_request_id && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="font-mono text-[10px] gap-1">
                        <Link2 className="w-3 h-3" />
                        {task.target_request_id.slice(0, 20)}...
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-mono text-xs">target_request_id: {task.target_request_id}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {task.domain_id && (
                <Badge variant="outline" className="font-mono text-[10px] gap-1">
                  domain_id: {task.domain_id.slice(0, 8)}...
                </Badge>
              )}
            </div>

            {/* Categories */}
            {task.categories && task.categories.length > 0 && (
              <div>
                <span className="text-muted-foreground">Categories:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {task.categories.map((cat, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap gap-3 text-muted-foreground">
              {task.country && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {task.country.toUpperCase()}
                </span>
              )}
              {task.language && (
                <span className="flex items-center gap-1">
                  <Languages className="w-3 h-3" />
                  {task.language.toUpperCase()}
                </span>
              )}
              {task.analyze_css !== undefined && (
                <span className="flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  CSS: {task.analyze_css ? "Yes" : "No"}
                </span>
              )}
            </div>

            {/* Competitors */}
            {task.competitors && (
              <div>
                <span className="text-muted-foreground">Competitors:</span>
                <p className="mt-1 text-foreground">{task.competitors}</p>
              </div>
            )}

            {/* Description */}
            {task.description && (
              <div>
                <span className="text-muted-foreground">Description:</span>
                <p className="mt-1 text-foreground line-clamp-4">{task.description}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CADETaskMonitor;