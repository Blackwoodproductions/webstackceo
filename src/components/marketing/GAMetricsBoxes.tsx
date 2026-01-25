import { Users, Eye, Clock, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GAMetrics } from "./GADashboardPanel";

interface GAMetricsBoxesProps {
  metrics: GAMetrics;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const GAMetricsBoxes = ({ metrics }: GAMetricsBoxesProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
      {/* GA Header Badge */}
      <Card className="p-3 bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/20 col-span-2 md:col-span-4 lg:col-span-1 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Google Analytics</p>
          <p className="text-sm font-semibold">Last 28 Days</p>
        </div>
      </Card>

      {/* Sessions */}
      <Card className="p-3 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
        <div className="flex items-center justify-between mb-1">
          <Users className="w-4 h-4 text-orange-500" />
          {metrics.sessionsChange !== 0 && (
            <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${metrics.sessionsChange > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {metrics.sessionsChange > 0 ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
              {Math.abs(metrics.sessionsChange).toFixed(0)}%
            </Badge>
          )}
        </div>
        <p className="text-xl font-bold">{formatNumber(metrics.sessions)}</p>
        <p className="text-[10px] text-muted-foreground">Sessions</p>
      </Card>

      {/* Users */}
      <Card className="p-3 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
        <div className="flex items-center justify-between mb-1">
          <Users className="w-4 h-4 text-amber-500" />
          {metrics.usersChange !== 0 && (
            <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${metrics.usersChange > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {metrics.usersChange > 0 ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
              {Math.abs(metrics.usersChange).toFixed(0)}%
            </Badge>
          )}
        </div>
        <p className="text-xl font-bold">{formatNumber(metrics.users)}</p>
        <p className="text-[10px] text-muted-foreground">Users ({formatNumber(metrics.newUsers)} new)</p>
      </Card>

      {/* Page Views */}
      <Card className="p-3 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
        <div className="flex items-center justify-between mb-1">
          <Eye className="w-4 h-4 text-yellow-500" />
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-secondary">
            {metrics.pagesPerSession.toFixed(1)}/sess
          </Badge>
        </div>
        <p className="text-xl font-bold">{formatNumber(metrics.pageViews)}</p>
        <p className="text-[10px] text-muted-foreground">Page Views</p>
      </Card>

      {/* Engagement */}
      <Card className="p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <div className="flex items-center justify-between mb-1">
          <Clock className="w-4 h-4 text-green-500" />
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-secondary">
            {metrics.engagementRate.toFixed(0)}% engaged
          </Badge>
        </div>
        <p className="text-xl font-bold">{formatDuration(metrics.avgSessionDuration)}</p>
        <p className="text-[10px] text-muted-foreground">Avg. Duration</p>
      </Card>
    </div>
  );
};

export default GAMetricsBoxes;
