import { useState, useCallback } from "react";
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

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useDomainContext(domain: string | undefined) {
  const [context, setContext] = useState<DomainContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("cade-api", {
        body: { action: "domain-context", domain },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setContext(data.data);
      } else if (data?.data) {
        setContext(data.data);
      } else {
        // No context yet - initialize empty
        setContext({});
      }
    } catch (err) {
      console.error("[useDomainContext] fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load domain context");
      setContext({});
    } finally {
      setLoading(false);
    }
  }, [domain]);

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
          setContext(data.data);
        } else if (data?.data) {
          setContext(data.data);
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
    [domain]
  );

  const filledCount = calculateFilledCount(context);
  const progressPercent = Math.round((filledCount / TOTAL_FIELDS) * 100);

  return {
    context,
    loading,
    saving,
    error,
    fetchContext,
    updateContext,
    filledCount,
    totalFields: TOTAL_FIELDS,
    progressPercent,
  };
}
