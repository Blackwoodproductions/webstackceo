import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch } from 'lucide-react';

interface PageNode {
  path: string;
  name: string;
  visits: number;
  depth: number;
  parent: string | null;
}

const formatPageName = (path: string): string => {
  if (path === '/') return 'Home';
  const segments = path.split('/').filter(Boolean);
  const name = segments[segments.length - 1] || path;
  return name
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .slice(0, 18);
};

const getParentPath = (path: string): string | null => {
  if (path === '/') return null;
  const segments = path.split('/').filter(Boolean);
  if (segments.length <= 1) return '/';
  segments.pop();
  return '/' + segments.join('/');
};

const VisitorFlowDiagram = () => {
  const [pageViews, setPageViews] = useState<{ page_path: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await supabase
          .from('page_views')
          .select('page_path')
          .limit(2000);
        
        setPageViews(data || []);
      } catch (error) {
        console.error('Error fetching page views:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const { nodes, maxVisits } = useMemo(() => {
    const visitCounts: Record<string, number> = {};
    
    pageViews.forEach(pv => {
      const path = pv.page_path.split('#')[0].split('?')[0];
      visitCounts[path] = (visitCounts[path] || 0) + 1;
    });

    // Build tree structure
    const nodeMap: Record<string, PageNode> = {};
    
    Object.entries(visitCounts).forEach(([path, visits]) => {
      const depth = path === '/' ? 0 : path.split('/').filter(Boolean).length;
      nodeMap[path] = {
        path,
        name: formatPageName(path),
        visits,
        depth,
        parent: getParentPath(path),
      };
    });

    // Ensure parent nodes exist
    Object.values(nodeMap).forEach(node => {
      if (node.parent && !nodeMap[node.parent]) {
        const parentDepth = node.parent === '/' ? 0 : node.parent.split('/').filter(Boolean).length;
        nodeMap[node.parent] = {
          path: node.parent,
          name: formatPageName(node.parent),
          visits: 0,
          depth: parentDepth,
          parent: getParentPath(node.parent),
        };
      }
    });

    const nodeList = Object.values(nodeMap)
      .sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        return b.visits - a.visits;
      });

    const maxV = Math.max(...nodeList.map(n => n.visits), 1);

    return { nodes: nodeList, maxVisits: maxV };
  }, [pageViews]);

  const getHeatColor = (intensity: number) => {
    if (intensity > 0.7) return '#ef4444'; // red
    if (intensity > 0.5) return '#f97316'; // orange
    if (intensity > 0.3) return '#eab308'; // yellow
    if (intensity > 0.1) return '#84cc16'; // lime
    return '#22c55e'; // green
  };

  const getHeatBg = (intensity: number) => {
    if (intensity > 0.7) return 'bg-red-500/20 border-red-500';
    if (intensity > 0.5) return 'bg-orange-500/20 border-orange-500';
    if (intensity > 0.3) return 'bg-amber-500/20 border-amber-500';
    if (intensity > 0.1) return 'bg-lime-500/20 border-lime-500';
    return 'bg-green-500/20 border-green-500';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitBranch className="w-5 h-5 text-primary" />
          <span className="font-bold">Site Architecture Flow</span>
        </div>
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  // Group by depth
  const depth0 = nodes.filter(n => n.depth === 0);
  const depth1 = nodes.filter(n => n.depth === 1).slice(0, 8);
  const depth2 = nodes.filter(n => n.depth === 2).slice(0, 12);
  const depth3 = nodes.filter(n => n.depth >= 3).slice(0, 8);

  // Calculate positions for SVG
  const svgWidth = 900;
  const svgHeight = 500;
  const levelHeight = 100;
  
  const getNodePositions = () => {
    const positions: Record<string, { x: number; y: number }> = {};
    
    // Root
    depth0.forEach((node, i) => {
      positions[node.path] = { x: svgWidth / 2, y: 40 };
    });
    
    // Level 1
    const l1Width = svgWidth - 100;
    depth1.forEach((node, i) => {
      const spacing = l1Width / (depth1.length + 1);
      positions[node.path] = { x: 50 + spacing * (i + 1), y: 40 + levelHeight };
    });
    
    // Level 2
    const l2Width = svgWidth - 60;
    depth2.forEach((node, i) => {
      const spacing = l2Width / (depth2.length + 1);
      positions[node.path] = { x: 30 + spacing * (i + 1), y: 40 + levelHeight * 2 };
    });
    
    // Level 3
    const l3Width = svgWidth - 80;
    depth3.forEach((node, i) => {
      const spacing = l3Width / (depth3.length + 1);
      positions[node.path] = { x: 40 + spacing * (i + 1), y: 40 + levelHeight * 2.8 };
    });
    
    return positions;
  };

  const positions = getNodePositions();
  const allDisplayedNodes = [...depth0, ...depth1, ...depth2, ...depth3];

  // Generate edges
  const edges: { from: string; to: string; visits: number }[] = [];
  allDisplayedNodes.forEach(node => {
    if (node.parent && positions[node.parent] && positions[node.path]) {
      edges.push({ from: node.parent, to: node.path, visits: node.visits });
    }
  });

  return (
    <Card className="p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            <GitBranch className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Site Architecture Flow</h3>
            <p className="text-xs text-muted-foreground">Page hierarchy with traffic intensity</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-8 h-1 rounded bg-green-500" />
            Low
          </span>
          <span className="flex items-center gap-1">
            <div className="w-8 h-1 rounded bg-amber-500" />
            Medium
          </span>
          <span className="flex items-center gap-1">
            <div className="w-8 h-1 rounded bg-red-500" />
            High
          </span>
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
            const strokeWidth = Math.max(1, Math.min(6, intensity * 8));
            const color = getHeatColor(intensity);
            
            // Calculate control point for curved line
            const midY = (fromPos.y + toPos.y) / 2;
            
            return (
              <g key={`edge-${i}`}>
                {/* Glow effect */}
                <path
                  d={`M ${fromPos.x} ${fromPos.y + 20} 
                      Q ${fromPos.x} ${midY}, ${(fromPos.x + toPos.x) / 2} ${midY}
                      Q ${toPos.x} ${midY}, ${toPos.x} ${toPos.y - 20}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth + 4}
                  strokeOpacity={0.2}
                  strokeLinecap="round"
                />
                {/* Main line */}
                <path
                  d={`M ${fromPos.x} ${fromPos.y + 20} 
                      Q ${fromPos.x} ${midY}, ${(fromPos.x + toPos.x) / 2} ${midY}
                      Q ${toPos.x} ${midY}, ${toPos.x} ${toPos.y - 20}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeOpacity={0.8}
                  strokeLinecap="round"
                />
              </g>
            );
          })}
          
          {/* Draw nodes */}
          {allDisplayedNodes.map((node) => {
            const pos = positions[node.path];
            if (!pos) return null;
            
            const intensity = node.visits / maxVisits;
            const color = getHeatColor(intensity);
            const nodeSize = node.depth === 0 ? 24 : node.depth === 1 ? 18 : 14;
            
            return (
              <g key={node.path} className="cursor-pointer">
                {/* Glow */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeSize + 6}
                  fill={color}
                  opacity={0.2}
                />
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeSize}
                  fill="hsl(var(--background))"
                  stroke={color}
                  strokeWidth={3}
                />
                {/* Inner dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeSize * 0.4}
                  fill={color}
                />
                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y + nodeSize + 14}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-medium"
                  style={{ fontSize: node.depth === 0 ? '12px' : node.depth === 1 ? '10px' : '9px' }}
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
          <text x={10} y={45} className="fill-muted-foreground text-[10px]">Root</text>
          <text x={10} y={45 + levelHeight} className="fill-muted-foreground text-[10px]">L1</text>
          <text x={10} y={45 + levelHeight * 2} className="fill-muted-foreground text-[10px]">L2</text>
          <text x={10} y={45 + levelHeight * 2.8} className="fill-muted-foreground text-[10px]">L3+</text>
        </svg>
      </div>

      {/* Stats summary */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>{allDisplayedNodes.length} pages tracked</span>
        <span>{edges.length} navigation paths</span>
        <span>Max visits: {maxVisits}</span>
      </div>
    </Card>
  );
};

export default VisitorFlowDiagram;
