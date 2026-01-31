import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscription Tier Structure:
 * 
 * - vi_basic ($15/mo per domain): ONLY Visitor Intelligence dashboard access
 * - business_ceo ($75/mo): VI + BRON + CADE (2 articles) + GMB + Social
 * - white_label ($499/mo): Everything + white-label branding + 40% off
 * - super_reseller ($1499/mo): Everything + API access + 60% off
 * 
 * Add-ons:
 * - Additional VI domains: $15/mo each
 * - AEO/GEO keywords: $2/keyword/mo (tied to BRON keyword count)
 * - On-Page SEO: Contact pricing
 * - PPC Landing Pages: Contact pricing
 */
export type SubscriptionTier = 'free' | 'vi_basic' | 'business_ceo' | 'white_label' | 'super_reseller';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  hasViAccess: boolean;
  hasBron: boolean;
  hasCade: boolean;
  hasAeoGeo: boolean;
  hasGmb: boolean;
  hasSocial: boolean;
  hasOnPageSeo: boolean;
  hasPpcPages: boolean;
  domainCount: number;
  keywordCount: number;
  articlesPerMonth: number;
  isWhiteLabel: boolean;
  isSuperReseller: boolean;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_STATUS: SubscriptionStatus = {
  tier: 'free',
  isActive: false,
  hasViAccess: true,
  hasBron: false,
  hasCade: false,
  hasAeoGeo: false,
  hasGmb: false,
  hasSocial: false,
  hasOnPageSeo: false,
  hasPpcPages: false,
  domainCount: 1,
  keywordCount: 0,
  articlesPerMonth: 0,
  isWhiteLabel: false,
  isSuperReseller: false,
  isLoading: true,
  error: null,
};

/**
 * Hook to check user's subscription status and feature access
 */
export function useSubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatus>(DEFAULT_STATUS);

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setStatus({ ...DEFAULT_STATUS, isLoading: false });
        return;
      }

      // Check for white label subscription
      const { data: whiteLabelSettings } = await supabase
        .from('white_label_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Check user roles for tier determination
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const userRoles = roles?.map(r => r.role) || [];
      const isWhiteLabelRole = userRoles.includes('white_label_admin');
      const isSuperAdmin = userRoles.includes('super_admin');

      // Determine subscription tier based on white_label_settings and roles
      let tier: SubscriptionTier = 'free';
      let isActive = false;

      if (whiteLabelSettings) {
        const subStatus = whiteLabelSettings.subscription_status;
        isActive = subStatus === 'active' || subStatus === 'trial';
        
        // Determine tier from subscription or role
        if (isSuperAdmin || subStatus === 'enterprise') {
          tier = 'super_reseller';
        } else if (isWhiteLabelRole || subStatus === 'white_label') {
          tier = 'white_label';
        } else if (isActive) {
          tier = 'business_ceo';
        }
      }

      // For demo/development purposes, grant access based on roles
      if (isSuperAdmin) {
        tier = 'super_reseller';
        isActive = true;
      } else if (userRoles.includes('admin')) {
        tier = 'business_ceo';
        isActive = true;
      }

      // Determine feature access based on tier
      // vi_basic ($15/domain) = Visitor Intelligence + Maps (GMB) access
      // business_ceo ($75/mo) = VI + Maps + BRON + CADE + Social
      // white_label/super_reseller = Everything
      
      const hasViAccess = true;
      
      // GMB/Maps is included with basic $15/domain tier
      const hasGmb = tier !== 'free';
      
      // BRON, CADE, Social require business_ceo or higher
      const hasBron = tier === 'business_ceo' || tier === 'white_label' || tier === 'super_reseller';
      const hasCade = tier === 'business_ceo' || tier === 'white_label' || tier === 'super_reseller';
      const hasSocial = tier === 'business_ceo' || tier === 'white_label' || tier === 'super_reseller';
      
      // AEO/GEO requires BRON (tied to keyword count)
      const hasAeoGeo = hasBron;
      
      // On-page SEO is a $99/mo add-on, PPC is white_label+
      // For now, grant access to white_label and super_reseller, and check for add-on purchase later
      const hasOnPageSeo = tier === 'white_label' || tier === 'super_reseller' || tier === 'business_ceo';
      const hasPpcPages = tier === 'white_label' || tier === 'super_reseller';

      // Calculate limits based on tier
      let domainCount = 1;
      let keywordCount = 0;
      let articlesPerMonth = 0;

      // Note: vi_basic tier would be set via Stripe webhook - currently only grants VI access
      if (tier === 'business_ceo') {
        keywordCount = 15;
        articlesPerMonth = 2;
      } else if (tier === 'white_label') {
        domainCount = 10;
        keywordCount = 50;
        articlesPerMonth = 10;
      } else if (tier === 'super_reseller') {
        domainCount = -1;
        keywordCount = -1;
        articlesPerMonth = -1;
      }

      setStatus({
        tier,
        isActive,
        hasViAccess,
        hasBron,
        hasCade,
        hasAeoGeo,
        hasGmb,
        hasSocial,
        hasOnPageSeo,
        hasPpcPages,
        domainCount,
        keywordCount,
        articlesPerMonth,
        isWhiteLabel: tier === 'white_label' || tier === 'super_reseller',
        isSuperReseller: tier === 'super_reseller',
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('[useSubscriptionStatus] Error:', error);
      setStatus({
        ...DEFAULT_STATUS,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check subscription',
      });
    }
  }, []);

  useEffect(() => {
    checkSubscription();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  return {
    ...status,
    refresh: checkSubscription,
  };
}

/**
 * Check if a specific feature is available
 */
export function useFeatureAccess(feature: 'bron' | 'cade' | 'aeo-geo' | 'gmb' | 'social-signals' | 'on-page-seo' | 'landing-pages' | 'vi-domain' | 'web-builder' | 'ai-assistant') {
  const status = useSubscriptionStatus();

  const hasAccess = (() => {
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
      case 'vi-domain':
        return status.domainCount > 1 || status.tier !== 'free';
      case 'web-builder':
        return false; // Requires subscription check via Stripe
      case 'ai-assistant':
        return true; // Everyone gets some free usage, gating happens in the hook
      default:
        return false;
    }
  })();

  return {
    hasAccess,
    isLoading: status.isLoading,
    tier: status.tier,
  };
}
