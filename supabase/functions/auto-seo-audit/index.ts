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
  console.log(`[Auto-Audit] Running Ahrefs audit for domain: ${domain}`);
  
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
    let ahrefsRank: number | null = null;
    
    // 1. Get Domain Rating
    try {
      const drUrl = `https://apiv2.ahrefs.com?token=${ahrefsApiKey}&from=domain_rating&target=${cleanDomain}&mode=domain&output=json`;
      const drResponse = await fetch(drUrl);
      const drData = await drResponse.json();
      
      if (!drData.error && drData.domain) {
        domainRating = drData.domain.domain_rating || null;
      }
    } catch (drErr) {
      console.warn(`[Auto-Audit] Domain rating error for ${cleanDomain}:`, drErr);
    }
    
    // 2. Get Backlinks Stats
    try {
      const backlinksUrl = `https://apiv2.ahrefs.com?token=${ahrefsApiKey}&from=backlinks_stats&target=${cleanDomain}&mode=domain&output=json`;
      const backlinksResponse = await fetch(backlinksUrl);
      const backlinksData = await backlinksResponse.json();
      
      if (!backlinksData.error && backlinksData.stats) {
        backlinks = backlinksData.stats.live || null;
        referringDomains = backlinksData.stats.refdomains || null;
      }
    } catch (backlinksErr) {
      console.warn(`[Auto-Audit] Backlinks error for ${cleanDomain}:`, backlinksErr);
    }
    
    // 3. Get Organic Keywords & Traffic
    try {
      const organicUrl = `https://apiv2.ahrefs.com?token=${ahrefsApiKey}&from=positions_metrics&target=${cleanDomain}&mode=domain&output=json`;
      const organicResponse = await fetch(organicUrl);
      const organicData = await organicResponse.json();
      
      if (!organicData.error && organicData.metrics) {
        organicTraffic = organicData.metrics.traffic || null;
        organicKeywords = organicData.metrics.positions || null;
        trafficValue = organicData.metrics.traffic_cost || null;
      }
    } catch (organicErr) {
      console.warn(`[Auto-Audit] Organic metrics error for ${cleanDomain}:`, organicErr);
    }
    
    // 4. Get Ahrefs Rank
    try {
      const rankUrl = `https://apiv2.ahrefs.com?token=${ahrefsApiKey}&from=ahrefs_rank&target=${cleanDomain}&mode=domain&output=json`;
      const rankResponse = await fetch(rankUrl);
      const rankData = await rankResponse.json();
      
      if (!rankData.error && rankData.domain) {
        ahrefsRank = rankData.domain.ahrefs_rank || null;
      }
    } catch (rankErr) {
      console.warn(`[Auto-Audit] Ahrefs rank error for ${cleanDomain}:`, rankErr);
    }
    
    console.log(`[Auto-Audit] Audit complete for ${cleanDomain}: DR=${domainRating}, Traffic=${organicTraffic}, Rank=${ahrefsRank}`);
    
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
      console.error('[Auto-Audit] Missing Ahrefs API key');
      return new Response(
        JSON.stringify({ error: 'Missing Ahrefs API key' }),
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
        const result = await runAuditForDomain(audit.domain, ahrefsApiKey);
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
