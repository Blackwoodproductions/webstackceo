import { useCallback, useEffect, useRef, useState } from "react";

const BRON_STORAGE_KEY = "bron_dashboard_auth";
const BRON_DASHBOARD_DOMAIN = "dashdev.imagehosting.space";

type UseBronApiAuthOptions = {
  domain: string;
  /** Called when login is detected, with optional token from callback */
  onLoggedIn: (bronToken?: string | null) => void;
};

/**
 * Opens a popup for BRON login and detects when login completes.
 * BRON redirects to their dashboard after login (ignores callback URL),
 * so we detect the dashboard URL in the popup to know login succeeded.
 */
export function useBronApiAuth({
  domain,
  onLoggedIn,
}: UseBronApiAuthOptions) {
  const popupRef = useRef<Window | null>(null);
  const checkIntervalRef = useRef<number | null>(null);
  const hasTriggeredLogin = useRef(false);

  const [isWaitingForLogin, setIsWaitingForLogin] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);

  // Trigger login success with optional token - redirect popup to wrapper instead of closing
  const triggerLoginSuccess = useCallback((bronToken?: string | null, domainId?: string | null) => {
    if (hasTriggeredLogin.current) return;
    hasTriggeredLogin.current = true;

    console.log("[BRON Auth] Login confirmed, redirecting popup to wrapper. Token:", !!bronToken, "DomainId:", domainId);

    // Redirect popup to our wrapper page instead of closing it
    if (popupRef.current && !popupRef.current.closed) {
      try {
        const wrapperUrl = new URL("/bron-dashboard", window.location.origin);
        if (domainId) {
          wrapperUrl.searchParams.set("domain_id", domainId);
        }
        if (bronToken) {
          wrapperUrl.searchParams.set("token", bronToken);
        }
        popupRef.current.location.href = wrapperUrl.toString();
        console.log("[BRON Auth] Redirected popup to:", wrapperUrl.toString());
      } catch (e) {
        console.error("[BRON Auth] Failed to redirect popup:", e);
      }
    }
    // Keep popup reference - don't nullify
    // popupRef.current = null;

    // Stop checking
    if (checkIntervalRef.current) {
      window.clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    setIsWaitingForLogin(false);
    onLoggedIn(bronToken);
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

  // Open login popup
  const openPopup = useCallback(() => {
    setPopupBlocked(false);
    hasTriggeredLogin.current = false;

    const popupWidth = 600;
    const popupHeight = 700;
    const left = (window.screenX ?? 0) + (window.outerWidth - popupWidth) / 2;
    const top = (window.screenY ?? 0) + (window.outerHeight - popupHeight) / 2;

    closePopup();

    // Open BRON login directly - they redirect to dashboard after login
    const loginUrl = `https://${BRON_DASHBOARD_DOMAIN}/login`;

    console.log("[BRON Auth] Opening popup:", loginUrl);

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
    setIsWaitingForLogin(true);
    return true;
  }, [closePopup]);

  // Monitor popup for dashboard redirect (indicates login success)
  useEffect(() => {
    if (!isWaitingForLogin) return;

    const checkPopup = () => {
      const popup = popupRef.current;
      
      // If popup closed by user
      if (!popup || popup.closed) {
        console.log("[BRON Auth] Popup closed");
        setIsWaitingForLogin(false);
        if (checkIntervalRef.current) {
          window.clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        return;
      }

      // Try to read popup URL - this works when popup is on same-origin
      // or when we can see the domain (cross-origin shows domain only)
      try {
        const popupUrl = popup.location.href;
        
        // Check if popup is now on our callback page
        if (popupUrl.includes(window.location.origin + "/bron-callback")) {
          console.log("[BRON Auth] Popup reached our callback");
          // Let the callback page handle it via postMessage
          return;
        }
        
        // Check if popup navigated to BRON dashboard (indicates successful login)
        // URL pattern: dashdev.imagehosting.space/domain/... or /dashboard
        if (popupUrl.includes(BRON_DASHBOARD_DOMAIN) && 
            (popupUrl.includes("/domain/") || popupUrl.includes("/dashboard"))) {
          console.log("[BRON Auth] Detected dashboard URL - login successful!", popupUrl);
          
          // Extract domain ID from URL if present (e.g., /domain/112619)
          const domainMatch = popupUrl.match(/\/domain\/(\d+)/);
          const domainId = domainMatch ? domainMatch[1] : null;
          
          // Try to get any token from URL params
          try {
            const url = new URL(popupUrl);
            const token = url.searchParams.get("token") || 
                         url.searchParams.get("auth_token") ||
                         url.searchParams.get("access_token");
            
            console.log("[BRON Auth] Extracted domainId:", domainId, "token:", !!token);
            triggerLoginSuccess(token, domainId);
          } catch {
            triggerLoginSuccess(null, domainId);
          }
          return;
        }
      } catch {
        // Cross-origin - can't read URL details, but can try location.host
        try {
          const host = popup.location.host;
          // If we can see the host and it's BRON's dashboard domain
          if (host === BRON_DASHBOARD_DOMAIN) {
            // Can't read full URL but we know they're on dashboard
            console.log("[BRON Auth] Popup is on BRON dashboard (cross-origin)");
            // We'll need to wait for explicit close or postMessage
          }
        } catch {
          // Complete cross-origin block - normal during login on external domain
        }
      }
    };

    checkIntervalRef.current = window.setInterval(checkPopup, 500);

    return () => {
      if (checkIntervalRef.current) {
        window.clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [isWaitingForLogin, triggerLoginSuccess]);

  // Listen for postMessage from callback page
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === "BRON_AUTH_SUCCESS") {
        console.log("[BRON Auth] Received auth success via postMessage, token:", !!event.data?.token);
        triggerLoginSuccess(event.data?.token);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [triggerLoginSuccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        window.clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
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
    isWaitingForLogin,
    popupBlocked,
    openPopup,
    closePopup,
    focusPopup,
  };
}
