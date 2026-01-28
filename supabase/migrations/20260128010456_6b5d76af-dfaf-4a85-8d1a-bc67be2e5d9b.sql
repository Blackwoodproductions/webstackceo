-- Create storage bucket for website screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-screenshots', 
  'website-screenshots', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to screenshots
CREATE POLICY "Public read access for website screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'website-screenshots');

-- Allow service role to upload screenshots
CREATE POLICY "Service role can upload screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'website-screenshots');

-- Allow service role to update/upsert screenshots
CREATE POLICY "Service role can update screenshots"
ON storage.objects FOR UPDATE
USING (bucket_id = 'website-screenshots');