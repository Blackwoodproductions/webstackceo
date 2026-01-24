-- Add status column to leads table for tracking closed deals
ALTER TABLE public.leads 
ADD COLUMN status text NOT NULL DEFAULT 'open';

-- Add closed_at timestamp to track when lead was closed
ALTER TABLE public.leads 
ADD COLUMN closed_at timestamp with time zone;

-- Add closed_amount to track payment value
ALTER TABLE public.leads 
ADD COLUMN closed_amount numeric;

-- Create index for quick status filtering
CREATE INDEX idx_leads_status ON public.leads(status);

-- Allow admins to update leads (for closing them)
CREATE POLICY "Admins can update leads"
ON public.leads
FOR UPDATE
USING (is_admin(auth.uid()));