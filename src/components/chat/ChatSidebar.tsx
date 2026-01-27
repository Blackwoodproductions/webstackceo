import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, ChevronRight, ChevronLeft, X, Send, User, 
  Clock, Bell, Radio
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChatConversation {
  id: string;
  session_id: string;
  status: string;
  visitor_name: string | null;
  visitor_email: string | null;
  last_message_at: string;
  current_page: string | null;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  message: string;
  sender_type: 'visitor' | 'operator' | 'system';
  created_at: string;
}

interface ChatSidebarProps {
  isOnline: boolean;
  onNewChat?: () => void;
}

// Notification sound
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    const now = audioContext.currentTime;
    playTone(880, now, 0.12);
    playTone(1174.66, now + 0.12, 0.15);
    setTimeout(() => audioContext.close(), 400);
  } catch (e) {
    console.warn('Could not play notification sound:', e);
  }
};

export const ChatSidebar = memo(({ isOnline, onNewChat }: ChatSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .in('status', ['active', 'pending'])
      .order('last_message_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setConversations(data as ChatConversation[]);
      
      // Check for new chats
      if (data.length > prevCountRef.current && prevCountRef.current > 0) {
        setHasUnread(true);
        playNotificationSound();
        onNewChat?.();
      }
      prevCountRef.current = data.length;
    }
  }, [onNewChat]);

  // Fetch messages for selected chat
  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data as ChatMessage[]);
    }
  }, []);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return;
    
    setSending(true);
    try {
      await supabase.from('chat_messages').insert({
        conversation_id: selectedChat,
        sender_type: 'operator',
        message: newMessage.trim(),
      });

      await supabase
        .from('chat_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedChat);

      setNewMessage('');
    } finally {
      setSending(false);
    }
  };

  // Close conversation
  const handleClose = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from('chat_conversations')
      .update({ status: 'closed' })
      .eq('id', id);
    
    if (selectedChat === id) {
      setSelectedChat(null);
      setMessages([]);
    }
    fetchConversations();
  };

  // Initial fetch and subscriptions
  useEffect(() => {
    if (!isOnline) return;
    
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);

    const channel = supabase
      .channel('chat-sidebar-convos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_conversations' },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, [isOnline, fetchConversations]);

  // Subscribe to messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    fetchMessages(selectedChat);

    const channel = supabase
      .channel(`chat-sidebar-msgs-${selectedChat}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${selectedChat}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender_type === 'visitor') {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [selectedChat, fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear unread when expanded
  useEffect(() => {
    if (isExpanded) setHasUnread(false);
  }, [isExpanded]);

  if (!isOnline) return null;

  const activeCount = conversations.length;

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full z-40 flex transition-all duration-300 ease-out',
        isExpanded ? 'w-80' : 'w-12'
      )}
      style={{ contain: 'layout' }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full',
          'w-6 h-20 rounded-l-lg bg-card border border-r-0 border-border',
          'flex items-center justify-center hover:bg-secondary transition-colors',
          'shadow-lg'
        )}
      >
        {isExpanded ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        )}
        {hasUnread && !isExpanded && (
          <span className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-destructive animate-pulse" />
        )}
      </button>

      {/* Sidebar Content */}
      <div className="flex-1 bg-card border-l border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            {isExpanded && (
              <div>
                <h3 className="font-semibold text-sm">Chat Center</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Radio className="w-3 h-3 text-green-500" />
                  <span>{activeCount} active</span>
                </div>
              </div>
            )}
          </div>
          {isExpanded && hasUnread && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              <Bell className="w-3 h-3 mr-1" />
              New
            </Badge>
          )}
        </div>

        {isExpanded && (
          <>
            {/* Conversation List or Chat View */}
            {!selectedChat ? (
              <ScrollArea className="flex-1 p-2">
                <AnimatePresence>
                  {conversations.map((conv, idx) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => setSelectedChat(conv.id)}
                      className={cn(
                        'p-3 rounded-lg cursor-pointer mb-2 transition-all',
                        'bg-secondary/30 hover:bg-secondary/60 border border-transparent',
                        'hover:border-primary/20 hover:shadow-sm'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="text-sm font-medium truncate max-w-[120px]">
                            {conv.visitor_name || conv.visitor_email || 'Visitor'}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleClose(conv.id, e)}
                          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                      </div>
                      {conv.current_page && (
                        <p className="text-xs text-muted-foreground/70 truncate mt-1">
                          {conv.current_page}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {conversations.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No active chats</p>
                    <p className="text-xs mt-1">Visitors will appear here</p>
                  </div>
                )}
              </ScrollArea>
            ) : (
              <>
                {/* Chat View Header */}
                <div className="p-2 border-b border-border flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setSelectedChat(null);
                      setMessages([]);
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conversations.find(c => c.id === selectedChat)?.visitor_name || 'Visitor'}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex',
                          msg.sender_type === 'operator' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                            msg.sender_type === 'operator'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : msg.sender_type === 'visitor'
                              ? 'bg-secondary text-foreground rounded-bl-sm'
                              : 'bg-muted text-muted-foreground italic text-xs'
                          )}
                        >
                          <p>{msg.message}</p>
                          <p className={cn(
                            'text-[10px] mt-1',
                            msg.sender_type === 'operator' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                          )}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="p-2 border-t border-border flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Reply..."
                    className="flex-1 h-9 text-sm"
                    disabled={sending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9"
                    disabled={!newMessage.trim() || sending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            )}
          </>
        )}

        {/* Collapsed State */}
        {!isExpanded && (
          <div className="flex-1 flex flex-col items-center py-4 gap-2">
            <div className="relative">
              <MessageCircle className="w-5 h-5 text-primary" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ChatSidebar.displayName = 'ChatSidebar';

export default ChatSidebar;
