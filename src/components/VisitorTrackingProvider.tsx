import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'webstack_session_id';

const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

export const VisitorTrackingProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const sessionId = useRef<string>(getOrCreateSessionId());
  const [sessionReady, setSessionReady] = useState(false);
  const lastPath = useRef<string>('');

  // Initialize session on first load
  useEffect(() => {
    const initSession = async () => {
      try {
        // Check if session exists
        const { data: existingSession } = await supabase
          .from('visitor_sessions')
          .select('id')
          .eq('session_id', sessionId.current)
          .maybeSingle();

        if (!existingSession) {
          // Create new session
          await supabase.from('visitor_sessions').insert({
            session_id: sessionId.current,
            first_page: window.location.pathname,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
            ip_hash: null,
          });
        }
        setSessionReady(true);
      } catch (error) {
        // Still mark as ready to not block the app
        setSessionReady(true);
        console.error('Session init error:', error);
      }
    };

    initSession();

    // Update activity every 30 seconds
    const interval = setInterval(async () => {
      try {
        await supabase
          .from('visitor_sessions')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('session_id', sessionId.current);
      } catch {
        // Silent fail
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Track page views on route change (only after session is ready)
  useEffect(() => {
    if (!sessionReady) return;

    const trackPageView = async () => {
      // Skip if same path (prevent double tracking)
      if (lastPath.current === location.pathname) return;
      lastPath.current = location.pathname;

      // Skip admin/auth pages
      if (location.pathname.includes('/admin') || 
          location.pathname.includes('/auth') ||
          location.pathname.includes('/visitor-intelligence-dashboard')) {
        return;
      }

      try {
        await supabase.from('page_views').insert({
          session_id: sessionId.current,
          page_path: location.pathname,
          page_title: document.title,
          time_on_page: 0,
          scroll_depth: 0,
        });
      } catch (error) {
        console.error('Page view tracking error:', error);
      }
    };

    // Small delay to ensure page title is updated
    const timeout = setTimeout(trackPageView, 100);
    return () => clearTimeout(timeout);
  }, [location.pathname, sessionReady]);

  return <>{children}</>;
};

// Export session ID getter for use in other components
export const getCurrentSessionId = (): string => {
  return sessionStorage.getItem(SESSION_KEY) || getOrCreateSessionId();
};
