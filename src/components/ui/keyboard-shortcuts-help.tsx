import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

const shortcuts = [
  { keys: ["↑", "K"], description: "Previous section" },
  { keys: ["↓", "J"], description: "Next section" },
  { keys: ["Home"], description: "Go to top" },
  { keys: ["End"], description: "Go to bottom" },
  { keys: ["1-8"], description: "Jump to section" },
];

const KeyboardShortcutsHelp = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Toggle help with ? key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsVisible((v) => !v);
      }
      if (e.key === "Escape") {
        setIsVisible(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Help trigger button */}
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 left-6 z-40 hidden lg:flex w-10 h-10 rounded-full glass-card border border-border items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        aria-label="Keyboard shortcuts"
      >
        <Keyboard className="w-4 h-4" />
      </button>

      {/* Shortcuts panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-6 z-50 hidden lg:block glass-card border border-border rounded-xl p-4 w-64"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 rounded hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              {shortcuts.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, j) => (
                      <kbd
                        key={j}
                        className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono text-foreground"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              Press <kbd className="px-1 py-0.5 rounded bg-secondary text-xs font-mono">?</kbd> to toggle
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default KeyboardShortcutsHelp;
