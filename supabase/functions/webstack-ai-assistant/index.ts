import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Usage limits in minutes
const USAGE_LIMITS = {
  free: 30, // 30 minutes total free
  basic: 300, // 5 hours per week
  business_ceo: 600, // 10 hours per week
  white_label: 1200, // 20 hours per week
  super_reseller: 2400, // 40 hours per week (unlimited practically)
  admin: -1, // Unlimited for admins (tracks but no limit)
};

// BRON API base URL for keyword research
const BRON_API_BASE = "https://public4.imagehosting.space/api/rsapi";

// SEO Tools available to the AI
const SEO_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_keyword_metrics",
      description: "Get search volume, CPC, and competition data for specific keywords. Use this when the user provides specific keywords they want to analyze.",
      parameters: {
        type: "object",
        properties: {
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "List of keywords to analyze (max 10)"
          }
        },
        required: ["keywords"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_keyword_suggestions",
      description: "Get related keyword suggestions and ideas for a seed keyword. Use this for keyword research when the user wants to find new keyword opportunities, long-tail keywords, or expand their keyword list. Returns related keywords with search volume, CPC, competition, and keyword difficulty.",
      parameters: {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description: "The seed keyword to get suggestions for (e.g., 'plumber near me', 'best running shoes')"
          },
          depth: {
            type: "integer",
            description: "Search depth (1-4). Higher = more results. 1=8 keywords, 2=72 keywords, 3=584 keywords. Default is 2.",
            enum: [1, 2, 3, 4]
          },
          limit: {
            type: "integer",
            description: "Maximum number of keywords to return (default 20, max 100)"
          }
        },
        required: ["keyword"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_domain_keywords",
      description: "Get the tracked keywords and rankings for a specific domain from the BRON SEO platform.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "The domain to get keywords for (e.g., example.com)"
          }
        },
        required: ["domain"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_serp_report",
      description: "Get SERP (Search Engine Results Page) report for a domain showing keyword positions and rankings.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "The domain to get SERP report for"
          }
        },
        required: ["domain"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_backlinks",
      description: "Get backlink information for a domain including inbound and outbound links.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "The domain to get backlinks for"
          },
          type: {
            type: "string",
            enum: ["inbound", "outbound"],
            description: "Type of links to retrieve"
          }
        },
        required: ["domain"]
      }
    }
  }
];

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
      const isAdmin = tier === 'admin';
      const limit = isAdmin ? -1 : (USAGE_LIMITS[tier as keyof typeof USAGE_LIMITS] || USAGE_LIMITS.free);
      
      return new Response(JSON.stringify({
        minutesUsed: usage,
        minutesLimit: limit,
        tier,
        canUse: isAdmin || usage < limit,
        isUnlimited: isAdmin || tier === 'super_reseller',
        isAdmin,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check usage limits - admins skip limit check but still track usage
    const usage = await getUserUsage(supabase, user.id);
    const tier = await getUserTier(supabase, user.id);
    const isAdmin = tier === 'admin';
    const limit = isAdmin ? -1 : (USAGE_LIMITS[tier as keyof typeof USAGE_LIMITS] || USAGE_LIMITS.free);

    if (!isAdmin && usage >= limit && tier !== 'super_reseller') {
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

    // First, make a non-streaming call to check for tool calls
    const toolResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tools: SEO_TOOLS,
        tool_choice: "auto",
        stream: false,
      }),
    });

    if (!toolResponse.ok) {
      console.error("Tool check failed:", await toolResponse.text());
      // Fall through to streaming response
    } else {
      const toolResult = await toolResponse.json();
      const assistantMessage = toolResult.choices?.[0]?.message;
      
      if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log("Tool calls detected:", assistantMessage.tool_calls.length);
        
        // Execute tool calls
        const toolResults = await executeToolCalls(assistantMessage.tool_calls);
        
        // Build messages with tool results
        const messagesWithTools = [
          { role: "system", content: systemPrompt },
          ...messages,
          assistantMessage,
          ...toolResults.map((result: any, index: number) => ({
            role: "tool",
            tool_call_id: assistantMessage.tool_calls[index].id,
            content: JSON.stringify(result),
          })),
        ];
        
        // Get final response with tool results (streaming)
        const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: messagesWithTools,
            stream: true,
          }),
        });

        if (!finalResponse.ok) {
          const errorText = await finalResponse.text();
          console.error("Final response error:", errorText);
          return new Response(JSON.stringify({ error: "AI service unavailable" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Track usage
        await updateUsage(supabase, user.id, 2); // Tool calls use more time

        return new Response(finalResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }
    }

    // No tool calls, proceed with normal streaming response
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

// Execute SEO tool calls
async function executeToolCalls(toolCalls: any[]): Promise<any[]> {
  const results = [];
  
  for (const toolCall of toolCalls) {
    const { name, arguments: args } = toolCall.function;
    let parsedArgs: any;
    
    try {
      parsedArgs = JSON.parse(args);
    } catch {
      parsedArgs = args;
    }
    
    console.log(`Executing tool: ${name}`, parsedArgs);
    
    try {
      switch (name) {
        case "get_keyword_metrics":
          results.push(await getKeywordMetrics(parsedArgs.keywords));
          break;
        case "get_keyword_suggestions":
          results.push(await getKeywordSuggestions(parsedArgs.keyword, parsedArgs.depth || 2, parsedArgs.limit || 20));
          break;
        case "get_domain_keywords":
          results.push(await getDomainKeywords(parsedArgs.domain));
          break;
        case "get_serp_report":
          results.push(await getSerpReport(parsedArgs.domain));
          break;
        case "get_backlinks":
          results.push(await getBacklinks(parsedArgs.domain, parsedArgs.type || "inbound"));
          break;
        default:
          results.push({ error: `Unknown tool: ${name}` });
      }
    } catch (error) {
      console.error(`Tool ${name} error:`, error);
      results.push({ error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  }
  
  return results;
}

// Get keyword metrics from DataForSEO
async function getKeywordMetrics(keywords: string[]): Promise<any> {
  const login = Deno.env.get('DATAFORSEO_LOGIN');
  const password = Deno.env.get('DATAFORSEO_PASSWORD');
  
  if (!login || !password) {
    console.log("DataForSEO not configured, returning mock data");
    return {
      message: "Keyword metrics service not fully configured. Using estimated data.",
      keywords: keywords.slice(0, 10).map(kw => ({
        keyword: kw,
        search_volume: Math.floor(Math.random() * 10000) + 100,
        cpc: +(Math.random() * 5 + 0.5).toFixed(2),
        competition: +(Math.random()).toFixed(2),
        competition_level: ["LOW", "MEDIUM", "HIGH"][Math.floor(Math.random() * 3)]
      }))
    };
  }
  
  try {
    const auth = btoa(`${login}:${password}`);
    const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        keywords: keywords.slice(0, 10),
        location_code: 2840,
        language_code: "en",
      }]),
    });

    if (!response.ok) {
      throw new Error(`DataForSEO error: ${response.status}`);
    }

    const data = await response.json();
    const metrics: Record<string, any> = {};

    if (data.tasks?.[0]?.result) {
      for (const item of data.tasks[0].result) {
        if (item.keyword) {
          metrics[item.keyword] = {
            search_volume: item.search_volume || 0,
            cpc: item.cpc || 0,
            competition: item.competition || 0,
            competition_level: item.competition_level || 'UNKNOWN',
          };
        }
      }
    }

    return { keywords: Object.entries(metrics).map(([keyword, data]) => ({ keyword, ...data })) };
  } catch (error) {
    console.error("Keyword metrics error:", error);
    return { error: "Failed to fetch keyword metrics" };
  }
}

// Get keyword suggestions from DataForSEO Labs Related Keywords API
async function getKeywordSuggestions(seedKeyword: string, depth: number = 2, limit: number = 20): Promise<any> {
  const login = Deno.env.get('DATAFORSEO_LOGIN');
  const password = Deno.env.get('DATAFORSEO_PASSWORD');
  
  if (!login || !password) {
    console.log("DataForSEO not configured");
    return {
      error: "Keyword research service not configured",
      message: "Please configure DataForSEO API credentials to enable keyword suggestions."
    };
  }
  
  try {
    const auth = btoa(`${login}:${password}`);
    console.log(`Fetching keyword suggestions for: "${seedKeyword}" with depth ${depth}`);
    
    const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        keyword: seedKeyword,
        location_code: 2840, // USA
        language_code: "en",
        depth: Math.min(depth, 3), // Cap at 3 to avoid too many results
        include_seed_keyword: true,
        limit: Math.min(limit, 100),
        order_by: ["keyword_data.keyword_info.search_volume,desc"]
      }]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DataForSEO Labs API error:", response.status, errorText);
      throw new Error(`DataForSEO API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("DataForSEO Labs response received");
    
    const result = data.tasks?.[0]?.result?.[0];
    if (!result) {
      return { 
        seed_keyword: seedKeyword,
        keywords: [],
        message: "No keyword suggestions found for this query." 
      };
    }

    // Extract keyword suggestions with all relevant data
    const keywords = (result.items || []).slice(0, limit).map((item: any) => {
      const keywordData = item.keyword_data || {};
      const keywordInfo = keywordData.keyword_info || {};
      const keywordProps = keywordData.keyword_properties || {};
      
      return {
        keyword: keywordData.keyword || '',
        search_volume: keywordInfo.search_volume || 0,
        cpc: keywordInfo.cpc || 0,
        competition: keywordInfo.competition || 0,
        competition_level: keywordInfo.competition_level || 'UNKNOWN',
        keyword_difficulty: keywordProps.keyword_difficulty || null,
        monthly_searches: keywordInfo.monthly_searches?.slice(0, 6) || [], // Last 6 months
        trend: keywordInfo.search_volume_trend || null
      };
    });

    // Get seed keyword data if available
    let seedData = null;
    if (result.seed_keyword_data) {
      const seedInfo = result.seed_keyword_data.keyword_info || {};
      const seedProps = result.seed_keyword_data.keyword_properties || {};
      seedData = {
        keyword: result.seed_keyword,
        search_volume: seedInfo.search_volume || 0,
        cpc: seedInfo.cpc || 0,
        competition: seedInfo.competition || 0,
        competition_level: seedInfo.competition_level || 'UNKNOWN',
        keyword_difficulty: seedProps.keyword_difficulty || null
      };
    }

    return {
      seed_keyword: seedKeyword,
      seed_keyword_data: seedData,
      total_found: result.total_count || keywords.length,
      keywords: keywords,
      message: `Found ${keywords.length} related keywords for "${seedKeyword}"`
    };
  } catch (error) {
    console.error("Keyword suggestions error:", error);
    return { 
      error: "Failed to fetch keyword suggestions",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

// Get domain keywords from BRON API
async function getDomainKeywords(domain: string): Promise<any> {
  const apiId = Deno.env.get("BRON_API_ID");
  const apiKey = Deno.env.get("BRON_API_KEY");
  
  if (!apiId || !apiKey) {
    return { error: "BRON API not configured", message: "SEO data service not available" };
  }
  
  try {
    const credentials = btoa(`${apiId}:${apiKey}`);
    const response = await fetch(`${BRON_API_BASE}/keywords`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ domain, page: "1", limit: "50" }).toString(),
    });

    if (!response.ok) {
      throw new Error(`BRON API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      domain,
      keywords: Array.isArray(data) ? data : (data.data || []),
      total: Array.isArray(data) ? data.length : (data.total || 0)
    };
  } catch (error) {
    console.error("Domain keywords error:", error);
    return { error: "Failed to fetch domain keywords" };
  }
}

// Get SERP report from BRON API
async function getSerpReport(domain: string): Promise<any> {
  const apiId = Deno.env.get("BRON_API_ID");
  const apiKey = Deno.env.get("BRON_API_KEY");
  
  if (!apiId || !apiKey) {
    return { error: "BRON API not configured" };
  }
  
  try {
    const credentials = btoa(`${apiId}:${apiKey}`);
    const response = await fetch(`${BRON_API_BASE}/serp-report`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ domain }).toString(),
    });

    if (!response.ok) {
      throw new Error(`BRON API error: ${response.status}`);
    }

    const data = await response.json();
    return { domain, report: data };
  } catch (error) {
    console.error("SERP report error:", error);
    return { error: "Failed to fetch SERP report" };
  }
}

// Get backlinks from BRON API
async function getBacklinks(domain: string, type: string): Promise<any> {
  const apiId = Deno.env.get("BRON_API_ID");
  const apiKey = Deno.env.get("BRON_API_KEY");
  
  if (!apiId || !apiKey) {
    return { error: "BRON API not configured" };
  }
  
  try {
    const credentials = btoa(`${apiId}:${apiKey}`);
    const endpoint = type === "outbound" ? "/links-out" : "/links-in";
    const response = await fetch(`${BRON_API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ domain }).toString(),
    });

    if (!response.ok) {
      throw new Error(`BRON API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      domain,
      type,
      links: Array.isArray(data) ? data.slice(0, 50) : (data.data?.slice(0, 50) || []),
      total: Array.isArray(data) ? data.length : (data.total || 0)
    };
  } catch (error) {
    console.error("Backlinks error:", error);
    return { error: "Failed to fetch backlinks" };
  }
}

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
  // Check user_roles for admin status - admins get unlimited free usage
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  // Check for any admin role
  const roles = roleData?.map((r: any) => r.role) || [];
  if (roles.includes('super_admin')) return 'admin'; // Full unlimited for super admins
  if (roles.includes('admin')) return 'admin'; // Full unlimited for admins
  if (roles.includes('white_label_admin')) return 'white_label';

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
  
  // First check if record exists
  const { data: existing } = await supabase
    .from('ai_assistant_usage')
    .select('minutes_used')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single();

  if (existing) {
    // Update existing record
    await supabase
      .from('ai_assistant_usage')
      .update({ 
        minutes_used: existing.minutes_used + minutes,
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('week_start', weekStart);
  } else {
    // Insert new record
    await supabase
      .from('ai_assistant_usage')
      .insert({
        user_id: userId,
        week_start: weekStart,
        minutes_used: minutes,
        updated_at: new Date().toISOString(),
      });
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
  let prompt = `You are Webstack.ceo AI Assistant - an expert SEO consultant, keyword researcher, and website troubleshooter. You have access to REAL SEO data tools powered by DataForSEO and can perform actual keyword research with live data.

## Your Capabilities:

### 1. **Keyword Research & Suggestions** (POWERED BY DATAFORSEO LABS)
- Use **get_keyword_suggestions** to find related keywords, long-tail variations, and new opportunities from a seed keyword
- Each suggestion includes: search volume, CPC, competition level, and keyword difficulty
- Great for: content planning, finding low-competition opportunities, expanding keyword lists
- Use **get_keyword_metrics** to get detailed data for specific keywords the user provides

### 2. **Domain Analysis** (POWERED BY BRON SEO)
- Check tracked keywords and SERP rankings for connected domains
- Get backlink information (inbound and outbound links)
- Review domain authority and traffic metrics

### 3. **Domain Onboarding**
- Guide users through setting up domains, connecting Google services
- Help configure SEO tools and tracking

### 4. **Troubleshooting**
- Diagnose website issues, SEO problems, indexation issues
- Provide technical recommendations

## Guidelines:
- **ALWAYS USE TOOLS** for keyword research - never make up data
- Use get_keyword_suggestions when users want to discover new keywords around a topic
- Use get_keyword_metrics when users provide specific keywords they want analyzed
- Format keyword data in clear markdown tables when presenting results
- Include keyword difficulty, search volume, and CPC in your analysis
- Provide actionable recommendations based on the data
- Highlight low-competition, high-volume opportunities

Current user: ${userEmail || 'Anonymous'}
`;

  if (domainContext.domains && domainContext.domains.length > 0) {
    prompt += `\n\n**User's Connected Domains:**\n`;
    domainContext.domains.forEach((d: any) => {
      prompt += `- ${d.domain} (${d.verification_status})\n`;
    });
  }

  if (domainContext.gscData && domainContext.gscData.length > 0) {
    prompt += `\n\n**Recent Keyword Data (from Google Search Console):**\n`;
    domainContext.gscData.slice(0, 15).forEach((k: any) => {
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
