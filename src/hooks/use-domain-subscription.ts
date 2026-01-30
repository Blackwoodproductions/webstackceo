import { useState, useEffect, useCallback, useRef } from 'react';
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
  isLoading: true,
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

// In-memory cache to prevent redundant fetches
const domainSubCache = new Map<string, { status: DomainSubscriptionStatus; fetchedAt: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

/**
 * Hook to check subscription status for a specific domain
 */
export function useDomainSubscription(domain: string | null | undefined) {
  const [status, setStatus] = useState<DomainSubscriptionStatus>({
    ...DEFAULT_STATUS,
    domain: domain || '',
  });
  
  const lastCheckedDomainRef = useRef<string | null>(null);

  const checkDomainSubscription = useCallback(async (targetDomain: string) => {
    // Check cache first
    const cached = domainSubCache.get(targetDomain);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      setStatus(cached.status);
      return;
    }

    setStatus(prev => ({ ...prev, domain: targetDomain, isLoading: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        const noUserStatus: DomainSubscriptionStatus = {
          ...DEFAULT_STATUS,
          domain: targetDomain,
          isLoading: false,
        };
        setStatus(noUserStatus);
        return;
      }

      // Check user roles for tier determination
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const userRoles = roles?.map(r => r.role) || [];
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
        setStatus(adminStatus);
        return;
      }

      // Check if user owns this domain
      const { data: userDomain } = await supabase
        .from('user_domains')
        .select('*')
        .eq('user_id', user.id)
        .eq('domain', targetDomain)
        .maybeSingle();

      if (!userDomain) {
        // User doesn't own this domain
        const noAccessStatus: DomainSubscriptionStatus = {
          ...DEFAULT_STATUS,
          domain: targetDomain,
          isLoading: false,
          hasViAccess: false,
          error: 'Domain not found in your account',
        };
        setStatus(noAccessStatus);
        return;
      }

      // Check white label settings for subscription tier
      const { data: whiteLabelSettings } = await supabase
        .from('white_label_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Determine access based on subscription status
      const subStatus = whiteLabelSettings?.subscription_status;
      const isActive = subStatus === 'active' || subStatus === 'trial' || subStatus === 'enterprise' || subStatus === 'white_label';
      
      // Base tier: VI is free for owned domains
      // GMB/Maps included with basic $15/domain tier
      // Other features require business_ceo ($75) or higher
      
      const domainStatus: DomainSubscriptionStatus = {
        domain: targetDomain,
        isLoading: false,
        hasViAccess: true,
        hasGmb: isActive || userDomain.is_primary, // GMB included with primary domain or active sub
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
      setStatus(domainStatus);
    } catch (error) {
      console.error('[useDomainSubscription] Error:', error);
      setStatus({
        ...DEFAULT_STATUS,
        domain: targetDomain,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check subscription',
      });
    }
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
