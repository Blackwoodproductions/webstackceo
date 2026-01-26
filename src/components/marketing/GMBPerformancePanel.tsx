import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Eye, MousePointer, Phone, Navigation, MessageCircle, 
  Calendar, TrendingUp, RefreshCw, AlertTriangle, BarChart3,
  Map, Search, Radio
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PerformanceMetrics {
  searchViews: number;
  mapViews: number;
  websiteClicks: number;
  phoneClicks: number;
  directionRequests: number;
  messagingClicks: number;
  bookings: number;
  foodOrders: number;
  dailyBreakdown: Array<{
    date: string;
    searchViews: number;
    mapViews: number;
    websiteClicks: number;
    phoneClicks: number;
    directionRequests: number;
  }>;
}

interface GMBPerformancePanelProps {
  accessToken: string;
  locationName: string;
  locationTitle: string;
}

export const GMBPerformancePanel = ({
  accessToken,
  locationName,
  locationTitle,
}: GMBPerformancePanelProps) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<{ startDate: string; endDate: string } | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const fetchPerformance = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('gmb-performance', {
        body: { accessToken, locationName },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        if (data.isNotEnabled) {
          setError('Business Profile Performance API is not enabled in your Google Cloud project. Enable it at console.cloud.google.com');
        } else if (data.isQuotaError) {
          setError('Quota exceeded. Please wait and try again.');
        } else {
          setError(data.error);
        }
        return;
      }

      setMetrics(data.metrics);
      setPeriod(data.period);
      setFromCache(data.fromCache || false);
    } catch (err) {
      console.error('[GMBPerformance] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && locationName) {
      fetchPerformance();
    }
  }, [accessToken, locationName]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="relative border-border bg-gradient-to-br from-card via-card to-blue-500/5 overflow-hidden">
          {/* Animated gradient glow */}
          <motion.div
            className="absolute -inset-[1px] rounded-lg opacity-40 blur-sm"
            animate={{
              background: [
                "linear-gradient(0deg, rgba(59,130,246,0.3), rgba(16,185,129,0.2))",
                "linear-gradient(180deg, rgba(16,185,129,0.3), rgba(59,130,246,0.2))",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Scanning line */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          <CardContent className="py-12 relative z-10">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <motion.div 
                  className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-sm font-medium text-foreground">Loading performance insights...</p>
              <p className="text-xs text-muted-foreground">Fetching data from Google</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="relative border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <CardContent className="py-8 relative z-10">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </motion.div>
              <p className="text-sm text-muted-foreground max-w-md">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchPerformance} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!metrics) {
    return null;
  }

  const totalViews = metrics.searchViews + metrics.mapViews;
  const totalActions = metrics.websiteClicks + metrics.phoneClicks + metrics.directionRequests;

  const metricCards = [
    { icon: Search, label: 'Search Views', value: metrics.searchViews, color: 'blue', gradient: 'from-blue-500/20 to-cyan-500/10' },
    { icon: Map, label: 'Map Views', value: metrics.mapViews, color: 'green', gradient: 'from-green-500/20 to-emerald-500/10' },
    { icon: MousePointer, label: 'Website Clicks', value: metrics.websiteClicks, color: 'purple', gradient: 'from-purple-500/20 to-violet-500/10' },
    { icon: Phone, label: 'Phone Calls', value: metrics.phoneClicks, color: 'amber', gradient: 'from-amber-500/20 to-orange-500/10' },
    { icon: Navigation, label: 'Directions', value: metrics.directionRequests, color: 'cyan', gradient: 'from-cyan-500/20 to-blue-500/10' },
    { icon: MessageCircle, label: 'Messages', value: metrics.messagingClicks, color: 'pink', gradient: 'from-pink-500/20 to-rose-500/10' },
  ];

  // Prepare chart data
  const chartData = metrics.dailyBreakdown.slice(-14).map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: day.searchViews + day.mapViews,
    clicks: day.websiteClicks,
    calls: day.phoneClicks,
    directions: day.directionRequests,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-green-500/10"
            whileHover={{ scale: 1.05 }}
          >
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Performance Insights</h3>
              <motion.span
                className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Radio className="w-2 h-2" />
                LIVE
              </motion.span>
            </div>
            <p className="text-sm text-muted-foreground">
              {locationTitle}
              {period && <span className="ml-2">• {period.startDate} to {period.endDate}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {fromCache && (
            <Badge variant="outline" className="text-xs bg-muted/50">Cached</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={fetchPerformance}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Eye, label: 'Total Views', value: totalViews, gradient: 'from-blue-500 to-green-500', bg: 'from-blue-500/15 to-green-500/10' },
          { icon: TrendingUp, label: 'Total Actions', value: totalActions, gradient: 'from-purple-500 to-pink-500', bg: 'from-purple-500/15 to-pink-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`relative border-border bg-gradient-to-br ${stat.bg} overflow-hidden group`}>
              {/* Shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <CardContent className="pt-4 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <stat.icon className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <motion.p 
                      className="text-2xl font-bold"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                    >
                      {stat.value.toLocaleString()}
                    </motion.p>
                    <p className="text-xs text-muted-foreground">{stat.label} (30 days)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metricCards.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className={`relative border-border bg-gradient-to-br ${metric.gradient} overflow-hidden group`}>
              {/* Shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
              />
              <CardContent className="pt-4 pb-4 text-center relative z-10">
                <div className={`w-8 h-8 rounded-lg bg-${metric.color}-500/20 flex items-center justify-center mx-auto mb-2`}>
                  <metric.icon className={`w-4 h-4 text-${metric.color}-500`} />
                </div>
                <motion.p 
                  className="text-lg font-bold"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.05, type: "spring" }}
                >
                  {metric.value.toLocaleString()}
                </motion.p>
                <p className="text-[10px] text-muted-foreground">{metric.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative border-border overflow-hidden">
            {/* Grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
              }}
            />
            
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Last 14 Days Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="viewsGradientGMB" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="clicksGradientGMB" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '12px',
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#viewsGradientGMB)"
                      name="Views"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="#a855f7" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#clicksGradientGMB)"
                      name="Website Clicks"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};
