import { memo, useState, useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Users, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EXCLUDED_ROUTES = ['/admin', '/auth', '/visitor-intelligence-dashboard'];

const FloatingLiveStats = memo(() => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isEmbedMode = searchParams.get('embed') === 'true';
  const [isVisible, setIsVisible] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [newToday, setNewToday] = useState(0);
  const [topPosition, setTopPosition] = useState('22%');
  const [opacity, setOpacity] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if current route should show stats (hide in embed mode or excluded routes)
  const shouldShow = !isEmbedMode && !EXCLUDED_ROUTES.some(route => location.pathname.startsWith(route));

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
      const footer = document.querySelector('footer');
      
      if (!container) return;

      // Fade out when footer/newsletter enters view to avoid overlapping it
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const fadeStart = window.innerHeight * 0.7;
        const fadeEnd = window.innerHeight * 0.5;

        if (footerRect.top < fadeStart) {
          const t = (footerRect.top - fadeEnd) / (fadeStart - fadeEnd);
          setOpacity(Math.max(0, Math.min(1, t)));
        } else {
          setOpacity(1);
        }
      }

      const containerHeight = container.offsetHeight || 90;
      const gap = 24; // Gap between stats and AI shield
      const defaultTop = window.innerHeight * 0.38; // Below section indicator at 15%
      const minTop = 200; // Below section indicator
      const footerBuffer = 24; // keep off footer/newsletter area

      // Compute max allowed top so the stats container doesn't overlap footer/newsletter
      let maxTop = Number.POSITIVE_INFINITY;
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        maxTop = footerRect.top - containerHeight - footerBuffer;
      }
      
      if (aiShield) {
        const shieldRect = aiShield.getBoundingClientRect();
        const shieldOpacity = parseFloat(window.getComputedStyle(aiShield).opacity) || 1;
        
        // If shield is visible, ensure we stay above it
        if (shieldOpacity >= 0.5) {
          const statsBottomLimit = shieldRect.top - gap;
          const requiredStatsTop = statsBottomLimit - containerHeight;
          maxTop = Math.min(maxTop, requiredStatsTop);
        }

        const finalTop = Math.max(minTop, Math.min(defaultTop, maxTop));
        setTopPosition(`${finalTop}px`);
      } else {
        const finalTop = Math.max(minTop, Math.min(defaultTop, maxTop));
        setTopPosition(`${finalTop}px`);
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
      className="fixed left-6 hidden lg:flex flex-col gap-2 z-50 animate-fade-in transition-opacity duration-300"
      style={{ top: topPosition, opacity, pointerEvents: opacity < 0.05 ? 'none' : 'auto' }}
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
