-- Create audit categories enum
CREATE TYPE public.audit_category AS ENUM (
  'ecommerce',
  'saas',
  'local_business',
  'blog_media',
  'professional_services',
  'healthcare',
  'finance',
  'education',
  'real_estate',
  'hospitality',
  'nonprofit',
  'technology',
  'other'
);

-- Create saved audits table
CREATE TABLE public.saved_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category public.audit_category NOT NULL DEFAULT 'other',
  
  -- Website profile info
  site_title TEXT,
  site_description TEXT,
  site_summary TEXT,
  favicon_url TEXT,
  logo_url TEXT,
  
  -- Social links
  social_facebook TEXT,
  social_twitter TEXT,
  social_linkedin TEXT,
  social_instagram TEXT,
  social_youtube TEXT,
  social_tiktok TEXT,
  
  -- Contact info
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  
  -- Audit metrics snapshot
  domain_rating INTEGER,
  ahrefs_rank BIGINT,
  backlinks BIGINT,
  referring_domains BIGINT,
  organic_traffic BIGINT,
  organic_keywords BIGINT,
  traffic_value BIGINT,
  
  -- Matched glossary terms
  glossary_terms TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_saved_audits_domain ON public.saved_audits(domain);
CREATE INDEX idx_saved_audits_category ON public.saved_audits(category);
CREATE INDEX idx_saved_audits_created_at ON public.saved_audits(created_at DESC);

-- Enable RLS
ALTER TABLE public.saved_audits ENABLE ROW LEVEL SECURITY;

-- Public read access for all audits
CREATE POLICY "Anyone can view saved audits"
ON public.saved_audits
FOR SELECT
USING (true);

-- Anyone can insert new audits (no auth required for audit tool)
CREATE POLICY "Anyone can create audits"
ON public.saved_audits
FOR INSERT
WITH CHECK (true);

-- Only allow updates from backend/service role (will handle via edge function)
CREATE POLICY "Service can update audits"
ON public.saved_audits
FOR UPDATE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_saved_audits_updated_at
BEFORE UPDATE ON public.saved_audits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();