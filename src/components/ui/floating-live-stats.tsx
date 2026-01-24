import { memo, useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Users, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EXCLUDED_ROUTES = ['/admin', '/auth', '/marketing-dashboard'];

const FloatingLiveStats = memo(() => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [newToday, setNewToday] = useState(0);
  const [topPosition, setTopPosition] = useState('22%');
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if current route should show stats
  const shouldShow = !EXCLUDED_ROUTES.some(route => location.pathname.startsWith(route));

  // Delay render to not block initial page paint
  useEffect(() => {
    if (!shouldShow) return;
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [shouldShow]);

  // Position relative to AI shield - always stay above it
  useEffect(() => {
    if (!shouldShow || !isVisible) return;

    const handlePosition = () => {
      const container = containerRef.current;
      const aiShield = document.querySelector('[data-floating-ai-shield]');
      
      if (!container) return;

      const containerHeight = container.offsetHeight || 90;
      const gap = 24; // Gap between stats and AI shield
      const minTop = 70; // Minimum distance from top of viewport
      
      if (aiShield) {
        const shieldRect = aiShield.getBoundingClientRect();
        // Stats should end (bottom edge) above where AI shield starts (top edge)
        const statsBottomLimit = shieldRect.top - gap;
        const requiredStatsTop = statsBottomLimit - containerHeight;
        
        // Clamp to minimum
        const finalTop = Math.max(minTop, requiredStatsTop);
        setTopPosition(`${finalTop}px`);
      } else {
        // No AI shield found, use default
        setTopPosition('22%');
      }
    };

    window.addEventListener('scroll', handlePosition, { passive: true });
    window.addEventListener('resize', handlePosition, { passive: true });
    
    // Run frequently to stay synchronized
    const interval = setInterval(handlePosition, 100);
    setTimeout(handlePosition, 300);
    
    return () => {
      window.removeEventListener('scroll', handlePosition);
      window.removeEventListener('resize', handlePosition);
      clearInterval(interval);
    };
  }, [shouldShow, isVisible]);

  // Fetch live stats
  useEffect(() => {
    if (!shouldShow) return;

    const fetchStats = async () => {
      const now = new Date();
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      try {
        const [activeRes, todayRes] = await Promise.all([
          supabase
            .from('visitor_sessions')
            .select('id', { count: 'exact', head: true })
            .gte('last_activity_at', fiveMinAgo.toISOString()),
          supabase
            .from('visitor_sessions')
            .select('id', { count: 'exact', head: true })
            .gte('started_at', startOfDay.toISOString()),
        ]);

        setLiveCount(activeRes.count || 0);
        setNewToday(todayRes.count || 0);
      } catch (error) {
        console.error('Failed to fetch live stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);

    const channel = supabase
      .channel('homepage-live-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_sessions' }, fetchStats)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [shouldShow]);

  if (!shouldShow || !isVisible) return null;

  return (
    <div 
      ref={containerRef}
      data-floating-live-stats
      className="fixed left-6 hidden lg:flex flex-col gap-2 z-50 animate-fade-in"
      style={{ top: topPosition }}
    >
      {/* Live Now */}
      <div className="glass-card rounded-lg px-3 py-2 flex items-center gap-2.5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
        <div className="relative">
          <Users className="w-4 h-4 text-green-500" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Live</span>
          <span className="text-base font-bold text-foreground">{liveCount}</span>
        </div>
      </div>

      {/* New Today */}
      <div className="glass-card rounded-lg px-3 py-2 flex items-center gap-2.5 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
        <UserPlus className="w-4 h-4 text-cyan-500" />
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Today</span>
          <span className="text-base font-bold text-foreground">{newToday}</span>
        </div>
      </div>
    </div>
  );
});

FloatingLiveStats.displayName = "FloatingLiveStats";

export default FloatingLiveStats;
