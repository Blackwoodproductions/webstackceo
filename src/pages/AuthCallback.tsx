import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

/**
 * Auth callback page that handles OAuth redirects.
 * If opened in a popup, notifies the parent and closes.
 * If opened directly, redirects to the dashboard.
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Get session from URL hash (Supabase puts tokens there)
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("[AuthCallback] Error getting session:", error);
      }

      // Check if we're in a popup
      const isPopup = window.opener && window.opener !== window;

      if (isPopup) {
        // Notify parent window that auth is complete
        try {
          window.opener.postMessage({ type: 'supabase_auth_callback', success: !!session }, window.location.origin);
        } catch (e) {
          console.error("[AuthCallback] Failed to post message to opener:", e);
        }
        // Close the popup
        window.close();
      } else {
        // Not a popup - redirect to dashboard
        if (session) {
          navigate('/visitor-intelligence-dashboard');
        } else {
          navigate('/auth');
        }
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-primary flex items-center justify-center shadow-2xl shadow-primary/30">
          <motion.div
            className="w-8 h-8 border-4 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Completing sign in...</p>
          <p className="text-sm text-muted-foreground mt-1">Please wait</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthCallback;
