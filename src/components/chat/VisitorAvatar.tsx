import { memo } from 'react';
import { User, Globe } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import type { LiveVisitor } from '@/hooks/use-live-visitors';
import { useChatUtils, getReferrerDomain, getFaviconUrl } from '@/hooks/use-chat-utils';

interface VisitorAvatarProps {
  visitor: LiveVisitor;
  index: number;
  onClick?: () => void;
}

/**
 * Memoized visitor avatar component for the visitor stack
 */
export const VisitorAvatar = memo(function VisitorAvatar({
  visitor,
  index,
  onClick,
}: VisitorAvatarProps) {
  const { getVisitorColor, getTimeSince } = useChatUtils();
  
  const referrerDomain = getReferrerDomain(visitor.referrer);
  const faviconUrl = getFaviconUrl(referrerDomain);
  const hasAvatar = !!visitor.avatar_url;
  const isCurrentUser = visitor.is_current_user;
  
  const visitorKey = isCurrentUser
    ? 'self'
    : visitor.user_id
      ? `u:${visitor.user_id}`
      : `s:${visitor.session_id}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 20 }}
          transition={{ duration: 0.14, ease: 'easeOut', delay: index * 0.03 }}
          onClick={() => !isCurrentUser && onClick?.()}
          className={`relative ${isCurrentUser ? 'w-12 h-12' : 'w-10 h-10'} rounded-full bg-gradient-to-br ${
            isCurrentUser ? 'from-primary to-accent ring-2 ring-primary/50' : getVisitorColor(visitor.session_id)
          } text-primary-foreground shadow-lg hover:shadow-xl transition-shadow duration-150 flex items-center justify-center text-[10px] font-bold border-2 border-background group overflow-hidden ${
            isCurrentUser ? 'cursor-default' : 'cursor-pointer'
          }`}
          aria-label={isCurrentUser ? 'You (online)' : `Engage visitor ${visitor.display_name || referrerDomain || 'direct'}`}
        >
          {/* Priority: 1. User avatar, 2. Referrer favicon, 3. User icon */}
          {hasAvatar ? (
            <img
              src={visitor.avatar_url!}
              alt={visitor.display_name || 'User'}
              className="w-full h-full object-cover"
            />
          ) : faviconUrl ? (
            <img
              src={faviconUrl}
              alt={`From ${referrerDomain}`}
              className="w-5 h-5 rounded-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <User className={`w-4 h-4 ${hasAvatar || faviconUrl ? 'hidden' : ''}`} />
          
          {/* Live pulse indicator */}
          <span 
            className={`absolute -top-0.5 -right-0.5 ${isCurrentUser ? 'w-3 h-3' : 'w-2.5 h-2.5'} rounded-full ${
              isCurrentUser ? 'bg-primary' : 'bg-emerald-400'
            } border border-background`} 
          />
          
          {/* "YOU" badge for current user */}
          {isCurrentUser && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary text-[8px] font-bold rounded-full text-primary-foreground shadow-lg">
              YOU
            </span>
          )}
          
          {/* Connection line */}
          {!isCurrentUser && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-px h-2 bg-gradient-to-b from-border/50 to-transparent" />
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="left" className="bg-card border-border">
        <div className="flex items-center gap-2">
          {hasAvatar && (
            <img src={visitor.avatar_url!} alt="" className="w-4 h-4 rounded-full" />
          )}
          {!hasAvatar && faviconUrl && (
            <img src={faviconUrl} alt="" className="w-3 h-3 rounded-sm" />
          )}
          {!hasAvatar && !faviconUrl && <Globe className="w-3 h-3 text-muted-foreground" />}
          <span className="text-xs">
            {isCurrentUser ? 'You' : (visitor.display_name || referrerDomain || visitor.first_page || '/')}
          </span>
          {isCurrentUser ? (
            <span className="text-[10px] text-primary font-medium">• Online</span>
          ) : (
            <span className="text-[10px] text-muted-foreground">• {getTimeSince(visitor.started_at)}</span>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

export default VisitorAvatar;
