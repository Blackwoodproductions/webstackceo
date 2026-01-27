import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// BRON API configuration
const BRON_API = "https://public.imagehosting.space/feed/Article.php";
const BRON_API_ID = "53084";
const BRON_API_KEY = "347819526879185";
const BRON_KKYY = "AKhpU6QAbMtUDTphRPCezo96CztR9EXR";

// In-memory session store with tokens from BRON callback
const sessions = new Map<string, { 
  domain: string; 
  domainId: string;
  userId: string;
  bronToken: string | null; // Token received from BRON callback
  createdAt: number; 
  expiresAt: number;
}>();

// Generate a secure random token for our session
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Clean expired sessions
function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
}

// Verify domain with BRON API
async function verifyDomainWithBRON(domain: string): Promise<{ valid: boolean; domainId?: string; userId?: string }> {
  try {
    const url = `${BRON_API}?feedit=add&domain=${encodeURIComponent(domain)}&apiid=${BRON_API_ID}&apikey=${BRON_API_KEY}&kkyy=${BRON_KKYY}`;
    const resp = await fetch(url);
    const text = await resp.text();
    
    if (!resp.ok) {
      console.log("[BRON Auth] API returned non-OK status:", resp.status);
      return { valid: false };
    }
    
    const data = JSON.parse(text);
    if (Array.isArray(data) && data.length > 0 && data[0]?.domainid) {
      return { 
        valid: true, 
        domainId: data[0].domainid,
        userId: data[0].userid
      };
    }
    
    return { valid: false };
  } catch (err) {
    console.error("[BRON Auth] Error verifying domain:", err);
    return { valid: false };
  }
}

// Get an embed token from BRON for the dashboard
async function getEmbedToken(domain: string, domainId: string, userId: string): Promise<string | null> {
  try {
    // Request embed token from BRON API
    const url = `${BRON_API}?feedit=embed_token&domain=${encodeURIComponent(domain)}&domainid=${domainId}&userid=${userId}&apiid=${BRON_API_ID}&apikey=${BRON_API_KEY}&kkyy=${BRON_KKYY}`;
    console.log("[BRON Auth] Requesting embed token for domain:", domain);
    
    const resp = await fetch(url);
    const text = await resp.text();
    
    if (!resp.ok) {
      console.log("[BRON Auth] Embed token request failed:", resp.status);
      return null;
    }
    
    try {
      const data = JSON.parse(text);
      if (data?.embed_token) {
        console.log("[BRON Auth] Got embed token");
        return data.embed_token;
      }
      if (data?.token) {
        console.log("[BRON Auth] Got token");
        return data.token;
      }
      // If API returns the token directly as string
      if (typeof data === 'string' && data.length > 10) {
        return data;
      }
    } catch {
      // Response might be the token directly
      if (text.length > 10 && text.length < 200) {
        return text;
      }
    }
    
    console.log("[BRON Auth] No embed token in response:", text.substring(0, 100));
    return null;
  } catch (err) {
    console.error("[BRON Auth] Error getting embed token:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;
    
    console.log("[BRON Auth] Action:", action);

    switch (action) {
      case "create-session": {
        const domain = body?.domain as string;
        const bronCallbackToken = body?.bronToken as string | null; // Token from BRON callback
        const providedDomainId = body?.domainId as string | null; // Domain ID extracted from popup URL
        
        if (!domain) {
          return new Response(
            JSON.stringify({ success: false, error: "domain is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let domainId = providedDomainId;
        let userId = "";

        // If we have a domain ID from the popup URL, use it directly
        if (domainId) {
          console.log("[BRON Auth] Using provided domainId:", domainId);
          // Still verify with BRON to get userId
          const verification = await verifyDomainWithBRON(domain);
          if (verification.userId) {
            userId = verification.userId;
          }
        } else {
          // Verify the domain with BRON to get IDs
          const verification = await verifyDomainWithBRON(domain);
          
          if (!verification.valid || !verification.domainId) {
            return new Response(
              JSON.stringify({ success: false, error: "Domain not found in BRON" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          domainId = verification.domainId;
          userId = verification.userId || "";
        }

        // Try to get an embed token from BRON
        let embedToken = bronCallbackToken;
        if (!embedToken && domainId) {
          embedToken = await getEmbedToken(domain, domainId, userId);
        }

        cleanExpiredSessions();

        // Generate our session token
        const token = generateToken();
        const now = Date.now();
        const expiresAt = now + 24 * 60 * 60 * 1000;

        sessions.set(token, {
          domain,
          domainId: domainId || "",
          userId,
          bronToken: embedToken,
          createdAt: now,
          expiresAt,
        });

        console.log("[BRON Auth] Created session for domain:", domain, "domainId:", domainId, "Has embed token:", !!embedToken);

        return new Response(
          JSON.stringify({ 
            success: true, 
            token,
            domainId,
            userId,
            embedToken: embedToken, // Return embed token to client
            expiresAt,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "validate-session": {
        const token = body?.token as string;
        
        if (!token) {
          return new Response(
            JSON.stringify({ valid: false, error: "token is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        cleanExpiredSessions();
        
        const session = sessions.get(token);
        
        if (!session) {
          console.log("[BRON Auth] Session not found");
          return new Response(
            JSON.stringify({ valid: false, error: "Session not found or expired" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (session.expiresAt < Date.now()) {
          sessions.delete(token);
          return new Response(
            JSON.stringify({ valid: false, error: "Session expired" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("[BRON Auth] Session valid for domain:", session.domain);

        return new Response(
          JSON.stringify({ 
            valid: true, 
            domain: session.domain,
            domainId: session.domainId,
            userId: session.userId,
            embedToken: session.bronToken,
            expiresAt: session.expiresAt,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "revoke-session": {
        const token = body?.token as string;
        
        if (token && sessions.has(token)) {
          sessions.delete(token);
          console.log("[BRON Auth] Revoked session");
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("[BRON Auth] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
