import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users, LogOut, RefreshCw, BarChart3, Sun, Moon, Bell, FlaskConical
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type DashboardTab = 
  | 'visitor-intelligence' 
  | 'bron' 
  | 'cade' 
  | 'gmb' 
  | 'social-signals' 
  | 'on-page-seo' 
  | 'landing-pages';

interface VIDashboardHeaderProps {
  user: User | null;
  isAdmin: boolean;
  activeVisitors: number;
  newVisitorsToday: number;
  refreshing: boolean;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  onRefresh: () => void;
  onFormTestOpen: () => void;
  currentUserProfile: { avatar_url: string | null; full_name: string | null } | null;
}

export const VIDashboardHeader = memo(function VIDashboardHeader({
  user,
  isAdmin,
  activeVisitors,
  newVisitorsToday,
  refreshing,
  theme,
  setTheme,
  onRefresh,
  onFormTestOpen,
  currentUserProfile,
}: VIDashboardHeaderProps) {
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/');
  }, [navigate]);

  return (
    <div 
      className="relative z-10 px-8 py-3 flex items-center justify-between"
      style={{ contain: 'layout style' }}
    >
      {/* Left: Logo */}
      <Link to="/" className="flex items-center gap-3 group">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-primary to-violet-500 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-primary to-violet-500 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="hidden sm:block">
          <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-primary to-violet-400 bg-clip-text text-transparent">
            Webstack
          </span>
          <span className="text-[10px] text-muted-foreground block -mt-0.5">.ceo</span>
        </div>
      </Link>

      {/* Right: Stats & Actions */}
      <div className="flex items-center gap-3">
        {/* Live Stats Pill */}
        <div className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-full bg-background/50 border border-border/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs">
            <div 
              className="w-2 h-2 rounded-full bg-emerald-400"
              style={{ 
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
            <span className="text-muted-foreground">Live:</span>
            <span className="font-semibold text-emerald-400">{activeVisitors}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Today:</span>
            <span className="font-semibold text-foreground">{newVisitorsToday}</span>
          </div>
        </div>

        {/* Actions */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onRefresh}
          disabled={refreshing}
          className="h-8 w-8"
          title="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onFormTestOpen}
          className="h-8 w-8"
          title="Form Testing"
        >
          <FlaskConical className="w-4 h-4 text-amber-500" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative w-9 h-9 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:ring-2 hover:ring-primary/30">
              {currentUserProfile?.avatar_url ? (
                <img 
                  src={currentUserProfile.avatar_url} 
                  alt={currentUserProfile.full_name || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {(currentUserProfile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{currentUserProfile?.full_name || user?.email}</p>
              {isAdmin && (
                <Badge variant="secondary" className="mt-1 text-[10px]">Admin</Badge>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Admin Panel
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

export default VIDashboardHeader;
