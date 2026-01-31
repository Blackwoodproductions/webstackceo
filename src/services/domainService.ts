/**
 * Domain Service
 * 
 * Centralized domain management with tenant isolation.
 */

import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse } from './apiClient';
import type { Domain, PaginatedResponse } from './types';

// ============================================================================
// Types
// ============================================================================

export interface DomainFilters {
  source?: 'manual' | 'gsc' | 'gmb';
  isPrimary?: boolean;
  isVerified?: boolean;
  search?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .trim()
    .replace('sc-domain:', '')
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\/$/, '')
    .split('/')[0];
}

function mapRowToDomain(row: Record<string, unknown>): Domain {
  return {
    id: row.id as string,
    domain: normalizeDomain(row.domain as string),
    userId: row.user_id as string,
    source: row.source as Domain['source'],
    isPrimary: row.is_primary as boolean,
    isActive: row.is_active as boolean,
    isVerified: (row.is_verified as boolean) || false,
    verificationMethod: row.verification_method as Domain['verificationMethod'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================================================
// Domain Service
// ============================================================================

export const domainService = {
  /**
   * Get all domains for current user
   */
  async getDomains(filters?: DomainFilters): Promise<ApiResponse<Domain[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: null, status: 'success' };
      }

      let query = supabase
        .from('user_domains')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (filters?.source) {
        query = query.eq('source', filters.source);
      }
      if (filters?.isPrimary !== undefined) {
        query = query.eq('is_primary', filters.isPrimary);
      }
      if (filters?.search) {
        query = query.ilike('domain', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          error: { code: error.code, message: error.message, severity: 'high', recoverable: true },
          status: 'error',
        };
      }

      // Deduplicate by normalized domain
      const seen = new Set<string>();
      const domains = (data || [])
        .map(row => mapRowToDomain(row))
        .filter(d => {
          const normalized = normalizeDomain(d.domain);
          if (seen.has(normalized)) return false;
          seen.add(normalized);
          return true;
        });

      return { data: domains, error: null, status: 'success' };
    } catch (error) {
      return {
        data: null,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch domains', severity: 'medium', recoverable: true, originalError: error },
        status: 'error',
      };
    }
  },

  /**
   * Get primary domain for current user
   */
  async getPrimaryDomain(): Promise<ApiResponse<Domain | null>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: null, status: 'success' };
      }

      const { data, error } = await supabase
        .from('user_domains')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        return {
          data: null,
          error: { code: error.code, message: error.message, severity: 'medium', recoverable: true },
          status: 'error',
        };
      }

      return {
        data: data ? mapRowToDomain(data) : null,
        error: null,
        status: 'success',
      };
    } catch (error) {
      return {
        data: null,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch primary domain', severity: 'medium', recoverable: true, originalError: error },
        status: 'error',
      };
    }
  },

  /**
   * Add a new domain
   */
  async addDomain(domain: string, source: 'manual' | 'gsc' | 'gmb' = 'manual'): Promise<ApiResponse<Domain>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          data: null,
          error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated', severity: 'high', recoverable: false },
          status: 'error',
        };
      }

      const normalizedDomain = normalizeDomain(domain);
      if (!normalizedDomain) {
        return {
          data: null,
          error: { code: 'INVALID_DOMAIN', message: 'Invalid domain format', severity: 'low', recoverable: true },
          status: 'error',
        };
      }

      // Check for existing domains to determine if this should be primary
      const { data: existing } = await supabase
        .from('user_domains')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);

      const hasPrimary = (existing?.length || 0) > 0;

      const { data, error } = await supabase
        .from('user_domains')
        .insert({
          user_id: user.id,
          domain: normalizedDomain,
          source,
          is_primary: !hasPrimary,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return {
            data: null,
            error: { code: 'DUPLICATE', message: 'This domain already exists', severity: 'low', recoverable: true },
            status: 'error',
          };
        }
        return {
          data: null,
          error: { code: error.code, message: error.message, severity: 'medium', recoverable: true },
          status: 'error',
        };
      }

      return { data: mapRowToDomain(data), error: null, status: 'success' };
    } catch (error) {
      return {
        data: null,
        error: { code: 'ADD_ERROR', message: 'Failed to add domain', severity: 'medium', recoverable: true, originalError: error },
        status: 'error',
      };
    }
  },

  /**
   * Remove a domain (soft delete)
   */
  async removeDomain(domainId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('user_domains')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', domainId);

      if (error) {
        return {
          data: null,
          error: { code: error.code, message: error.message, severity: 'medium', recoverable: true },
          status: 'error',
        };
      }

      return { data: undefined, error: null, status: 'success' };
    } catch (error) {
      return {
        data: null,
        error: { code: 'REMOVE_ERROR', message: 'Failed to remove domain', severity: 'medium', recoverable: true, originalError: error },
        status: 'error',
      };
    }
  },

  /**
   * Set a domain as primary
   */
  async setPrimaryDomain(domainId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('user_domains')
        .update({ is_primary: true, updated_at: new Date().toISOString() })
        .eq('id', domainId);

      if (error) {
        return {
          data: null,
          error: { code: error.code, message: error.message, severity: 'medium', recoverable: true },
          status: 'error',
        };
      }

      return { data: undefined, error: null, status: 'success' };
    } catch (error) {
      return {
        data: null,
        error: { code: 'UPDATE_ERROR', message: 'Failed to set primary domain', severity: 'medium', recoverable: true, originalError: error },
        status: 'error',
      };
    }
  },

  /**
   * Import domains from GSC
   */
  async importFromGsc(gscSites: { siteUrl: string }[]): Promise<ApiResponse<{ imported: number }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          data: null,
          error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated', severity: 'high', recoverable: false },
          status: 'error',
        };
      }

      // Get existing domains
      const { data: existing } = await supabase
        .from('user_domains')
        .select('domain')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const existingNormalized = new Set((existing || []).map(d => normalizeDomain(d.domain)));
      const hasPrimary = (existing?.length || 0) > 0;

      let imported = 0;
      for (const site of gscSites) {
        const normalizedDomain = normalizeDomain(site.siteUrl);
        if (existingNormalized.has(normalizedDomain)) continue;

        const { error } = await supabase
          .from('user_domains')
          .insert({
            user_id: user.id,
            domain: normalizedDomain,
            source: 'gsc',
            is_primary: !hasPrimary && imported === 0,
            is_active: true,
          });

        if (!error) {
          imported++;
          existingNormalized.add(normalizedDomain);
        }
      }

      return { data: { imported }, error: null, status: 'success' };
    } catch (error) {
      return {
        data: null,
        error: { code: 'IMPORT_ERROR', message: 'Failed to import domains', severity: 'medium', recoverable: true, originalError: error },
        status: 'error',
      };
    }
  },

  /**
   * Check if user owns a domain
   */
  async isDomainOwned(domain: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const normalizedDomain = normalizeDomain(domain);
      const { data } = await supabase
        .from('user_domains')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .ilike('domain', normalizedDomain)
        .limit(1);

      return (data?.length || 0) > 0;
    } catch {
      return false;
    }
  },

  /**
   * Normalize domain helper (exposed for external use)
   */
  normalizeDomain,
};

export default domainService;
