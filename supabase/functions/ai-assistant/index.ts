import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Knowledge base content covering all website services
const WEBSITE_KNOWLEDGE = `
# WebStack CEO - AI SEO & Marketing Platform

## Overview
WebStack CEO is an AI-powered SEO and marketing platform that helps businesses improve their online visibility, drive organic traffic, and convert visitors into leads.

## Core Services

### 1. On-Page SEO Optimization
- Meta title and description optimization
- Header tag structure (H1, H2, H3)
- Internal linking strategies
- Image alt text optimization
- Content quality analysis
- Keyword density optimization

### 2. Off-Page SEO
- Backlink building and monitoring
- Domain authority improvement
- Referring domains tracking
- Competitive backlink analysis
- Guest posting opportunities

### 3. Domain Authority Building (BRON)
- Link building campaigns
- Content clustering strategies
- Authority signal improvement
- Topical relevance building

### 4. Content Automation (CADE)
- AI-powered blog generation
- Topical authority content
- FAQ generation
- Social signals integration

### 5. Visitor Intelligence
- De-anonymize website visitors
- Company identification
- Page-level tracking
- Engagement scoring
- Real-time visitor alerts
- Buying signal detection

### 6. Google My Business Optimization
- Local SEO optimization
- Review management
- Business profile optimization
- Local ranking improvement

### 7. Advanced Analytics
- Traffic analysis
- Conversion tracking
- Funnel visualization
- ROI measurement

### 8. Web Hosting
- Managed hosting solutions
- Performance optimization
- SSL certificates
- CDN integration

### 9. Uptime Monitoring
- 24/7 website monitoring
- Instant downtime alerts
- Performance metrics
- Historical uptime data

### 10. PPC Landing Pages
- Conversion-optimized landing pages
- A/B testing
- Lead capture forms

## Pricing Plans

### Starter Plan - $99/month
- Basic SEO audit
- 5 keyword tracking
- Monthly reports
- Email support

### Professional Plan - $299/month
- Full SEO suite
- 50 keyword tracking
- Visitor intelligence
- Priority support
- Weekly reports

### Enterprise Plan - Custom Pricing
- Unlimited features
- Dedicated account manager
- Custom integrations
- White-label options
- 24/7 phone support

## FAQs

Q: How long does it take to see SEO results?
A: Typically 3-6 months for significant ranking improvements, though some quick wins can be achieved within weeks.

Q: Do you offer a free trial?
A: Yes, we offer a free website audit to assess your current SEO health.

Q: Can I cancel anytime?
A: Yes, all plans are month-to-month with no long-term contracts.

Q: What makes WebStack CEO different?
A: We combine AI-powered automation with human expertise, providing actionable insights and done-for-you optimization.

Q: Do you work with all industries?
A: Yes, we serve businesses across all industries including e-commerce, SaaS, local businesses, healthcare, finance, and more.

## Contact & Booking
- Website: https://webstackceo.lovable.app
- For consultations and demos, you can book a call with our team.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { message, sessionId, action, visitorInfo, health_check } = body;
    
    // Health check endpoint for system monitoring
    if (health_check === true) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      return new Response(
        JSON.stringify({ 
          status: "healthy",
          service: "ai-assistant",
          api_configured: !!LOVABLE_API_KEY,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Handle different actions
    if (action === "start_session") {
      // Create a new AI chat session
      const { data: session, error } = await supabase
        .from("ai_chat_sessions")
        .insert({
          session_id: sessionId,
          visitor_name: visitorInfo?.name,
          visitor_email: visitorInfo?.email,
          current_page: visitorInfo?.currentPage,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          success: true, 
          session,
          greeting: "Hi! 👋 I'm the WebStack CEO AI assistant. I can help you with questions about our SEO services, pricing, features, or I can connect you with a human team member. What would you like to know?"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "request_human") {
      // Create handoff request
      const { data: aiSession } = await supabase
        .from("ai_chat_sessions")
        .select("id")
        .eq("session_id", sessionId)
        .single();

      if (aiSession) {
        await supabase.from("ai_handoff_requests").insert({
          ai_session_id: aiSession.id,
          reason: message || "User requested human assistance",
        });

        await supabase
          .from("ai_chat_sessions")
          .update({ status: "transferred" })
          .eq("id", aiSession.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "I'm connecting you with a team member now. They'll join this chat shortly!",
          transferred: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "show_booking") {
      // Update session status and return Calendly embed info
      const { data: aiSession } = await supabase
        .from("ai_chat_sessions")
        .select("id")
        .eq("session_id", sessionId)
        .single();

      if (aiSession) {
        await supabase
          .from("ai_chat_sessions")
          .update({ 
            status: "booking",
            calendly_link: "https://calendly.com/your-link" // Will be replaced with actual link
          })
          .eq("id", aiSession.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          showCalendly: true,
          calendlyUrl: "https://calendly.com/your-link", // Replace with actual Calendly link
          message: "Great! Here's our booking calendar. Pick a time that works for you:",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch conversation history
    const { data: aiSession } = await supabase
      .from("ai_chat_sessions")
      .select("id")
      .eq("session_id", sessionId)
      .single();

    let conversationHistory: { role: string; content: string }[] = [];
    
    if (aiSession) {
      const { data: messages } = await supabase
        .from("ai_chat_messages")
        .select("role, content")
        .eq("session_id", aiSession.id)
        .order("created_at", { ascending: true })
        .limit(20);

      if (messages) {
        conversationHistory = messages;
      }

      // Save user message
      await supabase.from("ai_chat_messages").insert({
        session_id: aiSession.id,
        role: "user",
        content: message,
      });
    }

    // Build the AI prompt with tools for specific actions
    const systemPrompt = `You are a helpful AI assistant for WebStack CEO, an AI-powered SEO and marketing platform.

Your knowledge base:
${WEBSITE_KNOWLEDGE}

Guidelines:
1. Be friendly, professional, and concise
2. Answer questions about services, pricing, and features using the knowledge base
3. If the user wants to book a call/demo/consultation, respond with: [ACTION:BOOKING]
4. If the user explicitly asks for a human or seems frustrated, respond with: [ACTION:HUMAN]
5. Always offer to help with specific questions or connect them with our team
6. Keep responses under 150 words unless more detail is needed
7. Use emoji sparingly but appropriately 👍
8. If you don't know something, offer to connect them with a human

Current page: ${visitorInfo?.currentPage || 'Unknown'}
Visitor name: ${visitorInfo?.name || 'Guest'}`;

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
          ...conversationHistory,
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "We're experiencing high demand. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that. Would you like to speak with a team member?";

    // Check for action triggers in the response
    let showCalendly = false;
    let requestHuman = false;

    if (aiResponse.includes("[ACTION:BOOKING]")) {
      showCalendly = true;
      aiResponse = aiResponse.replace("[ACTION:BOOKING]", "").trim();
      if (!aiResponse) {
        aiResponse = "Great! Let me pull up our booking calendar for you:";
      }
    }

    if (aiResponse.includes("[ACTION:HUMAN]")) {
      requestHuman = true;
      aiResponse = aiResponse.replace("[ACTION:HUMAN]", "").trim();
      if (!aiResponse) {
        aiResponse = "I'll connect you with a team member right away!";
      }
    }

    // Save assistant response
    if (aiSession) {
      await supabase.from("ai_chat_messages").insert({
        session_id: aiSession.id,
        role: "assistant",
        content: aiResponse,
      });

      // Update last activity
      await supabase
        .from("ai_chat_sessions")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", aiSession.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: aiResponse,
        showCalendly,
        requestHuman,
        calendlyUrl: showCalendly ? "https://calendly.com/your-link" : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        fallbackMessage: "I'm having trouble right now. Would you like me to connect you with a team member instead?"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
