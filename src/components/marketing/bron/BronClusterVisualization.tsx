import { memo, useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ExternalLink, TrendingUp, TrendingDown, Sparkles, Link2, Globe, Trophy, AlertTriangle, Zap, ArrowDownRight, ArrowUpRight, Target, Gauge, DollarSign, BarChart3, LinkIcon, CheckCircle2, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BronKeyword, BronSerpReport, BronLink } from "@/hooks/use-bron-api";
import { getKeywordDisplayText, getPosition, KeywordMetrics, PageSpeedScore } from "./BronKeywordCard";
import { findSerpForKeyword } from "./utils";

function normalizeUrlKey(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

function getLinkTargetKey(link: BronLink, kind: "in" | "out"): string | null {
  const raw =
    kind === "in"
      ? (link.target_url || link.link || link.source_url)
      : (link.link || link.source_url || link.target_url);

  if (!raw) return null;
  return normalizeUrlKey(raw);
}

interface InitialPositions {
  google: number | null;
  bing: number | null;
  yahoo: number | null;
}

interface ClusterData {
  parent: BronKeyword;
  children: BronKeyword[];
  parentId: number | string;
}

interface BronClusterVisualizationProps {
  isOpen: boolean;
  onClose: () => void;
  clusters: ClusterData[];
  serpReports: BronSerpReport[];
  keywordMetrics: Record<string, KeywordMetrics>;
  pageSpeedScores: Record<string, PageSpeedScore>;
  linksIn: BronLink[];
  linksOut: BronLink[];
  selectedDomain?: string;
  initialPositions: Record<string, InitialPositions>;
  isBaselineReport?: boolean;
}

interface NodeData {
  id: string | number;
  keyword: BronKeyword;
  x: number;
  y: number;
  isMainNode: boolean;
  keywordText: string;
  serpData: BronSerpReport | null;
  metrics: KeywordMetrics | undefined;
  pageSpeed: PageSpeedScore | undefined;
  movement: { google: number; bing: number; yahoo: number };
  linksInCount: number;
  linksOutCount: number;
  linkoutUrl: string | null;
  angle?: number;
  parentNodeId?: string | number;
}

interface TooltipData extends NodeData {
  aiTip?: string;
  isLoadingTip?: boolean;
}

// Enhanced AI tip generation with actionable insights
const generateSEOTips = (node: NodeData): { mainTip: string; actionItems: string[]; improvement: string } => {
  const googlePos = getPosition(node.serpData?.google);
  const movement = node.movement.google;
  const linksIn = node.linksInCount;
  const pageSpeed = node.pageSpeed?.mobileScore;
  const metrics = node.metrics;
  
  let mainTip = "";
  const actionItems: string[] = [];
  let improvement = "";
  
  // Improvement summary
  if (movement > 0) {
    if (movement >= 50) {
      improvement = `🚀 Massive improvement! Climbed ${movement} positions`;
    } else if (movement >= 20) {
      improvement = `📈 Strong gains! Up ${movement} positions`;
    } else if (movement >= 5) {
      improvement = `✅ Good progress! Improved ${movement} spots`;
    } else {
      improvement = `↗️ Slight improvement of ${movement} positions`;
    }
  } else if (movement < 0) {
    improvement = `⚠️ Dropped ${Math.abs(movement)} positions - needs attention`;
  } else {
    improvement = "➡️ Holding steady at current position";
  }
  
  // Main tip based on ranking
  if (googlePos === null) {
    mainTip = "Not yet indexed. Focus on building topical authority and quality backlinks.";
    actionItems.push("Submit URL to Google Search Console");
    actionItems.push("Build 3-5 quality inbound links");
    actionItems.push("Add internal links from related pages");
  } else if (googlePos > 50) {
    mainTip = "Outside top 50. Major on-page and off-page work needed.";
    actionItems.push("Optimize title tag with primary keyword");
    actionItems.push("Improve content depth (+500 words)");
    actionItems.push("Build 5+ quality backlinks");
  } else if (googlePos > 20) {
    mainTip = "Page 2-5. Good foundation, needs authority signals.";
    actionItems.push("Add FAQ schema markup");
    actionItems.push("Improve internal linking structure");
    actionItems.push("Target featured snippet opportunity");
  } else if (googlePos > 10) {
    mainTip = "Almost page 1! Small optimizations can push you over.";
    actionItems.push("Optimize meta description for CTR");
    actionItems.push("Add 2-3 supporting internal links");
    actionItems.push("Update content with fresh stats");
  } else if (googlePos > 3) {
    mainTip = "Top 10! Focus on CTR optimization and user signals.";
    actionItems.push("A/B test meta title variations");
    actionItems.push("Improve page load speed");
    actionItems.push("Add compelling featured image");
  } else {
    mainTip = "Top 3! Maintain position with fresh content updates.";
    actionItems.push("Update content quarterly");
    actionItems.push("Monitor competitor changes");
    actionItems.push("Build brand mentions");
  }
  
  // Add context-specific actions
  if (pageSpeed !== undefined && pageSpeed < 50) {
    actionItems.unshift("⚡ Critical: Improve page speed (currently " + pageSpeed + "/100)");
  }
  
  if (linksIn < 3) {
    actionItems.push("Build more inbound citation links");
  }
  
  if (metrics?.cpc && metrics.cpc > 5) {
    actionItems.push("💰 High-value keyword ($" + metrics.cpc.toFixed(2) + " CPC) - prioritize!");
  }
  
  return { mainTip, actionItems: actionItems.slice(0, 4), improvement };
};

// Electrical line component with smooth animation
const ElectricLine = memo(({ 
  x1, y1, x2, y2, 
  delay = 0, 
  isHighlighted = false,
  googlePos,
  isSupportingLink = false
}: { 
  x1: number; y1: number; x2: number; y2: number; 
  delay?: number; 
  isHighlighted?: boolean;
  googlePos: number | null;
  isSupportingLink?: boolean;
}) => {
  // Color based on ranking performance
  let strokeColor = "rgba(148, 163, 184, 0.25)";
  let glowColor = "rgba(148, 163, 184, 0.1)";
  let particleColor = "#94a3b8";
  
  if (googlePos !== null) {
    if (googlePos <= 3) {
      strokeColor = "rgba(52, 211, 153, 0.5)";
      glowColor = "rgba(52, 211, 153, 0.2)";
      particleColor = "#34d399";
    } else if (googlePos <= 10) {
      strokeColor = "rgba(34, 211, 238, 0.5)";
      glowColor = "rgba(34, 211, 238, 0.2)";
      particleColor = "#22d3ee";
    } else if (googlePos <= 20) {
      strokeColor = "rgba(251, 191, 36, 0.5)";
      glowColor = "rgba(251, 191, 36, 0.2)";
      particleColor = "#fbbf24";
    } else {
      strokeColor = "rgba(251, 146, 60, 0.35)";
      glowColor = "rgba(251, 146, 60, 0.12)";
      particleColor = "#fb923c";
    }
  }
  
  if (isHighlighted) {
    strokeColor = "rgba(168, 85, 247, 0.7)";
    glowColor = "rgba(168, 85, 247, 0.3)";
    particleColor = "#a855f7";
  }
  
  // Supporting links are thinner and more subtle
  const strokeWidth = isSupportingLink ? 1.5 : 2;
  const glowWidth = isSupportingLink ? 3 : 4;
  const particleSize = isSupportingLink ? 2 : 3;

  const pathLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const animDuration = Math.max(1.5, pathLength / 180);

  return (
    <g style={{ contain: 'layout paint' }}>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={glowColor}
        strokeWidth={glowWidth}
        strokeLinecap="round"
      />
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <circle r={particleSize} fill={particleColor} opacity="0.8">
        <animateMotion
          dur={`${animDuration}s`}
          repeatCount="indefinite"
          begin={`${delay}s`}
          path={`M${x1},${y1} L${x2},${y2}`}
        />
      </circle>
    </g>
  );
});
ElectricLine.displayName = 'ElectricLine';

// Enhanced Tooltip Component
const NodeTooltip = memo(({
  data,
  position,
}: {
  data: TooltipData;
  position: { x: number; y: number };
}) => {
  const googlePos = getPosition(data.serpData?.google);
  const bingPos = getPosition(data.serpData?.bing);
  const yahooPos = getPosition(data.serpData?.yahoo);
  
  const tips = useMemo(() => generateSEOTips(data), [data]);
  
  // Calculate tooltip position - flip to left if near right edge
  const tooltipWidth = 400;
  const tooltipHeight = 500;
  const padding = 20;
  
  const isNearRightEdge = position.x > window.innerWidth - tooltipWidth - 50;
  const isNearBottomEdge = position.y > window.innerHeight - tooltipHeight - 50;
  
  const left = isNearRightEdge 
    ? Math.max(padding, position.x - tooltipWidth - 20) 
    : Math.min(position.x + 20, window.innerWidth - tooltipWidth - padding);
    
  const top = isNearBottomEdge
    ? Math.max(padding, position.y - tooltipHeight + 100)
    : Math.max(padding, Math.min(position.y - 20, window.innerHeight - tooltipHeight - padding));
  
  return (
    <div
      className="fixed z-[100] bg-background/98 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl p-4 min-w-[340px] max-w-[400px] pointer-events-none"
      style={{ left, top }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-foreground text-base leading-tight">{data.keywordText}</h4>
          {data.keyword.linkouturl && (
            <a
              href={data.keyword.linkouturl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-1 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="truncate max-w-[200px]">{data.keyword.linkouturl}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          )}
        </div>
        <Badge className={data.isMainNode 
          ? "bg-amber-500/20 text-amber-400 border-amber-400/50 text-xs flex-shrink-0 px-2 py-1"
          : "bg-violet-500/20 text-violet-400 border-violet-400/50 text-xs flex-shrink-0 px-2 py-1"
        }>
          {data.isMainNode ? "Money Page" : "Supporting"}
        </Badge>
      </div>
      
      {/* Improvement Summary Banner */}
      <div className={`rounded-lg px-3 py-2 mb-3 ${
        data.movement.google > 0 
          ? 'bg-emerald-500/10 border border-emerald-500/30' 
          : data.movement.google < 0 
            ? 'bg-rose-500/10 border border-rose-500/30'
            : 'bg-muted/50 border border-border/50'
      }`}>
        <div className="flex items-center gap-2">
          {data.movement.google > 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : data.movement.google < 0 ? (
            <TrendingDown className="w-4 h-4 text-rose-400" />
          ) : (
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          )}
          <span className={`text-sm font-medium ${
            data.movement.google > 0 ? 'text-emerald-400' : data.movement.google < 0 ? 'text-rose-400' : 'text-muted-foreground'
          }`}>
            {tips.improvement}
          </span>
        </div>
      </div>
      
      {/* Rankings Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-muted/40 rounded-lg p-2 text-center border border-border/30">
          <div className="text-[10px] text-muted-foreground font-medium mb-0.5">Google</div>
          <div className="font-bold text-foreground text-lg">{googlePos ?? '—'}</div>
          {data.movement.google !== 0 && (
            <div className={`text-xs flex items-center justify-center gap-0.5 font-medium ${data.movement.google > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {data.movement.google > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {data.movement.google > 0 ? '+' : ''}{data.movement.google}
            </div>
          )}
        </div>
        <div className="bg-muted/40 rounded-lg p-2 text-center border border-border/30">
          <div className="text-[10px] text-muted-foreground font-medium mb-0.5">Bing</div>
          <div className="font-bold text-foreground text-lg">{bingPos ?? '—'}</div>
          {data.movement.bing !== 0 && (
            <div className={`text-xs flex items-center justify-center gap-0.5 font-medium ${data.movement.bing > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {data.movement.bing > 0 ? '+' : ''}{data.movement.bing}
            </div>
          )}
        </div>
        <div className="bg-muted/40 rounded-lg p-2 text-center border border-border/30">
          <div className="text-[10px] text-muted-foreground font-medium mb-0.5">Yahoo</div>
          <div className="font-bold text-foreground text-lg">{yahooPos ?? '—'}</div>
          {data.movement.yahoo !== 0 && (
            <div className={`text-xs flex items-center justify-center gap-0.5 font-medium ${data.movement.yahoo > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {data.movement.yahoo > 0 ? '+' : ''}{data.movement.yahoo}
            </div>
          )}
        </div>
      </div>
      
      {/* Metrics Row */}
      <div className="flex items-center gap-3 mb-3 text-xs flex-wrap">
        <div className="flex items-center gap-1.5 bg-muted/30 rounded px-2 py-1">
          <LinkIcon className="w-3 h-3 text-cyan-400" />
          <span className="text-muted-foreground">Links:</span>
          <span className="text-foreground font-medium">{data.linksInCount} in</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-medium">{data.linksOutCount} out</span>
        </div>
        
        {data.pageSpeed?.mobileScore !== undefined && (
          <div className="flex items-center gap-1.5 bg-muted/30 rounded px-2 py-1">
            <Gauge className="w-3 h-3 text-amber-400" />
            <span className="text-muted-foreground">Speed:</span>
            <span className={`font-medium ${
              data.pageSpeed.mobileScore >= 90 ? 'text-emerald-400' :
              data.pageSpeed.mobileScore >= 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>{data.pageSpeed.mobileScore}/100</span>
          </div>
        )}
        
        {data.metrics?.cpc !== undefined && (
          <div className="flex items-center gap-1.5 bg-muted/30 rounded px-2 py-1">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span className="text-muted-foreground">CPC:</span>
            <span className="text-foreground font-medium">${data.metrics.cpc.toFixed(2)}</span>
          </div>
        )}
      </div>
      
      {data.metrics?.search_volume !== undefined && data.metrics.search_volume > 0 && (
        <div className="flex items-center gap-2 mb-3 text-xs bg-violet-500/10 rounded-lg px-3 py-1.5 border border-violet-500/20">
          <Target className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-violet-300">Monthly Search Volume:</span>
          <span className="text-violet-400 font-bold">{data.metrics.search_volume.toLocaleString()}</span>
        </div>
      )}
      
      {/* AI Analysis Section */}
      <div className="border-t border-border/50 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-violet-400">AI Ranking Analysis</span>
        </div>
        
        <p className="text-sm text-foreground mb-3 leading-relaxed">
          {tips.mainTip}
        </p>
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span className="font-medium">Recommended Actions:</span>
          </div>
          {tips.actionItems.map((action, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs pl-1">
              <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
NodeTooltip.displayName = 'NodeTooltip';

// Main Visualization Component - Three-tier hierarchy
export const BronClusterVisualization = memo(({
  isOpen,
  onClose,
  clusters,
  serpReports,
  keywordMetrics,
  pageSpeedScores,
  linksIn,
  linksOut,
  selectedDomain,
  initialPositions,
  isBaselineReport = false,
}: BronClusterVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [sortOrder, setSortOrder] = useState<'best' | 'worst'>('best');
  const [dimensions, setDimensions] = useState({ width: 1400, height: 900 });

  // Pre-index link counts by target URL
  const linkCountsByUrl = useMemo(() => {
    const map = new Map<string, { in: number; out: number }>();
    const bump = (key: string, dir: "in" | "out") => {
      const prev = map.get(key) || { in: 0, out: 0 };
      if (dir === "in") prev.in += 1;
      else prev.out += 1;
      map.set(key, prev);
    };

    for (const l of linksIn) {
      const key = getLinkTargetKey(l, "in");
      if (key) bump(key, "in");
    }
    for (const l of linksOut) {
      const key = getLinkTargetKey(l, "out");
      if (key) bump(key, "out");
    }
    return map;
  }, [linksIn, linksOut]);

  // Update dimensions on resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.max(800, rect.height) });
      }
    };
    
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, [isOpen]);
  
  // Sort clusters by performance
  const sortedClusters = useMemo(() => {
    const getClusterScore = (cluster: ClusterData) => {
      const keywordText = getKeywordDisplayText(cluster.parent);
      const serpData = findSerpForKeyword(keywordText, serpReports);
      const googlePos = getPosition(serpData?.google);
      return googlePos ?? 1000;
    };
    
    return [...clusters].sort((a, b) => {
      const scoreA = getClusterScore(a);
      const scoreB = getClusterScore(b);
      return sortOrder === 'best' ? scoreA - scoreB : scoreB - scoreA;
    });
  }, [clusters, serpReports, sortOrder]);

  // Build three-tier node layout: Center → Money Pages → Supporting Pages
  const { centerX, centerY, moneyNodes, supportingNodes, connections } = useMemo(() => {
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    
    // Radii for the three tiers
    const moneyPageRadius = Math.min(cx, cy) * 0.42; // Money pages orbit
    const supportingBaseRadius = Math.min(cx, cy) * 0.72; // Supporting pages base radius
    
    const UNRANKED_POSITION = 1000;
    const calculateMovement = (baseline: number | null, current: number | null): number => {
      if (baseline === null && current === null) return 0;
      const effectiveBaseline = baseline === null ? UNRANKED_POSITION : baseline;
      const effectiveCurrent = current === null ? UNRANKED_POSITION : current;
      return effectiveBaseline - effectiveCurrent;
    };

    const getSerp = (keywordText: string) => findSerpForKeyword(keywordText, serpReports);

    const getUrlForKeyword = (kw: BronKeyword, kwText: string) => {
      if (kw.linkouturl) return kw.linkouturl;
      if (selectedDomain) {
        const slug = kwText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return `https://${selectedDomain}/${slug}`;
      }
      return null;
    };

    const money: NodeData[] = [];
    const supporting: NodeData[] = [];
    const conns: Array<{ from: NodeData; to: NodeData; type: 'money-to-center' | 'supporting-to-money' }> = [];
    
    const moneyCount = sortedClusters.length;
    
    // Position money pages in a circle around the center
    sortedClusters.forEach((cluster, clusterIndex) => {
      const parentKeywordText = getKeywordDisplayText(cluster.parent);
      const parentSerpData = getSerp(parentKeywordText);
      const parentKey = parentKeywordText.toLowerCase();
      const parentInitial = initialPositions[parentKey] || { google: null, bing: null, yahoo: null };
      const parentGooglePos = getPosition(parentSerpData?.google);
      const parentUrl = getUrlForKeyword(cluster.parent, parentKeywordText);
      const parentUrlKey = parentUrl ? normalizeUrlKey(parentUrl) : null;
      const parentLinkCounts = parentUrlKey ? linkCountsByUrl.get(parentUrlKey) : undefined;
      
      // Distribute money pages evenly around the center
      const moneyAngle = (clusterIndex / moneyCount) * Math.PI * 2 - Math.PI / 2;
      const moneyX = cx + Math.cos(moneyAngle) * moneyPageRadius;
      const moneyY = cy + Math.sin(moneyAngle) * moneyPageRadius;
      
      const moneyNode: NodeData = {
        id: cluster.parent.id,
        keyword: cluster.parent,
        x: moneyX,
        y: moneyY,
        isMainNode: true,
        keywordText: parentKeywordText,
        serpData: parentSerpData,
        metrics: keywordMetrics[parentKey],
        pageSpeed: parentUrl ? pageSpeedScores[parentUrl] : undefined,
        movement: isBaselineReport
          ? { google: 0, bing: 0, yahoo: 0 }
          : {
              google: calculateMovement(parentInitial.google, parentGooglePos),
              bing: calculateMovement(parentInitial.bing, getPosition(parentSerpData?.bing)),
              yahoo: calculateMovement(parentInitial.yahoo, getPosition(parentSerpData?.yahoo)),
            },
        linksInCount: parentLinkCounts?.in ?? 0,
        linksOutCount: parentLinkCounts?.out ?? 0,
        linkoutUrl: parentUrl,
        angle: moneyAngle,
      };
      
      money.push(moneyNode);
      
      // Position supporting pages in an arc around this money page
      const supportingCount = cluster.children.length;
      if (supportingCount > 0) {
        // Calculate arc span based on how many supporting pages
        const arcSpan = Math.min(Math.PI * 0.6, (supportingCount / 6) * Math.PI);
        const supportingRadius = 90 + Math.min(supportingCount * 8, 60); // Distance from money page
        
        cluster.children.forEach((child, childIndex) => {
          const childKeywordText = getKeywordDisplayText(child);
          const childSerpData = getSerp(childKeywordText);
          const childKey = childKeywordText.toLowerCase();
          const childInitial = initialPositions[childKey] || { google: null, bing: null, yahoo: null };
          const childGooglePos = getPosition(childSerpData?.google);
          const childUrl = getUrlForKeyword(child, childKeywordText);
          const childUrlKey = childUrl ? normalizeUrlKey(childUrl) : null;
          const childLinkCounts = childUrlKey ? linkCountsByUrl.get(childUrlKey) : undefined;
          
          // Position supporting pages in an arc radiating outward from money page
          const arcStart = moneyAngle - arcSpan / 2;
          const childAngle = supportingCount === 1 
            ? moneyAngle // Single child: straight out
            : arcStart + (childIndex / (supportingCount - 1)) * arcSpan;
          
          const supportingX = moneyX + Math.cos(childAngle) * supportingRadius;
          const supportingY = moneyY + Math.sin(childAngle) * supportingRadius;
          
          const supportingNode: NodeData = {
            id: child.id,
            keyword: child,
            x: supportingX,
            y: supportingY,
            isMainNode: false,
            keywordText: childKeywordText,
            serpData: childSerpData,
            metrics: keywordMetrics[childKey],
            pageSpeed: childUrl ? pageSpeedScores[childUrl] : undefined,
            movement: isBaselineReport
              ? { google: 0, bing: 0, yahoo: 0 }
              : {
                  google: calculateMovement(childInitial.google, childGooglePos),
                  bing: calculateMovement(childInitial.bing, getPosition(childSerpData?.bing)),
                  yahoo: calculateMovement(childInitial.yahoo, getPosition(childSerpData?.yahoo)),
                },
            linksInCount: childLinkCounts?.in ?? 0,
            linksOutCount: childLinkCounts?.out ?? 0,
            linkoutUrl: childUrl,
            parentNodeId: moneyNode.id,
          };
          
          supporting.push(supportingNode);
          
          // Connection from supporting to money page
          conns.push({ from: supportingNode, to: moneyNode, type: 'supporting-to-money' });
        });
      }
    });
    
    return { centerX: cx, centerY: cy, moneyNodes: money, supportingNodes: supporting, connections: conns };
  }, [sortedClusters, dimensions, serpReports, keywordMetrics, pageSpeedScores, selectedDomain, initialPositions, isBaselineReport, linkCountsByUrl]);

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    setHoveredNode(null);
    setTooltipData(null);
  }, [isOpen]);
  
  // Handle hover
  const handleNodeHover = useCallback((node: NodeData | null, e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    setHoveredNode(node);
    
    if (node) {
      setTooltipData({ ...node });
    } else {
      setTooltipData(null);
    }
  }, []);
  
  // Handle node click
  const handleNodeClick = useCallback((node: NodeData) => {
    if (node.keyword.linkouturl) {
      window.open(node.keyword.linkouturl, '_blank');
    }
  }, []);

  // Calculate total supporting keywords
  const totalSupportingKeywords = useMemo(() => 
    clusters.reduce((sum, c) => sum + c.children.length, 0), 
    [clusters]
  );

  if (!isOpen) return null;

  // Get node color based on ranking
  const getNodeStyle = (node: NodeData) => {
    const googlePos = getPosition(node.serpData?.google);
    
    if (googlePos === null) {
      return { bg: 'bg-muted/60', border: 'border-muted-foreground/40', text: 'text-muted-foreground', glow: '' };
    }
    if (googlePos <= 3) {
      return { bg: 'bg-emerald-500/30', border: 'border-emerald-400', text: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.4)]' };
    }
    if (googlePos <= 10) {
      return { bg: 'bg-cyan-500/30', border: 'border-cyan-400', text: 'text-cyan-400', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]' };
    }
    if (googlePos <= 20) {
      return { bg: 'bg-amber-500/30', border: 'border-amber-400', text: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.4)]' };
    }
    return { bg: 'bg-orange-500/30', border: 'border-orange-400', text: 'text-orange-400', glow: 'shadow-[0_0_15px_rgba(251,146,60,0.3)]' };
  };

  return (
    <div className="relative" style={{ contain: 'layout style paint' }}>
      {/* Floating controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <div className="flex items-center bg-background/80 backdrop-blur-sm rounded-lg p-0.5 border border-border/50">
          <Button
            variant={sortOrder === 'best' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortOrder('best')}
            className={`h-7 px-3 text-xs gap-1.5 ${sortOrder === 'best' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : ''}`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Best
          </Button>
          <Button
            variant={sortOrder === 'worst' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortOrder('worst')}
            className={`h-7 px-3 text-xs gap-1.5 ${sortOrder === 'worst' ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : ''}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Needs Work
          </Button>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50 bg-background/80 backdrop-blur-sm border border-border/50"
        >
          <span className="sr-only">Close</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Stats badges */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-amber-400 border-amber-500/30 text-xs px-2 py-1">
          {clusters.length} Money Pages
        </Badge>
        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-violet-400 border-violet-500/30 text-xs px-2 py-1">
          {totalSupportingKeywords} Supporting
        </Badge>
      </div>
      
      {/* Visualization Canvas */}
      <div 
        ref={containerRef}
        className="relative bg-gradient-to-br from-background via-background to-muted/10"
        style={{ minHeight: '850px', height: '85vh' }}
      >
        {clusters.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-1">No clusters to display</p>
              <p className="text-xs">Add keywords with parent-child relationships</p>
            </div>
          </div>
        ) : (
          <>
            {/* SVG for connections */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 0 }}
            >
              <defs>
                <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(168, 85, 247, 0.35)" />
                  <stop offset="50%" stopColor="rgba(139, 92, 246, 0.2)" />
                  <stop offset="100%" stopColor="rgba(99, 102, 241, 0.08)" />
                </radialGradient>
              </defs>
              
              {/* Connections from money pages to center */}
              {moneyNodes.map((node, index) => {
                const googlePos = getPosition(node.serpData?.google);
                return (
                  <ElectricLine
                    key={`center-to-${node.id}`}
                    x1={centerX}
                    y1={centerY}
                    x2={node.x}
                    y2={node.y}
                    delay={index * 0.12}
                    isHighlighted={hoveredNode?.id === node.id}
                    googlePos={googlePos}
                  />
                );
              })}
              
              {/* Connections from supporting pages to their money pages */}
              {connections.map((conn, index) => {
                const googlePos = getPosition(conn.from.serpData?.google);
                return (
                  <ElectricLine
                    key={`support-${conn.from.id}-to-${conn.to.id}`}
                    x1={conn.to.x}
                    y1={conn.to.y}
                    x2={conn.from.x}
                    y2={conn.from.y}
                    delay={0.5 + index * 0.08}
                    isHighlighted={hoveredNode?.id === conn.from.id || hoveredNode?.id === conn.to.id}
                    googlePos={googlePos}
                    isSupportingLink
                  />
                );
              })}
              
              {/* Center hub glow */}
              <circle
                cx={centerX}
                cy={centerY}
                r="100"
                fill="url(#centerGradient)"
                opacity="0.5"
              />
              <circle
                cx={centerX}
                cy={centerY}
                r="85"
                fill="none"
                stroke="rgba(168, 85, 247, 0.3)"
                strokeWidth="2"
              />
            </svg>
            
            {/* Center Hub - Main Website */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ left: centerX, top: centerY }}
            >
              <div 
                className="relative w-40 h-40 rounded-full bg-gradient-to-br from-violet-600/30 via-purple-600/25 to-indigo-600/30 border-2 border-violet-400/60 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.35)] cursor-pointer hover:scale-105 transition-transform"
                onClick={() => selectedDomain && window.open(`https://${selectedDomain}`, '_blank')}
              >
                {selectedDomain ? (
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${selectedDomain}&sz=128`}
                    alt={`${selectedDomain} favicon`}
                    className="w-14 h-14 mb-1.5 rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <Globe className={`w-12 h-12 text-violet-400 mb-1.5 ${selectedDomain ? 'hidden' : ''}`} />
                <span className="text-sm font-bold text-violet-300 text-center px-4 leading-tight">
                  {selectedDomain || 'Main Site'}
                </span>
                <Zap className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 text-cyan-400" />
              </div>
            </div>
            
            {/* Money Page Nodes */}
            {moneyNodes.map((node) => {
              const style = getNodeStyle(node);
              const googlePos = getPosition(node.serpData?.google);
              const isHovered = hoveredNode?.id === node.id;
              const hasExternalLinkout = !!node.keyword.linkouturl;
              
              return (
                <div
                  key={node.id}
                  className="absolute z-10"
                  style={{ 
                    left: node.x, 
                    top: node.y,
                    transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.12)' : 'scale(1)'}`,
                    transition: 'transform 0.15s ease-out',
                    zIndex: isHovered ? 30 : 15,
                    contain: 'layout style',
                  }}
                  onMouseEnter={(e) => handleNodeHover(node, e)}
                  onMouseLeave={(e) => handleNodeHover(null, e)}
                  onClick={() => handleNodeClick(node)}
                >
                  <div className="relative cursor-pointer">
                    {/* Money page node - larger */}
                    <div 
                      className={`w-16 h-16 rounded-full ${style.bg} border-2 ${style.border} flex items-center justify-center ${style.glow}`}
                      style={{ boxShadow: isHovered ? '0 0 30px rgba(168,85,247,0.5)' : undefined }}
                    >
                      <span className={`font-bold text-sm ${style.text}`}>
                        {googlePos !== null ? `#${googlePos}` : '—'}
                      </span>
                      
                      {node.movement.google !== 0 && (
                        <div 
                          className={`absolute -top-1.5 -right-1.5 min-w-6 h-6 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg ${node.movement.google > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        >
                          {node.movement.google > 0 ? '+' : ''}{Math.min(99, Math.max(-99, node.movement.google))}
                        </div>
                      )}
                      
                      {hasExternalLinkout && (
                        <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg">
                          <Link2 className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Label */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-24 text-center">
                      <span className="text-[10px] text-foreground font-medium leading-tight line-clamp-2 bg-background/90 px-1.5 py-0.5 rounded shadow-sm">
                        {node.keywordText.length > 24 ? node.keywordText.substring(0, 21) + '…' : node.keywordText}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Supporting Page Nodes */}
            {supportingNodes.map((node) => {
              const style = getNodeStyle(node);
              const googlePos = getPosition(node.serpData?.google);
              const isHovered = hoveredNode?.id === node.id;
              const hasExternalLinkout = !!node.keyword.linkouturl;
              
              return (
                <div
                  key={node.id}
                  className="absolute z-5"
                  style={{ 
                    left: node.x, 
                    top: node.y,
                    transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.15)' : 'scale(1)'}`,
                    transition: 'transform 0.15s ease-out',
                    zIndex: isHovered ? 25 : 5,
                    contain: 'layout style',
                  }}
                  onMouseEnter={(e) => handleNodeHover(node, e)}
                  onMouseLeave={(e) => handleNodeHover(null, e)}
                  onClick={() => handleNodeClick(node)}
                >
                  <div className="relative cursor-pointer">
                    {/* Supporting page node - smaller */}
                    <div 
                      className={`w-10 h-10 rounded-full ${style.bg} border-[1.5px] ${style.border} flex items-center justify-center`}
                      style={{ boxShadow: isHovered ? '0 0 20px rgba(168,85,247,0.4)' : undefined }}
                    >
                      <span className={`font-semibold text-xs ${style.text}`}>
                        {googlePos !== null ? googlePos : '—'}
                      </span>
                      
                      {node.movement.google !== 0 && (
                        <div 
                          className={`absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow ${node.movement.google > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        >
                          {node.movement.google > 0 ? '+' : ''}{Math.min(99, Math.max(-99, node.movement.google))}
                        </div>
                      )}
                      
                      {hasExternalLinkout && (
                        <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center shadow">
                          <Link2 className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Smaller label for supporting */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 w-20 text-center">
                      <span className="text-[9px] text-muted-foreground font-medium leading-tight line-clamp-2 bg-background/80 px-1 py-0.5 rounded">
                        {node.keywordText.length > 20 ? node.keywordText.substring(0, 17) + '…' : node.keywordText}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
      
      {/* Tooltip */}
      {tooltipData && (
        <NodeTooltip data={tooltipData} position={mousePos} />
      )}
    </div>
  );
});

BronClusterVisualization.displayName = 'BronClusterVisualization';
