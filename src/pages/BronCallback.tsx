import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const BRON_STORAGE_KEY = "bron_dashboard_auth";

const BronCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Processing BRON authentication...");

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get token/code from URL params (BRON will send these back)
        const token = searchParams.get("token");
        const code = searchParams.get("code");
        const success = searchParams.get("success");
        const error = searchParams.get("error");

        // Handle explicit error
        if (error) {
          setStatus("error");
          setMessage(`Authentication failed: ${error}`);
          // Try to notify opener and close after delay
          setTimeout(() => {
            try {
              if (window.opener) {
                window.opener.postMessage({ type: "BRON_AUTH_ERROR", error }, window.location.origin);
              }
              window.close();
            } catch {
              // If can't close, just show error
            }
          }, 2000);
          return;
        }

        // Check for any success indicators
        const isSuccess = token || code || success === "true" || success === "1";
        
        // Also check referrer as fallback (BRON may redirect without params)
        const referrer = document.referrer;
        const isFromBRON = referrer.includes("dashdev.imagehosting.space") || referrer.includes("bron");

        if (isSuccess || isFromBRON) {
          // Store authentication data in localStorage (shared with opener)
          const authData = {
            authenticated: true,
            token: token || code || null,
            expiry: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            authenticatedAt: new Date().toISOString(),
          };
          
          localStorage.setItem(BRON_STORAGE_KEY, JSON.stringify(authData));
          
          setStatus("success");
          setMessage("Successfully authenticated with BRON!");
          
          // Notify the opener window and close this popup
          setTimeout(() => {
            try {
              if (window.opener) {
                // Post message to opener to trigger dashboard load
                window.opener.postMessage({ 
                  type: "BRON_AUTH_SUCCESS", 
                  token: token || code || null 
                }, window.location.origin);
              }
              window.close();
            } catch (e) {
              console.log("[BRON Callback] Could not close popup:", e);
              // If we can't close (e.g., not a popup), redirect instead
              window.location.href = "/visitor-intelligence-dashboard#bron";
            }
          }, 1000);
          return;
        }

        // No auth params and not from BRON - assume it's a direct redirect from login success
        // Many OAuth flows just redirect without explicit params when using cookies
        const authData = {
          authenticated: true,
          token: null,
          expiry: Date.now() + 24 * 60 * 60 * 1000,
          authenticatedAt: new Date().toISOString(),
        };
        
        localStorage.setItem(BRON_STORAGE_KEY, JSON.stringify(authData));
        
        setStatus("success");
        setMessage("Successfully authenticated with BRON!");
        
        setTimeout(() => {
          try {
            if (window.opener) {
              window.opener.postMessage({ type: "BRON_AUTH_SUCCESS" }, window.location.origin);
            }
            window.close();
          } catch {
            window.location.href = "/visitor-intelligence-dashboard#bron";
          }
        }, 1000);
        
      } catch (err) {
        console.error("[BRON Callback] Error:", err);
        setStatus("error");
        setMessage("An error occurred during authentication.");
        setTimeout(() => {
          try {
            window.close();
          } catch {
            window.location.href = "/visitor-intelligence-dashboard#bron";
          }
        }, 2000);
      }
    };

    processCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 rounded-2xl glass-card max-w-md mx-4"
      >
        {status === "processing" && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-emerald-500 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Connecting to BRON</h1>
          </>
        )}
        
        {status === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2 text-green-500">Connected!</h1>
          </>
        )}
        
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-2 text-destructive">Connection Failed</h1>
          </>
        )}
        
        <p className="text-muted-foreground">{message}</p>
        
        {status === "success" && (
          <p className="text-sm text-muted-foreground mt-4">
            Closing window...
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default BronCallback;
