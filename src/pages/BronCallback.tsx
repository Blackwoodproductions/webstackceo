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
        // Get any params from the URL - BRON may pass tokens via various param names
        const token = searchParams.get("token");
        const code = searchParams.get("code");
        const accessToken = searchParams.get("access_token");
        const sessionToken = searchParams.get("session_token");
        const embedToken = searchParams.get("embed_token");
        const authToken = searchParams.get("auth_token");
        const success = searchParams.get("success");
        const error = searchParams.get("error");

        // Get the best available token
        const bronToken = token || code || accessToken || sessionToken || embedToken || authToken;

        console.log("[BRON Callback] URL params:", {
          token: !!token,
          code: !!code,
          accessToken: !!accessToken,
          sessionToken: !!sessionToken,
          embedToken: !!embedToken,
          authToken: !!authToken,
          success,
          error,
        });

        // Handle explicit error
        if (error) {
          setStatus("error");
          setMessage(`Authentication failed: ${error}`);
          setTimeout(() => {
            try {
              if (window.opener) {
                window.opener.postMessage({ type: "BRON_AUTH_ERROR", error }, window.location.origin);
              }
              window.close();
            } catch {
              window.location.href = "/visitor-intelligence-dashboard#bron";
            }
          }, 2000);
          return;
        }

        // If we reached this callback page, BRON has redirected us here after login
        console.log("[BRON Callback] Reached callback - login successful, token:", !!bronToken);

        // Store authentication data in localStorage
        const authData = {
          authenticated: true,
          token: bronToken,
          expiry: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          authenticatedAt: new Date().toISOString(),
        };
        
        localStorage.setItem(BRON_STORAGE_KEY, JSON.stringify(authData));
        
        setStatus("success");
        setMessage("Successfully authenticated with BRON!");
        
        // Notify the opener window with the token and close this popup
        setTimeout(() => {
          try {
            if (window.opener) {
              // Post message to opener with the BRON token for embedding
              window.opener.postMessage({ 
                type: "BRON_AUTH_SUCCESS", 
                token: bronToken,
              }, window.location.origin);
              window.close();
            } else {
              // Not a popup, redirect to dashboard
              window.location.href = "/visitor-intelligence-dashboard#bron";
            }
          } catch (e) {
            console.log("[BRON Callback] Could not close popup:", e);
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
