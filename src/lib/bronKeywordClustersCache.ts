const KEYWORD_CLUSTERS_CACHE_KEY = "bron_keyword_clusters_cache_v1";
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHED_DOMAINS = 25;

export type KeywordClusterIndex = Array<{
  parentId: string | number;
  childIds: Array<string | number>;
}>;

type CacheEntry = {
  keywordIdsSignature: string;
  clusters: KeywordClusterIndex;
  cachedAt: number;
};

type CacheMap = Record<string, CacheEntry>;

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadAll(): CacheMap {
  const parsed = safeParse<CacheMap>(localStorage.getItem(KEYWORD_CLUSTERS_CACHE_KEY));
  if (!parsed) return {};
  const now = Date.now();

  const next: CacheMap = {};
  for (const [domain, entry] of Object.entries(parsed)) {
    if (!entry?.cachedAt) continue;
    if (now - entry.cachedAt > CACHE_MAX_AGE) continue;
    next[domain] = entry;
  }
  return next;
}

function saveAll(cache: CacheMap) {
  localStorage.setItem(KEYWORD_CLUSTERS_CACHE_KEY, JSON.stringify(cache));
}

export function loadKeywordClustersIndexCache(
  domain: string,
  keywordIdsSignature: string
): KeywordClusterIndex | null {
  try {
    const cache = loadAll();
    const entry = cache[domain];
    if (!entry) return null;
    if (entry.keywordIdsSignature !== keywordIdsSignature) return null;
    return entry.clusters ?? null;
  } catch {
    return null;
  }
}

export function saveKeywordClustersIndexCache(
  domain: string,
  keywordIdsSignature: string,
  clusters: KeywordClusterIndex
) {
  try {
    const cache = loadAll();
    cache[domain] = { keywordIdsSignature, clusters, cachedAt: Date.now() };

    const domains = Object.keys(cache);
    if (domains.length > MAX_CACHED_DOMAINS) {
      const oldest = domains
        .sort((a, b) => (cache[a]?.cachedAt ?? 0) - (cache[b]?.cachedAt ?? 0))
        .slice(0, domains.length - MAX_CACHED_DOMAINS);
      for (const d of oldest) delete cache[d];
    }

    saveAll(cache);
  } catch {
    // localStorage may fail in private mode / quota
  }
}
