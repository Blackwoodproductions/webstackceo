import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Minimize2, User, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  message: string;
  sender_type: 'visitor' | 'operator' | 'system';
  created_at: string;
}

interface LiveVisitor {
  session_id: string;
  first_page: string | null;
  last_activity_at: string;
  started_at: string;
  referrer: string | null;
}

// Extract domain from referrer URL
const getReferrerDomain = (referrer: string | null): string | null => {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch {
    return null;
  }
};

// Get favicon URL for a domain
const getFaviconUrl = (domain: string | null): string | null => {
  if (!domain) return null;
  // Use Google's favicon service for reliable favicon fetching
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
};

const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitor[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<LiveVisitor | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [referrerDomain, setReferrerDomain] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check for logged-in user
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || null);
      }
    };
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
        setUserName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || null);
      } else {
        setUserEmail(null);
        setUserName(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Fetch live visitors (active in last 5 minutes)
  const fetchLiveVisitors = useCallback(async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("visitor_sessions")
      .select("session_id, first_page, last_activity_at, started_at, referrer")
      .gte("last_activity_at", fiveMinutesAgo)
      .order("last_activity_at", { ascending: false })
      .limit(8);
    
    if (data) {
      setLiveVisitors(data.filter(v => v.session_id !== sessionId));
    }
  }, [sessionId]);

  // Poll for live visitors every 30 seconds
  useEffect(() => {
    fetchLiveVisitors();
    const interval = setInterval(fetchLiveVisitors, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveVisitors]);

  // Get or create session ID and fetch referrer
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem("chat_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("chat_session_id", newSessionId);
      setSessionId(newSessionId);
    }
    
    // Get referrer from document or sessionStorage
    const referrer = document.referrer || sessionStorage.getItem("visitor_referrer");
    if (referrer) {
      sessionStorage.setItem("visitor_referrer", referrer);
      const domain = getReferrerDomain(referrer);
      if (domain && domain !== window.location.hostname) {
        setReferrerDomain(domain);
      }
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
    const currentPage = window.location.pathname;
    
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        session_id: sessionId,
        status: "active",
        current_page: currentPage,
        visitor_email: userEmail,
        visitor_name: userName,
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

  // Generate visitor color based on session ID
  const getVisitorColor = (id: string) => {
    const colors = [
      'from-emerald-400 to-teal-500',
      'from-violet-400 to-purple-500',
      'from-amber-400 to-orange-500',
      'from-rose-400 to-pink-500',
      'from-sky-400 to-blue-500',
      'from-lime-400 to-green-500',
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get time since visitor started
  const getTimeSince = (timestamp: string) => {
    const mins = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h`;
  };

  const handleEngageVisitor = async (visitor: LiveVisitor) => {
    setSelectedVisitor(visitor);
    setIsOpen(true);
    setHasNewMessage(false);
    
    // Check if there's an existing conversation for this visitor
    const { data: existingConv } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("session_id", visitor.session_id)
      .eq("status", "active")
      .maybeSingle();
    
    if (existingConv) {
      setConversationId(existingConv.id);
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", existingConv.id)
        .order("created_at", { ascending: true });
      if (msgs) setMessages(msgs as ChatMessage[]);
    } else {
      // Create new conversation for operator to engage visitor
      const { data: newConv } = await supabase
        .from("chat_conversations")
        .insert({
          session_id: visitor.session_id,
          status: "active",
          current_page: visitor.first_page,
        })
        .select("id")
        .single();
      
      if (newConv) {
        setConversationId(newConv.id);
        setMessages([]);
        await supabase.from("chat_messages").insert({
          conversation_id: newConv.id,
          sender_type: "system",
          message: `Chat initiated with visitor on ${visitor.first_page || 'homepage'}`,
        });
      }
    }
  };

  return (
    <TooltipProvider>
      {/* Chat Button Stack */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-center gap-2">
            {/* Live Visitor Icons - stacked above main button */}
            {liveVisitors.slice(0, 5).map((visitor, index) => {
              const visitorReferrerDomain = getReferrerDomain(visitor.referrer);
              const visitorFaviconUrl = getFaviconUrl(visitorReferrerDomain);
              
              return (
                <Tooltip key={visitor.session_id}>
                  <TooltipTrigger asChild>
                    <motion.button
                      initial={{ scale: 0, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0, opacity: 0, y: 20 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.05 }}
                      onClick={() => handleEngageVisitor(visitor)}
                      className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${getVisitorColor(visitor.session_id)} text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center text-[10px] font-bold border-2 border-background group overflow-hidden`}
                      aria-label={`Engage visitor from ${visitorReferrerDomain || 'direct'}`}
                    >
                      {visitorFaviconUrl ? (
                        <img
                          src={visitorFaviconUrl}
                          alt={`From ${visitorReferrerDomain}`}
                          className="w-5 h-5 rounded-sm"
                          onError={(e) => {
                            // Replace with User icon on error
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <User className={`w-4 h-4 ${visitorFaviconUrl ? 'hidden' : ''}`} />
                      {/* Live pulse indicator */}
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-background">
                        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                      </span>
                      {/* Connection line */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-px h-2 bg-gradient-to-b from-border/50 to-transparent" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-card border-border">
                    <div className="flex items-center gap-2">
                      {visitorFaviconUrl && (
                        <img src={visitorFaviconUrl} alt="" className="w-3 h-3 rounded-sm" />
                      )}
                      {!visitorFaviconUrl && <Globe className="w-3 h-3 text-muted-foreground" />}
                      <span className="text-xs">{visitorReferrerDomain || visitor.first_page || '/'}</span>
                      <span className="text-[10px] text-muted-foreground">• {getTimeSince(visitor.started_at)}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            
            {/* Main Chat Button */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              onClick={handleOpen}
              className="relative w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group overflow-hidden"
              aria-label="Open chat"
            >
              {/* Show referrer favicon or default MessageCircle icon */}
              {referrerDomain && !faviconError ? (
                <img
                  src={getFaviconUrl(referrerDomain)!}
                  alt={`Visitor from ${referrerDomain}`}
                  className="w-7 h-7 rounded-sm"
                  onError={() => setFaviconError(true)}
                />
              ) : (
                <MessageCircle className="w-6 h-6" />
              )}
              {/* Status indicator */}
              <span className={`absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-background ${hasNewMessage ? 'bg-red-500' : 'bg-emerald-400'}`}>
                {hasNewMessage && <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />}
              </span>
              {/* Live visitor count badge */}
              {liveVisitors.length > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-background"
                >
                  {liveVisitors.length}
                </motion.span>
              )}
            </motion.button>
          </div>
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
    </TooltipProvider>
  );
};

export default LiveChatWidget;