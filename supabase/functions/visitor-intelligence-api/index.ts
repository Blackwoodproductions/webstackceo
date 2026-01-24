import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface VisitorSession {
  id: string;
  session_id: string;
  first_page: string | null;
  referrer: string | null;
  started_at: string;
  last_activity_at: string;
  user_agent: string | null;
}

interface PageView {
  id: string;
  session_id: string;
  page_path: string;
  page_title: string | null;
  created_at: string;
  time_on_page: number | null;
  scroll_depth: number | null;
}

interface ToolInteraction {
  id: string;
  session_id: string;
  tool_name: string;
  tool_type: string | null;
  page_path: string | null;
  metadata: unknown;
  created_at: string;
}

interface Lead {
  id: string;
  email: string;
  phone: string | null;
  domain: string | null;
  metric_type: string;
  source_page: string | null;
  created_at: string;
  full_name: string | null;
  company_employees: string | null;
  annual_revenue: string | null;
  qualification_step: number | null;
  funnel_stage: string | null;
  status: string;
  closed_at: string | null;
  closed_amount: number | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    const expectedApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'summary';
    const days = parseInt(url.searchParams.get('days') || '7');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000);
    const page = parseInt(url.searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    console.log(`API Request: action=${action}, days=${days}, limit=${limit}, page=${page}`);

    let responseData: Record<string, unknown> = {};

    switch (action) {
      case 'summary': {
        // Get comprehensive summary data
        const [
          sessionsResult,
          pageViewsResult,
          toolInteractionsResult,
          leadsResult,
          activeVisitorsResult,
          newTodayResult,
        ] = await Promise.all([
          // Total sessions in period
          supabase
            .from('visitor_sessions')
            .select('*', { count: 'exact', head: true })
            .gte('started_at', startDateStr),
          
          // Total page views in period
          supabase
            .from('page_views')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startDateStr),
          
          // Total tool interactions in period
          supabase
            .from('tool_interactions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startDateStr),
          
          // Leads stats
          supabase
            .from('leads')
            .select('*')
            .gte('created_at', startDateStr),
          
          // Active visitors (last 5 minutes)
          supabase
            .from('visitor_sessions')
            .select('*', { count: 'exact', head: true })
            .gte('last_activity_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
          
          // New visitors today
          supabase
            .from('visitor_sessions')
            .select('*', { count: 'exact', head: true })
            .gte('started_at', new Date().toISOString().split('T')[0]),
        ]);

        const leads = (leadsResult.data || []) as Lead[];
        const openLeads = leads.filter(l => l.status !== 'closed');
        const closedLeads = leads.filter(l => l.status === 'closed');
        const qualifiedLeads = leads.filter(l => l.qualification_step && l.qualification_step >= 3);
        const namedLeads = leads.filter(l => l.full_name);
        const leadsWithCompanyInfo = leads.filter(l => l.company_employees || l.annual_revenue);

        // Calculate funnel stats
        const funnelStats = {
          visitors: sessionsResult.count || 0,
          engaged: toolInteractionsResult.count || 0,
          leads: leads.length,
          qualified: qualifiedLeads.length,
          closedLeads: closedLeads.length,
          withName: namedLeads.length,
          withCompanyInfo: leadsWithCompanyInfo.length,
          openLeads: openLeads.length,
          totalRevenue: closedLeads.reduce((sum, l) => sum + (l.closed_amount || 0), 0),
        };

        // Calculate referrer breakdown
        const { data: sessionsForReferrer } = await supabase
          .from('visitor_sessions')
          .select('referrer')
          .gte('started_at', startDateStr);

        const referrerBreakdown = {
          direct: 0,
          google: 0,
          bing: 0,
          social: 0,
          email: 0,
          referral: 0,
        };

        (sessionsForReferrer || []).forEach((s: { referrer: string | null }) => {
          const ref = (s.referrer || '').toLowerCase();
          if (!ref || ref === 'direct') referrerBreakdown.direct++;
          else if (ref.includes('google')) referrerBreakdown.google++;
          else if (ref.includes('bing')) referrerBreakdown.bing++;
          else if (ref.includes('facebook') || ref.includes('twitter') || ref.includes('linkedin') || ref.includes('instagram')) referrerBreakdown.social++;
          else if (ref.includes('mail') || ref.includes('email')) referrerBreakdown.email++;
          else referrerBreakdown.referral++;
        });

        responseData = {
          period: { days, startDate: startDateStr, endDate: new Date().toISOString() },
          metrics: {
            totalSessions: sessionsResult.count || 0,
            totalPageViews: pageViewsResult.count || 0,
            totalToolInteractions: toolInteractionsResult.count || 0,
            activeVisitors: activeVisitorsResult.count || 0,
            newVisitorsToday: newTodayResult.count || 0,
          },
          funnel: funnelStats,
          referrers: referrerBreakdown,
        };
        break;
      }

      case 'sessions': {
        const { data, count, error } = await supabase
          .from('visitor_sessions')
          .select('*', { count: 'exact' })
          .gte('started_at', startDateStr)
          .order('last_activity_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        responseData = {
          data: data as VisitorSession[],
          pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
        };
        break;
      }

      case 'active-sessions': {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data, count, error } = await supabase
          .from('visitor_sessions')
          .select('*', { count: 'exact' })
          .gte('last_activity_at', fiveMinutesAgo)
          .order('last_activity_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        responseData = {
          data: data as VisitorSession[],
          pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
        };
        break;
      }

      case 'page-views': {
        const { data, count, error } = await supabase
          .from('page_views')
          .select('*', { count: 'exact' })
          .gte('created_at', startDateStr)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        responseData = {
          data: data as PageView[],
          pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
        };
        break;
      }

      case 'page-stats': {
        // Aggregate page statistics
        const { data: pageViews } = await supabase
          .from('page_views')
          .select('page_path, time_on_page, scroll_depth')
          .gte('created_at', startDateStr);

        const pageStats: Record<string, { views: number; avgTimeOnPage: number; avgScrollDepth: number }> = {};
        
        (pageViews || []).forEach((pv) => {
          const path = pv.page_path || '/';
          if (!pageStats[path]) {
            pageStats[path] = { views: 0, avgTimeOnPage: 0, avgScrollDepth: 0 };
          }
          pageStats[path].views++;
          if (pv.time_on_page) pageStats[path].avgTimeOnPage += pv.time_on_page;
          if (pv.scroll_depth) pageStats[path].avgScrollDepth += pv.scroll_depth;
        });

        // Calculate averages
        Object.keys(pageStats).forEach(path => {
          const stat = pageStats[path];
          stat.avgTimeOnPage = stat.views > 0 ? stat.avgTimeOnPage / stat.views : 0;
          stat.avgScrollDepth = stat.views > 0 ? stat.avgScrollDepth / stat.views : 0;
        });

        // Sort by views and limit
        const sortedStats = Object.entries(pageStats)
          .sort(([, a], [, b]) => b.views - a.views)
          .slice(0, limit)
          .map(([path, stats]) => ({ path, ...stats }));

        responseData = { data: sortedStats };
        break;
      }

      case 'tool-interactions': {
        const { data, count, error } = await supabase
          .from('tool_interactions')
          .select('*', { count: 'exact' })
          .gte('created_at', startDateStr)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        responseData = {
          data: data as ToolInteraction[],
          pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
        };
        break;
      }

      case 'tool-stats': {
        // Aggregate tool usage statistics
        const { data: interactions } = await supabase
          .from('tool_interactions')
          .select('tool_name, tool_type')
          .gte('created_at', startDateStr);

        const toolStats: Record<string, { count: number; type: string | null }> = {};
        
        (interactions || []).forEach((ti) => {
          const name = ti.tool_name;
          if (!toolStats[name]) {
            toolStats[name] = { count: 0, type: ti.tool_type };
          }
          toolStats[name].count++;
        });

        const sortedStats = Object.entries(toolStats)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, limit)
          .map(([name, stats]) => ({ name, ...stats }));

        responseData = { data: sortedStats };
        break;
      }

      case 'leads': {
        const status = url.searchParams.get('status'); // open, closed, all
        let query = supabase
          .from('leads')
          .select('*', { count: 'exact' })
          .gte('created_at', startDateStr)
          .order('created_at', { ascending: false });

        if (status === 'open') {
          query = query.neq('status', 'closed');
        } else if (status === 'closed') {
          query = query.eq('status', 'closed');
        }

        const { data, count, error } = await query.range(offset, offset + limit - 1);

        if (error) throw error;

        responseData = {
          data: data as Lead[],
          pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
        };
        break;
      }

      case 'lead-funnel': {
        const { data: leads } = await supabase
          .from('leads')
          .select('*')
          .gte('created_at', startDateStr);

        const allLeads = (leads || []) as Lead[];
        
        const funnel = {
          total: allLeads.length,
          byStage: {
            new: allLeads.filter(l => !l.funnel_stage || l.funnel_stage === 'new').length,
            contacted: allLeads.filter(l => l.funnel_stage === 'contacted').length,
            qualified: allLeads.filter(l => l.funnel_stage === 'qualified').length,
            proposal: allLeads.filter(l => l.funnel_stage === 'proposal').length,
            negotiation: allLeads.filter(l => l.funnel_stage === 'negotiation').length,
            closed: allLeads.filter(l => l.status === 'closed').length,
          },
          byQualificationStep: {
            step1: allLeads.filter(l => l.qualification_step === 1).length,
            step2: allLeads.filter(l => l.qualification_step === 2).length,
            step3: allLeads.filter(l => l.qualification_step === 3).length,
            step4: allLeads.filter(l => l.qualification_step === 4).length,
            step5: allLeads.filter(l => l.qualification_step === 5).length,
          },
          withName: allLeads.filter(l => l.full_name).length,
          withPhone: allLeads.filter(l => l.phone).length,
          withCompanyInfo: allLeads.filter(l => l.company_employees || l.annual_revenue).length,
          totalRevenue: allLeads.filter(l => l.closed_amount).reduce((sum, l) => sum + (l.closed_amount || 0), 0),
        };

        responseData = { data: funnel };
        break;
      }

      case 'daily-stats': {
        // Get daily breakdown of key metrics
        const { data: sessions } = await supabase
          .from('visitor_sessions')
          .select('started_at')
          .gte('started_at', startDateStr);

        const { data: pageViews } = await supabase
          .from('page_views')
          .select('created_at')
          .gte('created_at', startDateStr);

        const { data: leads } = await supabase
          .from('leads')
          .select('created_at')
          .gte('created_at', startDateStr);

        const dailyStats: Record<string, { sessions: number; pageViews: number; leads: number }> = {};

        // Initialize days
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          dailyStats[dateStr] = { sessions: 0, pageViews: 0, leads: 0 };
        }

        (sessions || []).forEach((s: { started_at: string }) => {
          const dateStr = s.started_at.split('T')[0];
          if (dailyStats[dateStr]) dailyStats[dateStr].sessions++;
        });

        (pageViews || []).forEach((pv: { created_at: string }) => {
          const dateStr = pv.created_at.split('T')[0];
          if (dailyStats[dateStr]) dailyStats[dateStr].pageViews++;
        });

        (leads || []).forEach((l: { created_at: string }) => {
          const dateStr = l.created_at.split('T')[0];
          if (dailyStats[dateStr]) dailyStats[dateStr].leads++;
        });

        const sortedStats = Object.entries(dailyStats)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, stats]) => ({ date, ...stats }));

        responseData = { data: sortedStats };
        break;
      }

      case 'session-detail': {
        const sessionId = url.searchParams.get('session_id');
        if (!sessionId) {
          return new Response(
            JSON.stringify({ error: 'session_id parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const [sessionResult, pageViewsResult, toolInteractionsResult] = await Promise.all([
          supabase.from('visitor_sessions').select('*').eq('session_id', sessionId).single(),
          supabase.from('page_views').select('*').eq('session_id', sessionId).order('created_at', { ascending: true }),
          supabase.from('tool_interactions').select('*').eq('session_id', sessionId).order('created_at', { ascending: true }),
        ]);

        responseData = {
          session: sessionResult.data,
          pageViews: pageViewsResult.data || [],
          toolInteractions: toolInteractionsResult.data || [],
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action',
            availableActions: [
              'summary', 'sessions', 'active-sessions', 'page-views', 'page-stats',
              'tool-interactions', 'tool-stats', 'leads', 'lead-funnel', 'daily-stats', 'session-detail'
            ]
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`API Response: action=${action}, success=true`);
    
    return new Response(
      JSON.stringify({ success: true, ...responseData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('API Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});