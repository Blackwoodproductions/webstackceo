import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditResult {
  domain: string;
  success: boolean;
  error?: string;
  metrics?: {
    domain_rating: number | null;
    organic_traffic: number | null;
    organic_keywords: number | null;
    backlinks: number | null;
    referring_domains: number | null;
    traffic_value: number | null;
    ahrefs_rank: number | null;
  };
}

async function runAuditForDomain(domain: string, ahrefsApiKey: string): Promise<AuditResult> {
  console.log(`[Auto-Audit] Running audit for domain: ${domain}`);
  
  try {
    // Clean the domain
    let cleanDomain = domain.toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0];
    
    // Call Ahrefs API for domain metrics
    const ahrefsUrl = `https://api.ahrefs.com/v3/site-explorer/domain-rating?target=${cleanDomain}&output=json`;
    
    const [drResponse, metricsResponse] = await Promise.all([
      fetch(ahrefsUrl, {
        headers: { 'Authorization': `Bearer ${ahrefsApiKey}` }
      }),
      fetch(`https://api.ahrefs.com/v3/site-explorer/metrics?target=${cleanDomain}&output=json`, {
        headers: { 'Authorization': `Bearer ${ahrefsApiKey}` }
      })
    ]);
    
    let domainRating = null;
    let organicTraffic = null;
    let organicKeywords = null;
    let backlinks = null;
    let referringDomains = null;
    let trafficValue = null;
    let ahrefsRank = null;
    
    if (drResponse.ok) {
      const drData = await drResponse.json();
      domainRating = drData?.domain_rating || null;
      ahrefsRank = drData?.ahrefs_rank || null;
    }
    
    if (metricsResponse.ok) {
      const metricsData = await metricsResponse.json();
      organicTraffic = metricsData?.organic?.traffic || null;
      organicKeywords = metricsData?.organic?.keywords || null;
      backlinks = metricsData?.backlinks_live || null;
      referringDomains = metricsData?.refdomains_live || null;
      trafficValue = metricsData?.organic?.cost || null;
    }
    
    console.log(`[Auto-Audit] Audit complete for ${cleanDomain}: DR=${domainRating}, Traffic=${organicTraffic}`);
    
    return {
      domain: cleanDomain,
      success: true,
      metrics: {
        domain_rating: domainRating,
        organic_traffic: organicTraffic,
        organic_keywords: organicKeywords,
        backlinks: backlinks,
        referring_domains: referringDomains,
        traffic_value: trafficValue,
        ahrefs_rank: ahrefsRank,
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Auto-Audit] Error auditing ${domain}:`, error);
    return {
      domain,
      success: false,
      error: errorMessage
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  console.log('[Auto-Audit] Function invoked');
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ahrefsApiKey = Deno.env.get('AHREFS_API_KEY');
    
    if (!ahrefsApiKey) {
      console.error('[Auto-Audit] Missing AHREFS_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Missing AHREFS_API_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if this is a single domain request or a scheduled batch
    let body: { domain?: string; mode?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Empty body - this is a scheduled run
    }
    
    const results: AuditResult[] = [];
    
    if (body.domain) {
      // Single domain audit (triggered when domain is added)
      console.log(`[Auto-Audit] Single domain mode: ${body.domain}`);
      const result = await runAuditForDomain(body.domain, ahrefsApiKey);
      results.push(result);
      
      if (result.success && result.metrics) {
        const slug = result.domain.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        
        // Upsert to saved_audits (no submitter_email = no free directory link)
        const { data: savedAudit, error: upsertError } = await supabase
          .from('saved_audits')
          .upsert({
            domain: result.domain,
            slug,
            domain_rating: result.metrics.domain_rating,
            organic_traffic: result.metrics.organic_traffic,
            organic_keywords: result.metrics.organic_keywords,
            backlinks: result.metrics.backlinks,
            referring_domains: result.metrics.referring_domains,
            traffic_value: result.metrics.traffic_value,
            ahrefs_rank: result.metrics.ahrefs_rank,
            category: 'other',
          }, { onConflict: 'slug' })
          .select('id')
          .single();
        
        if (upsertError) {
          console.error('[Auto-Audit] Error saving audit:', upsertError);
        } else {
          console.log(`[Auto-Audit] Saved audit for ${result.domain}`);
          
          // Insert history snapshot for progress tracking
          const { error: historyError } = await supabase
            .from('audit_history')
            .insert({
              audit_id: savedAudit?.id,
              domain: result.domain,
              domain_rating: result.metrics.domain_rating,
              organic_traffic: result.metrics.organic_traffic,
              organic_keywords: result.metrics.organic_keywords,
              backlinks: result.metrics.backlinks,
              referring_domains: result.metrics.referring_domains,
              traffic_value: result.metrics.traffic_value,
              ahrefs_rank: result.metrics.ahrefs_rank,
              source: 'manual',
            });
          
          if (historyError) {
            console.error('[Auto-Audit] Error saving history:', historyError);
          } else {
            console.log(`[Auto-Audit] Saved history snapshot for ${result.domain}`);
          }
        }
      }
    } else {
      // Scheduled batch mode - refresh all audits older than 7 days
      console.log('[Auto-Audit] Batch mode - refreshing stale audits');
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: staleAudits, error: fetchError } = await supabase
        .from('saved_audits')
        .select('domain, slug, updated_at')
        .lt('updated_at', sevenDaysAgo.toISOString())
        .limit(10); // Process 10 at a time to avoid timeout
      
      if (fetchError) {
        console.error('[Auto-Audit] Error fetching stale audits:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch stale audits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`[Auto-Audit] Found ${staleAudits?.length || 0} stale audits to refresh`);
      
      for (const audit of staleAudits || []) {
        const result = await runAuditForDomain(audit.domain, ahrefsApiKey);
        results.push(result);
        
        if (result.success && result.metrics) {
          // Get the audit ID first
          const { data: existingAudit } = await supabase
            .from('saved_audits')
            .select('id')
            .eq('slug', audit.slug)
            .single();
          
          const { error: updateError } = await supabase
            .from('saved_audits')
            .update({
              domain_rating: result.metrics.domain_rating,
              organic_traffic: result.metrics.organic_traffic,
              organic_keywords: result.metrics.organic_keywords,
              backlinks: result.metrics.backlinks,
              referring_domains: result.metrics.referring_domains,
              traffic_value: result.metrics.traffic_value,
              ahrefs_rank: result.metrics.ahrefs_rank,
              updated_at: new Date().toISOString(),
            })
            .eq('slug', audit.slug);
          
          if (updateError) {
            console.error(`[Auto-Audit] Error updating audit for ${audit.domain}:`, updateError);
          } else {
            // Insert history snapshot for progress tracking
            const { error: historyError } = await supabase
              .from('audit_history')
              .insert({
                audit_id: existingAudit?.id,
                domain: result.domain,
                domain_rating: result.metrics.domain_rating,
                organic_traffic: result.metrics.organic_traffic,
                organic_keywords: result.metrics.organic_keywords,
                backlinks: result.metrics.backlinks,
                referring_domains: result.metrics.referring_domains,
                traffic_value: result.metrics.traffic_value,
                ahrefs_rank: result.metrics.ahrefs_rank,
                source: 'auto',
              });
            
            if (historyError) {
              console.error(`[Auto-Audit] Error saving history for ${audit.domain}:`, historyError);
            } else {
              console.log(`[Auto-Audit] Saved history snapshot for ${result.domain}`);
            }
          }
        }
        
        // Small delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`[Auto-Audit] Completed. Processed ${results.length} domains`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Auto-Audit] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});