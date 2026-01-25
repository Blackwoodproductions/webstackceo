import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  TrendingUp, Users, Clock, MousePointer, Eye,
  BarChart3, RefreshCw, Loader2, ExternalLink, Key, ChevronDown, ChevronUp,
  Activity, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Google OAuth Config for Analytics
const getGoogleClientId = () => localStorage.getItem("ga_client_id") || localStorage.getItem("gsc_client_id") || import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_GA_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/analytics.readonly",
].join(" ");

function getOAuthRedirectUri(): string {
  const path = window.location.pathname;
  try {
    if (document.referrer) {
      const ref = new URL(document.referrer);
      if (ref.hostname.endsWith("lovable.app")) {
        return `${ref.origin}${path}`;
      }
    }
  } catch {
    // ignore
  }
  return `${window.location.origin}${path}`;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes.buffer);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

export interface GADashboardPanelProps {
  externalSelectedSite?: string;
  onAuthStatusChange?: (isAuthenticated: boolean) => void;
  fullWidth?: boolean;
}

export const GADashboardPanel = ({
  externalSelectedSite,
  onAuthStatusChange,
  fullWidth = false,
}: GADashboardPanelProps) => {
  const { toast } = useToast();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Client ID configuration
  const [showClientIdDialog, setShowClientIdDialog] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");
  
  // Check for stored token on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem("ga_access_token");
    const tokenExpiry = sessionStorage.getItem("ga_token_expiry");
    
    if (storedToken && tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry);
      const timeRemaining = expiryTime - Date.now();
      
      if (timeRemaining > 0) {
        setAccessToken(storedToken);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      } else {
        sessionStorage.removeItem("ga_access_token");
        sessionStorage.removeItem("ga_token_expiry");
      }
    }
    
    // Check for GA OAuth callback (different state key)
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    
    // Only process if this is a GA callback (state === 'ga')
    if (code && state === "ga") {
      const verifier = sessionStorage.getItem("ga_code_verifier");
      
      if (verifier) {
        setIsLoading(true);
        (async () => {
          try {
            const redirectUri = getOAuthRedirectUri();
            const tokenRes = await supabase.functions.invoke("google-oauth-token", {
              body: { code, codeVerifier: verifier, redirectUri },
            });

            if (tokenRes.error || tokenRes.data?.error) {
              throw new Error(tokenRes.data?.error_description || tokenRes.error?.message || "Token exchange failed");
            }

            const { access_token, expires_in } = tokenRes.data;
            const expiryTime = Date.now() + (expires_in || 3600) * 1000;
            
            sessionStorage.setItem("ga_access_token", access_token);
            sessionStorage.setItem("ga_token_expiry", expiryTime.toString());
            sessionStorage.removeItem("ga_code_verifier");
            
            setAccessToken(access_token);
            setIsAuthenticated(true);
            
            window.history.replaceState({}, document.title, window.location.pathname);
            
            toast({
              title: "Google Analytics Connected",
              description: "Successfully linked your Analytics account.",
            });
          } catch (error: any) {
            console.error("[GA] Token exchange error:", error);
            toast({
              title: "Connection Failed",
              description: error.message || "Failed to connect to Google Analytics.",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
          }
        })();
        return;
      }
    }
    
    setIsLoading(false);
  }, [toast]);

  // Notify parent of auth status changes
  useEffect(() => {
    onAuthStatusChange?.(isAuthenticated);
  }, [isAuthenticated, onAuthStatusChange]);

  const handleGoogleLogin = async () => {
    const clientId = getGoogleClientId();
    
    if (!clientId) {
      setShowClientIdDialog(true);
      return;
    }

    try {
      const redirectUri = getOAuthRedirectUri();
      const verifier = generateCodeVerifier();
      sessionStorage.setItem("ga_code_verifier", verifier);
      const challenge = await generateCodeChallenge(verifier);

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", GOOGLE_GA_SCOPES);
      authUrl.searchParams.set("code_challenge", challenge);
      authUrl.searchParams.set("code_challenge_method", "S256");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("access_type", "online");
      authUrl.searchParams.set("state", "ga"); // Identify this as GA callback

      window.location.href = authUrl.toString();
    } catch (error) {
      console.error("[GA] Error initiating OAuth:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to start Google authentication. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveClientId = () => {
    if (!clientIdInput.trim()) {
      toast({ title: "Client ID Required", variant: "destructive" });
      return;
    }
    localStorage.setItem("ga_client_id", clientIdInput.trim());
    setShowClientIdDialog(false);
    setTimeout(() => { void handleGoogleLogin(); }, 500);
  };

  const handleDisconnect = () => {
    sessionStorage.removeItem("ga_access_token");
    sessionStorage.removeItem("ga_token_expiry");
    setAccessToken(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Not connected - show connect prompt
  if (!isAuthenticated) {
    // Full-width banner style when at bottom
    if (fullWidth) {
      return (
        <>
          <Card className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-yellow-500/10 border-orange-500/20">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Connect Google Analytics</h3>
                    <p className="text-muted-foreground text-sm">
                      Link your Analytics to see sessions, users, page views, and engagement metrics alongside your Search Console data.
                    </p>
                  </div>
                </div>
                <Button onClick={handleGoogleLogin} size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex-shrink-0">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Connect Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          <Dialog open={showClientIdDialog} onOpenChange={setShowClientIdDialog}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  Configure Google OAuth
                </DialogTitle>
                <DialogDescription>Enter your Google Cloud OAuth Client ID for Analytics access.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Google OAuth Client ID</Label>
                  <Input placeholder="123456789-abc.apps.googleusercontent.com" value={clientIdInput} onChange={(e) => setClientIdInput(e.target.value)} />
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Setup:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                    <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-primary hover:underline">Google Cloud Console</a></li>
                    <li>Create OAuth 2.0 Client ID</li>
                    <li>Add redirect URI: <code className="bg-background px-1 rounded">{window.location.origin}/visitor-intelligence-dashboard</code></li>
                    <li>Enable Google Analytics Data API</li>
                  </ol>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowClientIdDialog(false)}>Cancel</Button>
                <Button onClick={handleSaveClientId}>Save & Connect</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );
    }
    
    // Card style for side-by-side layout
    return (
      <>
        <Card className="bg-gradient-to-br from-orange-500/5 to-amber-500/5 border-orange-500/20 h-full flex flex-col">
          <CardContent className="py-8 flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Connect Google Analytics</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Link your Analytics to see sessions, users, page views, and engagement metrics.
              </p>
              <Button onClick={handleGoogleLogin} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Connect Analytics
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showClientIdDialog} onOpenChange={setShowClientIdDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                Configure Google OAuth
              </DialogTitle>
              <DialogDescription>Enter your Google Cloud OAuth Client ID for Analytics access.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Google OAuth Client ID</Label>
                <Input placeholder="123456789-abc.apps.googleusercontent.com" value={clientIdInput} onChange={(e) => setClientIdInput(e.target.value)} />
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Setup:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                  <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-primary hover:underline">Google Cloud Console</a></li>
                  <li>Create OAuth 2.0 Client ID</li>
                  <li>Add redirect URI: <code className="bg-background px-1 rounded">{window.location.origin}/visitor-intelligence-dashboard</code></li>
                  <li>Enable Google Analytics Data API</li>
                </ol>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClientIdDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveClientId}>Save & Connect</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Connected - show placeholder dashboard (GA4 API integration would go here)
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Google Analytics</CardTitle>
              <CardDescription className="text-xs">Traffic and engagement data</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
              Connected
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>Disconnect</Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-secondary/20 rounded-lg p-4 text-center">
          <Activity className="w-8 h-8 mx-auto mb-2 text-orange-500" />
          <p className="text-sm font-medium mb-1">Analytics Connected</p>
          <p className="text-xs text-muted-foreground">
            GA4 data integration coming soon. Your account is linked and ready.
          </p>
        </div>
        
        {/* Placeholder metrics */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Sessions", icon: Users, color: "text-orange-500" },
            { label: "Users", icon: Users, color: "text-amber-500" },
            { label: "Page Views", icon: Eye, color: "text-yellow-500" },
            { label: "Avg. Duration", icon: Clock, color: "text-orange-400" },
          ].map((metric, i) => (
            <div key={i} className="bg-secondary/30 rounded-lg p-3 text-center">
              <metric.icon className={`w-5 h-5 mx-auto mb-1 ${metric.color}`} />
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="text-sm font-medium text-muted-foreground/50">—</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GADashboardPanel;
