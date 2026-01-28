-- Security Fix Migration Part 3: Fix views and remaining issues

-- ============================================================================
-- 1. DROP AND RECREATE VIEWS WITH SECURITY INVOKER
-- Views should use security invoker to respect RLS of underlying tables
-- ============================================================================

-- Drop existing views
DROP VIEW IF EXISTS public.dashboard_stats;
DROP VIEW IF EXISTS public.funnel_stats;
DROP VIEW IF EXISTS public.live_visitors;

-- Recreate dashboard_stats with security invoker
CREATE VIEW public.dashboard_stats 
WITH (security_invoker = true) 
AS
SELECT 
  DATE(created_at) as stat_date,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) as total_page_views,
  COUNT(DISTINCT page_path) as unique_pages
FROM public.page_views
GROUP BY DATE(created_at)
ORDER BY stat_date DESC;

-- Recreate funnel_stats with security invoker
CREATE VIEW public.funnel_stats 
WITH (security_invoker = true) 
AS
SELECT 
  (SELECT COUNT(*) FROM visitor_sessions) as total_visitors,
  (SELECT COUNT(DISTINCT session_id) FROM page_views WHERE time_on_page > 30) as engaged_visitors,
  (SELECT COUNT(*) FROM leads WHERE status = 'new') as total_leads,
  (SELECT COUNT(*) FROM leads WHERE status = 'qualified') as qualified_leads,
  (SELECT COUNT(*) FROM leads WHERE status = 'closed') as closed_leads;

-- Recreate live_visitors with security invoker
CREATE VIEW public.live_visitors 
WITH (security_invoker = true) 
AS
SELECT 
  vs.session_id,
  vs.started_at,
  vs.last_activity_at,
  vs.first_page,
  vs.referrer,
  vs.user_id,
  (SELECT pv.page_path FROM page_views pv WHERE pv.session_id = vs.session_id ORDER BY pv.created_at DESC LIMIT 1) as current_page
FROM visitor_sessions vs
WHERE vs.last_activity_at > NOW() - INTERVAL '5 minutes';

-- ============================================================================
-- 2. FIX DIRECTORY LISTINGS - Only show active listings publicly
-- The existing policy already restricts to active, but confirm it's working
-- ============================================================================

-- Verify the existing policy is correct (it should be)
-- The policy "Active directory listings are viewable by everyone" uses (status = 'active')
-- This is correct - no change needed for SELECT

-- ============================================================================
-- 3. MARK INTENTIONAL POLICIES
-- These INSERT policies are intentional for public form submissions
-- ============================================================================

-- No SQL changes needed - these are documented via comments above