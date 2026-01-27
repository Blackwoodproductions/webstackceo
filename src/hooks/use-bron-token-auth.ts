import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BRON_TOKEN_KEY = "bron_auth_token";
const BRON_SESSION_KEY = "bron_session_data";

interface BronSession {
  token: string;
  domain: string;
  domainId: string;
  expiresAt: number;
}

interface UseBronTokenAuthOptions {
  domain: string;
  onAuthenticated: (session: BronSession) => void;
  onLogout?: () => void;
}

/**
 * Token-based authentication for BRON.
 * Creates server-side sessions and validates tokens.
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

        console.log("[BRON Token] Session valid");
        setSession(parsedSession);
        setIsAuthenticated(true);
        onAuthenticated(parsedSession);
      } catch (err) {
        console.error("[BRON Token] Init error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [onAuthenticated]);

  // Create a new session after login
  const createSession = useCallback(async (): Promise<boolean> => {
    if (!domain) {
      setError("Domain is required");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("[BRON Token] Creating session for domain:", domain);
      
      const { data, error: invokeError } = await supabase.functions.invoke("bron-auth", {
        body: { action: "create-session", domain },
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
        domainId: data.domainId,
        expiresAt: data.expiresAt,
      };

      // Store in localStorage
      localStorage.setItem(BRON_TOKEN_KEY, data.token);
      localStorage.setItem(BRON_SESSION_KEY, JSON.stringify(newSession));

      setSession(newSession);
      setIsAuthenticated(true);
      setIsLoading(false);

      console.log("[BRON Token] Session created successfully");
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
