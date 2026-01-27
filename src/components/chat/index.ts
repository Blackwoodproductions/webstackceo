// Chat components - modular, memoized, reusable
export { ChatMessageList } from './ChatMessageList';
export { ChatInput } from './ChatInput';
export { ChatHeader } from './ChatHeader';
export { VisitorAvatar } from './VisitorAvatar';

// Re-export hooks for convenience
export { useChatUtils, getReferrerDomain, getFaviconUrl } from '@/hooks/use-chat-utils';
export { useLiveVisitors } from '@/hooks/use-live-visitors';
export { useChatConversations } from '@/hooks/use-chat-conversations';
export type { LiveVisitor } from '@/hooks/use-live-visitors';
export type { ChatMessage, ChatConversation } from '@/hooks/use-chat-conversations';
