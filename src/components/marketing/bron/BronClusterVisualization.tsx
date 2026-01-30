import { memo, useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ExternalLink, TrendingUp, TrendingDown, Sparkles, Loader2, Link2, Globe, Trophy, AlertTriangle, Zap, ArrowDownRight, ArrowUpRight, Target, Gauge, DollarSign, BarChart3, LinkIcon, FileText, CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";
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
  const linksOut = node.linksOutCount;
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

// Animated electrical line component
const ElectricLine = memo(({ 
  x1, y1, x2, y2, 
  delay = 0, 
  isHighlighted = false,
  googlePos 
}: { 
  x1: number; y1: number; x2: number; y2: number; 
  delay?: number; 
  isHighlighted?: boolean;
  googlePos: number | null;
}) => {
  const lineId = useMemo(() => `line-${x1}-${y1}-${x2}-${y2}-${Math.random()}`, [x1, y1, x2, y2]);
  
  // Color based on ranking performance
  let strokeColor = "rgba(148, 163, 184, 0.4)"; // muted
  let glowColor = "rgba(148, 163, 184, 0.2)";
  let particleColor = "#94a3b8";
  
  if (googlePos !== null) {
    if (googlePos <= 3) {
      strokeColor = "rgba(52, 211, 153, 0.6)"; // emerald
      glowColor = "rgba(52, 211, 153, 0.3)";
      particleColor = "#34d399";
    } else if (googlePos <= 10) {
      strokeColor = "rgba(34, 211, 238, 0.6)"; // cyan
      glowColor = "rgba(34, 211, 238, 0.3)";
      particleColor = "#22d3ee";
    } else if (googlePos <= 20) {
      strokeColor = "rgba(251, 191, 36, 0.6)"; // amber
      glowColor = "rgba(251, 191, 36, 0.3)";
      particleColor = "#fbbf24";
    } else {
      strokeColor = "rgba(251, 146, 60, 0.5)"; // orange
      glowColor = "rgba(251, 146, 60, 0.25)";
      particleColor = "#fb923c";
    }
  }
  
  if (isHighlighted) {
    strokeColor = "rgba(168, 85, 247, 0.8)"; // violet
    glowColor = "rgba(168, 85, 247, 0.4)";
    particleColor = "#a855f7";
  }

  return (
    <g>
      {/* Glow effect */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={glowColor}
        strokeWidth="6"
        strokeLinecap="round"
        style={{ filter: 'blur(4px)' }}
      />
      
      {/* Main line */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Animated electricity particle */}
      <circle r="4" fill={particleColor} style={{ filter: `drop-shadow(0 0 6px ${particleColor})` }}>
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          begin={`${delay}s`}
          path={`M${x1},${y1} L${x2},${y2}`}
        />
        <animate
          attributeName="opacity"
          values="0;1;1;0"
          dur="2s"
          repeatCount="indefinite"
          begin={`${delay}s`}
        />
        <animate
          attributeName="r"
          values="2;4;2"
          dur="2s"
          repeatCount="indefinite"
          begin={`${delay}s`}
        />
      </circle>
      
      {/* Second particle offset */}
      <circle r="3" fill={particleColor} style={{ filter: `drop-shadow(0 0 4px ${particleColor})` }}>
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          begin={`${delay + 1}s`}
          path={`M${x1},${y1} L${x2},${y2}`}
        />
        <animate
          attributeName="opacity"
          values="0;0.8;0.8;0"
          dur="2s"
          repeatCount="indefinite"
          begin={`${delay + 1}s`}
        />
      </circle>
    </g>
  );
});
ElectricLine.displayName = 'ElectricLine';

// Enhanced Tooltip Component with more relevant data
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
  
  // Generate tips synchronously
  const tips = useMemo(() => generateSEOTips(data), [data]);
  
  // Calculate total improvement across engines
  const totalImprovement = data.movement.google + data.movement.bing + data.movement.yahoo;
  const avgImprovement = Math.round(totalImprovement / 3);
  
  return (
    <div
      className="fixed z-[100] bg-background/98 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl p-4 min-w-[340px] max-w-[400px] pointer-events-none"
      style={{
        left: Math.min(position.x + 15, window.innerWidth - 420),
        top: Math.min(position.y - 20, window.innerHeight - 520),
      }}
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
      <div className="flex items-center gap-3 mb-3 text-xs">
        {/* Links */}
        <div className="flex items-center gap-1.5 bg-muted/30 rounded px-2 py-1">
          <LinkIcon className="w-3 h-3 text-cyan-400" />
          <span className="text-muted-foreground">Links:</span>
          <span className="text-foreground font-medium">{data.linksInCount} in</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-medium">{data.linksOutCount} out</span>
        </div>
        
        {/* PageSpeed if available */}
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
        
        {/* CPC if available */}
        {data.metrics?.cpc !== undefined && (
          <div className="flex items-center gap-1.5 bg-muted/30 rounded px-2 py-1">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span className="text-muted-foreground">CPC:</span>
            <span className="text-foreground font-medium">${data.metrics.cpc.toFixed(2)}</span>
          </div>
        )}
      </div>
      
      {/* Search Volume if available */}
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
        
        {/* Main tip */}
        <p className="text-sm text-foreground mb-3 leading-relaxed">
          {tips.mainTip}
        </p>
        
        {/* Action items */}
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

// Main Visualization Component - Radial Layout with Central Hub
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
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

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
        setDimensions({ width: rect.width, height: Math.max(700, rect.height) });
      }
    };
    
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, [isOpen]);
  
  // Sort clusters by performance (Google ranking)
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

  // Build positioned nodes for radial layout
  const { centerX, centerY, clusterNodes } = useMemo(() => {
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    const baseRadius = Math.min(cx, cy) - 100;
    
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

    // Position clusters in concentric rings
    const nodes: NodeData[] = [];
    const count = sortedClusters.length;
    
    // Distribute in rings - inner ring for top performers
    const innerRingCount = Math.min(8, Math.ceil(count / 2));
    const outerRingCount = count - innerRingCount;
    
    sortedClusters.forEach((cluster, index) => {
      const parentKeywordText = getKeywordDisplayText(cluster.parent);
      const parentSerpData = getSerp(parentKeywordText);
      const parentKey = parentKeywordText.toLowerCase();
      const parentInitial = initialPositions[parentKey] || { google: null, bing: null, yahoo: null };
      const parentGooglePos = getPosition(parentSerpData?.google);
      const parentUrl = getUrlForKeyword(cluster.parent, parentKeywordText);
      const parentUrlKey = parentUrl ? normalizeUrlKey(parentUrl) : null;
      const parentLinkCounts = parentUrlKey ? linkCountsByUrl.get(parentUrlKey) : undefined;
      
      // Determine which ring and position
      const isInnerRing = index < innerRingCount;
      const ringRadius = isInnerRing ? baseRadius * 0.55 : baseRadius * 0.85;
      const ringIndex = isInnerRing ? index : index - innerRingCount;
      const ringTotal = isInnerRing ? innerRingCount : outerRingCount;
      
      const angle = (ringIndex / ringTotal) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * ringRadius;
      const y = cy + Math.sin(angle) * ringRadius;
      
      nodes.push({
        id: cluster.parent.id,
        keyword: cluster.parent,
        x,
        y,
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
        angle,
      });
    });
    
    return { centerX: cx, centerY: cy, clusterNodes: nodes };
  }, [sortedClusters, dimensions, serpReports, keywordMetrics, pageSpeedScores, selectedDomain, initialPositions, isBaselineReport, linkCountsByUrl]);

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    setHoveredNode(null);
    setTooltipData(null);
  }, [isOpen]);
  
  // Handle hover with AI tip generation
  const handleNodeHover = useCallback(async (node: NodeData | null, e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    setHoveredNode(node);
    
    if (node) {
      // Tips are now generated synchronously in the tooltip itself
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
  
  // Count clusters with external linkout
  const externalLinkoutCount = useMemo(() => 
    clusters.filter(c => !!c.parent.linkouturl).length, 
    [clusters]
  );

  // Don't render if not open
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
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-foreground">Power Flow Network</h3>
          </div>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-2 py-0.5">
            {clusters.length} Money Pages
          </Badge>
          <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30 text-xs px-2 py-0.5">
            {totalSupportingKeywords} Supporting
          </Badge>
          {externalLinkoutCount > 0 && (
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs px-2 py-0.5">
              <Link2 className="w-3 h-3 mr-1" />
              {externalLinkoutCount} Client Pages
            </Badge>
          )}
        </div>
        
        {/* Sort selector and close */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
            <Button
              variant={sortOrder === 'best' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortOrder('best')}
              className={`h-7 px-3 text-xs gap-1.5 ${sortOrder === 'best' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : ''}`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Best First
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
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/50"
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Radial Visualization Canvas */}
      <div 
        ref={containerRef}
        className="relative bg-gradient-to-br from-background via-background to-muted/20"
        style={{ minHeight: '700px', height: '75vh' }}
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
                {/* Glow filter for center hub */}
                <filter id="centerGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                {/* Radial gradient for center */}
                <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(168, 85, 247, 0.3)" />
                  <stop offset="50%" stopColor="rgba(139, 92, 246, 0.2)" />
                  <stop offset="100%" stopColor="rgba(99, 102, 241, 0.1)" />
                </radialGradient>
              </defs>
              
              {/* Electrical connections from center to each cluster */}
              {clusterNodes.map((node, index) => {
                const googlePos = getPosition(node.serpData?.google);
                return (
                  <ElectricLine
                    key={`line-${node.id}`}
                    x1={centerX}
                    y1={centerY}
                    x2={node.x}
                    y2={node.y}
                    delay={index * 0.15}
                    isHighlighted={hoveredNode?.id === node.id}
                    googlePos={googlePos}
                  />
                );
              })}
              
              {/* Center hub glow rings */}
              <circle
                cx={centerX}
                cy={centerY}
                r="90"
                fill="url(#centerGradient)"
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  values="85;95;85"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx={centerX}
                cy={centerY}
                r="70"
                fill="none"
                stroke="rgba(168, 85, 247, 0.3)"
                strokeWidth="2"
              >
                <animate
                  attributeName="r"
                  values="65;75;65"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.3;0.6;0.3"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
            
            {/* Center Hub - Main Website */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ left: centerX, top: centerY }}
            >
              <div className="relative">
                {/* Outer pulse ring */}
                <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 animate-pulse" />
                
                {/* Main hub */}
                <div 
                  className="relative w-32 h-32 rounded-full bg-gradient-to-br from-violet-600/30 via-purple-600/25 to-indigo-600/30 border-2 border-violet-400/60 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.4)] backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => selectedDomain && window.open(`https://${selectedDomain}`, '_blank')}
                >
                  <Globe className="w-8 h-8 text-violet-400 mb-1" />
                  <span className="text-xs font-bold text-violet-300 text-center px-2 leading-tight">
                    {selectedDomain || 'Main Site'}
                  </span>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cluster Nodes */}
            {clusterNodes.map((node) => {
              const style = getNodeStyle(node);
              const googlePos = getPosition(node.serpData?.google);
              const isHovered = hoveredNode?.id === node.id;
              const hasExternalLinkout = !!node.keyword.linkouturl;
              
              return (
                <div
                  key={node.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-200 ${isHovered ? 'scale-110 z-30' : ''}`}
                  style={{ left: node.x, top: node.y }}
                  onMouseEnter={(e) => handleNodeHover(node, e)}
                  onMouseLeave={(e) => handleNodeHover(null, e)}
                  onClick={() => handleNodeClick(node)}
                >
                  <div className="relative cursor-pointer group">
                    {/* Node circle */}
                    <div 
                      className={`w-16 h-16 rounded-full ${style.bg} border-2 ${style.border} ${style.glow} flex flex-col items-center justify-center backdrop-blur-sm transition-all group-hover:scale-105`}
                    >
                      <span className={`font-bold text-sm ${style.text}`}>
                        {googlePos !== null ? `#${googlePos}` : '—'}
                      </span>
                      
                      {/* Movement badge */}
                      {node.movement.google !== 0 && (
                        <div 
                          className={`absolute -top-2 -right-2 min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg ${node.movement.google > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        >
                          {node.movement.google > 0 ? '+' : ''}{Math.min(99, Math.max(-99, node.movement.google))}
                        </div>
                      )}
                      
                      {/* External link indicator */}
                      {hasExternalLinkout && (
                        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg">
                          <Link2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Label */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-24 text-center">
                      <span className="text-[11px] text-foreground font-medium leading-tight line-clamp-2 bg-background/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
                        {node.keywordText.length > 25 ? node.keywordText.substring(0, 22) + '…' : node.keywordText}
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
