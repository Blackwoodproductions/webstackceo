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

    const checkPopup = () => {
      const popup = popupRef.current;
      
      // If popup was closed by user
      if (!popup || popup.closed) {
        console.log("[BRON] Popup closed by user");
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
        
        // If URL is readable and we're on the dashboard (not login page)
        if (popupUrl && 
            popupUrl.includes("dashdev.imagehosting.space") && 
            !popupUrl.includes("/login")) {
          console.log("[BRON] Login detected via URL:", popupUrl);
          triggerLoginSuccess();
          return;
        }
      } catch {
        // Cross-origin - expected, try other strategies
      }

      // Strategy 2: Check if URL throws a different error pattern after redirect
      // Some browsers allow checking if location exists even if not readable
      try {
        // If we can access location.origin without error, check it
        const origin = popup.location.origin;
        if (origin && origin.includes("dashdev.imagehosting.space")) {
          // We're on the right domain, try to check pathname
          try {
            const path = popup.location.pathname;
            if (path && !path.includes("login")) {
              console.log("[BRON] Login detected via origin+path check");
              triggerLoginSuccess();
              return;
            }
          } catch {
            // pathname not accessible but origin was - might still be logged in
            // After enough time, assume login worked if we're on the domain
            const elapsed = Date.now() - loginStartTime.current;
            if (elapsed > 5000) {
              console.log("[BRON] Assuming login success after timeout on BRON domain");
              triggerLoginSuccess();
              return;
            }
          }
        }
      } catch {
        // Still cross-origin or different domain
      }

      // Strategy 3: Try to access popup document (same-origin only)
      try {
        const doc = popup.document;
        if (doc && doc.body) {
          // If we can access the document, check for dashboard indicators
          const body = doc.body;
          const text = body.innerText || "";
          const html = body.innerHTML || "";
          
          // Check for dashboard elements
          if (html.includes("domain_id") || 
              html.includes("Domain Options") ||
              html.includes("dashboard") ||
              text.includes("Domain Status")) {
            console.log("[BRON] Login detected via DOM content");
            triggerLoginSuccess();
            return;
          }
        }
      } catch {
        // Cross-origin DOM access blocked
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
      if (event.origin.includes("dashdev.imagehosting.space")) {
        if (event.data?.type === "BRON_LOGIN_SUCCESS" || event.data?.loggedIn) {
          console.log("[BRON] Login detected via postMessage");
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
