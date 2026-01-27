import { useCallback, useEffect, useRef, useState } from "react";

const BRON_STORAGE_KEY = "bron_dashboard_auth";

type UseBronApiAuthOptions = {
  domain: string;
  /** Called when login is detected */
  onLoggedIn: () => void;
};

/**
 * Opens a popup for BRON login and waits for the callback redirect.
 * Does NOT use API polling since the API returns domain data regardless of session state.
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

  // Trigger login success
  const triggerLoginSuccess = useCallback(() => {
    if (hasTriggeredLogin.current) return;
    hasTriggeredLogin.current = true;

    console.log("[BRON Auth] Login confirmed");

    // Close popup if still open
    if (popupRef.current && !popupRef.current.closed) {
      try {
        popupRef.current.close();
      } catch {
        // ignore
      }
    }
    popupRef.current = null;

    // Stop checking
    if (checkIntervalRef.current) {
      window.clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    setIsWaitingForLogin(false);
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

  // Open login popup
  const openPopup = useCallback(() => {
    setPopupBlocked(false);
    hasTriggeredLogin.current = false;

    const popupWidth = 600;
    const popupHeight = 700;
    const left = (window.screenX ?? 0) + (window.outerWidth - popupWidth) / 2;
    const top = (window.screenY ?? 0) + (window.outerHeight - popupHeight) / 2;

    closePopup();

    // Build login URL - redirect to our callback after login
    const callbackUrl = `${window.location.origin}/bron-callback`;
    const loginUrl = `https://dashdev.imagehosting.space/login?next=${encodeURIComponent(callbackUrl)}`;

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

  // Check if popup was closed by user (without completing login)
  useEffect(() => {
    if (!isWaitingForLogin) return;

    const checkPopup = () => {
      if (popupRef.current?.closed) {
        console.log("[BRON Auth] Popup closed by user");
        setIsWaitingForLogin(false);
        if (checkIntervalRef.current) {
          window.clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
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
  }, [isWaitingForLogin]);

  // Listen for postMessage from callback page
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === "BRON_AUTH_SUCCESS") {
        console.log("[BRON Auth] Received auth success from callback page");
        triggerLoginSuccess();
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
