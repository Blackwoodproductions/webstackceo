-- Fix the auto_generate_tracking_token function to use the correct schema for gen_random_bytes
CREATE OR REPLACE FUNCTION public.auto_generate_tracking_token()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NEW.tracking_token IS NULL THEN
    -- Use md5 of uuid which is always available, no extension needed
    NEW.tracking_token := md5(gen_random_uuid()::text || clock_timestamp()::text);
  END IF;
  RETURN NEW;
END;
$function$;

-- Also fix the standalone function
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use md5 of uuid which is always available
  RETURN md5(gen_random_uuid()::text || clock_timestamp()::text);
END;
$function$;