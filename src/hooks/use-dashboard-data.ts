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
  metadata: unknown;
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
 * Custom hook for fetching and managing dashboard visitor/lead data.
 * Consolidates data fetching logic that was previously scattered across the monolithic dashboard.
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
      // Fetch all data in parallel
      const [leadsRes, sessionsRes, pageViewsRes, toolsRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('visitor_sessions').select('*').order('started_at', { ascending: false }).limit(500),
        supabase.from('page_views').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('tool_interactions').select('*').order('created_at', { ascending: false }).limit(500),
      ]);

      if (leadsRes.data) setLeads(leadsRes.data);
      if (sessionsRes.data) setSessions(sessionsRes.data);
      if (pageViewsRes.data) setPageViews(pageViewsRes.data);
      if (toolsRes.data) setToolInteractions(toolsRes.data);

      // Calculate stats
      const allSessions = sessionsRes.data || [];
      const allLeads = leadsRes.data || [];
      const allTools = toolsRes.data || [];

      // Active visitors (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const activeCount = allSessions.filter(s => s.last_activity_at >= fiveMinutesAgo).length;
      setActiveVisitors(activeCount);

      // New visitors today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();
      const newToday = allSessions.filter(s => s.started_at >= todayStr).length;
      setNewVisitorsToday(newToday);

      // Calculate funnel stats
      const uniqueSessionIds = new Set(allSessions.map(s => s.session_id));
      const engagedSessionIds = new Set(allTools.map(t => t.session_id));
      const qualifiedLeads = allLeads.filter(l => l.qualification_step && l.qualification_step >= 2);
      const closedLeads = allLeads.filter(l => l.status === 'closed');
      const withName = allLeads.filter(l => l.full_name);
      const withCompanyInfo = allLeads.filter(l => l.company_employees || l.annual_revenue);

      setFunnelStats({
        visitors: uniqueSessionIds.size,
        engaged: engagedSessionIds.size,
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
