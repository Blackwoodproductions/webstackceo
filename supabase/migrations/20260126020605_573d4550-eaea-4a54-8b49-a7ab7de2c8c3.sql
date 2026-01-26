-- Create trigger on auth.users to populate profiles table when users sign up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also insert any existing auth users that don't have profiles yet
INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
SELECT 
  id as user_id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name') as full_name,
  raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
  updated_at = now();