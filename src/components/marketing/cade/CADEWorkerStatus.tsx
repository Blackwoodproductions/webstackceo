import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Cpu, Server, Clock, Activity, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Loader2, Zap, Database, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ───
interface WorkerData {
  name: string;
  status: string;
  active_tasks: number;
  processed_tasks: number;
  uptime_seconds: number;
  last_task_received?: string | null;
}

interface QueueData {
  name: string;
  active_tasks: number;
  reserved_tasks: number;
  scheduled_tasks: number;
}

interface HealthData {
  status: string;
  workers: number;
  tasks: number;
  queues: QueueData[];
}

interface CADEWorkerStatusProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// ─── Component ───
export const CADEWorkerStatus = ({ 
  isCollapsed = true,
  onToggleCollapse
}: CADEWorkerStatusProps) => {
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [queues, setQueues] = useState<QueueData[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callCadeApi = useCallback(async (action: string) => {
    const { data, error } = await supabase.functions.invoke("cade-api", {
      body: { action },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch health endpoint first - it has summary data
      const healthResult = await callCadeApi("health");
      const healthData = healthResult?.data || healthResult;
      
      if (healthData) {
        setHealth(healthData);
        
        // Extract queues from health response
        if (healthData.queues && Array.isArray(healthData.queues)) {
          setQueues(healthData.queues);
        }
        
        // Build synthetic worker data from health response
        if (healthData.workers !== undefined) {
          // Try to get detailed worker info
          try {
            const workersResult = await callCadeApi("workers");
            const workersData = workersResult?.data || workersResult || [];
            if (Array.isArray(workersData) && workersData.length > 0) {
              setWorkers(workersData);
            } else {
              // Create synthetic workers based on count
              setWorkers(
                Array(healthData.workers).fill(null).map((_, i) => ({
                  name: `Worker ${i + 1}`,
                  status: "online",
                  active_tasks: Math.floor((healthData.tasks || 0) / (healthData.workers || 1)),
                  processed_tasks: 0,
                  uptime_seconds: 0,
                }))
              );
            }
          } catch {
            // Fallback to synthetic
            setWorkers(
              Array(healthData.workers).fill(null).map((_, i) => ({
                name: `Worker ${i + 1}`,
                status: "online",
                active_tasks: 0,
                processed_tasks: 0,
                uptime_seconds: 0,
              }))
            );
          }
        }
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("[CADE Workers] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setIsLoading(false);
    }
  }, [callCadeApi]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const formatUptime = (seconds?: number) => {
    if (!seconds) return "—";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getWorkerIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("crawler") || lowerName.includes("crawl")) return "🕷️";
    if (lowerName.includes("categorizer") || lowerName.includes("categor")) return "🏷️";
    if (lowerName.includes("content") || lowerName.includes("generation")) return "📝";
    if (lowerName.includes("publisher") || lowerName.includes("publish")) return "📤";
    return "⚙️";
  };

  const getQueueIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("crawl")) return "🕷️";
    if (lowerName.includes("content") && lowerName.includes("generation")) return "📝";
    if (lowerName.includes("content") && lowerName.includes("publish")) return "📤";
    if (lowerName.includes("categoriz")) return "🏷️";
    return "📦";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
      case "active":
      case "healthy":
        return "text-green-500";
      case "offline":
      case "down":
      case "unhealthy":
        return "text-red-500";
      case "idle":
      case "degraded":
        return "text-amber-500";
      default:
        return "text-muted-foreground";
    }
  };

  const totalActiveTasks = queues.reduce((sum, q) => sum + (q.active_tasks || 0), 0);
  const totalScheduledTasks = queues.reduce((sum, q) => sum + (q.scheduled_tasks || 0), 0);
  const isHealthy = health?.status === "healthy";

  return (
    <Card className="border-cyan-500/20 bg-gradient-to-br from-background to-cyan-500/5">
      <Collapsible open={!isCollapsed} onOpenChange={() => onToggleCollapse?.()}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Server className="w-5 h-5 text-cyan-400" />
                System Status
              </CardTitle>
              {/* Quick status indicator */}
              <div className="flex items-center gap-2 ml-2">
                {isHealthy ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : health ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                )}
                {health && (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {health.workers} workers
                    </span>
                    {totalActiveTasks > 0 && (
                      <Badge className="text-xs bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        {totalActiveTasks} active
                      </Badge>
                    )}
                  </>
                )}
              </div>
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground ml-2" />
              ) : (
                <ChevronUp className="w-4 h-4 text-muted-foreground ml-2" />
              )}
            </div>
          </CollapsibleTrigger>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={isLoading}
            className="border-cyan-500/30 hover:bg-cyan-500/10"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Health Summary Cards */}
            {health && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Zap className="w-3 h-3" />
                    Status
                  </div>
                  <p className={`text-lg font-bold capitalize ${getStatusColor(health.status)}`}>
                    {health.status}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Cpu className="w-3 h-3" />
                    Workers
                  </div>
                  <p className="text-lg font-bold">{health.workers}</p>
                </div>
                <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Activity className="w-3 h-3" />
                    Active Tasks
                  </div>
                  <p className="text-lg font-bold">{totalActiveTasks}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Clock className="w-3 h-3" />
                    Scheduled
                  </div>
                  <p className="text-lg font-bold">{totalScheduledTasks}</p>
                </div>
              </div>
            )}

            {/* Queues */}
            {queues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Queues ({queues.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {queues.map((queue, idx) => {
                    const total = queue.active_tasks + queue.reserved_tasks + queue.scheduled_tasks;
                    const activePercent = total > 0 ? (queue.active_tasks / total) * 100 : 0;
                    
                    return (
                      <motion.div
                        key={queue.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-3 rounded-lg bg-secondary/30 border border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getQueueIcon(queue.name)}</span>
                            <span className="font-medium text-sm truncate max-w-[150px]">
                              {queue.name.replace(/_/g, " ")}
                            </span>
                          </div>
                          {queue.active_tasks > 0 && (
                            <Badge className="text-xs bg-cyan-500/20 text-cyan-400">
                              {queue.active_tasks} active
                            </Badge>
                          )}
                        </div>
                        
                        {/* Progress bar showing queue load */}
                        {total > 0 && (
                          <div className="mb-2">
                            <Progress value={activePercent} className="h-1.5" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                {queue.reserved_tasks} reserved
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Tasks reserved by workers</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                {queue.scheduled_tasks} scheduled
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Tasks scheduled for later</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Workers Grid */}
            {workers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Workers ({workers.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {workers.map((worker, idx) => (
                    <motion.div
                      key={worker.name + idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-3 rounded-lg bg-secondary/30 border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getWorkerIcon(worker.name)}</span>
                          <span className="font-medium text-sm truncate max-w-[100px]">
                            {worker.name.split("@")[0]}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1 ${getStatusColor(worker.status)}`}>
                          <div className={`w-2 h-2 rounded-full ${
                            worker.status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"
                          }`} />
                          <span className="text-xs">{worker.status}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Active Tasks</span>
                          <span className="font-medium text-foreground">{worker.active_tasks}</span>
                        </div>
                        {worker.processed_tasks > 0 && (
                          <div className="flex justify-between">
                            <span>Processed</span>
                            <span>{worker.processed_tasks}</span>
                          </div>
                        )}
                        {worker.uptime_seconds > 0 && (
                          <div className="flex justify-between">
                            <span>Uptime</span>
                            <span>{formatUptime(worker.uptime_seconds)}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Updated */}
            {lastUpdated && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default CADEWorkerStatus;
