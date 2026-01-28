-- Security Fix Migration: Tighten RLS policies across all tables
-- This migration fixes overly permissive RLS policies identified by security scan

-- ============================================================================
-- 1. FIX AI CHAT SESSIONS (CRITICAL: Contains customer PII)
-- ============================================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view AI chat sessions" ON ai_chat_sessions;
DROP POLICY IF EXISTS "AI chat sessions can update own session" ON ai_chat_sessions;

-- Sessions can only be viewed by their owner (via session header) or admins
CREATE POLICY "Sessions can view own AI chat session"
ON ai_chat_sessions FOR SELECT
USING (
  session_id = (current_setting('request.headers', true)::json->>'x-session-id')
  OR is_admin(auth.uid())
);

-- Sessions can only update their own session
CREATE POLICY "Sessions can update own AI chat session"
ON ai_chat_sessions FOR UPDATE
USING (
  session_id = (current_setting('request.headers', true)::json->>'x-session-id')
)
WITH CHECK (
  session_id = (current_setting('request.headers', true)::json->>'x-session-id')
);

-- ============================================================================
-- 2. FIX AI CHAT MESSAGES (CRITICAL: Contains chat content)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view AI chat messages" ON ai_chat_messages;

-- Messages can only be viewed by session owner or admins
CREATE POLICY "Sessions can view own AI chat messages"
ON ai_chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ai_chat_sessions acs 
    WHERE acs.id = ai_chat_messages.session_id
    AND (
      acs.session_id = (current_setting('request.headers', true)::json->>'x-session-id')
      OR is_admin(auth.uid())
    )
  )
);

-- ============================================================================
-- 3. FIX CHAT CONVERSATIONS (CRITICAL: Contains customer data)
-- ============================================================================

DROP POLICY IF EXISTS "Visitors can view their conversations" ON chat_conversations;

-- Conversations can only be viewed by session owner or admins
CREATE POLICY "Sessions can view own chat conversations"
ON chat_conversations FOR SELECT
USING (
  session_id = (current_setting('request.headers', true)::json->>'x-session-id')
  OR is_admin(auth.uid())
);

-- ============================================================================
-- 4. FIX CHAT MESSAGES (CRITICAL: Private conversations)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view messages" ON chat_messages;

-- Messages can only be viewed by conversation participants or admins
CREATE POLICY "Sessions can view own chat messages"
ON chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_conversations cc 
    WHERE cc.id = chat_messages.conversation_id
    AND (
      cc.session_id = (current_setting('request.headers', true)::json->>'x-session-id')
      OR is_admin(auth.uid())
    )
  )
);

-- ============================================================================
-- 5. FIX AI HANDOFF REQUESTS
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view handoff requests" ON ai_handoff_requests;

-- Only admins can view handoff requests
CREATE POLICY "Admins can view handoff requests"
ON ai_handoff_requests FOR SELECT
USING (is_admin(auth.uid()));

-- ============================================================================
-- 6. FIX VISITOR SESSIONS (Remove overly permissive public read)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can read visitor sessions for stats" ON visitor_sessions;
DROP POLICY IF EXISTS "Sessions can only update own session" ON visitor_sessions;

-- Sessions can only update their own session (no fallback true)
CREATE POLICY "Sessions can update own visitor session"
ON visitor_sessions FOR UPDATE
USING (
  session_id = (current_setting('request.headers', true)::json->>'x-session-id')
)
WITH CHECK (
  session_id = (current_setting('request.headers', true)::json->>'x-session-id')
);

-- ============================================================================
-- 7. FIX SAVED AUDITS (Remove overly permissive UPDATE)
-- ============================================================================

DROP POLICY IF EXISTS "Service can update audits" ON saved_audits;

-- Only admins can update audits (service role bypasses RLS anyway)
CREATE POLICY "Admins can update audits"
ON saved_audits FOR UPDATE
USING (is_admin(auth.uid()));

-- ============================================================================
-- 8. FIX INDEXATION REPORTS
-- ============================================================================

DROP POLICY IF EXISTS "Allow public insert access to indexation reports" ON indexation_reports;

-- Only service role or admins can insert indexation reports
CREATE POLICY "Admins can insert indexation reports"
ON indexation_reports FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- 9. FIX KEYWORD RANKING HISTORY
-- ============================================================================

DROP POLICY IF EXISTS "Service can insert keyword history" ON keyword_ranking_history;

-- Only admins/service can insert keyword history
CREATE POLICY "Admins can insert keyword history"
ON keyword_ranking_history FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- ============================================================================
-- 10. FIX AUDIT HISTORY
-- ============================================================================

DROP POLICY IF EXISTS "Service can insert audit history" ON audit_history;

-- Only admins/service can insert audit history
CREATE POLICY "Admins can insert audit history"
ON audit_history FOR INSERT
WITH CHECK (is_admin(auth.uid()));