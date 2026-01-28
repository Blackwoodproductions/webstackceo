import type { KeywordMetrics } from "@/components/marketing/bron";

const KEYWORD_METRICS_CACHE_KEY = "bron_keyword_metrics_cache_v1";
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHED_DOMAINS = 10;
const MAX_TERMS_PER_DOMAIN = 250;

type DomainMetricsEntry = {
  metricsByCore: Record<string, KeywordMetrics>;
  cachedAt: number;
};

type MetricsCache = Record<string, DomainMetricsEntry>;

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadAll(): MetricsCache {
  const parsed = safeParse<MetricsCache>(localStorage.getItem(KEYWORD_METRICS_CACHE_KEY));
  if (!parsed) return {};
  const now = Date.now();

  // Drop expired domains
  const next: MetricsCache = {};
  for (const [domain, entry] of Object.entries(parsed)) {
    if (!entry?.cachedAt) continue;
    if (now - entry.cachedAt > CACHE_MAX_AGE) continue;
    next[domain] = entry;
  }
  return next;
}

function saveAll(cache: MetricsCache) {
  localStorage.setItem(KEYWORD_METRICS_CACHE_KEY, JSON.stringify(cache));
}

export function loadKeywordMetricsCache(domain: string): Record<string, KeywordMetrics> {
  try {
    return loadAll()[domain]?.metricsByCore ?? {};
  } catch {
    return {};
  }
}

export function mergeAndSaveKeywordMetricsCache(
  domain: string,
  incoming: Record<string, KeywordMetrics>
) {
  try {
    const cache = loadAll();
    const current = cache[domain]?.metricsByCore ?? {};
    const merged = { ...current, ...incoming };

    // Keep cache bounded to avoid localStorage bloat.
    const keys = Object.keys(merged);
    if (keys.length > MAX_TERMS_PER_DOMAIN) {
      const trimmed: Record<string, KeywordMetrics> = {};
      for (const k of keys.slice(0, MAX_TERMS_PER_DOMAIN)) trimmed[k] = merged[k];
      cache[domain] = { metricsByCore: trimmed, cachedAt: Date.now() };
    } else {
      cache[domain] = { metricsByCore: merged, cachedAt: Date.now() };
    }

    // Evict oldest domains if needed.
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
