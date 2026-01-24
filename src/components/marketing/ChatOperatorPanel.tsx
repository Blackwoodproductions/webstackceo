import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, Send, Bell, X, User, Clock, 
  CheckCircle, AlertCircle
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
    <Card className="p-4 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Live Chat</h3>
          {activeCount > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
              <Bell className="w-3 h-3 mr-1" />
              {activeCount}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* Conversation List */}
        <div className="w-1/3 border-r border-border pr-3">
          <ScrollArea className="h-full">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No active chats</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conv.id
                        ? 'bg-primary/20 border border-primary/30'
                        : 'bg-secondary/50 hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate max-w-[80px]">
                          {conv.visitor_name || 'Visitor'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeConversation(conv.id);
                        }}
                        className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                    </div>
                  </div>
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
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'operator' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                          msg.sender_type === 'operator'
                            ? 'bg-primary text-primary-foreground'
                            : msg.sender_type === 'visitor'
                            ? 'bg-secondary text-foreground'
                            : 'bg-muted text-muted-foreground italic'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2 mt-3 pt-3 border-t border-border"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ChatOperatorPanel;