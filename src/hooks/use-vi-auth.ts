import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  avatar_url: string | null;
  full_name: string | null;
}

/**
 * Hook for VI Dashboard authentication and authorization
 * Handles user session, admin role checking, and profile fetching
 */
export const useVIAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data) {
        setCurrentUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []);

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;
      
      const adminStatus = !!data;
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => {
            checkAdminRole(newSession.user.id);
            fetchUserProfile(newSession.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsLoading(false);
          setCurrentUserProfile(null);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        checkAdminRole(initialSession.user.id);
        fetchUserProfile(initialSession.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAdminRole, fetchUserProfile]);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && (!user || !session)) {
      navigate('/auth?redirect=/visitor-intelligence-dashboard');
    }
  }, [isLoading, user, session, navigate]);

  return {
    user,
    session,
    isAdmin,
    isLoading,
    currentUserProfile,
    handleLogout,
  };
};

export default useVIAuth;
