import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, AlertTriangle, CheckCircle, XCircle, Clock, 
  RefreshCw, Shield, Zap, Play, Wrench, Eye, ChevronDown,
  ChevronRight, Bell, BellOff, Server, Globe, Database,
  Code, ExternalLink, TrendingUp, TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemHealth, type SystemHealthCheck, type SystemAlert, type RemediationLog } from '@/hooks/use-system-health';
import { formatDistanceToNow, format } from 'date-fns';

const statusConfig = {
  healthy: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  degraded: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  failing: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  unknown: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/20', border: 'border-border' },
};

const checkTypeIcons = {
  form: Code,
  endpoint: Globe,
  edge_function: Zap,
  database: Database,
  external_api: ExternalLink,
};

export function SystemHealthPanel() {
  const {
    checks,
    alerts,
    remediationLogs,
    recentResults,
    isLoading,
    isRunningChecks,
    runAllChecks,
    runSingleCheck,
    runRemediation,
    resolveAlert,
    toggleCheckActive,
    stats,
  } = useSystemHealth();

  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Checks', value: stats.totalChecks, icon: Activity, color: 'text-cyan-400', bg: 'from-cyan-500/20' },
          { label: 'Healthy', value: stats.healthyCount, icon: CheckCircle, color: 'text-emerald-400', bg: 'from-emerald-500/20' },
          { label: 'Degraded', value: stats.degradedCount, icon: AlertTriangle, color: 'text-amber-400', bg: 'from-amber-500/20' },
          { label: 'Failing', value: stats.failingCount, icon: XCircle, color: 'text-red-400', bg: 'from-red-500/20' },
          { label: 'Active Alerts', value: stats.unresolvedAlerts, icon: Bell, color: 'text-violet-400', bg: 'from-violet-500/20' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} to-transparent border-border/50`}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={runAllChecks}
            disabled={isRunningChecks}
            className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            {isRunningChecks ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run All Checks
          </Button>
          <p className="text-sm text-muted-foreground">
            Auto-runs every 15 minutes
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Shield className="w-3 h-3" />
          Auto-Remediation: ON
        </Badge>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="checks" className="space-y-4">
        <TabsList className="bg-background/50 border border-border/50">
          <TabsTrigger value="checks" className="gap-2">
            <Server className="w-4 h-4" />
            Health Checks
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="w-4 h-4" />
            Alerts
            {stats.unresolvedAlerts > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5">
                {stats.unresolvedAlerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="remediation" className="gap-2">
            <Wrench className="w-4 h-4" />
            Remediation Log
          </TabsTrigger>
        </TabsList>

        {/* Health Checks Tab */}
        <TabsContent value="checks" className="space-y-3">
          {checks.map((check) => (
            <HealthCheckCard
              key={check.id}
              check={check}
              isExpanded={expandedCheck === check.id}
              onToggleExpand={() => setExpandedCheck(expandedCheck === check.id ? null : check.id)}
              onRunCheck={() => runSingleCheck(check.id)}
              onRunRemediation={() => runRemediation(check.id)}
              onToggleActive={(active) => toggleCheckActive(check.id, active)}
              recentResults={recentResults.filter(r => r.check_id === check.id).slice(0, 10)}
            />
          ))}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-3">
          {alerts.length === 0 ? (
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="py-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-lg font-medium">All Systems Operational</p>
                <p className="text-sm text-muted-foreground">No active alerts at this time</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onResolve={() => resolveAlert(alert.id)} />
            ))
          )}
        </TabsContent>

        {/* Remediation Log Tab */}
        <TabsContent value="remediation" className="space-y-3">
          {remediationLogs.length === 0 ? (
            <Card className="bg-muted/20 border-border/50">
              <CardContent className="py-8 text-center">
                <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-medium">No Remediation Actions</p>
                <p className="text-sm text-muted-foreground">Auto-fix actions will appear here</p>
              </CardContent>
            </Card>
          ) : (
            remediationLogs.map((log) => (
              <RemediationLogCard key={log.id} log={log} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HealthCheckCard({
  check,
  isExpanded,
  onToggleExpand,
  onRunCheck,
  onRunRemediation,
  onToggleActive,
  recentResults,
}: {
  check: SystemHealthCheck;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRunCheck: () => void;
  onRunRemediation: () => void;
  onToggleActive: (active: boolean) => void;
  recentResults: Array<{ status: string; response_time_ms: number | null; checked_at: string }>;
}) {
  const config = statusConfig[check.last_status] || statusConfig.unknown;
  const StatusIcon = config.icon;
  const TypeIcon = checkTypeIcons[check.check_type as keyof typeof checkTypeIcons] || Server;

  return (
    <Card className={`${config.border} border bg-background/50 backdrop-blur-sm`}>
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                <StatusIcon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{check.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    <TypeIcon className="w-3 h-3 mr-1" />
                    {check.check_type.replace('_', ' ')}
                  </Badge>
                </div>
                {check.description && (
                  <p className="text-xs text-muted-foreground">{check.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Mini sparkline of recent results */}
              <div className="hidden md:flex items-center gap-0.5">
                {recentResults.slice(0, 10).reverse().map((result, i) => (
                  <div
                    key={i}
                    className={`w-2 h-4 rounded-sm ${
                      result.status === 'healthy' ? 'bg-emerald-400' :
                      result.status === 'degraded' ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    title={`${result.status} - ${result.response_time_ms}ms`}
                  />
                ))}
              </div>
              
              {check.consecutive_failures > 0 && (
                <Badge variant="destructive" className="text-[10px]">
                  {check.consecutive_failures} failures
                </Badge>
              )}
              
              <Switch
                checked={check.is_active}
                onCheckedChange={onToggleActive}
              />
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Last Check</p>
                <p className="font-medium">
                  {check.last_check_at 
                    ? formatDistanceToNow(new Date(check.last_check_at), { addSuffix: true })
                    : 'Never'
                  }
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Interval</p>
                <p className="font-medium">{check.check_interval_minutes} min</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Timeout</p>
                <p className="font-medium">{check.timeout_ms}ms</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Expected Status</p>
                <p className="font-medium">{check.expected_status}</p>
              </div>
            </div>
            
            {check.endpoint_url && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Endpoint</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">{check.endpoint_url}</code>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onRunCheck} className="gap-1">
                <Play className="w-3 h-3" />
                Run Now
              </Button>
              {check.last_status === 'failing' && (
                <Button size="sm" variant="outline" onClick={onRunRemediation} className="gap-1 text-amber-500 border-amber-500/30 hover:bg-amber-500/10">
                  <Wrench className="w-3 h-3" />
                  Auto-Fix
                </Button>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function AlertCard({ alert, onResolve }: { alert: SystemAlert; onResolve: () => void }) {
  const severityConfig = {
    info: { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
    warning: { color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
    critical: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  };
  
  const config = severityConfig[alert.severity];

  return (
    <Card className={`${config.border} border`}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
              <AlertTriangle className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{alert.title}</h4>
                <Badge className={`text-[10px] ${config.bg} ${config.color} border-0`}>
                  {alert.severity.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {alert.auto_remediation_attempted && (
              <Badge variant="outline" className="text-[10px]">
                <Wrench className="w-3 h-3 mr-1" />
                Auto-fix attempted
              </Badge>
            )}
            <Button size="sm" variant="outline" onClick={onResolve} className="gap-1">
              <CheckCircle className="w-3 h-3" />
              Resolve
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RemediationLogCard({ log }: { log: RemediationLog }) {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/20' },
    in_progress: { icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
    skipped: { icon: BellOff, color: 'text-muted-foreground', bg: 'bg-muted/20' },
  };
  
  const config = statusConfig[log.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <Card className="bg-background/50 border-border/50">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
              <StatusIcon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div>
              <p className="font-medium text-sm">{log.action_type.replace(/_/g, ' ')}</p>
              {log.action_description && (
                <p className="text-xs text-muted-foreground">{log.action_description}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className={`text-[10px] ${config.color}`}>
              {log.status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(log.started_at), 'MMM d, HH:mm')}
            </p>
          </div>
        </div>
        {log.result_message && (
          <p className="text-xs text-muted-foreground mt-2 ml-11">{log.result_message}</p>
        )}
      </CardContent>
    </Card>
  );
}
