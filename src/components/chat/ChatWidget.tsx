import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2, User2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/hooks/use-chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { cn } from '@/lib/utils';

interface ChatWidgetProps {
  /** Whether to auto-open the chat */
  autoOpen?: boolean;
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left';
  /** Custom greeting message (overrides AI) */
  greeting?: string;
}

export const ChatWidget = memo(({ autoOpen = false, position = 'bottom-right' }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(0);

  const { messages, isLoading, sendMessage, initSession } = useChat({
    onError: (error) => console.error('Chat error:', error),
  });

  // Initialize session when opening chat
  useEffect(() => {
    if (isOpen && !initialized) {
      initSession();
      setInitialized(true);
    }
  }, [isOpen, initialized, initSession]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      // Small delay for animation
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
    lastMessageCount.current = messages.length;
  }, [messages.length]);

  // Track new messages when closed
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && !lastMessage.isTyping) {
        setHasNewMessage(true);
      }
    }
  }, [messages, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewMessage(false);
  };

  const positionClasses = position === 'bottom-left' 
    ? 'left-4 sm:left-6' 
    : 'right-4 sm:right-6';

  return (
    <>
      {/* Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={handleOpen}
            className={cn(
              'fixed bottom-4 sm:bottom-6 z-50',
              positionClasses,
              'w-14 h-14 rounded-full',
              'bg-gradient-to-br from-primary to-primary/80',
              'text-primary-foreground shadow-lg shadow-primary/25',
              'hover:shadow-xl hover:scale-105 transition-all duration-200',
              'flex items-center justify-center'
            )}
            aria-label="Open chat"
          >
            <MessageCircle className="w-6 h-6" />
            
            {/* Notification Badge */}
            {hasNewMessage && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center"
              >
                <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-75" />
                !
              </motion.span>
            )}

            {/* Online Status */}
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed bottom-4 sm:bottom-6 z-50',
              positionClasses,
              'w-[calc(100vw-2rem)] sm:w-96 h-[70vh] max-h-[600px] min-h-[400px]',
              'bg-background border border-border rounded-2xl',
              'shadow-2xl shadow-black/10 overflow-hidden',
              'flex flex-col'
            )}
            style={{ contain: 'layout paint' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-foreground">AI Assistant</h3>
                  <p className="text-xs text-primary-foreground/70 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    Online • Powered by AI
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              placeholder="Ask me anything..."
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

ChatWidget.displayName = 'ChatWidget';

export default ChatWidget;
