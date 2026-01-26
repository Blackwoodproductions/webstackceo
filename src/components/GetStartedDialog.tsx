import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, Calendar, MessageCircle, ArrowRight, Sparkles } from "lucide-react";

interface GetStartedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const options = [
  {
    id: "seo-audit",
    title: "SEO AUDIT",
    description: "Get a free instant analysis of your website's SEO health",
    icon: Search,
    href: "/#hero",
    gradient: "from-cyan-400 to-blue-500",
    glow: "rgba(6,182,212,0.4)",
  },
  {
    id: "book-call",
    title: "BOOK CALL",
    description: "Schedule a strategy session with our SEO experts",
    icon: Calendar,
    href: "/contact",
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.4)",
  },
  {
    id: "chat-now",
    title: "CHAT NOW",
    description: "Start a conversation with our AI assistant instantly",
    icon: MessageCircle,
    href: "#chat",
    gradient: "from-amber-400 to-orange-500",
    glow: "rgba(251,191,36,0.4)",
    action: "openChat",
  },
];

const GetStartedDialog = ({ open, onOpenChange }: GetStartedDialogProps) => {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const handleOptionClick = (option: typeof options[0]) => {
    onOpenChange(false);
    
    if (option.action === "openChat") {
      // Trigger the live chat widget
      const chatButton = document.querySelector('[aria-label="Open chat"]') as HTMLButtonElement;
      if (chatButton) {
        chatButton.click();
      }
      return;
    }
    
    if (option.href.startsWith("/#")) {
      // Scroll to section on home page
      const targetId = option.href.replace("/#", "");
      const element = document.getElementById(targetId);
      if (element) {
        const offsetTop = element.offsetTop - 80;
        window.scrollTo({ top: offsetTop, behavior: "smooth" });
      }
    } else {
      // Navigate to page
      window.location.href = option.href;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          />
        </div>
        
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            How can we help?
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Choose the best way to get started with WebStack
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4 relative z-10">
          {options.map((option, index) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => setHoveredOption(option.id)}
              onMouseLeave={() => setHoveredOption(null)}
              className="relative group w-full text-left"
            >
              <div
                className={`
                  relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
                  ${hoveredOption === option.id 
                    ? 'bg-secondary/80 border-primary/50 shadow-lg' 
                    : 'bg-secondary/40 border-border/50 hover:bg-secondary/60'
                  }
                `}
                style={{
                  boxShadow: hoveredOption === option.id 
                    ? `0 0 30px ${option.glow}` 
                    : 'none'
                }}
              >
                {/* Icon */}
                <div className={`
                  w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300
                  bg-gradient-to-br ${option.gradient}
                  ${hoveredOption === option.id ? 'scale-110 shadow-lg' : ''}
                `}
                style={{
                  boxShadow: hoveredOption === option.id 
                    ? `0 0 20px ${option.glow}` 
                    : 'none'
                }}
                >
                  <option.icon className="w-7 h-7 text-white" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className={`
                    text-lg font-bold tracking-wide transition-colors duration-300
                    ${hoveredOption === option.id ? 'text-primary' : 'text-foreground'}
                  `}>
                    {option.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {option.description}
                  </p>
                </div>
                
                {/* Arrow */}
                <ArrowRight className={`
                  w-5 h-5 flex-shrink-0 transition-all duration-300
                  ${hoveredOption === option.id 
                    ? 'text-primary translate-x-1 opacity-100' 
                    : 'text-muted-foreground opacity-50'
                  }
                `} />
              </div>
            </motion.button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GetStartedDialog;
