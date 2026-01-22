-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create directory_categories table with GMB-style categories
CREATE TABLE public.directory_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create directory_listings table for businesses
CREATE TABLE public.directory_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.directory_categories(id),
  business_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  contact_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'suspended')),
  subscription_start DATE,
  subscription_end DATE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.directory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_listings ENABLE ROW LEVEL SECURITY;

-- RLS policies for directory_categories (public read, admin write)
CREATE POLICY "Directory categories are viewable by everyone" 
ON public.directory_categories FOR SELECT USING (true);

CREATE POLICY "Admins can insert directory categories" 
ON public.directory_categories FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update directory categories" 
ON public.directory_categories FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete directory categories" 
ON public.directory_categories FOR DELETE USING (is_admin(auth.uid()));

-- RLS policies for directory_listings
CREATE POLICY "Active directory listings are viewable by everyone" 
ON public.directory_listings FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can view all directory listings" 
ON public.directory_listings FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can submit a directory listing" 
ON public.directory_listings FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update directory listings" 
ON public.directory_listings FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete directory listings" 
ON public.directory_listings FOR DELETE USING (is_admin(auth.uid()));

-- Insert GMB-style categories
INSERT INTO public.directory_categories (name, slug, icon, description, display_order) VALUES
('Restaurants & Food', 'restaurants-food', 'UtensilsCrossed', 'Restaurants, cafes, bakeries, and food services', 1),
('Shopping & Retail', 'shopping-retail', 'ShoppingBag', 'Retail stores, boutiques, and shopping centers', 2),
('Health & Medical', 'health-medical', 'Heart', 'Doctors, dentists, clinics, and healthcare providers', 3),
('Professional Services', 'professional-services', 'Briefcase', 'Consultants, accountants, and business services', 4),
('Home Services', 'home-services', 'Home', 'Plumbers, electricians, contractors, and home repair', 5),
('Automotive', 'automotive', 'Car', 'Auto repair, dealerships, and car services', 6),
('Beauty & Spa', 'beauty-spa', 'Sparkles', 'Salons, spas, and beauty services', 7),
('Financial Services', 'financial-services', 'Landmark', 'Banks, insurance, and financial advisors', 8),
('Legal Services', 'legal-services', 'Scale', 'Lawyers, attorneys, and legal consultants', 9),
('Education & Training', 'education-training', 'GraduationCap', 'Schools, tutoring, and training centers', 10),
('Entertainment & Events', 'entertainment-events', 'Music', 'Venues, event planning, and entertainment', 11),
('Real Estate', 'real-estate', 'Building', 'Realtors, property management, and real estate', 12),
('Technology & IT', 'technology-it', 'Laptop', 'IT services, software, and tech support', 13),
('Travel & Hospitality', 'travel-hospitality', 'Plane', 'Hotels, travel agencies, and tourism', 14),
('Fitness & Recreation', 'fitness-recreation', 'Dumbbell', 'Gyms, sports facilities, and recreation', 15);

-- Create trigger for updated_at
CREATE TRIGGER update_directory_listings_updated_at
BEFORE UPDATE ON public.directory_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();