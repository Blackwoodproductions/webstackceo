import { memo } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Mic, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIFloatingButtonProps {
  onClick: () => void;
  isListening?: boolean;
  hasNewMessage?: boolean;
}

export const AIFloatingButton = memo(function AIFloatingButton({
  onClick,
  isListening = false,
  hasNewMessage = false,
}: AIFloatingButtonProps) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 20 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="group relative flex items-center"
    >
      {/* Main button container */}
      <div className="relative flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl overflow-hidden">
        
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-cyan-500/20 to-violet-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Scanning line effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan-line" />
        </div>
        
        {/* AI Core orb */}
        <div className="relative">
          {/* Outer glow */}
          <div className={cn(
            "absolute inset-0 rounded-full blur-md transition-all duration-500",
            isListening 
              ? "bg-gradient-to-r from-cyan-400 to-violet-400 scale-150 animate-pulse" 
              : "bg-gradient-to-r from-cyan-500/50 to-violet-500/50 scale-100"
          )} />
          
          {/* Core */}
          <div className={cn(
            "relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
            "bg-gradient-to-br from-violet-600 via-cyan-500 to-violet-600",
            "shadow-inner shadow-white/10"
          )}>
            <Brain className="w-5 h-5 text-white drop-shadow-lg" />
            
            {/* Active pulse rings */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 rounded-full border border-violet-400/30 animate-pulse" />
          </div>
          
          {/* Status indicator */}
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900",
            isListening ? "bg-cyan-400 animate-pulse" : hasNewMessage ? "bg-rose-500 animate-bounce" : "bg-emerald-400"
          )} />
        </div>
        
        {/* Text content */}
        <div className="flex flex-col items-start relative z-10">
          <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-medium">
            Webstack
          </span>
          <span className="text-sm font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            AI Assistant
          </span>
        </div>
        
        {/* Right side icons */}
        <div className="flex items-center gap-2 ml-2 relative z-10">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <div className="w-px h-6 bg-gradient-to-b from-transparent via-border to-transparent" />
          <div className="flex flex-col gap-0.5">
            <Mic className={cn(
              "w-3 h-3 transition-colors",
              isListening ? "text-cyan-400" : "text-muted-foreground"
            )} />
            <MessageCircle className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/50 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50 rounded-br-lg" />
      </div>
      
      {/* Floating particles */}
      <div className="absolute -inset-4 pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyan-400/60"
            animate={{
              y: [0, -20, 0],
              x: [0, (i - 1) * 10, 0],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
            style={{
              left: `${30 + i * 20}%`,
              top: '50%',
            }}
          />
        ))}
      </div>
    </motion.button>
  );
});

export default AIFloatingButton;
