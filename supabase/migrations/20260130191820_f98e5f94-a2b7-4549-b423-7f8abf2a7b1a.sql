-- Create enum for check types
CREATE TYPE public.health_check_type AS ENUM ('form', 'endpoint', 'edge_function', 'database', 'external_api');

-- Create enum for check status
CREATE TYPE public.health_check_status AS ENUM ('healthy', 'degraded', 'failing', 'unknown');

-- Create enum for alert severity
CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical');

-- Create enum for remediation status
CREATE TYPE public.remediation_status AS ENUM ('pending', 'in_progress', 'success', 'failed', 'skipped');

-- System Health Checks - tracks what to monitor
CREATE TABLE public.system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  check_type health_check_type NOT NULL,
  endpoint_url TEXT,
  test_payload JSONB DEFAULT '{}'::jsonb,
  expected_status INTEGER DEFAULT 200,
  timeout_ms INTEGER DEFAULT 10000,
  is_active BOOLEAN DEFAULT true,
  check_interval_minutes INTEGER DEFAULT 15,
  last_check_at TIMESTAMPTZ,
  last_status health_check_status DEFAULT 'unknown',
  consecutive_failures INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Health Check Results - logs each check
CREATE TABLE public.health_check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id UUID REFERENCES public.system_health_checks(id) ON DELETE CASCADE NOT NULL,
  status health_check_status NOT NULL,
  response_time_ms INTEGER,
  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT now()
);

-- System Alerts - notifications for issues
CREATE TABLE public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id UUID REFERENCES public.system_health_checks(id) ON DELETE CASCADE,
  severity alert_severity NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  auto_remediation_attempted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-Remediation Actions - tracks fix attempts
CREATE TABLE public.auto_remediation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.system_alerts(id) ON DELETE CASCADE,
  check_id UUID REFERENCES public.system_health_checks(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_description TEXT,
  status remediation_status NOT NULL DEFAULT 'pending',
  result_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_remediation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can access
CREATE POLICY "Admins can manage health checks"
ON public.system_health_checks FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can view check results"
ON public.health_check_results FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage alerts"
ON public.system_alerts FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can view remediation logs"
ON public.auto_remediation_logs FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()) OR public.is_super_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_health_check_results_check_id ON public.health_check_results(check_id);
CREATE INDEX idx_health_check_results_checked_at ON public.health_check_results(checked_at DESC);
CREATE INDEX idx_system_alerts_unresolved ON public.system_alerts(is_resolved, created_at DESC) WHERE is_resolved = false;
CREATE INDEX idx_system_alerts_check_id ON public.system_alerts(check_id);

-- Insert default health checks for webstack.ceo forms
INSERT INTO public.system_health_checks (name, description, check_type, endpoint_url, test_payload, expected_status) VALUES
('Contact Form', 'Main contact form submission endpoint', 'form', '/functions/v1/test-form', '{"form_name": "contact", "test": true}', 200),
('Directory Listing Form', 'Business directory listing submission', 'form', '/functions/v1/test-form', '{"form_name": "directory_listing", "test": true}', 200),
('Partner Application Form', 'Marketplace partner application', 'form', '/functions/v1/test-form', '{"form_name": "partner_application", "test": true}', 200),
('Domain Audit Edge Function', 'SEO audit function health check', 'edge_function', '/functions/v1/domain-audit', '{"domain": "example.com", "health_check": true}', 200),
('BRON API Connection', 'BRON keyword tracking API', 'external_api', '/functions/v1/bron-rsapi', '{"action": "health_check"}', 200),
('CADE API Connection', 'CADE content automation API', 'external_api', '/functions/v1/cade-api', '{"action": "health_check"}', 200),
('AI Assistant', 'OpenAI chat assistant', 'edge_function', '/functions/v1/ai-assistant', '{"health_check": true}', 200);

-- Trigger to update timestamps
CREATE TRIGGER update_health_checks_updated_at
BEFORE UPDATE ON public.system_health_checks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();