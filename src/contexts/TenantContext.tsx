/**
 * Tenant Context
 * 
 * Centralized tenant state management with isolation enforcement.
 * Handles white-label branding and multi-tenant data access.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { TenantContext as TenantContextType, TenantBranding } from '@/services/types';

// ============================================================================
// Types
// ============================================================================

interface TenantState extends Omit<TenantContextType, 'userId'> {
  isLoading: boolean;
  isWhiteLabel: boolean;
  selectedDomain: string | null;
}

interface TenantContextValue extends TenantState {
  // Actions
  setSelectedDomain: (domain: string | null) => void;
  refreshBranding: () => Promise<void>;
  
  // Guards
  validateTenantAccess: (resourceTenantId: string) => boolean;
  getTenantHeaders: () => Record<string, string>;
}

const DEFAULT_BRANDING: TenantBranding = {
  logoUrl: null,
  companyName: 'Webstack.ceo',
  primaryColor: undefined,
  accentColor: undefined,
};

const DEFAULT_STATE: TenantState = {
  tenantId: '',
  tenantType: 'platform',
  branding: DEFAULT_BRANDING,
  parentTenantId: undefined,
  isLoading: true,
  isWhiteLabel: false,
  selectedDomain: null,
};

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  SELECTED_DOMAIN: 'vi_selected_domain',
  RECENT_DOMAINS: 'vi_recent_domains',
} as const;

// ============================================================================
// Context
// ============================================================================

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// ============================================================================
// Provider
// ============================================================================

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const { user } = useAuth();
  const [state, setState] = useState<TenantState>(DEFAULT_STATE);

  // Load selected domain from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_DOMAIN);
      if (stored) {
        setState(prev => ({ ...prev, selectedDomain: stored }));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Fetch tenant data
  const fetchTenantData = useCallback(async () => {
    if (!user?.id) {
      setState(prev => ({ ...prev, ...DEFAULT_STATE, isLoading: false }));
      return;
    }

    try {
      // Check for white-label settings
      const { data: whiteLabelData } = await supabase
        .from('white_label_settings')
        .select('id, logo_url, company_name, subscription_status, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      const isWhiteLabel = !!whiteLabelData && 
        (whiteLabelData.subscription_status === 'active' || 
         whiteLabelData.subscription_status === 'trial');

      const branding: TenantBranding = isWhiteLabel ? {
        logoUrl: whiteLabelData?.logo_url || null,
        companyName: whiteLabelData?.company_name || 'Webstack.ceo',
      } : DEFAULT_BRANDING;

      setState(prev => ({
        ...prev,
        tenantId: whiteLabelData?.id || user.id,
        tenantType: isWhiteLabel ? 'white_label' : 'platform',
        branding,
        isWhiteLabel,
        isLoading: false,
      }));
    } catch (error) {
      console.error('[TenantContext] Error fetching tenant data:', error);
      setState(prev => ({
        ...prev,
        tenantId: user?.id || '',
        tenantType: 'platform',
        branding: DEFAULT_BRANDING,
        isWhiteLabel: false,
        isLoading: false,
      }));
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTenantData();
  }, [fetchTenantData]);

  // Set selected domain
  const setSelectedDomain = useCallback((domain: string | null) => {
    setState(prev => ({ ...prev, selectedDomain: domain }));
    
    if (domain) {
      try {
        localStorage.setItem(STORAGE_KEYS.SELECTED_DOMAIN, domain);
        
        // Update recent domains list
        const recentRaw = localStorage.getItem(STORAGE_KEYS.RECENT_DOMAINS);
        let recent: string[] = [];
        try {
          recent = recentRaw ? JSON.parse(recentRaw) : [];
        } catch {
          recent = [];
        }
        
        // Add to front, remove duplicates, keep max 5
        recent = [domain, ...recent.filter(d => d !== domain)].slice(0, 5);
        localStorage.setItem(STORAGE_KEYS.RECENT_DOMAINS, JSON.stringify(recent));
      } catch {
        // Ignore storage errors
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_DOMAIN);
      } catch {
        // Ignore
      }
    }
  }, []);

  // Refresh branding
  const refreshBranding = useCallback(async () => {
    await fetchTenantData();
  }, [fetchTenantData]);

  // Validate tenant access (prevents cross-tenant data access)
  const validateTenantAccess = useCallback((resourceTenantId: string): boolean => {
    // Platform users can only access their own tenant
    if (state.tenantType === 'platform') {
      return resourceTenantId === state.tenantId;
    }
    
    // White-label can access their own and child tenants
    if (state.tenantType === 'white_label') {
      // TODO: Check child tenant hierarchy
      return resourceTenantId === state.tenantId;
    }
    
    // Clients can only access their own data
    if (state.tenantType === 'client') {
      return resourceTenantId === state.tenantId;
    }
    
    return false;
  }, [state.tenantId, state.tenantType]);

  // Get headers for tenant-scoped API requests
  const getTenantHeaders = useCallback((): Record<string, string> => {
    return {
      'X-Tenant-Id': state.tenantId,
      'X-Selected-Domain': state.selectedDomain || '',
    };
  }, [state.tenantId, state.selectedDomain]);

  const value: TenantContextValue = {
    ...state,
    setSelectedDomain,
    refreshBranding,
    validateTenantAccess,
    getTenantHeaders,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to get tenant-specific branding
 */
export function useTenantBranding() {
  const { branding, isWhiteLabel, isLoading } = useTenant();
  return { branding, isWhiteLabel, isLoading };
}

/**
 * Hook to get the current selected domain
 */
export function useSelectedDomain() {
  const { selectedDomain, setSelectedDomain } = useTenant();
  return { selectedDomain, setSelectedDomain };
}

/**
 * Hook for tenant-scoped data access validation
 */
export function useTenantGuard() {
  const { validateTenantAccess, getTenantHeaders, tenantId } = useTenant();
  
  return {
    tenantId,
    validateAccess: validateTenantAccess,
    getHeaders: getTenantHeaders,
  };
}

export default TenantContext;
