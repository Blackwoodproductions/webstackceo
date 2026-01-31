import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Usage limits in minutes
const USAGE_LIMITS = {
  free: 30, // 30 minutes total free
  basic: 300, // 5 hours per week
  business_ceo: 600, // 10 hours per week
  white_label: 1200, // 20 hours per week
  super_reseller: 2400, // 40 hours per week (unlimited practically)
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, conversationId, domain, checkUsage } = await req.json();

    // Check usage only mode
    if (checkUsage) {
      const usage = await getUserUsage(supabase, user.id);
      const tier = await getUserTier(supabase, user.id);
      const limit = USAGE_LIMITS[tier as keyof typeof USAGE_LIMITS] || USAGE_LIMITS.free;
      
      return new Response(JSON.stringify({
        minutesUsed: usage,
        minutesLimit: limit,
        tier,
        canUse: usage < limit,
        isUnlimited: tier === 'super_reseller',
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check usage limits
    const usage = await getUserUsage(supabase, user.id);
    const tier = await getUserTier(supabase, user.id);
    const limit = USAGE_LIMITS[tier as keyof typeof USAGE_LIMITS] || USAGE_LIMITS.free;

    if (usage >= limit && tier !== 'super_reseller') {
      return new Response(JSON.stringify({ 
        error: "Usage limit reached",
        minutesUsed: usage,
        minutesLimit: limit,
        tier,
        upgradeRequired: true,
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's domains and GSC data for context
    const domainContext = await getUserDomainContext(supabase, user.id, domain);

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(domainContext, user.email);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Track usage (estimate 1 minute per interaction)
    await updateUsage(supabase, user.id, 1);

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getUserUsage(supabase: any, userId: string): Promise<number> {
  const weekStart = getWeekStart();
  const { data } = await supabase
    .from('ai_assistant_usage')
    .select('minutes_used')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single();
  
  return data?.minutes_used || 0;
}

async function getUserTier(supabase: any, userId: string): Promise<string> {
  // Check user_roles for admin status
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (roleData?.role === 'super_admin') return 'super_reseller';
  if (roleData?.role === 'admin') return 'white_label';

  // Check domain subscriptions
  const { data: subscriptions } = await supabase
    .from('domain_subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  if (subscriptions && subscriptions.length > 0) {
    const tier = subscriptions[0].tier;
    if (tier === 'super_reseller') return 'super_reseller';
    if (tier === 'white_label') return 'white_label';
    if (tier === 'business_ceo') return 'business_ceo';
    if (tier === 'basic') return 'basic';
  }

  return 'free';
}

async function updateUsage(supabase: any, userId: string, minutes: number) {
  const weekStart = getWeekStart();
  
  // Upsert usage
  const { error } = await supabase
    .from('ai_assistant_usage')
    .upsert({
      user_id: userId,
      week_start: weekStart,
      minutes_used: minutes,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,week_start',
    });

  if (error) {
    // If upsert failed, try to update existing
    await supabase
      .from('ai_assistant_usage')
      .update({ 
        minutes_used: supabase.rpc('increment_minutes', { row_user_id: userId, inc: minutes }),
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('week_start', weekStart);
  }
}

function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}

async function getUserDomainContext(supabase: any, userId: string, selectedDomain?: string) {
  const context: any = { domains: [], gscData: null, auditData: null };

  // Get user's domains
  const { data: domains } = await supabase
    .from('user_domains')
    .select('domain, verification_status, created_at')
    .eq('user_id', userId);

  context.domains = domains || [];

  if (selectedDomain) {
    // Get GSC data if available
    const { data: gscData } = await supabase
      .from('keyword_ranking_history')
      .select('keyword, google_position, search_volume, cpc')
      .eq('domain', selectedDomain)
      .order('snapshot_at', { ascending: false })
      .limit(50);

    context.gscData = gscData;

    // Get audit data
    const { data: auditData } = await supabase
      .from('saved_audits')
      .select('*')
      .eq('domain', selectedDomain)
      .single();

    context.auditData = auditData;

    // Get domain context
    const { data: domainContext } = await supabase
      .from('domain_contexts')
      .select('*')
      .eq('domain', selectedDomain)
      .eq('user_id', userId)
      .single();

    context.domainContext = domainContext;
  }

  return context;
}

function buildSystemPrompt(domainContext: any, userEmail?: string): string {
  let prompt = `You are Webstack.ceo AI Assistant - an expert SEO consultant, keyword researcher, and website troubleshooter. You help users with:

1. **Keyword Research**: Analyze domains, suggest keywords, identify opportunities, and provide search volume insights
2. **Domain Onboarding**: Guide users through setting up their domains, connecting Google services, and configuring SEO tools
3. **Troubleshooting**: Diagnose website issues, SEO problems, indexation issues, and technical SEO concerns
4. **Strategic Advice**: Provide actionable SEO recommendations based on the user's data

Always be helpful, specific, and actionable. When discussing keywords, provide context about competition and opportunity.

Current user: ${userEmail || 'Anonymous'}
`;

  if (domainContext.domains && domainContext.domains.length > 0) {
    prompt += `\n\n**User's Domains:**\n`;
    domainContext.domains.forEach((d: any) => {
      prompt += `- ${d.domain} (${d.verification_status})\n`;
    });
  }

  if (domainContext.gscData && domainContext.gscData.length > 0) {
    prompt += `\n\n**Recent Keyword Data (from Google Search Console):**\n`;
    domainContext.gscData.slice(0, 20).forEach((k: any) => {
      prompt += `- "${k.keyword}": Position ${k.google_position || 'N/A'}, Volume: ${k.search_volume || 'N/A'}\n`;
    });
  }

  if (domainContext.auditData) {
    const audit = domainContext.auditData;
    prompt += `\n\n**Domain Audit Summary:**
- Domain Rating: ${audit.domain_rating || 'N/A'}
- Organic Traffic: ${audit.organic_traffic || 'N/A'}
- Backlinks: ${audit.backlinks || 'N/A'}
- Referring Domains: ${audit.referring_domains || 'N/A'}
`;
  }

  if (domainContext.domainContext) {
    const ctx = domainContext.domainContext;
    prompt += `\n\n**Business Context:**
- Business: ${ctx.business_name || 'N/A'}
- Primary Keyword: ${ctx.primary_keyword || 'N/A'}
- Services: ${ctx.services_offered?.join(', ') || 'N/A'}
- Service Areas: ${ctx.service_areas?.join(', ') || 'N/A'}
`;
  }

  return prompt;
}
