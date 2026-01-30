import { memo, useMemo, useCallback } from "react";
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

// Tree connector line component - uses CSS only, no animations
const TreeConnector = memo(({ isLast }: { isLast: boolean }) => (
  <div className="flex items-stretch shrink-0" style={{ width: '28px', contain: 'strict' }}>
    <div className={`w-px bg-amber-500/40 ${isLast ? 'h-1/2' : 'h-full'}`} style={{ marginLeft: '8px' }} />
    <div className="flex items-center h-full" style={{ marginLeft: '-1px' }}>
      <div className="w-4 h-px bg-amber-500/40" />
      <div className="w-2 h-2 rounded-full bg-amber-500/60 border border-amber-400/80 shrink-0" />
    </div>
  </div>
));
TreeConnector.displayName = 'TreeConnector';

// Props comparison for ClusterKeywordRow memoization
function areClusterKeywordRowPropsEqual(
  prev: Parameters<typeof ClusterKeywordRowImpl>[0],
  next: Parameters<typeof ClusterKeywordRowImpl>[0]
): boolean {
  // Fast identity checks first
  if (prev.kw.id !== next.kw.id) return false;
  if (prev.isExpanded !== next.isExpanded) return false;
  if (prev.isNested !== next.isNested) return false;
  if (prev.isLastChild !== next.isLastChild) return false;
  if (prev.isMainKeyword !== next.isMainKeyword) return false;
  if (prev.selectedDomain !== next.selectedDomain) return false;
  if (prev.clusterChildCount !== next.clusterChildCount) return false;
  
  // Check if saving state changed
  if (prev.savingIds.has(prev.kw.id) !== next.savingIds.has(next.kw.id)) return false;
  
  // Check if form data changed (reference comparison is usually sufficient)
  if (prev.inlineEditForms[prev.kw.id] !== next.inlineEditForms[next.kw.id]) return false;
  
  // Check keyword content changes
  if (prev.kw.keywordtitle !== next.kw.keywordtitle) return false;
  if (prev.kw.keyword !== next.kw.keyword) return false;
  if (prev.kw.linkouturl !== next.kw.linkouturl) return false;
  if (prev.kw.deleted !== next.kw.deleted) return false;
  if (prev.kw.active !== next.kw.active) return false;
  
  // Check metrics loading
  const keywordText = getKeywordDisplayText(prev.kw).toLowerCase();
  if (prev.metricsLoadingKeys.has(keywordText) !== next.metricsLoadingKeys.has(keywordText)) return false;
  
  // Check metrics values
  const prevMetrics = prev.keywordMetrics[keywordText];
  const nextMetrics = next.keywordMetrics[keywordText];
  if ((prevMetrics?.cpc ?? null) !== (nextMetrics?.cpc ?? null)) return false;
  if ((prevMetrics?.search_volume ?? null) !== (nextMetrics?.search_volume ?? null)) return false;
  
  // Reference checks for arrays (fast)
  if (prev.serpReports !== next.serpReports) return false;
  if (prev.linksIn !== next.linksIn) return false;
  if (prev.linksOut !== next.linksOut) return false;
  if (prev.initialPositions !== next.initialPositions) return false;
  if (prev.pageSpeedScores !== next.pageSpeedScores) return false;
  
  return true;
}

// Single keyword row within a cluster - implementation
function ClusterKeywordRowImpl({
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
}) {
  const keywordText = useMemo(() => getKeywordDisplayText(kw), [kw]);
  const isTrackingOnly = kw.status === 'tracking_only' || String(kw.id).startsWith('serp_');
  const serpData = useMemo(() => findSerpForKeyword(keywordText, serpReports), [keywordText, serpReports]);
  
  // Filter links for this specific keyword - memoized
  const { keywordLinksIn, keywordLinksOut } = useMemo(
    () => filterLinksForKeyword(kw, linksIn, linksOut, selectedDomain),
    [kw, linksIn, linksOut, selectedDomain]
  );
  
  // Calculate movements - memoized
  // Compare current position with baseline (oldest report)
  const { googleMovement, bingMovement, yahooMovement, pageSpeed } = useMemo(() => {
    // Try multiple key variations for matching baseline positions
    const keyLower = keywordText.toLowerCase().trim();
    // Also try the raw keyword field from the API if available
    const altKeyLower = (kw.keyword || kw.keywordtitle || '').toLowerCase().trim();
    
    // Check both keys for baseline positions
    let initial = initialPositions[keyLower] || initialPositions[altKeyLower];
    
    // If still not found, try partial match (baseline keywords may be slightly different)
    if (!initial) {
      for (const [baselineKey, positions] of Object.entries(initialPositions)) {
        if (keyLower.includes(baselineKey) || baselineKey.includes(keyLower)) {
          initial = positions;
          break;
        }
      }
    }
    
    if (!initial) {
      initial = { google: null, bing: null, yahoo: null };
    }
    
    const currentGoogle = getPosition(serpData?.google);
    const currentBing = getPosition(serpData?.bing);
    const currentYahoo = getPosition(serpData?.yahoo);
    
    // Movement = initial position - current position
    // Positive = improved (was #10, now #5 = 10 - 5 = +5)
    // Negative = dropped (was #5, now #10 = 5 - 10 = -5)
    const gMove = initial.google && currentGoogle ? initial.google - currentGoogle : 0;
    const bMove = initial.bing && currentBing ? initial.bing - currentBing : 0;
    const yMove = initial.yahoo && currentYahoo ? initial.yahoo - currentYahoo : 0;
    
    // Get PageSpeed URL
    let keywordUrl = kw.linkouturl;
    if (!keywordUrl && selectedDomain && !isTrackingOnly) {
      const slug = keywordText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      keywordUrl = `https://${selectedDomain}/${slug}`;
    }
    
    return {
      googleMovement: gMove,
      bingMovement: bMove,
      yahooMovement: yMove,
      pageSpeed: keywordUrl ? pageSpeedScores[keywordUrl] : undefined,
    };
  }, [keywordText, serpData, initialPositions, kw.linkouturl, kw.keyword, kw.keywordtitle, selectedDomain, isTrackingOnly, pageSpeedScores]);

  // Stable callback refs
  const handleToggle = useCallback(() => onToggleExpand(kw), [onToggleExpand, kw]);
  const handleUpdateField = useCallback(
    (field: string, value: string) => onUpdateForm(kw.id, field, value),
    [onUpdateForm, kw.id]
  );
  const handleSaveKw = useCallback(() => onSave(kw), [onSave, kw]);
  const handleOpenEditor = useCallback(() => onOpenArticleEditor(kw), [onOpenArticleEditor, kw]);

  return (
    <div 
      className="no-theme-transition"
      style={{ contain: 'layout style' }}
      data-no-theme-transition
    >
      <div className="flex items-stretch">
        {isNested && <TreeConnector isLast={isLastChild} />}
        
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
            onToggleExpand={handleToggle}
          />
          
          {/* Expanded content - lazy render */}
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
                onUpdateForm={handleUpdateField}
                onSave={handleSaveKw}
                onOpenArticleEditor={handleOpenEditor}
                onToggleLink={onToggleLink}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Memoized wrapper
const ClusterKeywordRow = memo(ClusterKeywordRowImpl, areClusterKeywordRowPropsEqual);
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
  
  // If no children, render as a simple card (no cluster wrapper)
  if (!hasChildren) {
    return (
      <div style={{ contain: 'layout style paint' }}>
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

  // Render all keywords in a flat list without cluster wrapper
  return (
    <div style={{ contain: 'layout style paint' }}>
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
      {cluster.children.length > 0 && (
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
      )}
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
