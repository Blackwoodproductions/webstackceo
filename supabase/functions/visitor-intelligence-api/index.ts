import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// ========== Visitor Intelligence Types ==========
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

// ========== Domain Audit Types ==========
interface AhrefsMetrics {
  domainRating: number;
  ahrefsRank: number;
  backlinks: number;
  backlinksAllTime: number;
  referringDomains: number;
  referringDomainsAllTime: number;
  organicTraffic: number;
  organicKeywords: number;
  trafficValue: number;
}

interface HistoryDataPoint {
  date: string;
  organicTraffic: number;
  organicKeywords: number;
  domainRating: number;
  trafficValue: number;
}

interface SavedAudit {
  id: string;
  domain: string;
  slug: string;
  site_title: string | null;
  site_description: string | null;
  site_summary: string | null;
  domain_rating: number | null;
  organic_traffic: number | null;
  organic_keywords: number | null;
  traffic_value: number | null;
  backlinks: number | null;
  referring_domains: number | null;
  ahrefs_rank: number | null;
  category: string;
  created_at: string;
  updated_at: string;
}

// ========== Ahrefs API Helper Functions ==========
async function fetchAhrefsData(domain: string): Promise<{ ahrefs: AhrefsMetrics | null; ahrefsError: string | null; history: HistoryDataPoint[] | null }> {
  const AHREFS_API_KEY = Deno.env.get("AHREFS_API_KEY");
  
  if (!AHREFS_API_KEY) {
    console.error("AHREFS_API_KEY is not configured");
    return { ahrefs: null, ahrefsError: "Ahrefs API key not configured", history: null };
  }

  // Clean the domain
  let cleanDomain = domain.toLowerCase().trim();
  cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, "");
  cleanDomain = cleanDomain.split("/")[0];

  console.log(`Fetching Ahrefs data for domain: ${cleanDomain}`);

  const result: { ahrefs: AhrefsMetrics | null; ahrefsError: string | null; history: HistoryDataPoint[] | null } = {
    ahrefs: null,
    ahrefsError: null,
    history: null,
  };

  try {
    const today = new Date().toISOString().split('T')[0];
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const startDate = twoYearsAgo.toISOString().split('T')[0];
    
    // Ahrefs Domain Rating API
    const ahrefsUrl = new URL("https://api.ahrefs.com/v3/site-explorer/domain-rating");
    ahrefsUrl.searchParams.set("target", cleanDomain);
    ahrefsUrl.searchParams.set("date", today);
    ahrefsUrl.searchParams.set("output", "json");

    const ahrefsResponse = await fetch(ahrefsUrl.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${AHREFS_API_KEY}`,
        "Accept": "application/json",
      },
    });

    if (!ahrefsResponse.ok) {
      const errorText = await ahrefsResponse.text();
      console.error(`Ahrefs API error: ${ahrefsResponse.status} - ${errorText}`);
      
      if (ahrefsResponse.status === 401) {
        result.ahrefsError = "Invalid Ahrefs API key";
      } else if (ahrefsResponse.status === 403) {
        result.ahrefsError = "Ahrefs API access denied - check your subscription";
      } else if (ahrefsResponse.status === 429) {
        result.ahrefsError = "Ahrefs API rate limit exceeded";
      } else {
        result.ahrefsError = `Ahrefs API error: ${ahrefsResponse.status}`;
      }
      return result;
    }

    const drData = await ahrefsResponse.json();

    // Get backlinks stats
    const backlinksStatsUrl = new URL("https://api.ahrefs.com/v3/site-explorer/backlinks-stats");
    backlinksStatsUrl.searchParams.set("target", cleanDomain);
    backlinksStatsUrl.searchParams.set("date", today);
    backlinksStatsUrl.searchParams.set("mode", "subdomains");
    backlinksStatsUrl.searchParams.set("output", "json");

    const backlinksStatsResponse = await fetch(backlinksStatsUrl.toString(), {
      method: "GET",
      headers: { "Authorization": `Bearer ${AHREFS_API_KEY}`, "Accept": "application/json" },
    });

    let backlinksStatsData = null;
    if (backlinksStatsResponse.ok) {
      backlinksStatsData = await backlinksStatsResponse.json();
    }

    // Get organic metrics
    const metricsUrl = new URL("https://api.ahrefs.com/v3/site-explorer/metrics");
    metricsUrl.searchParams.set("target", cleanDomain);
    metricsUrl.searchParams.set("date", today);
    metricsUrl.searchParams.set("output", "json");

    const metricsResponse = await fetch(metricsUrl.toString(), {
      method: "GET",
      headers: { "Authorization": `Bearer ${AHREFS_API_KEY}`, "Accept": "application/json" },
    });

    let metricsData = null;
    if (metricsResponse.ok) {
      metricsData = await metricsResponse.json();
    }

    // Fetch historical metrics data
    const historyUrl = new URL("https://api.ahrefs.com/v3/site-explorer/metrics-history");
    historyUrl.searchParams.set("target", cleanDomain);
    historyUrl.searchParams.set("date_from", startDate);
    historyUrl.searchParams.set("date_to", today);
    historyUrl.searchParams.set("history_grouping", "monthly");
    historyUrl.searchParams.set("output", "json");

    const historyResponse = await fetch(historyUrl.toString(), {
      method: "GET",
      headers: { "Authorization": `Bearer ${AHREFS_API_KEY}`, "Accept": "application/json" },
    });

    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      if (historyData?.metrics && Array.isArray(historyData.metrics)) {
        result.history = historyData.metrics.map((item: { date: string; org_traffic?: number; org_cost?: number }) => ({
          date: item.date,
          organicTraffic: item.org_traffic || 0,
          organicKeywords: Math.round((item.org_traffic || 0) * 0.45),
          domainRating: 0,
          trafficValue: Math.round((item.org_cost || 0) / 100),
        }));
      }
    }

    // Fetch domain rating history
    const drHistoryUrl = new URL("https://api.ahrefs.com/v3/site-explorer/domain-rating-history");
    drHistoryUrl.searchParams.set("target", cleanDomain);
    drHistoryUrl.searchParams.set("date_from", startDate);
    drHistoryUrl.searchParams.set("date_to", today);
    drHistoryUrl.searchParams.set("history_grouping", "monthly");
    drHistoryUrl.searchParams.set("output", "json");

    const drHistoryResponse = await fetch(drHistoryUrl.toString(), {
      method: "GET",
      headers: { "Authorization": `Bearer ${AHREFS_API_KEY}`, "Accept": "application/json" },
    });

    if (drHistoryResponse.ok) {
      const drHistoryData = await drHistoryResponse.json();
      const drArray = drHistoryData?.domain_ratings;
      
      if (drArray && Array.isArray(drArray)) {
        const drHistoryMap = new Map(
          drArray.map((item: { date: string; domain_rating?: number }) => [
            item.date,
            typeof item.domain_rating === 'number' ? item.domain_rating : 0
          ])
        );
        
        if (result.history && result.history.length > 0) {
          result.history = result.history.map(item => ({
            ...item,
            domainRating: Math.round((drHistoryMap.get(item.date) as number) || item.domainRating || 0),
          }));
        } else {
          result.history = drArray.map((item: { date: string; domain_rating?: number }) => ({
            date: item.date,
            organicTraffic: 0,
            organicKeywords: 0,
            domainRating: Math.round(typeof item.domain_rating === 'number' ? item.domain_rating : 0),
            trafficValue: 0,
          }));
        }
      }
    }

    // Extract metrics
    const drValue = typeof drData.domain_rating === 'object' 
      ? drData.domain_rating.domain_rating 
      : drData.domain_rating;
    const ahrefsRankValue = typeof drData.domain_rating === 'object'
      ? drData.domain_rating.ahrefs_rank
      : 0;
    
    const backlinksCount = backlinksStatsData?.metrics?.live || backlinksStatsData?.live || 0;
    const backlinksAllTime = backlinksStatsData?.metrics?.all_time || backlinksStatsData?.all_time || 0;
    const refDomainsCount = backlinksStatsData?.metrics?.live_refdomains || backlinksStatsData?.live_refdomains || 0;
    const refDomainsAllTime = backlinksStatsData?.metrics?.all_time_refdomains || backlinksStatsData?.all_time_refdomains || 0;
    const trafficValueDollars = Math.round((metricsData?.metrics?.org_cost || 0) / 100);
    
    result.ahrefs = {
      domainRating: Math.round(drValue || 0),
      ahrefsRank: ahrefsRankValue || 0,
      backlinks: backlinksCount,
      backlinksAllTime: backlinksAllTime,
      referringDomains: refDomainsCount,
      referringDomainsAllTime: refDomainsAllTime,
      organicTraffic: metricsData?.metrics?.org_traffic || 0,
      organicKeywords: metricsData?.metrics?.org_keywords || 0,
      trafficValue: trafficValueDollars,
    };

  } catch (ahrefsErr) {
    console.error("Ahrefs fetch error:", ahrefsErr);
    result.ahrefsError = ahrefsErr instanceof Error ? ahrefsErr.message : "Failed to fetch Ahrefs data";
  }

  return result;
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

      // ========== DOMAIN AUDIT ACTIONS ==========
      
      case 'audit-domain': {
        // Perform a live domain audit using Ahrefs API
        const domain = url.searchParams.get('domain');
        if (!domain) {
          return new Response(
            JSON.stringify({ error: 'domain parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Performing live audit for domain: ${domain}`);
        const auditResult = await fetchAhrefsData(domain);
        
        responseData = {
          domain: domain,
          ...auditResult,
        };
        break;
      }

      case 'audit-list': {
        // List all saved audits with pagination
        const category = url.searchParams.get('category');
        const search = url.searchParams.get('search');
        
        let query = supabase
          .from('saved_audits')
          .select('*', { count: 'exact' })
          .order('updated_at', { ascending: false });
        
        if (category && category !== 'all') {
          query = query.eq('category', category);
        }
        
        if (search) {
          query = query.or(`domain.ilike.%${search}%,site_title.ilike.%${search}%`);
        }
        
        const { data, count, error } = await query.range(offset, offset + limit - 1);

        if (error) throw error;

        responseData = {
          data: data as SavedAudit[],
          pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
        };
        break;
      }

      case 'audit-get': {
        // Get a specific saved audit by domain or slug
        const domain = url.searchParams.get('domain');
        const slug = url.searchParams.get('slug');
        
        if (!domain && !slug) {
          return new Response(
            JSON.stringify({ error: 'domain or slug parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let query = supabase.from('saved_audits').select('*');
        
        if (slug) {
          query = query.eq('slug', slug);
        } else if (domain) {
          // Clean domain for matching
          let cleanDomain = domain.toLowerCase().trim();
          cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, "");
          cleanDomain = cleanDomain.split("/")[0];
          query = query.eq('domain', cleanDomain);
        }
        
        const { data, error } = await query.single();

        if (error) {
          if (error.code === 'PGRST116') {
            return new Response(
              JSON.stringify({ error: 'Audit not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw error;
        }

        responseData = { data };
        break;
      }

      case 'audit-save': {
        // Save or update an audit (requires POST with body)
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'POST method required for audit-save' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body = await req.json();
        const { domain, ...auditData } = body;
        
        if (!domain) {
          return new Response(
            JSON.stringify({ error: 'domain field required in body' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Clean domain
        let cleanDomain = domain.toLowerCase().trim();
        cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, "");
        cleanDomain = cleanDomain.split("/")[0];
        
        // Generate slug
        const slug = cleanDomain.replace(/\./g, '-');
        
        // Upsert audit
        const { data, error } = await supabase
          .from('saved_audits')
          .upsert({
            domain: cleanDomain,
            slug,
            ...auditData,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'domain' })
          .select()
          .single();

        if (error) throw error;

        responseData = { data, message: 'Audit saved successfully' };
        break;
      }

      case 'audit-full': {
        // Perform a full audit: fetch live data from Ahrefs and save it
        const domain = url.searchParams.get('domain');
        const submitterEmail = url.searchParams.get('email');
        
        if (!domain) {
          return new Response(
            JSON.stringify({ error: 'domain parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Performing full audit for domain: ${domain}`);
        
        // Clean domain
        let cleanDomain = domain.toLowerCase().trim();
        cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, "");
        cleanDomain = cleanDomain.split("/")[0];
        const slug = cleanDomain.replace(/\./g, '-');

        // Fetch live Ahrefs data
        const auditResult = await fetchAhrefsData(cleanDomain);
        
        if (auditResult.ahrefsError) {
          responseData = {
            domain: cleanDomain,
            saved: false,
            error: auditResult.ahrefsError,
          };
          break;
        }

        // Save to database
        const { data: savedAudit, error: saveError } = await supabase
          .from('saved_audits')
          .upsert({
            domain: cleanDomain,
            slug,
            domain_rating: auditResult.ahrefs?.domainRating || null,
            organic_traffic: auditResult.ahrefs?.organicTraffic || null,
            organic_keywords: auditResult.ahrefs?.organicKeywords || null,
            traffic_value: auditResult.ahrefs?.trafficValue || null,
            backlinks: auditResult.ahrefs?.backlinks || null,
            referring_domains: auditResult.ahrefs?.referringDomains || null,
            ahrefs_rank: auditResult.ahrefs?.ahrefsRank || null,
            submitter_email: submitterEmail || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'domain' })
          .select()
          .single();

        if (saveError) {
          console.error('Failed to save audit:', saveError);
        }

        responseData = {
          domain: cleanDomain,
          saved: !saveError,
          audit: savedAudit || null,
          ahrefs: auditResult.ahrefs,
          history: auditResult.history,
        };
        break;
      }

      case 'audit-stats': {
        // Get aggregate statistics across all audits
        const { data: audits } = await supabase
          .from('saved_audits')
          .select('domain_rating, organic_traffic, organic_keywords, traffic_value, backlinks, referring_domains, category');

        const allAudits = audits || [];
        
        // Category breakdown
        const categoryBreakdown: Record<string, number> = {};
        allAudits.forEach((a: { category?: string }) => {
          const cat = a.category || 'other';
          categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
        });

        // Calculate averages
        const avgDomainRating = allAudits.reduce((sum, a: { domain_rating?: number | null }) => sum + (a.domain_rating || 0), 0) / (allAudits.length || 1);
        const avgTraffic = allAudits.reduce((sum, a: { organic_traffic?: number | null }) => sum + (a.organic_traffic || 0), 0) / (allAudits.length || 1);
        const totalTrafficValue = allAudits.reduce((sum, a: { traffic_value?: number | null }) => sum + (a.traffic_value || 0), 0);

        responseData = {
          data: {
            totalAudits: allAudits.length,
            averageDomainRating: Math.round(avgDomainRating * 10) / 10,
            averageOrganicTraffic: Math.round(avgTraffic),
            totalTrafficValue: totalTrafficValue,
            categoryBreakdown,
          }
        };
        break;
      }

      case 'audit-categories': {
        // List available audit categories
        const categories = [
          'ecommerce', 'saas', 'local_business', 'blog_media', 'professional_services',
          'healthcare', 'finance', 'education', 'real_estate', 'hospitality',
          'nonprofit', 'technology', 'other'
        ];

        // Get counts per category
        const { data: audits } = await supabase
          .from('saved_audits')
          .select('category');

        const counts: Record<string, number> = {};
        (audits || []).forEach((a: { category?: string }) => {
          const cat = a.category || 'other';
          counts[cat] = (counts[cat] || 0) + 1;
        });

        responseData = {
          data: categories.map(cat => ({
            id: cat,
            name: cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            count: counts[cat] || 0,
          }))
        };
        break;
      }

      case 'docs': {
        // Return API documentation as JSON (for programmatic access)
        responseData = {
          documentation: {
            title: 'Visitor Intelligence API Documentation',
            version: '1.0.0',
            baseUrl: 'https://qwnzenimkwtuaqnrcygb.supabase.co/functions/v1/visitor-intelligence-api',
            authentication: {
              type: 'API Key',
              headers: ['x-api-key: YOUR_API_KEY', 'Authorization: Bearer YOUR_API_KEY'],
            },
            commonParameters: {
              action: { required: true, description: 'API action to perform' },
              days: { default: 7, max: 365, description: 'Number of days to query' },
              limit: { default: 100, max: 1000, description: 'Results per page' },
              page: { default: 1, description: 'Page number for pagination' },
            },
            endpoints: {
              visitorIntelligence: [
                { action: 'summary', method: 'GET', description: 'Get comprehensive dashboard summary with metrics, funnel stats, and referrer breakdown', params: ['days'] },
                { action: 'sessions', method: 'GET', description: 'List all visitor sessions with pagination', params: ['days', 'limit', 'page'] },
                { action: 'active-sessions', method: 'GET', description: 'Get currently active visitors (last 5 minutes)', params: ['limit', 'page'] },
                { action: 'page-views', method: 'GET', description: 'List all page views with timestamps and engagement data', params: ['days', 'limit', 'page'] },
                { action: 'page-stats', method: 'GET', description: 'Aggregated statistics per page', params: ['days', 'limit'] },
                { action: 'tool-interactions', method: 'GET', description: 'List all tool/widget interactions', params: ['days', 'limit', 'page'] },
                { action: 'tool-stats', method: 'GET', description: 'Aggregated tool usage statistics', params: ['days', 'limit'] },
                { action: 'leads', method: 'GET', description: 'List all leads with optional status filtering', params: ['days', 'limit', 'page', 'status'] },
                { action: 'lead-funnel', method: 'GET', description: 'Get lead funnel breakdown by stage', params: ['days'] },
                { action: 'daily-stats', method: 'GET', description: 'Daily breakdown of sessions, page views, and leads', params: ['days'] },
                { action: 'session-detail', method: 'GET', description: 'Get full session journey with all interactions', params: ['session_id'] },
              ],
              domainAudit: [
                { action: 'audit-domain', method: 'GET', description: 'Perform live SEO audit using Ahrefs API', params: ['domain'] },
                { action: 'audit-full', method: 'GET', description: 'Perform full audit: fetch live data and save to database', params: ['domain', 'email'] },
                { action: 'audit-list', method: 'GET', description: 'List all saved audits with pagination', params: ['category', 'search', 'limit', 'page'] },
                { action: 'audit-get', method: 'GET', description: 'Get a specific saved audit', params: ['domain', 'slug'] },
                { action: 'audit-save', method: 'POST', description: 'Save or update an audit record', params: ['JSON body'] },
                { action: 'audit-stats', method: 'GET', description: 'Get aggregate statistics across all audits', params: [] },
                { action: 'audit-categories', method: 'GET', description: 'List all audit categories with counts', params: [] },
              ],
              documentation: [
                { action: 'docs', method: 'GET', description: 'Get this API documentation as JSON', params: [] },
              ],
            },
            dataModels: {
              VisitorSession: {
                id: 'string - Unique session UUID',
                session_id: 'string - Client-generated session identifier',
                first_page: 'string - Entry page path',
                referrer: 'string - Traffic source URL',
                started_at: 'timestamp - Session start time',
                last_activity_at: 'timestamp - Last activity time',
                user_agent: 'string - Browser user agent',
              },
              Lead: {
                id: 'string - Unique lead UUID',
                email: 'string - Lead email address',
                phone: 'string - Phone number',
                full_name: 'string - Contact name',
                domain: 'string - Website domain',
                funnel_stage: 'string - Current pipeline stage',
                status: 'string - open or closed',
                closed_amount: 'number - Revenue if closed',
              },
              AhrefsMetrics: {
                domainRating: 'number - Domain Rating (0-100)',
                ahrefsRank: 'number - Global Ahrefs rank',
                backlinks: 'number - Live backlink count',
                referringDomains: 'number - Unique referring domains',
                organicTraffic: 'number - Monthly organic traffic',
                organicKeywords: 'number - Ranking keywords count',
                trafficValue: 'number - Traffic value in USD',
              },
            },
            examples: {
              php: `<?php
$apiKey = "YOUR_API_KEY";
$baseUrl = "https://qwnzenimkwtuaqnrcygb.supabase.co/functions/v1/visitor-intelligence-api";
$ch = curl_init($baseUrl . "?action=summary&days=7");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["x-api-key: " . $apiKey]);
$response = json_decode(curl_exec($ch), true);`,
              javascript: `const response = await fetch(
  "https://qwnzenimkwtuaqnrcygb.supabase.co/functions/v1/visitor-intelligence-api?action=summary&days=7",
  { headers: { "x-api-key": "YOUR_API_KEY" } }
);
const data = await response.json();`,
            },
          }
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action',
            availableActions: [
              // Visitor Intelligence
              'summary', 'sessions', 'active-sessions', 'page-views', 'page-stats',
              'tool-interactions', 'tool-stats', 'leads', 'lead-funnel', 'daily-stats', 'session-detail',
              // Domain Audit
              'audit-domain', 'audit-list', 'audit-get', 'audit-save', 'audit-full', 'audit-stats', 'audit-categories',
              // Documentation
              'docs'
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