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

type ReferrerType = 'google' | 'direct' | 'social' | 'bing' | 'email' | 'referral';

interface DemoVisit {
  id: string;
  path: string;
  previousPath: string | null;
  timestamp: number;
  opacity: number;
  isEntryPoint: boolean;
  referrer?: ReferrerType;
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
  { path: '/audits', parent: '/', category: 'main' },
  { path: '/changelog', parent: '/', category: 'main' },
  { path: '/auth', parent: '/', category: 'main' },
  { path: '/admin', parent: '/', category: 'main' },
  { path: '/marketing-dashboard', parent: '/', category: 'main' },
  
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
  
  // Domain Audits sub-pages (L2)
  { path: '/audit', parent: '/audits', category: 'audits' },
  
  // Tools sub-pages (L2)
  { path: '/tools/domain-audit', parent: '/tools', category: 'tools' },
  { path: '/tools/keyword-checker', parent: '/tools', category: 'tools' },
  { path: '/tools/backlink-analyzer', parent: '/tools', category: 'tools' },
  { path: '/tools/site-speed', parent: '/tools', category: 'tools' },
  
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
  
  // Marketplace sub-pages (L2)
  { path: '/marketplace/partner', parent: '/marketplace', category: 'marketplace' },
  
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

interface VisitorFlowDiagramProps {
  onPageFilter?: (pagePath: string | null) => void;
  activeFilter?: string | null;
}

const VisitorFlowDiagram = ({ onPageFilter, activeFilter }: VisitorFlowDiagramProps) => {
  const [pageViews, setPageViews] = useState<{ page_path: string; created_at: string; session_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitor[]>([]);
  const [activePaths, setActivePaths] = useState<{ from: string; to: string; id: string }[]>([]);
  const [demoVisits, setDemoVisits] = useState<DemoVisit[]>([]);
  const [demoPaths, setDemoPaths] = useState<{ from: string; to: string; id: string; opacity: number }[]>([]);

  // Demo mode - simulate visits every 30 seconds
  useEffect(() => {
    const mainPages = SITE_STRUCTURE.filter(s => s.category === 'main' || s.path === '/').map(s => s.path);
    const allPages = SITE_STRUCTURE.map(s => s.path);
    let currentSessionPath: string | null = null;

    const simulateVisit = () => {
      // Pick a random page, weighted towards main pages
      const useMainPage = Math.random() > 0.3;
      const targetPages = useMainPage ? mainPages : allPages;
      let randomPath = targetPages[Math.floor(Math.random() * targetPages.length)];
      
      // Decide if this is a new session (external entry) or internal navigation
      // 30% chance of new external visitor
      const isNewExternalVisitor = currentSessionPath === null || Math.random() > 0.7;
      
      const visitId = `demo-${Date.now()}`;
      const previousPath = isNewExternalVisitor ? null : currentSessionPath;
      
      // Entry point = new external visitor landing on non-home page
      const isEntryPoint = isNewExternalVisitor && randomPath !== '/';
      
      // Random referrer for external visitors
      const referrerTypes: ReferrerType[] = ['google', 'direct', 'social', 'bing', 'email', 'referral'];
      const referrerWeights = [0.4, 0.25, 0.15, 0.08, 0.07, 0.05]; // Google most common
      let referrer: ReferrerType | undefined;
      if (isNewExternalVisitor) {
        const rand = Math.random();
        let cumulative = 0;
        for (let i = 0; i < referrerTypes.length; i++) {
          cumulative += referrerWeights[i];
          if (rand < cumulative) {
            referrer = referrerTypes[i];
            break;
          }
        }
      }
      
      // Add demo visit
      setDemoVisits(prev => [...prev, {
        id: visitId,
        path: randomPath,
        previousPath: previousPath !== randomPath ? previousPath : null,
        timestamp: Date.now(),
        opacity: 1,
        isEntryPoint: isEntryPoint,
        referrer: referrer
      }]);

      // Add demo path ONLY for internal navigation (not external entry)
      if (!isNewExternalVisitor && previousPath && previousPath !== randomPath) {
        const pathId = `demo-path-${Date.now()}`;
        setDemoPaths(prev => [...prev, {
          from: previousPath,
          to: randomPath,
          id: pathId,
          opacity: 1
        }]);

        // Fade out path over 5 seconds
        let fadeStep = 0;
        const fadeInterval = setInterval(() => {
          fadeStep++;
          const newOpacity = Math.max(0, 1 - (fadeStep / 50));
          
          setDemoPaths(prev => prev.map(p => 
            p.id === pathId ? { ...p, opacity: newOpacity } : p
          ));

          if (fadeStep >= 50) {
            clearInterval(fadeInterval);
            setDemoPaths(prev => prev.filter(p => p.id !== pathId));
          }
        }, 100);
      }

      // Update current session path for next iteration
      currentSessionPath = randomPath;

      // Remove demo visit after 5 seconds with fade
      let visitFadeStep = 0;
      const visitFadeInterval = setInterval(() => {
        visitFadeStep++;
        const newOpacity = Math.max(0, 1 - (visitFadeStep / 30));
        
        setDemoVisits(prev => prev.map(v => 
          v.id === visitId ? { ...v, opacity: newOpacity } : v
        ));

        if (visitFadeStep >= 30) {
          clearInterval(visitFadeInterval);
          setDemoVisits(prev => prev.filter(v => v.id !== visitId));
        }
      }, 100);
    };

    // Initial visit - always an external entry
    simulateVisit();

    // Continue every 30 seconds
    const demoInterval = setInterval(simulateVisit, 30000);

    return () => clearInterval(demoInterval);
  }, []);
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
                
                // Remove path after animation (5 seconds)
                setTimeout(() => {
                  setActivePaths(paths => paths.filter(p => p.id !== pathId));
                }, 5000);
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

  const { nodes, maxVisits, visitedCount, totalCount, pathHeatmap, maxPathVisits } = useMemo(() => {
    const filterDate = getTimeRangeFilter(timeRange);
    
    const filteredViews = filterDate 
      ? pageViews.filter(pv => new Date(pv.created_at) >= filterDate)
      : pageViews;

    const visitCounts: Record<string, number> = {};
    filteredViews.forEach(pv => {
      const path = pv.page_path.split('#')[0].split('?')[0];
      visitCounts[path] = (visitCounts[path] || 0) + 1;
    });

    // Calculate actual visitor paths (transitions from page A to page B)
    const pathTransitions: Record<string, number> = {};
    
    // Group page views by session and sort by time
    const sessionViews: Record<string, { path: string; time: Date }[]> = {};
    filteredViews.forEach(pv => {
      const path = pv.page_path.split('#')[0].split('?')[0];
      if (!sessionViews[pv.session_id]) {
        sessionViews[pv.session_id] = [];
      }
      sessionViews[pv.session_id].push({ path, time: new Date(pv.created_at) });
    });
    
    // For each session, track unique page transitions
    Object.values(sessionViews).forEach(views => {
      views.sort((a, b) => a.time.getTime() - b.time.getTime());
      
      // Track unique transitions per session to avoid counting refreshes
      const seenTransitions = new Set<string>();
      let lastPath: string | null = null;
      
      views.forEach(view => {
        if (lastPath && lastPath !== view.path) {
          const transitionKey = `${lastPath}|${view.path}`;
          if (!seenTransitions.has(transitionKey)) {
            seenTransitions.add(transitionKey);
            pathTransitions[transitionKey] = (pathTransitions[transitionKey] || 0) + 1;
          }
        }
        lastPath = view.path;
      });
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
    const maxPV = Math.max(...Object.values(pathTransitions), 1);

    return { 
      nodes: nodeList, 
      maxVisits: maxV, 
      visitedCount: visited, 
      totalCount: nodeList.length,
      pathHeatmap: pathTransitions,
      maxPathVisits: maxPV
    };
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

  // Group by depth and separate features/learn which have many children
  const depth0 = nodes.filter(n => n.depth === 0);
  
  // Separate L1 into regular pages and "mega" parents (features, learn)
  const megaParents = ['/features', '/learn'];
  const depth1Regular = nodes.filter(n => n.depth === 1 && !megaParents.includes(n.path));
  const depth1Mega = nodes.filter(n => n.depth === 1 && megaParents.includes(n.path));
  
  // Separate L2 children by parent
  const featuresChildren = nodes.filter(n => n.parent === '/features');
  const learnChildren = nodes.filter(n => n.parent === '/learn');
  const otherL2 = nodes.filter(n => n.depth === 2 && n.parent !== '/features' && n.parent !== '/learn');
  
  const depth3 = nodes.filter(n => n.depth >= 3);

  // Layout configuration - compact spacing
  const svgWidth = 1100;
  const baseY = 35;
  const rowHeight = 55; // Reduced from 80
  const sectionGap = 35; // Reduced from 55
  
  // Row sizes - adjusted for narrower width
  const l1RegularRowSize = 10;
  const megaChildRowSize = 11;
  const otherL2RowSize = 10;
  const l3RowSize = 8;
  
  // Calculate rows needed for each section
  const l1RegularRows = Math.ceil(depth1Regular.length / l1RegularRowSize);
  const featuresRows = Math.ceil(featuresChildren.length / megaChildRowSize);
  const learnRows = Math.ceil(learnChildren.length / megaChildRowSize);
  const otherL2Rows = Math.ceil(otherL2.length / otherL2RowSize);
  const l3Rows = Math.ceil(depth3.length / l3RowSize);
  
  // Calculate Y positions for each section - stacked vertically
  const l1RegularStartY = baseY + 60; // Reduced from 90
  const l1RegularEndY = l1RegularStartY + l1RegularRows * rowHeight;
  
  // Features section - full width
  const featuresParentY = l1RegularEndY + sectionGap;
  const featuresChildrenStartY = featuresParentY + 50; // Reduced from 70
  const featuresEndY = featuresChildrenStartY + featuresRows * rowHeight;
  
  // Learn section - below Features, full width
  const learnParentY = featuresEndY + sectionGap;
  const learnChildrenStartY = learnParentY + 50; // Reduced from 70
  const learnEndY = learnChildrenStartY + learnRows * rowHeight;
  
  // Other L2 pages
  const otherL2StartY = learnEndY + sectionGap;
  const otherL2EndY = otherL2StartY + (otherL2Rows > 0 ? otherL2Rows * rowHeight : 0);
  
  // L3+ pages
  const l3StartY = otherL2EndY + (otherL2.length > 0 ? sectionGap : 0);
  const l3EndY = l3StartY + (l3Rows > 0 ? l3Rows * rowHeight : 0);
  
  const svgHeight = l3EndY + 40; // Reduced from 60
  
  const getNodePositions = () => {
    const positions: Record<string, { x: number; y: number }> = {};
    
    // Root (L0)
    positions['/'] = { x: svgWidth / 2, y: baseY };
    
    // L1 Regular pages - spread across full width
    const l1Width = svgWidth - 100;
    depth1Regular.forEach((node, i) => {
      const row = Math.floor(i / l1RegularRowSize);
      const indexInRow = i % l1RegularRowSize;
      const nodesInThisRow = Math.min(l1RegularRowSize, depth1Regular.length - row * l1RegularRowSize);
      const spacing = l1Width / (nodesInThisRow + 1);
      positions[node.path] = { 
        x: 50 + spacing * (indexInRow + 1), 
        y: l1RegularStartY + row * rowHeight 
      };
    });
    
    // Features parent - centered
    positions['/features'] = { x: svgWidth / 2, y: featuresParentY };
    
    // Features children - full width
    const fullWidth = svgWidth - 80;
    featuresChildren.forEach((node, i) => {
      const row = Math.floor(i / megaChildRowSize);
      const indexInRow = i % megaChildRowSize;
      const nodesInThisRow = Math.min(megaChildRowSize, featuresChildren.length - row * megaChildRowSize);
      const spacing = fullWidth / (nodesInThisRow + 1);
      positions[node.path] = { 
        x: 40 + spacing * (indexInRow + 1), 
        y: featuresChildrenStartY + row * rowHeight 
      };
    });
    
    // Learn parent - centered
    positions['/learn'] = { x: svgWidth / 2, y: learnParentY };
    
    // Learn children - full width
    learnChildren.forEach((node, i) => {
      const row = Math.floor(i / megaChildRowSize);
      const indexInRow = i % megaChildRowSize;
      const nodesInThisRow = Math.min(megaChildRowSize, learnChildren.length - row * megaChildRowSize);
      const spacing = fullWidth / (nodesInThisRow + 1);
      positions[node.path] = { 
        x: 40 + spacing * (indexInRow + 1), 
        y: learnChildrenStartY + row * rowHeight 
      };
    });
    
    // Other L2 pages - full width
    if (otherL2.length > 0) {
      const otherWidth = svgWidth - 100;
      otherL2.forEach((node, i) => {
        const row = Math.floor(i / otherL2RowSize);
        const indexInRow = i % otherL2RowSize;
        const nodesInThisRow = Math.min(otherL2RowSize, otherL2.length - row * otherL2RowSize);
        const spacing = otherWidth / (nodesInThisRow + 1);
        positions[node.path] = { 
          x: 50 + spacing * (indexInRow + 1), 
          y: otherL2StartY + row * rowHeight 
        };
      });
    }
    
    // L3+ pages - full width at bottom
    if (depth3.length > 0) {
      const l3Width = svgWidth - 100;
      depth3.forEach((node, i) => {
        const row = Math.floor(i / l3RowSize);
        const indexInRow = i % l3RowSize;
        const nodesInThisRow = Math.min(l3RowSize, depth3.length - row * l3RowSize);
        const spacing = l3Width / (nodesInThisRow + 1);
        positions[node.path] = { 
          x: 50 + spacing * (indexInRow + 1), 
          y: l3StartY + row * rowHeight 
        };
      });
    }
    
    return positions;
  };

  const positions = getNodePositions();
  const allDisplayedNodes = [...depth0, ...depth1Regular, ...depth1Mega, ...featuresChildren, ...learnChildren, ...otherL2, ...depth3];

  // Generate static edges (structural parent-child relationships)
  const structuralEdges: { from: string; to: string; visits: number; isVisited: boolean }[] = [];
  allDisplayedNodes.forEach(node => {
    if (node.parent && positions[node.parent] && positions[node.path]) {
      structuralEdges.push({ 
        from: node.parent, 
        to: node.path, 
        visits: node.visits,
        isVisited: node.isVisited 
      });
    }
  });

  // Generate actual visitor path edges (heatmap paths)
  const visitorPathEdges: { from: string; to: string; count: number; intensity: number }[] = [];
  Object.entries(pathHeatmap).forEach(([key, count]) => {
    const [from, to] = key.split('|');
    if (positions[from] && positions[to]) {
      visitorPathEdges.push({
        from,
        to,
        count,
        intensity: count / maxPathVisits
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
          {/* Demo mode indicator */}
          {demoVisits.length > 0 && (
            <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse">
              <Users className="w-3 h-3 mr-1" />
              Demo Active
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
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />
              Demo
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
              Entry
            </span>
          </div>
        </div>
      </div>

      <div className="relative bg-secondary/30 rounded-2xl p-4 overflow-hidden">
        <svg 
          width="100%" 
          height={svgHeight} 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMin meet"
          className="mx-auto"
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

          {/* Draw structural edges (dimmed) - route along outside edges */}
          {structuralEdges.map((edge, i) => {
            const fromPos = positions[edge.from];
            const toPos = positions[edge.to];
            if (!fromPos || !toPos) return null;
            
            // Check if this path has actual visitor traffic
            const pathKey = `${edge.from}|${edge.to}`;
            const pathTraffic = pathHeatmap[pathKey] || 0;
            const hasTraffic = pathTraffic > 0;
            
            // Skip rendering if there's actual traffic (will be drawn by heatmap paths)
            if (hasTraffic) return null;
            
            // Structural edges are very dim, just showing site structure
            const baseOpacity = edge.isVisited ? 0.15 : 0.08;
            const color = '#6b7280';
            
            // Route lines along the LEFT or RIGHT edge of the diagram to avoid crossing nodes
            // Determine which edge to use based on child position
            const useLeftEdge = toPos.x < svgWidth / 2;
            const edgeX = useLeftEdge ? 20 : svgWidth - 20;
            const cornerRadius = 6;
            
            // For direct parent-child (same vertical line), use straight line
            const dx = Math.abs(toPos.x - fromPos.x);
            
            let pathD: string;
            
            if (dx < 5) {
              // Straight vertical line
              pathD = `M ${fromPos.x} ${fromPos.y + 12} L ${toPos.x} ${toPos.y - 12}`;
            } else {
              // Route along edge: down -> to edge -> along edge -> to child -> down
              const startY = fromPos.y + 12;
              const endY = toPos.y - 12;
              
              pathD = `M ${fromPos.x} ${startY}
                       L ${fromPos.x} ${startY + 8}
                       Q ${fromPos.x} ${startY + 14}, ${fromPos.x + (useLeftEdge ? -6 : 6)} ${startY + 14}
                       L ${edgeX + (useLeftEdge ? 6 : -6)} ${startY + 14}
                       Q ${edgeX} ${startY + 14}, ${edgeX} ${startY + 20}
                       L ${edgeX} ${endY - 20}
                       Q ${edgeX} ${endY - 14}, ${edgeX + (useLeftEdge ? 6 : -6)} ${endY - 14}
                       L ${toPos.x + (useLeftEdge ? -6 : 6)} ${endY - 14}
                       Q ${toPos.x} ${endY - 14}, ${toPos.x} ${endY - 8}
                       L ${toPos.x} ${endY}`;
            }
            
            return (
              <g key={`struct-edge-${i}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={baseOpacity}
                  strokeLinecap="round"
                  strokeDasharray="3 2"
                />
              </g>
            );
          })}

          {/* Historical heatmap paths removed - only showing live/demo paths that fade after 5 seconds */}

          {/* Animated live visitor paths */}
          {activePaths.map((activePath) => {
            const fromPos = positions[activePath.from];
            const toPos = positions[activePath.to];
            if (!fromPos || !toPos) return null;
            
            // Use same edge routing as heatmap paths
            const useLeftEdge = toPos.x < svgWidth / 2;
            const edgeX = useLeftEdge ? 25 : svgWidth - 25;
            const dx = Math.abs(toPos.x - fromPos.x);
            
            let pathD: string;
            
            if (dx < 5) {
              pathD = `M ${fromPos.x} ${fromPos.y + 12} L ${toPos.x} ${toPos.y - 12}`;
            } else {
              const startY = fromPos.y + 12;
              const endY = toPos.y - 12;
              
              pathD = `M ${fromPos.x} ${startY}
                       L ${fromPos.x} ${startY + 8}
                       Q ${fromPos.x} ${startY + 14}, ${fromPos.x + (useLeftEdge ? -6 : 6)} ${startY + 14}
                       L ${edgeX + (useLeftEdge ? 6 : -6)} ${startY + 14}
                       Q ${edgeX} ${startY + 14}, ${edgeX} ${startY + 20}
                       L ${edgeX} ${endY - 20}
                       Q ${edgeX} ${endY - 14}, ${edgeX + (useLeftEdge ? 6 : -6)} ${endY - 14}
                       L ${toPos.x + (useLeftEdge ? -6 : 6)} ${endY - 14}
                       Q ${toPos.x} ${endY - 14}, ${toPos.x} ${endY - 8}
                       L ${toPos.x} ${endY}`;
            }
            
            return (
              <g key={activePath.id}>
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
                {/* Animated dot traveling along path - 5 second journey */}
                <circle r="8" fill="#06b6d4" filter="url(#glow)">
                  <animateMotion
                    dur="4s"
                    repeatCount="1"
                    path={pathD}
                    fill="freeze"
                  />
                  <animate
                    attributeName="opacity"
                    values="1;1;0"
                    dur="5s"
                    fill="freeze"
                  />
                </circle>
                <circle r="4" fill="#ffffff">
                  <animateMotion
                    dur="4s"
                    repeatCount="1"
                    path={pathD}
                    fill="freeze"
                  />
                  <animate
                    attributeName="opacity"
                    values="1;1;0"
                    dur="5s"
                    fill="freeze"
                  />
                </circle>
                {/* Trail effect */}
                <circle r="5" fill="#06b6d4" opacity="0.5">
                  <animateMotion
                    dur="4s"
                    repeatCount="1"
                    path={pathD}
                    fill="freeze"
                    begin="0.3s"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0.5;0"
                    dur="5s"
                    fill="freeze"
                  />
                </circle>
              </g>
            );
          })}

          {/* Demo visitor paths - purple themed */}
          {demoPaths.map((demoPath) => {
            const fromPos = positions[demoPath.from];
            const toPos = positions[demoPath.to];
            if (!fromPos || !toPos) return null;
            
            // Get node sizes for accurate endpoint calculation
            const fromNode = allDisplayedNodes.find(n => n.path === demoPath.from);
            const toNode = allDisplayedNodes.find(n => n.path === demoPath.to);
            const fromNodeSize = fromNode ? (fromNode.depth === 0 ? 18 : fromNode.depth === 1 ? 12 : 8) : 12;
            const toNodeSize = toNode ? (toNode.depth === 0 ? 18 : toNode.depth === 1 ? 12 : 8) : 12;
            
            const useLeftEdge = toPos.x < svgWidth / 2;
            const edgeX = useLeftEdge ? 25 : svgWidth - 25;
            const dx = Math.abs(toPos.x - fromPos.x);
            
            let pathD: string;
            
            if (dx < 5) {
              // Direct vertical path - end exactly at node edge
              pathD = `M ${fromPos.x} ${fromPos.y + fromNodeSize} L ${toPos.x} ${toPos.y - toNodeSize}`;
            } else {
              const startY = fromPos.y + fromNodeSize;
              const endY = toPos.y - toNodeSize;
              
              pathD = `M ${fromPos.x} ${startY}
                       L ${fromPos.x} ${startY + 8}
                       Q ${fromPos.x} ${startY + 14}, ${fromPos.x + (useLeftEdge ? -6 : 6)} ${startY + 14}
                       L ${edgeX + (useLeftEdge ? 6 : -6)} ${startY + 14}
                       Q ${edgeX} ${startY + 14}, ${edgeX} ${startY + 20}
                       L ${edgeX} ${endY - 20}
                       Q ${edgeX} ${endY - 14}, ${edgeX + (useLeftEdge ? 6 : -6)} ${endY - 14}
                       L ${toPos.x + (useLeftEdge ? -6 : 6)} ${endY - 14}
                       Q ${toPos.x} ${endY - 14}, ${toPos.x} ${endY - 8}
                       L ${toPos.x} ${toPos.y - toNodeSize}`;
            }
            
            return (
              <g key={demoPath.id} style={{ opacity: demoPath.opacity }}>
                {/* Purple glow effect - slimmer */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth={4}
                  strokeOpacity={0.3 * demoPath.opacity}
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
                {/* Main purple path - thinner */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeOpacity={0.8 * demoPath.opacity}
                  strokeLinecap="round"
                  strokeDasharray="6 3"
                />
                {/* Animated traveling dot - smaller */}
                <circle r="5" fill="#a855f7" filter="url(#glow)" style={{ opacity: demoPath.opacity }}>
                  <animateMotion
                    dur="3s"
                    repeatCount="1"
                    path={pathD}
                    fill="freeze"
                  />
                </circle>
                <circle r="3" fill="#c084fc" style={{ opacity: demoPath.opacity }}>
                  <animateMotion
                    dur="3s"
                    repeatCount="1"
                    path={pathD}
                    fill="freeze"
                  />
                </circle>
                <circle r="1.5" fill="#ffffff" style={{ opacity: demoPath.opacity }}>
                  <animateMotion
                    dur="3s"
                    repeatCount="1"
                    path={pathD}
                    fill="freeze"
                  />
                </circle>
                {/* Trail particles - smaller */}
                {[0.2, 0.4].map((delay, i) => (
                  <circle key={i} r={2 - i * 0.5} fill="#a855f7" style={{ opacity: (0.4 - i * 0.1) * demoPath.opacity }}>
                    <animateMotion
                      dur="3s"
                      repeatCount="1"
                      path={pathD}
                      fill="freeze"
                      begin={`${delay}s`}
                    />
                  </circle>
                ))}
              </g>
            );
          })}
          
          {/* Draw nodes */}
          {allDisplayedNodes.map((node) => {
            const pos = positions[node.path];
            if (!pos) return null;
            
            const intensity = node.visits / maxVisits;
            const color = getHeatColor(intensity, node.isVisited);
            const nodeSize = node.depth === 0 ? 18 : node.depth === 1 ? 12 : 8;
            const baseOpacity = node.isVisited ? 1 : 0.35;
            const isFiltered = activeFilter === node.path;
            const isDimmed = activeFilter && activeFilter !== node.path;
            const opacity = isDimmed ? 0.2 : baseOpacity;
            const liveCount = visitorsByNode[node.path] || 0;
            const hasLiveVisitor = liveCount > 0;
            
            // Check for demo visit on this node
            const demoVisit = demoVisits.find(d => d.path === node.path);
            const hasDemoVisit = !!demoVisit;
            
            const handleNodeClick = () => {
              if (onPageFilter) {
                if (activeFilter === node.path) {
                  onPageFilter(null); // Clear filter
                } else {
                  onPageFilter(node.path); // Set filter
                }
              }
            };
            
            return (
              <g 
                key={node.path} 
                className="cursor-pointer" 
                style={{ opacity }}
                onClick={handleNodeClick}
              >
                {/* Demo visitor ring - purple for normal, orange starburst for non-home entry */}
                {hasDemoVisit && (
                  <>
                    {demoVisit?.isEntryPoint ? (
                      /* Orange starburst animation for non-home entry points */
                      <>
                        {/* Outer expanding ring */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={nodeSize + 14}
                          fill="none"
                          stroke="#f97316"
                          strokeWidth={2}
                          strokeOpacity={0.7 * (demoVisit?.opacity || 1)}
                          className="animate-ping"
                          style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                        />
                        {/* Inner glow */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={nodeSize + 8}
                          fill="#f97316"
                          opacity={0.25 * (demoVisit?.opacity || 1)}
                          filter="url(#glow)"
                        />
                        {/* Starburst rays */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                          <line
                            key={angle}
                            x1={pos.x + Math.cos(angle * Math.PI / 180) * (nodeSize + 4)}
                            y1={pos.y + Math.sin(angle * Math.PI / 180) * (nodeSize + 4)}
                            x2={pos.x + Math.cos(angle * Math.PI / 180) * (nodeSize + 18)}
                            y2={pos.y + Math.sin(angle * Math.PI / 180) * (nodeSize + 18)}
                            stroke="#fb923c"
                            strokeWidth={1.5}
                            strokeOpacity={0.8 * (demoVisit?.opacity || 1)}
                            strokeLinecap="round"
                          >
                            <animate
                              attributeName="stroke-opacity"
                              values={`${0.8 * (demoVisit?.opacity || 1)};${0.3 * (demoVisit?.opacity || 1)};${0.8 * (demoVisit?.opacity || 1)}`}
                              dur="0.5s"
                              repeatCount="indefinite"
                            />
                          </line>
                        ))}
                        {/* Referrer badge */}
                        {(() => {
                          const referrer = demoVisit?.referrer;
                          const getReferrerConfig = (ref: ReferrerType | undefined) => {
                            switch (ref) {
                              case 'google': return { label: 'Google', color: '#4285f4', icon: 'G' };
                              case 'bing': return { label: 'Bing', color: '#00809d', icon: 'B' };
                              case 'social': return { label: 'Social', color: '#e1306c', icon: '◎' };
                              case 'email': return { label: 'Email', color: '#ea4335', icon: '✉' };
                              case 'referral': return { label: 'Referral', color: '#34a853', icon: '↗' };
                              case 'direct': 
                              default: return { label: 'Direct', color: '#6b7280', icon: '⚡' };
                            }
                          };
                          const config = getReferrerConfig(referrer);
                          const badgeWidth = config.label.length * 5 + 16;
                          
                          return (
                            <>
                              {/* Badge background */}
                              <rect
                                x={pos.x - badgeWidth / 2}
                                y={pos.y - nodeSize - 24}
                                width={badgeWidth}
                                height={14}
                                rx={7}
                                fill={config.color}
                                opacity={demoVisit?.opacity || 1}
                              />
                              {/* Badge icon */}
                              <text
                                x={pos.x - badgeWidth / 2 + 8}
                                y={pos.y - nodeSize - 14}
                                textAnchor="middle"
                                fill="white"
                                style={{ fontSize: '8px', fontWeight: 'bold' }}
                                opacity={demoVisit?.opacity || 1}
                              >
                                {config.icon}
                              </text>
                              {/* Badge text */}
                              <text
                                x={pos.x + 4}
                                y={pos.y - nodeSize - 14}
                                textAnchor="middle"
                                fill="white"
                                style={{ fontSize: '8px', fontWeight: '600' }}
                                opacity={demoVisit?.opacity || 1}
                              >
                                {config.label}
                              </text>
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      /* Normal purple demo ring */
                      <>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={nodeSize + 10}
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth={1.5}
                          strokeOpacity={0.6 * (demoVisit?.opacity || 1)}
                          className="animate-ping"
                          style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={nodeSize + 6}
                          fill="#a855f7"
                          opacity={0.15 * (demoVisit?.opacity || 1)}
                          filter="url(#glow)"
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={nodeSize + 4}
                          fill="none"
                          stroke="#c084fc"
                          strokeWidth={1}
                          strokeOpacity={0.7 * (demoVisit?.opacity || 1)}
                          strokeDasharray="3 2"
                        />
                      </>
                    )}
                  </>
                )}
                {/* Active filter highlight */}
                {isFiltered && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={nodeSize + 14}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth={3}
                    strokeDasharray="6 3"
                    className="animate-pulse"
                  />
                )}
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
                {/* Label - above icon for main pages (depth 0 and 1), below for others */}
                {node.depth <= 1 ? (
                  <>
                    {/* Label above for main pages */}
                    <text
                      x={pos.x}
                      y={pos.y - nodeSize - 8}
                      textAnchor="middle"
                      className="fill-foreground font-medium"
                      style={{ 
                        fontSize: node.depth === 0 ? '11px' : '9px',
                        opacity: node.isVisited ? 1 : 0.6
                      }}
                    >
                      {node.name}
                    </text>
                    {/* Visit count below the node */}
                    {node.visits > 0 && (
                      <text
                        x={pos.x}
                        y={pos.y + nodeSize + 14}
                        textAnchor="middle"
                        className="fill-muted-foreground"
                        style={{ fontSize: '7px' }}
                      >
                        {node.visits}
                      </text>
                    )}
                  </>
                ) : (
                  <>
                    {/* Label below and angled for L2+ */}
                    <text
                      x={pos.x}
                      y={pos.y + nodeSize + 12}
                      textAnchor="start"
                      className="fill-foreground font-medium"
                      style={{ 
                        fontSize: '8px',
                        opacity: node.isVisited ? 1 : 0.6
                      }}
                      transform={`rotate(35, ${pos.x}, ${pos.y + nodeSize + 12})`}
                    >
                      {node.name}
                    </text>
                  </>
                )}
              </g>
            );
          })}
          
          {/* Depth labels */}
          <text x={12} y={baseY + 5} className="fill-muted-foreground" style={{ fontSize: '10px' }}>Root</text>
          <text x={12} y={l1RegularStartY + 5} className="fill-muted-foreground" style={{ fontSize: '10px' }}>L1</text>
          <text x={12} y={featuresParentY + 5} className="fill-muted-foreground" style={{ fontSize: '10px' }}>Features</text>
          <text x={12} y={learnParentY + 5} className="fill-muted-foreground" style={{ fontSize: '10px' }}>Learn</text>
          {otherL2.length > 0 && (
            <text x={12} y={otherL2StartY + 5} className="fill-muted-foreground" style={{ fontSize: '10px' }}>Other L2</text>
          )}
          {depth3.length > 0 && (
            <text x={12} y={l3StartY + 5} className="fill-muted-foreground" style={{ fontSize: '10px' }}>L3+</text>
          )}
        </svg>
      </div>

      {/* Stats summary */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
        <span>{allDisplayedNodes.length} pages shown</span>
        <span className="hidden sm:inline">{allDisplayedNodes.filter(n => n.isVisited).length} visited</span>
        <span className="hidden md:inline">{visitorPathEdges.length} visitor paths</span>
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
