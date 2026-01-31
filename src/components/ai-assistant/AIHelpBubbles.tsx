import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Search, Link2, BarChart2, Zap, Target, Globe } from 'lucide-react';

interface HelpBubble {
  id: string;
  icon: React.ReactNode;
  text: string;
  prompt: string;
  color: string;
}

const HELP_BUBBLES: HelpBubble[] = [
  {
    id: 'keywords',
    icon: <Search className="w-3 h-3" />,
    text: 'Find keywords',
    prompt: 'Research high-value keywords for my domain',
    color: 'from-cyan-500/80 to-cyan-400/80',
  },
  {
    id: 'competitors',
    icon: <Target className="w-3 h-3" />,
    text: 'Spy competitors',
    prompt: 'Analyze my top competitors SEO strategy',
    color: 'from-violet-500/80 to-violet-400/80',
  },
  {
    id: 'backlinks',
    icon: <Link2 className="w-3 h-3" />,
    text: 'Backlink ops',
    prompt: 'Find backlink partner opportunities',
    color: 'from-emerald-500/80 to-emerald-400/80',
  },
  {
    id: 'rankings',
    icon: <TrendingUp className="w-3 h-3" />,
    text: 'Boost rankings',
    prompt: 'How can I improve my search rankings?',
    color: 'from-amber-500/80 to-amber-400/80',
  },
  {
    id: 'audit',
    icon: <BarChart2 className="w-3 h-3" />,
    text: 'SEO audit',
    prompt: 'Run a comprehensive SEO audit',
    color: 'from-rose-500/80 to-rose-400/80',
  },
];

interface AIHelpBubblesProps {
  selectedDomain: string | null;
  onBubbleClick: (prompt: string) => void;
  isAIOpen: boolean;
}

export const AIHelpBubbles = memo(function AIHelpBubbles({
  selectedDomain,
  onBubbleClick,
  isAIOpen,
}: AIHelpBubblesProps) {
  const [visibleBubbles, setVisibleBubbles] = useState<string[]>([]);
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null);

  // Animate bubbles appearing one by one
  useEffect(() => {
    if (!selectedDomain || isAIOpen) {
      setVisibleBubbles([]);
      return;
    }

    const timers: NodeJS.Timeout[] = [];
    HELP_BUBBLES.forEach((bubble, index) => {
      const timer = setTimeout(() => {
        setVisibleBubbles(prev => [...prev, bubble.id]);
      }, 300 + index * 150);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [selectedDomain, isAIOpen]);

  if (!selectedDomain || isAIOpen) return null;

  return (
    <div className="flex items-center gap-1.5 ml-3">
      {/* AI spark indicator */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/30"
      >
        <Sparkles className="w-3 h-3 text-violet-400 animate-pulse" />
        <span className="text-[10px] font-medium text-violet-300">AI Ready</span>
      </motion.div>

      {/* Help bubbles */}
      <AnimatePresence>
        {HELP_BUBBLES.map((bubble) => (
          visibleBubbles.includes(bubble.id) && (
            <motion.button
              key={bubble.id}
              initial={{ scale: 0, opacity: 0, x: -10 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0, opacity: 0, x: -10 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setHoveredBubble(bubble.id)}
              onMouseLeave={() => setHoveredBubble(null)}
              onClick={() => onBubbleClick(bubble.prompt)}
              className={`
                relative flex items-center gap-1 px-2 py-1 rounded-full 
                bg-gradient-to-r ${bubble.color} 
                text-white text-[10px] font-medium
                shadow-lg shadow-black/20 hover:shadow-xl
                border border-white/10 backdrop-blur-sm
                transition-all duration-200 cursor-pointer
              `}
            >
              {bubble.icon}
              <span className="whitespace-nowrap">{bubble.text}</span>
              
              {/* Glow effect on hover */}
              {hoveredBubble === bubble.id && (
                <motion.div
                  layoutId="bubble-glow"
                  className="absolute inset-0 rounded-full bg-white/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </motion.button>
          )
        ))}
      </AnimatePresence>
    </div>
  );
});

export default AIHelpBubbles;
