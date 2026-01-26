import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, Send, Bell, X, User, Clock, 
  CheckCircle, AlertCircle, Radio
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

const ChatOperatorPanel = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data as ChatMessage[]);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Subscribe to new conversations
    const convChannel = supabase
      .channel('operator-conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_conversations' },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      convChannel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);

      // Subscribe to messages for this conversation
      const msgChannel = supabase
        .channel(`operator-messages-${selectedConversation}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${selectedConversation}`,
          },
          (payload) => {
            const newMsg = payload.new as ChatMessage;
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        )
        .subscribe();

      return () => {
        msgChannel.unsubscribe();
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    setSending(true);
    
    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: selectedConversation,
      sender_type: 'operator',
      message: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
      
      // Update last_message_at
      await supabase
        .from('chat_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation);
    }
    
    setSending(false);
  };

  const closeConversation = async (conversationId: string) => {
    await supabase
      .from('chat_conversations')
      .update({ status: 'closed' })
      .eq('id', conversationId);
    
    if (selectedConversation === conversationId) {
      setSelectedConversation(null);
      setMessages([]);
    }
    fetchConversations();
  };

  const activeCount = conversations.filter(c => c.status === 'active').length;

  return (
    <Card className="relative p-4 h-[400px] flex flex-col overflow-hidden bg-gradient-to-br from-card via-card/98 to-violet-500/5 border-border/50">
      {/* High-tech background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.02,
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* Scanning line */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent pointer-events-none"
        animate={{ y: ['-100%', '200%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Floating particles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-violet-400 pointer-events-none"
          style={{ left: `${20 + i * 20}%`, top: `${30 + (i % 3) * 20}%` }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}

      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <MessageCircle className="w-4 h-4 text-white" />
          </motion.div>
          <h3 className="font-bold text-foreground">Live Chat</h3>
          {activeCount > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
              <Bell className="w-3 h-3 mr-1" />
              {activeCount}
            </Badge>
          )}
        </div>
        <motion.span
          className="flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Radio className="w-2.5 h-2.5" />
          LIVE
        </motion.span>
      </div>

      <div className="relative z-10 flex-1 flex gap-3 overflow-hidden">
        {/* Conversation List */}
        <div className="w-1/3 border-r border-border/50 pr-3">
          <ScrollArea className="h-full">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No active chats</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv, idx) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedConversation === conv.id
                        ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/10 border border-violet-500/30 shadow-lg shadow-violet-500/10'
                        : 'bg-secondary/30 hover:bg-secondary/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-medium truncate max-w-[80px]">
                          {conv.visitor_name || 'Visitor'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeConversation(conv.id);
                        }}
                        className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-3">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`flex ${msg.sender_type === 'operator' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                          msg.sender_type === 'operator'
                            ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20'
                            : msg.sender_type === 'visitor'
                            ? 'bg-secondary/80 text-foreground border border-border/50'
                            : 'bg-muted/50 text-muted-foreground italic'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2 mt-3 pt-3 border-t border-border/50"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 bg-secondary/30 border-border/50"
                  disabled={sending}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={sending || !newMessage.trim()}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/20 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-violet-400/50" />
                </div>
                <p className="text-sm">Select a conversation</p>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ChatOperatorPanel;