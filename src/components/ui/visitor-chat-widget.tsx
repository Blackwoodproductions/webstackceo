import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Minimize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  id: string;
  conversation_id: string;
  message: string;
  sender_type: "visitor" | "operator" | "system";
  created_at: string;
}

/**
 * VisitorChatWidget - Chat widget for website visitors (non-admin users)
 * 
 * This component:
 * - Monitors for operator-initiated chat conversations
 * - Automatically opens when an operator sends a message
 * - Allows visitors to respond in real-time
 * - Shows notification badge for new messages
 */
const VisitorChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoOpenedRef = useRef(false);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      const now = audioContext.currentTime;
      playTone(880, now, 0.15);
      playTone(1174.66, now + 0.15, 0.2);
      setTimeout(() => audioContext.close(), 500);
    } catch (e) {
      console.warn("Could not play notification sound:", e);
    }
  }, []);

  // Initialize session ID
  useEffect(() => {
    const visitorSessionId = sessionStorage.getItem("webstack_session_id");
    if (visitorSessionId) {
      setSessionId(visitorSessionId);
    } else {
      const storedSessionId = sessionStorage.getItem("chat_session_id");
      if (storedSessionId) {
        setSessionId(storedSessionId);
      } else {
        const newSessionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem("chat_session_id", newSessionId);
        setSessionId(newSessionId);
      }
    }
  }, []);

  // Check if user is admin (admins use LiveChatWidget instead)
  useEffect(() => {
    const checkAdmin = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // Check admin status
        const { data: hasAdminRole } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });
        
        setIsAdmin(hasAdminRole === true);
      } catch {
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    checkAdmin();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check for existing conversations and subscribe to new ones
  useEffect(() => {
    if (!sessionId || isAdmin === null || isAdmin) return;

    const checkExistingConversation = async () => {
      const { data: conversation } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("session_id", sessionId)
        .eq("status", "active")
        .maybeSingle();

      if (conversation) {
        setConversationId(conversation.id);
        
        // Fetch messages
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true });

        if (msgs) {
          setMessages(msgs as ChatMessage[]);
          
          // Auto-open if there are operator messages and we haven't auto-opened yet
          const hasOperatorMessages = msgs.some(m => m.sender_type === "operator");
          if (hasOperatorMessages && !hasAutoOpenedRef.current) {
            hasAutoOpenedRef.current = true;
            setIsOpen(true);
            playNotificationSound();
          }
        }
      }
    };

    checkExistingConversation();

    // Subscribe to new conversations for this session
    const convChannel = supabase
      .channel(`visitor-conversations-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_conversations",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newConv = payload.new as { id: string };
          setConversationId(newConv.id);
          setMessages([]);
        }
      )
      .subscribe();

    return () => {
      convChannel.unsubscribe();
    };
  }, [sessionId, isAdmin, playNotificationSound]);

  // Subscribe to messages for current conversation
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`visitor-chat-${conversationId}`)
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
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Auto-open and notify for operator messages
          if (newMsg.sender_type === "operator") {
            if (!isOpen) {
              setIsOpen(true);
              setHasNewMessage(true);
            }
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, isOpen, playNotificationSound]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Send message handler
  const handleSendMessage = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    let convId = conversationId;
    
    // Create conversation if none exists
    if (!convId) {
      const { data: newConv } = await supabase
        .from("chat_conversations")
        .insert({
          session_id: sessionId,
          status: "active",
          current_page: window.location.pathname,
        })
        .select("id")
        .single();

      if (newConv) {
        convId = newConv.id;
        setConversationId(convId);
      } else {
        return;
      }
    }

    // Send the message
    await supabase.from("chat_messages").insert({
      conversation_id: convId,
      sender_type: "visitor",
      message: trimmed,
    });

    setNewMessage("");
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Don't render for admins (they use LiveChatWidget) or while loading
  if (isLoading || isAdmin) return null;

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            onClick={() => {
              setIsOpen(true);
              setHasNewMessage(false);
            }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl transition-shadow duration-150 flex items-center justify-center"
            aria-label="Open chat"
          >
            <MessageCircle className="w-6 h-6" />
            {/* Notification badge */}
            {(hasNewMessage || messages.some(m => m.sender_type === "operator")) && (
              <span className={`absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-background ${hasNewMessage ? "bg-destructive animate-pulse" : "bg-emerald-400"}`} />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[450px] max-h-[80vh] bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Live Chat</h3>
                  <p className="text-xs text-white/70">We typically reply instantly</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded hover:bg-white/20 transition-colors"
                  aria-label="Minimize chat"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded hover:bg-white/20 transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No messages yet.</p>
                    <p className="text-xs mt-1">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === "visitor" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                          msg.sender_type === "visitor"
                            ? "bg-primary text-primary-foreground"
                            : msg.sender_type === "operator"
                            ? "bg-secondary text-foreground"
                            : "bg-muted text-muted-foreground italic text-xs"
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            msg.sender_type === "visitor"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
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
                handleSendMessage();
              }}
              className="p-3 border-t border-border flex gap-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
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
        )}
      </AnimatePresence>
    </>
  );
};

export default VisitorChatWidget;
