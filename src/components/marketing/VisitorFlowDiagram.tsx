import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Calendar, Users, Zap } from 'lucide-react';
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

interface LiveVisitor {
  id: string;
  currentPath: string;
  previousPath: string | null;
  timestamp: number;
}

type TimeRange = 'today' | 'week' | 'month' | 'all';

// Complete site structure based on the project's actual routing
const SITE_STRUCTURE: { path: string; parent: string | null; category?: string }[] = [
  { path: '/', parent: null, category: 'root' },
  
  // Main L1 pages
  { path: '/about', parent: '/', category: 'main' },
  { path: '/features', parent: '/', category: 'main' },
  { path: '/pricing', parent: '/', category: 'main' },
  { path: '/contact', parent: '/', category: 'main' },
  { path: '/faq', parent: '/', category: 'main' },
  { path: '/learn', parent: '/', category: 'main' },
  { path: '/tools', parent: '/', category: 'main' },
  { path: '/directory', parent: '/', category: 'main' },
  { path: '/marketplace', parent: '/', category: 'main' },
  { path: '/careers', parent: '/', category: 'main' },
  { path: '/integrations', parent: '/', category: 'main' },
  { path: '/website-audits', parent: '/', category: 'main' },
  { path: '/changelog', parent: '/', category: 'main' },
  { path: '/auth', parent: '/', category: 'main' },
  { path: '/admin', parent: '/', category: 'main' },
  
  // Feature sub-pages (L2)
  { path: '/features/on-page-seo', parent: '/features', category: 'features' },
  { path: '/features/off-page-seo', parent: '/features', category: 'features' },
  { path: '/features/domain-authority', parent: '/features', category: 'features' },
  { path: '/features/advanced-analytics', parent: '/features', category: 'features' },
  { path: '/features/automated-blog', parent: '/features', category: 'features' },
  { path: '/features/faq-generation', parent: '/features', category: 'features' },
  { path: '/features/gmb-optimization', parent: '/features', category: 'features' },
  { path: '/features/ppc-landing-pages', parent: '/features', category: 'features' },
  { path: '/features/social-signals', parent: '/features', category: 'features' },
  { path: '/features/traffic-de-anonymization', parent: '/features', category: 'features' },
  { path: '/features/uptime-monitoring', parent: '/features', category: 'features' },
  { path: '/features/visitor-intelligence', parent: '/features', category: 'features' },
  { path: '/features/web-hosting', parent: '/features', category: 'features' },
  
  // Tools sub-pages (L2)
  { path: '/tools/domain-audit', parent: '/tools', category: 'tools' },
  { path: '/tools/keyword-checker', parent: '/tools', category: 'tools' },
  { path: '/tools/backlink-analyzer', parent: '/tools', category: 'tools' },
  { path: '/tools/site-speed', parent: '/tools', category: 'tools' },
  { path: '/audit-results', parent: '/website-audits', category: 'tools' },
  
  // Learn sub-pages (L2)
  { path: '/learn/glossary', parent: '/learn', category: 'learn' },
  { path: '/learn/analytics-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/automated-blogging-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/cro-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/content-marketing-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/core-web-vitals-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/domain-authority-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/ecommerce-seo-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/faq-generation-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/gmb-optimization-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/keyword-research-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/link-building-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/local-seo-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/mobile-seo-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/off-page-seo-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/on-page-seo-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/ppc-landing-pages-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/social-signals-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/technical-seo-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/traffic-deanonymization-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/uptime-monitoring-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/visitor-intelligence-guide', parent: '/learn', category: 'learn' },
  { path: '/learn/web-hosting-guide', parent: '/learn', category: 'learn' },
  
  // Glossary term pages (L3)
  { path: '/learn/glossary/index', parent: '/learn/glossary', category: 'glossary' },
  
  // Directory sub-pages (L2)
  { path: '/directory/listing', parent: '/directory', category: 'directory' },
  
  // Legal pages - nested under a virtual /legal parent for visual grouping
  { path: '/legal', parent: '/', category: 'legal' },
  { path: '/privacy-policy', parent: '/legal', category: 'legal' },
  { path: '/terms', parent: '/legal', category: 'legal' },
  { path: '/cookies', parent: '/legal', category: 'legal' },
  { path: '/security', parent: '/legal', category: 'legal' },
  { path: '/sitemap', parent: '/legal', category: 'legal' },
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
    .slice(0, 14);
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
  const [pageViews, setPageViews] = useState<{ page_path: string; created_at: string; session_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitor[]>([]);
  const [activePaths, setActivePaths] = useState<{ from: string; to: string; id: string }[]>([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await supabase
          .from('page_views')
          .select('page_path, created_at, session_id')
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

  // Subscribe to realtime page views
  useEffect(() => {
    const channel = supabase
      .channel('live-page-views')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'page_views',
        },
        (payload) => {
          console.log('New page view:', payload);
          const newView = payload.new as { page_path: string; created_at: string; session_id: string };
          
          // Add to page views
          setPageViews(prev => [newView, ...prev].slice(0, 5000));
          
          // Track live visitor movement
          setLiveVisitors(prev => {
            const existing = prev.find(v => v.id === newView.session_id);
            const cleanPath = newView.page_path.split('#')[0].split('?')[0];
            
            if (existing) {
              // Visitor moved to new page - create animated path
              if (existing.currentPath !== cleanPath) {
                const pathId = `${existing.currentPath}-${cleanPath}-${Date.now()}`;
                setActivePaths(paths => [...paths, { 
                  from: existing.currentPath, 
                  to: cleanPath, 
                  id: pathId 
                }]);
                
                // Remove path after animation
                setTimeout(() => {
                  setActivePaths(paths => paths.filter(p => p.id !== pathId));
                }, 2000);
              }
              
              return prev.map(v => 
                v.id === newView.session_id 
                  ? { ...v, previousPath: v.currentPath, currentPath: cleanPath, timestamp: Date.now() }
                  : v
              );
            } else {
              // New visitor
              return [...prev, { 
                id: newView.session_id, 
                currentPath: cleanPath, 
                previousPath: null, 
                timestamp: Date.now() 
              }];
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Clean up stale visitors (inactive for 5 min)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      setLiveVisitors(prev => prev.filter(v => v.timestamp > fiveMinAgo));
    }, 30000);

    return () => clearInterval(cleanup);
  }, []);

  const { nodes, maxVisits, visitedCount, totalCount } = useMemo(() => {
    const filterDate = getTimeRangeFilter(timeRange);
    
    const filteredViews = filterDate 
      ? pageViews.filter(pv => new Date(pv.created_at) >= filterDate)
      : pageViews;

    const visitCounts: Record<string, number> = {};
    filteredViews.forEach(pv => {
      const path = pv.page_path.split('#')[0].split('?')[0];
      visitCounts[path] = (visitCounts[path] || 0) + 1;
    });

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
      if (a.isVisited !== b.isVisited) return a.isVisited ? -1 : 1;
      return b.visits - a.visits;
    });

    const maxV = Math.max(...nodeList.map(n => n.visits), 1);
    const visited = nodeList.filter(n => n.isVisited).length;

    return { nodes: nodeList, maxVisits: maxV, visitedCount: visited, totalCount: nodeList.length };
  }, [pageViews, timeRange]);

  const getHeatColor = useCallback((intensity: number, isVisited: boolean) => {
    if (!isVisited) return '#6b7280';
    if (intensity > 0.7) return '#ef4444';
    if (intensity > 0.5) return '#f97316';
    if (intensity > 0.3) return '#eab308';
    if (intensity > 0.1) return '#84cc16';
    return '#22c55e';
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitBranch className="w-5 h-5 text-primary" />
          <span className="font-bold">Site Architecture Flow</span>
        </div>
        <div className="h-[600px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  // Group by depth - show all pages, split L2 into rows if needed
  const depth0 = nodes.filter(n => n.depth === 0);
  const depth1 = nodes.filter(n => n.depth === 1);
  const depth2 = nodes.filter(n => n.depth === 2);
  const depth3 = nodes.filter(n => n.depth >= 3);

  // Calculate how many L2 rows we need (max 20 per row)
  const l2RowSize = 22;
  const l2Rows = Math.ceil(depth2.length / l2RowSize);
  
  // Taller SVG to fit all pages
  const svgWidth = 1400;
  const levelHeight = 120;
  const l2ExtraHeight = (l2Rows - 1) * 90;
  const svgHeight = 180 + levelHeight * 3 + l2ExtraHeight + (depth3.length > 0 ? 100 : 0);
  
  const getNodePositions = () => {
    const positions: Record<string, { x: number; y: number }> = {};
    
    // Root (L0)
    depth0.forEach(() => {
      positions['/'] = { x: svgWidth / 2, y: 50 };
    });
    
    // L1 - spread across width
    const l1Width = svgWidth - 80;
    depth1.forEach((node, i) => {
      const spacing = l1Width / (depth1.length + 1);
      positions[node.path] = { x: 40 + spacing * (i + 1), y: 50 + levelHeight };
    });
    
    // L2 - may need multiple rows
    const l2Width = svgWidth - 40;
    depth2.forEach((node, i) => {
      const row = Math.floor(i / l2RowSize);
      const indexInRow = i % l2RowSize;
      const nodesInThisRow = Math.min(l2RowSize, depth2.length - row * l2RowSize);
      const spacing = l2Width / (nodesInThisRow + 1);
      positions[node.path] = { 
        x: 20 + spacing * (indexInRow + 1), 
        y: 50 + levelHeight * 2 + row * 90 
      };
    });
    
    // L3+ - at the bottom
    const l3Width = svgWidth - 100;
    const l3YBase = 50 + levelHeight * 2 + l2ExtraHeight + 100;
    depth3.forEach((node, i) => {
      const spacing = l3Width / (depth3.length + 1);
      positions[node.path] = { x: 50 + spacing * (i + 1), y: l3YBase };
    });
    
    return positions;
  };

  const positions = getNodePositions();
  const allDisplayedNodes = [...depth0, ...depth1, ...depth2, ...depth3];

  // Generate static edges
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

  // Get visitors on each node
  const visitorsByNode: Record<string, number> = {};
  liveVisitors.forEach(v => {
    const path = v.currentPath;
    visitorsByNode[path] = (visitorsByNode[path] || 0) + 1;
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
          {/* Live visitors indicator */}
          {liveVisitors.length > 0 && (
            <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
              <Zap className="w-3 h-3 mr-1" />
              {liveVisitors.length} live
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4">
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

          <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-500 opacity-40" />
              Unvisited
            </span>
            <span className="flex items-center gap-1">
              <div className="w-5 h-1 rounded bg-green-500" />
              Low
            </span>
            <span className="flex items-center gap-1">
              <div className="w-5 h-1 rounded bg-amber-500" />
              Med
            </span>
            <span className="flex items-center gap-1">
              <div className="w-5 h-1 rounded bg-red-500" />
              High
            </span>
            <span className="flex items-center gap-1 ml-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
              Live
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
          {/* Gradient definitions for animated paths */}
          <defs>
            <linearGradient id="livePathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Draw static edges */}
          {edges.map((edge, i) => {
            const fromPos = positions[edge.from];
            const toPos = positions[edge.to];
            if (!fromPos || !toPos) return null;
            
            const intensity = edge.visits / maxVisits;
            const strokeWidth = edge.isVisited ? Math.max(1.5, Math.min(5, intensity * 6 + 1)) : 1;
            const color = getHeatColor(intensity, edge.isVisited);
            const opacity = edge.isVisited ? 0.7 : 0.2;
            
            const midY = (fromPos.y + toPos.y) / 2;
            
            return (
              <g key={`edge-${i}`}>
                {edge.isVisited && (
                  <path
                    d={`M ${fromPos.x} ${fromPos.y + 22} 
                        Q ${fromPos.x} ${midY}, ${(fromPos.x + toPos.x) / 2} ${midY}
                        Q ${toPos.x} ${midY}, ${toPos.x} ${toPos.y - 22}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth + 3}
                    strokeOpacity={0.12}
                    strokeLinecap="round"
                  />
                )}
                <path
                  d={`M ${fromPos.x} ${fromPos.y + 22} 
                      Q ${fromPos.x} ${midY}, ${(fromPos.x + toPos.x) / 2} ${midY}
                      Q ${toPos.x} ${midY}, ${toPos.x} ${toPos.y - 22}`}
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

          {/* Animated live visitor paths */}
          {activePaths.map((path) => {
            const fromPos = positions[path.from];
            const toPos = positions[path.to];
            if (!fromPos || !toPos) return null;
            
            const midY = (fromPos.y + toPos.y) / 2;
            const pathD = `M ${fromPos.x} ${fromPos.y + 22} 
                          Q ${fromPos.x} ${midY}, ${(fromPos.x + toPos.x) / 2} ${midY}
                          Q ${toPos.x} ${midY}, ${toPos.x} ${toPos.y - 22}`;
            
            return (
              <g key={path.id}>
                {/* Glowing path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth={6}
                  strokeOpacity={0.4}
                  strokeLinecap="round"
                  filter="url(#glow)"
                  className="animate-pulse"
                />
                {/* Animated dot traveling along path */}
                <circle r="6" fill="#06b6d4" filter="url(#glow)">
                  <animateMotion
                    dur="1.5s"
                    repeatCount="1"
                    path={pathD}
                  />
                </circle>
                <circle r="3" fill="#ffffff">
                  <animateMotion
                    dur="1.5s"
                    repeatCount="1"
                    path={pathD}
                  />
                </circle>
              </g>
            );
          })}
          
          {/* Draw nodes */}
          {allDisplayedNodes.map((node) => {
            const pos = positions[node.path];
            if (!pos) return null;
            
            const intensity = node.visits / maxVisits;
            const color = getHeatColor(intensity, node.isVisited);
            const nodeSize = node.depth === 0 ? 26 : node.depth === 1 ? 18 : 14;
            const opacity = node.isVisited ? 1 : 0.35;
            const hasLiveVisitor = visitorsByNode[node.path] > 0;
            
            return (
              <g key={node.path} className="cursor-pointer" style={{ opacity }}>
                {/* Live visitor ring */}
                {hasLiveVisitor && (
                  <>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={nodeSize + 12}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      strokeOpacity={0.6}
                      className="animate-ping"
                      style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={nodeSize + 8}
                      fill="#06b6d4"
                      opacity={0.2}
                      filter="url(#glow)"
                    />
                  </>
                )}
                {/* Glow for visited */}
                {node.isVisited && !hasLiveVisitor && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={nodeSize + 6}
                    fill={color}
                    opacity={0.15}
                  />
                )}
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeSize}
                  fill="hsl(var(--background))"
                  stroke={hasLiveVisitor ? "#06b6d4" : color}
                  strokeWidth={hasLiveVisitor ? 3 : node.isVisited ? 2.5 : 1.5}
                  strokeDasharray={node.isVisited ? "none" : "3 2"}
                />
                {/* Inner dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeSize * 0.35}
                  fill={hasLiveVisitor ? "#06b6d4" : color}
                  opacity={node.isVisited ? 1 : 0.5}
                />
                {/* Live visitor count badge */}
                {hasLiveVisitor && (
                  <>
                    <circle
                      cx={pos.x + nodeSize - 2}
                      cy={pos.y - nodeSize + 2}
                      r={8}
                      fill="#06b6d4"
                    />
                    <text
                      x={pos.x + nodeSize - 2}
                      y={pos.y - nodeSize + 6}
                      textAnchor="middle"
                      fill="white"
                      style={{ fontSize: '9px', fontWeight: 'bold' }}
                    >
                      {visitorsByNode[node.path]}
                    </text>
                  </>
                )}
                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y + nodeSize + 14}
                  textAnchor="middle"
                  className="fill-foreground font-medium"
                  style={{ 
                    fontSize: node.depth === 0 ? '12px' : node.depth === 1 ? '10px' : '9px',
                    opacity: node.isVisited ? 1 : 0.6
                  }}
                >
                  {node.name}
                </text>
                {/* Visit count */}
                {node.visits > 0 && (
                  <text
                    x={pos.x}
                    y={pos.y + nodeSize + 26}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: '8px' }}
                  >
                    {node.visits}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Depth labels */}
          <text x={12} y={55} className="fill-muted-foreground" style={{ fontSize: '10px' }}>Root</text>
          <text x={12} y={55 + levelHeight} className="fill-muted-foreground" style={{ fontSize: '10px' }}>L1</text>
          <text x={12} y={55 + levelHeight * 2} className="fill-muted-foreground" style={{ fontSize: '10px' }}>L2</text>
          {depth3.length > 0 && (
            <text x={12} y={55 + levelHeight * 2 + l2ExtraHeight + 100} className="fill-muted-foreground" style={{ fontSize: '10px' }}>L3+</text>
          )}
        </svg>
      </div>

      {/* Stats summary */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
        <span>{allDisplayedNodes.length} pages shown</span>
        <span className="hidden sm:inline">{allDisplayedNodes.filter(n => n.isVisited).length} visited</span>
        <span className="hidden md:inline">{edges.length} paths</span>
        <span>Peak: {maxVisits} visits</span>
        {liveVisitors.length > 0 && (
          <span className="text-cyan-400 flex items-center gap-1">
            <Users className="w-3 h-3" />
            {liveVisitors.length} active now
          </span>
        )}
      </div>
    </Card>
  );
};

export default VisitorFlowDiagram;
