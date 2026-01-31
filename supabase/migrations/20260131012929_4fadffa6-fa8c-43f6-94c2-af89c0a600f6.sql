-- CRO Settings table (admin controls)
CREATE TABLE public.cro_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default settings for each CRO component
INSERT INTO public.cro_settings (key, enabled, config) VALUES
  ('exit_intent_popup', true, '{"discount": 25, "delay_ms": 5000, "dismiss_days": 3}'),
  ('social_proof_toast', true, '{"interval_ms": 45000, "display_ms": 5000, "initial_delay_ms": 15000}'),
  ('urgency_banner', true, '{"discount": 30, "show_countdown": true, "show_spots": true}'),
  ('sticky_bottom_cta', true, '{"scroll_threshold": 600, "text": "Start Free Trial"}');

-- CRO interactions tracking (analytics)
CREATE TABLE public.cro_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  component TEXT NOT NULL,
  action TEXT NOT NULL,
  session_id TEXT,
  page_path TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for fast queries
CREATE INDEX idx_cro_interactions_component ON public.cro_interactions(component);
CREATE INDEX idx_cro_interactions_action ON public.cro_interactions(action);
CREATE INDEX idx_cro_interactions_created_at ON public.cro_interactions(created_at);

-- Enable RLS
ALTER TABLE public.cro_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cro_interactions ENABLE ROW LEVEL SECURITY;

-- CRO settings: only admins can modify, anyone can read (for display)
CREATE POLICY "Anyone can read CRO settings" ON public.cro_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update CRO settings" ON public.cro_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- CRO interactions: anyone can insert (anonymous tracking), admins can read
CREATE POLICY "Anyone can insert CRO interactions" ON public.cro_interactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read CRO interactions" ON public.cro_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Enable realtime for live stats
ALTER PUBLICATION supabase_realtime ADD TABLE public.cro_interactions;