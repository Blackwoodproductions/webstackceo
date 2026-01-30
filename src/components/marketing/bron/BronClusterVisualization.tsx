import { memo, useState, useMemo, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink, TrendingUp, TrendingDown, Minus, Sparkles, Loader2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BronKeyword, BronSerpReport, BronLink } from "@/hooks/use-bron-api";
import { getKeywordDisplayText, getPosition, KeywordMetrics, PageSpeedScore } from "./BronKeywordCard";
import { findSerpForKeyword } from "./utils";

function normalizeUrlKey(url: string): string {
  // Stable, fast key for matching URLs across different API fields.
  // NOTE: Intentionally does not use URL() to avoid exceptions/overhead.
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

function getLinkTargetKey(link: BronLink, kind: "in" | "out"): string | null {
  // Inbound links typically have target_url pointing to OUR page.
  // Outbound links typically have link pointing to OUR page.
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
  isBaselineReport?: boolean; // True when viewing the baseline (oldest) report - suppress movements
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
}

interface TooltipData extends NodeData {
  aiTip?: string;
  isLoadingTip?: boolean;
}

// AI tip generation (mock for now - can be connected to real AI)
const generateSEOTip = async (node: NodeData): Promise<string> => {
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const tips: string[] = [];
  const googlePos = getPosition(node.serpData?.google);
  const pageSpeedScore = node.pageSpeed?.mobileScore;
  const searchVol = node.metrics?.search_volume;
  const cpc = node.metrics?.cpc;
  
  // Position-based tips
  if (googlePos === null) {
    tips.push("⚠️ Not ranking yet. Focus on building topical authority with supporting content.");
  } else if (googlePos > 50) {
    tips.push("📈 Outside top 50. Prioritize on-page optimization and internal linking from stronger pages.");
  } else if (googlePos > 20) {
    tips.push("🎯 Almost there! Add more comprehensive content and build 2-3 quality backlinks.");
  } else if (googlePos > 10) {
    tips.push("🔥 Top 20! Optimize for featured snippets and improve user engagement signals.");
  } else if (googlePos > 3) {
    tips.push("⭐ Top 10! Focus on CTR optimization with compelling meta descriptions.");
  } else {
    tips.push("🏆 Top 3! Maintain position with fresh content updates and user experience improvements.");
  }
  
  // PageSpeed tips
  if (pageSpeedScore !== undefined) {
    if (pageSpeedScore < 50) {
      tips.push("🐌 Poor page speed. Optimize images, reduce JS, and enable caching.");
    } else if (pageSpeedScore < 80) {
      tips.push("⚡ Good speed, but room for improvement. Check Core Web Vitals.");
    }
  }
  
  // Movement-based tips
  if (node.movement.google > 5) {
    tips.push("📊 Great momentum! Continue current strategy.");
  } else if (node.movement.google < -5) {
    tips.push("📉 Rankings dropping. Check for algorithm updates or technical issues.");
  }
  
  // Link-based tips
  if (node.linksInCount < 3 && !node.isMainNode) {
    tips.push("🔗 Low internal links. Add contextual links from related content.");
  }
  
  // Volume/CPC tips
  if (searchVol && cpc) {
    if (searchVol > 1000 && cpc > 5) {
      tips.push("💰 High-value keyword! Prioritize ranking for maximum ROI.");
    }
  }
  
  return tips.slice(0, 3).join("\n\n");
};

// Single Node Component
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
  
  // Node sizing
  const baseSize = node.isMainNode ? 80 : 50;
  const size = baseSize * zoom;
  
  // Get actual colors for SVG (not Tailwind classes)
  let fillColor = "rgba(120, 120, 120, 0.3)"; // muted
  let strokeColor = "rgba(150, 150, 150, 0.5)"; // muted-foreground
  let glowStroke = "";
  
  if (googlePos !== null) {
    if (googlePos <= 3) {
      fillColor = "rgba(16, 185, 129, 0.25)"; // emerald-500/25
      strokeColor = "rgb(52, 211, 153)"; // emerald-400
      glowStroke = "rgba(16, 185, 129, 0.4)";
    } else if (googlePos <= 10) {
      fillColor = "rgba(34, 211, 238, 0.25)"; // cyan-500/25
      strokeColor = "rgb(34, 211, 238)"; // cyan-400
      glowStroke = "rgba(34, 211, 238, 0.35)";
    } else if (googlePos <= 20) {
      fillColor = "rgba(245, 158, 11, 0.25)"; // amber-500/25
      strokeColor = "rgb(251, 191, 36)"; // amber-400
    } else if (googlePos <= 50) {
      fillColor = "rgba(249, 115, 22, 0.25)"; // orange-500/25
      strokeColor = "rgb(251, 146, 60)"; // orange-400
    } else {
      fillColor = "rgba(244, 63, 94, 0.25)"; // rose-500/25
      strokeColor = "rgb(251, 113, 133)"; // rose-400
    }
  }
  
  // Hover/selected state
  const hoverScale = isHovered || isSelected ? 1.15 : 1;
  const finalOpacity = isHovered || isSelected ? 1 : 0.85;
  
  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(node)}
      style={{ cursor: 'pointer' }}
    >
      {/* Glow effect for top rankings */}
      {glowStroke && (
        <circle
          r={size / 2 + 10}
          fill="none"
          stroke={glowStroke}
          strokeWidth={6}
          style={{
            filter: 'blur(8px)',
            opacity: isHovered || isSelected ? 0.9 : 0.5,
          }}
        />
      )}
      
      {/* Main circle */}
      <circle
        r={(size / 2) * hoverScale}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={node.isMainNode ? 3 : 2}
        style={{
          opacity: finalOpacity,
          transition: 'all 0.2s ease',
          filter: isHovered || isSelected ? 'brightness(1.3)' : 'none',
        }}
      />
      
      {/* Position badge */}
      {googlePos !== null && (
        <g transform={`translate(0, ${-size / 6})`}>
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--foreground))"
            fontSize={node.isMainNode ? 18 * zoom : 14 * zoom}
            fontWeight={700}
          >
            #{googlePos}
          </text>
        </g>
      )}
      
      {/* Movement indicator */}
      {movement !== 0 && (
        <g transform={`translate(${size / 2 - 8}, ${-size / 2 + 8})`}>
          <circle
            r={10}
            fill={movement > 0 ? "rgba(16, 185, 129, 0.95)" : "rgba(244, 63, 94, 0.95)"}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={10}
            fontWeight="bold"
          >
            {movement > 0 ? `+${movement}` : movement}
          </text>
        </g>
      )}
      
      {/* Keyword label */}
      <g transform={`translate(0, ${size / 2 + 16})`}>
        <text
          textAnchor="middle"
          dominantBaseline="hanging"
          fill="hsl(var(--foreground) / 0.8)"
          fontSize={11 * zoom}
          style={{
            maxWidth: 120,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {node.keywordText.length > 20 
            ? node.keywordText.substring(0, 18) + '...' 
            : node.keywordText}
        </text>
      </g>
      
      {/* Main keyword indicator */}
      {node.isMainNode && (
        <g transform={`translate(0, ${size / 2 + 32})`}>
          <rect
            x={-25}
            y={0}
            width={50}
            height={16}
            rx={8}
            fill="rgba(245, 158, 11, 0.85)"
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={9}
            fontWeight="600"
            y={8}
          >
            MONEY
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
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isHighlighted: boolean;
}) => {
  const stroke = isHighlighted
    ? "rgba(251, 191, 36, 0.95)"
    : "hsl(var(--muted-foreground) / 0.30)";

  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={stroke}
      strokeWidth={isHighlighted ? 2 : 1}
      strokeDasharray={isHighlighted ? undefined : "4,4"}
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
      {/* Header */}
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
        {data.isMainNode && (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/50 text-xs">
            Money Page
          </Badge>
        )}
      </div>
      
      {/* Rankings */}
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
      
      {/* Metrics */}
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
      
      {/* AI Tips */}
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
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const rafMoveRef = useRef<number | null>(null);
  const pendingMoveRef = useRef<{ x: number; y: number } | null>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });

  // Pre-index link counts by target URL to avoid O(nodes * links) filtering (major perf win).
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

  // Keep refs in sync for rAF-driven updates (avoids stale closures)
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    panStartRef.current = panStart;
  }, [panStart]);

  useEffect(() => {
    isPanningRef.current = isPanning;
  }, [isPanning]);

  // Reset view state on open (prevents “blank map” from stale pan/zoom)
  useEffect(() => {
    if (!isOpen) return;
    // Auto-calculate zoom to fit all clusters
    const clusterCount = clusters?.length || 0;
    let initialZoom = 1;
    if (clusterCount > 20) {
      initialZoom = 0.5;
    } else if (clusterCount > 12) {
      initialZoom = 0.65;
    } else if (clusterCount > 8) {
      initialZoom = 0.8;
    }
    setZoom(initialZoom);
    setPan({ x: 0, y: 0 });
    setIsPanning(false);
    setPanStart({ x: 0, y: 0 });
    setHoveredNode(null);
    setSelectedNode(null);
    setTooltipData(null);
  }, [isOpen, clusters?.length]);
  
  // Measure container size (robust inside fixed/fullscreen modals)
  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({
        width: Math.max(rect.width, 800),
        height: Math.max(rect.height - 64, 600), // keep nodes away from header
      });
    };

    updateSize();

    const ro = new ResizeObserver(() => updateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);
  
  // Generate node positions using a grid-based cluster layout
  // Each cluster is arranged in a grid pattern, with main nodes in the center
  // and child nodes arranged around them
  const nodes = useMemo(() => {
    const result: NodeData[] = [];
    
    // Exit early if no clusters
    if (!clusters || clusters.length === 0) return result;
    
    // Helper: Calculate movement using position 1000 as baseline for unranked keywords
    const UNRANKED_POSITION = 1000;
    const calculateMovement = (baseline: number | null, current: number | null): number => {
      // Both unranked = no movement
      if (baseline === null && current === null) return 0;
      
      const effectiveBaseline = baseline === null ? UNRANKED_POSITION : baseline;
      const effectiveCurrent = current === null ? UNRANKED_POSITION : current;
      
      return effectiveBaseline - effectiveCurrent;
    };
    
    // Grid layout configuration
    const padding = 80;
    const clusterSpacing = 280; // Space between cluster centers
    const childRadius = 90; // Distance of children from parent
    
    // Calculate grid dimensions based on number of clusters
    const cols = Math.ceil(Math.sqrt(clusters.length * 1.5)); // Slightly wider than tall
    const rows = Math.ceil(clusters.length / cols);
    
    // Calculate total grid size
    const gridWidth = cols * clusterSpacing;
    const gridHeight = rows * clusterSpacing;
    
    // Center offset - position grid in center of container
    const offsetX = (containerSize.width - gridWidth) / 2 + clusterSpacing / 2;
    const offsetY = padding + clusterSpacing / 2;
    
    // Cache expensive lookups for this computation pass
    const serpCache = new Map<string, BronSerpReport | null>();
    const getSerp = (keywordText: string) => {
      const key = keywordText.toLowerCase().trim();
      const cached = serpCache.get(key);
      if (cached !== undefined) return cached;
      const found = findSerpForKeyword(keywordText, serpReports);
      serpCache.set(key, found);
      return found;
    };

    clusters.forEach((cluster, clusterIndex) => {
      // Calculate grid position for this cluster
      const col = clusterIndex % cols;
      const row = Math.floor(clusterIndex / cols);
      
      // Position cluster center
      const clusterX = offsetX + col * clusterSpacing;
      const clusterY = offsetY + row * clusterSpacing;
      
      const parentKeywordText = getKeywordDisplayText(cluster.parent);
      const parentSerpData = getSerp(parentKeywordText);
      const parentKey = parentKeywordText.toLowerCase();
      const parentInitial = initialPositions[parentKey] || { google: null, bing: null, yahoo: null };
      const parentGooglePos = getPosition(parentSerpData?.google);
      
      // Get page speed URL
      let parentUrl = cluster.parent.linkouturl;
      if (!parentUrl && selectedDomain) {
        const slug = parentKeywordText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        parentUrl = `https://${selectedDomain}/${slug}`;
      }

      const parentUrlKey = parentUrl ? normalizeUrlKey(parentUrl) : null;
      const parentLinkCounts = parentUrlKey ? linkCountsByUrl.get(parentUrlKey) : undefined;
      
      // Add parent node
      result.push({
        id: cluster.parent.id,
        keyword: cluster.parent,
        x: clusterX,
        y: clusterY,
        isMainNode: true,
        clusterIndex,
        keywordText: parentKeywordText,
        serpData: parentSerpData,
        metrics: keywordMetrics[parentKey],
        pageSpeed: parentUrl ? pageSpeedScores[parentUrl] : undefined,
        movement: isBaselineReport
          ? { google: 0, bing: 0, yahoo: 0 } // Suppress movement on baseline report
          : {
              google: calculateMovement(parentInitial.google, parentGooglePos),
              bing: calculateMovement(parentInitial.bing, getPosition(parentSerpData?.bing)),
              yahoo: calculateMovement(parentInitial.yahoo, getPosition(parentSerpData?.yahoo)),
            },
        linksInCount: parentLinkCounts?.in ?? 0,
        linksOutCount: parentLinkCounts?.out ?? 0,
      });
      
      // Position children around parent in a circle
      const numChildren = cluster.children.length;
      cluster.children.forEach((child, childIndex) => {
        // Distribute children evenly around the parent
        const childAngle = (childIndex / Math.max(numChildren, 1)) * 2 * Math.PI - Math.PI / 2;
        const childX = clusterX + Math.cos(childAngle) * childRadius;
        const childY = clusterY + Math.sin(childAngle) * childRadius;
        
        const childKeywordText = getKeywordDisplayText(child);
        const childSerpData = getSerp(childKeywordText);
        const childKey = childKeywordText.toLowerCase();
        const childInitial = initialPositions[childKey] || { google: null, bing: null, yahoo: null };
        const childGooglePos = getPosition(childSerpData?.google);
        
        let childUrl = child.linkouturl;
        if (!childUrl && selectedDomain) {
          const slug = childKeywordText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          childUrl = `https://${selectedDomain}/${slug}`;
        }

        const childUrlKey = childUrl ? normalizeUrlKey(childUrl) : null;
        const childLinkCounts = childUrlKey ? linkCountsByUrl.get(childUrlKey) : undefined;
        
        result.push({
          id: child.id,
          keyword: child,
          x: childX,
          y: childY,
          isMainNode: false,
          clusterIndex,
          childIndex,
          keywordText: childKeywordText,
          serpData: childSerpData,
          metrics: keywordMetrics[childKey],
          pageSpeed: childUrl ? pageSpeedScores[childUrl] : undefined,
          movement: isBaselineReport
            ? { google: 0, bing: 0, yahoo: 0 } // Suppress movement on baseline report
            : {
                google: calculateMovement(childInitial.google, childGooglePos),
                bing: calculateMovement(childInitial.bing, getPosition(childSerpData?.bing)),
                yahoo: calculateMovement(childInitial.yahoo, getPosition(childSerpData?.yahoo)),
              },
          linksInCount: childLinkCounts?.in ?? 0,
          linksOutCount: childLinkCounts?.out ?? 0,
        });
      });
    });
    
    return result;
  }, [clusters, serpReports, keywordMetrics, pageSpeedScores, selectedDomain, initialPositions, containerSize, linkCountsByUrl, isBaselineReport]);

  const nodeById = useMemo(() => {
    const map = new Map<string, NodeData>();
    for (const n of nodes) map.set(String(n.id), n);
    return map;
  }, [nodes]);
  
  // Generate connection lines
  const connections = useMemo(() => {
    const result: { from: NodeData; to: NodeData }[] = [];
    
    clusters.forEach((cluster, clusterIndex) => {
      const parentNode = nodeById.get(String(cluster.parent.id));
      if (!parentNode) return;
      
      cluster.children.forEach(child => {
        const childNode = nodeById.get(String(child.id));
        if (childNode) {
          result.push({ from: parentNode, to: childNode });
        }
      });
    });
    
    return result;
  }, [clusters, nodeById]);
  
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
  
  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y });
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    pendingMoveRef.current = { x: e.clientX, y: e.clientY };
    if (rafMoveRef.current != null) return;

    rafMoveRef.current = window.requestAnimationFrame(() => {
      rafMoveRef.current = null;
      const pending = pendingMoveRef.current;
      if (!pending) return;

      setMousePos({ x: pending.x, y: pending.y });
      if (isPanningRef.current) {
        setPan({
          x: pending.x - panStartRef.current.x,
          y: pending.y - panStartRef.current.y,
        });
      }
    });
  }, []);
  
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);
  
  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.2, 0.4));
  }, []);
  
  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Wheel/trackpad support: pan normally, zoom with Ctrl/Cmd
  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (ev: WheelEvent) => {
      // Only handle wheel when pointer is over the canvas
      // (keeps other UI interactions predictable)
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      if (!el.contains(target)) return;

      // Prevent the underlying page from stealing scroll
      ev.preventDefault();

      const isZoomGesture = ev.ctrlKey || ev.metaKey;
      if (isZoomGesture) {
        const delta = ev.deltaY;
        setZoom((prev) => {
          const next = prev + (delta > 0 ? -0.08 : 0.08);
          return Math.max(0.4, Math.min(2, next));
        });
        return;
      }

      const dx = ev.shiftKey ? ev.deltaY : ev.deltaX;
      const dy = ev.deltaY;
      setPan((prev) => ({ x: prev.x - dx, y: prev.y - dy }));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, [isOpen]);
  
  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, [isOpen, onClose]);

  // Cleanup any pending rAF
  useEffect(() => {
    return () => {
      if (rafMoveRef.current != null) {
        cancelAnimationFrame(rafMoveRef.current);
        rafMoveRef.current = null;
      }
    };
  }, []);
  
  if (!isOpen) return null;

  // IMPORTANT: Render in a portal so this fullscreen overlay is never clipped by
  // any parent stacking context / transforms / scroll containers.
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-background overflow-hidden"
      style={{ isolation: "isolate" }}
      onClick={(e) => e.target === e.currentTarget && e.stopPropagation()}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-background border-b border-border/50 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">Keyword Cluster Map</h2>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            {clusters.length} Clusters · {nodes.length} Keywords
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
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
        <h4 className="text-sm font-medium mb-3 text-foreground">Ranking Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500/40 border-2 border-emerald-400" />
            <span className="text-muted-foreground">Top 3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-cyan-500/40 border-2 border-cyan-400" />
            <span className="text-muted-foreground">4-10</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500/40 border-2 border-amber-400" />
            <span className="text-muted-foreground">11-20</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500/40 border-2 border-orange-400" />
            <span className="text-muted-foreground">21-50</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-rose-500/40 border-2 border-rose-400" />
            <span className="text-muted-foreground">51+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-muted/50 border-2 border-muted-foreground/30" />
            <span className="text-muted-foreground">Not Ranking</span>
          </div>
        </div>
      </div>
      
      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full pt-16 cursor-grab active:cursor-grabbing overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
            className="select-none block"
            preserveAspectRatio="xMidYMid meet"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              willChange: 'transform',
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
      
      {/* Instructions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-card border border-border/50 rounded-full px-4 py-2 text-sm text-muted-foreground shadow-lg">
        Click & drag to pan · Hover for details · Click node to open URL · Press ESC to close
      </div>
    </div>
  , document.body);
});

BronClusterVisualization.displayName = 'BronClusterVisualization';
