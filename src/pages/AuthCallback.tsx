import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

// Extended scopes for all Google services including Site Verification
const EXTENDED_GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/webmasters",
  "https://www.googleapis.com/auth/siteverification",
  "https://www.googleapis.com/auth/adwords",
  "https://www.googleapis.com/auth/business.manage",
].join(" ");

/**
 * Auth callback page that handles OAuth redirects.
 * Captures the provider_token immediately (only available during callback)
 * and stores it for GA/GSC/Ads/GMB auto-connect.
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      console.log("[AuthCallback] Processing OAuth callback...");
      
      // The hash contains the tokens - we need to let Supabase process it
      // by calling getSession which will parse the URL hash
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("[AuthCallback] Error getting session:", error);
      }

      // CRITICAL: The provider_token is only available right now during the callback
      // We must capture and store it immediately
      if (session?.provider_token) {
        console.log("[AuthCallback] Captured provider_token, storing for all services...");
        
        const expiryTime = Date.now() + 3600 * 1000; // 1 hour
        const expiryStr = expiryTime.toString();
        
        // Store for all Google services
        localStorage.setItem('unified_google_token', session.provider_token);
        localStorage.setItem('unified_google_expiry', expiryStr);
        localStorage.setItem('unified_google_scopes', EXTENDED_GOOGLE_SCOPES);
        
        // GA tokens
        localStorage.setItem('ga_access_token', session.provider_token);
        localStorage.setItem('ga_token_expiry', expiryStr);
        
        // GSC tokens
        localStorage.setItem('gsc_access_token', session.provider_token);
        localStorage.setItem('gsc_token_expiry', expiryStr);
        
        // Google Ads tokens
        localStorage.setItem('google_ads_access_token', session.provider_token);
        localStorage.setItem('google_ads_token_expiry', expiryStr);
        
        // GMB tokens
        localStorage.setItem('gmb_access_token', session.provider_token);
        localStorage.setItem('gmb_token_expiry', expiryStr);
        
        // Store profile data
        const avatarUrl = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
        const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
        const profileData = {
          name: fullName,
          email: session.user.email,
          picture: avatarUrl,
        };
        localStorage.setItem('unified_google_profile', JSON.stringify(profileData));
        localStorage.setItem('gsc_google_profile', JSON.stringify(profileData));
        
        // Store in database for persistence
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
          console.log("[AuthCallback] Token stored in database");
        } catch (dbError) {
          console.error("[AuthCallback] Failed to store token in database:", dbError);
        }
        
        console.log("[AuthCallback] All tokens stored successfully");
      } else {
        console.warn("[AuthCallback] No provider_token available in session");
      }

      // Check if we're in a popup
      const isPopup = window.opener && window.opener !== window;

      if (isPopup) {
        // Notify parent window that auth is complete with token info
        try {
          window.opener.postMessage({ 
            type: 'supabase_auth_callback', 
            success: !!session,
            hasProviderToken: !!session?.provider_token,
          }, window.location.origin);
        } catch (e) {
          console.error("[AuthCallback] Failed to post message to opener:", e);
        }
        // Close the popup
        window.close();
      } else {
        // Not a popup - dispatch event and redirect to dashboard
        if (session) {
          // Dispatch event to notify any listening components
          window.dispatchEvent(new CustomEvent('google-auth-synced', {
            detail: { 
              access_token: session.provider_token, 
              expiry: Date.now() + 3600 * 1000 
            }
          }));
          navigate('/visitor-intelligence-dashboard');
        } else {
          navigate('/auth');
        }
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-primary flex items-center justify-center shadow-2xl shadow-primary/30">
          <motion.div
            className="w-8 h-8 border-4 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Completing sign in...</p>
          <p className="text-sm text-muted-foreground mt-1">Please wait</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthCallback;