import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageCircle, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface OperatorMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

interface OperatorProfile {
  user_id: string;
  avatar_url: string | null;
  full_name: string | null;
  email: string | null;
}

interface OperatorChatPanelProps {
  currentUserId: string;
  recipientId: string;
  recipientProfile: OperatorProfile | null;
  onClose: () => void;
}

const OperatorChatPanel = memo(function OperatorChatPanel({
  currentUserId,
  recipientId,
  recipientProfile,
  onClose,
}: OperatorChatPanelProps) {
  const [messages, setMessages] = useState<OperatorMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch messages between current user and recipient
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('operator_messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as OperatorMessage[]);
      
      // Mark unread messages as read
      const unreadIds = data
        .filter(m => m.recipient_id === currentUserId && !m.read_at)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        await supabase
          .from('operator_messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds);
      }
    }
    setLoading(false);
  }, [currentUserId, recipientId]);

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`operator-chat-${currentUserId}-${recipientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'operator_messages',
        },
        (payload) => {
          const newMsg = payload.new as OperatorMessage;
          // Only add if it's between these two users
          if (
            (newMsg.sender_id === currentUserId && newMsg.recipient_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.recipient_id === currentUserId)
          ) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            
            // Mark as read if we're the recipient
            if (newMsg.recipient_id === currentUserId) {
              supabase
                .from('operator_messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', newMsg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId, recipientId, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    await supabase.from('operator_messages').insert({
      sender_id: currentUserId,
      recipient_id: recipientId,
      message: trimmed,
    });

    setNewMessage('');
  };

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute inset-0 z-20 bg-card flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-gradient-to-r from-primary/10 to-violet-500/10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        {recipientProfile?.avatar_url ? (
          <img
            src={recipientProfile.avatar_url}
            alt={recipientProfile.full_name || 'Operator'}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-500/50"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {(recipientProfile?.full_name || recipientProfile?.email || 'O').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {recipientProfile?.full_name || recipientProfile?.email?.split('@')[0] || 'Operator'}
          </p>
          <p className="text-[10px] text-amber-500">Operator</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation!</p>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.sender_id === currentUserId
                      ? 'bg-gradient-to-r from-primary to-violet-500 text-white'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  <p>{msg.message}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.sender_id === currentUserId
                        ? 'text-white/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-border flex gap-2"
      >
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Message operator..."
          className="flex-1 bg-secondary/50 border-border"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!newMessage.trim()}
          className="bg-primary hover:bg-primary/90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </motion.div>
  );
});

export default OperatorChatPanel;
