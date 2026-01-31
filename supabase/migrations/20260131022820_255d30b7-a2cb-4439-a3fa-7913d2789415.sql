-- Create visitor_enrichments table to store de-anonymized visitor data
CREATE TABLE public.visitor_enrichments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  domain TEXT,
  
  -- IP-based data (from free APIs)
  ip_address TEXT,
  ip_city TEXT,
  ip_region TEXT,
  ip_country TEXT,
  ip_country_code TEXT,
  ip_timezone TEXT,
  ip_isp TEXT,
  ip_org TEXT,
  ip_as TEXT,
  
  -- Company data (from IP reverse lookup or cross-reference)
  company_name TEXT,
  company_domain TEXT,
  company_industry TEXT,
  company_size TEXT,
  company_revenue TEXT,
  company_linkedin TEXT,
  company_website TEXT,
  
  -- Contact data (from leads cross-reference)
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_title TEXT,
  contact_linkedin TEXT,
  
  -- Technology stack (if available)
  tech_stack JSONB DEFAULT '[]'::jsonb,
  
  -- Enrichment metadata
  enrichment_source TEXT, -- 'ip-api', 'leads_crossref', 'manual', etc.
  enrichment_confidence DECIMAL(3,2), -- 0.00 to 1.00
  raw_enrichment_data JSONB,
  
  -- Match info
  matched_lead_id UUID REFERENCES public.leads(id),
  match_type TEXT, -- 'email', 'domain', 'ip', 'company_name'
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_session_enrichment UNIQUE (session_id)
);

-- Enable RLS
ALTER TABLE public.visitor_enrichments ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_visitor_enrichments_session_id ON public.visitor_enrichments(session_id);
CREATE INDEX idx_visitor_enrichments_domain ON public.visitor_enrichments(domain);
CREATE INDEX idx_visitor_enrichments_company_name ON public.visitor_enrichments(company_name);
CREATE INDEX idx_visitor_enrichments_contact_email ON public.visitor_enrichments(contact_email);
CREATE INDEX idx_visitor_enrichments_created_at ON public.visitor_enrichments(created_at DESC);

-- RLS Policies
-- Super admins can do everything
CREATE POLICY "Super admins have full access to visitor_enrichments"
ON public.visitor_enrichments
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Users can view enrichments for their domains
CREATE POLICY "Users can view enrichments for their domains"
ON public.visitor_enrichments
FOR SELECT
USING (
  domain IN (
    SELECT ud.domain FROM public.user_domains ud 
    WHERE ud.user_id = auth.uid() AND ud.is_active = true
  )
);

-- Service role (edge functions) can insert/update
CREATE POLICY "Service role can manage enrichments"
ON public.visitor_enrichments
FOR ALL
USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_visitor_enrichments_updated_at
  BEFORE UPDATE ON public.visitor_enrichments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_enrichments;