import { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Maximize2, Minimize2, Send, Plus, Trash2, MessageSquare, Sparkles, Clock, AlertCircle, Globe, ChevronDown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIAssistant, type AIMessage, type AIConversation } from '@/hooks/use-ai-assistant';
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
// Message component
const ChatMessage = memo(function ChatMessage({ message, isStreaming }: { message: AIMessage; isStreaming?: boolean }) {
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
          <pre key={i} className="bg-muted p-3 rounded-lg overflow-x-auto text-xs my-2">
            <code>{part}</code>
          </pre>
        );
      } else if (i % 3 === 0 && part) {
        // Regular text - handle basic markdown
        const formatted = part
          .split('\n')
          .map((line, j) => {
            // Headers
            if (line.startsWith('### ')) return <h4 key={j} className="font-semibold mt-3 mb-1">{line.slice(4)}</h4>;
            if (line.startsWith('## ')) return <h3 key={j} className="font-bold mt-4 mb-2">{line.slice(3)}</h3>;
            if (line.startsWith('# ')) return <h2 key={j} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>;
            // Lists
            if (line.startsWith('- ') || line.startsWith('* ')) return <li key={j} className="ml-4">{line.slice(2)}</li>;
            if (/^\d+\. /.test(line)) return <li key={j} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
            // Bold and italic
            const processed = line
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
              .replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>');
            return line ? <p key={j} className="mb-1" dangerouslySetInnerHTML={{ __html: processed }} /> : <br key={j} />;
          });
        elements.push(<div key={i}>{formatted}</div>);
      }
    }
    
    return elements;
  };
  
  return (
    <div className={cn(
      "flex gap-3 p-4",
      isUser ? "bg-muted/30" : "bg-background"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isUser ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-violet-500 to-cyan-500"
      )}>
        {isUser ? (
          <span className="text-sm font-medium">U</span>
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium mb-1">
          {isUser ? 'You' : 'Webstack.ceo AI'}
        </div>
        <div className="text-sm text-foreground/90">
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
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
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
    selectConversation,
    sendMessage,
    stopStreaming,
    deleteConversation,
    clearCurrentConversation,
  } = useAIAssistant();

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
    <>
      {/* Floating Tab Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed left-0 top-24 z-50 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white px-3 py-3 rounded-r-xl shadow-lg hover:shadow-xl transition-all group"
          >
            <Bot className="w-5 h-5" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap text-sm font-medium">
              AI Assistant
            </span>
            <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed left-0 top-0 z-50 h-screen bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-2xl flex flex-col",
              isExpanded ? "w-[600px]" : "w-[380px]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Webstack.ceo AI</h2>
                  <p className="text-xs text-muted-foreground">SEO Assistant & Troubleshooter</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(showHistory && "bg-muted")}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
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
                {/* Domain Selector */}
                <div className="p-3 border-b border-border/50">
                  <Select value={selectedDomain || '__none__'} onValueChange={handleDomainSelect}>
                    <SelectTrigger className="w-full">
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
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">How can I help you today?</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                        I can assist with keyword research, domain onboarding, SEO troubleshooting, and more.
                      </p>
                      <div className="grid gap-2 w-full max-w-xs">
                        {[
                          "Research keywords for my domain",
                          "Help me set up Google Search Console",
                          "Why isn't my site ranking?",
                          "Analyze my competitor's SEO",
                        ].map((suggestion, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="justify-start text-left h-auto py-2 px-3"
                            onClick={() => {
                              setInputValue(suggestion);
                              inputRef.current?.focus();
                            }}
                          >
                            {suggestion}
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
                        />
                      ))}
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

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-border/50">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask about keywords, SEO, troubleshooting..."
                      disabled={isLoading || (usage && !usage.canUse && !usage.isUnlimited)}
                      className="flex-1"
                    />
                    {isStreaming ? (
                      <Button type="button" variant="destructive" onClick={stopStreaming}>
                        Stop
                      </Button>
                    ) : (
                      <Button type="submit" disabled={!inputValue.trim() || isLoading}>
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
});

export default AIAssistantTab;
