import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

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

export const useVisitorTracking = () => {
  const sessionId = useRef<string>(getOrCreateSessionId());
  const pageEntryTime = useRef<number>(Date.now());
  const maxScrollDepth = useRef<number>(0);
  const hasInitialized = useRef<boolean>(false);

  // Initialize session
  const initSession = useCallback(async () => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

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
          ip_hash: null, // Would need server-side to hash IP
        });
      } else {
        // Update last activity
        await supabase
          .from('visitor_sessions')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('session_id', sessionId.current);
      }
    } catch (error) {
      console.error('Failed to init session:', error);
    }
  }, []);

  // Track page view
  const trackPageView = useCallback(async () => {
    try {
      await supabase.from('page_views').insert({
        session_id: sessionId.current,
        page_path: window.location.pathname,
        page_title: document.title,
        time_on_page: 0,
        scroll_depth: 0,
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }, []);

  // Track tool interaction
  const trackToolInteraction = useCallback(async (
    toolName: string,
    toolType: string,
    metadata: Json = {}
  ) => {
    try {
      await supabase.from('tool_interactions').insert([{
        session_id: sessionId.current,
        tool_name: toolName,
        tool_type: toolType,
        page_path: window.location.pathname,
        metadata,
      }]);
    } catch (error) {
      console.error('Failed to track tool interaction:', error);
    }
  }, []);

  // Track form submission
  const trackFormSubmission = useCallback(async (
    formName: string,
    formData: Json = {}
  ) => {
    try {
      await supabase.from('form_submissions').insert([{
        session_id: sessionId.current,
        form_name: formName,
        form_data: formData,
        page_path: window.location.pathname,
      }]);
    } catch (error) {
      console.error('Failed to track form submission:', error);
    }
  }, []);

  // Save lead
  const saveLead = useCallback(async (
    email: string,
    phone: string | null,
    domain: string,
    metricType: string
  ) => {
    try {
      await supabase.from('leads').insert({
        email,
        phone,
        domain,
        metric_type: metricType,
        source_page: window.location.pathname,
      });
    } catch (error) {
      console.error('Failed to save lead:', error);
    }
  }, []);

  // Handle scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
      maxScrollDepth.current = Math.max(maxScrollDepth.current, scrollPercent);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initSession();
    trackPageView();
    pageEntryTime.current = Date.now();

    // Update session activity periodically
    const activityInterval = setInterval(async () => {
      try {
        await supabase
          .from('visitor_sessions')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('session_id', sessionId.current);
      } catch (error) {
        // Silent fail
      }
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(activityInterval);
    };
  }, [initSession, trackPageView]);

  return {
    sessionId: sessionId.current,
    trackToolInteraction,
    trackFormSubmission,
    saveLead,
  };
};

// Singleton for use outside React components
let globalSessionId: string | null = null;

export const getGlobalSessionId = (): string => {
  if (!globalSessionId) {
    globalSessionId = getOrCreateSessionId();
  }
  return globalSessionId;
};

export const trackToolInteractionGlobal = async (
  toolName: string,
  toolType: string,
  metadata: Json = {}
) => {
  try {
    await supabase.from('tool_interactions').insert([{
      session_id: getGlobalSessionId(),
      tool_name: toolName,
      tool_type: toolType,
      page_path: window.location.pathname,
      metadata,
    }]);
  } catch (error) {
    console.error('Failed to track tool interaction:', error);
  }
};

export const saveLeadGlobal = async (
  email: string,
  phone: string | null,
  domain: string,
  metricType: string
) => {
  try {
    await supabase.from('leads').insert({
      email,
      phone,
      domain,
      metric_type: metricType,
      source_page: window.location.pathname,
    });
  } catch (error) {
    console.error('Failed to save lead:', error);
  }
};
