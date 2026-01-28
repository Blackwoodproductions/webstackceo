import { memo, useMemo } from "react";
import { Lock } from "lucide-react";
import type { BronLink } from "@/hooks/use-bron-api";

export type RelevanceFilter = "all" | "most" | "very" | "relevant" | "less";
export type ReciprocalFilter = "all" | "reciprocal" | "one-way";

export type RelevanceTier = "most" | "very" | "relevant" | "less";

export function getRelevanceLabel(tier: RelevanceTier) {
  switch (tier) {
    case "most":
      return "MOST RELEVANT";
    case "very":
      return "VERY RELEVANT";
    case "relevant":
      return "RELEVANT";
    default:
      return "LESS RELEVANT";
  }
}

export function getRelevanceClasses(tier: RelevanceTier) {
  switch (tier) {
    case "most":
      return "bg-amber-500 text-amber-950 font-semibold";
    case "very":
      return "bg-emerald-500 text-emerald-950 font-semibold";
    case "relevant":
      return "bg-cyan-500 text-cyan-950 font-semibold";
    default:
      return "bg-slate-500 text-slate-950 font-semibold";
  }
}

function normalizeCategory(value?: string) {
  if (!value) return "";
  return value
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function categoryWordOverlap(keywordText: string, categoryText: string) {
  const kw = keywordText
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const cat = categoryText
    .toLowerCase()
    .split(/\s+|\//)
    .filter((w) => w.length > 2);
  if (kw.length === 0 || cat.length === 0) return 0;
  const set = new Set(cat);
  return kw.filter((w) => set.has(w)).length;
}

export function scoreRelevanceTier(
  link: BronLink,
  keywordText: string,
  keywordCategorySet: Set<string>
): RelevanceTier {
  const cat = normalizeCategory(link.category);
  const parent = normalizeCategory(link.parent_category);

  if (cat && keywordCategorySet.has(cat)) return "most";
  if (parent && keywordCategorySet.has(parent)) return "very";
  if (cat && keywordCategorySet.has(parent ? `${parent}/${cat}` : cat)) return "very";

  const overlap = categoryWordOverlap(keywordText, `${link.parent_category || ""} ${link.category || ""}`);
  if (overlap >= 2) return "relevant";
  return "less";
}

export const CitationLinksTable = memo(
  ({
    keywordText,
    links,
    viewMode,
    reciprocalFilter,
    relevanceFilter,
    keywordCategorySet,
  }: {
    keywordText: string;
    links: BronLink[];
    viewMode: "inbound" | "outbound";
    reciprocalFilter: ReciprocalFilter;
    relevanceFilter: RelevanceFilter;
    keywordCategorySet: Set<string>;
  }) => {
    const rows = useMemo(() => {
      return links
        .map((link) => {
          const tier = scoreRelevanceTier(link, keywordText, keywordCategorySet);
          return { link, tier };
        })
        .filter(({ link, tier }) => {
          if (reciprocalFilter === "reciprocal" && link.reciprocal !== "yes") return false;
          if (reciprocalFilter === "one-way" && link.reciprocal === "yes") return false;
          if (relevanceFilter !== "all" && tier !== relevanceFilter) return false;
          return true;
        });
    }, [links, keywordText, keywordCategorySet, reciprocalFilter, relevanceFilter]);

    if (rows.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">No {viewMode} links match the current filters</p>
        </div>
      );
    }

    return (
      <div 
        className="rounded-lg border border-border/50 overflow-hidden bg-card/50"
        style={{ contain: 'layout style' }}
      >
        {/* Header - matching reference design */}
        <div className="bg-slate-800/80 px-4 py-3 border-b border-border/50">
          <div 
            className="grid gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider"
            style={{ gridTemplateColumns: '1.5fr 1.5fr 0.8fr 1fr 0.8fr' }}
          >
            <span>Domain-Keyword</span>
            <span className="text-center">Category</span>
            <span className="text-center">Reciprocal</span>
            <span className="text-center">Relevance</span>
            <span className="text-center">Actions</span>
          </div>
        </div>

        {/* All rows - show all, no scroll */}
        <div style={{ contain: 'layout' }}>
          {rows.map(({ link, tier }, idx) => (
            <CitationLinkRow
              key={`citation-${idx}-${link.domain_name || link.domain || link.link || ""}`}
              link={link}
              tier={tier}
              keywordText={keywordText}
              viewMode={viewMode}
              isHighlighted={idx === 3} // Highlight 4th row like in reference
            />
          ))}
        </div>

        {/* Footer with count */}
        <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border/30 bg-slate-800/40">
          Showing {rows.length} of {links.length} link partners
        </div>
      </div>
    );
  }
);
CitationLinksTable.displayName = "CitationLinksTable";

const CitationLinkRow = memo(
  ({
    link,
    tier,
    keywordText,
    viewMode,
    isHighlighted = false,
  }: {
    link: BronLink;
    tier: RelevanceTier;
    keywordText: string;
    viewMode: "inbound" | "outbound";
    isHighlighted?: boolean;
  }) => {
    const isReciprocal = link.reciprocal === "yes";
    const isEnabled = link.disabled !== "yes";

    const displayDomain = link.domain_name || link.domain || "";

    // Build category display: "Parent / Child" format
    const categoryDisplay = (link.parent_category || "").trim() && (link.category || "").trim()
      ? `${link.parent_category} / ${link.category}`
      : (link.category || link.parent_category || "General");

    return (
      <div 
        className={`
          grid gap-4 px-4 py-3 items-center border-b border-border/20 transition-colors
          ${isHighlighted ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400' : 'hover:bg-slate-800/30'}
        `}
        style={{ 
          gridTemplateColumns: '1.5fr 1.5fr 0.8fr 1fr 0.8fr',
          contain: 'layout style',
        }}
      >
        {/* Domain-Keyword Column */}
        <div className="min-w-0">
          <div className="font-medium text-foreground text-sm truncate" title={displayDomain}>
            {displayDomain || "Unknown Domain"}
          </div>
          <div className="text-xs text-muted-foreground italic truncate mt-0.5" title={keywordText}>
            {keywordText.length > 40 ? `${keywordText.slice(0, 40)}...` : keywordText}
          </div>
        </div>

        {/* Category Column - Dark blue pill like reference */}
        <div className="flex justify-center">
          <span 
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-[11px] font-medium text-center bg-slate-700 text-slate-200 border border-slate-600 max-w-full"
            title={categoryDisplay}
          >
            <span className="truncate">{categoryDisplay}</span>
          </span>
        </div>

        {/* Reciprocal Column */}
        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            {isReciprocal ? "Yes" : "No"}
          </span>
        </div>

        {/* Relevance Column - Colored badge like reference */}
        <div className="flex justify-center">
          <span 
            className={`inline-flex items-center justify-center px-3 py-1 rounded text-[10px] uppercase tracking-wide ${getRelevanceClasses(tier)}`}
          >
            {getRelevanceLabel(tier)}
          </span>
        </div>

        {/* Actions Column - Green ENABLED button like reference */}
        <div className="flex justify-center">
          <span 
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wide ${
              isEnabled
                ? "bg-emerald-500 text-emerald-950"
                : "bg-red-500 text-red-950"
            }`}
          >
            <Lock className="w-3 h-3" />
            {isEnabled ? "ENABLED" : "DISABLED"}
          </span>
        </div>
      </div>
    );
  }
);
CitationLinkRow.displayName = "CitationLinkRow";