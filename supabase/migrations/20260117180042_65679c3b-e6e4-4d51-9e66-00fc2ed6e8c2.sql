-- Create a function to auto-grant admin to the first user (for initial setup)
-- This is a one-time helper - the first user to sign up gets admin role
CREATE OR REPLACE FUNCTION public.grant_first_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Only grant admin if no admins exist yet
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-grant first user admin
CREATE TRIGGER on_auth_user_created_grant_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_first_user_admin();