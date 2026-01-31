import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
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
  tracking_domain: string | null;
}

export interface VisitorSession {
  id: string;
  session_id: string;
  first_page: string | null;
  referrer: string | null;
  started_at: string;
  last_activity_at: string;
  domain: string | null;
}

export interface PageView {
  id: string;
  session_id: string;
  page_path: string;
  page_title: string | null;
  created_at: string;
  domain: string | null;
}

export interface ToolInteraction {
  id: string;
  session_id: string;
  tool_name: string;
  tool_type: string | null;
  page_path: string | null;
  metadata: unknown;
  created_at: string;
  domain: string | null;
}

export interface FunnelStats {
  visitors: number;
  engaged: number;
  leads: number;
  qualified: number;
  closedLeads: number;
  withName: number;
  withCompanyInfo: number;
}

interface UseDashboardDataOptions {
  domain?: string | null;
}

/**
 * Custom hook for fetching and managing dashboard visitor/lead data.
 * Now supports domain-scoped data filtering.
 */
export const useDashboardData = (options: UseDashboardDataOptions = {}) => {
  const { domain } = options;
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [toolInteractions, setToolInteractions] = useState<ToolInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [funnelStats, setFunnelStats] = useState<FunnelStats>({
    visitors: 0,
    engaged: 0,
    leads: 0,
    qualified: 0,
    closedLeads: 0,
    withName: 0,
    withCompanyInfo: 0,
  });

  const [activeVisitors, setActiveVisitors] = useState(0);
  const [newVisitorsToday, setNewVisitorsToday] = useState(0);

  const fetchData = useCallback(async () => {
    // Use AbortController to cancel stale requests
    const controller = new AbortController();
    
    try {
      // Build lightweight count queries first for instant stats
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      // Phase 1: Quick count queries for instant stats (no data transfer)
      const countPromises = [
        supabase.from('visitor_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('visitor_sessions').select('id', { count: 'exact', head: true }).gte('last_activity_at', fiveMinutesAgo),
        supabase.from('visitor_sessions').select('id', { count: 'exact', head: true }).gte('started_at', todayStr),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
      ];

      // Apply domain filter to counts
      if (domain) {
        countPromises[0] = supabase.from('visitor_sessions').select('id', { count: 'exact', head: true }).eq('domain', domain);
        countPromises[1] = supabase.from('visitor_sessions').select('id', { count: 'exact', head: true }).eq('domain', domain).gte('last_activity_at', fiveMinutesAgo);
        countPromises[2] = supabase.from('visitor_sessions').select('id', { count: 'exact', head: true }).eq('domain', domain).gte('started_at', todayStr);
        countPromises[3] = supabase.from('leads').select('id', { count: 'exact', head: true }).eq('tracking_domain', domain);
      }

      // Execute count queries immediately - these are very fast
      const [totalSessions, activeSessions, todaySessions, totalLeads] = await Promise.all(countPromises);
      
      // Update stats immediately so UI shows data
      setActiveVisitors(activeSessions.count || 0);
      setNewVisitorsToday(todaySessions.count || 0);
      setFunnelStats(prev => ({
        ...prev,
        visitors: totalSessions.count || 0,
        leads: totalLeads.count || 0,
      }));
      
      // Mark loading complete after quick stats
      setIsLoading(false);

      // Phase 2: Background fetch of full data (deferred, lower priority)
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          await fetchFullData(domain, controller.signal);
          setIsRefreshing(false);
        }, { timeout: 3000 });
      } else {
        setTimeout(async () => {
          await fetchFullData(domain, controller.signal);
          setIsRefreshing(false);
        }, 100);
      }
    } catch (error) {
      console.error('[useDashboardData] Error fetching data:', error);
      setIsLoading(false);
      setIsRefreshing(false);
    }
    
    return () => controller.abort();
  }, [domain]);

  // Full data fetch (runs in background)
  const fetchFullData = async (domain: string | null | undefined, signal?: AbortSignal) => {
    try {
      // Build queries with optional domain filtering - reduced limits for performance
      let sessionsQuery = supabase
        .from('visitor_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100); // Reduced from 500
      
      let pageViewsQuery = supabase
        .from('page_views')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200); // Reduced from 1000
      
      let toolsQuery = supabase
        .from('tool_interactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Reduced from 500
      
      let leadsQuery = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply domain filter if specified
      if (domain) {
        sessionsQuery = sessionsQuery.eq('domain', domain);
        pageViewsQuery = pageViewsQuery.eq('domain', domain);
        toolsQuery = toolsQuery.eq('domain', domain);
        leadsQuery = leadsQuery.eq('tracking_domain', domain);
      }

      // Fetch all data in parallel
      const [leadsRes, sessionsRes, pageViewsRes, toolsRes] = await Promise.all([
        leadsQuery,
        sessionsQuery,
        pageViewsQuery,
        toolsQuery,
      ]);

      // Check if aborted
      if (signal?.aborted) return;

      if (leadsRes.data) setLeads(leadsRes.data);
      if (sessionsRes.data) setSessions(sessionsRes.data);
      if (pageViewsRes.data) setPageViews(pageViewsRes.data);
      if (toolsRes.data) setToolInteractions(toolsRes.data);

      // Calculate detailed stats
      const allLeads = leadsRes.data || [];
      const allTools = toolsRes.data || [];

      const engagedSessionIds = new Set(allTools.map(t => t.session_id));
      const qualifiedLeads = allLeads.filter(l => l.qualification_step && l.qualification_step >= 2);
      const closedLeads = allLeads.filter(l => l.status === 'closed');
      const withName = allLeads.filter(l => l.full_name);
      const withCompanyInfo = allLeads.filter(l => l.company_employees || l.annual_revenue);

      setFunnelStats(prev => ({
        ...prev,
        engaged: engagedSessionIds.size,
        qualified: qualifiedLeads.length,
        closedLeads: closedLeads.length,
        withName: withName.length,
        withCompanyInfo: withCompanyInfo.length,
      }));
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('[useDashboardData] Error fetching full data:', error);
      }
    }
  };

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
  }, [fetchData]);

  // Initial fetch and re-fetch when domain changes - non-blocking
  useEffect(() => {
    // Don't set loading true - let quick stats populate first
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 60 seconds (increased from 30 for performance)
  useEffect(() => {
    const interval = setInterval(() => {
      // Use requestIdleCallback to avoid blocking UI
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => fetchData(), { timeout: 5000 });
      } else {
        fetchData();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    leads,
    sessions,
    pageViews,
    toolInteractions,
    funnelStats,
    activeVisitors,
    newVisitorsToday,
    isLoading,
    isRefreshing,
    refresh,
    setLeads,
    // Expose the current domain for reference
    activeDomain: domain,
  };
};

export default useDashboardData;