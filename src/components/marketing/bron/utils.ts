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

// Calculate text similarity between keywords
function calculateKeywordSimilarity(kw1: string, kw2: string): number {
  const words1 = kw1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = kw2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(w => words2.includes(w));
  const overlap = commonWords.length / Math.min(words1.length, words2.length);
  
  const locationWords = ['port', 'coquitlam', 'vancouver', 'burnaby', 'surrey', 'richmond', 'langley', 'abbotsford'];
  const hasMatchingLocation = commonWords.some(w => locationWords.includes(w));
  
  return hasMatchingLocation ? overlap * 1.2 : overlap;
}

// Group keywords by topic similarity
// SEOM/BRON packages have explicit parent_keyword_id relationships from the API
// Other packages use similarity-based clustering as a fallback
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
  
  // Build a lookup map: keyword ID -> keyword object
  const keywordById = new Map<number | string, BronKeyword>();
  for (const kw of contentKeywords) {
    keywordById.set(kw.id, kw);
    keywordById.set(String(kw.id), kw);
    if (typeof kw.id === 'string' && !isNaN(Number(kw.id))) {
      keywordById.set(Number(kw.id), kw);
    }
  }
  
  // Build parent-child relationships
  // The BRON API returns relationships in TWO ways:
  // 1. Parent keywords have a `supporting_keywords[]` array containing child keyword objects
  // 2. Child keywords (if in flat list) have `bubblefeedid` pointing to parent ID
  const parentChildMap = new Map<number | string, BronKeyword[]>();
  const childIds = new Set<number | string>();
  
  // FIRST: Process supporting_keywords arrays from parent keywords
  // This is the PRIMARY source since child keywords are nested in parent objects
  for (const kw of contentKeywords) {
    if (kw.supporting_keywords && Array.isArray(kw.supporting_keywords) && kw.supporting_keywords.length > 0) {
      const children: BronKeyword[] = [];
      
      for (const supportingKw of kw.supporting_keywords) {
        if (supportingKw && supportingKw.id) {
          // Check if this supporting keyword already exists in the flat list
          const existingKw = keywordById.get(supportingKw.id) || keywordById.get(String(supportingKw.id));
          
          if (existingKw) {
            // Use the existing keyword object (has more complete data)
            children.push(existingKw);
            childIds.add(existingKw.id);
          } else {
            // Use the supporting keyword object from the array (might be partial data)
            children.push(supportingKw as BronKeyword);
            childIds.add(supportingKw.id);
          }
          
          console.log(`[BRON Clustering] Found supporting keyword from array: "${getKeywordDisplayText(supportingKw)}" (ID: ${supportingKw.id}) -> parent: "${getKeywordDisplayText(kw)}" (ID: ${kw.id})`);
        }
      }
      
      if (children.length > 0) {
        parentChildMap.set(kw.id, children);
      }
    }
  }
  
  // SECOND: Process bubblefeedid for any keywords not yet assigned
  // This catches cases where child keywords appear in flat list with bubblefeedid
  for (const kw of contentKeywords) {
    // Skip if already marked as a child
    if (childIds.has(kw.id)) continue;
    
    const bubbleId = kw.bubblefeedid;
    
    if (bubbleId && typeof bubbleId !== 'boolean') {
      const parentId = bubbleId;
      const parentExists = keywordById.has(parentId) || keywordById.has(String(parentId));
      
      if (parentExists) {
        childIds.add(kw.id);
        
        const normalizedParentId = keywordById.has(parentId) ? parentId : String(parentId);
        if (!parentChildMap.has(normalizedParentId)) {
          parentChildMap.set(normalizedParentId, []);
        }
        // Only add if not already in the array
        const existingChildren = parentChildMap.get(normalizedParentId)!;
        if (!existingChildren.some(c => c.id === kw.id)) {
          existingChildren.push(kw);
        }
        
        console.log(`[BRON Clustering] Found child via bubblefeedid: "${getKeywordDisplayText(kw)}" (ID: ${kw.id}) -> parent ID: ${parentId}`);
      }
    }
    // Fallback: Check parent_keyword_id
    else if (kw.parent_keyword_id) {
      const parentId = kw.parent_keyword_id;
      const parentExists = keywordById.has(parentId) || keywordById.has(String(parentId));
      
      if (parentExists) {
        childIds.add(kw.id);
        
        const normalizedParentId = keywordById.has(parentId) ? parentId : String(parentId);
        if (!parentChildMap.has(normalizedParentId)) {
          parentChildMap.set(normalizedParentId, []);
        }
        const existingChildren = parentChildMap.get(normalizedParentId)!;
        if (!existingChildren.some(c => c.id === kw.id)) {
          existingChildren.push(kw);
        }
      }
    }
  }
  
  // Log clustering info for debugging
  console.log('[BRON Clustering] API relationships detected:', {
    totalContentKeywords: contentKeywords.length,
    childrenFound: childIds.size,
    parentCount: parentChildMap.size,
    parentIds: Array.from(parentChildMap.keys()),
    childIdsList: Array.from(childIds),
  });
  
  if (childIds.size > 0) {
    // Use explicit API relationships (BRON packages with bubblefeedid)
    // Create clusters: parents first (those with children), then standalone keywords
    for (const kw of contentKeywords) {
      // Skip if this keyword is a child of another
      if (childIds.has(kw.id)) continue;
      
      // Check if this keyword has children (try both original ID and string version)
      let children = parentChildMap.get(kw.id) || parentChildMap.get(String(kw.id)) || [];
      children = children.slice(0, 2); // Max 2 supporting keywords per cluster
      
      clusters.push({ parent: kw, children, parentId: kw.id });
    }
  } else {
    // Topic-based similarity clustering (fallback when no bubblefeedid relationships)
    const keywordsWithLength = contentKeywords.map(kw => ({
      kw,
      text: getKeywordDisplayText(kw),
      wordCount: getKeywordDisplayText(kw).split(/\s+/).length
    }));
    
    keywordsWithLength.sort((a, b) => a.wordCount - b.wordCount || a.text.localeCompare(b.text));
    
    const assigned = new Set<number | string>();
    const mainKeywords: BronKeyword[] = [];
    const supportingPool: BronKeyword[] = [];
    
    const targetMainCount = Math.ceil(contentKeywords.length / 3);
    
    for (let i = 0; i < keywordsWithLength.length; i++) {
      if (mainKeywords.length < targetMainCount && i % 3 === 0) {
        mainKeywords.push(keywordsWithLength[i].kw);
      } else {
        supportingPool.push(keywordsWithLength[i].kw);
      }
    }
    
    for (const main of mainKeywords) {
      const mainText = getKeywordDisplayText(main);
      
      const scored = supportingPool
        .filter(s => !assigned.has(s.id))
        .map(s => ({
          kw: s,
          score: calculateKeywordSimilarity(mainText, getKeywordDisplayText(s))
        }))
        .sort((a, b) => b.score - a.score);
      
      const children: BronKeyword[] = [];
      for (let i = 0; i < Math.min(2, scored.length); i++) {
        if (scored[i].score >= 0.3) {
          children.push(scored[i].kw);
          assigned.add(scored[i].kw.id);
        }
      }
      
      clusters.push({ parent: main, children, parentId: main.id });
      assigned.add(main.id);
    }
    
    for (const s of supportingPool) {
      if (!assigned.has(s.id)) {
        clusters.push({ parent: s, children: [], parentId: s.id });
      }
    }
  }
  
  clusters.sort((a, b) => 
    getKeywordDisplayText(a.parent).localeCompare(getKeywordDisplayText(b.parent))
  );
  
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
