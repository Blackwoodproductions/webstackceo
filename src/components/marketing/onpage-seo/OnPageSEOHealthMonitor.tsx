import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, CheckCircle, AlertTriangle, XCircle, Clock, 
  RefreshCw, Globe, FileSearch, Code, Link2, ImageIcon,
  Gauge, Play, Zap, Shield, Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';

interface HealthCheck {
  id: string;
  name: string;
  type: 'meta' | 'schema' | 'images' | 'links' | 'performance' | 'accessibility';
  status: 'healthy' | 'warning' | 'failing' | 'checking';
  lastCheck: string;
  score: number;
  details: string;
}

interface OnPageSEOHealthMonitorProps {
  domain?: string;
}

const checkTypeConfig = {
  meta: { icon: FileSearch, label: 'Meta Tags', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  schema: { icon: Code, label: 'Schema Markup', color: 'text-violet-500', bg: 'bg-violet-500/10' },
  images: { icon: ImageIcon, label: 'Image Optimization', color: 'text-green-500', bg: 'bg-green-500/10' },
  links: { icon: Link2, label: 'Internal Links', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  performance: { icon: Gauge, label: 'Page Speed', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  accessibility: { icon: Shield, label: 'Accessibility', color: 'text-pink-500', bg: 'bg-pink-500/10' },
};

const statusConfig = {
  healthy: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  failing: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  checking: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
};

const mockHealthChecks: HealthCheck[] = [
  {
    id: '1',
    name: 'Meta Tag Validation',
    type: 'meta',
    status: 'healthy',
    lastCheck: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    score: 95,
    details: 'All meta tags properly configured',
  },
  {
    id: '2',
    name: 'Schema Markup',
    type: 'schema',
    status: 'warning',
    lastCheck: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    score: 72,
    details: '2 pages missing structured data',
  },
  {
    id: '3',
    name: 'Image Alt Text',
    type: 'images',
    status: 'healthy',
    lastCheck: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    score: 100,
    details: 'All images have descriptive alt text',
  },
  {
    id: '4',
    name: 'Internal Link Structure',
    type: 'links',
    status: 'healthy',
    lastCheck: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    score: 88,
    details: 'Strong internal linking structure',
  },
  {
    id: '5',
    name: 'Core Web Vitals',
    type: 'performance',
    status: 'failing',
    lastCheck: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    score: 45,
    details: 'LCP needs improvement (3.2s)',
  },
  {
    id: '6',
    name: 'Accessibility Audit',
    type: 'accessibility',
    status: 'warning',
    lastCheck: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    score: 78,
    details: 'Missing ARIA labels on 3 buttons',
  },
];

export const OnPageSEOHealthMonitor = ({ domain }: OnPageSEOHealthMonitorProps) => {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>(mockHealthChecks);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runningCheckId, setRunningCheckId] = useState<string | null>(null);

  const overallScore = Math.round(
    healthChecks.reduce((sum, check) => sum + check.score, 0) / healthChecks.length
  );

  const healthyCount = healthChecks.filter(c => c.status === 'healthy').length;
  const warningCount = healthChecks.filter(c => c.status === 'warning').length;
  const failingCount = healthChecks.filter(c => c.status === 'failing').length;

  const runSingleCheck = async (checkId: string) => {
    setRunningCheckId(checkId);
    setHealthChecks(prev => prev.map(c => 
      c.id === checkId ? { ...c, status: 'checking' as const } : c
    ));

    // Simulate check
    await new Promise(resolve => setTimeout(resolve, 2000));

    setHealthChecks(prev => prev.map(c => 
      c.id === checkId ? { 
        ...c, 
        status: 'healthy', 
        lastCheck: new Date().toISOString(),
        score: Math.min(c.score + Math.floor(Math.random() * 10), 100)
      } : c
    ));
    setRunningCheckId(null);
  };

  const runAllChecks = async () => {
    setIsRunningAll(true);
    
    for (const check of healthChecks) {
      await runSingleCheck(check.id);
    }
    
    setIsRunningAll(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-background to-orange-950/20 p-6">
        {/* Background effects */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        </div>

        {/* Scanning line */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center"
              animate={{ boxShadow: ['0 0 0 rgba(245,158,11,0)', '0 0 30px rgba(245,158,11,0.3)', '0 0 0 rgba(245,158,11,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Activity className="w-7 h-7 text-amber-400" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                SEO Health Monitor
              </h3>
              <p className="text-sm text-muted-foreground">
                Continuous monitoring • Auto-remediation enabled
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Overall Score Dial */}
            <div className="relative w-20 h-20">
              <svg className="transform -rotate-90" width={80} height={80}>
                <circle cx={40} cy={40} r={32} fill="none" stroke="currentColor" strokeWidth={6} className="text-muted/20" />
                <motion.circle
                  cx={40} cy={40} r={32}
                  fill="none"
                  stroke={overallScore >= 80 ? '#22c55e' : overallScore >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray={201}
                  initial={{ strokeDashoffset: 201 }}
                  animate={{ strokeDashoffset: 201 - (overallScore / 100) * 201 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{overallScore}</span>
                <span className="text-[10px] text-muted-foreground">Score</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/30">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-bold text-green-500">{healthyCount}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-amber-500">{warningCount}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="font-bold text-red-500">{failingCount}</span>
              </div>
            </div>

            <Button
              onClick={runAllChecks}
              disabled={isRunningAll}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500"
            >
              {isRunningAll ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run All Checks
            </Button>
          </div>
        </div>
      </div>

      {/* Health Checks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthChecks.map((check, i) => {
          const typeConfig = checkTypeConfig[check.type];
          const TypeIcon = typeConfig.icon;
          const status = statusConfig[check.status];
          const StatusIcon = status.icon;
          const isRunning = runningCheckId === check.id;

          return (
            <motion.div
              key={check.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`relative overflow-hidden ${status.border} border`}>
                {/* Status glow bar */}
                <motion.div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ 
                    background: check.status === 'healthy' ? '#22c55e' :
                               check.status === 'warning' ? '#f59e0b' :
                               check.status === 'failing' ? '#ef4444' : '#3b82f6'
                  }}
                  animate={{ opacity: isRunning ? [0.5, 1, 0.5] : 1 }}
                  transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
                />

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${typeConfig.bg} flex items-center justify-center`}>
                        <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{check.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{typeConfig.label}</p>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full ${status.bg} flex items-center justify-center`}>
                      {isRunning ? (
                        <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                      ) : (
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                      )}
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Score</span>
                      <span className={`text-sm font-bold ${
                        check.score >= 80 ? 'text-green-500' :
                        check.score >= 60 ? 'text-amber-500' : 'text-red-500'
                      }`}>{check.score}%</span>
                    </div>
                    <Progress value={check.score} className="h-2" />
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">{check.details}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(check.lastCheck), { addSuffix: true })}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => runSingleCheck(check.id)}
                      disabled={isRunning}
                      className="h-7 text-xs"
                    >
                      {isRunning ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default OnPageSEOHealthMonitor;
