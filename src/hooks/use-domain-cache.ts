import { useState, useEffect, useCallback, useRef } from 'react';

// Cache configuration
const CACHE_PREFIX = 'domain_cache_';
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hash?: string;
}

interface DomainCacheState {
  trackedDomains: string[];
  userAddedDomains: string[];
  gscSites: { siteUrl: string; permissionLevel: string }[];
  selectedDomainKey: string;
  selectedTrackedDomain: string;
}

// Utility functions for cache management
function getCacheKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

function getCache<T>(key: string): CacheEntry<T> | null {
  try {
    const cached = localStorage.getItem(getCacheKey(key));
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    const age = Date.now() - entry.timestamp;
    
    // Return null if cache is expired
    if (age > CACHE_MAX_AGE) {
      localStorage.removeItem(getCacheKey(key));
      return null;
    }
    
    return entry;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T, hash?: string): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hash,
    };
    localStorage.setItem(getCacheKey(key), JSON.stringify(entry));
  } catch (error) {
    console.warn('Failed to set cache:', error);
  }
}

function clearCache(key: string): void {
  try {
    localStorage.removeItem(getCacheKey(key));
  } catch {
    // Ignore errors
  }
}

// Simple hash function for change detection
function hashArray(arr: string[]): string {
  return arr.sort().join('|');
}

function hashGscSites(sites: { siteUrl: string; permissionLevel: string }[]): string {
  return sites.map(s => `${s.siteUrl}:${s.permissionLevel}`).sort().join('|');
}

export function useDomainCache() {
  // Initialize state from cache
  const [trackedDomains, setTrackedDomainsState] = useState<string[]>(() => {
    const cached = getCache<string[]>('tracked_domains');
    return cached?.data || [];
  });

  const [userAddedDomains, setUserAddedDomainsState] = useState<string[]>(() => {
    // Legacy key support + new cache
    const legacyStored = localStorage.getItem('vi_user_added_domains');
    if (legacyStored) {
      const domains = JSON.parse(legacyStored);
      // Migrate to new cache system
      setCache('user_added_domains', domains, hashArray(domains));
      return domains;
    }
    const cached = getCache<string[]>('user_added_domains');
    return cached?.data || [];
  });

  const [gscSites, setGscSitesState] = useState<{ siteUrl: string; permissionLevel: string }[]>(() => {
    const cached = getCache<{ siteUrl: string; permissionLevel: string }[]>('gsc_sites');
    return cached?.data || [];
  });

  const [selectedDomainKey, setSelectedDomainKeyState] = useState<string>(() => {
    const cached = getCache<string>('selected_domain_key');
    return cached?.data || '';
  });

  const [selectedTrackedDomain, setSelectedTrackedDomainState] = useState<string>(() => {
    const cached = getCache<string>('selected_tracked_domain');
    return cached?.data || '';
  });

  // Loading states
  const [isLoadingTracked, setIsLoadingTracked] = useState(false);
  const [isLoadingGsc, setIsLoadingGsc] = useState(false);

  // Refs for background refresh tracking
  const lastTrackedHashRef = useRef<string>('');
  const lastGscHashRef = useRef<string>('');

  // Set tracked domains with caching
  const setTrackedDomains = useCallback((domains: string[]) => {
    const hash = hashArray(domains);
    
    // Only update if data changed
    if (hash !== lastTrackedHashRef.current) {
      lastTrackedHashRef.current = hash;
      setTrackedDomainsState(domains);
      setCache('tracked_domains', domains, hash);
    }
  }, []);

  // Set user-added domains with caching
  const setUserAddedDomains = useCallback((domains: string[]) => {
    const hash = hashArray(domains);
    setUserAddedDomainsState(domains);
    setCache('user_added_domains', domains, hash);
    // Also update legacy key for backwards compatibility
    localStorage.setItem('vi_user_added_domains', JSON.stringify(domains));
  }, []);

  // Set GSC sites with caching
  const setGscSites = useCallback((sites: { siteUrl: string; permissionLevel: string }[]) => {
    const hash = hashGscSites(sites);
    
    // Only update if data changed
    if (hash !== lastGscHashRef.current) {
      lastGscHashRef.current = hash;
      setGscSitesState(sites);
      setCache('gsc_sites', sites, hash);
    }
  }, []);

  // Set selected domain key with caching
  const setSelectedDomainKey = useCallback((domain: string) => {
    setSelectedDomainKeyState(domain);
    setCache('selected_domain_key', domain);
  }, []);

  // Set selected tracked domain with caching
  const setSelectedTrackedDomain = useCallback((domain: string) => {
    setSelectedTrackedDomainState(domain);
    setCache('selected_tracked_domain', domain);
  }, []);

  // Add a user domain
  const addUserDomain = useCallback((domain: string) => {
    setUserAddedDomains([...userAddedDomains.filter(d => d !== domain), domain]);
  }, [userAddedDomains, setUserAddedDomains]);

  // Remove a user domain and ALL its cached data (BRON, screenshots, etc.)
  const removeUserDomain = useCallback((domain: string) => {
    const normalizedDomain = domain
      .toLowerCase()
      .trim()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0];
    
    console.log(`[Domain Cache] Removing domain and all cached data: ${normalizedDomain}`);
    
    // Remove from user-added domains list
    setUserAddedDomains(userAddedDomains.filter(d => {
      const normalized = d.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      return normalized !== normalizedDomain;
    }));
    
    // Clear all BRON-related caches for this domain
    const bronCacheKeys = [
      `bron_keywords_cache_v2_${normalizedDomain}`,
      `bron_domain_details_cache`,
      `bron_pages_cache`,
      `bron_serp_cache`,
      `bron_links_cache`,
      `bron_subscription_cache`,
    ];
    
    // Clear per-domain V2 keyword cache
    try {
      localStorage.removeItem(`bron_keywords_cache_v2_${normalizedDomain}`);
      console.log(`[Domain Cache] Cleared keywords cache for ${normalizedDomain}`);
    } catch {}
    
    // Clear domain from aggregated caches (domain details, pages, serp, links, subscription)
    const aggregatedCacheKeys = [
      'bron_domain_details_cache',
      'bron_pages_cache', 
      'bron_serp_cache',
      'bron_links_cache',
      'bron_subscription_cache',
    ];
    
    for (const key of aggregatedCacheKeys) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object' && parsed[normalizedDomain]) {
            delete parsed[normalizedDomain];
            localStorage.setItem(key, JSON.stringify(parsed));
            console.log(`[Domain Cache] Removed ${normalizedDomain} from ${key}`);
          }
        }
      } catch {}
    }
    
    // Clear keyword V2 index entry
    try {
      const indexRaw = localStorage.getItem('bron_keywords_cache_v2_index');
      if (indexRaw) {
        const index = JSON.parse(indexRaw);
        if (index && index[normalizedDomain]) {
          delete index[normalizedDomain];
          localStorage.setItem('bron_keywords_cache_v2_index', JSON.stringify(index));
          console.log(`[Domain Cache] Removed ${normalizedDomain} from keyword index`);
        }
      }
    } catch {}
    
    // Clear keyword metrics cache
    try {
      const metricsRaw = localStorage.getItem('bron_keyword_metrics_cache_v1');
      if (metricsRaw) {
        const metrics = JSON.parse(metricsRaw);
        if (metrics && metrics[normalizedDomain]) {
          delete metrics[normalizedDomain];
          localStorage.setItem('bron_keyword_metrics_cache_v1', JSON.stringify(metrics));
          console.log(`[Domain Cache] Removed ${normalizedDomain} from keyword metrics cache`);
        }
      }
    } catch {}
    
    // Clear screenshot cache for this domain
    try {
      const screenshotCacheRaw = localStorage.getItem('website_screenshot_cache');
      if (screenshotCacheRaw) {
        const screenshotCache = JSON.parse(screenshotCacheRaw);
        if (screenshotCache) {
          // Find and remove entries matching this domain
          const keysToRemove = Object.keys(screenshotCache).filter(k => 
            k.toLowerCase().includes(normalizedDomain)
          );
          for (const key of keysToRemove) {
            delete screenshotCache[key];
          }
          localStorage.setItem('website_screenshot_cache', JSON.stringify(screenshotCache));
          if (keysToRemove.length > 0) {
            console.log(`[Domain Cache] Removed ${keysToRemove.length} screenshot cache entries for ${normalizedDomain}`);
          }
        }
      }
    } catch {}
    
    // Clear map cache for this domain
    try {
      const mapCacheRaw = localStorage.getItem('bron_map_cache');
      if (mapCacheRaw) {
        const mapCache = JSON.parse(mapCacheRaw);
        if (mapCache) {
          const keysToRemove = Object.keys(mapCache).filter(k => 
            k.toLowerCase().includes(normalizedDomain)
          );
          for (const key of keysToRemove) {
            delete mapCache[key];
          }
          localStorage.setItem('bron_map_cache', JSON.stringify(mapCache));
          if (keysToRemove.length > 0) {
            console.log(`[Domain Cache] Removed ${keysToRemove.length} map cache entries for ${normalizedDomain}`);
          }
        }
      }
    } catch {}
    
    console.log(`[Domain Cache] Completed removal of all cached data for ${normalizedDomain}`);
  }, [userAddedDomains, setUserAddedDomains]);

  // Check if cache is fresh (not expired)
  const isCacheFresh = useCallback((key: string): boolean => {
    const cached = getCache(key);
    return cached !== null;
  }, []);

  // Force refresh (invalidate cache)
  const invalidateCache = useCallback((key?: string) => {
    if (key) {
      clearCache(key);
    } else {
      // Clear all domain-related caches
      clearCache('tracked_domains');
      clearCache('gsc_sites');
      // Don't clear user_added_domains or selected domains - those should persist
    }
  }, []);

  // Get all unique domains (tracked + user-added)
  const allDomains = [...new Set([...trackedDomains, ...userAddedDomains])];

  return {
    // State
    trackedDomains,
    userAddedDomains,
    gscSites,
    selectedDomainKey,
    selectedTrackedDomain,
    allDomains,
    
    // Loading states
    isLoadingTracked,
    isLoadingGsc,
    
    // Setters with caching
    setTrackedDomains,
    setUserAddedDomains,
    setGscSites,
    setSelectedDomainKey,
    setSelectedTrackedDomain,
    
    // Helpers
    addUserDomain,
    removeUserDomain,
    isCacheFresh,
    invalidateCache,
    
    // For background refresh logic
    setIsLoadingTracked,
    setIsLoadingGsc,
  };
}

// Export cache utilities for use in other hooks
export { getCache, setCache, clearCache, CACHE_MAX_AGE };
