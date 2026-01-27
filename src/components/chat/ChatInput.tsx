import { useState, useRef, useEffect, memo } from 'react';
import { Send, Mic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput = memo(({ onSend, isLoading, placeholder, disabled }: ChatInputProps) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || isLoading || disabled) return;
    onSend(value.trim());
    setValue('');
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative flex items-end gap-2 p-3 border-t border-border bg-background/80 backdrop-blur-sm">
      {/* AI Badge */}
      <div className="absolute -top-3 left-4 flex items-center gap-1 text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border/50">
        <Sparkles className="w-3 h-3 text-primary" />
        AI-powered
      </div>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Type a message...'}
        disabled={isLoading || disabled}
        className={cn(
          'flex-1 min-h-[40px] max-h-[120px] resize-none bg-secondary/50 border-0',
          'focus-visible:ring-1 focus-visible:ring-primary/50 rounded-xl',
          'text-sm placeholder:text-muted-foreground/60'
        )}
        rows={1}
      />

      <Button
        type="button"
        size="icon"
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading || disabled}
        className={cn(
          'h-10 w-10 rounded-xl transition-all duration-200',
          'bg-primary hover:bg-primary/90',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
