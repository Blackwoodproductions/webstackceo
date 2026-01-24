import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  message: string;
  sender_type: 'visitor' | 'operator' | 'system';
  created_at: string;
}

const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get or create session ID
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem("chat_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("chat_session_id", newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // Load existing conversation
  useEffect(() => {
    if (!sessionId) return;

    const loadConversation = async () => {
      const { data: conversation } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("session_id", sessionId)
        .eq("status", "active")
        .maybeSingle();

      if (conversation) {
        setConversationId(conversation.id);
        
        // Load messages
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true });

        if (msgs) {
          setMessages(msgs as ChatMessage[]);
        }
      }
    };

    loadConversation();
  }, [sessionId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          
          // Show notification if message is from operator and chat is closed
          if (newMsg.sender_type === 'operator' && !isOpen) {
            setHasNewMessage(true);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConversation = async () => {
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        session_id: sessionId,
        status: "active",
      })
      .select("id")
      .single();

    if (data && !error) {
      setConversationId(data.id);
      
      // Add system welcome message
      await supabase.from("chat_messages").insert({
        conversation_id: data.id,
        sender_type: "system",
        message: "Hi there! 👋 How can we help you today?",
      });

      return data.id;
    }
    return null;
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    let convId = conversationId;
    if (!convId) {
      convId = await startConversation();
      if (!convId) return;
    }

    // Insert message
    await supabase.from("chat_messages").insert({
      conversation_id: convId,
      sender_type: "visitor",
      message: message.trim(),
    });

    setMessage("");
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewMessage(false);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
            aria-label="Open chat"
          >
            <MessageCircle className="w-6 h-6" />
            {/* Notification dot */}
            <span className={`absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-background ${hasNewMessage ? 'bg-red-500 animate-bounce' : 'bg-green-400 animate-pulse'}`} />
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
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[500px] max-h-[80vh] glass-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-400 to-violet-500 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Webstack Support</h3>
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    Online now
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="Minimize chat"
                >
                  <Minimize2 className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Start a conversation!</p>
                </div>
              )}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender_type === 'visitor' ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.sender_type === 'visitor'
                        ? "bg-gradient-to-r from-cyan-400 to-violet-500 text-white rounded-br-md"
                        : msg.sender_type === 'operator'
                        ? "bg-primary/20 text-foreground rounded-bl-md border border-primary/30"
                        : "bg-secondary text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.sender_type === 'operator' && (
                      <p className="text-xs text-primary font-medium mb-1">Operator</p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender_type === 'visitor' ? "text-white/70" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-background">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-gradient-to-r from-cyan-400 to-violet-500 hover:opacity-90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Powered by Webstack.ceo
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LiveChatWidget;