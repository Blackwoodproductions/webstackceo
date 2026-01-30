-- Fix security issue #1: form_submissions should only be readable by admins
-- Drop existing permissive SELECT policy if it exists
DROP POLICY IF EXISTS "Anyone can read form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Public can view form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "form_submissions_select_policy" ON public.form_submissions;

-- Create admin-only SELECT policy for form_submissions
CREATE POLICY "Only admins can read form submissions"
ON public.form_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Fix security issue #2: ai_chat_sessions should only be readable by session owner or admins
-- Drop existing permissive SELECT policy if it exists  
DROP POLICY IF EXISTS "Anyone can read chat sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "Public can view chat sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "ai_chat_sessions_select_policy" ON public.ai_chat_sessions;

-- Create policy that allows session owner (via session_id header) or admins to read
CREATE POLICY "Session owner or admins can read chat sessions"
ON public.ai_chat_sessions
FOR SELECT
USING (
  -- Allow if request has matching session_id header (for the visitor's own session)
  session_id = current_setting('request.headers', true)::json->>'x-session-id'
  OR
  -- Allow admins full access
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);