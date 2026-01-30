-- Update the auto_assign_super_admin function to include sardor@homealliance.com
CREATE OR REPLACE FUNCTION public.auto_assign_super_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Auto-assign super_admin role for specific approved emails
  IF NEW.email IN ('eric@blackwoodproductions.com', 'rob@blackwoodproductions.com', 'sardor@homealliance.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the handle_new_user_role_assignment function as well
CREATE OR REPLACE FUNCTION public.handle_new_user_role_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  
  -- Auto-assign super_admin role for specific approved emails
  IF user_email IN ('eric@blackwoodproductions.com', 'rob@blackwoodproductions.com', 'sardor@homealliance.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- If the user already exists, manually add the super_admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'sardor@homealliance.com'
ON CONFLICT (user_id, role) DO NOTHING;