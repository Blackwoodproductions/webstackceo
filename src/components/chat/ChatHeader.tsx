import { memo } from 'react';
import { MessageCircle, Minimize2, X } from 'lucide-react';

interface ChatHeaderProps {
  title?: string;
  subtitle?: string;
  isOnline?: boolean;
  onMinimize?: () => void;
  onClose?: () => void;
}

/**
 * Memoized chat panel header component
 */
export const ChatHeader = memo(function ChatHeader({
  title = 'Webstack Support',
  subtitle,
  isOnline = true,
  onMinimize,
  onClose,
}: ChatHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-primary to-accent p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-primary-foreground">{title}</h3>
          <p className="text-xs text-primary-foreground/80 flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-muted'}`} />
            {subtitle || (isOnline ? 'Online now' : 'Offline')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="p-2 rounded-lg hover:bg-primary-foreground/20 transition-colors"
            aria-label="Minimize chat"
          >
            <Minimize2 className="w-4 h-4 text-primary-foreground" />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-primary-foreground/20 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4 text-primary-foreground" />
          </button>
        )}
      </div>
    </div>
  );
});

export default ChatHeader;
