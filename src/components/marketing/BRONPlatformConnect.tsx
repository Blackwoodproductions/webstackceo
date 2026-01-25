import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, Lock, ExternalLink, Loader2, Shield, LogOut,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface BRONPlatformConnectProps {
  domain?: string;
  onConnectionComplete?: (platform: string) => void;
}

const BRON_DASHBOARD_URL = "https://dashdev.imagehosting.space";
const STORAGE_KEY = "bron_dashboard_auth";

export const BRONPlatformConnect = ({ domain, onConnectionComplete }: BRONPlatformConnectProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.authenticated && authData.expiry > Date.now()) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      // Simulate auth delay - in production this would hit the actual BRON API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store auth state (24 hour expiry)
      const authData = {
        authenticated: true,
        email,
        expiry: Date.now() + 24 * 60 * 60 * 1000,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
      
      setIsAuthenticated(true);
      onConnectionComplete?.("bron");
      
      toast({
        title: "Successfully Connected!",
        description: "Your BRON dashboard is now loaded.",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Unable to authenticate. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
    toast({
      title: "Logged Out",
      description: "You have been disconnected from the BRON dashboard.",
    });
  };

  // Show iframe when authenticated
  if (isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Header with logout */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">BRON Dashboard Connected</p>
              <p className="text-xs text-muted-foreground">Blackwood SEO V2</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(BRON_DASHBOARD_URL, '_blank')}
              className="text-xs gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs gap-1 text-muted-foreground hover:text-destructive hover:border-destructive/50"
            >
              <LogOut className="w-3 h-3" />
              Disconnect
            </Button>
          </div>
        </div>

        {/* Dashboard iframe */}
        <div className="rounded-xl border border-border overflow-hidden bg-background">
          <iframe
            src={BRON_DASHBOARD_URL}
            className="w-full min-h-[600px] border-0"
            title="BRON Dashboard"
            allow="clipboard-write"
          />
        </div>
      </motion.div>
    );
  }

  // Login form - styled like Blackwood SEO V2
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="relative p-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 border border-slate-200 dark:border-slate-700/50 shadow-lg overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-30 dark:opacity-10" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
        
        {/* Decorative blurs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold tracking-wide text-slate-600 dark:text-slate-300">
              BLACKWOOD SEO V2
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Dashboard Login</p>
            <Badge className="mt-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 text-[10px]">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              BRON Powered
            </Badge>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto">
            {/* Email Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-14 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 rounded-lg"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-14 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 rounded-lg"
              />
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-md"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "LOGIN"
              )}
            </Button>
          </form>

          {/* Links */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <a 
              href="https://dashdev.imagehosting.space/register" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              Register Now
            </a>
            <a 
              href="https://dashdev.imagehosting.space/reset-password" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              Reset Password
            </a>
            <a 
              href="https://dashdev.imagehosting.space/live-results" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              Live Results
            </a>
          </div>

          {/* Description */}
          <p className="text-center text-xs text-muted-foreground mt-4 max-w-xs mx-auto">
            Access your SEO dashboard to monitor rankings, track keywords, and optimize your website performance.
          </p>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/50 text-[10px] text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <span>|</span>
            <a href="#" className="hover:text-foreground">Terms of Service</a>
            <span>|</span>
            <a href="#" className="hover:text-foreground">Support</a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BRONPlatformConnect;
