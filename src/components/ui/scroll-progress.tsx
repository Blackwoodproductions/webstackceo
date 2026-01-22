import { useState, useEffect, memo } from "react";

const ScrollProgress = memo(() => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId: number;
    
    const updateProgress = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
        setProgress(scrolled);
      });
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
    
    return () => {
      window.removeEventListener("scroll", updateProgress);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-violet-500 origin-left z-[60] will-change-transform"
      style={{ transform: `scaleX(${progress})` }}
    />
  );
});

ScrollProgress.displayName = "ScrollProgress";

export default ScrollProgress;