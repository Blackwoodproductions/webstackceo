import { useEffect, useState } from "react";
import { ExternalLink, X, Minimize2, Maximize2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const BRON_DASHBOARD_URL = "https://dashdev.imagehosting.space";
const EXPANDED_WIDTH = 1480;
const EXPANDED_HEIGHT = 900;

const BronDashboardWrapper = () => {
  const [dashboardUrl, setDashboardUrl] = useState(BRON_DASHBOARD_URL + "/dashboard");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Extract domain ID or other params from the current URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const domainId = params.get("domain_id");
    const token = params.get("token");
    
    let url = BRON_DASHBOARD_URL;
    
    if (domainId) {
      url += `/domain/${domainId}`;
    } else {
      url += "/dashboard";
    }
    
    // Append token if available
    if (token) {
      url += `?token=${token}`;
    }
    
    setDashboardUrl(url);
  }, []);

  const handleExpand = () => {
    // Calculate center position for expanded window
    const left = (window.screen.width - EXPANDED_WIDTH) / 2;
    const top = (window.screen.height - EXPANDED_HEIGHT) / 2;
    
    // Resize and reposition the window
    try {
      window.resizeTo(EXPANDED_WIDTH, EXPANDED_HEIGHT);
      window.moveTo(Math.max(0, left), Math.max(0, top));
    } catch (e) {
      console.log("Could not resize window:", e);
    }
    
    setIsExpanded(true);
  };

  const handleClose = () => {
    // Notify parent window before closing
    if (window.opener) {
      window.opener.postMessage({ type: "BRON_POPUP_CLOSED" }, window.location.origin);
    }
    window.close();
  };

  const handleOpenInNewTab = () => {
    window.open(dashboardUrl, "_blank");
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Pre-expand view - show button to expand
  if (!isExpanded) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Branded Header Bar */}
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-12 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xs">W</span>
              </div>
              <span className="font-bold text-sm bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                webstack.ceo
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Expand CTA */}
        <main className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 max-w-sm"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="mx-auto relative"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <motion.div
                className="absolute -inset-2 rounded-2xl border-2 border-emerald-400/50"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>

            {/* Text */}
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">
                Login Successful!
              </h1>
              <p className="text-sm text-muted-foreground">
                You're now connected to BRON. Click below to expand the dashboard for the full experience.
              </p>
            </div>

            {/* Expand Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={handleExpand}
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25"
              >
                Open Full Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* Alternative option */}
            <p className="text-xs text-muted-foreground">
              Or{" "}
              <button
                onClick={handleOpenInNewTab}
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
              >
                open in a new tab
              </button>
            </p>
          </motion.div>
        </main>

        {/* Footer accent */}
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 opacity-50" />
      </div>
    );
  }

  // Expanded view - show dashboard
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Branded Header Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">W</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                webstack.ceo
              </span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">
                BRON Dashboard
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenInNewTab}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              New Tab
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMaximize}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Container */}
      <main className={`flex-1 ${isMaximized ? '' : 'p-2'}`}>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`h-full ${isMaximized ? '' : 'rounded-lg border border-border/40 overflow-hidden bg-card'}`}
        >
          <iframe
            src={dashboardUrl}
            className="w-full h-full border-0"
            style={{ minHeight: isMaximized ? 'calc(100vh - 56px)' : 'calc(100vh - 72px)' }}
            title="BRON Dashboard"
            allow="clipboard-write"
          />
        </motion.div>
      </main>

      {/* Footer accent */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 opacity-50" />
    </div>
  );
};

export default BronDashboardWrapper;
