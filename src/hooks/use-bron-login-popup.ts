import { useCallback, useEffect, useRef, useState } from "react";

type UseBronLoginPopupOptions = {
  loginUrl: string;
  dashboardUrl: string;
  /** Called when login is detected */
  onLoggedIn: () => void;
  pollIntervalMs?: number;
};

/**
 * Opens a BRON login popup and detects successful login.
 * Uses multiple detection strategies since cross-origin restrictions prevent direct URL reading.
 */
export function useBronLoginPopup({
  loginUrl,
  dashboardUrl,
  onLoggedIn,
  pollIntervalMs = 300,
}: UseBronLoginPopupOptions) {
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);
  const hasTriggeredLogin = useRef(false);
  const loginStartTime = useRef<number>(0);
  const lastUrlCheck = useRef<string>("");

  const [isWaitingForLogin, setIsWaitingForLogin] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);

  const triggerLoginSuccess = useCallback(() => {
    if (hasTriggeredLogin.current) return;
    hasTriggeredLogin.current = true;
    
    console.log("[BRON] Login success detected, closing popup");
    
    // Close the popup immediately
    if (popupRef.current && !popupRef.current.closed) {
      try {
        popupRef.current.close();
      } catch {
        // ignore
      }
    }
    popupRef.current = null;
    
    // Clear polling
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    
    setIsWaitingForLogin(false);
    onLoggedIn();
  }, [onLoggedIn]);

  const closePopup = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      try {
        popupRef.current.close();
      } catch {
        // ignore
      }
    }
    popupRef.current = null;
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

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

  const openPopup = useCallback(() => {
    setPopupBlocked(false);
    hasTriggeredLogin.current = false;
    loginStartTime.current = Date.now();
    lastUrlCheck.current = "";

    const popupWidth = 600;
    const popupHeight = 700;
    const left = (window.screenX ?? 0) + (window.outerWidth - popupWidth) / 2;
    const top = (window.screenY ?? 0) + (window.outerHeight - popupHeight) / 2;

    closePopup();

    const popup = window.open(
      loginUrl,
      "bron_login",
      `popup=yes,width=${popupWidth},height=${popupHeight},left=${Math.max(0, left)},top=${Math.max(0, top)}`
    );

    if (!popup) {
      setPopupBlocked(true);
      setIsWaitingForLogin(false);
      return false;
    }

    popupRef.current = popup;
    setIsWaitingForLogin(true);
    return true;
  }, [closePopup, loginUrl]);

  // Poll for login success
  useEffect(() => {
    if (!isWaitingForLogin) return;

    let consecutiveRedirectDetections = 0;

    const checkPopup = () => {
      const popup = popupRef.current;
      
      // If popup was closed by user
      if (!popup || popup.closed) {
        console.log("[BRON] Popup closed");
        
        // Check if enough time has passed - user may have logged in
        const elapsed = Date.now() - loginStartTime.current;
        if (elapsed > 3000) {
          // Assume login might have succeeded if popup was open long enough
          // The iframe will verify the actual auth state
          console.log("[BRON] Popup closed after interaction, assuming login success");
          triggerLoginSuccess();
          return;
        }
        
        setIsWaitingForLogin(false);
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
        return;
      }

      // Strategy 1: Try to read the popup URL directly
      try {
        const popupUrl = popup.location.href;
        
        // Track URL changes
        if (popupUrl !== lastUrlCheck.current) {
          console.log("[BRON] Popup URL changed:", popupUrl);
          lastUrlCheck.current = popupUrl;
        }
        
        // If URL is readable and contains dashboard (not login page)
        if (popupUrl && popupUrl.includes("dashdev.imagehosting.space")) {
          // Check if we're no longer on the login page
          if (!popupUrl.includes("/login") && !popupUrl.includes("?next=")) {
            console.log("[BRON] Login detected - dashboard URL detected:", popupUrl);
            triggerLoginSuccess();
            return;
          }
        }
        
        // Check for dashboard-specific URL patterns
        if (popupUrl && (
          popupUrl.includes("/dashboard") ||
          popupUrl.includes("domain_id=") ||
          popupUrl.includes("/analysis") ||
          popupUrl.includes("/reports")
        )) {
          console.log("[BRON] Login detected - dashboard pattern in URL:", popupUrl);
          triggerLoginSuccess();
          return;
        }
      } catch {
        // Cross-origin - expected, try other strategies
        consecutiveRedirectDetections++;
        
        // If we consistently can't read the URL for a while after initially being able to,
        // it likely means a cross-origin redirect happened (login -> dashboard)
        if (consecutiveRedirectDetections > 3) {
          const elapsed = Date.now() - loginStartTime.current;
          if (elapsed > 4000) {
            console.log("[BRON] Cross-origin detected after initial access - likely redirected to dashboard");
            triggerLoginSuccess();
            return;
          }
        }
      }

      // Strategy 2: Check if we can access location.origin
      try {
        const origin = popup.location.origin;
        if (origin && origin.includes("dashdev.imagehosting.space")) {
          try {
            const path = popup.location.pathname;
            if (path && !path.includes("login")) {
              console.log("[BRON] Login detected via origin+path check");
              triggerLoginSuccess();
              return;
            }
          } catch {
            // pathname not accessible - after enough time, assume success
            const elapsed = Date.now() - loginStartTime.current;
            if (elapsed > 6000) {
              console.log("[BRON] Assuming login success after extended timeout on BRON domain");
              triggerLoginSuccess();
              return;
            }
          }
        }
      } catch {
        // Still cross-origin
      }

      // Strategy 3: Time-based fallback
      // If the popup has been open for a while without closing, assume login succeeded
      const elapsed = Date.now() - loginStartTime.current;
      if (elapsed > 15000) {
        // After 15 seconds, check if popup is still open and hasn't errored
        try {
          if (popup && !popup.closed) {
            console.log("[BRON] Extended timeout - assuming login success");
            triggerLoginSuccess();
            return;
          }
        } catch {
          // If we can't even check, assume success
          triggerLoginSuccess();
          return;
        }
      }
    };

    // Start polling
    pollRef.current = window.setInterval(checkPopup, pollIntervalMs);

    // Initial check after a brief delay
    setTimeout(checkPopup, 100);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isWaitingForLogin, pollIntervalMs, triggerLoginSuccess]);

  // Listen for postMessage from BRON (if they ever implement it)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from BRON domain
      if (event.origin.includes("dashdev.imagehosting.space") || 
          event.origin.includes("imagehosting.space")) {
        if (event.data?.type === "BRON_LOGIN_SUCCESS" || 
            event.data?.loggedIn ||
            event.data?.authenticated) {
          console.log("[BRON] Login detected via postMessage");
          triggerLoginSuccess();
        }
      }
      
      // Also accept our own callback messages
      if (event.origin === window.location.origin) {
        if (event.data?.type === "BRON_AUTH_SUCCESS") {
          console.log("[BRON] Login detected via callback postMessage");
          triggerLoginSuccess();
        }
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

  return {
    popupRef,
    isWaitingForLogin,
    popupBlocked,
    openPopup,
    closePopup,
    focusPopup,
  };
}