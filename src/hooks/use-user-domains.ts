import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserDomain {
  id: string;
  user_id: string;
  domain: string;
  source: 'manual' | 'gsc' | 'gmb' | 'demo';
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Client-side computed property
  isDemo?: boolean;
}

interface UseUserDomainsReturn {
  domains: UserDomain[];
  primaryDomain: UserDomain | null;
  isLoading: boolean;
  hasPrimaryDomain: boolean;
  
  // Actions
  addDomain: (domain: string, source?: 'manual' | 'gsc' | 'gmb') => Promise<UserDomain | null>;
  removeDomain: (domainId: string) => Promise<boolean>;
  setPrimaryDomain: (domainId: string) => Promise<boolean>;
  importFromGsc: (gscSites: { siteUrl: string }[]) => Promise<number>;
  refreshDomains: () => Promise<void>;
  
  // Helpers
  isDomainOwned: (domain: string) => boolean;
  canAccessDomain: (domain: string) => boolean;
}

function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .trim()
    .replace('sc-domain:', '') // Remove GSC domain prefix
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\/$/, '')
    .split('/')[0];
}

// REMOVED: Demo domains - each user should only see their own GSC domains
// Super admins no longer get demo domains automatically

// isSuperAdmin param is kept for API compatibility but no longer adds demo domains
export function useUserDomains(_isSuperAdmin: boolean = false): UseUserDomainsReturn {
  const [domains, setDomains] = useState<UserDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user's domains
  const fetchDomains = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDomains([]);
        setUserId(null);
        setIsLoading(false);
        return;
      }
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from('user_domains')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Normalize domains to remove sc-domain: prefix
      const normalizedDomains = ((data as UserDomain[]) || []).map(d => ({
        ...d,
        domain: normalizeDomain(d.domain),
      }));
      
      // Deduplicate domains by normalized domain name
      const seen = new Set<string>();
      const dedupedDomains = normalizedDomains.filter(d => {
        const normalized = normalizeDomain(d.domain);
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });
      
      setDomains(dedupedDomains);
    } catch (error) {
      console.error('[useUserDomains] Error fetching domains:', error);
      setDomains([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchDomains();
      } else if (event === 'SIGNED_OUT') {
        setDomains([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchDomains]);

  // Add a new domain
  const addDomain = useCallback(async (
    domain: string, 
    source: 'manual' | 'gsc' | 'gmb' = 'manual'
  ): Promise<UserDomain | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be signed in to add a domain');
        return null;
      }

      const normalizedDomain = normalizeDomain(domain);
      
      if (!normalizedDomain) {
        toast.error('Please enter a valid domain');
        return null;
      }
      
      // Check if already exists in local state
      const existing = domains.find(d => normalizeDomain(d.domain) === normalizedDomain);
      if (existing) {
        toast.info('This domain is already in your list');
        return existing;
      }

      // If no primary domain, make this one primary (free domain)
      const hasPrimary = domains.some(d => d.is_primary);

      const { data, error } = await supabase
        .from('user_domains')
        .insert({
          user_id: user.id,
          domain: normalizedDomain,
          source,
          is_primary: !hasPrimary, // First domain is free
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('[useUserDomains] Insert error:', error);
        // Check for specific error types
        if (error.code === '23505') {
          toast.error('This domain already exists');
        } else if (error.code === '42501') {
          toast.error('Permission denied. Please try signing in again.');
        } else {
          toast.error(`Failed to add domain: ${error.message}`);
        }
        return null;
      }

      const newDomain = data as UserDomain;
      setDomains(prev => [...prev, newDomain]);
      
      return newDomain;
    } catch (error: unknown) {
      console.error('[useUserDomains] Error adding domain:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to add domain: ${message}`);
      return null;
    }
  }, [domains]);

  // Remove a domain
  const removeDomain = useCallback(async (domainId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_domains')
        .update({ is_active: false })
        .eq('id', domainId);

      if (error) throw error;

      setDomains(prev => prev.filter(d => d.id !== domainId));
      return true;
    } catch (error) {
      console.error('[useUserDomains] Error removing domain:', error);
      return false;
    }
  }, []);

  // Set a domain as primary (free domain)
  const setPrimaryDomain = useCallback(async (domainId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_domains')
        .update({ is_primary: true })
        .eq('id', domainId);

      if (error) throw error;

      // Update local state - the trigger handles unsetting other primaries
      setDomains(prev => prev.map(d => ({
        ...d,
        is_primary: d.id === domainId,
      })));

      return true;
    } catch (error) {
      console.error('[useUserDomains] Error setting primary domain:', error);
      return false;
    }
  }, []);

  // Import domains from GSC
  const importFromGsc = useCallback(async (
    gscSites: { siteUrl: string }[]
  ): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      let imported = 0;
      const hasPrimary = domains.some(d => d.is_primary);

      for (const site of gscSites) {
        const normalizedDomain = normalizeDomain(site.siteUrl);
        
        // Skip if already exists
        const existing = domains.find(d => normalizeDomain(d.domain) === normalizedDomain);
        if (existing) continue;

        const { error } = await supabase
          .from('user_domains')
          .insert({
            user_id: user.id,
            domain: normalizedDomain,
            source: 'gsc',
            is_primary: !hasPrimary && imported === 0, // First one is primary if none exists
            is_active: true,
          });

        if (!error) {
          imported++;
        }
      }

      if (imported > 0) {
        await fetchDomains();
        toast.success(`Imported ${imported} domain${imported > 1 ? 's' : ''} from Google Search Console`);
      }

      return imported;
    } catch (error) {
      console.error('[useUserDomains] Error importing from GSC:', error);
      return 0;
    }
  }, [domains, fetchDomains]);

  // Check if a domain is owned by the user
  const isDomainOwned = useCallback((domain: string): boolean => {
    const normalized = normalizeDomain(domain);
    return domains.some(d => normalizeDomain(d.domain) === normalized);
  }, [domains]);

  // Check if user can access a domain (owned or is primary)
  const canAccessDomain = useCallback((domain: string): boolean => {
    const normalized = normalizeDomain(domain);
    const userDomain = domains.find(d => normalizeDomain(d.domain) === normalized);
    
    // User can always access their primary (free) domain
    if (userDomain?.is_primary) return true;
    
    // For non-primary domains, would need subscription check
    // For now, just check if they own it
    return !!userDomain;
  }, [domains]);

  // Each user only sees their own domains - no demo domain injection
  const primaryDomain = domains.find(d => d.is_primary) || null;
  const hasPrimaryDomain = !!primaryDomain;

  return {
    domains,
    primaryDomain,
    isLoading,
    hasPrimaryDomain,
    addDomain,
    removeDomain,
    setPrimaryDomain,
    importFromGsc,
    refreshDomains: fetchDomains,
    isDomainOwned,
    canAccessDomain,
  };
}

export default useUserDomains;
