-- Create table for AEO/GEO check results with weekly caching
CREATE TABLE public.aeo_check_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  keyword TEXT NOT NULL,
  results JSONB NOT NULL DEFAULT '[]',
  suggestions JSONB NOT NULL DEFAULT '[]',
  prominent_count INTEGER NOT NULL DEFAULT 0,
  mentioned_count INTEGER NOT NULL DEFAULT 0,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX idx_aeo_results_domain ON public.aeo_check_results(domain);
CREATE INDEX idx_aeo_results_domain_keyword ON public.aeo_check_results(domain, keyword);
CREATE INDEX idx_aeo_results_check_date ON public.aeo_check_results(check_date);

-- Unique constraint per domain/keyword/date
CREATE UNIQUE INDEX idx_aeo_results_unique ON public.aeo_check_results(domain, keyword, check_date);

-- Enable RLS with public access for analytics data
ALTER TABLE public.aeo_check_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all AEO results operations" ON public.aeo_check_results
  FOR ALL USING (true) WITH CHECK (true);