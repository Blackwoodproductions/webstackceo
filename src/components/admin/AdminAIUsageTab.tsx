import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, Clock, Users, TrendingUp, MessageSquare, 
  Zap, BarChart3, RefreshCw, Search, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

interface AIUsageStats {
  totalMinutesUsed: number;
  totalConversations: number;
  totalMessages: number;
  uniqueUsers: number;
  avgMinutesPerUser: number;
  topUsers: { email: string; minutes: number; conversations: number }[];
  dailyUsage: { date: string; minutes: number; users: number }[];
  tierBreakdown: { tier: string; users: number; minutes: number }[];
}

interface UsageRecord {
  id: string;
  user_id: string;
  minutes_used: number;
  week_start: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

export function AdminAIUsageTab() {
  const [stats, setStats] = useState<AIUsageStats>({
    totalMinutesUsed: 0,
    totalConversations: 0,
    totalMessages: 0,
    uniqueUsers: 0,
    avgMinutesPerUser: 0,
    topUsers: [],
    dailyUsage: [],
    tierBreakdown: [],
  });
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Fetch usage data
      const { data: usageData, error: usageError } = await supabase
        .from('ai_assistant_usage')
        .select('*')
        .order('minutes_used', { ascending: false });

      if (usageError) throw usageError;

      // Fetch conversations count
      const { count: convCount } = await supabase
        .from('ai_assistant_conversations')
        .select('id', { count: 'exact', head: true });

      // Fetch messages count
      const { count: msgCount } = await supabase
        .from('ai_assistant_messages')
        .select('id', { count: 'exact', head: true });

      // Enrich with user info
      const enrichedRecords = await Promise.all(
        (usageData || []).map(async (record) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('user_id', record.user_id)
            .single();
          
          return {
            ...record,
            user_email: profile?.email || 'Unknown',
            user_name: profile?.full_name || null,
          };
        })
      );

      setUsageRecords(enrichedRecords);

      // Calculate aggregate stats
      const totalMinutes = enrichedRecords.reduce((sum, r) => sum + (r.minutes_used || 0), 0);
      const uniqueUserIds = new Set(enrichedRecords.map(r => r.user_id));
      
      // Top users by usage
      const userTotals: Record<string, { email: string; minutes: number; conversations: number }> = {};
      enrichedRecords.forEach(r => {
        if (!userTotals[r.user_id]) {
          userTotals[r.user_id] = { email: r.user_email || 'Unknown', minutes: 0, conversations: 0 };
        }
        userTotals[r.user_id].minutes += r.minutes_used || 0;
      });

      // Get conversation counts per user
      const { data: convData } = await supabase
        .from('ai_assistant_conversations')
        .select('user_id');

      if (convData) {
        convData.forEach(c => {
          if (userTotals[c.user_id]) {
            userTotals[c.user_id].conversations++;
          }
        });
      }

      const topUsers = Object.values(userTotals)
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 10);

      // Daily usage for last 7 days
      const dailyMap: Record<string, { minutes: number; users: Set<string> }> = {};
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'MMM d');
        dailyMap[date] = { minutes: 0, users: new Set() };
      }

      enrichedRecords.forEach(r => {
        const date = format(new Date(r.updated_at), 'MMM d');
        if (dailyMap[date]) {
          dailyMap[date].minutes += r.minutes_used || 0;
          dailyMap[date].users.add(r.user_id);
        }
      });

      const dailyUsage = Object.entries(dailyMap).map(([date, data]) => ({
        date,
        minutes: data.minutes,
        users: data.users.size,
      }));

      setStats({
        totalMinutesUsed: totalMinutes,
        totalConversations: convCount || 0,
        totalMessages: msgCount || 0,
        uniqueUsers: uniqueUserIds.size,
        avgMinutesPerUser: uniqueUserIds.size > 0 ? Math.round(totalMinutes / uniqueUserIds.size) : 0,
        topUsers,
        dailyUsage,
        tierBreakdown: [], // Could be enhanced with tier info
      });
    } catch (error) {
      console.error('Error fetching AI usage stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const filteredRecords = useMemo(() => {
    return usageRecords.filter(r => {
      const matchesSearch = searchQuery === '' || 
        r.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [usageRecords, searchQuery]);

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{formatMinutes(stats.totalMinutesUsed)}</p>
                  <p className="text-sm text-muted-foreground">Total AI Usage</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.totalConversations.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Conversations</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-cyan-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.uniqueUsers.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-violet-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top AI Users
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Usage</TableHead>
                <TableHead className="text-right">Conversations</TableHead>
                <TableHead className="text-right">Week Start</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.slice(0, 20).map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{record.user_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{record.user_email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="font-mono">
                      {formatMinutes(record.minutes_used)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {stats.topUsers.find(u => u.email === record.user_email)?.conversations || '-'}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {format(new Date(record.week_start), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
              {filteredRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No AI usage data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Usage Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Daily Usage (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {stats.dailyUsage.map((day, i) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((day.minutes / (Math.max(...stats.dailyUsage.map(d => d.minutes)) || 1)) * 100, 5)}%` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t"
                />
                <span className="text-xs text-muted-foreground">{day.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminAIUsageTab;
