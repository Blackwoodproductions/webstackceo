import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LLMCheckRequest {
  keyword: string;
  domain: string;
  location?: string;
  queryType: 'direct' | 'recommendation' | 'both';
}

interface LLMResult {
  model: string;
  modelDisplayName: string;
  mentioned: boolean;
  snippet: string | null;
  position: 'prominent' | 'mentioned' | 'not_found';
  confidence: number;
  queryUsed: string;
  error?: string;
}

// Models available via Lovable AI Gateway
const AVAILABLE_MODELS = [
  { id: 'google/gemini-3-flash-preview', displayName: 'Google Gemini', icon: 'gemini' },
  { id: 'openai/gpt-5', displayName: 'ChatGPT', icon: 'openai' },
  { id: 'openai/gpt-5-mini', displayName: 'GPT-5 Mini', icon: 'openai' },
];

async function queryLLM(
  model: string,
  prompt: string,
  keyword: string,
  domain: string,
  apiKey: string
): Promise<{ mentioned: boolean; snippet: string | null; position: 'prominent' | 'mentioned' | 'not_found'; confidence: number }> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { 
            role: "system", 
            content: "You are a helpful assistant. Provide accurate, factual information based on your training data. Be specific about businesses and services when asked." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit exceeded");
      }
      if (response.status === 402) {
        throw new Error("Payment required");
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Analyze the response for keyword/domain mentions
    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const lowerDomain = domain.toLowerCase().replace(/^www\./, '').replace(/\.[a-z]+$/, '');
    
    const keywordMentioned = lowerContent.includes(lowerKeyword);
    const domainMentioned = lowerContent.includes(lowerDomain);
    
    let position: 'prominent' | 'mentioned' | 'not_found' = 'not_found';
    let confidence = 0;
    
    if (domainMentioned || keywordMentioned) {
      // Check if mentioned in first 200 characters (prominent)
      const first200 = lowerContent.substring(0, 200);
      if (first200.includes(lowerDomain) || first200.includes(lowerKeyword)) {
        position = 'prominent';
        confidence = domainMentioned ? 95 : 70;
      } else {
        position = 'mentioned';
        confidence = domainMentioned ? 75 : 50;
      }
    }
    
    // Extract relevant snippet
    let snippet: string | null = null;
    if (position !== 'not_found') {
      const searchTerm = domainMentioned ? lowerDomain : lowerKeyword;
      const idx = lowerContent.indexOf(searchTerm);
      if (idx !== -1) {
        const start = Math.max(0, idx - 50);
        const end = Math.min(content.length, idx + searchTerm.length + 100);
        snippet = (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
      } else {
        snippet = content.substring(0, 150) + (content.length > 150 ? '...' : '');
      }
    }
    
    return {
      mentioned: position !== 'not_found',
      snippet,
      position,
      confidence,
    };
  } catch (error) {
    console.error(`Error querying ${model}:`, error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { keyword, domain, location, queryType = 'both' } = await req.json() as LLMCheckRequest;
    
    if (!keyword || !domain) {
      return new Response(
        JSON.stringify({ error: "keyword and domain are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[AEO Check] Checking keyword "${keyword}" for domain "${domain}" with query type "${queryType}"`);

    // Build queries
    const queries: { type: string; prompt: string }[] = [];
    
    if (queryType === 'direct' || queryType === 'both') {
      queries.push({
        type: 'direct',
        prompt: `What do you know about ${keyword}? If there are specific companies or services related to this, please mention them.`,
      });
    }
    
    if (queryType === 'recommendation' || queryType === 'both') {
      const locationSuffix = location ? ` in ${location}` : '';
      queries.push({
        type: 'recommendation',
        prompt: `Can you recommend the best ${keyword}${locationSuffix}? Please list specific companies or providers if you know any.`,
      });
    }

    const results: LLMResult[] = [];

    // Query each model with each query type
    for (const model of AVAILABLE_MODELS) {
      for (const query of queries) {
        try {
          const result = await queryLLM(
            model.id,
            query.prompt,
            keyword,
            domain,
            LOVABLE_API_KEY
          );
          
          results.push({
            model: model.id,
            modelDisplayName: model.displayName,
            mentioned: result.mentioned,
            snippet: result.snippet,
            position: result.position,
            confidence: result.confidence,
            queryUsed: query.type,
          });
        } catch (error) {
          results.push({
            model: model.id,
            modelDisplayName: model.displayName,
            mentioned: false,
            snippet: null,
            position: 'not_found',
            confidence: 0,
            queryUsed: query.type,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Generate optimization suggestions if not found
    const notFoundModels = results.filter(r => r.position === 'not_found' && !r.error);
    const suggestions: string[] = [];
    
    if (notFoundModels.length > 0) {
      suggestions.push(
        "Create authoritative content about your core services on your website",
        "Get listed in industry directories and review platforms (Google Business, Yelp, industry-specific directories)",
        "Build citations across trusted data sources that LLMs crawl",
        "Publish case studies and testimonials that mention your brand + keywords",
        "Create FAQ content targeting common questions in your niche",
        "Secure mentions in Wikipedia or other high-authority knowledge bases",
        "Contribute expert content to industry publications and blogs",
        "Ensure your schema markup is comprehensive (Organization, LocalBusiness, etc.)"
      );
    }

    return new Response(
      JSON.stringify({
        keyword,
        domain,
        results,
        suggestions,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[AEO Check] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
