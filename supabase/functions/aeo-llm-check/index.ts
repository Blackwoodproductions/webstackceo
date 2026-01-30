import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LLMCheckRequest {
  keyword: string;
  domain: string;
  location?: string;
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

// All models to check - run in parallel
const MODELS_TO_CHECK = [
  { id: 'google/gemini-3-flash-preview', displayName: 'Google Gemini', icon: '🔷' },
  { id: 'openai/gpt-5', displayName: 'ChatGPT', icon: '🟢' },
  { id: 'openai/gpt-5-mini', displayName: 'GPT-5 Mini', icon: '🟡' },
];

async function queryLLM(
  model: string,
  displayName: string,
  prompt: string,
  keyword: string,
  domain: string,
  apiKey: string
): Promise<LLMResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout
    
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
        max_tokens: 300,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        return {
          model,
          modelDisplayName: displayName,
          mentioned: false,
          snippet: null,
          position: 'not_found',
          confidence: 0,
          queryUsed: 'recommendation',
          error: 'Rate limited',
        };
      }
      if (response.status === 402) {
        return {
          model,
          modelDisplayName: displayName,
          mentioned: false,
          snippet: null,
          position: 'not_found',
          confidence: 0,
          queryUsed: 'recommendation',
          error: 'Payment required',
        };
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
      queryUsed: 'recommendation',
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
      queryUsed: 'recommendation',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Check Perplexity separately (if API key available)
async function queryPerplexity(
  prompt: string,
  keyword: string,
  domain: string,
  apiKey: string
): Promise<LLMResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: 'Be precise and concise. Provide specific business recommendations.' },
          { role: 'user', content: prompt }
        ],
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Perplexity API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
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
      model: 'perplexity/sonar',
      modelDisplayName: 'Perplexity',
      mentioned: position !== 'not_found',
      snippet,
      position,
      confidence,
      queryUsed: 'recommendation',
    };
  } catch (error) {
    console.error('Perplexity error:', error);
    return null;
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

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    const { keyword, domain, location } = await req.json() as LLMCheckRequest;
    
    if (!keyword || !domain) {
      return new Response(
        JSON.stringify({ error: "keyword and domain are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[AEO Check] Checking keyword "${keyword}" for domain "${domain}"`);

    const locationSuffix = location ? ` in ${location}` : '';
    const prompt = `What are the best ${keyword}${locationSuffix}? List specific companies, providers, or services if you know any.`;

    // Run all LLM checks in parallel for speed
    const llmPromises = MODELS_TO_CHECK.map(model => 
      queryLLM(model.id, model.displayName, prompt, keyword, domain, LOVABLE_API_KEY)
    );

    // Add Perplexity if API key available
    if (PERPLEXITY_API_KEY) {
      llmPromises.push(
        queryPerplexity(prompt, keyword, domain, PERPLEXITY_API_KEY).then(r => r || {
          model: 'perplexity/sonar',
          modelDisplayName: 'Perplexity',
          mentioned: false,
          snippet: null,
          position: 'not_found' as const,
          confidence: 0,
          queryUsed: 'recommendation',
          error: 'API unavailable',
        })
      );
    }

    const results = await Promise.all(llmPromises);

    // Generate optimization suggestions if not found
    const notFoundModels = results.filter(r => r.position === 'not_found' && !r.error);
    const suggestions: string[] = [];
    
    if (notFoundModels.length > 0) {
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
