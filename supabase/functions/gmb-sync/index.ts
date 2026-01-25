import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory cache with 5-minute TTL
const cache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

interface GmbAccount {
  name: string;
  accountName: string;
  type: string;
}

interface GmbLocation {
  name: string;
  title: string;
  websiteUri?: string;
  storefrontAddress?: {
    locality?: string;
    administrativeArea?: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Missing accessToken" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create cache key from token hash (just use first/last chars for privacy)
    const cacheKey = `gmb_${accessToken.slice(0, 8)}_${accessToken.slice(-8)}`;
    
    // Check cache first
    const cached = getCached(cacheKey);
    if (cached) {
      console.log("[gmb-sync] Returning cached data");
      return new Response(
        JSON.stringify({ ...cached, fromCache: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[gmb-sync] Fetching fresh data from Google APIs");

    // Fetch accounts
    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!accountsRes.ok) {
      const body = await accountsRes.text().catch(() => "");
      const status = accountsRes.status;
      
      console.error(`[gmb-sync] Accounts API failed (${status}):`, body.slice(0, 500));
      
      return new Response(
        JSON.stringify({ 
          error: `Google Business accounts request failed (${status})`,
          status,
          details: body.slice(0, 300),
          isQuotaError: status === 429
        }),
        { 
          status: status === 429 ? 429 : 502, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const accountsData = await accountsRes.json();
    const accounts: GmbAccount[] = [];

    if (accountsData.accounts && Array.isArray(accountsData.accounts)) {
      for (const a of accountsData.accounts) {
        accounts.push({
          name: a.name,
          accountName: a.accountName || a.name?.split("/").pop() || "Business Account",
          type: a.type || "PERSONAL",
        });
      }
    }

    console.log(`[gmb-sync] Found ${accounts.length} accounts`);

    // Fetch locations for all accounts (sequentially to avoid burst quota issues)
    const allLocations: GmbLocation[] = [];
    
    for (const account of accounts) {
      try {
        // Small delay between requests to avoid hitting per-second limits
        if (allLocations.length > 0) {
          await new Promise(r => setTimeout(r, 200));
        }

        const locationsRes = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,websiteUri,storefrontAddress`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (locationsRes.ok) {
          const locData = await locationsRes.json();
          if (locData.locations && Array.isArray(locData.locations)) {
            for (const loc of locData.locations) {
              allLocations.push({
                name: loc.name,
                title: loc.title || "Untitled Location",
                websiteUri: loc.websiteUri,
                storefrontAddress: loc.storefrontAddress,
              });
            }
          }
        } else if (locationsRes.status === 429) {
          // If we hit quota on locations, return what we have so far
          console.warn(`[gmb-sync] Hit 429 on locations for ${account.name}, returning partial data`);
          break;
        } else {
          console.warn(`[gmb-sync] Failed to fetch locations for ${account.name}: ${locationsRes.status}`);
        }
      } catch (err) {
        console.error(`[gmb-sync] Error fetching locations for ${account.name}:`, err);
      }
    }

    console.log(`[gmb-sync] Found ${allLocations.length} total locations`);

    const result = {
      accounts,
      locations: allLocations,
      syncedAt: new Date().toISOString(),
      fromCache: false,
    };

    // Cache the result
    setCache(cacheKey, result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[gmb-sync] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
