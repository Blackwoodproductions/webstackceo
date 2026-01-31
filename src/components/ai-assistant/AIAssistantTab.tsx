import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Maximize2, Minimize2, Send, Plus, Trash2, MessageSquare, Sparkles, Clock, AlertCircle, Globe, Shield, Cpu, Mic, MicOff, Volume2, VolumeX, Zap, Brain, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIAssistant, type AIMessage, type AIConversation, AI_MODELS, type AIModelId } from '@/hooks/use-ai-assistant';
import { useAuth } from '@/contexts/AuthContext';
import { useUserDomains } from '@/hooks/use-user-domains';
import { cn } from '@/lib/utils';
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

// AI Thinking Animation
const AIThinkingIndicator = memo(function AIThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-500/5 via-transparent to-violet-500/5">
      {/* AI Avatar with pulse */}
      <div className="relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg bg-gradient-to-br from-violet-500 via-cyan-500 to-violet-600 shadow-cyan-500/20">
        <Brain className="w-4 h-4 text-white animate-pulse" />
        {/* Thinking rings */}
        <div className="absolute inset-0 rounded-xl border border-cyan-400/50 animate-ping" style={{ animationDuration: '1.5s' }} />
        <div className="absolute -inset-1 rounded-xl border border-violet-400/30 animate-pulse" />
      </div>
      
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
          Webstack AI
        </span>
        
        {/* Thinking animation */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
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
          <span className="text-xs text-muted-foreground animate-pulse">Analyzing...</span>
        </div>
        
        {/* Scanning line effect */}
        <div className="relative mt-2 h-1 w-32 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className="absolute h-full w-8 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            animate={{ x: [-32, 160] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
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

export const AIAssistantTab = memo(function AIAssistantTab() {
  const { user, googleProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get user domains
  const { domains } = useUserDomains();
  
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
    const width = isOpen ? (isExpanded ? 600 : 420) : 0;
    window.dispatchEvent(new CustomEvent('ai-assistant-state', { 
      detail: { isOpen, width } 
    }));
  }, [isOpen, isExpanded]);

  // Listen for AI bubble prompts from domain selector bar
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

  if (!user) return null;

  return (
    <TooltipProvider>
      {/* Floating AI Button - Bottom Position with Ultra Futuristic Design */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsOpen(true)}
              className="group relative flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl overflow-hidden"
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-cyan-500/20 to-violet-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Scanning line effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan-line" />
              </div>
              
              {/* AI Core orb */}
              <div className="relative">
                <div className={cn(
                  "absolute inset-0 rounded-full blur-md transition-all duration-500",
                  isListening 
                    ? "bg-gradient-to-r from-cyan-400 to-violet-400 scale-150 animate-pulse" 
                    : "bg-gradient-to-r from-cyan-500/50 to-violet-500/50 scale-100"
                )} />
                <div className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-600 via-cyan-500 to-violet-600 shadow-inner shadow-white/10">
                  <Brain className="w-5 h-5 text-white drop-shadow-lg" />
                  <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-ping" style={{ animationDuration: '2s' }} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 bg-emerald-400" />
              </div>
              
              {/* Text content */}
              <div className="flex flex-col items-start relative z-10">
                <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-medium">Webstack</span>
                <span className="text-sm font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">AI Assistant</span>
              </div>
              
              {/* Sparkle icon */}
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse relative z-10" />
              
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/50 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/50 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50 rounded-br-lg" />
            </motion.button>
            
            {/* Floating particles */}
            <div className="absolute -inset-4 pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-cyan-400/60"
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 2 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                  style={{
                    left: `${25 + i * 25}%`,
                    top: '0%',
                  }}
                />
              ))}
            </div>
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
              "fixed left-0 top-0 z-50 h-screen bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-xl border-r border-cyan-500/20 shadow-2xl shadow-cyan-500/10 flex flex-col overflow-hidden",
              isExpanded ? "w-[600px]" : "w-[420px]"
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowHistory(!showHistory)}
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
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="hover:bg-cyan-500/10"
                    >
                      {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isExpanded ? 'Minimize' : 'Expand'}</TooltipContent>
                </Tooltip>
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
                {/* Domain & Model Selectors */}
                <div className="p-3 border-b border-border/50 space-y-2">
                  {/* Domain Selector */}
                  <Select value={selectedDomain || '__none__'} onValueChange={handleDomainSelect}>
                    <SelectTrigger className="w-full h-9">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="Select a domain for context..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No specific domain</SelectItem>
                      {domains.map(d => (
                        <SelectItem key={d.id} value={d.domain}>
                          {d.domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
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

                {/* Messages */}
                <ScrollArea className="flex-1 relative">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 via-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                          <Brain className="w-10 h-10 text-cyan-400" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-xl animate-pulse" />
                      </div>
                      <h3 className="font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">What can I help with?</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
                        Keyword research, competitor analysis, or SEO troubleshooting.
                      </p>
                      <div className="grid gap-2 w-full max-w-[280px]">
                        {[
                          { text: "🔍 Research keywords", full: "Research keywords for my domain" },
                          { text: "📊 Analyze competitors", full: "Analyze my competitor's SEO strategy" },
                          { text: "🚀 Improve rankings", full: "How can I improve my search rankings?" },
                          { text: "🔗 Find backlink opportunities", full: "Find backlink partner opportunities for my site" },
                        ].map((suggestion, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="justify-start text-left h-auto py-2.5 px-3 bg-gradient-to-r from-muted/30 to-transparent border-border/50 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
                            onClick={() => {
                              setInputValue(suggestion.full);
                              inputRef.current?.focus();
                            }}
                          >
                            {suggestion.text}
                          </Button>
                        ))}
                      </div>
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

                {/* Usage Warning */}
                {usage && !usage.canUse && !usage.isUnlimited && (
                  <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>Usage limit reached. Upgrade to continue.</span>
                  </div>
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
