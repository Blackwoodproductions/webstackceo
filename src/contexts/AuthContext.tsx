import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Extended scopes for all Google services including Site Verification
const EXTENDED_GOOGLE_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/siteverification',
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/business.manage',
].join(' ');

interface GoogleProfile {
  name?: string;
  email?: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  googleProfile: GoogleProfile | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [googleProfile, setGoogleProfile] = useState<GoogleProfile | null>(null);

  // Sync Google tokens to localStorage and database
  const syncGoogleTokens = useCallback(async (session: Session) => {
    const provider = session.user?.app_metadata?.provider;
    if (provider !== 'google' || !session.provider_token) return;

    const expiryTime = Date.now() + 3600 * 1000;
    const expiryStr = expiryTime.toString();

    // Store in localStorage for all services
    localStorage.setItem('unified_google_token', session.provider_token);
    localStorage.setItem('unified_google_expiry', expiryStr);
    localStorage.setItem('unified_google_scopes', EXTENDED_GOOGLE_SCOPES);
    localStorage.setItem('ga_access_token', session.provider_token);
    localStorage.setItem('ga_token_expiry', expiryStr);
    localStorage.setItem('gsc_access_token', session.provider_token);
    localStorage.setItem('gsc_token_expiry', expiryStr);
    localStorage.setItem('google_ads_access_token', session.provider_token);
    localStorage.setItem('google_ads_token_expiry', expiryStr);
    localStorage.setItem('gmb_access_token', session.provider_token);
    localStorage.setItem('gmb_token_expiry', expiryStr);

    // Store profile
    const avatarUrl = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
    const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
    const profileData: GoogleProfile = {
      name: fullName,
      email: session.user.email,
      picture: avatarUrl,
    };
    
    setGoogleProfile(profileData);
    localStorage.setItem('unified_google_profile', JSON.stringify(profileData));
    localStorage.setItem('gsc_google_profile', JSON.stringify(profileData));

    // Store in database
    try {
      await supabase
        .from('oauth_tokens')
        .upsert({
          user_id: session.user.id,
          provider: 'google',
          access_token: session.provider_token,
          refresh_token: session.provider_refresh_token || null,
          scope: EXTENDED_GOOGLE_SCOPES,
          expires_at: new Date(expiryTime).toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,provider'
        });

      // Dispatch sync event
      window.dispatchEvent(new CustomEvent('google-auth-synced', {
        detail: { access_token: session.provider_token, expiry: expiryTime }
      }));
    } catch (err) {
      console.error('[AuthContext] Failed to store token in database:', err);
    }
  }, []);

  // Check admin status
  const checkAdminStatus = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase.rpc('is_admin', { _user_id: userId });
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  // Load stored profile
  useEffect(() => {
    const storedProfile = localStorage.getItem('unified_google_profile');
    if (storedProfile) {
      try {
        setGoogleProfile(JSON.parse(storedProfile));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await checkAdminStatus(session.user.id);
            if (session.provider_token) {
              await syncGoogleTokens(session);
            }
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(async () => {
            await checkAdminStatus(session.user.id);
            if (session.provider_token) {
              await syncGoogleTokens(session);
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setIsAdmin(false);
          setGoogleProfile(null);
          // Clear localStorage tokens
          ['unified_google_token', 'unified_google_expiry', 'unified_google_scopes',
           'unified_google_profile', 'ga_access_token', 'ga_token_expiry',
           'gsc_access_token', 'gsc_token_expiry', 'gsc_google_profile',
           'google_ads_access_token', 'google_ads_token_expiry',
           'gmb_access_token', 'gmb_token_expiry'
          ].forEach(key => localStorage.removeItem(key));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminStatus, syncGoogleTokens]);

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: EXTENDED_GOOGLE_SCOPES,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent select_account',
          include_granted_scopes: 'true',
        },
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      throw new Error(error?.message || 'Failed to start Google sign-in.');
    }

    // Open popup
    const popupWidth = 520;
    const popupHeight = 720;
    const left = (window.screenX ?? 0) + (window.outerWidth - popupWidth) / 2;
    const top = (window.screenY ?? 0) + (window.outerHeight - popupHeight) / 2;

    const popup = window.open(
      data.url,
      'google_auth_popup',
      `popup=yes,width=${popupWidth},height=${popupHeight},left=${Math.max(0, left)},top=${Math.max(0, top)}`
    );

    if (!popup) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    // Poll for popup close
    return new Promise<void>((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(pollInterval);
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              resolve();
            } else {
              reject(new Error('Authentication cancelled'));
            }
          }
        } catch {
          // Ignore cross-origin errors
        }
      }, 500);
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
  }, []);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAdmin,
    googleProfile,
    signInWithGoogle,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
