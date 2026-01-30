import { memo, useState, useMemo, useCallback, useEffect } from "react";
import { ExternalLink, TrendingUp, TrendingDown, Sparkles, Loader2, Link2, Globe, ArrowUpDown, Trophy, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  
  // Check if this cluster links to an external money page (client's site)
  const hasExternalLinkout = !!cluster.parent.linkouturl;
  const linkoutDomain = hasExternalLinkout 
    ? (() => {
        try {
          const url = new URL(cluster.parent.linkouturl!);
          return url.hostname.replace(/^www\./, '');
        } catch {
          return cluster.parent.linkouturl?.split('/')[2]?.replace(/^www\./, '') || '';
        }
      })()
    : null;
  const linkoutPath = hasExternalLinkout
    ? (() => {
        try {
          const url = new URL(cluster.parent.linkouturl!);
          return url.pathname.length > 1 ? url.pathname : '';
        } catch {
          return '';
        }
      })()
    : null;

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
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white ${movement > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
            >
              {movement > 0 ? '+' : ''}{movement > 99 ? '99' : movement < -99 ? '-99' : movement}
            </div>
          )}
        </div>
        
        {/* Label */}
        <span className="text-[8px] text-muted-foreground mt-1 max-w-[55px] truncate text-center leading-tight">
          {node.keywordText.length > 10 ? node.keywordText.substring(0, 8) + '…' : node.keywordText}
        </span>
      </div>
    );
  };

  return (
    <div 
      className={`bg-card/30 border rounded p-1.5 hover:border-primary/30 transition-colors ${hasExternalLinkout ? 'border-cyan-500/40' : 'border-border/30'}`}
      style={{ minWidth: 0 }}
    >
      {/* Cluster title */}
      <div className="text-[8px] font-medium text-foreground mb-1 truncate text-center leading-tight" title={parentKeywordText}>
        {parentKeywordText.length > 20 ? parentKeywordText.substring(0, 18) + '…' : parentKeywordText}
      </div>
      
      {/* External linkout destination indicator */}
      {hasExternalLinkout && linkoutPath && (
        <div 
          className="flex items-center justify-center gap-0.5 mb-1 px-1 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20"
          title={`Links to: ${cluster.parent.linkouturl}`}
        >
          <Globe className="w-2 h-2 text-cyan-400 flex-shrink-0" />
          <span className="text-[6px] text-cyan-400 truncate max-w-[60px]">
            {linkoutPath.length > 15 ? linkoutPath.substring(0, 13) + '…' : linkoutPath}
          </span>
        </div>
      )}
      
      {/* Visual layout: Parent on top, children below */}
      <div className="flex flex-col items-center gap-1">
        {/* Parent (Money Page) - with external indicator */}
        <div className="relative">
          {renderNode(parentNode, 36)}
          {hasExternalLinkout && (
            <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center" title="Client's Money Page">
              <Link2 className="w-2 h-2 text-white" />
            </div>
          )}
        </div>
        
        {/* Connection lines (simplified as a visual indicator) */}
        {childNodes.length > 0 && (
          <div className="flex items-center justify-center gap-1 h-3">
            {childNodes.slice(0, 2).map((child, i) => (
              <div 
                key={`line-${i}`}
                className={`w-px h-3 ${getUrlConnection(child) ? 'bg-amber-400' : 'bg-muted-foreground/30'}`}
                style={{ transform: `rotate(${childNodes.length > 1 ? (i - 0.5) * 20 : 0}deg)` }}
              />
            ))}
          </div>
        )}
        
        {/* Children (Supporting Pages) - max 2 shown */}
        {childNodes.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1">
            {childNodes.slice(0, 2).map(child => renderNode(child, 28))}
            {childNodes.length > 2 && (
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted/50 border border-muted-foreground/20">
                <span className="text-[8px] text-muted-foreground">+{childNodes.length - 2}</span>
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

// Main Visualization Component - Inline (not a popup/dialog)
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
  const [sortOrder, setSortOrder] = useState<'best' | 'worst'>('best');

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
  
  // Sort clusters by performance (Google ranking)
  const sortedClusters = useMemo(() => {
    const getClusterScore = (cluster: ClusterData) => {
      const keywordText = getKeywordDisplayText(cluster.parent);
      const serpData = findSerpForKeyword(keywordText, serpReports);
      const googlePos = getPosition(serpData?.google);
      // Unranked = 1000, lower is better
      return googlePos ?? 1000;
    };
    
    return [...clusters].sort((a, b) => {
      const scoreA = getClusterScore(a);
      const scoreB = getClusterScore(b);
      return sortOrder === 'best' ? scoreA - scoreB : scoreB - scoreA;
    });
  }, [clusters, serpReports, sortOrder]);

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

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">Keyword Cluster Map</h3>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
            {clusters.length} Money Pages
          </Badge>
          <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30 text-[10px] px-1.5 py-0">
            {totalSupportingKeywords} Supporting
          </Badge>
          {externalLinkoutCount > 0 && (
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px] px-1.5 py-0">
              <Link2 className="w-2.5 h-2.5 mr-0.5" />
              {externalLinkoutCount} Client Pages
            </Badge>
          )}
        </div>
        
        {/* Sort selector and close */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/50 rounded-md p-0.5">
            <Button
              variant={sortOrder === 'best' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortOrder('best')}
              className={`h-6 px-2 text-[10px] gap-1 ${sortOrder === 'best' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : ''}`}
            >
              <Trophy className="w-3 h-3" />
              Best First
            </Button>
            <Button
              variant={sortOrder === 'worst' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortOrder('worst')}
              className={`h-6 px-2 text-[10px] gap-1 ${sortOrder === 'worst' ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : ''}`}
            >
              <AlertTriangle className="w-3 h-3" />
              Needs Work
            </Button>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50"
          >
            <span className="sr-only">Close</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Content - fit all in view without scroll */}
      <div className="p-3">
        {clusters.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground">
              <p className="text-sm mb-1">No clusters to display</p>
              <p className="text-xs">Add keywords with parent-child relationships</p>
            </div>
          </div>
        ) : (
          <div 
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(100px, 1fr))`,
            }}
          >
            {sortedClusters.map((cluster) => (
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
      
      {/* Tooltip */}
      {tooltipData && (
        <NodeTooltip data={tooltipData} position={mousePos} />
      )}
    </div>
  );
});

BronClusterVisualization.displayName = 'BronClusterVisualization';
