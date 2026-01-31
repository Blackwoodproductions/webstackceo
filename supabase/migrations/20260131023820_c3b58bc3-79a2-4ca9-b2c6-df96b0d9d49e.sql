-- Create SEO Vault table for storing user research and reports
CREATE TABLE public.seo_vault (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain TEXT,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'research',
  content JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_vault ENABLE ROW LEVEL SECURITY;

-- Users can only view their own vault entries
CREATE POLICY "Users can view their own vault entries" 
ON public.seo_vault 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own vault entries
CREATE POLICY "Users can create their own vault entries" 
ON public.seo_vault 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own vault entries
CREATE POLICY "Users can update their own vault entries" 
ON public.seo_vault 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own vault entries
CREATE POLICY "Users can delete their own vault entries" 
ON public.seo_vault 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_seo_vault_user ON public.seo_vault(user_id);
CREATE INDEX idx_seo_vault_domain ON public.seo_vault(domain);
CREATE INDEX idx_seo_vault_type ON public.seo_vault(report_type);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_seo_vault_updated_at
BEFORE UPDATE ON public.seo_vault
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();