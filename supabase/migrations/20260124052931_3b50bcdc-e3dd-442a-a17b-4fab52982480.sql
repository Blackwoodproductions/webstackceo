-- Add current_page column to chat_conversations
ALTER TABLE public.chat_conversations
ADD COLUMN current_page text;