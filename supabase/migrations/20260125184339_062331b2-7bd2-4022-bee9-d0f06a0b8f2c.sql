-- Create table for auto-generated changelog entries
CREATE TABLE public.changelog_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version VARCHAR(20) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'improvement' CHECK (type IN ('feature', 'improvement', 'fix', 'announcement')),
  changes JSONB NOT NULL DEFAULT '[]'::jsonb,
  highlight BOOLEAN NOT NULL DEFAULT false,
  icon VARCHAR(50) NOT NULL DEFAULT 'Zap',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  commit_hashes JSONB DEFAULT '[]'::jsonb,
  aggregation_start TIMESTAMP WITH TIME ZONE,
  aggregation_end TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

-- Public read access for published entries
CREATE POLICY "Anyone can view published changelog entries"
ON public.changelog_entries
FOR SELECT
USING (is_published = true);

-- Admin write access
CREATE POLICY "Admins can manage changelog entries"
ON public.changelog_entries
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_changelog_published_at ON public.changelog_entries(published_at DESC) WHERE is_published = true;
CREATE INDEX idx_changelog_created_at ON public.changelog_entries(created_at DESC);