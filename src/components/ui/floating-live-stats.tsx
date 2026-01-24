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

  // Handle scroll to stop above AI shield
  useEffect(() => {
    if (!shouldShow || !isVisible) return;

    const handleScroll = () => {
      const container = containerRef.current;
      const aiShield = document.querySelector('[data-floating-ai-shield]');
      
      if (!container) return;

      const containerHeight = container.offsetHeight || 90;
      const defaultTopPercent = 0.22;
      const defaultTop = window.innerHeight * defaultTopPercent;
      const buffer = 24; // Gap between stats and AI shield
      
      // Get AI shield's current top position
      let aiShieldTop: number;
      if (aiShield) {
        const rect = aiShield.getBoundingClientRect();
        aiShieldTop = rect.top;
      } else {
        // Fallback: AI shield is at 72% when no scroll constraint
        aiShieldTop = window.innerHeight * 0.72;
      }

      // Calculate max position (must stay above AI shield)
      const maxTop = aiShieldTop - containerHeight - buffer;
      
      // Clamp between minimum (50px from top) and maxTop
      const minTop = 80;
      
      if (maxTop < minTop) {
        // Not enough space - hide or keep at min
        setTopPosition(`${minTop}px`);
      } else if (defaultTop > maxTop) {
        // Would overlap AI shield, cap it
        setTopPosition(`${maxTop}px`);
      } else {
        // Normal position
        setTopPosition('22%');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    // Run after a small delay to ensure AI shield is rendered
    const timer = setTimeout(handleScroll, 300);
    const timer2 = setInterval(handleScroll, 500); // Keep checking
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(timer);
      clearInterval(timer2);
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
