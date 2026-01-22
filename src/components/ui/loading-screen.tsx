import { memo } from "react";

// Removed artificial delay - content now shows immediately
// Only shows briefly during actual React hydration
const LoadingScreen = memo(() => {
  // Return null - no artificial loading screen delay
  // The Suspense fallback in App.tsx handles lazy-loaded routes
  return null;
});

LoadingScreen.displayName = "LoadingScreen";

export default LoadingScreen;
