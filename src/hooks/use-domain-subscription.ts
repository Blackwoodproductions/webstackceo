import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { FeatureType } from '@/components/dashboard/FeatureUpgradePrompt';

/**
 * Domain-specific subscription status
 * Checks if a specific domain has access to a feature
 */
export interface DomainSubscriptionStatus {
  domain: string;
  isLoading: boolean;
  hasViAccess: boolean;
  hasBron: boolean;
  hasCade: boolean;
  hasAeoGeo: boolean;
  hasGmb: boolean;
  hasSocial: boolean;
  hasOnPageSeo: boolean;
  hasPpcPages: boolean;
  hasWebBuilder: boolean;
  error: string | null;
}

const DEFAULT_STATUS: Omit<DomainSubscriptionStatus, 'domain'> = {
  isLoading: false, // Default to false to prevent loading flash
  hasViAccess: true, // VI is always available for owned domains
  hasBron: false,
  hasCade: false,
  hasAeoGeo: false,
  hasGmb: false,
  hasSocial: false,
  hasOnPageSeo: false,
  hasPpcPages: false,
  hasWebBuilder: false,
  error: null,
};

// In-memory cache to prevent redundant fetches - longer TTL for performance
const domainSubCache = new Map<string, { status: DomainSubscriptionStatus; fetchedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache for better performance

// Pending fetch promises to dedupe concurrent requests
const pendingFetches = new Map<string, Promise<DomainSubscriptionStatus>>();

/**
 * Hook to check subscription status for a specific domain
 * Optimized with aggressive caching and request deduplication
 */
export function useDomainSubscription(domain: string | null | undefined) {
  // Initialize with cached value if available for instant render
  const initialStatus = useMemo(() => {
    if (!domain) return { ...DEFAULT_STATUS, domain: '' };
    const cached = domainSubCache.get(domain);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      return cached.status;
    }
    return { ...DEFAULT_STATUS, domain, isLoading: true };
  }, [domain]);

  const [status, setStatus] = useState<DomainSubscriptionStatus>(initialStatus);
  const lastCheckedDomainRef = useRef<string | null>(null);

  const checkDomainSubscription = useCallback(async (targetDomain: string) => {
    // Check cache first - instant return
    const cached = domainSubCache.get(targetDomain);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      setStatus(cached.status);
      return cached.status;
    }

    // Check if there's already a pending fetch for this domain
    const pending = pendingFetches.get(targetDomain);
    if (pending) {
      const result = await pending;
      setStatus(result);
      return result;
    }

    // Only show loading if not using cached data
    if (!cached) {
      setStatus(prev => ({ ...prev, domain: targetDomain, isLoading: true }));
    }

    // Create the fetch promise and store it
    const fetchPromise = (async (): Promise<DomainSubscriptionStatus> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          const noUserStatus: DomainSubscriptionStatus = {
            ...DEFAULT_STATUS,
            domain: targetDomain,
            isLoading: false,
          };
          return noUserStatus;
        }

        // Batch all queries into a single Promise.all for speed
        const [rolesResult, userDomainResult, whiteLabelResult] = await Promise.all([
          supabase.from('user_roles').select('role').eq('user_id', user.id),
          supabase.from('user_domains').select('*').eq('user_id', user.id).eq('domain', targetDomain).maybeSingle(),
          supabase.from('white_label_settings').select('subscription_status').eq('user_id', user.id).maybeSingle(),
        ]);

        const userRoles = rolesResult.data?.map(r => r.role) || [];
        const isSuperAdmin = userRoles.includes('super_admin');
        const isAdmin = userRoles.includes('admin');

        // Super admins and admins get full access to all domains
        if (isSuperAdmin || isAdmin) {
          const adminStatus: DomainSubscriptionStatus = {
            domain: targetDomain,
            isLoading: false,
            hasViAccess: true,
            hasBron: true,
            hasCade: true,
            hasAeoGeo: true,
            hasGmb: true,
            hasSocial: true,
            hasOnPageSeo: true,
            hasPpcPages: true,
            hasWebBuilder: true,
            error: null,
          };
          domainSubCache.set(targetDomain, { status: adminStatus, fetchedAt: Date.now() });
          return adminStatus;
        }

        const userDomain = userDomainResult.data;
        if (!userDomain) {
          const noAccessStatus: DomainSubscriptionStatus = {
            ...DEFAULT_STATUS,
            domain: targetDomain,
            isLoading: false,
            hasViAccess: false,
            error: 'Domain not found in your account',
          };
          return noAccessStatus;
        }

        const subStatus = whiteLabelResult.data?.subscription_status;
        const isActive = subStatus === 'active' || subStatus === 'trial' || subStatus === 'enterprise' || subStatus === 'white_label';
        
        const domainStatus: DomainSubscriptionStatus = {
          domain: targetDomain,
          isLoading: false,
          hasViAccess: true,
          hasGmb: isActive || userDomain.is_primary,
          hasBron: isActive,
          hasCade: isActive,
          hasAeoGeo: isActive,
          hasSocial: isActive,
          hasOnPageSeo: isActive && (subStatus === 'enterprise' || subStatus === 'white_label'),
          hasPpcPages: isActive && (subStatus === 'enterprise' || subStatus === 'white_label'),
          hasWebBuilder: isActive && (subStatus === 'enterprise' || subStatus === 'white_label'),
          error: null,
        };

        domainSubCache.set(targetDomain, { status: domainStatus, fetchedAt: Date.now() });
        return domainStatus;
      } catch (error) {
        console.error('[useDomainSubscription] Error:', error);
        return {
          ...DEFAULT_STATUS,
          domain: targetDomain,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to check subscription',
        };
      } finally {
        // Clean up pending fetch
        pendingFetches.delete(targetDomain);
      }
    })();

    pendingFetches.set(targetDomain, fetchPromise);
    const result = await fetchPromise;
    setStatus(result);
    return result;
  }, []);

  useEffect(() => {
    if (!domain) {
      setStatus({ ...DEFAULT_STATUS, domain: '', isLoading: false });
      return;
    }

    // Prevent redundant checks for same domain
    if (lastCheckedDomainRef.current === domain) {
      return;
    }
    lastCheckedDomainRef.current = domain;
    
    checkDomainSubscription(domain);
  }, [domain, checkDomainSubscription]);

  return {
    ...status,
    refresh: () => domain && checkDomainSubscription(domain),
  };
}

/**
 * Check if a specific feature is available for a domain
 */
export function useDomainFeatureAccess(feature: FeatureType, domain: string | null | undefined) {
  const status = useDomainSubscription(domain);

  const hasAccess = (() => {
    if (status.isLoading) return false;
    
    switch (feature) {
      case 'bron':
        return status.hasBron;
      case 'cade':
        return status.hasCade;
      case 'aeo-geo':
        return status.hasAeoGeo;
      case 'gmb':
        return status.hasGmb;
      case 'social-signals':
        return status.hasSocial;
      case 'on-page-seo':
        return status.hasOnPageSeo;
      case 'landing-pages':
        return status.hasPpcPages;
      case 'web-builder':
        return status.hasWebBuilder;
      case 'vi-domain':
        return status.hasViAccess;
      case 'ai-assistant':
        return true; // Everyone gets some free usage, gating happens in the AI hook
      default:
        return false;
    }
  })();

  return {
    hasAccess,
    isLoading: status.isLoading,
    error: status.error,
    domain: status.domain,
  };
}

/**
 * Clear the domain subscription cache (call on logout or domain change)
 */
export function clearDomainSubscriptionCache(domain?: string) {
  if (domain) {
    domainSubCache.delete(domain);
  } else {
    domainSubCache.clear();
  }
}
