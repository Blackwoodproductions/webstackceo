import { useState, useEffect, useCallback, useRef } from "react";
import { usePopupOAuth } from "./use-popup-oauth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

// Combined scopes for GA + GSC in a single OAuth prompt
const UNIFIED_GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/webmasters",
].join(" ");

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
 * Stores a shared token that can be used by both services.
 */
export const useUnifiedGoogleAuth = (): UseUnifiedGoogleAuthReturn => {
  const { toast } = useToast();
  const { openOAuthPopup } = usePopupOAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ name?: string; email?: string; picture?: string } | null>(null);
  const [hasGAAccess, setHasGAAccess] = useState(false);
  const [hasGSCAccess, setHasGSCAccess] = useState(false);

  const [showClientIdDialog, setShowClientIdDialog] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");

  // Check stored token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("unified_google_token");
    const tokenExpiry = localStorage.getItem("unified_google_expiry");
    const storedScopes = localStorage.getItem("unified_google_scopes") || "";
    const storedProfile = localStorage.getItem("unified_google_profile");

    if (storedToken && tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry);
      const timeRemaining = expiryTime - Date.now();

      if (timeRemaining > 0) {
        console.log("[UnifiedAuth] Found valid stored token, expires in:", Math.round(timeRemaining / 1000 / 60), "minutes");
        setAccessToken(storedToken);
        setIsAuthenticated(true);
        setHasGAAccess(storedScopes.includes("analytics"));
        setHasGSCAccess(storedScopes.includes("webmasters"));

        // Also sync to individual storage for backwards compatibility
        localStorage.setItem("ga_access_token", storedToken);
        localStorage.setItem("ga_token_expiry", tokenExpiry);
        localStorage.setItem("gsc_access_token", storedToken);
        localStorage.setItem("gsc_token_expiry", tokenExpiry);

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
        (async () => {
          try {
            const redirectUri = getOAuthRedirectUri();
            const tokenRes = await supabase.functions.invoke("google-oauth-token", {
              body: { code, codeVerifier: verifier, redirectUri },
            });

            if (tokenRes.error || tokenRes.data?.error) {
              throw new Error(tokenRes.data?.error_description || tokenRes.error?.message || "Token exchange failed");
            }

            const { access_token, expires_in, scope } = tokenRes.data;
            await storeTokens(access_token, expires_in || 3600, scope || "");

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
        })();
        return;
      }
    }

    setIsLoading(false);
  }, [toast]);

  const clearAllTokens = () => {
    localStorage.removeItem("unified_google_token");
    localStorage.removeItem("unified_google_expiry");
    localStorage.removeItem("unified_google_scopes");
    localStorage.removeItem("unified_google_verifier");
    localStorage.removeItem("unified_google_profile");
    // Clear individual tokens too
    localStorage.removeItem("ga_access_token");
    localStorage.removeItem("ga_token_expiry");
    localStorage.removeItem("ga_code_verifier");
    localStorage.removeItem("gsc_access_token");
    localStorage.removeItem("gsc_token_expiry");
    localStorage.removeItem("gsc_code_verifier");
    localStorage.removeItem("gsc_google_profile");
  };

  const storeTokens = async (token: string, expiresIn: number, scope: string) => {
    const expiryTime = Date.now() + expiresIn * 1000;

    // Store unified token
    localStorage.setItem("unified_google_token", token);
    localStorage.setItem("unified_google_expiry", expiryTime.toString());
    localStorage.setItem("unified_google_scopes", scope);
    localStorage.removeItem("unified_google_verifier");

    // Sync to individual storage for backwards compatibility
    localStorage.setItem("ga_access_token", token);
    localStorage.setItem("ga_token_expiry", expiryTime.toString());
    localStorage.setItem("gsc_access_token", token);
    localStorage.setItem("gsc_token_expiry", expiryTime.toString());

    setAccessToken(token);
    setIsAuthenticated(true);
    setHasGAAccess(scope.includes("analytics"));
    setHasGSCAccess(scope.includes("webmasters"));

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
  };

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

      const { access_token, expires_in, scope } = tokenRes.data;
      await storeTokens(access_token, expires_in || 3600, scope || "");

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
  }, [toast]);

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
      authUrl.searchParams.set("access_type", "online");
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

  const disconnect = useCallback(() => {
    clearAllTokens();
    setAccessToken(null);
    setIsAuthenticated(false);
    setProfile(null);
    setHasGAAccess(false);
    setHasGSCAccess(false);
    window.dispatchEvent(new CustomEvent("gsc-profile-updated", { detail: { profile: null } }));
  }, []);

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
    login,
    disconnect,
    showClientIdDialog,
    setShowClientIdDialog,
    clientIdInput,
    setClientIdInput,
    saveClientIdAndLogin,
  };
};
