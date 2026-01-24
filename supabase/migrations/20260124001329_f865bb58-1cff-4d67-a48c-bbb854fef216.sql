-- Add submitter_email field to saved_audits for lead capture
ALTER TABLE public.saved_audits
ADD COLUMN submitter_email text;