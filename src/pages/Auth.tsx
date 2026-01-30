import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/visitor-intelligence-dashboard';
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Extended scopes for GA + GSC + Ads + GMB + Site Verification auto-connect
  const EXTENDED_GOOGLE_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/webmasters",
    "https://www.googleapis.com/auth/siteverification",
    "https://www.googleapis.com/auth/adwords",
    "https://www.googleapis.com/auth/business.manage",
  ].join(" ");

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (code && state === "auth_google") {
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate(redirectTo);
      } else {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate, redirectTo]);

  // Handle popup window message for auth callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'supabase_auth_callback') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setIsGoogleLoading(false);
            toast({
              title: "Welcome!",
              description: "Successfully signed in with Google.",
            });
            navigate(redirectTo);
          }
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate, redirectTo, toast]);

  // Detect if we're on a custom domain (not lovable.app preview)
  const isCustomDomain = !window.location.hostname.includes('lovable.app') && 
                         !window.location.hostname.includes('lovableproject.com') &&
                         !window.location.hostname.includes('localhost');

  // Handle Google OAuth sign in
  const handleGoogleSignIn = useCallback(async () => {
    setIsGoogleLoading(true);

    try {
      // For custom domains, use direct redirect (no popup) to avoid 404 on callback
      // Apache serves index.html for all routes, so the SPA handles the callback
      if (isCustomDomain) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            scopes: EXTENDED_GOOGLE_SCOPES,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent select_account',
              include_granted_scopes: 'true',
            },
            // Don't skip browser redirect on custom domains - let Supabase handle it
          },
        });

        if (error) {
          throw new Error(error.message || "Failed to start Google sign-in.");
        }
        // Browser will redirect to Google, then back to /auth/callback
        return;
      }

      // For Lovable domains, use popup flow (auth-bridge handles it)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: EXTENDED_GOOGLE_SCOPES,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent select_account',
            include_granted_scopes: 'true',
          },
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        throw new Error(error?.message || "Failed to start Google sign-in.");
      }

      const popupWidth = 520;
      const popupHeight = 720;
      const left = (window.screenX ?? 0) + (window.outerWidth - popupWidth) / 2;
      const top = (window.screenY ?? 0) + (window.outerHeight - popupHeight) / 2;

      const popup = window.open(
        data.url,
        "google_auth_popup",
        `popup=yes,width=${popupWidth},height=${popupHeight},left=${Math.max(0, left)},top=${Math.max(0, top)}`
      );

      if (!popup) {
        setIsGoogleLoading(false);
        toast({
          title: "Popup blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive",
        });
        return;
      }

      const pollInterval = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(pollInterval);
            
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              if (session.provider_token) {
                const expiryTime = Date.now() + 3600 * 1000;
                localStorage.setItem('unified_google_token', session.provider_token);
                localStorage.setItem('unified_google_expiry', expiryTime.toString());
                localStorage.setItem('unified_google_scopes', EXTENDED_GOOGLE_SCOPES);
                localStorage.setItem('ga_access_token', session.provider_token);
                localStorage.setItem('ga_token_expiry', expiryTime.toString());
                localStorage.setItem('gsc_access_token', session.provider_token);
                localStorage.setItem('gsc_token_expiry', expiryTime.toString());

                const expiresAt = new Date(expiryTime).toISOString();
                await supabase
                  .from('oauth_tokens')
                  .upsert({
                    user_id: session.user.id,
                    provider: 'google',
                    access_token: session.provider_token,
                    refresh_token: session.provider_refresh_token || null,
                    scope: EXTENDED_GOOGLE_SCOPES,
                    expires_at: expiresAt,
                    updated_at: new Date().toISOString(),
                  }, {
                    onConflict: 'user_id,provider'
                  });

                const avatarUrl = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
                const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
                
                if (avatarUrl || fullName) {
                  await supabase
                    .from('profiles')
                    .update({
                      avatar_url: avatarUrl,
                      full_name: fullName,
                      email: session.user.email,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', session.user.id);

                  const profileData = { name: fullName, email: session.user.email, picture: avatarUrl };
                  localStorage.setItem('unified_google_profile', JSON.stringify(profileData));
                  localStorage.setItem('gsc_google_profile', JSON.stringify(profileData));
                }
              }

              toast({
                title: "Welcome!",
                description: "Successfully signed in with Google.",
              });
              navigate(redirectTo);
            } else {
              setIsGoogleLoading(false);
            }
          }
        } catch {
          // Ignore cross-origin errors
        }
      }, 500);

    } catch (error: unknown) {
      setIsGoogleLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in with Google.";
      toast({
        title: "Sign-in failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast, navigate, redirectTo, EXTENDED_GOOGLE_SCOPES, isCustomDomain]);

  // Loading screen
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-cyan-500/20 via-violet-500/10 to-transparent rounded-bl-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-violet-500/20 via-primary/10 to-transparent rounded-tr-full blur-3xl" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <motion.div
            className="relative"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 via-violet-500 to-primary flex items-center justify-center shadow-2xl shadow-primary/40">
              <span className="text-white font-bold text-4xl">W</span>
            </div>
          </motion.div>
          
          <motion.p
            className="text-lg font-medium text-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Authenticating...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Futuristic background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />
        
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-30%] left-[-15%] w-[900px] h-[900px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(200 100% 50% / 0.12) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.5) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
            style={{
              top: `${20 + i * 12}%`,
              left: `${10 + i * 15}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="p-8 relative z-10">
        <a href="/" className="inline-flex items-center gap-4 group">
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-primary flex items-center justify-center shadow-xl shadow-primary/30">
              <span className="text-white font-bold text-2xl">W</span>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-primary opacity-0 group-hover:opacity-50 blur-xl transition-opacity" />
          </motion.div>
          <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            webstack.ceo
          </span>
        </a>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-lg relative z-10"
        >
          {/* Glassmorphism card */}
          <div className="relative">
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-primary/20 rounded-[2.5rem] blur-2xl opacity-60" />
            
            <div className="relative backdrop-blur-xl bg-card/80 border border-border/50 rounded-[2rem] p-10 shadow-2xl">
              {/* Decorative top border */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
              
              {/* Content */}
              <div className="text-center space-y-3 mb-10">
                <motion.h1 
                  className="text-4xl font-bold bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Welcome Back
                </motion.h1>
                <motion.p 
                  className="text-muted-foreground text-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Sign in to access your dashboard
                </motion.p>
              </div>

              {/* Google Sign-in Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.button
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="group relative w-full h-16 rounded-2xl overflow-hidden transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Button gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4285F4] via-[#34A853] via-[#FBBC05] to-[#EA4335] opacity-90 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Dark overlay for depth */}
                  <div className="absolute inset-[1px] bg-background/95 rounded-[15px] group-hover:bg-background/90 transition-colors" />
                  
                  {/* Button content */}
                  <div className="relative flex items-center justify-center gap-4 h-full px-6">
                    {isGoogleLoading ? (
                      <motion.div
                        className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : (
                      <>
                        {/* Google Logo */}
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        
                        <span className="text-lg font-semibold text-foreground group-hover:text-foreground/90 transition-colors">
                          Continue with Google
                        </span>
                        
                        {/* Arrow icon */}
                        <motion.svg
                          className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          initial={{ x: 0 }}
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </motion.svg>
                      </>
                    )}
                  </div>
                  
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                </motion.button>
              </motion.div>

              {/* Security badge */}
              <motion.div
                className="flex items-center justify-center gap-2 mt-8 text-muted-foreground/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm">Secured by Google OAuth 2.0</span>
              </motion.div>
            </div>
          </div>

          {/* Footer text */}
          <motion.p
            className="text-center text-sm text-muted-foreground/50 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            By continuing, you agree to our Terms of Service and Privacy Policy
          </motion.p>
        </motion.div>
      </div>

      {/* Decorative corner elements */}
      <div className="fixed top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-border/20 rounded-br-[3rem] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-border/20 rounded-tl-[3rem] pointer-events-none" />
    </div>
  );
};

export default Auth;
