import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveVisitor {
  session_id: string;
  first_page: string | null;
  last_activity_at: string;
  started_at: string;
  referrer: string | null;
  user_id?: string | null;
  avatar_url?: string | null;
  display_name?: string | null;
  is_current_user?: boolean;
}

interface UseLiveVisitorsOptions {
  sessionId: string;
  currentUserId: string | null;
  enabled?: boolean;
  pollInterval?: number;
  limit?: number;
}

/**
 * Hook to fetch and poll live visitors with deduplication
 * Prevents duplicate entries for the same user/session
 */
export const useLiveVisitors = ({
  sessionId,
  currentUserId,
  enabled = true,
  pollInterval = 30000,
  limit = 8,
}: UseLiveVisitorsOptions) => {
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use refs to avoid re-creating the fetch function on every render
  const sessionIdRef = useRef(sessionId);
  const currentUserIdRef = useRef(currentUserId);
  
  useEffect(() => {
    sessionIdRef.current = sessionId;
    currentUserIdRef.current = currentUserId;
  }, [sessionId, currentUserId]);

  const fetchLiveVisitors = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: sessions } = await supabase
        .from('visitor_sessions')
        .select('session_id, first_page, last_activity_at, started_at, referrer, user_id')
        .gte('last_activity_at', fiveMinutesAgo)
        .order('last_activity_at', { ascending: false })
        .limit(limit);
      
      if (!sessions) {
        setLiveVisitors([]);
        return;
      }

      // Sort by activity first for deduplication priority
      const sortedByActivity = [...sessions].sort(
        (a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
      );

      // Deduplicate: one entry per user, current user always first
      const uniqueSessions: typeof sessions = [];
      const seenKeys = new Set<string>();
      
      for (const s of sortedByActivity) {
        const isSelf =
          (!!currentUserIdRef.current && s.user_id === currentUserIdRef.current) ||
          (!!sessionIdRef.current && s.session_id === sessionIdRef.current);

        // Skip anonymous sessions for logged-in current user
        if (currentUserIdRef.current && !s.user_id && s.session_id === sessionIdRef.current) {
          continue;
        }

        const key = isSelf ? 'self' : s.user_id ? `u:${s.user_id}` : `s:${s.session_id}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        uniqueSessions.push(s);
      }

      // Fetch profiles for authenticated users
      const userIds = uniqueSessions
        .map(s => s.user_id)
        .filter((id): id is string => !!id);

      let profilesMap: Record<string, { avatar_url: string | null; full_name: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, avatar_url, full_name')
          .in('user_id', userIds);

        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.user_id] = { avatar_url: p.avatar_url, full_name: p.full_name };
            return acc;
          }, {} as typeof profilesMap);
        }
      }

      // Build final visitor list with profile data
      const visitorsWithProfiles: LiveVisitor[] = uniqueSessions.map(v => {
        const isSelf =
          (!!currentUserIdRef.current && v.user_id === currentUserIdRef.current) ||
          (!!sessionIdRef.current && v.session_id === sessionIdRef.current);
        
        return {
          ...v,
          avatar_url: v.user_id ? profilesMap[v.user_id]?.avatar_url || null : null,
          display_name: v.user_id ? profilesMap[v.user_id]?.full_name || null : null,
          is_current_user: isSelf,
        };
      });

      // Ensure current user is first
      const currentIdx = visitorsWithProfiles.findIndex(v => v.is_current_user);
      if (currentIdx > 0) {
        const current = visitorsWithProfiles[currentIdx];
        const rest = visitorsWithProfiles.filter((_, i) => i !== currentIdx);
        setLiveVisitors([current, ...rest]);
      } else {
        setLiveVisitors(visitorsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching live visitors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, limit]);

  // Poll for live visitors
  useEffect(() => {
    if (!enabled) return;
    
    fetchLiveVisitors();
    const interval = setInterval(fetchLiveVisitors, pollInterval);
    return () => clearInterval(interval);
  }, [enabled, pollInterval, fetchLiveVisitors]);

  return {
    liveVisitors,
    isLoading,
    refetch: fetchLiveVisitors,
  };
};
