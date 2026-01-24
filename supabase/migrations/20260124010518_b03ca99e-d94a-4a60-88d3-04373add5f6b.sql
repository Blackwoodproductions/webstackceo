-- Add additional lead qualification columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS company_employees TEXT,
ADD COLUMN IF NOT EXISTS annual_revenue TEXT,
ADD COLUMN IF NOT EXISTS qualification_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS funnel_stage TEXT DEFAULT 'visitor';

-- Create index for funnel analysis
CREATE INDEX IF NOT EXISTS idx_leads_funnel_stage ON public.leads(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_leads_qualification_step ON public.leads(qualification_step);