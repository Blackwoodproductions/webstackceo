import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Free IP geolocation API (no key required, 45 requests/min limit)
const IP_API_URL = "http://ip-api.com/json";

interface IpApiResponse {
  status: string;
  message?: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

interface EnrichmentResult {
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
  company_website: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_title: string | null;
  matched_lead_id: string | null;
  match_type: string | null;
  enrichment_source: string;
  enrichment_confidence: number;
  raw_enrichment_data: unknown;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Extract company name from ISP/Org (heuristic)
function extractCompanyFromOrg(org: string | null, isp: string | null): string | null {
  if (!org && !isp) return null;
  
  const source = org || isp || "";
  
  // Filter out common ISPs that aren't businesses
  const commonIsps = [
    "comcast", "verizon", "at&t", "spectrum", "cox", "centurylink",
    "frontier", "xfinity", "t-mobile", "sprint", "google fiber",
    "amazon", "microsoft", "cloudflare", "digitalocean", "aws", "azure",
    "linode", "vultr", "ovh", "hetzner"
  ];
  
  const lowerSource = source.toLowerCase();
  for (const isp of commonIsps) {
    if (lowerSource.includes(isp)) {
      return null; // It's a consumer ISP, not a business
    }
  }
  
  // Clean up common suffixes
  let company = source
    .replace(/,?\s*(inc\.?|llc\.?|ltd\.?|corp\.?|co\.?|llp\.?)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  
  return company || null;
}

// Cross-reference with leads table
// deno-lint-ignore no-explicit-any
async function crossReferenceLeads(
  supabase: any,
  domain: string | null,
  ipOrg: string | null,
  email: string | null
): Promise<{
  lead: { id: string; email: string; full_name: string | null; phone: string | null; domain: string | null } | null;
  matchType: string | null;
}> {
  // Try email match first (highest confidence)
  if (email) {
    const { data: emailMatch } = await supabase
      .from("leads")
      .select("id, email, full_name, phone, domain")
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    
    if (emailMatch) {
      return { lead: emailMatch, matchType: "email" };
    }
  }
  
  // Try domain match
  if (domain) {
    const { data: domainMatch } = await supabase
      .from("leads")
      .select("id, email, full_name, phone, domain")
      .eq("domain", domain)
      .limit(1)
      .maybeSingle();
    
    if (domainMatch) {
      return { lead: domainMatch, matchType: "domain" };
    }
  }
  
  // Try company name match from IP org
  if (ipOrg) {
    const companyName = extractCompanyFromOrg(ipOrg, null);
    if (companyName && companyName.length > 3) {
      // Fuzzy match - look for leads from same company domain or similar
      const { data: orgMatches } = await supabase
        .from("leads")
        .select("id, email, full_name, phone, domain")
        .or(`domain.ilike.%${companyName.toLowerCase().replace(/\s+/g, "")}%,email.ilike.%${companyName.toLowerCase().replace(/\s+/g, "")}%`)
        .limit(1)
        .maybeSingle();
      
      if (orgMatches) {
        return { lead: orgMatches, matchType: "company_name" };
      }
    }
  }
  
  return { lead: null, matchType: null };
}

// Fetch IP data from free API
async function fetchIpData(ipAddress: string): Promise<IpApiResponse | null> {
  try {
    // ip-api.com free tier - fields we want
    const fields = "status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query";
    const response = await fetch(`${IP_API_URL}/${ipAddress}?fields=${fields}`);
    
    if (!response.ok) {
      console.error(`IP API returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === "fail") {
      console.error(`IP API failed: ${data.message}`);
      return null;
    }
    
    return data as IpApiResponse;
  } catch (error) {
    console.error("Error fetching IP data:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("Missing backend env vars for visitor-enrich");
      return jsonResponse({ success: false, error: "Server misconfigured" }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { session_id, ip_address, domain, visitor_email } = await req.json();

    if (!session_id) {
      return jsonResponse({ success: false, error: "Missing session_id" }, 400);
    }

    // Check if we already have enrichment for this session
    const { data: existing } = await supabase
      .from("visitor_enrichments")
      .select("id, enrichment_confidence")
      .eq("session_id", session_id)
      .maybeSingle();

    // Skip if already enriched with high confidence
    if (existing?.enrichment_confidence && existing.enrichment_confidence >= 0.8) {
      console.log(`Session ${session_id} already enriched with high confidence`);
      return jsonResponse({ success: true, message: "Already enriched", data: existing });
    }

    let enrichment: Partial<EnrichmentResult> = {
      enrichment_source: "pending",
      enrichment_confidence: 0,
      raw_enrichment_data: {},
    };

    // Step 1: IP-based enrichment
    let ipData: IpApiResponse | null = null;
    if (ip_address && ip_address !== "127.0.0.1" && !ip_address.startsWith("192.168.")) {
      ipData = await fetchIpData(ip_address);
      
      if (ipData) {
        enrichment = {
          ...enrichment,
          ip_city: ipData.city || null,
          ip_region: ipData.regionName || null,
          ip_country: ipData.country || null,
          ip_country_code: ipData.countryCode || null,
          ip_timezone: ipData.timezone || null,
          ip_isp: ipData.isp || null,
          ip_org: ipData.org || null,
          ip_as: ipData.as || null,
          enrichment_source: "ip-api",
          enrichment_confidence: 0.3, // Low confidence from IP alone
          raw_enrichment_data: ipData,
        };

        // Extract company from org if it looks like a business
        const companyFromOrg = extractCompanyFromOrg(ipData.org, ipData.isp);
        if (companyFromOrg) {
          enrichment.company_name = companyFromOrg;
          enrichment.enrichment_confidence = 0.5; // Medium confidence if we found a company
        }
      }
    }

    // Step 2: Cross-reference with existing leads
    const { lead, matchType } = await crossReferenceLeads(
      supabase,
      domain,
      ipData?.org || null,
      visitor_email || null
    );

    if (lead) {
      enrichment = {
        ...enrichment,
        contact_name: lead.full_name,
        contact_email: lead.email,
        contact_phone: lead.phone,
        company_domain: lead.domain,
        matched_lead_id: lead.id,
        match_type: matchType,
        enrichment_source: `leads_crossref_${matchType}`,
        enrichment_confidence: matchType === "email" ? 0.95 : matchType === "domain" ? 0.7 : 0.5,
      };
      
      // If we matched a lead, try to get more info from their domain
      if (lead.domain) {
        enrichment.company_website = `https://${lead.domain}`;
      }
    }

    // Step 3: Upsert enrichment data
    const enrichmentRecord = {
      session_id,
      domain: domain || null,
      ip_address: ip_address || null,
      ip_city: enrichment.ip_city || null,
      ip_region: enrichment.ip_region || null,
      ip_country: enrichment.ip_country || null,
      ip_country_code: enrichment.ip_country_code || null,
      ip_timezone: enrichment.ip_timezone || null,
      ip_isp: enrichment.ip_isp || null,
      ip_org: enrichment.ip_org || null,
      ip_as: enrichment.ip_as || null,
      company_name: enrichment.company_name || null,
      company_domain: enrichment.company_domain || null,
      company_industry: enrichment.company_industry || null,
      company_size: enrichment.company_size || null,
      company_website: enrichment.company_website || null,
      contact_name: enrichment.contact_name || null,
      contact_email: enrichment.contact_email || null,
      contact_phone: enrichment.contact_phone || null,
      contact_title: enrichment.contact_title || null,
      matched_lead_id: enrichment.matched_lead_id || null,
      match_type: enrichment.match_type || null,
      enrichment_source: enrichment.enrichment_source || "unknown",
      enrichment_confidence: enrichment.enrichment_confidence || 0,
      raw_enrichment_data: enrichment.raw_enrichment_data || {},
      updated_at: new Date().toISOString(),
    };

    const { data: upsertedData, error: upsertError } = await supabase
      .from("visitor_enrichments")
      .upsert(enrichmentRecord, { onConflict: "session_id" })
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting enrichment:", upsertError);
      return jsonResponse({ success: false, error: "Failed to save enrichment" }, 500);
    }

    console.log(`Enriched session ${session_id} with confidence ${enrichment.enrichment_confidence}`);

    return jsonResponse({
      success: true,
      data: upsertedData,
      enrichment_source: enrichment.enrichment_source,
      confidence: enrichment.enrichment_confidence,
    });

  } catch (err) {
    console.error("visitor-enrich unhandled error:", err);
    return jsonResponse({ success: false, error: "Unexpected error" }, 500);
  }
});
