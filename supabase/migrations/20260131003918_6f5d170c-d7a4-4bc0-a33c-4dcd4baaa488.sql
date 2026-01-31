-- Create internal operator messages table for operator-to-operator chat
CREATE TABLE public.operator_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operator_messages ENABLE ROW LEVEL SECURITY;

-- Operators can see messages where they are sender or recipient
CREATE POLICY "Operators can view their own messages"
ON public.operator_messages
FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- Operators can send messages (only admins)
CREATE POLICY "Admins can send operator messages"
ON public.operator_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND public.has_role(auth.uid(), 'admin')
);

-- Operators can update read status on messages they received
CREATE POLICY "Recipients can mark messages as read"
ON public.operator_messages
FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Create index for faster lookups
CREATE INDEX idx_operator_messages_sender ON public.operator_messages(sender_id);
CREATE INDEX idx_operator_messages_recipient ON public.operator_messages(recipient_id);
CREATE INDEX idx_operator_messages_created ON public.operator_messages(created_at DESC);

-- Enable realtime for operator messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.operator_messages;