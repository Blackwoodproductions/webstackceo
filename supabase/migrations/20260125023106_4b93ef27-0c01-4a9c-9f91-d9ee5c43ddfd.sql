-- Create audit_history table to track SEO metrics over time
CREATE TABLE public.audit_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES public.saved_audits(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  domain_rating INTEGER,
  organic_traffic BIGINT,
  organic_keywords BIGINT,
  backlinks BIGINT,
  referring_domains BIGINT,
  traffic_value BIGINT,
  ahrefs_rank BIGINT,
  snapshot_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'auto'::text -- 'auto' for cron, 'manual' for user-triggered
);

-- Enable RLS
ALTER TABLE public.audit_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view audit history (public data)
CREATE POLICY "Anyone can view audit history"
ON public.audit_history
FOR SELECT
USING (true);

-- Service/system can insert history records
CREATE POLICY "Service can insert audit history"
ON public.audit_history
FOR INSERT
WITH CHECK (true);

-- Create index for efficient queries by domain and time
CREATE INDEX idx_audit_history_domain ON public.audit_history(domain);
CREATE INDEX idx_audit_history_snapshot_at ON public.audit_history(snapshot_at DESC);
CREATE INDEX idx_audit_history_audit_id ON public.audit_history(audit_id);

-- Add comment for documentation
COMMENT ON TABLE public.audit_history IS 'Stores historical snapshots of SEO audits to track progress over time';