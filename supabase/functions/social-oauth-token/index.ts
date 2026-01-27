import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TokenRequest {
  platform: 'facebook' | 'twitter' | 'linkedin';
  code: string;
  redirectUri: string;
  codeVerifier?: string; // For Twitter PKCE
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as TokenRequest;
    const { platform, code, redirectUri, codeVerifier } = body;

    console.log(`[Social OAuth] Processing ${platform} token exchange`);

    let tokenData: any;

    switch (platform) {
      case 'facebook': {
        const appId = Deno.env.get("FACEBOOK_APP_ID");
        const appSecret = Deno.env.get("FACEBOOK_APP_SECRET");

        if (!appId || !appSecret) {
          return new Response(
            JSON.stringify({ error: "Facebook app credentials not configured" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const tokenResponse = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?` +
          `client_id=${appId}&` +
          `client_secret=${appSecret}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `code=${code}`
        );
        tokenData = await tokenResponse.json();

        if (tokenData.error) {
          throw new Error(tokenData.error.message || "Facebook token exchange failed");
        }

        // Get long-lived token
        const longLivedResponse = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?` +
          `grant_type=fb_exchange_token&` +
          `client_id=${appId}&` +
          `client_secret=${appSecret}&` +
          `fb_exchange_token=${tokenData.access_token}`
        );
        const longLivedData = await longLivedResponse.json();

        if (longLivedData.access_token) {
          tokenData.access_token = longLivedData.access_token;
          tokenData.expires_in = longLivedData.expires_in || 5184000; // 60 days
        }

        // Get user profile
        const profileResponse = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`
        );
        const profile = await profileResponse.json();
        tokenData.profile = profile;
        break;
      }

      case 'twitter': {
        const clientId = Deno.env.get("TWITTER_CLIENT_ID");
        const clientSecret = Deno.env.get("TWITTER_CLIENT_SECRET");

        if (!clientId || !clientSecret) {
          return new Response(
            JSON.stringify({ error: "Twitter app credentials not configured" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Twitter uses OAuth 2.0 with PKCE
        const basicAuth = btoa(`${clientId}:${clientSecret}`);
        
        const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${basicAuth}`,
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier || "",
          }),
        });
        tokenData = await tokenResponse.json();

        if (tokenData.error) {
          throw new Error(tokenData.error_description || tokenData.error || "Twitter token exchange failed");
        }

        // Get user profile
        const profileResponse = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url,description", {
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`,
          },
        });
        const profileResult = await profileResponse.json();
        tokenData.profile = profileResult.data;
        break;
      }

      case 'linkedin': {
        const clientId = Deno.env.get("LINKEDIN_CLIENT_ID");
        const clientSecret = Deno.env.get("LINKEDIN_CLIENT_SECRET");

        if (!clientId || !clientSecret) {
          return new Response(
            JSON.stringify({ error: "LinkedIn app credentials not configured" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });
        tokenData = await tokenResponse.json();

        if (tokenData.error) {
          throw new Error(tokenData.error_description || tokenData.error || "LinkedIn token exchange failed");
        }

        // Get user profile using OpenID Connect userinfo endpoint
        const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`,
          },
        });
        const profile = await profileResponse.json();
        tokenData.profile = profile;
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unsupported platform" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log(`[Social OAuth] ${platform} token exchange successful`);

    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
        profile: tokenData.profile,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Social OAuth error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
