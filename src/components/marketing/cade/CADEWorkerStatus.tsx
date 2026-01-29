import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Cpu, Server, Clock, Activity, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
    try {
      const [workersResult, queuesResult] = await Promise.allSettled([
        callCadeApi("workers"),
        callCadeApi("queues"),
      ]);

      if (workersResult.status === "fulfilled") {
        const data = workersResult.value?.data || workersResult.value || [];
        setWorkers(Array.isArray(data) ? data : []);
      }

      if (queuesResult.status === "fulfilled") {
        const data = queuesResult.value?.data || queuesResult.value || [];
        setQueues(Array.isArray(data) ? data : []);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("[CADE Workers] Fetch error:", err);
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
    if (lowerName.includes("crawler")) return "🕷️";
    if (lowerName.includes("categorizer")) return "🏷️";
    if (lowerName.includes("content")) return "📝";
    if (lowerName.includes("publisher")) return "📤";
    return "⚙️";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
      case "active":
        return "text-green-500";
      case "offline":
      case "down":
        return "text-red-500";
      case "idle":
        return "text-amber-500";
      default:
        return "text-muted-foreground";
    }
  };

  const totalActiveTasks = workers.reduce((sum, w) => sum + (w.active_tasks || 0), 0);
  const allOnline = workers.every(w => w.status === "online");

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
                {allOnline ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-xs text-muted-foreground">
                  {workers.length} workers
                </span>
                {totalActiveTasks > 0 && (
                  <Badge className="text-xs bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    {totalActiveTasks} active
                  </Badge>
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
            {/* Workers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {workers.map((worker, idx) => (
                <motion.div
                  key={worker.name}
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
                    <div className="flex justify-between">
                      <span>Processed</span>
                      <span>{worker.processed_tasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime</span>
                      <span>{formatUptime(worker.uptime_seconds)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Queues */}
            {queues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Queues
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {queues.map((queue, idx) => (
                    <motion.div
                      key={queue.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-3 rounded-lg bg-secondary/30 border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm truncate">
                          {queue.name.replace(/_/g, " ")}
                        </span>
                        {queue.active_tasks > 0 && (
                          <Badge className="text-xs bg-cyan-500/20 text-cyan-400">
                            {queue.active_tasks} active
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Reserved: {queue.reserved_tasks}</span>
                        <span>Scheduled: {queue.scheduled_tasks}</span>
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
