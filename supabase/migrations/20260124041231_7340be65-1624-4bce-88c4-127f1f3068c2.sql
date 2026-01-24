-- Allow anyone to read visitor_sessions for public stats display
-- This data is analytics info (session IDs, timestamps, referrers) not PII
CREATE POLICY "Anyone can read visitor sessions for stats"
  ON public.visitor_sessions
  FOR SELECT
  USING (true);