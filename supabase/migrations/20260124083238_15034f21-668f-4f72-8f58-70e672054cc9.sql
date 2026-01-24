-- Create table to track form test results
CREATE TABLE public.form_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_name TEXT NOT NULL,
  form_endpoint TEXT,
  test_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  response_time_ms INTEGER,
  tested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tested_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.form_tests ENABLE ROW LEVEL SECURITY;

-- Admins can view all form tests
CREATE POLICY "Admins can view form tests"
  ON public.form_tests FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can insert form tests
CREATE POLICY "Admins can insert form tests"
  ON public.form_tests FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Admins can delete form tests
CREATE POLICY "Admins can delete form tests"
  ON public.form_tests FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_form_tests_tested_at ON public.form_tests(tested_at DESC);
CREATE INDEX idx_form_tests_form_name ON public.form_tests(form_name);