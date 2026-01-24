-- Create table to store scheduled indexation reports
CREATE TABLE public.indexation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  report_data JSONB NOT NULL,
  indexed_count INTEGER NOT NULL DEFAULT 0,
  not_indexed_count INTEGER NOT NULL DEFAULT 0,
  crawled_count INTEGER NOT NULL DEFAULT 0,
  blocked_count INTEGER NOT NULL DEFAULT 0,
  total_pages INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'manual'
);

-- Create index for efficient domain lookups
CREATE INDEX idx_indexation_reports_domain ON public.indexation_reports(domain);
CREATE INDEX idx_indexation_reports_created_at ON public.indexation_reports(created_at DESC);

-- Enable RLS
ALTER TABLE public.indexation_reports ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (no auth required for this feature)
CREATE POLICY "Allow public read access to indexation reports"
ON public.indexation_reports
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access to indexation reports"
ON public.indexation_reports
FOR INSERT
WITH CHECK (true);