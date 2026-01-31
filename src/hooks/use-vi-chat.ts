import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
}

/**
 * Hook for VI Dashboard chat functionality
 * Handles chat state, live visitors, and real-time subscriptions
 */
export const useVIChat = (user: User | null) => {
  const [chatOnline, setChatOnline] = useState(() => {
    const stored = localStorage.getItem('chat_operator_online');
    return stored !== null ? stored === 'true' : true;
  });
  
  const [operatorStatus, setOperatorStatus] = useState<'online' | 'busy' | 'away' | 'offline'>(() => {
    const stored = localStorage.getItem('chat_operator_status');
    return (stored as 'online' | 'busy' | 'away' | 'offline') || 'online';
  });
  
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [sidebarChats, setSidebarChats] = useState<ChatConversation[]>([]);
  const [chatProfileAvatars, setChatProfileAvatars] = useState<Record<string, string | null>>({});
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitor[]>([]);
  const [prevChatCount, setPrevChatCount] = useState(0);
  
  // Keep chat session IDs in a ref to avoid re-triggering effects
  const chatSessionIdsRef = useRef<string[]>([]);
  
  useEffect(() => {
    chatSessionIdsRef.current = sidebarChats.map((c) => c.session_id);
  }, [sidebarChats]);

  // Persist chat online status
  useEffect(() => {
    localStorage.setItem('chat_operator_online', String(chatOnline));
  }, [chatOnline]);

  useEffect(() => {
    localStorage.setItem('chat_operator_status', operatorStatus);
    const isOffline = operatorStatus === 'offline';
    if (isOffline) {
      setChatOnline(false);
    } else if (!chatOnline) {
      setChatOnline(true);
    }
  }, [operatorStatus, chatOnline]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
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
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      const now = audioContext.currentTime;
      playTone(880, now, 0.15);
      playTone(1174.66, now + 0.15, 0.2);
      setTimeout(() => audioContext.close(), 500);
    } catch (e) {
      console.warn('Could not play notification sound:', e);
    }
  }, []);

  // Fetch sidebar chats
  const fetchSidebarChats = useCallback(async () => {
    const { data } = await supabase
      .from('chat_conversations')
      .select('id, session_id, status, visitor_name, visitor_email, last_message_at, current_page')
      .in('status', ['active', 'pending'])
      .order('last_message_at', { ascending: false });
    
    if (data) {
      setSidebarChats(data);
      
      // Fetch profile avatars for chats with emails
      const emailsToLookup = data.filter(c => c.visitor_email).map(c => c.visitor_email!);
      if (emailsToLookup.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email, avatar_url')
          .in('email', emailsToLookup);
        
        if (profiles) {
          const avatarMap: Record<string, string | null> = {};
          profiles.forEach(p => {
            if (p.email) avatarMap[p.email] = p.avatar_url;
          });
          setChatProfileAvatars(avatarMap);
        }
      }
    }
  }, []);

  // Fetch live visitors with deduplication
  const fetchLiveVisitors = useCallback(async () => {
    const currentSessionId = sessionStorage.getItem('webstack_session_id');
    const currentUserId = user?.id || null;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: sessions } = await supabase
      .from('visitor_sessions')
      .select('session_id, first_page, last_activity_at, started_at, user_id')
      .gte('last_activity_at', fiveMinutesAgo)
      .order('last_activity_at', { ascending: false })
      .limit(50);
    
    if (!sessions) return;
    
    // Deduplicate sessions
    const sortedByActivity = [...sessions].sort(
      (a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
    );
    
    const uniqueSessions: typeof sessions = [];
    const seenKeys = new Set<string>();
    
    for (const s of sortedByActivity) {
      const isSelf =
        (!!currentUserId && s.user_id === currentUserId) ||
        (!!currentSessionId && s.session_id === currentSessionId);
      
      if (currentUserId && !s.user_id && s.session_id === currentSessionId) {
        continue;
      }
      
      const key = isSelf ? 'self' : s.user_id ? `u:${s.user_id}` : `s:${s.session_id}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      uniqueSessions.push(s);
    }
    
    // Filter out sessions with active chats
    const chatSessionIds = chatSessionIdsRef.current;
    const filteredSessions = uniqueSessions.filter(v => !chatSessionIds.includes(v.session_id));
    
    // Fetch page view counts
    const sessionIds = filteredSessions.map(s => s.session_id);
    const { data: pageViews } = await supabase
      .from('page_views')
      .select('session_id')
      .in('session_id', sessionIds);
    
    const pageCountMap: Record<string, number> = {};
    pageViews?.forEach(pv => {
      pageCountMap[pv.session_id] = (pageCountMap[pv.session_id] || 0) + 1;
    });
    
    // Fetch profiles for logged-in users
    const userIds = filteredSessions.filter(s => s.user_id).map(s => s.user_id!);
    let profilesMap: Record<string, { avatar_url: string | null; full_name: string | null; email: string | null }> = {};
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, avatar_url, full_name, email')
        .in('user_id', userIds);
      
      if (profiles) {
        profiles.forEach(p => {
          profilesMap[p.user_id] = { 
            avatar_url: p.avatar_url, 
            full_name: p.full_name,
            email: p.email,
          };
        });
      }
    }
    
    // Sort by time on site
    const sorted = filteredSessions.sort((a, b) => {
      const timeA = Date.now() - new Date(a.started_at).getTime();
      const timeB = Date.now() - new Date(b.started_at).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (pageCountMap[b.session_id] || 0) - (pageCountMap[a.session_id] || 0);
    });
    
    // Map with profiles
    const visitorsWithProfiles = sorted.slice(0, 10).map(s => ({
      ...s,
      page_count: pageCountMap[s.session_id] || 1,
      avatar_url: s.user_id ? profilesMap[s.user_id]?.avatar_url : null,
      display_name: s.user_id ? profilesMap[s.user_id]?.full_name : null,
      email: s.user_id ? profilesMap[s.user_id]?.email : null,
      is_current_user: s.session_id === currentSessionId || (!!currentUserId && s.user_id === currentUserId),
    }));
    
    // Sort to put current user first
    const finalSorted = visitorsWithProfiles.sort((a, b) => {
      if (a.is_current_user) return -1;
      if (b.is_current_user) return 1;
      return 0;
    });
    
    setLiveVisitors(finalSorted);
  }, [user?.id]);

  // Poll for live visitors
  useEffect(() => {
    if (chatOnline) {
      fetchLiveVisitors();
      const interval = setInterval(fetchLiveVisitors, 30000);
      return () => clearInterval(interval);
    }
  }, [chatOnline, fetchLiveVisitors]);

  // Subscribe to chat changes
  useEffect(() => {
    if (chatOnline) {
      fetchSidebarChats();
    }

    const convChannel = supabase
      .channel('sidebar-conversations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_conversations' },
        () => {
          if (chatOnline) {
            playNotificationSound();
            fetchSidebarChats();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_conversations' },
        () => {
          if (chatOnline) fetchSidebarChats();
        }
      )
      .subscribe();

    return () => {
      convChannel.unsubscribe();
    };
  }, [chatOnline, fetchSidebarChats, playNotificationSound]);

  // Track new chats for notification
  useEffect(() => {
    if (sidebarChats.length > prevChatCount && prevChatCount > 0) {
      playNotificationSound();
      setHasNewMessage(true);
      setTimeout(() => setHasNewMessage(false), 1500);
    }
    setPrevChatCount(sidebarChats.length);
  }, [sidebarChats.length, prevChatCount, playNotificationSound]);

  return {
    chatOnline,
    setChatOnline,
    operatorStatus,
    setOperatorStatus,
    hasNewMessage,
    chatPanelOpen,
    setChatPanelOpen,
    selectedChatId,
    setSelectedChatId,
    sidebarChats,
    chatProfileAvatars,
    liveVisitors,
    fetchSidebarChats,
    fetchLiveVisitors,
  };
};

export default useVIChat;
