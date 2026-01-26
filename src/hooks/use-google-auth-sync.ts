import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

/**
 * Hook that syncs Google OAuth tokens and profile data after login.
 * When a user logs in with Google using extended scopes, this hook:
 * 1. Stores the access token in oauth_tokens for GA/GSC auto-connect
 * 2. Syncs the profile avatar from Google metadata
 */
export const useGoogleAuthSync = () => {
  const hasSynced = useRef(false);

  const syncGoogleAuth = useCallback(async (session: Session) => {
    if (hasSynced.current) return;
    
    const provider = session.user?.app_metadata?.provider;
    if (provider !== 'google') return;

    hasSynced.current = true;

    try {
      // Get provider token from session
      const providerToken = session.provider_token;
      const providerRefreshToken = session.provider_refresh_token;
      
      if (!providerToken) {
        console.log('[GoogleAuthSync] No provider token available');
        return;
      }

      console.log('[GoogleAuthSync] Syncing Google OAuth token for user:', session.user.id);

      // Determine scope from the session or use default extended scopes (includes all services)
      const scope = [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/webmasters',
        'https://www.googleapis.com/auth/adwords',
        'https://www.googleapis.com/auth/business.manage',
      ].join(' ');

      // Calculate expiry - typically 1 hour for Google tokens
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

      // Upsert OAuth token for GA/GSC auto-connect
      const { error: tokenError } = await supabase
        .from('oauth_tokens')
        .upsert({
          user_id: session.user.id,
          provider: 'google',
          access_token: providerToken,
          refresh_token: providerRefreshToken || null,
          scope: scope,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,provider'
        });

      if (tokenError) {
        console.error('[GoogleAuthSync] Failed to store OAuth token:', tokenError);
      } else {
        console.log('[GoogleAuthSync] OAuth token stored successfully');
        
        // Also sync to localStorage for immediate use by unified auth hook
        const expiryTime = Date.now() + 3600 * 1000;
        localStorage.setItem('unified_google_token', providerToken);
        localStorage.setItem('unified_google_expiry', expiryTime.toString());
        localStorage.setItem('unified_google_scopes', scope);
        localStorage.setItem('ga_access_token', providerToken);
        localStorage.setItem('ga_token_expiry', expiryTime.toString());
        localStorage.setItem('gsc_access_token', providerToken);
        localStorage.setItem('gsc_token_expiry', expiryTime.toString());
        
        // Sync Google Ads tokens
        localStorage.setItem('google_ads_access_token', providerToken);
        localStorage.setItem('google_ads_token_expiry', expiryTime.toString());
        
        // Sync GMB tokens
        localStorage.setItem('gmb_access_token', providerToken);
        localStorage.setItem('gmb_token_expiry', expiryTime.toString());
        
        // Dispatch sync event to notify all panels
        window.dispatchEvent(new CustomEvent('google-auth-synced', {
          detail: { access_token: providerToken, expiry: expiryTime }
        }));
      }

      // Sync profile avatar if needed
      const avatarUrl = session.user.user_metadata?.avatar_url || 
                       session.user.user_metadata?.picture;
      const fullName = session.user.user_metadata?.full_name || 
                      session.user.user_metadata?.name;
      const email = session.user.email;

      if (avatarUrl || fullName) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            avatar_url: avatarUrl,
            full_name: fullName,
            email: email,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', session.user.id);

        if (profileError) {
          console.error('[GoogleAuthSync] Failed to update profile:', profileError);
        } else {
          console.log('[GoogleAuthSync] Profile updated with Google metadata');
        }

        // Store profile in localStorage for UI components
        const profileData = {
          name: fullName,
          email: email,
          picture: avatarUrl,
        };
        localStorage.setItem('unified_google_profile', JSON.stringify(profileData));
        localStorage.setItem('gsc_google_profile', JSON.stringify(profileData));
        
        // Dispatch event to notify components
        window.dispatchEvent(new CustomEvent('gsc-profile-updated', { 
          detail: { profile: profileData } 
        }));
      }

    } catch (error) {
      console.error('[GoogleAuthSync] Error syncing Google auth:', error);
    }
  }, []);

  useEffect(() => {
    // Check current session on mount
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await syncGoogleAuth(session);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          hasSynced.current = false; // Reset flag for new sign-in
          await syncGoogleAuth(session);
        } else if (event === 'SIGNED_OUT') {
          hasSynced.current = false;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [syncGoogleAuth]);
};

export default useGoogleAuthSync;
