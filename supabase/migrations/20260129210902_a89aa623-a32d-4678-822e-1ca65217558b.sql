-- Create table to persist domain context per user + domain
CREATE TABLE IF NOT EXISTS public.domain_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    
    -- Business info
    business_name TEXT,
    year_established INT,
    short_description TEXT,
    business_model TEXT,
    primary_keyword TEXT,
    unique_selling_points TEXT,
    guarantees_warranties TEXT,
    pricing_approach TEXT,
    
    -- Services
    services_offered TEXT[],
    services_not_offered TEXT[],
    licenses_certifications TEXT[],
    brands_equipment TEXT[],
    awards_associations TEXT[],
    
    -- Location
    primary_city TEXT,
    service_areas TEXT[],
    service_radius TEXT,
    local_landmarks TEXT[],
    business_address TEXT,
    
    -- Contact
    phone_number TEXT,
    email TEXT,
    business_hours TEXT[],
    social_links TEXT[],
    
    -- Content style
    writing_tone TEXT,
    point_of_view TEXT,
    key_phrases TEXT[],
    phrases_to_avoid TEXT[],
    style_references TEXT[],
    authors TEXT[],
    
    -- Topics & SEO
    topics_to_cover TEXT[],
    topics_to_avoid TEXT[],
    common_faqs TEXT[],
    target_keywords TEXT[],
    competitors TEXT,
    resource_sites TEXT[],
    
    -- Compliance
    claims_to_avoid TEXT[],
    required_disclaimers TEXT[],
    trademark_guidelines TEXT[],
    
    -- Extraction metadata
    extraction_confidence JSONB DEFAULT '{}'::jsonb,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- One context per user per domain
    CONSTRAINT domain_contexts_user_domain_uq UNIQUE (user_id, domain)
);

-- Enable Row Level Security
ALTER TABLE public.domain_contexts ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only select/insert/update/delete their own rows
CREATE POLICY "Users can view their own domain contexts"
ON public.domain_contexts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own domain contexts"
ON public.domain_contexts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domain contexts"
ON public.domain_contexts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domain contexts"
ON public.domain_contexts
FOR DELETE
USING (auth.uid() = user_id);

-- updated_at trigger (reuse existing function if present)
CREATE TRIGGER update_domain_contexts_updated_at
BEFORE UPDATE ON public.domain_contexts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();