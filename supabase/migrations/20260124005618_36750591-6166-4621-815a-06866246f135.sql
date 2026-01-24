-- Create leads table for captured emails/phones from QuickMetricCheck
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT,
  domain TEXT,
  metric_type TEXT NOT NULL,
  source_page TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create visitor sessions table
CREATE TABLE public.visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  first_page TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create page views table
CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES public.visitor_sessions(session_id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  page_title TEXT,
  time_on_page INTEGER DEFAULT 0,
  scroll_depth INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create tool interactions table (QuickMetricCheck usage)
CREATE TABLE public.tool_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES public.visitor_sessions(session_id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  tool_type TEXT,
  page_path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create form submissions table
CREATE TABLE public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES public.visitor_sessions(session_id) ON DELETE SET NULL,
  form_name TEXT NOT NULL,
  form_data JSONB DEFAULT '{}'::jsonb,
  page_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for tracking (public website visitors)
CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert sessions" ON public.visitor_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.visitor_sessions FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert page views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert tool interactions" ON public.tool_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert form submissions" ON public.form_submissions FOR INSERT WITH CHECK (true);

-- Only admins can read tracking data
CREATE POLICY "Admins can read leads" ON public.leads FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can read sessions" ON public.visitor_sessions FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can read page views" ON public.page_views FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can read tool interactions" ON public.tool_interactions FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can read form submissions" ON public.form_submissions FOR SELECT USING (public.is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX idx_tool_interactions_session_id ON public.tool_interactions(session_id);
CREATE INDEX idx_form_submissions_created_at ON public.form_submissions(created_at DESC);