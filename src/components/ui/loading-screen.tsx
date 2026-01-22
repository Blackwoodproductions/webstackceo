import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LoadingScreen = memo(() => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reduced loading time for faster perceived performance
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Simplified Logo - no continuous rotation for performance */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="absolute inset-0 w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 blur-lg opacity-40" />
              <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                <span className="text-white font-bold text-3xl">W</span>
              </div>
            </motion.div>

            {/* Brand Text */}
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground">
                webstack<span className="gradient-text">.ceo</span>
              </h1>
            </div>

            {/* Simple Loading Spinner - GPU accelerated */}
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

LoadingScreen.displayName = "LoadingScreen";

export default LoadingScreen;
