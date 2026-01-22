-- Add Google Maps embed URL column to directory_listings
ALTER TABLE public.directory_listings 
ADD COLUMN IF NOT EXISTS google_maps_embed_url TEXT;