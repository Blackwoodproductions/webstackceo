import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  isTyping?: boolean;
}

interface UseChatOptions {
  sessionId?: string;
  onError?: (error: Error) => void;
}

export const useChat = (options: UseChatOptions = {}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    if (options.sessionId) return options.sessionId;
    const stored = sessionStorage.getItem('ai_chat_session');
    if (stored) return stored;
    const newId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem('ai_chat_session', newId);
    return newId;
  });
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const initRef = useRef(false);

  // Initialize session with AI assistant
  const initSession = useCallback(async () => {
    if (initRef.current) return;
    initRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'start_session',
          sessionId,
          visitorInfo: {
            currentPage: window.location.pathname,
          },
        },
      });

      if (error) throw error;

      if (data?.session?.id) {
        setDbSessionId(data.session.id);
      }

      if (data?.greeting) {
        setMessages([{
          id: 'greeting',
          content: data.greeting,
          role: 'assistant',
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Failed to init chat session:', error);
      // Fallback greeting if API fails
      setMessages([{
        id: 'greeting',
        content: "Hi! 👋 How can I help you today?",
        role: 'assistant',
        timestamp: new Date(),
      }]);
    }
  }, [sessionId]);

  // Send message to AI
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Add typing indicator
    const typingId = `typing-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: typingId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isTyping: true,
    }]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: content.trim(),
          sessionId,
          visitorInfo: {
            currentPage: window.location.pathname,
          },
        },
      });

      if (error) throw error;

      // Remove typing indicator and add response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [...filtered, {
          id: `assistant-${Date.now()}`,
          content: data?.message || data?.fallbackMessage || "I'm here to help!",
          role: 'assistant',
          timestamp: new Date(),
        }];
      });

      return data;
    } catch (error) {
      console.error('Chat error:', error);
      // Remove typing indicator and show error
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [...filtered, {
          id: `error-${Date.now()}`,
          content: "Sorry, I'm having trouble connecting. Please try again.",
          role: 'assistant',
          timestamp: new Date(),
        }];
      });
      options.onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading, options]);

  // Request human handoff
  const requestHuman = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'request_human',
          sessionId,
          message: 'User requested human assistance',
        },
      });

      if (data?.message) {
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          content: data.message,
          role: 'system',
          timestamp: new Date(),
        }]);
      }

      return data;
    } catch (error) {
      console.error('Handoff error:', error);
    }
  }, [sessionId]);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
    sessionStorage.removeItem('ai_chat_session');
    initRef.current = false;
  }, []);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!dbSessionId) return;

    const channel = supabase
      .channel(`ai-chat-${dbSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_chat_messages',
          filter: `session_id=eq.${dbSessionId}`,
        },
        (payload) => {
          const msg = payload.new as { id: string; content: string; role: string; created_at: string };
          // Only add if not already in messages (avoid duplicates)
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            // Skip if this is our own message
            if (msg.role === 'user') return prev;
            return [...prev, {
              id: msg.id,
              content: msg.content,
              role: msg.role as 'assistant' | 'system',
              timestamp: new Date(msg.created_at),
            }];
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [dbSessionId]);

  return {
    messages,
    isLoading,
    sendMessage,
    requestHuman,
    clearChat,
    initSession,
    sessionId,
  };
};
