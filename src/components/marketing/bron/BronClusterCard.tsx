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
  isBaselineReport?: boolean; // True when viewing the baseline (oldest) report
  onToggleExpand: (kw: BronKeyword) => void;
  onUpdateForm: (id: number | string, field: string, value: string) => void;
  onSave: (kw: BronKeyword) => void;
  onOpenArticleEditor: (kw: BronKeyword) => void;
  onToggleLink?: (linkId: string | number, currentDisabled: string, domain: string) => Promise<boolean>;
  onOpenAnalysis?: (kw: BronKeyword) => void;
}

// Tree connector horizontal branch - connects from left border to card
const TreeBranch = memo(({ isLast }: { isLast: boolean }) => (
  <div 
    className="absolute top-1/2 -translate-y-1/2 pointer-events-none flex items-center z-10"
    style={{ left: '-24px', width: '22px' }}
  >
    {/* Horizontal line from vertical border to card */}
    <div className="w-full h-px bg-amber-500/40" />
    {/* Connection dot at the end - smaller */}
    <div className="absolute right-0 w-1.5 h-1.5 rounded-full bg-amber-500/60 border border-amber-400/80" />
  </div>
));
TreeBranch.displayName = 'TreeBranch';

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
  isBaselineReport,
  onToggleExpand,
  onUpdateForm,
  onSave,
  onOpenArticleEditor,
  onToggleLink,
  onOpenAnalysis,
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
  isBaselineReport?: boolean;
  onToggleExpand: (kw: BronKeyword) => void;
  onUpdateForm: (id: number | string, field: string, value: string) => void;
  onSave: (kw: BronKeyword) => void;
  onOpenArticleEditor: (kw: BronKeyword) => void;
  onToggleLink?: (linkId: string | number, currentDisabled: string, domain: string) => Promise<boolean>;
  onOpenAnalysis?: (kw: BronKeyword) => void;
}) {
  const keywordText = useMemo(() => getKeywordDisplayText(kw), [kw]);
  const isTrackingOnly = kw.status === 'tracking_only' || String(kw.id).startsWith('serp_');
  const serpData = useMemo(() => findSerpForKeyword(keywordText, serpReports), [keywordText, serpReports]);
  
  // Filter links for this specific keyword - memoized
  const { keywordLinksIn, keywordLinksOut } = useMemo(() => {
    const result = filterLinksForKeyword(kw, linksIn, linksOut, selectedDomain);
    // Reduce debug logging - only log in development when there's a potential mismatch
    // Removed verbose logging to improve performance
    return result;
  }, [kw, linksIn, linksOut, selectedDomain]);
  
  // Calculate movements - memoized
  // Compare current position with baseline (oldest report)
  const { googleMovement, bingMovement, yahooMovement, pageSpeed } = useMemo(() => {
    // Try multiple key variations for matching baseline positions
    const keyLower = keywordText.toLowerCase().trim();
    // Also try the raw keyword field from the API if available
    const altKeyLower = (kw.keyword || kw.keywordtitle || '').toLowerCase().trim();
    
    // Check both keys for baseline positions
    let initial = initialPositions[keyLower] || initialPositions[altKeyLower];
    
    // If still not found, try more aggressive matching strategies
    if (!initial && Object.keys(initialPositions).length > 0) {
      // Strategy 1: Normalize and compare (remove special chars)
      const normalizedKey = keyLower.replace(/[^a-z0-9]/g, '');
      for (const [baselineKey, positions] of Object.entries(initialPositions)) {
        const normalizedBaseline = baselineKey.replace(/[^a-z0-9]/g, '');
        if (normalizedKey === normalizedBaseline) {
          initial = positions;
          break;
        }
      }
      
      // Strategy 2: Substring match (for longer/shorter variants)
      if (!initial) {
        for (const [baselineKey, positions] of Object.entries(initialPositions)) {
          if (keyLower.includes(baselineKey) || baselineKey.includes(keyLower)) {
            initial = positions;
            break;
          }
        }
      }
      
      // Strategy 3: Match first N significant words
      if (!initial) {
        const keyWords = keyLower.split(/\s+/).filter(w => w.length > 2).slice(0, 4).join(' ');
        for (const [baselineKey, positions] of Object.entries(initialPositions)) {
          const baselineWords = baselineKey.split(/\s+/).filter(w => w.length > 2).slice(0, 4).join(' ');
          if (keyWords === baselineWords && keyWords.length > 5) {
            initial = positions;
            break;
          }
        }
      }
    }
    
    if (!initial) {
      initial = { google: null, bing: null, yahoo: null };
    }
    
    const currentGoogle = getPosition(serpData?.google);
    const currentBing = getPosition(serpData?.bing);
    const currentYahoo = getPosition(serpData?.yahoo);
    
    // Movement = baseline position - current position
    // Positive = improved (was #10, now #5 = 10 - 5 = +5)
    // Negative = dropped (was #5, now #10 = 5 - 10 = -5)
    // Special case: If baseline was null (unranked), treat baseline as position 1000
    // So #1 position = 1000 - 1 = +999, #10 position = 1000 - 10 = +990
    // If current is null but baseline existed, treat current as position 1000
    const UNRANKED_POSITION = 1000;
    const calculateMovement = (baseline: number | null, current: number | null): number => {
      const effectiveBaseline = baseline === null ? UNRANKED_POSITION : baseline;
      const effectiveCurrent = current === null ? UNRANKED_POSITION : current;
      
      // Both unranked = no movement
      if (baseline === null && current === null) return 0;
      
      return effectiveBaseline - effectiveCurrent;
    };
    
    const gMove = calculateMovement(initial.google, currentGoogle);
    const bMove = calculateMovement(initial.bing, currentBing);
    const yMove = calculateMovement(initial.yahoo, currentYahoo);
    
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
  const handleOpenAnalysis = useCallback(() => onOpenAnalysis?.(kw), [onOpenAnalysis, kw]);

  return (
    <div 
      className="no-theme-transition relative"
      style={{ contain: 'layout style' }}
      data-no-theme-transition
    >
      {/* Tree branch connector - horizontal line from left border to card */}
      {isNested && <TreeBranch isLast={isLastChild} />}
      
      <div className="w-full">
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
          isBaselineReport={isBaselineReport}
          onToggleExpand={handleToggle}
          onOpenAnalysis={onOpenAnalysis ? handleOpenAnalysis : undefined}
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
  isBaselineReport,
  onToggleExpand,
  onUpdateForm,
  onSave,
  onOpenArticleEditor,
  onToggleLink,
  onOpenAnalysis,
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
          isBaselineReport={isBaselineReport}
          onToggleExpand={onToggleExpand}
          onUpdateForm={onUpdateForm}
          onSave={onSave}
          onOpenArticleEditor={onOpenArticleEditor}
          onToggleLink={onToggleLink}
          onOpenAnalysis={onOpenAnalysis}
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
        isBaselineReport={isBaselineReport}
        onToggleExpand={onToggleExpand}
        onUpdateForm={onUpdateForm}
        onSave={onSave}
        onOpenArticleEditor={onOpenArticleEditor}
        onToggleLink={onToggleLink}
        onOpenAnalysis={onOpenAnalysis}
      />
      
      {/* Children container with left border as vertical connector line */}
      {/* Keep indentation stable and intentionally aligned to the grid:
          - Supporting rows omit the chart column in their grid (44px)
          - We offset the nested cards by exactly 44px (ml + pl)
          - Nested rows use the same left padding as parent rows (pl-4)
          => PageSpeed + Intent columns align perfectly top-to-bottom */}
      {cluster.children.length > 0 && (
        <div className="relative ml-[20px] pl-[24px] border-l-2 border-amber-500/30">
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
              isBaselineReport={isBaselineReport}
              onToggleExpand={onToggleExpand}
              onUpdateForm={onUpdateForm}
              onSave={onSave}
              onOpenArticleEditor={onOpenArticleEditor}
              onToggleLink={onToggleLink}
              onOpenAnalysis={onOpenAnalysis}
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
