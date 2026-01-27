import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory session store (in production, use database)
// Sessions expire after 24 hours
const sessions = new Map<string, { 
  domain: string; 
  domainId: string;
  userId: string;
  createdAt: number; 
  expiresAt: number;
}>();

// Generate a secure random token
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

// BRON API to verify domain is registered
const BRON_API = "https://public.imagehosting.space/feed/Article.php";
const BRON_API_ID = "53084";
const BRON_API_KEY = "347819526879185";
const BRON_KKYY = "AKhpU6QAbMtUDTphRPCezo96CztR9EXR";

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

serve(async (req) => {
  // Handle CORS preflight
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
        
        if (!domain) {
          return new Response(
            JSON.stringify({ success: false, error: "domain is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify the domain is registered with BRON
        const verification = await verifyDomainWithBRON(domain);
        
        if (!verification.valid) {
          return new Response(
            JSON.stringify({ success: false, error: "Domain not found in BRON" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Clean old sessions
        cleanExpiredSessions();

        // Generate token and create session
        const token = generateToken();
        const now = Date.now();
        const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

        sessions.set(token, {
          domain,
          domainId: verification.domainId || "",
          userId: verification.userId || "",
          createdAt: now,
          expiresAt,
        });

        console.log("[BRON Auth] Created session for domain:", domain, "Token:", token.substring(0, 8) + "...");

        return new Response(
          JSON.stringify({ 
            success: true, 
            token,
            domainId: verification.domainId,
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
          console.log("[BRON Auth] Session not found for token:", token.substring(0, 8) + "...");
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
          JSON.stringify({ error: "Invalid action. Use: create-session, validate-session, or revoke-session" }),
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
