import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Maximize2, Minimize2, Send, Plus, Trash2, MessageSquare, Sparkles, Clock, AlertCircle, Globe, Shield, Cpu, Mic, MicOff, Volume2, VolumeX, Zap, Brain, Radio, Archive, Lock, FileText, Star, Tag, BarChart3, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIAssistant, type AIMessage, type AIConversation, AI_MODELS, type AIModelId } from '@/hooks/use-ai-assistant';
import { useAuth } from '@/contexts/AuthContext';
import { useUserDomains } from '@/hooks/use-user-domains';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useVoiceRecognition, useTextToSpeech } from '@/hooks/use-voice-recognition';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Futuristic animated background orb
const AIOrb = memo(function AIOrb({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative w-12 h-12">
      {/* Outer glow rings */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/30 to-violet-500/30 blur-lg transition-all duration-700 ${isActive ? 'scale-150 opacity-100' : 'scale-100 opacity-50'}`} />
      <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 blur-md transition-all duration-500 ${isActive ? 'scale-125 animate-pulse' : 'scale-100'}`} />
      
      {/* Core orb */}
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-violet-600 via-cyan-500 to-violet-600 animate-gradient-slow flex items-center justify-center shadow-lg shadow-cyan-500/30">
        <Brain className="w-5 h-5 text-white drop-shadow-lg" />
      </div>
      
      {/* Active indicator rings */}
      {isActive && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 animate-ping" />
          <div className="absolute inset-0 rounded-full border border-violet-400/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </>
      )}
    </div>
  );
});

// Voice activity indicator
const VoiceWaveform = memo(function VoiceWaveform({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  return (
    <div className="flex items-center gap-0.5 h-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-0.5 bg-gradient-to-t from-cyan-400 to-violet-400 rounded-full animate-voice-wave"
          style={{
            animationDelay: `${i * 0.1}s`,
            height: isActive ? '100%' : '20%',
          }}
        />
      ))}
    </div>
  );
});
// Status types for AI activity
type AIActivityStatus = 'thinking' | 'accessing-api' | 'processing' | 'analyzing';

const AI_STATUS_CONFIG: Record<AIActivityStatus, { label: string; icon: 'brain' | 'globe' | 'cpu' | 'sparkles'; color: string }> = {
  thinking: { label: 'Thinking...', icon: 'brain', color: 'from-violet-400 to-cyan-400' },
  'accessing-api': { label: 'Accessing APIs...', icon: 'globe', color: 'from-cyan-400 to-emerald-400' },
  processing: { label: 'Processing task...', icon: 'cpu', color: 'from-amber-400 to-orange-400' },
  analyzing: { label: 'Analyzing data...', icon: 'sparkles', color: 'from-violet-400 to-pink-400' },
};

// AI Thinking Animation with dynamic status
const AIThinkingIndicator = memo(function AIThinkingIndicator({ status = 'thinking' }: { status?: AIActivityStatus }) {
  const [currentStatus, setCurrentStatus] = useState<AIActivityStatus>(status);
  
  // Cycle through statuses to show activity progression
  useEffect(() => {
    const statuses: AIActivityStatus[] = ['thinking', 'accessing-api', 'processing', 'analyzing'];
    let index = statuses.indexOf(status);
    
    const interval = setInterval(() => {
      index = (index + 1) % statuses.length;
      setCurrentStatus(statuses[index]);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [status]);
  
  const config = AI_STATUS_CONFIG[currentStatus];
  
  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-500/5 via-transparent to-violet-500/5 border-l-2 border-cyan-500/50">
      {/* AI Avatar with pulse */}
      <div className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg bg-gradient-to-br from-violet-500 via-cyan-500 to-violet-600 shadow-cyan-500/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStatus}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            {currentStatus === 'accessing-api' ? (
              <Globe className="w-5 h-5 text-white" />
            ) : currentStatus === 'processing' ? (
              <Cpu className="w-5 h-5 text-white" />
            ) : currentStatus === 'analyzing' ? (
              <Sparkles className="w-5 h-5 text-white" />
            ) : (
              <Brain className="w-5 h-5 text-white" />
            )}
          </motion.div>
        </AnimatePresence>
        {/* Thinking rings */}
        <div className="absolute inset-0 rounded-xl border border-cyan-400/50 animate-ping" style={{ animationDuration: '1.5s' }} />
        <div className="absolute -inset-1 rounded-xl border border-violet-400/30 animate-pulse" />
      </div>
      
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
          Webstack AI
        </span>
        
        {/* Dynamic status label */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.color}`}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={currentStatus}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`text-xs font-medium bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}
            >
              {config.label}
            </motion.span>
          </AnimatePresence>
        </div>
        
        {/* Progress bar with activity */}
        <div className="relative mt-2 h-1.5 w-full max-w-[200px] bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className={`absolute h-full w-12 bg-gradient-to-r ${config.color} rounded-full`}
            animate={{ x: [-48, 220] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Secondary glow */}
          <motion.div
            className="absolute h-full w-6 bg-white/30 rounded-full blur-sm"
            animate={{ x: [-24, 240] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
          />
        </div>
        
        {/* Activity badge */}
        <div className="flex items-center gap-2 mt-2">
          <Badge 
            variant="outline" 
            className={`text-[9px] px-1.5 py-0 h-4 bg-gradient-to-r ${config.color} bg-opacity-10 border-current animate-pulse`}
          >
            <Radio className="w-2.5 h-2.5 mr-1" />
            Active
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            Processing your request...
          </span>
        </div>
      </div>
    </div>
  );
});

// Message component
const ChatMessage = memo(function ChatMessage({ 
  message, 
  isStreaming,
  onSpeak,
  isSpeaking,
  userAvatar,
}: { 
  message: AIMessage; 
  isStreaming?: boolean;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  userAvatar?: string | null;
}) {
  const isUser = message.role === 'user';
  
  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    if (!content) return isStreaming ? <span className="animate-pulse">...</span> : null;
    
    // Split by code blocks and render
    const parts = content.split(/```(\w+)?\n?([\s\S]*?)```/g);
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i % 3 === 2) {
        // Code block content
        elements.push(
          <pre key={i} className="bg-background/80 border border-border/50 p-3 rounded-lg overflow-x-auto text-xs my-2 backdrop-blur-sm">
            <code>{part}</code>
          </pre>
        );
      } else if (i % 3 === 0 && part) {
        // Regular text - handle basic markdown
        const formatted = part
          .split('\n')
          .map((line, j) => {
            // Headers
            if (line.startsWith('### ')) return <h4 key={j} className="font-semibold mt-3 mb-1 text-cyan-300">{line.slice(4)}</h4>;
            if (line.startsWith('## ')) return <h3 key={j} className="font-bold mt-4 mb-2 text-violet-300">{line.slice(3)}</h3>;
            if (line.startsWith('# ')) return <h2 key={j} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>;
            // Lists
            if (line.startsWith('- ') || line.startsWith('* ')) return <li key={j} className="ml-4 text-foreground/80">{line.slice(2)}</li>;
            if (/^\d+\. /.test(line)) return <li key={j} className="ml-4 list-decimal text-foreground/80">{line.replace(/^\d+\. /, '')}</li>;
            // Bold and italic
            const processed = line
              .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
              .replace(/`(.+?)`/g, '<code class="bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
            return line ? <p key={j} className="mb-1" dangerouslySetInnerHTML={{ __html: processed }} /> : <br key={j} />;
          });
        elements.push(<div key={i}>{formatted}</div>);
      }
    }
    
    return elements;
  };
  
  return (
    <div className={cn(
      "flex gap-3 p-4 group transition-colors",
      isUser ? "bg-gradient-to-r from-primary/5 to-transparent" : "bg-gradient-to-r from-cyan-500/5 via-transparent to-violet-500/5"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-105 overflow-hidden",
        isUser 
          ? "bg-gradient-to-br from-primary to-primary/80 shadow-primary/20" 
          : "bg-gradient-to-br from-violet-500 via-cyan-500 to-violet-600 shadow-cyan-500/20"
      )}>
        {isUser ? (
          userAvatar ? (
            <img 
              src={userAvatar} 
              alt="User" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="text-sm font-bold text-primary-foreground">U</span>';
              }}
            />
          ) : (
            <span className="text-sm font-bold text-primary-foreground">U</span>
          )
        ) : (
          <Brain className="w-4 h-4 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "text-sm font-semibold",
            isUser ? "text-foreground" : "bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent"
          )}>
            {isUser ? 'You' : 'Webstack AI'}
          </span>
          {!isUser && onSpeak && message.content && (
            <button
              onClick={() => onSpeak(message.content)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted/50"
              title={isSpeaking ? "Stop speaking" : "Read aloud"}
            >
              {isSpeaking ? (
                <VolumeX className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-muted-foreground hover:text-cyan-400" />
              )}
            </button>
          )}
        </div>
        <div className="text-sm text-foreground/85 leading-relaxed">
          {renderContent(message.content)}
        </div>
      </div>
    </div>
  );
});

// Usage meter component
const UsageMeter = memo(function UsageMeter({ usage }: { usage: any }) {
  if (!usage) return null;
  
  const isAdmin = usage.isAdmin || usage.tier === 'admin';
  const percentage = usage.isUnlimited || isAdmin ? 100 : Math.min((usage.minutesUsed / usage.minutesLimit) * 100, 100);
  const isLow = !isAdmin && !usage.isUnlimited && percentage >= 80;
  
  return (
    <div className="px-3 py-2 border-b border-border/50 bg-muted/30">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {usage.isUnlimited || isAdmin ? `${usage.minutesUsed} min used` : `${usage.minutesUsed}/${usage.minutesLimit} min`}
        </span>
        <span className={cn(
          "font-medium capitalize flex items-center gap-1",
          isAdmin ? 'text-amber-500' : usage.tier === 'free' ? 'text-muted-foreground' : 'text-primary'
        )}>
          {isAdmin && <Shield className="w-3 h-3" />}
          {isAdmin ? 'Admin (Unlimited)' : usage.tier.replace('_', ' ')}
        </span>
      </div>
      {!usage.isUnlimited && !isAdmin && (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all",
              isLow ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {(usage.isUnlimited || isAdmin) && (
        <div className="h-1 bg-gradient-to-r from-amber-500/30 via-primary/30 to-cyan-500/30 rounded-full overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-amber-500 via-primary to-cyan-500 animate-pulse" />
        </div>
      )}
    </div>
  );
});

// Conversation list item
const ConversationItem = memo(function ConversationItem({ 
  conversation, 
  isActive,
  onSelect,
  onDelete 
}: { 
  conversation: AIConversation; 
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div 
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
      )}
      onClick={onSelect}
    >
      <MessageSquare className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate text-sm">{conversation.title}</span>
      <Button
        variant="ghost"
        size="icon"
        className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="w-3 h-3 text-destructive" />
      </Button>
    </div>
  );
});

// SEO Vault item type
interface VaultItem {
  id: string;
  title: string;
  report_type: string;
  summary: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  domain?: string;
}

export const AIAssistantTab = memo(function AIAssistantTab() {
  const { user, googleProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get user domains
  const { domains } = useUserDomains();
  
  // Load vault items
  const loadVaultItems = useCallback(async () => {
    if (!user) return;
    setVaultLoading(true);
    try {
      const { data, error } = await supabase
        .from('seo_vault')
        .select('id, title, report_type, summary, tags, is_favorite, created_at, domain')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!error && data) {
        setVaultItems(data);
      }
    } catch (err) {
      console.error('Failed to load vault items:', err);
    } finally {
      setVaultLoading(false);
    }
  }, [user]);
  
  // Delete vault item
  const deleteVaultItem = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('seo_vault')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setVaultItems(prev => prev.filter(item => item.id !== id));
      toast.success('Report deleted from vault');
    } catch (err) {
      console.error('Failed to delete vault item:', err);
      toast.error('Failed to delete report');
    }
  }, [user]);
  
  // Load vault when opened
  useEffect(() => {
    if (showVault) {
      loadVaultItems();
    }
  }, [showVault, loadVaultItems]);
  
  const {
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
    selectConversation,
    sendMessage,
    stopStreaming,
    deleteConversation,
    clearCurrentConversation,
    syncDomainNow,
  } = useAIAssistant();

  // Voice recognition
  const handleVoiceTranscript = useCallback((transcript: string, isFinal: boolean) => {
    if (isFinal && transcript.trim()) {
      setInputValue(transcript);
    } else {
      setInputValue(transcript);
    }
  }, []);

  const { 
    isListening, 
    isSupported: voiceSupported, 
    toggleListening, 
    transcript 
  } = useVoiceRecognition({
    onTranscript: handleVoiceTranscript,
    continuous: false,
  });

  // Text-to-speech
  const { isSpeaking, isSupported: ttsSupported, speak, stop: stopSpeaking } = useTextToSpeech();

  const handleSpeak = useCallback((text: string, messageId?: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      // Clean markdown from text for speech
      const cleanText = text
        .replace(/[#*`_~\[\]()]/g, '')
        .replace(/\n+/g, '. ')
        .slice(0, 2000); // Limit length
      speak(cleanText);
      setSpeakingMessageId(messageId || null);
    }
  }, [isSpeaking, speak, stopSpeaking]);

  // Stop speaking when component unmounts or message changes
  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingMessageId(null);
    }
  }, [isSpeaking]);

  // Get current model info
  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  // Dispatch event when panel opens/closes so dashboard can adjust layout
  useEffect(() => {
    const width = isOpen ? (isFullscreen ? window.innerWidth : (isExpanded ? 600 : 420)) : 0;
    window.dispatchEvent(new CustomEvent('ai-assistant-state', { 
      detail: { isOpen, width, isFullscreen } 
    }));
  }, [isOpen, isExpanded, isFullscreen]);

  // Listen for open-ai-assistant event from side tab button
  useEffect(() => {
    const handleOpenAI = () => {
      setIsOpen(true);
      // FORCE re-sync domain from localStorage when panel opens
      // Priority: bron_last_selected_domain (dashboard's source of truth)
      const storedDomain = localStorage.getItem('bron_last_selected_domain') ||
                          localStorage.getItem('webstack_selected_domain') || 
                          sessionStorage.getItem('webstack_current_domain');
      if (storedDomain) {
        setSelectedDomain(storedDomain);
        console.log('[AI Tab] Force synced domain on event:', storedDomain);
      }
    };
    
    window.addEventListener('open-ai-assistant', handleOpenAI);
    return () => {
      window.removeEventListener('open-ai-assistant', handleOpenAI);
    };
  }, [setSelectedDomain]);
  
  // Sync domain when panel becomes visible - FORCE sync on every open
  useEffect(() => {
    if (isOpen) {
      // Priority: bron_last_selected_domain (dashboard's source of truth)
      const storedDomain = localStorage.getItem('bron_last_selected_domain') ||
                          localStorage.getItem('webstack_selected_domain') || 
                          sessionStorage.getItem('webstack_current_domain');
      if (storedDomain) {
        // Always update, even if it's the same - this ensures UI refresh
        setSelectedDomain(storedDomain);
        console.log('[AI Tab] Synced domain on open:', storedDomain);
      }
    }
  }, [isOpen, setSelectedDomain]);

  // Listen for domain-selected event from dashboard domain selector
  // This keeps the AI chatbot in sync when user changes domain while AI panel is open
  useEffect(() => {
    const handleDomainChange = (e: CustomEvent<{ domain: string }>) => {
      if (e.detail?.domain) {
        setSelectedDomain(e.detail.domain);
        console.log('[AI Tab] Domain updated from dashboard:', e.detail.domain);
      }
    };
    
    window.addEventListener('domain-selected', handleDomainChange as EventListener);
    return () => {
      window.removeEventListener('domain-selected', handleDomainChange as EventListener);
    };
  }, [setSelectedDomain]);

  useEffect(() => {
    const handleAIPrompt = (e: CustomEvent<{ prompt: string; domain: string | null }>) => {
      const { prompt, domain } = e.detail;
      
      // Open the assistant if not already open
      if (!isOpen) {
        setIsOpen(true);
      }
      
      // Set the domain if provided
      if (domain && domain !== selectedDomain) {
        setSelectedDomain(domain);
      }
      
      // Set the input and auto-send after a brief delay
      setInputValue(prompt);
      setTimeout(() => {
        sendMessage(prompt);
        setInputValue('');
      }, 300);
    };
    
    window.addEventListener('ai-assistant-prompt', handleAIPrompt as EventListener);
    return () => {
      window.removeEventListener('ai-assistant-prompt', handleAIPrompt as EventListener);
    };
  }, [isOpen, selectedDomain, setSelectedDomain, sendMessage]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Send voice transcript when listening stops
  useEffect(() => {
    if (!isListening && transcript.trim() && !isLoading) {
      // Small delay to allow user to see the transcript
      const timer = setTimeout(() => {
        sendMessage(transcript);
        setInputValue('');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, transcript, isLoading, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain === '__none__' ? null : domain);
  };

  // Run all 4 SEO reports automatically
  const runAllReports = useCallback(() => {
    if (!selectedDomain) {
      toast.error('Please select a domain first');
      return;
    }
    if (isLoading) {
      toast.warning('Please wait for the current request to finish');
      return;
    }
    
    const reportsPrompt = `Run a comprehensive SEO analysis for ${selectedDomain}. Execute these 4 reports and save them to the SEO Vault:

1. **Keyword Research Report**: Find the top 20 keyword opportunities with search volume and difficulty
2. **SERP Analysis Report**: Analyze current rankings and SERP features
3. **Backlink Analysis Report**: Review the backlink profile and find link building opportunities  
4. **Competitor Analysis Report**: Identify main competitors and their top keywords

For each report, provide actionable insights and save the findings to the SEO Vault with domain="${selectedDomain}". After completing all reports, summarize the key opportunities.`;
    
    sendMessage(reportsPrompt);
    toast.success('Running all 4 SEO reports...');
  }, [selectedDomain, isLoading, sendMessage]);

  // Generate content ideas for CADE
  const generateCadeIdeas = useCallback((topic?: string) => {
    if (!selectedDomain) {
      toast.error('Please select a domain first');
      return;
    }
    
    const prompt = topic 
      ? `For ${selectedDomain}, generate content ideas for: "${topic}". Include:
- 5 blog post titles with target keywords
- 3 FAQ questions with detailed answers
- 2 pillar page concepts
Save the content plan to the SEO Vault for CADE to use.`
      : `For ${selectedDomain}, analyze the SEO Vault for existing research and generate a content strategy. Include:
- 10 blog post ideas based on keyword opportunities
- 5 FAQ questions targeting long-tail keywords
- 3 content cluster topics
Save the content plan to the SEO Vault with domain="${selectedDomain}" so CADE can use it for content generation.`;
    
    sendMessage(prompt);
    toast.success('Generating content ideas for CADE...');
  }, [selectedDomain, sendMessage]);

  // Expose generateCadeIdeas globally for CADE dashboard
  useEffect(() => {
    (window as any).aiGenerateCadeIdeas = generateCadeIdeas;
    return () => {
      delete (window as any).aiGenerateCadeIdeas;
    };
  }, [generateCadeIdeas]);

  if (!user) return null;

  return (
    <TooltipProvider>
      {/* Sleek AI Trigger - Minimal pill docked left, positioned below SHOP tab */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 z-[100] hidden lg:block"
            style={{ top: 'calc(55% + 100px)' }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ x: 4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsOpen(true)}
                  className="group relative flex items-center"
                >
                  {/* Outer glow */}
                  <div className="absolute -inset-1.5 rounded-r-2xl blur-lg opacity-50 group-hover:opacity-100 bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-600 transition-all duration-500" />
                  
                  {/* Main container - vertical pill matching SHOP style */}
                  <div className="relative flex flex-col items-center gap-1.5 py-4 px-3 rounded-r-2xl border border-l-0 backdrop-blur-xl transition-all duration-500 overflow-hidden bg-gradient-to-br from-slate-950/95 via-cyan-950/90 to-slate-950/95 border-cyan-500/30 group-hover:border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.25)] group-hover:shadow-[0_0_50px_rgba(6,182,212,0.5)]">
                    
                    {/* Scanning line */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none opacity-50 group-hover:opacity-100"
                    >
                      <motion.div
                        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    </motion.div>
                    
                    {/* AI text */}
                    <span className="relative text-sm font-black uppercase tracking-widest transition-all duration-300 group-hover:text-white group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] bg-gradient-to-r from-cyan-200 via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                      AI
                    </span>
                    
                    {/* Brain orb */}
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full blur-md bg-gradient-to-r from-cyan-500/50 to-violet-500/50 group-hover:scale-125 transition-all duration-500" />
                      <div className="relative w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-600 via-cyan-500 to-violet-600 shadow-inner shadow-white/10">
                        <Brain className="w-4 h-4 text-white drop-shadow-lg" />
                      </div>
                      {/* Status dot */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
                    </div>
                    
                    {/* Sparkle */}
                    <motion.div
                      animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-4 h-4 text-amber-400/80 group-hover:text-amber-300 transition-colors" />
                    </motion.div>
                    
                    {/* Shimmer on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent"
                      initial={{ y: '-100%' }}
                      animate={{ y: '100%' }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-slate-900/95 border-cyan-500/30 backdrop-blur-xl">
                <div className="flex flex-col">
                  <span className="font-semibold text-white">Webstack AI Assistant</span>
                  <span className="text-xs text-cyan-400">SEO Research & Strategy</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel - Futuristic Design */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -450, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -450, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed left-0 top-0 z-[200] h-screen bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 flex flex-col overflow-hidden",
              isFullscreen 
                ? "w-screen border-none" 
                : cn("border-r border-cyan-500/20", isExpanded ? "w-[600px]" : "w-[420px]")
            )}
          >
            {/* Decorative glow effect */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cyan-500/5 via-violet-500/5 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-violet-500/5 to-transparent pointer-events-none" />
            
            {/* Header - Enhanced */}
            <div className="relative flex items-center justify-between p-4 border-b border-border/30 bg-gradient-to-r from-violet-500/10 via-cyan-500/5 to-violet-500/10">
              <div className="flex items-center gap-3">
                <AIOrb isActive={isLoading || isStreaming || isListening} />
                <div>
                  <h2 className="font-bold text-sm bg-gradient-to-r from-foreground via-cyan-300 to-foreground bg-clip-text">Webstack AI</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">SEO Intelligence</p>
                    {isListening && (
                      <span className="flex items-center gap-1 text-xs text-cyan-400">
                        <Radio className="w-3 h-3 animate-pulse" />
                        Listening...
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Run All Reports Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={runAllReports}
                      disabled={isLoading || !selectedDomain}
                      className="relative hover:bg-emerald-500/10 group"
                    >
                      <div className="relative">
                        <BarChart3 className="w-4 h-4 text-emerald-500 group-hover:text-emerald-400 transition-colors" />
                        <PlayCircle className="w-2 h-2 absolute -bottom-0.5 -right-0.5 text-emerald-600" />
                      </div>
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 rounded-md bg-emerald-500/10 opacity-0 group-hover:opacity-100 blur-sm transition-opacity" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-semibold">Run All Reports</p>
                      <p className="text-xs text-muted-foreground">Generate 4 SEO reports</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
                
                {/* SEO Vault Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowVault(!showVault)}
                      className={cn(
                        "relative hover:bg-amber-500/10 group",
                        showVault && "bg-amber-500/20 text-amber-400"
                      )}
                    >
                      <div className="relative">
                        <Archive className="w-4 h-4 text-amber-500 group-hover:text-amber-400 transition-colors" />
                        <Lock className="w-2 h-2 absolute -bottom-0.5 -right-0.5 text-amber-600" />
                      </div>
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 rounded-md bg-amber-500/10 opacity-0 group-hover:opacity-100 blur-sm transition-opacity" />
                      {/* Item count badge */}
                      {vaultItems.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold bg-amber-500 text-black rounded-full flex items-center justify-center">
                          {vaultItems.length > 9 ? '9+' : vaultItems.length}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-semibold">SEO Vault</p>
                      <p className="text-xs text-muted-foreground">Saved reports & plans</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        // If there's an active conversation with messages, go back to it
                        if (currentConversation && messages.length > 0) {
                          setShowHistory(false);
                          setShowVault(false);
                        } else if (conversations.length > 0 && !currentConversation) {
                          // If no active conversation but history exists, select the most recent one
                          selectConversation(conversations[0]);
                          setShowHistory(false);
                          setShowVault(false);
                        } else {
                          // Otherwise toggle history view
                          setShowHistory(!showHistory);
                        }
                      }}
                      className={cn("hover:bg-cyan-500/10", showHistory && "bg-cyan-500/10 text-cyan-400")}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Chat History</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (isFullscreen) {
                          setIsFullscreen(false);
                        } else {
                          setIsExpanded(!isExpanded);
                        }
                      }}
                      className="hover:bg-cyan-500/10"
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isFullscreen ? 'Exit Fullscreen' : isExpanded ? 'Minimize' : 'Expand'}</TooltipContent>
                </Tooltip>
                {/* Fullscreen button - only show when expanded */}
                {(isExpanded || isFullscreen) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className={cn("hover:bg-violet-500/10", isFullscreen && "bg-violet-500/20 text-violet-400")}
                      >
                        {isFullscreen ? (
                          <Minimize2 className="w-4 h-4" />
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                          </svg>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</TooltipContent>
                  </Tooltip>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Usage Meter */}
            <UsageMeter usage={usage} />

            <div className="flex-1 flex overflow-hidden">
              {/* History Sidebar */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-r border-border/50 flex flex-col overflow-hidden"
                  >
                    <div className="p-2 border-b border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => clearCurrentConversation()}
                      >
                        <Plus className="w-4 h-4" />
                        New Chat
                      </Button>
                    </div>
                    <ScrollArea className="flex-1 p-2">
                      <div className="space-y-1">
                        {conversations.map(conv => (
                          <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isActive={currentConversation?.id === conv.id}
                            onSelect={() => selectConversation(conv)}
                            onDelete={() => deleteConversation(conv.id)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Domain Context Header & Model Selector */}
                <div className="p-3 border-b border-border/50 space-y-2">
                  {/* Active Domain Display - Synced from Global Selector */}
                  {selectedDomain ? (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-cyan-500/10 via-violet-500/5 to-cyan-500/10 border border-cyan-500/20">
                      <div className="relative flex-shrink-0">
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${selectedDomain}&sz=64`}
                          alt={selectedDomain}
                          className="w-10 h-10 rounded-lg border border-border/50 bg-background object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">{selectedDomain}</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                            ACTIVE
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">AI research context loaded</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <Globe className="w-6 h-6 text-amber-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-400">No domain selected</p>
                        <p className="text-[10px] text-muted-foreground">Select a domain in the dashboard to enable context</p>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Model Selector */}
                  <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as AIModelId)}>
                    <SelectTrigger className="w-full h-9">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{currentModel.icon} {currentModel.name}</span>
                        <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                          {currentModel.provider}
                        </Badge>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Free AI Models
                      </div>
                      {AI_MODELS.map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.icon}</span>
                            <span>{model.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {model.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vault View OR Messages */}
                {showVault ? (
                  <ScrollArea className="flex-1 relative">
                    <div className="p-4">
                      {/* Vault Header with Back Button */}
                      <div className="flex items-center gap-3 mb-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowVault(false)}
                          className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/30 shrink-0">
                          <Archive className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-foreground">SEO Vault</h3>
                          <p className="text-xs text-muted-foreground">{vaultItems.length} saved reports & plans</p>
                        </div>
                      </div>
                      
                      {vaultLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-3" />
                          <p className="text-sm text-muted-foreground">Loading vault...</p>
                        </div>
                      ) : vaultItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                            <Archive className="w-8 h-8 text-amber-500/50" />
                          </div>
                          <h4 className="font-semibold text-foreground mb-1">No saved items yet</h4>
                          <p className="text-sm text-muted-foreground max-w-[200px]">
                            Ask the AI to research keywords or create content plans, then save them here.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {vaultItems.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="group p-3 rounded-xl bg-gradient-to-r from-muted/50 via-background to-muted/30 border border-border/50 hover:border-amber-500/30 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                {/* Type icon */}
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                  item.report_type === 'keyword_research' 
                                    ? "bg-cyan-500/10 text-cyan-400"
                                    : item.report_type === 'content_plan'
                                    ? "bg-violet-500/10 text-violet-400"
                                    : "bg-amber-500/10 text-amber-400"
                                )}>
                                  <FileText className="w-4 h-4" />
                                </div>
                                
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm text-foreground line-clamp-2 flex-1" title={item.title}>{item.title}</span>
                                    {item.is_favorite && (
                                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                                    )}
                                    {/* Delete button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 shrink-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteVaultItem(item.id);
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3 text-red-400" />
                                    </Button>
                                  </div>
                                  
                                  <p className="text-xs text-muted-foreground line-clamp-3 mb-2" title={item.summary || ''}>
                                    {item.summary}
                                  </p>
                                  
                                  {/* Tags */}
                                  <div className="flex flex-wrap gap-1">
                                    {item.tags?.slice(0, 3).map((tag, i) => (
                                      <span 
                                        key={i}
                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded bg-muted/50 text-muted-foreground"
                                      >
                                        <Tag className="w-2 h-2" />
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Date and domain */}
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                                <span className="text-[10px] text-muted-foreground capitalize">
                                  {item.report_type.replace('_', ' ')}
                                  {item.domain && (
                                    <span className="ml-2 text-cyan-400/70">• {item.domain}</span>
                                  )}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <ScrollArea className="flex-1 relative">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center relative overflow-hidden">
                        {/* Matrix Digital Rain Background - fewer columns for performance */}
                        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                          {[...Array(12)].map((_, i) => (
                            <motion.div
                              key={`rain-${i}`}
                              className="absolute text-cyan-400/60 font-mono text-[10px] whitespace-nowrap"
                              style={{
                                left: `${(i * 8) + Math.random() * 2}%`,
                                writingMode: 'vertical-rl',
                              }}
                              initial={{ y: '-100%', opacity: 0 }}
                              animate={{
                                y: '100vh',
                                opacity: [0, 1, 1, 0],
                              }}
                              transition={{
                                duration: 5 + Math.random() * 4,
                                repeat: Infinity,
                                delay: Math.random() * 3,
                                ease: 'linear',
                              }}
                            >
                              {[...Array(10)].map((_, j) => (
                                <span key={j} className={j % 3 === 0 ? 'text-violet-400' : ''}>
                                  {String.fromCharCode(0x30A0 + Math.random() * 96)}
                                </span>
                              ))}
                            </motion.div>
                          ))}
                        </div>

                        {/* Neural Grid Lines */}
                        <div className="absolute inset-0 pointer-events-none">
                          <svg className="w-full h-full opacity-15">
                            <defs>
                              <pattern id="neural-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-cyan-500/50" />
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#neural-grid)" />
                          </svg>
                        </div>

                        {/* AI Brain Orb - Compact */}
                        <div className="relative mb-4 z-10">
                          {/* Pulse rings */}
                          {[0, 1].map((i) => (
                            <motion.div
                              key={`pulse-${i}`}
                              className="absolute inset-0 rounded-full border border-cyan-400/30"
                              initial={{ scale: 1, opacity: 0.6 }}
                              animate={{
                                scale: [1, 2, 2.5],
                                opacity: [0.5, 0.2, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.7,
                                ease: 'easeOut',
                              }}
                            />
                          ))}

                          {/* Orbiting particles - smaller */}
                          {[...Array(4)].map((_, i) => (
                            <motion.div
                              key={`orbit-${i}`}
                              className="absolute w-1.5 h-1.5 rounded-full"
                              style={{
                                background: i % 2 === 0 ? '#06b6d4' : '#8b5cf6',
                                boxShadow: i % 2 === 0 ? '0 0 6px #06b6d4' : '0 0 6px #8b5cf6',
                                top: '50%',
                                left: '50%',
                                marginLeft: '-3px',
                                marginTop: '-3px',
                              }}
                              animate={{
                                x: Math.cos((i * 90) * Math.PI / 180) * 35,
                                y: Math.sin((i * 90) * Math.PI / 180) * 35,
                                rotate: [0, 360],
                              }}
                              transition={{
                                rotate: {
                                  duration: 5,
                                  repeat: Infinity,
                                  ease: 'linear',
                                },
                              }}
                            />
                          ))}

                          {/* Main orb - smaller */}
                          <motion.div
                            className="relative w-16 h-16 rounded-full flex items-center justify-center"
                            animate={{ rotateY: [0, 360] }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                          >
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600/40 via-cyan-500/40 to-fuchsia-500/40" />
                            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30" />
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Brain className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] relative z-10" />
                            </motion.div>
                          </motion.div>
                        </div>

                        {/* Title - compact */}
                        <h3 className="font-bold mb-1 text-base relative z-10">
                          <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                            What can I help with?
                          </span>
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3 max-w-[240px] relative z-10">
                          Keyword research, competitor analysis, or SEO troubleshooting.
                        </p>
                        {/* Run All Reports Button */}
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="w-full max-w-[300px] relative z-10 mb-3"
                        >
                          <Button
                            className="w-full h-10 text-sm font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:via-orange-400 hover:to-rose-400 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
                            onClick={() => {
                              sendMessage("Run all 4 SEO reports for my domain: keyword research, competitor analysis, SERP rankings, and backlink opportunities. Save each report to my SEO vault.");
                            }}
                            disabled={isLoading || isStreaming}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Run All 4 Reports & Save to Vault
                          </Button>
                          <p className="text-[10px] text-muted-foreground text-center mt-1">~8 min • Complete SEO analysis</p>
                        </motion.div>

                        <div className="grid gap-1.5 w-full max-w-[300px] relative z-10">
                          {[
                            { text: "🔍 Keyword Research", full: "Research keywords for my domain and save to vault", cost: 2 },
                            { text: "📊 Competitor Analysis", full: "Analyze my competitor's SEO strategy and save to vault", cost: 3 },
                            { text: "📈 SERP Rankings", full: "Get my SERP rankings report and save to vault", cost: 2 },
                            { text: "🔗 Backlink Report", full: "Find backlink partner opportunities and save to vault", cost: 2 },
                          ].map((suggestion, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.15 + i * 0.05 }}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className="relative group"
                            >
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-slate-900/80 to-slate-800/50 border border-cyan-500/20 hover:border-cyan-400/40 transition-all">
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs text-foreground/90 truncate block">{suggestion.text}</span>
                                  <span className="text-[10px] text-amber-400">~{suggestion.cost} min</span>
                                </div>
                                <Button
                                  size="sm"
                                  className="h-6 px-2.5 text-[10px] font-semibold shrink-0 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white shadow-lg shadow-cyan-500/20"
                                  onClick={() => sendMessage(suggestion.full)}
                                  disabled={isLoading || isStreaming}
                                >
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Run
                                </Button>
                              </div>
                              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-l" />
                            </motion.div>
                          ))}
                        </div>

                        {/* More Reports Section */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="w-full max-w-[300px] mt-3 pt-3 border-t border-border/30 relative z-10"
                        >
                          <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400" />
                            More SEO Reports Available:
                          </p>
                          <div className="grid grid-cols-2 gap-1">
                            {[
                              { text: "🌐 Domain Audit", full: "Run a comprehensive domain audit for my site" },
                              { text: "👁️ Visitor Intel", full: "Get visitor intelligence report for my domain" },
                              { text: "📝 Content Ideas", full: "Generate content plan based on my keywords" },
                              { text: "🏢 Local SEO", full: "Analyze my local SEO and GMB performance" },
                            ].map((report, i) => (
                              <Button
                                key={i}
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[10px] justify-start px-2 hover:bg-cyan-500/10 hover:text-cyan-400"
                                onClick={() => sendMessage(report.full)}
                                disabled={isLoading || isStreaming}
                              >
                                {report.text}
                              </Button>
                            ))}
                          </div>
                        </motion.div>
                        
                        {/* Credit/Usage Info - Compact */}
                        {usage && (
                          <motion.div 
                            className="mt-4 pt-3 border-t border-cyan-500/20 w-full max-w-[280px] relative z-10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            {usage.isUnlimited || usage.isAdmin ? (
                              <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-cyan-500/10 border border-amber-500/20">
                                <Shield className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                  Unlimited Access
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <div className="flex-1">
                                  <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full rounded-full",
                                        (usage.minutesUsed / usage.minutesLimit) >= 0.8 
                                          ? "bg-gradient-to-r from-destructive to-orange-500" 
                                          : "bg-gradient-to-r from-cyan-500 to-violet-500"
                                      )}
                                      style={{ width: `${Math.min((usage.minutesUsed / usage.minutesLimit) * 100, 100)}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {usage.minutesLimit - usage.minutesUsed}/{usage.minutesLimit} min
                                </span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {messages.map((msg, i) => (
                          <ChatMessage 
                            key={msg.id} 
                            message={msg} 
                            isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
                            onSpeak={(text) => handleSpeak(text, msg.id)}
                            isSpeaking={isSpeaking && speakingMessageId === msg.id}
                            userAvatar={googleProfile?.picture}
                          />
                        ))}
                        {/* Show thinking indicator when loading but no streaming content yet */}
                        {isLoading && !isStreaming && <AIThinkingIndicator />}
                        {/* Show thinking indicator if streaming started but no content yet */}
                        {isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !messages[messages.length - 1].content && (
                          <AIThinkingIndicator />
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                )}

                {/* Usage Warning */}
                {usage && !usage.canUse && !usage.isUnlimited && (
                  <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>Usage limit reached. Upgrade to continue.</span>
                  </div>
                )}

                {/* Prominent SEO Vault Panel - Above Input */}
                {vaultItems.length > 0 && !showVault && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mb-2 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/30 shadow-lg shadow-amber-500/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center border border-amber-500/40 shrink-0">
                        <Archive className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground">SEO Vault</h4>
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5">
                            {vaultItems.length} saved
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {vaultItems[0]?.title || 'Your saved research & reports'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowVault(true)}
                        className="shrink-0 h-8 px-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        View All
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Input with Voice */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-border/30 bg-gradient-to-r from-transparent via-muted/20 to-transparent">
                  {/* Voice indicator */}
                  {isListening && (
                    <div className="flex items-center justify-center gap-2 mb-3 text-sm text-cyan-400">
                      <VoiceWaveform isActive={isListening} />
                      <span>Listening... speak now</span>
                      <VoiceWaveform isActive={isListening} />
                    </div>
                  )}
                  
                  <div className="flex gap-2 items-center">
                    {/* Voice Input Button */}
                    {voiceSupported && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant={isListening ? "default" : "outline"}
                            size="icon"
                            onClick={toggleListening}
                            disabled={isLoading || isStreaming}
                            className={cn(
                              "shrink-0 transition-all",
                              isListening 
                                ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/30 animate-pulse" 
                                : "hover:border-cyan-500/50 hover:bg-cyan-500/10"
                            )}
                          >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{isListening ? 'Stop listening' : 'Voice input'}</TooltipContent>
                      </Tooltip>
                    )}
                    
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={isListening ? "Listening..." : "Ask me anything..."}
                      disabled={isLoading || isListening || (usage && !usage.canUse && !usage.isUnlimited)}
                      className="flex-1 bg-background/50 border-border/50 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                    />
                    
                    {isStreaming ? (
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon"
                        onClick={stopStreaming}
                        className="shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        size="icon"
                        disabled={!inputValue.trim() || isLoading}
                        className="shrink-0 bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 shadow-lg shadow-cyan-500/20"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Voice/TTS status */}
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
                    {voiceSupported && <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> Voice ready</span>}
                    {ttsSupported && <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" /> Audio ready</span>}
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop - only on mobile since desktop pushes content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
});

export default AIAssistantTab;
