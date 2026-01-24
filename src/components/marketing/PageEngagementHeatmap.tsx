import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, Eye, MousePointer, Clock, TrendingUp, ArrowUpRight
} from 'lucide-react';

interface PageEngagement {
  page_path: string;
  views: number;
  toolInteractions: number;
  uniqueSessions: number;
  engagementScore: number;
}

const PageEngagementHeatmap = () => {
  const [pageData, setPageData] = useState<PageEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxScore, setMaxScore] = useState(1);

  useEffect(() => {
    const fetchEngagementData = async () => {
      try {
        // Fetch page views and tool interactions
        const [pageViewsRes, toolsRes] = await Promise.all([
          supabase.from('page_views').select('page_path, session_id'),
          supabase.from('tool_interactions').select('page_path, session_id'),
        ]);

        const pageViews = pageViewsRes.data || [];
        const toolInteractions = toolsRes.data || [];

        // Aggregate data by page
        const pageMap = new Map<string, { 
          views: number; 
          tools: number; 
          sessions: Set<string>;
        }>();

        pageViews.forEach(pv => {
          const path = pv.page_path || '/';
          if (!pageMap.has(path)) {
            pageMap.set(path, { views: 0, tools: 0, sessions: new Set() });
          }
          const data = pageMap.get(path)!;
          data.views++;
          data.sessions.add(pv.session_id);
        });

        toolInteractions.forEach(ti => {
          const path = ti.page_path || '/';
          if (!pageMap.has(path)) {
            pageMap.set(path, { views: 0, tools: 0, sessions: new Set() });
          }
          const data = pageMap.get(path)!;
          data.tools++;
          data.sessions.add(ti.session_id);
        });

        // Calculate engagement scores and convert to array
        const engagementData: PageEngagement[] = [];
        let max = 1;

        pageMap.forEach((data, path) => {
          // Engagement score = views + (tools * 3) + (unique sessions * 2)
          const score = data.views + (data.tools * 3) + (data.sessions.size * 2);
          max = Math.max(max, score);
          
          engagementData.push({
            page_path: path,
            views: data.views,
            toolInteractions: data.tools,
            uniqueSessions: data.sessions.size,
            engagementScore: score,
          });
        });

        // Sort by engagement score
        engagementData.sort((a, b) => b.engagementScore - a.engagementScore);

        setPageData(engagementData.slice(0, 20)); // Top 20 pages
        setMaxScore(max);
      } catch (error) {
        console.error('Error fetching engagement data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEngagementData();
  }, []);

  const getHeatColor = (score: number) => {
    const intensity = score / maxScore;
    if (intensity > 0.8) return 'from-red-500 to-orange-500';
    if (intensity > 0.6) return 'from-orange-500 to-amber-500';
    if (intensity > 0.4) return 'from-amber-500 to-yellow-500';
    if (intensity > 0.2) return 'from-yellow-500 to-lime-500';
    return 'from-lime-500 to-green-500';
  };

  const getHeatBgColor = (score: number) => {
    const intensity = score / maxScore;
    if (intensity > 0.8) return 'bg-red-500/20 border-red-500/30';
    if (intensity > 0.6) return 'bg-orange-500/20 border-orange-500/30';
    if (intensity > 0.4) return 'bg-amber-500/20 border-amber-500/30';
    if (intensity > 0.2) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-green-500/20 border-green-500/30';
  };

  const getHeatTextColor = (score: number) => {
    const intensity = score / maxScore;
    if (intensity > 0.8) return 'text-red-400';
    if (intensity > 0.6) return 'text-orange-400';
    if (intensity > 0.4) return 'text-amber-400';
    if (intensity > 0.2) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatPageName = (path: string) => {
    if (path === '/') return 'Homepage';
    return path
      .replace(/^\//, '')
      .replace(/-/g, ' ')
      .replace(/\//g, ' → ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="font-bold">Page Engagement Heatmap</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (pageData.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="font-bold">Page Engagement Heatmap</span>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Flame className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No page engagement data yet</p>
        </div>
      </Card>
    );
  }

  // Split data into grid and list views
  const gridData = pageData.slice(0, 8);
  const listData = pageData.slice(8, 20);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Page Engagement Heatmap</h3>
            <p className="text-xs text-muted-foreground">Top pages by views, tool usage & sessions</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-green-500 to-lime-500" />
            Low
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-yellow-500" />
            Medium
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-red-500 to-orange-500" />
            High
          </span>
        </div>
      </div>

      {/* Heatmap Grid - Top 8 pages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {gridData.map((page, index) => (
          <div
            key={page.page_path}
            className={`relative p-4 rounded-xl border ${getHeatBgColor(page.engagementScore)} transition-all duration-300 hover:scale-105 cursor-pointer group`}
          >
            {/* Rank badge */}
            <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br ${getHeatColor(page.engagementScore)} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
              {index + 1}
            </div>

            {/* Heat indicator bar */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getHeatColor(page.engagementScore)}`}
                style={{ width: `${(page.engagementScore / maxScore) * 100}%` }}
              />
            </div>

            <div className="mt-2">
              <p className="text-xs font-medium text-foreground truncate mb-2" title={page.page_path}>
                {formatPageName(page.page_path)}
              </p>
              
              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="p-1 rounded bg-background/50">
                  <Eye className="w-3 h-3 mx-auto text-blue-400 mb-0.5" />
                  <span className="text-xs font-bold">{page.views}</span>
                </div>
                <div className="p-1 rounded bg-background/50">
                  <MousePointer className="w-3 h-3 mx-auto text-violet-400 mb-0.5" />
                  <span className="text-xs font-bold">{page.toolInteractions}</span>
                </div>
                <div className="p-1 rounded bg-background/50">
                  <TrendingUp className="w-3 h-3 mx-auto text-green-400 mb-0.5" />
                  <span className="text-xs font-bold">{page.uniqueSessions}</span>
                </div>
              </div>

              <div className={`mt-2 text-center text-sm font-bold ${getHeatTextColor(page.engagementScore)}`}>
                {page.engagementScore} pts
              </div>
            </div>

            <ArrowUpRight className="absolute top-2 right-2 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {/* Extended List - Pages 9-20 */}
      {listData.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground mb-3">Other Active Pages</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {listData.map((page, index) => (
              <div
                key={page.page_path}
                className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getHeatColor(page.engagementScore)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" title={page.page_path}>
                    {formatPageName(page.page_path)}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5" />
                      {page.views}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MousePointer className="w-2.5 h-2.5" />
                      {page.toolInteractions}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${getHeatTextColor(page.engagementScore)}`}>
                  #{index + 9}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-blue-400" />
            Views
          </span>
          <span className="flex items-center gap-1">
            <MousePointer className="w-3 h-3 text-violet-400" />
            Tool Uses
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            Sessions
          </span>
        </div>
        <span>Score = Views + (Tools × 3) + (Sessions × 2)</span>
      </div>
    </Card>
  );
};

export default PageEngagementHeatmap;
