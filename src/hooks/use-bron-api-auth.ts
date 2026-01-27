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
  const popupOpenedAt = useRef<number>(0);
  const initialStatusChecked = useRef(false);

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
    initialStatusChecked.current = false;
    popupOpenedAt.current = Date.now();

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
    let wasLoggedInInitially = false;

    const poll = async () => {
      // Check if popup was closed by user
      if (popupRef.current?.closed) {
        console.log("[BRON API Auth] Popup closed by user");
        
        // Give a moment for any redirect/postMessage to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
      
      // Track initial status - if already logged in when popup opened, 
      // don't auto-close until we see a state change or user closes popup
      if (!initialStatusChecked.current) {
        initialStatusChecked.current = true;
        wasLoggedInInitially = loggedIn;
        console.log("[BRON API Auth] Initial status:", loggedIn ? "already logged in" : "not logged in");
        
        // If already logged in initially, don't auto-close - let user interact
        if (loggedIn) {
          console.log("[BRON API Auth] Already logged in - waiting for user to close popup or navigate");
          return;
        }
      }
      
      // Only trigger login success if:
      // 1. User was NOT logged in initially and now IS logged in (fresh login)
      // 2. OR enough time has passed (user had chance to interact)
      const timeSinceOpen = Date.now() - popupOpenedAt.current;
      const minInteractionTime = 5000; // 5 seconds minimum
      
      if (loggedIn && isActive) {
        if (!wasLoggedInInitially) {
          // Fresh login detected
          console.log("[BRON API Auth] Fresh login detected");
          triggerLoginSuccess();
        } else if (timeSinceOpen > minInteractionTime) {
          // Was already logged in but user has had time to interact
          console.log("[BRON API Auth] User confirmed existing session");
          triggerLoginSuccess();
        }
      }
    };

    // Start polling after a delay to let popup load
    const initialTimer = setTimeout(poll, 2000);

    // Continue polling
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
