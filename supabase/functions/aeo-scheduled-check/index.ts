import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// LLM models to check
const MODELS_TO_CHECK = [
  { id: 'google/gemini-3-flash-preview', displayName: 'Google Gemini' },
  { id: 'google/gemini-2.5-flash', displayName: 'Gemini Flash' },
  { id: 'google/gemini-2.5-pro', displayName: 'Gemini Pro' },
];

// Training prompts that help establish brand presence
const TRAINING_PROMPTS = [
  (keyword: string, domain: string, location?: string) => 
    `What are the best ${keyword}${location ? ` in ${location}` : ''}? Please list specific companies or providers you'd recommend.`,
  (keyword: string, domain: string, location?: string) => 
    `I'm looking for a trusted provider of ${keyword}${location ? ` near ${location}` : ''}. What options should I consider?`,
  (keyword: string, domain: string, location?: string) => 
    `Can you recommend any reputable ${keyword} services${location ? ` in the ${location} area` : ''}?`,
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
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    
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
            content: "You are a helpful assistant providing recommendations. Be specific about businesses and services. Include company names when you know them." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.4,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AEO Training] ${model} error ${response.status}:`, errorText);
      return {
        model,
        modelDisplayName: displayName,
        mentioned: false,
        snippet: null,
        position: 'not_found',
        confidence: 0,
        queryUsed: 'training',
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Analyze response for domain/keyword mentions
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
    
    // Extract snippet
    let snippet: string | null = null;
    if (position !== 'not_found') {
      const searchTerm = domainMentioned ? lowerDomain : lowerKeyword;
      const idx = lowerContent.indexOf(searchTerm);
      if (idx !== -1) {
        const start = Math.max(0, idx - 50);
        const end = Math.min(content.length, idx + searchTerm.length + 100);
        snippet = (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
      }
    }
    
    return {
      model,
      modelDisplayName: displayName,
      mentioned: position !== 'not_found',
      snippet,
      position,
      confidence,
      queryUsed: 'training',
    };
  } catch (error) {
    console.error(`[AEO Training] Error querying ${model}:`, error);
    return {
      model,
      modelDisplayName: displayName,
      mentioned: false,
      snippet: null,
      position: 'not_found',
      confidence: 0,
      queryUsed: 'training',
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for manual triggers or get all domains
    let targetDomains: string[] = [];
    let targetKeywords: string[] = [];
    
    try {
      const body = await req.json();
      if (body.domain) targetDomains = [body.domain];
      if (body.keywords) targetKeywords = body.keywords;
    } catch {
      // No body - scheduled run, process all recent domains
    }

    // If no specific domains, get domains with recent AEO checks
    if (targetDomains.length === 0) {
      const { data: recentDomains } = await supabase
        .from('aeo_check_results')
        .select('domain')
        .gte('checked_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('checked_at', { ascending: false });
      
      if (recentDomains) {
        targetDomains = [...new Set(recentDomains.map(d => d.domain))];
      }
    }

    console.log(`[AEO Training] Processing ${targetDomains.length} domains`);
    
    const results: Array<{
      domain: string;
      keyword: string;
      results: LLMResult[];
      improvements: { model: string; previousPosition: string; newPosition: string }[];
    }> = [];

    for (const domain of targetDomains.slice(0, 5)) { // Limit to 5 domains per run
      // Get keywords for this domain
      let keywords = targetKeywords;
      
      if (keywords.length === 0) {
        const { data: keywordData } = await supabase
          .from('aeo_check_results')
          .select('keyword')
          .eq('domain', domain)
          .order('checked_at', { ascending: false })
          .limit(10);
        
        if (keywordData) {
          keywords = [...new Set(keywordData.map(k => k.keyword))];
        }
      }

      console.log(`[AEO Training] Domain ${domain}: ${keywords.length} keywords`);

      for (const keyword of keywords.slice(0, 5)) { // Limit to 5 keywords per domain
        // Get previous results for comparison
        const { data: previousResults } = await supabase
          .from('aeo_check_results')
          .select('results, check_date')
          .eq('domain', domain)
          .eq('keyword', keyword)
          .order('checked_at', { ascending: false })
          .limit(1);

        const previousPositions: Record<string, string> = {};
        if (previousResults?.[0]?.results) {
          const prevResults = previousResults[0].results as LLMResult[];
          prevResults.forEach(r => {
            previousPositions[r.modelDisplayName] = r.position;
          });
        }

        // Pick a random training prompt
        const promptFn = TRAINING_PROMPTS[Math.floor(Math.random() * TRAINING_PROMPTS.length)];
        const prompt = promptFn(keyword, domain);

        // Query all models in parallel
        const llmResults = await Promise.all(
          MODELS_TO_CHECK.map(model => 
            queryLLM(model.id, model.displayName, prompt, keyword, domain, LOVABLE_API_KEY)
          )
        );

        // Track improvements
        const improvements: { model: string; previousPosition: string; newPosition: string }[] = [];
        llmResults.forEach(result => {
          const prevPos = previousPositions[result.modelDisplayName];
          if (prevPos && prevPos !== result.position) {
            // Check if this is an improvement
            const positionRank = { 'prominent': 3, 'mentioned': 2, 'not_found': 1 };
            if (positionRank[result.position] > positionRank[prevPos as keyof typeof positionRank]) {
              improvements.push({
                model: result.modelDisplayName,
                previousPosition: prevPos,
                newPosition: result.position,
              });
            }
          }
        });

        // Save results to database
        const prominentCount = llmResults.filter(r => r.position === 'prominent').length;
        const mentionedCount = llmResults.filter(r => r.position === 'mentioned').length;
        const today = new Date().toISOString().split('T')[0];

        await supabase
          .from('aeo_check_results')
          .insert({
            domain,
            keyword,
            results: JSON.parse(JSON.stringify(llmResults)),
            suggestions: improvements.length > 0 
              ? [`Improved visibility in ${improvements.map(i => i.model).join(', ')}`]
              : [],
            prominent_count: prominentCount,
            mentioned_count: mentionedCount,
            check_date: today,
            checked_at: new Date().toISOString(),
          });

        results.push({
          domain,
          keyword,
          results: llmResults,
          improvements,
        });

        // Rate limiting delay between keywords
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const totalImprovements = results.reduce((sum, r) => sum + r.improvements.length, 0);
    
    console.log(`[AEO Training] Complete: ${results.length} keyword checks, ${totalImprovements} improvements`);

    return new Response(
      JSON.stringify({
        success: true,
        domainsProcessed: targetDomains.length,
        keywordsChecked: results.length,
        totalImprovements,
        results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[AEO Training] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
