import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Domain context fields we want to extract
const DOMAIN_CONTEXT_SCHEMA = {
  type: "object",
  properties: {
    business_name: { type: "string", description: "The name of the business" },
    year_established: { type: "number", description: "Year the business was established" },
    short_description: { type: "string", description: "A brief 1-2 sentence description of the business" },
    business_model: { type: "string", description: "Type of business (e.g., B2B, B2C, Service-based, E-commerce)" },
    primary_keyword: { type: "string", description: "The main keyword/service this business should rank for" },
    services_offered: { type: "array", items: { type: "string" }, description: "List of services or products offered" },
    primary_city: { type: "string", description: "The main city where the business operates" },
    service_areas: { type: "array", items: { type: "string" }, description: "List of cities/areas served" },
    service_radius: { type: "string", description: "Service radius (e.g., '50 miles', 'Greater Vancouver')" },
    writing_tone: { type: "string", description: "The tone of voice used (e.g., Professional, Friendly, Technical)" },
    point_of_view: { type: "string", description: "First person (we/our) or third person (they/their)" },
    key_phrases: { type: "array", items: { type: "string" }, description: "Key phrases or slogans used by the business" },
    unique_selling_points: { type: "string", description: "What makes this business unique" },
    business_address: { type: "string", description: "Physical business address" },
    phone_number: { type: "string", description: "Contact phone number" },
    email: { type: "string", description: "Contact email address" },
    business_hours: { type: "array", items: { type: "string" }, description: "Business operating hours" },
    social_links: { type: "array", items: { type: "string" }, description: "Social media profile URLs" },
    common_faqs: { type: "array", items: { type: "string" }, description: "Common questions customers ask" },
    target_keywords: { type: "array", items: { type: "string" }, description: "SEO target keywords" },
  },
  required: ["business_name", "short_description", "services_offered"],
};

async function scrapeWebsite(url: string): Promise<{ html: string; text: string } | null> {
  // Try multiple user agents and approaches
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; WebstackCEO/1.0; +https://webstackceo.lovable.app)",
  ];

  for (const userAgent of userAgents) {
    try {
      console.log(`[AutoFill] Scraping website: ${url} with UA: ${userAgent.slice(0, 40)}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        signal: controller.signal,
        redirect: "follow",
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[AutoFill] Failed to fetch (${response.status}), trying next UA...`);
        continue;
      }

      const html = await response.text();
      
      // Check if we got valid HTML
      if (!html || html.length < 100 || !html.includes('<')) {
        console.warn(`[AutoFill] Invalid HTML response, trying next UA...`);
        continue;
      }
      
      // Extract clean text content
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 15000); // Limit text size for AI

      console.log(`[AutoFill] Successfully scraped ${text.length} chars of text`);
      return { html, text };
    } catch (error) {
      console.warn(`[AutoFill] Scrape attempt failed:`, error);
      continue;
    }
  }
  
  console.error(`[AutoFill] All scrape attempts failed for ${url}`);
  return null;
}

function extractBasicInfo(html: string, domain: string): Record<string, unknown> {
  const info: Record<string, unknown> = {};

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    info.business_name = titleMatch[1].split("|")[0].split("-")[0].trim();
  }

  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) {
    info.short_description = descMatch[1].trim();
  }

  // Extract email
  const emailMatch = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    info.email = emailMatch[1];
  }

  // Extract phone
  const phoneMatch = html.match(/tel:([\d\s\-+().]+)/i);
  if (phoneMatch) {
    info.phone_number = phoneMatch[1].trim();
  }

  // Extract address from schema
  const addressMatch = html.match(/(?:streetAddress|address)["\s:>]+([^"<]+)/i);
  if (addressMatch) {
    info.business_address = addressMatch[1].trim();
  }

  // Extract social links
  const socialPatterns = [
    /https?:\/\/(?:www\.)?facebook\.com\/[^"'\s>]+/gi,
    /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"'\s>]+/gi,
    /https?:\/\/(?:www\.)?linkedin\.com\/[^"'\s>]+/gi,
    /https?:\/\/(?:www\.)?instagram\.com\/[^"'\s>]+/gi,
    /https?:\/\/(?:www\.)?youtube\.com\/[^"'\s>]+/gi,
  ];
  
  const socialLinks: string[] = [];
  for (const pattern of socialPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      socialLinks.push(...matches.slice(0, 1));
    }
  }
  if (socialLinks.length > 0) {
    info.social_links = socialLinks;
  }

  // Try to extract services from common patterns
  const servicePatterns = [
    /<li[^>]*class="[^"]*service[^"]*"[^>]*>([^<]+)</gi,
    /(?:services|offerings|solutions)[^>]*>([^<]+)</gi,
  ];
  
  const services: string[] = [];
  for (const pattern of servicePatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null && services.length < 10) {
      const service = match[1].trim();
      if (service.length > 3 && service.length < 100) {
        services.push(service);
      }
    }
  }
  if (services.length > 0) {
    info.services_offered = services;
  }

  return info;
}

async function extractWithAI(text: string, domain: string, basicInfo: Record<string, unknown>): Promise<Record<string, unknown>> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.warn("[AutoFill] LOVABLE_API_KEY not set, using basic extraction only");
    return basicInfo;
  }

  const systemPrompt = `You are a business analyst extracting information from a website. 
Analyze the provided website content and extract business details.
Be accurate and only include information that is clearly stated or strongly implied in the content.
If information is not available, do not guess - leave it out.
Always return valid JSON.`;

  const userPrompt = `Analyze this website content for ${domain} and extract business information.

WEBSITE CONTENT:
${text}

ALREADY EXTRACTED (verify and enhance):
${JSON.stringify(basicInfo, null, 2)}

Extract all available business information including:
- Business name and description
- Services offered (as an array)
- Location and service areas
- Contact information
- Business model and unique selling points
- Writing tone and style
- Target keywords for SEO

Return ONLY valid JSON matching this schema:
${JSON.stringify(DOMAIN_CONTEXT_SCHEMA.properties, null, 2)}

Do not include fields where information is not available.`;

  try {
    console.log("[AutoFill] Calling AI for extraction...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_domain_context",
              description: "Extract and return structured business information from website content",
              parameters: DOMAIN_CONTEXT_SCHEMA,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_domain_context" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AutoFill] AI API error: ${response.status} - ${errorText}`);
      return basicInfo;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const extracted = JSON.parse(toolCall.function.arguments);
      console.log("[AutoFill] AI extraction successful:", Object.keys(extracted).length, "fields");
      
      // Merge with basic info, preferring AI-extracted values
      return { ...basicInfo, ...extracted };
    }

    // Try to parse from content if no tool call
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log("[AutoFill] Parsed from content:", Object.keys(parsed).length, "fields");
          return { ...basicInfo, ...parsed };
        }
      } catch {
        console.warn("[AutoFill] Could not parse AI response as JSON");
      }
    }

    return basicInfo;
  } catch (error) {
    console.error("[AutoFill] AI extraction error:", error);
    return basicInfo;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ success: false, error: "Domain is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[AutoFill] Starting extraction for: ${domain}`);

    // Normalize domain - remove protocol and trailing slashes
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/+$/, '')
      .trim();
    
    // Format URL properly
    const url = `https://${cleanDomain}`;
    console.log(`[AutoFill] Normalized URL: ${url}`);

    // Step 1: Scrape the website
    const scraped = await scrapeWebsite(url);
    
    if (!scraped) {
      // If scraping fails, try to get cached data from database or return empty with helpful message
      console.log("[AutoFill] Scrape failed, returning with guidance");
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            business_name: cleanDomain.split('.')[0],
            short_description: `Information about ${cleanDomain}`,
          },
          source: "fallback",
          message: "Could not reach website. Please fill in details manually.",
          fields_extracted: 2,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Extract basic info from HTML
    const basicInfo = extractBasicInfo(scraped.html, cleanDomain);
    console.log("[AutoFill] Basic extraction:", Object.keys(basicInfo).length, "fields");

    // Step 3: Enhance with AI
    const extracted = await extractWithAI(scraped.text, cleanDomain, basicInfo);
    console.log("[AutoFill] Final extraction:", Object.keys(extracted).length, "fields");

    // Step 4: Try to save to CADE API (optional - don't fail if this doesn't work)
    const cadeApiKey = Deno.env.get("CADE_API_KEY");
    if (cadeApiKey) {
      try {
        const cadeBase = "https://seo-acg-api.prod.seosara.ai/api/v1";
        const payload = JSON.stringify({ domain: cleanDomain, ...extracted });
        const cadeApiSecret = Deno.env.get("CADE_API_SECRET");
        const cadeHeaders: Record<string, string> = {
          "X-API-Key": cadeApiKey,
          "Content-Type": "application/json",
        };
        if (cadeApiSecret) {
          cadeHeaders["X-API-Secret"] = cadeApiSecret;
        }

        const cadeResponse = await fetch(`${cadeBase}/domain/context`, {
          method: "PUT",
          headers: cadeHeaders,
          body: payload,
        });
        
        if (cadeResponse.ok) {
          console.log("[AutoFill] Saved to CADE API successfully");
        } else {
          console.warn("[AutoFill] CADE save returned:", cadeResponse.status);
        }
      } catch (cadeError) {
        console.warn("[AutoFill] CADE API error (non-blocking):", cadeError);
      }
    }

    // Return extracted data
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extracted,
        source: "ai_extraction",
        fields_extracted: Object.keys(extracted).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[AutoFill] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
