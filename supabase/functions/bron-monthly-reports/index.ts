import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BronSubscriber {
  user_id: string;
  domain: string;
  email: string;
}

const AI_GATEWAY_URL = 'https://ai.lovable.dev/v1/chat/completions';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('[BronMonthlyReports] Starting monthly report generation...');
    
    // Get all users with active BRON subscriptions
    // Check white_label_settings for active/trial/enterprise status
    const { data: activeSubscribers, error: subError } = await supabase
      .from('white_label_settings')
      .select('user_id, subscription_status')
      .in('subscription_status', ['active', 'trial', 'enterprise', 'white_label']);
    
    if (subError) {
      console.error('[BronMonthlyReports] Error fetching subscribers:', subError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch subscribers' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`[BronMonthlyReports] Found ${activeSubscribers?.length || 0} active subscribers`);

    // Also check user_roles for admins who get full access
    const { data: adminUsers } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['admin', 'super_admin']);

    const adminUserIds = new Set(adminUsers?.map(u => u.user_id) || []);
    const subscriberUserIds = new Set(activeSubscribers?.map(s => s.user_id) || []);
    
    // Combine both sets
    const allEligibleUserIds = [...new Set([...subscriberUserIds, ...adminUserIds])];

    if (allEligibleUserIds.length === 0) {
      console.log('[BronMonthlyReports] No eligible users found');
      return new Response(
        JSON.stringify({ success: true, message: 'No eligible users', reportsGenerated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all domains for eligible users
    const { data: userDomains, error: domainsError } = await supabase
      .from('user_domains')
      .select('user_id, domain')
      .in('user_id', allEligibleUserIds)
      .eq('is_active', true);

    if (domainsError) {
      console.error('[BronMonthlyReports] Error fetching domains:', domainsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch domains' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`[BronMonthlyReports] Found ${userDomains?.length || 0} domains to process`);

    // Check which domains already have a report this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const { data: existingReports } = await supabase
      .from('seo_vault')
      .select('domain, user_id')
      .eq('report_type', 'monthly_seo_report')
      .gte('created_at', monthStart);

    const existingReportKeys = new Set(
      existingReports?.map(r => `${r.user_id}:${r.domain}`) || []
    );

    // Filter domains that need new reports
    const domainsNeedingReports = (userDomains || []).filter(
      d => !existingReportKeys.has(`${d.user_id}:${d.domain}`)
    );

    console.log(`[BronMonthlyReports] ${domainsNeedingReports.length} domains need new reports`);

    let reportsGenerated = 0;
    const errors: string[] = [];

    // Generate reports for each domain (limit to 10 per run to avoid timeout)
    const domainsToProcess = domainsNeedingReports.slice(0, 10);

    for (const { user_id, domain } of domainsToProcess) {
      try {
        console.log(`[BronMonthlyReports] Generating report for ${domain} (user: ${user_id})`);
        
        // Generate the report using AI
        const reportContent = await generateMonthlyReport(domain, lovableApiKey);
        
        if (reportContent) {
          // Save to SEO Vault
          const { error: saveError } = await supabase
            .from('seo_vault')
            .insert({
              user_id,
              domain,
              title: `Monthly SEO Report - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
              report_type: 'monthly_seo_report',
              content: reportContent,
              summary: `Automated monthly SEO analysis and recommendations for ${domain}`,
              tags: ['monthly', 'automated', 'seo', 'marketing'],
            });

          if (saveError) {
            console.error(`[BronMonthlyReports] Error saving report for ${domain}:`, saveError);
            errors.push(`${domain}: ${saveError.message}`);
          } else {
            reportsGenerated++;
            console.log(`[BronMonthlyReports] Report saved for ${domain}`);
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[BronMonthlyReports] Error generating report for ${domain}:`, errorMsg);
        errors.push(`${domain}: ${errorMsg}`);
      }
    }

    const result = {
      success: true,
      timestamp: now.toISOString(),
      totalEligibleDomains: domainsNeedingReports.length,
      domainsProcessed: domainsToProcess.length,
      reportsGenerated,
      errors: errors.length > 0 ? errors : undefined,
      message: reportsGenerated > 0 
        ? `Generated ${reportsGenerated} monthly SEO reports`
        : 'No new reports generated',
    };

    console.log('[BronMonthlyReports] Completed:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[BronMonthlyReports] Error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function generateMonthlyReport(domain: string, apiKey: string | undefined): Promise<object | null> {
  if (!apiKey) {
    console.error('[BronMonthlyReports] No Lovable API key configured');
    return null;
  }

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const systemPrompt = `You are an expert SEO strategist generating a comprehensive monthly report for ${domain}.

Generate a detailed marketing and SEO report with the following sections:

1. **Executive Summary** - Brief overview of the domain's SEO health
2. **Traffic Analysis** - Insights on traffic trends and opportunities
3. **Ranking Opportunities** - Keywords to target and improve
4. **Backlink Strategy** - Link building recommendations
5. **Content Ideas** - 5 blog post or page ideas based on industry trends
6. **Technical SEO** - Any technical improvements needed
7. **Competitor Insights** - What competitors are doing well
8. **Action Items** - Prioritized list of tasks for this month

Be specific, actionable, and data-driven in your recommendations.
Format your response as a structured JSON object with these sections.`;

  const userPrompt = `Generate the monthly SEO report for ${domain} for ${currentMonth}. 
Include specific, actionable recommendations for improving traffic, rankings, and backlinks.
Provide 5 content ideas that would help this domain attract more organic traffic.`;

  try {
    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BronMonthlyReports] AI API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[BronMonthlyReports] No content in AI response');
      return null;
    }

    // Try to parse as JSON, otherwise wrap in object
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return JSON.parse(content);
    } catch {
      // If not valid JSON, structure the content
      return {
        rawContent: content,
        generatedAt: new Date().toISOString(),
        domain,
        month: currentMonth,
      };
    }
  } catch (error) {
    console.error('[BronMonthlyReports] Error calling AI:', error);
    return null;
  }
}
