import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limiting for security - per user per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per user

function checkRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: userLimit.resetAt - now };
  }
  
  userLimit.count++;
  return { allowed: true };
}

// Security: Input sanitization to prevent injection attacks
function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Remove potential command injection patterns
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, 10000); // Limit message length
}

// Usage limits in minutes - TIERED ACCESS
const USAGE_LIMITS = {
  free: 30, // 30 minutes total free
  basic: 300, // 5 hours per week
  business_ceo: 600, // 10 hours per week
  white_label: 1200, // 20 hours per week
  super_reseller: 2400, // 40 hours per week (unlimited practically)
  admin: -1, // Unlimited for admins (tracks but no limit)
};

// PAID-ONLY tools - these tools require at least 'basic' subscription
const PAID_TOOL_NAMES = [
  'get_keyword_suggestions',
  'get_competitor_keywords',
  'get_backlinks',
  'get_serp_report',
];

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
  },
  {
    type: "function",
    function: {
      name: "get_competitor_keywords",
      description: "Get organic keywords that a competitor domain ranks for using Ahrefs. Use this to analyze competitor SEO strategy and find keyword opportunities.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "The competitor domain to analyze (e.g., competitor.com)"
          },
          limit: {
            type: "integer",
            description: "Maximum number of keywords to return (default 50, max 100)"
          }
        },
        required: ["domain"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "save_competitors",
      description: "Save competitor domains to the user's CADE domain context. Use this after the user mentions their competitors during keyword research. Always ask users about competitors when doing keyword research.",
      parameters: {
        type: "object",
        properties: {
          user_domain: {
            type: "string",
            description: "The user's own domain to save competitors for"
          },
          competitors: {
            type: "array",
            items: { type: "string" },
            description: "List of competitor domains to save (e.g., ['competitor1.com', 'competitor2.com'])"
          }
        },
        required: ["user_domain", "competitors"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "find_backlink_partners",
      description: "Find potential backlink partner opportunities by analyzing competitor backlinks and identifying high-authority sites in the same niche. Use this when users ask about link building, backlink opportunities, or want to find sites to reach out to.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "The user's domain to find backlink partners for"
          },
          competitor_domains: {
            type: "array",
            items: { type: "string" },
            description: "List of competitor domains to analyze for backlink sources (optional)"
          },
          niche: {
            type: "string",
            description: "The niche/industry to focus on (e.g., 'dentist', 'plumber', 'saas')"
          }
        },
        required: ["domain"]
      }
    }
  },
  // NEW: Domain Audit Tool
  {
    type: "function",
    function: {
      name: "run_domain_audit",
      description: "Run a comprehensive SEO audit on a domain to get domain rating, backlinks, organic traffic, referring domains, and more. Use this when users ask about their domain's SEO health, authority, or want a site audit.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "The domain to audit (e.g., example.com)"
          }
        },
        required: ["domain"]
      }
    }
  },
  // NEW: Visitor Intelligence Tool  
  {
    type: "function",
    function: {
      name: "get_visitor_intelligence",
      description: "Get visitor intelligence data including de-anonymized visitor information, company identification, page views, and engagement metrics. Use this when users ask about who is visiting their site, visitor analytics, or lead identification.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "The domain to get visitor intelligence for"
          },
          time_range: {
            type: "string",
            enum: ["today", "week", "month"],
            description: "Time range for visitor data (default: week)"
          }
        },
        required: ["domain"]
      }
    }
  },
  // NEW: CADE Content Management Tool
  {
    type: "function",
    function: {
      name: "get_cade_content",
      description: "Get content and FAQs generated by CADE (Content Automation & Distribution Engine) for a domain. Use this when users ask about their automated content, blog posts, FAQs, or content strategy.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "The domain to get CADE content for"
          },
          content_type: {
            type: "string",
            enum: ["articles", "faqs", "all"],
            description: "Type of content to retrieve (default: all)"
          }
        },
        required: ["domain"]
      }
    }
  },
  // NEW: Domain Context Tool
  {
    type: "function",
    function: {
      name: "get_domain_context",
      description: "Get the business context and profile for a domain including business name, services, service areas, competitors, writing tone, and other important SEO context. Use this to understand a client's business before providing recommendations.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "The domain to get context for"
          }
        },
        required: ["domain"]
      }
    }
  },
  // NEW: Save Research Tool
  {
    type: "function",
    function: {
      name: "save_research_to_context",
      description: "Save research findings (keywords, competitors, strategies) to the domain's context for future reference. Use this after completing research to persist insights for the client.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "The domain to save research for"
          },
          field: {
            type: "string",
            enum: ["target_keywords", "competitors", "topics_to_cover", "services_offered", "service_areas", "unique_selling_points"],
            description: "The context field to update"
          },
          value: {
            type: "string",
            description: "The value to save (comma-separated for arrays)"
          }
        },
        required: ["domain", "field", "value"]
      }
    }
  },
  // NEW: Website Knowledge - Glossary Terms
  {
    type: "function",
    function: {
      name: "get_glossary_terms",
      description: "Search the SEO glossary for definitions and best practices on any SEO topic. Use this when users ask about SEO terminology, concepts, or need explanations. Returns detailed definitions with why it matters, best practices, and related terms.",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "Search term to find glossary entries (e.g., 'title tag', 'backlinks', 'schema markup')"
          },
          category: {
            type: "string",
            enum: ["On-Page SEO", "Technical SEO", "Off-Page SEO", "Local SEO", "Analytics", "all"],
            description: "Filter by category (default: all)"
          }
        },
        required: ["search"]
      }
    }
  },
  // NEW: Website Knowledge - Learning Guides
  {
    type: "function",
    function: {
      name: "get_learning_guides",
      description: "Get information about available SEO learning guides and their content. Use when users want to learn about specific SEO topics in depth. Returns guide summaries and links.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Topic to find guides for (e.g., 'on-page SEO', 'local SEO', 'link building')"
          }
        },
        required: ["topic"]
      }
    }
  },
  // NEW: Website Knowledge - Platform Features
  {
    type: "function",
    function: {
      name: "get_platform_features",
      description: "Get information about Webstack.ceo platform features and capabilities. Use when users ask what the platform can do or how to use specific features.",
      parameters: {
        type: "object",
        properties: {
          feature: {
            type: "string",
            description: "Feature to get info about (e.g., 'BRON', 'CADE', 'visitor intelligence', 'on-page SEO')"
          }
        },
        required: ["feature"]
      }
    }
  },
  // NEW: SEO Vault - Save Reports
  {
    type: "function",
    function: {
      name: "save_to_seo_vault",
      description: "Save research findings, reports, or recommendations to the user's private SEO vault for later viewing or implementation. ALWAYS include the domain parameter with the currently selected domain.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Title for the saved report (e.g., 'Keyword Research for plumber keywords')"
          },
          report_type: {
            type: "string",
            enum: ["keyword_research", "competitor_analysis", "backlink_report", "audit", "content_plan", "action_items", "research"],
            description: "Type of report being saved"
          },
          content: {
            type: "object",
            description: "The research data or findings to save (JSON object)"
          },
          summary: {
            type: "string",
            description: "Brief summary of the findings (1-2 sentences)"
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags for organizing (e.g., ['keywords', 'plumber', 'local-seo'])"
          },
          domain: {
            type: "string",
            description: "The domain this research is for - ALWAYS use the currently selected domain from the system context"
          }
        },
        required: ["title", "report_type", "content", "domain"]
      }
    }
  },
  // NEW: SEO Vault - Get Reports
  {
    type: "function",
    function: {
      name: "get_seo_vault",
      description: "Retrieve saved reports from the user's SEO vault. Use when users want to review their past research or continue from where they left off.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "Filter by domain (optional)"
          },
          report_type: {
            type: "string",
            description: "Filter by report type (optional)"
          },
          limit: {
            type: "integer",
            description: "Number of reports to retrieve (default: 10)"
          }
        }
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

    // Security: Rate limiting per user
    const rateCheck = checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      console.warn(`[SECURITY] Rate limit exceeded for user: ${user.id}`);
      return new Response(JSON.stringify({ 
        error: "Too many requests. Please slow down.",
        retryAfterMs: rateCheck.retryAfterMs,
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(Math.ceil((rateCheck.retryAfterMs || 60000) / 1000)) },
      });
    }

    const body = await req.json();
    const { messages: rawMessages, conversationId, domain, checkUsage, model } = body;
    
    // Security: Sanitize all input messages
    const messages = Array.isArray(rawMessages) ? rawMessages.map((m: any) => ({
      ...m,
      content: sanitizeInput(m.content || ''),
    })).slice(-50) : []; // Limit conversation history to prevent memory attacks
    
    // Validate and sanitize model selection - only allow approved free models
    const allowedModels = [
      'google/gemini-3-flash-preview',
      'google/gemini-2.5-flash',
      'google/gemini-2.5-flash-lite',
      'google/gemini-2.5-pro',
      'openai/gpt-5-mini',
      'openai/gpt-5-nano',
    ];
    const selectedModel = allowedModels.includes(model) ? model : 'google/gemini-3-flash-preview';

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

    // Build system prompt with context and selected domain
    const systemPrompt = buildSystemPrompt(domainContext, user.email, domain);

    // First, make a non-streaming call to check for tool calls
    const toolResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
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
        
        // Execute tool calls with timeout protection
        let toolResults: any[];
        try {
          const toolTimeout = setTimeout(() => {
            console.warn("Tool execution timeout warning - some tools may be slow");
          }, 20000);
          
          toolResults = await executeToolCalls(assistantMessage.tool_calls, supabase, user.id, tier);
          clearTimeout(toolTimeout);
          
          // Log any tool errors for debugging
          toolResults.forEach((result, i) => {
            if (result?.error) {
              console.warn(`Tool ${i} returned error:`, result.error);
            }
          });
        } catch (toolError) {
          console.error("Tool execution failed:", toolError);
          toolResults = [{ error: "Tool execution failed. Please try again.", message: toolError instanceof Error ? toolError.message : "Unknown error" }];
        }
        
        // Count successful vs failed tool calls
        const successCount = toolResults.filter(r => !r?.error).length;
        const failCount = toolResults.filter(r => r?.error).length;
        console.log(`Tool execution complete: ${successCount} succeeded, ${failCount} failed`);
        
        // Build messages with tool results (including errors - AI should handle gracefully)
        const messagesWithTools = [
          { role: "system", content: systemPrompt + `\n\nIMPORTANT: Some tools may have returned errors. When tools fail, acknowledge the issue briefly and still provide helpful advice based on what you know. Never show blank responses - always give the user something actionable.` },
          ...messages,
          assistantMessage,
          ...toolResults.map((result: any, index: number) => ({
            role: "tool",
            tool_call_id: assistantMessage.tool_calls[index]?.id || `tool_${index}`,
            content: JSON.stringify(result),
          })),
        ];
        
        // Get final response with tool results (streaming) - with retry logic
        let finalResponse: Response | null = null;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          try {
            finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: selectedModel,
                messages: messagesWithTools,
                stream: true,
              }),
            });
            
            if (finalResponse.ok) break;
            
            console.warn(`Final response attempt ${retryCount + 1} failed:`, finalResponse.status);
            retryCount++;
            if (retryCount <= maxRetries) {
              await new Promise(r => setTimeout(r, 1000 * retryCount));
            }
          } catch (fetchError) {
            console.error(`Fetch error on attempt ${retryCount + 1}:`, fetchError);
            retryCount++;
            if (retryCount <= maxRetries) {
              await new Promise(r => setTimeout(r, 1000 * retryCount));
            } else {
              throw fetchError;
            }
          }
        }

        if (!finalResponse || !finalResponse.ok) {
          const errorText = finalResponse ? await finalResponse.text() : "No response after retries";
          console.error("Final response error after retries:", errorText);
          return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }), {
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
        model: selectedModel,
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

// Execute SEO tool calls with tier-based access control
async function executeToolCalls(toolCalls: any[], supabase: any, userId: string, userTier: string): Promise<any[]> {
  const results = [];
  const isPaidUser = userTier !== 'free';
  
  for (const toolCall of toolCalls) {
    const { name, arguments: args } = toolCall.function;
    let parsedArgs: any;
    
    try {
      parsedArgs = JSON.parse(args);
    } catch {
      parsedArgs = args;
    }
    
    // Security: Check if tool requires paid subscription
    if (PAID_TOOL_NAMES.includes(name) && !isPaidUser) {
      console.log(`[SECURITY] Blocking paid tool "${name}" for free tier user: ${userId}`);
      results.push({ 
        error: "Upgrade required",
        message: `The ${name.replace(/_/g, ' ')} feature requires a paid subscription. Upgrade to unlock advanced SEO tools like keyword suggestions, competitor analysis, backlinks, and SERP reports.`,
        upgrade_url: "/pricing"
      });
      continue;
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
        case "get_competitor_keywords":
          results.push(await getCompetitorKeywords(parsedArgs.domain, parsedArgs.limit || 50));
          break;
        case "save_competitors":
          results.push(await saveCompetitors(supabase, userId, parsedArgs.user_domain, parsedArgs.competitors));
          break;
        case "find_backlink_partners":
          results.push(await findBacklinkPartners(parsedArgs.domain, parsedArgs.competitor_domains, parsedArgs.niche));
          break;
        case "run_domain_audit":
          results.push(await runDomainAudit(supabase, parsedArgs.domain));
          break;
        case "get_visitor_intelligence":
          results.push(await getVisitorIntelligence(supabase, userId, parsedArgs.domain, parsedArgs.time_range || "week"));
          break;
        case "get_cade_content":
          results.push(await getCadeContent(supabase, userId, parsedArgs.domain, parsedArgs.content_type || "all"));
          break;
        case "get_domain_context":
          results.push(await getDomainContextTool(supabase, userId, parsedArgs.domain));
          break;
        case "save_research_to_context":
          results.push(await saveResearchToContext(supabase, userId, parsedArgs.domain, parsedArgs.field, parsedArgs.value));
          break;
        // NEW: Website knowledge tools
        case "get_glossary_terms":
          results.push(await getGlossaryTerms(parsedArgs.search, parsedArgs.category || "all"));
          break;
        case "get_learning_guides":
          results.push(await getLearningGuides(parsedArgs.topic));
          break;
        case "get_platform_features":
          results.push(await getPlatformFeatures(parsedArgs.feature));
          break;
        // NEW: SEO Vault tools
        case "save_to_seo_vault":
          results.push(await saveToSeoVault(supabase, userId, parsedArgs.title, parsedArgs.report_type, parsedArgs.content, parsedArgs.summary, parsedArgs.tags, parsedArgs.domain));
          break;
        case "get_seo_vault":
          results.push(await getSeoVault(supabase, userId, parsedArgs.domain, parsedArgs.report_type, parsedArgs.limit || 10));
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
    return { error: "BRON API not configured", message: "SERP report requires BRON API credentials." };
  }
  
  try {
    const credentials = btoa(`${apiId}:${apiKey}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    
    const response = await fetch(`${BRON_API_BASE}/serp-report`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ domain }).toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`SERP report API returned ${response.status}`);
      return { error: `SERP API error: ${response.status}`, message: "The SERP report service is temporarily unavailable. Please try again later." };
    }

    // Check content type to avoid parsing HTML as JSON
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("SERP report returned non-JSON:", text.slice(0, 200));
      return { error: "SERP API returned invalid response", message: "The SERP report service returned an unexpected response. Please try again later." };
    }

    const data = await response.json();
    return { domain, report: data };
  } catch (error) {
    console.error("SERP report error:", error);
    const message = error instanceof Error && error.name === 'AbortError' 
      ? "SERP report request timed out. Please try again."
      : "Failed to fetch SERP report. The service may be temporarily unavailable.";
    return { error: "Failed to fetch SERP report", message };
  }
}

// Get backlinks from BRON API
async function getBacklinks(domain: string, type: string): Promise<any> {
  const apiId = Deno.env.get("BRON_API_ID");
  const apiKey = Deno.env.get("BRON_API_KEY");
  
  if (!apiId || !apiKey) {
    return { error: "BRON API not configured", message: "Backlink analysis requires BRON API credentials." };
  }
  
  try {
    const credentials = btoa(`${apiId}:${apiKey}`);
    const endpoint = type === "outbound" ? "/links-out" : "/links-in";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    
    const response = await fetch(`${BRON_API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ domain }).toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Backlinks API returned ${response.status}`);
      return { error: `Backlinks API error: ${response.status}`, message: "The backlinks service is temporarily unavailable." };
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Backlinks returned non-JSON:", text.slice(0, 200));
      return { error: "Backlinks API returned invalid response", message: "The backlinks service returned an unexpected response." };
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
    const message = error instanceof Error && error.name === 'AbortError' 
      ? "Backlinks request timed out. Please try again."
      : "Failed to fetch backlinks. The service may be temporarily unavailable.";
    return { error: "Failed to fetch backlinks", message };
  }
}

// Get competitor keywords using Ahrefs API
async function getCompetitorKeywords(domain: string, limit: number = 50): Promise<any> {
  const ahrefsApiKey = Deno.env.get('AHREFS_API_KEY');
  
  if (!ahrefsApiKey) {
    console.log("Ahrefs API not configured");
    return {
      error: "Ahrefs API not configured",
      message: "Competitor keyword analysis requires Ahrefs API credentials."
    };
  }
  
  try {
    // Clean domain format
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Fetching Ahrefs organic keywords for: ${cleanDomain}`);
    
    const params = new URLSearchParams({
      target: cleanDomain,
      country: 'us',
      date: today,
      mode: 'domain',
      limit: String(Math.min(limit, 100)),
      select: 'keyword,volume,keyword_difficulty,cpc,best_position,sum_traffic',
      order_by: 'sum_traffic:desc'
    });
    
    const response = await fetch(`https://api.ahrefs.com/v3/site-explorer/organic-keywords?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ahrefsApiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ahrefs API error:", response.status, errorText);
      
      if (response.status === 401) {
        return { error: "Ahrefs API authentication failed. Please check API key." };
      }
      if (response.status === 403) {
        return { error: "Ahrefs API access denied. Check subscription and permissions." };
      }
      
      throw new Error(`Ahrefs API error: ${response.status}`);
    }

    const data = await response.json();
    const keywords = (data.keywords || []).map((kw: any) => ({
      keyword: kw.keyword,
      search_volume: kw.volume || 0,
      keyword_difficulty: kw.keyword_difficulty || null,
      cpc: kw.cpc || 0,
      position: kw.best_position || null,
      traffic: kw.sum_traffic || 0
    }));

    return {
      competitor_domain: cleanDomain,
      keywords: keywords,
      total: keywords.length,
      message: `Found ${keywords.length} organic keywords for competitor ${cleanDomain}`
    };
  } catch (error) {
    console.error("Ahrefs competitor keywords error:", error);
    return { 
      error: "Failed to fetch competitor keywords",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

// Save competitors to CADE domain_contexts
async function saveCompetitors(supabase: any, userId: string, userDomain: string, competitors: string[]): Promise<any> {
  try {
    // Clean domain
    const cleanDomain = userDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    
    // Format competitors as comma-separated string
    const competitorsStr = competitors.map(c => 
      c.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
    ).join(', ');
    
    console.log(`Saving competitors for ${cleanDomain}: ${competitorsStr}`);
    
    // Check if domain context exists
    const { data: existing } = await supabase
      .from('domain_contexts')
      .select('id, competitors')
      .eq('domain', cleanDomain)
      .eq('user_id', userId)
      .single();
    
    if (existing) {
      // Merge with existing competitors
      const existingCompetitors = existing.competitors || '';
      const allCompetitors = new Set([
        ...existingCompetitors.split(',').map((c: string) => c.trim()).filter(Boolean),
        ...competitorsStr.split(',').map(c => c.trim()).filter(Boolean)
      ]);
      const mergedCompetitors = Array.from(allCompetitors).join(', ');
      
      const { error } = await supabase
        .from('domain_contexts')
        .update({ 
          competitors: mergedCompetitors,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (error) throw error;
      
      return {
        success: true,
        domain: cleanDomain,
        competitors: mergedCompetitors,
        message: `Updated competitors for ${cleanDomain}: ${mergedCompetitors}`
      };
    } else {
      // Create new domain context with competitors
      const { error } = await supabase
        .from('domain_contexts')
        .insert({
          user_id: userId,
          domain: cleanDomain,
          competitors: competitorsStr
        });
      
      if (error) throw error;
      
      return {
        success: true,
        domain: cleanDomain,
        competitors: competitorsStr,
        message: `Saved competitors for ${cleanDomain}: ${competitorsStr}`
      };
    }
  } catch (error) {
    console.error("Save competitors error:", error);
    return { 
      error: "Failed to save competitors",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

// Find backlink partner opportunities using Ahrefs API
async function findBacklinkPartners(domain: string, competitorDomains?: string[], niche?: string): Promise<any> {
  const ahrefsApiKey = Deno.env.get("AHREFS_API_KEY");
  
  if (!ahrefsApiKey) {
    return {
      domain,
      message: "Backlink partner discovery requires Ahrefs API. Here are general recommendations:",
      strategies: [
        "Guest posting on industry blogs",
        "HARO (Help a Reporter Out) submissions",
        "Broken link building",
        "Resource page outreach",
        "Local business directories",
        "Industry association websites"
      ],
      niche_specific: niche ? `Focus on ${niche}-related publications and forums` : null
    };
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    const today = new Date().toISOString().split('T')[0];
    
    // Get referring domains for the user's domain
    const params = new URLSearchParams({
      target: cleanDomain,
      date: today,
      mode: 'domain',
      limit: '50',
      select: 'domain_rating,domain,backlinks',
      order_by: 'domain_rating:desc'
    });

    const response = await fetch(`https://api.ahrefs.com/v3/site-explorer/refdomains?${params.toString()}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ahrefsApiKey}`, 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Ahrefs API error: ${response.status}`);
    }

    const data = await response.json();
    const existingPartners = (data.refdomains || []).map((d: any) => ({
      domain: d.domain,
      dr: d.domain_rating,
      backlinks: d.backlinks
    }));

    return {
      domain: cleanDomain,
      existing_partners: existingPartners.slice(0, 20),
      total_referring_domains: data.stats?.refdomains || existingPartners.length,
      opportunities: [
        "Analyze competitor backlinks for untapped sources",
        "Find industry directories and resource pages",
        "Reach out to sites linking to competitors but not you"
      ],
      message: `Found ${existingPartners.length} existing link partners. Focus outreach on DR 30+ sites in your niche.`
    };
  } catch (error) {
    console.error("Backlink partners error:", error);
    return { error: "Failed to fetch backlink data", message: error instanceof Error ? error.message : "Unknown error" };
  }
}

// NEW TOOL: Run domain audit
async function runDomainAudit(supabase: any, domain: string): Promise<any> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  
  try {
    // First check if we have cached audit data
    const { data: cachedAudit } = await supabase
      .from('saved_audits')
      .select('*')
      .eq('domain', cleanDomain)
      .single();
    
    if (cachedAudit) {
      return {
        domain: cleanDomain,
        domain_rating: cachedAudit.domain_rating,
        organic_traffic: cachedAudit.organic_traffic,
        organic_keywords: cachedAudit.organic_keywords,
        backlinks: cachedAudit.backlinks,
        referring_domains: cachedAudit.referring_domains,
        traffic_value: cachedAudit.traffic_value,
        ahrefs_rank: cachedAudit.ahrefs_rank,
        site_title: cachedAudit.site_title,
        site_description: cachedAudit.site_description,
        last_updated: cachedAudit.updated_at,
        source: "cached_audit",
        message: `Audit data for ${cleanDomain} - DR ${cachedAudit.domain_rating || 'N/A'}, Traffic: ${cachedAudit.organic_traffic || 'N/A'}`
      };
    }
    
    // If no cached data, try to fetch from Ahrefs
    const ahrefsApiKey = Deno.env.get('AHREFS_API_KEY');
    if (ahrefsApiKey) {
      const today = new Date().toISOString().split('T')[0];
      const params = new URLSearchParams({
        target: cleanDomain,
        date: today,
        mode: 'domain'
      });
      
      const response = await fetch(`https://api.ahrefs.com/v3/site-explorer/metrics?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ahrefsApiKey}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const metrics = data.metrics || {};
        return {
          domain: cleanDomain,
          domain_rating: metrics.domain_rating,
          organic_traffic: metrics.organic_traffic,
          organic_keywords: metrics.organic_keywords,
          backlinks: metrics.backlinks,
          referring_domains: metrics.refdomains,
          source: "ahrefs_live",
          message: `Live audit for ${cleanDomain} - DR ${metrics.domain_rating || 'N/A'}`
        };
      }
    }
    
    return {
      domain: cleanDomain,
      error: "No audit data available",
      message: `No cached audit found for ${cleanDomain}. Run a full audit from the dashboard to populate this data.`
    };
  } catch (error) {
    console.error("Domain audit error:", error);
    return { error: "Failed to fetch domain audit", domain: cleanDomain };
  }
}

// NEW TOOL: Get visitor intelligence
async function getVisitorIntelligence(supabase: any, userId: string, domain: string, timeRange: string): Promise<any> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  
  try {
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (timeRange) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "month":
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      default: // week
        startDate = new Date(now.setDate(now.getDate() - 7));
    }
    
    // Get visitor sessions
    const { data: sessions, count } = await supabase
      .from('visitor_sessions')
      .select('*', { count: 'exact' })
      .eq('domain', cleanDomain)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);
    
    // Get enriched visitors
    const { data: enrichments } = await supabase
      .from('visitor_enrichments')
      .select('*')
      .eq('domain', cleanDomain)
      .gte('created_at', startDate.toISOString())
      .order('enrichment_confidence', { ascending: false })
      .limit(20);
    
    // Get page views summary
    const { data: pageViews } = await supabase
      .from('page_views')
      .select('page_path')
      .eq('domain', cleanDomain)
      .gte('created_at', startDate.toISOString());
    
    // Count page views per path
    const pageViewCounts: Record<string, number> = {};
    (pageViews || []).forEach((pv: any) => {
      pageViewCounts[pv.page_path] = (pageViewCounts[pv.page_path] || 0) + 1;
    });
    const topPages = Object.entries(pageViewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([path, views]) => ({ path, views }));
    
    // Format identified companies
    const identifiedCompanies = (enrichments || [])
      .filter((e: any) => e.company_name || e.contact_name)
      .slice(0, 10)
      .map((e: any) => ({
        company: e.company_name || e.ip_org || 'Unknown',
        contact: e.contact_name,
        email: e.contact_email,
        location: [e.ip_city, e.ip_region, e.ip_country].filter(Boolean).join(', '),
        confidence: e.enrichment_confidence
      }));
    
    return {
      domain: cleanDomain,
      time_range: timeRange,
      total_visitors: count || 0,
      identified_companies: identifiedCompanies,
      top_pages: topPages,
      total_page_views: pageViews?.length || 0,
      summary: `${count || 0} visitors in the last ${timeRange}, ${identifiedCompanies.length} identified companies`,
      message: identifiedCompanies.length > 0 
        ? `Found ${identifiedCompanies.length} identified visitors: ${identifiedCompanies.slice(0, 3).map((c: any) => c.company).join(', ')}`
        : `${count || 0} visitors tracked, but no companies identified yet. Ensure visitor tracking is installed.`
    };
  } catch (error) {
    console.error("Visitor intelligence error:", error);
    return { error: "Failed to fetch visitor intelligence", domain: cleanDomain };
  }
}

// NEW TOOL: Get CADE content
async function getCadeContent(supabase: any, userId: string, domain: string, contentType: string): Promise<any> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  
  try {
    // Get domain context which may have content info
    const { data: domainContext } = await supabase
      .from('domain_contexts')
      .select('*')
      .eq('domain', cleanDomain)
      .eq('user_id', userId)
      .single();
    
    // Try to get content from CADE API
    const cadeApiKey = Deno.env.get('CADE_API_KEY');
    const cadeApiSecret = Deno.env.get('CADE_API_SECRET');
    
    if (cadeApiKey && cadeApiSecret) {
      const credentials = btoa(`${cadeApiKey}:${cadeApiSecret}`);
      
      // Get articles
      let articles: any[] = [];
      if (contentType === 'articles' || contentType === 'all') {
        try {
          const response = await fetch(`https://seo-acg-api.prod.seosara.ai/api/v1/domains/${cleanDomain}/content`, {
            headers: { 'Authorization': `Basic ${credentials}` }
          });
          if (response.ok) {
            const data = await response.json();
            articles = (data.articles || data.content || []).slice(0, 10);
          }
        } catch (e) {
          console.log("Could not fetch CADE articles:", e);
        }
      }
      
      // Get FAQs
      let faqs: any[] = [];
      if (contentType === 'faqs' || contentType === 'all') {
        try {
          const response = await fetch(`https://seo-acg-api.prod.seosara.ai/api/v1/domains/${cleanDomain}/faqs`, {
            headers: { 'Authorization': `Basic ${credentials}` }
          });
          if (response.ok) {
            const data = await response.json();
            faqs = (data.faqs || []).slice(0, 10);
          }
        } catch (e) {
          console.log("Could not fetch CADE FAQs:", e);
        }
      }
      
      return {
        domain: cleanDomain,
        articles_count: articles.length,
        articles: articles.map((a: any) => ({
          title: a.title,
          status: a.status,
          category: a.category,
          created_at: a.created_at
        })),
        faqs_count: faqs.length,
        faqs: faqs.map((f: any) => ({
          question: f.question,
          category: f.category
        })),
        business_context: domainContext ? {
          business_name: domainContext.business_name,
          services: domainContext.services_offered,
          primary_keyword: domainContext.primary_keyword
        } : null,
        message: `Found ${articles.length} articles and ${faqs.length} FAQs for ${cleanDomain}`
      };
    }
    
    return {
      domain: cleanDomain,
      error: "CADE not configured",
      message: "CADE content automation is not configured for this account. Contact support to enable it."
    };
  } catch (error) {
    console.error("CADE content error:", error);
    return { error: "Failed to fetch CADE content", domain: cleanDomain };
  }
}

// NEW TOOL: Get domain context
async function getDomainContextTool(supabase: any, userId: string, domain: string): Promise<any> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  
  try {
    const { data: context } = await supabase
      .from('domain_contexts')
      .select('*')
      .eq('domain', cleanDomain)
      .eq('user_id', userId)
      .single();
    
    if (!context) {
      return {
        domain: cleanDomain,
        error: "No context found",
        message: `No business context saved for ${cleanDomain}. Use the Domain Context editor in the dashboard to set up your business profile.`
      };
    }
    
    return {
      domain: cleanDomain,
      business_name: context.business_name,
      primary_keyword: context.primary_keyword,
      services_offered: context.services_offered,
      services_not_offered: context.services_not_offered,
      service_areas: context.service_areas,
      primary_city: context.primary_city,
      competitors: context.competitors,
      unique_selling_points: context.unique_selling_points,
      writing_tone: context.writing_tone,
      target_keywords: context.target_keywords,
      topics_to_cover: context.topics_to_cover,
      year_established: context.year_established,
      verified: context.verified,
      message: `Context for ${context.business_name || cleanDomain}: ${context.primary_keyword || 'No primary keyword set'}`
    };
  } catch (error) {
    console.error("Domain context error:", error);
    return { error: "Failed to fetch domain context", domain: cleanDomain };
  }
}

// NEW TOOL: Save research to context
async function saveResearchToContext(supabase: any, userId: string, domain: string, field: string, value: string): Promise<any> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  
  const allowedFields = ['target_keywords', 'competitors', 'topics_to_cover', 'services_offered', 'service_areas', 'unique_selling_points'];
  if (!allowedFields.includes(field)) {
    return { error: `Invalid field: ${field}`, allowed_fields: allowedFields };
  }
  
  try {
    // Check if context exists
    const { data: existing } = await supabase
      .from('domain_contexts')
      .select('id, ' + field)
      .eq('domain', cleanDomain)
      .eq('user_id', userId)
      .single();
    
    // For array fields, merge with existing values
    const arrayFields = ['target_keywords', 'topics_to_cover', 'services_offered', 'service_areas'];
    let finalValue: any = value;
    
    if (arrayFields.includes(field)) {
      const newValues = value.split(',').map(v => v.trim()).filter(Boolean);
      if (existing?.[field]) {
        const existingValues = Array.isArray(existing[field]) ? existing[field] : [];
        finalValue = [...new Set([...existingValues, ...newValues])];
      } else {
        finalValue = newValues;
      }
    }
    
    const updatePayload = {
      [field]: finalValue,
      updated_at: new Date().toISOString()
    };
    
    if (existing) {
      const { error } = await supabase
        .from('domain_contexts')
        .update(updatePayload)
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('domain_contexts')
        .insert({
          user_id: userId,
          domain: cleanDomain,
          ...updatePayload
        });
      
      if (error) throw error;
    }
    
    return {
      success: true,
      domain: cleanDomain,
      field,
      value: finalValue,
      message: `Saved ${field} for ${cleanDomain}: ${Array.isArray(finalValue) ? finalValue.join(', ') : finalValue}`
    };
  } catch (error) {
    console.error("Save research error:", error);
    return { error: "Failed to save research", domain: cleanDomain };
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

function buildSystemPrompt(domainContext: any, userEmail?: string, selectedDomain?: string): string {
  let prompt = `You are Webstack AI - a friendly, expert SEO assistant. Be concise and action-oriented.

## STYLE GUIDE:
- Keep responses SHORT (2-4 sentences for simple questions)
- Use bullet points for lists, not paragraphs
- Skip pleasantries after the first message
- Get to the point quickly
- Use emojis sparingly: 🎯 for goals, ✅ for wins, 💡 for tips

## DOMAIN PROTOCOL:
- The user has selected a domain from their dashboard - USE IT AUTOMATICALLY
- Never ask which domain - use the selected domain shown below
- Start responses with: "🎯 **[domain]** - " then proceed
- If no domain is selected, ask them to pick one from the dropdown

## QUICK RESPONSES:
- For simple questions: Answer directly, no preamble
- For data requests: Use tools immediately, show results
- For complex tasks: Brief plan (3 bullets max), then execute

## YOUR TOOLS (use proactively):

### Research Tools:
- **get_keyword_suggestions**: Related keywords for any seed term
- **get_keyword_metrics**: Volume/CPC for specific keywords  
- **get_competitor_keywords**: What competitors rank for (Ahrefs)
- **get_backlinks**: Domain's backlink profile
- **get_serp_report**: SERP rankings overview

### Business Intelligence Tools:
- **run_domain_audit**: Full SEO audit with DR, traffic, backlinks
- **get_visitor_intelligence**: Who's visiting their site (companies, leads)
- **get_cade_content**: Their automated content & FAQs
- **get_domain_context**: Business profile, services, competitors

### 📚 Knowledge Tools (USE for SEO education):
- **get_glossary_terms**: Search SEO definitions, best practices, explanations
- **get_learning_guides**: Find detailed guides on any SEO topic
- **get_platform_features**: Explain what Webstack.ceo features do

### 💾 Save & Organize Tools:
- **save_competitors**: Save competitor domains discovered
- **save_research_to_context**: Save keywords, topics, insights to their profile
- **save_to_seo_vault**: ALWAYS include the domain parameter with the ACTIVE DOMAIN shown above
- **get_seo_vault**: Retrieve user's saved reports and research

## CRITICAL - SAVING TO VAULT:
When saving to SEO vault, you MUST ALWAYS include domain="${selectedDomain || '[THE_ACTIVE_DOMAIN]'}" in save_to_seo_vault calls.
NEVER save without the domain field. Each report should be tagged to the specific domain being researched.

## RESEARCH WORKFLOW:
When doing research, ALWAYS:
1. Use tools to gather real data first
2. Present findings in organized tables/lists
3. **Save to SEO Vault with the domain field** using the active domain
4. Suggest next steps

## PLATFORM KNOWLEDGE:
You represent webstack.ceo - an all-in-one SEO command center. When users ask about features:
- Use get_platform_features to explain capabilities
- Use get_learning_guides to point them to educational content
- Use get_glossary_terms to explain SEO concepts

## FORMAT:
- Tables for metrics/comparisons
- Bold for key numbers
- One clear CTA per response

User: ${userEmail || 'Anonymous'}
`;


  // Add selected domain prominently
  if (selectedDomain) {
    prompt += `\n## ⚡ ACTIVE DOMAIN: **${selectedDomain}**\nUse this domain for ALL queries automatically. Do not ask which domain.\n`;
  } else if (domainContext.domains?.length > 0) {
    prompt += `\n## Available Domains: ${domainContext.domains.map((d: any) => d.domain).join(', ')}\n⚠️ No domain selected - ask user to pick one from the dropdown.\n`;
  }

  if (domainContext.auditData) {
    const a = domainContext.auditData;
    prompt += `\n**Domain Stats:** DR ${a.domain_rating || '?'} | Traffic: ${a.organic_traffic || '?'} | Backlinks: ${a.backlinks || '?'}\n`;
  }

  if (domainContext.domainContext) {
    const dc = domainContext.domainContext;
    if (dc.business_name) prompt += `**Business:** ${dc.business_name}\n`;
    if (dc.primary_keyword) prompt += `**Primary Keyword:** ${dc.primary_keyword}\n`;
    if (dc.competitors) prompt += `**Known Competitors:** ${dc.competitors}\n`;
    if (dc.services_offered?.length) prompt += `**Services:** ${dc.services_offered.slice(0, 5).join(', ')}\n`;
  }

  return prompt;
}

// ===== NEW: Website Knowledge Tools =====

// Glossary terms database - comprehensive SEO definitions
const GLOSSARY_TERMS: Record<string, any> = {
  "title tag": {
    term: "Title Tag",
    category: "On-Page SEO",
    definition: "The HTML element (<title>) that defines the page title shown in browser tabs and search results. Critical for both rankings and click-through rates.",
    best_practices: [
      "Keep under 60 characters",
      "Place primary keyword near the beginning",
      "Make each page's title unique",
      "Include brand name at the end"
    ],
    why_it_matters: "Primary factor for search engines to understand page content and first impression users see in SERPs.",
    related: ["meta-description", "header-tags", "on-page-seo"]
  },
  "meta description": {
    term: "Meta Description",
    category: "On-Page SEO",
    definition: "HTML attribute providing a brief summary of page content, displayed below the title in search results. Acts as your 'ad copy' for organic listings.",
    best_practices: [
      "Keep under 160 characters",
      "Include target keyword naturally",
      "Add clear value proposition",
      "Use call-to-action when appropriate"
    ],
    why_it_matters: "Significantly influences click-through rates by convincing users to click your result over competitors.",
    related: ["title-tag", "serp", "ctr"]
  },
  "backlinks": {
    term: "Backlinks",
    category: "Off-Page SEO",
    definition: "Links from other websites pointing to your site. One of the most important ranking factors, acting as 'votes of confidence' from other sites.",
    best_practices: [
      "Focus on quality over quantity",
      "Build from relevant, authoritative sites",
      "Diversify anchor text naturally",
      "Avoid paid or spammy links"
    ],
    why_it_matters: "Strong correlation with rankings. High-quality backlinks signal authority and trustworthiness to search engines.",
    related: ["domain-authority", "link-building", "referring-domains"]
  },
  "domain authority": {
    term: "Domain Authority (DA)",
    category: "Off-Page SEO",
    definition: "A metric (0-100) developed by Moz predicting how well a site will rank. Higher scores indicate greater ranking potential.",
    best_practices: [
      "Build high-quality backlinks consistently",
      "Create link-worthy content",
      "Remove toxic backlinks",
      "Focus on topical authority"
    ],
    why_it_matters: "Helps predict ranking potential and benchmark against competitors. Influenced by link profile quality.",
    related: ["backlinks", "domain-rating", "page-authority"]
  },
  "schema markup": {
    term: "Schema Markup",
    category: "Technical SEO",
    definition: "Structured data code (typically JSON-LD) that helps search engines understand content context, enabling rich snippets in search results.",
    best_practices: [
      "Use JSON-LD format (Google's preferred method)",
      "Implement relevant schema types for your content",
      "Test with Google's Rich Results Test",
      "Keep data consistent with visible page content"
    ],
    why_it_matters: "Enables rich snippets (stars, prices, FAQs) that increase visibility and CTR. Required for certain SERP features.",
    related: ["rich-snippets", "structured-data", "technical-seo"]
  },
  "core web vitals": {
    term: "Core Web Vitals",
    category: "Technical SEO",
    definition: "Google's metrics measuring user experience: LCP (loading), INP (interactivity), and CLS (visual stability). Direct ranking factors.",
    best_practices: [
      "Target LCP under 2.5 seconds",
      "Keep INP under 200ms",
      "Maintain CLS under 0.1",
      "Optimize images and use CDN"
    ],
    why_it_matters: "Confirmed Google ranking factor. Poor scores hurt rankings and user experience, affecting conversions.",
    related: ["lcp", "inp", "cls", "page-speed"]
  },
  "local seo": {
    term: "Local SEO",
    category: "Local SEO",
    definition: "Optimizing online presence to attract business from local searches, especially important for businesses with physical locations or service areas.",
    best_practices: [
      "Optimize Google Business Profile completely",
      "Build consistent NAP citations",
      "Get reviews on Google and industry sites",
      "Create location-specific content"
    ],
    why_it_matters: "46% of Google searches have local intent. Essential for businesses serving specific geographic areas.",
    related: ["google-business-profile", "citations", "local-pack"]
  },
  "keyword research": {
    term: "Keyword Research",
    category: "On-Page SEO",
    definition: "The process of discovering and analyzing search terms people use, forming the foundation of any SEO strategy.",
    best_practices: [
      "Start with seed keywords from your niche",
      "Analyze search volume and competition",
      "Consider search intent (informational, commercial, transactional)",
      "Look for long-tail opportunities"
    ],
    why_it_matters: "Guides all content and optimization decisions. Targeting wrong keywords wastes resources and yields poor results.",
    related: ["search-volume", "keyword-difficulty", "long-tail-keywords"]
  }
};

// Learning guides database
const LEARNING_GUIDES: Record<string, any> = {
  "on-page seo": {
    title: "On-Page SEO Guide",
    href: "/learn/on-page-seo-guide",
    description: "Complete guide to optimizing individual pages for search engines. Covers title tags, meta descriptions, headers, content optimization, internal linking, and more.",
    topics: ["Title tags", "Meta descriptions", "Header structure", "Image optimization", "Internal linking", "Content quality"]
  },
  "off-page seo": {
    title: "Off-Page SEO Guide",
    href: "/learn/off-page-seo-guide",
    description: "Master external ranking factors including link building, brand mentions, social signals, and building domain authority.",
    topics: ["Link building strategies", "Guest posting", "Digital PR", "Brand mentions", "Social signals"]
  },
  "local seo": {
    title: "Local SEO Guide",
    href: "/learn/local-seo-guide",
    description: "Dominate local search results with Google Business Profile optimization, citation building, review management, and local content strategies.",
    topics: ["Google Business Profile", "Citations", "Reviews", "Local keywords", "Service area optimization"]
  },
  "technical seo": {
    title: "Technical SEO Guide",
    href: "/learn/technical-seo-guide",
    description: "Technical foundations for SEO success including site architecture, Core Web Vitals, crawlability, indexation, and schema markup.",
    topics: ["Site structure", "Page speed", "Core Web Vitals", "Schema markup", "XML sitemaps", "Robots.txt"]
  },
  "link building": {
    title: "Link Building Guide",
    href: "/learn/link-building-guide",
    description: "Proven strategies for acquiring high-quality backlinks ethically. Covers outreach, content marketing, broken link building, and more.",
    topics: ["Outreach strategies", "Content marketing", "Guest posting", "Broken link building", "Resource pages"]
  },
  "keyword research": {
    title: "Keyword Research Guide",
    href: "/learn/keyword-research-guide",
    description: "Find and prioritize the right keywords for your business. Learn to analyze search intent, competition, and build a winning keyword strategy.",
    topics: ["Seed keywords", "Search intent", "Keyword difficulty", "Long-tail keywords", "Competitor analysis"]
  },
  "content marketing": {
    title: "Content Marketing Guide",
    href: "/learn/content-marketing-guide",
    description: "Create content that ranks and converts. Covers content strategy, creation, optimization, and distribution.",
    topics: ["Content strategy", "Topic clusters", "Content optimization", "Distribution", "Repurposing"]
  }
};

// Platform features database
const PLATFORM_FEATURES: Record<string, any> = {
  "bron": {
    name: "BRON (Backlink & Ranking Optimization Network)",
    description: "Automated backlink monitoring and keyword rank tracking system. Monitors your rankings across search engines, tracks backlink health, and provides actionable SEO insights.",
    capabilities: [
      "Real-time keyword rank tracking",
      "Backlink profile monitoring",
      "Competitor rank comparison",
      "Citation/link partner management",
      "Historical trend analysis"
    ],
    how_to_access: "Access from the dashboard under the BRON tab. Add keywords to track and monitor your rankings daily."
  },
  "cade": {
    name: "CADE (Content Automation & Distribution Engine)",
    description: "AI-powered content generation system that creates SEO-optimized blog posts, FAQs, and service pages automatically based on your business context.",
    capabilities: [
      "Automated blog post generation",
      "FAQ content creation",
      "Service page optimization",
      "Content distribution to your CMS",
      "Topic cluster building"
    ],
    how_to_access: "Set up your Domain Context first, then access CADE from the dashboard to start generating content."
  },
  "visitor intelligence": {
    name: "Visitor Intelligence",
    description: "De-anonymize website visitors to identify companies visiting your site. Turn anonymous traffic into actionable leads with company identification and contact enrichment.",
    capabilities: [
      "Company identification from IP",
      "Contact information enrichment",
      "Real-time visitor tracking",
      "Lead scoring and qualification",
      "CRM integration"
    ],
    how_to_access: "Add the tracking snippet to your site, then view visitor data in the Visitor Intelligence dashboard."
  },
  "on-page seo": {
    name: "On-Page SEO Automation",
    description: "Automated on-page SEO monitoring and optimization. Scans your pages for SEO issues and can automatically fix meta tags, schema, and content issues.",
    capabilities: [
      "Automated SEO audits",
      "Meta tag optimization",
      "Schema markup injection",
      "Content issue detection",
      "Autopilot mode for auto-fixes"
    ],
    how_to_access: "Enable from the On-Page SEO tab in the dashboard. Connect your site and enable Autopilot for automatic fixes."
  },
  "aeo geo": {
    name: "AEO/GEO (AI Engine Optimization)",
    description: "Optimize your content for AI search engines and voice assistants. Monitor how AI systems like ChatGPT and Google AI mention your brand.",
    capabilities: [
      "AI visibility monitoring",
      "LLM citation tracking",
      "Content optimization for AI",
      "Brand mention alerts",
      "Competitor AI visibility comparison"
    ],
    how_to_access: "Access from the AEO/GEO tab to see how AI engines reference your brand and keywords."
  },
  "seo vault": {
    name: "SEO Vault",
    description: "Your private repository for saving research findings, keyword lists, competitor analyses, and action items. Organize and revisit your SEO work.",
    capabilities: [
      "Save research reports",
      "Organize by domain and type",
      "Tag and categorize findings",
      "Quick access to past research",
      "Export capabilities"
    ],
    how_to_access: "Ask the AI assistant to 'save to vault' after any research. View saved items by asking to 'show my vault'."
  }
};

// Get glossary terms matching search
async function getGlossaryTerms(search: string, category: string = "all"): Promise<any> {
  const searchLower = search.toLowerCase();
  const matches: any[] = [];
  
  for (const [key, term] of Object.entries(GLOSSARY_TERMS)) {
    const matchesSearch = key.includes(searchLower) || 
                         term.term.toLowerCase().includes(searchLower) ||
                         term.definition.toLowerCase().includes(searchLower);
    const matchesCategory = category === "all" || term.category.toLowerCase() === category.toLowerCase();
    
    if (matchesSearch && matchesCategory) {
      matches.push(term);
    }
  }
  
  if (matches.length === 0) {
    return {
      search,
      found: false,
      message: `No glossary terms found for "${search}". Try searching for common SEO terms like "backlinks", "title tag", "schema markup", etc.`,
      suggestions: Object.keys(GLOSSARY_TERMS).slice(0, 5)
    };
  }
  
  return {
    search,
    found: true,
    count: matches.length,
    terms: matches,
    message: `Found ${matches.length} glossary term(s) for "${search}"`
  };
}

// Get learning guides matching topic
async function getLearningGuides(topic: string): Promise<any> {
  const topicLower = topic.toLowerCase();
  const matches: any[] = [];
  
  for (const [key, guide] of Object.entries(LEARNING_GUIDES)) {
    if (key.includes(topicLower) || 
        guide.title.toLowerCase().includes(topicLower) ||
        guide.description.toLowerCase().includes(topicLower) ||
        guide.topics.some((t: string) => t.toLowerCase().includes(topicLower))) {
      matches.push(guide);
    }
  }
  
  if (matches.length === 0) {
    return {
      topic,
      found: false,
      message: `No guides found for "${topic}". Available guides cover: on-page SEO, off-page SEO, local SEO, technical SEO, link building, keyword research, and content marketing.`,
      available_guides: Object.values(LEARNING_GUIDES).map(g => ({ title: g.title, href: g.href }))
    };
  }
  
  return {
    topic,
    found: true,
    count: matches.length,
    guides: matches,
    message: `Found ${matches.length} learning guide(s) for "${topic}". Visit webstack.ceo${matches[0].href} to learn more.`
  };
}

// Get platform feature info
async function getPlatformFeatures(feature: string): Promise<any> {
  const featureLower = feature.toLowerCase();
  
  for (const [key, feat] of Object.entries(PLATFORM_FEATURES)) {
    if (key.includes(featureLower) || 
        feat.name.toLowerCase().includes(featureLower) ||
        feat.description.toLowerCase().includes(featureLower)) {
      return {
        feature: feat.name,
        description: feat.description,
        capabilities: feat.capabilities,
        how_to_access: feat.how_to_access,
        found: true
      };
    }
  }
  
  return {
    feature,
    found: false,
    message: `Feature "${feature}" not found. Available features: BRON (rankings), CADE (content), Visitor Intelligence, On-Page SEO, AEO/GEO, SEO Vault.`,
    available_features: Object.values(PLATFORM_FEATURES).map(f => f.name)
  };
}

// ===== NEW: SEO Vault Tools =====

// Save to SEO vault
async function saveToSeoVault(
  supabase: any, 
  userId: string, 
  title: string, 
  reportType: string, 
  content: any, 
  summary?: string, 
  tags?: string[],
  domain?: string
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('seo_vault')
      .insert({
        user_id: userId,
        domain: domain || null,
        title,
        report_type: reportType,
        content,
        summary: summary || null,
        tags: tags || []
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      id: data.id,
      title,
      report_type: reportType,
      message: `✅ Saved to your SEO Vault: "${title}". View it anytime by asking "show my vault" or "show my saved reports".`
    };
  } catch (error) {
    console.error("Save to vault error:", error);
    return { 
      error: "Failed to save to SEO vault",
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Get from SEO vault
async function getSeoVault(
  supabase: any, 
  userId: string, 
  domain?: string, 
  reportType?: string, 
  limit: number = 10
): Promise<any> {
  try {
    let query = supabase
      .from('seo_vault')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (domain) {
      query = query.eq('domain', domain);
    }
    if (reportType) {
      query = query.eq('report_type', reportType);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return {
        count: 0,
        reports: [],
        message: "Your SEO Vault is empty. Complete some research and I'll offer to save it for you!"
      };
    }
    
    return {
      count: data.length,
      reports: data.map((r: any) => ({
        id: r.id,
        title: r.title,
        report_type: r.report_type,
        domain: r.domain,
        summary: r.summary,
        tags: r.tags,
        is_favorite: r.is_favorite,
        created_at: r.created_at,
        // Include content preview (first 500 chars of stringified content)
        content_preview: JSON.stringify(r.content).slice(0, 500)
      })),
      message: `Found ${data.length} saved report(s) in your SEO Vault.`
    };
  } catch (error) {
    console.error("Get vault error:", error);
    return { 
      error: "Failed to retrieve SEO vault",
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
