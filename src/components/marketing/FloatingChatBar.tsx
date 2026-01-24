import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, Send, X, Minimize2, Maximize2, User, Clock, Bell
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatConversation {
  id: string;
  session_id: string;
  status: string;
  started_at: string;
  last_message_at: string;
  visitor_name: string | null;
  visitor_email: string | null;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  message: string;
  sender_type: 'visitor' | 'operator' | 'system';
  created_at: string;
}

interface OpenChat {
  conversation: ChatConversation;
  messages: ChatMessage[];
  isMinimized: boolean;
  hasUnread: boolean;
}

interface FloatingChatBarProps {
  isOnline: boolean;
}

const FloatingChatBar = ({ isOnline }: FloatingChatBarProps) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const [newMessages, setNewMessages] = useState<Record<string, string>>({});
  const messagesEndRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch active conversations
  const fetchConversations = async () => {
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .in('status', ['active', 'pending'])
      .order('last_message_at', { ascending: false });
    
    if (data) {
      setConversations(data as ChatConversation[]);
      
      // Auto-open new conversations that aren't already open
      data.forEach((conv: ChatConversation) => {
        const isOpen = openChats.some(oc => oc.conversation.id === conv.id);
        if (!isOpen && isOnline) {
          openChat(conv);
        }
      });
    }
  };

  const openChat = async (conversation: ChatConversation) => {
    // Check if already open
    if (openChats.some(oc => oc.conversation.id === conversation.id)) {
      // Just maximize it
      setOpenChats(prev => prev.map(oc => 
        oc.conversation.id === conversation.id 
          ? { ...oc, isMinimized: false, hasUnread: false }
          : oc
      ));
      return;
    }

    // Fetch messages
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    setOpenChats(prev => [...prev, {
      conversation,
      messages: (msgs || []) as ChatMessage[],
      isMinimized: false,
      hasUnread: false,
    }]);
  };

  const closeChat = (conversationId: string) => {
    setOpenChats(prev => prev.filter(oc => oc.conversation.id !== conversationId));
  };

  const toggleMinimize = (conversationId: string) => {
    setOpenChats(prev => prev.map(oc => 
      oc.conversation.id === conversationId 
        ? { ...oc, isMinimized: !oc.isMinimized, hasUnread: false }
        : oc
    ));
  };

  const handleSendMessage = async (conversationId: string) => {
    const message = newMessages[conversationId]?.trim();
    if (!message) return;

    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      sender_type: 'operator',
      message,
    });

    await supabase
      .from('chat_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    setNewMessages(prev => ({ ...prev, [conversationId]: '' }));
  };

  const handleCloseConversation = async (conversationId: string) => {
    await supabase
      .from('chat_conversations')
      .update({ status: 'closed' })
      .eq('id', conversationId);
    
    closeChat(conversationId);
  };

  useEffect(() => {
    if (isOnline) {
      fetchConversations();
    }

    // Subscribe to new conversations
    const convChannel = supabase
      .channel('floating-conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_conversations' },
        () => {
          if (isOnline) fetchConversations();
        }
      )
      .subscribe();

    return () => {
      convChannel.unsubscribe();
    };
  }, [isOnline]);

  // Subscribe to messages for open chats
  useEffect(() => {
    const channels: ReturnType<typeof supabase.channel>[] = [];

    openChats.forEach(chat => {
      const channel = supabase
        .channel(`floating-messages-${chat.conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${chat.conversation.id}`,
          },
          (payload) => {
            const newMsg = payload.new as ChatMessage;
            setOpenChats(prev => prev.map(oc => {
              if (oc.conversation.id === chat.conversation.id) {
                const alreadyExists = oc.messages.some(m => m.id === newMsg.id);
                if (alreadyExists) return oc;
                return {
                  ...oc,
                  messages: [...oc.messages, newMsg],
                  hasUnread: oc.isMinimized && newMsg.sender_type === 'visitor',
                };
              }
              return oc;
            }));
          }
        )
        .subscribe();
      
      channels.push(channel);
    });

    return () => {
      channels.forEach(ch => ch.unsubscribe());
    };
  }, [openChats.map(oc => oc.conversation.id).join(',')]);

  // Auto-scroll to bottom
  useEffect(() => {
    openChats.forEach(chat => {
      if (!chat.isMinimized) {
        messagesEndRefs.current[chat.conversation.id]?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }, [openChats]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const pendingCount = conversations.filter(c => 
    !openChats.some(oc => oc.conversation.id === c.id)
  ).length;

  if (!isOnline) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex items-end gap-2 p-4">
      {/* Pending chats indicator */}
      {pendingCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-2"
        >
          <Button
            onClick={() => {
              const pending = conversations.find(c => 
                !openChats.some(oc => oc.conversation.id === c.id)
              );
              if (pending) openChat(pending);
            }}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full px-4 py-2 shadow-lg"
          >
            <Bell className="w-4 h-4 mr-2 animate-bounce" />
            {pendingCount} new chat{pendingCount > 1 ? 's' : ''}
          </Button>
        </motion.div>
      )}

      {/* Open chat windows */}
      <AnimatePresence>
        {openChats.map((chat) => (
          <motion.div
            key={chat.conversation.id}
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`bg-card border border-border rounded-t-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
              chat.isMinimized ? 'w-56 h-12' : 'w-80 h-96'
            }`}
          >
            {/* Header */}
            <div 
              className={`flex items-center justify-between px-3 py-2 cursor-pointer ${
                chat.hasUnread 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                  : 'bg-gradient-to-r from-cyan-500 to-violet-500'
              }`}
              onClick={() => toggleMinimize(chat.conversation.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {chat.conversation.visitor_name || 'Visitor'}
                  </p>
                  {!chat.isMinimized && (
                    <p className="text-xs text-white/70 truncate">
                      {formatDistanceToNow(new Date(chat.conversation.started_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
                {chat.hasUnread && (
                  <Badge className="bg-white text-red-500 text-xs px-1.5 py-0 animate-pulse">
                    New
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMinimize(chat.conversation.id);
                  }}
                  className="p-1 rounded hover:bg-white/20 text-white"
                >
                  {chat.isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseConversation(chat.conversation.id);
                  }}
                  className="p-1 rounded hover:bg-white/20 text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!chat.isMinimized && (
              <>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2">
                    {chat.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'operator' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-1.5 text-sm ${
                            msg.sender_type === 'operator'
                              ? 'bg-primary text-primary-foreground'
                              : msg.sender_type === 'visitor'
                              ? 'bg-secondary text-foreground'
                              : 'bg-muted text-muted-foreground italic text-xs'
                          }`}
                        >
                          <p>{msg.message}</p>
                          <p className={`text-[10px] mt-0.5 ${
                            msg.sender_type === 'operator' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={(el) => { messagesEndRefs.current[chat.conversation.id] = el; }} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(chat.conversation.id);
                  }}
                  className="p-2 border-t border-border flex gap-2"
                >
                  <Input
                    value={newMessages[chat.conversation.id] || ''}
                    onChange={(e) => setNewMessages(prev => ({ 
                      ...prev, 
                      [chat.conversation.id]: e.target.value 
                    }))}
                    placeholder="Type a reply..."
                    className="flex-1 h-8 text-sm"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="h-8 w-8"
                    disabled={!newMessages[chat.conversation.id]?.trim()}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FloatingChatBar;