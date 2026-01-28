import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { TrendingUp, TrendingDown, Minus, Calendar, BarChart3, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface HistoryDataPoint {
  snapshot_at: string;
  google_position: number | null;
  bing_position: number | null;
  yahoo_position: number | null;
  search_volume: number | null;
  cpc: number | null;
  competition_level: string | null;
}

interface KeywordHistoryChartProps {
  domain: string;
  keyword: string;
  currentGooglePosition?: number | null;
  currentBingPosition?: number | null;
  currentYahooPosition?: number | null;
}

export function KeywordHistoryChart({
  domain,
  keyword,
  currentGooglePosition,
  currentBingPosition,
  currentYahooPosition
}: KeywordHistoryChartProps) {
  const [history, setHistory] = useState<HistoryDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!domain || !keyword) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase.functions.invoke('keyword-history-snapshot', {
          body: { action: 'getHistory', domain, keyword }
        });

        if (error) throw error;
        
        if (data?.history) {
          setHistory(data.history);
        }
      } catch (err) {
        console.error('Failed to fetch keyword history:', err);
        setError('Unable to load history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [domain, keyword]);

  // Format chart data with dates
  const chartData = history.map((point, index) => ({
    name: new Date(point.snapshot_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    week: `Week ${index + 1}`,
    Google: point.google_position ? (101 - point.google_position) : null, // Invert for chart (higher = better)
    Bing: point.bing_position ? (101 - point.bing_position) : null,
    Yahoo: point.yahoo_position ? (101 - point.yahoo_position) : null,
    googleActual: point.google_position,
    bingActual: point.bing_position,
    yahooActual: point.yahoo_position,
  }));

  // Calculate trend (compare latest to earliest)
  const getTrend = () => {
    if (history.length < 2) return null;
    
    const oldest = history[0]?.google_position;
    const newest = history[history.length - 1]?.google_position;
    
    if (!oldest || !newest) return null;
    
    const change = oldest - newest; // Positive = improved (lower rank = better)
    return { change, improved: change > 0 };
  };

  const trend = getTrend();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading history...
      </div>
    );
  }

  if (error || history.length === 0) {
    return (
      <div className="py-6 text-center">
        <BarChart3 className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          {error || 'No historical data yet'}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Rankings are recorded weekly
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trend Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {history.length} week{history.length !== 1 ? 's' : ''} of data
          </span>
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
            trend.improved 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
              : trend.change < 0
                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                : 'bg-muted text-muted-foreground border border-border'
          }`}>
            {trend.improved ? (
              <TrendingUp className="w-4 h-4" />
            ) : trend.change < 0 ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
            <span>
              {trend.improved ? '+' : ''}{trend.change} positions
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              domain={[0, 100]}
              tickFormatter={(v) => v === 100 ? '#1' : v === 0 ? '100+' : ''}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number, name: string, props: { payload: { googleActual?: number; bingActual?: number; yahooActual?: number } }) => {
                // Show actual position
                const actualKey = `${name.toLowerCase()}Actual` as 'googleActual' | 'bingActual' | 'yahooActual';
                const actual = props?.payload?.[actualKey];
                return [`#${actual || '—'}`, name];
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px' }}
              iconType="circle"
              iconSize={8}
            />
            <Line 
              type="monotone" 
              dataKey="Google" 
              stroke="#22c55e" 
              strokeWidth={2}
              dot={{ fill: '#22c55e', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, stroke: '#22c55e', strokeWidth: 2 }}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="Bing" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="Yahoo" 
              stroke="#a855f7" 
              strokeWidth={2}
              dot={{ fill: '#a855f7', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, stroke: '#a855f7', strokeWidth: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Current vs First Recorded */}
      {history.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-muted-foreground mb-0.5">First Recorded</div>
            <div className="font-bold text-foreground">
              #{history[0]?.google_position || '—'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-muted-foreground mb-0.5">Best Position</div>
            <div className="font-bold text-emerald-400">
              #{Math.min(...history.filter(h => h.google_position).map(h => h.google_position!))}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-muted-foreground mb-0.5">Current</div>
            <div className="font-bold text-foreground">
              #{currentGooglePosition || history[history.length - 1]?.google_position || '—'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
