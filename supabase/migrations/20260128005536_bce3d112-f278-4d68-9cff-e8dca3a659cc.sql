-- Create keyword ranking history table
CREATE TABLE public.keyword_ranking_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain text NOT NULL,
  keyword text NOT NULL,
  google_position integer,
  bing_position integer,
  yahoo_position integer,
  search_volume integer,
  cpc numeric(10,2),
  competition_level text,
  snapshot_at timestamp with time zone NOT NULL DEFAULT now(),
  source text DEFAULT 'bron'
);

-- Create indexes for efficient querying
CREATE INDEX idx_keyword_history_domain ON public.keyword_ranking_history(domain);
CREATE INDEX idx_keyword_history_keyword ON public.keyword_ranking_history(keyword);
CREATE INDEX idx_keyword_history_snapshot ON public.keyword_ranking_history(snapshot_at);
CREATE INDEX idx_keyword_history_domain_keyword ON public.keyword_ranking_history(domain, keyword);

-- Enable RLS
ALTER TABLE public.keyword_ranking_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view keyword history" 
ON public.keyword_ranking_history 
FOR SELECT 
USING (true);

CREATE POLICY "Service can insert keyword history" 
ON public.keyword_ranking_history 
FOR INSERT 
WITH CHECK (true);