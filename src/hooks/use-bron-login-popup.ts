import { useCallback, useEffect, useRef, useState } from "react";

type UseBronLoginPopupOptions = {
  loginUrl: string;
  dashboardUrl: string;
  /** Called when login is detected (popup URL changed from /login to dashboard) */
  onLoggedIn: () => void;
  pollIntervalMs?: number;
};

/**
 * Opens a BRON login popup and detects successful login by monitoring URL changes.
 * When the popup navigates away from the login page to the dashboard, we consider login successful.
 */
export function useBronLoginPopup({
  loginUrl,
  dashboardUrl,
  onLoggedIn,
  pollIntervalMs = 500,
}: UseBronLoginPopupOptions) {
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);
  const hasTriggeredLogin = useRef(false);

  const [isWaitingForLogin, setIsWaitingForLogin] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);

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

    const popupWidth = 600;
    const popupHeight = 700;
    const left = (window.screenX ?? 0) + (window.outerWidth - popupWidth) / 2;
    const top = (window.screenY ?? 0) + (window.outerHeight - popupHeight) / 2;

    // Close any previous popup
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

  // Poll for login success by checking popup URL
  useEffect(() => {
    if (!isWaitingForLogin) return;

    const checkPopup = () => {
      const popup = popupRef.current;
      
      // If popup was closed by user
      if (!popup || popup.closed) {
        setIsWaitingForLogin(false);
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
        return;
      }

      // Try to detect URL change (login -> dashboard)
      try {
        const popupUrl = popup.location.href;
        
        // Check if we're no longer on the login page
        // This indicates successful login and redirect to dashboard
        if (popupUrl && !popupUrl.includes("/login") && popupUrl.includes("dashdev.imagehosting.space")) {
          console.log("[BRON] Login detected, popup URL:", popupUrl);
          
          if (!hasTriggeredLogin.current) {
            hasTriggeredLogin.current = true;
            
            // Small delay to ensure cookies are set
            setTimeout(() => {
              closePopup();
              setIsWaitingForLogin(false);
              onLoggedIn();
            }, 500);
          }
          return;
        }
      } catch {
        // Cross-origin error is expected before/during login
        // We can't read the URL until same-origin or it redirects
      }

      // Also try to detect by checking if popup has dashboard content
      try {
        const popupDoc = popup.document;
        // If we can access the document and it has dashboard elements
        if (popupDoc) {
          const dashboardIndicator = popupDoc.querySelector('.dashboard, .user-menu, .nav-profile, [data-logged-in]');
          if (dashboardIndicator && !hasTriggeredLogin.current) {
            console.log("[BRON] Login detected via DOM inspection");
            hasTriggeredLogin.current = true;
            
            setTimeout(() => {
              closePopup();
              setIsWaitingForLogin(false);
              onLoggedIn();
            }, 500);
            return;
          }
        }
      } catch {
        // Cross-origin DOM access blocked - expected
      }
    };

    // Initial check
    checkPopup();

    pollRef.current = window.setInterval(checkPopup, pollIntervalMs);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [closePopup, dashboardUrl, isWaitingForLogin, onLoggedIn, pollIntervalMs]);

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
