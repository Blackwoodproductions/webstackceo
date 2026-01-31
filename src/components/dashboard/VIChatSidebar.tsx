import { memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  MessageCircle, ChevronLeft, ChevronRight, Eye, Zap, Flame, Star, 
  Target, Crosshair, Sparkles, Activity, User as UserIcon
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface ChatConversation {
  id: string;
  session_id: string;
  status: string;
  visitor_name: string | null;
  visitor_email: string | null;
  last_message_at: string;
  current_page: string | null;
}

interface LiveVisitor {
  session_id: string;
  first_page: string | null;
  last_activity_at: string;
  started_at: string;
  page_count?: number;
  user_id?: string | null;
  avatar_url?: string | null;
  display_name?: string | null;
  email?: string | null;
  is_current_user?: boolean;
  is_admin?: boolean;
}

interface VIChatSidebarProps {
  user: User | null;
  chatOnline: boolean;
  setChatOnline: (online: boolean) => void;
  chatPanelOpen: boolean;
  setChatPanelOpen: (open: boolean) => void;
  sidebarChats: ChatConversation[];
  liveVisitors: LiveVisitor[];
  chatProfileAvatars: Record<string, string | null>;
  selectedChatId: string | null;
  setSelectedChatId: (id: string | null) => void;
  currentUserProfile: { avatar_url: string | null; full_name: string | null } | null;
  fetchSidebarChats: () => void;
  hasNewMessage: boolean;
}

// Memoized visitor card component
const VisitorCard = memo(function VisitorCard({
  visitor,
  onStartChat,
  isExpanded,
}: {
  visitor: LiveVisitor;
  onStartChat: (visitor: LiveVisitor) => void;
  isExpanded: boolean;
}) {
  const colors = [
    'from-red-600 to-rose-700',
    'from-orange-600 to-amber-700',
    'from-emerald-600 to-green-700',
    'from-blue-600 to-indigo-700',
    'from-purple-600 to-violet-700',
    'from-cyan-600 to-teal-700',
  ];
  
  const hash = visitor.session_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorClass = colors[hash % colors.length];
  const visitorIcons = [Eye, Zap, Flame, Star, Target, Crosshair, Sparkles, Activity];
  const VisitorIcon = visitorIcons[hash % visitorIcons.length];
  const timeSince = Math.floor((Date.now() - new Date(visitor.started_at).getTime()) / 60000);
  const timeLabel = timeSince < 1 ? 'Just now' : timeSince < 60 ? `${timeSince}m` : `${Math.floor(timeSince / 60)}h`;
  const isCurrentUser = visitor.is_current_user;
  const hasAvatar = visitor.avatar_url;

  if (isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => !isCurrentUser && onStartChat(visitor)}
        className={`group relative p-3 rounded-lg border transition-all ${
          isCurrentUser
            ? 'bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border-cyan-500/30 cursor-default'
            : 'bg-card/50 border-border/50 hover:bg-card hover:border-primary/30 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-3">
          {hasAvatar ? (
            <div className="relative">
              <img 
                src={visitor.avatar_url!} 
                alt={visitor.display_name || 'User'} 
                className={`w-10 h-10 rounded-full object-cover ring-2 ${
                  isCurrentUser ? 'ring-cyan-500/60' : visitor.is_admin ? 'ring-amber-500/60' : 'ring-primary/40'
                }`}
              />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                isCurrentUser ? 'bg-cyan-400' : visitor.is_admin ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
            </div>
          ) : (
            <div className={`relative w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg`}>
              <VisitorIcon className="w-5 h-5 text-white" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                visitor.is_admin ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">
                {isCurrentUser 
                  ? 'You' 
                  : visitor.display_name || visitor.email?.split('@')[0] || visitor.first_page || '/'}
              </p>
              {isCurrentUser && (
                <span className="text-[9px] font-bold bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-1.5 py-0.5 rounded-full">
                  YOU
                </span>
              )}
              {!isCurrentUser && visitor.is_admin && (
                <span className="text-[9px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                  OPERATOR
                </span>
              )}
              {!isCurrentUser && !visitor.is_admin && visitor.user_id && (
                <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                  LOGGED IN
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
              <span className={`w-1 h-1 rounded-full animate-pulse flex-shrink-0 ${isCurrentUser ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
              {isCurrentUser 
                ? 'Your session' 
                : visitor.email 
                  ? `${visitor.email} • ${timeLabel}`
                  : `${visitor.first_page || '/'} • ${timeLabel}`}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Collapsed view
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => !isCurrentUser && onStartChat(visitor)}
      className={`relative ${isCurrentUser ? 'w-12 h-12' : 'w-10 h-10'} group ${isCurrentUser ? 'cursor-default' : 'cursor-pointer'}`}
      title={isCurrentUser ? 'You (Online)' : `${visitor.first_page || '/'} • ${timeLabel}`}
      whileHover={isCurrentUser ? {} : { scale: 1.15 }}
      whileTap={isCurrentUser ? {} : { scale: 0.95 }}
    >
      {hasAvatar ? (
        <>
          <div className={`absolute -inset-1 rounded-full ${isCurrentUser ? 'bg-gradient-to-br from-cyan-500 to-violet-500' : `bg-gradient-to-br ${colorClass}`} opacity-50 blur-md group-hover:opacity-70 transition-opacity`} />
          <div className={`relative w-full h-full rounded-full overflow-hidden ring-2 ${isCurrentUser ? 'ring-cyan-500/60' : 'ring-primary/40'} shadow-xl`}>
            <img src={visitor.avatar_url!} alt={visitor.display_name || 'User'} className="w-full h-full object-cover" />
          </div>
          <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background shadow-lg ${isCurrentUser ? 'bg-cyan-400 shadow-cyan-400/60' : 'bg-emerald-400 shadow-emerald-400/60'}`}>
            <span className={`absolute inset-0 rounded-full animate-ping opacity-75 ${isCurrentUser ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
          </span>
          {isCurrentUser && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-bold bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-1.5 py-0.5 rounded-full shadow-lg whitespace-nowrap">
              YOU
            </span>
          )}
        </>
      ) : (
        <>
          <div className={`absolute -inset-1 rounded-lg bg-gradient-to-br ${colorClass} opacity-40 blur-md group-hover:opacity-70 transition-opacity`} />
          <div className={`relative w-full h-full rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-xl overflow-hidden`}>
            <VisitorIcon className="w-4 h-4 text-white relative z-10 drop-shadow-lg" />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background shadow-lg shadow-emerald-400/60">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </span>
        </>
      )}
    </motion.div>
  );
});

export const VIChatSidebar = memo(function VIChatSidebar({
  user,
  chatOnline,
  setChatOnline,
  chatPanelOpen,
  setChatPanelOpen,
  sidebarChats,
  liveVisitors,
  chatProfileAvatars,
  selectedChatId,
  setSelectedChatId,
  currentUserProfile,
  fetchSidebarChats,
  hasNewMessage,
}: VIChatSidebarProps) {
  
  const handleStartChat = useCallback(async (visitor: LiveVisitor) => {
    if (visitor.is_current_user) return;
    
    const { data: newConv } = await supabase
      .from('chat_conversations')
      .insert({
        session_id: visitor.session_id,
        status: 'active',
        current_page: visitor.first_page,
      })
      .select('id')
      .single();
    
    if (newConv) {
      await supabase.from('chat_messages').insert({
        conversation_id: newConv.id,
        sender_type: 'system',
        message: `Chat initiated with visitor on ${visitor.first_page || 'homepage'}`,
      });
      setChatPanelOpen(true);
      setSelectedChatId(newConv.id);
      fetchSidebarChats();
      toast.success('Chat started with visitor');
    }
  }, [setChatPanelOpen, setSelectedChatId, fetchSidebarChats]);

  const pendingChatsCount = useMemo(() => 
    sidebarChats.filter(c => c.status === 'pending').length,
  [sidebarChats]);

  return (
    <div 
      className={`flex-shrink-0 border-l border-border bg-card/50 transition-[width] duration-200 ease-out ${
        chatPanelOpen ? 'w-64' : 'w-14'
      }`}
    >
      <div className="sticky top-[52px] h-[calc(100vh-140px)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`flex items-center ${chatPanelOpen ? 'justify-between p-3' : 'justify-center py-3'} border-b border-border`}>
          {chatPanelOpen ? (
            <>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Live Chats</h3>
                {pendingChatsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                    {pendingChatsCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="chat-toggle" className="sr-only">Chat Online</Label>
                <Switch
                  id="chat-toggle"
                  checked={chatOnline}
                  onCheckedChange={setChatOnline}
                  className="data-[state=checked]:bg-emerald-500"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setChatPanelOpen(false)}
                  className="h-7 w-7"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChatPanelOpen(true)}
              className={`h-8 w-8 relative ${hasNewMessage ? 'animate-pulse' : ''}`}
            >
              <MessageCircle className={`w-5 h-5 ${chatOnline ? 'text-emerald-500' : 'text-muted-foreground'}`} />
              {pendingChatsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                  {pendingChatsCount}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Content */}
        {chatOnline && chatPanelOpen && (
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {/* Active Chats */}
            {sidebarChats.map((chat) => {
              const avatarUrl = chat.visitor_email ? chatProfileAvatars[chat.visitor_email] : null;
              
              return (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`group relative p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedChatId === chat.id
                      ? 'bg-primary/10 border-primary/30'
                      : chat.status === 'pending'
                        ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                        : 'bg-card/50 border-border/50 hover:bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-500/50" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {chat.visitor_name || chat.visitor_email || 'Anonymous'}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {chat.current_page || '/'}
                      </p>
                    </div>
                    {chat.status === 'pending' && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Separator */}
            {sidebarChats.length > 0 && liveVisitors.length > 0 && (
              <div className="flex items-center gap-2 py-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground">Live Visitors</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            {/* Live Visitors */}
            {liveVisitors.map((visitor) => (
              <VisitorCard
                key={visitor.session_id}
                visitor={visitor}
                onStartChat={handleStartChat}
                isExpanded={true}
              />
            ))}

            {/* Empty state */}
            {sidebarChats.length === 0 && liveVisitors.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-8 animate-fade-in">
                  <MessageCircle className="w-12 h-12 text-cyan-500/40 mx-auto" />
                  <p className="text-xs text-muted-foreground mt-3">Waiting for visitors...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsed state */}
        {chatOnline && !chatPanelOpen && (
          <div className="flex-1 flex flex-col items-center gap-2 py-3 overflow-auto">
            {sidebarChats.slice(0, 5).map((chat) => {
              const avatarUrl = chat.visitor_email ? chatProfileAvatars[chat.visitor_email] : null;
              
              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setChatPanelOpen(true);
                    setSelectedChatId(chat.id);
                  }}
                  className={`relative w-10 h-10 rounded-full cursor-pointer transition-all hover:scale-110 ${
                    chat.status === 'pending' ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-background' : ''
                  }`}
                  title={chat.visitor_name || 'Active Chat'}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover ring-2 ring-cyan-500/50" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {chat.status === 'pending' && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
              );
            })}

            {sidebarChats.length > 0 && liveVisitors.length > 0 && (
              <div className="w-6 h-px bg-border my-1" />
            )}

            {liveVisitors.slice(0, 10 - Math.min(sidebarChats.length, 5)).map((visitor) => (
              <VisitorCard
                key={visitor.session_id}
                visitor={visitor}
                onStartChat={handleStartChat}
                isExpanded={false}
              />
            ))}

            {sidebarChats.length === 0 && liveVisitors.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <Eye className="w-5 h-5 text-muted-foreground/30" />
              </div>
            )}
          </div>
        )}

        {/* Offline message */}
        {!chatOnline && chatPanelOpen && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8 px-4 animate-fade-in">
              <MessageCircle className="w-12 h-12 text-muted-foreground/20 mx-auto" />
              <p className="text-xs text-muted-foreground mt-3">Chat is offline</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">Turn on to receive chats</p>
            </div>
          </div>
        )}

        {/* Current User Footer */}
        {user && (
          <div className="mt-auto border-t border-border p-2">
            {chatPanelOpen ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                {currentUserProfile?.avatar_url ? (
                  <img 
                    src={currentUserProfile.avatar_url} 
                    alt={currentUserProfile.full_name || 'You'} 
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {(currentUserProfile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {currentUserProfile?.full_name || user.email?.split('@')[0] || 'You'}
                  </p>
                  <p className="text-[10px] text-primary truncate">Operator</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                {currentUserProfile?.avatar_url ? (
                  <div className="relative">
                    <img 
                      src={currentUserProfile.avatar_url} 
                      alt={currentUserProfile.full_name || 'You'} 
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/50"
                      title={currentUserProfile.full_name || 'You (Operator)'}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center ring-2 ring-primary/30" title="You (Operator)">
                    <span className="text-lg font-semibold text-white">
                      {(currentUserProfile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default VIChatSidebar;
