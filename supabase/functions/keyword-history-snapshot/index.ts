import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KeywordSnapshot {
  domain: string;
  keyword: string;
  google_position?: number;
  bing_position?: number;
  yahoo_position?: number;
  search_volume?: number;
  cpc?: number;
  competition_level?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action } = body;

    // Action: Save snapshot of current keyword rankings
    if (action === 'saveSnapshot') {
      const { domain, keywords } = body as { domain: string; keywords: KeywordSnapshot[] };

      if (!domain || !keywords || !Array.isArray(keywords)) {
        return new Response(
          JSON.stringify({ error: 'Domain and keywords array required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if we already have a snapshot this week for this domain
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);

      const { data: existingSnapshots } = await supabase
        .from('keyword_ranking_history')
        .select('id')
        .eq('domain', domain)
        .gte('snapshot_at', oneWeekAgo.toISOString())
        .limit(1);

      // Only allow one snapshot per week per domain (unless forced)
      if (existingSnapshots && existingSnapshots.length > 0 && !body.force) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Snapshot already exists for this week',
            lastSnapshot: existingSnapshots[0]
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert snapshot records
      const snapshotRecords = keywords.map(kw => ({
        domain,
        keyword: kw.keyword,
        google_position: kw.google_position || null,
        bing_position: kw.bing_position || null,
        yahoo_position: kw.yahoo_position || null,
        search_volume: kw.search_volume || null,
        cpc: kw.cpc || null,
        competition_level: kw.competition_level || null,
        source: 'bron'
      }));

      const { error: insertError } = await supabase
        .from('keyword_ranking_history')
        .insert(snapshotRecords);

      if (insertError) {
        console.error('Failed to insert snapshot:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save snapshot', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Saved ${snapshotRecords.length} keyword snapshots for ${domain}`);
      return new Response(
        JSON.stringify({ success: true, count: snapshotRecords.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Get historical data for a keyword
    if (action === 'getHistory') {
      const { domain, keyword, limit = 52 } = body;

      if (!domain || !keyword) {
        return new Response(
          JSON.stringify({ error: 'Domain and keyword required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase
        .from('keyword_ranking_history')
        .select('*')
        .eq('domain', domain)
        .ilike('keyword', keyword)
        .order('snapshot_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch history:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch history' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, history: data || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Get all keywords history for a domain (summary view)
    if (action === 'getDomainHistory') {
      const { domain, limit = 12 } = body;

      if (!domain) {
        return new Response(
          JSON.stringify({ error: 'Domain required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get distinct snapshot dates
      const { data: snapshots, error } = await supabase
        .from('keyword_ranking_history')
        .select('keyword, google_position, bing_position, yahoo_position, search_volume, cpc, competition_level, snapshot_at')
        .eq('domain', domain)
        .order('snapshot_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch domain history:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch domain history' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Group by keyword
      const historyByKeyword: Record<string, Array<{
        snapshot_at: string;
        google_position: number | null;
        bing_position: number | null;
        yahoo_position: number | null;
        search_volume: number | null;
        cpc: number | null;
        competition_level: string | null;
      }>> = {};

      for (const snap of snapshots || []) {
        const kw = snap.keyword.toLowerCase();
        if (!historyByKeyword[kw]) {
          historyByKeyword[kw] = [];
        }
        historyByKeyword[kw].push({
          snapshot_at: snap.snapshot_at,
          google_position: snap.google_position,
          bing_position: snap.bing_position,
          yahoo_position: snap.yahoo_position,
          search_volume: snap.search_volume,
          cpc: snap.cpc,
          competition_level: snap.competition_level
        });
      }

      return new Response(
        JSON.stringify({ success: true, historyByKeyword }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Keyword history error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
