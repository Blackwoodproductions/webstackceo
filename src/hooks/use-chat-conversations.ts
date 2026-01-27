import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  message: string;
  sender_type: 'visitor' | 'operator' | 'system';
  created_at: string;
}

export interface ChatConversation {
  id: string;
  session_id: string;
  status: string;
  started_at: string;
  last_message_at: string;
  visitor_name: string | null;
  visitor_email: string | null;
  current_page: string | null;
}

interface UseChatConversationsOptions {
  sessionId: string;
  enabled?: boolean;
  onNewMessage?: (message: ChatMessage) => void;
}

/**
 * Hook to manage chat conversations and messages with realtime subscriptions
 */
export const useChatConversations = ({
  sessionId,
  enabled = true,
  onNewMessage,
}: UseChatConversationsOptions) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const onNewMessageRef = useRef(onNewMessage);
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  // Load existing conversation
  const loadConversation = useCallback(async () => {
    if (!sessionId || !enabled) return;
    
    setIsLoading(true);
    
    try {
      const { data: conversation } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .maybeSingle();

      if (conversation) {
        setConversationId(conversation.id);
        
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });

        if (msgs) {
          setMessages(msgs as ChatMessage[]);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, enabled]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId || !enabled) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          onNewMessageRef.current?.(newMsg);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, enabled]);

  // Start a new conversation
  const startConversation = useCallback(async (
    options?: { visitorEmail?: string | null; visitorName?: string | null }
  ): Promise<string | null> => {
    const currentPage = window.location.pathname;
    
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        session_id: sessionId,
        status: 'active',
        current_page: currentPage,
        visitor_email: options?.visitorEmail,
        visitor_name: options?.visitorName,
      })
      .select('id')
      .single();

    if (data && !error) {
      setConversationId(data.id);
      
      // Add system welcome message
      await supabase.from('chat_messages').insert({
        conversation_id: data.id,
        sender_type: 'system',
        message: 'Hi there! 👋 How can we help you today?',
      });

      return data.id;
    }
    return null;
  }, [sessionId]);

  // Send a message
  const sendMessage = useCallback(async (
    message: string,
    senderType: 'visitor' | 'operator' = 'visitor'
  ): Promise<boolean> => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return false;

    let convId = conversationId;
    if (!convId) {
      convId = await startConversation();
      if (!convId) return false;
    }

    try {
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        sender_type: senderType,
        message: trimmedMessage,
      });
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [conversationId, startConversation]);

  return {
    conversationId,
    messages,
    isLoading,
    setConversationId,
    setMessages,
    startConversation,
    sendMessage,
    loadConversation,
  };
};
