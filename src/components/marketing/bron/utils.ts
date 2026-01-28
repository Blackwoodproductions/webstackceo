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
// SEOM/BRON packages have nested supporting_keywords arrays in the API response
// Other packages may use bubblefeedid, parent_keyword_id fields
// Fallback to similarity-based clustering if no explicit relationships found
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
  
  // ============================================================
  // STRATEGY 1: Check for nested supporting_keywords array (BRON API)
  // Main keywords have a supporting_keywords[] array containing their children
  // ============================================================
  const hasNestedSupporting = contentKeywords.some(kw => 
    Array.isArray(kw.supporting_keywords) && kw.supporting_keywords.length > 0
  );
  
  if (hasNestedSupporting) {
    console.log('[BRON Clustering] Using nested supporting_keywords arrays');
    
    // Track which keywords are already assigned as supporting
    const assignedAsSupporting = new Set<string>();
    
    // First pass: identify all supporting keyword IDs
    for (const kw of contentKeywords) {
      if (Array.isArray(kw.supporting_keywords)) {
        for (const child of kw.supporting_keywords) {
          assignedAsSupporting.add(String(child.id));
        }
      }
    }
    
    // Second pass: create clusters from main keywords
    for (const kw of contentKeywords) {
      const idKey = String(kw.id);
      
      // Skip if this keyword is already assigned as a child
      if (assignedAsSupporting.has(idKey)) continue;
      
      // Get nested supporting keywords (limit to 2)
      const children = Array.isArray(kw.supporting_keywords) 
        ? kw.supporting_keywords.slice(0, 2) 
        : [];
      
      clusters.push({ parent: kw, children, parentId: kw.id });
    }
    
    console.log('[BRON Clustering] Created clusters from nested arrays:', {
      totalClusters: clusters.length,
      clustersWithChildren: clusters.filter(c => c.children.length > 0).length,
      totalChildren: clusters.reduce((sum, c) => sum + c.children.length, 0),
    });
  } else {
    // ============================================================
    // STRATEGY 2: Check for bubblefeedid or parent_keyword_id relationships
    // Supporting keywords have bubblefeedid = main_keyword.id
    // ============================================================
    const hasExplicitParent = new Map<string, string>();
    const allIdKeys = new Set(contentKeywords.map(kw => String(kw.id)));
    
    for (const kw of contentKeywords) {
      const idKey = String(kw.id);
      
      // Check bubblefeedid first (SEOM/BRON style)
      const bubblefeedidRaw = (kw as any).bubblefeedid;
      if (bubblefeedidRaw !== undefined && bubblefeedidRaw !== null) {
        const parentKey = String(bubblefeedidRaw);
        if (parentKey && parentKey !== "0" && parentKey !== idKey && allIdKeys.has(parentKey)) {
          hasExplicitParent.set(idKey, parentKey);
          continue;
        }
      }
      
      // Check parent_keyword_id
      const parentRaw = (kw as any).parent_keyword_id;
      if (parentRaw !== undefined && parentRaw !== null) {
        const parentKey = String(parentRaw);
        if (parentKey && parentKey !== "0" && parentKey !== idKey && allIdKeys.has(parentKey)) {
          hasExplicitParent.set(idKey, parentKey);
          continue;
        }
      }
      
      // Check bubblefeed (if it's an ID, not a boolean)
      const bubbleRaw = kw.bubblefeed;
      if (bubbleRaw !== undefined && bubbleRaw !== null) {
        const bubbleKey = String(bubbleRaw);
        if (bubbleKey && bubbleKey !== "0" && bubbleKey !== "true" && bubbleKey !== "false" && bubbleKey !== idKey) {
          if (allIdKeys.has(bubbleKey)) {
            hasExplicitParent.set(idKey, bubbleKey);
            continue;
          }
        }
      }
    }
    
    console.log('[BRON Clustering] Checking explicit parent relationships:', {
      hasExplicitParents: hasExplicitParent.size,
      totalContentKeywords: contentKeywords.length,
      sampleMappings: Array.from(hasExplicitParent.entries()).slice(0, 5),
    });
    
    if (hasExplicitParent.size > 0) {
      // Use explicit parent relationships
      const parentChildMap = new Map<string, BronKeyword[]>();
      const assignedAsChild = new Set<string>();
      
      for (const kw of contentKeywords) {
        const idKey = String(kw.id);
        if (hasExplicitParent.has(idKey)) {
          const parentIdKey = hasExplicitParent.get(idKey)!;
          if (!parentChildMap.has(parentIdKey)) {
            parentChildMap.set(parentIdKey, []);
          }
          parentChildMap.get(parentIdKey)!.push(kw);
          assignedAsChild.add(idKey);
        }
      }
      
      // Create clusters from parents with their children (max 2 per cluster)
      for (const kw of contentKeywords) {
        const idKey = String(kw.id);
        if (!assignedAsChild.has(idKey)) {
          const children = (parentChildMap.get(idKey) || []).slice(0, 2);
          clusters.push({ parent: kw, children, parentId: kw.id });
        }
      }
    } else {
      // ============================================================
      // STRATEGY 3: Topic-based similarity clustering (fallback)
      // ============================================================
      console.log('[BRON Clustering] No API relationships found, using similarity-based clustering');
      
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
// - Inbound links: `link` field contains the URL of the keyword's page (on our domain)
// - Outbound links: Currently domain-level, not per-keyword filtered
export function filterLinksForKeyword(
  keyword: BronKeyword,
  linksIn: BronLink[],
  linksOut: BronLink[],
  selectedDomain?: string
): { keywordLinksIn: BronLink[]; keywordLinksOut: BronLink[] } {
  const keywordText = getKeywordDisplayText(keyword);
  const keywordUrl = keyword.linkouturl;

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/+$/, "");

  const safeDecode = (v: string) => {
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };

  const getUrlVariants = (raw?: string): string[] => {
    if (!raw) return [];
    const value = raw.trim();
    if (!value) return [];

    // If it's just a path ("/foo/bar"), treat it as pathname.
    if (value.startsWith('/')) {
      const path = value.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
      const last = path.split('/').filter(Boolean).pop();
      return Array.from(
        new Set(
          [
            normalize(path),
            normalize(safeDecode(path)),
            last ? normalize(`/${last}`) : null,
            last ? normalize(last) : null,
          ].filter(Boolean) as string[]
        )
      );
    }

    // Ensure URL parsing works when protocol is omitted.
    const maybeUrl = value.match(/^https?:\/\//i) ? value : `https://${value}`;
    try {
      const u = new URL(maybeUrl);
      const host = normalize(u.host);
      const pathname = (u.pathname || '/').replace(/\/+$/, '') || '/';
      const hostPath = normalize(`${host}${pathname}`);
      const decodedPath = safeDecode(pathname);
      const last = pathname.split('/').filter(Boolean).pop();

      return Array.from(
        new Set(
          [
            normalize(value.split('?')[0].split('#')[0]),
            hostPath,
            normalize(pathname),
            normalize(decodedPath),
            last ? normalize(`/${last}`) : null,
            last ? normalize(last) : null,
          ].filter(Boolean) as string[]
        )
      );
    } catch {
      // Fallback: strip query/hash and normalize.
      const stripped = value.split('?')[0].split('#')[0];
      return [normalize(stripped)];
    }
  };

  // Generate possible URL patterns for this keyword (normalized, protocol-less)
  const patternSet = new Set<string>();
  const addPatterns = (raw?: string) => {
    for (const v of getUrlVariants(raw)) patternSet.add(v);
  };

  // 1) Prefer the explicit linkouturl from the API.
  addPatterns(keywordUrl);

  // 2) Slug from keyword text (and a stop-word-reduced variant) as fallback.
  const slug = keywordText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slugNoStops = keywordText
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => !['in', 'near', 'me', 'for', 'the', 'a', 'an', 'of', 'to', 'and'].includes(w))
    .join(' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (selectedDomain) {
    addPatterns(`${selectedDomain}/${slug}`);
    addPatterns(`www.${selectedDomain}/${slug}`);
    if (slugNoStops && slugNoStops !== slug) {
      addPatterns(`${selectedDomain}/${slugNoStops}`);
      addPatterns(`www.${selectedDomain}/${slugNoStops}`);
    }
  }
  addPatterns(slug.length > 2 ? `/${slug}` : undefined);
  addPatterns(slugNoStops && slugNoStops.length > 2 ? `/${slugNoStops}` : undefined);
  addPatterns(slug.length > 5 ? slug : undefined);

  const patterns = Array.from(patternSet);

  const matchesKeywordUrl = (value?: string) => {
    if (!value) return false;
    const candidates = getUrlVariants(value);
    if (candidates.length === 0) return false;
    return candidates.some((cand) => {
      return patterns.some((p) => {
        // Allow both directions because some APIs return only path/slug, others return full host+path.
        return cand.includes(p) || p.includes(cand);
      });
    });
  };
  
  // Inbound links: BRON typically returns source_url (referrer) + target_url (our page)
  // We match against target_url first, but also try `link` as some payloads use that.
  const keywordLinksIn = linksIn.filter((link) => {
    return (
      matchesKeywordUrl(link.target_url) ||
      matchesKeywordUrl(link.link) ||
      // fallback (some responses may swap fields)
      matchesKeywordUrl(link.source_url)
    );
  });

  // Outbound links: we want links originating from this keyword page.
  // BRON usually uses source_url as our page + target_url/link as the external destination.
  const keywordLinksOut = linksOut.filter((link) => {
    return (
      matchesKeywordUrl(link.source_url) ||
      // fallback (some responses may swap fields)
      matchesKeywordUrl(link.target_url)
    );
  });
  
  return { keywordLinksIn, keywordLinksOut };
}
