/**
 * Shared Service Types
 * 
 * Common types used across all services for consistency.
 */

// ============================================================================
// User & Roles
// ============================================================================

export type UserRole = 
  | 'super_admin'        // Full platform access + API
  | 'admin'              // Administrative access
  | 'white_label_owner'  // White-label tier 1 (owns sub-accounts)
  | 'white_label_client' // White-label tier 2 (under an owner)
  | 'affiliate'          // Local SEO agent / affiliate partner
  | 'user';              // Standard end user

export type FeatureScope = 
  | 'visitor_intelligence'
  | 'bron'
  | 'cade'
  | 'aeo_geo'
  | 'gmb'
  | 'social_signals'
  | 'on_page_seo'
  | 'ppc_landing_pages'
  | 'web_builder'
  | 'ai_assistant'
  | 'analytics'
  | 'white_label_settings'
  | 'user_management'
  | 'api_access';

export interface UserPermissions {
  roles: UserRole[];
  scopes: FeatureScope[];
  tenantId: string | null;
  parentTenantId: string | null; // For white-label clients
  canManageUsers: boolean;
  canAccessApi: boolean;
  isReadOnly: boolean;
}

// ============================================================================
// Tenant / Multi-tenancy
// ============================================================================

export interface TenantContext {
  tenantId: string;
  userId: string;
  tenantType: 'platform' | 'white_label' | 'client';
  branding?: TenantBranding;
  parentTenantId?: string;
}

export interface TenantBranding {
  logoUrl: string | null;
  companyName: string | null;
  primaryColor?: string;
  accentColor?: string;
}

// ============================================================================
// Subscription
// ============================================================================

export type SubscriptionTier = 
  | 'free'
  | 'vi_basic'
  | 'business_ceo'
  | 'white_label'
  | 'super_reseller';

export interface SubscriptionLimits {
  domains: number;
  keywords: number;
  articlesPerMonth: number;
  apiCalls: number;
  storage: number; // in MB
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  isActive: boolean;
  limits: SubscriptionLimits;
  features: FeatureScope[];
  expiresAt: string | null;
}

// ============================================================================
// Domain
// ============================================================================

export interface Domain {
  id: string;
  domain: string;
  userId: string;
  source: 'manual' | 'gsc' | 'gmb' | 'demo';
  isPrimary: boolean;
  isActive: boolean;
  isVerified: boolean;
  verificationMethod?: 'meta_tag' | 'dns_txt' | 'html_file';
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface BatchOperationResult {
  successful: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}
