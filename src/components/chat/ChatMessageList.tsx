import { memo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import type { ChatMessage } from '@/hooks/use-chat-conversations';
import { useChatUtils } from '@/hooks/use-chat-utils';

interface ChatMessageListProps {
  messages: ChatMessage[];
  emptyStateText?: string;
}

/**
 * Memoized chat message list component
 * Displays messages with auto-scroll and sender-based styling
 */
export const ChatMessageList = memo(function ChatMessageList({
  messages,
  emptyStateText = 'Start a conversation!',
}: ChatMessageListProps) {
  const { formatTime } = useChatUtils();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <div className="text-center text-muted-foreground py-8">
          <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{emptyStateText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${msg.sender_type === 'visitor' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              msg.sender_type === 'visitor'
                ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-br-md'
                : msg.sender_type === 'operator'
                ? 'bg-primary/20 text-foreground rounded-bl-md border border-primary/30'
                : 'bg-secondary text-foreground rounded-bl-md'
            }`}
          >
            {msg.sender_type === 'operator' && (
              <p className="text-xs text-primary font-medium mb-1">Operator</p>
            )}
            <p className="text-sm">{msg.message}</p>
            <p
              className={`text-xs mt-1 ${
                msg.sender_type === 'visitor' ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}
            >
              {formatTime(msg.created_at)}
            </p>
          </div>
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default ChatMessageList;
