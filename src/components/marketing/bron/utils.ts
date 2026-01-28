import { BronKeyword, BronSerpReport, BronLink } from "@/hooks/use-bron-api";
import { getKeywordDisplayText, getPosition } from "./BronKeywordCard";

// LocalStorage key for PageSpeed cache
export const PAGESPEED_CACHE_KEY = 'bron_pagespeed_cache';
export const PAGESPEED_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// PageSpeed score cache type
export interface PageSpeedScore {
  mobileScore: number;
  desktopScore: number;
  loading?: boolean;
  updating?: boolean;
  error?: boolean;
  cachedAt?: number;
}

// Load cached PageSpeed scores from localStorage
export function loadCachedPageSpeedScores(): Record<string, PageSpeedScore> {
  try {
    const cached = localStorage.getItem(PAGESPEED_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const now = Date.now();
      const valid: Record<string, PageSpeedScore> = {};
      for (const [url, score] of Object.entries(parsed)) {
        const s = score as PageSpeedScore;
        if (s.cachedAt && (now - s.cachedAt) < PAGESPEED_CACHE_MAX_AGE) {
          valid[url] = s;
        }
      }
      return valid;
    }
  } catch (e) {
    console.warn('Failed to load PageSpeed cache:', e);
  }
  return {};
}

// Save PageSpeed scores to localStorage
export function saveCachedPageSpeedScores(scores: Record<string, PageSpeedScore>) {
  try {
    const toSave: Record<string, PageSpeedScore> = {};
    for (const [url, score] of Object.entries(scores)) {
      if (!score.loading && !score.updating && !score.error && score.mobileScore > 0) {
        toSave[url] = { ...score, cachedAt: score.cachedAt || Date.now() };
      }
    }
    localStorage.setItem(PAGESPEED_CACHE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Failed to save PageSpeed cache:', e);
  }
}

// Find matching SERP report for a keyword
export function findSerpForKeyword(keywordText: string, serpReports: BronSerpReport[]): BronSerpReport | null {
  if (!keywordText || !serpReports.length) return null;
  const normalizedKeyword = keywordText.toLowerCase().trim();
  
  // Exact match
  const exactMatch = serpReports.find(r => r.keyword?.toLowerCase().trim() === normalizedKeyword);
  if (exactMatch) return exactMatch;
  
  // Contains match
  const containsMatch = serpReports.find(r => {
    const serpKeyword = r.keyword?.toLowerCase().trim() || '';
    return normalizedKeyword.includes(serpKeyword) || serpKeyword.includes(normalizedKeyword);
  });
  if (containsMatch) return containsMatch;
  
  // Word overlap match
  const keywordWords = normalizedKeyword.split(/\s+/).filter(w => w.length > 2);
  for (const report of serpReports) {
    const serpWords = (report.keyword || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const matchCount = keywordWords.filter(w => serpWords.includes(w)).length;
    if (matchCount >= 2) return report;
  }
  
  return null;
}

// Result type for grouped keywords
export interface KeywordCluster {
  parent: BronKeyword;
  children: BronKeyword[];
  parentId: number | string;
}

// Group keywords by bubblefeedid from BRON/SEOM API
// Main keywords have NO bubblefeedid field (or it's null/undefined/0)
// Supporting keywords have bubblefeedid that matches the id of their main keyword
export function groupKeywords(keywords: BronKeyword[]): KeywordCluster[] {
  if (keywords.length === 0) return [];
  
  const contentKeywords: BronKeyword[] = [];
  const trackingOnlyKeywords: BronKeyword[] = [];
  
  for (const kw of keywords) {
    const isTrackingOnly = kw.status === 'tracking_only' || String(kw.id).startsWith('serp_');
    if (isTrackingOnly) {
      trackingOnlyKeywords.push(kw);
    } else {
      contentKeywords.push(kw);
    }
  }
  
  const clusters: KeywordCluster[] = [];
  
  // Index all keywords by ID for quick lookup
  const keywordById = new Map<string, BronKeyword>();
  for (const kw of contentKeywords) {
    keywordById.set(String(kw.id), kw);
  }
  
  // Separate main keywords (no bubblefeedid) from supporting keywords (has bubblefeedid)
  const mainKeywords: BronKeyword[] = [];
  const supportingKeywords: BronKeyword[] = [];
  
  for (const kw of contentKeywords) {
    // Check for bubblefeedid field (the actual API field name)
    const bubblefeedid = (kw as any).bubblefeedid;
    // Main keywords have no bubblefeedid (undefined, null, 0, or empty)
    const hasBubblefeedId = bubblefeedid !== undefined && 
                            bubblefeedid !== null && 
                            bubblefeedid !== 0 && 
                            String(bubblefeedid) !== '0' && 
                            String(bubblefeedid) !== '';
    
    if (hasBubblefeedId) {
      supportingKeywords.push(kw);
    } else {
      mainKeywords.push(kw);
    }
  }
  
  // Build parent-child map: bubblefeedid value -> array of supporting keywords
  const childrenByParentId = new Map<string, BronKeyword[]>();
  const assignedChildren = new Set<string>();
  
  for (const kw of supportingKeywords) {
    const parentId = String((kw as any).bubblefeedid);
    // Only assign if the parent actually exists as a main keyword
    if (keywordById.has(parentId)) {
      if (!childrenByParentId.has(parentId)) {
        childrenByParentId.set(parentId, []);
      }
      childrenByParentId.get(parentId)!.push(kw);
      assignedChildren.add(String(kw.id));
    }
  }
  
  // Log clustering info for debugging
  console.log('[BRON Clustering] bubblefeedid relationships:', {
    totalContentKeywords: contentKeywords.length,
    mainKeywords: mainKeywords.length,
    supportingKeywords: supportingKeywords.length,
    assignedToParents: assignedChildren.size,
    orphanedSupporting: supportingKeywords.length - assignedChildren.size,
    sample: contentKeywords.slice(0, 5).map(kw => ({
      id: kw.id,
      keyword: getKeywordDisplayText(kw).slice(0, 30),
      bubblefeedid: (kw as any).bubblefeedid,
      isMain: !(kw as any).bubblefeedid,
    })),
  });
  
  // Create clusters for main keywords with their children
  for (const kw of mainKeywords) {
    const children = childrenByParentId.get(String(kw.id)) || [];
    
    // Sort children alphabetically
    children.sort((a, b) => 
      getKeywordDisplayText(a).localeCompare(getKeywordDisplayText(b))
    );
    
    clusters.push({ 
      parent: kw, 
      children, 
      parentId: kw.id 
    });
  }
  
  // Add orphaned supporting keywords (bubblefeed points to non-existent parent) as standalone
  for (const kw of supportingKeywords) {
    if (!assignedChildren.has(String(kw.id))) {
      clusters.push({ parent: kw, children: [], parentId: kw.id });
    }
  }
  
  // Sort clusters alphabetically by parent keyword text
  clusters.sort((a, b) => 
    getKeywordDisplayText(a.parent).localeCompare(getKeywordDisplayText(b.parent))
  );
  
  // Add tracking-only keywords as standalone items at the end
  trackingOnlyKeywords.sort((a, b) => 
    getKeywordDisplayText(a).localeCompare(getKeywordDisplayText(b))
  );
  
  for (const kw of trackingOnlyKeywords) {
    clusters.push({ parent: kw, children: [], parentId: kw.id });
  }
  
  return clusters;
}

// Merge keywords from content API with SERP-tracked keywords
export function mergeKeywordsWithSerp(keywords: BronKeyword[], serpReports: BronSerpReport[]): BronKeyword[] {
  const keywordMap = new Map<string, BronKeyword>();
  
  for (const kw of keywords) {
    const text = getKeywordDisplayText(kw).toLowerCase().trim();
    keywordMap.set(text, kw);
  }
  
  for (const serpReport of serpReports) {
    const serpKeyword = serpReport.keyword?.toLowerCase().trim();
    if (!serpKeyword) continue;
    
    const hasContent = keywordMap.has(serpKeyword) || 
      [...keywordMap.keys()].some(k => k.includes(serpKeyword) || serpKeyword.includes(k));
    
    if (!hasContent) {
      const virtualKeyword: BronKeyword = {
        id: `serp_${serpKeyword.replace(/\s+/g, '_')}`,
        keyword: serpReport.keyword,
        keywordtitle: serpReport.keyword,
        is_supporting: true,
        active: 1,
        deleted: 0,
        status: 'tracking_only',
      };
      keywordMap.set(serpKeyword, virtualKeyword);
    }
  }
  
  return Array.from(keywordMap.values());
}

// Decode HTML entities
export function decodeHtmlContent(html: string): string {
  if (!html) return '';
  return html
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–').replace(/&nbsp;/g, ' ');
}

// Filter links for a specific keyword based on URL matching
// BRON API Link Structure:
// - Links Out (from our domain): `link` contains URL on OUR domain (e.g., "https://seolocal.it.com/topic-568071bc/")
//   - The URL contains a slug derived from the keyword/topic
// - Links In (to our domain): `link` contains URL on the REFERRER domain, `domain_name` is the source
//   - These are domain-level and typically don't include keyword-specific filtering
export function filterLinksForKeyword(
  keyword: BronKeyword,
  linksIn: BronLink[],
  linksOut: BronLink[],
  selectedDomain?: string
): { keywordLinksIn: BronLink[]; keywordLinksOut: BronLink[] } {
  const keywordText = getKeywordDisplayText(keyword);
  const keywordUrl = keyword.linkouturl;

  // BRON URLs commonly include a stable token like "-582231bc".
  // For links-out, BRON returns our page URL (contains this token).
  // For links-in, BRON returns the referrer's page URL (also contains this token),
  // but does NOT include a target_url to our page. So token matching is required
  // to associate inbound links to a specific keyword.
  const extractBronToken = (value?: string | null): string | null => {
    if (!value) return null;
    const match = String(value).match(/-(\d+bc)(?:\/?$)/i) || String(value).match(/(\d+bc)/i);
    return match?.[1]?.toLowerCase() || null;
  };

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/+$/, "");
  
  // Create slugs from keyword text for matching
  // Main slug: "local seo services" -> "local-seo-services"
  const mainSlug = keywordText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  
  // Also create partial slugs for fuzzy matching (first 3-4 words)
  const words = keywordText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const shortSlug = words.slice(0, 4).join('-');
  const tinySlug = words.slice(0, 3).join('-');
  
  // Generate possible URL patterns for this keyword (normalized, protocol-less)
  const urlPatterns: string[] = [];

  // Build token candidates for matching inbound/outbound links.
  const tokenCandidates = new Set<string>();
  const tokenFromUrl = extractBronToken(keywordUrl);
  if (tokenFromUrl) tokenCandidates.add(tokenFromUrl);
  const idStr = String(keyword.id);
  if (/^\d+$/.test(idStr)) tokenCandidates.add(`${idStr}bc`);
  // Some domains include the token with a leading hyphen.
  for (const t of Array.from(tokenCandidates)) tokenCandidates.add(`-${t}`);
  
  if (keywordUrl) {
    // Extract slug from the actual keyword URL
    const urlPath = keywordUrl.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '');
    const pathSlug = urlPath.split('/').pop() || '';
    // Remove trailing ID pattern like "-568071bc"
    const cleanSlug = pathSlug.replace(/-\d+bc$/, '');
    if (cleanSlug.length > 3) urlPatterns.push(cleanSlug);
    urlPatterns.push(normalize(keywordUrl));
  }
  
  if (selectedDomain) {
    urlPatterns.push(normalize(`${selectedDomain}/${mainSlug}`));
  }
  
  // Add slug patterns for partial matching
  if (mainSlug.length > 5) urlPatterns.push(mainSlug);
  if (shortSlug.length > 5 && shortSlug !== mainSlug) urlPatterns.push(shortSlug);
  if (tinySlug.length > 5 && tinySlug !== shortSlug) urlPatterns.push(tinySlug);

  const matchesKeywordUrl = (value?: string) => {
    if (!value) return false;
    const normalizedValue = normalize(value);
    if (!normalizedValue) return false;
    
    // Extract slug portion from URL for comparison
    const urlPath = normalizedValue.split('/').pop() || normalizedValue;
    // Remove trailing ID pattern like "-568071bc"
    const urlSlug = urlPath.replace(/-\d+bc$/, '');
    
    return urlPatterns.some((pattern) => {
      if (!pattern) return false;
      // Check for direct inclusion
      if (normalizedValue.includes(pattern)) return true;
      // Check for slug match
      if (urlSlug && urlSlug.length > 5) {
        if (pattern.includes(urlSlug) || urlSlug.includes(pattern)) return true;
      }
      return false;
    });
  };

  const matchesKeywordToken = (value?: string) => {
    if (!value) return false;
    if (tokenCandidates.size === 0) return false;
    const normalizedValue = normalize(value);
    if (!normalizedValue) return false;
    for (const token of tokenCandidates) {
      if (token && normalizedValue.includes(token)) return true;
    }
    return false;
  };
  
  // Links Out: Links FROM our domain TO other domains
  // BRON returns these with `link` pointing to OUR page (contains topic/keyword slug)
  let keywordLinksOut = linksOut.filter((link) => {
    return (
      matchesKeywordToken(link.link) ||
      matchesKeywordToken(link.source_url) ||
      matchesKeywordToken(link.target_url) ||
      matchesKeywordUrl(link.link) ||
      matchesKeywordUrl(link.source_url) ||
      matchesKeywordUrl(link.target_url)
    );
  });

  // Links In: Links TO our domain FROM other domains
  // BRON returns these with `link` pointing to the REFERRER's page
  // Try to match if there's a target_url that contains our keyword
  let keywordLinksIn = linksIn.filter((link) => {
    return (
      matchesKeywordToken(link.link) ||
      matchesKeywordToken(link.source_url) ||
      matchesKeywordToken(link.target_url) ||
      matchesKeywordUrl(link.target_url) ||
      matchesKeywordUrl(link.link)
    );
  });

  // IMPORTANT: BRON's link responses are often domain-level (referrer pages) and
  // may not include a target_url back to the specific keyword page.
  // If strict matching yields zero, fall back to category-based matching using
  // categories present in this keyword's data. If we still can't
  // determine relevance, show all links so the UI isn't empty.
  const normalizeCategory = (value?: string) =>
    (value || "")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  // Build a category set from the keyword itself if available
  const keywordCategorySet = new Set<string>();
  const kwAny = keyword as unknown as Record<string, unknown>;
  if (typeof kwAny.category === 'string' && kwAny.category) {
    keywordCategorySet.add(normalizeCategory(kwAny.category));
  }
  if (typeof kwAny.parent_category === 'string' && kwAny.parent_category) {
    keywordCategorySet.add(normalizeCategory(kwAny.parent_category));
  }

  // Fallback for outbound links: if strict matching yields zero, try category-based or show all
  if (keywordLinksOut.length === 0 && linksOut.length > 0) {
    if (keywordCategorySet.size > 0) {
      const byCategory = linksOut.filter((l) => {
        const cat = normalizeCategory(l.category);
        const parent = normalizeCategory(l.parent_category);
        return (
          (cat && keywordCategorySet.has(cat)) ||
          (parent && keywordCategorySet.has(parent))
        );
      });
      keywordLinksOut = byCategory.length > 0 ? byCategory : linksOut;
    } else {
      // No category info available - show all outbound links
      keywordLinksOut = linksOut;
    }
  }

  // Fallback for inbound links
  if (keywordLinksIn.length === 0 && linksIn.length > 0) {
    // First try using categories from outbound links
    const outboundCategorySet = new Set<string>();
    for (const l of keywordLinksOut) {
      const cat = normalizeCategory(l.category);
      const parent = normalizeCategory(l.parent_category);
      if (cat) outboundCategorySet.add(cat);
      if (parent) outboundCategorySet.add(parent);
      if (parent && cat) outboundCategorySet.add(`${parent}/${cat}`);
    }

    if (outboundCategorySet.size > 0) {
      const byCategory = linksIn.filter((l) => {
        const cat = normalizeCategory(l.category);
        const parent = normalizeCategory(l.parent_category);
        return (
          (cat && outboundCategorySet.has(cat)) ||
          (parent && outboundCategorySet.has(parent)) ||
          (parent && cat && outboundCategorySet.has(`${parent}/${cat}`))
        );
      });
      keywordLinksIn = byCategory.length > 0 ? byCategory : linksIn;
    } else {
      keywordLinksIn = linksIn;
    }
  }
  
  return { keywordLinksIn, keywordLinksOut };
}
