import { BronKeyword, BronSerpReport, BronLink } from "@/hooks/use-bron-api";
import { getKeywordDisplayText, getPosition, PageSpeedScore } from "./BronKeywordCard";

// Re-export PageSpeedScore for backward compatibility
export type { PageSpeedScore };

// LocalStorage key for PageSpeed cache
export const PAGESPEED_CACHE_KEY = 'bron_pagespeed_cache';
export const PAGESPEED_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// LocalStorage key for Keyword Cluster cache
export const CLUSTER_CACHE_KEY = 'bron_cluster_cache';
export const CLUSTER_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// Cluster cache type
interface ClusterCacheEntry {
  keywordIds: string[]; // Sorted list of keyword IDs for comparison
  clusters: SerializedCluster[];
  cachedAt: number;
}

interface SerializedCluster {
  parentId: string | number;
  parentKeyword: BronKeyword;
  childIds: (string | number)[];
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

// Generate a signature from keyword IDs for cache comparison
function getKeywordSignature(keywords: BronKeyword[]): string[] {
  return keywords.map(kw => String(kw.id)).sort();
}

// Check if two sorted ID arrays are equal
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Load cached clusters from localStorage
function loadCachedClusters(): Record<string, ClusterCacheEntry> {
  try {
    const cached = localStorage.getItem(CLUSTER_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const now = Date.now();
      const valid: Record<string, ClusterCacheEntry> = {};
      for (const [domain, entry] of Object.entries(parsed)) {
        const e = entry as ClusterCacheEntry;
        if (e.cachedAt && (now - e.cachedAt) < CLUSTER_CACHE_MAX_AGE) {
          valid[domain] = e;
        }
      }
      return valid;
    }
  } catch (e) {
    console.warn('Failed to load cluster cache:', e);
  }
  return {};
}

// Save clusters to localStorage
function saveCachedClusters(cache: Record<string, ClusterCacheEntry>) {
  try {
    localStorage.setItem(CLUSTER_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save cluster cache:', e);
  }
}

// Reconstruct clusters from cache using current keyword objects
function reconstructClustersFromCache(
  cached: SerializedCluster[],
  keywordMap: Map<string, BronKeyword>
): KeywordCluster[] | null {
  try {
    const clusters: KeywordCluster[] = [];
    for (const sc of cached) {
      const parent = keywordMap.get(String(sc.parentId)) || sc.parentKeyword;
      if (!parent) return null; // Cache invalid
      
      const children: BronKeyword[] = [];
      for (const childId of sc.childIds) {
        const child = keywordMap.get(String(childId));
        if (child) children.push(child);
      }
      
      clusters.push({ parent, children, parentId: sc.parentId });
    }
    return clusters;
  } catch {
    return null;
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

// Location words used for similarity boosting (static, shared)
const LOCATION_WORDS = new Set(['port', 'coquitlam', 'vancouver', 'burnaby', 'surrey', 'richmond', 'langley', 'abbotsford']);

// Calculate text similarity between pre-split word arrays (avoids repeated split/filter)
function calculateWordSimilarity(words1: string[], words2: string[]): number {
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const set2 = new Set(words2);
  const commonWords: string[] = [];
  for (const w of words1) {
    if (set2.has(w)) commonWords.push(w);
  }
  
  const overlap = commonWords.length / Math.min(words1.length, words2.length);
  const hasMatchingLocation = commonWords.some(w => LOCATION_WORDS.has(w));
  
  return hasMatchingLocation ? overlap * 1.2 : overlap;
}

// Group keywords by topic similarity
// SEOM/BRON packages have explicit parent_keyword_id relationships from the API
// Other packages use similarity-based clustering as a fallback
// Uses 24-hour localStorage cache, invalidated when keyword IDs change
export function groupKeywords(keywords: BronKeyword[], domain?: string): KeywordCluster[] {
  if (keywords.length === 0) return [];
  
  // Build keyword lookup map first (needed for cache reconstruction)
  const keywordById = new Map<string, BronKeyword>();
  for (const kw of keywords) {
    keywordById.set(String(kw.id), kw);
  }
  
  // ─── Cache Check ───
  const cacheKey = domain || 'default';
  const currentSignature = getKeywordSignature(keywords);
  
  try {
    const clusterCache = loadCachedClusters();
    const cached = clusterCache[cacheKey];
    
    if (cached && arraysEqual(cached.keywordIds, currentSignature)) {
      // Cache hit - reconstruct clusters with current keyword objects
      const reconstructed = reconstructClustersFromCache(cached.clusters, keywordById);
      if (reconstructed && reconstructed.length > 0) {
        return reconstructed;
      }
    }
  } catch (e) {
    // Cache read failed, proceed with fresh computation
  }
  
  // ─── Fresh Computation ───
  // Cache getKeywordDisplayText for every keyword
  const textCache = new Map<number | string, string>();
  const getText = (kw: BronKeyword): string => {
    let t = textCache.get(kw.id);
    if (t === undefined) {
      t = getKeywordDisplayText(kw);
      textCache.set(kw.id, t);
    }
    return t;
  };
  
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
  
  // Build parent-child relationships
  const parentChildMap = new Map<string, BronKeyword[]>();
  const childIds = new Set<string>();
  
  // Helper to add a child to a parent (with dedup via childIds set)
  const addChild = (parentId: string, child: BronKeyword) => {
    const childIdStr = String(child.id);
    if (childIds.has(childIdStr)) return; // already assigned
    childIds.add(childIdStr);
    let arr = parentChildMap.get(parentId);
    if (!arr) {
      arr = [];
      parentChildMap.set(parentId, arr);
    }
    arr.push(child);
  };
  
  // FIRST: Process supporting_keywords arrays from parent keywords
  for (const kw of contentKeywords) {
    if (kw.supporting_keywords && Array.isArray(kw.supporting_keywords) && kw.supporting_keywords.length > 0) {
      const parentIdStr = String(kw.id);
      for (const supportingKw of kw.supporting_keywords) {
        if (supportingKw && supportingKw.id) {
          const existingKw = keywordById.get(String(supportingKw.id));
          addChild(parentIdStr, existingKw || (supportingKw as BronKeyword));
        }
      }
    }
  }
  
  // SECOND: Process bubblefeedid / parent_keyword_id for any keywords not yet assigned
  for (const kw of contentKeywords) {
    const kwIdStr = String(kw.id);
    if (childIds.has(kwIdStr)) continue;
    
    const bubbleId = kw.bubblefeedid;
    if (bubbleId && typeof bubbleId !== 'boolean') {
      const parentIdStr = String(bubbleId);
      if (keywordById.has(parentIdStr)) {
        addChild(parentIdStr, kw);
        continue;
      }
    }
    if (kw.parent_keyword_id) {
      const parentIdStr = String(kw.parent_keyword_id);
      if (keywordById.has(parentIdStr)) {
        addChild(parentIdStr, kw);
      }
    }
  }
  
  if (childIds.size > 0) {
    // Explicit API relationships present
    for (const kw of contentKeywords) {
      if (childIds.has(String(kw.id))) continue;
      let children = parentChildMap.get(String(kw.id)) || [];
      children = children.slice(0, 2); // Max 2 supporting per cluster
      clusters.push({ parent: kw, children, parentId: kw.id });
    }
  } else {
    // Similarity-based clustering fallback
    // Pre-compute word arrays once per keyword
    const keywordsWithWords = contentKeywords.map(kw => {
      const text = getText(kw);
      const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      return { kw, text, words, wordCount: words.length };
    });
    
    keywordsWithWords.sort((a, b) => a.wordCount - b.wordCount || a.text.localeCompare(b.text));
    
    const assigned = new Set<string>();
    const mainKeywords: typeof keywordsWithWords = [];
    const supportingPool: typeof keywordsWithWords = [];
    
    const targetMainCount = Math.ceil(keywordsWithWords.length / 3);
    
    for (let i = 0; i < keywordsWithWords.length; i++) {
      if (mainKeywords.length < targetMainCount && i % 3 === 0) {
        mainKeywords.push(keywordsWithWords[i]);
      } else {
        supportingPool.push(keywordsWithWords[i]);
      }
    }
    
    for (const main of mainKeywords) {
      const children: BronKeyword[] = [];
      
      // Score unassigned supporting keywords against this main keyword
      const scored: { kw: BronKeyword; score: number }[] = [];
      for (const s of supportingPool) {
        if (assigned.has(String(s.kw.id))) continue;
        scored.push({ kw: s.kw, score: calculateWordSimilarity(main.words, s.words) });
      }
      scored.sort((a, b) => b.score - a.score);
      
      for (let i = 0; i < Math.min(2, scored.length); i++) {
        if (scored[i].score >= 0.3) {
          children.push(scored[i].kw);
          assigned.add(String(scored[i].kw.id));
        }
      }
      
      clusters.push({ parent: main.kw, children, parentId: main.kw.id });
      assigned.add(String(main.kw.id));
    }
    
    for (const s of supportingPool) {
      if (!assigned.has(String(s.kw.id))) {
        clusters.push({ parent: s.kw, children: [], parentId: s.kw.id });
      }
    }
  }
  
  // Sort clusters by keyword text (use cached text)
  clusters.sort((a, b) => getText(a.parent).localeCompare(getText(b.parent)));
  
  // Sort and append tracking-only keywords
  trackingOnlyKeywords.sort((a, b) => getText(a).localeCompare(getText(b)));
  for (const kw of trackingOnlyKeywords) {
    clusters.push({ parent: kw, children: [], parentId: kw.id });
  }
  
  // ─── Save to Cache ───
  try {
    const clusterCache = loadCachedClusters();
    const serialized: SerializedCluster[] = clusters.map(c => ({
      parentId: c.parentId,
      parentKeyword: c.parent,
      childIds: c.children.map(ch => ch.id),
    }));
    
    clusterCache[cacheKey] = {
      keywordIds: currentSignature,
      clusters: serialized,
      cachedAt: Date.now(),
    };
    
    saveCachedClusters(clusterCache);
  } catch (e) {
    // Cache write failed, continue without caching
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
