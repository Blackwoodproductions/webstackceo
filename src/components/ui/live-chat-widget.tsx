import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, User } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

// Modular chat components
import { 
  ChatMessageList, 
  ChatInput, 
  ChatHeader, 
  VisitorAvatar,
  useChatUtils,
  useLiveVisitors,
  useChatConversations,
  getReferrerDomain,
  getFaviconUrl,
  type LiveVisitor,
} from "@/components/chat";

/**
 * LiveChatWidget - Admin-only floating chat widget
 * 
 * Features:
 * - Live visitor stack with deduplication
 * - Real-time chat messaging
 * - Profile avatars and referrer favicons
 * - Sound notifications for new messages
 */
const LiveChatWidget = () => {
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<LiveVisitor | null>(null);
  
  // User State
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [referrerDomain, setReferrerDomain] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  
  const { playNotificationSound } = useChatUtils();

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
    
    // Get referrer
    const referrer = document.referrer || sessionStorage.getItem("visitor_referrer");
    if (referrer) {
      sessionStorage.setItem("visitor_referrer", referrer);
      const domain = getReferrerDomain(referrer);
      if (domain && domain !== window.location.hostname) {
        setReferrerDomain(domain);
      }
    }
  }, []);

  // Live visitors with deduplication
  const { liveVisitors } = useLiveVisitors({
    sessionId,
    currentUserId,
    enabled: isAdmin && !isLoading,
  });

  // Chat conversations hook
  const { 
    conversationId, 
    messages, 
    sendMessage,
    setConversationId,
    setMessages,
    startConversation,
  } = useChatConversations({
    sessionId,
    enabled: !!sessionId,
    onNewMessage: useCallback((msg) => {
      if (msg.sender_type === 'operator' && !isOpen) {
        setHasNewMessage(true);
        playNotificationSound();
      }
    }, [isOpen, playNotificationSound]),
  });

  // Check for logged-in user and admin status
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      setIsAdmin(false);
      
      // Check cached profile for faster initial render
      const cachedProfile = localStorage.getItem('unified_google_profile');
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile);
          if (parsed.picture) setUserAvatar(parsed.picture);
          if (parsed.name) setUserName(parsed.name);
          if (parsed.email) setUserEmail(parsed.email);
        } catch {
          // Ignore parse errors
        }
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentUserId(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      
      setCurrentUserId(user.id);
      setUserEmail(user.email || null);
      setUserName(user.user_metadata?.full_name || user.user_metadata?.name || null);
      
      const metaAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
      if (metaAvatar) setUserAvatar(metaAvatar);
      
      // Check admin status
      try {
        const { data: hasAdminRole, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });
        setIsAdmin(hasAdminRole === true && !error);
      } catch {
        setIsAdmin(false);
      }
      
      // Fetch profile for most accurate avatar
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile?.avatar_url) setUserAvatar(profile.avatar_url);
      if (profile?.full_name) setUserName(profile.full_name);
      
      setIsLoading(false);
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUserId(null);
        setUserEmail(null);
        setUserName(null);
        setUserAvatar(null);
        setIsAdmin(false);
        return;
      }
      
      if (session?.user) {
        setCurrentUserId(session.user.id);
        setUserEmail(session.user.email || null);
        setUserName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || null);
        setUserAvatar(session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null);
        
        // Re-check admin status
        setTimeout(async () => {
          try {
            const { data: hasAdminRole, error } = await supabase.rpc('has_role', {
              _user_id: session.user.id,
              _role: 'admin'
            });
            setIsAdmin(hasAdminRole === true && !error);
          } catch {
            setIsAdmin(false);
          }
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url, full_name')
            .eq('user_id', session.user.id)
            .maybeSingle();
          if (profile?.avatar_url) setUserAvatar(profile.avatar_url);
          if (profile?.full_name) setUserName(profile.full_name);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Deduplicated visitor stack for rendering
  const visitorsForStack = useMemo(() => {
    const seen = new Set<string>();
    const getKey = (v: LiveVisitor) => {
      if (v.is_current_user) return "self";
      return v.user_id ? `u:${v.user_id}` : `s:${v.session_id}`;
    };

    return liveVisitors.filter((v) => {
      const k = getKey(v);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [liveVisitors]);

  // Engage a visitor
  const handleEngageVisitor = useCallback(async (visitor: LiveVisitor) => {
    setSelectedVisitor(visitor);
    setIsOpen(true);
    setHasNewMessage(false);
    
    // Check for existing conversation
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
      if (msgs) setMessages(msgs as any);
    } else {
      // Create new conversation
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
  }, [setConversationId, setMessages]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setHasNewMessage(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    await sendMessage(message, 'visitor');
  }, [sendMessage]);

  // Only show widget to admins
  if (isLoading) return null;
  if (!isAdmin) return null;

  return (
    <TooltipProvider>
      {/* Chat Button Stack */}
      <AnimatePresence>
        {!isOpen && (
          <div
            className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-center gap-2"
            style={{ contain: "layout paint", willChange: "transform" }}
          >
            {/* Live Visitor Icons */}
            {visitorsForStack.slice(0, 6).map((visitor, index) => (
              <VisitorAvatar
                key={visitor.is_current_user ? 'self' : visitor.user_id ? `u:${visitor.user_id}` : `s:${visitor.session_id}`}
                visitor={visitor}
                index={index}
                onClick={() => handleEngageVisitor(visitor)}
              />
            ))}
            
            {/* Main Chat Button */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              onClick={handleOpen}
              className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl transition-shadow duration-150 flex items-center justify-center group overflow-hidden"
              aria-label="Open chat"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : referrerDomain && !faviconError ? (
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
              <span className={`absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-background ${hasNewMessage ? 'bg-destructive' : 'bg-emerald-400'}`} />
              {/* Live visitor count badge */}
              {liveVisitors.length > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-emerald-500 text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
                  {liveVisitors.length}
                </span>
              )}
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            style={{ contain: "layout paint", willChange: "transform, opacity" }}
          >
            <ChatHeader
              onMinimize={handleClose}
              onClose={handleClose}
            />
            <ChatMessageList messages={messages} />
            <ChatInput onSend={handleSendMessage} />
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
};

export default LiveChatWidget;
