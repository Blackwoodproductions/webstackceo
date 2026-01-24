import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GitBranch, Zap, Users, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
  visitsPerDay: number;
  todayVisits: number;
  depth: number;
  parent: string | null;
  isVisited: boolean;
  isTool: boolean;
}

interface LiveVisitor {
  id: string;
  currentPath: string;
  displayPath: string; // Path to show in UI (stays on old page during transit)
  previousPath: string | null;
  timestamp: number;
  inTransit: boolean; // True while animation is playing
}

type TimeRange = 'live' | 'yesterday' | 'week' | 'month' | '6months' | '1year' | 'custom';

const getTimeRangeFilter = (range: TimeRange, customStart?: Date): Date | null => {
  const now = new Date();
  switch (range) {
    case 'live':
      // Last 15 minutes for "live" view
      const fifteenMinAgo = new Date(now);
      fifteenMinAgo.setMinutes(fifteenMinAgo.getMinutes() - 15);
      return fifteenMinAgo;
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return yesterday;
    case 'week':
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo;
    case 'month':
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo;
    case '6months':
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return sixMonthsAgo;
    case '1year':
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return oneYearAgo;
    case 'custom':
      return customStart || null;
  }
};

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
  
  // Tools sub-pages (L2) - includes Domain Audits as central tool
  { path: '/tools/domain-audit', parent: '/tools', category: 'tools' },
  { path: '/tools/keyword-checker', parent: '/tools', category: 'tools' },
  { path: '/audits', parent: '/tools', category: 'tools' },
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

interface VisitorFlowDiagramProps {
  onPageFilter?: (pagePath: string | null) => void;
  activeFilter?: string | null;
}

const VisitorFlowDiagram = ({ onPageFilter, activeFilter }: VisitorFlowDiagramProps) => {
  const [pageViews, setPageViews] = useState<{ page_path: string; created_at: string; session_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('live');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitor[]>([]);
  const [activePaths, setActivePaths] = useState<{ from: string; to: string; id: string }[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [demoPaths, setDemoPaths] = useState<{ from: string; to: string; id: string; isExternal?: boolean }[]>([]);
  const [externalReferrerPages, setExternalReferrerPages] = useState<Set<string>>(new Set());

  // Fetch initial data including active sessions and external referrers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        // Fetch page views, active sessions, and sessions with external referrers in parallel
        const [pageViewsRes, activeSessionsRes, referrerSessionsRes] = await Promise.all([
          supabase
            .from('page_views')
            .select('page_path, created_at, session_id')
            .order('created_at', { ascending: false })
            .limit(5000),
          supabase
            .from('visitor_sessions')
            .select('session_id, last_activity_at')
            .gte('last_activity_at', fiveMinutesAgo),
          supabase
            .from('visitor_sessions')
            .select('first_page, referrer')
            .not('referrer', 'is', null)
        ]);
        
        setPageViews(pageViewsRes.data || []);
        
        // Track pages that have external referrers
        if (referrerSessionsRes.data) {
          const externalPages = new Set<string>();
          referrerSessionsRes.data.forEach(session => {
            if (session.referrer && session.first_page) {
              // Check if referrer is external (not our own domain)
              try {
                const referrerHost = new URL(session.referrer).hostname;
                if (!referrerHost.includes('localhost') && 
                    !referrerHost.includes('lovable.app') &&
                    !referrerHost.includes('webstackceo')) {
                  let cleanPath = session.first_page.split('#')[0].split('?')[0];
                  if (cleanPath.startsWith('/audit/') || cleanPath === '/audit') {
                    cleanPath = '/audits';
                  }
                  externalPages.add(cleanPath);
                }
              } catch (e) {
                // Invalid URL, skip
              }
            }
          });
          setExternalReferrerPages(externalPages);
        }
        
        // Get last page for each active session
        if (activeSessionsRes.data && activeSessionsRes.data.length > 0) {
          const sessionIds = activeSessionsRes.data.map(s => s.session_id);
          
          // Get most recent page view for each active session
          const { data: recentPages } = await supabase
            .from('page_views')
            .select('page_path, session_id, created_at')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: false });
          
          if (recentPages) {
            // Group by session and take most recent page
            const sessionPages: Record<string, { path: string; time: number }> = {};
            recentPages.forEach(pv => {
              let cleanPath = pv.page_path.split('#')[0].split('?')[0];
              if (cleanPath.startsWith('/audit/') || cleanPath === '/audit') {
                cleanPath = '/audits';
              }
              if (!sessionPages[pv.session_id]) {
                sessionPages[pv.session_id] = { 
                  path: cleanPath, 
                  time: new Date(pv.created_at).getTime() 
                };
              }
            });
            
            // Initialize live visitors from active sessions
            const initialVisitors: LiveVisitor[] = Object.entries(sessionPages).map(([sessionId, data]) => ({
              id: sessionId,
              currentPath: data.path,
              displayPath: data.path,
              previousPath: null,
              timestamp: data.time,
              inTransit: false
            }));
            
            setLiveVisitors(initialVisitors);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Subscribe to realtime page views and session updates
  useEffect(() => {
    const channel = supabase
      .channel('live-visitor-tracking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'page_views',
        },
        (payload) => {
          const newView = payload.new as { page_path: string; created_at: string; session_id: string };
          
          // Add to page views
          setPageViews(prev => [newView, ...prev].slice(0, 5000));
          
          // Track live visitor movement
          setLiveVisitors(prev => {
            const existing = prev.find(v => v.id === newView.session_id);
            let cleanPath = newView.page_path.split('#')[0].split('?')[0];
            // Aggregate all /audit/* paths into /audits
            if (cleanPath.startsWith('/audit/') || cleanPath === '/audit') {
              cleanPath = '/audits';
            }
            
            if (existing) {
              // Visitor moved to new page - create animated path
              if (existing.currentPath !== cleanPath) {
                const pathId = `${existing.currentPath}-${cleanPath}-${Date.now()}`;
                const sessionId = newView.session_id;
                const targetPath = cleanPath;
                
                setActivePaths(paths => [...paths, { 
                  from: existing.currentPath, 
                  to: cleanPath, 
                  id: pathId 
                }]);
                
                // After 5 seconds: remove trail and update displayPath to new location
                setTimeout(() => {
                  setActivePaths(paths => paths.filter(p => p.id !== pathId));
                  // Now transfer the visitor badge to the new page
                  setLiveVisitors(visitors => 
                    visitors.map(v => 
                      v.id === sessionId 
                        ? { ...v, displayPath: targetPath, inTransit: false }
                        : v
                    )
                  );
                }, 5000);
                
                // Immediately update currentPath but keep displayPath on old page (in transit)
                return prev.map(v => 
                  v.id === newView.session_id 
                    ? { 
                        ...v, 
                        previousPath: v.currentPath, 
                        currentPath: cleanPath, 
                        // displayPath stays on old page during transit
                        inTransit: true,
                        timestamp: Date.now() 
                      }
                    : v
                );
              }
              
              // Same page, just update timestamp
              return prev.map(v => 
                v.id === newView.session_id 
                  ? { ...v, timestamp: Date.now() }
                  : v
              );
            } else {
              // New visitor - show immediately on their page
              return [...prev, { 
                id: newView.session_id, 
                currentPath: cleanPath, 
                displayPath: cleanPath,
                previousPath: null, 
                timestamp: Date.now(),
                inTransit: false
              }];
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'visitor_sessions',
        },
        (payload) => {
          // Update visitor timestamp when their session is updated (they're still active)
          const session = payload.new as { session_id: string; last_activity_at: string };
          setLiveVisitors(prev => 
            prev.map(v => 
              v.id === session.session_id 
                ? { ...v, timestamp: new Date(session.last_activity_at).getTime() }
                : v
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visitor_sessions',
        },
        async (payload) => {
          // New session started - fetch their first page
          const session = payload.new as { session_id: string; first_page: string | null };
          if (session.first_page) {
            let cleanPath = session.first_page.split('#')[0].split('?')[0];
            if (cleanPath.startsWith('/audit/') || cleanPath === '/audit') {
              cleanPath = '/audits';
            }
            setLiveVisitors(prev => {
              // Only add if not already tracked
              if (prev.find(v => v.id === session.session_id)) return prev;
              return [...prev, {
                id: session.session_id,
                currentPath: cleanPath,
                displayPath: cleanPath,
                previousPath: null,
                timestamp: Date.now(),
                inTransit: false
              }];
            });
          }
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

  // Demo mode - simulate visitor traces every 15 seconds
  useEffect(() => {
    if (!demoMode) {
      setDemoPaths([]);
      return;
    }

    const demoPages = ['/', '/about', '/features', '/pricing', '/contact', '/tools', '/learn', '/faq', '/directory'];
    const externalSources = ['google.com', 'facebook.com', 'linkedin.com', 'twitter.com'];
    
    const runDemo = () => {
      // Randomly decide: internal navigation or external entry
      const isExternal = Math.random() > 0.6;
      
      if (isExternal) {
        // External entry - visitor arrives from offsite
        const targetPage = demoPages[Math.floor(Math.random() * demoPages.length)];
        const source = externalSources[Math.floor(Math.random() * externalSources.length)];
        const pathId = `demo-external-${Date.now()}`;
        
        setDemoPaths(paths => [...paths, { 
          from: `external:${source}`, 
          to: targetPage, 
          id: pathId,
          isExternal: true 
        }]);
        
        setTimeout(() => {
          setDemoPaths(paths => paths.filter(p => p.id !== pathId));
        }, 5000);
      } else {
        // Internal navigation
        const fromIndex = Math.floor(Math.random() * demoPages.length);
        let toIndex = Math.floor(Math.random() * demoPages.length);
        while (toIndex === fromIndex) {
          toIndex = Math.floor(Math.random() * demoPages.length);
        }
        
        const pathId = `demo-${Date.now()}`;
        setDemoPaths(paths => [...paths, { 
          from: demoPages[fromIndex], 
          to: demoPages[toIndex], 
          id: pathId 
        }]);
        
        setTimeout(() => {
          setDemoPaths(paths => paths.filter(p => p.id !== pathId));
        }, 5000);
      }
    };

    // Run immediately and then every 15 seconds
    runDemo();
    const interval = setInterval(runDemo, 15000);

    return () => clearInterval(interval);
  }, [demoMode]);

  const { nodes, maxVisits, visitedCount, totalCount, pathHeatmap, maxPathVisits } = useMemo(() => {
    const filterDate = getTimeRangeFilter(timeRange, customDateRange.from);
    const filterEndDate = timeRange === 'custom' && customDateRange.to ? customDateRange.to : null;
    
    let filteredViews = filterDate 
      ? pageViews.filter(pv => new Date(pv.created_at) >= filterDate)
      : pageViews;
    
    // Apply end date filter for custom range
    if (filterEndDate) {
      const endOfDay = new Date(filterEndDate);
      endOfDay.setHours(23, 59, 59, 999);
      filteredViews = filteredViews.filter(pv => new Date(pv.created_at) <= endOfDay);
    }

    const visitCounts: Record<string, number> = {};
    filteredViews.forEach(pv => {
      let path = pv.page_path.split('#')[0].split('?')[0];
      // Aggregate all /audit/* paths into /audits
      if (path.startsWith('/audit/') || path === '/audit') {
        path = '/audits';
      }
      visitCounts[path] = (visitCounts[path] || 0) + 1;
    });

    // Calculate actual visitor paths (transitions from page A to page B)
    const pathTransitions: Record<string, number> = {};
    
    // Group page views by session and sort by time
    const sessionViews: Record<string, { path: string; time: Date }[]> = {};
    filteredViews.forEach(pv => {
      let path = pv.page_path.split('#')[0].split('?')[0];
      // Aggregate all /audit/* paths into /audits
      if (path.startsWith('/audit/') || path === '/audit') {
        path = '/audits';
      }
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
    
    // Calculate days in range for per-day averages
    const now = new Date();
    let daysInRange = 1;
    if (filteredViews.length > 0) {
      // Calculate from earliest view
      const earliest = new Date(Math.min(...filteredViews.map(v => new Date(v.created_at).getTime())));
      daysInRange = Math.max(1, Math.ceil((now.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)));
    }
    
    // Calculate today's visits separately
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayVisitCounts: Record<string, number> = {};
    pageViews.forEach(pv => {
      if (new Date(pv.created_at) >= todayStart) {
        let path = pv.page_path.split('#')[0].split('?')[0];
        if (path.startsWith('/audit/') || path === '/audit') {
          path = '/audits';
        }
        todayVisitCounts[path] = (todayVisitCounts[path] || 0) + 1;
      }
    });
    
    // Define tool paths for special display
    const toolPaths = ['/tools', '/audits', '/tools/domain-audit', '/tools/keyword-checker', '/tools/backlink-analyzer', '/tools/site-speed'];
    
    SITE_STRUCTURE.forEach(({ path, parent, category }) => {
      const depth = path === '/' ? 0 : path.split('/').filter(Boolean).length;
      const visits = visitCounts[path] || 0;
      const isTool = toolPaths.includes(path) || category === 'tools';
      nodeMap[path] = {
        path,
        name: formatPageName(path),
        visits,
        visitsPerDay: Math.round((visits / daysInRange) * 10) / 10,
        todayVisits: todayVisitCounts[path] || 0,
        depth,
        parent,
        isVisited: visits > 0,
        isTool,
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
        const isTool = toolPaths.includes(path) || path.startsWith('/tools');
        
        nodeMap[path] = {
          path,
          name: formatPageName(path),
          visits,
          visitsPerDay: Math.round((visits / daysInRange) * 10) / 10,
          todayVisits: todayVisitCounts[path] || 0,
          depth,
          parent,
          isVisited: true,
          isTool,
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
  }, [pageViews, timeRange, customDateRange]);

  const getHeatColor = useCallback((intensity: number, isVisited: boolean) => {
    if (!isVisited) return '#6b7280'; // gray for unvisited
    if (intensity > 0.7) return '#3b82f6'; // blue for high
    if (intensity > 0.4) return '#22c55e'; // green for medium
    if (intensity > 0.1) return '#eab308'; // yellow for low
    return '#eab308'; // yellow default for visited
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

  // Group by depth and separate features/learn/tools which have many children
  const depth0 = nodes.filter(n => n.depth === 0);
  
  // Separate L1 into regular pages and "mega" parents (features, learn, tools)
  const megaParents = ['/features', '/learn', '/tools'];
  // Exclude /audits from regular L1 since it's a child of /tools despite being depth 1
  const depth1Regular = nodes.filter(n => n.depth === 1 && !megaParents.includes(n.path) && n.parent !== '/tools');
  const depth1Mega = nodes.filter(n => n.depth === 1 && megaParents.includes(n.path));
  
  // Separate L2 children by parent (includes /audits which has parent /tools)
  const featuresChildren = nodes.filter(n => n.parent === '/features');
  const learnChildren = nodes.filter(n => n.parent === '/learn');
  
  // Sort tools children by SITE_STRUCTURE order to keep /audits centered
  const toolsOrder = ['/tools/domain-audit', '/tools/keyword-checker', '/audits', '/tools/backlink-analyzer', '/tools/site-speed'];
  const toolsChildren = nodes
    .filter(n => n.parent === '/tools')
    .sort((a, b) => {
      const aIndex = toolsOrder.indexOf(a.path);
      const bIndex = toolsOrder.indexOf(b.path);
      // If not in order array, put at end
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  const otherL2 = nodes.filter(n => n.depth === 2 && n.parent !== '/features' && n.parent !== '/learn' && n.parent !== '/tools');
  
  const depth3 = nodes.filter(n => n.depth >= 3);

  // Layout configuration - compact spacing
  const svgWidth = 1100;
  const baseY = 35;
  const rowHeight = 55;
  const sectionGap = 35;
  
  // Row sizes - adjusted for narrower width
  const l1RegularRowSize = 10;
  const megaChildRowSize = 11;
  const otherL2RowSize = 10;
  const l3RowSize = 8;
  
  // Calculate rows needed for each section
  const l1RegularRows = Math.ceil(depth1Regular.length / l1RegularRowSize);
  const featuresRows = Math.ceil(featuresChildren.length / megaChildRowSize);
  const learnRows = Math.ceil(learnChildren.length / megaChildRowSize);
  const toolsRows = Math.ceil(toolsChildren.length / megaChildRowSize);
  const otherL2Rows = Math.ceil(otherL2.length / otherL2RowSize);
  const l3Rows = Math.ceil(depth3.length / l3RowSize);
  
  // Calculate Y positions for each section - stacked vertically
  const l1RegularStartY = baseY + 60;
  const l1RegularEndY = l1RegularStartY + l1RegularRows * rowHeight;
  
  // Features section - full width
  const featuresParentY = l1RegularEndY + sectionGap;
  const featuresChildrenStartY = featuresParentY + 50;
  const featuresEndY = featuresChildrenStartY + featuresRows * rowHeight;
  
  // Learn section - below Features, full width
  const learnParentY = featuresEndY + sectionGap;
  const learnChildrenStartY = learnParentY + 50;
  const learnEndY = learnChildrenStartY + learnRows * rowHeight;
  
  // Tools section - below Learn, full width
  const toolsParentY = learnEndY + sectionGap;
  const toolsChildrenStartY = toolsParentY + 50;
  const toolsEndY = toolsChildrenStartY + (toolsRows > 0 ? toolsRows * rowHeight : 0);
  
  // Other L2 pages
  const otherL2StartY = toolsEndY + sectionGap;
  const otherL2EndY = otherL2StartY + (otherL2Rows > 0 ? otherL2Rows * rowHeight : 0);
  
  // L3+ pages
  const l3StartY = otherL2EndY + (otherL2.length > 0 ? sectionGap : 0);
  const l3EndY = l3StartY + (l3Rows > 0 ? l3Rows * rowHeight : 0);
  
  const svgHeight = l3EndY + 40;
  
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
    
    // Tools parent - centered
    positions['/tools'] = { x: svgWidth / 2, y: toolsParentY };
    
    // Tools children - full width, with /audits offset down for its larger icon
    toolsChildren.forEach((node, i) => {
      const row = Math.floor(i / megaChildRowSize);
      const indexInRow = i % megaChildRowSize;
      const nodesInThisRow = Math.min(megaChildRowSize, toolsChildren.length - row * megaChildRowSize);
      const spacing = fullWidth / (nodesInThisRow + 1);
      const yOffset = node.path === '/audits' ? 30 : 0; // Extra space for larger audits icon
      positions[node.path] = { 
        x: 40 + spacing * (indexInRow + 1), 
        y: toolsChildrenStartY + row * rowHeight + yOffset
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
  const allDisplayedNodes = [...depth0, ...depth1Regular, ...depth1Mega, ...featuresChildren, ...learnChildren, ...toolsChildren, ...otherL2, ...depth3];

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

  // Get visitors on each node - use displayPath to keep count on old page during transit
  const visitorsByNode: Record<string, number> = {};
  liveVisitors.forEach(v => {
    const path = v.displayPath; // Use displayPath instead of currentPath
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
            <h3 className="font-bold text-foreground">Site Traffic Flow</h3>
            <p className="text-xs text-muted-foreground">
              {visitedCount} of {totalCount} pages visited
            </p>
          </div>
          {/* Live visitors indicator */}
          {liveVisitors.length > 0 && (
            <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
              <Zap className="w-3 h-3 mr-1" />
              {liveVisitors.length} live now
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg z-50">
                <SelectItem value="live">Live Now</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Custom Date Range Picker */}
          {timeRange === 'custom' && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 text-xs justify-start text-left font-normal",
                      !customDateRange.from && "text-muted-foreground"
                    )}
                  >
                    {customDateRange.from ? format(customDateRange.from, "MMM d, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border border-border z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={customDateRange.from}
                    onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 text-xs justify-start text-left font-normal",
                      !customDateRange.to && "text-muted-foreground"
                    )}
                  >
                    {customDateRange.to ? format(customDateRange.to, "MMM d, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border border-border z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={customDateRange.to}
                    onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Demo Mode Toggle */}
          <Button
            variant={demoMode ? "default" : "outline"}
            size="sm"
            onClick={() => setDemoMode(!demoMode)}
            className={cn(
              "h-8 text-xs",
              demoMode && "bg-purple-600 hover:bg-purple-700"
            )}
          >
            <Zap className="w-3 h-3 mr-1" />
            {demoMode ? "Demo On" : "Demo"}
          </Button>

          {/* Legend */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground pl-4 border-l border-border flex-wrap">
            <span className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">37</span>
              </div>
              Views
            </span>
            <span className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">2</span>
              </div>
              Live
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-500 opacity-40" />
              Unvisited
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 border-orange-500 border-dashed" />
              External
            </span>
            {demoMode && (
              <span className="flex items-center gap-1 text-purple-400">
                <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                Demo
              </span>
            )}
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

          {/* Structural edges removed for cleaner appearance - only live/demo paths shown */}

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

          {/* Demo mode paths */}
          {demoMode && demoPaths.map((demoPath) => {
            const toPos = positions[demoPath.to];
            if (!toPos) return null;
            
            // For external entries, animate from top of SVG
            if (demoPath.isExternal) {
              const startY = 0;
              const pathD = `M ${toPos.x} ${startY} L ${toPos.x} ${toPos.y - 12}`;
              
              return (
                <g key={demoPath.id}>
                  {/* Starburst effect at entry point */}
                  <circle
                    cx={toPos.x}
                    cy={toPos.y}
                    r={20}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={2}
                    opacity={0.8}
                  >
                    <animate
                      attributeName="r"
                      values="8;25;8"
                      dur="1s"
                      repeatCount="3"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.8;0.2;0.8"
                      dur="1s"
                      repeatCount="3"
                    />
                  </circle>
                  {/* Entry path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={4}
                    strokeOpacity={0.6}
                    strokeLinecap="round"
                    filter="url(#glow)"
                    className="animate-pulse"
                  />
                  {/* Traveling dot */}
                  <circle r="6" fill="#f97316" filter="url(#glow)">
                    <animateMotion
                      dur="2s"
                      repeatCount="1"
                      path={pathD}
                      fill="freeze"
                    />
                  </circle>
                  {/* External source badge */}
                  <rect
                    x={toPos.x - 35}
                    y={-5}
                    width={70}
                    height={16}
                    rx={8}
                    fill="#f97316"
                  />
                  <text
                    x={toPos.x}
                    y={7}
                    textAnchor="middle"
                    fill="white"
                    style={{ fontSize: '9px', fontWeight: 'bold' }}
                  >
                    {demoPath.from.replace('external:', '')}
                  </text>
                </g>
              );
            }
            
            // Internal navigation paths
            const fromPos = positions[demoPath.from];
            if (!fromPos) return null;
            
            const useLeftEdge = toPos.x < 550;
            const edgeX = useLeftEdge ? 25 : 1075;
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
              <g key={demoPath.id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth={5}
                  strokeOpacity={0.5}
                  strokeLinecap="round"
                  filter="url(#glow)"
                  className="animate-pulse"
                />
                <circle r="7" fill="#a855f7" filter="url(#glow)">
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
              </g>
            );
          })}
          
          {/* Draw nodes */}
          {allDisplayedNodes.map((node) => {
            const pos = positions[node.path];
            if (!pos) return null;
            
            const intensity = node.visits / maxVisits;
            const color = getHeatColor(intensity, node.isVisited);
            // Make /audits a mega node (aggregates all domain audits)
            // Features, Learn, Tools get same size as Home (depth 0)
            const isMegaAggregateNode = node.path === '/audits';
            const isMegaParent = ['/features', '/learn', '/tools'].includes(node.path);
            const nodeSize = isMegaAggregateNode ? 24 : (node.depth === 0 || isMegaParent) ? 18 : node.depth === 1 ? 12 : 8;
            const baseOpacity = node.isVisited ? 1 : 0.35;
            const isFiltered = activeFilter === node.path;
            const isDimmed = activeFilter && activeFilter !== node.path;
            const opacity = isDimmed ? 0.2 : baseOpacity;
            const liveCount = visitorsByNode[node.path] || 0;
            const hasLiveVisitor = liveCount > 0;
            const hasExternalReferrer = externalReferrerPages.has(node.path);
            
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
                      stroke="#22c55e"
                      strokeWidth={2}
                      strokeOpacity={0.6}
                      className="animate-ping"
                      style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={nodeSize + 8}
                      fill="#22c55e"
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
                  stroke={hasLiveVisitor ? "#22c55e" : color}
                  strokeWidth={hasLiveVisitor ? 3 : node.isVisited ? 2.5 : 1.5}
                  strokeDasharray={node.isVisited ? "none" : "3 2"}
                />
                {/* Inner dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeSize * 0.3}
                  fill={hasLiveVisitor ? "#22c55e" : color}
                  opacity={node.isVisited ? 0.6 : 0.3}
                />
                {/* External referrer starburst effect */}
                {hasExternalReferrer && (
                  <>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={nodeSize + 16}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      opacity={0.7}
                    >
                      <animate
                        attributeName="r"
                        values={`${nodeSize + 10};${nodeSize + 20};${nodeSize + 10}`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.7;0.3;0.7"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    {/* Starburst rays */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                      const rad = (angle * Math.PI) / 180;
                      const x1 = pos.x + Math.cos(rad) * (nodeSize + 4);
                      const y1 = pos.y + Math.sin(rad) * (nodeSize + 4);
                      const x2 = pos.x + Math.cos(rad) * (nodeSize + 12);
                      const y2 = pos.y + Math.sin(rad) * (nodeSize + 12);
                      return (
                        <line
                          key={angle}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#f97316"
                          strokeWidth={2}
                          strokeLinecap="round"
                          opacity={0.8}
                        >
                          <animate
                            attributeName="opacity"
                            values="0.8;0.3;0.8"
                            dur="1.5s"
                            begin={`${angle / 360}s`}
                            repeatCount="indefinite"
                          />
                        </line>
                      );
                    })}
                  </>
                )}
                {/* Live visitor count badge - top right (GREEN) */}
                {hasLiveVisitor && (
                  <>
                    <circle
                      cx={pos.x + nodeSize - 2}
                      cy={pos.y - nodeSize + 2}
                      r={8}
                      fill="#22c55e"
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
                {/* Total visits badge - top left (for time range filter) */}
                {node.visits > 0 && (
                  <>
                    <circle
                      cx={pos.x - nodeSize + 2}
                      cy={pos.y - nodeSize + 2}
                      r={node.visits > 99 ? 10 : 8}
                      fill={node.isTool ? "#f59e0b" : "#8b5cf6"}
                    />
                    <text
                      x={pos.x - nodeSize + 2}
                      y={pos.y - nodeSize + 6}
                      textAnchor="middle"
                      fill="white"
                      style={{ fontSize: node.visits > 99 ? '7px' : '9px', fontWeight: 'bold' }}
                    >
                      {node.visits > 999 ? `${Math.round(node.visits / 100) / 10}k` : node.visits}
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
                        fontSize: node.depth === 0 ? '11px' : '9px'
                      }}
                    >
                      {node.name}
                    </text>
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
                        fontSize: '8px'
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
          
          {/* Depth labels removed for cleaner look */}
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
