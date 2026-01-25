import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Eye, MousePointer, Phone, Navigation, MessageCircle, 
  Calendar, TrendingUp, RefreshCw, AlertTriangle, BarChart3,
  Map, Search
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
      <Card className="border-border bg-muted/20">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading performance insights...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchPerformance}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  const totalViews = metrics.searchViews + metrics.mapViews;
  const totalActions = metrics.websiteClicks + metrics.phoneClicks + metrics.directionRequests;

  const metricCards = [
    { 
      icon: Search, 
      label: 'Search Views', 
      value: metrics.searchViews.toLocaleString(),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      icon: Map, 
      label: 'Map Views', 
      value: metrics.mapViews.toLocaleString(),
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      icon: MousePointer, 
      label: 'Website Clicks', 
      value: metrics.websiteClicks.toLocaleString(),
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    { 
      icon: Phone, 
      label: 'Phone Calls', 
      value: metrics.phoneClicks.toLocaleString(),
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    { 
      icon: Navigation, 
      label: 'Directions', 
      value: metrics.directionRequests.toLocaleString(),
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10'
    },
    { 
      icon: MessageCircle, 
      label: 'Messages', 
      value: metrics.messagingClicks.toLocaleString(),
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10'
    },
  ];

  // Prepare chart data (last 14 days for readability)
  const chartData = metrics.dailyBreakdown.slice(-14).map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: day.searchViews + day.mapViews,
    clicks: day.websiteClicks,
    calls: day.phoneClicks,
    directions: day.directionRequests,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Performance Insights
          </h3>
          <p className="text-sm text-muted-foreground">
            {locationTitle}
            {period && (
              <span className="ml-2">
                • {period.startDate} to {period.endDate}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {fromCache && (
            <Badge variant="outline" className="text-xs">
              Cached
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={fetchPerformance}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border bg-gradient-to-br from-blue-500/10 to-green-500/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Views (30 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-to-br from-purple-500/10 to-pink-500/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalActions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Actions (30 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metricCards.map((metric) => (
          <Card key={metric.label} className="border-border">
            <CardContent className="pt-4 pb-4 text-center">
              <div className={`w-8 h-8 rounded-lg ${metric.bgColor} flex items-center justify-center mx-auto mb-2`}>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
              <p className="text-lg font-bold">{metric.value}</p>
              <p className="text-[10px] text-muted-foreground">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Last 14 Days Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#viewsGradient)"
                    name="Views"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="#a855f7" 
                    fillOpacity={1} 
                    fill="url(#clicksGradient)"
                    name="Website Clicks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
