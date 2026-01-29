/**
 * Persistent Cache System
 * 
 * Provides localStorage-backed caching with change detection.
 * Data is loaded synchronously on app start and only updated when API returns different data.
 */

// ─── Cache Configuration ───
export const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
export const SCREENSHOT_CACHE_KEY = 'persistent_screenshot_cache';
export const MAP_CACHE_KEY = 'persistent_map_cache';
export const GMB_PERSISTENT_CACHE_KEY = 'persistent_gmb_cache';

// ─── Types ───
interface CacheEntry<T> {
  data: T;
  hash: string;
  cachedAt: number;
}

type DomainCache<T> = Record<string, CacheEntry<T>>;

// ─── Hash Generation ───
// Simple djb2 hash for change detection
function generateHash(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// ─── Generic Cache Operations ───
function loadCache<T>(cacheKey: string, domain: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    
    const cache = JSON.parse(raw) as DomainCache<T>;
    const entry = cache[domain];
    
    if (!entry) return null;
    
    // Check expiry
    if (Date.now() - entry.cachedAt > CACHE_MAX_AGE) {
      console.log(`[PersistentCache] ${cacheKey} expired for ${domain}`);
      return null;
    }
    
    return entry;
  } catch (e) {
    console.warn(`[PersistentCache] Failed to load ${cacheKey}:`, e);
    return null;
  }
}

function saveCache<T>(cacheKey: string, domain: string, data: T, maxEntries = 20): boolean {
  try {
    const raw = localStorage.getItem(cacheKey);
    const cache: DomainCache<T> = raw ? JSON.parse(raw) : {};
    
    const newHash = generateHash(data);
    const existing = cache[domain];
    
    // Check if data actually changed
    if (existing && existing.hash === newHash) {
      console.log(`[PersistentCache] ${cacheKey} unchanged for ${domain}, skipping save`);
      return false; // No change
    }
    
    // Add new entry
    cache[domain] = {
      data,
      hash: newHash,
      cachedAt: Date.now(),
    };
    
    // Prune old entries if over limit
    const entries = Object.entries(cache);
    if (entries.length > maxEntries) {
      entries.sort((a, b) => b[1].cachedAt - a[1].cachedAt);
      const pruned: DomainCache<T> = {};
      for (const [key, val] of entries.slice(0, maxEntries)) {
        pruned[key] = val;
      }
      localStorage.setItem(cacheKey, JSON.stringify(pruned));
    } else {
      localStorage.setItem(cacheKey, JSON.stringify(cache));
    }
    
    console.log(`[PersistentCache] Saved ${cacheKey} for ${domain}`);
    return true; // Data changed
  } catch (e) {
    console.warn(`[PersistentCache] Failed to save ${cacheKey}:`, e);
    return false;
  }
}

function hasDataChanged<T>(cacheKey: string, domain: string, newData: T): boolean {
  const existing = loadCache<T>(cacheKey, domain);
  if (!existing) return true;
  return existing.hash !== generateHash(newData);
}

// ─── Screenshot Cache ───
export interface ScreenshotCacheData {
  url: string;
  domain: string;
}

export function loadCachedScreenshot(domain: string): string | null {
  const entry = loadCache<ScreenshotCacheData>(SCREENSHOT_CACHE_KEY, domain);
  return entry?.data.url || null;
}

export function saveCachedScreenshot(domain: string, url: string): boolean {
  return saveCache(SCREENSHOT_CACHE_KEY, domain, { url, domain }, 30);
}

export function hasScreenshotChanged(domain: string, newUrl: string): boolean {
  return hasDataChanged(SCREENSHOT_CACHE_KEY, domain, { url: newUrl, domain });
}

// ─── Map Embed Cache ───
export interface MapCacheData {
  embedUrl: string;
  address: string;
}

export function loadCachedMapEmbed(domain: string): MapCacheData | null {
  const entry = loadCache<MapCacheData>(MAP_CACHE_KEY, domain);
  return entry?.data || null;
}

export function saveCachedMapEmbed(domain: string, embedUrl: string, address: string): boolean {
  return saveCache(MAP_CACHE_KEY, domain, { embedUrl, address }, 30);
}

// ─── GMB Persistent Cache ───
export interface GmbPersistentCacheData {
  accounts: Array<{ name: string; accountName: string; type: string }>;
  locations: Array<{
    name: string;
    title: string;
    websiteUri?: string;
    phoneNumbers?: { primaryPhone?: string };
    storefrontAddress?: {
      locality?: string;
      administrativeArea?: string;
      postalCode?: string;
      addressLines?: string[];
    };
    regularHours?: {
      periods: Array<{
        openDay: string;
        openTime: { hours: number; minutes?: number };
        closeDay: string;
        closeTime: { hours: number; minutes?: number };
      }>;
    };
    categories?: {
      primaryCategory?: { displayName?: string };
      additionalCategories?: Array<{ displayName?: string }>;
    };
    reviews?: unknown[];
    averageRating?: number;
    totalReviewCount?: number;
  }>;
  matchingLocationName?: string;
}

export function loadCachedGmbPersistent(domain: string): GmbPersistentCacheData | null {
  const entry = loadCache<GmbPersistentCacheData>(GMB_PERSISTENT_CACHE_KEY, domain);
  return entry?.data || null;
}

export function saveCachedGmbPersistent(domain: string, data: GmbPersistentCacheData): boolean {
  return saveCache(GMB_PERSISTENT_CACHE_KEY, domain, data, 15);
}

export function hasGmbDataChanged(domain: string, newData: GmbPersistentCacheData): boolean {
  return hasDataChanged(GMB_PERSISTENT_CACHE_KEY, domain, newData);
}

// ─── Domain Info Cache (for BRON domain details) ───
export const DOMAIN_INFO_CACHE_KEY = 'persistent_domain_info_cache';

export interface DomainInfoCacheData {
  id?: number;
  domain: string;
  website?: string;
  wr_logo?: string;
  wr_title?: string;
  wr_description?: string;
  wr_address?: string;
  wr_phone?: string;
  wr_email?: string;
  wr_facebook?: string;
  wr_linkedin?: string;
  wr_instagram?: string;
  wr_twitter?: string;
  wr_video?: string;
  [key: string]: unknown;
}

export function loadCachedDomainInfo(domain: string): DomainInfoCacheData | null {
  const entry = loadCache<DomainInfoCacheData>(DOMAIN_INFO_CACHE_KEY, domain);
  return entry?.data || null;
}

export function saveCachedDomainInfo(domain: string, data: DomainInfoCacheData): boolean {
  return saveCache(DOMAIN_INFO_CACHE_KEY, domain, data, 25);
}

export function hasDomainInfoChanged(domain: string, newData: DomainInfoCacheData): boolean {
  return hasDataChanged(DOMAIN_INFO_CACHE_KEY, domain, newData);
}

// ─── Clear all caches for a domain ───
export function clearDomainCache(domain: string): void {
  const cacheKeys = [
    SCREENSHOT_CACHE_KEY,
    MAP_CACHE_KEY,
    GMB_PERSISTENT_CACHE_KEY,
    DOMAIN_INFO_CACHE_KEY,
  ];
  
  for (const key of cacheKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      
      const cache = JSON.parse(raw);
      if (cache[domain]) {
        delete cache[domain];
        localStorage.setItem(key, JSON.stringify(cache));
        console.log(`[PersistentCache] Cleared ${key} for ${domain}`);
      }
    } catch {
      // Ignore
    }
  }
}
