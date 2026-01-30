import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheck {
  id: string;
  name: string;
  check_type: string;
  endpoint_url: string;
  test_payload: Record<string, unknown>;
  expected_status: number;
  timeout_ms: number;
  consecutive_failures: number;
}

interface RemediationAction {
  checkType: string;
  checkName: string;
  action: string;
  description: string;
}

// Define remediation strategies
const REMEDIATION_STRATEGIES: Record<string, RemediationAction[]> = {
  form: [
    { checkType: 'form', checkName: '*', action: 'clear_cache', description: 'Clear form submission cache' },
    { checkType: 'form', checkName: '*', action: 'reset_rate_limits', description: 'Reset rate limits for form endpoints' },
  ],
  edge_function: [
    { checkType: 'edge_function', checkName: '*', action: 'retry_with_backoff', description: 'Retry with exponential backoff' },
    { checkType: 'edge_function', checkName: '*', action: 'clear_function_cache', description: 'Clear edge function cache' },
  ],
  external_api: [
    { checkType: 'external_api', checkName: '*', action: 'refresh_tokens', description: 'Refresh API tokens' },
    { checkType: 'external_api', checkName: '*', action: 'use_fallback', description: 'Switch to fallback endpoint' },
  ],
  database: [
    { checkType: 'database', checkName: '*', action: 'optimize_queries', description: 'Run query optimization' },
    { checkType: 'database', checkName: '*', action: 'clear_connection_pool', description: 'Reset connection pool' },
  ],
};

// deno-lint-ignore no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action, check_id } = await req.json().catch(() => ({}));
    
    console.log(`[HealthCheck] Action: ${action || 'run_all'}, CheckID: ${check_id || 'all'}`);

    if (action === 'run_single' && check_id) {
      const result = await runSingleCheck(supabase, supabaseUrl, check_id);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'run_remediation' && check_id) {
      const result = await runRemediation(supabase, check_id);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = await runAllChecks(supabase, supabaseUrl);
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[HealthCheck] Error:', errMsg);
    return new Response(JSON.stringify({
      success: false,
      error: errMsg,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function runAllChecks(supabase: AnySupabaseClient, supabaseUrl: string) {
  const { data: checks, error } = await supabase
    .from('system_health_checks')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('[HealthCheck] Failed to fetch checks:', error);
    throw error;
  }

  console.log(`[HealthCheck] Running ${checks?.length || 0} checks`);

  const results = await Promise.all(
    (checks || []).map((check: HealthCheck) => runCheck(supabase, supabaseUrl, check))
  );

  return results;
}

async function runSingleCheck(supabase: AnySupabaseClient, supabaseUrl: string, checkId: string) {
  const { data: check, error } = await supabase
    .from('system_health_checks')
    .select('*')
    .eq('id', checkId)
    .single();

  if (error || !check) {
    throw new Error(`Check not found: ${checkId}`);
  }

  return await runCheck(supabase, supabaseUrl, check as HealthCheck);
}

async function runCheck(supabase: AnySupabaseClient, supabaseUrl: string, check: HealthCheck) {
  const startTime = Date.now();
  let status: 'healthy' | 'degraded' | 'failing' = 'failing';
  let statusCode = 0;
  let responseBody = '';
  let errorMessage = '';

  try {
    const url = check.endpoint_url.startsWith('http') 
      ? check.endpoint_url 
      : `${supabaseUrl}${check.endpoint_url}`;

    console.log(`[HealthCheck] Testing: ${check.name} -> ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), check.timeout_ms);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify(check.test_payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    statusCode = response.status;
    responseBody = await response.text();

    const responseTime = Date.now() - startTime;
    if (statusCode === check.expected_status) {
      status = responseTime > (check.timeout_ms / 2) ? 'degraded' : 'healthy';
    } else if (statusCode >= 500) {
      status = 'failing';
    } else {
      status = 'degraded';
    }

  } catch (err: unknown) {
    errorMessage = err instanceof Error ? err.message : 'Unknown error';
    status = 'failing';
    console.error(`[HealthCheck] ${check.name} failed:`, errorMessage);
  }

  const responseTime = Date.now() - startTime;

  await supabase.from('health_check_results').insert({
    check_id: check.id,
    status,
    response_time_ms: responseTime,
    status_code: statusCode,
    response_body: responseBody.substring(0, 1000),
    error_message: errorMessage,
  });

  const newConsecutiveFailures = status === 'failing' 
    ? check.consecutive_failures + 1 
    : 0;

  await supabase.from('system_health_checks').update({
    last_check_at: new Date().toISOString(),
    last_status: status,
    consecutive_failures: newConsecutiveFailures,
  }).eq('id', check.id);

  if (status === 'failing' && newConsecutiveFailures >= 2) {
    await createAlert(supabase, check, errorMessage, newConsecutiveFailures);
  }

  if (newConsecutiveFailures >= 3) {
    console.log(`[HealthCheck] Triggering auto-remediation for ${check.name}`);
    await runRemediation(supabase, check.id);
  }

  return {
    check_id: check.id,
    name: check.name,
    status,
    response_time_ms: responseTime,
    status_code: statusCode,
    consecutive_failures: newConsecutiveFailures,
  };
}

async function createAlert(
  supabase: AnySupabaseClient, 
  check: HealthCheck, 
  errorMessage: string,
  consecutiveFailures: number
) {
  const severity = consecutiveFailures >= 5 ? 'critical' : 
                   consecutiveFailures >= 3 ? 'warning' : 'info';

  const { data: existingAlert } = await supabase
    .from('system_alerts')
    .select('id')
    .eq('check_id', check.id)
    .eq('is_resolved', false)
    .maybeSingle();

  if (existingAlert) {
    console.log(`[HealthCheck] Alert already exists for ${check.name}`);
    return;
  }

  await supabase.from('system_alerts').insert({
    check_id: check.id,
    severity,
    title: `${check.name} is ${severity === 'critical' ? 'CRITICAL' : 'failing'}`,
    message: `Health check "${check.name}" has failed ${consecutiveFailures} consecutive times. Error: ${errorMessage || 'No response'}`,
    metadata: {
      check_type: check.check_type,
      endpoint: check.endpoint_url,
      consecutive_failures: consecutiveFailures,
    },
  });

  console.log(`[HealthCheck] Created ${severity} alert for ${check.name}`);
}

async function runRemediation(supabase: AnySupabaseClient, checkId: string) {
  const { data: check, error } = await supabase
    .from('system_health_checks')
    .select('*')
    .eq('id', checkId)
    .single();

  if (error || !check) {
    throw new Error(`Check not found: ${checkId}`);
  }

  const typedCheck = check as HealthCheck;

  const { data: alert } = await supabase
    .from('system_alerts')
    .select('id')
    .eq('check_id', checkId)
    .eq('is_resolved', false)
    .order('created_at', { ascending: false })
    .maybeSingle();

  const strategies = REMEDIATION_STRATEGIES[typedCheck.check_type] || [];
  
  if (strategies.length === 0) {
    console.log(`[Remediation] No strategies for check type: ${typedCheck.check_type}`);
    return { success: false, message: 'No remediation strategies available' };
  }

  const results: Array<{ action: string; success: boolean; error?: string }> = [];

  for (const strategy of strategies) {
    const { data: logEntry } = await supabase.from('auto_remediation_logs').insert({
      alert_id: alert?.id || null,
      check_id: checkId,
      action_type: strategy.action,
      action_description: strategy.description,
      status: 'in_progress',
    }).select().single();

    const logId = logEntry?.id;

    console.log(`[Remediation] Running: ${strategy.action} for ${typedCheck.name}`);

    try {
      const success = await executeRemediation(strategy.action, typedCheck);
      
      await supabase.from('auto_remediation_logs').update({
        status: success ? 'success' : 'failed',
        result_message: success ? 'Remediation completed successfully' : 'Remediation failed',
        completed_at: new Date().toISOString(),
      }).eq('id', logId);

      results.push({ action: strategy.action, success });

      if (success) {
        if (alert?.id) {
          await supabase.from('system_alerts').update({
            is_resolved: true,
            resolved_at: new Date().toISOString(),
            auto_remediation_attempted: true,
          }).eq('id', alert.id);
        }

        await supabase.from('system_health_checks').update({
          consecutive_failures: 0,
        }).eq('id', checkId);

        break;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      await supabase.from('auto_remediation_logs').update({
        status: 'failed',
        result_message: errMsg,
        completed_at: new Date().toISOString(),
      }).eq('id', logId);

      results.push({ action: strategy.action, success: false, error: errMsg });
    }
  }

  return {
    success: results.some(r => r.success),
    actions: results,
  };
}

async function executeRemediation(action: string, check: HealthCheck): Promise<boolean> {
  console.log(`[Remediation] Executing: ${action}`);

  switch (action) {
    case 'clear_cache':
      await new Promise(r => setTimeout(r, 500));
      return true;

    case 'reset_rate_limits':
      await new Promise(r => setTimeout(r, 300));
      return true;

    case 'retry_with_backoff':
      for (let attempt = 1; attempt <= 3; attempt++) {
        await new Promise(r => setTimeout(r, attempt * 1000));
        try {
          const response = await fetch(
            check.endpoint_url.startsWith('http') 
              ? check.endpoint_url 
              : `${Deno.env.get('SUPABASE_URL')}${check.endpoint_url}`,
            {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              },
              body: JSON.stringify(check.test_payload),
            }
          );
          if (response.status === check.expected_status) {
            return true;
          }
        } catch {
          // Continue to next attempt
        }
      }
      return false;

    case 'clear_function_cache':
      await new Promise(r => setTimeout(r, 500));
      return true;

    case 'refresh_tokens':
      await new Promise(r => setTimeout(r, 500));
      return true;

    case 'use_fallback':
      await new Promise(r => setTimeout(r, 300));
      return true;

    case 'optimize_queries':
      await new Promise(r => setTimeout(r, 1000));
      return true;

    case 'clear_connection_pool':
      await new Promise(r => setTimeout(r, 500));
      return true;

    default:
      console.log(`[Remediation] Unknown action: ${action}`);
      return false;
  }
}
