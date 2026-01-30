import { memo, useMemo } from "react";
import type { BronLink } from "@/hooks/use-bron-api";
import { CitationLinkToggleButton } from "./CitationLinkToggleButton";

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

/**
 * Extract a keyword/topic text from a BRON link.
 * 
 * BRON API provides keyword info in multiple ways:
 * 1. Direct keyword/anchor_text field (most reliable) - e.g., "Cosmetic Dentistry Port Coquitlam"
 * 2. URL path parsing as fallback - e.g., "local-seo-for-dentists-575290bc" -> "Local Seo For Dentists"
 */
export function extractKeywordFromLink(link: BronLink): string {
  const linkRecord = link as Record<string, unknown>;
  
  // First, try direct keyword/anchor text fields from the API (MOST RELIABLE)
  // These fields contain the actual keyword that this link is associated with
  const directFields = [
    linkRecord.keyword as string,           // Primary keyword field
    linkRecord.keyword_text as string,
    linkRecord.keywordtitle as string,
    linkRecord.target_keyword as string,    // Target keyword on our site
    linkRecord.link_keyword as string,
    link.anchor_text,                       // Anchor text used in link
    linkRecord.title as string,
    linkRecord.text as string,
    linkRecord.phrase as string,
  ];
  
  for (const field of directFields) {
    if (field && typeof field === 'string' && field.trim().length > 0) {
      // Clean up HTML entities and return
      return field
        .replace(/&amp;/g, '&')
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .trim();
    }
  }
  
  // Fallback: extract from the link URL
  const url = link.link || link.source_url || link.target_url;
  if (!url) return "";
  
  try {
    // Parse the URL path
    const urlPath = url.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '');
    const pathParts = urlPath.split('/').filter(p => p.length > 0);
    
    // Get the last segment (usually the slug)
    const slug = pathParts[pathParts.length - 1] || '';
    
    // Skip if it's a query parameter URL (e.g., "?Action=2&k=something")
    if (slug.includes('?')) {
      const queryMatch = url.match(/[?&]k=([^&]+)/);
      if (queryMatch) {
        const keyword = decodeURIComponent(queryMatch[1]).replace(/-/g, ' ');
        return capitalizeWords(keyword);
      }
      return "";
    }
    
    // Remove trailing ID pattern like "-575290bc" or "-568071bc"
    const cleanSlug = slug.replace(/-\d+bc$/i, '').replace(/-\d+$/i, '');
    
    // Convert slug to readable text: "local-seo-for-dentists" -> "Local Seo For Dentists"
    const keyword = cleanSlug.replace(/-/g, ' ');
    return capitalizeWords(keyword);
  } catch {
    return "";
  }
}

function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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
    domain,
    onToggleLink,
  }: {
    keywordText: string;
    links: BronLink[];
    viewMode: "inbound" | "outbound";
    reciprocalFilter: ReciprocalFilter;
    relevanceFilter: RelevanceFilter;
    keywordCategorySet: Set<string>;
    domain?: string;
    onToggleLink?: (linkId: string | number, currentDisabled: string) => Promise<boolean>;
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
              isHighlighted={idx === 2}
              onToggle={onToggleLink}
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
    isHighlighted = false,
    onToggle,
  }: {
    link: BronLink;
    tier: RelevanceTier;
    isHighlighted?: boolean;
    onToggle?: (linkId: string | number, currentDisabled: string) => Promise<boolean>;
  }) => {
    const isReciprocal = link.reciprocal === "yes";

    const displayDomain = link.domain_name || link.domain || "";
    
    // Extract keyword from the link URL instead of using parent keyword
    const linkKeyword = extractKeywordFromLink(link);
    const displayKeyword = linkKeyword || "Link Partner";

    // Category display: "Parent / Child" format matching reference
    const categoryDisplay = (link.parent_category || "").trim() && (link.category || "").trim()
      ? `${(link.parent_category || "").replace(/&amp;/g, "&").trim()} / ${(link.category || "").replace(/&amp;/g, "&").trim()}`
      : ((link.category || link.parent_category || "General").replace(/&amp;/g, "&").trim());
    
    // Get the link URL for external link
    const linkUrl = link.link || link.source_url || link.target_url;

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
          <a 
            href={linkUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground text-[14px] truncate block hover:text-primary transition-colors"
            title={displayDomain}
            onClick={(e) => e.stopPropagation()}
          >
            {displayDomain || "Unknown Domain"}
          </a>
          <div className="text-[13px] text-cyan-400 italic truncate mt-0.5" title={displayKeyword}>
            {displayKeyword.length > 50 ? `${displayKeyword.slice(0, 50)}...` : displayKeyword}
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

        {/* Actions Column - Status indicator (toggle requires link ID from API) */}
        <div className="flex justify-center">
          <CitationLinkToggleButton link={link} onToggle={onToggle} />
        </div>
      </div>
    );
  }
);
CitationLinkRow.displayName = "CitationLinkRow";