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

  // Remove a user domain
  const removeUserDomain = useCallback((domain: string) => {
    setUserAddedDomains(userAddedDomains.filter(d => d !== domain));
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
