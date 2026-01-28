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
  // Keep semantic tokens only.
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

  // Strong match to what we already link-out under.
  if (cat && keywordCategorySet.has(cat)) return "most";
  if (parent && keywordCategorySet.has(parent)) return "very";
  if (cat && keywordCategorySet.has(parent ? `${parent}/${cat}` : cat)) return "very";

  // Weak semantic match.
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
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No {viewMode} links match the current filters</p>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="bg-muted/30 px-4 py-2.5 border-b border-border/50">
          <div className="grid grid-cols-5 gap-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Domain–Keyword</span>
            <span>Category</span>
            <span className="text-center">Reciprocal</span>
            <span className="text-center">Relevance</span>
            <span className="text-center">Actions</span>
          </div>
        </div>

        <div className="max-h-[280px] overflow-y-auto divide-y divide-border/30">
          {rows.slice(0, 50).map(({ link, tier }, idx) => (
            <CitationLinkRow
              key={`citation-${idx}-${link.domain_name || link.domain || link.link || ""}`}
              link={link}
              tier={tier}
              keywordText={keywordText}
              viewMode={viewMode}
            />
          ))}
        </div>

        {rows.length > 50 && (
          <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border/30">
            Showing 50 of {rows.length} links
          </div>
        )}
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

    // Link href:
    // - Inbound: link to the referrer's page (`link` field)
    // - Outbound: prefer target_url, else link out to the domain itself
    const linkHref = viewMode === "inbound"
      ? link.link || link.source_url || (displayDomain ? `https://${displayDomain}` : "#")
      : link.target_url || (displayDomain ? `https://${displayDomain}` : "#");

    const category = (link.parent_category || "").trim() && (link.category || "").trim()
      ? `${link.parent_category} / ${link.category}`
      : (link.category || link.parent_category || "General");

    return (
      <div className="grid grid-cols-5 gap-4 px-4 py-3 hover:bg-muted/20 items-center">
        <div className="min-w-0">
          <div className="font-medium text-foreground truncate" title={displayDomain}>
            {displayDomain || "Unknown"}
          </div>
          <div className="text-xs text-muted-foreground truncate" title={keywordText}>
            {keywordText}
          </div>
        </div>

        <div className="min-w-0">
          <Badge variant="secondary" className="text-xs max-w-full truncate">
            {category}
          </Badge>
        </div>

        <div className="text-center">
          <span className="text-xs text-muted-foreground">
            {isReciprocal ? "Yes" : "No"}
          </span>
        </div>

        <div className="text-center">
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold ${getRelevanceVariantClasses(tier)}`}
          >
            {getRelevanceLabel(tier).toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold inline-flex items-center gap-1 ${
              isEnabled
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-destructive/10 text-destructive border-destructive/30"
            }`}
          >
            <Lock className="w-3 h-3" />
            {isEnabled ? "ENABLED" : "DISABLED"}
          </Badge>

          <a
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label="Open link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }
);
CitationLinkRow.displayName = "CitationLinkRow";
