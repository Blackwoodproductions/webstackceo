import { useCallback, useRef, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type SocialPlatform = 'facebook' | 'twitter' | 'linkedin';

interface SocialProfile {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  username?: string;
}

interface SocialConnection {
  platform: SocialPlatform;
  connected: boolean;
  profile: SocialProfile | null;
  accessToken: string | null;
}

// PKCE helper for Twitter
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const useSocialOAuth = () => {
  const { user } = useAuth();
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const [connections, setConnections] = useState<Record<SocialPlatform, SocialConnection>>({
    facebook: { platform: 'facebook', connected: false, profile: null, accessToken: null },
    twitter: { platform: 'twitter', connected: false, profile: null, accessToken: null },
    linkedin: { platform: 'linkedin', connected: false, profile: null, accessToken: null },
  });
  const [isConnecting, setIsConnecting] = useState<SocialPlatform | null>(null);

  // Load stored connections on mount
  useEffect(() => {
    const loadStoredConnections = () => {
      ['facebook', 'twitter', 'linkedin'].forEach(platform => {
        const stored = localStorage.getItem(`social_${platform}_profile`);
        const token = localStorage.getItem(`social_${platform}_token`);
        if (stored && token) {
          try {
            const profile = JSON.parse(stored);
            setConnections(prev => ({
              ...prev,
              [platform]: {
                platform: platform as SocialPlatform,
                connected: true,
                profile,
                accessToken: token,
              }
            }));
          } catch (e) {
            console.error(`Failed to parse ${platform} profile:`, e);
          }
        }
      });
    };

    loadStoredConnections();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    };
  }, []);

  const getOAuthUrl = useCallback(async (platform: SocialPlatform): Promise<{ url: string; codeVerifier?: string }> => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const state = `${platform}_${Date.now()}`;
    
    // Store state for verification
    sessionStorage.setItem('social_oauth_state', state);
    sessionStorage.setItem('social_oauth_platform', platform);

    switch (platform) {
      case 'facebook': {
        // Facebook OAuth 2.0
        const params = new URLSearchParams({
          client_id: import.meta.env.VITE_FACEBOOK_APP_ID || '',
          redirect_uri: redirectUri,
          state,
          scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts',
          response_type: 'code',
        });
        return { url: `https://www.facebook.com/v18.0/dialog/oauth?${params}` };
      }

      case 'twitter': {
        // Twitter OAuth 2.0 with PKCE
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        sessionStorage.setItem('twitter_code_verifier', codeVerifier);
        
        const params = new URLSearchParams({
          client_id: import.meta.env.VITE_TWITTER_CLIENT_ID || '',
          redirect_uri: redirectUri,
          state,
          scope: 'tweet.read tweet.write users.read offline.access',
          response_type: 'code',
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        });
        return { url: `https://twitter.com/i/oauth2/authorize?${params}`, codeVerifier };
      }

      case 'linkedin': {
        // LinkedIn OAuth 2.0
        const params = new URLSearchParams({
          client_id: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
          redirect_uri: redirectUri,
          state,
          scope: 'openid profile email w_member_social',
          response_type: 'code',
        });
        return { url: `https://www.linkedin.com/oauth/v2/authorization?${params}` };
      }
    }
  }, []);

  const exchangeToken = useCallback(async (
    platform: SocialPlatform,
    code: string,
    codeVerifier?: string
  ) => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    
    const { data, error } = await supabase.functions.invoke('social-oauth-token', {
      body: {
        platform,
        code,
        redirectUri,
        codeVerifier,
      },
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);

    return data;
  }, []);

  const connect = useCallback(async (platform: SocialPlatform) => {
    setIsConnecting(platform);

    try {
      const { url, codeVerifier } = await getOAuthUrl(platform);
      
      // Check if we have the required client ID
      if (url.includes('client_id=&') || url.includes('client_id=undefined')) {
        toast.error(`${platform.charAt(0).toUpperCase() + platform.slice(1)} app not configured`, {
          description: "Please contact support to enable social connections."
        });
        setIsConnecting(null);
        return;
      }

      // Open popup
      const popupWidth = 520;
      const popupHeight = 720;
      const left = (window.screenX ?? 0) + (window.outerWidth - popupWidth) / 2;
      const top = (window.screenY ?? 0) + (window.outerHeight - popupHeight) / 2;

      const popup = window.open(
        url,
        `${platform}_auth_popup`,
        `popup=yes,width=${popupWidth},height=${popupHeight},left=${Math.max(0, left)},top=${Math.max(0, top)}`
      );

      if (!popup) {
        toast.error("Popup blocked", {
          description: "Please allow popups for this site and try again."
        });
        setIsConnecting(null);
        return;
      }

      popupRef.current = popup;

      // Poll for popup closure and URL changes
      pollIntervalRef.current = window.setInterval(async () => {
        try {
          if (popup.closed) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            setIsConnecting(null);
            return;
          }

          // Try to read the popup URL
          const popupUrl = popup.location.href;
          
          if (popupUrl.includes(window.location.origin)) {
            const urlParams = new URLSearchParams(popup.location.search);
            const code = urlParams.get("code");
            const state = urlParams.get("state");
            const error = urlParams.get("error");

            popup.close();
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }

            if (error) {
              toast.error("Authentication failed", { description: error });
              setIsConnecting(null);
              return;
            }

            if (code) {
              // Verify state
              const storedState = sessionStorage.getItem('social_oauth_state');
              const storedPlatform = sessionStorage.getItem('social_oauth_platform');
              
              if (state !== storedState || storedPlatform !== platform) {
                toast.error("Authentication failed", { description: "Invalid state parameter" });
                setIsConnecting(null);
                return;
              }

              // Get code verifier for Twitter
              const storedCodeVerifier = platform === 'twitter' 
                ? sessionStorage.getItem('twitter_code_verifier') 
                : undefined;

              // Exchange code for tokens
              const tokenData = await exchangeToken(platform, code, storedCodeVerifier || codeVerifier);

              // Store connection
              const profile: SocialProfile = {
                id: tokenData.profile?.id || tokenData.profile?.sub || '',
                name: tokenData.profile?.name || tokenData.profile?.username || '',
                email: tokenData.profile?.email,
                picture: tokenData.profile?.picture?.data?.url || tokenData.profile?.profile_image_url || tokenData.profile?.picture,
                username: tokenData.profile?.username,
              };

              localStorage.setItem(`social_${platform}_token`, tokenData.access_token);
              localStorage.setItem(`social_${platform}_profile`, JSON.stringify(profile));
              if (tokenData.refresh_token) {
                localStorage.setItem(`social_${platform}_refresh_token`, tokenData.refresh_token);
              }

              // Store in database if user is logged in
              if (user) {
                const expiryTime = Date.now() + (tokenData.expires_in || 3600) * 1000;
                await supabase
                  .from('oauth_tokens')
                  .upsert({
                    user_id: user.id,
                    provider: platform,
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token || null,
                    scope: tokenData.scope || '',
                    expires_at: new Date(expiryTime).toISOString(),
                    updated_at: new Date().toISOString(),
                  }, {
                    onConflict: 'user_id,provider'
                  });
              }

              setConnections(prev => ({
                ...prev,
                [platform]: {
                  platform,
                  connected: true,
                  profile,
                  accessToken: tokenData.access_token,
                }
              }));

              toast.success(`Connected to ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`);
              
              // Clean up session storage
              sessionStorage.removeItem('social_oauth_state');
              sessionStorage.removeItem('social_oauth_platform');
              sessionStorage.removeItem('twitter_code_verifier');
            }
            
            setIsConnecting(null);
          }
        } catch {
          // Cross-origin error - popup is on OAuth provider's domain, keep polling
        }
      }, 500);

    } catch (error) {
      console.error(`${platform} OAuth error:`, error);
      toast.error("Connection failed", {
        description: error instanceof Error ? error.message : "An error occurred"
      });
      setIsConnecting(null);
    }
  }, [user, getOAuthUrl, exchangeToken]);

  const disconnect = useCallback((platform: SocialPlatform) => {
    localStorage.removeItem(`social_${platform}_token`);
    localStorage.removeItem(`social_${platform}_profile`);
    localStorage.removeItem(`social_${platform}_refresh_token`);

    setConnections(prev => ({
      ...prev,
      [platform]: {
        platform,
        connected: false,
        profile: null,
        accessToken: null,
      }
    }));

    toast.success(`Disconnected from ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
  }, []);

  return {
    connections,
    isConnecting,
    connect,
    disconnect,
  };
};
