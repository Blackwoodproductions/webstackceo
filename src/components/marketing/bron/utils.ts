import { BronKeyword, BronSerpReport, BronLink } from "@/hooks/use-bron-api";
import { getKeywordDisplayText, getTargetKeyword, getPosition, PageSpeedScore } from "./BronKeywordCard";

// Re-export PageSpeedScore for backward compatibility
export type { PageSpeedScore };

// LocalStorage key for PageSpeed cache
export const PAGESPEED_CACHE_KEY = 'bron_pagespeed_cache';
export const PAGESPEED_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// LocalStorage key for Keyword Cluster cache
export const CLUSTER_CACHE_KEY = 'bron_cluster_cache';
export const CLUSTER_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// ─── In-Memory Cache for Cluster Data ───
// This prevents re-parsing localStorage on every render (major perf gain for 150+ keyword domains)
let clusterMemoryCache: Record<string, ClusterCacheEntry> | null = null;
let clusterMemoryCacheLoadedAt = 0;
const MEMORY_CACHE_TTL = 60 * 1000; // 1 minute in-memory, fallback to localStorage

// ─── In-Memory Signature Cache ───
// Prevents re-sorting keyword IDs on every render
const signatureCache = new Map<string, { ids: string[]; keywordCount: number }>();

// Cluster cache type
interface ClusterCacheEntry {
  keywordIds: string[]; // Sorted list of keyword IDs for comparison
  clusters: SerializedCluster[];
  cachedAt: number;
}

interface SerializedCluster {
  parentId: string | number;
  /**
   * Legacy field (kept for backward compatibility).
   * Older cache entries stored the full keyword object, which could explode localStorage size
   * (especially when resfeedtext is present) and prevent cache writes.
   */
  parentKeyword?: BronKeyword;
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
// Uses in-memory cache to avoid re-sorting on every render
function getKeywordSignature(keywords: BronKeyword[], domain?: string): string[] {
  const cacheKey = domain || 'default';
  const cached = signatureCache.get(cacheKey);
  
  // If count matches, signature is likely unchanged (fast path)
  if (cached && cached.keywordCount === keywords.length) {
    return cached.ids;
  }
  
  // Compute fresh signature
  const ids = keywords.map(kw => String(kw.id)).sort();
  signatureCache.set(cacheKey, { ids, keywordCount: keywords.length });
  return ids;
}

// Check if two sorted ID arrays are equal
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Load cached clusters - uses in-memory cache to avoid repeated localStorage parsing
function loadCachedClusters(): Record<string, ClusterCacheEntry> {
  const now = Date.now();
  
  // Return memory cache if still valid
  if (clusterMemoryCache && (now - clusterMemoryCacheLoadedAt) < MEMORY_CACHE_TTL) {
    return clusterMemoryCache;
  }
  
  try {
    const cached = localStorage.getItem(CLUSTER_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const valid: Record<string, ClusterCacheEntry> = {};
      for (const [domain, entry] of Object.entries(parsed)) {
        const e = entry as ClusterCacheEntry;
        if (e.cachedAt && (now - e.cachedAt) < CLUSTER_CACHE_MAX_AGE) {
          valid[domain] = e;
        }
      }
      // Update memory cache
      clusterMemoryCache = valid;
      clusterMemoryCacheLoadedAt = now;
      return valid;
    }
  } catch (e) {
    console.warn('Failed to load cluster cache:', e);
  }
  
  clusterMemoryCache = {};
  clusterMemoryCacheLoadedAt = now;
  return {};
}

// Save clusters to localStorage and update memory cache
function saveCachedClusters(cache: Record<string, ClusterCacheEntry>) {
  try {
    localStorage.setItem(CLUSTER_CACHE_KEY, JSON.stringify(cache));
    // Update memory cache too
    clusterMemoryCache = cache;
    clusterMemoryCacheLoadedAt = Date.now();
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

// Helper to extract keyword text from a SERP report (BRON API uses various field names)
function getSerpReportKeyword(report: BronSerpReport): string {
  // Primary field
  if (report.keyword && typeof report.keyword === 'string' && report.keyword.trim()) {
    return report.keyword.toLowerCase().trim();
  }
  // Check alternative field names (BRON API may use different names)
  const r = report as unknown as Record<string, unknown>;
  const altFields = ['keyword_text', 'keywordtitle', 'title', 'phrase', 'query', 'search_term', 'text', 'name'];
  for (const field of altFields) {
    const val = r[field];
    if (typeof val === 'string' && val.trim()) {
      return val.toLowerCase().trim();
    }
  }
  return '';
}

// Find matching SERP report for a keyword
export function findSerpForKeyword(keywordText: string, serpReports: BronSerpReport[]): BronSerpReport | null {
  if (!keywordText || !serpReports.length) return null;
  const normalizedKeyword = keywordText.toLowerCase().trim();
  
  // Exact match using extended keyword extraction
  const exactMatch = serpReports.find(r => getSerpReportKeyword(r) === normalizedKeyword);
  if (exactMatch) return exactMatch;
  
  // Contains match
  const containsMatch = serpReports.find(r => {
    const serpKeyword = getSerpReportKeyword(r);
    if (!serpKeyword) return false;
    return normalizedKeyword.includes(serpKeyword) || serpKeyword.includes(normalizedKeyword);
  });
  if (containsMatch) return containsMatch;
  
  // Word overlap match (2+ word matches)
  const keywordWords = normalizedKeyword.split(/\s+/).filter(w => w.length > 2);
  for (const report of serpReports) {
    const serpKeyword = getSerpReportKeyword(report);
    if (!serpKeyword) continue;
    const serpWords = serpKeyword.split(/\s+/).filter(w => w.length > 2);
    const matchCount = keywordWords.filter(w => serpWords.includes(w)).length;
    if (matchCount >= 2) return report;
  }
  
  // Fallback: normalized slug comparison (remove special chars)
  const normalizedSlug = normalizedKeyword.replace(/[^a-z0-9]/g, '');
  for (const report of serpReports) {
    const serpKeyword = getSerpReportKeyword(report);
    if (!serpKeyword) continue;
    const serpSlug = serpKeyword.replace(/[^a-z0-9]/g, '');
    if (normalizedSlug === serpSlug) return report;
    // Partial slug match (one contains the other, with min length)
    if (normalizedSlug.length >= 8 && serpSlug.length >= 8) {
      if (normalizedSlug.includes(serpSlug) || serpSlug.includes(normalizedSlug)) {
        return report;
      }
    }
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
  const currentSignature = getKeywordSignature(keywords, cacheKey);
  
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
    // IMPORTANT: only store IDs.
    // Storing full keyword objects (especially resfeedtext HTML) makes the cache massive,
    // often exceeding localStorage quota and causing repeated 3–5s reclustering.
    const serialized: SerializedCluster[] = clusters.map((c) => ({
      parentId: c.parentId,
      childIds: c.children.map((ch) => ch.id),
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
// BRON API Link Structure (Diamond Silo Model):
// 
// Links come from the Business Collective - a network of partner domains linking to each other.
// Each partner in the GMB Business Collective links to specific pages in your silo.
// 
// LINKS IN (Inbound):
// - These come from GMB partners TO a specific page on our domain
// - The link's target URL (stored in various fields) contains the keyword's unique BRON token
// - Example: partner links TO https://thegrovedentistry.ca/best-dentist-in-port-coquitlam-582231bc/
// - We match by finding the BRON token (e.g., "582231bc") in the link's target URL
// - BRON API: `link` = target URL on OUR domain that receives the inbound link
//
// LINKS OUT (Outbound):
// - These are from each keyword page going TO other sites (Business Collective partners)
// - Each outbound link has a keyword/anchor text that identifies which keyword page it belongs to
// - The `domain_name` field shows the partner domain receiving the link
// - We match by comparing the link's keyword/anchor text with the current keyword
// - BRON API: Partners listed by domain (e.g., houstondental.ca) with their keyword association
//
// BRON Token Format: Unique ID suffix like "-582231bc" at the end of page URLs
//
export function filterLinksForKeyword(
  keyword: BronKeyword,
  linksIn: BronLink[],
  linksOut: BronLink[],
  selectedDomain?: string
): { keywordLinksIn: BronLink[]; keywordLinksOut: BronLink[] } {
  const keywordText = getKeywordDisplayText(keyword);
  const keywordUrl = keyword.linkouturl;
  const keywordLower = keywordText.toLowerCase().trim();

  // Extract BRON token (e.g., "582231" or "582231bc") from URLs
  // BRON pages have two URL patterns:
  // - Main article: /best-dentist-in-port-coquitlam-582231/
  // - Resources/Links page: /best-dentist-in-port-coquitlam-582231bc/
  // Both use the same 6-digit ID, the "bc" suffix denotes the bottom-of-silo links page
  const extractBronToken = (value?: string | null): string | null => {
    if (!value) return null;
    const str = String(value);
    // Match patterns like "-582231bc/" or "-582231/" at end of URLs
    const matchWithBc = str.match(/-(\d{6,})bc(?:\/|$)/i);
    if (matchWithBc) return matchWithBc[1];
    // Match without bc suffix
    const matchWithoutBc = str.match(/-(\d{6,})(?:\/|$)/i);
    if (matchWithoutBc) return matchWithoutBc[1];
    return null;
  };

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/+$/, "");
  
  // Create slugs from keyword text for matching
  const mainSlug = keywordText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const words = keywordText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const shortSlug = words.slice(0, 4).join('-');
  const tinySlug = words.slice(0, 3).join('-');
  
  // Build token candidates for matching
  // These are the unique identifiers for this keyword's page
  const tokenCandidates = new Set<string>();
  
  // Primary: Extract from linkouturl (most reliable)
  const tokenFromUrl = extractBronToken(keywordUrl);
  if (tokenFromUrl) {
    tokenCandidates.add(tokenFromUrl);
    // Also add with bc suffix for matching links pages
    tokenCandidates.add(`${tokenFromUrl}bc`);
  }
  
  // Secondary: Try keyword ID if it looks like a BRON ID
  const idStr = String(keyword.id);
  // Only use ID if it's a numeric ID that matches BRON pattern (6+ digits)
  if (/^\d{6,}$/.test(idStr)) {
    tokenCandidates.add(idStr);
    tokenCandidates.add(`${idStr}bc`);
  }
  
  // Also match with hyphen prefix
  for (const t of Array.from(tokenCandidates)) tokenCandidates.add(`-${t}`);
  
  // URL patterns for this keyword (slug-based matching fallback)
  const urlPatterns: string[] = [];
  if (keywordUrl) {
    const urlPath = keywordUrl.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '');
    const pathSlug = urlPath.split('/').pop() || '';
    const cleanSlug = pathSlug.replace(/-\d+bc$/, '').replace(/-\d+$/, '');
    if (cleanSlug.length > 3) urlPatterns.push(cleanSlug);
    urlPatterns.push(normalize(keywordUrl));
  }
  if (selectedDomain) {
    urlPatterns.push(normalize(`${selectedDomain}/${mainSlug}`));
  }
  if (mainSlug.length > 5) urlPatterns.push(mainSlug);
  if (shortSlug.length > 5 && shortSlug !== mainSlug) urlPatterns.push(shortSlug);
  if (tinySlug.length > 5 && tinySlug !== shortSlug) urlPatterns.push(tinySlug);

  // Check if a URL matches the keyword by BRON token
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

  // Check if a URL matches the keyword by slug pattern
  const matchesKeywordUrl = (value?: string) => {
    if (!value) return false;
    const normalizedValue = normalize(value);
    if (!normalizedValue) return false;
    const urlPath = normalizedValue.split('/').pop() || normalizedValue;
    const urlSlug = urlPath.replace(/-\d+bc$/, '').replace(/-\d+$/, '');
    return urlPatterns.some((pattern) => {
      if (!pattern) return false;
      if (normalizedValue.includes(pattern)) return true;
      if (urlSlug && urlSlug.length > 5) {
        if (pattern.includes(urlSlug) || urlSlug.includes(pattern)) return true;
      }
      return false;
    });
  };

  // Check multiple link fields for a match (used for INBOUND links)
  const linkMatchesKeywordByUrl = (link: BronLink): boolean => {
    // Check all possible URL fields in the link object
    const urlFields = [
      link.link,
      link.source_url,
      link.target_url,
      // Cast to check any other fields that might contain URLs
      (link as Record<string, unknown>).url as string,
      (link as Record<string, unknown>).page_url as string,
      (link as Record<string, unknown>).landing_page as string,
    ];
    
    for (const url of urlFields) {
      if (matchesKeywordToken(url) || matchesKeywordUrl(url)) {
        return true;
      }
    }
    return false;
  };

  // NEW: Match link by keyword/anchor text association (for OUTBOUND links)
  // BRON API associates outbound links with keywords via the anchor text or keyword field
  const matchesKeywordByText = (link: BronLink): boolean => {
    // Get anchor text or keyword from the link
    const linkTexts = [
      link.anchor_text,
      (link as Record<string, unknown>).keyword as string,
      (link as Record<string, unknown>).keyword_text as string,
      (link as Record<string, unknown>).keywordtitle as string,
      (link as Record<string, unknown>).title as string,
    ].filter(Boolean);

    for (const text of linkTexts) {
      if (!text) continue;
      const linkTextLower = String(text).toLowerCase().trim();
      
      // Exact match
      if (linkTextLower === keywordLower) return true;
      
      // Fuzzy match: check if significant words overlap
      const linkWords = linkTextLower.split(/\s+/).filter(w => w.length > 2);
      const keywordWords = keywordLower.split(/\s+/).filter(w => w.length > 2);
      
      // If most words match (70%+), consider it a match
      if (keywordWords.length >= 2 && linkWords.length >= 2) {
        const matchingWords = keywordWords.filter(w => linkWords.includes(w));
        const matchRatio = matchingWords.length / Math.min(keywordWords.length, linkWords.length);
        if (matchRatio >= 0.7) return true;
      }
      
      // Contains match for shorter keywords
      if (keywordLower.length >= 5) {
        if (linkTextLower.includes(keywordLower) || keywordLower.includes(linkTextLower)) {
          return true;
        }
      }
    }
    
    return false;
  };

  // LINKS IN: Filter for inbound links TO this specific keyword's page
  // Each partner in the Business Collective links to specific pages
  // We match links where the target URL contains our keyword's BRON token
  const keywordLinksIn = linksIn.filter((link) => {
    // For inbound links, the `link` field typically contains the target URL on our domain
    // First try URL-based matching (most reliable for inbound)
    if (linkMatchesKeywordByUrl(link)) return true;
    // Fallback: check if the link's anchor/keyword matches this keyword
    if (matchesKeywordByText(link)) return true;
    return false;
  });
  
  // LINKS OUT: Filter for outbound links FROM this keyword's page
  // These are links from our keyword page to partner sites
  // BRON API shows: domain_name (partner), keyword/anchor_text association, category
  const keywordLinksOut = linksOut.filter((link) => {
    // Primary: Match by keyword/anchor text association
    // This is how BRON API organizes outbound links - each link has a keyword it belongs to
    if (matchesKeywordByText(link)) return true;
    // Fallback: Try URL-based matching (in case source URL is provided)
    if (linkMatchesKeywordByUrl(link)) return true;
    return false;
  });

  return { keywordLinksIn, keywordLinksOut };
}
