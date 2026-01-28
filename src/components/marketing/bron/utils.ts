import { BronKeyword, BronSerpReport, BronLink } from "@/hooks/use-bron-api";
import { getKeywordDisplayText, getPosition } from "./BronKeywordCard";

// LocalStorage key for PageSpeed cache
export const PAGESPEED_CACHE_KEY = 'bron_pagespeed_cache';
export const PAGESPEED_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

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
  
  // Check for explicit parent_keyword_id relationships (SEOM/BRON packages)
  // Also check is_supporting and bubblefeed flags
  const hasExplicitParent = new Map<number | string, number | string>();
  const isExplicitSupporting = new Set<number | string>();
  
  for (const kw of contentKeywords) {
    // Check parent_keyword_id first
    if (kw.parent_keyword_id) {
      hasExplicitParent.set(kw.id, kw.parent_keyword_id);
      isExplicitSupporting.add(kw.id);
    }
    // Also check is_supporting and bubblefeed flags
    else if (kw.is_supporting === true || kw.is_supporting === 1 || kw.bubblefeed === true || kw.bubblefeed === 1) {
      isExplicitSupporting.add(kw.id);
    }
  }
  
  // Log clustering info for debugging
  console.log('[BRON Clustering] API relationships detected:', {
    hasExplicitParents: hasExplicitParent.size,
    isSupportingCount: isExplicitSupporting.size,
    totalContentKeywords: contentKeywords.length,
    usingApiClustering: hasExplicitParent.size > 0,
  });
  
  if (hasExplicitParent.size > 0) {
    // Use explicit API relationships (SEOM/BRON packages)
    const parentChildMap = new Map<number | string, BronKeyword[]>();
    const assignedAsChild = new Set<number | string>();
    
    for (const kw of contentKeywords) {
      if (hasExplicitParent.has(kw.id)) {
        const parentId = hasExplicitParent.get(kw.id)!;
        if (!parentChildMap.has(parentId)) {
          parentChildMap.set(parentId, []);
        }
        parentChildMap.get(parentId)!.push(kw);
        assignedAsChild.add(kw.id);
      }
    }
    
    // Create clusters from parents with their children (max 2 per cluster)
    for (const kw of contentKeywords) {
      if (!assignedAsChild.has(kw.id)) {
        const children = (parentChildMap.get(kw.id) || []).slice(0, 2);
        clusters.push({ parent: kw, children, parentId: kw.id });
      }
    }
  } else {
    // Topic-based similarity clustering
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
  const keywordLinksOut = linksOut.filter((link) => {
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
  const keywordLinksIn = linksIn.filter((link) => {
    return (
      matchesKeywordToken(link.link) ||
      matchesKeywordToken(link.source_url) ||
      matchesKeywordToken(link.target_url) ||
      matchesKeywordUrl(link.target_url) ||
      matchesKeywordUrl(link.link)
    );
  });
  
  return { keywordLinksIn, keywordLinksOut };
}
