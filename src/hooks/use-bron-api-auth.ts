import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BRON_STORAGE_KEY = "bron_dashboard_auth";

type UseBronApiAuthOptions = {
  domain: string;
  /** Called when login is detected via API */
  onLoggedIn: () => void;
  /** Polling interval in ms (default: 2000) */
  pollIntervalMs?: number;
};

/**
 * Uses the BRON public API to detect login status.
 * Opens a popup for login and polls the API to detect when user is authenticated.
 */
export function useBronApiAuth({
  domain,
  onLoggedIn,
  pollIntervalMs = 2000,
}: UseBronApiAuthOptions) {
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);
  const hasTriggeredLogin = useRef(false);

  const [isPolling, setIsPolling] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<boolean | null>(null);

  // Check login status via the edge function
  const checkLoginStatus = useCallback(async (): Promise<boolean> => {
    if (!domain) return false;

    try {
      const { data, error } = await supabase.functions.invoke("bron-login-status", {
        body: { domain, feedit: "add" },
      });

      if (error) {
        console.error("[BRON API Auth] Error checking status:", error);
        return false;
      }

      console.log("[BRON API Auth] Status response:", data);
      return data?.loggedIn === true;
    } catch (err) {
      console.error("[BRON API Auth] Exception:", err);
      return false;
    }
  }, [domain]);

  // Trigger login success
  const triggerLoginSuccess = useCallback(() => {
    if (hasTriggeredLogin.current) return;
    hasTriggeredLogin.current = true;

    console.log("[BRON API Auth] Login detected via API");

    // Close popup if still open
    if (popupRef.current && !popupRef.current.closed) {
      try {
        popupRef.current.close();
      } catch {
        // ignore
      }
    }
    popupRef.current = null;

    // Stop polling
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }

    setIsPolling(false);
    setLastCheckResult(true);
    onLoggedIn();
  }, [onLoggedIn]);

  // Close popup helper
  const closePopup = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      try {
        popupRef.current.close();
      } catch {
        // ignore
      }
    }
    popupRef.current = null;
  }, []);

  // Open login popup with redirect to our callback
  const openPopup = useCallback(() => {
    setPopupBlocked(false);
    hasTriggeredLogin.current = false;

    const popupWidth = 600;
    const popupHeight = 700;
    const left = (window.screenX ?? 0) + (window.outerWidth - popupWidth) / 2;
    const top = (window.screenY ?? 0) + (window.outerHeight - popupHeight) / 2;

    closePopup();

    // Build login URL with redirect back to our callback
    const callbackUrl = `${window.location.origin}/bron-callback`;
    const loginUrl = `https://dashdev.imagehosting.space/login?next=${encodeURIComponent(callbackUrl)}`;

    console.log("[BRON API Auth] Opening popup with login URL:", loginUrl);

    const popup = window.open(
      loginUrl,
      "bron_login",
      `popup=yes,width=${popupWidth},height=${popupHeight},left=${Math.max(0, left)},top=${Math.max(0, top)}`
    );

    if (!popup) {
      setPopupBlocked(true);
      return false;
    }

    popupRef.current = popup;
    setIsPolling(true);
    return true;
  }, [closePopup]);

  // Poll the API to detect login
  useEffect(() => {
    if (!isPolling || !domain) return;

    let isActive = true;

    const poll = async () => {
      // Check if popup was closed
      if (popupRef.current?.closed) {
        console.log("[BRON API Auth] Popup closed, checking final status...");
        
        // Do one final check
        const loggedIn = await checkLoginStatus();
        if (loggedIn && isActive) {
          triggerLoginSuccess();
        } else if (isActive) {
          // Popup closed without login - stop polling
          setIsPolling(false);
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
        return;
      }

      // Regular poll
      const loggedIn = await checkLoginStatus();
      setLastCheckResult(loggedIn);
      
      if (loggedIn && isActive) {
        triggerLoginSuccess();
      }
    };

    // Initial check after a short delay
    const initialTimer = setTimeout(poll, 1000);

    // Start interval polling
    pollRef.current = window.setInterval(poll, pollIntervalMs);

    return () => {
      isActive = false;
      clearTimeout(initialTimer);
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isPolling, domain, checkLoginStatus, pollIntervalMs, triggerLoginSuccess]);

  // Listen for postMessage from callback page
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === "BRON_AUTH_SUCCESS") {
        console.log("[BRON API Auth] Received auth success message from callback");
        triggerLoginSuccess();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [triggerLoginSuccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      closePopup();
    };
  }, [closePopup]);

  // Focus popup helper
  const focusPopup = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      try {
        popupRef.current.focus();
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  return {
    isPolling,
    popupBlocked,
    lastCheckResult,
    openPopup,
    closePopup,
    focusPopup,
    checkLoginStatus,
  };
}
