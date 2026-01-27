-- Fix views to use security_invoker instead of security_definer
DROP VIEW IF EXISTS public.dashboard_stats;
DROP VIEW IF EXISTS public.live_visitors;
DROP VIEW IF EXISTS public.funnel_stats;

-- Recreate with security_invoker (inherits caller's RLS)
CREATE VIEW public.dashboard_stats 
WITH (security_invoker = on) AS
SELECT 
  DATE_TRUNC('day', pv.created_at)::date AS stat_date,
  COUNT(DISTINCT pv.session_id) AS unique_sessions,
  COUNT(*) AS total_page_views,
  COUNT(DISTINCT pv.page_path) AS unique_pages
FROM public.page_views pv
WHERE pv.created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', pv.created_at)::date;

CREATE VIEW public.live_visitors 
WITH (security_invoker = on) AS
SELECT 
  vs.session_id,
  vs.first_page,
  vs.referrer,
  vs.started_at,
  vs.last_activity_at,
  vs.user_id,
  (SELECT page_path FROM public.page_views WHERE session_id = vs.session_id ORDER BY created_at DESC LIMIT 1) AS current_page
FROM public.visitor_sessions vs
WHERE vs.last_activity_at > NOW() - INTERVAL '5 minutes';

CREATE VIEW public.funnel_stats 
WITH (security_invoker = on) AS
SELECT
  (SELECT COUNT(DISTINCT session_id) FROM public.visitor_sessions WHERE started_at > NOW() - INTERVAL '30 days') AS total_visitors,
  (SELECT COUNT(DISTINCT session_id) FROM public.tool_interactions WHERE created_at > NOW() - INTERVAL '30 days') AS engaged_visitors,
  (SELECT COUNT(*) FROM public.leads WHERE created_at > NOW() - INTERVAL '30 days') AS total_leads,
  (SELECT COUNT(*) FROM public.leads WHERE created_at > NOW() - INTERVAL '30 days' AND qualification_step >= 2) AS qualified_leads,
  (SELECT COUNT(*) FROM public.leads WHERE created_at > NOW() - INTERVAL '30 days' AND status = 'closed') AS closed_leads;

-- Re-grant permissions
GRANT SELECT ON public.dashboard_stats TO authenticated, anon;
GRANT SELECT ON public.live_visitors TO authenticated;
GRANT SELECT ON public.funnel_stats TO authenticated, anon;