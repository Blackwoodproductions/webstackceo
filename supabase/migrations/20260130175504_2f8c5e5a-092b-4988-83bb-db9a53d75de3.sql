-- Create white_label_settings table for storing custom branding per white-label admin
CREATE TABLE public.white_label_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    logo_url TEXT,
    company_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
    subscription_start TIMESTAMP WITH TIME ZONE,
    subscription_end TIMESTAMP WITH TIME ZONE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS on white_label_settings
ALTER TABLE public.white_label_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for white_label_settings
-- Users can view their own settings
CREATE POLICY "Users can view own white label settings"
ON public.white_label_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own logo (not subscription fields)
CREATE POLICY "Users can update own white label settings"
ON public.white_label_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Super admins can view all white label settings
CREATE POLICY "Super admins can view all white label settings"
ON public.white_label_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can insert white label settings
CREATE POLICY "Super admins can insert white label settings"
ON public.white_label_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can update all white label settings
CREATE POLICY "Super admins can manage all white label settings"
ON public.white_label_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can delete white label settings
CREATE POLICY "Super admins can delete white label settings"
ON public.white_label_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- Create function to check if user is white label admin
CREATE OR REPLACE FUNCTION public.is_white_label_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'white_label_admin'
  )
$$;

-- Create trigger for updated_at on white_label_settings
CREATE TRIGGER update_white_label_settings_updated_at
BEFORE UPDATE ON public.white_label_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Policy for super admins to manage user_roles
CREATE POLICY "Super admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));