import { memo, useMemo } from "react";
import { ExternalLink, Lock } from "lucide-react";
import type { BronLink } from "@/hooks/use-bron-api";
import { Badge } from "@/components/ui/badge";

export type RelevanceFilter = "all" | "most" | "very" | "relevant" | "less";
export type ReciprocalFilter = "all" | "reciprocal" | "one-way";

export type RelevanceTier = "most" | "very" | "relevant" | "less";

export function getRelevanceLabel(tier: RelevanceTier) {
  switch (tier) {
    case "most":
      return "Most Relevant";
    case "very":
      return "Very Relevant";
    case "relevant":
      return "Relevant";
    default:
      return "Less Relevant";
  }
}

export function getRelevanceVariantClasses(tier: RelevanceTier) {
  switch (tier) {
    case "most":
      return "bg-primary/15 text-primary border-primary/30";
    case "very":
      return "bg-secondary text-foreground border-border";
    case "relevant":
      return "bg-muted text-foreground border-border";
    default:
      return "bg-muted/40 text-muted-foreground border-border";
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
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-xs">No {viewMode} links match the current filters</p>
        </div>
      );
    }

    return (
      <div 
        className="rounded-lg border border-border/50 overflow-hidden"
        style={{ contain: 'layout style paint' }}
      >
        {/* Header */}
        <div className="bg-muted/30 px-3 py-2 border-b border-border/50">
          <div className="grid grid-cols-5 gap-2 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Domain–Keyword</span>
            <span>Category</span>
            <span className="text-center">Reciprocal</span>
            <span className="text-center">Relevance</span>
            <span className="text-center">Actions</span>
          </div>
        </div>

        {/* All rows - no scroll, show all */}
        <div className="divide-y divide-border/30">
          {rows.map(({ link, tier }, idx) => (
            <CitationLinkRow
              key={`citation-${idx}-${link.domain_name || link.domain || link.link || ""}`}
              link={link}
              tier={tier}
              keywordText={keywordText}
              viewMode={viewMode}
            />
          ))}
        </div>

        {/* Footer with count */}
        <div className="px-3 py-1.5 text-[10px] text-muted-foreground text-center border-t border-border/30 bg-muted/20">
          Showing {rows.length} of {links.length} links
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
  }: {
    link: BronLink;
    tier: RelevanceTier;
    keywordText: string;
    viewMode: "inbound" | "outbound";
  }) => {
    const isReciprocal = link.reciprocal === "yes";
    const isEnabled = link.disabled !== "yes";

    const displayDomain = link.domain_name || link.domain || "";

    const linkHref = viewMode === "inbound"
      ? link.link || link.source_url || (displayDomain ? `https://${displayDomain}` : "#")
      : link.target_url || (displayDomain ? `https://${displayDomain}` : "#");

    const category = (link.parent_category || "").trim() && (link.category || "").trim()
      ? `${link.parent_category} / ${link.category}`
      : (link.category || link.parent_category || "General");

    return (
      <div 
        className="grid grid-cols-5 gap-2 px-3 py-2 hover:bg-muted/20 items-center"
        style={{ contain: 'layout style' }}
      >
        <div className="min-w-0">
          <div className="font-medium text-foreground truncate text-xs" title={displayDomain}>
            {displayDomain || "Unknown"}
          </div>
          <div className="text-[10px] text-muted-foreground truncate" title={keywordText}>
            {keywordText.length > 30 ? `${keywordText.slice(0, 30)}...` : keywordText}
          </div>
        </div>

        <div className="min-w-0">
          <Badge variant="secondary" className="text-[9px] max-w-full truncate px-1.5 py-0.5">
            {category}
          </Badge>
        </div>

        <div className="text-center">
          <span className="text-[10px] text-muted-foreground">
            {isReciprocal ? "Yes" : "No"}
          </span>
        </div>

        <div className="text-center">
          <Badge
            variant="outline"
            className={`text-[9px] font-semibold px-1.5 py-0.5 ${getRelevanceVariantClasses(tier)}`}
          >
            {getRelevanceLabel(tier).toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          <Badge
            variant="outline"
            className={`text-[9px] font-semibold inline-flex items-center gap-0.5 px-1.5 py-0.5 ${
              isEnabled
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-destructive/10 text-destructive border-destructive/30"
            }`}
          >
            <Lock className="w-2.5 h-2.5" />
            {isEnabled ? "ON" : "OFF"}
          </Badge>

          <a
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label="Open link"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }
);
CitationLinkRow.displayName = "CitationLinkRow";