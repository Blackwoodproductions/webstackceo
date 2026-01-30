import { memo, useState, useMemo, useCallback, useRef, useEffect } from "react";
import { ExternalLink, TrendingUp, TrendingDown, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}

interface TooltipData extends NodeData {
  aiTip?: string;
  isLoadingTip?: boolean;
}

// AI tip generation
const generateSEOTip = async (node: NodeData): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const tips: string[] = [];
  const googlePos = getPosition(node.serpData?.google);
  
  if (googlePos === null) {
    tips.push("⚠️ Not ranking. Build topical authority.");
  } else if (googlePos > 50) {
    tips.push("📈 Outside top 50. Focus on on-page SEO.");
  } else if (googlePos > 10) {
    tips.push("🎯 Close! Add quality backlinks.");
  } else if (googlePos > 3) {
    tips.push("⭐ Top 10! Optimize CTR.");
  } else {
    tips.push("🏆 Top 3! Maintain with fresh content.");
  }
  
  if (node.movement.google > 5) {
    tips.push("📊 Great momentum!");
  } else if (node.movement.google < -5) {
    tips.push("📉 Check algorithm updates.");
  }
  
  return tips.join(" ");
};

// Mini Cluster Card Component - Shows one cluster with parent + children
const MiniClusterCard = memo(({
  cluster,
  serpReports,
  keywordMetrics,
  pageSpeedScores,
  selectedDomain,
  initialPositions,
  linkCountsByUrl,
  linksOut,
  isBaselineReport,
  onNodeHover,
  onNodeClick,
  hoveredNode,
}: {
  cluster: ClusterData;
  serpReports: BronSerpReport[];
  keywordMetrics: Record<string, KeywordMetrics>;
  pageSpeedScores: Record<string, PageSpeedScore>;
  selectedDomain?: string;
  initialPositions: Record<string, InitialPositions>;
  linkCountsByUrl: Map<string, { in: number; out: number }>;
  linksOut: BronLink[];
  isBaselineReport: boolean;
  onNodeHover: (node: NodeData | null, e: React.MouseEvent) => void;
  onNodeClick: (node: NodeData) => void;
  hoveredNode: NodeData | null;
}) => {
  const UNRANKED_POSITION = 1000;
  const calculateMovement = (baseline: number | null, current: number | null): number => {
    if (baseline === null && current === null) return 0;
    const effectiveBaseline = baseline === null ? UNRANKED_POSITION : baseline;
    const effectiveCurrent = current === null ? UNRANKED_POSITION : current;
    return effectiveBaseline - effectiveCurrent;
  };

  const getSerp = (keywordText: string) => {
    return findSerpForKeyword(keywordText, serpReports);
  };

  const getUrlForKeyword = (kw: BronKeyword, kwText: string) => {
    if (kw.linkouturl) return kw.linkouturl;
    if (selectedDomain) {
      const slug = kwText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `https://${selectedDomain}/${slug}`;
    }
    return null;
  };

  // Build nodes
  const parentKeywordText = getKeywordDisplayText(cluster.parent);
  const parentSerpData = getSerp(parentKeywordText);
  const parentKey = parentKeywordText.toLowerCase();
  const parentInitial = initialPositions[parentKey] || { google: null, bing: null, yahoo: null };
  const parentGooglePos = getPosition(parentSerpData?.google);
  const parentUrl = getUrlForKeyword(cluster.parent, parentKeywordText);
  const parentUrlKey = parentUrl ? normalizeUrlKey(parentUrl) : null;
  const parentLinkCounts = parentUrlKey ? linkCountsByUrl.get(parentUrlKey) : undefined;

  const parentNode: NodeData = {
    id: cluster.parent.id,
    keyword: cluster.parent,
    x: 0, y: 0,
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
  };

  const childNodes: NodeData[] = cluster.children.map(child => {
    const childKeywordText = getKeywordDisplayText(child);
    const childSerpData = getSerp(childKeywordText);
    const childKey = childKeywordText.toLowerCase();
    const childInitial = initialPositions[childKey] || { google: null, bing: null, yahoo: null };
    const childGooglePos = getPosition(childSerpData?.google);
    const childUrl = getUrlForKeyword(child, childKeywordText);
    const childUrlKey = childUrl ? normalizeUrlKey(childUrl) : null;
    const childLinkCounts = childUrlKey ? linkCountsByUrl.get(childUrlKey) : undefined;

    return {
      id: child.id,
      keyword: child,
      x: 0, y: 0,
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
    };
  });

  // Check URL connections
  const getUrlConnection = (childNode: NodeData) => {
    if (!childNode.linkoutUrl || !parentUrlKey) return false;
    const childUrlKey = normalizeUrlKey(childNode.linkoutUrl);
    if (childUrlKey === parentUrlKey) return true;
    
    for (const link of linksOut) {
      const linkTarget = getLinkTargetKey(link, "out");
      if (linkTarget && linkTarget === parentUrlKey) {
        const linkSource = link.source_url ? normalizeUrlKey(link.source_url) : null;
        if (linkSource === childUrlKey) return true;
      }
    }
    return false;
  };

  // Render a mini node
  const renderNode = (node: NodeData, size: number) => {
    const googlePos = getPosition(node.serpData?.google);
    const movement = node.movement.google;
    const isHovered = hoveredNode?.id === node.id;
    
    let bgColor = "bg-muted/50";
    let borderColor = "border-muted-foreground/30";
    let textColor = "text-muted-foreground";
    
    if (node.isMainNode) {
      if (googlePos !== null) {
        if (googlePos <= 3) {
          bgColor = "bg-emerald-500/20";
          borderColor = "border-emerald-400";
          textColor = "text-emerald-400";
        } else if (googlePos <= 10) {
          bgColor = "bg-cyan-500/20";
          borderColor = "border-cyan-400";
          textColor = "text-cyan-400";
        } else if (googlePos <= 20) {
          bgColor = "bg-amber-500/20";
          borderColor = "border-amber-400";
          textColor = "text-amber-400";
        } else {
          bgColor = "bg-orange-500/20";
          borderColor = "border-orange-400";
          textColor = "text-orange-400";
        }
      }
    } else {
      bgColor = "bg-violet-500/15";
      borderColor = "border-violet-400/60";
      textColor = "text-violet-400";
    }

    return (
      <div
        key={node.id}
        className={`relative flex flex-col items-center cursor-pointer transition-transform ${isHovered ? 'scale-110' : ''}`}
        onMouseEnter={(e) => onNodeHover(node, e)}
        onMouseLeave={(e) => onNodeHover(null, e)}
        onClick={() => onNodeClick(node)}
      >
        <div 
          className={`${bgColor} ${borderColor} border-2 rounded-full flex items-center justify-center relative`}
          style={{ width: size, height: size }}
        >
          <span className={`font-bold text-xs ${textColor}`}>
            {googlePos !== null ? `#${googlePos}` : '—'}
          </span>
          
          {/* Movement badge */}
          {movement !== 0 && (
            <div 
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${movement > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
            >
              {movement > 0 ? '+' : ''}{movement > 99 ? '99+' : movement < -99 ? '-99' : movement}
            </div>
          )}
        </div>
        
        {/* Label */}
        <span className="text-[9px] text-muted-foreground mt-1 max-w-[60px] truncate text-center">
          {node.keywordText.length > 12 ? node.keywordText.substring(0, 10) + '…' : node.keywordText}
        </span>
        
        {/* Badge */}
        <span className={`text-[7px] px-1.5 py-0.5 rounded-full mt-0.5 ${node.isMainNode ? 'bg-amber-500/80 text-white' : 'bg-violet-500/70 text-white'}`}>
          {node.isMainNode ? 'MONEY' : 'SUPPORT'}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-card/50 border border-border/40 rounded-lg p-3 hover:border-primary/30 transition-colors">
      {/* Cluster title */}
      <div className="text-xs font-medium text-foreground mb-3 truncate text-center" title={parentKeywordText}>
        {parentKeywordText.length > 30 ? parentKeywordText.substring(0, 28) + '…' : parentKeywordText}
      </div>
      
      {/* Visual layout: Parent on top, children below */}
      <div className="flex flex-col items-center gap-2">
        {/* Parent (Money Page) */}
        {renderNode(parentNode, 44)}
        
        {/* Connection lines (simplified as a visual indicator) */}
        {childNodes.length > 0 && (
          <div className="flex items-center justify-center gap-1 -my-1">
            {childNodes.map((child, i) => (
              <div 
                key={`line-${i}`}
                className={`w-px h-4 ${getUrlConnection(child) ? 'bg-amber-400' : 'bg-muted-foreground/30'}`}
                style={{ transform: `rotate(${childNodes.length > 1 ? (i - (childNodes.length - 1) / 2) * 25 : 0}deg)` }}
              />
            ))}
          </div>
        )}
        
        {/* Children (Supporting Pages) */}
        {childNodes.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {childNodes.slice(0, 3).map(child => renderNode(child, 36))}
            {childNodes.length > 3 && (
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted/50 border border-muted-foreground/20">
                <span className="text-[9px] text-muted-foreground">+{childNodes.length - 3}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
MiniClusterCard.displayName = 'MiniClusterCard';

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
      className="fixed z-[100] bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl p-3 min-w-[260px] max-w-[320px] pointer-events-none"
      style={{
        left: Math.min(position.x + 15, window.innerWidth - 340),
        top: Math.min(position.y - 20, window.innerHeight - 280),
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-foreground text-sm truncate">{data.keywordText}</h4>
          {data.keyword.linkouturl && (
            <a
              href={data.keyword.linkouturl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="truncate max-w-[160px]">{data.keyword.linkouturl}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          )}
        </div>
        <Badge className={data.isMainNode 
          ? "bg-amber-500/20 text-amber-400 border-amber-400/50 text-xs flex-shrink-0"
          : "bg-violet-500/20 text-violet-400 border-violet-400/50 text-xs flex-shrink-0"
        }>
          {data.isMainNode ? "Money" : "Support"}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        <div className="bg-muted/50 rounded-lg p-1.5 text-center">
          <div className="text-[10px] text-muted-foreground">Google</div>
          <div className="font-bold text-foreground text-sm">{googlePos ?? '—'}</div>
          {data.movement.google !== 0 && (
            <div className={`text-[10px] flex items-center justify-center gap-0.5 ${data.movement.google > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {data.movement.google > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {Math.abs(data.movement.google)}
            </div>
          )}
        </div>
        <div className="bg-muted/50 rounded-lg p-1.5 text-center">
          <div className="text-[10px] text-muted-foreground">Bing</div>
          <div className="font-bold text-foreground text-sm">{bingPos ?? '—'}</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-1.5 text-center">
          <div className="text-[10px] text-muted-foreground">Yahoo</div>
          <div className="font-bold text-foreground text-sm">{yahooPos ?? '—'}</div>
        </div>
      </div>
      
      <div className="border-t border-border/50 pt-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span className="text-[10px] font-medium text-violet-400">AI Tip</span>
        </div>
        {data.isLoadingTip ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Analyzing...
          </div>
        ) : data.aiTip ? (
          <div className="text-xs text-muted-foreground">
            {data.aiTip}
          </div>
        ) : null}
      </div>
    </div>
  );
});
NodeTooltip.displayName = 'NodeTooltip';

// Main Visualization Component - All clusters on one page
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
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
    setHoveredNode(null);
    setTooltipData(null);
  }, [isOpen]);
  
  // Handle hover with AI tip generation
  const handleNodeHover = useCallback(async (node: NodeData | null, e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
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
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[900px] max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-lg">Keyword Cluster Map</DialogTitle>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                {clusters.length} Clusters
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Hover for details · Click to open URL · Money pages (amber) and supporting pages (violet)
          </p>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(85vh-80px)]">
          <div className="p-4">
            {clusters.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm mb-1">No clusters to display</p>
                  <p className="text-xs">Add keywords with parent-child relationships</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {clusters.map((cluster) => (
                  <MiniClusterCard
                    key={cluster.parentId}
                    cluster={cluster}
                    serpReports={serpReports}
                    keywordMetrics={keywordMetrics}
                    pageSpeedScores={pageSpeedScores}
                    selectedDomain={selectedDomain}
                    initialPositions={initialPositions}
                    linkCountsByUrl={linkCountsByUrl}
                    linksOut={linksOut}
                    isBaselineReport={isBaselineReport}
                    onNodeHover={handleNodeHover}
                    onNodeClick={handleNodeClick}
                    hoveredNode={hoveredNode}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Tooltip */}
        {tooltipData && (
          <NodeTooltip data={tooltipData} position={mousePos} />
        )}
      </DialogContent>
    </Dialog>
  );
});

BronClusterVisualization.displayName = 'BronClusterVisualization';
