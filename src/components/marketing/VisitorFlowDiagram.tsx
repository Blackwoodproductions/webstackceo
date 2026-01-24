import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { GitBranch, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PageNode {
  path: string;
  name: string;
  visits: number;
  depth: number;
  parent: string | null;
  isVisited: boolean;
}

type TimeRange = 'today' | 'week' | 'month' | 'all';

// Complete site structure based on the project's pages
const SITE_STRUCTURE: { path: string; parent: string | null }[] = [
  { path: '/', parent: null },
  // Main pages
  { path: '/about', parent: '/' },
  { path: '/features', parent: '/' },
  { path: '/pricing', parent: '/' },
  { path: '/contact', parent: '/' },
  { path: '/faq', parent: '/' },
  { path: '/learn', parent: '/' },
  { path: '/tools', parent: '/' },
  { path: '/directory', parent: '/' },
  { path: '/marketplace', parent: '/' },
  { path: '/careers', parent: '/' },
  { path: '/integrations', parent: '/' },
  // Feature pages
  { path: '/features/on-page-seo', parent: '/features' },
  { path: '/features/off-page-seo', parent: '/features' },
  { path: '/features/domain-authority', parent: '/features' },
  { path: '/features/advanced-analytics', parent: '/features' },
  { path: '/features/automated-blog', parent: '/features' },
  { path: '/features/faq-generation', parent: '/features' },
  { path: '/features/gmb-optimization', parent: '/features' },
  { path: '/features/ppc-landing-pages', parent: '/features' },
  { path: '/features/social-signals', parent: '/features' },
  { path: '/features/traffic-de-anonymization', parent: '/features' },
  { path: '/features/uptime-monitoring', parent: '/features' },
  { path: '/features/visitor-intelligence', parent: '/features' },
  { path: '/features/web-hosting', parent: '/features' },
  // Learn pages
  { path: '/learn/analytics-guide', parent: '/learn' },
  { path: '/learn/automated-blogging-guide', parent: '/learn' },
  { path: '/learn/cro-guide', parent: '/learn' },
  { path: '/learn/content-marketing-guide', parent: '/learn' },
  { path: '/learn/core-web-vitals-guide', parent: '/learn' },
  { path: '/learn/domain-authority-guide', parent: '/learn' },
  { path: '/learn/ecommerce-seo-guide', parent: '/learn' },
  { path: '/learn/faq-generation-guide', parent: '/learn' },
  { path: '/learn/gmb-optimization-guide', parent: '/learn' },
  { path: '/learn/keyword-research-guide', parent: '/learn' },
  { path: '/learn/link-building-guide', parent: '/learn' },
  { path: '/learn/local-seo-guide', parent: '/learn' },
  { path: '/learn/mobile-seo-guide', parent: '/learn' },
  { path: '/learn/off-page-seo-guide', parent: '/learn' },
  { path: '/learn/on-page-seo-guide', parent: '/learn' },
  { path: '/learn/ppc-landing-pages-guide', parent: '/learn' },
  { path: '/learn/social-signals-guide', parent: '/learn' },
  { path: '/learn/technical-seo-guide', parent: '/learn' },
  { path: '/learn/traffic-deanonymization-guide', parent: '/learn' },
  { path: '/learn/uptime-monitoring-guide', parent: '/learn' },
  { path: '/learn/visitor-intelligence-guide', parent: '/learn' },
  { path: '/learn/web-hosting-guide', parent: '/learn' },
  { path: '/learn/glossary', parent: '/learn' },
  // Legal pages
  { path: '/privacy-policy', parent: '/' },
  { path: '/terms', parent: '/' },
  { path: '/cookies', parent: '/' },
  { path: '/security', parent: '/' },
  { path: '/sitemap', parent: '/' },
  // Auth/Admin
  { path: '/auth', parent: '/' },
  { path: '/admin', parent: '/' },
  { path: '/website-audits', parent: '/' },
  { path: '/audit-results', parent: '/website-audits' },
  { path: '/changelog', parent: '/' },
];

const formatPageName = (path: string): string => {
  if (path === '/') return 'Home';
  const segments = path.split('/').filter(Boolean);
  const name = segments[segments.length - 1] || path;
  return name
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .slice(0, 16);
};

const getTimeRangeFilter = (range: TimeRange): Date | null => {
  const now = new Date();
  switch (range) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo;
    case 'month':
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo;
    case 'all':
      return null;
  }
};

const VisitorFlowDiagram = () => {
  const [pageViews, setPageViews] = useState<{ page_path: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await supabase
          .from('page_views')
          .select('page_path, created_at')
          .order('created_at', { ascending: false })
          .limit(5000);
        
        setPageViews(data || []);
      } catch (error) {
        console.error('Error fetching page views:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const { nodes, maxVisits, visitedCount, totalCount } = useMemo(() => {
    const filterDate = getTimeRangeFilter(timeRange);
    
    // Filter page views by time range
    const filteredViews = filterDate 
      ? pageViews.filter(pv => new Date(pv.created_at) >= filterDate)
      : pageViews;

    // Count visits per path
    const visitCounts: Record<string, number> = {};
    filteredViews.forEach(pv => {
      const path = pv.page_path.split('#')[0].split('?')[0];
      visitCounts[path] = (visitCounts[path] || 0) + 1;
    });

    // Build nodes from complete site structure
    const nodeMap: Record<string, PageNode> = {};
    
    SITE_STRUCTURE.forEach(({ path, parent }) => {
      const depth = path === '/' ? 0 : path.split('/').filter(Boolean).length;
      const visits = visitCounts[path] || 0;
      nodeMap[path] = {
        path,
        name: formatPageName(path),
        visits,
        depth,
        parent,
        isVisited: visits > 0,
      };
    });

    // Also add any visited paths not in the structure
    Object.entries(visitCounts).forEach(([path, visits]) => {
      if (!nodeMap[path]) {
        const depth = path === '/' ? 0 : path.split('/').filter(Boolean).length;
        const segments = path.split('/').filter(Boolean);
        let parent: string | null = '/';
        if (segments.length > 1) {
          segments.pop();
          parent = '/' + segments.join('/');
        } else if (segments.length === 0) {
          parent = null;
        }
        
        nodeMap[path] = {
          path,
          name: formatPageName(path),
          visits,
          depth,
          parent,
          isVisited: true,
        };
      }
    });

    const nodeList = Object.values(nodeMap).sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      // Sort visited pages first, then by visits
      if (a.isVisited !== b.isVisited) return a.isVisited ? -1 : 1;
      return b.visits - a.visits;
    });

    const maxV = Math.max(...nodeList.map(n => n.visits), 1);
    const visited = nodeList.filter(n => n.isVisited).length;

    return { nodes: nodeList, maxVisits: maxV, visitedCount: visited, totalCount: nodeList.length };
  }, [pageViews, timeRange]);

  const getHeatColor = (intensity: number, isVisited: boolean) => {
    if (!isVisited) return '#6b7280'; // gray-500
    if (intensity > 0.7) return '#ef4444'; // red
    if (intensity > 0.5) return '#f97316'; // orange
    if (intensity > 0.3) return '#eab308'; // yellow
    if (intensity > 0.1) return '#84cc16'; // lime
    return '#22c55e'; // green
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitBranch className="w-5 h-5 text-primary" />
          <span className="font-bold">Site Architecture Flow</span>
        </div>
        <div className="h-[500px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  // Group by depth with limits
  const depth0 = nodes.filter(n => n.depth === 0);
  const depth1 = nodes.filter(n => n.depth === 1).slice(0, 14);
  const depth2 = nodes.filter(n => n.depth === 2).slice(0, 16);
  const depth3 = nodes.filter(n => n.depth >= 3).slice(0, 10);

  // Calculate positions for SVG
  const svgWidth = 1000;
  const svgHeight = 520;
  const levelHeight = 110;
  
  const getNodePositions = () => {
    const positions: Record<string, { x: number; y: number }> = {};
    
    // Root
    depth0.forEach(() => {
      positions['/'] = { x: svgWidth / 2, y: 45 };
    });
    
    // Level 1
    const l1Width = svgWidth - 80;
    depth1.forEach((node, i) => {
      const spacing = l1Width / (depth1.length + 1);
      positions[node.path] = { x: 40 + spacing * (i + 1), y: 45 + levelHeight };
    });
    
    // Level 2
    const l2Width = svgWidth - 40;
    depth2.forEach((node, i) => {
      const spacing = l2Width / (depth2.length + 1);
      positions[node.path] = { x: 20 + spacing * (i + 1), y: 45 + levelHeight * 2 };
    });
    
    // Level 3+
    const l3Width = svgWidth - 100;
    depth3.forEach((node, i) => {
      const spacing = l3Width / (depth3.length + 1);
      positions[node.path] = { x: 50 + spacing * (i + 1), y: 45 + levelHeight * 3 };
    });
    
    return positions;
  };

  const positions = getNodePositions();
  const allDisplayedNodes = [...depth0, ...depth1, ...depth2, ...depth3];

  // Generate edges
  const edges: { from: string; to: string; visits: number; isVisited: boolean }[] = [];
  allDisplayedNodes.forEach(node => {
    if (node.parent && positions[node.parent] && positions[node.path]) {
      edges.push({ 
        from: node.parent, 
        to: node.path, 
        visits: node.visits,
        isVisited: node.isVisited 
      });
    }
  });

  return (
    <Card className="p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            <GitBranch className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Site Architecture Flow</h3>
            <p className="text-xs text-muted-foreground">
              {visitedCount} of {totalCount} pages visited
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Legend */}
          <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-500 opacity-40" />
              Unvisited
            </span>
            <span className="flex items-center gap-1">
              <div className="w-6 h-1 rounded bg-green-500" />
              Low
            </span>
            <span className="flex items-center gap-1">
              <div className="w-6 h-1 rounded bg-amber-500" />
              Med
            </span>
            <span className="flex items-center gap-1">
              <div className="w-6 h-1 rounded bg-red-500" />
              High
            </span>
          </div>
        </div>
      </div>

      <div className="relative bg-secondary/30 rounded-2xl p-4 overflow-x-auto">
        <svg 
          width={svgWidth} 
          height={svgHeight} 
          className="mx-auto"
          style={{ minWidth: svgWidth }}
        >
          {/* Draw edges first (behind nodes) */}
          {edges.map((edge, i) => {
            const fromPos = positions[edge.from];
            const toPos = positions[edge.to];
            if (!fromPos || !toPos) return null;
            
            const intensity = edge.visits / maxVisits;
            const strokeWidth = edge.isVisited ? Math.max(1.5, Math.min(5, intensity * 6 + 1)) : 1;
            const color = getHeatColor(intensity, edge.isVisited);
            const opacity = edge.isVisited ? 0.8 : 0.25;
            
            // Calculate control point for curved line
            const midY = (fromPos.y + toPos.y) / 2;
            
            return (
              <g key={`edge-${i}`}>
                {/* Glow effect for visited */}
                {edge.isVisited && (
                  <path
                    d={`M ${fromPos.x} ${fromPos.y + 18} 
                        Q ${fromPos.x} ${midY}, ${(fromPos.x + toPos.x) / 2} ${midY}
                        Q ${toPos.x} ${midY}, ${toPos.x} ${toPos.y - 18}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth + 3}
                    strokeOpacity={0.15}
                    strokeLinecap="round"
                  />
                )}
                {/* Main line */}
                <path
                  d={`M ${fromPos.x} ${fromPos.y + 18} 
                      Q ${fromPos.x} ${midY}, ${(fromPos.x + toPos.x) / 2} ${midY}
                      Q ${toPos.x} ${midY}, ${toPos.x} ${toPos.y - 18}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeOpacity={opacity}
                  strokeLinecap="round"
                  strokeDasharray={edge.isVisited ? "none" : "4 3"}
                />
              </g>
            );
          })}
          
          {/* Draw nodes */}
          {allDisplayedNodes.map((node) => {
            const pos = positions[node.path];
            if (!pos) return null;
            
            const intensity = node.visits / maxVisits;
            const color = getHeatColor(intensity, node.isVisited);
            const nodeSize = node.depth === 0 ? 22 : node.depth === 1 ? 16 : 12;
            const opacity = node.isVisited ? 1 : 0.35;
            
            return (
              <g key={node.path} className="cursor-pointer" style={{ opacity }}>
                {/* Glow for visited */}
                {node.isVisited && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={nodeSize + 5}
                    fill={color}
                    opacity={0.2}
                  />
                )}
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeSize}
                  fill="hsl(var(--background))"
                  stroke={color}
                  strokeWidth={node.isVisited ? 2.5 : 1.5}
                  strokeDasharray={node.isVisited ? "none" : "3 2"}
                />
                {/* Inner dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeSize * 0.35}
                  fill={color}
                  opacity={node.isVisited ? 1 : 0.5}
                />
                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y + nodeSize + 12}
                  textAnchor="middle"
                  className="fill-foreground font-medium"
                  style={{ 
                    fontSize: node.depth === 0 ? '11px' : node.depth === 1 ? '9px' : '8px',
                    opacity: node.isVisited ? 1 : 0.6
                  }}
                >
                  {node.name}
                </text>
                {/* Visit count */}
                {node.visits > 0 && (
                  <text
                    x={pos.x}
                    y={pos.y + nodeSize + 22}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: '7px' }}
                  >
                    {node.visits}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Depth labels */}
          <text x={10} y={50} className="fill-muted-foreground" style={{ fontSize: '9px' }}>Root</text>
          <text x={10} y={50 + levelHeight} className="fill-muted-foreground" style={{ fontSize: '9px' }}>L1</text>
          <text x={10} y={50 + levelHeight * 2} className="fill-muted-foreground" style={{ fontSize: '9px' }}>L2</text>
          <text x={10} y={50 + levelHeight * 3} className="fill-muted-foreground" style={{ fontSize: '9px' }}>L3+</text>
        </svg>
      </div>

      {/* Stats summary */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
        <span>{allDisplayedNodes.length} pages shown</span>
        <span className="hidden sm:inline">{allDisplayedNodes.filter(n => n.isVisited).length} visited</span>
        <span className="hidden sm:inline">{edges.length} paths</span>
        <span>Peak: {maxVisits} visits</span>
      </div>
    </Card>
  );
};

export default VisitorFlowDiagram;
