import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GitBranch, Home, FileText, Wrench, DollarSign, Info, Mail,
  BookOpen, Users, Building, Search, HelpCircle, Briefcase, Map
} from 'lucide-react';

interface PageNode {
  path: string;
  name: string;
  visits: number;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

interface FlowEdge {
  from: string;
  to: string;
  count: number;
}

const pageIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  '/': Home,
  '/features': FileText,
  '/tools': Wrench,
  '/pricing': DollarSign,
  '/about': Info,
  '/contact': Mail,
  '/learn': BookOpen,
  '/faq': HelpCircle,
  '/directory': Building,
  '/marketplace': Users,
  '/audits': Search,
  '/careers': Briefcase,
  '/sitemap': Map,
};

const getPageCategory = (path: string): string => {
  if (path === '/') return 'main';
  if (path.startsWith('/features')) return 'features';
  if (path.startsWith('/tools')) return 'tools';
  if (path.startsWith('/learn')) return 'learn';
  if (path.startsWith('/pricing') || path.startsWith('/contact')) return 'conversion';
  return 'other';
};

const formatPageName = (path: string): string => {
  if (path === '/') return 'Home';
  const name = path.split('/').pop() || path;
  return name
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .slice(0, 15);
};

const VisitorFlowDiagram = () => {
  const [pageViews, setPageViews] = useState<{ session_id: string; page_path: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await supabase
          .from('page_views')
          .select('session_id, page_path, created_at')
          .order('created_at', { ascending: true })
          .limit(1000);
        
        setPageViews(data || []);
      } catch (error) {
        console.error('Error fetching page views:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const { nodes, edges, maxVisits, maxEdgeCount } = useMemo(() => {
    // Count visits per page
    const visitCounts: Record<string, number> = {};
    pageViews.forEach(pv => {
      const path = pv.page_path.split('#')[0]; // Remove hash
      visitCounts[path] = (visitCounts[path] || 0) + 1;
    });

    // Build flow edges (page to page transitions within sessions)
    const flowCounts: Record<string, number> = {};
    const sessionPages: Record<string, { path: string; time: string }[]> = {};
    
    pageViews.forEach(pv => {
      const path = pv.page_path.split('#')[0];
      if (!sessionPages[pv.session_id]) {
        sessionPages[pv.session_id] = [];
      }
      sessionPages[pv.session_id].push({ path, time: pv.created_at });
    });

    // Calculate transitions
    Object.values(sessionPages).forEach(pages => {
      pages.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      for (let i = 0; i < pages.length - 1; i++) {
        const from = pages[i].path;
        const to = pages[i + 1].path;
        if (from !== to) {
          const key = `${from}|${to}`;
          flowCounts[key] = (flowCounts[key] || 0) + 1;
        }
      }
    });

    // Create nodes
    const nodeList: PageNode[] = Object.entries(visitCounts)
      .map(([path, visits]) => ({
        path,
        name: formatPageName(path),
        visits,
        icon: pageIcons[path] || FileText,
        category: getPageCategory(path),
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 15); // Top 15 pages

    // Create edges
    const edgeList: FlowEdge[] = Object.entries(flowCounts)
      .map(([key, count]) => {
        const [from, to] = key.split('|');
        return { from, to, count };
      })
      .filter(e => e.count >= 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 flows

    const maxV = Math.max(...nodeList.map(n => n.visits), 1);
    const maxE = Math.max(...edgeList.map(e => e.count), 1);

    return { nodes: nodeList, edges: edgeList, maxVisits: maxV, maxEdgeCount: maxE };
  }, [pageViews]);

  const getHeatColor = (intensity: number) => {
    if (intensity > 0.8) return { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-400', glow: 'shadow-red-500/50' };
    if (intensity > 0.6) return { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-400', glow: 'shadow-orange-500/50' };
    if (intensity > 0.4) return { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/50' };
    if (intensity > 0.2) return { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/50' };
    return { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-400', glow: 'shadow-green-500/50' };
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'main': return 'from-primary to-violet-500';
      case 'features': return 'from-cyan-500 to-blue-500';
      case 'tools': return 'from-amber-500 to-orange-500';
      case 'learn': return 'from-emerald-500 to-green-500';
      case 'conversion': return 'from-pink-500 to-rose-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitBranch className="w-5 h-5 text-primary" />
          <span className="font-bold">Visitor Flow Diagram</span>
        </div>
        <div className="h-[500px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  if (nodes.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitBranch className="w-5 h-5 text-primary" />
          <span className="font-bold">Visitor Flow Diagram</span>
        </div>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No visitor flow data yet
        </div>
      </Card>
    );
  }

  // Group nodes by category for layout
  const mainNodes = nodes.filter(n => n.category === 'main');
  const featureNodes = nodes.filter(n => n.category === 'features');
  const toolNodes = nodes.filter(n => n.category === 'tools');
  const learnNodes = nodes.filter(n => n.category === 'learn');
  const conversionNodes = nodes.filter(n => n.category === 'conversion');
  const otherNodes = nodes.filter(n => n.category === 'other');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            <GitBranch className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Visitor Flow Diagram</h3>
            <p className="text-xs text-muted-foreground">Page navigation paths with traffic intensity</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            Low
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500" />
            Medium
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            High
          </span>
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="relative min-h-[500px] bg-secondary/20 rounded-2xl p-6 overflow-hidden">
        {/* Category Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Main/Home */}
          <div className="space-y-3">
            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
              Entry Point
            </Badge>
            {mainNodes.map(node => {
              const intensity = node.visits / maxVisits;
              const heat = getHeatColor(intensity);
              const Icon = node.icon;
              return (
                <div
                  key={node.path}
                  className={`relative p-4 rounded-xl border-2 ${heat.border} bg-background/80 backdrop-blur-sm shadow-lg ${heat.glow} transition-all hover:scale-105`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCategoryColor(node.category)} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{node.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{node.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold ${heat.text}`}>{node.visits}</span>
                    <span className="text-[10px] text-muted-foreground">visits</span>
                  </div>
                  {/* Heat bar */}
                  <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                    <div 
                      className={`h-full ${heat.bg} transition-all`}
                      style={{ width: `${intensity * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
              Features
            </Badge>
            {featureNodes.slice(0, 4).map(node => {
              const intensity = node.visits / maxVisits;
              const heat = getHeatColor(intensity);
              const Icon = node.icon;
              return (
                <div
                  key={node.path}
                  className={`relative p-3 rounded-xl border ${heat.border}/50 bg-background/60 backdrop-blur-sm transition-all hover:scale-105`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getCategoryColor(node.category)} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{node.name}</p>
                    </div>
                    <span className={`text-sm font-bold ${heat.text}`}>{node.visits}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${heat.bg}`} style={{ width: `${intensity * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tools */}
          <div className="space-y-3">
            <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400">
              Tools
            </Badge>
            {toolNodes.slice(0, 4).map(node => {
              const intensity = node.visits / maxVisits;
              const heat = getHeatColor(intensity);
              const Icon = node.icon;
              return (
                <div
                  key={node.path}
                  className={`relative p-3 rounded-xl border ${heat.border}/50 bg-background/60 backdrop-blur-sm transition-all hover:scale-105`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getCategoryColor(node.category)} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{node.name}</p>
                    </div>
                    <span className={`text-sm font-bold ${heat.text}`}>{node.visits}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${heat.bg}`} style={{ width: `${intensity * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Learn/Content */}
          <div className="space-y-3">
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
              Learn
            </Badge>
            {learnNodes.slice(0, 4).map(node => {
              const intensity = node.visits / maxVisits;
              const heat = getHeatColor(intensity);
              const Icon = node.icon;
              return (
                <div
                  key={node.path}
                  className={`relative p-3 rounded-xl border ${heat.border}/50 bg-background/60 backdrop-blur-sm transition-all hover:scale-105`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getCategoryColor(node.category)} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{node.name}</p>
                    </div>
                    <span className={`text-sm font-bold ${heat.text}`}>{node.visits}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${heat.bg}`} style={{ width: `${intensity * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversion */}
          <div className="space-y-3">
            <Badge variant="outline" className="bg-pink-500/10 border-pink-500/30 text-pink-400">
              Conversion
            </Badge>
            {[...conversionNodes, ...otherNodes].slice(0, 4).map(node => {
              const intensity = node.visits / maxVisits;
              const heat = getHeatColor(intensity);
              const Icon = node.icon;
              return (
                <div
                  key={node.path}
                  className={`relative p-3 rounded-xl border ${heat.border}/50 bg-background/60 backdrop-blur-sm transition-all hover:scale-105`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getCategoryColor(node.category)} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{node.name}</p>
                    </div>
                    <span className={`text-sm font-bold ${heat.text}`}>{node.visits}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${heat.bg}`} style={{ width: `${intensity * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Flow Paths */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-4">Top Navigation Paths</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {edges.slice(0, 9).map((edge, i) => {
              const intensity = edge.count / maxEdgeCount;
              const heat = getHeatColor(intensity);
              return (
                <div
                  key={`${edge.from}-${edge.to}-${i}`}
                  className={`flex items-center gap-2 p-3 rounded-xl bg-background/60 border ${heat.border}/30`}
                >
                  <span className={`text-lg font-bold ${heat.text} w-8`}>{edge.count}</span>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium truncate max-w-[80px]" title={edge.from}>
                      {formatPageName(edge.from)}
                    </span>
                    <div className={`flex-shrink-0 w-8 h-0.5 ${heat.bg} rounded-full`} />
                    <span className="text-[10px] text-muted-foreground">→</span>
                    <div className={`flex-shrink-0 w-8 h-0.5 ${heat.bg} rounded-full`} />
                    <span className="text-xs font-medium truncate max-w-[80px]" title={edge.to}>
                      {formatPageName(edge.to)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VisitorFlowDiagram;
