-- Enable realtime for visitor tracking tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_views;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tool_interactions;