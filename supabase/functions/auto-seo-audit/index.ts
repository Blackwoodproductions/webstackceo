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
    ahrefs_rank: number | null; // Keep field name for DB compatibility (actually rank_score now)
  };
}

// Helper to call DataForSEO API
async function callDataForSEO(
  login: string,
  password: string,
  endpoint: string,
  data: any
): Promise<any> {
  const credentials = btoa(`${login}:${password}`);
  const url = `https://api.dataforseo.com/v3${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();
  
  if (response.status !== 200 || responseData.status_code !== 20000) {
    throw new Error(responseData.status_message || `API error: ${response.status}`);
  }
  
  return responseData;
}

async function runAuditForDomain(domain: string, login: string, password: string): Promise<AuditResult> {
  console.log(`[Auto-Audit] Running audit for domain: ${domain}`);
  
  try {
    // Clean the domain
    let cleanDomain = domain.toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0];
    
    let domainRating: number | null = null;
    let organicTraffic: number | null = null;
    let organicKeywords: number | null = null;
    let backlinks: number | null = null;
    let referringDomains: number | null = null;
    let trafficValue: number | null = null;
    let rankScore: number | null = null;
    
    // 1. Get Domain Rank Overview from Labs API
    try {
      const labsResponse = await callDataForSEO(login, password, '/dataforseo_labs/google/domain_rank_overview/live', [{
        target: cleanDomain,
        location_code: 2840,
        language_code: "en"
      }]);
      
      if (labsResponse?.tasks?.[0]?.result?.[0]) {
        const labsData = labsResponse.tasks[0].result[0];
        organicTraffic = labsData?.etv || labsData?.metrics?.organic?.etv || null;
        organicKeywords = labsData?.metrics?.organic?.count || labsData?.keywords_count || null;
        trafficValue = labsData?.metrics?.organic?.estimated_paid_traffic_cost || (organicTraffic ? Math.round(organicTraffic * 0.5) : null);
      }
    } catch (labsErr) {
      console.warn(`[Auto-Audit] Labs API error for ${cleanDomain}:`, labsErr);
    }
    
    // 2. Get Backlinks Summary
    try {
      const backlinksResponse = await callDataForSEO(login, password, '/backlinks/summary/live', [{
        target: cleanDomain,
        include_subdomains: true
      }]);
      
      if (backlinksResponse?.tasks?.[0]?.result?.[0]) {
        const backlinksData = backlinksResponse.tasks[0].result[0];
        backlinks = backlinksData?.backlinks || null;
        referringDomains = backlinksData?.referring_domains || null;
        rankScore = backlinksData?.rank || null;
        
        // Calculate domain rating from backlinks data
        if (referringDomains) {
          domainRating = Math.min(100, Math.round(Math.log10(referringDomains + 1) * 15));
        }
      }
    } catch (backlinksErr) {
      console.warn(`[Auto-Audit] Backlinks API error for ${cleanDomain}:`, backlinksErr);
    }
    
    // 3. Get Bulk Ranks for refined domain rating
    try {
      const ranksResponse = await callDataForSEO(login, password, '/backlinks/bulk_ranks/live', [{
        targets: [cleanDomain]
      }]);
      
      if (ranksResponse?.tasks?.[0]?.result?.[0]) {
        const ranksData = ranksResponse.tasks[0].result[0];
        const rawRank = ranksData?.rank || 0;
        if (rawRank > 0) {
          domainRating = Math.min(100, Math.round(Math.log10(1000000 / Math.max(1, rawRank)) * 20));
        }
        rankScore = ranksData?.rank || rankScore;
      }
    } catch (ranksErr) {
      console.warn(`[Auto-Audit] Bulk Ranks API error for ${cleanDomain}:`, ranksErr);
    }
    
    console.log(`[Auto-Audit] Audit complete for ${cleanDomain}: DR=${domainRating}, Traffic=${organicTraffic}`);
    
    return {
      domain: cleanDomain,
      success: true,
      metrics: {
        domain_rating: domainRating,
        organic_traffic: organicTraffic ? Math.round(organicTraffic) : null,
        organic_keywords: organicKeywords ? Math.round(organicKeywords) : null,
        backlinks: backlinks,
        referring_domains: referringDomains,
        traffic_value: trafficValue ? Math.round(trafficValue) : null,
        ahrefs_rank: rankScore, // Actually rank_score from DataForSEO
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
    const login = Deno.env.get('DATAFORSEO_LOGIN');
    const password = Deno.env.get('DATAFORSEO_PASSWORD');
    
    if (!login || !password) {
      console.error('[Auto-Audit] Missing DataForSEO credentials');
      return new Response(
        JSON.stringify({ error: 'Missing DataForSEO credentials' }),
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
      const result = await runAuditForDomain(body.domain, login, password);
      results.push(result);
      
      if (result.success && result.metrics) {
        const slug = result.domain.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        
        // Upsert to saved_audits
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
      // Scheduled batch mode - refresh all audits older than 30 days
      console.log('[Auto-Audit] Batch mode - refreshing audits for monthly comparison');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: staleAudits, error: fetchError } = await supabase
        .from('saved_audits')
        .select('domain, slug, updated_at')
        .lt('updated_at', thirtyDaysAgo.toISOString())
        .limit(10);
      
      if (fetchError) {
        console.error('[Auto-Audit] Error fetching stale audits:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch stale audits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`[Auto-Audit] Found ${staleAudits?.length || 0} stale audits to refresh`);
      
      for (const audit of staleAudits || []) {
        const result = await runAuditForDomain(audit.domain, login, password);
        results.push(result);
        
        if (result.success && result.metrics) {
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
