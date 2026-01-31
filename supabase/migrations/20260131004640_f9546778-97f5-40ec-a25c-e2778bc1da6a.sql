-- AI Chat conversations and usage tracking for VI Dashboard
CREATE TABLE public.ai_assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  domain TEXT,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.ai_assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_assistant_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.ai_assistant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  minutes_used NUMERIC DEFAULT 0,
  week_start DATE NOT NULL DEFAULT date_trunc('week', now())::date,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.ai_assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistant_usage ENABLE ROW LEVEL SECURITY;

-- Conversations: users can only see their own
CREATE POLICY "Users can view own conversations" ON public.ai_assistant_conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.ai_assistant_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.ai_assistant_conversations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.ai_assistant_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Messages: users can see messages from their conversations
CREATE POLICY "Users can view messages from own conversations" ON public.ai_assistant_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_assistant_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create messages in own conversations" ON public.ai_assistant_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_assistant_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

-- Usage: users can see their own usage
CREATE POLICY "Users can view own usage" ON public.ai_assistant_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own usage" ON public.ai_assistant_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON public.ai_assistant_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_assistant_messages;

-- Indexes for performance
CREATE INDEX idx_ai_conversations_user ON public.ai_assistant_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation ON public.ai_assistant_messages(conversation_id);
CREATE INDEX idx_ai_usage_user_week ON public.ai_assistant_usage(user_id, week_start);