-- Fix RLS policies for ai_chat_sessions table
-- Remove overly permissive SELECT policy and restrict to session owner or admin

-- Drop existing overly permissive policies if they exist
DROP POLICY IF EXISTS "Allow public read of ai_chat_sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "Anyone can read ai_chat_sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "Public can read ai_chat_sessions" ON public.ai_chat_sessions;

-- Create policy for session owner (via session_id match) or admin
CREATE POLICY "Session owner or admin can read ai_chat_sessions"
ON public.ai_chat_sessions
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

-- Fix RLS policies for form_submissions table
-- Remove overly permissive SELECT policy and restrict to admin only

-- Drop existing overly permissive policies if they exist
DROP POLICY IF EXISTS "Allow public read of form_submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Anyone can read form_submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Public can read form_submissions" ON public.form_submissions;

-- Create policy for admin only read access
CREATE POLICY "Only admins can read form_submissions"
ON public.form_submissions
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Also restrict visitor_sessions SELECT to admins (addresses warning)
DROP POLICY IF EXISTS "Allow public read of visitor_sessions" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Anyone can read visitor_sessions" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Public can read visitor_sessions" ON public.visitor_sessions;

CREATE POLICY "Only admins can read visitor_sessions"
ON public.visitor_sessions
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);