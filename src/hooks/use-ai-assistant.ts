import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface AIConversation {
  id: string;
  title: string;
  domain?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageInfo {
  minutesUsed: number;
  minutesLimit: number;
  tier: string;
  canUse: boolean;
  isUnlimited: boolean;
  isAdmin?: boolean;
}

// Available AI models - all free via Lovable AI Gateway
export const AI_MODELS = [
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'Google', description: 'Fast & capable', icon: '⚡' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Balanced performance', icon: '🔮' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Lite', provider: 'Google', description: 'Fastest responses', icon: '🚀' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Most capable', icon: '💎' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI', description: 'Strong reasoning', icon: '🧠' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', provider: 'OpenAI', description: 'Fast & efficient', icon: '⚙️' },
] as const;

export type AIModelId = typeof AI_MODELS[number]['id'];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webstack-ai-assistant`;

export function useAIAssistant() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(() => {
    // Initialize from localStorage immediately on hook creation
    // Priority: bron_last_selected_domain (dashboard's source of truth) > webstack fallbacks
    return localStorage.getItem('bron_last_selected_domain') ||
           localStorage.getItem('webstack_selected_domain') || 
           sessionStorage.getItem('webstack_current_domain') || 
           null;
  });
  const [selectedModel, setSelectedModel] = useState<AIModelId>('google/gemini-3-flash-preview');
  const [pendingDomainConfirmation, setPendingDomainConfirmation] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Sync domain from localStorage on mount and when storage changes
  useEffect(() => {
    const syncDomainFromStorage = () => {
      // Priority: bron_last_selected_domain (dashboard's source of truth) > webstack fallbacks
      const storedDomain = localStorage.getItem('bron_last_selected_domain') ||
                          localStorage.getItem('webstack_selected_domain') || 
                          sessionStorage.getItem('webstack_current_domain');
      if (storedDomain && storedDomain !== selectedDomain) {
        setSelectedDomain(storedDomain);
        console.log('[AI Assistant] Synced domain from storage:', storedDomain);
      }
    };
    
    // Sync on mount
    syncDomainFromStorage();
    
    // Listen for storage changes (cross-tab sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'bron_last_selected_domain' || e.key === 'webstack_selected_domain' || e.key === 'webstack_current_domain') {
        syncDomainFromStorage();
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [selectedDomain]);
  
  // Listen for global domain changes from dashboard/domain selector bar
  // This syncs the AI domain with the dashboard's selected domain in real-time
  useEffect(() => {
    const handleDomainChange = (e: CustomEvent<{ domain: string | null }>) => {
      if (e.detail.domain) {
        setSelectedDomain(e.detail.domain);
        console.log('[AI Assistant] Domain synced from selector:', e.detail.domain);
      }
    };
    
    window.addEventListener('domain-selected', handleDomainChange as EventListener);
    return () => {
      window.removeEventListener('domain-selected', handleDomainChange as EventListener);
    };
  }, []);
  
  // Also listen for when AI opens - re-sync domain from localStorage
  useEffect(() => {
    const handleAIOpen = () => {
      // Priority: bron_last_selected_domain (dashboard's source of truth)
      const storedDomain = localStorage.getItem('bron_last_selected_domain') ||
                          localStorage.getItem('webstack_selected_domain') || 
                          sessionStorage.getItem('webstack_current_domain');
      if (storedDomain) {
        setSelectedDomain(storedDomain);
        console.log('[AI Assistant] Restored domain on open:', storedDomain);
      }
    };
    
    window.addEventListener('open-ai-assistant', handleAIOpen);
    return () => {
      window.removeEventListener('open-ai-assistant', handleAIOpen);
    };
  }, []);
  
  // Force-sync domain when selectedDomain is set - ensure localStorage priority is correct
  const syncDomainNow = useCallback(() => {
    const storedDomain = localStorage.getItem('bron_last_selected_domain') ||
                        localStorage.getItem('webstack_selected_domain') || 
                        sessionStorage.getItem('webstack_current_domain');
    if (storedDomain && storedDomain !== selectedDomain) {
      setSelectedDomain(storedDomain);
      return storedDomain;
    }
    return selectedDomain;
  }, [selectedDomain]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    loadConversations();
    checkUsage();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('ai_assistant_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setConversations(data.map(c => ({
        id: c.id,
        title: c.title || 'New Conversation',
        domain: c.domain || undefined,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      })));
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('ai_assistant_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: new Date(m.created_at),
      })));
    }
  };

  const checkUsage = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ checkUsage: true }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Error checking usage:', error);
    }
  };

  const createConversation = async (domain?: string): Promise<string | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('ai_assistant_conversations')
      .insert({
        user_id: user.id,
        domain: domain || null,
        title: 'New Conversation',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create conversation');
      return null;
    }

    const newConv: AIConversation = {
      id: data.id,
      title: data.title || 'New Conversation',
      domain: data.domain || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    setConversations(prev => [newConv, ...prev]);
    setCurrentConversation(newConv);
    setMessages([]);
    return data.id;
  };

  const selectConversation = async (conversation: AIConversation) => {
    setCurrentConversation(conversation);
    setSelectedDomain(conversation.domain || null);
    await loadMessages(conversation.id);
  };

  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) return;

    // Check usage first
    if (usage && !usage.canUse && !usage.isUnlimited) {
      toast.error(`Usage limit reached (${usage.minutesUsed}/${usage.minutesLimit} minutes). Please upgrade your plan.`);
      return;
    }

    let conversationId = currentConversation?.id;
    
    // Create new conversation if needed
    if (!conversationId) {
      conversationId = await createConversation(selectedDomain || undefined);
      if (!conversationId) return;
    }

    // Add user message to UI immediately
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Save user message to database
    await supabase.from('ai_assistant_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content,
    });

    // Prepare messages for API
    const apiMessages = [...messages, userMessage].map(m => ({
      role: m.role,
      content: m.content,
    }));

    setIsLoading(true);
    setIsStreaming(true);

    // Create assistant message placeholder
    const assistantId = crypto.randomUUID();
    let assistantContent = '';

    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      abortControllerRef.current = new AbortController();

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          conversationId,
          domain: selectedDomain,
          model: selectedModel,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.upgradeRequired) {
          toast.error(`Usage limit reached. Please upgrade to continue.`);
          setUsage(prev => prev ? { ...prev, canUse: false } : null);
        } else {
          toast.error(errorData.error || 'Failed to get response');
        }
        // Remove empty assistant message
        setMessages(prev => prev.filter(m => m.id !== assistantId));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => prev.map(m => 
                m.id === assistantId 
                  ? { ...m, content: assistantContent }
                  : m
              ));
            }
          } catch {
            // Incomplete JSON, wait for more data
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Save assistant message to database
      if (assistantContent && assistantContent.trim()) {
        await supabase.from('ai_assistant_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantContent,
        });

        // Update conversation title if it's the first message
        if (messages.length === 0) {
          const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
          await supabase
            .from('ai_assistant_conversations')
            .update({ title, updated_at: new Date().toISOString() })
            .eq('id', conversationId);
          
          setConversations(prev => prev.map(c => 
            c.id === conversationId ? { ...c, title } : c
          ));
          setCurrentConversation(prev => prev ? { ...prev, title } : null);
        }
      } else {
        // No content received - show error message and remove placeholder
        console.error('[AI Assistant] Empty response received from API');
        setMessages(prev => prev.map(m => 
          m.id === assistantId 
            ? { ...m, content: "I apologize, but I wasn't able to generate a response. This might be due to a temporary issue with the SEO tools. Please try again." }
            : m
        ));
        toast.error('AI response was empty. Please try again.');
      }

      // Refresh usage
      await checkUsage();

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('AI Assistant error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
        toast.error(errorMessage);
        
        // Show error in chat instead of removing message
        setMessages(prev => prev.map(m => 
          m.id === assistantId && !assistantContent
            ? { ...m, content: `⚠️ Error: ${errorMessage}. Please try again.` }
            : m
        ));
      }
      // Only remove empty assistant message if no content and not showing error
      if (!assistantContent) {
        // Keep the error message we set above
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const deleteConversation = async (conversationId: string) => {
    const { error } = await supabase
      .from('ai_assistant_conversations')
      .delete()
      .eq('id', conversationId);

    if (!error) {
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    }
  };

  const clearCurrentConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
  };

  // Helper to request domain confirmation for keyword research
  const requestDomainConfirmation = useCallback(() => {
    setPendingDomainConfirmation(true);
  }, []);
  
  const confirmDomain = useCallback(() => {
    setPendingDomainConfirmation(false);
  }, []);

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isStreaming,
    usage,
    selectedDomain,
    setSelectedDomain,
    selectedModel,
    setSelectedModel,
    pendingDomainConfirmation,
    requestDomainConfirmation,
    confirmDomain,
    loadConversations,
    createConversation,
    selectConversation,
    sendMessage,
    stopStreaming,
    deleteConversation,
    clearCurrentConversation,
    checkUsage,
    syncDomainNow,
  };
}
