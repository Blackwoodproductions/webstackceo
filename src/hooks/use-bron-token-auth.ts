import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BRON_TOKEN_KEY = "bron_auth_token";
const BRON_SESSION_KEY = "bron_session_data";

export interface BronSession {
  token: string;
  domain: string;
  domainId: string;
  userId: string;
  embedToken: string | null; // Token for embedding BRON dashboard
  expiresAt: number;
}

interface UseBronTokenAuthOptions {
  domain: string;
  onAuthenticated: (session: BronSession) => void;
  onLogout?: () => void;
}

/**
 * Token-based authentication for BRON.
 * Creates server-side sessions and manages embed tokens.
 */
export function useBronTokenAuth({
  domain,
  onAuthenticated,
  onLogout,
}: UseBronTokenAuthOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<BronSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // Load and validate existing session on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initSession = async () => {
      try {
        const storedToken = localStorage.getItem(BRON_TOKEN_KEY);
        const storedSession = localStorage.getItem(BRON_SESSION_KEY);

        if (!storedToken || !storedSession) {
          console.log("[BRON Token] No stored session");
          setIsLoading(false);
          return;
        }

        const parsedSession = JSON.parse(storedSession) as BronSession;

        // Check if expired locally first
        if (parsedSession.expiresAt < Date.now()) {
          console.log("[BRON Token] Session expired locally");
          localStorage.removeItem(BRON_TOKEN_KEY);
          localStorage.removeItem(BRON_SESSION_KEY);
          setIsLoading(false);
          return;
        }

        // Validate with server
        console.log("[BRON Token] Validating stored session...");
        const { data, error } = await supabase.functions.invoke("bron-auth", {
          body: { action: "validate-session", token: storedToken },
        });

        if (error || !data?.valid) {
          console.log("[BRON Token] Session invalid:", error || data?.error);
          localStorage.removeItem(BRON_TOKEN_KEY);
          localStorage.removeItem(BRON_SESSION_KEY);
          setIsLoading(false);
          return;
        }

        // Update session with any new embed token from server
        const updatedSession: BronSession = {
          ...parsedSession,
          embedToken: data.embedToken || parsedSession.embedToken,
        };

        console.log("[BRON Token] Session valid, embedToken:", !!updatedSession.embedToken);
        localStorage.setItem(BRON_SESSION_KEY, JSON.stringify(updatedSession));
        
        setSession(updatedSession);
        setIsAuthenticated(true);
        onAuthenticated(updatedSession);
      } catch (err) {
        console.error("[BRON Token] Init error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [onAuthenticated]);

  // Create a new session after popup login
  // bronCallbackData can be a token string OR a domainId extracted from the popup URL
  const createSession = useCallback(async (bronCallbackData?: string | null): Promise<boolean> => {
    if (!domain) {
      setError("Domain is required");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Determine if the callback data is a domainId (numeric) or a token
      const isNumeric = bronCallbackData && /^\d+$/.test(bronCallbackData);
      const domainIdParam = isNumeric ? bronCallbackData : undefined;
      const tokenParam = isNumeric ? undefined : bronCallbackData;

      console.log("[BRON Token] Creating session for domain:", domain, 
        "domainId:", domainIdParam, "token:", !!tokenParam);
      
      const { data, error: invokeError } = await supabase.functions.invoke("bron-auth", {
        body: { 
          action: "create-session", 
          domain,
          bronToken: tokenParam, // Pass any token from callback
          domainId: domainIdParam, // Pass domain ID if we extracted it from popup URL
        },
      });

      if (invokeError) {
        console.error("[BRON Token] Create session error:", invokeError);
        setError(invokeError.message);
        setIsLoading(false);
        return false;
      }

      if (!data?.success || !data?.token) {
        console.error("[BRON Token] Create session failed:", data?.error);
        setError(data?.error || "Failed to create session");
        setIsLoading(false);
        return false;
      }

      const newSession: BronSession = {
        token: data.token,
        domain,
        domainId: data.domainId || domainIdParam || "",
        userId: data.userId || "",
        embedToken: data.embedToken || tokenParam || null,
        expiresAt: data.expiresAt,
      };

      // Store in localStorage
      localStorage.setItem(BRON_TOKEN_KEY, data.token);
      localStorage.setItem(BRON_SESSION_KEY, JSON.stringify(newSession));

      setSession(newSession);
      setIsAuthenticated(true);
      setIsLoading(false);

      console.log("[BRON Token] Session created, domainId:", newSession.domainId, "embedToken:", !!newSession.embedToken);
      onAuthenticated(newSession);

      return true;
    } catch (err) {
      console.error("[BRON Token] Create session exception:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsLoading(false);
      return false;
    }
  }, [domain, onAuthenticated]);

  // Logout / revoke session
  const logout = useCallback(async () => {
    const token = localStorage.getItem(BRON_TOKEN_KEY);

    if (token) {
      try {
        await supabase.functions.invoke("bron-auth", {
          body: { action: "revoke-session", token },
        });
      } catch (err) {
        console.error("[BRON Token] Revoke error:", err);
      }
    }

    localStorage.removeItem(BRON_TOKEN_KEY);
    localStorage.removeItem(BRON_SESSION_KEY);

    setSession(null);
    setIsAuthenticated(false);
    onLogout?.();

    console.log("[BRON Token] Logged out");
  }, [onLogout]);

  // Get the current token
  const getToken = useCallback(() => {
    return localStorage.getItem(BRON_TOKEN_KEY);
  }, []);

  return {
    isLoading,
    isAuthenticated,
    session,
    error,
    createSession,
    logout,
    getToken,
  };
}
