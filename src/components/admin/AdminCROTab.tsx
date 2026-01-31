import { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import {
  ToggleLeft, ToggleRight, RefreshCw, TrendingUp, MousePointer,
  Gift, Bell, Clock, Zap, Users, Eye, Target, ArrowUpRight,
  Percent, Timer, DollarSign, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays, subHours } from 'date-fns';

interface CROSetting {
  id: string;
  key: string;
  enabled: boolean;
  config: Record<string, any>;
  updated_at: string;
}

interface CROStats {
  component: string;
  views: number;
  clicks: number;
  dismissals: number;
  conversions: number;
  ctr: number;
}

const CRO_COMPONENTS = [
  { 
    key: 'exit_intent_popup', 
    name: 'Exit Intent Popup', 
    icon: Gift,
    description: 'Captures leaving visitors with discount offers',
    color: 'from-violet-500 to-purple-600'
  },
  { 
    key: 'social_proof_toast', 
    name: 'Social Proof Toast', 
    icon: Bell,
    description: 'Shows recent signups and purchases',
    color: 'from-emerald-500 to-green-600'
  },
  { 
    key: 'urgency_banner', 
    name: 'Urgency Banner', 
    icon: Clock,
    description: 'Countdown timer and limited spots',
    color: 'from-amber-500 to-orange-600'
  },
  { 
    key: 'sticky_bottom_cta', 
    name: 'Sticky Bottom CTA', 
    icon: Zap,
    description: 'Persistent call-to-action bar',
    color: 'from-cyan-500 to-blue-600'
  },
];

export const AdminCROTab = memo(function AdminCROTab() {
  const [settings, setSettings] = useState<CROSetting[]>([]);
  const [stats, setStats] = useState<CROStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('cro_settings')
      .select('*');
    
    if (!error && data) {
      setSettings(data.map(s => ({
        ...s,
        config: typeof s.config === 'object' ? s.config : {}
      })) as CROSetting[]);
    }
  }, []);

  // Fetch interaction stats
  const fetchStats = useCallback(async () => {
    let startDate: Date;
    switch (timeRange) {
      case '24h': startDate = subHours(new Date(), 24); break;
      case '7d': startDate = subDays(new Date(), 7); break;
      case '30d': startDate = subDays(new Date(), 30); break;
    }

    const { data, error } = await supabase
      .from('cro_interactions')
      .select('component, action')
      .gte('created_at', startDate.toISOString());

    if (!error && data) {
      // Aggregate stats by component
      const statsMap: Record<string, CROStats> = {};
      
      CRO_COMPONENTS.forEach(c => {
        statsMap[c.key] = {
          component: c.key,
          views: 0,
          clicks: 0,
          dismissals: 0,
          conversions: 0,
          ctr: 0
        };
      });

      data.forEach((row: { component: string; action: string }) => {
        if (!statsMap[row.component]) return;
        switch (row.action) {
          case 'view': statsMap[row.component].views++; break;
          case 'click': statsMap[row.component].clicks++; break;
          case 'dismiss': statsMap[row.component].dismissals++; break;
          case 'convert': statsMap[row.component].conversions++; break;
        }
      });

      // Calculate CTR
      Object.values(statsMap).forEach(s => {
        s.ctr = s.views > 0 ? Math.round((s.clicks / s.views) * 100) : 0;
      });

      setStats(Object.values(statsMap));
    }
  }, [timeRange]);

  // Initial fetch
  useEffect(() => {
    Promise.all([fetchSettings(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchSettings, fetchStats]);

  // Refetch stats when time range changes
  useEffect(() => {
    fetchStats();
  }, [timeRange, fetchStats]);

  // Real-time subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('cro_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cro_interactions' },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStats]);

  // Toggle component enabled/disabled
  const handleToggle = async (key: string, enabled: boolean) => {
    setSaving(key);
    
    const { error } = await supabase
      .from('cro_settings')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) {
      toast.error('Failed to update setting');
    } else {
      setSettings(prev => prev.map(s => s.key === key ? { ...s, enabled } : s));
      toast.success(`${enabled ? 'Enabled' : 'Disabled'} ${key.replace(/_/g, ' ')}`);
    }
    
    setSaving(null);
  };

  // Update config value
  const handleConfigChange = async (key: string, configKey: string, value: any) => {
    const setting = settings.find(s => s.key === key);
    if (!setting) return;

    const newConfig = { ...setting.config, [configKey]: value };
    
    const { error } = await supabase
      .from('cro_settings')
      .update({ config: newConfig, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (!error) {
      setSettings(prev => prev.map(s => 
        s.key === key ? { ...s, config: newConfig } : s
      ));
    }
  };

  const getSetting = (key: string) => settings.find(s => s.key === key);
  const getStats = (key: string) => stats.find(s => s.component === key);

  // Calculate totals
  const totalViews = stats.reduce((sum, s) => sum + s.views, 0);
  const totalClicks = stats.reduce((sum, s) => sum + s.clicks, 0);
  const totalConversions = stats.reduce((sum, s) => sum + s.conversions, 0);
  const avgCtr = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            CRO Campaign Controls
          </h2>
          <p className="text-sm text-muted-foreground">
            Toggle components on/off and view real-time performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['24h', '7d', '30d'] as const).map(range => (
            <Button
              key={range}
              size="sm"
              variant={timeRange === range ? 'default' : 'outline'}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => { fetchSettings(); fetchStats(); }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-cyan-500/10 border-primary/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <MousePointer className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-violet-500" />
              <div>
                <p className="text-2xl font-bold">{totalConversions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <Percent className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{avgCtr}%</p>
                <p className="text-xs text-muted-foreground">Avg CTR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Component Controls */}
      <div className="grid md:grid-cols-2 gap-4">
        {CRO_COMPONENTS.map((component, idx) => {
          const setting = getSetting(component.key);
          const componentStats = getStats(component.key);
          const Icon = component.icon;
          const isEnabled = setting?.enabled ?? true;

          return (
            <motion.div
              key={component.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={`relative overflow-hidden transition-all ${
                isEnabled ? 'border-primary/30' : 'border-border/50 opacity-60'
              }`}>
                {/* Gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${component.color}`} />
                
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${component.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{component.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{component.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {saving === component.key ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleToggle(component.key, checked)}
                        />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-2 py-3 border-y border-border/50 my-3">
                    <div className="text-center">
                      <p className="text-lg font-bold">{componentStats?.views || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{componentStats?.clicks || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-500">{componentStats?.conversions || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Converts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-500">{componentStats?.ctr || 0}%</p>
                      <p className="text-[10px] text-muted-foreground">CTR</p>
                    </div>
                  </div>

                  {/* Config options */}
                  {component.key === 'exit_intent_popup' && setting && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Discount %</Label>
                        <Input
                          type="number"
                          className="w-20 h-7 text-xs"
                          value={setting.config?.discount || 25}
                          onChange={(e) => handleConfigChange(component.key, 'discount', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  {component.key === 'urgency_banner' && setting && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Discount %</Label>
                        <Input
                          type="number"
                          className="w-20 h-7 text-xs"
                          value={setting.config?.discount || 30}
                          onChange={(e) => handleConfigChange(component.key, 'discount', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Show Countdown</Label>
                        <Switch
                          checked={setting.config?.show_countdown !== false}
                          onCheckedChange={(v) => handleConfigChange(component.key, 'show_countdown', v)}
                        />
                      </div>
                    </div>
                  )}

                  {component.key === 'social_proof_toast' && setting && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Interval (sec)</Label>
                        <Input
                          type="number"
                          className="w-20 h-7 text-xs"
                          value={Math.round((setting.config?.interval_ms || 45000) / 1000)}
                          onChange={(e) => handleConfigChange(component.key, 'interval_ms', parseInt(e.target.value) * 1000)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Last updated */}
                  {setting?.updated_at && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Updated {format(new Date(setting.updated_at), 'MMM d, h:mm a')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Live indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
        <span>Live updates enabled • Stats refresh automatically</span>
      </div>
    </div>
  );
});

export default AdminCROTab;