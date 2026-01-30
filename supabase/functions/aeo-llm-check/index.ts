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

// Optimized: Use fastest model only for speed
const AVAILABLE_MODELS = [
  { id: 'google/gemini-3-flash-preview', displayName: 'Google Gemini', icon: 'gemini' },
];

async function queryLLM(
  model: string,
  prompt: string,
  keyword: string,
  domain: string,
  apiKey: string,
  queryType: string
): Promise<LLMResult> {
  const displayName = model.includes('gemini') ? 'Google Gemini' : 
                     model.includes('gpt-5-mini') ? 'GPT-5 Mini' : 'ChatGPT';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
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
            content: "You are a helpful assistant. Provide accurate, factual information. Be specific about businesses and services when asked. Keep responses concise (under 200 words)." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 300, // Reduced for speed
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

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
      model,
      modelDisplayName: displayName,
      mentioned: position !== 'not_found',
      snippet,
      position,
      confidence,
      queryUsed: queryType,
    };
  } catch (error) {
    console.error(`Error querying ${model}:`, error);
    return {
      model,
      modelDisplayName: displayName,
      mentioned: false,
      snippet: null,
      position: 'not_found',
      confidence: 0,
      queryUsed: queryType,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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

    const { keyword, domain, location, queryType = 'direct' } = await req.json() as LLMCheckRequest;
    
    if (!keyword || !domain) {
      return new Response(
        JSON.stringify({ error: "keyword and domain are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[AEO Check] Checking keyword "${keyword}" for domain "${domain}"`);

    // Build single optimized query for speed
    const locationSuffix = location ? ` in ${location}` : '';
    const prompt = `What are the best ${keyword}${locationSuffix}? List specific companies, providers, or services if you know any.`;

    // Run single fast check with Gemini Flash
    const result = await queryLLM(
      'google/gemini-3-flash-preview',
      prompt,
      keyword,
      domain,
      LOVABLE_API_KEY,
      'recommendation'
    );

    const results: LLMResult[] = [result];

    // Generate optimization suggestions if not found
    const suggestions: string[] = [];
    if (result.position === 'not_found' && !result.error) {
      suggestions.push(
        "Create authoritative content about your core services",
        "Get listed in industry directories (Google Business, Yelp)",
        "Build citations across trusted data sources that LLMs crawl",
        "Publish case studies and testimonials mentioning your brand",
        "Create FAQ content targeting common questions in your niche"
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
