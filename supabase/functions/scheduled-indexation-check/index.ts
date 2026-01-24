import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IndexationReport {
  id: string
  domain: string
  created_at: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('[ScheduledIndexation] Starting weekly indexation check...')
    
    // Get all unique domains that have been checked before
    const { data: recentReports, error: reportsError } = await supabase
      .from('indexation_reports')
      .select('domain, created_at')
      .order('created_at', { ascending: false })
    
    if (reportsError) {
      console.error('[ScheduledIndexation] Error fetching reports:', reportsError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch reports' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    // Get unique domains with their latest report date
    const domainMap = new Map<string, string>()
    for (const report of (recentReports || [])) {
      if (!domainMap.has(report.domain)) {
        domainMap.set(report.domain, report.created_at)
      }
    }
    
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Find domains that need a new check (last check was more than 7 days ago)
    const domainsNeedingCheck: string[] = []
    for (const [domain, lastCheck] of domainMap.entries()) {
      const lastCheckDate = new Date(lastCheck)
      if (lastCheckDate < oneWeekAgo) {
        domainsNeedingCheck.push(domain)
      }
    }
    
    console.log(`[ScheduledIndexation] Found ${domainsNeedingCheck.length} domains needing check:`, domainsNeedingCheck)
    
    // Note: We can't actually run the full indexation check here because it requires
    // a user's Google OAuth access token. Instead, we log which domains need checking
    // and they will be checked when a user visits the dashboard.
    
    // For now, we just return information about domains that need checks
    // In a production system, you might store OAuth refresh tokens to enable
    // automatic background checks, but that requires additional setup.
    
    const result = {
      success: true,
      timestamp: now.toISOString(),
      totalDomains: domainMap.size,
      domainsNeedingCheck: domainsNeedingCheck.length,
      domains: domainsNeedingCheck,
      message: domainsNeedingCheck.length > 0 
        ? `${domainsNeedingCheck.length} domain(s) are due for an indexation check`
        : 'All domains have been checked within the last 7 days'
    }
    
    console.log('[ScheduledIndexation] Completed:', result)
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ScheduledIndexation] Error:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
