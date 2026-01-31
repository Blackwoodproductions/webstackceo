import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MessageCircle, Send, X, Minimize2, Maximize2, User, Clock, Bell
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant two-tone notification
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    playTone(880, now, 0.15); // A5
    playTone(1174.66, now + 0.15, 0.2); // D6
    
    // Clean up after sounds finish
    setTimeout(() => audioContext.close(), 500);
  } catch (e) {
    console.warn('Could not play notification sound:', e);
  }
};

interface ChatConversation {
  id: string;
  session_id: string;
  status: string;
  started_at: string;
  last_message_at: string;
  visitor_name: string | null;
  visitor_email: string | null;
  current_page: string | null;
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

type OperatorStatus = 'online' | 'busy' | 'away' | 'offline';

interface FloatingChatBarProps {
  isOnline: boolean;
  selectedChatId?: string | null;
  onChatClose?: () => void;
  operatorStatus?: OperatorStatus;
  onOperatorStatusChange?: (status: OperatorStatus) => void;
}

const FloatingChatBar = ({ isOnline, selectedChatId, onChatClose, operatorStatus = 'online', onOperatorStatusChange }: FloatingChatBarProps) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const [newMessages, setNewMessages] = useState<Record<string, string>>({});
  const messagesEndRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const openingChatsRef = useRef<Set<string>>(new Set());

  // Fetch active conversations
  const fetchConversations = async () => {
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .in('status', ['active', 'pending'])
      .order('last_message_at', { ascending: false });
    
    if (data) {
      setConversations(data as ChatConversation[]);
    }
  };

  const openChat = async (conversation: ChatConversation) => {
    // Prevent duplicate opens using ref
    if (openingChatsRef.current.has(conversation.id)) {
      return;
    }
    
    // Check if already open in state
    setOpenChats(prev => {
      if (prev.some(oc => oc.conversation.id === conversation.id)) {
        // Already open, just maximize it
        return prev.map(oc => 
          oc.conversation.id === conversation.id 
            ? { ...oc, isMinimized: false, hasUnread: false }
            : oc
        );
      }
      return prev;
    });

    // Mark as opening
    openingChatsRef.current.add(conversation.id);

    // Fetch messages
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    setOpenChats(prev => {
      // Double-check it's not already open
      if (prev.some(oc => oc.conversation.id === conversation.id)) {
        openingChatsRef.current.delete(conversation.id);
        return prev;
      }
      
      openingChatsRef.current.delete(conversation.id);
      return [...prev, {
        conversation,
        messages: (msgs || []) as ChatMessage[],
        isMinimized: false,
        hasUnread: false,
      }];
    });
  };

  const closeChat = (conversationId: string) => {
    setOpenChats(prev => prev.filter(oc => oc.conversation.id !== conversationId));
    if (onChatClose) onChatClose();
  };

  const toggleMinimize = (conversationId: string) => {
    setOpenChats(prev => prev.map(oc => 
      oc.conversation.id === conversationId 
        ? { ...oc, isMinimized: !oc.isMinimized, hasUnread: false }
        : { ...oc, isMinimized: true } // Minimize all others when expanding one
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

  // Open chat from sidebar selection
  useEffect(() => {
    if (selectedChatId && isOnline) {
      const conv = conversations.find(c => c.id === selectedChatId);
      if (conv) {
        openChat(conv);
      } else {
        // Fetch the conversation if not in current list
        supabase
          .from('chat_conversations')
          .select('*')
          .eq('id', selectedChatId)
          .single()
          .then(({ data }) => {
            if (data) {
              openChat(data as ChatConversation);
            }
          });
      }
    }
  }, [selectedChatId, conversations, isOnline]);

  useEffect(() => {
    if (isOnline) {
      fetchConversations();
    }

    // Subscribe to new conversations
    const convChannel = supabase
      .channel('floating-conversations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_conversations' },
        () => {
          if (isOnline) {
            playNotificationSound(); // Play sound for new conversations
            fetchConversations();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_conversations' },
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
                
                // Play notification sound for new visitor messages
                if (newMsg.sender_type === 'visitor') {
                  playNotificationSound();
                }
                
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

  const expandedChat = openChats.find(c => !c.isMinimized);
  const minimizedChats = openChats.filter(c => c.isMinimized);

  return (
    <div className="fixed bottom-0 right-0 z-50 flex items-end gap-3 p-4">
      {/* Operator Status Selector - Always visible when online */}
      {onOperatorStatusChange && (
        <div className="mb-2 mr-2">
          <Select value={operatorStatus} onValueChange={(v) => onOperatorStatusChange(v as OperatorStatus)}>
            <SelectTrigger className="h-8 w-[110px] text-xs bg-card border-border shadow-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-[60]">
              <SelectItem value="online">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Online
                </div>
              </SelectItem>
              <SelectItem value="busy">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Busy
                </div>
              </SelectItem>
              <SelectItem value="away">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  Away
                </div>
              </SelectItem>
              <SelectItem value="offline">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-500" />
                  Offline
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Always show status indicator when online */}
      {openChats.length === 0 && pendingCount === 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-lg"
        >
          <div className={`w-2 h-2 rounded-full ${operatorStatus === 'online' ? 'bg-green-500' : operatorStatus === 'busy' ? 'bg-amber-500' : operatorStatus === 'away' ? 'bg-yellow-500' : 'bg-gray-500'} animate-pulse`} />
          <span className="text-sm text-muted-foreground">Chat ready</span>
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      )}

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

      {/* Stacked minimized chats */}
      {minimizedChats.length > 0 && (
        <div className="flex flex-col-reverse gap-1">
          <AnimatePresence>
            {minimizedChats.map((chat, index) => (
              <motion.div
                key={chat.conversation.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300, delay: index * 0.05 }}
                className="bg-card border border-border rounded-lg shadow-lg overflow-hidden w-56 h-12 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => toggleMinimize(chat.conversation.id)}
              >
                <div 
                  className={`flex items-center justify-between px-3 py-2 h-full ${
                    chat.hasUnread 
                      ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                      : 'bg-gradient-to-r from-cyan-500 to-violet-500'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm font-medium text-white truncate">
                      {chat.conversation.visitor_name || 'Visitor'}
                    </p>
                    {chat.hasUnread && (
                      <Badge className="bg-white text-red-500 text-xs px-1.5 py-0 animate-pulse">
                        New
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Maximize2 className="w-3.5 h-3.5 text-white" />
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Expanded chat window (only one at a time) */}
      <AnimatePresence>
        {expandedChat && (
          <motion.div
            key={expandedChat.conversation.id}
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-card border border-border rounded-t-xl shadow-2xl overflow-hidden flex flex-col w-80 h-96"
          >
            {/* Header */}
            <div 
              className={`flex items-center justify-between px-3 py-2 cursor-pointer ${
                expandedChat.hasUnread 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                  : 'bg-gradient-to-r from-cyan-500 to-violet-500'
              }`}
              onClick={() => toggleMinimize(expandedChat.conversation.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {expandedChat.conversation.visitor_name || 'Visitor'}
                    </p>
                    <p className="text-xs text-white/70 truncate">
                      {expandedChat.conversation.current_page || 'Unknown page'} · {formatDistanceToNow(new Date(expandedChat.conversation.started_at), { addSuffix: true })}
                    </p>
                  </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMinimize(expandedChat.conversation.id);
                  }}
                  className="p-1 rounded hover:bg-white/20 text-white"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseConversation(expandedChat.conversation.id);
                  }}
                  className="p-1 rounded hover:bg-white/20 text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {expandedChat.messages.map((msg) => (
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
                <div ref={(el) => { messagesEndRefs.current[expandedChat.conversation.id] = el; }} />
              </div>
            </ScrollArea>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(expandedChat.conversation.id);
              }}
              className="p-2 border-t border-border flex gap-2"
            >
              <Input
                value={newMessages[expandedChat.conversation.id] || ''}
                onChange={(e) => setNewMessages(prev => ({ 
                  ...prev, 
                  [expandedChat.conversation.id]: e.target.value 
                }))}
                placeholder="Type a reply..."
                className="flex-1 h-8 text-sm"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-8 w-8"
                disabled={!newMessages[expandedChat.conversation.id]?.trim()}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingChatBar;