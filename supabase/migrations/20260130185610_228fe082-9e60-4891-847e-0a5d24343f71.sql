-- Create user_domains table for multi-tenant domain ownership
CREATE TABLE public.user_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'gsc', 'gmb'
  is_primary BOOLEAN NOT NULL DEFAULT false, -- The free domain
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Each user can only have one entry per domain
  UNIQUE (user_id, domain)
);

-- Create index for fast lookups
CREATE INDEX idx_user_domains_user_id ON public.user_domains(user_id);
CREATE INDEX idx_user_domains_domain ON public.user_domains(domain);

-- Enable Row Level Security
ALTER TABLE public.user_domains ENABLE ROW LEVEL SECURITY;

-- Users can only view their own domains
CREATE POLICY "Users can view their own domains"
ON public.user_domains
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own domains
CREATE POLICY "Users can insert their own domains"
ON public.user_domains
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own domains
CREATE POLICY "Users can update their own domains"
ON public.user_domains
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own domains
CREATE POLICY "Users can delete their own domains"
ON public.user_domains
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all domains (for support purposes)
CREATE POLICY "Admins can view all domains"
ON public.user_domains
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Create function to ensure only one primary domain per user
CREATE OR REPLACE FUNCTION public.ensure_single_primary_domain()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a domain as primary, unset all other primary domains for this user
  IF NEW.is_primary = true THEN
    UPDATE public.user_domains
    SET is_primary = false, updated_at = now()
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_primary = true;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for primary domain enforcement
CREATE TRIGGER ensure_single_primary_domain_trigger
BEFORE INSERT OR UPDATE ON public.user_domains
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_primary_domain();

-- Function to check if user has selected their free domain
CREATE OR REPLACE FUNCTION public.user_has_primary_domain(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_domains
    WHERE user_id = p_user_id AND is_primary = true AND is_active = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Function to get user's primary (free) domain
CREATE OR REPLACE FUNCTION public.get_user_primary_domain(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  primary_domain TEXT;
BEGIN
  SELECT domain INTO primary_domain
  FROM public.user_domains
  WHERE user_id = p_user_id AND is_primary = true AND is_active = true
  LIMIT 1;
  
  RETURN primary_domain;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;