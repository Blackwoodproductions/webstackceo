-- Add user_id column to visitor_sessions to track authenticated users
ALTER TABLE public.visitor_sessions 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add index for faster lookups by user_id
CREATE INDEX idx_visitor_sessions_user_id ON public.visitor_sessions(user_id);