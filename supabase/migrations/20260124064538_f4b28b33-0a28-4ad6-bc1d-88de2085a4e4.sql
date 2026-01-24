-- Create knowledge base table for storing website content that the AI can reference
CREATE TABLE public.ai_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  source_url TEXT,
  keywords TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI chat sessions table (separate from operator chats)
CREATE TABLE public.ai_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  visitor_name TEXT,
  visitor_email TEXT,
  current_page TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'ended', 'booking')),
  transferred_to_conversation_id UUID REFERENCES public.chat_conversations(id),
  calendly_link TEXT,
  booking_scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI chat messages table
CREATE TABLE public.ai_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create human handoff requests table
CREATE TABLE public.ai_handoff_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'timeout')),
  operator_id UUID,
  conversation_id UUID REFERENCES public.chat_conversations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_handoff_requests ENABLE ROW LEVEL SECURITY;

-- Knowledge base policies (admins can manage, anyone can read active entries)
CREATE POLICY "Anyone can read active knowledge base entries" 
ON public.ai_knowledge_base FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage knowledge base" 
ON public.ai_knowledge_base FOR ALL USING (is_admin(auth.uid()));

-- AI chat sessions policies
CREATE POLICY "Anyone can create AI chat sessions" 
ON public.ai_chat_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view AI chat sessions" 
ON public.ai_chat_sessions FOR SELECT USING (true);

CREATE POLICY "Anyone can update AI chat sessions" 
ON public.ai_chat_sessions FOR UPDATE USING (true);

-- AI chat messages policies
CREATE POLICY "Anyone can create AI chat messages" 
ON public.ai_chat_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view AI chat messages" 
ON public.ai_chat_messages FOR SELECT USING (true);

-- Handoff requests policies
CREATE POLICY "Anyone can create handoff requests" 
ON public.ai_handoff_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view handoff requests" 
ON public.ai_handoff_requests FOR SELECT USING (true);

CREATE POLICY "Admins can update handoff requests" 
ON public.ai_handoff_requests FOR UPDATE USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_ai_knowledge_category ON public.ai_knowledge_base(category);
CREATE INDEX idx_ai_knowledge_keywords ON public.ai_knowledge_base USING GIN(keywords);
CREATE INDEX idx_ai_sessions_status ON public.ai_chat_sessions(status);
CREATE INDEX idx_ai_sessions_session_id ON public.ai_chat_sessions(session_id);
CREATE INDEX idx_ai_messages_session ON public.ai_chat_messages(session_id);
CREATE INDEX idx_ai_handoff_status ON public.ai_handoff_requests(status);

-- Create trigger for updated_at on knowledge base
CREATE TRIGGER update_ai_knowledge_base_updated_at
BEFORE UPDATE ON public.ai_knowledge_base
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live handoff notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_handoff_requests;