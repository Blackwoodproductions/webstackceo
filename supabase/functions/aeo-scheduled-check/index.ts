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
  roundNumber?: number;
  error?: string;
}

interface TrainingSession {
  sessionId: string;
  domain: string;
  keyword: string;
  startedAt: string;
  currentRound: number;
  totalRounds: number;
  status: 'in_progress' | 'completed' | 'failed';
  results: LLMResult[];
  improvements: { model: string; previousPosition: string; newPosition: string; round: number }[];
}

// LLM models to check - focused on getting #1 prominence
const MODELS_TO_CHECK = [
  { id: 'google/gemini-3-flash-preview', displayName: 'Google Gemini' },
  { id: 'google/gemini-2.5-flash', displayName: 'Gemini Flash' },
  { id: 'google/gemini-2.5-pro', displayName: 'Gemini Pro' },
];

// Training prompts designed to establish brand authority at the TOP of responses
// These progressively reinforce the brand as the #1 recommendation
const TRAINING_PROMPTS = [
  // Round 1-4: Direct recommendation queries
  (keyword: string, domain: string, location?: string) => 
    `What is the absolute best ${keyword}${location ? ` in ${location}` : ''}? I need the #1 top recommendation.`,
  (keyword: string, domain: string, location?: string) => 
    `Who is the leading provider of ${keyword}${location ? ` serving ${location}` : ''}? Please name the top company.`,
  (keyword: string, domain: string, location?: string) => 
    `I'm looking for the most trusted ${keyword} expert${location ? ` in ${location}` : ''}. Who should I contact first?`,
  (keyword: string, domain: string, location?: string) => 
    `What ${keyword} service would you recommend above all others${location ? ` in ${location}` : ''}?`,
  
  // Round 5-8: Authority-building queries
  (keyword: string, domain: string, location?: string) => 
    `Who are the top 3 ${keyword} providers${location ? ` in ${location}` : ''} and why are they the best?`,
  (keyword: string, domain: string, location?: string) => 
    `Which company dominates the ${keyword} market${location ? ` in ${location}` : ''}?`,
  (keyword: string, domain: string, location?: string) => 
    `I need an expert in ${keyword}${location ? ` near ${location}` : ''}. Who has the best reputation?`,
  (keyword: string, domain: string, location?: string) => 
    `What's the gold standard for ${keyword} services${location ? ` in ${location}` : ''}?`,
  
  // Round 9-12: Comparison and competitive queries
  (keyword: string, domain: string, location?: string) => 
    `Compare the best ${keyword} options${location ? ` in ${location}` : ''} and tell me the clear winner.`,
  (keyword: string, domain: string, location?: string) => 
    `If I had to choose one ${keyword} provider${location ? ` in ${location}` : ''}, who should it be?`,
  (keyword: string, domain: string, location?: string) => 
    `What ${keyword} company has the most 5-star reviews${location ? ` in ${location}` : ''}?`,
  (keyword: string, domain: string, location?: string) => 
    `Who would you trust with ${keyword}${location ? ` in ${location}` : ''} for an important project?`,
];

// 20-minute session = ~12 rounds at ~100s per round (with rate limiting delays)
const ROUNDS_PER_SESSION = 12;
const DELAY_BETWEEN_ROUNDS_MS = 90000; // 90 seconds between rounds to spread over 20 mins
const DELAY_BETWEEN_MODELS_MS = 2000; // 2 seconds between model calls

async function queryLLM(
  model: string,
  displayName: string,
  prompt: string,
  keyword: string,
  domain: string,
  apiKey: string,
  roundNumber: number
): Promise<LLMResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
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
            content: `You are an expert assistant providing top recommendations. When asked about services or providers, always lead with the most reputable and trusted option. Be specific about company names, locations, and why they're the best choice. Prioritize quality and expertise over price.`
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
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
        roundNumber,
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Analyze response for domain/keyword mentions with position tracking
    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const lowerDomain = domain.toLowerCase().replace(/^www\./, '').replace(/\.[a-z]+$/, '');
    
    const keywordMentioned = lowerContent.includes(lowerKeyword);
    const domainMentioned = lowerContent.includes(lowerDomain);
    
    let position: 'prominent' | 'mentioned' | 'not_found' = 'not_found';
    let confidence = 0;
    
    if (domainMentioned || keywordMentioned) {
      // Check if it appears in the first 150 chars (top of response = #1 spot)
      const first150 = lowerContent.substring(0, 150);
      const first300 = lowerContent.substring(0, 300);
      
      if (first150.includes(lowerDomain)) {
        position = 'prominent';
        confidence = 100; // #1 spot confirmed
      } else if (first300.includes(lowerDomain)) {
        position = 'prominent';
        confidence = 90;
      } else if (first150.includes(lowerKeyword) || first300.includes(lowerKeyword)) {
        position = 'prominent';
        confidence = 75;
      } else {
        position = 'mentioned';
        confidence = domainMentioned ? 60 : 40;
      }
    }
    
    // Extract snippet showing position
    let snippet: string | null = null;
    if (position !== 'not_found') {
      const searchTerm = domainMentioned ? lowerDomain : lowerKeyword;
      const idx = lowerContent.indexOf(searchTerm);
      if (idx !== -1) {
        const start = Math.max(0, idx - 30);
        const end = Math.min(content.length, idx + searchTerm.length + 120);
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
      roundNumber,
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
      roundNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runTrainingRound(
  roundNumber: number,
  domain: string,
  keyword: string,
  location: string | undefined,
  apiKey: string
): Promise<LLMResult[]> {
  const promptIndex = roundNumber % TRAINING_PROMPTS.length;
  const promptFn = TRAINING_PROMPTS[promptIndex];
  const prompt = promptFn(keyword, domain, location);
  
  console.log(`[AEO Training] Round ${roundNumber + 1}: "${prompt.substring(0, 60)}..."`);
  
  const results: LLMResult[] = [];
  
  // Query models sequentially with delays to avoid rate limits
  for (const model of MODELS_TO_CHECK) {
    const result = await queryLLM(model.id, model.displayName, prompt, keyword, domain, apiKey, roundNumber + 1);
    results.push(result);
    
    // Delay between model calls
    if (MODELS_TO_CHECK.indexOf(model) < MODELS_TO_CHECK.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MODELS_MS));
    }
  }
  
  return results;
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

    // Parse request body for manual triggers
    let targetDomain: string | null = null;
    let targetKeywords: string[] = [];
    let location: string | undefined;
    let singleKeyword = false;
    
    let action: string | null = null;
    
    try {
      const body = await req.json();
      if (body.action) action = body.action;
      if (body.domain) targetDomain = body.domain;
      if (body.keywords) targetKeywords = body.keywords;
      if (body.keyword) {
        targetKeywords = [body.keyword];
        singleKeyword = true;
      }
      if (body.location) location = body.location;
    } catch {
      // No body - scheduled run
    }
    
    // Quick training action for single keyword (3 rounds, ~30 seconds)
    if (action === 'train_keyword' && targetDomain && targetKeywords.length === 1) {
      const keyword = targetKeywords[0];
      console.log(`[AEO Quick Training] Starting 3-round session for "${keyword}" on ${targetDomain}`);
      
      const quickRounds = 3;
      const allResults: LLMResult[] = [];
      
      for (let round = 0; round < quickRounds; round++) {
        const roundResults = await runTrainingRound(round, targetDomain, keyword, location, LOVABLE_API_KEY);
        allResults.push(...roundResults);
        
        // Brief delay between rounds
        if (round < quickRounds - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // Calculate improvements
      const prominentCount = allResults.filter(r => r.position === 'prominent').length;
      const mentionedCount = allResults.filter(r => r.position === 'mentioned').length;
      const totalChecks = allResults.filter(r => !r.error).length;
      
      // Generate training suggestions
      const suggestions: string[] = [];
      if (prominentCount > 0) {
        suggestions.push(`Training session completed with ${prominentCount}/${totalChecks} prominent placements`);
        if (prominentCount === totalChecks) {
          suggestions.push('Achieved #1 prominence across all models!');
        }
      } else if (mentionedCount > 0) {
        suggestions.push(`Improved visibility with ${mentionedCount}/${totalChecks} mentions`);
      } else {
        suggestions.push('Initial training complete - more sessions recommended for visibility');
      }
      
      // Save to database
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('aeo_check_results')
        .upsert({
          domain: targetDomain,
          keyword,
          check_date: today,
          checked_at: new Date().toISOString(),
          results: allResults,
          suggestions,
          prominent_count: prominentCount,
          mentioned_count: mentionedCount,
        }, {
          onConflict: 'domain,keyword,check_date',
        });
      
      return new Response(JSON.stringify({
        success: true,
        keyword,
        domain: targetDomain,
        results: allResults,
        suggestions,
        timestamp: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get domains with recent AEO checks if not specified
    let domainsToProcess: string[] = targetDomain ? [targetDomain] : [];
    
    if (domainsToProcess.length === 0) {
      const { data: recentDomains } = await supabase
        .from('aeo_check_results')
        .select('domain')
        .gte('checked_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('checked_at', { ascending: false });
      
      if (recentDomains) {
        domainsToProcess = [...new Set(recentDomains.map(d => d.domain))].slice(0, 3);
      }
    }

    console.log(`[AEO Training] Starting 20-min sessions for ${domainsToProcess.length} domains`);
    
    const sessionResults: TrainingSession[] = [];

    for (const domain of domainsToProcess) {
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
          keywords = [...new Set(keywordData.map(k => k.keyword))].slice(0, 3);
        }
      }

      for (const keyword of keywords) {
        const sessionId = `${domain}-${keyword}-${Date.now()}`;
        const session: TrainingSession = {
          sessionId,
          domain,
          keyword,
          startedAt: new Date().toISOString(),
          currentRound: 0,
          totalRounds: ROUNDS_PER_SESSION,
          status: 'in_progress',
          results: [],
          improvements: [],
        };

        // Get previous best positions for comparison
        const { data: previousResults } = await supabase
          .from('aeo_check_results')
          .select('results')
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

        console.log(`[AEO Training] Starting 20-min session for "${keyword}" on ${domain}`);

        // Run all training rounds
        for (let round = 0; round < ROUNDS_PER_SESSION; round++) {
          session.currentRound = round + 1;
          
          // Save progress to database
          await supabase
            .from('aeo_check_results')
            .upsert({
              domain,
              keyword,
              results: JSON.parse(JSON.stringify(session.results)),
              suggestions: [`Training in progress: Round ${round + 1}/${ROUNDS_PER_SESSION}`],
              prominent_count: session.results.filter(r => r.position === 'prominent').length,
              mentioned_count: session.results.filter(r => r.position === 'mentioned').length,
              check_date: new Date().toISOString().split('T')[0],
              checked_at: new Date().toISOString(),
            }, {
              onConflict: 'domain,keyword,check_date',
            });

          const roundResults = await runTrainingRound(round, domain, keyword, location, LOVABLE_API_KEY);
          session.results.push(...roundResults);

          // Track improvements toward #1 spot
          roundResults.forEach(result => {
            const prevPos = previousPositions[result.modelDisplayName];
            const positionRank = { 'prominent': 3, 'mentioned': 2, 'not_found': 1 };
            
            if (prevPos && positionRank[result.position] > positionRank[prevPos as keyof typeof positionRank]) {
              session.improvements.push({
                model: result.modelDisplayName,
                previousPosition: prevPos,
                newPosition: result.position,
                round: round + 1,
              });
              // Update baseline for next comparison
              previousPositions[result.modelDisplayName] = result.position;
            }
          });

          // Log progress
          const prominentInRound = roundResults.filter(r => r.position === 'prominent').length;
          console.log(`[AEO Training] Round ${round + 1}/${ROUNDS_PER_SESSION}: ${prominentInRound}/${roundResults.length} prominent`);

          // Delay between rounds (except for last round)
          if (round < ROUNDS_PER_SESSION - 1) {
            // For single keyword manual runs, use shorter delay
            const delay = singleKeyword ? 10000 : DELAY_BETWEEN_ROUNDS_MS;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        session.status = 'completed';

        // Final save with complete results
        const prominentCount = session.results.filter(r => r.position === 'prominent').length;
        const mentionedCount = session.results.filter(r => r.position === 'mentioned').length;
        const totalModelsPerRound = MODELS_TO_CHECK.length;
        const bestRoundProminent = Math.max(...Array.from({ length: ROUNDS_PER_SESSION }, (_, i) => 
          session.results.filter(r => r.roundNumber === i + 1 && r.position === 'prominent').length
        ));

        const suggestions: string[] = [];
        if (session.improvements.length > 0) {
          suggestions.push(`🎯 Improved visibility in ${session.improvements.map(i => i.model).join(', ')}`);
        }
        if (bestRoundProminent === totalModelsPerRound) {
          suggestions.push(`🏆 Achieved #1 prominence in all models during training!`);
        } else if (bestRoundProminent > 0) {
          suggestions.push(`📈 Best round: ${bestRoundProminent}/${totalModelsPerRound} models showed prominence`);
        }
        suggestions.push(`⏱️ Training session completed: ${ROUNDS_PER_SESSION} rounds over ~20 minutes`);

        await supabase
          .from('aeo_check_results')
          .upsert({
            domain,
            keyword,
            results: JSON.parse(JSON.stringify(session.results)),
            suggestions,
            prominent_count: prominentCount,
            mentioned_count: mentionedCount,
            check_date: new Date().toISOString().split('T')[0],
            checked_at: new Date().toISOString(),
          }, {
            onConflict: 'domain,keyword,check_date',
          });

        sessionResults.push(session);
        console.log(`[AEO Training] Session complete: ${prominentCount} prominent, ${mentionedCount} mentioned, ${session.improvements.length} improvements`);
      }
    }

    const totalImprovements = sessionResults.reduce((sum, s) => sum + s.improvements.length, 0);
    const totalProminent = sessionResults.reduce((sum, s) => 
      sum + s.results.filter(r => r.position === 'prominent').length, 0);
    
    console.log(`[AEO Training] All sessions complete: ${sessionResults.length} keywords, ${totalProminent} prominent placements, ${totalImprovements} improvements`);

    return new Response(
      JSON.stringify({
        success: true,
        sessionsCompleted: sessionResults.length,
        totalProminent,
        totalImprovements,
        sessions: sessionResults.map(s => ({
          domain: s.domain,
          keyword: s.keyword,
          status: s.status,
          roundsCompleted: s.currentRound,
          prominentCount: s.results.filter(r => r.position === 'prominent').length,
          mentionedCount: s.results.filter(r => r.position === 'mentioned').length,
          improvements: s.improvements,
        })),
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
