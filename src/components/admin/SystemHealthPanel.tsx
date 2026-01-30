import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, AlertTriangle, CheckCircle, XCircle, Clock, 
  RefreshCw, Shield, Zap, Play, Wrench, ChevronDown,
  ChevronRight, Bell, BellOff, Server, Globe, Database,
  Code, ExternalLink, Gauge, Radio, Cpu, Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemHealth, type SystemHealthCheck, type SystemAlert, type RemediationLog } from '@/hooks/use-system-health';
import { formatDistanceToNow, format } from 'date-fns';

const statusConfig = {
  healthy: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/30', dialColor: '#34d399' },
  degraded: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', glow: 'shadow-amber-500/30', dialColor: '#fbbf24' },
  failing: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', glow: 'shadow-red-500/30', dialColor: '#f87171' },
  unknown: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/20', border: 'border-border', glow: '', dialColor: '#6b7280' },
};

const checkTypeIcons = {
  form: Code,
  endpoint: Globe,
  edge_function: Zap,
  database: Database,
  external_api: ExternalLink,
};

// Animated Circular Gauge Component
function CircularGauge({ 
  value, 
  maxValue = 100, 
  size = 120, 
  strokeWidth = 8,
  label,
  status,
  subtitle
}: { 
  value: number; 
  maxValue?: number; 
  size?: number; 
  strokeWidth?: number;
  label: string;
  status: 'healthy' | 'degraded' | 'failing' | 'unknown';
  subtitle?: string;
}) {
  const config = statusConfig[status];
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min((value / maxValue) * 100, 100);
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          {/* Animated progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={config.dialColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${config.dialColor}50)` }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className={`text-2xl font-bold ${config.color}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {value}
          </motion.span>
          {subtitle && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{subtitle}</span>
          )}
        </div>

        {/* Glowing pulse for active status */}
        {status === 'healthy' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 20px ${config.dialColor}30` }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
      <span className="mt-2 text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

// Digital Monitor Display
function DigitalMonitor({ 
  check, 
  onRunCheck,
  onToggleActive,
  recentResults
}: { 
  check: SystemHealthCheck;
  onRunCheck: () => void;
  onToggleActive: (active: boolean) => void;
  recentResults: Array<{ status: string; response_time_ms: number | null; checked_at: string }>;
}) {
  const config = statusConfig[check.last_status] || statusConfig.unknown;
  const StatusIcon = config.icon;
  const TypeIcon = checkTypeIcons[check.check_type as keyof typeof checkTypeIcons] || Server;
  
  // Calculate average response time
  const avgResponseTime = useMemo(() => {
    const validResults = recentResults.filter(r => r.response_time_ms !== null);
    if (validResults.length === 0) return 0;
    return Math.round(validResults.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / validResults.length);
  }, [recentResults]);

  // Calculate uptime percentage
  const uptimePercent = useMemo(() => {
    if (recentResults.length === 0) return 100;
    const healthy = recentResults.filter(r => r.status === 'healthy').length;
    return Math.round((healthy / recentResults.length) * 100);
  }, [recentResults]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border ${config.border} bg-gradient-to-br from-background via-background to-muted/5`}
      style={{ contain: 'layout paint' }}
    >
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]" />
      </div>

      {/* Status glow bar */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${config.dialColor}, transparent)` }}
        animate={{ opacity: check.is_active ? [0.5, 1, 0.5] : 0.3 }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center relative`}
              animate={{ boxShadow: check.is_active ? [`0 0 0 ${config.dialColor}00`, `0 0 15px ${config.dialColor}40`, `0 0 0 ${config.dialColor}00`] : 'none' }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <StatusIcon className={`w-5 h-5 ${config.color}`} />
              {check.is_active && (
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>
            <div>
              <h3 className="font-semibold text-sm">{check.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-1">
                  <TypeIcon className="w-2.5 h-2.5" />
                  {check.check_type.replace('_', ' ')}
                </Badge>
                {check.description && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                    {check.description}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Switch
            checked={check.is_active}
            onCheckedChange={onToggleActive}
          />
        </div>

        {/* Digital gauges grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Uptime Dial */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/10 border border-border/30">
            <div className="relative w-14 h-14">
              <svg className="transform -rotate-90" width={56} height={56}>
                <circle cx={28} cy={28} r={22} fill="none" stroke="currentColor" strokeWidth={4} className="text-muted/20" />
                <motion.circle
                  cx={28} cy={28} r={22}
                  fill="none"
                  stroke={config.dialColor}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray={138}
                  initial={{ strokeDashoffset: 138 }}
                  animate={{ strokeDashoffset: 138 - (uptimePercent / 100) * 138 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-sm font-bold ${config.color}`}>{uptimePercent}%</span>
              </div>
            </div>
            <span className="mt-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">Uptime</span>
          </div>

          {/* Response Time */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/10 border border-border/30">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-dashed"
                style={{ borderColor: `${config.dialColor}40` }}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
              <span className="text-sm font-bold text-foreground">{avgResponseTime}</span>
            </div>
            <span className="mt-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">Avg MS</span>
          </div>

          {/* Check Count */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/10 border border-border/30">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <Activity className={`w-5 h-5 ${config.color}`} />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: `inset 0 0 10px ${config.dialColor}20` }}
              />
            </div>
            <span className="mt-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
              {check.check_interval_minutes}m int
            </span>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Recent Activity</span>
            <span className="text-[10px] text-muted-foreground">Last 10 checks</span>
          </div>
          <div className="flex items-end gap-1 h-8">
            {Array.from({ length: 10 }).map((_, i) => {
              const result = recentResults[9 - i];
              const height = result 
                ? result.status === 'healthy' ? 100 
                : result.status === 'degraded' ? 60 
                : 30
                : 10;
              const color = result
                ? result.status === 'healthy' ? 'bg-emerald-400' 
                : result.status === 'degraded' ? 'bg-amber-400' 
                : 'bg-red-400'
                : 'bg-muted/30';
              
              return (
                <motion.div
                  key={i}
                  className={`flex-1 rounded-t ${color}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  title={result ? `${result.status} - ${result.response_time_ms}ms` : 'No data'}
                />
              );
            })}
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {check.consecutive_failures > 0 && (
              <Badge variant="destructive" className="text-[10px] gap-1">
                <AlertTriangle className="w-3 h-3" />
                {check.consecutive_failures} failures
              </Badge>
            )}
            {check.last_check_at && (
              <span className="text-[10px] text-muted-foreground">
                Last: {formatDistanceToNow(new Date(check.last_check_at), { addSuffix: true })}
              </span>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={onRunCheck} className="h-7 text-xs gap-1">
            <Play className="w-3 h-3" />
            Test
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

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
    <div className="space-y-6" style={{ contain: 'layout' }}>
      {/* Command Center Header */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-background to-violet-950/20 p-6">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        </div>
        
        {/* Scanning line */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-14 h-14 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center"
              animate={{ boxShadow: ['0 0 0 rgba(6,182,212,0)', '0 0 30px rgba(6,182,212,0.3)', '0 0 0 rgba(6,182,212,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Cpu className="w-7 h-7 text-cyan-400" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                System Command Center
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Wifi className="w-3 h-3 text-emerald-400" />
                Monitoring {stats.totalChecks} endpoints • 15 min intervals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 border-emerald-500/30 text-emerald-400">
              <motion.div
                className="w-2 h-2 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              Auto-Remediation Active
            </Badge>
            <Button
              onClick={runAllChecks}
              disabled={isRunningChecks}
              className="gap-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 shadow-lg shadow-cyan-500/20"
            >
              {isRunningChecks ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Radio className="w-4 h-4" />
              )}
              Run Diagnostics
            </Button>
          </div>
        </div>

        {/* Stats Dials */}
        <div className="relative grid grid-cols-5 gap-6">
          <CircularGauge 
            value={stats.totalChecks} 
            maxValue={20} 
            label="Total Monitors" 
            status="healthy"
            subtitle="active"
          />
          <CircularGauge 
            value={stats.healthyCount} 
            maxValue={stats.totalChecks || 1} 
            label="Healthy" 
            status="healthy"
            subtitle="online"
          />
          <CircularGauge 
            value={stats.degradedCount} 
            maxValue={stats.totalChecks || 1} 
            label="Degraded" 
            status={stats.degradedCount > 0 ? 'degraded' : 'unknown'}
            subtitle="warning"
          />
          <CircularGauge 
            value={stats.failingCount} 
            maxValue={stats.totalChecks || 1} 
            label="Failing" 
            status={stats.failingCount > 0 ? 'failing' : 'unknown'}
            subtitle="critical"
          />
          <CircularGauge 
            value={stats.unresolvedAlerts} 
            maxValue={10} 
            label="Active Alerts" 
            status={stats.unresolvedAlerts > 0 ? 'failing' : 'healthy'}
            subtitle="pending"
          />
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="checks" className="space-y-4">
        <TabsList className="bg-background/50 border border-border/50">
          <TabsTrigger value="checks" className="gap-2">
            <Gauge className="w-4 h-4" />
            Monitoring Stations
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
            Auto-Fix Log
          </TabsTrigger>
        </TabsList>

        {/* Monitoring Stations Grid */}
        <TabsContent value="checks">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {checks.map((check) => (
              <DigitalMonitor
                key={check.id}
                check={check}
                onRunCheck={() => runSingleCheck(check.id)}
                onToggleActive={(active) => toggleCheckActive(check.id, active)}
                recentResults={recentResults.filter(r => r.check_id === check.id).slice(0, 10)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-3">
          {alerts.length === 0 ? (
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="py-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                </motion.div>
                <p className="text-xl font-semibold text-emerald-400">All Systems Operational</p>
                <p className="text-sm text-muted-foreground mt-2">No active alerts at this time</p>
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
              <CardContent className="py-12 text-center">
                <Wrench className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-semibold">No Remediation Actions</p>
                <p className="text-sm text-muted-foreground mt-2">Auto-fix actions will appear here when triggered</p>
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

function AlertCard({ alert, onResolve }: { alert: SystemAlert; onResolve: () => void }) {
  const severityConfig = {
    info: { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
    warning: { color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
    critical: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', glow: 'shadow-red-500/20' },
  };
  
  const config = severityConfig[alert.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Card className={`${config.border} border shadow-lg ${config.glow}`}>
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <motion.div 
                className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <AlertTriangle className={`w-5 h-5 ${config.color}`} />
              </motion.div>
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
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
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
    </motion.div>
  );
}
