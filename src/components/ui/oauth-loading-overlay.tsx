import { motion, AnimatePresence } from "framer-motion";
import { Shield, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface OAuthLoadingOverlayProps {
  isVisible: boolean;
  status: 'connecting' | 'success' | 'error';
  provider?: string;
  onClose?: () => void;
}

export const OAuthLoadingOverlay = ({ 
  isVisible, 
  status, 
  provider = "Google",
  onClose 
}: OAuthLoadingOverlayProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={status !== 'connecting' ? onClose : undefined}
          />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10"
          >
            {/* Main Card */}
            <div className="relative w-[380px] overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 p-8 shadow-2xl">
              
              {/* Grid Background */}
              <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `
                    linear-gradient(hsl(var(--primary) / 0.5) 1px, transparent 1px),
                    linear-gradient(90deg, hsl(var(--primary) / 0.5) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Corner Glows */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />

              {/* Scanning Line */}
              {status === 'connecting' && (
                <motion.div
                  className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              )}

              {/* Content */}
              <div className="relative flex flex-col items-center text-center space-y-6">
                
                {/* Icon Container */}
                <div className="relative">
                  {/* Outer Ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                    animate={status === 'connecting' ? { 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.2, 0.5]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ width: 80, height: 80, margin: -8 }}
                  />
                  
                  {/* Icon Circle */}
                  <motion.div
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center
                      ${status === 'success' 
                        ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border border-emerald-500/50' 
                        : status === 'error'
                        ? 'bg-gradient-to-br from-destructive/20 to-destructive/30 border border-destructive/50'
                        : 'bg-gradient-to-br from-primary/20 to-primary/30 border border-primary/50'
                      }
                    `}
                    animate={status === 'connecting' ? { rotate: 360 } : {}}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    {status === 'connecting' && (
                      <Shield className="w-7 h-7 text-primary" />
                    )}
                    {status === 'success' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 10 }}
                      >
                        <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                      </motion.div>
                    )}
                    {status === 'error' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 10 }}
                      >
                        <XCircle className="w-7 h-7 text-destructive" />
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Orbiting Dot */}
                  {status === 'connecting' && (
                    <motion.div
                      className="absolute w-2 h-2 bg-primary rounded-full shadow-lg shadow-primary/50"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      style={{ 
                        top: '50%', 
                        left: '50%',
                        marginTop: -4,
                        marginLeft: -4,
                        transformOrigin: '4px 36px'
                      }}
                    />
                  )}
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold tracking-tight">
                    {status === 'connecting' && `Connecting to ${provider}`}
                    {status === 'success' && 'Connection Successful'}
                    {status === 'error' && 'Connection Failed'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-[280px]">
                    {status === 'connecting' && (
                      <>Complete the authentication in the popup window</>
                    )}
                    {status === 'success' && (
                      <>Your account has been securely linked</>
                    )}
                    {status === 'error' && (
                      <>Authentication was cancelled or failed. Please try again.</>
                    )}
                  </p>
                </div>

                {/* Loading Indicator */}
                {status === 'connecting' && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Waiting for authorization...</span>
                  </div>
                )}

                {/* Progress Bar */}
                {status === 'connecting' && (
                  <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary via-violet-500 to-primary rounded-full"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      style={{ width: "50%" }}
                    />
                  </div>
                )}

                {/* Close Button for non-connecting states */}
                {status !== 'connecting' && onClose && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={onClose}
                    className="px-6 py-2 text-sm font-medium rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
                  >
                    {status === 'success' ? 'Continue' : 'Try Again'}
                  </motion.button>
                )}
              </div>

              {/* Bottom Accent Line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </div>

            {/* Floating Particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/40 rounded-full"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.6, 0.2],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
