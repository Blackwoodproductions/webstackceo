import { memo, useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink, TrendingUp, TrendingDown, Sparkles, Loader2, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  clusterIndex: number;
  childIndex?: number;
  keywordText: string;
  serpData: BronSerpReport | null;
  metrics: KeywordMetrics | undefined;
  pageSpeed: PageSpeedScore | undefined;
  movement: { google: number; bing: number; yahoo: number };
  linksInCount: number;
  linksOutCount: number;
  linkoutUrl: string | null;
}

interface TooltipData extends NodeData {
  aiTip?: string;
  isLoadingTip?: boolean;
}

// AI tip generation
const generateSEOTip = async (node: NodeData): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const tips: string[] = [];
  const googlePos = getPosition(node.serpData?.google);
  const pageSpeedScore = node.pageSpeed?.mobileScore;
  
  if (googlePos === null) {
    tips.push("⚠️ Not ranking yet. Focus on building topical authority with supporting content.");
  } else if (googlePos > 50) {
    tips.push("📈 Outside top 50. Prioritize on-page optimization and internal linking.");
  } else if (googlePos > 20) {
    tips.push("🎯 Almost there! Add more comprehensive content and build quality backlinks.");
  } else if (googlePos > 10) {
    tips.push("🔥 Top 20! Optimize for featured snippets and improve engagement.");
  } else if (googlePos > 3) {
    tips.push("⭐ Top 10! Focus on CTR optimization with compelling meta descriptions.");
  } else {
    tips.push("🏆 Top 3! Maintain position with fresh content updates.");
  }
  
  if (pageSpeedScore !== undefined && pageSpeedScore < 50) {
    tips.push("🐌 Poor page speed. Optimize images and reduce JS.");
  }
  
  if (node.movement.google > 5) {
    tips.push("📊 Great momentum! Continue current strategy.");
  } else if (node.movement.google < -5) {
    tips.push("📉 Rankings dropping. Check for algorithm updates.");
  }
  
  return tips.slice(0, 3).join("\n\n");
};

// Single Node Component - Hierarchical layout version
const ClusterNode = memo(({
  node,
  isHovered,
  isSelected,
  zoom,
  onHover,
  onClick,
}: {
  node: NodeData;
  isHovered: boolean;
  isSelected: boolean;
  zoom: number;
  onHover: (node: NodeData | null) => void;
  onClick: (node: NodeData) => void;
}) => {
  const googlePos = getPosition(node.serpData?.google);
  const movement = node.movement.google;
  
  // Main nodes are larger (money pages), supporting nodes are smaller
  const baseSize = node.isMainNode ? 100 : 70;
  const size = baseSize * zoom;
  
  // Color coding: Money pages use ranking colors, supporting pages use violet/purple
  let fillColor = "rgba(120, 120, 120, 0.3)";
  let strokeColor = "rgba(150, 150, 150, 0.5)";
  let glowStroke = "";
  
  if (node.isMainNode) {
    // Money page - color by ranking
    if (googlePos !== null) {
      if (googlePos <= 3) {
        fillColor = "rgba(16, 185, 129, 0.25)";
        strokeColor = "rgb(52, 211, 153)";
        glowStroke = "rgba(16, 185, 129, 0.4)";
      } else if (googlePos <= 10) {
        fillColor = "rgba(34, 211, 238, 0.25)";
        strokeColor = "rgb(34, 211, 238)";
        glowStroke = "rgba(34, 211, 238, 0.35)";
      } else if (googlePos <= 20) {
        fillColor = "rgba(245, 158, 11, 0.25)";
        strokeColor = "rgb(251, 191, 36)";
      } else if (googlePos <= 50) {
        fillColor = "rgba(249, 115, 22, 0.25)";
        strokeColor = "rgb(251, 146, 60)";
      } else {
        fillColor = "rgba(244, 63, 94, 0.25)";
        strokeColor = "rgb(251, 113, 133)";
      }
    }
  } else {
    // Supporting page - violet/purple color scheme
    fillColor = "rgba(139, 92, 246, 0.2)";
    strokeColor = "rgb(167, 139, 250)";
    if (googlePos !== null && googlePos <= 10) {
      glowStroke = "rgba(139, 92, 246, 0.35)";
    }
  }
  
  const hoverScale = isHovered || isSelected ? 1.1 : 1;
  const finalOpacity = isHovered || isSelected ? 1 : 0.9;
  
  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(node)}
      style={{ cursor: 'pointer' }}
    >
      {/* Glow effect */}
      {glowStroke && (
        <circle
          r={size / 2 + 12}
          fill="none"
          stroke={glowStroke}
          strokeWidth={8}
          style={{
            filter: 'blur(10px)',
            opacity: isHovered || isSelected ? 0.9 : 0.5,
          }}
        />
      )}
      
      {/* Main circle */}
      <circle
        r={(size / 2) * hoverScale}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={node.isMainNode ? 4 : 2.5}
        style={{
          opacity: finalOpacity,
          transition: 'all 0.2s ease',
          filter: isHovered || isSelected ? 'brightness(1.3)' : 'none',
        }}
      />
      
      {/* Position badge */}
      {googlePos !== null && (
        <g transform={`translate(0, ${-size / 8})`}>
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--foreground))"
            fontSize={node.isMainNode ? 22 * zoom : 16 * zoom}
            fontWeight={700}
          >
            #{googlePos}
          </text>
        </g>
      )}
      
      {/* Movement indicator */}
      {movement !== 0 && (
        <g transform={`translate(${size / 2 - 10}, ${-size / 2 + 10})`}>
          <circle
            r={12}
            fill={movement > 0 ? "rgba(16, 185, 129, 0.95)" : "rgba(244, 63, 94, 0.95)"}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={11}
            fontWeight="bold"
          >
            {movement > 0 ? `+${movement}` : movement}
          </text>
        </g>
      )}
      
      {/* Keyword label */}
      <g transform={`translate(0, ${size / 2 + 18})`}>
        <text
          textAnchor="middle"
          dominantBaseline="hanging"
          fill="hsl(var(--foreground) / 0.85)"
          fontSize={12 * zoom}
          fontWeight={node.isMainNode ? 600 : 400}
        >
          {node.keywordText.length > 25 
            ? node.keywordText.substring(0, 23) + '...' 
            : node.keywordText}
        </text>
      </g>
      
      {/* Money page badge */}
      {node.isMainNode && (
        <g transform={`translate(0, ${size / 2 + 38})`}>
          <rect
            x={-30}
            y={0}
            width={60}
            height={18}
            rx={9}
            fill="rgba(245, 158, 11, 0.9)"
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={10}
            fontWeight="700"
            y={9}
          >
            MONEY
          </text>
        </g>
      )}
      
      {/* Supporting badge */}
      {!node.isMainNode && (
        <g transform={`translate(0, ${size / 2 + 38})`}>
          <rect
            x={-38}
            y={0}
            width={76}
            height={16}
            rx={8}
            fill="rgba(139, 92, 246, 0.8)"
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={9}
            fontWeight="600"
            y={8}
          >
            SUPPORTING
          </text>
        </g>
      )}
    </g>
  );
});
ClusterNode.displayName = 'ClusterNode';

// Connection Line Component
const ConnectionLine = memo(({
  from,
  to,
  isHighlighted,
  isUrlConnection,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isHighlighted: boolean;
  isUrlConnection: boolean;
}) => {
  // URL connections are solid amber, regular connections are dashed gray
  const stroke = isUrlConnection
    ? "rgba(251, 191, 36, 0.9)"
    : isHighlighted
      ? "rgba(167, 139, 250, 0.8)"
      : "hsl(var(--muted-foreground) / 0.25)";

  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={stroke}
      strokeWidth={isUrlConnection ? 3 : isHighlighted ? 2 : 1.5}
      strokeDasharray={isUrlConnection ? undefined : "6,4"}
      style={{ transition: "stroke 200ms ease, stroke-width 200ms ease" }}
    />
  );
});
ConnectionLine.displayName = 'ConnectionLine';

// Tooltip Component
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
  
  return (
    <div
      className="absolute z-50 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl p-4 min-w-[320px] max-w-[400px]"
      style={{
        left: position.x + 20,
        top: position.y - 50,
        transform: position.x > window.innerWidth / 2 ? 'translateX(-100%)' : 'none',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="font-semibold text-foreground">{data.keywordText}</h4>
          {data.keyword.linkouturl && (
            <a
              href={data.keyword.linkouturl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
            >
              {data.keyword.linkouturl}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <Badge className={data.isMainNode 
          ? "bg-amber-500/20 text-amber-400 border-amber-400/50 text-xs"
          : "bg-violet-500/20 text-violet-400 border-violet-400/50 text-xs"
        }>
          {data.isMainNode ? "Money Page" : "Supporting"}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <div className="text-xs text-muted-foreground mb-1">Google</div>
          <div className="font-bold text-foreground">{googlePos ?? '—'}</div>
          {data.movement.google !== 0 && (
            <div className={`text-xs flex items-center justify-center gap-0.5 ${data.movement.google > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {data.movement.google > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(data.movement.google)}
            </div>
          )}
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <div className="text-xs text-muted-foreground mb-1">Bing</div>
          <div className="font-bold text-foreground">{bingPos ?? '—'}</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <div className="text-xs text-muted-foreground mb-1">Yahoo</div>
          <div className="font-bold text-foreground">{yahooPos ?? '—'}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Speed</div>
          <div className="font-semibold text-sm">
            {data.pageSpeed?.mobileScore !== undefined ? `${data.pageSpeed.mobileScore}` : '—'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">CPC</div>
          <div className="font-semibold text-sm">
            {data.metrics?.cpc !== undefined ? `$${data.metrics.cpc.toFixed(2)}` : '—'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Volume</div>
          <div className="font-semibold text-sm">
            {data.metrics?.search_volume !== undefined 
              ? data.metrics.search_volume >= 1000 
                ? `${(data.metrics.search_volume / 1000).toFixed(1)}K`
                : data.metrics.search_volume
              : '—'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Links</div>
          <div className="font-semibold text-sm">{data.linksInCount}/{data.linksOutCount}</div>
        </div>
      </div>
      
      <div className="border-t border-border/50 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-medium text-violet-400">AI SEO Tips</span>
        </div>
        {data.isLoadingTip ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing...
          </div>
        ) : data.aiTip ? (
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {data.aiTip}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic">
            Hover to generate tips
          </div>
        )}
      </div>
    </div>
  );
});
NodeTooltip.displayName = 'NodeTooltip';

// Main Visualization Component
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
  
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [currentClusterIndex, setCurrentClusterIndex] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });

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

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    setZoom(1);
    setHoveredNode(null);
    setSelectedNode(null);
    setTooltipData(null);
    setCurrentClusterIndex(0);
  }, [isOpen]);
  
  // Measure container size
  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({
        width: Math.max(rect.width, 800),
        height: Math.max(rect.height - 64, 600),
      });
    };

    updateSize();

    const ro = new ResizeObserver(() => updateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);

  // Current cluster to display
  const currentCluster = clusters[currentClusterIndex];
  
  // Generate hierarchical node positions for current cluster
  // Money page at top center, supporting pages at bottom left/right
  const nodes = useMemo(() => {
    const result: NodeData[] = [];
    
    if (!currentCluster) return result;
    
    const UNRANKED_POSITION = 1000;
    const calculateMovement = (baseline: number | null, current: number | null): number => {
      if (baseline === null && current === null) return 0;
      const effectiveBaseline = baseline === null ? UNRANKED_POSITION : baseline;
      const effectiveCurrent = current === null ? UNRANKED_POSITION : current;
      return effectiveBaseline - effectiveCurrent;
    };
    
    const centerX = containerSize.width / 2;
    const topY = containerSize.height * 0.25;
    const bottomY = containerSize.height * 0.65;
    const horizontalSpread = containerSize.width * 0.3;
    
    // Cache SERP lookups
    const serpCache = new Map<string, BronSerpReport | null>();
    const getSerp = (keywordText: string) => {
      const key = keywordText.toLowerCase().trim();
      const cached = serpCache.get(key);
      if (cached !== undefined) return cached;
      const found = findSerpForKeyword(keywordText, serpReports);
      serpCache.set(key, found);
      return found;
    };

    const getUrlForKeyword = (kw: BronKeyword, kwText: string) => {
      if (kw.linkouturl) return kw.linkouturl;
      if (selectedDomain) {
        const slug = kwText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return `https://${selectedDomain}/${slug}`;
      }
      return null;
    };

    // Parent (Money Page) - centered at top
    const parentKeywordText = getKeywordDisplayText(currentCluster.parent);
    const parentSerpData = getSerp(parentKeywordText);
    const parentKey = parentKeywordText.toLowerCase();
    const parentInitial = initialPositions[parentKey] || { google: null, bing: null, yahoo: null };
    const parentGooglePos = getPosition(parentSerpData?.google);
    const parentUrl = getUrlForKeyword(currentCluster.parent, parentKeywordText);
    const parentUrlKey = parentUrl ? normalizeUrlKey(parentUrl) : null;
    const parentLinkCounts = parentUrlKey ? linkCountsByUrl.get(parentUrlKey) : undefined;
    
    result.push({
      id: currentCluster.parent.id,
      keyword: currentCluster.parent,
      x: centerX,
      y: topY,
      isMainNode: true,
      clusterIndex: currentClusterIndex,
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
    });
    
    // Children (Supporting Pages) - positioned below, left and right
    const numChildren = currentCluster.children.length;
    currentCluster.children.forEach((child, childIndex) => {
      // Position: first child bottom-left, second bottom-right, others spread below
      let childX: number;
      let childY: number;
      
      if (numChildren === 1) {
        childX = centerX;
        childY = bottomY;
      } else if (numChildren === 2) {
        childX = centerX + (childIndex === 0 ? -horizontalSpread : horizontalSpread);
        childY = bottomY;
      } else {
        // More than 2: spread them in an arc below
        const spreadAngle = Math.PI * 0.6; // 108 degrees
        const startAngle = Math.PI / 2 - spreadAngle / 2;
        const angle = startAngle + (childIndex / (numChildren - 1)) * spreadAngle;
        const radius = containerSize.width * 0.35;
        childX = centerX + Math.cos(angle) * radius * (childIndex % 2 === 0 ? -1 : 1);
        childY = bottomY + (childIndex > 1 ? 80 : 0);
      }
      
      const childKeywordText = getKeywordDisplayText(child);
      const childSerpData = getSerp(childKeywordText);
      const childKey = childKeywordText.toLowerCase();
      const childInitial = initialPositions[childKey] || { google: null, bing: null, yahoo: null };
      const childGooglePos = getPosition(childSerpData?.google);
      const childUrl = getUrlForKeyword(child, childKeywordText);
      const childUrlKey = childUrl ? normalizeUrlKey(childUrl) : null;
      const childLinkCounts = childUrlKey ? linkCountsByUrl.get(childUrlKey) : undefined;
      
      result.push({
        id: child.id,
        keyword: child,
        x: childX,
        y: childY,
        isMainNode: false,
        clusterIndex: currentClusterIndex,
        childIndex,
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
      });
    });
    
    return result;
  }, [currentCluster, serpReports, keywordMetrics, pageSpeedScores, selectedDomain, initialPositions, containerSize, linkCountsByUrl, isBaselineReport, currentClusterIndex]);

  const nodeById = useMemo(() => {
    const map = new Map<string, NodeData>();
    for (const n of nodes) map.set(String(n.id), n);
    return map;
  }, [nodes]);
  
  // Generate connection lines - check for URL-based connections
  const connections = useMemo(() => {
    const result: { from: NodeData; to: NodeData; isUrlConnection: boolean }[] = [];
    
    if (!currentCluster) return result;
    
    const parentNode = nodeById.get(String(currentCluster.parent.id));
    if (!parentNode) return result;
    
    const parentUrlKey = parentNode.linkoutUrl ? normalizeUrlKey(parentNode.linkoutUrl) : null;
    
    currentCluster.children.forEach(child => {
      const childNode = nodeById.get(String(child.id));
      if (childNode) {
        // Check if child's linkouturl matches parent's URL (URL connection)
        let isUrlConnection = false;
        if (childNode.linkoutUrl && parentUrlKey) {
          const childUrlKey = normalizeUrlKey(childNode.linkoutUrl);
          // Check if the child links TO the parent
          isUrlConnection = childUrlKey === parentUrlKey;
        }
        
        // Also check linksOut for connections to parent
        if (!isUrlConnection && childNode.linkoutUrl) {
          const childUrlKey = normalizeUrlKey(childNode.linkoutUrl);
          for (const link of linksOut) {
            const linkTarget = getLinkTargetKey(link, "out");
            if (linkTarget && parentUrlKey && linkTarget === parentUrlKey) {
              const linkSource = link.source_url ? normalizeUrlKey(link.source_url) : null;
              if (linkSource === childUrlKey) {
                isUrlConnection = true;
                break;
              }
            }
          }
        }
        
        result.push({ from: parentNode, to: childNode, isUrlConnection });
      }
    });
    
    return result;
  }, [currentCluster, nodeById, linksOut]);
  
  // Handle hover with AI tip generation
  const handleNodeHover = useCallback(async (node: NodeData | null) => {
    setHoveredNode(node);
    
    if (node) {
      setTooltipData({ ...node, isLoadingTip: true });
      
      try {
        const tip = await generateSEOTip(node);
        setTooltipData(prev => prev?.id === node.id ? { ...prev, aiTip: tip, isLoadingTip: false } : prev);
      } catch {
        setTooltipData(prev => prev?.id === node.id ? { ...prev, isLoadingTip: false } : prev);
      }
    } else {
      setTooltipData(null);
    }
  }, []);
  
  // Handle node click
  const handleNodeClick = useCallback((node: NodeData) => {
    if (node.keyword.linkouturl) {
      window.open(node.keyword.linkouturl, '_blank');
    }
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);
  
  // Mouse move for tooltip positioning
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);
  
  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  }, []);
  
  const handleReset = useCallback(() => {
    setZoom(1);
  }, []);

  // Navigation handlers
  const handlePrevCluster = useCallback(() => {
    setCurrentClusterIndex(prev => prev > 0 ? prev - 1 : clusters.length - 1);
    setHoveredNode(null);
    setTooltipData(null);
  }, [clusters.length]);

  const handleNextCluster = useCallback(() => {
    setCurrentClusterIndex(prev => prev < clusters.length - 1 ? prev + 1 : 0);
    setHoveredNode(null);
    setTooltipData(null);
  }, [clusters.length]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevCluster();
      } else if (e.key === 'ArrowRight') {
        handleNextCluster();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, handlePrevCluster, handleNextCluster]);
  
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-background overflow-hidden"
      style={{ isolation: "isolate" }}
      onMouseMove={handleMouseMove}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-background border-b border-border/50 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">Keyword Cluster Map</h2>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            {clusters.length} Clusters
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Cluster navigation */}
          {clusters.length > 1 && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevCluster}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm min-w-[60px] text-center">
                {currentClusterIndex + 1} / {clusters.length}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextCluster}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute top-20 left-6 z-20 bg-card border border-border/50 rounded-xl p-4 shadow-lg">
        <h4 className="text-sm font-medium mb-3 text-foreground">Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500/40 border-2 border-emerald-400" />
            <span className="text-muted-foreground">Money Page (by rank)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-violet-500/30 border-2 border-violet-400" />
            <span className="text-muted-foreground">Supporting Page</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-6 h-0.5 bg-amber-400" />
            <span className="text-muted-foreground">URL Link</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t-2 border-dashed border-muted-foreground/40" />
            <span className="text-muted-foreground">Cluster Relation</span>
          </div>
        </div>
      </div>
      
      {/* Canvas (Static - no panning) */}
      <div
        ref={containerRef}
        className="w-full h-full pt-16 overflow-hidden relative"
        style={{ contain: 'layout style paint' }}
      >
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="text-lg mb-2">No clusters to display</p>
              <p className="text-sm">Add keywords with parent-child relationships to see clusters</p>
            </div>
          </div>
        ) : (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
            className="select-none block"
            preserveAspectRatio="xMidYMid meet"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            {/* Connection lines */}
            {connections.map((conn, i) => (
              <ConnectionLine
                key={`conn-${i}`}
                from={conn.from}
                to={conn.to}
                isHighlighted={
                  hoveredNode?.id === conn.from.id || 
                  hoveredNode?.id === conn.to.id ||
                  selectedNode?.id === conn.from.id ||
                  selectedNode?.id === conn.to.id
                }
                isUrlConnection={conn.isUrlConnection}
              />
            ))}
            
            {/* Nodes */}
            {nodes.map(node => (
              <ClusterNode
                key={node.id}
                node={node}
                isHovered={hoveredNode?.id === node.id}
                isSelected={selectedNode?.id === node.id}
                zoom={zoom}
                onHover={handleNodeHover}
                onClick={handleNodeClick}
              />
            ))}
          </svg>
        )}
      </div>
      
      {/* Tooltip */}
      {tooltipData && (
        <NodeTooltip data={tooltipData} position={mousePos} />
      )}
      
      {/* Current cluster name */}
      {currentCluster && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 bg-card border border-border/50 rounded-xl px-6 py-3 shadow-lg">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Current Cluster</div>
            <div className="font-semibold text-foreground">
              {getKeywordDisplayText(currentCluster.parent)}
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-card border border-border/50 rounded-full px-4 py-2 text-sm text-muted-foreground shadow-lg">
        Hover for details · Click node to open URL · ← → to navigate · ESC to close
      </div>
    </div>
  , document.body);
});

BronClusterVisualization.displayName = 'BronClusterVisualization';
