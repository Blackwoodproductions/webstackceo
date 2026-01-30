import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type HealthCheckType = 'form' | 'endpoint' | 'edge_function' | 'database' | 'external_api';
export type HealthCheckStatus = 'healthy' | 'degraded' | 'failing' | 'unknown';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type RemediationStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'skipped';

export interface SystemHealthCheck {
  id: string;
  name: string;
  description: string | null;
  check_type: HealthCheckType;
  endpoint_url: string | null;
  test_payload: Record<string, unknown>;
  expected_status: number;
  timeout_ms: number;
  is_active: boolean;
  check_interval_minutes: number;
  last_check_at: string | null;
  last_status: HealthCheckStatus;
  consecutive_failures: number;
  created_at: string;
  updated_at: string;
}

export interface HealthCheckResult {
  id: string;
  check_id: string;
  status: HealthCheckStatus;
  response_time_ms: number | null;
  status_code: number | null;
  response_body: string | null;
  error_message: string | null;
  checked_at: string;
}

export interface SystemAlert {
  id: string;
  check_id: string | null;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  auto_remediation_attempted: boolean;
  created_at: string;
  check?: SystemHealthCheck;
}

export interface RemediationLog {
  id: string;
  alert_id: string | null;
  check_id: string | null;
  action_type: string;
  action_description: string | null;
  status: RemediationStatus;
  result_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface UseSystemHealthReturn {
  checks: SystemHealthCheck[];
  alerts: SystemAlert[];
  remediationLogs: RemediationLog[];
  recentResults: HealthCheckResult[];
  isLoading: boolean;
  isRunningChecks: boolean;
  runAllChecks: () => Promise<void>;
  runSingleCheck: (checkId: string) => Promise<void>;
  runRemediation: (checkId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  toggleCheckActive: (checkId: string, isActive: boolean) => Promise<void>;
  refreshData: () => Promise<void>;
  stats: {
    totalChecks: number;
    healthyCount: number;
    degradedCount: number;
    failingCount: number;
    unresolvedAlerts: number;
  };
}

export function useSystemHealth(): UseSystemHealthReturn {
  const [checks, setChecks] = useState<SystemHealthCheck[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [remediationLogs, setRemediationLogs] = useState<RemediationLog[]>([]);
  const [recentResults, setRecentResults] = useState<HealthCheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningChecks, setIsRunningChecks] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [checksRes, alertsRes, logsRes, resultsRes] = await Promise.all([
        supabase
          .from('system_health_checks')
          .select('*')
          .order('name'),
        supabase
          .from('system_alerts')
          .select('*')
          .eq('is_resolved', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('auto_remediation_logs')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(50),
        supabase
          .from('health_check_results')
          .select('*')
          .order('checked_at', { ascending: false })
          .limit(100),
      ]);

      if (checksRes.data) setChecks(checksRes.data as SystemHealthCheck[]);
      if (alertsRes.data) setAlerts(alertsRes.data as SystemAlert[]);
      if (logsRes.data) setRemediationLogs(logsRes.data as RemediationLog[]);
      if (resultsRes.data) setRecentResults(resultsRes.data as HealthCheckResult[]);
    } catch (error) {
      console.error('[useSystemHealth] Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Set up realtime subscription for alerts
    const channel = supabase
      .channel('system-health-alerts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'system_alerts' },
        () => fetchData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'system_health_checks' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const runAllChecks = useCallback(async () => {
    setIsRunningChecks(true);
    try {
      await supabase.functions.invoke('system-health-check', {
        body: { action: 'run_all' },
      });
      await fetchData();
    } catch (error) {
      console.error('[useSystemHealth] Error running checks:', error);
    } finally {
      setIsRunningChecks(false);
    }
  }, [fetchData]);

  const runSingleCheck = useCallback(async (checkId: string) => {
    try {
      await supabase.functions.invoke('system-health-check', {
        body: { action: 'run_single', check_id: checkId },
      });
      await fetchData();
    } catch (error) {
      console.error('[useSystemHealth] Error running single check:', error);
    }
  }, [fetchData]);

  const runRemediation = useCallback(async (checkId: string) => {
    try {
      await supabase.functions.invoke('system-health-check', {
        body: { action: 'run_remediation', check_id: checkId },
      });
      await fetchData();
    } catch (error) {
      console.error('[useSystemHealth] Error running remediation:', error);
    }
  }, [fetchData]);

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('system_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq('id', alertId);
      await fetchData();
    } catch (error) {
      console.error('[useSystemHealth] Error resolving alert:', error);
    }
  }, [fetchData]);

  const toggleCheckActive = useCallback(async (checkId: string, isActive: boolean) => {
    try {
      await supabase
        .from('system_health_checks')
        .update({ is_active: isActive })
        .eq('id', checkId);
      await fetchData();
    } catch (error) {
      console.error('[useSystemHealth] Error toggling check:', error);
    }
  }, [fetchData]);

  const stats = {
    totalChecks: checks.length,
    healthyCount: checks.filter(c => c.last_status === 'healthy').length,
    degradedCount: checks.filter(c => c.last_status === 'degraded').length,
    failingCount: checks.filter(c => c.last_status === 'failing').length,
    unresolvedAlerts: alerts.length,
  };

  return {
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
    refreshData: fetchData,
    stats,
  };
}
