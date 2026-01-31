import type { BronKeyword } from "@/hooks/use-bron-api";
import { getKeywordDisplayText } from "./BronKeywordCard";

/**
 * Returns the canonical URL used for PageSpeed lookup for a given keyword.
 * - Skips tracking-only keywords.
 * - Prefers API-provided linkouturl.
 * - Falls back to a slug derived from the display keyword.
 */
export function getKeywordPageUrl(kw: BronKeyword, selectedDomain?: string): string | null {
  const isTrackingOnly = kw.status === "tracking_only" || String(kw.id).startsWith("serp_");
  if (isTrackingOnly) return null;

  if (kw.linkouturl && kw.linkouturl.trim()) return kw.linkouturl.trim();
  if (!selectedDomain) return null;

  const slug = getKeywordDisplayText(kw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) return null;
  return `https://${selectedDomain}/${slug}`;
}
