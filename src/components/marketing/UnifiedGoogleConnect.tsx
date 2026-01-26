import { motion } from "framer-motion";
import { Activity, BarChart3, Key, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UseUnifiedGoogleAuthReturn } from "@/hooks/use-unified-google-auth";

interface UnifiedGoogleConnectProps {
  auth: UseUnifiedGoogleAuthReturn;
  variant?: "full" | "compact";
}

export const UnifiedGoogleConnect = ({ auth, variant = "full" }: UnifiedGoogleConnectProps) => {
  const {
    isLoading,
    login,
    showClientIdDialog,
    setShowClientIdDialog,
    clientIdInput,
    setClientIdInput,
    saveClientIdAndLogin,
  } = auth;

  if (variant === "compact") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-primary/5 group">
            {/* Background effects */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.02]"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            />
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/15 via-violet-500/10 to-transparent rounded-bl-[50px]" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-tr-[50px]" />
            
            {/* Floating particles */}
            <motion.div
              className="absolute top-[25%] left-[8%] w-1 h-1 rounded-full bg-primary/50"
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.3, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="absolute top-[60%] right-[12%] w-1.5 h-1.5 rounded-full bg-violet-400/40"
              animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            />

            <CardContent className="relative z-10 py-8 px-6 text-center">
              <div className="relative w-16 h-16 mx-auto mb-5">
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-violet-500 blur-lg opacity-40"
                  animate={{ opacity: [0.3, 0.5, 0.3], scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-primary via-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/30">
                  <div className="flex items-center gap-0.5">
                    <Activity className="w-5 h-5 text-white" />
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Connect Google Services
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                Link Analytics & Search Console with one authentication
              </p>

              <Button
                onClick={login}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary via-violet-500 to-cyan-500 hover:from-primary/90 hover:via-violet-500/90 hover:to-cyan-500/90 shadow-lg shadow-primary/25"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Connect with Google
              </Button>

              <div className="flex items-center justify-center gap-3 mt-4">
                <Badge variant="secondary" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/20">
                  <Activity className="w-3 h-3 mr-1" />
                  Analytics
                </Badge>
                <Badge variant="secondary" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Search Console
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <ClientIdDialog
          open={showClientIdDialog}
          onOpenChange={setShowClientIdDialog}
          clientIdInput={clientIdInput}
          setClientIdInput={setClientIdInput}
          onSave={saveClientIdAndLogin}
        />
      </>
    );
  }

  // Full variant
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-primary/5 group">
          {/* Animated background grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />

          {/* Corner gradient glows */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/15 via-violet-500/10 to-transparent rounded-bl-[80px]" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-cyan-500/15 via-violet-500/5 to-transparent rounded-tr-[60px]" />
          
          {/* Scanning line effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          {/* Floating particles */}
          <motion.div
            className="absolute top-[15%] left-[5%] w-1.5 h-1.5 rounded-full bg-primary/40"
            animate={{ opacity: [0.2, 0.7, 0.2], y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-[40%] right-[8%] w-1 h-1 rounded-full bg-violet-400/50"
            animate={{ opacity: [0.3, 0.8, 0.3], y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute bottom-[25%] left-[15%] w-1 h-1 rounded-full bg-cyan-400/40"
            animate={{ opacity: [0.2, 0.6, 0.2], y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
          />

          <CardContent className="relative z-10 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                {/* Glowing icon */}
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-cyan-500 blur-xl opacity-40"
                    animate={{ opacity: [0.3, 0.5, 0.3], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/30">
                    <div className="flex items-center gap-1">
                      <Activity className="w-6 h-6 text-white" />
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                      Connect Google Services
                    </h3>
                    <motion.span
                      className="flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Radio className="w-2.5 h-2.5" />
                      ONE-CLICK
                    </motion.span>
                  </div>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Link your Google Analytics and Search Console with a single authentication to see sessions, users, clicks, impressions, and rankings.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="secondary" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/20">
                      <Activity className="w-3 h-3 mr-1" />
                      Analytics
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Search Console
                    </Badge>
                  </div>
                </div>
              </div>

              <Button
                onClick={login}
                disabled={isLoading}
                size="lg"
                className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 hover:from-primary/90 hover:via-violet-500/90 hover:to-cyan-500/90 shadow-lg shadow-primary/25 flex-shrink-0"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Connect with Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <ClientIdDialog
        open={showClientIdDialog}
        onOpenChange={setShowClientIdDialog}
        clientIdInput={clientIdInput}
        setClientIdInput={setClientIdInput}
        onSave={saveClientIdAndLogin}
      />
    </>
  );
};

// Client ID Dialog component
const ClientIdDialog = ({
  open,
  onOpenChange,
  clientIdInput,
  setClientIdInput,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientIdInput: string;
  setClientIdInput: (value: string) => void;
  onSave: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          Configure Google OAuth
        </DialogTitle>
        <DialogDescription>
          Enter your Google Cloud OAuth Client ID for Analytics and Search Console access.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Google OAuth Client ID</Label>
          <Input
            placeholder="123456789-abc.apps.googleusercontent.com"
            value={clientIdInput}
            onChange={(e) => setClientIdInput(e.target.value)}
          />
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <p className="font-medium mb-2">Setup:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
            <li>
              Go to{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Google Cloud Console
              </a>
            </li>
            <li>Create OAuth 2.0 Client ID</li>
            <li>
              Add redirect URI:{" "}
              <code className="bg-background px-1 rounded text-[10px]">
                {window.location.origin}/visitor-intelligence-dashboard
              </code>
            </li>
            <li>Enable: Google Analytics Data API, Analytics Admin API, Search Console API</li>
          </ol>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={onSave}>Save & Connect</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default UnifiedGoogleConnect;
