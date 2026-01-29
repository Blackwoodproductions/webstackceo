-- Create table to store CADE crawl callback events
CREATE TABLE public.cade_crawl_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  request_id TEXT,
  user_id TEXT,
  status TEXT NOT NULL DEFAULT 'update',
  progress INTEGER,
  pages_crawled INTEGER,
  total_pages INTEGER,
  current_url TEXT,
  error_message TEXT,
  message TEXT,
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_cade_crawl_events_domain ON public.cade_crawl_events(domain);
CREATE INDEX idx_cade_crawl_events_request_id ON public.cade_crawl_events(request_id);
CREATE INDEX idx_cade_crawl_events_created_at ON public.cade_crawl_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.cade_crawl_events ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (callback from CADE service)
CREATE POLICY "Allow public insert for CADE callbacks"
ON public.cade_crawl_events
FOR INSERT
TO public
WITH CHECK (true);

-- Allow authenticated users to read events
CREATE POLICY "Allow authenticated read"
ON public.cade_crawl_events
FOR SELECT
TO authenticated
USING (true);

-- Allow anon to read (for dashboard polling)
CREATE POLICY "Allow anon read"
ON public.cade_crawl_events
FOR SELECT
TO anon
USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.cade_crawl_events;