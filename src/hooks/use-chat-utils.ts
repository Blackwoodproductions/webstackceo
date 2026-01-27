import { useCallback, useRef } from 'react';

/**
 * Shared chat utilities hook
 * Provides audio notifications, time formatting, and color generation
 */
export const useChatUtils = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      // Reuse audio context if possible, create new one if needed
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
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
      playTone(880, now, 0.15); // A5
      playTone(1174.66, now + 0.15, 0.2); // D6
    } catch (e) {
      console.warn('Could not play notification sound:', e);
    }
  }, []);

  const formatTime = useCallback((timestamp: string): string => {
    try {
      const d = new Date(timestamp);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }, []);

  const getTimeSince = useCallback((timestamp: string): string => {
    const mins = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h`;
  }, []);

  const getVisitorColor = useCallback((id: string): string => {
    const colors = [
      'from-emerald-400 to-teal-500',
      'from-violet-400 to-purple-500',
      'from-amber-400 to-orange-500',
      'from-rose-400 to-pink-500',
      'from-sky-400 to-blue-500',
      'from-lime-400 to-green-500',
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  return {
    playNotificationSound,
    formatTime,
    getTimeSince,
    getVisitorColor,
  };
};

/**
 * Extract domain from referrer URL
 */
export const getReferrerDomain = (referrer: string | null): string | null => {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch {
    return null;
  }
};

/**
 * Get favicon URL for a domain using Google's favicon service
 */
export const getFaviconUrl = (domain: string | null): string | null => {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
};
