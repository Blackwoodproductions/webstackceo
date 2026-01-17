-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- RLS policies for user_roles (only admins can view/manage roles)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Admin policies for marketplace_partners (full CRUD for admins)
CREATE POLICY "Admins can view all partners"
  ON public.marketplace_partners FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert partners"
  ON public.marketplace_partners FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update partners"
  ON public.marketplace_partners FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete partners"
  ON public.marketplace_partners FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Admin policies for marketplace_applications
CREATE POLICY "Admins can view all applications"
  ON public.marketplace_applications FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update applications"
  ON public.marketplace_applications FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete applications"
  ON public.marketplace_applications FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Admin policies for categories (full management)
CREATE POLICY "Admins can insert categories"
  ON public.marketplace_categories FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update categories"
  ON public.marketplace_categories FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete categories"
  ON public.marketplace_categories FOR DELETE
  USING (public.is_admin(auth.uid()));