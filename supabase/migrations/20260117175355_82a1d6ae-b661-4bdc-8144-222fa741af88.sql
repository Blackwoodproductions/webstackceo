-- Create enum for partner status
CREATE TYPE public.partner_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- Create marketplace categories table
CREATE TABLE public.marketplace_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketplace partners table
CREATE TABLE public.marketplace_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT NOT NULL,
  website_url TEXT,
  contact_email TEXT NOT NULL,
  category_id UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  status partner_status NOT NULL DEFAULT 'pending',
  is_sponsored BOOLEAN NOT NULL DEFAULT false,
  sponsored_until TIMESTAMP WITH TIME ZONE,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER NOT NULL DEFAULT 0,
  ranking_score INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketplace applications table (for partner applications)
CREATE TABLE public.marketplace_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  website_url TEXT,
  category_id UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  why_join TEXT,
  status partner_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_applications ENABLE ROW LEVEL SECURITY;

-- Categories are publicly readable
CREATE POLICY "Categories are viewable by everyone"
  ON public.marketplace_categories FOR SELECT
  USING (true);

-- Partners are publicly readable (only approved ones)
CREATE POLICY "Approved partners are viewable by everyone"
  ON public.marketplace_partners FOR SELECT
  USING (status = 'approved');

-- Applications can be created by anyone (public form)
CREATE POLICY "Anyone can submit an application"
  ON public.marketplace_applications FOR INSERT
  WITH CHECK (true);

-- Insert default categories
INSERT INTO public.marketplace_categories (name, slug, description, icon, display_order) VALUES
  ('SEO Services', 'seo-services', 'Search engine optimization experts and agencies', 'Search', 1),
  ('Link Building', 'link-building', 'Quality backlink acquisition and outreach services', 'Link2', 2),
  ('Content Marketing', 'content-marketing', 'Content creation, strategy, and distribution', 'PenTool', 3),
  ('PPC & Paid Ads', 'ppc-paid-ads', 'Pay-per-click advertising and campaign management', 'MousePointerClick', 4),
  ('Social Media Marketing', 'social-media', 'Social media management and growth services', 'Users', 5),
  ('Email Marketing', 'email-marketing', 'Email campaigns, automation, and list building', 'Mail', 6),
  ('Web Design & Development', 'web-design', 'Website design, development, and optimization', 'Globe', 7),
  ('Analytics & Reporting', 'analytics', 'Data analysis, tracking, and performance reporting', 'BarChart3', 8),
  ('Local SEO', 'local-seo', 'Local search optimization and Google Business Profile', 'MapPin', 9),
  ('Technical SEO', 'technical-seo', 'Site audits, speed optimization, and technical fixes', 'Cpu', 10),
  ('Reputation Management', 'reputation', 'Online reputation and review management', 'Shield', 11),
  ('Affiliate Marketing', 'affiliate', 'Affiliate program setup and management', 'TrendingUp', 12);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_marketplace_partners_updated_at
  BEFORE UPDATE ON public.marketplace_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketplace_updated_at();