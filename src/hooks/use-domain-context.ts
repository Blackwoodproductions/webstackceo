import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─── Domain Context Type ─────────────────────────────────────────────────────
export interface DomainContext {
  id?: string;
  domain_id?: string;
  verified_at?: string;
  business_name?: string;
  year_established?: number;
  short_description?: string;
  business_model?: string;
  primary_keyword?: string;
  services_offered?: string[];
  services_not_offered?: string[];
  primary_city?: string;
  service_areas?: string[];
  service_radius?: string;
  licenses_certifications?: string[];
  brands_equipment?: string[];
  awards_associations?: string[];
  writing_tone?: string;
  point_of_view?: string;
  key_phrases?: string[];
  phrases_to_avoid?: string[];
  style_references?: string[];
  unique_selling_points?: string;
  guarantees_warranties?: string;
  pricing_approach?: string;
  competitors?: string;
  business_address?: string;
  phone_number?: string;
  email?: string;
  business_hours?: string[];
  social_links?: string[];
  topics_to_cover?: string[];
  topics_to_avoid?: string[];
  common_faqs?: string[];
  local_landmarks?: string[];
  authors?: string[];
  claims_to_avoid?: string[];
  required_disclaimers?: string[];
  trademark_guidelines?: string[];
  resource_sites?: string[];
  target_keywords?: string[];
  extraction_confidence?: Record<string, number>;
  created_at?: string;
  updated_at?: string;
  verified?: boolean;
}

// All trackable fields for progress calculation
export const DOMAIN_CONTEXT_FIELDS: (keyof DomainContext)[] = [
  "business_name",
  "year_established",
  "short_description",
  "business_model",
  "primary_keyword",
  "services_offered",
  "services_not_offered",
  "primary_city",
  "service_areas",
  "service_radius",
  "licenses_certifications",
  "brands_equipment",
  "awards_associations",
  "writing_tone",
  "point_of_view",
  "key_phrases",
  "phrases_to_avoid",
  "style_references",
  "unique_selling_points",
  "guarantees_warranties",
  "pricing_approach",
  "competitors",
  "business_address",
  "phone_number",
  "email",
  "business_hours",
  "social_links",
  "topics_to_cover",
  "topics_to_avoid",
  "common_faqs",
  "local_landmarks",
  "authors",
  "claims_to_avoid",
  "required_disclaimers",
  "trademark_guidelines",
  "resource_sites",
  "target_keywords",
];

export const TOTAL_FIELDS = DOMAIN_CONTEXT_FIELDS.length; // 37

// Helper to check if a field has meaningful value
const hasValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
};

// Calculate how many fields are filled
export const calculateFilledCount = (context: DomainContext | null): number => {
  if (!context) return 0;
  return DOMAIN_CONTEXT_FIELDS.filter((field) => hasValue(context[field])).length;
};

// ─── Cache Helpers ───────────────────────────────────────────────────────────
const CACHE_PREFIX = "domain_context_";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCacheKey(domain: string): string {
  return `${CACHE_PREFIX}${domain}`;
}

function loadCachedContext(domain: string): DomainContext | null {
  try {
    const cached = localStorage.getItem(getCacheKey(domain));
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    // Check if cache is still valid
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(getCacheKey(domain));
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveCachedContext(domain: string, context: DomainContext): void {
  try {
    localStorage.setItem(getCacheKey(domain), JSON.stringify({
      data: context,
      timestamp: Date.now(),
    }));
  } catch {
    // Ignore storage errors
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useDomainContext(domain: string | undefined) {
  // Initialize from cache synchronously for instant display
  const [context, setContext] = useState<DomainContext | null>(() => {
    if (!domain) return null;
    return loadCachedContext(domain);
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [hasFetchedFromApi, setHasFetchedFromApi] = useState(false);

  // Update context and cache together
  const updateContextState = useCallback((newContext: DomainContext) => {
    setContext(newContext);
    if (domain) {
      saveCachedContext(domain, newContext);
    }
  }, [domain]);

  // Re-hydrate from cache when domain changes
  useEffect(() => {
    if (domain) {
      const cached = loadCachedContext(domain);
      if (cached) {
        setContext(cached);
      } else {
        setContext(null);
      }
      setHasFetchedFromApi(false);
    }
  }, [domain]);

  const fetchContext = useCallback(async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("cade-api", {
        body: { action: "domain-context", domain },
      });

      if (fnError) throw fnError;

      const currentCount = calculateFilledCount(context);
      const incoming = (data?.data ?? null) as DomainContext | null;

      if (incoming) {
        const incomingCount = calculateFilledCount(incoming);
        // If backend returns empty but we already have cached/extracted context, keep current.
        if (!(incomingCount === 0 && currentCount > 0)) {
          updateContextState(incoming);
        }
      } else {
        // No backend context yet: only show empty if we don't already have cached context.
        if (currentCount === 0) setContext({});
      }

      setHasFetchedFromApi(true);
    } catch (err) {
      console.error("[useDomainContext] fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load domain context");
      // Don't wipe out cached/extracted context on transient errors.
      if (calculateFilledCount(context) === 0) setContext({});
    } finally {
      setLoading(false);
    }
  }, [domain, updateContextState, context]);

  const updateContext = useCallback(
    async (updates: Partial<DomainContext>) => {
      if (!domain) return false;
      setSaving(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke("cade-api", {
          body: { action: "update-domain-context", domain, params: updates },
        });

        if (fnError) throw fnError;

        if (data?.success && data?.data) {
          updateContextState(data.data);
        } else if (data?.data) {
          updateContextState(data.data);
        }

        return true;
      } catch (err) {
        console.error("[useDomainContext] update error:", err);
        setError(err instanceof Error ? err.message : "Failed to update domain context");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [domain, updateContextState]
  );

  // Auto-fill by crawling website and using AI to extract fields
  const autoFillContext = useCallback(async () => {
    if (!domain) return false;
    setAutoFilling(true);
    setError(null);

    try {
      console.log("[useDomainContext] Starting auto-fill for:", domain);
      const { data, error: fnError } = await supabase.functions.invoke("domain-context-autofill", {
        body: { domain },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        updateContextState(data.data);
        setHasAutoFilled(true);
        return true;
      } else if (data?.error) {
        throw new Error(data.error);
      }

      return false;
    } catch (err) {
      console.error("[useDomainContext] auto-fill error:", err);
      setError(err instanceof Error ? err.message : "Failed to auto-fill domain context");
      return false;
    } finally {
      setAutoFilling(false);
    }
  }, [domain, updateContextState]);

  const filledCount = calculateFilledCount(context);
  const progressPercent = Math.round((filledCount / TOTAL_FIELDS) * 100);

  return {
    context,
    setContext,
    loading,
    saving,
    autoFilling,
    error,
    fetchContext,
    updateContext,
    autoFillContext,
    hasAutoFilled,
    hasFetchedFromApi,
    filledCount,
    totalFields: TOTAL_FIELDS,
    progressPercent,
  };
}
