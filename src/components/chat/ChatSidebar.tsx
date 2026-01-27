import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, ChevronRight, ChevronLeft, X, Send, User, 
  Clock, Bell, Radio, Users, Globe, Eye, MapPin, Monitor, Smartphone,
  MousePointer, FileText, ExternalLink, ArrowUpRight, Zap, TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ChatConversation {
  id: string;
  session_id: string;
  status: string;
  visitor_name: string | null;
  visitor_email: string | null;
  last_message_at: string;
  current_page: string | null;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  message: string;
  sender_type: 'visitor' | 'operator' | 'system';
  created_at: string;
}

interface LiveVisitor {
  session_id: string;
  first_page: string | null;
  last_activity_at: string;
  started_at: string;
  referrer: string | null;
  user_id: string | null;
  user_agent: string | null;
  avatar_url?: string | null;
  display_name?: string | null;
  is_current_user?: boolean;
  page_count?: number;
  pages_viewed?: string[];
  engagement_score?: number;
}

interface ChatSidebarProps {
  isOnline: boolean;
  onNewChat?: () => void;
  onExpandChange?: (expanded: boolean) => void;
}

// Visitor badge colors for anonymous users
const VISITOR_COLORS = [
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-sky-400 to-blue-500',
  'from-lime-400 to-green-500',
  'from-fuchsia-400 to-pink-500',
  'from-cyan-400 to-blue-500',
];

const getVisitorColor = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return VISITOR_COLORS[hash % VISITOR_COLORS.length];
};

// Get referrer domain
const getReferrerDomain = (referrer: string | null): string | null => {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch {
    return null;
  }
};

// Get favicon URL for a domain
const getFaviconUrl = (domain: string | null): string | null => {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
};

// Time since helper with more detail
const getTimeSince = (timestamp: string) => {
  const mins = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
};

// Calculate session duration
const getSessionDuration = (startedAt: string) => {
  const mins = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

// Calculate engagement score (0-100)
const calculateEngagement = (pageCount: number, durationMins: number, hasInteracted: boolean): number => {
  let score = 0;
  score += Math.min(pageCount * 15, 40); // Up to 40 for pages viewed
  score += Math.min(durationMins * 2, 30); // Up to 30 for time on site
  if (hasInteracted) score += 30; // 30 for form/tool interaction
  return Math.min(score, 100);
};

// Get device type from user agent
const getDeviceType = (userAgent: string | null): 'mobile' | 'tablet' | 'desktop' => {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) return 'mobile';
  if (/ipad|tablet|playbook|silk/i.test(ua)) return 'tablet';
  return 'desktop';
};

// Get browser from user agent
const getBrowser = (userAgent: string | null): string => {
  if (!userAgent) return 'Unknown';
  if (/edg/i.test(userAgent)) return 'Edge';
  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) return 'Chrome';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/opera|opr/i.test(userAgent)) return 'Opera';
  return 'Other';
};

// Get referrer source type
const getReferrerType = (referrer: string | null): { type: string; label: string; color: string } => {
  if (!referrer) return { type: 'direct', label: 'Direct', color: 'bg-slate-500' };
  const r = referrer.toLowerCase();
  if (/google\./i.test(r)) return { type: 'search', label: 'Google', color: 'bg-blue-500' };
  if (/bing\./i.test(r)) return { type: 'search', label: 'Bing', color: 'bg-teal-500' };
  if (/facebook\.|fb\./i.test(r)) return { type: 'social', label: 'Facebook', color: 'bg-indigo-500' };
  if (/twitter\.|x\.com/i.test(r)) return { type: 'social', label: 'X/Twitter', color: 'bg-sky-500' };
  if (/linkedin\./i.test(r)) return { type: 'social', label: 'LinkedIn', color: 'bg-blue-600' };
  if (/instagram\./i.test(r)) return { type: 'social', label: 'Instagram', color: 'bg-pink-500' };
  if (/youtube\./i.test(r)) return { type: 'social', label: 'YouTube', color: 'bg-red-500' };
  if (/lovable\./i.test(r)) return { type: 'platform', label: 'Lovable', color: 'bg-violet-500' };
  return { type: 'referral', label: 'Referral', color: 'bg-amber-500' };
};

// Notification sound
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    const now = audioContext.currentTime;
    playTone(880, now, 0.12);
    playTone(1174.66, now + 0.12, 0.15);
    setTimeout(() => audioContext.close(), 400);
  } catch (e) {
    console.warn('Could not play notification sound:', e);
  }
};

export const ChatSidebar = memo(({ isOnline, onNewChat, onExpandChange }: ChatSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Notify parent of expansion state changes
  useEffect(() => {
    onExpandChange?.(isExpanded);
  }, [isExpanded, onExpandChange]);
  const [activeTab, setActiveTab] = useState<'visitors' | 'chats'>('visitors');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitor[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Get current user and session
  useEffect(() => {
    const sessionId = sessionStorage.getItem('webstack_session_id') || '';
    setCurrentSessionId(sessionId);

    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch live visitors with profile info and page counts
  const fetchLiveVisitors = useCallback(async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: sessions } = await supabase
      .from('visitor_sessions')
      .select('session_id, first_page, last_activity_at, started_at, referrer, user_id, user_agent')
      .gte('last_activity_at', tenMinutesAgo)
      .order('last_activity_at', { ascending: false })
      .limit(20);
    
    if (!sessions) return;

    // Get page view counts and pages for each session
    const sessionIds = sessions.map(s => s.session_id);
    const { data: pageViews } = await supabase
      .from('page_views')
      .select('session_id, page_path')
      .in('session_id', sessionIds);
    
    const pageViewsMap: Record<string, { count: number; pages: string[] }> = {};
    if (pageViews) {
      for (const pv of pageViews) {
        if (!pageViewsMap[pv.session_id]) {
          pageViewsMap[pv.session_id] = { count: 0, pages: [] };
        }
        pageViewsMap[pv.session_id].count++;
        if (!pageViewsMap[pv.session_id].pages.includes(pv.page_path)) {
          pageViewsMap[pv.session_id].pages.push(pv.page_path);
        }
      }
    }

    // Sort by activity
    const sortedByActivity = [...sessions].sort(
      (a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
    );

    // Deduplicate: one entry per user_id (if logged in) or session_id (if anonymous)
    const uniqueSessions: typeof sessions = [];
    const seenKeys = new Set<string>();

    for (const s of sortedByActivity) {
      const isSelf =
        (!!currentUserId && s.user_id === currentUserId) ||
        (!!currentSessionId && s.session_id === currentSessionId);

      // Skip anonymous entries from current user's session if logged in
      if (currentUserId && !s.user_id && s.session_id === currentSessionId) {
        continue;
      }

      const key = isSelf ? 'self' : s.user_id ? `u:${s.user_id}` : `s:${s.session_id}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      uniqueSessions.push(s);
    }

    // Get user IDs for profile lookup
    const userIds = uniqueSessions
      .map(s => s.user_id)
      .filter((id): id is string => !!id);

    // Fetch profiles for authenticated visitors
    let profilesMap: Record<string, { avatar_url: string | null; full_name: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, avatar_url, full_name')
        .in('user_id', userIds);

      if (profiles) {
        profilesMap = profiles.reduce((acc, p) => {
          acc[p.user_id] = { avatar_url: p.avatar_url, full_name: p.full_name };
          return acc;
        }, {} as Record<string, { avatar_url: string | null; full_name: string | null }>);
      }
    }

    // Build final visitors list with enhanced data
    const visitorsWithProfiles: LiveVisitor[] = uniqueSessions.map(v => {
      const isSelf =
        (!!currentUserId && v.user_id === currentUserId) ||
        (!!currentSessionId && v.session_id === currentSessionId);
      
      const sessionDurationMins = Math.floor((Date.now() - new Date(v.started_at).getTime()) / 60000);
      const pageCount = pageViewsMap[v.session_id]?.count || 1;
      const pagesViewed = pageViewsMap[v.session_id]?.pages || [v.first_page || '/'];
      
      return {
        ...v,
        user_agent: v.user_agent || null,
        avatar_url: v.user_id ? profilesMap[v.user_id]?.avatar_url || null : null,
        display_name: v.user_id ? profilesMap[v.user_id]?.full_name || null : null,
        is_current_user: isSelf,
        page_count: pageCount,
        pages_viewed: pagesViewed,
        engagement_score: calculateEngagement(pageCount, sessionDurationMins, false),
      };
    });

    // Ensure current user is first
    const currentIdx = visitorsWithProfiles.findIndex(v => v.is_current_user);
    if (currentIdx > 0) {
      const current = visitorsWithProfiles[currentIdx];
      const rest = visitorsWithProfiles.filter((_, i) => i !== currentIdx);
      setLiveVisitors([current, ...rest]);
    } else {
      setLiveVisitors(visitorsWithProfiles);
    }
  }, [currentUserId, currentSessionId]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .in('status', ['active', 'pending'])
      .order('last_message_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setConversations(data as ChatConversation[]);
      
      if (data.length > prevCountRef.current && prevCountRef.current > 0) {
        setHasUnread(true);
        playNotificationSound();
        onNewChat?.();
      }
      prevCountRef.current = data.length;
    }
  }, [onNewChat]);

  // Fetch messages for selected chat
  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data as ChatMessage[]);
  }, []);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return;
    
    setSending(true);
    try {
      await supabase.from('chat_messages').insert({
        conversation_id: selectedChat,
        sender_type: 'operator',
        message: newMessage.trim(),
      });

      await supabase
        .from('chat_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedChat);

      setNewMessage('');
    } finally {
      setSending(false);
    }
  };

  // Start chat with visitor
  const handleEngageVisitor = async (visitor: LiveVisitor) => {
    // Check for existing conversation
    const { data: existing } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('session_id', visitor.session_id)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      setSelectedChat(existing.id);
      setActiveTab('chats');
      return;
    }

    // Create new conversation
    const { data: newConv } = await supabase
      .from('chat_conversations')
      .insert({
        session_id: visitor.session_id,
        status: 'active',
        current_page: visitor.first_page,
        visitor_name: visitor.display_name,
      })
      .select('id')
      .single();

    if (newConv) {
      await supabase.from('chat_messages').insert({
        conversation_id: newConv.id,
        sender_type: 'system',
        message: `Chat initiated with visitor on ${visitor.first_page || '/'}`,
      });

      setSelectedChat(newConv.id);
      setActiveTab('chats');
      fetchConversations();
    }
  };

  // Close conversation
  const handleClose = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from('chat_conversations')
      .update({ status: 'closed' })
      .eq('id', id);
    
    if (selectedChat === id) {
      setSelectedChat(null);
      setMessages([]);
    }
    fetchConversations();
  };

  // Initial fetch and subscriptions
  useEffect(() => {
    if (!isOnline) return;
    
    fetchConversations();
    fetchLiveVisitors();
    
    const interval = setInterval(() => {
      fetchConversations();
      fetchLiveVisitors();
    }, 30000);

    const channel = supabase
      .channel('chat-sidebar-all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_conversations' },
        () => fetchConversations()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitor_sessions' },
        () => fetchLiveVisitors()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, [isOnline, fetchConversations, fetchLiveVisitors]);

  // Subscribe to messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    fetchMessages(selectedChat);

    const channel = supabase
      .channel(`chat-sidebar-msgs-${selectedChat}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${selectedChat}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender_type === 'visitor') playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [selectedChat, fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear unread when expanded
  useEffect(() => {
    if (isExpanded) setHasUnread(false);
  }, [isExpanded]);

  if (!isOnline) return null;

  const activeCount = conversations.length;
  const visitorCount = liveVisitors.length;

  return (
    <TooltipProvider>
      <div
        className={cn(
          'fixed right-0 top-0 h-full z-40 flex transition-all duration-300 ease-out',
          isExpanded ? 'w-80' : 'w-12'
        )}
        style={{ contain: 'layout' }}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full',
            'w-6 h-20 rounded-l-lg bg-card border border-r-0 border-border',
            'flex items-center justify-center hover:bg-secondary transition-colors',
            'shadow-lg'
          )}
        >
          {isExpanded ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          )}
          {(hasUnread || visitorCount > 0) && !isExpanded && (
            <span className={cn(
              'absolute -top-1 -left-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white',
              hasUnread ? 'bg-destructive animate-pulse' : 'bg-emerald-500'
            )}>
              {hasUnread ? '!' : visitorCount}
            </span>
          )}
        </button>

        {/* Sidebar Content */}
        <div className="flex-1 bg-card border-l border-border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              {isExpanded && (
                <div>
                  <h3 className="font-semibold text-sm">Chat Center</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-emerald-500" />
                      {visitorCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-primary" />
                      {activeCount}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {isExpanded && hasUnread && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                <Bell className="w-3 h-3 mr-1" />
                New
              </Badge>
            )}
          </div>

          {isExpanded && !selectedChat && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'visitors' | 'chats')} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mx-2 mt-2" style={{ width: 'calc(100% - 16px)' }}>
                <TabsTrigger value="visitors" className="text-xs gap-1">
                  <Users className="w-3 h-3" />
                  Live ({visitorCount})
                </TabsTrigger>
                <TabsTrigger value="chats" className="text-xs gap-1">
                  <MessageCircle className="w-3 h-3" />
                  Chats ({activeCount})
                </TabsTrigger>
              </TabsList>

              {/* Live Visitors Tab */}
              <TabsContent value="visitors" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full p-2">
                  <AnimatePresence>
                    {liveVisitors.map((visitor, idx) => {
                      const referrerDomain = getReferrerDomain(visitor.referrer);
                      const faviconUrl = getFaviconUrl(referrerDomain);
                      const hasAvatar = !!visitor.avatar_url;
                      const isCurrentUser = visitor.is_current_user;
                      const visitorKey = isCurrentUser
                        ? 'self'
                        : visitor.user_id
                          ? `u:${visitor.user_id}`
                          : `s:${visitor.session_id}`;
                      
                      const deviceType = getDeviceType(visitor.user_agent);
                      const browser = getBrowser(visitor.user_agent);
                      const referrerInfo = getReferrerType(visitor.referrer);
                      const sessionDuration = getSessionDuration(visitor.started_at);
                      const pageCount = visitor.page_count || 1;
                      const engagement = visitor.engagement_score || 0;

                      return (
                        <motion.div
                          key={visitorKey}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => !isCurrentUser && handleEngageVisitor(visitor)}
                          className={cn(
                            'p-3 rounded-lg mb-2 transition-all border',
                            isCurrentUser
                              ? 'bg-primary/10 border-primary/30 cursor-default'
                              : 'bg-secondary/30 hover:bg-secondary/60 border-transparent hover:border-primary/20 cursor-pointer hover:shadow-sm'
                          )}
                        >
                          {/* Top row: Avatar + Name + Badges */}
                          <div className="flex items-center gap-3">
                            {/* Avatar/Badge */}
                            <div className="relative flex-shrink-0">
                              {hasAvatar ? (
                                <img
                                  src={visitor.avatar_url!}
                                  alt={visitor.display_name || 'User'}
                                  className={cn(
                                    'w-10 h-10 rounded-full object-cover',
                                    isCurrentUser && 'ring-2 ring-primary'
                                  )}
                                />
                              ) : faviconUrl && referrerDomain ? (
                                <div className={cn(
                                  'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center',
                                  getVisitorColor(visitor.session_id)
                                )}>
                                  <img
                                    src={faviconUrl}
                                    alt={referrerDomain}
                                    className="w-5 h-5 rounded-sm"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className={cn(
                                  'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center',
                                  getVisitorColor(visitor.session_id)
                                )}>
                                  <User className="w-5 h-5 text-white" />
                                </div>
                              )}
                              {/* Live indicator */}
                              <span className={cn(
                                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card',
                                isCurrentUser ? 'bg-primary' : 'bg-emerald-500'
                              )}>
                                <span className="absolute inset-0 rounded-full bg-inherit animate-ping opacity-75" />
                              </span>
                            </div>

                            {/* Name + Badges */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-medium truncate">
                                  {isCurrentUser ? 'You' : (visitor.display_name || referrerDomain || 'Visitor')}
                                </span>
                                {isCurrentUser && (
                                  <Badge className="text-[9px] px-1.5 py-0 bg-primary text-primary-foreground">
                                    YOU
                                  </Badge>
                                )}
                                {visitor.user_id && !isCurrentUser && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-500/50 text-emerald-500">
                                    <User className="w-2 h-2 mr-0.5" />
                                    Logged In
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Source badge */}
                              <div className="flex items-center gap-1 mt-0.5">
                                <Badge variant="secondary" className={cn('text-[9px] px-1.5 py-0', referrerInfo.color, 'text-white')}>
                                  {referrerInfo.label}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {getTimeSince(visitor.last_activity_at)} ago
                                </span>
                              </div>
                            </div>

                            {/* Engage button */}
                            {!isCurrentUser && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 hover:bg-primary/20 flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEngageVisitor(visitor);
                                    }}
                                  >
                                    <MessageCircle className="w-4 h-4 text-primary" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">Start chat</TooltipContent>
                              </Tooltip>
                            )}
                          </div>

                          {/* Details row */}
                          <div className="mt-2 pt-2 border-t border-border/50">
                            {/* Current page */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                              <Globe className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{visitor.first_page || '/'}</span>
                            </div>
                            
                            {/* Stats row */}
                            <div className="flex items-center gap-3 text-[10px]">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <FileText className="w-3 h-3" />
                                    <span>{pageCount} page{pageCount !== 1 ? 's' : ''}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-[200px]">
                                  <p className="font-medium mb-1">Pages viewed:</p>
                                  <ul className="text-xs space-y-0.5">
                                    {(visitor.pages_viewed || [visitor.first_page || '/']).slice(0, 5).map((p, i) => (
                                      <li key={i} className="truncate">{p}</li>
                                    ))}
                                    {(visitor.pages_viewed?.length || 1) > 5 && (
                                      <li className="text-muted-foreground">+{(visitor.pages_viewed?.length || 1) - 5} more</li>
                                    )}
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                              
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{sessionDuration}</span>
                              </div>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    {deviceType === 'mobile' ? (
                                      <Smartphone className="w-3 h-3" />
                                    ) : (
                                      <Monitor className="w-3 h-3" />
                                    )}
                                    <span>{browser}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} • {browser}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            
                            {/* Engagement bar */}
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  Engagement
                                </span>
                                <span className={cn(
                                  'font-medium',
                                  engagement >= 70 ? 'text-emerald-500' : 
                                  engagement >= 40 ? 'text-amber-500' : 'text-muted-foreground'
                                )}>
                                  {engagement}%
                                </span>
                              </div>
                              <Progress 
                                value={engagement} 
                                className="h-1.5"
                              />
                            </div>
                            
                            {/* Referrer URL (if exists) */}
                            {visitor.referrer && (
                              <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate opacity-70">{visitor.referrer}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                  {liveVisitors.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No active visitors</p>
                      <p className="text-xs mt-1">Visitors appear when active</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Chats Tab */}
              <TabsContent value="chats" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full p-2">
                  <AnimatePresence>
                    {conversations.map((conv, idx) => (
                      <motion.div
                        key={conv.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => setSelectedChat(conv.id)}
                        className={cn(
                          'p-3 rounded-lg cursor-pointer mb-2 transition-all',
                          'bg-secondary/30 hover:bg-secondary/60 border border-transparent',
                          'hover:border-primary/20 hover:shadow-sm'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <span className="text-sm font-medium truncate max-w-[120px]">
                              {conv.visitor_name || conv.visitor_email || 'Visitor'}
                            </span>
                          </div>
                          <button
                            onClick={(e) => handleClose(conv.id, e)}
                            className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                        </div>
                        {conv.current_page && (
                          <p className="text-xs text-muted-foreground/70 truncate mt-1">
                            {conv.current_page}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {conversations.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No active chats</p>
                      <p className="text-xs mt-1">Start one from the Visitors tab</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}

          {/* Selected Chat View */}
          {isExpanded && selectedChat && (
            <>
              <div className="p-2 border-b border-border flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setSelectedChat(null);
                    setMessages([]);
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {conversations.find(c => c.id === selectedChat)?.visitor_name || 'Visitor'}
                  </p>
                </div>
              </div>

              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        msg.sender_type === 'operator' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                          msg.sender_type === 'operator'
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : msg.sender_type === 'visitor'
                            ? 'bg-secondary text-foreground rounded-bl-sm'
                            : 'bg-muted text-muted-foreground italic text-xs'
                        )}
                      >
                        <p>{msg.message}</p>
                        <p className={cn(
                          'text-[10px] mt-1',
                          msg.sender_type === 'operator' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                        )}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-2 border-t border-border flex gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Reply..."
                  className="flex-1 h-9 text-sm"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9"
                  disabled={!newMessage.trim() || sending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          )}

          {/* Collapsed State */}
          {!isExpanded && (
            <div className="flex-1 flex flex-col items-center py-4 gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative cursor-pointer" onClick={() => setIsExpanded(true)}>
                    <Users className="w-5 h-5 text-emerald-500" />
                    {visitorCount > 0 && (
                      <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-bold text-white flex items-center justify-center">
                        {visitorCount}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">Live visitors</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative cursor-pointer" onClick={() => setIsExpanded(true)}>
                    <MessageCircle className="w-5 h-5 text-primary" />
                    {activeCount > 0 && (
                      <span className={cn(
                        'absolute -top-1 -right-2 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center',
                        hasUnread ? 'bg-destructive animate-pulse' : 'bg-primary'
                      )}>
                        {activeCount}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">Active chats</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
});

ChatSidebar.displayName = 'ChatSidebar';

export default ChatSidebar;
