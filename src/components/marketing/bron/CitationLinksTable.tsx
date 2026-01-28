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
      return "bg-[hsl(var(--hover-accent))] text-[hsl(var(--primary-foreground))]";
    case "very":
      return "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]";
    case "relevant":
      return "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]";
    default:
      return "bg-muted text-muted-foreground";
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
        className="rounded-lg border border-border/40 bg-card no-theme-transition" 
        data-no-theme-transition
        style={{ contain: 'layout style paint' }}
      >
        {/* Header - matching reference exactly */}
        <div className="bg-muted/80 px-5 py-3 border-b border-border/50 no-theme-transition">
          <div 
            className="grid gap-4 text-[13px] font-semibold text-muted-foreground"
            style={{ gridTemplateColumns: '1.8fr 1.6fr 0.8fr 1fr 0.9fr' }}
          >
            <span>Domain-Keyword</span>
            <span className="text-center">Category</span>
            <span className="text-center">Reciprocal</span>
            <span className="text-center">Relevance</span>
            <span className="text-center">Actions</span>
          </div>
        </div>

        {/* Rows - static, no animations */}
        <div>
          {rows.map(({ link, tier }, idx) => (
            <CitationLinkRow
              key={
                (link as any).id ||
                `${link.domain_name || link.domain || ''}|${link.source_url || ''}|${link.target_url || ''}|${link.category || ''}|${link.parent_category || ''}|${idx}`
              }
              link={link}
              tier={tier}
              keywordText={keywordText}
              isHighlighted={idx === 2}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 text-xs text-muted-foreground text-center border-t border-border/40 bg-muted/50">
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
    isHighlighted = false,
  }: {
    link: BronLink;
    tier: RelevanceTier;
    keywordText: string;
    isHighlighted?: boolean;
  }) => {
    const isReciprocal = link.reciprocal === "yes";
    const isEnabled = link.disabled !== "yes";

    const displayDomain = link.domain_name || link.domain || "";

    // Category display: "Parent / Child" format matching reference
    const categoryDisplay = (link.parent_category || "").trim() && (link.category || "").trim()
      ? `${link.parent_category} / ${link.category}`
      : (link.category || link.parent_category || "General");

    return (
      <div 
        className={`
          grid gap-4 px-5 py-4 items-center border-b border-border/30 no-theme-transition
          ${isHighlighted ? 'border-l-[3px] border-l-primary bg-accent/30' : 'bg-transparent'}
        `}
        style={{ gridTemplateColumns: '1.8fr 1.6fr 0.8fr 1fr 0.9fr', contain: 'layout style' }}
        data-no-theme-transition
      >
        {/* Domain-Keyword Column */}
        <div className="min-w-0">
          <div className="font-medium text-foreground text-[14px] truncate" title={displayDomain}>
            {displayDomain || "Unknown Domain"}
          </div>
          <div className="text-[13px] text-muted-foreground italic truncate mt-0.5" title={keywordText}>
            {keywordText.length > 50 ? `${keywordText.slice(0, 50)}...` : keywordText}
          </div>
        </div>

        {/* Category Column - themed pill with centered multiline text */}
        <div className="flex justify-center">
          <span 
            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-[12px] font-medium text-center bg-muted text-muted-foreground leading-snug max-w-[220px]"
            title={categoryDisplay}
          >
            <span className="text-center">{categoryDisplay}</span>
          </span>
        </div>

        {/* Reciprocal Column */}
        <div className="text-center">
          <span className="text-[14px] text-muted-foreground italic">
            {isReciprocal ? "Yes" : "No"}
          </span>
        </div>

        {/* Relevance Column - Colored badge */}
        <div className="flex justify-center">
          <span 
            className={`inline-flex items-center justify-center px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wide ${getRelevanceClasses(tier)}`}
          >
            {getRelevanceLabel(tier)}
          </span>
        </div>

        {/* Actions Column - Green ENABLED button */}
        <div className="flex justify-center">
          <span 
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wide ${
              isEnabled
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            {isEnabled ? "ENABLED" : "DISABLED"}
          </span>
        </div>
      </div>
    );
  }
);
CitationLinkRow.displayName = "CitationLinkRow";