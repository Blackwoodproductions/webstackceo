import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type UseBronLoginPopupOptions = {
  domain?: string;
  loginUrl: string;
  onLoggedIn: () => void;
  pollIntervalMs?: number;
  maxPollAttempts?: number;
};

/**
 * Opens a BRON login popup and detects login via the backend "bron-login-status" function.
 * This avoids unreliable cross-origin DOM/URL checks.
 */
export function useBronLoginPopup({
  domain,
  loginUrl,
  onLoggedIn,
  pollIntervalMs = 2000,
  maxPollAttempts = 60,
}: UseBronLoginPopupOptions) {
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);

  const [isWaitingForLogin, setIsWaitingForLogin] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);

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
    setPollError(null);
    setPopupBlocked(false);

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

  // Poll backend login status instead of trying cross-origin DOM checks.
  useEffect(() => {
    if (!isWaitingForLogin) return;
    if (!domain) return;

    let attempts = 0;
    let cancelled = false;

    const tick = async () => {
      attempts += 1;
      if (cancelled) return;

      // If user closed the popup, stop polling.
      if (popupRef.current && popupRef.current.closed) {
        closePopup();
        setIsWaitingForLogin(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("bron-login-status", {
          body: { domain },
        });

        if (cancelled) return;

        if (error) {
          setPollError(error.message || "Login status check failed");
        } else if (data?.loggedIn) {
          // Logged in: notify and close.
          onLoggedIn();
          closePopup();
          setIsWaitingForLogin(false);
          return;
        }
      } catch (e) {
        if (!cancelled) {
          setPollError(e instanceof Error ? e.message : "Login status check failed");
        }
      }

      if (attempts >= maxPollAttempts) {
        setIsWaitingForLogin(false);
        return;
      }
    };

    // Immediate first tick
    void tick();

    pollRef.current = window.setInterval(() => {
      void tick();
    }, pollIntervalMs);

    return () => {
      cancelled = true;
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [closePopup, domain, isWaitingForLogin, maxPollAttempts, onLoggedIn, pollIntervalMs]);

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
    pollError,
    openPopup,
    closePopup,
    focusPopup,
  };
}
