import { memo, useState, useEffect } from "react";
import { Users, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FloatingLiveStats = memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [newToday, setNewToday] = useState(0);
  const [topPosition, setTopPosition] = useState('45%');

  // Delay render to not block initial page paint
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch live stats
  useEffect(() => {
    const fetchStats = async () => {
      const now = new Date();
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      try {
        // Get active sessions (last 5 minutes)
        const { count: activeCount } = await supabase
          .from('visitor_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('last_activity_at', fiveMinAgo.toISOString());

        // Get new sessions today
        const { count: todayCount } = await supabase
          .from('visitor_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('started_at', startOfDay.toISOString());

        setLiveCount(activeCount || 0);
        setNewToday(todayCount || 0);
      } catch (error) {
        console.error('Failed to fetch live stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s

    // Subscribe to realtime updates
    const channel = supabase
      .channel('live-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_sessions' }, fetchStats)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle scroll to stop above footer (similar to AI shield)
  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (!footer) return;

      const footerRect = footer.getBoundingClientRect();
      const elementHeight = 100;
      const buffer = 40;
      const defaultTop = window.innerHeight * 0.45;
      const maxTop = footerRect.top - elementHeight - buffer;

      if (defaultTop > maxTop) {
        setTopPosition(`${maxTop}px`);
      } else {
        setTopPosition('45%');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed left-20 hidden lg:flex flex-col gap-3 z-40 animate-fade-in"
      style={{ top: topPosition }}
    >
      {/* Live Now */}
      <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
        <div className="relative">
          <Users className="w-5 h-5 text-green-500" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">Live Now</span>
          <span className="text-lg font-bold text-foreground">{liveCount}</span>
        </div>
      </div>

      {/* New Today */}
      <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
        <UserPlus className="w-5 h-5 text-blue-500" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">New Today</span>
          <span className="text-lg font-bold text-foreground">{newToday}</span>
        </div>
      </div>
    </div>
  );
});

FloatingLiveStats.displayName = "FloatingLiveStats";

export default FloatingLiveStats;
