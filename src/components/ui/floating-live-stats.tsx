import { memo, useState, useEffect } from "react";
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

  // Check if current route should show stats
  const shouldShow = !EXCLUDED_ROUTES.some(route => location.pathname.startsWith(route));

  // Delay render to not block initial page paint
  useEffect(() => {
    if (!shouldShow) return;
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [shouldShow]);

  // Handle scroll to stop above AI shield and footer
  useEffect(() => {
    if (!shouldShow) return;

    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (!footer) return;

      const footerRect = footer.getBoundingClientRect();
      const elementHeight = 90; // Approximate height of both stat boxes
      const aiShieldBuffer = 180; // Space to stay above AI shield (which is at ~72%)
      const footerBuffer = 40;
      
      const defaultTop = window.innerHeight * 0.22;
      // Max position is the lesser of: above footer OR above AI shield area
      const maxTopFromFooter = footerRect.top - elementHeight - footerBuffer - aiShieldBuffer;
      const maxTopFromShield = window.innerHeight * 0.47 - elementHeight; // Stop before section indicator
      
      const maxTop = Math.min(maxTopFromFooter, maxTopFromShield);
      
      if (defaultTop > maxTop && maxTop > 0) {
        setTopPosition(`${Math.max(maxTop, 50)}px`);
      } else {
        setTopPosition('22%');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [shouldShow]);

  // Fetch live stats - same logic as marketing dashboard
  useEffect(() => {
    if (!shouldShow) return;

    const fetchStats = async () => {
      const now = new Date();
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      try {
        // Parallel fetch matching marketing dashboard logic
        const [activeRes, todayRes] = await Promise.all([
          // Active visitors (last 5 min based on last_activity_at)
          supabase
            .from('visitor_sessions')
            .select('id', { count: 'exact', head: true })
            .gte('last_activity_at', fiveMinAgo.toISOString()),
          // New visitors today (based on started_at)
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
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s

    // Subscribe to realtime updates
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
      className="fixed left-6 hidden lg:flex flex-col gap-2 z-40 animate-fade-in transition-[top] duration-200"
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
