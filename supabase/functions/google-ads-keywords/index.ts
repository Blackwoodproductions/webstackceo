import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accessToken, customerId, refreshToken, code, redirectUri } = await req.json();

    console.log('[Google Ads] Action:', action);

    // Exchange authorization code for tokens
    if (action === 'exchange-code') {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        throw new Error('Google OAuth credentials not configured');
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('[Google Ads] Token exchange response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || 'Failed to exchange code');
      }

      return new Response(JSON.stringify({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get accessible customer accounts
    if (action === 'list-customers') {
      if (!accessToken) {
        throw new Error('Access token required');
      }

      // Note: Google Ads API requires a developer token for full access
      // For now, we'll return a simulated response for the UI demo
      // In production, you would need to apply for a Google Ads API developer token
      
      console.log('[Google Ads] Listing accessible customers (demo mode)');
      
      // Simulated customer accounts for demo
      const demoCustomers = [
        { id: 'demo-123-456-7890', name: 'Demo Account', currencyCode: 'USD' },
      ];

      return new Response(JSON.stringify({
        customers: demoCustomers,
        isDemo: true,
        message: 'Demo mode - Google Ads API developer token required for production',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get active keywords from campaigns
    if (action === 'get-keywords') {
      const body = await req.json().catch(() => ({}));
      const domain = body.domain;
      
      if (!accessToken || !customerId) {
        throw new Error('Access token and customer ID required');
      }

      console.log('[Google Ads] Fetching keywords for customer:', customerId, 'domain:', domain);

      // In production, this would query the Google Ads API with proper developer token
      // For demo accounts (customerId starts with "demo"), always prompt to set up campaign
      // This allows users to add their own domain and keywords through the wizard
      const isDemoAccount = customerId.startsWith('demo');
      
      if (isDemoAccount) {
        console.log('[Google Ads] Demo account detected - prompting campaign setup for domain:', domain);
        return new Response(JSON.stringify({
          keywords: [],
          summary: null,
          hasCampaigns: false,
          isDemo: true,
          isDemoAccount: true,
          message: `No active campaigns found for ${domain || 'your domain'}. Set up your first campaign to start generating landing pages.`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Simulated keywords for demo
      const demoKeywords = [
        { id: 'kw-1', text: 'best seo tools', matchType: 'BROAD', avgCpc: 4.50, impressions: 12500, clicks: 450, qualityScore: 6 },
        { id: 'kw-2', text: 'seo software for agencies', matchType: 'PHRASE', avgCpc: 8.20, impressions: 8200, clicks: 320, qualityScore: 5 },
        { id: 'kw-3', text: 'automated link building', matchType: 'EXACT', avgCpc: 12.30, impressions: 4500, clicks: 180, qualityScore: 4 },
        { id: 'kw-4', text: 'website audit tool', matchType: 'BROAD', avgCpc: 6.80, impressions: 9800, clicks: 290, qualityScore: 7 },
        { id: 'kw-5', text: 'domain authority checker', matchType: 'PHRASE', avgCpc: 5.10, impressions: 15200, clicks: 580, qualityScore: 8 },
        { id: 'kw-6', text: 'backlink analysis software', matchType: 'EXACT', avgCpc: 9.40, impressions: 6100, clicks: 210, qualityScore: 5 },
        { id: 'kw-7', text: 'local seo services', matchType: 'BROAD', avgCpc: 15.60, impressions: 22000, clicks: 890, qualityScore: 6 },
        { id: 'kw-8', text: 'google ads management', matchType: 'PHRASE', avgCpc: 18.20, impressions: 11500, clicks: 420, qualityScore: 7 },
        { id: 'kw-9', text: 'ppc landing page builder', matchType: 'EXACT', avgCpc: 7.90, impressions: 5400, clicks: 165, qualityScore: 4 },
        { id: 'kw-10', text: 'conversion rate optimization', matchType: 'BROAD', avgCpc: 11.50, impressions: 8900, clicks: 310, qualityScore: 6 },
      ];

      // Calculate potential savings
      const totalSpend = demoKeywords.reduce((sum, kw) => sum + (kw.avgCpc * kw.clicks), 0);
      const avgQualityScore = demoKeywords.reduce((sum, kw) => sum + kw.qualityScore, 0) / demoKeywords.length;
      const potentialSavings = totalSpend * 0.35; // Estimated 35% savings with optimized pages

      return new Response(JSON.stringify({
        keywords: demoKeywords,
        summary: {
          totalKeywords: demoKeywords.length,
          avgQualityScore: avgQualityScore.toFixed(1),
          estimatedMonthlySpend: totalSpend.toFixed(2),
          potentialMonthlySavings: potentialSavings.toFixed(2),
        },
        hasCampaigns: true,
        isDemo: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Suggest keywords based on website URL
    if (action === 'suggest-keywords') {
      const { websiteUrl } = await req.json().catch(() => ({}));
      
      console.log('[Google Ads] Generating keyword suggestions for:', websiteUrl);

      // In production, this would use Google Ads Keyword Planner API
      // For demo, we generate suggestions based on the domain
      const domainName = (websiteUrl || '')
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('.')[0]
        .replace(/[^a-zA-Z]/g, ' ')
        .trim();

      const suggestions = [
        `${domainName} services`,
        `best ${domainName}`,
        `${domainName} near me`,
        `${domainName} company`,
        `professional ${domainName}`,
        `${domainName} solutions`,
        `affordable ${domainName}`,
        `top ${domainName} provider`,
      ].filter(s => s.length < 50);

      return new Response(JSON.stringify({
        suggestions,
        isDemo: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a new campaign with keywords
    if (action === 'create-campaign') {
      const { campaign } = await req.json().catch(() => ({}));
      
      console.log('[Google Ads] Creating campaign:', campaign?.name);

      // In production, this would use Google Ads API to create:
      // 1. A new campaign
      // 2. An ad group
      // 3. Keywords for the ad group
      // 4. Responsive search ads

      // For demo, we simulate success
      return new Response(JSON.stringify({
        success: true,
        campaignId: `campaign-${Date.now()}`,
        message: 'Campaign created successfully (demo mode)',
        isDemo: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate landing pages for keywords
    if (action === 'generate-pages') {
      const { keywords, domain, options } = await req.json();
      
      console.log('[Google Ads] Generating pages for', keywords?.length, 'keywords');

      // Simulated page generation response
      const generatedPages = (keywords || []).map((kw: any, index: number) => ({
        keywordId: kw.id,
        keyword: kw.text,
        pageUrl: `https://${domain}/lp/${kw.text.replace(/\s+/g, '-').toLowerCase()}`,
        status: 'pending',
        estimatedQualityScore: Math.min(10, (kw.qualityScore || 5) + 3),
        abVariants: ['A', 'B'],
        createdAt: new Date().toISOString(),
      }));

      return new Response(JSON.stringify({
        pages: generatedPages,
        message: `${generatedPages.length} landing pages queued for generation`,
        isDemo: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('[Google Ads] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
