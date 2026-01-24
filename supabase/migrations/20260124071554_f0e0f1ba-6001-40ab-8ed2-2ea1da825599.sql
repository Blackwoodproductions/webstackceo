-- Add a check constraint for lead status values
-- First remove any existing constraint if it exists
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Add the new status options as a check constraint
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check 
  CHECK (status IN ('open', 'called', 'emailed', 'considering', 'closed', 'deleted'));