import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const BRON_STORAGE_KEY = "bron_dashboard_auth";

const BronCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
          setTimeout(() => {
            navigate("/visitor-intelligence-dashboard#bron");
          }, 3000);
          return;
        }

        // If we have a token, code, or success flag - consider authenticated
        if (token || code || success === "true" || success === "1") {
          // Store authentication data
          const authData = {
            authenticated: true,
            token: token || code || null,
            expiry: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            authenticatedAt: new Date().toISOString(),
          };
          
          localStorage.setItem(BRON_STORAGE_KEY, JSON.stringify(authData));
          
          setStatus("success");
          setMessage("Successfully authenticated with BRON!");
          
          // Redirect back to dashboard
          setTimeout(() => {
            navigate("/visitor-intelligence-dashboard#bron");
          }, 1500);
          return;
        }

        // If no explicit token but we got redirected here, assume success
        // (BRON may redirect without params if using cookie-based sessions)
        const referrer = document.referrer;
        if (referrer.includes("dashdev.imagehosting.space") || referrer.includes("bron")) {
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
            navigate("/visitor-intelligence-dashboard#bron");
          }, 1500);
          return;
        }

        // No auth params detected - might be direct access
        setStatus("error");
        setMessage("No authentication data received. Please try logging in again.");
        setTimeout(() => {
          navigate("/visitor-intelligence-dashboard#bron");
        }, 3000);
        
      } catch (err) {
        console.error("[BRON Callback] Error:", err);
        setStatus("error");
        setMessage("An error occurred during authentication.");
        setTimeout(() => {
          navigate("/visitor-intelligence-dashboard#bron");
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 rounded-2xl glass-card max-w-md mx-4"
      >
        {status === "processing" && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-cyan-500 animate-spin" />
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
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2 text-red-500">Connection Failed</h1>
          </>
        )}
        
        <p className="text-muted-foreground">{message}</p>
        
        {status !== "processing" && (
          <p className="text-sm text-muted-foreground mt-4">
            Redirecting to dashboard...
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default BronCallback;
