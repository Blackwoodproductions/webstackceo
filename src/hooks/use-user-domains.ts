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

// Demo domains that super admins can access
const DEMO_DOMAINS: Omit<UserDomain, 'user_id'>[] = [
  {
    id: 'demo-webstack-ceo',
    domain: 'webstack.ceo',
    source: 'demo',
    is_primary: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    isDemo: true,
  },
];

export function useUserDomains(isSuperAdmin: boolean = false): UseUserDomainsReturn {
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
      if (!user) return null;

      const normalizedDomain = normalizeDomain(domain);
      
      // Check if already exists
      const existing = domains.find(d => normalizeDomain(d.domain) === normalizedDomain);
      if (existing) {
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

      if (error) throw error;

      const newDomain = data as UserDomain;
      setDomains(prev => [...prev, newDomain]);
      
      return newDomain;
    } catch (error) {
      console.error('[useUserDomains] Error adding domain:', error);
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

  // Derived state - include demo domains for super admins
  const allDomains = useMemo(() => {
    if (isSuperAdmin && userId) {
      // Add demo domains for super admins, marking them clearly
      const demoDomains = DEMO_DOMAINS.map(d => ({
        ...d,
        user_id: userId,
        isDemo: true,
      }));
      
      // Only add demo domains that aren't already in user's list
      const existingNormalized = new Set(domains.map(d => normalizeDomain(d.domain)));
      const newDemos = demoDomains.filter(d => !existingNormalized.has(normalizeDomain(d.domain)));
      
      return [...domains, ...newDemos];
    }
    return domains;
  }, [domains, isSuperAdmin, userId]);
  
  const primaryDomain = allDomains.find(d => d.is_primary) || null;
  const hasPrimaryDomain = !!primaryDomain;

  return {
    domains: allDomains,
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
