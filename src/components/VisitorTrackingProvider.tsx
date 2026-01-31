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

  // Initialize session on first load - NON-BLOCKING
  useEffect(() => {
    // Mark session ready IMMEDIATELY so app is not blocked
    setSessionReady(true);
    
    // Fire-and-forget session initialization
    const initSession = () => {
      // Use setTimeout to ensure this runs after the main thread is free
      setTimeout(async () => {
        try {
          // Route all writes through backend function to avoid RLS/anon write failures.
          // This tracks webstack.ceo internal visitors (the marketing site itself)
          await supabase.functions.invoke('visitor-session-track', {
            body: {
              action: 'init',
              session_id: sessionId.current,
              first_page: window.location.pathname,
              referrer: document.referrer || null,
              user_agent: navigator.userAgent,
              domain: 'webstack.ceo', // Internal tracking for the marketing site
            },
          });
        } catch (error) {
          console.error('Session init error:', error);
        }
      }, 0);
    };

    initSession();

    // Listen for auth state changes to update session with user_id
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Update session with user_id when user logs in
        setTimeout(async () => {
          try {
            await supabase.functions.invoke('visitor-session-track', {
              body: {
                action: 'touch',
                session_id: sessionId.current,
                first_page: window.location.pathname,
                referrer: document.referrer || null,
                user_agent: navigator.userAgent,
                domain: 'webstack.ceo',
              },
            });
          } catch {
            // Silent fail
          }
        }, 0);
      }
    });

    // Update activity every 30 seconds
    const interval = setInterval(async () => {
      try {
        await supabase.functions.invoke('visitor-session-track', {
          body: {
            action: 'touch',
            session_id: sessionId.current,
            first_page: window.location.pathname,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
            domain: 'webstack.ceo',
          },
        });
      } catch {
        // Silent fail
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
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
        await supabase.functions.invoke('visitor-session-track', {
          body: {
            action: 'page_view',
            session_id: sessionId.current,
            page_path: location.pathname,
            page_title: document.title,
            time_on_page: 0,
            scroll_depth: 0,
            domain: 'webstack.ceo',
          },
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
