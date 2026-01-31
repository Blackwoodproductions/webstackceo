import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VisitorEnrichment {
  id: string;
  session_id: string;
  domain: string | null;
  ip_address: string | null;
  ip_city: string | null;
  ip_region: string | null;
  ip_country: string | null;
  ip_country_code: string | null;
  ip_timezone: string | null;
  ip_isp: string | null;
  ip_org: string | null;
  ip_as: string | null;
  company_name: string | null;
  company_domain: string | null;
  company_industry: string | null;
  company_size: string | null;
  company_revenue: string | null;
  company_linkedin: string | null;
  company_website: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_title: string | null;
  contact_linkedin: string | null;
  tech_stack: string[];
  enrichment_source: string | null;
  enrichment_confidence: number | null;
  matched_lead_id: string | null;
  match_type: string | null;
  created_at: string;
  updated_at: string;
}

export const useVisitorEnrichments = (domain: string | null, sessionIds?: string[]) => {
  return useQuery({
    queryKey: ["visitor-enrichments", domain, sessionIds],
    queryFn: async () => {
      let query = supabase
        .from("visitor_enrichments")
        .select("*")
        .order("created_at", { ascending: false });

      if (domain) {
        query = query.eq("domain", domain);
      }

      if (sessionIds && sessionIds.length > 0) {
        query = query.in("session_id", sessionIds);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error("Error fetching visitor enrichments:", error);
        throw error;
      }

      // Transform to match our interface
      return (data || []).map((row) => ({
        ...row,
        tech_stack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
      })) as VisitorEnrichment[];
    },
    enabled: !!domain,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// Get enrichment for a specific session
export const useSessionEnrichment = (sessionId: string | null) => {
  return useQuery({
    queryKey: ["session-enrichment", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const { data, error } = await supabase
        .from("visitor_enrichments")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching session enrichment:", error);
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        tech_stack: Array.isArray(data.tech_stack) ? data.tech_stack : [],
      } as VisitorEnrichment;
    },
    enabled: !!sessionId,
  });
};

// Trigger manual enrichment for a session
export const triggerEnrichment = async (
  sessionId: string,
  domain: string,
  visitorEmail?: string
) => {
  try {
    const { data, error } = await supabase.functions.invoke("visitor-enrich", {
      body: {
        session_id: sessionId,
        domain,
        visitor_email: visitorEmail,
      },
    });

    if (error) {
      console.error("Error triggering enrichment:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Failed to trigger enrichment:", err);
    throw err;
  }
};
