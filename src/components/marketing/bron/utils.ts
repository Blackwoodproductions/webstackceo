import { BronKeyword, BronSerpReport } from "@/hooks/use-bron-api";
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

  const isSupporting = (kw: BronKeyword) =>
    kw.is_supporting === true ||
    kw.is_supporting === 1 ||
    kw.bubblefeed === true ||
    kw.bubblefeed === 1;

  const normalizeRelId = (v: unknown): string | null => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (!s || s === '0' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return null;
    return s;
  };

  // Prefer API-driven clustering when available:
  // 1) cluster_id groups (common for BRON/SEOM packages)
  // 2) parent_keyword_id hierarchy
  const clusterMap = new Map<string, BronKeyword[]>();
  for (const kw of contentKeywords) {
    const cid = normalizeRelId((kw as any).cluster_id);
    if (cid) {
      if (!clusterMap.has(cid)) clusterMap.set(cid, []);
      clusterMap.get(cid)!.push(kw);
    }
  }

  const hasClusterIds = clusterMap.size > 0;

  // Build parent map (works even when cluster_id is missing)
  const parentChildMap = new Map<string, BronKeyword[]>();
  const assignedAsChild = new Set<string>();
  for (const kw of contentKeywords) {
    const pid = normalizeRelId((kw as any).parent_keyword_id);
    if (!pid) continue;
    if (!parentChildMap.has(pid)) parentChildMap.set(pid, []);
    parentChildMap.get(pid)!.push(kw);
    assignedAsChild.add(String(kw.id));
  }

  const assigned = new Set<string>();

  // If the API provides *any* clustering signals (cluster_id or parent_keyword_id), use them.
  // Otherwise, fall back to similarity clustering.
  if (hasClusterIds || parentChildMap.size > 0) {
    if (hasClusterIds) {
      // Cluster by cluster_id first.
      for (const [, members] of clusterMap) {
        const sorted = [...members].sort((a, b) => getKeywordDisplayText(a).localeCompare(getKeywordDisplayText(b)));

        const parent = sorted.find((k) => !isSupporting(k)) || sorted[0];

        const children = sorted
          .filter((k) => String(k.id) !== String(parent.id))
          .filter((k) => isSupporting(k) || !sorted.some((x) => isSupporting(x)))
          .slice(0, 2);

        clusters.push({ parent, children, parentId: parent.id });
        assigned.add(String(parent.id));
        for (const c of children) assigned.add(String(c.id));
      }
    }

    // Attach parent_keyword_id children for any remaining unassigned keywords.
    // (This also handles packages that only send parent_keyword_id but no cluster_id.)
    for (const kw of contentKeywords) {
      const id = String(kw.id);
      if (assigned.has(id)) continue;
      if (assignedAsChild.has(id)) continue;

      const children = (parentChildMap.get(id) || [])
        .filter((c) => !assigned.has(String(c.id)))
        .sort((a, b) => getKeywordDisplayText(a).localeCompare(getKeywordDisplayText(b)))
        .slice(0, 2);

      clusters.push({ parent: kw, children, parentId: kw.id });
      assigned.add(id);
      for (const c of children) assigned.add(String(c.id));
    }

    // Any leftover content keywords (not in a cluster_id group and not attached via parent_keyword_id)
    for (const kw of contentKeywords) {
      const id = String(kw.id);
      if (assigned.has(id)) continue;
      clusters.push({ parent: kw, children: [], parentId: kw.id });
      assigned.add(id);
    }
  } else {
    // Topic-based similarity clustering
    const keywordsWithLength = contentKeywords.map(kw => ({
      kw,
      text: getKeywordDisplayText(kw),
      wordCount: getKeywordDisplayText(kw).split(/\s+/).length
    }));

    keywordsWithLength.sort((a, b) => a.wordCount - b.wordCount || a.text.localeCompare(b.text));

    const assignedSim = new Set<string>();
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
        .filter(s => !assignedSim.has(String(s.id)))
        .map(s => ({
          kw: s,
          score: calculateKeywordSimilarity(mainText, getKeywordDisplayText(s))
        }))
        .sort((a, b) => b.score - a.score);

      const children: BronKeyword[] = [];
      for (let i = 0; i < Math.min(2, scored.length); i++) {
        if (scored[i].score >= 0.3) {
          children.push(scored[i].kw);
          assignedSim.add(String(scored[i].kw.id));
        }
      }

      clusters.push({ parent: main, children, parentId: main.id });
      assignedSim.add(String(main.id));
    }

    for (const s of supportingPool) {
      if (!assignedSim.has(String(s.id))) {
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
