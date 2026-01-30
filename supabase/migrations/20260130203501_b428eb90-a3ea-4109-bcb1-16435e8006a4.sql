-- Add domain column to visitor_sessions to scope visitor data per-domain
ALTER TABLE public.visitor_sessions 
ADD COLUMN IF NOT EXISTS domain TEXT;

-- Add index for efficient domain-scoped queries
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_domain 
ON public.visitor_sessions(domain);

-- Add composite index for domain + activity (common query pattern)
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_domain_activity 
ON public.visitor_sessions(domain, last_activity_at DESC);

-- Add domain column to page_views for domain-scoped analytics
ALTER TABLE public.page_views 
ADD COLUMN IF NOT EXISTS domain TEXT;

-- Add index for page_views domain queries
CREATE INDEX IF NOT EXISTS idx_page_views_domain 
ON public.page_views(domain);

-- Add domain column to tool_interactions
ALTER TABLE public.tool_interactions 
ADD COLUMN IF NOT EXISTS domain TEXT;

-- Add index for tool_interactions domain queries
CREATE INDEX IF NOT EXISTS idx_tool_interactions_domain 
ON public.tool_interactions(domain);

-- Add domain column to form_submissions
ALTER TABLE public.form_submissions 
ADD COLUMN IF NOT EXISTS domain TEXT;

-- Add index for form_submissions domain queries
CREATE INDEX IF NOT EXISTS idx_form_submissions_domain 
ON public.form_submissions(domain);

-- Add domain column to leads for domain-scoped lead tracking
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS tracking_domain TEXT;

-- Add index for leads domain queries
CREATE INDEX IF NOT EXISTS idx_leads_tracking_domain 
ON public.leads(tracking_domain);

-- Add domain column to chat_conversations for domain-scoped chats
ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS domain TEXT;

-- Add index for chat_conversations domain queries
CREATE INDEX IF NOT EXISTS idx_chat_conversations_domain 
ON public.chat_conversations(domain);

-- Update live_visitors view to include domain
DROP VIEW IF EXISTS public.live_visitors;
CREATE VIEW public.live_visitors
WITH (security_invoker = on)
AS
SELECT 
  vs.session_id,
  vs.first_page,
  vs.last_activity_at,
  vs.started_at,
  vs.referrer,
  vs.user_id,
  vs.domain,
  (SELECT pv.page_path 
   FROM public.page_views pv 
   WHERE pv.session_id = vs.session_id 
   ORDER BY pv.created_at DESC 
   LIMIT 1) as current_page
FROM public.visitor_sessions vs
WHERE vs.last_activity_at > (now() - interval '5 minutes');

-- Add tracking_token to user_domains for unique tracking code generation
ALTER TABLE public.user_domains 
ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE;

-- Create function to generate tracking tokens
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$;

-- Create trigger to auto-generate tracking token on domain creation
CREATE OR REPLACE FUNCTION public.auto_generate_tracking_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_token IS NULL THEN
    NEW.tracking_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_generate_tracking_token ON public.user_domains;
CREATE TRIGGER trigger_generate_tracking_token
BEFORE INSERT ON public.user_domains
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_tracking_token();

-- Generate tracking tokens for existing domains that don't have one
UPDATE public.user_domains 
SET tracking_token = encode(gen_random_bytes(16), 'hex')
WHERE tracking_token IS NULL;