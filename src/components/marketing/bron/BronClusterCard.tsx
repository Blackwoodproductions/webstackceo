import { memo, useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { BronKeyword, BronSerpReport, BronLink } from "@/hooks/use-bron-api";
import { BronKeywordCard, getKeywordDisplayText, getPosition, KeywordMetrics, PageSpeedScore } from "./BronKeywordCard";
import { BronKeywordExpanded } from "./BronKeywordExpanded";
import { findSerpForKeyword, filterLinksForKeyword } from "./utils";

interface InitialPositions {
  google: number | null;
  bing: number | null;
  yahoo: number | null;
}

interface BronClusterCardProps {
  cluster: { parent: BronKeyword; children: BronKeyword[]; parentId: number | string };
  serpReports: BronSerpReport[];
  keywordMetrics: Record<string, KeywordMetrics>;
  pageSpeedScores: Record<string, PageSpeedScore>;
  linksIn: BronLink[];
  linksOut: BronLink[];
  selectedDomain?: string;
  expandedIds: Set<number | string>;
  initialPositions: Record<string, InitialPositions>;
  metricsLoadingKeys: Set<string>;
  inlineEditForms: Record<string | number, Record<string, string>>;
  savingIds: Set<number | string>;
  compactMode?: boolean;
  onToggleExpand: (kw: BronKeyword) => void;
  onUpdateForm: (id: number | string, field: string, value: string) => void;
  onSave: (kw: BronKeyword) => void;
  onOpenArticleEditor: (kw: BronKeyword) => void;
  onToggleLink?: (linkId: string | number, currentDisabled: string, domain: string) => Promise<boolean>;
}

// Tree connector line component
const TreeConnector = memo(({ isLast }: { isLast: boolean }) => (
  <div className="flex items-stretch shrink-0" style={{ width: '28px' }}>
    {/* Vertical line */}
    <div className={`w-px bg-amber-500/40 ${isLast ? 'h-1/2' : 'h-full'}`} style={{ marginLeft: '8px' }} />
    {/* Horizontal connector */}
    <div className="flex items-center h-full" style={{ marginLeft: '-1px' }}>
      <div className="w-4 h-px bg-amber-500/40" />
      <div className="w-2 h-2 rounded-full bg-amber-500/60 border border-amber-400/80 shrink-0" />
    </div>
  </div>
));
TreeConnector.displayName = 'TreeConnector';

// Single keyword row within a cluster
const ClusterKeywordRow = memo(({
  kw,
  isNested,
  isLastChild,
  isMainKeyword,
  clusterChildCount,
  serpReports,
  keywordMetrics,
  pageSpeedScores,
  linksIn,
  linksOut,
  selectedDomain,
  isExpanded,
  initialPositions,
  metricsLoadingKeys,
  inlineEditForms,
  savingIds,
  onToggleExpand,
  onUpdateForm,
  onSave,
  onOpenArticleEditor,
  onToggleLink,
}: {
  kw: BronKeyword;
  isNested: boolean;
  isLastChild: boolean;
  isMainKeyword: boolean;
  clusterChildCount?: number;
  serpReports: BronSerpReport[];
  keywordMetrics: Record<string, KeywordMetrics>;
  pageSpeedScores: Record<string, PageSpeedScore>;
  linksIn: BronLink[];
  linksOut: BronLink[];
  selectedDomain?: string;
  isExpanded: boolean;
  initialPositions: Record<string, InitialPositions>;
  metricsLoadingKeys: Set<string>;
  inlineEditForms: Record<string | number, Record<string, string>>;
  savingIds: Set<number | string>;
  onToggleExpand: (kw: BronKeyword) => void;
  onUpdateForm: (id: number | string, field: string, value: string) => void;
  onSave: (kw: BronKeyword) => void;
  onOpenArticleEditor: (kw: BronKeyword) => void;
  onToggleLink?: (linkId: string | number, currentDisabled: string, domain: string) => Promise<boolean>;
}) => {
  const keywordText = getKeywordDisplayText(kw);
  const isTrackingOnly = kw.status === 'tracking_only' || String(kw.id).startsWith('serp_');
  const serpData = findSerpForKeyword(keywordText, serpReports);
  
  // Filter links for this specific keyword
  const { keywordLinksIn, keywordLinksOut } = filterLinksForKeyword(kw, linksIn, linksOut, selectedDomain);
  
  // Calculate movements
  const initial = initialPositions[keywordText.toLowerCase()] || { google: null, bing: null, yahoo: null };
  const currentGoogle = getPosition(serpData?.google);
  const currentBing = getPosition(serpData?.bing);
  const currentYahoo = getPosition(serpData?.yahoo);
  
  const googleMovement = initial.google && currentGoogle ? initial.google - currentGoogle : 0;
  const bingMovement = initial.bing && currentBing ? initial.bing - currentBing : 0;
  const yahooMovement = initial.yahoo && currentYahoo ? initial.yahoo - currentYahoo : 0;
  
  // Get PageSpeed URL
  let keywordUrl = kw.linkouturl;
  if (!keywordUrl && selectedDomain && !isTrackingOnly) {
    const slug = keywordText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    keywordUrl = `https://${selectedDomain}/${slug}`;
  }
  const pageSpeed = keywordUrl ? pageSpeedScores[keywordUrl] : undefined;

  return (
    <div 
      className="no-theme-transition"
      style={{ contain: 'layout style' }}
      data-no-theme-transition
    >
      <div className="flex items-stretch">
        {/* Tree connector for nested keywords */}
        {isNested && <TreeConnector isLast={isLastChild} />}
        
        {/* Keyword card - full width minus connector */}
        <div className="flex-1 min-w-0">
          <BronKeywordCard
            keyword={kw}
            serpData={serpData}
            keywordMetrics={keywordMetrics[keywordText.toLowerCase()]}
            pageSpeedScore={pageSpeed}
            linksInCount={keywordLinksIn.length}
            linksOutCount={keywordLinksOut.length}
            isExpanded={isExpanded}
            isNested={isNested}
            isTrackingOnly={isTrackingOnly}
            isMainKeyword={isMainKeyword}
            clusterChildCount={clusterChildCount}
            selectedDomain={selectedDomain}
            googleMovement={googleMovement}
            bingMovement={bingMovement}
            yahooMovement={yahooMovement}
            metricsLoading={metricsLoadingKeys.has(keywordText.toLowerCase())}
            onToggleExpand={() => onToggleExpand(kw)}
          />
          
          {/* Expanded content */}
          {isExpanded && inlineEditForms[kw.id] && (
            <div style={{ contain: 'layout style paint' }}>
              <BronKeywordExpanded
                keyword={kw}
                isTrackingOnly={isTrackingOnly}
                selectedDomain={selectedDomain}
                linksIn={keywordLinksIn}
                linksOut={keywordLinksOut}
                formData={inlineEditForms[kw.id] as any}
                isSaving={savingIds.has(kw.id)}
                onUpdateForm={(field, value) => onUpdateForm(kw.id, field, value)}
                onSave={() => onSave(kw)}
                onOpenArticleEditor={() => onOpenArticleEditor(kw)}
                onToggleLink={onToggleLink}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
ClusterKeywordRow.displayName = 'ClusterKeywordRow';

// Main Cluster Card Component
export const BronClusterCard = memo(({
  cluster,
  serpReports,
  keywordMetrics,
  pageSpeedScores,
  linksIn,
  linksOut,
  selectedDomain,
  expandedIds,
  initialPositions,
  metricsLoadingKeys,
  inlineEditForms,
  savingIds,
  compactMode,
  onToggleExpand,
  onUpdateForm,
  onSave,
  onOpenArticleEditor,
  onToggleLink,
}: BronClusterCardProps) => {
  const hasChildren = cluster.children.length > 0;
  const [clusterExpanded, setClusterExpanded] = useState(true);
  
  // Cluster header text
  const parentText = useMemo(() => getKeywordDisplayText(cluster.parent), [cluster.parent]);
  
  // If no children, render as a simple card (no cluster wrapper)
  if (!hasChildren) {
    return (
      <div className="space-y-1" style={{ contain: 'layout style paint' }}>
        <ClusterKeywordRow
          kw={cluster.parent}
          isNested={false}
          isLastChild={false}
          isMainKeyword={false}
          serpReports={serpReports}
          keywordMetrics={keywordMetrics}
          pageSpeedScores={pageSpeedScores}
          linksIn={linksIn}
          linksOut={linksOut}
          selectedDomain={selectedDomain}
          isExpanded={expandedIds.has(cluster.parent.id)}
          initialPositions={initialPositions}
          metricsLoadingKeys={metricsLoadingKeys}
          inlineEditForms={inlineEditForms}
          savingIds={savingIds}
          onToggleExpand={onToggleExpand}
          onUpdateForm={onUpdateForm}
          onSave={onSave}
          onOpenArticleEditor={onOpenArticleEditor}
          onToggleLink={onToggleLink}
        />
      </div>
    );
  }

  // Cluster card with header and children
  return (
    <div 
      className="relative rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 overflow-hidden"
      style={{ contain: 'layout style paint' }}
    >
      {/* Cluster Header */}
      <div 
        className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border-b border-blue-500/20 cursor-pointer hover:bg-blue-500/15 transition-colors"
        onClick={() => setClusterExpanded(!clusterExpanded)}
      >
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
          <Layers className="w-4 h-4 text-blue-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-blue-400 truncate" title={parentText}>
            {parentText.length > 50 ? `${parentText.slice(0, 50)}...` : parentText}
          </h4>
        </div>
        
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 shrink-0">
          Main · {cluster.children.length}
        </Badge>
        
        <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400 transition-transform ${clusterExpanded ? 'rotate-0' : '-rotate-90'}`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      
      {/* Cluster Content */}
      <AnimatePresence initial={false}>
        {clusterExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="p-3 space-y-2">
              {/* Parent keyword row */}
              <ClusterKeywordRow
                kw={cluster.parent}
                isNested={false}
                isLastChild={false}
                isMainKeyword={true}
                clusterChildCount={cluster.children.length}
                serpReports={serpReports}
                keywordMetrics={keywordMetrics}
                pageSpeedScores={pageSpeedScores}
                linksIn={linksIn}
                linksOut={linksOut}
                selectedDomain={selectedDomain}
                isExpanded={expandedIds.has(cluster.parent.id)}
                initialPositions={initialPositions}
                metricsLoadingKeys={metricsLoadingKeys}
                inlineEditForms={inlineEditForms}
                savingIds={savingIds}
                onToggleExpand={onToggleExpand}
                onUpdateForm={onUpdateForm}
                onSave={onSave}
                onOpenArticleEditor={onOpenArticleEditor}
                onToggleLink={onToggleLink}
              />
              
              {/* Children with tree connectors */}
              <div className="ml-4 border-l-2 border-amber-500/30 pl-0">
                {cluster.children.map((child, idx) => (
                  <ClusterKeywordRow
                    key={child.id}
                    kw={child}
                    isNested={true}
                    isLastChild={idx === cluster.children.length - 1}
                    isMainKeyword={false}
                    serpReports={serpReports}
                    keywordMetrics={keywordMetrics}
                    pageSpeedScores={pageSpeedScores}
                    linksIn={linksIn}
                    linksOut={linksOut}
                    selectedDomain={selectedDomain}
                    isExpanded={expandedIds.has(child.id)}
                    initialPositions={initialPositions}
                    metricsLoadingKeys={metricsLoadingKeys}
                    inlineEditForms={inlineEditForms}
                    savingIds={savingIds}
                    onToggleExpand={onToggleExpand}
                    onUpdateForm={onUpdateForm}
                    onSave={onSave}
                    onOpenArticleEditor={onOpenArticleEditor}
                    onToggleLink={onToggleLink}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}, (prev, next) => {
  // Custom compare for performance
  if (prev.cluster.parentId !== next.cluster.parentId) return false;
  if (prev.cluster.parent.id !== next.cluster.parent.id) return false;
  if (prev.cluster.children.length !== next.cluster.children.length) return false;
  for (let i = 0; i < prev.cluster.children.length; i++) {
    if (prev.cluster.children[i].id !== next.cluster.children[i].id) return false;
  }
  if (prev.selectedDomain !== next.selectedDomain) return false;
  if (prev.serpReports !== next.serpReports) return false;
  if (prev.linksIn !== next.linksIn) return false;
  if (prev.linksOut !== next.linksOut) return false;
  if (prev.initialPositions !== next.initialPositions) return false;
  if (prev.compactMode !== next.compactMode) return false;

  // Check expansion/saving/form state for IDs in this cluster
  const ids = [prev.cluster.parent.id, ...prev.cluster.children.map(c => c.id)];
  for (const id of ids) {
    if (prev.expandedIds.has(id) !== next.expandedIds.has(id)) return false;
    if ((prev.inlineEditForms as any)[id] !== (next.inlineEditForms as any)[id]) return false;
    if (prev.savingIds.has(id) !== next.savingIds.has(id)) return false;
  }

  // Check metrics/pagespeed changes for keywords in this cluster
  const kws = [prev.cluster.parent, ...prev.cluster.children];
  for (const kw of kws) {
    const key = getKeywordDisplayText(kw).toLowerCase();
    const a = prev.keywordMetrics[key];
    const b = next.keywordMetrics[key];
    if ((a?.cpc ?? null) !== (b?.cpc ?? null)) return false;
    if ((a?.search_volume ?? null) !== (b?.search_volume ?? null)) return false;
    if (prev.metricsLoadingKeys.has(key) !== next.metricsLoadingKeys.has(key)) return false;
  }

  return true;
});

BronClusterCard.displayName = 'BronClusterCard';
