import { useCallback, useRef, useEffect } from "react";

interface PopupOAuthOptions {
  authUrl: string;
  popupName: string;
  onSuccess: (code: string, state?: string) => void;
  onError: (error: string) => void;
  popupWidth?: number;
  popupHeight?: number;
}

/**
 * Hook for handling OAuth authentication via popup window
 * Keeps users on the current page while authenticating with external providers
 */
export const usePopupOAuth = () => {
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  const openOAuthPopup = useCallback((options: PopupOAuthOptions) => {
    const {
      authUrl,
      popupName,
      onSuccess,
      onError,
      popupWidth = 520,
      popupHeight = 720,
    } = options;

    // Calculate centered position
    const left = (window.screenX ?? (window as any).screenLeft ?? 0) + (window.outerWidth - popupWidth) / 2;
    const top = (window.screenY ?? (window as any).screenTop ?? 0) + (window.outerHeight - popupHeight) / 2;

    // Open popup
    const popup = window.open(
      authUrl,
      popupName,
      `popup=yes,width=${popupWidth},height=${popupHeight},left=${Math.max(0, left)},top=${Math.max(0, top)}`
    );

    if (!popup) {
      onError("Popup blocked. Please allow popups for this site and try again.");
      return false;
    }

    popupRef.current = popup;

    // Poll for popup closure and URL changes
    pollIntervalRef.current = window.setInterval(() => {
      try {
        if (popup.closed) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          // Popup closed without completing - check if we got the code via message
          return;
        }

        // Try to read the popup URL (will throw if cross-origin)
        const popupUrl = popup.location.href;
        
        // Check if we've been redirected back with a code
        if (popupUrl.includes(window.location.origin)) {
          const urlParams = new URLSearchParams(popup.location.search);
          const code = urlParams.get("code");
          const state = urlParams.get("state");
          const error = urlParams.get("error");

          if (code) {
            popup.close();
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            onSuccess(code, state || undefined);
          } else if (error) {
            popup.close();
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            onError(error);
          }
        }
      } catch {
        // Cross-origin error - popup is on Google's domain, keep polling
      }
    }, 500);

    return true;
  }, []);

  const closePopup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
  }, []);

  return { openOAuthPopup, closePopup };
};
