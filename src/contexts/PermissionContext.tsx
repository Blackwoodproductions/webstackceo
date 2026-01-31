/**
 * Permission Context
 * 
 * Centralized role-based access control (RBAC) with scope-based permissions.
 * Enforces tenant isolation and prevents cross-tenant data access.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { UserRole, FeatureScope, UserPermissions } from '@/services/types';

// ============================================================================
// Permission Mapping
// ============================================================================

/**
 * Maps roles to their allowed feature scopes
 */
const ROLE_SCOPES: Record<UserRole, FeatureScope[]> = {
  super_admin: [
    'visitor_intelligence', 'bron', 'cade', 'aeo_geo', 'gmb', 'social_signals',
    'on_page_seo', 'ppc_landing_pages', 'web_builder', 'ai_assistant', 'analytics',
    'white_label_settings', 'user_management', 'api_access',
  ],
  admin: [
    'visitor_intelligence', 'bron', 'cade', 'aeo_geo', 'gmb', 'social_signals',
    'on_page_seo', 'ppc_landing_pages', 'web_builder', 'ai_assistant', 'analytics',
    'user_management',
  ],
  white_label_owner: [
    'visitor_intelligence', 'bron', 'cade', 'aeo_geo', 'gmb', 'social_signals',
    'on_page_seo', 'ppc_landing_pages', 'web_builder', 'ai_assistant', 'analytics',
    'white_label_settings', 'user_management',
  ],
  white_label_client: [
    'visitor_intelligence', 'bron', 'cade', 'aeo_geo', 'gmb', 'social_signals',
    'on_page_seo', 'ai_assistant', 'analytics',
  ],
  affiliate: [
    'visitor_intelligence', 'analytics',
  ],
  user: [
    'visitor_intelligence', 'gmb', 'ai_assistant',
  ],
};

/**
 * Roles that can manage other users
 */
const USER_MANAGEMENT_ROLES: UserRole[] = ['super_admin', 'admin', 'white_label_owner'];

/**
 * Roles with API access
 */
const API_ACCESS_ROLES: UserRole[] = ['super_admin', 'super_reseller' as UserRole];

/**
 * Read-only roles (cannot modify data)
 */
const READ_ONLY_ROLES: UserRole[] = ['affiliate'];

// ============================================================================
// Context Types
// ============================================================================

interface PermissionContextType {
  permissions: UserPermissions;
  isLoading: boolean;
  
  // Permission checks
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasScope: (scope: FeatureScope) => boolean;
  hasAllScopes: (scopes: FeatureScope[]) => boolean;
  canAccessFeature: (feature: FeatureScope) => boolean;
  canManageTenant: (tenantId: string) => boolean;
  
  // Tenant checks
  isOwnTenant: (tenantId: string) => boolean;
  isChildTenant: (tenantId: string) => boolean;
  
  // Refresh
  refreshPermissions: () => Promise<void>;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  roles: ['user'],
  scopes: ROLE_SCOPES.user,
  tenantId: null,
  parentTenantId: null,
  canManageUsers: false,
  canAccessApi: false,
  isReadOnly: false,
};

// ============================================================================
// Context
// ============================================================================

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// ============================================================================
// Provider
// ============================================================================

interface PermissionProviderProps {
  children: ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [childTenantIds, setChildTenantIds] = useState<Set<string>>(new Set());

  const fetchPermissions = useCallback(async () => {
    if (!user?.id) {
      setPermissions(DEFAULT_PERMISSIONS);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const roles: UserRole[] = rolesData?.map(r => r.role as UserRole) || ['user'];
      
      // Ensure 'user' is always included
      if (!roles.includes('user')) {
        roles.push('user');
      }

      // Calculate scopes based on roles
      const scopeSet = new Set<FeatureScope>();
      roles.forEach(role => {
        const roleScopes = ROLE_SCOPES[role] || ROLE_SCOPES.user;
        roleScopes.forEach(scope => scopeSet.add(scope));
      });

      // Fetch white label settings for tenant info
      const { data: whiteLabelData } = await supabase
        .from('white_label_settings')
        .select('id, user_id, subscription_status')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      const tenantId = whiteLabelData?.id || user.id;

      // For white-label owners, fetch their client tenant IDs
      if (roles.includes('white_label_owner' as UserRole) || roles.includes('super_admin')) {
        // In a real system, this would query a tenant hierarchy table
        // For now, we just track the user's own tenant
        setChildTenantIds(new Set([tenantId]));
      }

      setPermissions({
        roles,
        scopes: Array.from(scopeSet),
        tenantId,
        parentTenantId: null, // Would be set for white_label_client
        canManageUsers: roles.some(r => USER_MANAGEMENT_ROLES.includes(r)),
        canAccessApi: roles.some(r => API_ACCESS_ROLES.includes(r)),
        isReadOnly: roles.some(r => READ_ONLY_ROLES.includes(r)) && 
                    !roles.some(r => !READ_ONLY_ROLES.includes(r)),
      });
    } catch (error) {
      console.error('[PermissionContext] Error fetching permissions:', error);
      setPermissions({ ...DEFAULT_PERMISSIONS, tenantId: user.id });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Permission check functions
  const hasRole = useCallback((role: UserRole): boolean => {
    return permissions.roles.includes(role);
  }, [permissions.roles]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return roles.some(role => permissions.roles.includes(role));
  }, [permissions.roles]);

  const hasScope = useCallback((scope: FeatureScope): boolean => {
    return permissions.scopes.includes(scope);
  }, [permissions.scopes]);

  const hasAllScopes = useCallback((scopes: FeatureScope[]): boolean => {
    return scopes.every(scope => permissions.scopes.includes(scope));
  }, [permissions.scopes]);

  const canAccessFeature = useCallback((feature: FeatureScope): boolean => {
    // Super admin always has access
    if (permissions.roles.includes('super_admin')) {
      return true;
    }
    return permissions.scopes.includes(feature);
  }, [permissions.roles, permissions.scopes]);

  const isOwnTenant = useCallback((tenantId: string): boolean => {
    return permissions.tenantId === tenantId;
  }, [permissions.tenantId]);

  const isChildTenant = useCallback((tenantId: string): boolean => {
    return childTenantIds.has(tenantId);
  }, [childTenantIds]);

  const canManageTenant = useCallback((tenantId: string): boolean => {
    // Super admin can manage any tenant
    if (permissions.roles.includes('super_admin')) {
      return true;
    }
    // Can manage own tenant
    if (isOwnTenant(tenantId)) {
      return permissions.canManageUsers;
    }
    // Can manage child tenants
    if (isChildTenant(tenantId)) {
      return permissions.canManageUsers;
    }
    return false;
  }, [permissions.roles, permissions.canManageUsers, isOwnTenant, isChildTenant]);

  const value: PermissionContextType = {
    permissions,
    isLoading,
    hasRole,
    hasAnyRole,
    hasScope,
    hasAllScopes,
    canAccessFeature,
    canManageTenant,
    isOwnTenant,
    isChildTenant,
    refreshPermissions: fetchPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to check if user can access a specific feature
 */
export function useFeatureAccess(feature: FeatureScope) {
  const { canAccessFeature, isLoading, permissions } = usePermissions();
  
  return {
    hasAccess: canAccessFeature(feature),
    isLoading,
    tier: permissions.roles.includes('super_admin') ? 'super_reseller' : 
          permissions.roles.includes('white_label_owner') ? 'white_label' : 
          permissions.roles.includes('admin') ? 'business_ceo' : 'free',
  };
}

/**
 * Hook for components that require specific roles
 */
export function useRequireRole(requiredRoles: UserRole[]) {
  const { hasAnyRole, isLoading } = usePermissions();
  
  return {
    isAuthorized: hasAnyRole(requiredRoles),
    isLoading,
  };
}

/**
 * Hook for tenant-scoped operations
 */
export function useTenantScope() {
  const { permissions, canManageTenant, isOwnTenant } = usePermissions();
  
  return {
    tenantId: permissions.tenantId,
    parentTenantId: permissions.parentTenantId,
    canManageTenant,
    isOwnTenant,
    isReadOnly: permissions.isReadOnly,
  };
}

export default PermissionContext;
