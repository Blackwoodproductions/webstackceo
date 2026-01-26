import { useCallback, useEffect, useRef, useState } from "react";

type UseBronLoginPopupOptions = {
  loginUrl: string;
  /** Called when the popup is detected as closed. */
  onClosed?: () => void;
  pollIntervalMs?: number;
};

/**
 * Opens a BRON login popup and tracks its lifecycle.
 *
 * IMPORTANT:
 * We intentionally do NOT attempt to auto-detect "logged in" status, because BRON
 * session cookies are cross-site relative to this app and cannot be reliably verified.
 */
export function useBronLoginPopup({
  loginUrl,
  onClosed,
  pollIntervalMs = 500,
}: UseBronLoginPopupOptions) {
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);

  const [isWaitingForLogin, setIsWaitingForLogin] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [didClose, setDidClose] = useState(false);

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
    setDidClose(false);

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

  // Poll only for popup close.
  useEffect(() => {
    if (!isWaitingForLogin) return;

    pollRef.current = window.setInterval(() => {
      const popup = popupRef.current;
      if (!popup) return;
      if (popup.closed) {
        closePopup();
        setIsWaitingForLogin(false);
        setDidClose(true);
        onClosed?.();
      }
    }, pollIntervalMs);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [closePopup, isWaitingForLogin, onClosed, pollIntervalMs]);

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
    didClose,
    openPopup,
    closePopup,
    focusPopup,
  };
}
