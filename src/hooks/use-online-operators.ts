import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OnlineOperator {
  user_id: string;
  avatar_url: string | null;
  full_name: string | null;
  email: string | null;
  last_activity_at: string;
  is_current_user: boolean;
}

/**
 * Hook to fetch all online operators (admin users with recent activity)
 */
export const useOnlineOperators = (currentUserId: string | null) => {
  const [operators, setOperators] = useState<OnlineOperator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOperators = useCallback(async () => {
    if (!currentUserId) {
      setOperators([]);
      setLoading(false);
      return;
    }

    try {
      // Get all admin user IDs
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'super_admin']);

      if (!adminRoles || adminRoles.length === 0) {
        setOperators([]);
        setLoading(false);
        return;
      }

      const adminUserIds = adminRoles.map(r => r.user_id);

      // Find which admins have been active in the last 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: activeSessions } = await supabase
        .from('visitor_sessions')
        .select('user_id, last_activity_at')
        .in('user_id', adminUserIds)
        .gte('last_activity_at', tenMinutesAgo)
        .order('last_activity_at', { ascending: false });

      if (!activeSessions || activeSessions.length === 0) {
        // At minimum, show the current user as online
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('user_id, avatar_url, full_name, email')
          .eq('user_id', currentUserId)
          .single();
        
        if (currentProfile) {
          setOperators([{
            user_id: currentProfile.user_id,
            avatar_url: currentProfile.avatar_url,
            full_name: currentProfile.full_name,
            email: currentProfile.email,
            last_activity_at: new Date().toISOString(),
            is_current_user: true,
          }]);
        }
        setLoading(false);
        return;
      }

      // Deduplicate by user_id (keep most recent activity)
      const uniqueAdminIds = new Set<string>();
      const deduplicatedSessions: typeof activeSessions = [];
      
      for (const session of activeSessions) {
        if (session.user_id && !uniqueAdminIds.has(session.user_id)) {
          uniqueAdminIds.add(session.user_id);
          deduplicatedSessions.push(session);
        }
      }

      // Fetch profiles for online admins
      const onlineAdminIds = deduplicatedSessions.map(s => s.user_id!);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, avatar_url, full_name, email')
        .in('user_id', onlineAdminIds);

      if (!profiles) {
        setOperators([]);
        setLoading(false);
        return;
      }

      // Build map of activity times
      const activityMap: Record<string, string> = {};
      deduplicatedSessions.forEach(s => {
        if (s.user_id) activityMap[s.user_id] = s.last_activity_at;
      });

      // Combine data
      const onlineOperators: OnlineOperator[] = profiles.map(p => ({
        user_id: p.user_id,
        avatar_url: p.avatar_url,
        full_name: p.full_name,
        email: p.email,
        last_activity_at: activityMap[p.user_id] || new Date().toISOString(),
        is_current_user: p.user_id === currentUserId,
      }));

      // Sort: current user first, then alphabetically
      onlineOperators.sort((a, b) => {
        if (a.is_current_user) return -1;
        if (b.is_current_user) return 1;
        return (a.full_name || a.email || '').localeCompare(b.full_name || b.email || '');
      });

      setOperators(onlineOperators);
    } catch (error) {
      console.error('Error fetching online operators:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchOperators();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchOperators, 30000);
    
    return () => clearInterval(interval);
  }, [fetchOperators]);

  return { operators, loading, refetch: fetchOperators };
};

export default useOnlineOperators;
