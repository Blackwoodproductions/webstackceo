import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

// Token refresh buffer - refresh 10 minutes before expiry
const TOKEN_REFRESH_BUFFER_MS = 10 * 60 * 1000;
// Check interval - every 2 minutes
const TOKEN_CHECK_INTERVAL_MS = 2 * 60 * 1000;

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
  isGoogleConnected: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkGoogleTokenValidity: () => boolean;
  refreshGoogleToken: () => Promise<boolean>;
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
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isReauthPending, setIsReauthPending] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Get token expiry time from localStorage
  const getTokenExpiry = useCallback((): number | null => {
    const tokenKeys = ['unified_google_expiry', 'gsc_token_expiry', 'ga_token_expiry'];
    for (const key of tokenKeys) {
      const expiryVal = localStorage.getItem(key);
      if (expiryVal) {
        return parseInt(expiryVal, 10);
      }
    }
    return null;
  }, []);

  // Check if Google tokens are still valid
  const checkGoogleTokenValidity = useCallback((): boolean => {
    const tokenKeys = [
      { token: 'unified_google_token', expiry: 'unified_google_expiry' },
      { token: 'gsc_access_token', expiry: 'gsc_token_expiry' },
      { token: 'ga_access_token', expiry: 'ga_token_expiry' },
    ];

    for (const { token, expiry } of tokenKeys) {
      const tokenVal = localStorage.getItem(token);
      const expiryVal = localStorage.getItem(expiry);
      
      if (tokenVal && expiryVal) {
        const expiryTime = parseInt(expiryVal, 10);
        // Token valid if more than 1 minute remaining
        if (Date.now() < expiryTime - 60000) {
          return true;
        }
      }
    }
    return false;
  }, []);

  // Refresh Google token using refresh_token from database
  const refreshGoogleToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current || !user?.id) return false;
    isRefreshingRef.current = true;
    
    try {
      // Get refresh token from database
      const { data: tokenData, error } = await supabase
        .from('oauth_tokens')
        .select('refresh_token, access_token')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single();

      if (error || !tokenData?.refresh_token) {
        return false;
      }

      // Call edge function to refresh the token
      const response = await supabase.functions.invoke('google-oauth-token', {
        body: {
          refreshToken: tokenData.refresh_token,
          grantType: 'refresh_token'
        }
      });

      if (response.error || !response.data?.access_token) {
        console.error('[AuthContext] Token refresh failed');
        return false;
      }

      const newAccessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      const newExpiry = Date.now() + (expiresIn * 1000);
      const expiryStr = newExpiry.toString();

      // Update localStorage with new tokens
      localStorage.setItem('unified_google_token', newAccessToken);
      localStorage.setItem('unified_google_expiry', expiryStr);
      localStorage.setItem('ga_access_token', newAccessToken);
      localStorage.setItem('ga_token_expiry', expiryStr);
      localStorage.setItem('gsc_access_token', newAccessToken);
      localStorage.setItem('gsc_token_expiry', expiryStr);
      localStorage.setItem('google_ads_access_token', newAccessToken);
      localStorage.setItem('google_ads_token_expiry', expiryStr);
      localStorage.setItem('gmb_access_token', newAccessToken);
      localStorage.setItem('gmb_token_expiry', expiryStr);

      // Update database
      await supabase
        .from('oauth_tokens')
        .update({
          access_token: newAccessToken,
          expires_at: new Date(newExpiry).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('provider', 'google');

      setIsGoogleConnected(true);
      setIsReauthPending(false);

      // Dispatch sync event
      window.dispatchEvent(new CustomEvent('google-auth-synced', {
        detail: { access_token: newAccessToken, expiry: newExpiry }
      }));

      return true;
    } catch (err) {
      console.error('[AuthContext] Token refresh error');
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [user?.id]);

  // Schedule automatic token refresh before expiry
  const scheduleTokenRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const expiry = getTokenExpiry();
    if (!expiry) return;

    const timeUntilRefresh = expiry - Date.now() - TOKEN_REFRESH_BUFFER_MS;
    
    if (timeUntilRefresh > 0) {
      refreshTimeoutRef.current = setTimeout(async () => {
        const success = await refreshGoogleToken();
        if (success) {
          scheduleTokenRefresh(); // Schedule next refresh
        }
      }, timeUntilRefresh);
    } else if (timeUntilRefresh > -TOKEN_REFRESH_BUFFER_MS) {
      // Token is about to expire, refresh now
      refreshGoogleToken().then(success => {
        if (success) scheduleTokenRefresh();
      });
    }
  }, [getTokenExpiry, refreshGoogleToken]);

  // Sync Google tokens to localStorage and database
  const syncGoogleTokens = useCallback(async (session: Session) => {
    const provider = session.user?.app_metadata?.provider;
    if (provider !== 'google' || !session.provider_token) {
      setIsGoogleConnected(false);
      return;
    }

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
    setIsGoogleConnected(true);
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

      // Schedule automatic token refresh
      scheduleTokenRefresh();
    } catch (err) {
      console.error('[AuthContext] Failed to store token in database:', err);
    }
  }, [scheduleTokenRefresh]);

  // Check admin status
  const checkAdminStatus = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase.rpc('is_admin', { _user_id: userId });
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  // Load stored profile, check initial token validity, and schedule refresh
  useEffect(() => {
    const storedProfile = localStorage.getItem('unified_google_profile');
    if (storedProfile) {
      try {
        setGoogleProfile(JSON.parse(storedProfile));
      } catch {
        // Ignore parse errors
      }
    }
    // Check initial Google connection status
    const isValid = checkGoogleTokenValidity();
    setIsGoogleConnected(isValid);
    
    // If connected, schedule automatic token refresh
    if (isValid) {
      scheduleTokenRefresh();
    }
  }, [checkGoogleTokenValidity, scheduleTokenRefresh]);

  // Periodic token validity check - triggers refresh or re-auth when tokens expire
  useEffect(() => {
    const checkInterval = setInterval(async () => {
      const isValid = checkGoogleTokenValidity();
      const wasConnected = isGoogleConnected;
      
      if (wasConnected && !isValid && !isReauthPending) {
        // Try to refresh first
        const refreshed = await refreshGoogleToken();
        
        if (!refreshed) {
          setIsGoogleConnected(false);
          setIsReauthPending(true);
          
          // Clear expired tokens
          ['unified_google_token', 'unified_google_expiry', 'ga_access_token', 
           'ga_token_expiry', 'gsc_access_token', 'gsc_token_expiry',
           'google_ads_access_token', 'google_ads_token_expiry',
           'gmb_access_token', 'gmb_token_expiry'].forEach(key => localStorage.removeItem(key));
          
          // Show toast prompting re-login
          toast({
            title: "Google Session Expired",
            description: "Please sign in again to continue using Google services.",
            variant: "destructive",
          });
          
          // Dispatch event for components to react
          window.dispatchEvent(new CustomEvent('google-auth-expired'));
        }
      } else if (isValid && !wasConnected) {
        setIsGoogleConnected(true);
        setIsReauthPending(false);
      }
    }, TOKEN_CHECK_INTERVAL_MS);

    return () => clearInterval(checkInterval);
  }, [checkGoogleTokenValidity, isGoogleConnected, isReauthPending, refreshGoogleToken]);

  // Cleanup scheduled refresh on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
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
    isGoogleConnected,
    signInWithGoogle,
    signOut,
    refreshSession,
    checkGoogleTokenValidity,
    refreshGoogleToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
