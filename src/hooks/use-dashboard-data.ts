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
}

export interface VisitorSession {
  id: string;
  session_id: string;
  first_page: string | null;
  referrer: string | null;
  started_at: string;
  last_activity_at: string;
}

export interface PageView {
  id: string;
  session_id: string;
  page_path: string;
  page_title: string | null;
  created_at: string;
}

export interface ToolInteraction {
  id: string;
  session_id: string;
  tool_name: string;
  tool_type: string | null;
  page_path: string | null;
  metadata?: unknown;
  created_at: string;
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

/**
 * Optimized dashboard data hook with reduced data transfer.
 * Uses efficient queries with proper limits and only fetches necessary columns.
 */
export const useDashboardData = () => {
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
    try {
      // Fetch data efficiently with reduced limits
      const [
        leadsRes,
        recentSessionsRes,
        recentPageViewsRes,
        recentToolsRes,
        todaySessionsRes,
      ] = await Promise.all([
        // Leads - full data needed for CRM functionality
        supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        
        // Recent sessions (active in last 5 minutes for live visitors)
        supabase
          .from('visitor_sessions')
          .select('id, session_id, first_page, referrer, started_at, last_activity_at')
          .gte('last_activity_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
          .order('last_activity_at', { ascending: false })
          .limit(50),
        
        // Recent page views - limited for display purposes
        supabase
          .from('page_views')
          .select('id, session_id, page_path, page_title, created_at')
          .order('created_at', { ascending: false })
          .limit(100),
        
        // Recent tool interactions
        supabase
          .from('tool_interactions')
          .select('id, session_id, tool_name, tool_type, page_path, created_at')
          .order('created_at', { ascending: false })
          .limit(100),
        
        // Today's sessions count
        supabase
          .from('visitor_sessions')
          .select('id', { count: 'exact', head: true })
          .gte('started_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      ]);

      // Set data
      if (leadsRes.data) setLeads(leadsRes.data);
      if (recentPageViewsRes.data) setPageViews(recentPageViewsRes.data);
      if (recentToolsRes.data) setToolInteractions(recentToolsRes.data as ToolInteraction[]);

      // Set active visitors from recent sessions
      const liveVisitors = recentSessionsRes.data || [];
      setActiveVisitors(liveVisitors.length);
      setSessions(liveVisitors as VisitorSession[]);

      // New visitors today
      setNewVisitorsToday(todaySessionsRes.count || 0);

      // Calculate funnel stats from leads data
      const allLeads = leadsRes.data || [];
      const qualifiedLeads = allLeads.filter(l => l.qualification_step && l.qualification_step >= 2);
      const closedLeads = allLeads.filter(l => l.status === 'closed');
      const withName = allLeads.filter(l => l.full_name);
      const withCompanyInfo = allLeads.filter(l => l.company_employees || l.annual_revenue);

      // Calculate engaged from tool interactions (unique sessions)
      const engagedSessions = new Set((recentToolsRes.data || []).map(t => t.session_id));

      // Estimate total visitors from today's count (simplified)
      const estimatedVisitors = (todaySessionsRes.count || 0) * 7; // Rough weekly estimate

      setFunnelStats({
        visitors: estimatedVisitors,
        engaged: engagedSessions.size,
        leads: allLeads.length,
        qualified: qualifiedLeads.length,
        closedLeads: closedLeads.length,
        withName: withName.length,
        withCompanyInfo: withCompanyInfo.length,
      });

    } catch (error) {
      console.error('[useDashboardData] Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
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
  };
};

export default useDashboardData;
