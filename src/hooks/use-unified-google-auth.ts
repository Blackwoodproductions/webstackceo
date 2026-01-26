import { useState, useEffect, useCallback, useRef } from "react";
import { usePopupOAuth } from "./use-popup-oauth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

// Combined scopes for GA + GSC + Google Ads in a single OAuth prompt with offline access for refresh tokens
const UNIFIED_GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/webmasters",
  "https://www.googleapis.com/auth/adwords",
].join(" ");

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const getGoogleClientId = () =>
  localStorage.getItem("google_client_id") ||
  localStorage.getItem("gsc_client_id") ||
  localStorage.getItem("ga_client_id") ||
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "";

function getOAuthRedirectUri(): string {
  const path = window.location.pathname;
  try {
    if (document.referrer) {
      const ref = new URL(document.referrer);
      if (ref.hostname.endsWith("lovable.app")) {
        return `${ref.origin}${path}`;
      }
    }
  } catch {
    // ignore
  }
  return `${window.location.origin}${path}`;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes.buffer);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

export interface UnifiedGoogleAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  profile: { name?: string; email?: string; picture?: string } | null;
  hasGAAccess: boolean;
  hasGSCAccess: boolean;
  hasAdsAccess: boolean;
}

export interface UseUnifiedGoogleAuthReturn extends UnifiedGoogleAuthState {
  login: () => Promise<void>;
  disconnect: () => void;
  showClientIdDialog: boolean;
  setShowClientIdDialog: (show: boolean) => void;
  clientIdInput: string;
  setClientIdInput: (value: string) => void;
  saveClientIdAndLogin: () => void;
}

/**
 * Unified Google OAuth hook that authenticates both GA and GSC with a single prompt.
 * Stores tokens in database for 30-day persistence with refresh token support.
 */
export const useUnifiedGoogleAuth = (): UseUnifiedGoogleAuthReturn => {
  const { toast } = useToast();
  const { openOAuthPopup } = usePopupOAuth();
  const hasCheckedDb = useRef(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ name?: string; email?: string; picture?: string } | null>(null);
  const [hasGAAccess, setHasGAAccess] = useState(false);
  const [hasGSCAccess, setHasGSCAccess] = useState(false);
  const [hasAdsAccess, setHasAdsAccess] = useState(false);

  const [showClientIdDialog, setShowClientIdDialog] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");

  // Store tokens in database
  const storeTokensInDb = useCallback(async (
    token: string, 
    refreshToken: string | null, 
    expiresIn: number, 
    scope: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("[UnifiedAuth] No authenticated user, storing in localStorage only");
        return false;
      }

      // Calculate expiry - cap at 30 days
      const expiryMs = Math.min(expiresIn * 1000, THIRTY_DAYS_MS);
      const expiresAt = new Date(Date.now() + expiryMs).toISOString();

      const { error } = await supabase
        .from('oauth_tokens')
        .upsert({
          user_id: user.id,
          provider: 'google',
          access_token: token,
          refresh_token: refreshToken,
          scope: scope,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,provider'
        });

      if (error) {
        console.error("[UnifiedAuth] Failed to store tokens in DB:", error);
        return false;
      }

      console.log("[UnifiedAuth] Tokens stored in database, expires:", expiresAt);
      return true;
    } catch (error) {
      console.error("[UnifiedAuth] Error storing tokens:", error);
      return false;
    }
  }, []);

  // Retrieve tokens from database
  const getTokensFromDb = useCallback(async (): Promise<{
    accessToken: string;
    refreshToken: string | null;
    scope: string;
    expiresAt: Date;
  } | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('oauth_tokens')
        .select('access_token, refresh_token, scope, expires_at')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        scope: data.scope || '',
        expiresAt: new Date(data.expires_at),
      };
    } catch (error) {
      console.error("[UnifiedAuth] Error retrieving tokens:", error);
      return null;
    }
  }, []);

  // Refresh access token using refresh token
  const refreshAccessToken = useCallback(async (refreshToken: string): Promise<string | null> => {
    try {
      const tokenRes = await supabase.functions.invoke("google-oauth-token", {
        body: { 
          refreshToken,
          grantType: 'refresh_token'
        },
      });

      if (tokenRes.error || tokenRes.data?.error) {
        console.error("[UnifiedAuth] Token refresh failed:", tokenRes.data?.error || tokenRes.error);
        return null;
      }

      const { access_token, expires_in, scope } = tokenRes.data;
      
      // Update stored tokens
      await storeTokensInDb(access_token, refreshToken, expires_in || 3600, scope || '');
      
      return access_token;
    } catch (error) {
      console.error("[UnifiedAuth] Error refreshing token:", error);
      return null;
    }
  }, [storeTokensInDb]);

  // Delete tokens from database
  const deleteTokensFromDb = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('oauth_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google');
    } catch (error) {
      console.error("[UnifiedAuth] Error deleting tokens:", error);
    }
  }, []);

  const clearAllTokens = useCallback(() => {
    localStorage.removeItem("unified_google_token");
    localStorage.removeItem("unified_google_expiry");
    localStorage.removeItem("unified_google_scopes");
    localStorage.removeItem("unified_google_verifier");
    localStorage.removeItem("unified_google_profile");
    localStorage.removeItem("ga_access_token");
    localStorage.removeItem("ga_token_expiry");
    localStorage.removeItem("ga_code_verifier");
    localStorage.removeItem("gsc_access_token");
    localStorage.removeItem("gsc_token_expiry");
    localStorage.removeItem("gsc_code_verifier");
    localStorage.removeItem("gsc_google_profile");
    // Clear Google Ads tokens
    localStorage.removeItem("google_ads_access_token");
    localStorage.removeItem("google_ads_token_expiry");
    localStorage.removeItem("google_ads_customer_id");
    localStorage.removeItem("google_ads_customer_name");
  }, []);

  const syncToLocalStorage = useCallback((token: string, expiryTime: number, scope: string, profileData?: any) => {
    localStorage.setItem("unified_google_token", token);
    localStorage.setItem("unified_google_expiry", expiryTime.toString());
    localStorage.setItem("unified_google_scopes", scope);
    localStorage.setItem("ga_access_token", token);
    localStorage.setItem("ga_token_expiry", expiryTime.toString());
    localStorage.setItem("gsc_access_token", token);
    localStorage.setItem("gsc_token_expiry", expiryTime.toString());
    
    // Sync Google Ads tokens if scope includes adwords
    if (scope.includes("adwords")) {
      localStorage.setItem("google_ads_access_token", token);
      localStorage.setItem("google_ads_token_expiry", expiryTime.toString());
    }
    
    if (profileData) {
      localStorage.setItem("unified_google_profile", JSON.stringify(profileData));
      localStorage.setItem("gsc_google_profile", JSON.stringify(profileData));
    }
  }, []);

  const storeTokens = useCallback(async (token: string, expiresIn: number, scope: string, refreshToken?: string | null) => {
    const expiryTime = Date.now() + expiresIn * 1000;

    // Store in localStorage for immediate use
    syncToLocalStorage(token, expiryTime, scope);
    localStorage.removeItem("unified_google_verifier");

    // Store in database for persistence
    await storeTokensInDb(token, refreshToken || null, expiresIn, scope);

    setAccessToken(token);
    setIsAuthenticated(true);
    setHasGAAccess(scope.includes("analytics"));
    setHasGSCAccess(scope.includes("webmasters"));
    setHasAdsAccess(scope.includes("adwords"));

    // Fetch profile
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const profileData = await res.json();
        const minimalProfile = {
          name: profileData.name,
          email: profileData.email,
          picture: profileData.picture,
        };
        localStorage.setItem("unified_google_profile", JSON.stringify(minimalProfile));
        localStorage.setItem("gsc_google_profile", JSON.stringify(minimalProfile));
        setProfile(minimalProfile);
        window.dispatchEvent(new CustomEvent("gsc-profile-updated", { detail: { profile: minimalProfile } }));
      }
    } catch {
      // ignore
    }
  }, [syncToLocalStorage, storeTokensInDb]);

  // Check stored tokens on mount - prioritize database
  useEffect(() => {
    const checkAuth = async () => {
      if (hasCheckedDb.current) return;
      hasCheckedDb.current = true;

      // First check database for tokens
      const dbTokens = await getTokensFromDb();
      
      if (dbTokens) {
        const now = new Date();
        const timeRemaining = dbTokens.expiresAt.getTime() - now.getTime();
        const fiveMinBuffer = 5 * 60 * 1000;

        if (timeRemaining > fiveMinBuffer) {
          // Token is still valid
          console.log("[UnifiedAuth] Valid token from DB, expires in:", Math.round(timeRemaining / 1000 / 60), "minutes");
          
          syncToLocalStorage(dbTokens.accessToken, dbTokens.expiresAt.getTime(), dbTokens.scope);
          setAccessToken(dbTokens.accessToken);
          setIsAuthenticated(true);
          setHasGAAccess(dbTokens.scope.includes("analytics"));
          setHasGSCAccess(dbTokens.scope.includes("webmasters"));
          setHasAdsAccess(dbTokens.scope.includes("adwords"));

          // Load cached profile
          const storedProfile = localStorage.getItem("unified_google_profile");
          if (storedProfile) {
            try {
              setProfile(JSON.parse(storedProfile));
            } catch {
              // ignore
            }
          }

          setIsLoading(false);
          return;
        } else if (dbTokens.refreshToken) {
          // Token expired but we have refresh token
          console.log("[UnifiedAuth] Token expired, attempting refresh...");
          const newToken = await refreshAccessToken(dbTokens.refreshToken);
          
          if (newToken) {
            setAccessToken(newToken);
            setIsAuthenticated(true);
            setHasGAAccess(dbTokens.scope.includes("analytics"));
            setHasGSCAccess(dbTokens.scope.includes("webmasters"));
            setHasAdsAccess(dbTokens.scope.includes("adwords"));
            setIsLoading(false);
            return;
          }
        }
      }

      // Fall back to localStorage check
      const storedToken = localStorage.getItem("unified_google_token");
      const tokenExpiry = localStorage.getItem("unified_google_expiry");
      const storedScopes = localStorage.getItem("unified_google_scopes") || "";
      const storedProfile = localStorage.getItem("unified_google_profile");

      if (storedToken && tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry);
        const timeRemaining = expiryTime - Date.now();

        if (timeRemaining > 0) {
          console.log("[UnifiedAuth] Found valid localStorage token, expires in:", Math.round(timeRemaining / 1000 / 60), "minutes");
          setAccessToken(storedToken);
          setIsAuthenticated(true);
          setHasGAAccess(storedScopes.includes("analytics"));
          setHasGSCAccess(storedScopes.includes("webmasters"));
          setHasAdsAccess(storedScopes.includes("adwords"));

          if (storedProfile) {
            try {
              setProfile(JSON.parse(storedProfile));
            } catch {
              // ignore
            }
          }

          setIsLoading(false);
          return;
        } else {
          console.log("[UnifiedAuth] Stored token has expired, clearing...");
          clearAllTokens();
        }
      }

      // Check for OAuth callback
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (code && state === "unified_google") {
        const verifier = localStorage.getItem("unified_google_verifier");

        if (verifier) {
          setIsLoading(true);
          try {
            const redirectUri = getOAuthRedirectUri();
            const tokenRes = await supabase.functions.invoke("google-oauth-token", {
              body: { code, codeVerifier: verifier, redirectUri },
            });

            if (tokenRes.error || tokenRes.data?.error) {
              throw new Error(tokenRes.data?.error_description || tokenRes.error?.message || "Token exchange failed");
            }

            const { access_token, refresh_token, expires_in, scope } = tokenRes.data;
            await storeTokens(access_token, expires_in || 3600, scope || "", refresh_token);

            window.history.replaceState({}, document.title, window.location.pathname);

            toast({
              title: "Google Connected",
              description: "Successfully linked your Google Analytics and Search Console.",
            });
          } catch (error: any) {
            console.error("[UnifiedAuth] Token exchange error:", error);
            toast({
              title: "Connection Failed",
              description: error.message || "Failed to connect to Google.",
              variant: "destructive",
            });
            setAccessToken(null);
            setIsAuthenticated(false);
          } finally {
            setIsLoading(false);
          }
          return;
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [toast, getTokensFromDb, refreshAccessToken, syncToLocalStorage, clearAllTokens, storeTokens]);

  const handleOAuthCodeExchange = useCallback(async (code: string) => {
    const verifier = localStorage.getItem("unified_google_verifier");
    if (!verifier) {
      toast({
        title: "Authentication Error",
        description: "OAuth session expired. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const redirectUri = getOAuthRedirectUri();
      const tokenRes = await supabase.functions.invoke("google-oauth-token", {
        body: { code, codeVerifier: verifier, redirectUri },
      });

      if (tokenRes.error || tokenRes.data?.error) {
        throw new Error(tokenRes.data?.error_description || tokenRes.error?.message || "Token exchange failed");
      }

      const { access_token, refresh_token, expires_in, scope } = tokenRes.data;
      await storeTokens(access_token, expires_in || 3600, scope || "", refresh_token);

      toast({
        title: "Google Connected",
        description: "Successfully linked Analytics and Search Console.",
      });
    } catch (error: any) {
      console.error("[UnifiedAuth] Token exchange error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Google.",
        variant: "destructive",
      });
      setAccessToken(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [toast, storeTokens]);

  const login = useCallback(async () => {
    const clientId = getGoogleClientId();

    if (!clientId) {
      setShowClientIdDialog(true);
      return;
    }

    try {
      const redirectUri = getOAuthRedirectUri();
      const verifier = generateCodeVerifier();
      localStorage.setItem("unified_google_verifier", verifier);
      const challenge = await generateCodeChallenge(verifier);

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", UNIFIED_GOOGLE_SCOPES);
      authUrl.searchParams.set("code_challenge", challenge);
      authUrl.searchParams.set("code_challenge_method", "S256");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("access_type", "offline"); // Request refresh token
      authUrl.searchParams.set("state", "unified_google");

      const opened = openOAuthPopup({
        authUrl: authUrl.toString(),
        popupName: "unified_google_oauth",
        onSuccess: (code) => {
          void handleOAuthCodeExchange(code);
        },
        onError: (error) => {
          console.error("[UnifiedAuth] OAuth popup error:", error);
          toast({
            title: "Authentication Error",
            description: error === "access_denied"
              ? "You denied access to Google services."
              : "Failed to authenticate with Google. Please try again.",
            variant: "destructive",
          });
        },
      });

      if (!opened) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[UnifiedAuth] Error initiating OAuth:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to start Google authentication. Please try again.",
        variant: "destructive",
      });
    }
  }, [openOAuthPopup, handleOAuthCodeExchange, toast]);

  const disconnect = useCallback(async () => {
    clearAllTokens();
    await deleteTokensFromDb();
    setAccessToken(null);
    setIsAuthenticated(false);
    setProfile(null);
    setHasGAAccess(false);
    setHasGSCAccess(false);
    setHasAdsAccess(false);
    window.dispatchEvent(new CustomEvent("gsc-profile-updated", { detail: { profile: null } }));
  }, [clearAllTokens, deleteTokensFromDb]);

  const saveClientIdAndLogin = useCallback(() => {
    if (!clientIdInput.trim()) {
      toast({ title: "Client ID Required", variant: "destructive" });
      return;
    }
    localStorage.setItem("google_client_id", clientIdInput.trim());
    localStorage.setItem("gsc_client_id", clientIdInput.trim());
    localStorage.setItem("ga_client_id", clientIdInput.trim());
    setShowClientIdDialog(false);
    setTimeout(() => {
      void login();
    }, 500);
  }, [clientIdInput, login, toast]);

  return {
    isAuthenticated,
    isLoading,
    accessToken,
    profile,
    hasGAAccess,
    hasGSCAccess,
    hasAdsAccess,
    login,
    disconnect,
    showClientIdDialog,
    setShowClientIdDialog,
    clientIdInput,
    setClientIdInput,
    saveClientIdAndLogin,
  };
};
