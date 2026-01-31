import { useEffect, useState } from "react";
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
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    let cancelled = false;
    const isPopup = window.opener && window.opener !== window;

    // Safety net: if the callback flow hangs (e.g., popup message not delivered),
    // close the popup / redirect after a short grace period.
    const fallback = window.setTimeout(() => {
      if (cancelled) return;
      if (isPopup) {
        try {
          window.close();
        } catch {
          // If we can't close, at least show success UI by flipping state.
          setStatus('success');
        }
      } else {
        navigate('/', { replace: true });
      }
    }, 12000);

    const handleCallback = async () => {
      try {
        console.log("[AuthCallback] Processing OAuth callback...");

        // The hash contains the tokens - we need to let the auth client process it.
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[AuthCallback] Error getting session:", error);
          setStatus('error');
          if (isPopup) {
            try {
              window.opener?.postMessage({ type: 'supabase_auth_callback', success: false }, "*");
            } catch {}
            setTimeout(() => window.close(), 500);
          } else {
            setTimeout(() => navigate('/auth', { replace: true }), 1500);
          }
          return;
        }

        // CRITICAL: The provider_token is only available right now during the callback
        // We must capture and store it immediately
        if (session?.provider_token) {
          console.log("[AuthCallback] Captured provider_token, storing for all services...");
        
        const expiryTime = Date.now() + 3600 * 1000; // 1 hour
        const expiryStr = expiryTime.toString();
        
        // Store for all Google services - batch these for speed
        const tokenData = {
          'unified_google_token': session.provider_token,
          'unified_google_expiry': expiryStr,
          'unified_google_scopes': EXTENDED_GOOGLE_SCOPES,
          'ga_access_token': session.provider_token,
          'ga_token_expiry': expiryStr,
          'gsc_access_token': session.provider_token,
          'gsc_token_expiry': expiryStr,
          'google_ads_access_token': session.provider_token,
          'google_ads_token_expiry': expiryStr,
          'gmb_access_token': session.provider_token,
          'gmb_token_expiry': expiryStr,
        };
        
        Object.entries(tokenData).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
        
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
        
        // Store in database async (don't wait for it)
        (async () => {
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
          } catch (err) {
            console.error("[AuthCallback] Failed to store token:", err);
          }
        })();
        
          console.log("[AuthCallback] All tokens stored successfully");
        } else {
          console.warn("[AuthCallback] No provider_token available in session");
        }

        setStatus('success');

        if (isPopup) {
          // Notify parent window that auth is complete with token info
          try {
            window.opener?.postMessage({
              type: 'supabase_auth_callback',
              success: !!session,
              hasProviderToken: !!session?.provider_token,
            }, "*");
          } catch (e) {
            console.error("[AuthCallback] Failed to post message to opener:", e);
          }
          // Close the popup after a short delay to ensure message is sent
          setTimeout(() => {
            try {
              window.close();
            } catch {
              console.log("[AuthCallback] Could not auto-close popup, please close manually");
            }
          }, 100);
        } else {
          // Not a popup - dispatch event and redirect to dashboard immediately
          if (session) {
            window.dispatchEvent(new CustomEvent('google-auth-synced', {
              detail: {
                access_token: session.provider_token,
                expiry: Date.now() + 3600 * 1000
              }
            }));
            // Use replace to avoid back-button issues
            navigate('/visitor-intelligence-dashboard', { replace: true });
          } else {
            navigate('/auth', { replace: true });
          }
        }
      } catch (e) {
        console.error("[AuthCallback] Callback processing failed:", e);
        if (cancelled) return;
        setStatus('error');

        if (isPopup) {
          try {
            window.opener?.postMessage({ type: 'supabase_auth_callback', success: false }, "*");
          } catch {}
          setTimeout(() => window.close(), 500);
        } else {
          setTimeout(() => navigate('/auth', { replace: true }), 1500);
        }
      }
    };

    void handleCallback().finally(() => {
      window.clearTimeout(fallback);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl ${
          status === 'success' 
            ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/30'
            : status === 'error'
            ? 'bg-gradient-to-br from-red-400 to-rose-500 shadow-red-500/30'
            : 'bg-gradient-to-br from-cyan-400 via-violet-500 to-primary shadow-primary/30'
        }`}>
          {status === 'processing' ? (
            <motion.div
              className="w-8 h-8 border-4 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
          ) : status === 'success' ? (
            <motion.svg 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              className="w-8 h-8 text-white"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </motion.svg>
          ) : (
            <span className="text-white text-2xl">!</span>
          )}
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">
            {status === 'processing' && "Completing sign in..."}
            {status === 'success' && "Success! Redirecting..."}
            {status === 'error' && "Something went wrong"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {status === 'processing' && "Please wait"}
            {status === 'success' && "Taking you to your dashboard"}
            {status === 'error' && "Please try again"}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthCallback;