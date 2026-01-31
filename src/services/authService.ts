/**
 * Auth Service
 * 
 * Centralized authentication service with secure token handling.
 * Handles session management, token refresh, and auth state.
 */

import { supabase } from '@/integrations/supabase/client';
import { apiClient, type ApiResponse, type ApiError } from './apiClient';

// ============================================================================
// Types
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  user: AuthUser;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scopes: string[];
}

// ============================================================================
// Constants
// ============================================================================

const TOKEN_REFRESH_BUFFER_MS = 10 * 60 * 1000; // Refresh 10 min before expiry
const GOOGLE_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/siteverification',
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/business.manage',
];

// Storage keys (memory-first, localStorage as fallback for non-sensitive data)
const STORAGE_KEYS = {
  GOOGLE_TOKEN: 'unified_google_token',
  GOOGLE_EXPIRY: 'unified_google_expiry',
  GOOGLE_PROFILE: 'unified_google_profile',
};

// ============================================================================
// Token Storage (Memory-first for security)
// ============================================================================

let memoryTokens: GoogleTokens | null = null;

function storeGoogleTokens(tokens: GoogleTokens): void {
  memoryTokens = tokens;
  
  // Store non-sensitive data in localStorage for persistence
  try {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_TOKEN, tokens.accessToken);
    localStorage.setItem(STORAGE_KEYS.GOOGLE_EXPIRY, tokens.expiresAt.toString());
  } catch {
    // Ignore storage errors
  }
}

function getGoogleTokens(): GoogleTokens | null {
  if (memoryTokens) {
    return memoryTokens;
  }
  
  // Try to restore from localStorage
  try {
    const token = localStorage.getItem(STORAGE_KEYS.GOOGLE_TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEYS.GOOGLE_EXPIRY);
    
    if (token && expiry) {
      const expiresAt = parseInt(expiry, 10);
      if (Date.now() < expiresAt - 60000) { // Valid if more than 1 min remaining
        memoryTokens = {
          accessToken: token,
          expiresAt,
          scopes: GOOGLE_SCOPES,
        };
        return memoryTokens;
      }
    }
  } catch {
    // Ignore storage errors
  }
  
  return null;
}

function clearGoogleTokens(): void {
  memoryTokens = null;
  try {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Auth Service
// ============================================================================

export const authService = {
  /**
   * Get current session from Supabase
   */
  async getSession(): Promise<ApiResponse<AuthSession | null>> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return { data: null, error: { code: error.name, message: error.message, severity: 'high', recoverable: true }, status: 'error' };
      }
      
      if (!session) {
        return { data: null, error: null, status: 'success' };
      }
      
      return {
        data: {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000,
          user: {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            avatarUrl: session.user.user_metadata?.avatar_url,
            provider: session.user.app_metadata?.provider,
          },
        },
        error: null,
        status: 'success',
      };
    } catch (error) {
      return {
        data: null,
        error: { code: 'AUTH_ERROR', message: 'Failed to get session', severity: 'high', recoverable: true, originalError: error },
        status: 'error',
      };
    }
  },

  /**
   * Get current user's ID
   */
  async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const response = await this.getSession();
    return !!response.data;
  },

  /**
   * Check if user has admin role
   */
  async isAdmin(userId?: string): Promise<boolean> {
    const uid = userId || await this.getCurrentUserId();
    if (!uid) return false;
    
    try {
      const { data } = await supabase.rpc('is_admin', { _user_id: uid });
      return !!data;
    } catch {
      return false;
    }
  },

  /**
   * Check if user is super admin
   */
  async isSuperAdmin(userId?: string): Promise<boolean> {
    const uid = userId || await this.getCurrentUserId();
    if (!uid) return false;
    
    try {
      const { data } = await supabase.rpc('is_super_admin', { _user_id: uid });
      return !!data;
    } catch {
      return false;
    }
  },

  /**
   * Get user roles
   */
  async getUserRoles(userId?: string): Promise<string[]> {
    const uid = userId || await this.getCurrentUserId();
    if (!uid) return [];
    
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', uid);
      
      return data?.map(r => r.role) || [];
    } catch {
      return [];
    }
  },

  /**
   * Sign out
   */
  async signOut(): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut();
      clearGoogleTokens();
      
      if (error) {
        return { data: null, error: { code: 'SIGNOUT_ERROR', message: error.message, severity: 'medium', recoverable: true }, status: 'error' };
      }
      
      return { data: undefined, error: null, status: 'success' };
    } catch (error) {
      return {
        data: null,
        error: { code: 'SIGNOUT_ERROR', message: 'Failed to sign out', severity: 'medium', recoverable: true, originalError: error },
        status: 'error',
      };
    }
  },

  // =========================================================================
  // Google Token Management
  // =========================================================================

  /**
   * Check if Google tokens are valid
   */
  isGoogleTokenValid(): boolean {
    const tokens = getGoogleTokens();
    if (!tokens) return false;
    return Date.now() < tokens.expiresAt - 60000;
  },

  /**
   * Get Google access token
   */
  getGoogleAccessToken(): string | null {
    const tokens = getGoogleTokens();
    return tokens?.accessToken || null;
  },

  /**
   * Refresh Google token using refresh_token from database
   */
  async refreshGoogleToken(): Promise<ApiResponse<GoogleTokens>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { data: null, error: { code: 'NOT_AUTHENTICATED', message: 'User not authenticated', severity: 'high', recoverable: false }, status: 'error' };
      }

      // Get refresh token from database
      const { data: tokenData, error } = await supabase
        .from('oauth_tokens')
        .select('refresh_token')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .single();

      if (error || !tokenData?.refresh_token) {
        return { data: null, error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token available', severity: 'high', recoverable: false }, status: 'error' };
      }

      // Call edge function to refresh
      const response = await apiClient.invoke<{ access_token: string; expires_in: number }>('google-oauth-token', {
        refreshToken: tokenData.refresh_token,
        grantType: 'refresh_token',
      });

      if (response.error || !response.data?.access_token) {
        return { data: null, error: response.error || { code: 'REFRESH_FAILED', message: 'Token refresh failed', severity: 'high', recoverable: false }, status: 'error' };
      }

      const expiresAt = Date.now() + (response.data.expires_in || 3600) * 1000;
      const tokens: GoogleTokens = {
        accessToken: response.data.access_token,
        expiresAt,
        scopes: GOOGLE_SCOPES,
      };

      // Store new tokens
      storeGoogleTokens(tokens);

      // Update database
      await supabase
        .from('oauth_tokens')
        .update({
          access_token: tokens.accessToken,
          expires_at: new Date(expiresAt).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('provider', 'google');

      // Dispatch sync event
      window.dispatchEvent(new CustomEvent('google-auth-synced', {
        detail: { access_token: tokens.accessToken, expiry: expiresAt },
      }));

      return { data: tokens, error: null, status: 'success' };
    } catch (error) {
      return {
        data: null,
        error: { code: 'REFRESH_ERROR', message: 'Failed to refresh Google token', severity: 'high', recoverable: true, originalError: error },
        status: 'error',
      };
    }
  },

  /**
   * Store Google tokens after OAuth flow
   */
  storeGoogleTokens(accessToken: string, refreshToken?: string, expiresIn = 3600): void {
    const expiresAt = Date.now() + expiresIn * 1000;
    storeGoogleTokens({
      accessToken,
      refreshToken,
      expiresAt,
      scopes: GOOGLE_SCOPES,
    });

    // Also update legacy localStorage keys for backward compatibility
    try {
      const expiryStr = expiresAt.toString();
      localStorage.setItem('ga_access_token', accessToken);
      localStorage.setItem('ga_token_expiry', expiryStr);
      localStorage.setItem('gsc_access_token', accessToken);
      localStorage.setItem('gsc_token_expiry', expiryStr);
      localStorage.setItem('google_ads_access_token', accessToken);
      localStorage.setItem('google_ads_token_expiry', expiryStr);
      localStorage.setItem('gmb_access_token', accessToken);
      localStorage.setItem('gmb_token_expiry', expiryStr);
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Clear Google tokens
   */
  clearGoogleTokens,

  /**
   * Get tokens needing refresh (within buffer period)
   */
  needsTokenRefresh(): boolean {
    const tokens = getGoogleTokens();
    if (!tokens) return false;
    return Date.now() > tokens.expiresAt - TOKEN_REFRESH_BUFFER_MS;
  },
};

export default authService;
