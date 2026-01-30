-- Add title column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS title TEXT;

-- Update the auto_assign_super_admin function with new admins
CREATE OR REPLACE FUNCTION public.auto_assign_super_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IN (
    'eric@blackwoodproductions.com', 
    'rob@blackwoodproductions.com', 
    'sardor@homealliance.com', 
    'admin@blackwoodproductions.com',
    'jason@blackwoodproductions.com',
    'alan@blackwoodproductions.com',
    'que@blackwoodproductions.com'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update handle_new_user_role_assignment function
CREATE OR REPLACE FUNCTION public.handle_new_user_role_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  
  IF user_email IN (
    'eric@blackwoodproductions.com', 
    'rob@blackwoodproductions.com', 
    'sardor@homealliance.com', 
    'admin@blackwoodproductions.com',
    'jason@blackwoodproductions.com',
    'alan@blackwoodproductions.com',
    'que@blackwoodproductions.com'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add super_admin roles for new users if they already exist
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role FROM auth.users 
WHERE email IN ('jason@blackwoodproductions.com', 'alan@blackwoodproductions.com', 'que@blackwoodproductions.com')
ON CONFLICT (user_id, role) DO NOTHING;