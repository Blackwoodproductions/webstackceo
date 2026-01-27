import { useEffect, useState } from "react";
import { ExternalLink, X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const BRON_DASHBOARD_URL = "https://dashdev.imagehosting.space";

const BronDashboardWrapper = () => {
  const [dashboardUrl, setDashboardUrl] = useState(BRON_DASHBOARD_URL + "/dashboard");
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
        <div className={`h-full ${isMaximized ? '' : 'rounded-lg border border-border/40 overflow-hidden bg-card'}`}>
          <iframe
            src={dashboardUrl}
            className="w-full h-full border-0"
            style={{ minHeight: isMaximized ? 'calc(100vh - 56px)' : 'calc(100vh - 72px)' }}
            title="BRON Dashboard"
            allow="clipboard-write"
          />
        </div>
      </main>

      {/* Footer accent */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 opacity-50" />
    </div>
  );
};

export default BronDashboardWrapper;
